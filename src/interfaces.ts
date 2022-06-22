export type _TypedArray =
  | Int8Array
  | Int16Array
  | Int32Array
  | BigInt64Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | BigUint64Array
  | Float32Array
  | Float64Array;

export interface TypedArray {
  readonly length: number;
  /**
   * The size in bytes of each element in the array.
   */
  readonly BYTES_PER_ELEMENT: number;

  /**
   * The ArrayBuffer instance referenced by the array.
   */
  readonly buffer: ArrayBufferLike;

  /**
   * The length in bytes of the array.
   */
  readonly byteLength: number;

  /**
   * The offset in bytes of the array.
   */
  readonly byteOffset: number;

  /**
   * Gets a new Uint32Array view of the ArrayBuffer store for this array, referencing the elements
   * at begin, inclusive, up to end, exclusive.
   * @param begin The index of the beginning of the array.
   * @param end The index of the end of the array.
   */
  subarray(begin?: number, end?: number): TypedArray;

  /**
   * Sets a value or an array of values.
   * @param array A typed or untyped array of values to set.
   * @param offset The index in the current array at which the values are to be written.
   */
  set(array: any, offset?: number): void;
  [index: number]: number | bigint;
}

export interface TypedArrayConstructor<T extends TypedArray> {
  new(length?: number): T;

  /**
   * Creates an array from an array-like or iterable object.
   * @param arrayLike An array-like or iterable object to convert to an array.
   * @param mapfn A mapping function to call on every element of the array.
   * @param thisArg Value of 'this' used to invoke the mapfn.
   */
  from(...args: any[]): T;
  /**
   * The size in bytes of each element in the array.
   */
  readonly BYTES_PER_ELEMENT: number;
}

export type NativeArrayType = TypedArray | number[] | bigint[];
