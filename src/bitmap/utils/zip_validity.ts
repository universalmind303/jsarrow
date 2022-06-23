import { BitmapIter } from "jsarrow/src/bitmap/iterator";

export class ZipValidity<T, I extends IterableIterator<T>>
  implements IterableIterator<T | null>
{
  #values: I;
  #validity_iter: BitmapIter;
  #has_validity: boolean;

  constructor(values: I, validity: BitmapIter | null) {
    this.#values = values;
    this.#has_validity = validity !== null;
    this.#validity_iter =
      validity ?? new BitmapIter(new Int8Array().buffer, 0, 0);
  }
  next(): IteratorResult<T | null, null> {
    if (!this.#has_validity) {
      return this.#values.next();
    } else {
      const { value: is_valid, done } = this.#validity_iter.next();
      const { value } = this.#values.next();
      if (is_valid) {
        return {
          done,
          value,
        };
      } else {
        return {
          done,
          value: null,
        };
      }
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
