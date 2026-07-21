/**
 * IsRegularGraph.ts
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
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import { Player } from "../../../../util/moves/Player.js";
import { isIdent } from "@ludii/typescript-language";

const ZERO_INT: IntFunction = { eval: () => 0 };
const FALSE_BOOL: BooleanFunction = { eval: () => false };

function roleToIntFunction(role: RoleTypeFull | null): IntFunction {
  const key = (role ?? "Mover").toLowerCase();
  return {
    eval(ctx: Context & EvalScratch): number {
      if (key === "neutral") return 0;
      if (key === "mover") return ctx.state.mover;
      if (key === "next") return ctx.state.next || ((ctx.state.mover % ctx.game.numPlayers) + 1);
      if (key === "prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (key === "player") return ctx._evalPlayer ?? ctx.state.mover;
      if (key === "shared" || key === "all" || key === "each") return ctx.game.numPlayers + 1;

      const playerMatch = /^p(\d+)$/.exec(key);
      if (playerMatch) return Number(playerMatch[1]);

      const teamMatch = /^team(\d+)$/.exec(key);
      if (teamMatch) return Number(teamMatch[1]);

      if (key === "teammover") {
        const stateWithTeams = ctx.state as unknown as { getTeam?: (player: number) => number };
        return stateWithTeams.getTeam?.(ctx.state.mover) ?? ctx.state.mover;
      }

      return -1;
    },
  };
}

export class IsRegularGraph implements BooleanFunction {
  private readonly whoFn: IntFunction;
  private readonly kFn: IntFunction;
  private readonly oddFn: BooleanFunction;
  private readonly evenFn: BooleanFunction;

  /**
   * @java IsRegularGraph(Player who, RoleType role, IntFunction k,
   *                      BooleanFunction odd, BooleanFunction even)
   */
  public constructor(
    who: Player | null,
    role: RoleTypeFull | null,
    k?: IntFunction | null,
    odd?: BooleanFunction | null,
    even?: BooleanFunction | null,
  ) {
    this.whoFn = who !== null ? who.index() : roleToIntFunction(role);
    this.kFn = k ?? ZERO_INT;
    this.oddFn = odd ?? FALSE_BOOL;
    this.evenFn = even ?? FALSE_BOOL;
  }

  /**
   * @java game/functions/booleans/is/regularGraph/IsRegularGraph.java — eval(Context)
   */
  public eval(ctx: Context & EvalScratch): boolean {
    // @java new LastTo(null).eval(context) — these predicates key on the
    // LAST MOVE's destination (IsTreeCentre.java:55 et al.), NOT the (to)
    // iterator binding: _evalTo is faithfully OFF inside (then ...) since the
    // EvalContext lifecycle fix, which silenced Ilpion/DisPath/MaxMatch
    // scoring (winner flatlined to 0).
    const lastMove = ctx.trial.lastMove();
    const siteId = lastMove ? lastMove.toNonDecision() : -1;
    if (siteId < 0) return false;

    const ctxAny = ctx as unknown as { _trajectories?: Trajectories | null };
    const traj = ctxAny._trajectories;
    if (!traj) return false;

    let whoSiteId = this.whoFn.eval(ctx);
    if (whoSiteId === 0) {
      const w = ctx.state.what(siteId);
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
      if (ctx.state.what(k) === whoSiteId) {
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

