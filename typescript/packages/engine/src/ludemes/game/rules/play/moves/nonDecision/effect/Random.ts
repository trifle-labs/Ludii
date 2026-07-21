// @java Core/src/game/rules/play/moves/nonDecision/effect/Random.java
/**
 * Returns a set of moves according to a set of probabilities, or a random
 * subset of a set of moves.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Random.java
 */

import type { Context } from "../../../../../../../context.js";
import type { FloatFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";

export class Random implements MovesFunction {
  /** @java Random.probaFn — probabilities array (mode 1) */
  private readonly probaFn: FloatFunction[] | null;

  /** @java Random.moves — moves array parallel to probaFn (mode 1) */
  private readonly movesList: MovesFunction[] | null;

  /** @java Random.num — how many random moves to return (mode 2) */
  private readonly num: IntFunction | null;

  /** @java Random.moveLudeme — the move set to sample from (mode 2) */
  private readonly moveLudeme: MovesFunction | null;

  /**
   * Mode 1: weighted random choice among multiple move sets.
   *
   * @java game/rules/play/moves/nonDecision/effect/Random.java — constructor(FloatFunction[], Moves[])
   * @param probas Array of probability functions
   * @param moves  Array of move-generating ludemes (parallel to probas)
   */
  public static fromProbabilities(
    probas: FloatFunction[],
    moves: MovesFunction[],
  ): Random {
    return new Random(probas, moves);
  }

  /**
   * Mode 2: return a specific number of randomly selected moves.
   *
   * @java game/rules/play/moves/nonDecision/effect/Random.java — constructor(Moves, IntFunction)
   * @param moves The move set to sample from
   * @param num   How many moves to return
   */
  public static fromNum(moves: MovesFunction, num: IntFunction): Random {
    return new Random(moves, num);
  }

  /**
   * @java Random(FloatFunction[] probas, Moves[] moves)
   * @java Random(Moves moves, @Name IntFunction num)
   */
  public constructor(
    probasOrMoves: FloatFunction[] | MovesFunction,
    movesOrNum: MovesFunction[] | IntFunction,
  ) {
    if (Array.isArray(probasOrMoves)) {
      const probas = probasOrMoves;
      const moves = movesOrNum as MovesFunction[];
      const minLength = Math.min(probas.length, moves.length);
      this.probaFn = probas.slice(0, minLength);
      this.movesList = moves.slice(0, minLength);
      this.moveLudeme = null;
      this.num = null;
    } else {
      this.probaFn = null;
      this.movesList = null;
      this.moveLudeme = probasOrMoves;
      this.num = movesOrNum as IntFunction;
    }
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Random.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    if (this.movesList !== null && this.probaFn !== null) {
      // @java Random.java:93-121 — probability-weighted selection
      const probas: number[] = this.probaFn.map(fn => fn.eval(ctx));
      if (probas.length === 0) return [];

      let sumProba = 0;
      for (const p of probas) sumProba += p;

      const probasNorm = probas.map(p => p / sumProba);

      let randomValue = ctx.rng.nextFloat();
      let returnedIndex = 0;
      for (; returnedIndex < probasNorm.length; returnedIndex++) {
        randomValue -= probasNorm[returnedIndex]!;
        if (randomValue <= 0) break;
      }
      // Guard against floating-point overshoot
      if (returnedIndex >= this.movesList.length) {
        returnedIndex = this.movesList.length - 1;
      }

      return this.movesList[returnedIndex]!.eval(ctx);
    } else if (this.moveLudeme !== null && this.num !== null) {
      // @java Random.java:124-141 — random subset of moves
      const legalMoves = this.moveLudeme.eval(ctx);
      let numToReturn = Math.max(
        0,
        Math.min(this.num.eval(ctx), legalMoves.length),
      );

      const result: Move[] = [];
      const usedIndices = new Set<number>();
      while (numToReturn > 0) {
        const randomIndex = ctx.rng.nextInt(legalMoves.length);
        if (usedIndices.has(randomIndex)) continue;
        usedIndices.add(randomIndex);
        result.push(legalMoves[randomIndex]!);
        numToReturn--;
      }
      return result;
    }

    return [];
  }
}
