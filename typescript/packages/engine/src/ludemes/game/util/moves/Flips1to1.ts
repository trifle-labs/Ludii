/**
 * Flips1to1.ts
 * @java game/util/moves/Flips.java
 *
 * Holds the two flip-state values of a piece (used by Flip move).
 * flipState(currentState) returns the other state.
 */

/**
 * Sets the flips state of a piece.
 * @java game/util/moves/Flips.java
 */
export class Flips1to1 {
  /** @java Flips.flipA */
  private readonly flipA: number;
  /** @java Flips.flipB */
  private readonly flipB: number;

  /**
   * @java game/util/moves/Flips.java — constructor(Integer flipA, Integer flipB)
   */
  public constructor(flipA: number, flipB: number) {
    this.flipA = flipA;
    this.flipB = flipB;
  }

  /**
   * @java game/util/moves/Flips.java — flipState(int currentState)
   * Returns the other state given the current one.
   */
  public flipState(currentState: number): number {
    if (currentState === this.flipA) return this.flipB;
    if (currentState === this.flipB) return this.flipA;
    return currentState; // no flip state, just return current state
  }

  /** @java game/util/moves/Flips.java — flipA() */
  public getFlipA(): number {
    return this.flipA;
  }

  /** @java game/util/moves/Flips.java — flipB() */
  public getFlipB(): number {
    return this.flipB;
  }
}
