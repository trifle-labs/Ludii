/**
 * IsSpanningTree1to1.ts
 * @java game/functions/booleans/is/tree/IsSpanningTree.java
 *
 * Tests whether the induced edge-coloured subgraph is a spanning tree:
 *   1. No cycles (tree property) AND
 *   2. Exactly (vertexCount - 1) edges selected (spanning property)
 *
 * Java eval summary (lines 60-107):
 *   Identical union-find to IsTree but also counts edges and checks
 *   totalExistingEdges == totalVertices - 1.
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import { Player1to1 } from "../../../../util/moves/Player1to1.js";
import { compileInt1to1 } from "../../../../../../compiler1to1.js";
import { isIdent } from "@ludii/typescript-language";

function findRoot(parent: number[], pos: number): number {
  while (parent[pos] !== pos) {
    parent[pos] = parent[parent[pos] as number] as number;
    pos = parent[pos] as number;
  }
  return pos;
}

function roleToIntFunction(role: RoleTypeFull): IntFunction {
  const roleName = role.toLowerCase();
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

function makeWhoArg(arg: import("@ludii/typescript-language").LudNode | undefined): { who: Player1to1 | null; role: RoleTypeFull | null } {
  if (arg && isIdent(arg)) return { who: null, role: arg.name as RoleTypeFull };
  if (arg) {
    try { return { who: new Player1to1(compileInt1to1(arg)), role: null }; }
    catch { /* fall through */ }
  }
  return { who: new Player1to1(null), role: null };
}

export class IsSpanningTree1to1 implements BooleanFunction {
  private readonly whoFn: IntFunction;

  /**
   * @java IsSpanningTree(@Or Player who, @Or RoleType role)
   */
  public constructor(who: Player1to1 | null, role: RoleTypeFull | null) {
    this.whoFn = (role !== null) ? roleToIntFunction(role) : who!.index();
  }

  /**
   * @java game/functions/booleans/is/tree/IsSpanningTree.java — eval(Context)
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
    const parent = new Array<number>(totalVertices);
    for (let i = 0; i < totalVertices; i++) parent[i] = i;

    // @java IsSpanningTree.java:84-98
    const numEdges = traj.numSites;
    let totalExistingEdges = 0;
    for (let k = numEdges - 1; k >= 0; k--) {
      if (ctx.state.whatAtSite(k) !== whoSiteId) continue;
      const endpoints = traj.edgeEndpoints(k);
      if (!endpoints) continue;
      const aRoot = findRoot(parent, endpoints[0]);
      const bRoot = findRoot(parent, endpoints[1]);
      if (aRoot === bRoot) return false;
      parent[aRoot] = bRoot;
      totalExistingEdges++;
    }

    // @java IsSpanningTree.java:97-98
    if (totalExistingEdges !== (totalVertices - 1)) return false;
    return true;
  }
}

