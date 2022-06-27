import { count_zeros, get_bit } from "./utils/index";
import { ArrowError } from "../error";
import { TypedArray } from "../interfaces";
import { BitmapIter } from "../bitmap/iterator";

export class Bitmap {
  __bytes: ArrayBuffer;
  __offset: number;
  __length: number;
  __null_count: number;

  constructor(bytes, offset, length, null_count) {
    this.__bytes = bytes;
    this.__offset = offset;
    this.__length = length;
    this.__null_count = null_count;
  }

  public static empty() {
    return new Bitmap(Uint8Array.from([]), 0, 0, 0);
  }

  public static new_zeroed(length: number): Bitmap {
    let bytes = Uint8Array.from({ length: length * 8 });
    return new Bitmap(bytes, 0, length, 0);
  }

  public static try_new(bytes: TypedArray, length: number): Bitmap | Error {
    if (length > bytes.length * 8) {
      return ArrowError.OutOfSpec(
        `the length of the bitmap (${length}) must be <= to the number of bytes * 8 (${
          bytes.length * 8
        })`
      );
    }
    let null_count = count_zeros(bytes as any, 0, length);
    return new Bitmap(bytes, 0, length, null_count);
  }

  get length() {
    return this.__length;
  }
  
  get_bit(idx: number): boolean {
    return get_bit(this.__bytes, this.__offset + idx);
  }

  is_empty(): boolean {
    return this.__length === 0;
  }
  as_slice(): [ArrayBuffer, number, number] {
    let start = this.__offset / 8;
    let len = ((this.__offset % 8) + this.__length + 7) / 8;
    return [this.__bytes.slice(start, len), this.__offset % 8, this.length];
  }
  null_count() {
    return this.__null_count;
  }

  slice_unchecked(offset: number, length: number): this {
    if (length < this.__length / 2) {
      this.__null_count = count_zeros(
        this.__bytes,
        this.__offset + offset,
        length
      );
    } else {
      let start_end = this.__offset + offset + length;
      let head_count = count_zeros(this.__bytes, this.__offset, offset);
      let tail_count = count_zeros(
        this.__bytes,
        start_end,
        this.__length - length
      );
      this.__null_count -= head_count + tail_count;
    }

    this.__offset += offset;
    this.__length = length;

    return this;
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return {
      bytes: this.__bytes,
      offset: this.__offset,
      length: this.length,
      null_count: this.__null_count,
    };
  }

  values(): BitmapIter {
    return new BitmapIter(this.__bytes, this.__offset, this.__length);
  }

  [Symbol.iterator](): BitmapIter {
    return this.values();
  }
}
