// @java Core/src/game/functions/booleans/deductionPuzzle/all/AllDifferent.java

/**
 * Returns true if every item is different in the specific region.
 *
 * This is used for the constraints of a deduction puzzle. This works only
 * for deduction puzzles.
 *
 * @java game.functions.booleans.deductionPuzzle.all.AllDifferent
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction, RegionFunction } from "../../../../../base.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";
import type { SiteType } from "../../../../../../action/site-type.js";

// ---------------------------------------------------------------------------
// Minimal puzzle-state duck-typing surface
// ---------------------------------------------------------------------------

/** Minimal ContainerState shape required by AllDifferent. */
interface PuzzleContainerState {
  isResolved(site: number, type: SiteType): boolean;
  what(site: number, type: SiteType): number;
}

/** Minimal Region duck-type from Java equipment.regions(). */
interface PuzzleRegion {
  regionTypes(): readonly string[] | null;
  region(): readonly RegionFunction[] | null;
  sites(): readonly number[] | null;
  convertStaticRegionOnLocs(
    area: string,
    context: Context,
  ): ReadonlyArray<ReadonlyArray<number | null>>;
}

/** Minimal game-equipment duck-type. */
interface PuzzleGameEquipment {
  regions(): readonly PuzzleRegion[];
}
interface PuzzleGamePlayers {
  count(): number;
}
interface PuzzleGame {
  players(): PuzzleGamePlayers;
  addCrashToReport(msg: string): void;
  equipment(): PuzzleGameEquipment;
}

/** Duck-typed context extension used when Context is a puzzle context. */
interface PuzzleStateSurface {
  containerStates(): readonly PuzzleContainerState[];
}

type CtxWithEval = Context & EvalScratch;

// ---------------------------------------------------------------------------

/**
 * @java game.functions.booleans.deductionPuzzle.all.AllDifferent
 */
export class AllDifferent extends BaseBooleanFunction {
  /** @java AllDifferent.region */
  private readonly region: RegionFunction | null;
  /** @java AllDifferent.typeRegion */
  private readonly typeRegion: string | null;
  /** @java AllDifferent.exceptions */
  private readonly exceptions: readonly IntFunction[];
  /** @java AllDifferent.type */
  private readonly type: SiteType | null;

  /**
   * @java AllDifferent(SiteType, RegionFunction, IntFunction, IntFunction[])
   */
  public constructor(
    elementType: SiteType | null,
    region: RegionFunction | null,
    except: IntFunction | null,
    excepts: readonly IntFunction[] | null,
  ) {
    super();
    this.region = region;
    this.typeRegion = region == null ? "Regions" : null;
    if (region != null) {
      this.regionConstraintField = region;
    } else {
      this.areaConstraint = this.typeRegion;
    }

    if (excepts != null) {
      this.exceptions = excepts;
    } else if (except != null) {
      this.exceptions = [except];
    } else {
      this.exceptions = [];
    }

    this.type = elementType ?? null;
  }

  /** @java AllDifferent.eval(Context) */
  public override eval(context: Context): boolean {
    const pctx = context as unknown as {
      state: PuzzleStateSurface;
      board(): { defaultSite(): SiteType };
      game: PuzzleGame;
    };

    // Java: context.board().defaultSite() — fall back to "Cell" if not puzzle context
    let realType: SiteType;
    try {
      realType = this.type ?? pctx.board().defaultSite();
    } catch {
      realType = this.type ?? "Cell";
    }

    // Java: context.state().containerStates()[0]
    let cs: PuzzleContainerState | null = null;
    try {
      cs = pctx.state.containerStates()[0] ?? null;
    } catch {
      // Not a puzzle context — fall back to state.whatAtSite
    }

    const isResolved = (site: number): boolean => {
      if (cs != null) return cs.isResolved(site, realType);
      // fallback: consider resolved if non-zero
      return context.state.whatAtSite(site) !== 0;
    };

    const whatAt = (site: number): number => {
      if (cs != null) return cs.what(site, realType);
      return context.state.whatAtSite(site);
    };

    const ctxEval = context as CtxWithEval;
    const excepts = new Set<number>(
      this.exceptions.map((fn) => fn.eval(ctxEval)),
    );

    if (this.typeRegion == null && this.region != null) {
      // region-specific check
      const sites = this.region.eval(ctxEval);
      if (sites.length === 0) return true;
      const history = new Set<number>();
      for (const site of sites) {
        if (!isResolved(site)) continue;
        const what = whatAt(site);
        if (what === 0 && !excepts.has(what)) return false;
        if (!excepts.has(what)) {
          if (history.has(what)) return false;
          history.add(what);
        }
      }
      return true;
    } else if (this.typeRegion === "Regions") {
      // iterate all game regions
      let regions: readonly PuzzleRegion[];
      try {
        regions = pctx.game.equipment().regions();
      } catch {
        return true; // not a puzzle context
      }

      for (const rgn of regions) {
        if (rgn.regionTypes() != null) {
          const areas = rgn.regionTypes()!;
          for (const area of areas) {
            const regionsList = rgn.convertStaticRegionOnLocs(area, context);
            for (const locs of regionsList) {
              const history = new Set<number>();
              if (area === "AllDirections") {
                const first = locs[0];
                if (first == null || whatAt(first as number) === 0) continue;
              }
              for (const loc of locs) {
                if (loc == null) continue;
                const site = loc as number;
                if (!isResolved(site)) continue;
                const what = whatAt(site);
                if (what === 0 && !excepts.has(what)) return false;
                if (!excepts.has(what)) {
                  if (history.has(what)) return false;
                  history.add(what);
                }
              }
            }
          }
        } else if (rgn.region() != null) {
          const regionFunctions = rgn.region()!;
          for (const regionFn of regionFunctions) {
            const locs = regionFn.eval(ctxEval);
            const history = new Set<number>();
            for (const loc of locs) {
              if (!isResolved(loc)) continue;
              const what = whatAt(loc);
              if (what === 0 && !excepts.has(what)) return false;
              if (!excepts.has(what)) {
                if (history.has(what)) return false;
                history.add(what);
              }
            }
          }
        } else if (rgn.sites() != null) {
          const locs = rgn.sites()!;
          const history = new Set<number>();
          for (const loc of locs) {
            if (!isResolved(loc)) continue;
            const what = whatAt(loc);
            if (what === 0 && !excepts.has(what)) return false;
            if (!excepts.has(what)) {
              if (history.has(what)) return false;
              history.add(what);
            }
          }
        }
      }
      return true;
    }
    return true;
  }

  // ---- overrides -----------------------------------------------------------

  /** @java AllDifferent.toString() */
  public override toString(): string {
    if (this.region != null) {
      return "AllDifferent(" + String(this.region) + ")";
    } else {
      return "AllDifferent(" + (this.typeRegion ?? "") + ")";
    }
  }

  /** @java AllDifferent.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java AllDifferent.gameFlags(Game) */
  public override gameFlags(game: unknown): number {
    let flags = 0;
    if (this.region != null) {
      flags |= (this.region as unknown as { gameFlags(g: unknown): number }).gameFlags?.(game) ?? 0;
    }
    for (const fn of this.exceptions) {
      flags |= (fn as unknown as { gameFlags(g: unknown): number }).gameFlags?.(game) ?? 0;
    }
    return flags;
  }

  /** @java AllDifferent.preprocess(Game) */
  public override preprocess(game: unknown): void {
    if (this.region != null) {
      (this.region as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    }
    for (const fn of this.exceptions) {
      (fn as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    }
  }

  /** @java AllDifferent.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missing = super.missingRequirement(game);
    if (this.region != null) {
      missing ||= (this.region as unknown as { missingRequirement(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    }
    for (const fn of this.exceptions) {
      missing ||= (fn as unknown as { missingRequirement(g: unknown): boolean }).missingRequirement?.(game) ?? false;
    }
    return missing;
  }

  /** @java AllDifferent.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let crash = false;
    const g = game as Partial<PuzzleGame>;
    if (g.players != null && g.players().count() !== 1) {
      g.addCrashToReport?.("The ludeme (all Different ...) is used but the number of players is not 1.");
      crash = true;
    }
    crash ||= super.willCrash(game);
    if (this.region != null) {
      crash ||= (this.region as unknown as { willCrash(g: unknown): boolean }).willCrash?.(game) ?? false;
    }
    for (const fn of this.exceptions) {
      crash ||= (fn as unknown as { willCrash(g: unknown): boolean }).willCrash?.(game) ?? false;
    }
    return crash;
  }

  /** @java AllDifferent.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "Every item within a region is different";
  }

  // ---- accessors -----------------------------------------------------------

  /** @java AllDifferent.region() */
  public getRegion(): RegionFunction | null {
    return this.region;
  }

  /** @java AllDifferent.area() */
  public area(): string | null {
    return this.typeRegion;
  }

  /** @java AllDifferent.exceptions() */
  public getExceptions(): readonly IntFunction[] {
    return this.exceptions;
  }
}
