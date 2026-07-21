// @java Core/src/other/concept/ConceptPurpose.java ConceptPurpose
/**
 * The different possible uses of a game concept.
 *
 * Faithful 1:1 transliteration of other.concept.ConceptPurpose.
 *
 * @author Eric.Piette  (Java original)
 */

/**
 * Concept purpose enum.
 * @java other.concept.ConceptPurpose
 */
export enum ConceptPurpose {
  /** Can be used for AI. */
  AI = 1,

  /** Can be used for reconstruction. */
  Reconstruction = 2,
}

/** @java ConceptPurpose#id() */
export function conceptPurposeId(p: ConceptPurpose): number {
  return p as number;
}
