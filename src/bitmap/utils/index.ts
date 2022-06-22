export const BIT_MASK = Uint8Array.from([1, 2, 4, 8, 16, 32, 64, 128]);
export const UNSET_BIT_MASK = Uint8Array.from([
  255 - 1,
  255 - 2,
  255 - 4,
  255 - 8,
  255 - 16,
  255 - 32,
  255 - 64,
  255 - 128,
]);

export function is_set(byte: number, i): boolean {
  return (byte & BIT_MASK[i]) !== 0;
}
export function get_bit(bytes: ArrayBuffer, i: number): boolean {

  return is_set(bytes[i / 8], i % 8);
}
export function count_zeros(
  slice: ArrayBuffer,
  offset: number,
  len: number
): number {
  if (len === 0) {
    return 0;
  }
  slice = slice.slice(offset / 8, (offset + len + 7) / 8);
  offset = offset % 8;

  if (offset + len / 8 === 0) {
    let buf = Buffer.from(slice, 0);
    let byte = (slice[0] >> offset) << (8 - len);
    // console.log({ buf, byte });
  }
  // console.log({ slice: JSON.stringify(slice), offset, len });
  return null as any;
}

const slice = [0, 1, 0, 1, 1, 1, 1, 0];

count_zeros(Buffer.from(slice), 0, 8);
