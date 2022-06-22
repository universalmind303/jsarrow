import { Vec } from "../index";
import { Bitmap } from "../../bitmap/immutable";
import { DataType } from "../../datatypes/index";
import { ArrowError } from "../../error";
import { Offset } from "../../types/offset";

type OffsetType<O> = O extends Offset.I32 ? Int32Array : BigInt64Array;

export abstract class Utf8Vec<O extends Offset> extends Vec {
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
  ): O extends Int32Array ? Utf8Vec<Offset.I32> : Utf8Vec<Offset.I64> {

    if (validity && validity.length !== offsets.length - 1) {
      throw ArrowError.OutOfSpec(
        "validity mask length must match the number of values"
      );
    }

    if (
      !data_type
        .toPhysicalType()
        .equals(Utf8Vec.arr_to_dtype(offsets).toPhysicalType())
    ) {
      throw ArrowError.OutOfSpec(
        "Utf8Vec can only be initialized with a DataType whose physical type is Utf8"
      );
    }
    if (offsets instanceof Int32Array) {
      return new Utf8Impl(data_type, offsets, values, validity) as any;
    } else {
      return new LargeUtf8Impl(data_type, offsets, values, validity) as any;
    }
  }
  constructor(
    data_type: DataType,
    offsets: OffsetType<O>,
    values,
    validity: Bitmap | null = null
  ) {
    super(data_type);
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
    console.log({ slice });
    return String.fromCharCode(...slice);
  }
}

class Utf8Impl extends Utf8Vec<Offset.I32> {
  protected default_data_type(): DataType {
    return DataType.Utf8;
  }
}

class LargeUtf8Impl extends Utf8Vec<Offset.I64> {
  protected default_data_type(): DataType {
    return DataType.LargeUtf8;
  }
}
