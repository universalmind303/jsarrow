import { Field } from "jsarrow/datatypes/field";
import { BodyCompression, MetadataVersion } from "jsarrow/fb/Message";
import { IpcField } from "jsarrow/io/ipc/index";
import {
  read_boolean,
  read_null,
  read_primitive,
  read_utf8,
} from "../read/array";
import { Dictionaries, IpcBuffer, Node } from "jsarrow/io/ipc/read/index";
import { FunctionalEnum } from "../../../util/enum_impl";
import { Reader } from "../../../util/file-reader";
import { unwrap } from "../../../util/fp";
import { Vec } from "../../../array/index";
import { PrimitiveType } from "../../../types/index";
import { Offset } from "../../../types/offset";

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
  return FunctionalEnum.match(
    physical_type,
    {
      Null() {
        return read_null(mutable_field_nodes, data_type);
      },
      Boolean() {
        return read_boolean(
          mutable_field_nodes,
          data_type,
          mutable_buffers,
          reader,
          block_offset,
          is_little_endian,
          compression
        );
      },
      Primitive(primitive: PrimitiveType) {
        const r = unwrap(
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
        return r;
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
    },
    (dt) => console.log("no match for %O", dt)
  );
}
