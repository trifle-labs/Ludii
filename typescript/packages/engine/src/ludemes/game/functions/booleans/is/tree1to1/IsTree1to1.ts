/**
 * IsTree1to1.ts
 * @java game/functions/booleans/is/tree/IsTree.java
 *
 * Tests whether the induced graph (by the coloured edges) is a tree (acyclic
 * connected subgraph) for the given player. Operates on Edge-play boards where
 * site indices correspond to edges and the Trajectories object exposes
 * edgeEndpoints(site) → [vA, vB].
 *
 * Java eval summary:
 *   1. siteId = LastTo (context._evalTo)
 *   2. whoSiteId = who.eval(context); if 0 use what at siteId or 1
 *   3. Build union-find over graph vertices (vertexCount from Trajectories)
 *   4. For each edge k (high-to-low): if state.whatAtSite(k) == whoSiteId,
 *      find vA/vB roots; if same → cycle → return false; else union them
 *   5. Return true (no cycles found)
 */

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction, EvalScratch } from "../../../../../base.js";
import type { LudNode, LudList } from "@ludii/typescript-language";
import type { Trajectories } from "../../../../../../eval/graph/trajectories.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import { Player1to1 } from "../../../../util/moves/Player1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import { parseArgs1to1, compileInt1to1 } from "../../../../../../compiler1to1.js";
import { isIdent } from "@ludii/typescript-language";

/** Union-Find: find root with path-compression. */
function findRoot(parent: number[], pos: number): number {
  while (parent[pos] !== pos) {
    // path halving
    parent[pos] = parent[parent[pos] as number] as number;
    pos = parent[pos] as number;
  }
  return pos;
}

function roleToIntFunction(role: RoleTypeFull): IntFunction {
  const key = role.toLowerCase();
  return {
    eval(ctx: Context & EvalScratch): number {
      if (key === "mover") return ctx.state.mover;
      if (key === "next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (key === "prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (key === "player") return ctx._evalPlayer ?? ctx.state.mover;
      if (key === "neutral" || key === "shared") return 0;

      const playerMatch = /^p(\d+)$/.exec(key);
      if (playerMatch) return Number(playerMatch[1]);

      const teamMatch = /^team(\d+)$/.exec(key);
      if (teamMatch) return Number(teamMatch[1]);

      return ctx.state.mover;
    },
  };
}

export class IsTree1to1 implements BooleanFunction {
  private readonly whoFn: IntFunction;

  /**
   * @java IsTree(@Or Player who, @Or RoleType role)
   */
  public constructor(who: Player1to1 | null, role: RoleTypeFull | null) {
    this.whoFn = role != null ? roleToIntFunction(role) : who!.index();
  }

  /**
   * @java game/functions/booleans/is/tree/IsTree.java — eval(Context)
   */
  public eval(ctx: Context & EvalScratch): boolean {
    // @java IsTree.java:55 — siteId = new LastTo(null).eval(context)
    const siteId = ctx._evalTo;
    if (siteId < 0) return false;

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    // @java IsTree.java:65 — int whoSiteId = who.eval(context)
    let whoSiteId = this.whoFn.eval(ctx);
    if (whoSiteId === 0) {
      // @java IsTree.java:69-75
      const w = ctx.state.whatAtSite(siteId);
      whoSiteId = (w === 0) ? 1 : w;
    }

    // @java IsTree.java:77-80 — initialise union-find parent array
    const totalVertices = traj.vertexCount;
    const parent = new Array<number>(totalVertices);
    for (let i = 0; i < totalVertices; i++) parent[i] = i;

    // @java IsTree.java:82-93 — walk edges high-to-low, union vertices
    const numEdges = traj.numSites;
    for (let k = numEdges - 1; k >= 0; k--) {
      if (ctx.state.whatAtSite(k) !== whoSiteId) continue;
      const endpoints = traj.edgeEndpoints(k);
      if (!endpoints) continue;
      const aRoot = findRoot(parent, endpoints[0]);
      const bRoot = findRoot(parent, endpoints[1]);
      if (aRoot === bRoot) return false; // cycle detected
      parent[aRoot] = bRoot;
    }
    return true;
  }
}

