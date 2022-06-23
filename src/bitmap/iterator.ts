import assert from "assert";
import { get_bit } from "jsarrow/src/bitmap/utils/index";
import { DoubleEndedIterator } from "jsarrow/util/iterator";

export class BitmapIter implements DoubleEndedIterator<boolean | null> {
  #bytes: ArrayBuffer;
  #index: number;
  #end: number;

  constructor(slice: ArrayBuffer, offset: number, len: number) {
    let bytes = slice.slice(offset / 8);
    let idx = offset % 8;
    let end = len + idx;
    assert(end <= bytes.byteLength * 8);

    this.#bytes = bytes;
    this.#index = idx;
    this.#end = end;
  }

  next(): IteratorResult<boolean, null> {
    if (this.#index === this.#end) {
      return {
        done: true,
        value: null,
      };
    } else {
      const old = this.#index;
      this.#index += 1;
      return {
        done: false,
        value: get_bit(this.#bytes, old),
      };
    }
  }
  nextBack(): IteratorResult<boolean | null, null> {
    if (this.#index === this.#end) {
      return {
        done: true,
        value: null,
      };
    } else {
      this.#end -= 1;
      return {
        done: false,
        value: get_bit(this.#bytes, this.#end),
      };
    }
  }

  [Symbol.iterator](): BitmapIter {
    return this;
  }
}
