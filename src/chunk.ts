import { Vec } from "jsarrow/src/array/index";
import { ArrowError } from "jsarrow";
import { unwrap } from "jsarrow/src/util/fp";

export class Chunk<T extends Vec> {
  #arrays: T[];

  private constructor(arrays: T[]) {
    this.#arrays = arrays;
  }

  public static create<T extends Vec>(arrays: T[]): Chunk<T> {
    return unwrap(Chunk.try_new(arrays));
  }

  public static try_new<T extends Vec>(arrays: T[]): Chunk<T> | Error {
    console.log({ arrays });
    if (arrays.length !== 0) {
      let len = arrays[0].length;
      if (arrays.some((arr) => arr.length !== len)) {
        return ArrowError.InvalidArgumentError(
          "Chunk requires all arrays to have an equal number of items"
        );
      }
    }
    return new Chunk(arrays);
  }
  arrays() {
    return this.#arrays;
  }
  columns() {
    return this.#arrays;
  }
  len() {
    return this.#arrays[0].length;
  }
  is_empty() {
    this.len() === 0;
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return {
      length: this.len(),
      arrays: this.#arrays,
    };
  }
}
