import { Vec } from "../index";
import { Bitmap } from "../../bitmap/immutable";
import { DataType } from "../../datatypes/index";
import { ArrowError } from "../../error";
import { Offset } from "../../types/offset";
import { unwrap } from "jsarrow/src/util/fp";
import { Field } from "jsarrow/src/datatypes/field";
import { FunctionalEnum } from "jsarrow/src/util/enum_impl";

type OffsetType<O> = O extends Offset.I32 ? Int32Array : BigInt64Array;

export abstract class ListVec<O extends Offset> extends Vec implements Vec {
  protected typeId = "ListVec";
  protected abstract offset: Offset;

  __data_type: DataType;
  #validity: Bitmap | null;
  #values: Vec;
  #offsets: OffsetType<O>;

  constructor(
    data_type: DataType,
    offsets: OffsetType<O>,
    values,
    validity: Bitmap | null = null
  ) {
    super();
    this.__data_type = data_type;
    this.#offsets = offsets;
    this.#validity = validity;
    this.#values = values;
  }

  static try_new<O extends Offset>(offset: O) {
    return function <A extends Int32Array | BigInt64Array>(
      data_type: DataType,
      offsets: A,
      values: Vec,
      validity: Bitmap | null
    ):
      | (O extends Offset.I32 ? ListVec<Offset.I32> : ListVec<Offset.I64>)
      | Error {
      if (validity && validity.length !== offsets.length - 1) {
        return ArrowError.OutOfSpec(
          "validity mask length must match the number of values"
        );
      }

      const child_dtype = ListVec.get_child_field(offset, data_type).datatype;
      let values_data_type = values.dataType();
      if (!child_dtype.equals(values_data_type)) {
        return ArrowError.OutOfSpec(
          `ListArray's child's DataType must match.However, the expected DataType is ${child_dtype} while it got ${values_data_type}.`
        );
      }
      if (offsets instanceof Int32Array) {
        return new ListImpl(data_type, offsets, values, validity) as any;
      } else {
        return new LargeListImpl(data_type, offsets, values, validity) as any;
      }
    };
  }

  static create<O extends Offset>(offset: O) {
    return function <A extends Int32Array | BigInt64Array>(
      data_type: DataType,
      offsets: OffsetType<A>,
      values,
      validity: Bitmap | null = null
    ): O extends Int32Array ? ListVec<Offset.I32> : ListVec<Offset.I64> {
      return unwrap(
        ListVec.try_new(offset)(data_type, offsets, values, validity)
      ) as any;
    };
  }

  value(i: number) {
    return null as any;
  }

  len(): number {
    return this.#offsets.length - 1;
  }
  validity(): Bitmap | null {
    return this.#validity;
  }
  slice(offset: number, length: number): ThisType<this> {
    return this.slice_unchecked(offset, length);
  }

  default_data_type(data_type: DataType): DataType {
    let field = Field("item", data_type, true);
    if (this.offset === Offset.I32) {
      return DataType.List(field);
    } else {
      return DataType.LargeList(field);
    }
  }

  slice_unchecked(offset, length) {
    let validity = this.#validity?.slice_unchecked(offset, length) ?? null;
    let offsets = this.#offsets.slice(offset, length) as any;
    return ListVec.create(this.offset)(
      this.__data_type,
      offsets,
      this.#values,
      validity
    );
  }

  static try_get_child(offset: Offset, data_type: DataType): Field | Error {
    if (offset === Offset.I32) {
      return FunctionalEnum.match(
        data_type,
        {
          List([child]) {
            return child;
          },
        },
        () => ArrowError.OutOfSpec("ListVec<i32> expects DataType.List")
      );
    } else {
      return FunctionalEnum.match(
        data_type,
        {
          LargeList([child]) {
            return child;
          },
        },
        () => ArrowError.OutOfSpec("ListVec<i64> expects DataType.LargeList")
      );
    }
  }

  static get_child_field(offset, data_type): Field {
    return unwrap(this.try_get_child(offset, data_type));
  }
}

class ListImpl extends ListVec<Offset.I32> {
  protected offset = Offset.I32;
  constructor(data_type, offsets, values, validity) {
    super(data_type, offsets, values, validity);
    const child = ListVec.get_child_field(this.offset, data_type);
    this.typeId = `ListVec<${child.datatype.typeId}>`;
  }
}

class LargeListImpl extends ListVec<Offset.I64> {
  protected offset = Offset.I64;
  constructor(data_type, offsets, values, validity) {
    super(data_type, offsets, values, validity);
    const child = ListVec.get_child_field(this.offset, data_type);
    this.typeId = `LargeListVec<${child.datatype.typeId}>`;
  }
}
