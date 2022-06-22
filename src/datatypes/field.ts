import { Metadata } from "../io/ipc/read/schema";
import { DataType } from "./index";

export interface Field {
  name: string;
  datatype: DataType;
  isNullable: boolean;
  metadata: Metadata;
  withMetadata(this: Field, metadata: Metadata): Field;
}

export function Field(
  name: string,
  datatype: DataType,
  isNullable: boolean,
  metadata = {}
): Field {
  return {
    name,
    datatype,
    isNullable,
    metadata,
    withMetadata(this: Field, metadata: Metadata): Field {
      return {
        ...this,
        metadata,
      };
    },
    [Symbol.for("nodejs.util.inspect.custom")]() {
      return {
        name: this.name,
        datatype: this.datatype,
        metadata: this.metadata,
      };
    },
  };
}
