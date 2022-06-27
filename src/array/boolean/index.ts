import { zipValidity } from "../../bitmap/utils/zip_validity";
import { IterableVector } from "../../util/iterator";
import { Vec } from "../../array/index";
import { Bitmap } from "../../bitmap/immutable";
import { DataType } from "../../datatypes/index";
import { PhysicalType } from "../../datatypes/physical_type";
import { ArrowError } from "../../error";

export class BooleanVec extends Vec implements IterableVector<boolean> {
  protected variant = "BooleanVec";

  __data_type: DataType;
  _validity: Bitmap | null;
  _values: Bitmap;

  constructor(data_type: DataType, validity, values) {
    super();
    this.__data_type = data_type;
    this._validity = validity;
    this._values = values;
  }

  len(): number {
    return this._values.length;
  }

  validity() {
    return this._validity;
  }

  slice(offset: number, length: number): ThisType<this> {
    let validity = this._validity?.slice_unchecked(offset, length);
    let values = this._values.slice_unchecked(offset, length);
    return new BooleanVec(this.__data_type, validity, values);
  }

  value(index: number) {
    return this._values.get_bit(index);
  }
  values(): IterableIterator<boolean | null> {
    return zipValidity(
      this._values.values(),
      this._validity?.values() ?? null
    );
  }


  [Symbol.iterator]() {
    return this.values();
  }

  toArray() {
    return Array.from(this.values());
  }
}


export namespace BooleanVec {

  export function try_new(
    data_type: DataType,
    values: Bitmap,
    validity: Bitmap | null
  ): BooleanVec | Error {
    if (validity && validity.length !== values.length) {
      return ArrowError.OutOfSpec(
        "validity mask length must match the number of values"
      );
    }

    if (!data_type.toPhysicalType().equals(PhysicalType.Boolean)) {
      throw ArrowError.OutOfSpec(
        "BooleanVec can only be initialized with a DataType whose physical type is Boolean"
      );
    }
    return new BooleanVec(data_type, validity, values);
  }

  export function from_data(
    data_type: DataType,
    values: Bitmap,
    validity: Bitmap | null
  ): BooleanVec {
    const val = BooleanVec.try_new(data_type, values, validity);
    if (val instanceof Error) {
      throw val;
    } else {
      return val;
    }
  }

  export function new_empty(data_type: DataType) {
    return new BooleanVec(data_type, Bitmap.empty(), null);
  }

  export function new_null(data_type: DataType, length: number) {
    return new BooleanVec(data_type, Bitmap.empty(), null);
  }

}
