import { Vec } from "../index";
import { Bitmap } from "../../bitmap/immutable";
import { DataType } from "../../datatypes/index";
import { ArrowError } from "../../error";
import { Offset } from "../../types/offset";

// function isAscii(buf) {
//   var isAscii = true;
//   for (var i = 0, len = buf.length; i < len; i++) {
//     if (buf[i] > 127) {
//       isAscii = false;
//       break;
//     }
//   }
// }
// function try_check_offsets_and_utf8<O>(offsets: O[], values: Uint8Array) {
//   const te = new TextDecoder("ascii");

//   if(isAscii(values.buffer)) {

//   }
//   const b = Buffer.from(values.buffer);
//   const x = offsets[0];
//   return null as any;
// }
// try_check_offsets_and_utf8([1, 2, 3], Uint8Array.from([1, 2, 3]));

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
    if (validity && validity.length !== values.length) {
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
    // return new PrimitiveVec(data_type, values, validity);
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
  value(i: number): string {
    const start = this.#offsets[i];
    const end = this.#offsets[i + 1];
    const slice = this.#values.slice(Number(start), Number(end));
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
