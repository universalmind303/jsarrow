import { Vec } from "../array/index";
import { DataType } from "../datatypes/index";
import { PhysicalType } from "../datatypes/physical_type";
import { ArrowError } from "../error";
import { Result, unwrap } from "../util/fp";


export class NullVec extends Vec {
  public static try_new(data_type: DataType, length: number): NullVec | Error {
    if (!data_type.toPhysicalType().equals(PhysicalType.Null)) {
      throw ArrowError.OutOfSpec(
        "NullVec can only be initialized with a DataType whose physical type is Boolean"
      );
    }
    return new NullVec(data_type, length);
  }
  
  public static from_data(data_type: DataType, length: number): NullVec {
    const val = NullVec.try_new(data_type, length) as any as Result<NullVec>;
    if (val instanceof Error) {
      throw val;
    } else {
      return val;
    }
  }
  public static new_empty(data_type: DataType): NullVec {
    return new NullVec(data_type, 0);
  }

  public static new_null(data_type: DataType, length: number): NullVec {
    return new NullVec(data_type, length);
  }

  private constructor(data_type: DataType, length: number) {
    super(data_type, length);
  }
}

