/**
 * Java parity:
 * - Core/src/game/mode/Mode.java
 * - Core/src/game/mode/AlternatingMode.java
 *
 * The simplest turn order: players move 1, 2, ..., N, 1, 2, ...
 * The TS port keeps it pure so callers can derive the next mover
 * without mutating state.
 */

export class AlternatingMode {
  public readonly numPlayers: number;

  public constructor(numPlayers: number) {
    if (!Number.isInteger(numPlayers) || numPlayers < 1) {
      throw new Error(
        `numPlayers must be a positive integer; got ${numPlayers}.`,
      );
    }
    this.numPlayers = numPlayers;
  }

  /** 1-based current mover → 1-based next mover. */
  public next(currentMover: number): number {
    if (
      !Number.isInteger(currentMover) ||
      currentMover < 1 ||
      currentMover > this.numPlayers
    ) {
      throw new RangeError(
        `currentMover ${currentMover} out of range [1, ${this.numPlayers}].`,
      );
    }
    return (currentMover % this.numPlayers) + 1;
  }
}
