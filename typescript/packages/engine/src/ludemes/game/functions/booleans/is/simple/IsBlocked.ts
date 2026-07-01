// @java Core/src/game/functions/booleans/is/connect/IsBlocked.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, RegionFunction } from "../../../../../base.js";
import {
  type BoardLike,
  ownerAt,
  adjacentSites,
  directionalNeighbours,
  connectionTargets,
  rolePlayer,
} from "../connect/IsConnected.js";

/**
 * `(is Blocked <role>)` — detects whether a player can no longer possibly
 * connect their target regions, i.e. even flooding through every site they own
 * OR that is still empty cannot reach the required number of regions.
 *
 * @java game/functions/booleans/is/connect/IsBlocked.java — same shape as
 * IsConnected, but the flood traverses own-OR-empty sites (potential
 * connectivity) rather than only owned sites, and it returns TRUE when the
 * connection is impossible (blocked). Used by connection games' elimination
 * rules, e.g. Three-Player Hex `(forEach NonMover if:(is Blocked Player)
 * (result Player Loss))`.
 */
export class IsBlocked implements BooleanFunction {
  /** @java IsBlocked.regionsToConnectFn */
  private readonly regions: readonly RegionFunction[] | null;
  /** @java IsBlocked.roleFunc — null → mover. */
  private readonly role: string | null;
  /** @java IsBlocked.staticRegions — RegionTypeStatic (e.g. Sides). */
  private readonly regionType: string | null;
  /** @java IsBlocked.number — minimum number of regions to connect. */
  private readonly numberFn: { eval(ctx: unknown): number } | number | null;
  /** @java IsBlocked.dirnChoice — flood connectivity (null = board adjacency). */
  private readonly dirName: string | null;

  public constructor(
    regions: readonly RegionFunction[] | null = null,
    role: string | null = null,
    regionType: string | null = null,
    numberFn: { eval(ctx: unknown): number } | number | null = null,
    dirName: string | null = null,
  ) {
    this.regions = regions;
    this.role = role;
    this.regionType = regionType;
    this.numberFn = numberFn;
    this.dirName = dirName;
  }

  /**
   * @java IsBlocked.eval(Context) — for each site of the first target region,
   * flood over own-or-empty sites; if any such flood can still reach the
   * required number of the player's regions, the player is NOT blocked
   * (return false). If no start site can reach enough regions, return true.
   */
  public eval(ctx: Context): boolean {
    // @java who = (roleFunc != null) ? roleFunc.eval(context) : context.state().mover();
    const who = this.role !== null ? rolePlayer(ctx, this.role) : ctx.state.mover;
    const targets = connectionTargets(ctx, this.regionType, this.regions, who);
    // @java sitesRegions.get(0) — nothing to connect ⇒ never blocked.
    if (targets.length === 0) return false;

    // @java numRegionToConnect = (number != null) ? number.eval : sitesRegions.size();
    const required = this.numberFn === null
      ? targets.length
      : typeof this.numberFn === "number"
        ? this.numberFn
        : this.numberFn.eval(ctx);
    if (required <= 1) return false;

    const board = (ctx.game as unknown as { equipment: { board: BoardLike } }).equipment.board;
    // @java originalRegion = sitesRegions.get(0); iterate its sites as flood seeds.
    const originalRegion = targets[0]!;
    const otherRegions = targets.slice(1).map((sites) => new Set(sites));

    for (const from of originalRegion) {
      // @java seed the group only if `from` is owned by `who` or is empty.
      const ownerFrom = ownerAt(ctx, from);
      if (ownerFrom !== who && ownerFrom !== 0) continue;

      // @java numRegionConnected starts at 1 (region 0 is the seed region).
      const remaining = otherRegions.map((s) => new Set(s));
      let numConnected = 1;
      if (numConnected >= required) return false;

      const group = new Set<number>([from]);
      const stack = [from];
      while (stack.length > 0) {
        const site = stack.pop()!;
        const neighbours = this.dirName !== null
          ? directionalNeighbours(ctx, site, this.dirName)
          : adjacentSites(board, site);
        for (const to of neighbours) {
          if (group.has(to)) continue;
          // @java own-OR-empty traversal: who == cs.who(to) || cs.what(to) == 0.
          const ownerTo = ownerAt(ctx, to);
          if (ownerTo !== who && ownerTo !== 0) continue;
          group.add(to);
          stack.push(to);
          for (let k = remaining.length - 1; k >= 0; k -= 1) {
            if (remaining[k]!.has(to)) {
              numConnected += 1;
              remaining.splice(k, 1);
              // @java if enough regions connected we return false (not blocked).
              if (numConnected >= required) return false;
            }
          }
        }
      }
    }

    // @java no seed site could reach the required regions ⇒ blocked.
    return true;
  }
}
