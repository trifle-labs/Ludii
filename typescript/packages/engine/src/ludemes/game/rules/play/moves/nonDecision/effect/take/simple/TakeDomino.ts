// @java Core/src/game/rules/play/moves/nonDecision/effect/take/simple/TakeDomino.java

/**
 * Takes a domino from the remaining pool and places it in the mover's hand.
 *
 * @java game/rules/play/moves/nonDecision/effect/take/simple/TakeDomino.java
 *
 * Java parity (TakeDomino.eval):
 *   1. Get remaining dominoes list from context.state().
 *   2. Find the first empty hand slot belonging to the mover.
 *   3. Pick a random domino index via context.rng().nextInt(size).
 *   4. Create ActionAdd for that domino at that hand slot.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../../base.js";
import { ActionAdd } from "../../../../../../../../../action/action-add.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";
import { applyPostStateThen } from "../../Then.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * @java game/rules/play/moves/nonDecision/effect/take/simple/TakeDomino.java
 *
 * Takes a domino from the remaining pool and adds it to the mover's hand.
 *
 * Java parity:
 *   public final class TakeDomino extends Effect
 *   eval(Context): pick random domino from remaining list, place at first
 *     empty hand-slot belonging to the current mover.
 */
export class TakeDomino implements MovesFunction {
  /** Optional subsequent moves (the `then` clause). */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java TakeDomino(Then then)
   * @param thenMoves  Optional subsequent moves applied after this.
   */
  public constructor(thenMoves: MovesFunction | null = null) {
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/take/simple/TakeDomino.java — eval(Context)
   *
   * Java parity (TakeDomino.eval lines 50-98):
   *   1. Get the remaining dominoes list; if empty, return no moves.
   *   2. Find the mover's first empty hand site.
   *   3. Pick a random domino via rng.nextInt(remainingDominoes.size()).
   *   4. Create ActionAdd(Cell, site, what, 1, 0, UNDEFINED, UNDEFINED, null).
   */
  public eval(ctx: Context): Move[] {
    // Java parity: remainingDominoes list from context state.
    const stateAny = ctx.state as unknown as {
      remainingDominoes?: number[];
      mover: number;
    };
    const remainingDominoes = stateAny.remainingDominoes;
    if (!remainingDominoes || remainingDominoes.length === 0) {
      return [];
    }

    const mover = ctx.state.mover;

    // Java parity: find first empty hand slot for the mover.
    // In the TS port we use the game's equipment containers if available.
    const gameAny = ctx.game as unknown as {
      containers?: Array<{
        isHand?: boolean;
        owner?: number;
        index?: number;
        numSites?: number;
      }>;
      sitesFrom?: number[];
    };

    let site = OFF;
    if (gameAny.containers) {
      for (const container of gameAny.containers) {
        if (container.isHand && container.owner === mover) {
          const pid = container.index ?? 0;
          const siteFrom = gameAny.sitesFrom?.[pid] ?? 0;
          const numSites = container.numSites ?? 0;
          for (let s = siteFrom; s < siteFrom + numSites; s++) {
            // Check if this hand site is empty (whatAtSite returns 0 for empty).
            const what = (ctx.state as unknown as { whatAtSite?: (s: number) => number }).whatAtSite?.(s) ?? 0;
            if (what === 0) {
              site = s;
              break;
            }
          }
          break;
        }
      }
    }

    if (site === OFF) {
      return [];
    }

    // Pick a random domino from the remaining list.
    // Java parity: context.rng().nextInt(remainingDominoes.size())
    const index = ctx.rng.nextInt(remainingDominoes.length);
    const what = remainingDominoes[index]!;

    const action = new ActionAdd({ to: site, what, count: 1, state: 0 });
    const move = new LudiiMove({
      id: "takeDomino",
      label: `takeDomino:${what}@${site}`,
      siteIndices: [site],
      mover,
      placedOwner: mover,
      actions: [action],
    });

    // @java Move.apply evaluates then() AFTER the action — defer, don't bake.
    return [applyPostStateThen(this.thenMoves, ctx, move)];
  }

  /** @java TakeDomino.isStatic() → false */
  public isStatic(): boolean {
    return false;
  }

  /** @java TakeDomino.toEnglish() */
  public toEnglish(): string {
    return "take a domino";
  }
}
