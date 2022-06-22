const toJson = (inner, variant) => {
  if (inner?.inner || inner?.inner === 0) {
    return variant(inner);
  } else if (Array.isArray(inner)) {
    return inner.map((v) => toJson(v, variant));
  } else if (typeof inner === "boolean") {
    return inner;
  } else {
    return null;
  }
};

export abstract class FunctionalEnum {
  protected __inner: { inner: number; data: any };
  public identity: string;
  #variants;
  public static match<T extends FunctionalEnum, ReturnType>(
    _enum: T,
    matchers: {
      [key: string]: (...args: any[]) => ReturnType;
    },
    otherwise?
  ): ReturnType {
    let variant = _enum.#variants(_enum.__inner);

    if (typeof variant !== "string") {
      variant = Object.keys(variant)[0];
    }
    const inner_data = _enum?.__inner?.data ?? [];
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

  constructor(inner, identity, variants) {
    this.__inner = inner;
    this.identity = identity;
    this.#variants =
      variants instanceof Function ? variants : ({ inner }) => variants[inner];
  }

  protected get inner() {
    return this.__inner.inner;
  }

  equals<T extends FunctionalEnum>(other: T) {
    return (
      this.identity === other.identity &&
      this.__inner.inner === other.__inner.inner &&
      JSON.stringify(this.__inner.data) === JSON.stringify(other.__inner.data)
    );
  }

  toString() {
    return JSON.stringify(toJson(this.__inner, this.#variants));
  }

  toJSON() {
    const variant = toJson(this.__inner, this.#variants);

    return {
      [this.identity]: variant,
    };
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.toJSON();
  }

  get [Symbol.toStringTag]() {
    return this.identity;
  }
}
