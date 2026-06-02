/**
 * Indicates whether the game is an adversarial puzzle.
 *
 * @java metadata/graphics/puzzle/AdversarialPuzzle.java
 *
 * @remarks Used in games which are expressed as a N-player game, but are
 * actually puzzles, e.g. Chess puzzle.
 */

/**
 * @java metadata/graphics/puzzle/AdversarialPuzzle.java — class AdversarialPuzzle implements GraphicsItem
 */
export class AdversarialPuzzle {
  /** If the game is an adversarial puzzle. */
  readonly adversarialPuzzle: boolean;

  /**
   * @param adversarialPuzzle Whether the game is an adversarial puzzle or not [true].
   */
  constructor(adversarialPuzzle: boolean | null) {
    this.adversarialPuzzle = adversarialPuzzle === null ? true : adversarialPuzzle;
  }

  /** @return If the game is an adversarial puzzle. */
  isAdversarialPuzzle(): boolean {
    return this.adversarialPuzzle;
  }

  needRedraw(): boolean {
    return false;
  }
}
