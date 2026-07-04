// @java Core/src/game/functions/ints/value/player/ValuePlayer.java

/**
 * To get the value of a specific player.
 *
 * @java game/functions/ints/value/player/ValuePlayer.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import { BaseIntFunction } from "../../BaseIntFunction.js";
import type { JavaIntFunction } from "../../IntFunction.js";
import { RoleType } from "../../../../util/end/RoleType.js";

/**
 * Wraps a RoleType as a JavaIntFunction returning the contextual player index.
 * @java RoleType.toIntFunction(RoleType)
 */
function roleToIntFn(role: RoleType): JavaIntFunction {
  // Concrete player roles P1..P16 have numeric values 1..16
  if (role >= RoleType.P1 && role <= RoleType.P16) {
    const val = role as number;
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
  // Contextual roles: Mover, Next, etc.
  return {
    eval(ctx: Context): number {
      if (role === RoleType.Mover) return ctx.state.mover;
      // @java context.state().next() — TS states carry next=0 until the cycle
      // finalises; rotational fallback like NextFn.ts (raw 0 read the value
      // channel of player 0 inside deferred thens).
      if (role === RoleType.Next) {
        const rawNext = (ctx.state as unknown as { next?: number }).next ?? 0;
        if (rawNext > 0) return rawNext;
        const np = (ctx.game as unknown as { numPlayers?: number }).numPlayers ?? 2;
        return (ctx.state.mover % np) + 1;
      }
      if (role === RoleType.Prev) {
        const rawPrev = (ctx.state as unknown as { prev?: number }).prev ?? 0;
        if (rawPrev > 0) return rawPrev;
        return ctx.state.mover;
      }
      // Default: return neutral (0) for unsupported roles
      return 0;
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
 * To get the value of a specific player.
 *
 * @java game/functions/ints/value/player/ValuePlayer.java
 */
export class ValuePlayer extends BaseIntFunction {
  /** @java ValuePlayer.playerId */
  private readonly playerId: JavaIntFunction;

  /**
   * @param indexPlayer The index of the player (or null if role is used).
   * @param role        The roleType of the player (or null if indexPlayer is used).
   * @java ValuePlayer(IntFunction, RoleType)
   */
  public constructor(indexPlayer: JavaIntFunction | null, role: RoleType | null) {
    super();

    let numNonNull = 0;
    if (indexPlayer !== null) numNonNull++;
    if (role !== null) numNonNull++;

    if (numNonNull !== 1) {
      throw new Error("Exactly one Or parameter must be non-null.");
    }

    if (indexPlayer !== null) {
      this.playerId = indexPlayer;
    } else {
      this.playerId = roleToIntFn(role!);
    }
  }

  /**
   * @java ValuePlayer.eval(Context)
   */
  public override eval(context: Context): number {
    const pid = this.playerId.eval(context);
    return context.state.valuePlayer(pid);
  }

  /** @java ValuePlayer.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java ValuePlayer.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    return this.playerId.concepts(game);
  }

  /** @java ValuePlayer.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    return this.playerId.writesEvalContextRecursive();
  }

  /** @java ValuePlayer.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    return this.playerId.readsEvalContextRecursive();
  }

  /** @java ValuePlayer.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.playerId as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
  }

  /** @java ValuePlayer.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    return this.playerId.missingRequirement(game);
  }

  /** @java ValuePlayer.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.playerId.willCrash(game);
  }

  /**
   * @java ValuePlayer.role()
   * @return The role of the player.
   */
  public role(): JavaIntFunction {
    return this.playerId;
  }

  /** @java ValuePlayer.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    return "the value of Player " + this.playerId.toEnglish(game);
  }
}
