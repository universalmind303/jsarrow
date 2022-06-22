import { Field } from "jsarrow/datatypes/field";
import { BodyCompression, MetadataVersion } from "jsarrow/fb/Message";
import { IpcField } from "jsarrow/src/io/ipc/index";
import {
  read_boolean,
  read_list,
  read_null,
  read_primitive,
  read_utf8,
} from "../read/array";
import { Dictionaries, IpcBuffer, Node } from "jsarrow/src/io/ipc/read/index";
import { FunctionalEnum } from "../../../util/enum_impl";
import { Reader } from "../../../util/file-reader";
import { unwrap } from "../../../util/fp";
import { Vec } from "../../../array/index";
import { PrimitiveType } from "../../../types/index";
import { Offset } from "../../../types/offset";
import { PhysicalType } from "jsarrow/datatypes/physical_type";

export function read(
  mutable_field_nodes: Array<Node>,
  field: Field,
  ipc_field: IpcField,
  mutable_buffers: Array<IpcBuffer>,
  reader: Reader,
  dictionaries: Dictionaries,
  block_offset: bigint,
  is_little_endian: boolean,
  compression: BodyCompression | null,
  version: MetadataVersion
): Vec {
  let data_type = field.datatype;
  let physical_type = data_type.toPhysicalType();
  return FunctionalEnum.match<PhysicalType, Vec>(
    physical_type,
    {
      Null() {
        return unwrap(read_null(mutable_field_nodes, data_type));
      },
      Boolean() {
        return unwrap(
          read_boolean(
            mutable_field_nodes,
            data_type,
            mutable_buffers,
            reader,
            block_offset,
            is_little_endian,
            compression
          )
        );
      },
      Primitive(primitive: PrimitiveType) {
        return unwrap(
          read_primitive(primitive.toTypedArrayConstructor())(
            mutable_field_nodes,
            data_type,
            mutable_buffers,
            reader,
            block_offset,
            is_little_endian,
            compression
          )
        );
      },
      Utf8(_) {
        return unwrap(
          read_utf8(Offset.I32)(
            mutable_field_nodes,
            data_type,
            mutable_buffers,
            reader,
            block_offset,
            is_little_endian,
            compression
          )
        );
      },
      LargeUtf8(_) {
        return unwrap(
          read_utf8(Offset.I64)(
            mutable_field_nodes,
            data_type,
            mutable_buffers,
            reader,
            block_offset,
            is_little_endian,
            compression
          )
        );
      },
      List(_) {
        return unwrap(
          read_list(Offset.I32)(
            mutable_field_nodes,
            data_type,
            ipc_field,
            mutable_buffers,
            reader,
            dictionaries,
            block_offset,
            is_little_endian,
            compression,
            version
          )
        );
      },
      LargeList(_) {
        return unwrap(
          read_list(Offset.I64)(
            mutable_field_nodes,
            data_type,
            ipc_field,
            mutable_buffers,
            reader,
            dictionaries,
            block_offset,
            is_little_endian,
            compression,
            version
          )
        );
      },
    },
    (dt) => console.log("no match for %O", dt, physical_type)
  );
}
