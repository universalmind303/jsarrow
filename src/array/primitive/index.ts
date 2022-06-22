import { Vec } from "../../array/index";
import { Bitmap } from "../../bitmap/immutable";
import { DataType } from "../../datatypes/index";
import { PhysicalType } from "../../datatypes/physical_type";
import { ArrowError } from "../../error";
import { NativeArrayType } from "../../interfaces";
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
export class PrimitiveVec<T extends NativeArrayType> extends Vec {
  #validity: Bitmap | null;
  #values: Buffer;

  public static try_new<T extends NativeArrayType>(
    data_type: DataType,
    values: T,
    validity: Bitmap | null
  ): PrimitiveVec<T> | Error {
    check(data_type, values, validity);

    return new PrimitiveVec(data_type, values, validity);
  }

  public static from_array<T extends NativeArrayType>(arr: T): PrimitiveVec<T> {
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

  private constructor(
    data_type: DataType,
    values,
    validity: Bitmap | null = null
  ) {
    super(data_type);
    this.#validity = validity;
    this.#values = values;
  }
}
