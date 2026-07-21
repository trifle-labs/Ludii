// @java Core/src/other/concept/ConceptType.java ConceptType
/**
 * The different types of the concepts.
 *
 * Faithful 1:1 transliteration of other.concept.ConceptType.
 *
 * @author Eric.Piette  (Java original)
 */

/**
 * Concept type enum.
 * @java other.concept.ConceptType
 */
export enum ConceptType {
  /** The properties of the game. */
  Properties = 1,

  /** The concepts related to the equipment. */
  Equipment = 2,

  /** The concepts related to the meta rules. */
  Meta = 3,

  /** The concepts related to the starting rules. */
  Start = 4,

  /** The concepts related to the play rules. */
  Play = 5,

  /** The concepts related to the ending rules. */
  End = 6,

  /** The concepts related to the metrics (behaviour). */
  Behaviour = 7,

  /** The concepts related to the implementation. */
  Implementation = 8,

  /** The concepts related to the visuals. */
  Visual = 9,

  /** The concepts related to the Math. */
  Math = 10,

  /** The concepts related to the containers. */
  Container = 11,

  /** The concepts related to the components. */
  Component = 12,
}

/**
 * @java ConceptType#id()
 */
export function conceptTypeId(t: ConceptType): number {
  return t as number;
}
