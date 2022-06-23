import { count_zeros, get_bit } from "./utils/index";
import { ArrowError } from "../error";
import { TypedArray } from "../interfaces";
import { BitmapIter } from "jsarrow/src/bitmap/iterator";

export class Bitmap {
  #bytes: ArrayBuffer;
  #offset: number;
  #length: number;
  #null_count: number;

  constructor(bytes, offset, length, null_count) {
    this.#bytes = bytes;
    this.#offset = offset;
    this.#length = length;
    this.#null_count = null_count;
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
    return new Bitmap(bytes, 0, length, 0);
  }

  get length() {
    return this.#length;
  }
  get_bit(idx: number): boolean {
    return get_bit(this.#bytes, this.#offset + idx);
  }

  is_empty(): boolean {
    return this.#length === 0;
  }
  as_slice(): [ArrayBuffer, number, number] {
    let start = this.#offset / 8;
    let len = ((this.#offset % 8) + this.#length + 7) / 8;
    return [this.#bytes.slice(start, len), this.#offset % 8, this.length];
  }
  null_count() {
    return this.#null_count;
  }

  slice_unchecked(offset: number, length: number): this {
    if (length < this.#length / 2) {
      this.#null_count = count_zeros(
        this.#bytes,
        this.#offset + offset,
        length
      );
    } else {
      let start_end = this.#offset + offset + length;
      let head_count = count_zeros(this.#bytes, this.#offset, offset);
      let tail_count = count_zeros(
        this.#bytes,
        start_end,
        this.#length - length
      );
      this.#null_count -= head_count + tail_count;
    }

    this.#offset += offset;
    this.#length = length;

    return this;
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return {
      bytes: this.#bytes,
      offset: this.#offset,
      length: this.length,
      null_count: this.#null_count,
    };
  }
  
  values(): BitmapIter {
    return new BitmapIter(this.#bytes, this.#offset, this.#length);
  }

  [Symbol.iterator](): BitmapIter {
    return this.values();
  }
}
