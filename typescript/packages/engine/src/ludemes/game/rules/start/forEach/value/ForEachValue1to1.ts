/**
 * @java game/rules/start/forEach/value/ForEachValue.java
 *
 * Applies a start rule for each integer value in the inclusive range [min, max].
 *
 * Java eval() sets context.setValue(to) before calling startRule.eval().
 * The inner start rule is invoked via applyToInitialState; inner rules that
 * read (value) via ctx._evalValue are documented as a deferred limitation.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { IntFunction } from "../../../../../base.js";
import type { StartRule } from "../../StartRule.js";
import type { Context } from "../../../../../../context.js";
import type { Game1to1 } from "../../../../../Game1to1.js";

/**
 * @java game/rules/start/forEach/value/ForEachValue.java
 */
export class ForEachValue1to1 implements StartRule {
  /** @java ForEachValue.minFn */
  private readonly minFn: IntFunction;

  /** @java ForEachValue.maxFn */
  private readonly maxFn: IntFunction;

  /** @java ForEachValue.startRule */
  private readonly startRule: StartRule;

  /**
   * @java ForEachValue(IntFunction min, IntFunction max, StartRule startRule)
   * @param min       Minimum value (inclusive).
   * @param max       Maximum value (inclusive).
   * @param startRule The rule to apply per value.
   */
  public constructor(min: IntFunction, max: IntFunction, startRule: StartRule) {
    this.minFn = min;
    this.maxFn = max;
    this.startRule = startRule;
  }

  /**
   * @java ForEachValue.eval(Context)
   *
   * Evaluates min and max, then iterates to in [min..max] (inclusive).
   * For each step, sets _evalValue on a fake context (Java: context.setValue(to))
   * and invokes the inner start rule.
   */
  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
  ): void {
    const fakeCtx = makeFakeCtx(cells, equipment, numPlayers);

    // Java: final int min = minFn.eval(context); final int max = maxFn.eval(context);
    let min: number;
    let max: number;
    try {
      min = this.minFn.eval(fakeCtx);
      max = this.maxFn.eval(fakeCtx);
    } catch {
      return;
    }

    // Java: for (int to = min; to <= max; to++) { context.setValue(to); startRule.eval(context); }
    for (let to = min; to <= max; to++) {
      fakeCtx._evalValue = to;
      this.startRule.applyToInitialState(cells, whats, countAt, equipment, numPlayers, undefined, undefined, fakeCtx);
    }
    // Java: context.setValue(savedValue); (restored — fake ctx is discarded)
  }
}

/** Minimal fake context for IntFunction evaluation. */
function makeFakeCtx(
  cells: number[],
  equipment: Equipment1to1,
  numPlayers: number,
): Context {
  const fakeGame = { numPlayers, equipment } as unknown as Game1to1;
  return {
    game: fakeGame,
    state: {
      mover: 1,
      cells,
      isEmptySite: (i: number) => !cells[i],
    },
    _evalFrom: -1,
    _evalTo: -1,
    _evalValue: 0,
    _evalSite: -1,
    _evalPlayer: 1,
    _radials: equipment.board.radials,
  } as unknown as Context;
}
