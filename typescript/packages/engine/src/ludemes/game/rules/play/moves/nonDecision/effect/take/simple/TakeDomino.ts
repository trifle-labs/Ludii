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
    const state = ctx.state;
    const mover = state.mover;

    // @java TakeDomino.java:52-56 —
    //   final TIntArrayList remainingDominoes = context.state().remainingDominoes();
    //   if (remainingDominoes.isEmpty()) return moves;
    // Java's bag is a real, persistent State field: Game.java:2703-2705 seeds it
    // with every component id in [1, numComponents) once (`hasDominoes()`), and
    // ActionAdd.java:299-301 (`if (piece.isDomino())
    // context.state().remainingDominoes().remove(piece.index())`) removes an id
    // the instant it is FIRST placed at any (previously-empty) site — board or
    // hand. Domino games never remove a once-placed piece, so "still in the bag"
    // and "not currently occupying any site" are the same set at every point in
    // the game. The TS port has no persistent remainingDominoes field, so
    // recompute that (complement) set on demand: every domino component id not
    // currently occupying any board or hand site.
    const components = typeof ctx.components === "function" ? ctx.components() : null;
    if (!components) {
      return [];
    }

    const containers = ctx.containers();
    const sitesFrom = ctx.sitesFrom();

    // Java parity: context.sitesFrom() spans board + every hand; scan the full
    // range (mirrors SitesHand.ts / Deal.ts's use of the same two methods).
    let totalSites = 0;
    for (let id = 0; id < containers.length; id++) {
      const base = sitesFrom[id];
      if (base === undefined) continue;
      const end = base + containers[id]!.numSites();
      if (end > totalSites) totalSites = end;
    }

    const placed = new Set<number>();
    for (let s = 0; s < totalSites; s++) {
      const w = state.whatAtSite(s);
      if (w !== 0) placed.add(w);
    }

    const remainingDominoes: number[] = [];
    for (let id = 1; id < components.length; id++) {
      const comp = components[id] as { isDomino?: () => boolean } | undefined;
      if (comp && typeof comp.isDomino === "function" && comp.isDomino() && !placed.has(id)) {
        remainingDominoes.push(id);
      }
    }

    if (remainingDominoes.length === 0) {
      return [];
    }

    // @java TakeDomino.java:57-72 — for (Container container : context.containers())
    //   if (container.isHand()) { if (hand.owner() == mover) { find first empty
    //   site (lowest index) in [siteFrom, siteFrom + numSites); } break; }
    // The outer loop `break`s right after handling the FIRST hand owned by the
    // mover, whether or not an empty site was found inside it — matched via
    // ctx.containers()/ctx.sitesFrom() (the real, live Context API; see
    // SitesHand.ts, which already exercises this exact pattern successfully).
    let site = OFF;
    for (let id = 0; id < containers.length; id++) {
      const c = containers[id]!;
      if (!c.isHand()) continue;
      if (c.owner() !== mover) continue;
      const base = sitesFrom[id];
      if (base !== undefined) {
        const size = c.numSites();
        for (let s = base; s < base + size; s++) {
          if (state.whatAtSite(s) === 0) {
            site = s;
            break;
          }
        }
      }
      break;
    }

    if (site === OFF) {
      return [];
    }

    // @java TakeDomino.java:84-89 — random pick from the bag via rng.nextInt().
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
