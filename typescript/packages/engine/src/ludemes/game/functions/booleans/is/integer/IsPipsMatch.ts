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
import { Add as AddEffect } from "../../../../rules/play/moves/nonDecision/effect/Add.js";

type Compass = "N" | "E" | "S" | "W";
const ORTHO_DIRS: readonly Compass[] = ["N", "E", "S", "W"];

/**
 * Single bounded step from `site` in compass direction `dir`, or -1 if it
 * would leave the board. @java identical row/col arithmetic to the stepper
 * duplicated in action-move.ts's lineOfPlayDominoesFlat / Add.ts's
 * locsLargePiece fallback (Block's boardless Square topology has no custom
 * trajectory table to consult — `context.topology().trajectories()` is not
 * implemented in this port, so the orthogonal-neighbour/radial walks below
 * use the same row/col fallback Add.ts and action-move.ts already rely on,
 * rather than the (non-functional here) Java `Topology.trajectories()` API).
 */
function stepFlat(site: number, dir: Compass, W: number, H: number): number {
  const col = site % W;
  const row = Math.floor(site / W);
  switch (dir) {
    case "E": return col + 1 < W ? site + 1 : -1;
    case "W": return col - 1 >= 0 ? site - 1 : -1;
    case "N": return row + 1 < H ? site + W : -1;
    case "S": return row - 1 >= 0 ? site - W : -1;
  }
}

/** Every cell stepping outward from `site` in `dir` until off-board (excludes `site` itself). */
function rayFrom(site: number, dir: Compass, W: number, H: number): number[] {
  const out: number[] = [];
  let cur = site;
  for (;;) {
    const next = stepFlat(cur, dir, W, H);
    if (next < 0) break;
    out.push(next);
    cur = next;
  }
  return out;
}

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
    const state = context.state;

    // Java: final int what = cs.what(site, SiteType.Cell);
    const what = state.whatAtSite(site);

    // Java: if (what == 0) return true;
    if (what === 0) {
      return true;
    }

    // Call bound to `context` (not destructured) — components() reads `this.game`.
    const components = typeof context.components === "function" ? context.components() : null;
    if (!components || what < 0 || what >= components.length) return true;
    const component = components[what] as {
      isDomino?: () => boolean;
      walks?: readonly (readonly string[])[];
    } | undefined;
    if (!component) return true;

    // Java: if (!component.isDomino()) return true;
    if (typeof component.isDomino !== "function" || !component.isDomino()) {
      return true;
    }

    const boardGeom = (context.game as unknown as {
      equipment?: { board?: { width: number; height: number } };
    }).equipment?.board;
    const W = boardGeom?.width ?? 0;
    const H = boardGeom?.height ?? 0;

    // Java: final int stateAt = cs.state(site, SiteType.Cell);
    const stateAt = state.stateAtSite(site);

    // Java: final TIntArrayList locs = component.locs(context, site, state, context.topology());
    // No custom trajectory table for a boardless Square grid — the row/col
    // fallback stepper (same one action-move.ts's lineOfPlayDominoesFlat and
    // Add.ts's locsLargePiece already use) replaces Topology.trajectories().
    const locs: number[] = component.walks
      ? AddEffect.locsLargePiece(context, site, stateAt, component.walks)
      : [];

    const locsAroundOccupied: number[] = [];

    for (let li = 0; li < locs.length; li++) {
      const loc = locs[li]!;
      const value = state.valueAtSite(loc);

      // Java: steps(SiteType.Cell, cell.index(), SiteType.Cell, AbsoluteDirection.Orthogonal)
      for (const dir of ORTHO_DIRS) {
        const stepTo = stepFlat(loc, dir, W, H);
        if (stepTo < 0) continue;

        if (locs.includes(stepTo)) continue; // We do not check in the domino itself

        const valueTo = state.valueAtSite(stepTo);
        const empty = state.isEmptySite(stepTo);
        if (!empty && valueTo !== value) {
          return false;
        }

        // Java: cs.isOccupied(to) — component-based occupancy (what != 0),
        // matching State.isOccupiedSite (what OR stack OR count).
        if (!empty) {
          locsAroundOccupied.push(stepTo);
        }
      }
    }

    // Java: if (context.trial().moveNumber() > 1)
    const trial = context.trial as unknown as { moveNumber?: number; numMoves?: number };
    const moveNumber = trial.moveNumber ?? trial.numMoves ?? 0;

    if (moveNumber > 1) {
      // Not for the first domino
      let okMatch = false;

      for (let i = 0; i < locsAroundOccupied.length; i++) {
        const cellIIdx = locsAroundOccupied[i]!;

        const nbors: number[] = [cellIIdx];

        for (const dir of ORTHO_DIRS) {
          const ray = rayFrom(cellIIdx, dir, W, H);
          // Java: for (int j = 1; j < radial.steps().length; j++) — ray[]
          // already excludes the site itself (radial.steps()[0]).
          for (const stepId of ray) {
            if (locsAroundOccupied.includes(stepId)) {
              nbors.push(stepId);
            }
          }
          if (nbors.length > 2) {
            return false;
          }
          if (nbors.length === 2) {
            // Java: cs.countCell(nbors[i]) — for line-of-play games the count
            // field carries the occupying domino's component index on every
            // footprint cell (ActionMoveTopPiece.java:1416-1418), so this
            // compares "do these two border cells belong to the same domino".
            const c0 = state.countAtSite(nbors[0]!);
            const c1 = state.countAtSite(nbors[1]!);
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
