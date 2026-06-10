/**
 * IsFreedom1to1.ts
 * @java game/functions/booleans/is/component/IsFreedom.java
 *
 * Tests if a region has "freedom": some site in the region is adjacent to at
 * least one empty board site (excluding the toPlace site). This is essentially
 * the "liberty" check for Go-like games.
 *
 * Java eval (lines 69-103):
 *   1. pid = locnFn.eval(ctx) if locnFn != null (the site being placed)
 *   2. listPivots = region.eval(ctx).sites()
 *   3. For each loc in listPivots:
 *      - Check N/S/E/W neighbours (trajectories.steps(type, loc, type, dir))
 *      - For each neighbour: if neigh != pid AND what == 0 AND layer == 0 → return true
 *   4. return false
 *
 * TS: uses Trajectories.steps for N/S/E/W. Layer == 0 check: for planar boards
 * zOf(site) == 0; for pyramid boards, also check zOf(site) == 0.
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, RegionFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { SiteType } from "../../../../../../action/site-type.js";
import { isIdent } from "@ludii/typescript-language";

const CARDINAL_DIRS = ["N", "S", "E", "W"] as const;

export class IsFreedom1to1 implements BooleanFunction {
  private readonly regionFn: RegionFunction;
  private readonly locnFn: IntFunction | null;

  public constructor(type: SiteType | null | undefined, inFn: RegionFunction, toPlace: IntFunction | null = null) {
    void type;
    this.regionFn = inFn;
    this.locnFn = toPlace ?? null;
  }

  /**
   * @java game/functions/booleans/is/component/IsFreedom.java — eval(Context)
   */
  public eval(ctx: Context & EvalScratch): boolean {
    // @java IsFreedom.java:71-72 — pid = locnFn.eval(ctx) if present
    const pid = this.locnFn !== null ? this.locnFn.eval(ctx) : -1;

    // @java IsFreedom.java:73 — listPivots = region.eval(ctx).sites()
    const pivots = this.regionFn.eval(ctx);

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    for (const loc of pivots) {
      // @java IsFreedom.java:79-86: steps in N/S/E/W
      for (const dir of CARDINAL_DIRS) {
        const neighbours = traj.steps(loc, dir);
        for (const neigh of neighbours) {
          if (neigh === pid) continue;
          const what = ctx.state.whatAtSite(neigh);
          // @java IsFreedom.java:96-98: what == 0 AND layer == 0
          // layer = 0 for ground-level sites; use zOf for pyramid boards
          const layer = traj.zOf(neigh);
          if (what === 0 && layer === 0) {
            return true;
          }
        }
      }
    }

    return false;
  }
}

