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
import { DataType } from "../../../datatypes/index";
import { IpcField, IpcSchema } from "../../../io/ipc/index";
import { Field } from "../../../datatypes/field";
import type { Option } from "../../../util/fp";
import { Schema } from "../../../datatypes/schema";
import { ArrowError } from "../../../error";

export type Extension = Option<[string, Option<string>]>;
export type Metadata = Record<string, string>;

function readMetadata(field: FieldRef): Metadata {
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

function getDataType(
  field: FieldRef,
  extension: Extension,
  may_be_dictionary: boolean
): [DataType, IpcField] | null {
  let dict: DictionaryEncoding;
  if ((dict = field.dictionary()!)) {
    if (may_be_dictionary) {
      const int = dict.indexType()!;
      const index_type = deserializeInt(int)!;

      let [inner, ipc_field] = getDataType(field, extension, false)!;
      ipc_field.dictionaryId = dict.id();
      return [
        DataType.Dictionary(index_type, inner, dict.isOrdered()),
        ipc_field,
      ];
    }
  }

  if (extension) {
    let [name, metadata] = extension;
    let [datatype, fields] = getDataType(field, null, false)!;
    return [DataType.Extension(name, datatype, metadata!), fields];
  }
  return fieldToDataType(field);
}

function fieldToDataType(field: FieldRef): [DataType, IpcField] {
  switch (field.typeType()) {
    case Type.Null:
      return [DataType.Null, IpcField.empty()];
    case Type.Bool:
      return [DataType.Boolean, IpcField.empty()];
    case Type.Int: {
      const intType = deserializeInt(field.type(new Int()) as Int);
      const dtype = intType.into<DataType>(DataType);

      return [dtype, IpcField.empty()];
    }
    case Type.FloatingPoint: {
      const fp: FloatingPoint = field.type(new FloatingPoint());
      const dtype = _precisionMapping[fp.precision()];
      return [dtype, IpcField.empty()];
    }
    case Type.Date: {
      const dt: Date = field.type(Date);
      const dtype = {
        [DateUnit.DAY]: DataType.Float16,
        [DateUnit.MILLISECOND]: DataType.Float32,
      }[dt.unit()];
      return [dtype, IpcField.empty()];
    }
    case Type.Utf8:
      return [DataType.Utf8, IpcField.empty()];
    case Type.LargeUtf8:
      return [DataType.LargeUtf8, IpcField.empty()];
    case Type.List: {
      const children_len = field.childrenLength();
      if (!children_len) {
        throw ArrowError.OutOfSpec("IPC: List must contain children");
      }

      const inner = field.children(0);
      if (inner === null) {
        throw ArrowError.OutOfSpec("IPC: List must contain one child");
      }

      let [fld, ipc_field] = deserializeField(inner);
      return [DataType.List(fld), { fields: [ipc_field] }];
    }
    case Type.LargeList: {
      const children_len = field.childrenLength();
      if (!children_len) {
        throw ArrowError.OutOfSpec("IPC: List must contain children");
      }

      const inner = field.children(0);
      if (inner === null) {
        throw ArrowError.OutOfSpec("IPC: List must contain one child");
      }

      let [fld, ipc_field] = deserializeField(inner);
      return [DataType.LargeList(fld), { fields: [ipc_field] }];
    }
    default:
      return null as never;
  }
}

function deserializeInt(int: Int): IntegerType {
  const [bit_width, is_signed] = [int.bitWidth(), int.isSigned()];

  const mappings = is_signed ? _intMapping : _uIntMapping;
  const intType = mappings[bit_width];
  if (!intType) {
    throw new Error("IPC: indexType can only be 8, 16, 32 or 64.");
  }
  return intType;
}

function deserializeField(fld: FieldRef): [Field, IpcField] {
  let metadata = readMetadata(fld);
  let extension = get_extension(metadata);

  let [data_type, ipc_field] = getDataType(fld, extension, true)!;

  let name = fld.name();
  if (name === null) {
    throw new Error("Every field in IPC must have a name");
  }

  let field = Field(name!, data_type, fld.nullable(), metadata);

  return [field, ipc_field];
}

export function deserializeSchema(schema: SchemaRef): [Schema, IpcSchema] {
  const fieldsLength = schema.fieldsLength();
  // for loops are soo much faster than map/reduce

  const fields: Field[] = Array.from({ length: fieldsLength });
  const ipcFields: IpcField[] = Array.from({ length: fieldsLength });

  for (let idx = 0; idx < fieldsLength; idx++) {
    const f = schema.fields(idx)!;
    const values = deserializeField(f);
    fields[idx] = values[0];
    ipcFields[idx] = values[1];
  }

  const isLittleEndian = _endiannessMapping[schema.endianness()];
  let metadata: Metadata = {};
  const metadataLength = schema.customMetadataLength();

  if (metadataLength) {
    for (let i = 0; i < metadataLength; i++) {
      const kv = schema.customMetadata(i)!;
      const key = kv.key();
      const val = kv.value();
      if (key && val) {
        metadata[key] = val;
      }
    }
  }

  return [Schema(fields, metadata), { fields: ipcFields, isLittleEndian }];
}

function get_extension(metadata: Metadata): Extension {
  const name = metadata?.["ARROW:extension:name"];
  if (name) {
    const data = metadata["ARROW:extension:metadata"];
    return [name, data];
  } else {
    return null;
  }
}

// constants of type mappings. 

const _intMapping = {
  8: IntegerType.Int8,
  16: IntegerType.Int16,
  32: IntegerType.Int32,
  64: IntegerType.Int64,
};

const _uIntMapping = {
  8: IntegerType.UInt8,
  16: IntegerType.UInt16,
  32: IntegerType.UInt32,
  64: IntegerType.UInt64,
};

const _precisionMapping = {
  [Precision.HALF]: DataType.Float16,
  [Precision.SINGLE]: DataType.Float32,
  [Precision.DOUBLE]: DataType.Float64,
};

const _endiannessMapping = {
  [Endianness.Little]: true,
  [Endianness.Big]: false,
};
