import { Vec } from "../../array/index";
import { Bitmap } from "../../bitmap/immutable";
import { DataType } from "../../datatypes/index";
import { PhysicalType } from "../../datatypes/physical_type";
import { ArrowError } from "../../error";

export class BooleanVec extends Vec {
  #validity: Bitmap | null;
  #values: Bitmap;

  public static try_new(
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
  public static from_data(
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
  public static new_empty(data_type: DataType) {
    return new BooleanVec(data_type, Bitmap.empty(), null);
  }

  public static new_null(data_type: DataType, length: number) {
    return new BooleanVec(data_type, Bitmap.empty(), null);
  }

  private constructor(data_type: DataType, validity, values) {
    super(data_type);
    this.#validity = validity;
    this.#values = values;
  }
  public validity() {
    return this.#validity;
  }

  public value(idx: number) {
    return this.#values.get_bit(idx);
  }
}
