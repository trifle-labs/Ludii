/**
 * SitesPattern.ts
 * @java game/functions/region/sites/pattern/SitesPattern.java
 *
 * (sites Pattern <walk> [from:<int>] [what:<int>] [whats:{<int>...}])
 * Returns the sites that match a repeating "what" sequence along a turtle walk.
 *
 * Java eval (SitesPattern.java:79-176):
 *   - For each supported-orthogonal start direction:
 *       - Check from-site's what matches whats[0].
 *       - Walk the steps sequence; for each F step verify what matches the
 *         repeating whats cycle; for R/L rotate the heading.
 *       - If all F-steps match → append all pattern sites.
 *   - Return collected (possibly duplicated per rotation) pattern sites.
 *
 * TS: uses Trajectories.walkSites for graph boards (but here we need the
 * intermediate sites, not just the landing site). We implement the full
 * turtle walk inline, mirroring SitesWalk.ts's square-board fallback.
 */

import type { Context } from "../../../../../../context.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COMPASS_CW: readonly string[] = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

function rotateToSupported(dir: string, delta: number, supported: ReadonlySet<string>): string {
  let idx = COMPASS_CW.indexOf(dir);
  if (idx < 0) return dir;
  for (let g = 0; g < COMPASS_CW.length; g += 1) {
    idx = (idx + delta + COMPASS_CW.length) % COMPASS_CW.length;
    const name = COMPASS_CW[idx] as string;
    if (supported.has(name)) return name;
  }
  return dir;
}

/**
 * Take one step forward from `site` in `dir` on a graph board.
 * @java SitesWalk.java:109-127 — F step: keep the LAST same-type step.
 */
function forwardOnTraj(traj: Trajectories, site: number, dir: string): number {
  const tos = traj.steps(site, dir);
  // @java SitesWalk.java:119 — keeps the LAST same-type step
  return tos.length > 0 ? (tos[tos.length - 1] as number) : -1;
}

/**
 * Take one step forward from `site` in `dir` on a square board.
 */
const DIR_DELTA: Record<string, [number, number]> = {
  N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0],
};

function forwardSquare(
  site: number, dir: string, W: number, H: number,
): number {
  const d = DIR_DELTA[dir];
  if (!d) return -1;
  const col = site % W + d[0];
  const row = Math.floor(site / W) + d[1];
  if (col < 0 || col >= W || row < 0 || row >= H) return -1;
  return row * W + col;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class SitesPattern implements RegionFunction {
  private readonly walk: readonly string[];
  private readonly fromFn: IntFunction;
  private readonly whatsFns: readonly IntFunction[] | null;

  /**
   * @java game/functions/region/sites/pattern/SitesPattern.java — constructor
   */
  public constructor(
    walk: readonly string[],
    fromFn: IntFunction,
    whatsFns: readonly IntFunction[] | null,
  ) {
    this.walk = walk;
    this.fromFn = fromFn;
    this.whatsFns = whatsFns;
  }

  /**
   * @java game/functions/region/sites/pattern/SitesPattern.java — eval(Context)
   */
  public eval(ctx: Context): number[] {
    const from = this.fromFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;

    // @java SitesPattern.java:95-105 — resolve whats array
    const whats: number[] = this.whatsFns
      ? this.whatsFns.map((fn) => fn.eval(ctx))
      : [ctx.state.what(from)];
    if (whats.length === 0) return [];

    // @java SitesPattern.java:118-119 — from must match whats[0]
    if (ctx.state.what(from) !== whats[0]) return [];

    // @java SitesPattern.java:107-110 — get supported orthogonal directions
    let startDirs: readonly string[];
    let supported: ReadonlySet<string>;
    if (traj) {
      startDirs = traj.supportedOrthogonalDirNames();
      supported = new Set(startDirs);
    } else {
      startDirs = ["N", "E", "S", "W"];
      supported = new Set(["N", "E", "S", "W"]);
    }

    const out: number[] = [];

    for (const startDir of startDirs) {
      const pattern: number[] = [];
      let currentLoc = from;
      let currentDir = startDir;
      let whatIndex = 0;

      // @java SitesPattern.java:118-120 — check from
      if (ctx.state.what(from) !== whats[whatIndex]) {
        // Already checked above, but per-rotation recheck just in case
        continue;
      }
      whatIndex = (whatIndex + 1) % whats.length;
      pattern.push(currentLoc);

      let correctPattern = true;
      for (const step of this.walk) {
        if (step === "F") {
          // @java SitesPattern.java:129-154 — forward step + what check
          const to = traj
            ? forwardOnTraj(traj, currentLoc, currentDir)
            : forwardSquare(currentLoc, currentDir,
                (ctx.game as unknown as { equipment: { board: { width: number; height: number } } }).equipment.board.width,
                (ctx.game as unknown as { equipment: { board: { width: number; height: number } } }).equipment.board.height);
          currentLoc = to;
          if (to < 0 || ctx.state.what(to) !== whats[whatIndex]) {
            correctPattern = false;
            break;
          }
          pattern.push(to);
          whatIndex = (whatIndex + 1) % whats.length;
        } else if (step === "R") {
          // @java SitesPattern.java:156-160
          currentDir = rotateToSupported(currentDir, +1, supported);
        } else if (step === "L") {
          // @java SitesPattern.java:161-166
          currentDir = rotateToSupported(currentDir, -1, supported);
        }
      }

      if (correctPattern) {
        out.push(...pattern);
      }
    }

    return out;
  }
}

// ---------------------------------------------------------------------------
// Factory + registration
// ---------------------------------------------------------------------------

/**
 * @java game/functions/region/sites/pattern/SitesPattern.java
 * Registry key: "sites:pattern" —
 *   (sites Pattern <walk> [from:<int>] [what:<int>] [whats:{<int>...}])
 */
