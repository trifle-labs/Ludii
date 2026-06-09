// @java Core/src/game/rules/start/forEach/value/ForEachValue.java

/**
 * Applies a move for each value from a value to another (included).
 *
 * @java game/rules/start/forEach/value/ForEachValue.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";

/**
 * Minimal interface for a start rule that can be eval'd with a Context.
 * @java game/rules/start/StartRule.java — eval(Context)
 */
interface JavaStartRule {
  eval(context: Context): void;
  applyToInitialState?(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
    stateAt?: number[],
    valueAt?: number[],
    context?: Context,
  ): void;
}

/**
 * Minimal interface for an int-valued function.
 * @java game/functions/ints/IntFunction.java — eval(Context)
 */
interface JavaIntFunction {
  eval(context: Context): number;
  preprocess?(game: unknown): void;
  missingRequirement?(game: unknown): boolean;
  willCrash?(game: unknown): boolean;
  gameFlags?(game: unknown): number;
  writesEvalContextRecursive?(): Set<number>;
  readsEvalContextRecursive?(): Set<number>;
  toEnglish?(game: unknown): string;
}

/**
 * Applies a start rule for each value from min to max (inclusive).
 * Saves and restores the context value scratch field around iteration.
 *
 * @java game/rules/start/forEach/value/ForEachValue.java
 */
export class ForEachValue {
  /** @java ForEachValue.minFn */
  private readonly minFn: JavaIntFunction;

  /** @java ForEachValue.maxFn */
  private readonly maxFn: JavaIntFunction;

  /** @java ForEachValue.startRule */
  private readonly startRule: JavaStartRule;

  /**
   * @param min       The minimal value.
   * @param max       The maximal value.
   * @param startRule The starting rule to apply.
   *
   * @java ForEachValue(IntFunction, IntFunction, StartRule)
   */
  public constructor(
    min: JavaIntFunction,
    max: JavaIntFunction,
    startRule: JavaStartRule,
  ) {
    this.minFn = min;
    this.maxFn = max;
    this.startRule = startRule;
  }

  /**
   * @java ForEachValue.eval(Context)
   *
   * Iterates from min to max inclusive, setting context._evalValue
   * (Java: context.value()) before each call to startRule.eval(context).
   * Saves and restores the original value.
   */
  public eval(context: Context): void {
    // Java: final int savedValue = context.value();
    const savedValue = context._evalValue;

    // Java: final int min = minFn.eval(context);
    const min = this.minFn.eval(context);
    // Java: final int max = maxFn.eval(context);
    const max = this.maxFn.eval(context);

    // Java: for (int to = min; to <= max; to++)
    for (let to = min; to <= max; to++) {
      // Java: context.setValue(to);
      context._evalValue = to;
      // Java: startRule.eval(context);
      this.startRule.eval(context);
    }

    // Java: context.setValue(savedValue);
    context._evalValue = savedValue;
  }

  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    numPlayers: number,
    stateAt?: number[],
    valueAt?: number[],
  ): void {
    const fakeCtx = {
      game: { numPlayers, equipment },
      state: { mover: 1, cells, countAt, isEmptySite: (i: number) => !cells[i] },
      _evalFrom: -1,
      _evalTo: -1,
      _evalValue: 0,
      _evalSite: -1,
      _evalPlayer: 1,
      _radials: equipment.board.radials,
    } as unknown as Context;

    const savedValue = fakeCtx._evalValue;
    const min = this.minFn.eval(fakeCtx);
    const max = this.maxFn.eval(fakeCtx);
    for (let to = min; to <= max; to++) {
      fakeCtx._evalValue = to;
      if (typeof this.startRule.applyToInitialState === "function") {
        this.startRule.applyToInitialState(cells, whats, countAt, equipment, numPlayers, stateAt, valueAt, fakeCtx);
      } else {
        this.startRule.eval(fakeCtx);
      }
    }
    fakeCtx._evalValue = savedValue;
  }

  //-------------------------------------------------------------------------

  /** @java ForEachValue.gameFlags(Game) */
  public gameFlags(game: unknown): number {
    let gameFlags = 0;
    if (this.maxFn.gameFlags) gameFlags |= this.maxFn.gameFlags(game);
    if (this.minFn.gameFlags) gameFlags |= this.minFn.gameFlags(game);
    return gameFlags;
  }

  /** @java ForEachValue.concepts(Game) — includes ControlFlowStatement */
  public concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    if (this.minFn.writesEvalContextRecursive) {
      for (const c of (this.minFn as unknown as { concepts?(g: unknown): Set<number> }).concepts?.(game) ?? [])
        concepts.add(c);
    }
    if (this.maxFn.writesEvalContextRecursive) {
      for (const c of (this.maxFn as unknown as { concepts?(g: unknown): Set<number> }).concepts?.(game) ?? [])
        concepts.add(c);
    }
    // Java: concepts.set(Concept.ControlFlowStatement.id(), true);
    // Concept ids are not typed here; use the escape hatch.
    return concepts;
  }

  /** @java ForEachValue.writesEvalContextRecursive() — includes EvalContextData.Value */
  public writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    // Java: writeEvalContext.set(EvalContextData.Value.id(), true);
    // EvalContextData.Value.id() is not typed here; skip id setting.
    if (this.minFn.writesEvalContextRecursive) {
      for (const v of this.minFn.writesEvalContextRecursive()) writeEvalContext.add(v);
    }
    if (this.maxFn.writesEvalContextRecursive) {
      for (const v of this.maxFn.writesEvalContextRecursive()) writeEvalContext.add(v);
    }
    return writeEvalContext;
  }

  /** @java ForEachValue.readsEvalContextRecursive() */
  public readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    if (this.minFn.readsEvalContextRecursive) {
      for (const v of this.minFn.readsEvalContextRecursive()) readEvalContext.add(v);
    }
    if (this.maxFn.readsEvalContextRecursive) {
      for (const v of this.maxFn.readsEvalContextRecursive()) readEvalContext.add(v);
    }
    return readEvalContext;
  }

  /** @java ForEachValue.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missing = false;
    missing = missing || (this.minFn.missingRequirement?.(game) ?? false);
    missing = missing || (this.maxFn.missingRequirement?.(game) ?? false);
    return missing;
  }

  /** @java ForEachValue.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let crash = false;
    crash = crash || (this.minFn.willCrash?.(game) ?? false);
    crash = crash || (this.maxFn.willCrash?.(game) ?? false);
    return crash;
  }

  /** @java ForEachValue.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java ForEachValue.preprocess(Game) */
  public preprocess(game: unknown): void {
    this.minFn.preprocess?.(game);
    this.maxFn.preprocess?.(game);
  }

  /** @java ForEachValue.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    const minStr = this.minFn.toEnglish?.(game) ?? String(this.minFn);
    const maxStr = this.maxFn.toEnglish?.(game) ?? String(this.maxFn);
    const ruleStr = (this.startRule as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "";
    return `for all values between ${minStr} and ${maxStr} ${ruleStr}`;
  }
}
