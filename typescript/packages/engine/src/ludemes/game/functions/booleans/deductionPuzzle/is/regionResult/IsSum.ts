// @java Core/src/game/functions/booleans/deductionPuzzle/is/regionResult/IsSum.java

/**
 * Returns true if the sum of a region is equal to the result.
 *
 * This works only for deduction puzzles.
 *
 * @java game.functions.booleans.deductionPuzzle.is.regionResult.IsSum
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

interface PuzzleRegion {
  name(): string;
  regionTypes(): readonly string[] | null;
  convertStaticRegionOnLocs(
    area: string,
    context: Context,
  ): ReadonlyArray<ReadonlyArray<number | null>>;
}

interface PuzzleGameEquipment {
  regions(): readonly PuzzleRegion[];
  cellHints(): readonly (number | null)[];
  vertexHints(): readonly (number | null)[];
  edgeHints(): readonly (number | null)[];
}

interface IntFunctionWithIsHint extends IntFunction {
  isHint?(): boolean;
}

type CtxWithEval = Context & EvalScratch;
type CtxWithHint = CtxWithEval & { setHint?(v: number): void };

// ---------------------------------------------------------------------------

/**
 * @java game.functions.booleans.deductionPuzzle.is.regionResult.IsSum
 */
export class IsSum extends BaseBooleanFunction {
  /** @java IsSum.region */
  private readonly region: RegionFunction | null;
  /** @java IsSum.resultFn */
  private readonly resultFn: IntFunctionWithIsHint;
  /** @java IsSum.type */
  private readonly type: SiteType;
  /** @java IsSum.name */
  private readonly name: string;

  /**
   * @java IsSum(SiteType, RegionFunction, String, IntFunction)
   */
  public constructor(
    elementType: SiteType | null,
    region: RegionFunction | null,
    nameRegion: string | null,
    result: IntFunction,
  ) {
    super();
    this.region = region;
    this.resultFn = result as IntFunctionWithIsHint;

    if (region != null) {
      this.regionConstraintField = region;
    } else {
      this.areaConstraint = "Regions";
    }

    this.type = elementType ?? "Cell";
    this.name = nameRegion ?? "";
  }

  // ---- eval ---------------------------------------------------------------

  /**
   * @java IsSum.eval(Context)
   */
  public override eval(context: Context): boolean {
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
      if (cs != null) return cs.isResolved(site, this.type);
      return context.state.whatAtSite(site) !== 0;
    };

    const whatAt = (site: number): number => {
      if (cs != null) return cs.what(site, this.type);
      return context.state.whatAtSite(site);
    };

    const ctxEval = context as CtxWithEval;

    if (this.region != null) {
      // region-specific sum
      const result = this.resultFn.eval(ctxEval);
      const sites = this.region.eval(ctxEval);
      let allAssigned = true;
      let currentSum = 0;

      for (const site of sites) {
        if (isResolved(site)) {
          currentSum += whatAt(site);
        } else {
          allAssigned = false;
        }
      }

      if ((allAssigned && currentSum !== result) || currentSum > result) {
        return false;
      }
    } else {
      // iterate all game regions matching this.name
      let regions: readonly PuzzleRegion[];
      let regionHints: readonly (number | null)[] = [];
      try {
        const eq = (context as unknown as { game: { equipment(): PuzzleGameEquipment } }).game.equipment();
        regions = eq.regions();
        if (this.type === "Cell") regionHints = eq.cellHints();
        else if (this.type === "Vertex") regionHints = eq.vertexHints();
        else regionHints = eq.edgeHints();
      } catch {
        return true; // not a puzzle context
      }

      let result = this.resultFn.eval(ctxEval);

      for (const reg of regions) {
        if (!reg.name().includes(this.name)) continue;
        if (reg.regionTypes() != null) {
          const areas = reg.regionTypes()!;
          for (const area of areas) {
            const regionsList = reg.convertStaticRegionOnLocs(area, context);
            let indexRegion = 0;
            for (const locs of regionsList) {
              // Java: if (resultFn.isHint()) { context.setHint(regionHint[indexRegion]); result = resultFn.eval(context); }
              if (this.resultFn.isHint?.()) {
                const hintVal = regionHints[indexRegion];
                if (hintVal != null) {
                  const ctxHint = context as CtxWithHint;
                  ctxHint.setHint?.(hintVal as number);
                  result = this.resultFn.eval(ctxHint);
                }
              }
              let allAssigned = true;
              let currentSum = 0;
              for (const loc of locs) {
                if (loc == null) continue;
                const site = loc as number;
                if (isResolved(site)) {
                  currentSum += whatAt(site);
                } else {
                  allAssigned = false;
                }
              }
              if ((allAssigned && currentSum !== result) || currentSum > result) {
                return false;
              }
              indexRegion++;
            }
          }
        }
      }
    }

    return true;
  }

  // ---- overrides -----------------------------------------------------------

  /** @java IsSum.toString() */
  public override toString(): string {
    return "Sum(" + String(this.region) + ") = " + String(this.resultFn);
  }

  /** @java IsSum.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java IsSum.preprocess(Game) */
  public override preprocess(game: unknown): void {
    (this.resultFn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    if (this.region != null)
      (this.region as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
  }

  /** @java IsSum.gameFlags(Game) */
  public override gameFlags(game: unknown): number {
    let flags = 0;
    flags |= (this.resultFn as unknown as { gameFlags(g: unknown): number }).gameFlags?.(game) ?? 0;
    if (this.region != null)
      flags |= (this.region as unknown as { gameFlags(g: unknown): number }).gameFlags?.(game) ?? 0;
    return flags;
  }

  /** @java IsSum.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = super.missingRequirement(game);
    missing ||= (this.resultFn as unknown as { missingRequirement(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    if (this.region != null)
      missing ||= (this.region as unknown as { missingRequirement(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    return missing;
  }

  /** @java IsSum.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let crash = false;
    const g = game as Partial<{ players(): { count(): number }; addCrashToReport(msg: string): void }>;
    if (g.players != null && g.players().count() !== 1) {
      g.addCrashToReport?.("The ludeme (is Sum ...) is used but the number of players is not 1.");
      crash = true;
    }
    crash ||= super.willCrash(game);
    crash ||= (this.resultFn as unknown as { willCrash(g: unknown): boolean }).willCrash?.(game) ?? false;
    if (this.region != null)
      crash ||= (this.region as unknown as { willCrash(g: unknown): boolean }).willCrash?.(game) ?? false;
    return crash;
  }

  // ---- accessors -----------------------------------------------------------

  /** @java IsSum.region() */
  public getRegion(): RegionFunction | null {
    return this.region;
  }

  /** @java IsSum.result() */
  public getResult(): IntFunction {
    return this.resultFn;
  }

  /** @java IsSum.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    let regionName = "the board";
    if (this.name.length > 0) {
      regionName = this.name;
    } else if (this.region != null) {
      regionName = (this.region as unknown as { toEnglish(g: unknown): string }).toEnglish?.(game) ?? String(this.region);
    }
    const resEng = (this.resultFn as unknown as { toEnglish(g: unknown): string }).toEnglish?.(game) ?? String(this.resultFn);
    return (
      "the sum of " +
      this.type.toLowerCase() +
      " in " +
      regionName +
      " is equal to " +
      resEng
    );
  }
}
