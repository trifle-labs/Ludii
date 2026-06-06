// @java Core/src/game/functions/region/sites/simple/SitesLineOfPlay.java

/**
 * Returns the line of play of any dominoes games.
 *
 * @java game/functions/region/sites/simple/SitesLineOfPlay.java
 * @author Eric.Piette
 *
 * @remarks Works only for dominoes game, return an empty region for any other
 *          games.
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/**
 * Returns the line of play of any dominoes games.
 *
 * @java game/functions/region/sites/simple/SitesLineOfPlay.java
 *
 * Java parity:
 *   - For non-boardless: if first move return Centre sites, else sites around occupied.
 *   - For boardless: return cs.isPlayable(index) sites.
 */
export class SitesLineOfPlay extends BaseRegionFunction {
  /**
   * @java SitesLineOfPlay() — nothing to do.
   */
  public constructor() {
    super();
  }

  /**
   * Returns the line of play sites.
   *
   * @java SitesLineOfPlay.eval(Context)
   *
   * Java parity:
   *   if (!context.game().isBoardless()) {
   *     if (context.trial().moveNumber() == 0) return Sites.Centre
   *     else return around(occupied, isIn(To, empty))
   *   }
   *   // boardless: iterate and collect isPlayable sites
   *   for each index in 0..numSites: if cs.isPlayable(index) sites.add(index)
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const ctxAny = ctx as unknown as {
      _playableSites?: readonly boolean[];
    };

    const game = ctx.game as unknown as {
      isBoardless?: () => boolean;
      equipment?: { containers?: Array<{ numSites: number }> };
    };

    // @java if (!context.game().isBoardless())
    const isBoardless = typeof game.isBoardless === "function" ? game.isBoardless() : false;

    if (!isBoardless) {
      // @java if (context.trial().moveNumber() == 0) return Sites.Centre
      const moveNumber = (ctx.trial as unknown as { moveNumber?: number; numMoves?: number })
        .moveNumber
        ?? (ctx.trial as unknown as { numMoves?: number }).numMoves
        ?? 0;

      if (moveNumber === 0) {
        // @java return Sites.construct(SitesSimpleType.Centre, null).eval(context)
        // Return centre sites of the board
        const g = ctx.game as unknown as {
          equipment?: { board?: { width?: number; height?: number; numSites?: number } };
        };
        const W = g.equipment?.board?.width ?? 8;
        const H = g.equipment?.board?.height ?? 8;
        const cx = Math.floor(W / 2);
        const cy = Math.floor(H / 2);
        const sites: number[] = [];
        for (let dy = 0; dy <= (H % 2 === 0 ? 1 : 0); dy++) {
          for (let dx = 0; dx <= (W % 2 === 0 ? 1 : 0); dx++) {
            const s = (cy - dy) * W + (cx - dx);
            if (s >= 0 && s < W * H) sites.push(s);
          }
        }
        return [...new Set(sites)].sort((a, b) => a - b);
      } else {
        // @java else return around(occupied, isIn(To, empty))
        // Return sites adjacent to occupied cells that are empty
        const boardN = (ctx.game as unknown as { equipment?: { board?: { numSites?: number } } })
          .equipment?.board?.numSites ?? ctx.state.cells.length;

        // Collect occupied sites
        const occupied = new Set<number>();
        for (let i = 0; i < boardN; i++) {
          if (!ctx.state.isEmptySite(i)) {
            occupied.add(i);
          }
        }

        // Find adjacent empty sites
        const W2 = (ctx.game as unknown as { equipment?: { board?: { width?: number } } })
          .equipment?.board?.width ?? 8;
        const H2 = (ctx.game as unknown as { equipment?: { board?: { height?: number } } })
          .equipment?.board?.height ?? 8;

        const result = new Set<number>();
        for (const occ of occupied) {
          const col = occ % W2;
          const row = Math.floor(occ / W2);
          // All adjacent (orthogonal + diagonal = 8 directions)
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = row + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < H2 && nc >= 0 && nc < W2) {
                const ns = nr * W2 + nc;
                if (ctx.state.isEmptySite(ns)) {
                  result.add(ns);
                }
              }
            }
          }
        }
        return [...result].sort((a, b) => a - b);
      }
    }

    // @java boardless: for (int index = 0; index < numSite; index++) if (cs.isPlayable(index)) sites.add(index)
    if (ctxAny._playableSites) {
      const result: number[] = [];
      for (let i = 0; i < ctxAny._playableSites.length; i++) {
        if (ctxAny._playableSites[i]) result.push(i);
      }
      return result;
    }

    // fallback for boardless without playable set
    const numSite = game.equipment?.containers?.[0]?.numSites ?? ctx.state.cells.length;
    const sites: number[] = [];
    for (let i = 0; i < numSite; i++) {
      if (!ctx.state.isEmptySite(i)) continue; // only empty => playable
      sites.push(i);
    }
    return sites;
  }

  /** @java SitesLineOfPlay.isStatic() — false */
  public override isStatic(): boolean {
    return false;
  }

  /** @java SitesLineOfPlay.toString() */
  public override toString(): string {
    return "LineOfPlay()";
  }
}
