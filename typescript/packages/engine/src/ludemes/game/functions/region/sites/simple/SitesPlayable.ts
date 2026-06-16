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

    const g = ctx.game as unknown as Game;
    const boardN = g.equipment ? g.equipment.board.numSites : ctx.state.cells.length;
    const result: number[] = [];
    // @java boardless: cs.isPlayable(i) — a site is playable when it is empty
    // AND adjacent to a placed piece (the board grows outward from the played
    // region). Without this, (sites Playable) was [] on a boardless board (the
    // pre-allocated off-board cells aren't "empty" yet) and Andantino/Ringo
    // generated no moves. Falls through to all-empties on a normal board.
    const board = g.equipment?.board as unknown as { isBoardless?(): boolean } | undefined;
    if (board?.isBoardless?.()) {
      const topo = (ctx as unknown as { topology?(): { getGraphElements(t: string): Array<{ index(): number; neighbours(): Array<{ index(): number }> }> } }).topology?.();
      const playType = (g.equipment.board as unknown as { defaultSite?: string | (() => string) }).defaultSite;
      const playTypeName = typeof playType === "function" ? playType() : (playType ?? "Cell");
      const els = topo?.getGraphElements(playTypeName) ?? [];
      for (let i = 0; i < boardN; i++) {
        if (!ctx.state.isEmptySite(i)) continue;
        const el = els[i];
        if (!el) continue;
        let adjOccupied = false;
        for (const nb of el.neighbours()) {
          if (!ctx.state.isEmptySite(nb.index())) { adjOccupied = true; break; }
        }
        if (adjOccupied) result.push(i);
      }
      return result;
    }
    // @java SitesPlayable — non-boardless fallback: return all empty board sites
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
