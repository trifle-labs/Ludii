// @java Core/src/game/functions/region/sites/simple/SitesPlayable.java

/**
 * Returns the playable sites of any boardless game.
 *
 * @java game/functions/region/sites/simple/SitesPlayable.java
 * @author Eric.Piette and cambolbro
 *
 * @remarks For non-boardless games, it returns the sites around the current
 *          occupied sites of the board.
 *          Used on any boardless game to play all the pieces in a unique group.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import type { Game } from "../../../../../Game.js";

/**
 * Returns the playable sites of any boardless game.
 *
 * @java game/functions/region/sites/simple/SitesPlayable.java
 *
 * Java parity:
 *   - For non-boardless games: if first move, return centre sites;
 *     otherwise return sites around occupied cells.
 *   - For boardless games: return sites where cs.isPlayable(index) == true.
 *
 * TS: the boardless/playable flag is not present in the lightweight state.
 *     We check for a _playableSites property on context (deferred extension),
 *     and fall back to returning all empty board sites.
 */
export class SitesPlayable extends BaseRegionFunction {
  /**
   * @java SitesPlayable constructor — nothing to initialise.
   */
  public constructor() {
    super();
  }

  /**
   * Returns the playable sites.
   *
   * @java SitesPlayable.eval(Context)
   *
   * Java parity:
   *   - Boardless: return cs.isPlayable(index) sites.
   *   - Non-boardless: if move 0 return Centre, else sites around occupied.
   *
   * TS: check for _playableSites extension, fall back to empty sites.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java ContainerState.isPlayable(index) — check for explicit playable set
    const ctxAny = ctx as unknown as { _playableSites?: readonly boolean[] };
    if (ctxAny._playableSites) {
      const result: number[] = [];
      for (let i = 0; i < ctxAny._playableSites.length; i++) {
        if (ctxAny._playableSites[i]) result.push(i);
      }
      return result;
    }

    // @java SitesPlayable — non-boardless fallback: return all empty board sites
    const g = ctx.game as unknown as Game;
    const boardN = g.equipment ? g.equipment.board.numSites : ctx.state.cells.length;
    const result: number[] = [];
    for (let i = 0; i < boardN; i++) {
      if (ctx.state.isEmptySite(i)) result.push(i);
    }
    return result;
  }

  /** @java SitesPlayable.isStatic() — always false (depends on game state) */
  public override isStatic(): boolean {
    return false;
  }

  /** @java SitesPlayable.toString() */
  public override toString(): string {
    return "Playable()";
  }
}
