// @java Core/src/game/functions/ints/match/MatchScore.java

/**
 * Returns the match score of a player.
 *
 * @java game/functions/ints/match/MatchScore.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import { RoleType, roleTypeOwner } from "../../../util/end/RoleType.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Wraps a RoleType as a JavaIntFunction returning its owner index.
 * @java RoleType.toIntFunction(RoleType)
 */
function roleToIntFn(role: RoleType | string): JavaIntFunction {
  // The reflection ArgCompiler binds enum constants as their raw NAME string
  // ("P1"), not the numeric RoleType — normalise before the owner lookup
  // (roleTypeOwner("P1") compared a string against numbers, returned -1, and
  // MatchScore silently read score(-1)=0: Tavli's match end never fired).
  if (typeof role === "string") {
    const asEnum = (RoleType as unknown as Record<string, number>)[role];
    role = (asEnum !== undefined ? asEnum : -1) as RoleType;
  }
  const val = roleTypeOwner(role);
  // For contextual roles (Mover, Next, etc.) we return a function that reads
  // from the context at eval-time. For concrete player roles (P1…P16) the
  // value is static.
  if (val >= 0) {
    // Concrete player index — constant function.
    return {
      eval(_ctx: Context): number { return val; },
      exceeds(ctx: Context, other: JavaIntFunction): boolean { return val > other.eval(ctx); },
      isHint(): boolean { return false; },
      isHand(): boolean { return false; },
      concepts(_g: unknown): Set<number> { return new Set(); },
      readsEvalContextRecursive(): Set<number> { return new Set(); },
      writesEvalContextRecursive(): Set<number> { return new Set(); },
      missingRequirement(_g: unknown): boolean { return false; },
      willCrash(_g: unknown): boolean { return false; },
      toEnglish(_g: unknown): string { return String(val); },
    };
  }
  // Contextual: Mover → context.state.mover, Next → context.state.next, etc.
  return {
    eval(ctx: Context): number {
      if (role === RoleType.Mover) return ctx.state.mover;
      if (role === RoleType.Next) return (ctx.state as unknown as { next: number }).next ?? ctx.state.mover;
      return UNDEFINED;
    },
    exceeds(ctx: Context, other: JavaIntFunction): boolean { return this.eval(ctx) > other.eval(ctx); },
    isHint(): boolean { return false; },
    isHand(): boolean { return false; },
    concepts(_g: unknown): Set<number> { return new Set(); },
    readsEvalContextRecursive(): Set<number> { return new Set(); },
    writesEvalContextRecursive(): Set<number> { return new Set(); },
    missingRequirement(_g: unknown): boolean { return false; },
    willCrash(_g: unknown): boolean { return false; },
    toEnglish(_g: unknown): string { return RoleType[role] ?? ""; },
  };
}

/**
 * Returns the match score of a player.
 *
 * @java game/functions/ints/match/MatchScore.java
 */
export class MatchScore extends BaseIntFunction {
  /** @java MatchScore.idPlayerFn */
  private readonly idPlayerFn: JavaIntFunction;

  /**
   * @param role The roleType of the player.
   * @java MatchScore(RoleType)
   */
  public constructor(role: RoleType) {
    super();
    this.idPlayerFn = roleToIntFn(role);
  }

  /**
   * @java MatchScore.eval(Context)
   *
   * Returns the match score of the player identified by idPlayerFn.
   * Falls back to the parent context score (match context), then the current
   * context score if it is a match, otherwise Constants.UNDEFINED.
   */
  public override eval(context: Context): number {
    const pid = this.idPlayerFn.eval(context);

    // @java MatchScore.java — if (context.parentContext() != null) return
    // context.parentContext().score(pid); parentContext() is a METHOD on
    // Context (Context.java:1367); the old property duck-type never matched
    // and every call silently fell through to UNDEFINED.
    const parentCtx = context.parentContext?.() ?? null;
    if (parentCtx !== null) {
      return parentCtx.score(pid);
    }

    // Java: else if (context.isAMatch()) return context.score(pid);
    if (context.isAMatch?.()) {
      return context.score(pid);
    }

    return UNDEFINED;
  }

  /** @java MatchScore.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java MatchScore.gameFlags(Game) — delegates to idPlayerFn */
  public override concepts(_game: unknown): Set<number> {
    return this.idPlayerFn.concepts(_game);
  }

  /** @java MatchScore.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return this.idPlayerFn.writesEvalContextRecursive();
  }

  /** @java MatchScore.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return this.idPlayerFn.readsEvalContextRecursive();
  }

  /** @java MatchScore.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    // Java: if (!game.hasSubgames()) { report + return true; }
    const hasSubgames = (game as unknown as { hasSubgames?: () => boolean }).hasSubgames;
    if (typeof hasSubgames === "function" && !hasSubgames.call(game)) {
      return true;
    }
    return this.idPlayerFn.missingRequirement(game);
  }

  /** @java MatchScore.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.idPlayerFn.willCrash(game);
  }

  /** @java MatchScore.toString() */
  public override toString(): string {
    return "MatchScore()";
  }
}
