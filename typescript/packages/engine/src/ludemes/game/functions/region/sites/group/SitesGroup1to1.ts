/**
 * SitesGroup1to1.ts
 * @java game/functions/region/sites/group/SitesGroup.java
 *
 * (sites Group at:<site> [if:<cond>] [<direction>]) — returns all sites
 * in the connected group containing the given site, where connectivity
 * is defined by matching component (what) or a boolean condition.
 *
 * Java eval (SitesGroup.java:88-218):
 *   BFS from start site(s), expanding via direction-based neighbours.
 *   A neighbour is included when:
 *     - condition == null  AND  what(neighbour) == what(start)
 *     - condition != null  AND  condition.eval(ctx with to=neighbour)
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent } from "@ludii/typescript-language";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { compileInt1to1, compileRegion1to1, compileBool1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import type { Game1to1 } from "../../../../../Game1to1.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

export class SitesGroup1to1 implements RegionFunction {
  private readonly startFn: IntFunction;
  private readonly condition: BooleanFunction | null;
  private readonly direction: string;

  /**
   * @java game/functions/region/sites/group/SitesGroup.java — constructor
   * @param startFn  IntFunction returning the starting site index
   * @param condition  Optional BooleanFunction to test membership
   * @param direction  Adjacency direction name (default "Adjacent")
   */
  public constructor(startFn: IntFunction, condition: BooleanFunction | null, direction: string) {
    this.startFn = startFn;
    this.condition = condition;
    this.direction = direction;
  }

  /**
   * @java game/functions/region/sites/group/SitesGroup.java — eval(Context)
   * BFS flood-fill from start site; includes same-component neighbours.
   */
  public eval(ctx: Context): number[] {
    const from = this.startFn.eval(ctx);
    if (from < 0) return [];

    const cells = ctx.state.cells;
    const whats = ctx.state.whats;
    const condition = this.condition;

    // @java SitesGroup.java:107 — set context.to(from) and check condition/what
    const origTo = ctx._evalTo;
    const origFrom = ctx._evalFrom;
    ctx._evalTo = from;
    ctx._evalFrom = from;

    // @java SitesGroup.java:104-108 — include start if condition satisfied
    let startIncluded: boolean;
    if (condition === null) {
      // No condition: include if non-empty
      startIncluded = (cells[from] ?? 0) !== 0 || (whats?.[from] ?? 0) !== 0;
    } else {
      startIncluded = condition.eval(ctx);
    }

    if (!startIncluded) {
      ctx._evalTo = origTo;
      ctx._evalFrom = origFrom;
      return [];
    }

    // @java SitesGroup.java:110 — what value at start site
    const startWhat = (whats?.[from] ?? 0) !== 0 ? (whats![from] ?? 0) : (cells[from] ?? 0);

    const visited = new Set<number>([from]);
    const queue: number[] = [from];
    const result: number[] = [from];

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    const dirName = this.direction;

    while (queue.length > 0) {
      const site = queue.shift()!;
      ctx._evalFrom = site;

      // Get neighbours in the chosen direction
      let neighbours: number[];
      if (traj) {
        neighbours = traj.group(site, dirName);
      } else {
        neighbours = squareNeighbours(ctx, site, dirName);
      }

      for (const to of neighbours) {
        if (visited.has(to)) continue;
        visited.add(to);

        // @java SitesGroup.java:190-195 — check condition or same-what
        ctx._evalTo = to;
        let include: boolean;
        if (condition === null) {
          // Same component type (what/owner) as start
          const toWhat = (whats?.[to] ?? 0) !== 0 ? (whats![to] ?? 0) : (cells[to] ?? 0);
          include = toWhat === startWhat && toWhat !== 0;
        } else {
          include = condition.eval(ctx);
        }

        if (include) {
          result.push(to);
          queue.push(to);
        }
      }
    }

    ctx._evalTo = origTo;
    ctx._evalFrom = origFrom;
    return result;
  }
}

/** Get neighbours on a flat square board. */
function squareNeighbours(ctx: Context, site: number, dirName: string): number[] {
  const g = ctx.game as unknown as Game1to1;
  const W = g.equipment.board.width;
  const H = g.equipment.board.height;
  const col = site % W;
  const row = Math.floor(site / W);
  const ns: number[] = [];
  const d = dirName.toLowerCase();
  const useAll = d === "adjacent" || d === "all";
  const useOrtho = useAll || d === "orthogonal";
  const useDiag = useAll || d === "diagonal";
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

// Key: (sites Group ...) → first positional ident "Group" → lowercased "group" → key "sites:group"
registerRegion1to1("sites:group", (node: LudNode, env: Compile1to1Env): RegionFunction => {
  void env;
  const { positional, named } = parseArgs1to1((node as unknown as { items: LudNode[] }).items);
  // positional[0] = "Group" (the subtype ident)
  // named: at:, From:, if:, directions:

  // Get start site: at:<intFn> or From:<regionFn> (use first site)
  const atNode = named.get("at");
  const fromNode = named.get("from");
  let startFn: IntFunction;
  if (atNode) {
    startFn = compileInt1to1(atNode);
  } else if (fromNode) {
    // Use first site from region as start (From:<regionFn>)
    let regionFn: RegionFunction | null = null;
    try { regionFn = compileRegion1to1(fromNode); } catch { /* fall through to int */ }
    if (regionFn !== null) {
      const regionFnFinal = regionFn;
      startFn = { eval: (ctx: Context) => {
        const sites = regionFnFinal.eval(ctx);
        return sites.length > 0 ? sites[0]! : -1;
      }};
    } else {
      startFn = compileInt1to1(fromNode);
    }
  } else {
    // Fallback: use _evalFrom (current iteration site)
    startFn = { eval: (ctx: Context) => ctx._evalFrom };
  }

  // Optional condition: if:<boolFn>
  const ifNode = named.get("if");
  let condition: BooleanFunction | null = null;
  if (ifNode) {
    try { condition = compileBool1to1(ifNode, env.numPlayers); } catch { /* skip */ }
  }

  // Optional direction (default: Adjacent)
  let direction = "Adjacent";
  for (const p of positional.slice(1)) {
    if (isIdent(p)) {
      const n = p.name.toLowerCase();
      const DIRECTIONS = new Set(["adjacent", "orthogonal", "diagonal", "all",
        "n", "s", "e", "w", "ne", "nw", "se", "sw"]);
      if (DIRECTIONS.has(n)) {
        direction = p.name;
        break;
      }
    }
  }

  return new SitesGroup1to1(startFn, condition, direction);
});
