/**
 * SitesWalk1to1.ts
 * @java game/functions/region/sites/walk/SitesWalk.java
 *
 * (sites Walk [<from>] <walk-steps> [rotations:<bool>]) — all sites reached by
 * a turtle-walk from the starting site. The walk is described as an array of
 * StepType sequences ({F F R F} etc.) where F=forward, R=rotate-right,
 * L=rotate-left. With `rotations:true` (default) the walk is tried from every
 * supported orthogonal heading; with false only from the first.
 *
 * Java eval (SitesWalk.java:75-149) delegates to
 *   graph.trajectories().steps(realType, currentLoc, currentDirection.toAbsolute())
 * for the F step, then rotates the heading via DirectionFacing.right/left.
 *
 * TS: delegates to Trajectories.walkSites(from, walks, allRotations) which is
 * a faithful port of the same algorithm (trajectories.ts:walkSites).
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isNumber, isList, isString } from "@ludii/typescript-language";
import { registerRegion1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { compileInt1to1, compileBool1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

// ---------------------------------------------------------------------------
// Named walks (Java StepType named constants)
// @java game.types.board.StepType — KnightWalk, LWalk, TWalk, etc.
// ---------------------------------------------------------------------------

const NAMED_WALKS: ReadonlyMap<string, readonly (readonly string[])[]> = new Map([
  ["DominoWalk", [["F", "R", "F", "R", "F", "L", "F", "L", "F", "R", "F", "R", "F"]]],
  ["GiraffeWalk", [["F", "F", "F", "R", "F", "F"], ["F", "F", "F", "L", "F", "F"]]],
  ["KnightWalk", [["F", "F", "R", "F"], ["F", "F", "L", "F"]]],
  ["LWalk", [["L", "F", "R", "F", "F"], ["R", "F", "L", "F", "F"]]],
  ["TWalk", [["F", "F", "F", "L", "F", "R", "R", "F", "F"]]],
]);

/** Parse a walk node into a list of step sequences. */
function parseWalks(node: LudNode | undefined): readonly (readonly string[])[] {
  if (!node) return [];
  if (isString(node)) return NAMED_WALKS.get(node.value) ?? [];
  if (!isList(node)) return [];
  // Curly list of step idents: {F F R F}
  const allIdents = node.items.every((item) => isIdent(item) || isNumber(item));
  if (allIdents) {
    const steps: string[] = [];
    for (const item of node.items) {
      if (isIdent(item)) steps.push(item.name.toUpperCase());
    }
    return [steps];
  }
  // Curly list of sub-lists: {{F F R F} {F F L F}}
  const nested = node.items.every((item) => isList(item));
  if (nested) {
    return node.items
      .filter(isList)
      .map((sub) => {
        const steps: string[] = [];
        for (const item of sub.items) {
          if (isIdent(item)) steps.push(item.name.toUpperCase());
        }
        return steps;
      });
  }
  return [];
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class SitesWalk1to1 implements RegionFunction {
  private readonly fromFn: IntFunction;
  private readonly walks: readonly (readonly string[])[];
  private readonly rotations: BooleanFunction;

  /**
   * @java game/functions/region/sites/walk/SitesWalk.java — constructor
   */
  public constructor(
    fromFn: IntFunction,
    walks: readonly (readonly string[])[],
    rotations: BooleanFunction,
  ) {
    this.fromFn = fromFn;
    this.walks = walks;
    this.rotations = rotations;
  }

  /**
   * @java game/functions/region/sites/walk/SitesWalk.java — eval(Context)
   * Delegates to Trajectories.walkSites for graph boards or the fallback below
   * for square boards.
   */
  public eval(ctx: Context): number[] {
    // @java SitesWalk.java:76-79 — reject OFF origin
    const from = this.fromFn.eval(ctx);
    if (from < 0) return [];

    const allRotations = this.rotations.eval(ctx);
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;

    if (traj) {
      // @java SitesWalk.java:83-148 — faithfully ported in Trajectories.walkSites
      return traj.walkSites(from, this.walks, allRotations);
    }

    // Square-board fallback: reuse the COMPASS_CW turtle walk logic
    return squareBoardWalkSites(ctx, from, this.walks, allRotations);
  }
}

// ---------------------------------------------------------------------------
// Square-board fallback turtle walk
// ---------------------------------------------------------------------------

const COMPASS_CW: readonly string[] = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];
const ORTHO_SQUARE = new Set(["N", "S", "E", "W"]);

function rotateToSupported(dir: string, delta: number): string {
  let idx = COMPASS_CW.indexOf(dir);
  if (idx < 0) return dir;
  for (let g = 0; g < COMPASS_CW.length; g += 1) {
    idx = (idx + delta + COMPASS_CW.length) % COMPASS_CW.length;
    const name = COMPASS_CW[idx] as string;
    if (ORTHO_SQUARE.has(name)) return name;
  }
  return dir;
}

const DIR_DELTA: Record<string, [number, number]> = {
  N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0],
};

function squareBoardWalkSites(
  ctx: Context,
  from: number,
  walks: readonly (readonly string[])[],
  allRotations: boolean,
): number[] {
  const g = ctx.game as unknown as { equipment: { board: { width: number; height: number } } };
  const W = g.equipment.board.width;
  const H = g.equipment.board.height;
  const siteOf = (col: number, row: number): number =>
    col >= 0 && col < W && row >= 0 && row < H ? row * W + col : -1;
  const startDirs = allRotations ? ["N", "E", "S", "W"] : ["N"];
  const out: number[] = [];
  for (const startDir of startDirs) {
    for (const steps of walks) {
      let col = from % W;
      let row = Math.floor(from / W);
      let dir = startDir;
      let ok = true;
      for (const step of steps) {
        if (step === "F") {
          const d = DIR_DELTA[dir];
          if (!d) { ok = false; break; }
          col += d[0];
          row += d[1];
          if (siteOf(col, row) < 0) { ok = false; break; }
        } else if (step === "R") {
          dir = rotateToSupported(dir, +1);
        } else if (step === "L") {
          dir = rotateToSupported(dir, -1);
        }
      }
      if (ok) {
        const s = siteOf(col, row);
        if (s >= 0) out.push(s);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Factory + registration
// ---------------------------------------------------------------------------

/**
 * @java game/functions/region/sites/walk/SitesWalk.java
 * Registry key: "sites:walk" — (sites Walk [<from>] <steps> [rotations:<bool>])
 */
registerRegion1to1("sites:walk", (node: LudNode, env: Compile1to1Env): RegionFunction => {
  const { positional, named } = parseArgs1to1((node as unknown as { items: LudNode[] }).items);
  // positional[0] = "Walk" ident
  // remaining positionals: optional start-site int, then walk steps
  // named: rotations:<bool>

  let fromFn: IntFunction = { eval: (ctx: Context) => ctx._evalFrom };
  let walksNode: LudNode | undefined;

  // Scan positional[1..] for a walk node (curly list or named string)
  for (let i = 1; i < positional.length; i++) {
    const p = positional[i]!;
    if (isString(p)) {
      // Named walk like "KnightWalk"
      walksNode = p;
    } else if (isList(p) && p.delimiter === "curly") {
      walksNode = p;
    } else if (!walksNode) {
      // Try to parse as an int (start location)
      try {
        fromFn = compileInt1to1(p);
      } catch { /* ignore — might be a walk specifier */ }
    }
  }

  const walks = parseWalks(walksNode);

  const rotationsNode = named.get("rotations");
  const rotations: BooleanFunction = rotationsNode
    ? compileBool1to1(rotationsNode, env.numPlayers)
    : { eval: () => true };

  return new SitesWalk1to1(fromFn, walks, rotations);
});
