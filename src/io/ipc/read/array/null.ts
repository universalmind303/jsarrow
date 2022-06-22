import { NullVec } from "../../../../array/null";
import { DataType } from "../../../../datatypes/index";
import { Node } from "../../../../io/ipc/read/index";

export function read_null(
  field_nodes: Array<Node>,
  data_type: DataType
): NullVec {
  return null as any;
}
