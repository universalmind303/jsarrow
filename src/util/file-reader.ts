import { TypedArray } from "../interfaces";

export class Reader {
  private _position: number;
  private __buf: Buffer;

  public static fromBuffer(buffer: Buffer): Reader {
    return new Reader(0, buffer);
  }

  private constructor(pos: number, buf: Buffer) {
    this.__buf = buf;
    this._position = 0;
  }

  get bytes() {
    return this.__buf.buffer;
  }

  seek(pos: number | bigint) {
    if (typeof pos === "bigint") {
      pos = Number(pos);
    }
    this._position = pos;
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
      const s = this.__buf.subarray(
        this._position,
        (this._position += tmp.length)
      );
      tmp.copy(s, 0);
      // tmp.set(s as any, 0);
    } else {
      buffer.set(
        this.__buf.subarray(this._position, (this._position += buffer.length)),
        0
      );
    }
  }
}
