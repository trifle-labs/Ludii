// @java Core/src/other/concept/ConceptComputationType.java ConceptComputationType
/**
 * The different concept computation types.
 *
 * Faithful 1:1 transliteration of other.concept.ConceptComputationType.
 *
 * @author Eric.Piette  (Java original)
 */

/**
 * Concept computation type enum.
 * @java other.concept.ConceptComputationType
 */
export enum ConceptComputationType {
  /** Computed during compilation. */
  Compilation = 1,

  /** Computed via playouts. */
  Playout = 2,
}

/** @java ConceptComputationType#id() */
export function conceptComputationTypeId(t: ConceptComputationType): number {
  return t as number;
}
