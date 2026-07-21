/**
 * CountSimple1to1.ts
 *
 * Faithful 1:1 ports of the simple count ludemes:
 *   CountRows, CountColumns, CountPlayers, CountTurns, CountMovesThisTurn
 *
 * @java game/functions/ints/count/simple/CountRows.java
 * @java game/functions/ints/count/simple/CountColumns.java  (alias Columns)
 * @java game/functions/ints/count/simple/CountPlayers.java
 * @java game/functions/ints/count/simple/CountTurns.java
 * @java game/functions/ints/count/simple/CountMovesThisTurn.java
 */

import type { Context } from "../../../../../context.js";
import type { IntFunction } from "../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import type { LudList } from "@ludii/typescript-language";
import type { Game } from "../../../../Game.js";

// ---------------------------------------------------------------------------
// CountRows
// ---------------------------------------------------------------------------
export class CountRows implements IntFunction {
  /** @java game/functions/ints/count/simple/CountRows.java — eval: context.topology().rows(siteType).size() */
  public eval(ctx: Context): number {
    return (ctx.game as unknown as Game).equipment.board.height;
  }
}

// ---------------------------------------------------------------------------
// CountColumns
// ---------------------------------------------------------------------------
export class CountColumns implements IntFunction {
  /** @java game/functions/ints/count/simple/CountColumns.java — eval: context.topology().columns(siteType).size() */
  public eval(ctx: Context): number {
    return (ctx.game as unknown as Game).equipment.board.width;
  }
}

// ---------------------------------------------------------------------------
// CountPlayers
// ---------------------------------------------------------------------------
export class CountPlayers implements IntFunction {
  /** @java game/functions/ints/count/simple/CountPlayers.java — eval: context.game().players().count() */
  public eval(ctx: Context): number {
    return ctx.game.numPlayers;
  }
}

// ---------------------------------------------------------------------------
// CountTurns
// ---------------------------------------------------------------------------
export class CountTurns implements IntFunction {
  /** @java game/functions/ints/count/simple/CountTurns.java — eval: context.state().numTurn() */
  public eval(ctx: Context): number {
    return ctx.state.numTurn ?? 1;
  }
}

// ---------------------------------------------------------------------------
// CountMovesThisTurn
// ---------------------------------------------------------------------------
export class CountMovesThisTurn implements IntFunction {
  /** @java game/functions/ints/count/simple/CountMovesThisTurn.java — eval: context.state().numTurnSamePlayer() */
  public eval(ctx: Context): number {
    return ctx.state.numTurnSamePlayer ?? 0;
  }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
