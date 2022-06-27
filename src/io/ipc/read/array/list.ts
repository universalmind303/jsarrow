import { Offset } from "../../../../types/offset";
import { ArrowError } from "../../../../error";
import { ListVec } from "../../../../array/list/index";
import { Deserializer } from "../../../../io/ipc/read/deserialize";

export function deserializeList(this: Deserializer, offset: Offset) {
  const field_node = this.mutable_field_nodes.shift();
  if (!field_node) {
    return ArrowError.OutOfSpec(
      `IPC: unable to fetch the field for ${this.data_type}. The file or stream is corrupted.`
    );
  }
  const bufferType =
    offset === Offset.I64 ? BigInt64Array : (Int32Array as any);

  const validity = this.readValidity(field_node);
  const offsets = this.readBuffer(bufferType, 1n + field_node.length()) as any;

  const field = ListVec.get_child_field(Offset.I64, this.data_type);

  const values = Deserializer.deserialize(
    this.mutable_field_nodes,
    field,
    this.ipc_field.fields[0],
    this.mutable_buffers,
    this.reader,
    this.dictionaries,
    this.block_offset,
    this.is_little_endian,
    this.compression,
    this.version
  );
  return ListVec.try_new(offset)(this.data_type, offsets, values, validity);
}
