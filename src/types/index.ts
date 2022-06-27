import { TypedArray, TypedArrayConstructor } from "../interfaces";
import { FunctionalEnum } from "../util/enum_impl";
import { ArrowError } from "../error";

function PType(variant, arrayConstructor: any = null): PrimitiveType {
  return new (class extends PrimitiveType {
    protected variant = variant;
    protected get inner() {
      return null;
    }
    get arrayConstructor() {
      return arrayConstructor;
    }
  })();
}

export abstract class PrimitiveType extends FunctionalEnum {
  protected identity = "PrimitiveType";
  protected abstract get arrayConstructor(): any;
  /**  A signed 8-bit integer. */
  public static get Int8() {
    return PType("Int8", Int8Array);
  }
  /**  A signed 16-bit integer. */
  public static get Int16() {
    return PType("Int16", Int16Array);
  }
  /**  A signed 32-bit integer. */
  public static get Int32() {
    return PType("Int32", Int32Array);
  }
  /**  A signed 64-bit integer. */
  public static get Int64() {
    return PType("Int64", BigInt64Array);
  }
  /**  A signed 128-bit integer. */
  public static get Int128() {
    return PType("Int128", null);
  }
  /**  An unsigned 8-bit integer. */
  public static get UInt8() {
    return PType("UInt8", Uint8Array);
  }
  /**  An unsigned 16-bit integer. */
  public static get UInt16() {
    return PType("UInt16", Uint16Array);
  }
  /**  An unsigned 32-bit integer. */
  public static get UInt32() {
    return PType("UInt32", Uint32Array);
  }
  /**  An unsigned 64-bit integer. */
  public static get UInt64() {
    return PType("UInt64", BigUint64Array);
  }
  /**  A 16-bit floating point number. */
  public static get Float16() {
    return PType("Float16", Float32Array);
  }
  /**  A 32-bit floating point number. */
  public static get Float32() {
    return PType("Float32", Float32Array);
  }
  /**  A 64-bit floating point number. */
  public static get Float64() {
    return PType("Float64", Float64Array);
  }
  /**  Two i32 representing days and ms */
  public static get DaysMs() {
    return PType("DaysMs");
  }
  /**  months_days_ns(i32, i32, i64) */
  public static get MonthDayNano() {
    return PType("MonthDayNano");
  }
  public toTypedArrayConstructor(): TypedArrayConstructor<TypedArray> {
    const value = this.arrayConstructor;

    if (value !== null) {
      return value;
    } else {
      throw ArrowError.OutOfSpec(`${this.toString()} is not a supported type`);
    }
  }

  public static inferFromArray(arr: any) {
    if (Array.isArray(arr)) {
      switch (typeof arr[0]) {
        case "bigint":
          return PrimitiveType.UInt64;
        case "number":
          return PrimitiveType.Float64;
        default:
          return null as never;
      }
    } else {
      switch (arr.constructor.name) {
        case Int8Array.name:
          return PrimitiveType.Int8;
        case Int16Array.name:
          return PrimitiveType.Int16;
        case Int32Array.name:
          return PrimitiveType.Int32;
        case BigInt64Array.name:
          return PrimitiveType.Int64;
        case Uint8Array.name:
          return PrimitiveType.UInt8;
        case Uint16Array.name:
          return PrimitiveType.UInt16;
        case Uint32Array.name:
          return PrimitiveType.UInt32;
        case BigUint64Array.name:
          return PrimitiveType.UInt64;
        case Float32Array.name:
          return PrimitiveType.Float32;
        case Float64Array.name:
          return PrimitiveType.Float64;
        default:
          throw new Error(`unknown  typed array type: ${arr.constructor.name}`);
      }
    }
  }
}
