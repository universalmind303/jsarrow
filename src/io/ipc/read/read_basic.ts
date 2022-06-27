import { Bitmap } from "../../../bitmap/immutable";
import { Reader } from "../../../util/file-reader";
import { ArrowError } from "../../../error";
import { TypedArray, TypedArrayConstructor } from "../../../interfaces";
import { is_native_little_endian } from "../../../io/ipc/endianness";
import { Compression, Node } from "../../../io/ipc/read/index";
import { Deserializer } from "./deserialize";

/**
 *
 *
 * @param typedArray buffer type
 * @returns returns a new TypedArray of given type filled with data from the reader.
 */
function read_uncompressed_buffer<T extends TypedArray>(
  typedArray: TypedArrayConstructor<T>
) {
  return function (
    mutable_reader: Reader,
    buffer_length: bigint,
    length: bigint,
    is_little_endian: boolean
  ): T {
    let bytes = Number(length) * typedArray.BYTES_PER_ELEMENT;
    if (bytes > buffer_length) {
      throw ArrowError.OutOfSpec(`The slots of the array times the physical size must 
      be smaller or equal to the length of the IPC buffer. 
      However, this array reports ${length} slots, which, for physical type "${typedArray.name}", corresponds to ${bytes} bytes, 
      which is larger than the buffer length ${buffer_length}",`);
    }

    let buffer = new typedArray(Number(length));

    if (is_little_endian === is_native_little_endian()) {
      mutable_reader.read_exact(buffer);
      return buffer as any;
    }
    return null as any;
  };
}

function read_compressed_buffer<T extends TypedArray>(
  typedArray: TypedArrayConstructor<T>
) {
  return function (
    mutable_reader: Reader,
    buffer_length: bigint,
    length: bigint,
    is_little_endian: boolean,
    compression: Compression
  ): T {
    throw ArrowError.NotYetImplemented();
  };
}

export function readBuffer<T extends TypedArray>(
  this: Deserializer,
  typedArray: TypedArrayConstructor<T>,
  length: bigint
) {
  let buf = this.mutable_buffers.shift();
  if (!buf) {
    throw new Error("IPC: unable to fetch a buffer. The file is corrupted.");
  }
  buf = buf!;

  this.reader.seek(this.block_offset + buf.offset());
  let buffer_length = buf.length();
  if (this.compression !== null) {
    return read_compressed_buffer(typedArray)(
      this.reader,
      buffer_length,
      length,
      this.is_little_endian,
      this.compression!
    );
  } else {
    return read_uncompressed_buffer(typedArray)(
      this.reader,
      buffer_length,
      length,
      this.is_little_endian
    );
  }
}
export function readBitmap(this: Deserializer, length: bigint): Bitmap {
  let buf = this.mutable_buffers.shift();
  if (!buf) {
    throw new Error("IPC: unable to fetch a buffer. The file is corrupted.");
  }
  this.reader.seek(this.block_offset + buf.offset());
  let bytes = buf.length();
  buf = buf!;

  let buffer;
  if (this.compression) {
    buffer = read_compressed_bitmap(
      length,
      bytes,
      this.compression,
      this.reader
    );
  } else {
    buffer = read_uncompressed_bitmap(length, bytes, this.reader);
  }
  const bitmap = Bitmap.try_new(buffer, Number(length));

  if (bitmap instanceof Error) {
    throw bitmap;
  }
  return bitmap;
}

function read_uncompressed_bitmap(
  length: bigint,
  bytes: bigint,
  mutable_reader: Reader
): Uint8Array {
  if (length > bytes * 8n) {
    throw ArrowError.OutOfSpec(
      `An array requires a bitmap with at least the same number of bits as slots` +
        `However, this array reports ${length} slots but the the bitmap in IPC only contains` +
        `${bytes * 8n} bits`
    );
  }

  let buffer = Buffer.alloc(Number(bytes));
  mutable_reader.read_exact(buffer);
  return new Uint8Array(buffer.buffer);
}

function read_compressed_bitmap(
  length: bigint,
  bytes: bigint,
  compression: Compression,
  mutable_reader: Reader
) {
  throw ArrowError.NotYetImplemented("read_compressed_bitmap");
}

export function readValidity(this: Deserializer, field_node: Node) {
  if (field_node.nullCount() > 0n) {
    return this.readBitmap(field_node.length());
  } else {
    this.mutable_buffers.shift();
    return null;
  }
}
