import { Bitmap } from "../bitmap/immutable";
import { DataType } from "../datatypes/index";

export interface Vec {
  validity(): Bitmap | null;
  len(): number;
  isEmpty(): boolean;
  dataType(): DataType;
  nullCount(): number;
  slice(offset: number, length: number): this;
}

export abstract class Vec {
  #data_type: DataType;
  #length: number;
  constructor(data_type: DataType, length?: number) {
    this.#data_type = data_type;
    this.#length = length ?? 0;
  }
  get length(): number {
    return this.#length;
  }
  len(): number {
    return this.#length;
  }
  isEmpty(): boolean {
    return this.length === 0;
  }
  dataType(): DataType {
    return this.#data_type;
  }
  cast<T extends Vec>(): T {
    return this as any as T;
  }

  nullCount(): number {
    if (this.#data_type.equals(DataType.Null)) {
      return this.length;
    } else {
      return this.validity()?.null_count() ?? 0;
    }
  }
  isNull(i: number): boolean {
    return this.validity()?.get_bit(i) ?? false;
  }
}

export { BooleanVec } from "./boolean/index";
export { NullVec } from "./null";
export { Utf8Vec } from "./utf8";
