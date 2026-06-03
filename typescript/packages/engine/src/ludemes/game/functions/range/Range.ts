// @java Core/src/game/functions/range/Range.java

import type { Context } from "../../../../context.js";
import type { IntFunction } from "../../../base.js";
import { IntConstant } from "../ints/IntConstant.js";

/**
 * Returns a range of values (inclusive) according to specified min/max.
 *
 * Java parity: final class extending BaseRangeFunction. eval(context) returns
 * itself (the Range object acts as its own result). Stores min/max as
 * IntFunctions and provides min(ctx)/max(ctx) accessors.
 *
 * @java game.functions.range.Range
 * @author cambolbro and Eric.Piette
 */
export class Range {
  /** Lower extent of range (inclusive). @java BaseRangeFunction.minFn */
  public readonly minFn: IntFunction;

  /** Upper extent of range (inclusive). @java BaseRangeFunction.maxFn */
  public readonly maxFn: IntFunction;

  /** Precomputed range cache. @java BaseRangeFunction.precomputedRange */
  protected precomputedRange: Range | null = null;

  /**
   * @java Range(IntFunction min, @Opt IntFunction max)
   * @param min Lower extent of range (inclusive).
   * @param max Upper extent of range (inclusive); defaults to min if omitted.
   */
  public constructor(min: IntFunction, max?: IntFunction) {
    this.minFn = min;
    this.maxFn = max ?? min;
  }

  /**
   * @java Range.eval(Context) — returns itself (or precomputed range).
   */
  public eval(_ctx: Context): Range {
    if (this.precomputedRange !== null) return this.precomputedRange;
    return this;
  }

  /**
   * @java Range.min(Context) — evaluates the minimum.
   */
  public min(ctx: Context | null): number {
    return this.minFn.eval(ctx as Context);
  }

  /**
   * @java Range.max(Context) — evaluates the maximum.
   */
  public max(ctx: Context | null): number {
    return this.maxFn.eval(ctx as Context);
  }

  /** @java Range.isStatic() */
  public isStatic(): boolean {
    return (
      ((this.minFn as { isStatic?(): boolean }).isStatic?.() ?? true) &&
      ((this.maxFn as { isStatic?(): boolean }).isStatic?.() ?? true)
    );
  }

  /** @java Range.gameFlags(Game) */
  public gameFlags(game: unknown): number {
    const mf = (this.minFn as { gameFlags?(g: unknown): number }).gameFlags?.(game) ?? 0;
    const xf = (this.maxFn as { gameFlags?(g: unknown): number }).gameFlags?.(game) ?? 0;
    return mf | xf;
  }

  /** @java Range.concepts(Game) */
  public concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    const mc = (this.minFn as { concepts?(g: unknown): Set<number> }).concepts?.(game);
    if (mc) for (const c of mc) concepts.add(c);
    const xc = (this.maxFn as { concepts?(g: unknown): Set<number> }).concepts?.(game);
    if (xc) for (const c of xc) concepts.add(c);
    return concepts;
  }

  /** @java Range.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    const mm = (this.minFn as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    const xm = (this.maxFn as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    return mm || xm;
  }

  /** @java Range.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    const mw = (this.minFn as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false;
    const xw = (this.maxFn as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false;
    return mw || xw;
  }

  /** @java Range.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.minFn as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.maxFn as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.isStatic()) {
      this.precomputedRange = this.eval(null as unknown as Context);
    }
  }

  /** @java Range.toString() */
  public toString(): string {
    return `[${this.max(null)};${this.min(null)}]`;
  }
}
