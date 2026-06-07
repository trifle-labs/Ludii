// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/value/ForEachValue.java

/**
 * Applies a move for each value from a value to another (included).
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/value/ForEachValue.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntArrayFunction, IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { Effect } from "../../../../nonDecision/effect/Effect.js";
import type { ThenLike } from "../../../../Moves.js";

/**
 * Applies a move for each value from a value to another (included).
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/value/ForEachValue.java
 *
 * Java: public final class ForEachValue extends Effect
 */
export class ForEachValue extends Effect {
  /** @java ForEachValue.minFn — the value from */
  private readonly minFn: IntFunction | null;

  /** @java ForEachValue.maxFn — the value to */
  private readonly maxFn: IntFunction | null;

  /** @java ForEachValue.valuesFn — the IntArrayFunction to get the values */
  private readonly valuesFn: IntArrayFunction | null;

  /** @java ForEachValue.generator — the moves to apply */
  private readonly generator: MovesFunction;

  // -------------------------------------------------------------------------

  /**
   * @param values    The values.
   * @param generator The move to apply.
   * @param then      The moves applied after that move is applied.
   * @java ForEachValue(IntArrayFunction, Moves, Then)
   */
  public constructor(values: IntArrayFunction, generator: MovesFunction, then?: ThenLike | null);

  /**
   * @param min       The minimal value.
   * @param max       The maximal value.
   * @param generator The move to apply.
   * @param then      The moves applied after that move is applied.
   * @java ForEachValue(IntFunction, IntFunction, Moves, Then)
   */
  public constructor(min: IntFunction, max: IntFunction, generator: MovesFunction, then?: ThenLike | null);

  public constructor(
    valuesOrMin: IntArrayFunction | IntFunction,
    generatorOrMax: MovesFunction | IntFunction,
    thenOrGenerator?: ThenLike | null | MovesFunction,
    thenArg: ThenLike | null = null,
  ) {
    // Distinguish overloads: if thenOrGenerator is a MovesFunction (has eval returning Move[])
    // then we have the (min, max, generator, then?) form.
    // Otherwise we have the (values, generator, then?) form.
    if (
      thenOrGenerator !== null &&
      thenOrGenerator !== undefined &&
      typeof (thenOrGenerator as MovesFunction).eval === "function"
    ) {
      // (IntFunction min, IntFunction max, Moves generator, Then? then)
      super(thenArg ?? null);
      this.minFn = valuesOrMin as IntFunction;
      this.maxFn = generatorOrMax as IntFunction;
      this.valuesFn = null;
      this.generator = thenOrGenerator as MovesFunction;
    } else {
      // (IntArrayFunction values, Moves generator, Then? then)
      super((thenOrGenerator as ThenLike | null | undefined) ?? null);
      this.minFn = null;
      this.maxFn = null;
      this.valuesFn = valuesOrMin as IntArrayFunction;
      this.generator = generatorOrMax as MovesFunction;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/operators/foreach/value/ForEachValue.java — eval(Context)
   */
  public override eval(context: Context): Move[] {
    // @java final Moves moves = new BaseMoves(super.then());
    const moves: Move[] = [];

    // @java final int savedValue = context.value();
    const ctx = context as unknown as {
      value(): number;
      setValue(v: number): void;
    };
    const savedValue = ctx.value();

    if (this.valuesFn !== null) {
      // @java final int[] values = valuesFn.eval(context);
      const values = this.valuesFn.eval(context as never);
      for (const value of values) {
        // @java context.setValue(value);
        ctx.setValue(value);
        // @java final FastArrayList<Move> generatedMoves = generator.eval(context).moves();
        const generatedMoves = this.generator.eval(context);
        for (const m of generatedMoves) moves.push(m);
      }
    } else {
      // @java final int min = minFn.eval(context); final int max = maxFn.eval(context);
      const min = this.minFn!.eval(context);
      const max = this.maxFn!.eval(context);

      for (let value = min; value <= max; value++) {
        // @java context.setValue(value);
        ctx.setValue(value);
        // @java final FastArrayList<Move> generatedMoves = generator.eval(context).moves();
        const generatedMoves = this.generator.eval(context);
        for (const m of generatedMoves) moves.push(m);
      }
    }

    // @java if (then() != null) for (j ...) moves.moves().get(j).then().add(then().moves());
    // NOTE: In this TS port, Move.then is readonly; then-chaining approximated at generation level.

    // @java context.setValue(savedValue);
    ctx.setValue(savedValue);

    return moves;
  }

  // -------------------------------------------------------------------------

  /** @java ForEachValue.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java ForEachValue.preprocess(Game) */
  public override preprocess(): void {
    if (this.minFn !== null) {
      (this.minFn as unknown as { preprocess?(): void }).preprocess?.();
    }
    if (this.maxFn !== null) {
      (this.maxFn as unknown as { preprocess?(): void }).preprocess?.();
    }
    if (this.valuesFn !== null) {
      (this.valuesFn as unknown as { preprocess?(): void }).preprocess?.();
    }
    (this.generator as unknown as { preprocess?(): void }).preprocess?.();
    super.preprocess();
  }

  /** @java ForEachValue.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missing = false;
    if (this.minFn !== null) {
      missing = missing || ((this.minFn as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    if (this.maxFn !== null) {
      missing = missing || ((this.maxFn as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    if (this.valuesFn !== null) {
      missing = missing || ((this.valuesFn as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    }
    missing = missing || ((this.generator as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    return missing;
  }

  /** @java ForEachValue.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let willCrash = false;
    if (this.minFn !== null) {
      willCrash = willCrash || ((this.minFn as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    if (this.maxFn !== null) {
      willCrash = willCrash || ((this.maxFn as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    if (this.valuesFn !== null) {
      willCrash = willCrash || ((this.valuesFn as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    }
    willCrash = willCrash || ((this.generator as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    return willCrash;
  }

  /** @java ForEachValue.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    let rangeString = "";
    if (this.valuesFn !== null) {
      rangeString = "in " + ((this.valuesFn as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "");
    } else {
      rangeString = "between " +
        ((this.minFn as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "") +
        " and " +
        ((this.maxFn as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "");
    }
    return "for all values " + rangeString + " " +
      ((this.generator as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "");
  }
}
