import { Bitmap } from "../../../bitmap/immutable";
import { Reader } from "../../../util/file-reader";
import { ArrowError } from "../../../error";
import { TypedArray, TypedArrayConstructor } from "../../../interfaces";
import { is_native_little_endian } from "../../../io/ipc/endianness";
import { Compression, IpcBuffer, Node } from "../../../io/ipc/read/index";

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
      However, this array reports ${length} slots, which, for physical type "${
        (typedArray as any).constructor.name
      }", corresponds to ${bytes} bytes, 
      which is larger than the buffer length ${buffer_length}",`);
    }

    
    let buffer = new typedArray(Number(length))

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

export function read_buffer<T extends TypedArray>(
  typedArray: TypedArrayConstructor<T>
) {
  return function (
    mutable_buffers: Array<IpcBuffer>,
    length: bigint,
    mutable_reader: Reader,
    block_offset: bigint,
    is_little_endian: boolean,
    compression: Compression | null
  ) {

    let buf = mutable_buffers.shift();
    if (!buf) {
      throw new Error("IPC: unable to fetch a buffer. The file is corrupted.");
    }
    buf = buf!;

    mutable_reader.seek(block_offset + buf.offset());
    let buffer_length = buf.length();
    if (compression !== null) {
      return read_compressed_buffer(typedArray)(
        mutable_reader,
        buffer_length,
        length,
        is_little_endian,
        compression!
      );
    } else {
      return read_uncompressed_buffer(typedArray)(
        mutable_reader,
        buffer_length,
        length,
        is_little_endian
      );
    }
  };
}
export function read_bitmap(
  mutable_buffers: Array<IpcBuffer>,
  length: bigint,
  mutable_reader: Reader,
  block_offset: bigint,
  _: boolean,
  compression: Compression | null
): Bitmap {
  let buf = mutable_buffers.shift();
  if (!buf) {
    throw new Error("IPC: unable to fetch a buffer. The file is corrupted.");
  }
  mutable_reader.seek(block_offset);
  let bytes = buf.length();
  buf = buf!;

  let buffer;
  if (compression) {
    buffer = read_compressed_bitmap(length, bytes, compression, mutable_reader);
  } else {
    buffer = read_uncompressed_bitmap(length, bytes, mutable_reader);
  }

  const bitmap = Bitmap.try_new(buffer, Number(length));
  if (bitmap instanceof Error) {
    throw bitmap;
  }
  console.log("bitmap", bitmap);
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

  let buffer = Uint8Array.from({ length: Number(bytes) });
  mutable_reader.read_exact(buffer);
  return buffer;
}

function read_compressed_bitmap(
  length: bigint,
  bytes: bigint,
  compression: Compression,
  mutable_reader: Reader
) {
  throw ArrowError.NotYetImplemented("read_compressed_bitmap");
}

export function read_validity(
  mutable_buffers: Array<IpcBuffer>,
  field_node: Node,
  mutable_reader: Reader,
  block_offset: bigint,
  is_little_endian: boolean,
  compression: Compression | null
) {
  if (field_node.nullCount() > 0) {
    return read_bitmap(
      mutable_buffers,
      field_node.length(),
      mutable_reader,
      block_offset,
      is_little_endian,
      compression
    );
  } else {
    mutable_buffers.shift();
    return null;
  }
}
