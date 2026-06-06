// @java Core/src/game/functions/booleans/is/integer/IsPipsMatch.java

/**
 * Detects whether the pips of a domino match its neighbours.
 *
 * @java game/functions/booleans/is/integer/IsPipsMatch.java
 * @author Eric.Piette and cambolbro
 * @remarks Used for domino games to detect if the pips of the dominoes match
 *          on a specific site with its neighbours.
 */

import type { Context } from "../../../../../../context.js";
import { BaseBooleanFunction } from "../../BaseBooleanFunction.js";
import type { IntFunction } from "../../../../../base.js";
import { LastTo } from "../../../ints/last/LastTo.js";

/**
 * Detects whether the pips of a domino match its neighbours.
 *
 * @java game/functions/booleans/is/integer/IsPipsMatch.java
 */
export class IsPipsMatch extends BaseBooleanFunction {
  /** @java IsPipsMatch.siteFn */
  private readonly siteFn: IntFunction;

  /**
   * @param site The site to check [(lastTo)].
   * @java IsPipsMatch(IntFunction)
   */
  public constructor(site?: IntFunction | null) {
    super();
    this.siteFn = (site !== undefined && site !== null) ? site : new LastTo(undefined);
  }

  /**
   * @java IsPipsMatch.eval(Context)
   *
   * Evaluates whether the pips of the domino at the given site match its neighbours.
   */
  public override eval(context: Context): boolean {
    const site = this.siteFn.eval(context);

    // Escape-hatch typed context API
    const ctx = context as unknown as {
      containerId?: () => number[];
      containerState?: (cid: number) => {
        what?: (idx: number, type: string) => number;
        valueCell?: (idx: number) => number;
        isEmpty?: (idx: number, type: string) => boolean;
        isOccupied?: (idx: number) => boolean;
        countCell?: (idx: number) => number;
        state?: (idx: number, type: string) => number;
      };
      components?: () => Array<{
        isDomino?: () => boolean;
        locs?: (ctx: Context, site: number, state: number, topology: unknown) => number[];
        owner?: () => number;
      }>;
      topology?: () => {
        cells?: () => Array<{ index?: () => number }>;
        trajectories?: () => {
          steps?: (
            type: string,
            fromIdx: number,
            toType: string,
            dir: string,
          ) => Array<{ to?: () => { id?: () => number } }>;
          radials?: (
            type: string,
            fromIdx: number,
            dir: string,
          ) => Array<{
            steps?: () => Array<{ id?: () => number }>;
          }>;
        };
      };
      trial?: { moveNumber?: () => number };
    };

    const containerIdArr = typeof ctx.containerId === "function" ? ctx.containerId() : null;
    const cid = (containerIdArr && containerIdArr.length > site) ? (containerIdArr[site] ?? 0) : 0;

    const cs = typeof ctx.containerState === "function" ? ctx.containerState(cid) : null;
    if (!cs) return true;

    // Java: final int what = cs.what(site, SiteType.Cell);
    const what = typeof cs.what === "function" ? cs.what(site, "Cell") : 0;

    // Java: if (what == 0) return true;
    if (what === 0) {
      return true;
    }

    const components = typeof ctx.components === "function" ? ctx.components() : null;
    if (!components || what < 0 || what >= components.length) return true;
    const component = components[what];
    if (!component) return true;

    const topology = typeof ctx.topology === "function" ? ctx.topology() : null;

    // Java: if (!component.isDomino()) return true;
    if (typeof component.isDomino !== "function" || !component.isDomino()) {
      return true;
    }

    // Java: final int state = cs.state(site, SiteType.Cell);
    const state = typeof cs.state === "function" ? cs.state(site, "Cell") : 0;

    // Java: final TIntArrayList locs = component.locs(context, site, state, context.topology());
    const locs: number[] = (typeof component.locs === "function")
      ? component.locs(context, site, state, topology)
      : [];

    const locsAroundOccupied: number[] = [];

    const trajectories = (topology && typeof topology.trajectories === "function")
      ? topology.trajectories()
      : null;

    for (let li = 0; li < locs.length; li++) {
      const loc = locs[li]!;
      const value = typeof cs.valueCell === "function" ? cs.valueCell(loc) : 0;

      // Java: steps(SiteType.Cell, cell.index(), SiteType.Cell, AbsoluteDirection.Orthogonal)
      const steps = (trajectories && typeof trajectories.steps === "function")
        ? trajectories.steps("Cell", loc, "Cell", "Orthogonal")
        : [];

      for (const step of steps) {
        const stepToObj = typeof step.to === "function" ? step.to() : null;
        const stepTo = stepToObj !== null
          ? (typeof (stepToObj as unknown as { id?: () => number }).id === "function"
            ? (stepToObj as unknown as { id: () => number }).id()
            : -1)
          : -1;
        if (stepTo < 0) continue;

        if (locs.includes(stepTo)) continue; // We do not check in the domino itself

        const valueTo = typeof cs.valueCell === "function" ? cs.valueCell(stepTo) : 0;
        const empty = typeof cs.isEmpty === "function" ? cs.isEmpty(stepTo, "Cell") : true;
        if (!empty && valueTo !== value) {
          return false;
        }

        if (typeof cs.isOccupied === "function" && cs.isOccupied(stepTo)) {
          locsAroundOccupied.push(stepTo);
        }
      }
    }

    // Java: if (context.trial().moveNumber() > 1)
    const trial = context.trial as unknown as { moveNumber?: () => number };
    const moveNumber = typeof trial.moveNumber === "function" ? trial.moveNumber() : 0;

    if (moveNumber > 1) {
      // Not for the first domino
      let okMatch = false;

      for (let i = 0; i < locsAroundOccupied.length; i++) {
        const cellIIdx = locsAroundOccupied[i]!;

        const radials = (trajectories && typeof trajectories.radials === "function")
          ? trajectories.radials("Cell", cellIIdx, "Orthogonal")
          : [];

        const nbors: number[] = [cellIIdx];

        for (const radial of radials) {
          const radialSteps = typeof radial.steps === "function" ? radial.steps() : [];
          // Java: for (int j = 1; j < radial.steps().length; j++)
          for (let j = 1; j < radialSteps.length; j++) {
            const stepId = typeof radialSteps[j]?.id === "function"
              ? (radialSteps[j] as { id: () => number }).id()
              : -1;
            if (locsAroundOccupied.includes(stepId)) {
              nbors.push(stepId);
            }
          }
          if (nbors.length > 2) {
            return false;
          }
          if (nbors.length === 2) {
            const c0 = typeof cs.countCell === "function" ? cs.countCell(nbors[0]!) : 0;
            const c1 = typeof cs.countCell === "function" ? cs.countCell(nbors[1]!) : 0;
            okMatch = (c0 === c1);
          }
        }
      }
      return okMatch;
    } else {
      return true;
    }
  }

  /** @java IsPipsMatch.isStatic() */
  public override isStatic(): boolean {
    return (this.siteFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /** @java IsPipsMatch.gameFlags(Game) */
  public override gameFlags(game: unknown): number {
    // Java: siteFn.gameFlags(game) | GameType.Dominoes | GameType.LargePiece
    return (this.siteFn as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
  }

  /** @java IsPipsMatch.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    // Java: concepts.or(siteFn.concepts(game)); concepts.set(Concept.Domino.id(), true);
    const concepts = new Set<number>();
    const sc = (this.siteFn as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
    if (sc) for (const v of sc) concepts.add(v);
    return concepts;
  }

  /** @java IsPipsMatch.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const ws = new Set<number>();
    const sw = (this.siteFn as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
    if (sw) for (const v of sw) ws.add(v);
    return ws;
  }

  /** @java IsPipsMatch.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const rs = new Set<number>();
    const sr = (this.siteFn as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
    if (sr) for (const v of sr) rs.add(v);
    return rs;
  }

  /** @java IsPipsMatch.preprocess(Game) */
  public override preprocess(game: unknown): void {
    (this.siteFn as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
  }

  /** @java IsPipsMatch.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;

    // Java: if (!game.hasDominoes()) { report; missingRequirement = true; }
    const g = game as unknown as {
      hasDominoes?: () => boolean;
      addRequirementToReport?: (s: string) => void;
    };
    if (typeof g.hasDominoes === "function" && !g.hasDominoes()) {
      if (typeof g.addRequirementToReport === "function") {
        g.addRequirementToReport(
          "The ludeme (is PipsMatch ...) is used but the equipment has no dominoes.",
        );
      }
      missingRequirement = true;
    }

    missingRequirement = missingRequirement || ((this.siteFn as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    return missingRequirement;
  }

  /** @java IsPipsMatch.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return (this.siteFn as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false;
  }

  /** @java IsPipsMatch.toString() */
  public override toString(): string {
    return "[MatchPips ]";
  }
}
