/**
 * IsAngle1to1.ts
 * @java game/functions/booleans/is/angle/IsAcute.java
 * @java game/functions/booleans/is/angle/IsObtuse.java
 * @java game/functions/booleans/is/angle/IsReflex.java
 * @java game/functions/booleans/is/angle/IsRight.java
 *
 * Detects whether two sites (satisfying cond1/cond2 respectively) form
 * a given angle type relative to each other, as seen from `at` site.
 *
 * Java eval pattern (same for all four):
 *   1. site = atFn.eval(ctx)
 *   2. originSite = context.site() (save)
 *   3. For each pair (site1, site2) with site1 < site2, site1 != site, site2 != site:
 *      a. context.setSite(site1); cond1.eval(ctx)
 *      b. context.setSite(site2); cond2.eval(ctx)
 *      c. If both conditions true: compute angle between site1 and site2
 *         using their centroids (xOf/yOf from Trajectories)
 *         angle = abs(atan2(dx, -dy)) in degrees
 *      d. Return true if angle satisfies the predicate (< 90, > 90, > 180, == 90)
 *   4. Restore context.setSite(originSite)
 *
 * TS: ctx._evalSite is the TS equivalent of Java's context.site().
 * Uses Trajectories.xOf/yOf for centroid coordinates.
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileBool1to1 } from "../../../../../../compiler1to1.js";
import { isIdent } from "@ludii/typescript-language";

type AnglePredicate = "acute" | "obtuse" | "reflex" | "right";

export class IsAngle1to1 implements BooleanFunction {
  private readonly atFn: IntFunction;
  private readonly cond1: BooleanFunction;
  private readonly cond2: BooleanFunction;
  private readonly predicate: AnglePredicate;

  public constructor(
    atFn: IntFunction,
    cond1: BooleanFunction,
    cond2: BooleanFunction,
    predicate: AnglePredicate,
  ) {
    this.atFn = atFn;
    this.cond1 = cond1;
    this.cond2 = cond2;
    this.predicate = predicate;
  }

  /**
   * @java IsAcute/IsObtuse/IsReflex/IsRight — eval(Context)
   */
  public eval(ctx: Context & EvalScratch): boolean {
    const site = this.atFn.eval(ctx);
    if (site < 0) return false;

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    const numSites = traj.numSites;
    if (site >= numSites) return false;

    // @java: originSite = context.site(); (save/restore _evalSite)
    const originSite = ctx._evalSite ?? -1;

    for (let site1 = 0; site1 < numSites; site1++) {
      if (site1 === site) continue;
      for (let site2 = site1 + 1; site2 < numSites; site2++) {
        if (site2 === site) continue;

        // @java: context.setSite(site1); condition1 = cond1.eval(context)
        ctx._evalSite = site1;
        const condition1 = this.cond1.eval(ctx);
        if (!condition1) continue;

        // @java: context.setSite(site2); condition2 = cond2.eval(context)
        ctx._evalSite = site2;
        const condition2 = this.cond2.eval(ctx);

        if (condition1 && condition2) {
          // @java: compute angle from (site1.centroid, site2.centroid)
          const x1 = traj.xOf(site1);
          const y1 = traj.yOf(site1);
          const x2 = traj.xOf(site2);
          const y2 = traj.yOf(site2);
          const difX = x2 - x1;
          const difY = y2 - y1;
          const angle = Math.abs((Math.atan2(difX, -difY) * 180) / Math.PI);

          // @java: test angle predicate
          let matches = false;
          switch (this.predicate) {
            case "acute":  matches = angle < 90;  break;
            case "obtuse": matches = angle > 90;  break;
            case "reflex": matches = angle > 180; break;
            case "right":  matches = angle === 90; break;
          }

          if (matches) {
            ctx._evalSite = originSite;
            return true;
          }
        }
      }
    }

    // @java: context.setSite(originSite)
    ctx._evalSite = originSite;
    return false;
  }
}

/** Parse angle node: positionals after the subtype ident are: [type] at:<int> cond1 cond2 */
function compileAngle(node: LudNode, env: Compile1to1Env, predicate: AnglePredicate): BooleanFunction {
  const { positional, named } = parseArgs1to1((node as LudList).items);
  // positional[0] = "Acute"/"Obtuse"/"Reflex"/"Right"
  // named: at = IntFunction
  // positional[1] = optional SiteType ident (skip)
  // positional[2], [3] = cond1, cond2 (positional OR named conditionSite/conditionSite2)

  let atFn: IntFunction = { eval: (c: Context & EvalScratch) => c._evalTo };
  const atNode = named.get("at");
  if (atNode) {
    try { atFn = compileInt1to1(atNode); } catch { /* keep default */ }
  }

  // Skip optional SiteType ident in positionals
  let posIdx = 1;
  {
    const p = positional[posIdx];
    if (p && isIdent(p)) {
      const n = p.name.toLowerCase();
      if (n === "cell" || n === "edge" || n === "vertex") posIdx++;
    }
  }

  let cond1: BooleanFunction = { eval: () => false };
  let cond2: BooleanFunction = { eval: () => false };

  const c1Node = positional[posIdx];
  posIdx++;
  const c2Node = positional[posIdx];

  if (c1Node) {
    try { cond1 = compileBool1to1(c1Node, env.numPlayers); } catch { /* keep */ }
  }
  if (c2Node) {
    try { cond2 = compileBool1to1(c2Node, env.numPlayers); } catch { /* keep */ }
  }

  return new IsAngle1to1(atFn, cond1, cond2, predicate);
}

