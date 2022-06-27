import assert from "assert";
import { Field } from "../../../datatypes/field";
import { ArrowError } from "../../../error";
import {
  MetadataVersion,
  RecordBatch as RecordBatchRef,
} from "../../../fb/Message";
import { IpcSchema } from "../index";
import { Deserializer } from "./deserialize";
import { Dictionaries } from "./index";
import { Reader } from "../../../util/file-reader";
import { Chunk } from "../../../chunk";
import { Vec } from "../../../array/index";

export function readRecordBatch(
  batch: RecordBatchRef,
  fields: Field[],
  ipc_schema: IpcSchema,
  projection: number | null,
  dictionaries: Dictionaries,
  version: MetadataVersion,
  reader: Reader,
  block_offset: bigint
) {
  assert(
    fields.length === ipc_schema.fields.length,
    "fields length must match schema length"
  );

  let buffers = Array.from({ length: batch.buffersLength() }, (_, idx) => {
    const buf = batch.buffers(idx);
    if (buf === null) {
      throw ArrowError.OutOfSpec("Ipc RecordBatch must contain buffers");
    }
    return buf!;
  });

  let field_nodes = Array.from({ length: batch.nodesLength() }, (_, idx) => {
    const node = batch.nodes(idx);
    if (node === null) {
      throw ArrowError.OutOfSpec("Ipc RecordBatch must contain field nodes");
    }
    return node!;
  });
  if (projection !== null) {
  } else {
    let fieldsLength = fields.length;
    const columns: Vec[] = Array.from({ length: fieldsLength });

    for (let i = 0; i < fieldsLength; i++) {
      const fld = fields[i];
      let ipc_fld = ipc_schema.fields[i];
      columns[i] = Deserializer.deserialize(
        field_nodes,
        fld,
        ipc_fld,
        buffers,
        reader,
        dictionaries,
        block_offset,
        ipc_schema.isLittleEndian,
        batch.compression(),
        version
      );
    }
    const chunk = Chunk.create(columns);
    return chunk;
  }
}
