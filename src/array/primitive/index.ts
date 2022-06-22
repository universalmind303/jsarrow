import assert from "assert";
import { Vec } from "../../array/index";
import { Bitmap } from "../../bitmap/immutable";
import { DataType } from "../../datatypes/index";
import { PhysicalType } from "../../datatypes/physical_type";
import { ArrowError } from "../../error";
import { NativeArrayType, TypedArray } from "../../interfaces";
import { PrimitiveType } from "../../types/index";

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
export class PrimitiveVec<T extends TypedArray> extends Vec {
  protected typeId: string;
  __data_type: DataType;

  #validity: Bitmap | null;
  #values: T;

  private constructor(
    data_type: DataType,
    values: T,
    validity: Bitmap | null = null
  ) {
    super();
    this.typeId = `PrimitiveVec<${data_type.typeId}>`;
    this.__data_type = data_type;
    this.#validity = validity;
    this.#values = values;
  }

  static try_new<T extends TypedArray>(
    data_type: DataType,
    values: T,
    validity: Bitmap | null
  ): PrimitiveVec<T> | Error {
    check(data_type, values, validity);

    return new PrimitiveVec(data_type, values, validity);
  }

  static from_array<T extends TypedArray>(arr: T): PrimitiveVec<T> {
    let pt = PrimitiveType.inferFromArray(arr);
    let dt = DataType.from(pt);
    let values;
    if (Array.isArray(arr)) {
      if (typeof arr[0] === "bigint") {
        let b = BigUint64Array.from(arr as bigint[]);
        values = Buffer.from(b.buffer);
      } else {
        values = Buffer.from(arr as number[]);
      }
    } else {
      values = Buffer.from(arr.buffer);
    }
    return new PrimitiveVec(dt, values);
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
}
