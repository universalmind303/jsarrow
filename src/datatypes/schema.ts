import { Metadata } from "../io/ipc/read/schema";
import { Field } from "./field";

export interface Schema {
  fields: Array<Field>;
  metadata: Metadata;
  withMetadata(this: Schema, metadata: Metadata): Schema;
}

export interface SchemaConstructor {
  (fields: Array<Field>, metadata?: Metadata): Schema;
  from<T extends Array<Field>>(fields: T): Schema;
}

function _Schema(fields: Array<Field>, metadata = {}): Schema {
  return {
    fields,
    metadata,
    withMetadata(this: Schema, metadata: Metadata): Schema {
      return {
        ...this,
        metadata,
      };
    },
    [Symbol.for("nodejs.util.inspect.custom")]() {
      return {
        fields: this.fields,
        metadata: this.metadata,
      };
    },
  };
}

export const Schema: SchemaConstructor = Object.assign(_Schema, {
  from(fields) {
    return _Schema(fields);
  },
});
