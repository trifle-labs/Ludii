/**
 * SitesDistance.ts
 * @java game/functions/region/sites/distance/SitesDistance.java
 *
 * (sites Distance from:<site> <distance> [<relation>]) — all sites at a
 * given (min..max) distance from a source site, measured by BFS steps of
 * a given RelationType (Adjacent by default).
 *
 * Java eval (SitesDistance.java:95-132, non-stepMove arm):
 *   - Return empty if from < 0 or minDistance < 0.
 *   - BFS from `from`, expanding via the named RelationType, collecting sites
 *     at depth d where minDistance ≤ d ≤ maxDistance.
 *
 * The `stepMove` arm (SitesDistance.java:135-213) is DEFERRED: it requires
 * compiling a Java `Step` ludeme with Direction conversion + Component
 * rotation logic not yet available in the 1:1 path.
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isNumber, isList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../../Game1to1.js";

// ---------------------------------------------------------------------------
// Range helper
// ---------------------------------------------------------------------------

export class SitesDistance implements RegionFunction {
  private readonly fromFn: IntFunction;
  private readonly minFn: IntFunction;
  private readonly maxFn: IntFunction;
  /** "Adjacent" | "Orthogonal" | "Diagonal" | "All" | etc. */
  private readonly relation: string;

  /**
   * @java game/functions/region/sites/distance/SitesDistance.java — constructor
   */
  public constructor(
    fromFn: IntFunction,
    minFn: IntFunction,
    maxFn: IntFunction,
    relation: string,
  ) {
    this.fromFn = fromFn;
    this.minFn = minFn;
    this.maxFn = maxFn;
    this.relation = relation;
  }

  /**
   * @java game/functions/region/sites/distance/SitesDistance.java — eval(Context)
   * Non-stepMove arm only (lines 116-132).
   */
  public eval(ctx: Context): number[] {
    // @java SitesDistance.java:100-101 — reject negative from
    const from = this.fromFn.eval(ctx);
    if (from < 0) return [];

    // @java SitesDistance.java:109-113 — reject negative minDistance
    const minD = this.minFn.eval(ctx);
    if (minD < 0) return [];

    const maxD = this.maxFn.eval(ctx);
    if (maxD < minD) return [];

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    const relation = this.relation;

    // @java SitesDistance.java:116-132 — BFS by topology distance
    const out: number[] = [];
    const seen = new Set<number>([from]);
    let frontier: number[] = [from];

    // Distance 0: just the origin itself
    if (minD === 0) out.push(from);

    for (let d = 1; d <= maxD && frontier.length > 0; d += 1) {
      const next: number[] = [];
      for (const site of frontier) {
        const neighbours = getNeighbours(ctx, traj, site, relation);
        for (const nb of neighbours) {
          if (!seen.has(nb)) {
            seen.add(nb);
            next.push(nb);
          }
        }
      }
      if (d >= minD) {
        for (const s of next) out.push(s);
      }
      frontier = next;
    }

    return out;
  }
}

// ---------------------------------------------------------------------------
// Neighbour helper
// ---------------------------------------------------------------------------

function getNeighbours(
  ctx: Context,
  traj: Trajectories | null | undefined,
  site: number,
  relation: string,
): number[] {
  if (traj) {
    return traj.group(site, relation);
  }
  // Square-board fallback
  const g = ctx.game as unknown as Game1to1;
  const W = g.equipment.board.width;
  const H = g.equipment.board.height;
  const col = site % W;
  const row = Math.floor(site / W);
  const ns: number[] = [];
  const rel = relation.toLowerCase();
  const useAll = rel === "adjacent" || rel === "all";
  const useOrtho = useAll || rel === "orthogonal";
  const useDiag = useAll || rel === "diagonal";
  if (useOrtho) {
    if (col > 0) ns.push(site - 1);
    if (col < W - 1) ns.push(site + 1);
    if (row > 0) ns.push(site - W);
    if (row < H - 1) ns.push(site + W);
  }
  if (useDiag) {
    if (col > 0 && row > 0) ns.push(site - W - 1);
    if (col < W - 1 && row > 0) ns.push(site - W + 1);
    if (col > 0 && row < H - 1) ns.push(site + W - 1);
    if (col < W - 1 && row < H - 1) ns.push(site + W + 1);
  }
  return ns;
}

// ---------------------------------------------------------------------------
// Factory + registration
// ---------------------------------------------------------------------------

const RELATIONS = new Set([
  "adjacent", "all", "diagonal", "offdiagonal", "orthogonal",
]);

/**
 * @java game/functions/region/sites/distance/SitesDistance.java
 * Registry key: "sites:distance" — (sites Distance from:<int> <range> [<relation>])
 */
