import { Vec } from "../index";
import { Bitmap } from "../../bitmap/immutable";
import { DataType } from "../../datatypes/index";
import { ArrowError } from "../../error";
import { Offset } from "../../types/offset";
import { unwrap } from "../../util/fp";

type OffsetType<O> = O extends Offset.I32 ? Int32Array : BigInt64Array;

export abstract class Utf8Vec<O extends Offset> extends Vec implements Vec {
  __data_type: DataType;

  #validity: Bitmap | null;
  #values: Buffer;
  #offsets: OffsetType<O>;

  private static arr_to_dtype(arr: Int32Array | BigInt64Array): DataType {
    if (arr instanceof Int32Array) {
      return DataType.Utf8;
    } else {
      return DataType.LargeUtf8;
    }
  }

  static try_new<O extends Int32Array | BigInt64Array>(
    data_type: DataType,
    offsets: O,
    values: Buffer,
    validity: Bitmap | null
  ):
    | (O extends Int32Array ? Utf8Vec<Offset.I32> : Utf8Vec<Offset.I64>)
    | Error {
    if (validity && validity.length !== offsets.length - 1) {
      return ArrowError.OutOfSpec(
        "validity mask length must match the number of values"
      );
    }

    if (
      !data_type
        .toPhysicalType()
        .equals(Utf8Vec.arr_to_dtype(offsets).toPhysicalType())
    ) {
      return ArrowError.OutOfSpec(
        "Utf8Vec can only be initialized with a DataType whose physical type is Utf8"
      );
    }
    if (offsets instanceof Int32Array) {
      return new Utf8Impl(data_type, offsets, values, validity) as any;
    } else {
      return new LargeUtf8Impl(data_type, offsets, values, validity) as any;
    }
  }

  static create<O extends Int32Array | BigInt64Array>(
    data_type: DataType,
    offsets: OffsetType<O>,
    values,
    validity: Bitmap | null = null
  ): O extends Int32Array ? Utf8Vec<Offset.I32> : Utf8Vec<Offset.I64> {
    return unwrap(Utf8Vec.try_new(data_type, offsets, values, validity)) as any;
  }

  constructor(
    data_type: DataType,
    offsets: OffsetType<O>,
    values,
    validity: Bitmap | null = null
  ) {
    super();
    this.__data_type = data_type;
    this.#offsets = offsets;
    this.#validity = validity;
    this.#values = values;
  }

  value(i: number): string | null {
    if (this.#validity?.get_bit(i)) {
      return null;
    }
    const start = this.#offsets[i];
    const end = this.#offsets[i + 1];
    const slice = this.#values.slice(Number(start), Number(end));
    return String.fromCharCode(...slice);
  }

  len(): number {
    return this.#offsets.length - 1;
  }
  validity(): Bitmap | null {
    return this.#validity;
  }
  slice(offset: number, length: number): ThisType<this> {
    return this.slice_unchecked(offset, length);
  }

  slice_unchecked(offset, length) {
    let validity = this.#validity?.slice_unchecked(offset, length) ?? null;
    let offsets = this.#offsets.slice(offset, length) as any;
    return Utf8Vec.create(this.__data_type, offsets, this.#values, validity);
  }
}

class Utf8Impl extends Utf8Vec<Offset.I32> {
  protected variant = "Utf8Vec";

  protected default_data_type(): DataType {
    return DataType.Utf8;
  }
}

class LargeUtf8Impl extends Utf8Vec<Offset.I64> {
  protected variant = "LargeUtf8Vec";

  protected default_data_type(): DataType {
    return DataType.LargeUtf8;
  }
}
