import { Offset } from "../../../../types/offset";
import { Utf8Vec } from "../../../../array/index";
import { DataType } from "../../../../datatypes/index";
import { ArrowError } from "../../../../error";
import {
  Compression,
  Dictionaries,
  IpcBuffer,
  Node,
  Version,
} from "../../../../io/ipc/read/index";
import { read_buffer, read_validity } from "../../../../io/ipc/read/read_basic";
import { Reader } from "../../../../util/file-reader";
import { ListVec } from "jsarrow/src/array/list/index";
import { read } from "jsarrow/src/io/ipc/read/deserialize";
import { IpcField } from "jsarrow/src/io/ipc/index";
function read_list_impl(
  field_node: Node,
  field_nodes: Array<Node>,
  data_type: DataType,
  ipc_field: IpcField,
  buffers: Array<IpcBuffer>,
  reader: Reader,
  dictionaries: Dictionaries,
  block_offset: bigint,
  is_little_endian: boolean,
  compression: Compression | null,
  version: Version
): ListVec<Offset.I32> | Error {
  let validity = read_validity(
    buffers,
    field_node,
    reader,
    block_offset,
    is_little_endian,
    compression
  );

  let offsets = read_buffer(Int32Array)(
    buffers,
    1n + field_node.length(),
    reader,
    block_offset,
    is_little_endian,
    compression
  );

  let field = ListVec.get_child_field(Offset.I32, data_type);

  let values = read(
    field_nodes,
    field,
    ipc_field.fields[0],
    buffers,
    reader,
    dictionaries,
    block_offset,
    is_little_endian,
    compression,
    version
  );

  return ListVec.try_new(Offset.I32)(data_type, offsets, values, validity);
}

function read_large_list_impl(
  field_node: Node,
  field_nodes: Array<Node>,
  data_type: DataType,
  ipc_field: IpcField,
  buffers: Array<IpcBuffer>,
  reader: Reader,
  dictionaries: Dictionaries,
  block_offset: bigint,
  is_little_endian: boolean,
  compression: Compression | null,
  version: Version
): ListVec<Offset.I64> | Error {
  let validity = read_validity(
    buffers,
    field_node,
    reader,
    block_offset,
    is_little_endian,
    compression
  );
  let offsets = read_buffer(BigInt64Array)(
    buffers,
    1n + field_node.length(),
    reader,
    block_offset,
    is_little_endian,
    compression
  );
  let field = ListVec.get_child_field(Offset.I64, data_type);

  let values = read(
    field_nodes,
    field,
    ipc_field.fields[0],
    buffers,
    reader,
    dictionaries,
    block_offset,
    is_little_endian,
    compression,
    version
  );

  return ListVec.try_new(Offset.I64)(data_type, offsets, values, validity);
}

export function read_list(offset: Offset) {
  return function (
    field_nodes: Array<Node>,
    data_type: DataType,
    ipc_field: IpcField,
    buffers: Array<IpcBuffer>,
    reader: Reader,
    dictionaries: Dictionaries,
    block_offset: bigint,
    is_little_endian: boolean,
    compression: Compression | null,
    version: Version
  ): ListVec<typeof offset> | Error {
    let field_node = field_nodes.shift();
    if (!field_node) {
      return ArrowError.OutOfSpec(
        `IPC: unable to fetch the field for ${data_type}. The file or stream is corrupted.`
      );
    }

    return {
      [Offset.I32]: read_list_impl,
      [Offset.I64]: read_large_list_impl,
    }[offset](
      field_node!,
      field_nodes,
      data_type,
      ipc_field,
      buffers,
      reader,
      dictionaries,
      block_offset,
      is_little_endian,
      compression,
      version
    );
  };
}
