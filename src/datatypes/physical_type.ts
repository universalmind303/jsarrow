import { FunctionalEnum } from "../util/enum_impl";
import { PrimitiveType } from "../types/index";

function Int(variant): IntegerType {
  return new (class extends IntegerType {
    protected variant = variant;
  })();
}

export abstract class IntegerType extends FunctionalEnum {
  protected identity = "IntegerType";
  protected inner = null;
  /** A signed 8-bit integer. */
  public static get Int8() {
    return Int("Int8");
  }
  /** A signed 16-bit integer. */
  public static get Int16() {
    return Int("Int16");
  }
  /** A signed 32-bit integer. */
  public static get Int32() {
    return Int("Int32");
  }
  /** A signed 64-bit integer. */
  public static get Int64() {
    return Int("Int64");
  }
  /** An unsigned 8-bit integer. */
  public static get UInt8() {
    return Int("UInt8");
  }
  /** An unsigned 16-bit integer. */
  public static get UInt16() {
    return Int("UInt16");
  }
  /** An unsigned 32-bit integer. */
  public static get UInt32() {
    return Int("UInt32");
  }
  /** An unsigned 64-bit integer. */
  public static get UInt64() {
    return Int("UInt64");
  }
  public into<T>(this: IntegerType, intoClass): T {
    return (intoClass as any).from(this);
  }
}

function PType(variant, data: any = null): PhysicalType {
  return new (class extends PhysicalType {
    protected variant = variant;
    protected get inner() {
      return data;
    }
  })();
}

export abstract class PhysicalType extends FunctionalEnum {
  protected identity = "PhysicalType";
  protected abstract variant: string;

  /** A Null with no allocation. */
  public static get Null() {
    return PType("Null");
  }
  /** A boolean represented as a single bit. */
  public static get Boolean() {
    return PType("Boolean");
  }
  /** An array where each slot has a known compile-time size. */
  public static Primitive(primitiveType: PrimitiveType) {
    return PType("Primitive", primitiveType);
  }
  /** Opaque binary data of variable length. */
  public static get Binary() {
    return PType("Binary");
  } /** Opaque binary data of fixed size. */
  public static get FixedSizeBinary() {
    return PType("FixedSizeBinary");
  }
  /** Opaque binary data of variable length and 64-bit offsets. */
  public static get LargeBinary() {
    return PType("LargeBinary");
  }
  /** A variable-length string in Unicode with UTF-8 encoding. */
  public static get Utf8() {
    return PType("Utf8");
  }
  /** An unsigned 64-bit integer. */
  public static get LargeUtf8() {
    return PType("LargeUtf8");
  }
  /** A list of some data type with variable length. */
  public static get List() {
    return PType("List");
  }
  /** A list of some data type with fixed length */
  public static get FixedSizeList() {
    return PType("FixedSizeList");
  }
  /** A list of some data type with variable length and 64-bit offsets. */
  public static get LargeList() {
    return PType("LargeList");
  }
  /** A nested type that contains an arbitrary number of fields. */
  public static get Struct() {
    return PType("Struct");
  }
  /** A nested type that represents slots of differing types. */
  public static get Union() {
    return PType("Union");
  }
  /** A nested type. */
  public static get Map() {
    return PType("Map");
  }
  /** A dictionary encoded array by `IntegerType`. */
  public static Dictionary(integerType: IntegerType) {
    return PType("Dictionary", integerType);
  }
  /** Whether this physical type equals [`PhysicalType::Primitive`] of type `primitive`. */
  public eqPrimitive(primitive: PrimitiveType): boolean {
    if (this.variant === "Primitive") {
      return this.inner![0].equals(primitive);
    } else {
      return false;
    }
  }
}
