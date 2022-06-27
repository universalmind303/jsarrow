import * as fb from "flatbuffers";

import { deserializeSchema } from "./schema";
import { Footer } from "../../../fb/org/apache/arrow/flatbuf/footer";
import { Schema } from "../../../datatypes/schema";
import { CONTINUATION_MARKER, IpcSchema } from "../index";
import { Block } from "../../../fb/File";
import { Message as MessageRef } from "../../../fb/org/apache/arrow/flatbuf/message";
import {
  MessageHeader,
  RecordBatch as RecordBatchRef,
} from "../../../fb/Message";
import { Dictionaries } from "../../../io/ipc/read/index";
import { ArrowError } from "../../../error";
import { Reader } from "../../../util/file-reader";
import { readRecordBatch } from "./common";

import pl from "nodejs-polars";

const ARROW_MAGIC = Uint8Array.from([65, 82, 82, 79, 87, 49]);

const df = pl.DataFrame({
  bools: [false, false, true, false, ],
  // strs: Array.from({ length: 10000 }).fill("foo"),
  // nums: Array.from({ length: 10000 }, (_, k) => k),
  // nums1: Array.from({ length: 10000 }, (_, k) => k),
  // nums2: Array.from({ length: 10000 }, (_, k) => k),
  // nums3: Array.from({ length: 10000 }, (_, k) => k),
  // nums4: Array.from({ length: 10000 }, (_, k) => k),
  // nums5: Array.from({ length: 10000 }, (_, k) => k),
  // nums6: Array.from({ length: 10000 }, (_, k) => k),
  // nums7: Array.from({ length: 10000 }, (_, k) => k),
  // nums8: Array.from({ length: 10000 }, (_, k) => k),
  // nums9: Array.from({ length: 10000 }, (_, k) => k),
  // nums10: Array.from({ length: 10000 }, (_, k) => k),
  // nums11: Array.from({ length: 10000 }, (_, k) => k),
  // nums12: Array.from({ length: 10000 }, (_, k) => k),
  // nums13: Array.from({ length: 10000 }, (_, k) => k),
  // nums14: Array.from({ length: 10000 }, (_, k) => k),
  // nums15: Array.from({ length: 10000 }, (_, k) => k),
  // nums16: Array.from({ length: 10000 }, (_, k) => k),
  // nums17: Array.from({ length: 10000 }, (_, k) => k),
  // nums18: Array.from({ length: 10000 }, (_, k) => k),
  // nums19: Array.from({ length: 10000 }, (_, k) => k),
  // nums20: Array.from({ length: 10000 }, (_, k) => k),
  // nums21: Array.from({ length: 10000 }, (_, k) => k),
  // nums22: Array.from({ length: 10000 }, (_, k) => k),
  // nums23: Array.from({ length: 10000 }, (_, k) => k),
  // nums24: Array.from({ length: 10000 }, (_, k) => k),
  // nums25: Array.from({ length: 10000 }, (_, k) => k),
  // nums26: Array.from({ length: 10000 }, (_, k) => k),
  // nums27: Array.from({ length: 10000 }, (_, k) => k),
  // nums28: Array.from({ length: 10000 }, (_, k) => k),
  // nums29: Array.from({ length: 10000 }, (_, k) => k),
  // nums30: Array.from({ length: 10000 }, (_, k) => k),
  // nums31: Array.from({ length: 10000 }, (_, k) => k),
  // nums32: Array.from({ length: 10000 }, (_, k) => k),
  // nums33: Array.from({ length: 10000 }, (_, k) => k),
  // nums34: Array.from({ length: 10000 }, (_, k) => k),
  // nums35: Array.from({ length: 10000 }, (_, k) => k),
  // nums36: Array.from({ length: 10000 }, (_, k) => k),
  // nums37: Array.from({ length: 10000 }, (_, k) => k),
  // nums38: Array.from({ length: 10000 }, (_, k) => k),
  // nums39: Array.from({ length: 10000 }, (_, k) => k),
  // nums40: Array.from({ length: 10000 }, (_, k) => k),
});

const reader = df.writeIPC();

function readFooterLength(reader: Buffer) {
  const footer = reader.subarray(-10);
  let footerLen = footer.readInt32LE();
  let magic_buf = footer.subarray(4);
  if (!magic_buf.equals(ARROW_MAGIC)) {
    throw new Error("Arrow file does not contain correct footer");
  }
  return footerLen;
}

function deserializeFooter(footerData: Buffer): FileMetadata {
  const buf = new fb.ByteBuffer(footerData);

  const footer = Footer.getRootAsFooter(buf);
  const batchLen = footer.recordBatchesLength();

  const blocks = Array.from(
    { length: batchLen },
    (v, k) => footer.recordBatches(k)!
  );

  let raw_schema = footer.schema()!;

  const [schema, ipc_schema] = deserializeSchema(raw_schema);
  const len = footer.dictionariesLength();
  let dictionaries: Block[] | undefined;

  if (len !== 0) {
    dictionaries = Array.from(
      { length: len },
      (_, k) => footer.dictionaries(k)!
    );
  }

  return {
    blocks,
    dictionaries,
    ipc_schema,
    schema,
  };
}

function readFileMetadata(reader: Buffer): FileMetadata {
  let magic_buf = reader.subarray(0, 6);
  if (!magic_buf.equals(ARROW_MAGIC)) {
    throw new Error("Arrow file does not contain correct header");
  }
  const len = readFooterLength(reader) + 10;

  const footerSlice = reader.subarray(-len, -10);
  return deserializeFooter(footerSlice);
}

export function getSerializedBatch(message: MessageRef): RecordBatchRef | null {
  let headerType = message.headerType();
  switch (true) {
    case headerType === MessageHeader.Schema:
      throw new Error("Not expecting a schema when messages are read");
    case headerType === MessageHeader.RecordBatch:
      return message.header(new RecordBatchRef());
    default:
      throw ArrowError.OutOfSpec(
        `Reading types other than record batches not yet supported, unable to read ${MessageHeader[headerType]}`
      );
  }
}

export function readBatch(
  reader: Reader,
  dictionaries: Dictionaries,
  metadata: FileMetadata,
  projection: number[] | null | undefined,
  index: number
) {
  let block = metadata.blocks[index];

  let block_offset = Number(block.offset());

  reader.seek(block_offset);
  let meta_buf = Buffer.alloc(4);
  reader.read_exact(meta_buf);

  if (meta_buf.equals(CONTINUATION_MARKER)) {
    reader.read_exact(meta_buf);
  }

  let meta_len = meta_buf.readInt32LE(0);
  let bb = fb.ByteBuffer.allocate(meta_len);

  let stratch = Buffer.from(bb.bytes().buffer);
  reader.read_exact(stratch);

  let message = MessageRef.getRootAsMessage(bb);
  let batch = getSerializedBatch(message);
  const record_batch = readRecordBatch(
    batch!,
    metadata.schema.fields,
    metadata.ipc_schema,
    null,
    dictionaries,
    message.version(),
    reader,
    BigInt(block_offset) + BigInt(block.metaDataLength())
  );
  return record_batch;
}

const metadata = readFileMetadata(reader);
const dicts = new Map();
const projection = [];
const index = 0;

console.time("read_batch");

const batch = readBatch(
  Reader.fromBuffer(reader),
  dicts,
  metadata,
  projection,
  index
);

console.timeEnd("read_batch");

console.log(batch);
console.time("pl read_batch");
const df0 = pl.readIPC(reader).schema;
console.timeEnd("pl read_batch");

const bool_bytes = (batch?.arrays()[0]! as any)._values.__bytes;
console.log(bool_bytes);
interface FileMetadata {
  schema: Schema;
  ipc_schema: IpcSchema;
  blocks: Array<Block>;
  dictionaries?: Array<Block>;
}
