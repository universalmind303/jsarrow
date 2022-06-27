export const BIT_MASK = [1, 2, 4, 8, 16, 32, 64, 128] as const;
export const UNSET_BIT_MASK = [
  255 - 1,
  255 - 2,
  255 - 4,
  255 - 8,
  255 - 16,
  255 - 32,
  255 - 64,
  255 - 128,
] as const;
export function packBools(values: Iterable<any>) {
  const xs: number[] = [];
  let i = 0,
    bit = 0,
    byte = 0;
  for (const value of values) {
    value && (byte |= 1 << bit);
    if (++bit === 8) {
      xs[i++] = byte;
      byte = bit = 0;
    }
  }
  if (i === 0 || bit > 0) {
    xs[i++] = byte;
  }
  const b = new Uint8Array((xs.length + 7) & ~7);
  b.set(xs);
  return b;
}
export function is_set(byte: number, i): boolean {
  return (byte & BIT_MASK[i]) !== 0;
}
export function get_bit(bytes: any, i: number): boolean {
  return (bytes[i >> 3] & BIT_MASK[i % 8]) !== 0;
}

/** @ignore */
export function getBool(_data: any, _index: number, byte: number, bit: number) {
  return (byte & (1 << bit)) !== 0;
}

/** @ignore */
export function getBit(
  _data: any,
  _index: number,
  byte: number,
  bit: number
): 0 | 1 {
  return ((byte & (1 << bit)) >> bit) as 0 | 1;
}

export function set(byte, i, value) {
  if (value) {
    return byte | BIT_MASK[i];
  } else {
    return byte & UNSET_BIT_MASK[i];
  }
}
/** @ignore */
export function setBool(bytes: Uint8Array, index: number, value: any) {
  return value
    ? !!(bytes[index >> 3] |= 1 << index % 8) || true
    : !(bytes[index >> 3] &= ~(1 << index % 8)) && false;
}
/** @ignore */
export class BitIterator<T> implements IterableIterator<T> {
  bit: number;
  byte: number;
  byteIndex: number;
  index: number;

  constructor(
    private bytes: Uint8Array,
    begin: number,
    private length: number,
    private context: any,
    private get: (context: any, index: number, byte: number, bit: number) => T
  ) {
    this.bit = begin % 8;
    this.byteIndex = begin >> 3;
    this.byte = bytes[this.byteIndex++];
    this.index = 0;
  }

  next(): IteratorResult<T> {
    if (this.index < this.length) {
      if (this.bit === 8) {
        this.bit = 0;
        this.byte = this.bytes[this.byteIndex++];
      }
      return {
        value: this.get(this.context, this.index++, this.byte, this.bit++),
      };
    }
    return { done: true, value: null };
  }

  [Symbol.iterator]() {
    return this;
  }
}

/**
 * Compute the population count (the number of bits set to 1) for a range of bits in a Uint8Array.
 * @param vector The Uint8Array of bits for which to compute the population count.
 * @param lhs The range's left-hand side (or start) bit
 * @param rhs The range's right-hand side (or end) bit
 */
/** @ignore */
export function popcnt_bit_range(
  data: Uint8Array,
  lhs: number,
  rhs: number
): number {
  if (rhs - lhs <= 0) {
    return 0;
  }
  // If the bit range is less than one byte, sum the 1 bits in the bit range
  if (rhs - lhs < 8) {
    let sum = 0;
    for (const bit of new BitIterator(data, lhs, rhs - lhs, data, getBit)) {
      sum += bit;
    }
    return sum;
  }
  // Get the next lowest multiple of 8 from the right hand side
  const rhsInside = (rhs >> 3) << 3;
  // Get the next highest multiple of 8 from the left hand side
  const lhsInside = lhs + (lhs % 8 === 0 ? 0 : 8 - (lhs % 8));
  return (
    // Get the popcnt of bits between the left hand side, and the next highest multiple of 8
    popcnt_bit_range(data, lhs, lhsInside) +
    // Get the popcnt of bits between the right hand side, and the next lowest multiple of 8
    popcnt_bit_range(data, rhsInside, rhs) +
    // Get the popcnt of all bits between the left and right hand sides' multiples of 8
    popcnt_array(data, lhsInside >> 3, (rhsInside - lhsInside) >> 3)
  );
}
/** @ignore */
export function popcnt_array(
  arr: ArrayBufferView,
  byteOffset?: number,
  byteLength?: number
) {
  let cnt = 0,
    pos = Math.trunc(byteOffset!);
  const view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);

  const len = byteLength === void 0 ? arr.byteLength : pos + byteLength;
  while (len - pos >= 4) {
    cnt += popcnt_uint32(view.getUint32(pos));
    pos += 4;
  }
  while (len - pos >= 2) {
    cnt += popcnt_uint32(view.getUint16(pos));
    pos += 2;
  }
  while (len - pos >= 1) {
    cnt += popcnt_uint32(view.getUint8(pos));
    pos += 1;
  }
  return cnt;
}

export function popcnt_uint32(uint32: number): number {
  let i = Math.trunc(uint32);
  i = i - ((i >>> 1) & 0x55555555);
  i = (i & 0x33333333) + ((i >>> 2) & 0x33333333);
  return (((i + (i >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
}

export function count_zeros(slice, offset: number, len: number): number {
  if (len === 0) {
    return 0;
  }
  offset = offset % 8;
  return len - popcnt_bit_range(slice, offset, offset + len);
}
