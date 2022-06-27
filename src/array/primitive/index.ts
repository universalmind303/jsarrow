import assert from "assert";
import { zipValidity } from "../../bitmap/utils/zip_validity";
import { Vec } from "../../array/index";
import { Bitmap } from "../../bitmap/immutable";
import { DataType } from "../../datatypes/index";
import { PhysicalType } from "../../datatypes/physical_type";
import { ArrowError } from "../../error";
import { NativeArrayType, TypedArray } from "../../interfaces";
import { PrimitiveType } from "../../types/index";

export class PrimitiveVec<T extends TypedArray> extends Vec {
  protected variant: string;
  __data_type: DataType;

  #validity: Bitmap | null;
  #values: T;

  constructor(data_type: DataType, values: T, validity: Bitmap | null = null) {
    super();
    this.variant = `PrimitiveVec<${data_type.variant}>`;
    this.__data_type = data_type;
    this.#validity = validity;
    this.#values = values;
  }

  len(): number {
    return this.#values.length;
  }
  validity() {
    return this.#validity;
  }
  value(i: number): number {
    return this.#values[i as any] as any;
  }
  slice(offset: number, length: number): ThisType<this> {
    assert(
      offset + length <= this.len(),
      "offset + length may not exceed length of array"
    );
    return this.slice_unchecked(offset, length);
  }
  slice_unchecked(offset, length) {
    let validity = this.#validity?.slice_unchecked(offset, length);
    let values = this.#values.slice(offset, length);
    return new PrimitiveVec(this.__data_type, values, validity);
  }

  values(): IterableIterator<
    T extends BigInt64Array | BigUint64Array ? bigint : number | null
  > {
    return zipValidity(
      this.#values.values(),
      this.#validity?.values() ?? null
    ) as any;
  }

  [Symbol.iterator]() {
    return this.values();
  }

  toArray() {
    return Array.from(this.values());
  }
}

export namespace PrimitiveVec {
  function check<T extends NativeArrayType>(
    data_type: DataType,
    values: T,
    validity: Bitmap | null
  ): void {
    if (validity && validity.length !== values.length) {
      throw ArrowError.OutOfSpec(
        "validity mask length must match the number of values"
      );
    }
    if (
      !data_type
        .toPhysicalType()
        .equals(PhysicalType.Primitive(PrimitiveType.inferFromArray(values)))
    ) {
      throw ArrowError.OutOfSpec(
        "PrimitiveVec can only be initialized with a DataType whose physical type is Primitive"
      );
    }
  }
  export function try_new<T extends TypedArray>(
    data_type: DataType,
    values: T,
    validity: Bitmap | null
  ): PrimitiveVec<T> | Error {
    check(data_type, values, validity);

    return new PrimitiveVec(data_type, values, validity);
  }
}
