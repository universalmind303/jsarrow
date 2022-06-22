import os from 'os'

export function is_native_little_endian() {
  return os.endianness() === 'LE'
}