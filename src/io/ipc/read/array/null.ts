import { ArrowError } from "../../../../error";
import { NullVec } from "../../../../array/null";
import { Deserializer } from "jsarrow/io/ipc/read/deserialize";

export function deserializeNull(this: Deserializer): NullVec | Error {
  let field_node = this.mutable_field_nodes.shift();
  if (!field_node) {
    return ArrowError.OutOfSpec(
      `IPC: unable to fetch the field for ${this.data_type}. The file or stream is corrupted.`
    );
  }
  return NullVec.try_new(this.data_type, Number(field_node.length()));
}
