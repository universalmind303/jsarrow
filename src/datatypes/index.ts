import { Extension, Metadata } from "../io/ipc/read/schema";
import { PrimitiveType } from "../types/index";
import { FunctionalEnum } from "../util/enum_impl";
import { IntegerType, PhysicalType } from "./physical_type";
import util from "util";
export class UnionMode extends FunctionalEnum {
  static #identity = "UnionMode";
  static #variants = {
    Sparse: { inner: 0 },
    Dense: { inner: 1 },
    0: "Sparse",
    1: "Dense",
  } as const;

  private constructor(inner) {
    super(inner, UnionMode.#identity, UnionMode.#variants);
  }

  public static Sparse = new UnionMode(UnionMode.#variants.Sparse);
  public static Dense = new UnionMode(UnionMode.#variants.Dense);

  sparse(isSparse: boolean) {
    if (isSparse) {
      return new UnionMode(UnionMode.#variants.Sparse);
    } else {
      return new UnionMode(UnionMode.#variants.Dense);
    }
  }

  isSparse() {
    return super.inner === UnionMode.#variants.Sparse.inner;
  }

  isDense() {
    return super.inner === UnionMode.#variants.Dense.inner;
  }
}

export class TimeUnit extends FunctionalEnum {
  static #identity = "TimeUnit";

  static #variants = {
    0: "Second",
    1: "Millisecond",
    2: "Microsecond",
    3: "Nanosecond",
    Second: { inner: 0 },
    Millisecond: { inner: 1 },
    Microsecond: { inner: 2 },
    Nanosecond: { inner: 3 },
  } as const;

  private constructor(inner) {
    super(inner, TimeUnit.#identity, TimeUnit.#variants);
  }

  public static Second = new TimeUnit(TimeUnit.#variants.Second);
  public static Millisecond = new TimeUnit(TimeUnit.#variants.Millisecond);
  public static Microsecond = new TimeUnit(TimeUnit.#variants.Microsecond);
  public static Nanosecond = new TimeUnit(TimeUnit.#variants.Nanosecond);
}

/**
 * __finds the first non null value in the inputs__
 * ___
 * If the first value is an array
 * it will find the first scalar type in the array and return it wrapped into the array
 *
 * @example
 * ```
 * >>> const input = [null, [], [null, "a", "b"]]
 * >>> firstNonNull(input)
 * ["a"]
 * >>> const ints = [null, 1]
 * >>> firstNonNull(ints)
 * 1
 * ```
 */
const firstNonNull = (arr: any[]): any => {
  const first = arr.find((x) => x !== null && x !== undefined);
  if (Array.isArray(first)) {
    return [firstNonNull(arr.flat())];
  }

  return first;
};

const inferType = (value: unknown): DataType => {
  if (value === null) {
    return DataType.Float64;
  }
  if (Array.isArray(value)) {
    return inferType(firstNonNull(value));
  }
  if (util.types.isTypedArray(value)) {
    switch (value.constructor.name) {
      case Int8Array.name:
        return DataType.Int8;
      case Int16Array.name:
        return DataType.Int16;
      case Int32Array.name:
        return DataType.Int32;
      case BigInt64Array.name:
        return DataType.Int64;
      case Uint8Array.name:
        return DataType.UInt8;
      case Uint16Array.name:
        return DataType.UInt16;
      case Uint32Array.name:
        return DataType.UInt32;
      case BigUint64Array.name:
        return DataType.UInt64;
      case Float32Array.name:
        return DataType.Float32;
      case Float64Array.name:
        return DataType.Float64;
      default:
        throw new Error(`unknown  typed array type: ${value.constructor.name}`);
    }
  }

  switch (typeof value) {
    case "bigint":
      return DataType.UInt64;
    case "number":
      return DataType.Float64;
    case "string":
      return DataType.Utf8;
    case "boolean":
      return DataType.Boolean;
    default:
      return DataType.Float64;
  }
};

const __DataTypeVariants = {
  0: "Null",
  1: "Boolean",
  2: "Int8",
  3: "Int16",
  4: "Int32",
  5: "Int64",
  6: "UInt8",
  7: "UInt16",
  8: "UInt32",
  9: "UInt64",
  10: "Float16",
  11: "Float32",
  12: "Float64",
  13: "Utf8",
  14: "LargeUtf8",
  15([int, dtype, bool]) {
    return {
      Dictionary: {
        key: int,
        value: dtype,
        sorted: bool,
      },
    };
  },
  16([ext, dtype, bool]) {
    return {
      Extension: {
        key: ext,
        value: dtype,
        sorted: bool,
      },
    };
  },
  Null: { inner: 0 },
  Boolean: { inner: 1 },
  Int8: { inner: 2 },
  Int16: { inner: 3 },
  Int32: { inner: 4 },
  Int64: { inner: 5 },
  UInt8: { inner: 6 },
  UInt16: { inner: 7 },
  UInt32: { inner: 8 },
  UInt64: { inner: 9 },
  Float16: { inner: 10 },
  Float32: { inner: 11 },
  Float64: { inner: 12 },
  Utf8: { inner: 13 },
  LargeUtf8: { inner: 14 },
  Dictionary(int?: IntegerType, dtype?: DataType, bool?: boolean) {
    return {
      inner: 15,
      data: [int, dtype, bool],
    } as const;
  },
  Extension: (ext?: string, dtype?: DataType, metadata?: string) => {
    return {
      inner: 16,
      data: [ext, dtype, metadata],
    } as const;
  },
} as const;
/**
 * The set of supported logical types in this package.
 *
 *
 * Each variant uniquely identifies a logical type, which define specific semantics to the data
 * (e.g. how it should be represented).
 * Each variant has a corresponding [`PhysicalType`], obtained via [`DataType::to_physical_type`],
 * which declares the in-memory representation of data.
 * The [`DataType::Extension`] is special in that it augments a [`DataType`] with metadata to support custom types.
 * Use `to_logical_type` to desugar such type and return its correspoding logical type.
 **/
export class DataType extends FunctionalEnum {
  static #identity = "DataType";

  static #variants = ({ inner, data }: { inner: number; data }) => {
    const variant = __DataTypeVariants[inner];
    if (data) {
      return variant(data);
    } else {
      return variant;
    }
  };

  private constructor(inner: any) {
    super(inner, DataType.#identity, DataType.#variants);
  }
  /** Null type */
  public static Null = new DataType(__DataTypeVariants.Null);
  /** `true` and `false`. */
  public static Boolean = new DataType(__DataTypeVariants.Boolean);
  /** An [`i8`] */
  public static Int8 = new DataType(__DataTypeVariants.Int8);
  /** An [`i16`] */
  public static Int16 = new DataType(__DataTypeVariants.Int16);
  /** An [`i32`] */
  public static Int32 = new DataType(__DataTypeVariants.Int32);
  /** An [`i64`] */
  public static Int64 = new DataType(__DataTypeVariants.Int64);
  /** An [`u8`] */
  public static UInt8 = new DataType(__DataTypeVariants.UInt8);
  /** An [`u16`] */
  public static UInt16 = new DataType(__DataTypeVariants.UInt16);
  /** An [`u32`] */
  public static UInt32 = new DataType(__DataTypeVariants.UInt32);
  /** An [`u64`] */
  public static UInt64 = new DataType(__DataTypeVariants.UInt64);
  /** An 16-bit float */
  public static Float16 = new DataType(__DataTypeVariants.Float16);
  /** A [`f32`] */
  public static Float32 = new DataType(__DataTypeVariants.Float32);
  /** A [`f64`] */
  public static Float64 = new DataType(__DataTypeVariants.Float64);
  /** A variable-length UTF-8 encoded string whose offsets are represented as [`i32`]. */
  public static Utf8 = new DataType(__DataTypeVariants.Utf8);
  /** A variable-length UTF-8 encoded string whose offsets are represented as [`i64`]. */
  public static LargeUtf8 = new DataType(__DataTypeVariants.LargeUtf8);
  /**
   *  A dictionary encoded array (`key_type`, `value_type`), where
   * each array element is an index of `key_type` into an
   * associated dictionary of `value_type`.
   *
   * Dictionary arrays are used to store columns of `value_type`
   * that contain many repeated values using less memory, but with
   * a higher CPU overhead for some operations.
   *
   * This type mostly used to represent low cardinality string
   * arrays or a limited set of primitive types as integers.
   *
   * The `sorted` value indicates the `Dictionary` is sorted if set to `true`.
   */
  public static Dictionary(int: IntegerType, dt: DataType, sorted: boolean) {
    return new DataType(__DataTypeVariants.Dictionary(int, dt, sorted));
  }
  /** Extension type. */
  public static Extension(ext: string, dt: DataType, metadata?: string) {
    return new DataType(__DataTypeVariants.Extension(ext, dt, metadata));
  }

  /** the [`PhysicalType`] of this [`DataType`]. */
  toPhysicalType(): PhysicalType {
    let inner = this.__inner;
    return (
      {
        [__DataTypeVariants.Null.inner]() {
          return PhysicalType.Null;
        },
        [__DataTypeVariants.Boolean.inner]() {
          return PhysicalType.Boolean;
        },
        [__DataTypeVariants.Int8.inner]() {
          return PhysicalType.Primitive(PrimitiveType.Int8);
        },
        [__DataTypeVariants.Int16.inner]() {
          return PhysicalType.Primitive(PrimitiveType.Int16);
        },
        [__DataTypeVariants.Int32.inner]() {
          return PhysicalType.Primitive(PrimitiveType.Int32);
        },
        [__DataTypeVariants.Int64.inner]() {
          return PhysicalType.Primitive(PrimitiveType.Int64);
        },
        [__DataTypeVariants.UInt8.inner]() {
          return PhysicalType.Primitive(PrimitiveType.UInt8);
        },
        [__DataTypeVariants.UInt16.inner]() {
          return PhysicalType.Primitive(PrimitiveType.UInt16);
        },
        [__DataTypeVariants.UInt32.inner]() {
          return PhysicalType.Primitive(PrimitiveType.UInt32);
        },
        [__DataTypeVariants.UInt64.inner]() {
          return PhysicalType.Primitive(PrimitiveType.UInt64);
        },
        [__DataTypeVariants.Float16.inner]() {
          return PhysicalType.Primitive(PrimitiveType.Float16);
        },
        [__DataTypeVariants.Float32.inner]() {
          return PhysicalType.Primitive(PrimitiveType.Float32);
        },
        [__DataTypeVariants.Float64.inner]() {
          return PhysicalType.Primitive(PrimitiveType.Float64);
        },
        [__DataTypeVariants.Utf8.inner]() {
          return PhysicalType.Utf8;
        },
        [__DataTypeVariants.LargeUtf8.inner]() {
          return PhysicalType.LargeUtf8;
        },
        [__DataTypeVariants.Dictionary().inner]() {
          return PhysicalType.Dictionary(inner.data[0]);
        },
        [__DataTypeVariants.Extension().inner]() {
          return inner.data[1]!.toPhysicalType();
        },
      }[inner.inner]() ?? null
    );
  }
  /**
   * Returns `&self` for all but [`DataType::Extension`]. For [`DataType::Extension`],
   * (recursively) returns the inner [`DataType`].
   * Never returns the variant [`DataType::Extension`].
   */
  toLogicalType(): DataType {
    let inner = this.__inner;
    switch (inner.inner) {
      case __DataTypeVariants.Extension().inner:
        return (inner.data[1] as DataType).toLogicalType();
      default:
        return this;
    }
  }

  public static from(t: IntegerType | PrimitiveType): DataType {
    const value =
      {
        [PrimitiveType.identity]: {
          [PrimitiveType.Int8.inner]: DataType.Int8,
          [PrimitiveType.Int16.inner]: DataType.Int16,
          [PrimitiveType.Int32.inner]: DataType.Int32,
          [PrimitiveType.Int64.inner]: DataType.Int64,
          [PrimitiveType.UInt8.inner]: DataType.UInt8,
          [PrimitiveType.UInt16.inner]: DataType.UInt16,
          [PrimitiveType.UInt32.inner]: DataType.UInt32,
          [PrimitiveType.UInt64.inner]: DataType.UInt64,
          [PrimitiveType.Float16.inner]: DataType.Float16,
          [PrimitiveType.Float32.inner]: DataType.Float32,
          [PrimitiveType.Float64.inner]: DataType.Float64,
        },
        [IntegerType.identity]: {
          [IntegerType.Int8.inner]: DataType.Int8,
          [IntegerType.Int16.inner]: DataType.Int16,
          [IntegerType.Int32.inner]: DataType.Int32,
          [IntegerType.Int64.inner]: DataType.Int64,
          [IntegerType.UInt8.inner]: DataType.UInt8,
          [IntegerType.UInt16.inner]: DataType.UInt16,
          [IntegerType.UInt32.inner]: DataType.UInt32,
          [IntegerType.UInt64.inner]: DataType.UInt64,
        },
      }[t.identity]?.[t.inner] ?? null;
    if (value === null) {
      throw new Error(`unable to convert ${t.identity} to DataType`);
    }
    return value;
  }

  public static infer(obj: any): DataType {
    return inferType(obj);
  }
}

export function get_extension(metadata: Metadata): Extension {
  const name = metadata?.["ARROW:extension:name"];
  if (name) {
    let data = metadata["ARROW:extension:metadata"];
    return [name, data];
  } else {
    return null;
  }
}
