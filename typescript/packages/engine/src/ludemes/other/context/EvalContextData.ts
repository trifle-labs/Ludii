// @java Core/src/other/context/EvalContextData.java EvalContextData
/**
 * Faithful 1:1 transliteration of other.context.EvalContextData.
 *
 * Enum that names each eval-context datum. The Java ordinal is preserved
 * via explicit numeric assignments so that id() returns the same values.
 *
 * Java parity: other/context/EvalContextData.java
 */
export enum EvalContextData {
  From        = 0,
  Level       = 1,
  To          = 2,
  Between     = 3,
  PipCount    = 4,
  Player      = 5,
  Track       = 6,
  Site        = 7,
  Value       = 8,
  Region      = 9,
  HintRegion  = 10,
  Hint        = 11,
  Edge        = 12,
  Team        = 13,
}

export namespace EvalContextData {
  /**
   * @java public int id() { return this.ordinal(); }
   */
  export function id(data: EvalContextData): number {
    return data as number;
  }
}
