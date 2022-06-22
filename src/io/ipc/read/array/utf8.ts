import { Offset } from "../../../../types/offset";
import { Utf8Vec } from "../../../../array/index";
import { DataType } from "../../../../datatypes/index";
import { ArrowError } from "../../../../error";
import { NativeArrayType } from "../../../../interfaces";
import { Compression, IpcBuffer, Node } from "../../../../io/ipc/read/index";
import { read_buffer, read_validity } from "../../../../io/ipc/read/read_basic";
import { Reader } from "../../../../util/file-reader";

function read_utf8_impl(
  field_node: Node,
  data_type: DataType,
  buffers: Array<IpcBuffer>,
  reader: Reader,
  block_offset: bigint,
  is_little_endian: boolean,
  compression: Compression | null
): Utf8Vec<Offset.I32> {
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

  let last_offset = offsets[offsets.length - 1];

  let values = read_buffer(Int8Array)(
    buffers,
    BigInt(last_offset),
    reader,
    block_offset,
    is_little_endian,
    compression
  );

  return Utf8Vec.try_new(
    data_type,
    offsets,
    Buffer.from(values.buffer),
    validity
  );
}
function read_large_utf8_impl(
  field_node: Node,
  data_type: DataType,
  buffers: Array<IpcBuffer>,
  reader: Reader,
  block_offset: bigint,
  is_little_endian: boolean,
  compression: Compression | null
): Utf8Vec<Offset.I64> {
  console.log("read_large_utf8_impl", {
    field_node,
    data_type,
    buffers,
    reader,
    block_offset,
    is_little_endian,
    compression,
  });
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

  let last_offset = offsets[offsets.length - 1];

  let values = read_buffer(Int8Array)(
    buffers,
    BigInt(last_offset),
    reader,
    block_offset,
    is_little_endian,
    compression
  );

  return Utf8Vec.try_new(
    data_type,
    offsets,
    Buffer.from(values.buffer),
    validity
  );
}
export function read_utf8(offset: Offset) {
  return function (
    field_nodes: Array<Node>,
    data_type: DataType,
    buffers: Array<IpcBuffer>,
    reader: Reader,
    block_offset: bigint,
    is_little_endian: boolean,
    compression: Compression | null
  ): Utf8Vec<typeof offset> | Error {
    let field_node = field_nodes.shift();
    if (!field_node) {
      return ArrowError.OutOfSpec(
        `IPC: unable to fetch the field for ${data_type}. The file or stream is corrupted.`
      );
    }
    return {
      [Offset.I32]() {
        return read_utf8_impl(
          field_node!,
          data_type,
          buffers,
          reader,
          block_offset,
          is_little_endian,
          compression
        );
      },
      [Offset.I64]() {
        return read_large_utf8_impl(
          field_node!,
          data_type,
          buffers,
          reader,
          block_offset,
          is_little_endian,
          compression
        );
      },
    }[offset]();
  };
}
