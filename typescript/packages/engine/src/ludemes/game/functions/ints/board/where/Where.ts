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
    // @java Where.construct(String namePiece, …) — the byName overload requires a
    // String. The reflection ArgCompiler dispatches construct* purely by arity, so
    // for (where (id "King" P2)) — an IntFunction arg — it would otherwise pick this
    // 2-arity constructName over the 1-arity constructWhat and pass the Id object as
    // namePiece (AlmaTafl: byName then scanned the MOVER's pieces, declaring a bogus
    // King-captured win). Reject a non-string namePiece so the dispatcher falls
    // through to constructWhat (the IntFunction overload Java resolves by type).
    if (typeof namePiece !== "string") return null as unknown as WhereSite;
    // @java overload resolution — "Level" is the WhereLevelType enum constant that
    // selects the (where Level "Piece" Owner at:...) form (constructLevelName).
    // constructName.length == 2 and constructLevelName.length == 3; both land in
    // instantiateFaithful's relaxedFns list for 8-arg calls and constructName is
    // iterated first, so without this guard (where Level "Hyena" Neutral at:...)
    // would be mis-compiled: namePiece="Level", localStateFn=raw-string "Neutral".
    // At eval time WhereSite calls localStateFn.eval(ctx) → "is not a function" throw.
    // @java Where.java:94 — the whereType param is required and typed WhereLevelType,
    // which Java resolves by type before string; we replicate that discriminant here.
    if (namePiece === "Level") return null as unknown as WhereSite;
    return WhereSite.byName(namePiece, wherePlayerFn(indexPlayer, role), state as never, type as never);
  }

  /** @java Where.construct(IntFunction what, @Opt SiteType type) */
  public static constructWhat(what: unknown, type: unknown = null): WhereSite {
    // @java overload resolution — "Level" is a WhereLevelType enum constant, not
    // an IntFunction/piece-index. If constructName rejected it (namePiece guard
    // above) and constructLevelName hasn't matched yet, reject here too so the
    // dispatcher continues to constructLevelName. Without this guard a 2-arg call
    // (where Level (id "Piece" P)) would bind "Level" as the what-index, producing
    // WhereSite.byWhat("Level") — a raw string in place of an IntFunction. At eval
    // time WhereSite.eval() calls whatFn.eval(ctx) → "is not a function" throw.
    if (what === "Level") return null as unknown as WhereSite;
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
    // @java overload resolution — the WhereLevelType discriminant selects
    // this clause; without the gate the site-less (where (id "King" P)) form
    // bound here too.
    if ((_whereType as unknown as string) !== "Level") return null as unknown as WhereLevel;
    // Same byName/byWhat overload guard as constructName (reject non-string).
    if (typeof namePiece !== "string") return null as unknown as WhereLevel;
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
    // @java overload resolution — the WhereLevelType discriminant selects this
    // clause. Without the gate, (where (id "King_noCross" P3)) — the SITE-less
    // WhereSite form — bound here with the id-fn in the what slot and at=null;
    // WhereLevel.eval then threw on the null siteFn, which silently killed the
    // whole (then …) chain it sat in (Chatrang's RemovePiecesIfCheckmate never
    // ran, checkmated armies stayed on the board, the team end never fired).
    if ((_whereType as unknown as string) !== "Level") return null as unknown as WhereLevel;
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
      // @java RoleType.java:190-196 — toIntFunction(role): every role with
      // owner > 0 resolves to IntConstant(owner); TeamN.owner == N. The old
      // fallthrough returned the MOVER, so Setichch's (where "Stick" Team2)
      // searched for player-6 pieces, found none (OFF=-1), and the Team2 win
      // condition (= 38 (where ...)) never fired (both trials rec winner=team2).
      {
        const tm = typeof r === "string" ? /^Team(\d+)$/.exec(r) : null;
        if (tm) return Number(tm[1]);
      }
      // @java RoleType — Neutral → 0, Shared → numPlayers+1 (Constants.SHARED).
      // Neutral keeps `(where "Ghoula" Neutral)` finding the neutral piece (Es-Sig).
      // Shared must be numPlayers+1: a Shared-owned piece (e.g. Neutron) has owner
      // numPlayers+1, so mapping Shared→0 made the byName owner filter miss it and
      // the eval fell back to the first empty board site, firing a false win at ply 1
      // (Neutron). @java game/functions/ints/board/Id.java — Shared/All → numPlayers+1.
      if (r === "Neutral") return 0;
      if (r === "Shared") return ctx.game.numPlayers + 1;
      return ctx.state.mover;
    },
  } as never;
}

/** Raw True/False literals from compileTerminal → BooleanFunction shape. */
function wrapBool(v: unknown): never {
  if (typeof v === "boolean") return { eval: () => v } as never;
  return (v ?? null) as never;
}
