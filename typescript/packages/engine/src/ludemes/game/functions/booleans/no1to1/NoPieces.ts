/**
 * @java game/functions/booleans/no/pieces/NoPieces.java
 *
 * (no Pieces Mover) / (no Pieces Next) / (no Pieces P1) etc.
 *
 * Checks whether the given player has no pieces on the board (nor in hand).
 *
 * Java parity: scans owned.positions(playerId) and checks all containers.
 *
 * TS simplification: scan state.cells for any site owned by the given player.
 * Also check hand sites (if any) for remaining piece counts.
 *
 * @java game/functions/booleans/no/pieces/NoPieces.java — eval(Context)
 */

import type { Context } from "../../../../../context.js";
import type { BooleanFunction } from "../../../../base.js";
import type { RoleType } from "../../../../base.js";
import type { Game1to1 } from "../../../../Game1to1.js";

export class NoPieces1to1 implements BooleanFunction {
  /** The role to check. @java NoPieces.role */
  private readonly role: RoleType;

  /**
   * @java game/functions/booleans/no/pieces/NoPieces.java — constructor
   */
  public constructor(role: RoleType) {
    this.role = role;
  }

  /**
   * @java game/functions/booleans/no/pieces/NoPieces.java — eval(Context)
   *
   * Returns true if the given player has no pieces anywhere (board or hand).
   */
  public eval(ctx: Context): boolean {
    const state = ctx.state;
    const numPlayers = ctx.game.numPlayers;
    let playerId: number;

    switch (this.role) {
      case "Mover":
        playerId = state.mover;
        break;
      case "Next":
        playerId = (state.mover % numPlayers) + 1;
        break;
      default: {
        const n = parseInt((this.role as string).slice(1), 10);
        playerId = isNaN(n) ? state.mover : n;
        break;
      }
    }

    // Check board cells for player's pieces.
    const cells = state.cells;
    const game = ctx.game as unknown as Game1to1;
    const boardSize = game.equipment.board.numSites;

    for (let i = 0; i < boardSize; i++) {
      if ((cells[i] ?? 0) === playerId) return false;
    }

    // Check hand sites for remaining pieces.
    const handSite = game.equipment.handSiteFor(playerId, 0);
    if (handSite >= 0 && handSite < cells.length) {
      const count = state.countAt[handSite] ?? 0;
      if (count > 0) return false;
      if ((cells[handSite] ?? 0) === playerId) return false;
    }

    return true;
  }
}
