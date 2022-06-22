import { TypedArray } from "../interfaces";

export class Reader {
  #pos: number;
  #buf: TypedArray;

  public static fromBuffer(buffer: Buffer): Reader {
    return new Reader(0, buffer);
  }

  private constructor(pos: number, buf: Buffer) {
    this.#buf = buf;
    this.#pos = 0;
  }

  get byteSize() {
    return this.#buf.BYTES_PER_ELEMENT;
  }

  get buffer() {
    return this.#buf;
  }

  seek(pos: number | bigint) {
    if (typeof pos === "bigint") {
      pos = Number(pos);
    }
    this.#pos = pos;
  }
  /**
   * copies data from internal buffer into <buffer>.
   *
   * @param buffer buffer to copy data into.
   */
  read_exact<T extends TypedArray>(buffer: T) {
    if (buffer instanceof BigInt64Array) {
      // cast the bigint buffer to a 'Buffer' <zero-copy>
      // get the slice from the main buffer <zero-copy>
      // transfer from main buffer to 'Buffer' representation of the bigint

      const tmp = Buffer.from(buffer.buffer);
      const s = this.#buf.subarray(this.#pos, (this.#pos += tmp.length));
      tmp.set(s as any, 0);
    } else {
      buffer.set(
        this.#buf.subarray(this.#pos, (this.#pos += buffer.length)),
        0
      );
    }
  }
}
