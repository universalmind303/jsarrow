import {
  Date,
  DateUnit,
  DictionaryEncoding,
  Endianness,
  Field as FieldRef,
  FloatingPoint,
  Int,
  Precision,
  Type,
} from "../../../fb/Schema";
import { Schema as SchemaRef } from "../../../fb/File";
import { IntegerType } from "../../../datatypes/physical_type";
import { DataType, get_extension } from "../../../datatypes/index";
import { IpcField, IpcSchema } from "../../../io/ipc/index";
import { Field } from "../../../datatypes/field";
import type { Option } from "../../../util/fp";
import { Schema } from "../../../datatypes/schema";
export type Extension = Option<[string, Option<string>]>;
export type Metadata = Record<string, string>;

function read_metadata(field: FieldRef): Metadata {
  const fldLen = field.customMetadataLength();
  let metadata: Metadata = {};
  if (fldLen > 0) {
    for (let idx = 0; idx < fldLen; idx++) {
      let meta = field.customMetadata(idx)!;
      metadata[meta.key()!] = meta.value()!;
    }
  }

  return metadata;
}
function get_data_type(
  field: FieldRef,
  extension: Extension,
  may_be_dictionary: boolean
): [DataType, IpcField] | null {
  let dict: DictionaryEncoding;
  if ((dict = field.dictionary()!)) {
    if (may_be_dictionary) {
      let int = dict.indexType()!;
      let index_type = deserialize_integer(int)!;

      let [inner, ipc_field] = get_data_type(field, extension, false)!;
      ipc_field.dictionaryId = dict.id();
      return [
        DataType.Dictionary(index_type, inner, dict.isOrdered()),
        ipc_field,
      ];
    }
  }

  if (extension) {
    let [name, metadata] = extension;
    let [datatype, fields] = get_data_type(field, null, false)!;
    return [DataType.Extension(name, datatype, metadata!), fields];
  }
  let type = field.typeType();

  return {
    [Type.Null]: () => [DataType.Null, IpcField.empty()],
    [Type.Bool]: () => [DataType.Boolean, IpcField.empty()],
    [Type.Int]() {
      let intType = deserialize_integer(field.type(new Int()) as Int);
      let dtype = intType.into<DataType>(DataType);

      return [dtype, IpcField.empty()];
    },
    [Type.FloatingPoint]() {
      let fp: FloatingPoint = field.type(new FloatingPoint());
      let dtype = {
        [Precision.HALF]: DataType.Float16,
        [Precision.SINGLE]: DataType.Float32,
        [Precision.DOUBLE]: DataType.Float64,
      }[fp.precision()];
      return [dtype, IpcField.empty()];
    },
    [Type.Date]() {
      let dt: Date = field.type(Date);
      let dtype = {
        [DateUnit.DAY]: DataType.Float16,
        [DateUnit.MILLISECOND]: DataType.Float32,
      }[dt.unit()];
      return [dtype, IpcField.empty()];
    },
    [Type.Utf8]: () => [DataType.Utf8, IpcField.empty()],
    [Type.LargeUtf8]: () => [DataType.LargeUtf8, IpcField.empty()],
  }[type]();
}

function deserialize_integer(int: Int): IntegerType {
  let [bit_width, is_signed] = [int.bitWidth(), int.isSigned()];

  switch ([bit_width, is_signed]) {
    case [8, true]:
      return IntegerType.Int8;
    case [8, false]:
      return IntegerType.UInt8;
    case [16, true]:
      return IntegerType.Int16;
    case [16, false]:
      return IntegerType.UInt16;
    case [32, true]:
      return IntegerType.Int32;
    case [32, false]:
      return IntegerType.UInt32;
    case [64, true]:
      return IntegerType.Int64;
    case [64, false]:
      return IntegerType.UInt64;
    default:
      throw new Error("IPC: indexType can only be 8, 16, 32 or 64.");
  }
}
function deserialize_field(fld: FieldRef): [Field, IpcField] {
  let metadata = read_metadata(fld);
  let extension = get_extension(metadata);

  let [data_type, ipc_field] = get_data_type(fld, extension, true)!;

  let name = fld.name();
  if (name === null) {
    throw new Error("Every field in IPC must have a name");
  }

  let field = Field(name!, data_type, fld.nullable(), metadata);

  return [field, ipc_field];
}

export function fb_to_schema(schema: SchemaRef): [Schema, IpcSchema] {
  let [fields, ipcFields] = Array.from(
    { length: schema.fieldsLength() },
    (_, k) => {
      let f: any = schema.fields(k)!;
      return deserialize_field(f);
    }
  ).reduce(
    (acc, curr) => {
      let [field, fields] = curr;

      acc[0].push(field);
      acc[1].push(fields);
      return acc;
    },
    [[], []] as [Field[], IpcField[]]
  );
  let isLittleEndian = {
    [Endianness.Little]: true,
    [Endianness.Big]: false,
  }[schema.endianness()];

  let metadata: Metadata = {};
  if (schema.customMetadataLength()) {
    for (let i = 0; i < schema.customMetadataLength(); i++) {
      const kv = schema.customMetadata(i)!;
      let key = kv.key();
      let val = kv.value();
      if (key && val) {
        metadata[key] = val;
      }
    }
  }

  return [Schema(fields, metadata), { fields: ipcFields, isLittleEndian }];
}
