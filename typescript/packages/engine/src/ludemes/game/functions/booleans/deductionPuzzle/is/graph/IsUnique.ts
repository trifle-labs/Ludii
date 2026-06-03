// @java Core/src/game/functions/booleans/deductionPuzzle/is/graph/IsUnique.java

/**
 * Returns true if each sub region of a static region is different.
 *
 * This works only for deduction puzzles.
 *
 * @java game.functions.booleans.deductionPuzzle.is.graph.IsUnique
 */

import type { Context } from "../../../../../../../context.js";
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
  regionTypes(): readonly string[] | null;
  convertStaticRegionOnLocs(
    area: string,
    context: Context,
  ): ReadonlyArray<ReadonlyArray<number | null>>;
}

interface PuzzleGameEquipment {
  regions(): readonly PuzzleRegion[];
}

// ---------------------------------------------------------------------------

/**
 * @java game.functions.booleans.deductionPuzzle.is.graph.IsUnique
 */
export class IsUnique extends BaseBooleanFunction {
  /** @java IsUnique.type */
  private readonly type: SiteType;

  /**
   * @java IsUnique(SiteType)
   */
  public constructor(elementType: SiteType | null) {
    super();
    this.areaConstraint = "Regions";
    this.type = elementType ?? "Cell";
  }

  // ---- eval ---------------------------------------------------------------

  /**
   * @java IsUnique.eval(Context)
   *
   * Returns true if each sub region of every static region set is pairwise
   * different (no two sub-regions have the same assignment).
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

    const whatAt = (site: number): number => {
      if (cs != null) return cs.what(site, this.type);
      return context.state.whatAtSite(site);
    };

    const isResolved = (site: number): boolean => {
      if (cs != null) return cs.isResolved(site, this.type);
      return context.state.whatAtSite(site) !== 0;
    };

    // Java: context.game().equipment().regions()
    let regions: readonly PuzzleRegion[];
    try {
      const eq = (context as unknown as { game: { equipment(): PuzzleGameEquipment } }).game.equipment();
      regions = eq.regions();
    } catch {
      return true; // not a puzzle context
    }

    for (const region of regions) {
      if (region.regionTypes() != null) {
        const regionTypes = region.regionTypes()!;
        for (const regionType of regionTypes) {
          const regionsList = region.convertStaticRegionOnLocs(regionType, context);
          for (let i = 0; i < regionsList.length; i++) {
            for (let j = i + 1; j < regionsList.length; j++) {
              const set1 = regionsList[i]!;
              const set2 = regionsList[j]!;
              if (
                this.regionAllAssigned(set1, isResolved) &&
                this.regionAllAssigned(set2, isResolved)
              ) {
                let identical = true;
                for (let index = 0; index < set1.length; index++) {
                  const s1 = set1[index];
                  const s2 = set2[index];
                  if (s1 == null || s2 == null) continue;
                  if (whatAt(s1 as number) !== whatAt(s2 as number)) {
                    identical = false;
                    break;
                  }
                }
                if (identical) return false;
              }
            }
          }
        }
      }
    }

    return true;
  }

  /**
   * @java IsUnique.regionAllAssigned(Integer[], ContainerState)
   * Returns true iff all sites in the region are assigned (resolved).
   */
  private regionAllAssigned(
    region: ReadonlyArray<number | null>,
    isResolved: (site: number) => boolean,
  ): boolean {
    for (const loc of region) {
      if (loc == null) return false;
      if (!isResolved(loc as number)) return false;
    }
    return true;
  }

  // ---- overrides -----------------------------------------------------------

  /** @java IsUnique.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java IsUnique.preprocess(Game) — do nothing */
  public override preprocess(_game: unknown): void {
    // Do nothing.
  }

  /** @java IsUnique.gameFlags(Game) — DeductionPuzzle */
  public override gameFlags(_game: unknown): number {
    return 0; // GameType.DeductionPuzzle not available
  }

  /** @java IsUnique.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let crash = false;
    const g = game as Partial<{ players(): { count(): number }; addCrashToReport(msg: string): void }>;
    if (g.players != null && g.players().count() !== 1) {
      g.addCrashToReport?.("The ludeme (is Unique ...) is used but the number of players is not 1.");
      crash = true;
    }
    return crash;
  }

  /** @java IsUnique.toString() */
  public override toString(): string {
    return "Unique()";
  }

  /** @java IsUnique.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "each sub-region of the board is different";
  }
}
