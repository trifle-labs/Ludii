// @java Core/src/game/functions/region/sites/player/SitesHand.java

/**
 * Returns all the sites in a specific hand.
 *
 * @java game/functions/region/sites/player/SitesHand.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game } from "../../../../../Game.js";

/** Mirror of Java RoleType values used by SitesHand. */
type RoleType = "Mover" | "Next" | "Shared" | "P1" | "P2" | "P3" | "P4" | string;

/**
 * Resolve a RoleType to a 1-based player id against the current context.
 * @java game/types/play/RoleType.java — toIntFunction(role).eval(context)
 */
function roleToPlayerId(role: RoleType, ctx: Context, numPlayers: number): number {
  switch (role) {
    case "Mover": return ctx.state.mover;
    case "Next": return (ctx.state.mover % numPlayers) + 1;
    case "Prev": return ((ctx.state.mover + numPlayers - 2) % numPlayers) + 1;
    case "Shared": case "All": return numPlayers + 1; // @java RoleType.Shared.owner() post-create
    default: {
      const m = /^P(\d+)$/.exec(role);
      return m ? parseInt(m[1]!, 10) : -1;
    }
  }
}

/**
 * Returns all the sites in a specific hand.
 *
 * @java game/functions/region/sites/player/SitesHand.java
 */
export class SitesHand extends BaseRegionFunction {
  /** @java SitesHand — index (player IntFunction from RoleType or Player) */
  private readonly index: IntFunction | null;

  /** @java SitesHand — role (RoleType for Shared handling) */
  private readonly role: RoleType | null;

  /**
   * @param index  The player index function (from RoleType.toIntFunction or player.index()).
   * @param role   The RoleType (for Shared special handling).
   * @java SitesHand constructor
   */
  public constructor(index: IntFunction | null, role: RoleType | null) {
    super();
    this.index = index;
    this.role = role;
  }

  /**
   * Returns all the sites in the hand of the specified player.
   *
   * @java SitesHand.eval(Context)
   *
   * Java parity:
   *   1. If precomputed, return it.
   *   2. If index is null, return empty region.
   *   3. Evaluate pid = index.eval(context).
   *   4. Validate pid in [1, numPlayers].
   *   5. Iterate containers; find the first Hand container owned by pid (or Shared).
   *   6. Build site array: sitesFrom[id] + i for each i in 0..numSites-1.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const g = ctx.game as unknown as Game;
    const numPlayers = g.numPlayers;

    // @java SitesHand constructor — index = (indexPlayer != null) ? indexPlayer.index()
    //   : (role != null) ? RoleType.toIntFunction(role) : null.
    // The TS ctor stores the role separately, so resolve the pid from the role here
    // when no explicit index function was bound (e.g. `(sites Hand Mover)`).
    let pid: number;
    if (this.index !== null) {
      pid = this.index.eval(ctx);
    } else if (this.role !== null) {
      pid = roleToPlayerId(this.role, ctx, numPlayers);
    } else {
      return [];
    }

    // @java SitesHand — validate pid. The SHARED hand's owner is numPlayers+1
    // (RoleType.Shared), so the upper bound must admit it — (sites Hand Shared)
    // on a (hand Shared) returned [] when pid=3 was rejected as > numPlayers
    // (Odd's copy-from-shared-hand generated no moves).
    if (pid < 1 || pid > numPlayers + 1) {
      return [];
    }

    // @java SitesHand.eval — for (final Container c : context.containers()) {
    //   if (c.isHand()) { if (role == RoleType.Shared || c.owner() == pid) { ... return sites; } } }
    // ctx.containers() (unlike equipment.hands/handSiteFor) already matches
    // Java's Dice.isHand()==true override (Dice.java) faithfully — it
    // includes a synthetic Dice container with isHand()=true whenever the
    // game declares (dice ...) equipment. Routing through it (instead of
    // equipment.hands, which excludes Dice containers) lets
    // (sites Hand Shared) see dice sites when a game has no separate
    // (hand ...) ludeme (e.g. Li'b el-Merafib's WinningCommonCondition
    // union, which only declares a Dice container).
    // @java the Shared hand is stored with owner 0 (the shared/neutral
    // convention) even though RoleType.Shared resolves pid = numPlayers+1;
    // match either so (sites Hand Shared) sees both slots (Odd: size 2).
    const isSharedRole = this.role === "Shared" || this.role === "All";
    const containers = ctx.containers();
    const sitesFrom = ctx.sitesFrom();

    for (let id = 0; id < containers.length; id++) {
      const c = containers[id]!;
      if (!c.isHand()) continue;
      const owner = c.owner();
      if (!(isSharedRole || owner === pid || (pid === numPlayers + 1 && owner === 0))) continue;

      const size = c.numSites();
      const base = sitesFrom[id];
      if (base === undefined) return [];

      const sites: number[] = [];
      for (let i = 0; i < size; i++) {
        sites.push(base + i);
      }
      return sites;
    }

    return [];
  }

  /** @java SitesHand.isStatic() */
  public override isStatic(): boolean {
    if (this.index !== null) {
      return (this.index as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    }
    return true;
  }

  /** @java SitesHand.isHand() — returns true */
  public override isHand(): boolean {
    return true;
  }

  /** @java SitesHand.toString() */
  public override toString(): string {
    return "Hand()";
  }
}
