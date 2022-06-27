import { Deserializer } from "../deserialize";
import { PrimitiveVec } from "../../../../array/primitive/index";
import { ArrowError } from "../../../../error";
import { TypedArray, TypedArrayConstructor } from "../../../../interfaces";

export function deserializePrimitive<T extends TypedArray>(
  this: Deserializer,
  typedArray: TypedArrayConstructor<T>
) {
  let field_node = this.mutable_field_nodes.shift();
  if (!field_node) {
    return ArrowError.OutOfSpec(
      `IPC: unable to fetch the field for ${this.data_type}. The file or stream is corrupted.`
    );
  }
  let validity = this.readValidity(field_node);
  let values = this.readBuffer(typedArray, field_node.length());
  return PrimitiveVec.try_new(this.data_type, values, validity);
}
