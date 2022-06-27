import { Extension, Metadata } from "../io/ipc/read/schema";
import { PrimitiveType } from "../types/index";
import { FunctionalEnum } from "../util/enum_impl";
import { IntegerType, PhysicalType } from "./physical_type";
import util from "util";
import { Field } from "../datatypes/field";

function _UnionMode(variant, data): UnionMode {
  return new (class extends UnionMode {
    protected variant = variant;
    protected get inner() {
      return data;
    }
  })();
}

export abstract class UnionMode extends FunctionalEnum {
  identity = "UnionMode";

  public static get Sparse() {
    return _UnionMode("Sparse", 0);
  }
  public static get Dense() {
    return _UnionMode("Dense", 1);
  }

  sparse(isSparse: boolean) {
    if (isSparse) {
      return _UnionMode("Sparse", 0);
    } else {
      return _UnionMode("Dense", 1);
    }
  }

  isSparse() {
    return this.inner === 0;
  }

  isDense() {
    return this.inner === 1;
  }
}

function _TimeUnit(variant, data = null): TimeUnit {
  return new (class extends TimeUnit {
    protected variant = variant;
    protected get inner() {
      return data;
    }
  })();
}
export abstract class TimeUnit extends FunctionalEnum {
  identity = "TimeUnit";

  public static get Second() {
    return _TimeUnit("Second");
  }
  public static get Millisecond() {
    return _TimeUnit("Millisecond");
  }
  public static get Microsecond() {
    return _TimeUnit("Microsecond");
  }
  public static get Nanosecond() {
    return _TimeUnit("Nanosecond");
  }
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

function Dtype(variant, data: any = null): DataType {
  return new (class extends DataType {
    variant = variant;
    protected get inner() {
      return data;
    }
  })();
}

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
export abstract class DataType extends FunctionalEnum {
  abstract variant: string;
  protected identity = "DataType";
  protected abstract get inner(): null | any[];

  /** Null type */
  public static get Null(): DataType {
    return Dtype("Null");
  }
  /** `true` and `false`. */
  public static get Boolean(): DataType {
    return Dtype("Boolean");
  }
  /** An [`i8`] */
  public static get Int8(): DataType {
    return Dtype("Int8");
  }
  /** An [`i16`] */
  public static get Int16(): DataType {
    return Dtype("Int16");
  }
  /** An [`i32`] */
  public static get Int32(): DataType {
    return Dtype("Int32");
  }
  /** An [`i64`] */
  public static get Int64(): DataType {
    return Dtype("Int64");
  }
  /** An [`u8`] */
  public static get UInt8(): DataType {
    return Dtype("UInt8");
  }
  /** An [`u16`] */
  public static get UInt16(): DataType {
    return Dtype("UInt16");
  }
  /** An [`u32`] */
  public static get UInt32(): DataType {
    return Dtype("UInt32");
  }
  /** An [`u64`] */
  public static get UInt64(): DataType {
    return Dtype("UInt64");
  }
  /** An 16-bit float */
  public static get Float16(): DataType {
    return Dtype("Float16");
  }
  /** A [`f32`] */
  public static get Float32(): DataType {
    return Dtype("Float32");
  }
  /** A [`f64`] */
  public static get Float64(): DataType {
    return Dtype("Float64");
  }
  public static List(fld: Field) {
    return Dtype("List", [fld]);
  }
  public static LargeList(fld: Field) {
    return Dtype("LargeList", [fld]);
  }
  /** A variable-length UTF-8 encoded string whose offsets are represented as [`i32`]. */
  public static get Utf8(): DataType {
    return Dtype("Utf8");
  }
  /** A variable-length UTF-8 encoded string whose offsets are represented as [`i64`]. */
  public static get LargeUtf8(): DataType {
    return Dtype("LargeUtf8");
  }
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
    return Dtype("Dictionary", [int, dt, sorted]);
  }
  /** Extension type. */
  public static Extension(ext: string, dt: DataType, metadata?: string) {
    return Dtype("Extension", [ext, dt, metadata]);
  }
  /** the [`PhysicalType`] of this [`DataType`]. */
  toPhysicalType(): PhysicalType {
    return {
      Null: () => PhysicalType.Null,
      Boolean: () => PhysicalType.Boolean,
      Int8: () => PhysicalType.Primitive(PrimitiveType.Int8),
      Int16: () => PhysicalType.Primitive(PrimitiveType.Int16),
      Int32: () => PhysicalType.Primitive(PrimitiveType.Int32),
      Int64: () => PhysicalType.Primitive(PrimitiveType.Int64),
      UInt8: () => PhysicalType.Primitive(PrimitiveType.UInt8),
      UInt16: () => PhysicalType.Primitive(PrimitiveType.UInt16),
      UInt32: () => PhysicalType.Primitive(PrimitiveType.UInt32),
      UInt64: () => PhysicalType.Primitive(PrimitiveType.UInt64),
      Float16: () => PhysicalType.Primitive(PrimitiveType.Float16),
      Float32: () => PhysicalType.Primitive(PrimitiveType.Float32),
      Float64: () => PhysicalType.Primitive(PrimitiveType.Float64),
      Utf8: () => PhysicalType.Utf8,
      LargeUtf8: () => PhysicalType.LargeUtf8,
      List: () => PhysicalType.List,
      LargeList: () => PhysicalType.LargeList,
      Dictionary: () => PhysicalType.Dictionary(this.inner![0]),
      Extension: () => this.inner![1].toPhysicalType(),
    }[this.variant]();
  }
  /**
   * Returns `&self` for all but [`DataType::Extension`]. For [`DataType::Extension`],
   * (recursively) returns the inner [`DataType`].
   * Never returns the variant [`DataType::Extension`].
   */
  toLogicalType(): DataType {
    switch (this.variant) {
      case "Extension":
        return this.inner![1].toLogicalType();
      default:
        return this;
    }
  }
  public static from(t: IntegerType | PrimitiveType): DataType {
    return null as any;
  }
  public static infer(obj: any): DataType {
    return inferType(obj);
  }
}

