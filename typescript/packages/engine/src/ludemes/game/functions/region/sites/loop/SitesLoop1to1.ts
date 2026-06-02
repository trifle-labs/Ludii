/**
 * SitesLoop1to1.ts
 * @java game/functions/region/sites/loop/SitesLoop.java
 *
 * (sites Loop [inside:<bool>] [colour:<int>] [<direction>] [start:<int>])
 * Returns sites forming a closed loop of same-colour pieces, OR the sites
 * enclosed by that loop (when inside:true).
 *
 * Java eval (SitesLoop.java:144-381):
 *   1. start from `startFn`, get `what` + `colourLoop`.
 *   2. Collect non-looping sites adjacent (not Orthogonal-connected through
 *      the loop colour) and not on the board perimeter.
 *   3. BFS-flood each candidate "inside" group; if it never touches a
 *      perimeter site → candidate loop found.
 *   4. Check all looping sites are owned by colourFn.
 *   5. Walk the candidate loop via the chosen direction to confirm cycle.
 *   6. Return the minimal loop (filterWinningSites) or enclosed sites.
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent } from "@ludii/typescript-language";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { compileInt1to1, compileBool1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { Game1to1 } from "../../../../../Game1to1.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get all Orthogonal neighbours of `site`. */
function orthoNeighbours(
  ctx: Context,
  traj: Trajectories | null | undefined,
  site: number,
): number[] {
  if (traj) return traj.group(site, "Orthogonal");
  const g = ctx.game as unknown as Game1to1;
  const W = g.equipment.board.width;
  const H = g.equipment.board.height;
  const col = site % W; const row = Math.floor(site / W);
  const ns: number[] = [];
  if (col > 0) ns.push(site - 1);
  if (col < W - 1) ns.push(site + 1);
  if (row > 0) ns.push(site - W);
  if (row < H - 1) ns.push(site + W);
  return ns;
}

/** Get neighbours in the chosen (dirName) direction. */
function dirNeighbours(
  ctx: Context,
  traj: Trajectories | null | undefined,
  site: number,
  dirName: string,
): number[] {
  if (traj) return traj.group(site, dirName);
  return orthoNeighbours(ctx, traj, site);
}

/** Board perimeter site set. */
function perimeterSet(ctx: Context, traj: Trajectories | null | undefined): Set<number> {
  if (traj) return new Set(traj.perimeterSites());
  const g = ctx.game as unknown as Game1to1;
  const W = g.equipment.board.width;
  const H = g.equipment.board.height;
  const set = new Set<number>();
  for (let c = 0; c < W; c++) { set.add(c); set.add((H - 1) * W + c); }
  for (let r = 0; r < H; r++) { set.add(r * W); set.add(r * W + (W - 1)); }
  return set;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class SitesLoop1to1 implements RegionFunction {
  private readonly startFn: IntFunction;
  private readonly colourFn: IntFunction;
  private readonly insideFn: BooleanFunction;
  private readonly dirName: string;

  /**
   * @java game/functions/region/sites/loop/SitesLoop.java — constructor
   */
  public constructor(
    startFn: IntFunction,
    colourFn: IntFunction,
    insideFn: BooleanFunction,
    dirName: string,
  ) {
    this.startFn = startFn;
    this.colourFn = colourFn;
    this.insideFn = insideFn;
    this.dirName = dirName;
  }

  /**
   * @java game/functions/region/sites/loop/SitesLoop.java — eval(Context)
   */
  public eval(ctx: Context): number[] {
    const from = this.startFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    const numSites = traj
      ? traj.numSites
      : (ctx.game as unknown as Game1to1).equipment.board.numSites;

    if (from >= numSites) return [];

    // @java SitesLoop.java:159-166 — what at start, must be non-empty
    const what = ctx.state.whatAtSite(from);
    if (what <= 0) return [];

    const colourLoop = this.colourFn.eval(ctx);
    const inside = this.insideFn.eval(ctx);
    const dirName = this.dirName;

    // @java SitesLoop.java:167-198 — outer indices (perimeter) precomputed at preprocess
    const outerSet = perimeterSet(ctx, traj);

    // @java SitesLoop.java:175-197 — collect non-looping (different what) adjacent sites
    // not on perimeter
    const aroundSites: number[] = [];
    for (const nb of orthoNeighbours(ctx, traj, from)) {
      if (ctx.state.whatAtSite(nb) !== what && !outerSet.has(nb)) {
        aroundSites.push(nb);
      }
    }

    // @java SitesLoop.java:199-380 — for each candidate enclosed site, BFS to see if it
    // stays inside, then check loop validity
    for (const origin of aroundSites) {
      // BFS flood from origin via Orthogonal, collecting non-loop sites.
      // If any touch perimeter → no loop from this origin.
      const groupSites: number[] = [origin];
      const visited = new Set<number>([origin]);
      let continueSearch = true;
      let qi = 0;

      while (qi < groupSites.length) {
        const site = groupSites[qi++]!;
        for (const nb of orthoNeighbours(ctx, traj, site)) {
          if (visited.has(nb)) continue;
          // If the loop boundary → stop radial (don't add)
          if (ctx.state.whatAtSite(nb) === what) continue;
          visited.add(nb);
          groupSites.push(nb);
          if (outerSet.has(nb)) {
            continueSearch = false;
            break;
          }
        }
        if (!continueSearch) break;
      }

      if (!continueSearch) continue;

      // @java SitesLoop.java:278-313 — build loop: sites adjacent to the enclosed group
      // (and not in the group) that have the same what as from
      const loop: number[] = [];
      for (const gSite of groupSites) {
        for (const nb of orthoNeighbours(ctx, traj, gSite)) {
          if (!groupSites.includes(nb) && !loop.includes(nb)) {
            loop.push(nb);
          }
        }
      }

      // @java SitesLoop.java:300-311 — all loop sites must be owned by colourLoop
      let ownedOk = true;
      for (const s of loop) {
        if (ctx.state.cells[s] !== colourLoop) {
          ownedOk = false;
          break;
        }
      }
      if (!ownedOk) continue;

      // @java SitesLoop.java:314-376 — walk the loop in dirName to confirm it's connected
      // and cyclic
      const loopCopy = [...loop];
      let loopFound = false;
      let prevIdx = 0;
      let siteIdx = 0;
      const exploredLoop: number[] = [];

      while (!loopFound) {
        if (loopCopy.length === 0) break;
        const siteLoop = loopCopy[siteIdx];
        if (siteLoop === undefined) break;
        if (ctx.state.whatAtSite(siteLoop) !== what) {
          loopCopy.splice(siteIdx, 1);
          exploredLoop.splice(exploredLoop.indexOf(siteLoop), 1);
          siteIdx = prevIdx;
          continue;
        }

        const neighbours = dirNeighbours(ctx, traj, siteLoop, dirName);
        let newSite = -1;
        for (const nb of neighbours) {
          if (loopCopy.includes(nb) && ctx.state.whatAtSite(nb) === what) {
            newSite = nb;
            break;
          }
        }
        if (newSite < 0) {
          loopCopy.splice(siteIdx, 1);
          exploredLoop.splice(exploredLoop.indexOf(siteLoop), 1);
          siteIdx = prevIdx;
          continue;
        }
        exploredLoop.push(siteLoop);
        if (exploredLoop.length === loopCopy.length) {
          loopFound = true;
          break;
        }
        prevIdx = siteIdx;
        siteIdx = loopCopy.indexOf(newSite);
      }

      if (!loopFound) continue;

      if (inside) {
        return groupSites;
      }
      // @java SitesLoop.java:filterWinningSites — minimal loop
      return filterWinningSites(ctx, traj, loopCopy, dirName);
    }

    return [];
  }
}

// ---------------------------------------------------------------------------
// filterWinningSites (SitesLoop.java:389-489)
// ---------------------------------------------------------------------------

/**
 * @java game/functions/region/sites/loop/SitesLoop.java — filterWinningSites
 * Removes redundant sites from the loop, keeping only the minimal cycle.
 */
function filterWinningSites(
  ctx: Context,
  traj: Trajectories | null | undefined,
  winningGroup: number[],
  dirName: string,
): number[] {
  const minimumGroup = [...winningGroup];

  for (let i = minimumGroup.length - 1; i >= 0; i--) {
    const groupMinusI = minimumGroup.filter((_, j) => j !== i);
    if (groupMinusI.length === 0) break;

    // Check if groupMinusI is still connected (one single group)
    const start = groupMinusI[0]!;
    const groupSites: number[] = [start];
    const seen = new Set<number>([start]);
    let lastExplored = start;
    let qk = 0;
    while (qk < groupSites.length) {
      const site = groupSites[qk++]!;
      for (const nb of dirNeighbours(ctx, traj, site, dirName)) {
        if (!seen.has(nb) && groupMinusI.includes(nb)) {
          seen.add(nb);
          groupSites.push(nb);
          lastExplored = nb;
        }
      }
    }

    const oneSingleGroup = groupSites.length === groupMinusI.length;
    if (!oneSingleGroup) continue;

    // Check if still a cycle (lastExplored can reach start via dirName)
    let isLoop = false;
    for (const nb of dirNeighbours(ctx, traj, lastExplored, dirName)) {
      if (nb === start) { isLoop = true; break; }
    }
    if (isLoop) minimumGroup.splice(i, 1);
  }

  return minimumGroup;
}

// ---------------------------------------------------------------------------
// Factory + registration
// ---------------------------------------------------------------------------

/**
 * @java game/functions/region/sites/loop/SitesLoop.java
 * Registry key: "sites:loop" — (sites Loop [inside:<bool>] [colour:<int>]
 *   [<direction>] [start:<int>])
 */
registerRegion1to1("sites:loop", (node: LudNode, env: Compile1to1Env): RegionFunction => {
  const { positional, named } = parseArgs1to1((node as unknown as { items: LudNode[] }).items);
  // positional[0] = "Loop" ident

  // inside: (default false)
  const insideNode = named.get("inside");
  const insideFn: BooleanFunction = insideNode
    ? compileBool1to1(insideNode, env.numPlayers)
    : { eval: () => false };

  // colour: (default Mover)
  const colourNode = named.get("colour") ?? named.get("color");
  let colourFn: IntFunction;
  if (colourNode) {
    colourFn = compileInt1to1(colourNode);
  } else {
    colourFn = { eval: (ctx: Context) => ctx.state.mover };
  }

  // start: (default LastTo)
  const startNode = named.get("start");
  let startFn: IntFunction;
  if (startNode) {
    startFn = compileInt1to1(startNode);
  } else {
    startFn = { eval: (ctx: Context) => ctx._evalTo };
  }

  // direction: scan positional[1..] for a direction ident
  const DIR_NAMES = new Set([
    "adjacent", "orthogonal", "diagonal", "all",
    "n", "s", "e", "w", "ne", "nw", "se", "sw",
  ]);
  let dirName = "Adjacent";
  for (let i = 1; i < positional.length; i++) {
    const p = positional[i];
    if (p && isIdent(p) && DIR_NAMES.has(p.name.toLowerCase())) {
      dirName = p.name;
      break;
    }
  }

  return new SitesLoop1to1(startFn, colourFn, insideFn, dirName);
});
