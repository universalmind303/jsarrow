import { BooleanVec } from "../../../../array/index";
import { PrimitiveVec } from "../../../../array/primitive/index";
import { DataType } from "../../../../datatypes/index";
import { ArrowError } from "../../../../error";
import { TypedArray, TypedArrayConstructor } from "../../../../interfaces";
import { Compression, IpcBuffer, Node } from "../../../../io/ipc/read/index";
import { read_buffer, read_validity } from "../../../../io/ipc/read/read_basic";
import { Reader } from "../../../../util/file-reader";

export function read_primitive<T extends TypedArray>(
  typedArray: TypedArrayConstructor<T>
) {
  return function (
    field_nodes: Array<Node>,
    data_type: DataType,
    buffers: Array<IpcBuffer>,
    reader: Reader,
    block_offset: bigint,
    is_little_endian: boolean,
    compression: Compression | null
  ): PrimitiveVec<T> | Error {
    let field_node = field_nodes.shift();
    if (!field_node) {
      return ArrowError.OutOfSpec(
        `IPC: unable to fetch the field for ${data_type}. The file or stream is corrupted.`
      );
    }
    let validity = read_validity(
      buffers,
      field_node,
      reader,
      block_offset,
      is_little_endian,
      compression
    );
    let values = read_buffer(typedArray)(
      buffers,
      field_node.length(),
      reader,
      block_offset,
      is_little_endian,
      compression
    );
    return PrimitiveVec.try_new(data_type, values, validity);
  };
}
