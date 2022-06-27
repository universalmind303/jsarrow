import { Offset } from "../../../../types/offset";
import { Utf8Vec } from "../../../../array/index";
import { ArrowError } from "../../../../error";
import { Deserializer } from "../deserialize";

export function deserializeUtf8(this: Deserializer, offset: Offset) {
  let field_node = this.mutable_field_nodes.shift();
  if (!field_node) {
    return ArrowError.OutOfSpec(
      `IPC: unable to fetch the field for ${this.data_type}. The file or stream is corrupted.`
    );
  }
  let validity = this.readValidity(field_node);
  const ta = offset === Offset.I64 ? BigInt64Array : Int32Array;

  let offsets = this.readBuffer(ta as any, 1n + field_node.length());
  let last_offset = offsets[offsets.length - 1];
  let values = this.readBuffer(Uint8Array, BigInt(last_offset));

  return Utf8Vec.try_new(
    this.data_type,
    offsets as any,
    Buffer.from(values.buffer),
    validity
  );
}
