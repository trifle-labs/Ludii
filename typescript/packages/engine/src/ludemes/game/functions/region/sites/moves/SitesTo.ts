// @java Core/src/game/functions/region/sites/moves/SitesTo.java

/**
 * Returns the "to" sites of a set of moves.
 *
 * @java game/functions/region/sites/moves/SitesTo.java
 * @author Dennis Soemers and Eric Piette
 */

import type { Context } from "../../../../../../context.js";
import type { MovesFunction, EvalScratch } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";
import { Move } from "../../../../../../move.js";

/**
 * Returns the "to" sites of a set of moves.
 *
 * Java parity: eval() evaluates the moves generator and collects all
 * toNonDecision() sites from each generated move.
 *
 * @java game.functions.region.sites.moves.SitesTo
 */
export class SitesTo extends BaseRegionFunction {
  /** @java SitesTo — private final Moves moves */
  private readonly moves: MovesFunction;

  /**
   * @param moves The moves from which to take to-sites.
   * @java SitesTo(Moves)
   */
  public constructor(moves: MovesFunction) {
    super();
    this.moves = moves;
  }

  /**
   * @java SitesTo.eval(Context)
   *
   * Returns all toNonDecision sites from the generated moves.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    const sites: number[] = [];

    // @java SitesTo.java:43-45 — evaluate moves and collect to-sites
    const generatedMoves = this.moves.eval(ctx);

    // generatedMoves is Move[] (TS) or { moves(): Move[] } (Java-parity wrapper)
    let moveList: Move[];
    if (Array.isArray(generatedMoves)) {
      moveList = generatedMoves as Move[];
    } else {
      const movesObj = generatedMoves as unknown as { moves?: () => Move[] };
      moveList = movesObj.moves?.() ?? [];
    }

    // @java SitesTo.java:47 — for (final Move m : generatedMoves.moves()) sites.add(m.toNonDecision())
    for (const m of moveList) {
      if (m instanceof Move) {
        sites.push(m.toNonDecision());
      } else {
        // Escape hatch for not-yet-typed Move-like objects
        const mAny = m as unknown as { toNonDecision?: () => number; toNonDecisionSite?: number; to?: () => number };
        if (typeof mAny.toNonDecision === "function") {
          sites.push(mAny.toNonDecision());
        } else if (typeof mAny.toNonDecisionSite === "number") {
          sites.push(mAny.toNonDecisionSite);
        } else if (typeof mAny.to === "function") {
          sites.push(mAny.to());
        }
      }
    }

    // @java SitesTo.java:50 — Region(int[]) is BitSet-backed, so duplicate
    // to-sites collapse to one and iterate in ascending bit order. Shogun's
    // 2-hop slide expansion reaches the same destination via multiple
    // sub-path decompositions; the un-deduped array inflated the candidate
    // set (40 vs Java's recorded 30) and every extra duplicate consumed a
    // spurious context.rng() draw in FromTo's per-candidate (value Random)
    // apply — desyncing the RNG stream from ply 0.
    return Array.from(new Set(sites)).sort((a, b) => a - b);
  }

  /** @java SitesTo.isStatic() */
  public override isStatic(): boolean {
    return (this.moves as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /** @java SitesTo.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    const movesStr =
      (this.moves as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? "moves";
    return `the to sites of ${movesStr}`;
  }
}
