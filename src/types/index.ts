import {
  NativeArrayType,
  TypedArray,
  TypedArrayConstructor,
} from "../interfaces";
import { FunctionalEnum } from "../util/enum_impl";
import util from "util";
import { ArrowError } from "../error";

export class PrimitiveType extends FunctionalEnum {
  static identity = "PrimitiveType";
  static #variants = {
    0: "Int8",
    1: "Int16",
    2: "Int32",
    3: "Int64",
    4: "Int128",
    5: "UInt8",
    6: "UInt16",
    7: "UInt32",
    8: "UInt64",
    9: "Float16",
    10: "Float32",
    11: "Float64",
    12: "DaysMs",
    13: "MonthDayNano",
    Int8: { inner: 0 },
    Int16: { inner: 1 },
    Int32: { inner: 2 },
    Int64: { inner: 3 },
    Int128: { inner: 4 },
    UInt8: { inner: 5 },
    UInt16: { inner: 6 },
    UInt32: { inner: 7 },
    UInt64: { inner: 8 },
    Float16: { inner: 9 },
    Float32: { inner: 10 },
    Float64: { inner: 11 },
    DaysMs: { inner: 12 },
    MonthDayNano: { inner: 13 },
  } as const;

  private constructor(inner) {
    super(inner, PrimitiveType.identity, PrimitiveType.#variants);
  }
  /**  A signed 8-bit integer. */
  public static get Int8() {
    return new PrimitiveType(PrimitiveType.#variants.Int8);
  }
  /**  A signed 16-bit integer. */
  public static get Int16() {
    return new PrimitiveType(PrimitiveType.#variants.Int16);
  }
  /**  A signed 32-bit integer. */
  public static get Int32() {
    return new PrimitiveType(PrimitiveType.#variants.Int32);
  }
  /**  A signed 64-bit integer. */
  public static get Int64() {
    return new PrimitiveType(PrimitiveType.#variants.Int64);
  }
  /**  A signed 128-bit integer. */
  public static get Int128() {
    return new PrimitiveType(PrimitiveType.#variants.Int128);
  }
  /**  An unsigned 8-bit integer. */
  public static get UInt8() {
    return new PrimitiveType(PrimitiveType.#variants.UInt8);
  }
  /**  An unsigned 16-bit integer. */
  public static get UInt16() {
    return new PrimitiveType(PrimitiveType.#variants.UInt16);
  }
  /**  An unsigned 32-bit integer. */
  public static get UInt32() {
    return new PrimitiveType(PrimitiveType.#variants.UInt32);
  }
  /**  An unsigned 64-bit integer. */
  public static get UInt64() {
    return new PrimitiveType(PrimitiveType.#variants.UInt64);
  }
  /**  A 16-bit floating point number. */
  public static get Float16() {
    return new PrimitiveType(PrimitiveType.#variants.Float16);
  }
  /**  A 32-bit floating point number. */
  public static get Float32() {
    return new PrimitiveType(PrimitiveType.#variants.Float32);
  }
  /**  A 64-bit floating point number. */
  public static get Float64() {
    return new PrimitiveType(PrimitiveType.#variants.Float64);
  }
  /**  Two i32 representing days and ms */
  public static get DaysMs() {
    return new PrimitiveType(PrimitiveType.#variants.DaysMs);
  }
  /**  months_days_ns(i32, i32, i64) */
  public static get MonthDayNano() {
    return new PrimitiveType(PrimitiveType.#variants.MonthDayNano);
  }
  public static inferFromArray(arr: NativeArrayType) {
    switch (typeof arr[0]) {
      case "bigint":
        return PrimitiveType.UInt64;
      case "number":
        return PrimitiveType.Float64;

      default:
        return null as never;
    }
  }
  public toTypedArrayConstructor(): TypedArrayConstructor<TypedArray> {
    const value = {
      0: Int8Array,
      1: Int16Array,
      2: Int32Array,
      3: BigInt64Array,
      5: Uint8Array,
      6: Uint16Array,
      7: Uint32Array,
      8: BigUint64Array,
      10: Float32Array,
      11: Float64Array,
    }[this.inner];
    if (value !== undefined) {
      return value;
    } else {
      throw ArrowError.OutOfSpec(`${this.toString()} is not a supported type`);
    }
  }
}
