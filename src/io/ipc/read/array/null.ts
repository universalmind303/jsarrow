import { ArrowError } from "jsarrow/src/error";
import { NullVec } from "../../../../array/null";
import { DataType } from "../../../../datatypes/index";
import { Node } from "../../../../io/ipc/read/index";

export function read_null(
  field_nodes: Array<Node>,
  data_type: DataType
): NullVec | Error {
  let field_node = field_nodes.shift();
  if (!field_node) {
    return ArrowError.OutOfSpec(
      `IPC: unable to fetch the field for ${data_type}. The file or stream is corrupted.`
    );
  }
  return NullVec.try_new(data_type, Number(field_node.length()));
}
