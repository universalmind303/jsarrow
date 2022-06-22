import * as fb from "flatbuffers";
import { fb_to_schema } from "./schema";
import { Footer } from "../../../fb/org/apache/arrow/flatbuf/footer";
import { Schema } from "../../../datatypes/schema";
import { CONTINUATION_MARKER, IpcSchema } from "../index";
import { Block } from "../../../fb/File";
import { Message as MessageRef } from "../../../fb/org/apache/arrow/flatbuf/message";
import {
  MessageHeader,
  RecordBatch as RecordBatchRef,
} from "../../../fb/Message";
import { Dictionaries } from "jsarrow/io/ipc/read/index";
import { ArrowError } from "../../../error";
import { Reader } from "../../../util/file-reader";
import { FunctionalEnum } from "../../../util/enum_impl";
import { IntegerType, PhysicalType } from "../../../datatypes/physical_type";
import { DataType } from "../../../datatypes/index";
import { read_record_batch } from "./common";

const ARROW_MAGIC = Buffer.from([65, 82, 82, 79, 87, 49]);
const buf = {
  type: "Buffer",
  data: [
    65, 82, 82, 79, 87, 49, 0, 0, 255, 255, 255, 255, 248, 0, 0, 0, 4, 0, 0, 0,
    242, 255, 255, 255, 20, 0, 0, 0, 4, 0, 1, 0, 0, 0, 10, 0, 11, 0, 8, 0, 10,
    0, 4, 0, 248, 255, 255, 255, 12, 0, 0, 0, 8, 0, 8, 0, 0, 0, 4, 0, 3, 0, 0,
    0, 136, 0, 0, 0, 68, 0, 0, 0, 4, 0, 0, 0, 236, 255, 255, 255, 44, 0, 0, 0,
    32, 0, 0, 0, 24, 0, 0, 0, 1, 20, 0, 0, 16, 0, 18, 0, 4, 0, 16, 0, 17, 0, 8,
    0, 0, 0, 12, 0, 0, 0, 0, 0, 252, 255, 255, 255, 4, 0, 4, 0, 7, 0, 0, 0, 115,
    116, 114, 105, 110, 103, 115, 0, 236, 255, 255, 255, 48, 0, 0, 0, 32, 0, 0,
    0, 24, 0, 0, 0, 1, 3, 0, 0, 16, 0, 18, 0, 4, 0, 16, 0, 17, 0, 8, 0, 0, 0,
    12, 0, 0, 0, 0, 0, 250, 255, 255, 255, 2, 0, 6, 0, 6, 0, 4, 0, 4, 0, 0, 0,
    110, 117, 109, 115, 0, 0, 0, 0, 236, 255, 255, 255, 44, 0, 0, 0, 32, 0, 0,
    0, 24, 0, 0, 0, 1, 6, 0, 0, 16, 0, 18, 0, 4, 0, 16, 0, 17, 0, 8, 0, 0, 0,
    12, 0, 0, 0, 0, 0, 252, 255, 255, 255, 4, 0, 4, 0, 5, 0, 0, 0, 98, 111, 111,
    108, 115, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 248, 0, 0, 0, 4, 0, 0, 0,
    236, 255, 255, 255, 56, 1, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 4, 0, 3, 0, 12, 0,
    19, 0, 16, 0, 18, 0, 12, 0, 4, 0, 230, 255, 255, 255, 2, 0, 0, 0, 0, 0, 0,
    0, 144, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 20, 0, 4, 0, 12, 0,
    16, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0,
    0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 0, 0,
    0, 0, 0, 56, 0, 0, 0, 0, 0, 0, 0, 252, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3,
    0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 253, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 240, 63, 0, 0, 0, 0, 0, 0, 0, 64, 0, 0, 0, 0, 0, 0, 0, 0, 249, 0, 0,
    0, 0, 0, 0, 0, 252, 0, 0, 0, 0, 0, 0, 0, 10, 32, 32, 111, 105, 50, 51, 104,
    105, 101, 107, 50, 101, 105, 107, 101, 97, 114, 115, 123, 91, 60, 105, 101,
    111, 108, 121, 114, 32, 115, 97, 32, 60, 123, 91, 123, 91, 40, 111, 121,
    111, 32, 32, 111, 32, 111, 32, 111, 111, 32, 32, 32, 114, 97, 105, 111, 116,
    105, 97, 114, 97, 110, 105, 110, 105, 110, 105, 110, 105, 110, 105, 110,
    105, 110, 105, 114, 97, 110, 105, 116, 111, 110, 105, 101, 111, 105, 50, 51,
    104, 105, 101, 107, 50, 101, 105, 107, 101, 97, 114, 115, 123, 91, 60, 105,
    101, 111, 108, 121, 114, 32, 115, 97, 32, 60, 123, 91, 123, 91, 40, 111,
    121, 111, 32, 32, 111, 32, 111, 32, 111, 111, 32, 32, 32, 114, 97, 105, 111,
    116, 105, 97, 114, 97, 110, 105, 110, 105, 110, 105, 110, 105, 110, 105,
    110, 105, 110, 105, 114, 97, 110, 105, 116, 111, 110, 105, 101, 111, 105,
    50, 51, 104, 105, 101, 107, 50, 101, 105, 107, 101, 97, 114, 115, 123, 91,
    60, 105, 101, 111, 108, 121, 114, 32, 115, 97, 32, 60, 123, 91, 123, 91, 40,
    111, 121, 111, 32, 32, 111, 32, 111, 32, 111, 111, 32, 32, 32, 10, 32, 32,
    32, 32, 34, 32, 97, 97, 97, 44, 32, 39, 34, 44, 92, 39, 39, 34, 47, 34, 46,
    34, 34, 47, 47, 92, 34, 39, 34, 10, 32, 32, 32, 32, 98, 97, 114, 0, 0, 0, 0,
    255, 255, 255, 255, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 236, 255, 255, 255,
    64, 0, 0, 0, 56, 0, 0, 0, 20, 0, 0, 0, 4, 0, 0, 0, 12, 0, 18, 0, 16, 0, 4,
    0, 8, 0, 12, 0, 1, 0, 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
    56, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 248, 255, 255, 255, 12, 0,
    0, 0, 8, 0, 8, 0, 0, 0, 4, 0, 3, 0, 0, 0, 136, 0, 0, 0, 68, 0, 0, 0, 4, 0,
    0, 0, 236, 255, 255, 255, 44, 0, 0, 0, 32, 0, 0, 0, 24, 0, 0, 0, 1, 20, 0,
    0, 16, 0, 18, 0, 4, 0, 16, 0, 17, 0, 8, 0, 0, 0, 12, 0, 0, 0, 0, 0, 252,
    255, 255, 255, 4, 0, 4, 0, 7, 0, 0, 0, 115, 116, 114, 105, 110, 103, 115, 0,
    236, 255, 255, 255, 48, 0, 0, 0, 32, 0, 0, 0, 24, 0, 0, 0, 1, 3, 0, 0, 16,
    0, 18, 0, 4, 0, 16, 0, 17, 0, 8, 0, 0, 0, 12, 0, 0, 0, 0, 0, 250, 255, 255,
    255, 2, 0, 6, 0, 6, 0, 4, 0, 4, 0, 0, 0, 110, 117, 109, 115, 0, 0, 0, 0,
    236, 255, 255, 255, 44, 0, 0, 0, 32, 0, 0, 0, 24, 0, 0, 0, 1, 6, 0, 0, 16,
    0, 18, 0, 4, 0, 16, 0, 17, 0, 8, 0, 0, 0, 12, 0, 0, 0, 0, 0, 252, 255, 255,
    255, 4, 0, 4, 0, 5, 0, 0, 0, 98, 111, 111, 108, 115, 0, 34, 1, 0, 0, 65, 82,
    82, 79, 87, 49,
  ],
};
const reader = Buffer.from(buf.data);

function readFooterLength(reader: Buffer) {
  const footer = reader.subarray(-10);
  let footerLen = footer.readInt32LE();
  let magic_buf = footer.subarray(4);
  if (!magic_buf.equals(ARROW_MAGIC)) {
    throw new Error("Arrow file does not contain correct footer");
  }
  return footerLen;
}

function deserialize_footer(footerData: Buffer): FileMetadata {
  const buf = new fb.ByteBuffer(footerData);

  const footer = Footer.getRootAsFooter(buf);
  const batchLen = footer.recordBatchesLength();
  const blocks = Array.from(
    { length: batchLen },
    (v, k) => footer.recordBatches(k)!
  );

  let raw_schema = footer.schema()!;
  let [schema, ipc_schema] = fb_to_schema(raw_schema);
  let len = footer.dictionariesLength();
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
  return deserialize_footer(footerSlice);
}

export function get_serialized_batch(
  message: MessageRef
): RecordBatchRef | null {
  let headerType = message.headerType();
  console.log({ headerType });
  const batch = {
    [MessageHeader.Schema]() {
      throw new Error("Not expecting a schema when messages are read");
    },
    [MessageHeader.RecordBatch]() {
      return message.header(new RecordBatchRef());
    },
  }[headerType]();
  if (!batch) {
    throw ArrowError.OutOfSpec(
      `Reading types other than record batches not yet supported, unable to read ${MessageHeader[headerType]}`
    );
  }
  return batch;
}

export function readBatch(
  reader: Reader,
  dictionaries: Dictionaries,
  metadata: FileMetadata,
  projection: number[] | null | undefined,
  index: number,
  stratch: Buffer
) {
  let block = metadata.blocks[index];

  let block_offset = Number(block.offset());

  reader.seek(block_offset);
  let meta_buf = Uint8Array.from({ length: 4 });
  reader.read_exact(meta_buf);

  if (Buffer.from(meta_buf.buffer).equals(CONTINUATION_MARKER)) {
    reader.read_exact(meta_buf);
  }

  let meta_len = Buffer.from(meta_buf.buffer).readInt32LE(0);
  stratch = Buffer.allocUnsafe(meta_len);
  reader.read_exact(stratch);
  let bb = new fb.ByteBuffer(stratch);
  bb.readInt64;

  let message = MessageRef.getRootAsMessage(bb);
  let batch = get_serialized_batch(message);
  return read_record_batch(
    batch!,
    metadata.schema.fields,
    metadata.ipc_schema,
    null,
    dictionaries,
    message.version(),
    reader,
    BigInt(block_offset) + BigInt(block.metaDataLength())
  );

  console.log({ batch });
}

const metadata = readFileMetadata(reader);
const dicts = new Map();
const projection = [];
const index = 0;
readBatch(
  Reader.fromBuffer(reader),
  dicts,
  metadata,
  projection,
  index,
  Buffer.allocUnsafe(1024)
);

interface FileMetadata {
  schema: Schema;
  ipc_schema: IpcSchema;
  blocks: Array<Block>;
  dictionaries?: Array<Block>;
}
