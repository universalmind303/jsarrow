import { BooleanVec } from "../../../../array/index";
import { DataType } from "../../../../datatypes/index";
import { ArrowError } from "../../../../error";
import { Compression, IpcBuffer, Node } from "../../../../io/ipc/read/index";
import { read_bitmap, read_validity } from "../../../../io/ipc/read/read_basic";
import { Reader } from "../../../../util/file-reader";

export function read_boolean(
  field_nodes: Array<Node>,
  data_type: DataType,
  buffers: Array<IpcBuffer>,
  reader: Reader,
  block_offset: bigint,
  is_little_endian: boolean,
  compression: Compression | null
): BooleanVec {
  let field_node = field_nodes.shift();
  if (!field_node) {
    throw ArrowError.OutOfSpec(
      `IPC: unable to fetch the field for ${data_type}. The file or stream is corrupted.`
    );
  }

  let length = field_node.length();
  let validity = read_validity(
    buffers,
    field_node,
    reader,
    block_offset,
    is_little_endian,
    compression
  );
  let values = read_bitmap(
    buffers,
    length,
    reader,
    block_offset,
    is_little_endian,
    compression
  );

  return BooleanVec.from_data(data_type, values, validity);
}
