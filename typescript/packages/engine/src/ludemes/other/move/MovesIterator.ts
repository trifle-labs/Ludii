// @java Core/src/other/move/MovesIterator.java MovesIterator
/**
 * Abstract iterator over moves, with an additional canMoveConditionally method.
 *
 * Faithful 1:1 transliteration of other.move.MovesIterator.
 *
 * @author Dennis Soemers  (Java original)
 */

import type { LudiiMove } from "./LudiiMove.js";

/** Minimal context surface used here. */
export type MinimalContext = unknown;

/**
 * Abstract base for move iterators.
 * Provides the standard Iterator<LudiiMove> protocol plus
 * {@link canMoveConditionally} for short-circuit evaluation.
 *
 * @java other.move.MovesIterator
 */
export abstract class MovesIterator implements Iterator<LudiiMove> {
  // ---- Iterator<Move> protocol -----------------------------------------------

  /**
   * Returns true if there is another move to iterate.
   * @java Iterator#hasNext()
   */
  abstract hasNext(): boolean;

  /**
   * Returns the next move.
   * @java Iterator#next()
   */
  abstract next(): IteratorResult<LudiiMove>;

  // ---- canMoveConditionally --------------------------------------------------

  /**
   * Short-circuit check: returns true as soon as one move satisfies predicate.
   *
   * NOTE: this is used because it allows us to return true as soon as we find
   * one move that satisfies the given condition, and don't need to also generate
   * the next legal move after that as we typically would in a normal
   * iterator-based implementation.
   *
   * @java MovesIterator#canMoveConditionally(BiPredicate<Context,Move>)
   */
  abstract canMoveConditionally(
    predicate: (context: MinimalContext, move: LudiiMove) => boolean,
  ): boolean;
}
