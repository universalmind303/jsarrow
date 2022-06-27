import { DataType } from "../../../../datatypes/index";
import { Compression, IpcBuffer, Node } from "../../../../io/ipc/read/index";

export function read_binary(
  field_nodes: Array<Node>,
  data_type: DataType,
  buffers: Array<IpcBuffer>,
  reader: Buffer,
  block_offset: number,
  is_little_endian: boolean,
  compression?: Compression
) {
  let field_node = field_nodes.shift();
  if (field_node === null) {
    throw new Error(
      `IPC: unable to fetch the field for ${data_type}. The file or stream is corrupted.`
    );
  }
  return null as any;
  // let validity = read_validity(
  //   buffers,
  //   field_node,
  //   reader,
  //   block_offset,
  //   is_little_endian,
  //   compression
  // );
}
