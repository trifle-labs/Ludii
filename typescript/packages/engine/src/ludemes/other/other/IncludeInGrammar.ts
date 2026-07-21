// @java Core/src/other/IncludeInGrammar.java IncludeInGrammar
/**
 * Faithful 1:1 transliteration of other.IncludeInGrammar.
 *
 * Java parity: other/IncludeInGrammar.java
 *
 * In Java this is a marker interface (no methods). It is used as a decorator
 * to indicate classes that appear in the grammar for cases where that is not
 * otherwise obvious (e.g. GravityType).
 *
 * In TypeScript we represent it as an empty interface – types/classes that
 * should "implement" this marker simply declare `implements IncludeInGrammar`.
 *
 * @author cambolbro (Java)
 * TypeScript transliteration.
 */

/**
 * Marker interface: classes that implement this are explicitly included in
 * the Ludii grammar description.
 *
 * @java public interface IncludeInGrammar {}
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IncludeInGrammar {
  // marker – no methods
}
