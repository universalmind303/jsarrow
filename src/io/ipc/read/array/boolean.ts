import { Deserializer } from "jsarrow/io/ipc/read/deserialize";
import { BooleanVec } from "../../../../array/index";
import { ArrowError } from "../../../../error";

export function deserializeBoolean(this: Deserializer): BooleanVec | Error {
  let field_node = this.mutable_field_nodes.shift();
  if (!field_node) {
    return ArrowError.OutOfSpec(
      `IPC: unable to fetch the field for ${this.data_type}. The file or stream is corrupted.`
    );
  }

  let length = field_node.length();
  let validity = this.readValidity(field_node);
  let values = this.readBitmap(length);

  return BooleanVec.from_data(this.data_type, values, validity);
}
