import assert from "assert";
import { Field } from "../../../datatypes/field";
import { ArrowError } from "../../../error";
import {
  MetadataVersion,
  RecordBatch as RecordBatchRef,
} from "jsarrow/fb/Message";
import { IpcSchema } from "../index";
import { read } from "./deserialize";
import { Dictionaries } from "./index";
import { Reader } from "../../../util/file-reader";
import { DataType } from "../../../datatypes/index";
import { BooleanVec, Utf8Vec } from "../../../array/index";
import { Offset } from "../../../types/offset";

export function read_record_batch(
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
  let columns;
  if (projection !== null) {
  } else {
    columns = fields.map((fld, idx) => {
      let ipc_fld = ipc_schema.fields[idx];
      const data = read(
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
      if (data.dataType().equals(DataType.LargeUtf8)) {
        console.log('first value = ', data.cast<Utf8Vec<Offset.I64>>().value(0));
      }
      console.log({ data });

      return data;
    });
  }
}