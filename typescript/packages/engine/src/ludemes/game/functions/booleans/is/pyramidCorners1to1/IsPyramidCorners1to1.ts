/**
 * IsPyramidCorners1to1.ts
 * @java game/functions/booleans/is/pyramidCorners/IsPyramidCorners.java
 *
 * Detects pyramid corner configurations in 3D stacking games (e.g. Shibumi).
 *
 * Java eval (lines 69-163):
 *   1. For each pivot site (from fromFn or fromsFn):
 *      a. Try "down" search: step DNW/DNE/DSW/DSE repeatedly.
 *         At each step, check that all 4 corners have the same what as the pivot.
 *         If found, return true.
 *      b. Try "up" search: step UNW/UNE/USW/USE repeatedly.
 *         Same check.
 *
 * TS: uses Trajectories.steps for the pyramid diagonal directions (DNW, DNE,
 * DSW, DSE, UNW, UNE, USW, USE). These are supported on 3D boards only.
 * On planar boards this always returns false (steps return empty).
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileRegion1to1 } from "../../../../../../compiler1to1.js";
import { isIdent } from "@ludii/typescript-language";

// @java IsPyramidCorners.java:96-101 — down directions (descend)
const DOWN_DIRS = ["DNW", "DNE", "DSW", "DSE"] as const;
// @java IsPyramidCorners.java:130-135 — up directions (ascend)
const UP_DIRS = ["UNW", "UNE", "USW", "USE"] as const;

export class IsPyramidCorners1to1 implements BooleanFunction {
  private readonly fromFn: IntFunction;
  private readonly fromsFn: RegionFunction | null;

  public constructor(fromFn: IntFunction, fromsFn: RegionFunction | null) {
    this.fromFn = fromFn;
    this.fromsFn = fromsFn;
  }

  /**
   * @java game/functions/booleans/is/pyramidCorners/IsPyramidCorners.java — eval(Context)
   */
  public eval(ctx: Context & EvalScratch): boolean {
    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    // @java IsPyramidCorners.java:72-82: collect pivots
    const pivots: number[] = [];
    if (this.fromsFn !== null) {
      pivots.push(...this.fromsFn.eval(ctx));
    } else {
      pivots.push(this.fromFn.eval(ctx));
    }

    for (const from of pivots) {
      if (from < 0 || from >= traj.numSites) continue;

      const fromWhat = ctx.state.whatAtSite(from);

      // @java IsPyramidCorners.java:103-124 — down search
      {
        const sitesEncountered = [from, from, from, from];
        let downsearching = true;
        while (downsearching) {
          const idEncountered = [-1, -1, -1, -1];
          let allOk = true;
          for (let i = 0; i < 4; i++) {
            const steps = traj.steps(sitesEncountered[i]!, DOWN_DIRS[i]!);
            if (steps.length !== 1) {
              downsearching = false;
              allOk = false;
              break;
            }
            sitesEncountered[i] = steps[0]!;
            idEncountered[i] = ctx.state.whatAtSite(steps[0]!);
          }
          if (!allOk) break;
          // @java IsPyramidCorners.java:120-123: all 4 corners have same what as pivot
          if (
            idEncountered[0] === idEncountered[1] &&
            idEncountered[1] === idEncountered[2] &&
            idEncountered[2] === idEncountered[3] &&
            idEncountered[0] !== -1 &&
            idEncountered[3] === fromWhat
          ) {
            return true;
          }
        }
      }

      // @java IsPyramidCorners.java:141-162 — up search
      {
        const sitesEncountered = [from, from, from, from];
        let upsearching = true;
        while (upsearching) {
          const idEncountered = [-1, -1, -1, -1];
          let allOk = true;
          for (let i = 0; i < 4; i++) {
            const steps = traj.steps(sitesEncountered[i]!, UP_DIRS[i]!);
            if (steps.length !== 1) {
              upsearching = false;
              allOk = false;
              break;
            }
            sitesEncountered[i] = steps[0]!;
            idEncountered[i] = ctx.state.whatAtSite(steps[0]!);
          }
          if (!allOk) break;
          // @java IsPyramidCorners.java:154-157
          if (
            idEncountered[0] === idEncountered[1] &&
            idEncountered[1] === idEncountered[2] &&
            idEncountered[2] === idEncountered[3] &&
            idEncountered[0] !== -1 &&
            idEncountered[3] === fromWhat
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }
}

registerBool1to1("is:pyramidcorners", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  const { positional, named } = parseArgs1to1((node as LudList).items);
  // Java: IsPyramidCorners(SiteType type, @Opt @Or IntFunction from, @Opt @Or RegionFunction froms)
  // LUD syntax: (is PyramidCorners <type> [from:<int>] [froms:<region>])
  // positional[0] = "PyramidCorners"
  // positional[1] = SiteType ident (required in Java)

  let idx = 1;
  // Skip optional SiteType ident
  {
    const p = positional[idx];
    if (p && isIdent(p)) {
      const n = p.name.toLowerCase();
      if (n === "cell" || n === "edge" || n === "vertex") idx++;
    }
  }

  // from: named or positional, default = LastTo
  let fromFn: IntFunction = { eval: (c: Context & EvalScratch) => c._evalTo };
  const fromNode = named.get("from") ?? positional[idx];
  if (fromNode && !isIdent(fromNode)) {
    try { fromFn = compileInt1to1(fromNode); idx++; }
    catch { /* keep default */ }
  }

  // froms: optional region
  let fromsFn: RegionFunction | null = null;
  const fromsNode = named.get("froms");
  if (fromsNode) {
    try { fromsFn = compileRegion1to1(fromsNode); } catch { /* keep null */ }
  }

  return new IsPyramidCorners1to1(fromFn, fromsFn);
});
