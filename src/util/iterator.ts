export interface IterableVector<T> {
  values(): IterableIterator<T | null>
  [Symbol.iterator](): IterableIterator<T | null>
  toArray(): Array<T | null>

}
export interface DoubleEndedIterator<T> extends IterableIterator<T> {
  nextBack(): IteratorResult<T | null>;
}


export interface ExtendedIterator<T> extends IterableIterator<T> {
  sizeHint(): [number, number | null];
}
