/**
 * IsRegularGraph1to1.ts
 * @java game/functions/booleans/is/regularGraph/IsRegularGraph.java
 *
 * Tests whether the induced edge-coloured graph is a k-regular graph:
 * every vertex has the same degree k. Optionally checks odd/even k.
 *
 * Java eval (lines 83-152):
 *   1. siteId = LastTo; whoSiteId from who/role.
 *   2. Build degreeInfo[v] = set of incident-edge-neighbours.
 *   3. If kValue == 0, determine k from first non-zero degree vertex.
 *   4. All vertices must have degree == k.
 *   5. If oddFn set, return k is odd; if evenFn set, return k is even.
 *
 * TS: operates on Edge-play boards using Trajectories.edgeEndpoints.
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1, compileBool1to1 } from "../../../../../../compiler1to1.js";
import { isIdent } from "@ludii/typescript-language";

function makeWhoFn(arg: import("@ludii/typescript-language").LudNode | undefined): IntFunction {
  if (arg && isIdent(arg)) {
    const roleName = arg.name.toLowerCase();
    return {
      eval: (c: Context & EvalScratch): number => {
        if (roleName === "mover") return c.state.mover;
        if (roleName === "next") return (c.state.mover % c.game.numPlayers) + 1;
        if (roleName === "neutral" || roleName === "shared") return 0;
        const m = roleName.match(/^p(\d+)$/);
        if (m) return parseInt(m[1] as string, 10);
        return c.state.mover;
      },
    };
  }
  if (arg) {
    try { return compileInt1to1(arg); }
    catch { /* fall through */ }
  }
  return { eval: (c: Context & EvalScratch) => c.state.mover };
}

export class IsRegularGraph1to1 implements BooleanFunction {
  private readonly whoFn: IntFunction;
  private readonly kFn: IntFunction;
  private readonly oddFn: BooleanFunction;
  private readonly evenFn: BooleanFunction;

  public constructor(
    whoFn: IntFunction,
    kFn: IntFunction,
    oddFn: BooleanFunction,
    evenFn: BooleanFunction,
  ) {
    this.whoFn = whoFn;
    this.kFn = kFn;
    this.oddFn = oddFn;
    this.evenFn = evenFn;
  }

  /**
   * @java game/functions/booleans/is/regularGraph/IsRegularGraph.java — eval(Context)
   */
  public eval(ctx: Context & EvalScratch): boolean {
    const siteId = ctx._evalTo;
    if (siteId < 0) return false;

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    let whoSiteId = this.whoFn.eval(ctx);
    if (whoSiteId === 0) {
      const w = ctx.state.whatAtSite(siteId);
      whoSiteId = (w === 0) ? 1 : w;
    }

    const totalVertices = traj.vertexCount;
    const totalEdges = traj.numSites;
    const oddFlag = this.oddFn.eval(ctx);
    const evenFlag = this.evenFn.eval(ctx);
    const kValue = this.kFn.eval(ctx);

    // @java IsRegularGraph.java:108-122: build degree info
    const degree = new Array<number>(totalVertices).fill(0);

    for (let k = 0; k < totalEdges; k++) {
      const ep = traj.edgeEndpoints(k);
      if (!ep) continue;
      if (ctx.state.whatAtSite(k) === whoSiteId) {
        degree[ep[0] as number]! += 1;
        degree[ep[1] as number]! += 1;
      }
    }

    // @java IsRegularGraph.java:123-134: determine k
    let deg = kValue;
    if (kValue === 0) {
      for (let i = 0; i < totalVertices; i++) {
        const d = degree[i] ?? 0;
        if (d !== 0) {
          deg = d;
          break;
        }
      }
    }

    // @java IsRegularGraph.java:136-140: all vertices must have degree == deg
    for (let i = 0; i < totalVertices; i++) {
      if (deg !== (degree[i] ?? 0)) return false;
    }

    // @java IsRegularGraph.java:141-150: odd/even checks
    if (oddFlag) return (deg % 2) === 1;
    if (evenFlag) return (deg % 2) === 0;
    return true;
  }
}

registerBool1to1("is:regulargraph", (node: LudNode, env: Compile1to1Env): BooleanFunction => {
  const { positional, named } = parseArgs1to1((node as LudList).items);
  // positional[0] = "RegularGraph"
  // positional[1] = who/role ident or expression
  // named: k, odd, even

  const whoFn = makeWhoFn(positional[1]);

  let kFn: IntFunction = { eval: () => 0 };
  const kNode = named.get("k");
  if (kNode) {
    try { kFn = compileInt1to1(kNode); } catch { /* keep default */ }
  }

  let oddFn: BooleanFunction = { eval: () => false };
  const oddNode = named.get("odd");
  if (oddNode) {
    try { oddFn = compileBool1to1(oddNode, env.numPlayers); } catch { /* keep default */ }
  }

  let evenFn: BooleanFunction = { eval: () => false };
  const evenNode = named.get("even");
  if (evenNode) {
    try { evenFn = compileBool1to1(evenNode, env.numPlayers); } catch { /* keep default */ }
  }

  return new IsRegularGraph1to1(whoFn, kFn, oddFn, evenFn);
});
