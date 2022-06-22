export class ArrowError extends Error {
  public static NotYetImplemented(msg = "") {
    return new ArrowError(`Not yet implemented: ${msg}`);
  }
  public static External(msg: string, source: Error) {
    return new ArrowError(`External error${msg}: ${source}`);
  }
  public static Io(err: Error) {
    return new ArrowError(`Io error: ${err.message}`);
  }
  public static InvalidArgumentError(desc: string) {
    return new ArrowError(`Invalid argument error: ${desc}`);
  }
  public static ExternalFormat(desc: string) {
    return new ArrowError(`External format error: ${desc}`);
  }
  public static Overflow() {
    return new ArrowError("Operation overflew the backing container.");
  }
  public static OutOfSpec(message: string) {
    return new ArrowError(message);
  }
}
