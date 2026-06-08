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
import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../base.js";
import type { RoleType } from "../../../../base.js";
import type { Game1to1 } from "../../../../Game1to1.js";

type SiteType = "Cell" | "Edge" | "Vertex";

export class NoPieces1to1 implements BooleanFunction {
  /** Cell/Edge/Vertex. @java NoPieces.type */
  private readonly type: SiteType | null;

  /** The role to check. @java NoPieces.role */
  private readonly role: RoleType | null;

  /** The index of the player. @java NoPieces.whoFn */
  private readonly whoFn: IntFunction;

  /** The name of the item to count. @java NoPieces.name */
  private readonly name: string | null;

  /** The region to count the pieces. @java NoPieces.whereFn */
  private readonly whereFn: RegionFunction | null;

  /**
   * @java NoPieces(@Opt SiteType type, @Opt @Or RoleType role,
   *                @Opt @Or @Name IntFunction of, @Opt String name,
   *                @Opt @Name RegionFunction in)
   */
  public constructor(
    type: SiteType | null = null,
    role: RoleType | null = null,
    of: IntFunction | null = null,
    name: string | null = null,
    in_: RegionFunction | null = null,
  ) {
    this.type = type;
    this.role = role ?? (of === null ? "All" : null);
    this.whoFn = of ?? roleToIntFunction(this.role);
    this.name = name;
    this.whereFn = in_;
  }

  /**
   * @java game/functions/booleans/no/pieces/NoPieces.java — eval(Context)
   *
   * Returns true if the given player has no pieces anywhere (board or hand).
   */
  public eval(ctx: Context): boolean {
    const state = ctx.state;
    const numPlayers = ctx.game.numPlayers;
    let playerId = this.whoFn.eval(ctx);

    if (this.role !== null) {
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

function roleToIntFunction(role: RoleType | null): IntFunction {
  return {
    eval(ctx: Context): number {
      switch (role) {
        case "Next":
          return (ctx.state.mover % ctx.game.numPlayers) + 1;
        case "All":
          return 0;
        case "P1":
          return 1;
        case "P2":
          return 2;
        case "Mover":
        default:
          return ctx.state.mover;
      }
    },
  };
}
