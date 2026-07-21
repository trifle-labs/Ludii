// @java Core/src/game/functions/region/sites/moves/SitesFrom.java

/**
 * Returns the "from" sites of a set of moves.
 *
 * @java game/functions/region/sites/moves/SitesFrom.java
 * @author Dennis Soemers and Eric Piette
 */

import type { Context } from "../../../../../../context.js";
import type { MovesFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import { Move } from "../../../../../../move.js";

/**
 * Returns the "from" sites of a set of moves.
 *
 * Java parity: eval() evaluates the moves generator and collects all
 * fromNonDecision() sites from each generated move.
 *
 * @java game.functions.region.sites.moves.SitesFrom
 */
export class SitesFrom extends BaseRegionFunction {
  /** @java SitesFrom — private final Moves moves */
  private readonly moves: MovesFunction;

  /**
   * @param moves The moves from which to take from-sites.
   * @java SitesFrom(Moves)
   */
  public constructor(moves: MovesFunction) {
    super();
    this.moves = moves;
  }

  /**
   * @java SitesFrom.eval(Context)
   *
   * Returns all fromNonDecision sites from the generated moves.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const sites: number[] = [];

    // @java SitesFrom.java:43-45 — evaluate moves and collect from-sites
    const generatedMoves = this.moves.eval(ctx);

    // generatedMoves is Move[] (TS) or { moves(): Move[] } (Java-parity wrapper)
    let moveList: Move[];
    if (Array.isArray(generatedMoves)) {
      moveList = generatedMoves as Move[];
    } else {
      const movesObj = generatedMoves as unknown as { moves?: () => Move[] };
      moveList = movesObj.moves?.() ?? [];
    }

    // @java SitesFrom.java:47 — for (final Move m : generatedMoves.moves()) sites.add(m.fromNonDecision())
    for (const m of moveList) {
      if (m instanceof Move) {
        sites.push(m.fromNonDecision());
      } else {
        // Escape hatch for not-yet-typed Move-like objects
        const mAny = m as unknown as { fromNonDecision?: () => number; fromNonDecisionSite?: number; from?: () => number };
        if (typeof mAny.fromNonDecision === "function") {
          sites.push(mAny.fromNonDecision());
        } else if (typeof mAny.fromNonDecisionSite === "number") {
          sites.push(mAny.fromNonDecisionSite);
        } else if (typeof mAny.from === "function") {
          sites.push(mAny.from());
        }
      }
    }

    return sites;
  }

  /** @java SitesFrom.isStatic() */
  public override isStatic(): boolean {
    return (this.moves as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /** @java SitesFrom.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    const movesStr =
      (this.moves as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? "moves";
    return `the from sites of ${movesStr}`;
  }
}
