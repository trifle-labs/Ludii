// @java Core/src/other/Ludeme.java
/**
 * Faithful 1:1 transliteration of other.Ludeme.
 *
 * Ludeme interface — every ludeme in the Ludii game system implements this
 * interface.
 *
 * Deferrals:
 *  - game.Game: represented by a minimal IGame opaque interface that exposes
 *    only the surface required by this interface declaration.
 *  - BitSet: represented as a Set<number> of bit indices (same semantics;
 *    callers must use Set operations in place of BitSet.or / BitSet.get).
 *
 * Java parity: other/Ludeme.java
 *
 * @author cambolbro and Eric.Piette (Java), ported to TS
 */

// ---------------------------------------------------------------------------
// Minimal opaque interface for game.Game.
// ---------------------------------------------------------------------------

/** Minimal surface of game.Game needed by the Ludeme interface. */
export interface IGame {
  /** placeholder allowing extension by downstream modules */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Ludeme interface
// ---------------------------------------------------------------------------

/**
 * Ludeme interface.
 *
 * @java other/Ludeme.java — interface Ludeme
 */
export interface Ludeme {
  /**
   * @param game The game.
   * @return English description of this ludeme.
   * @java other/Ludeme.java — toEnglish(Game)
   */
  toEnglish(game: IGame): string;

  /**
   * @param game The game.
   * @return Accumulated flags corresponding to the game concepts (as a set of
   *         concept-bit indices, mirroring Java BitSet).
   * @java other/Ludeme.java — concepts(Game)
   */
  concepts(game: IGame): Set<number>;

  /**
   * @return Recursively accumulated flags corresponding to read data in
   *         EvalContext (as a set of bit indices, mirroring Java BitSet).
   * @java other/Ludeme.java — readsEvalContextRecursive()
   */
  readsEvalContextRecursive(): Set<number>;

  /**
   * @return Recursively accumulated flags corresponding to write data in
   *         EvalContext (as a set of bit indices, mirroring Java BitSet).
   * @java other/Ludeme.java — writesEvalContextRecursive()
   */
  writesEvalContextRecursive(): Set<number>;

  /**
   * @return EvalContext properties read by this ludeme directly (not
   *         recursively), as a set of bit indices.
   * @java other/Ludeme.java — readsEvalContextFlat()
   */
  readsEvalContextFlat(): Set<number>;

  /**
   * @return EvalContext properties written by this ludeme directly (not
   *         recursively), as a set of bit indices.
   * @java other/Ludeme.java — writesEvalContextFlat()
   */
  writesEvalContextFlat(): Set<number>;

  /**
   * @param game The game.
   * @return True if a required ludeme is missing.
   * @java other/Ludeme.java — missingRequirement(Game)
   */
  missingRequirement(game: IGame): boolean;

  /**
   * @param game The game.
   * @return True if the ludeme can crash the game during its play.
   * @java other/Ludeme.java — willCrash(Game)
   */
  willCrash(game: IGame): boolean;
}
