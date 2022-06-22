import { FunctionalEnum } from "../util/enum_impl";
import { PrimitiveType } from "../types/index";

export class IntegerType extends FunctionalEnum {
  static identity = "IntegerType";
  static #variants = {
    0: "Int8",
    1: "Int16",
    2: "Int32",
    3: "Int64",
    4: "UInt8",
    5: "UInt16",
    6: "UInt32",
    7: "UInt64",
    Int8: { inner: 0 },
    Int16: { inner: 1 },
    Int32: { inner: 2 },
    Int64: { inner: 3 },
    UInt8: { inner: 4 },
    UInt16: { inner: 5 },
    UInt32: { inner: 6 },
    UInt64: { inner: 7 },
  } as const;

  private constructor(inner) {
    super(inner, IntegerType.identity, IntegerType.#variants);
  }

  /** A signed 8-bit integer. */
  public static Int8 = new IntegerType(IntegerType.#variants.Int8);
  /** A signed 16-bit integer. */
  public static Int16 = new IntegerType(IntegerType.#variants.Int16);
  /** A signed 32-bit integer. */
  public static Int32 = new IntegerType(IntegerType.#variants.Int32);
  /** A signed 64-bit integer. */
  public static Int64 = new IntegerType(IntegerType.#variants.Int64);
  /** An unsigned 8-bit integer. */
  public static UInt8 = new IntegerType(IntegerType.#variants.UInt8);
  /** An unsigned 16-bit integer. */
  public static UInt16 = new IntegerType(IntegerType.#variants.UInt16);
  /** An unsigned 32-bit integer. */
  public static UInt32 = new IntegerType(IntegerType.#variants.UInt32);
  /** An unsigned 64-bit integer. */
  public static UInt64 = new IntegerType(IntegerType.#variants.UInt64);
  public into<T>(this: IntegerType, intoClass): T {
    return (intoClass as any).from(this);
  }
}

const __PhysicalTypeVariants = {
  0: "Null",
  1: "Boolean",
  2(primitive: PrimitiveType) {
    return {
      Primitive: primitive,
    } as const;
  },
  3: "Binary",
  4: "FixedSizeBinary",
  5: "LargeBinary",
  6: "Utf8",
  7: "LargeUtf8",
  8: "List",
  9: "FixedSizeList",
  10: "LargeList",
  11: "Struct",
  12: "Union",
  13: "Map",
  14(integerType: IntegerType) {
    return {
      Dictionary: integerType,
    } as const;
  },
  Null: { inner: 0 },
  Boolean: { inner: 1 },
  Primitive: function (primitive: PrimitiveType) {
    return {
      inner: 2,
      data: primitive,
    } as const;
  },
  Binary: { inner: 3 },
  FixedSizeBinary: { inner: 4 },
  LargeBinary: { inner: 5 },
  Utf8: { inner: 6 },
  LargeUtf8: { inner: 7 },
  List: { inner: 8 },
  FixedSizeList: { inner: 9 },
  LargeList: { inner: 10 },
  Struct: { inner: 11 },
  Union: { inner: 12 },
  Map: { inner: 13 },
  Dictionary: function (integerType: IntegerType) {
    return {
      inner: 14,
      data: integerType,
    } as const;
  },
} as const;

export class PhysicalType extends FunctionalEnum {
  static #identity = "PhysicalType";

  static #variants = ({ inner, data }: { inner: number; data }) => {
    const variant = __PhysicalTypeVariants[inner];
    if (data) {
      return variant(data);
    } else {
      return variant;
    }
  };

  private constructor(inner) {
    super(inner, PhysicalType.#identity, PhysicalType.#variants);
  }

  /** A Null with no allocation. */
  public static Null = new PhysicalType(__PhysicalTypeVariants.Null);
  /** A boolean represented as a single bit. */
  public static Boolean = new PhysicalType(__PhysicalTypeVariants.Boolean);
  /** An array where each slot has a known compile-time size. */
  public static Primitive(primitiveType: PrimitiveType) {
    return new PhysicalType(__PhysicalTypeVariants.Primitive(primitiveType));
  }
  /** Opaque binary data of variable length. */
  public static Binary = new PhysicalType(__PhysicalTypeVariants.Binary);
  /** Opaque binary data of fixed size. */
  public static FixedSizeBinary = new PhysicalType(
    __PhysicalTypeVariants.FixedSizeBinary
  );
  /** Opaque binary data of variable length and 64-bit offsets. */
  public static LargeBinary = new PhysicalType(
    __PhysicalTypeVariants.LargeBinary
  );
  /** A variable-length string in Unicode with UTF-8 encoding. */
  public static Utf8 = new PhysicalType(__PhysicalTypeVariants.Utf8);
  /** An unsigned 64-bit integer. */
  public static LargeUtf8 = new PhysicalType(__PhysicalTypeVariants.LargeUtf8);
  /** A list of some data type with variable length. */
  public static List = new PhysicalType(__PhysicalTypeVariants.List);
  /** A list of some data type with fixed length */
  public static FixedSizeList = new PhysicalType(
    __PhysicalTypeVariants.FixedSizeList
  );
  /** A list of some data type with variable length and 64-bit offsets. */
  public static LargeList = new PhysicalType(__PhysicalTypeVariants.LargeList);
  /** A nested type that contains an arbitrary number of fields. */
  public static Struct = new PhysicalType(__PhysicalTypeVariants.Struct);
  /** A nested type that represents slots of differing types. */
  public static Union = new PhysicalType(__PhysicalTypeVariants.Union);
  /** A nested type. */
  public static Map = new PhysicalType(__PhysicalTypeVariants.Map);
  /** A dictionary encoded array by `IntegerType`. */
  public static Dictionary(integerType: IntegerType) {
    return new PhysicalType(__PhysicalTypeVariants.Dictionary(integerType));
  }

  /** Whether this physical type equals [`PhysicalType::Primitive`] of type `primitive`. */
  public eqPrimitive(primitive: PrimitiveType): boolean {
    // return true;
    if (this.__inner.inner === (__PhysicalTypeVariants.Primitive as any)()) {
      return (this.__inner.data as PrimitiveType).equals(primitive);
    } else {
      return false;
    }
  }
}
