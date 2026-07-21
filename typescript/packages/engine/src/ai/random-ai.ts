/**
 * Java parity: AI/src/utils/RandomAI.java —
 * pick a legal move uniformly at random.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import { SeededRng } from "../rng.js";
import { AI, type SelectActionOptions } from "./ai.js";

export class RandomAI extends AI {
  /** Seedable RNG so playouts/tests are reproducible. */
  private rng: SeededRng;

  public constructor(seed = 0xc0ffee) {
    super();
    this.friendlyName = "Random";
    this.rng = new SeededRng(seed);
  }

  public withSeed(seed: number): this {
    this.rng = new SeededRng(seed);
    return this;
  }

  public override selectAction(
    context: Context,
    _options?: SelectActionOptions,
  ): Move | undefined {
    const moves = context.game.moves(context);
    if (moves.length === 0) return undefined;
    const idx = this.rng.nextInt(moves.length);
    return moves[idx];
  }
}
