import { MutableVec } from "../mutable";
import { zipValidity } from "../../bitmap/utils/zip_validity";
import { IterableVector } from "../../util/iterator";
import { Vec } from "../../array/index";
import { Bitmap } from "../../bitmap/immutable";
import { DataType } from "../../datatypes/index";
import { PhysicalType } from "../../datatypes/physical_type";
import { ArrowError } from "../../error";

export class MutableBooleanVec extends MutableVec {
  protected variant = "MutableBooleanVec";
  __data_type: DataType;
  _validity: Bitmap | null;
  _values: Bitmap;

  static withCapacity(capacity: number) {
    // return new MutableBooleanVec(DataType.Boolean, );
  }
  constructor(data_type: DataType, validity, values) {
    super();
    this.__data_type = data_type;
    this._validity = validity;
    this._values = values;
  }

  len(): number {
    return this._values.length;
  }
  validity(): Bitmap | null {
    return this._validity;
  }
  dataType(): DataType {
    return this.__data_type;
  }
  pushNull() {}
  shrinkToFit() {}
}
