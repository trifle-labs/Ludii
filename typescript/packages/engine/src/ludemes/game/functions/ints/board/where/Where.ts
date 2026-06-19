// @java Core/src/game/functions/ints/board/where/Where.java

/**
 * Returns the site (or level) of a piece if it is on the board/site, else OFF (-1).
 *
 * @java game/functions/ints/board/where/Where.java
 * @author Eric.Piette
 *
 * @remarks This is a static-factory-only dispatcher class. Its eval() should
 *          never be called directly — all real work is done by the concrete
 *          subclasses (WhereSite, WhereLevel) returned by the construct() overloads.
 */

import { WhereSite } from "./WhereSite.js";
import { WhereLevel } from "./WhereLevel.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { Context } from "../../../../../../context.js";

/**
 * Root Where class — should never have eval() called on it directly.
 * Mirrors Java Where which throws UnsupportedOperationException from eval().
 *
 * @java game/functions/ints/board/where/Where.java
 */
export class Where extends BaseIntFunction {
  /**
   * Private constructor — Where is a static-factory-only class in Java.
   * @java Where() — private
   */
  private constructor() {
    super();
  }

  /**
   * @java Where.construct(String namePiece, @Or IntFunction indexPlayer, @Or RoleType role,
   *                       @Opt @Name IntFunction state, @Opt SiteType type)
   */
  public static constructName(
    namePiece: string,
    indexPlayer: unknown,
    role: unknown = null,
    state: unknown = null,
    type: unknown = null,
  ): WhereSite {
    return WhereSite.byName(namePiece, wherePlayerFn(indexPlayer, role), state as never, type as never);
  }

  /** @java Where.construct(IntFunction what, @Opt SiteType type) */
  public static constructWhat(what: unknown, type: unknown = null): WhereSite {
    return WhereSite.byWhat(what as never, type as never);
  }

  /** @java Where.construct(WhereLevelType, String namePiece, @Or indexPlayer, @Or role, state@Opt, type@Opt, at@Name, fromTop@Opt) */
  public static constructLevelName(
    _whereType: string,
    namePiece: string,
    indexPlayer: unknown,
    role: unknown = null,
    state: unknown = null,
    type: unknown = null,
    at: unknown = null,
    fromTop: unknown = null,
  ): WhereLevel {
    return WhereLevel.byName(namePiece, wherePlayerFn(indexPlayer, role), state as never, type as never, at as never, wrapBool(fromTop));
  }

  /** @java Where.construct(WhereLevelType, IntFunction what, type@Opt, at@Name, fromTop@Opt) */
  public static constructLevelWhat(
    _whereType: string,
    what: unknown,
    type: unknown = null,
    at: unknown = null,
    fromTop: unknown = null,
  ): WhereLevel {
    return WhereLevel.byWhat(what as never, type as never, at as never, wrapBool(fromTop));
  }

  /**
   * @java Where.eval(Context) — throws UnsupportedOperationException
   * Should not be called; dispatch always goes to a concrete subtype.
   */
  public override eval(_context: Context): number {
    // Should not be called, should only be called on subclasses
    throw new Error("Count.eval(): Should never be called directly.");
  }

  /** @java Where.isStatic() — should never be reached */
  public isStatic(): boolean {
    // Should never be there
    return false;
  }
}

/** @Or indexPlayer/role → player IntFunction (role arrives as the enum constant string). */
function wherePlayerFn(indexPlayer: unknown, role: unknown): never {
  if (indexPlayer !== null && indexPlayer !== undefined &&
      typeof (indexPlayer as { eval?: unknown }).eval === "function") {
    return indexPlayer as never;
  }
  const r = (role ?? indexPlayer) as string | null;
  return {
    eval(ctx: { state: { mover: number }; game: { numPlayers: number } }): number {
      if (r === "Mover") return ctx.state.mover;
      if (r === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (r === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (typeof r === "string" && /^P\d+$/.test(r)) return Number(r.slice(1));
      // @java RoleType.Neutral / RoleType.Shared → player 0. Without this,
      // `(where "Ghoula" Neutral)` fell through to the mover and located the
      // wrong piece, firing Es-Sig's GhoulaPhaseDone ~498 plies early (false
      // (byScore) end with all-zero scores → wrong/tie winner).
      if (r === "Neutral" || r === "Shared") return 0;
      return ctx.state.mover;
    },
  } as never;
}

/** Raw True/False literals from compileTerminal → BooleanFunction shape. */
function wrapBool(v: unknown): never {
  if (typeof v === "boolean") return { eval: () => v } as never;
  return (v ?? null) as never;
}
