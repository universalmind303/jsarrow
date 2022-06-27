
export abstract class FunctionalEnum {
  protected abstract identity: string;
  protected abstract variant: string;
  protected abstract inner: any;
  toString() {
    return `${this.identity}.${this.variant}`;
  }

  toJSON() {
    const inner = (this as any).inner;
    if (inner) {
      return {
        [this.identity]: {
          variant: this.variant,
          inner,
        },
      };
    } else {
      return {
        [this.identity]: {
          variant: this.variant,
        },
      };
    }
  }
  equals<T extends FunctionalEnum>(other: T) {
    return (
      this.identity === other.identity &&
      this.variant === other.variant &&
      JSON.stringify((this as any).inner) ===
        JSON.stringify((other as any).inner)
    );
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.toJSON();
  }
  public static match<T extends FunctionalEnum, ReturnType>(
    _enum: T,
    matchers: {
      [key: string]: (...args: any[]) => ReturnType;
    },
    otherwise?
  ): ReturnType {
    let variant = _enum.variant;

    const inner_data = _enum.inner ?? [];
    const match = matchers[variant];
    if (!match) {
      if (!otherwise) {
        throw new Error(
          "Must either provide a match for all patterns, or provide a fallback"
        );
      }
      return otherwise(...inner_data);
    }
    if (match instanceof Function) {
      return match.call(_enum, inner_data);
    } else {
      return match;
    }
  }
}
