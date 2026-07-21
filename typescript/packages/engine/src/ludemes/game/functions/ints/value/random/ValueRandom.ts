// @java Core/src/game/functions/ints/value/random/ValueRandom.java

/**
 * Returns a random value within a range.
 *
 * @java game/functions/ints/value/random/ValueRandom.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import { GameType } from "../../../../types/state/GameType.js";
import type { Range } from "../../../../functions/range/Range.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Returns a random value within a range.
 *
 * @java game/functions/ints/value/random/ValueRandom.java
 */
export class ValueRandom extends BaseIntFunction {
  /** @java ValueRandom.range */
  private readonly range: Range;

  /**
   * @param range The range allowed.
   * @java ValueRandom(RangeFunction)
   */
  public constructor(range: Range) {
    super();
    this.range = range;
  }

  /**
   * @java ValueRandom.eval(Context)
   */
  public override eval(context: Context): number {
    const min = this.range.minFn.eval(context);
    const max = this.range.maxFn.eval(context);

    if (min > max) return UNDEFINED;

    const randomValue = context.rng.nextInt(max - min + 1);

    return randomValue + min;
  }

  /** @java ValueRandom.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /**
   * @java ValueRandom.gameFlags(Game)
   * Returns range.gameFlags(game) | GameType.Stochastic.
   */
  public gameFlags(game: unknown): bigint {
    const rangeFlags = (this.range as unknown as { gameFlags?(g: unknown): bigint }).gameFlags?.(game) ?? BigInt(0);
    return rangeFlags | GameType.Stochastic;
  }

  /** @java ValueRandom.concepts(Game) */
  public override concepts(_game: unknown): Set<number> {
    // Java: concepts.set(Concept.Stochastic.id(), true); range.concepts(game);
    return new Set();
  }

  /** @java ValueRandom.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const writeEvalContext = new Set<number>();
    const rangeWrites = (this.range as unknown as { writesEvalContextRecursive?(): Set<number> }).writesEvalContextRecursive?.();
    if (rangeWrites) for (const v of rangeWrites) writeEvalContext.add(v);
    return writeEvalContext;
  }

  /** @java ValueRandom.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const readEvalContext = new Set<number>();
    const rangeReads = (this.range as unknown as { readsEvalContextRecursive?(): Set<number> }).readsEvalContextRecursive?.();
    if (rangeReads) for (const v of rangeReads) readEvalContext.add(v);
    return readEvalContext;
  }

  /** @java ValueRandom.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return (this.range as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false;
  }

  /** @java ValueRandom.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return (this.range as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false;
  }

  /** @java ValueRandom.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.range as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
  }

  /** @java ValueRandom.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    const rangeEnglish = (this.range as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "";
    return "a random value in the range " + rangeEnglish;
  }
}
