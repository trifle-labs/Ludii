/**
 * Java parity:
 * - Core/src/other/trial/Trial.java
 *
 * Records the sequence of moves played. The TS slice keeps it minimal:
 * an ordered move list and the winner / over flags. State-hash
 * sequencing comes from the engine's snapshot list, not from here.
 */

import type { Move } from "./move.js";

export class Trial {
  public readonly moves: readonly Move[];
  public readonly over: boolean;
  public readonly winner: number;

  public constructor(moves: readonly Move[], over: boolean, winner: number) {
    if (!Number.isInteger(winner) || winner < -1) {
      throw new Error(`winner must be >= -1; got ${winner}.`);
    }
    if (!over && winner !== -1) {
      throw new Error("Non-terminal trial must report winner = -1.");
    }
    this.moves = Object.freeze([...moves]);
    this.over = over;
    this.winner = winner;
  }

  public get numMoves(): number {
    return this.moves.length;
  }

  public withMove(move: Move, over: boolean, winner: number): Trial {
    return new Trial([...this.moves, move], over, winner);
  }
}
