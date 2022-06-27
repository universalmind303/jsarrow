import { BitmapIter } from "../iterator";

export class ZipValidity<T, I extends IterableIterator<T>>
  implements IterableIterator<T | null>
{
  _values: I;
  _validity_iter: BitmapIter;
  _has_validity: boolean;

  constructor(values: I, validity: BitmapIter | null) {
    this._values = values;
    this._has_validity = validity !== null;
    this._validity_iter =
      validity ?? new BitmapIter(new Int8Array().buffer, 0, 0);
  }
  next(): IteratorResult<T | null, null> {
    if (!this._has_validity) {
      return this._values.next();
    } else {
      let validity = this._validity_iter.next();
      if (validity.done) {
        return validity;
      }
      if (validity.value) {
        return this._values.next();
      }
      return {
        value: null,
      };
    }
  }
  [Symbol.iterator]() {
    return this;
  }
}

type ImplicitIterator<T> =
  | T
  | {
      [Symbol.iterator](): T;
    };

export function zipValidity<
  T,
  I extends ImplicitIterator<IterableIterator<T>> = ImplicitIterator<
    IterableIterator<T>
  >
>(values: I, validity: BitmapIter | null): ZipValidity<T, IterableIterator<T>> {
  if ("next" in values) {
    return new ZipValidity(values, validity);
  }
  return new ZipValidity(values[Symbol.iterator](), validity);
}
