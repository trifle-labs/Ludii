// @java Core/src/game/functions/ints/board/HandSite.java

/**
 * Returns one site of one hand.
 *
 * @java game/functions/ints/board/HandSite.java
 * @author Eric Piette
 *
 * @remarks To check a specific site of a specific hand.
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import { compileFlags } from "../../../../../ludii/compiler/compile-flags.js";
import type { JavaIntFunction } from "../IntFunction.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Returns one site of one hand.
 *
 * Java eval:
 *   player = playerId.eval(context);
 *   index  = siteFn.eval(context);
 *   for each container c in context.containers():
 *     if c.isHand() && c.owner() == player:
 *       return context.sitesFrom()[c.index()] + index
 *   return OFF
 *
 * @java game/functions/ints/board/HandSite.java
 */
export class HandSite extends BaseIntFunction {
  /** Which player. @java HandSite.playerId */
  private readonly playerId: JavaIntFunction | string | number;

  /** Which site. @java HandSite.siteFn */
  private readonly siteFn: JavaIntFunction | number | null;

  /** Precomputed value if possible. @java HandSite.precomputedValue */
  private precomputedValue: number = OFF;

  /**
   * @java HandSite(@Or IntFunction indexPlayer, @Or RoleType role, @Opt IntFunction site)
   * Matches the Java reflection signature: exactly one of indexPlayer/role is non-null
   * (the compiler binds the @Or pair); role arrives as the enum constant name string
   * (evalPlayer resolves role names like "Mover" contextually).
   */
  public constructor(
    indexPlayer: JavaIntFunction | string | number | null,
    role: string | null = null,
    site: JavaIntFunction | number | null = null,
  ) {
    super();
    // @java HandSite.java:107 — gameFlags() = GameType.Count | … (unconditional).
    compileFlags.usesCount = true;
    this.playerId = indexPlayer ?? role ?? 0;
    this.siteFn = site ?? 0;
  }

  /**
   * @java HandSite.eval(Context)
   *
   * Iterates context.containers() to find the hand owned by the target player,
   * then returns sitesFrom[containerIndex] + slotOffset.
   */
  public override eval(context: Context): number {
    if (this.precomputedValue !== OFF)
      return this.precomputedValue;

    const player = evalPlayer(this.playerId, context);
    const index  = evalSite(this.siteFn, context);

    // Java: for (final Container c : context.containers()) { if (c.isHand()) ... }
    const ctx = context as unknown as {
      containers?: () => Array<{
        isHand(): boolean;
        owner(): number;
        index(): number;
      }>;
      sitesFrom?: () => number[];
    };

    const containers = ctx.containers?.();
    const sitesFrom  = ctx.sitesFrom?.();

    if (containers && sitesFrom) {
      for (const c of containers) {
        if (c.isHand() && c.owner() === player) {
          return sitesFrom[c.index()]! + index;
        }
      }
      return OFF;
    }

    // Fallback: use the 1:1 equipment handSite API if available
    const game = context.game as unknown as {
      equipment?: {
        handSiteFor?: (player: number, offset: number) => number;
      };
    };
    if (game.equipment?.handSiteFor) {
      return game.equipment.handSiteFor(player, index);
    }

    return OFF;
  }

  /** @java HandSite.isStatic() */
  public isStatic(): boolean {
    const siteStatic = (this.siteFn as unknown as { isStatic?(): boolean }).isStatic?.() ?? typeof this.siteFn !== "object";
    const pidStatic  = (this.playerId as unknown as { isStatic?(): boolean }).isStatic?.() ?? typeof this.playerId !== "object";
    return siteStatic && pidStatic;
  }

  /** @java HandSite.isHand() */
  public override isHand(): boolean {
    return true;
  }

  /** @java HandSite.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    // Java also checks that the game has hands; we delegate to sub-fns only.
    let missing = callBool(this.siteFn, "missingRequirement", game);
    missing = missing || callBool(this.playerId, "missingRequirement", game);
    return missing;
  }

  /** @java HandSite.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return callBool(this.siteFn, "willCrash", game) || callBool(this.playerId, "willCrash", game);
  }

  /** @java HandSite.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const s = new Set<number>();
    for (const x of callSet(this.siteFn, "concepts", game)) s.add(x);
    for (const x of callSet(this.playerId, "concepts", game)) s.add(x);
    return s;
  }

  /** @java HandSite.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of callSet(this.siteFn, "writesEvalContextRecursive")) s.add(x);
    for (const x of callSet(this.playerId, "writesEvalContextRecursive")) s.add(x);
    return s;
  }

  /** @java HandSite.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of callSet(this.siteFn, "readsEvalContextRecursive")) s.add(x);
    for (const x of callSet(this.playerId, "readsEvalContextRecursive")) s.add(x);
    return s;
  }

  /** @java HandSite.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    return "Player " + toEnglish(this.playerId, game) + "'s hand site " + toEnglish(this.siteFn, game);
  }
}

function evalSite(siteFn: JavaIntFunction | number | null, context: Context): number {
  if (siteFn === null) return 0;
  if (typeof siteFn === "number") return siteFn;
  return siteFn.eval(context);
}

function evalPlayer(playerId: JavaIntFunction | string | number, context: Context): number {
  if (typeof playerId === "number") return playerId;
  if (typeof playerId !== "string") return playerId.eval(context);

  const ctx = context as unknown as {
    state?: { mover?: number };
    game?: { numPlayers?: number; players?: () => { count(): number } };
  };
  const mover = ctx.state?.mover ?? 1;
  const numPlayers = ctx.game?.numPlayers ?? ctx.game?.players?.().count() ?? 2;
  switch (playerId) {
    case "Mover": return mover;
    case "Next": return (mover % numPlayers) + 1;
    case "Prev": return ((mover + numPlayers - 2) % numPlayers) + 1;
    case "Shared":
    case "Neutral":
      return 0;
    default: {
      const match = /^P(\d+)$/.exec(playerId);
      return match ? Number(match[1]) : mover;
    }
  }
}

function callBool(
  value: JavaIntFunction | string | number | null,
  method: "missingRequirement" | "willCrash",
  game: unknown,
): boolean {
  if (value === null || typeof value !== "object") return false;
  return value[method](game);
}

function callSet(
  value: JavaIntFunction | string | number | null,
  method: "concepts" | "writesEvalContextRecursive" | "readsEvalContextRecursive",
  game?: unknown,
): Set<number> {
  if (value === null || typeof value !== "object") return new Set();
  switch (method) {
    case "concepts":
      return value.concepts(game);
    case "writesEvalContextRecursive":
      return value.writesEvalContextRecursive();
    case "readsEvalContextRecursive":
      return value.readsEvalContextRecursive();
  }
}

function toEnglish(value: JavaIntFunction | string | number | null, game: unknown): string {
  if (value === null) return "0";
  if (typeof value === "number" || typeof value === "string") return String(value);
  return value.toEnglish(game);
}
