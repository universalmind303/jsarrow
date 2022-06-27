import { Bitmap } from "../bitmap/immutable";
import { Vec } from "../array/index";
import { DataType } from "../datatypes/index";
import { PhysicalType } from "../datatypes/physical_type";
import { ArrowError } from "../error";
import { Result, unwrap } from "../util/fp";

export class NullVec extends Vec {
  protected variant = "NullVec";
  __data_type: DataType;
  #length: number;

  private constructor(data_type: DataType, length: number) {
    super();
    this.__data_type = data_type;
    this.#length = length;
  }

  static try_new(data_type: DataType, length: number): NullVec | Error {
    if (!data_type.toPhysicalType().equals(PhysicalType.Null)) {
      throw ArrowError.OutOfSpec(
        "NullVec can only be initialized with a DataType whose physical type is Boolean"
      );
    }
    return new NullVec(data_type, length);
  }

  static from_data(data_type: DataType, length: number): NullVec {
    return unwrap(NullVec.try_new(data_type, length));
  }

  static new_empty(data_type: DataType): NullVec {
    return new NullVec(data_type, 0);
  }

  static new_null(data_type: DataType, length: number): NullVec {
    return new NullVec(data_type, length);
  }

  len(): number {
    return this.#length;
  }
  validity(): Bitmap | null {
    return null;
  }
  value(_i: number) {
    return null;
  }
  slice(_offset: number, length: number): ThisType<this> {
    return new NullVec(this.__data_type, length);
  }
}
