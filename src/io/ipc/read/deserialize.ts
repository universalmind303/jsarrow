import { Field } from "../../../datatypes/field";
import { BodyCompression, MetadataVersion } from "../../../fb/Message";
import { IpcField } from "../../../io/ipc/index";
import {
  deserializeBoolean,
  deserializeList,
  deserializeNull,
  deserializePrimitive,
  deserializeUtf8,
} from "../read/array";
import { Dictionaries, IpcBuffer, Node } from "../../../io/ipc/read/index";
import { Reader } from "../../../util/file-reader";
import { unwrap } from "../../../util/fp";
import { Vec } from "../../../array/index";
import { Offset } from "../../../types/offset";
import { DataType } from "../../../datatypes/index";
import { readBitmap, readBuffer, readValidity } from "./read_basic";

export class Deserializer {
  mutable_field_nodes: Array<Node>;
  field: Field;
  ipc_field: IpcField;
  mutable_buffers: Array<IpcBuffer>;
  reader: Reader;
  dictionaries: Dictionaries;
  block_offset: bigint;
  is_little_endian: boolean;
  compression: BodyCompression | null;
  version: MetadataVersion;
  data_type: DataType;

  private constructor(
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
  ) {
    this.mutable_field_nodes = mutable_field_nodes;
    this.field = field;
    this.ipc_field = ipc_field;
    this.mutable_buffers = mutable_buffers;
    this.reader = reader;
    this.dictionaries = dictionaries;
    this.block_offset = block_offset;
    this.is_little_endian = is_little_endian;
    this.compression = compression;
    this.version = version;
    this.data_type = this.field.datatype;
  }

  public static deserialize(
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
    const self = new Deserializer(
      mutable_field_nodes,
      field,
      ipc_field,
      mutable_buffers,
      reader,
      dictionaries,
      block_offset,
      is_little_endian,
      compression,
      version
    );
    let physical_type = self.data_type.toPhysicalType() as any;

    switch (physical_type.variant) {
      case "Null":
        return unwrap(self.deserializeNull());
      case "Boolean":
        return unwrap(self.deserializeBoolean());
      case "Primitive":
        return unwrap(
          self.deserializePrimitive(
            physical_type.inner.toTypedArrayConstructor()
          )
        );
      case "Utf8":
        return unwrap(self.deserializeUtf8(Offset.I32));
      case "LargeUtf8":
        return unwrap(self.deserializeUtf8(Offset.I64));

      case "List":
        return unwrap(self.deserializeList(Offset.I32));
      case "LargeList":
        return unwrap(self.deserializeList(Offset.I64));
      default:
        return null as any;
    }
  }

  deserializeNull = deserializeNull;
  deserializeBoolean = deserializeBoolean;
  deserializePrimitive = deserializePrimitive;
  deserializeUtf8 = deserializeUtf8;
  deserializeList = deserializeList;
  readValidity = readValidity;
  readBitmap = readBitmap;
  readBuffer = readBuffer;
}
