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
  private readonly playerId: JavaIntFunction;

  /** Which site. @java HandSite.siteFn */
  private readonly siteFn: JavaIntFunction;

  /** Precomputed value if possible. @java HandSite.precomputedValue */
  private precomputedValue: number = OFF;

  /**
   * @param playerId  IntFunction resolving to the player index.
   * @param siteFn    IntFunction resolving to the slot offset within the hand.
   * @java HandSite(IntFunction|RoleType, IntFunction)
   */
  public constructor(playerId: JavaIntFunction, siteFn: JavaIntFunction) {
    super();
    this.playerId = playerId;
    this.siteFn = siteFn;
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

    const player = this.playerId.eval(context);
    const index  = this.siteFn.eval(context);

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
    const siteStatic = (this.siteFn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    const pidStatic  = (this.playerId as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
    return siteStatic && pidStatic;
  }

  /** @java HandSite.isHand() */
  public override isHand(): boolean {
    return true;
  }

  /** @java HandSite.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    // Java also checks that the game has hands; we delegate to sub-fns only.
    let missing = this.siteFn.missingRequirement(game);
    missing = missing || this.playerId.missingRequirement(game);
    return missing;
  }

  /** @java HandSite.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    return this.siteFn.willCrash(game) || this.playerId.willCrash(game);
  }

  /** @java HandSite.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.concepts(game)) s.add(x);
    for (const x of this.playerId.concepts(game)) s.add(x);
    return s;
  }

  /** @java HandSite.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.writesEvalContextRecursive()) s.add(x);
    for (const x of this.playerId.writesEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java HandSite.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const s = new Set<number>();
    for (const x of this.siteFn.readsEvalContextRecursive()) s.add(x);
    for (const x of this.playerId.readsEvalContextRecursive()) s.add(x);
    return s;
  }

  /** @java HandSite.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    return "Player " + this.playerId.toEnglish(game) + "'s hand site " + this.siteFn.toEnglish(game);
  }
}
