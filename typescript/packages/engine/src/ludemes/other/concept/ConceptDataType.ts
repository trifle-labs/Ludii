// @java Core/src/other/concept/ConceptDataType.java ConceptDataType
/**
 * The different concept data types.
 *
 * Faithful 1:1 transliteration of other.concept.ConceptDataType.
 *
 * @author Eric.Piette  (Java original)
 */

/**
 * Concept data type enum.
 * @java other.concept.ConceptDataType
 */
export enum ConceptDataType {
  /** Boolean data. */
  BooleanData = 1,

  /** Integer data. */
  IntegerData = 2,

  /** String data. */
  StringData = 3,

  /** Double data. */
  DoubleData = 4,
}

/** @java ConceptDataType#id() */
export function conceptDataTypeId(t: ConceptDataType): number {
  return t as number;
}
