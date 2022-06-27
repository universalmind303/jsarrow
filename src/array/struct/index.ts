// import { Field } from "jsarrow/datatypes/field";
// import { zipValidity } from "jsarrow/src/bitmap/utils/zip_validity";
// import { IterableVector } from "jsarrow/src/util/iterator";
// import { FunctionalEnum } from "jsarrow/util/enum_impl";
// import { unwrap } from "jsarrow/util/fp";
// import { Vec } from "../../array/index";
// import { Bitmap } from "../../bitmap/immutable";
// import { DataType } from "../../datatypes/index";
// import { PhysicalType } from "../../datatypes/physical_type";
// import { ArrowError } from "../../error";

// /**
//  * A [`StructVec`] is a nested [`Vec`] with an optional validity representing
//  * multiple [`Vec`] with the same number of rows.
//  * @example
//  * ```
//  * const boolean = BooleanVec.from([false, false, true, true]);
//  * const int = Int32Vec.from([42, 28, 19, 31]);
//  * const fields = [
//  *   Field("b", DataType.Boolean, false),
//  *   Field("c", DataType.Int32, false)
//  * ];
//  * const vec = StructVec(DataType.Struct(fields), [boolean, int], null);
//  * ```
//  */
// // export class StructVec extends Vec implements IterableVector<Array<Vec>> {
// //   protected variant = "StructVec";

// //   __data_type: DataType;
// //   #validity: Bitmap | null;
// //   #values: Bitmap;

// //   constructor(data_type: DataType, validity, values) {
// //     super();
// //     this.__data_type = data_type;
// //     this.#validity = validity;
// //     this.#values = values;
// //   }

// //   len(): number {
// //     return this.#values.length;
// //   }

// //   validity() {
// //     return this.#validity;
// //   }

// //   slice(offset: number, length: number): ThisType<this> {
// //     let validity = this.#validity?.slice_unchecked(offset, length);
// //     let values = this.#values.slice_unchecked(offset, length);
// //     return new StructVec(this.__data_type, validity, values);
// //   }

// //   value(idx: number) {
// //     return this.#values.get_bit(idx);
// //   }

// //   values(): IterableIterator<Array<Vec> | null> {
// //     return null as any;
// //     // return zipValidity(
// //     //   this.#values.values(),
// //     //   this.#validity?.values() ?? null
// //     // );
// //   }

// //   [Symbol.iterator]() {
// //     return null as any;
// //     // return this.values();s/
// //   }

// //   toArray() {
// //     return null as any;
// //     // return Array.from(this.values());
// //   }
// // }

// export function StructVec(): Vec {
//   return null as any
// }

// export namespace StructVec {
//   function tryGetFields(data_type: DataType): Field[] | Error {
//     return FunctionalEnum.match(
//       data_type.toLogicalType(),
//       {
//         Struct([fields]) {
//           return fields;
//         },
//       },
//       () =>
//         ArrowError.OutOfSpec(
//           "Struct array must be created with a DataType whose physical type is Struct"
//         )
//     );
//   }

//   export function getFields(data_type: DataType): Field[] {
//     return unwrap(tryGetFields(data_type));
//   }

//   /**
//    * Returns a new [`StructVec`].
//    * # Errors
//    * This function errors if:
//    * * `data_type`'s physical type is not [`PhysicalType.Struct`].
//    * * the children of `data_type` are empty
//    * * the values's len is different from children's length
//    * * any of the values's data type is different from its corresponding children' data type
//    * * any element of values has a different length than the first element
//    * * the validity's length is not equal to the length of the first element
//    */
//   export function tryCreate(
//     data_type: DataType,
//     values: Vec[],
//     validity: Bitmap | null
//   ): StructVec | Error {
//     const fields = tryGetFields(data_type);
//     if (fields instanceof Error) {
//       return fields;
//     }
//     if (fields.length === 0) {
//       return ArrowError.OutOfSpec(
//         "A StructArray must contain at least one field"
//       );
//     }
//     if (fields.length !== values.length) {
//       return ArrowError.OutOfSpec(
//         "A StructArray must a number of fields in its DataType equal to the number of child values"
//       );
//     }

//     const len = values[0].len();

//     try {
//       fields.forEach((field, idx) => {
//         const dtype = field.datatype;
//         const child = values[idx].dataType();
//         if (!dtype.equals(child)) {
//           return ArrowError.OutOfSpec(
//             "The children DataTypes of a StructArray must equal the children data types." +
//               `However, the field ${idx} has data type ${dtype} but the value has data type ${child}`
//           );
//         }
//       });
//     } catch (e) {
//       return e as ArrowError;
//     }
//     if (validity?.length !== len) {
//       return ArrowError.OutOfSpec(
//         "The validity length of a StructArray must match its number of elements"
//       );
//     }

//     return new StructVec(data_type, validity, values);
//   }

//   /**
//    * Returns a new [`StructVec`].
//    * @throws [`ArrowError`]
//    *
//    *
//    * This function throws an errors if:
//    * * `data_type`'s physical type is not [`PhysicalType.Struct`].
//    * * the children of `data_type` are empty
//    * * the values's len is different from children's length
//    * * any of the values's data type is different from its corresponding children' data type
//    * * any element of values has a different length than the first element
//    * * the validity's length is not equal to the length of the first element
//    */
//   export function create(
//     data_type: DataType,
//     values: Vec[],
//     validity: Bitmap | null
//   ): StructVec {
//     return unwrap(tryCreate(data_type, values, validity));
//   }

//   /** Alias for `create` */
//   export function from(
//     data_type: DataType,
//     values: Vec[],
//     validity: Bitmap | null
//   ): StructVec {
//     return unwrap(tryCreate(data_type, values, validity));
//   }

//   /** Creates an empty [`StructVec`].  */
//   export function newEmpty(data_type: DataType) {}

//   /** Creates a null [`StructArray`] of length `length`. */
//   export function newNull() {}
// }
