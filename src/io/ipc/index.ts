export const ARROW_MAGIC = ["A", "R", "R", "O", "W", "1"] as const;
export const CONTINUATION_MARKER = Buffer.from([0xff, 0xff, 0xff, 0xff]);

export interface IpcField {
  fields: Array<IpcField>;
  dictionaryId?: bigint;
}
export namespace IpcField {
  export function empty() {
    return { fields: [] } as IpcField;
  }
}

export interface IpcSchema {
  fields: Array<IpcField>;
  isLittleEndian: boolean;
}
