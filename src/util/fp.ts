export type Result<T> = T | Error;
export type Option<T> = T | null;
export function unwrap<T>(throwable: T): Exclude<T, Error> {
  if (throwable instanceof Error) {
    throw throwable;
  } else {
    return throwable as any;
  }
}
