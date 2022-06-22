import { Bitmap } from "../bitmap/immutable";
import { DataType } from "../datatypes/index";

export abstract class Vec {
  protected abstract typeId: string;
  protected abstract __data_type: DataType;

  abstract validity(): Bitmap | null;
  abstract len(): number;

  abstract slice(offset: number, length: number): ThisType<this>;
  abstract value(i: number);

  get length(): number {
    return this.len();
  }
  isEmpty(): boolean {
    return this.len() === 0;
  }
  isValid(i: number): boolean {
    return !this.isNull(i);
  }
  dataType(): DataType {
    return this.__data_type;
  }
  cast<T extends Vec>(): T {
    return this as any as T;
  }

  nullCount(): number {
    if (this.__data_type.equals(DataType.Null)) {
      return this.length;
    } else {
      return this.validity()?.null_count() ?? 0;
    }
  }
  isNull(i: number): boolean {
    return this.validity()?.get_bit(i) ?? false;
  }

  toString() {
    return `${this.typeId}(${this.length}) [...]`;
  }

  [Symbol.toStringTag]() {
    return this.toString();
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return `${this.typeId}(${this.length}) [ ... ]`;
  }
}

export { BooleanVec } from "./boolean/index";
export { NullVec } from "./null";
export { Utf8Vec } from "./utf8";
