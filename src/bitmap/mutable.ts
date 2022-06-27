import { count_zeros, get_bit, set } from "./utils/index";
import { ArrowError } from "../error";
import { BitmapIter } from "../bitmap/iterator";
import { unwrap } from "../util/fp";

export class MutableBitmap {
  constructor(private buffer: Buffer, private length: number) {}
  public static empty() {
    return new MutableBitmap(Buffer.alloc(0), 0);
  }

  resize(n = 1) {
    const buf = Buffer.alloc(this.buffer.length + n);

    buf.set(this.buffer, 0);
    this.buffer = buf;
  }
  push(value: boolean) {
    const byteOffset = this.length % 8;
    const bitOffset = this.length >> 3;

    if (byteOffset === 0 && bitOffset >= this.buffer.length) {
      this.resize();
    }

    this.buffer[bitOffset] = set(this.buffer[bitOffset], byteOffset, value);

    this.length++;
  }

  /// Returns the capacity of [`MutableBitmap`] in number of bits.
  capacity() {
    return this.buffer.byteLength * 8;
  }
  clear() {
    this.length = 0;
    this.buffer = Buffer.alloc(0);
  }

  nullCount() {
    return count_zeros(this.buffer, 0, this.length);
  }
  values(): BitmapIter {
    return new BitmapIter(this.buffer, 0, this.length);
  }
  shrinkToFit() {
    if (this.capacity() > this.length) {
      this.buffer = this.buffer.subarray(0, ((this.length + 7) & ~7) >> 3);
    }
  }

  [Symbol.iterator](): BitmapIter {
    return this.values();
  }
}

export namespace MutableBitmap {
  function tryNew(buffer: Buffer, length: number): MutableBitmap | ArrowError {
    if (length > buffer.length) {
      return ArrowError.InvalidArgumentError(
        "The length of the bitmap must be <= to the number of bytes * 8"
      );
    }
    return new MutableBitmap(buffer, length);
  }

  function* boolsToBytes(iterable) {
    const iter = iterable[Symbol.iterator]();

    let length = 0;

    let exhausted = false;
    let byte_accum = 0;
    let mask = 1;
    while (true) {
      while (mask != 0) {
        let next = iter.next();
        length++;
        if (next.done) {
          exhausted = true;
          break;
        }

        (byte_accum |= next.value ? mask : 0), (mask <<= 1);

        if (length % 8 === 0) {
          yield byte_accum;
          byte_accum = 0;
          mask = 1;
        }
      }
      if (exhausted && mask === 1) {
        break;
      }

      yield byte_accum;

      if (exhausted) {
        break;
      }
    }
  }
  export function fromIterable(arrayLike: Iterable<boolean>): MutableBitmap {
    const bools = Uint8Array.from(boolsToBytes(arrayLike));
    console.log({ bools });
    return from(bools, bools.length);
  }

  // export function from(buffer: WithImplicitCoercion<ArrayBuffer>): MutableBitmap
  // export function from(arrayLike: Iterable<boolean>): MutableBitmap
  export function from(buf, length: number): MutableBitmap {
    // if(buf?.buffer) {
    return unwrap(tryNew(Buffer.from(buf!.buffer), length));
    // } else if {
    //   b
    // }
  }
  /** Initializes a pre-allocated [`MutableBitmap`] with capacity for `capacity` bits. */
  export function alloc(capacity: number): MutableBitmap {
    let bytes = Buffer.alloc(Math.ceil(capacity / 8));
    return new MutableBitmap(bytes as any, 0);
  }
}

const mutablebitmap = MutableBitmap.fromIterable([
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
]) as any;

console.log(...mutablebitmap.values());
