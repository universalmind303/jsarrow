import { Bitmap } from "../bitmap/immutable";
import { DataType } from "../datatypes/index";

export abstract class MutableVec {
  protected abstract variant: string;
  protected abstract __data_type: DataType;

  abstract len(): number;
  abstract validity(): Bitmap | null;
  abstract pushNull<T extends MutableVec>(this: T): void;
  abstract shrinkToFit<T extends MutableVec>(this: T): void;

  get length(): number {
    return this.len();
  }

  isEmpty(): boolean {
    return this.len() === 0;
  }

  isValid(i: number): boolean {
    return !this.isNull(i);
  }

  isNull(i: number): boolean {
    return this.validity()?.get_bit(i) ?? false;
  }

  dataType(): DataType {
    return this.__data_type;
  }

  toString() {
    return `${this.variant}(${this.length}) [...]`;
  }

  [Symbol.toStringTag]() {
    return this.toString();
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return `${this.variant}(${this.length}) [ ... ]`;
  }
}
