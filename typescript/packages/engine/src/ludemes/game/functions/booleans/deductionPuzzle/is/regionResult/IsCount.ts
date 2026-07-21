// @java Core/src/game/functions/booleans/deductionPuzzle/is/regionResult/IsCount.java

/**
 * Returns true if the count of a region is equal to the result.
 *
 * This works only for deduction puzzles.
 *
 * @java game.functions.booleans.deductionPuzzle.is.regionResult.IsCount
 */

import type { Context } from "../../../../../../../context.js";
import type { EvalScratch, IntFunction, RegionFunction } from "../../../../../../base.js";
import { BaseBooleanFunction } from "../../../BaseBooleanFunction.js";
import type { SiteType } from "../../../../../../../action/site-type.js";

// ---------------------------------------------------------------------------
// Minimal puzzle duck-typing surface
// ---------------------------------------------------------------------------

interface PuzzleContainerState {
  isResolved(site: number, type: SiteType): boolean;
  what(site: number, type: SiteType): number;
}

type CtxWithEval = Context & EvalScratch;

// ---------------------------------------------------------------------------

/**
 * @java game.functions.booleans.deductionPuzzle.is.regionResult.IsCount
 */
export class IsCount extends BaseBooleanFunction {
  /** @java IsCount.region */
  private readonly region: RegionFunction | null;
  /** @java IsCount.whatFn */
  private readonly whatFn: IntFunction;
  /** @java IsCount.resultFn */
  private readonly resultFn: IntFunction;
  /** @java IsCount.type */
  private readonly type: SiteType | null;

  /**
   * @java IsCount(SiteType, RegionFunction, IntFunction, IntFunction)
   */
  public constructor(
    type: SiteType | null | undefined,
    region: RegionFunction | null | undefined,
    what: IntFunction | null | undefined,
    result: IntFunction
  ) {
    super();
    this.region = region ?? null;
    this.whatFn = what ?? new IntConstant(1);
    this.resultFn = result;
    this.type = type ?? null;
  }

  // ---- eval ---------------------------------------------------------------

  /**
   * @java IsCount.eval(Context)
   *
   * Counts how many sites in the region have the given `what` value.
   * Returns false if (all assigned and count ≠ result) or (count > result).
   */
  public override eval(context: Context): boolean {
    if (this.region == null) return false;

    // Java: context.board().defaultSite()
    let realType: SiteType = this.type ?? "Cell";
    if (this.type == null) {
      try {
        const boardable = context as unknown as { board(): { defaultSite(): SiteType } };
        realType = boardable.board().defaultSite();
      } catch {
        // keep "Cell"
      }
    }

    // Java: context.state().containerStates()[0]
    const pstate = (context as unknown as {
      state: { containerStates?(): readonly PuzzleContainerState[] };
    }).state;
    let cs: PuzzleContainerState | null = null;
    try {
      cs = pstate.containerStates != null ? (pstate.containerStates()[0] ?? null) : null;
    } catch {
      // fallback
    }

    const isResolved = (site: number): boolean => {
      if (cs != null) return cs.isResolved(site, realType);
      return context.state.what(site) !== 0;
    };

    const whatAt = (site: number): number => {
      if (cs != null) return cs.what(site, realType);
      return context.state.what(site);
    };

    const ctxEval = context as CtxWithEval;
    const what = this.whatFn.eval(ctxEval);
    const result = this.resultFn.eval(ctxEval);
    const sites = this.region.eval(ctxEval);

    let assigned = true;
    let currentCount = 0;

    for (const site of sites) {
      if (isResolved(site)) {
        const whatSite = whatAt(site);
        if (whatSite === what) currentCount++;
      } else {
        assigned = false;
      }
    }

    if ((assigned && currentCount !== result) || currentCount > result) {
      return false;
    }

    return true;
  }

  // ---- overrides -----------------------------------------------------------

  /** @java IsCount.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java IsCount.preprocess(Game) */
  public override preprocess(game: unknown): void {
    if (this.region != null)
      (this.region as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.whatFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.resultFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
  }

  /** @java IsCount.gameFlags(Game) */
  public override gameFlags(game: unknown): number {
    let flags = 0;
    if (this.region != null)
      flags |= (this.region as unknown as { gameFlags(g: unknown): number }).gameFlags?.(game) ?? 0;
    flags |= (this.whatFn as unknown as { gameFlags(g: unknown): number }).gameFlags?.(game) ?? 0;
    flags |= (this.resultFn as unknown as { gameFlags(g: unknown): number }).gameFlags?.(game) ?? 0;
    return flags;
  }

  /** @java IsCount.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = super.missingRequirement(game);
    if (this.region != null)
      missing ||= (this.region as unknown as { missingRequirement(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    missing ||= (this.whatFn as unknown as { missingRequirement(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    missing ||= (this.resultFn as unknown as { missingRequirement(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    return missing;
  }

  /** @java IsCount.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let crash = false;
    const g = game as Partial<{ players(): { count(): number }; addCrashToReport(msg: string): void }>;
    if (g.players != null && g.players().count() !== 1) {
      g.addCrashToReport?.("The ludeme (is Count ...) is used but the number of players is not 1.");
      crash = true;
    }
    crash ||= super.willCrash(game);
    if (this.region != null)
      crash ||= (this.region as unknown as { willCrash(g: unknown): boolean }).willCrash?.(game) ?? false;
    crash ||= (this.whatFn as unknown as { willCrash(g: unknown): boolean }).willCrash?.(game) ?? false;
    crash ||= (this.resultFn as unknown as { willCrash(g: unknown): boolean }).willCrash?.(game) ?? false;
    return crash;
  }

  // ---- accessors -----------------------------------------------------------

  /** @java IsCount.region() */
  public getRegion(): RegionFunction | null {
    return this.region;
  }

  /** @java IsCount.result() */
  public getResult(): IntFunction {
    return this.resultFn;
  }

  /** @java IsCount.what() */
  public getWhat(): IntFunction {
    return this.whatFn;
  }

  /** @java IsCount.toString() */
  public override toString(): string {
    return "Count(" + String(this.region) + ") = " + String(this.resultFn);
  }

  /** @java IsCount.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    const whatEng = (this.whatFn as unknown as { toEnglish(g: unknown): string }).toEnglish?.(game) ?? String(this.whatFn);
    const regEng = (this.region as unknown as { toEnglish(g: unknown): string } | null)?.toEnglish?.(game) ?? String(this.region);
    const resEng = (this.resultFn as unknown as { toEnglish(g: unknown): string }).toEnglish?.(game) ?? String(this.resultFn);
    return "the number of " + whatEng + "s in " + regEng + " equals " + resEng;
  }
}

// ---------------------------------------------------------------------------

/** Constant IntFunction that returns a fixed integer value. */
class IntConstant implements IntFunction {
  private readonly value: number;
  public constructor(value: number) {
    this.value = value;
  }
  public eval(_ctx: CtxWithEval): number {
    return this.value;
  }
}
