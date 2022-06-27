import assert from "assert";
import { get_bit } from "../bitmap/utils/index";
import { DoubleEndedIterator } from "../util/iterator";

export class BitmapIter implements DoubleEndedIterator<boolean | null> {
  _bytes: ArrayBuffer;
  _index: number;
  _end: number;

  constructor(slice, offset: number, len: number) {
    let bytes = slice.subarray(offset / 8);
    let idx = offset % 8;
    let end = len + idx;
    assert(end <= bytes.byteLength * 8);

    this._bytes = bytes;
    this._index = idx;
    this._end = end;
  }

  next(): IteratorResult<boolean, null> {
    if (this._index === this._end) {
      return {
        done: true,
        value: null,
      };
    } else {
      return {
        done: false,
        value: get_bit(this._bytes, this._index++),
      };
    }
  }
  nextBack(): IteratorResult<boolean | null, null> {
    if (this._index === this._end) {
      return {
        done: true,
        value: null,
      };
    } else {
      return {
        done: false,
        value: get_bit(this._bytes, this._end--),
      };
    }
  }

  [Symbol.iterator](): BitmapIter {
    return this;
  }
}
