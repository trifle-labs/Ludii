/**
 * @java game/rules/play/moves/nonDecision/operators/foreach/piece/ForEachPiece.java
 *
 * (forEach Piece [specificMoves]) — iterates over every board site occupied by
 * the current mover's pieces. For each site, sets context._evalFrom and
 * calls either the provided specificMoves generator or the piece's own
 * generator (from equipment).
 *
 * Simplified for the 1:1 path: handles the common `(forEach Piece)` case
 * (no item filter, no container filter, no top-of-stack flag) where role
 * defaults to Mover.
 *
 * Java parity (ForEachPiece.eval, lines 410-416):
 *   Iterates movesIterator, which scans owned.positions(specificPlayer) for
 *   each component and generates piece moves.
 *
 * TS simplification: scan state.cells for sites where cells[site] === mover,
 * then call the piece's generator (or specificMoves) after setting
 * context._evalFrom = site.
 *
 * This is faithful in outcome for the common alternating-play case where
 * every player owns exactly one piece type and there is no stacking.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/piece/ForEachPiece.java — eval(Context)
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../../base.js";
import type { Equipment1to1 } from "../../../../../../../game/equipment/Equipment1to1.js";

export class ForEachPiece1to1 implements MovesFunction {
  /**
   * Optional override move generator (used when specificMoves are given).
   * If null, each piece uses its own generator from equipment.
   * @java ForEachPiece.specificMoves
   */
  private readonly specificMoves: MovesFunction | null;

  /**
   * Reference to equipment so we can look up each piece's generator.
   * Set during compilation.
   */
  public equipment: Equipment1to1 | null = null;

  /**
   * @java game/rules/play/moves/nonDecision/operators/foreach/piece/ForEachPiece.java — constructor
   * @param specificMoves Optional override move generator
   */
  public constructor(specificMoves: MovesFunction | null = null) {
    this.specificMoves = specificMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/operators/foreach/piece/ForEachPiece.java — eval(Context)
   *
   * Scan all board sites for the mover's pieces. For each, set _evalFrom and
   * call the appropriate generator.
   */
  public eval(ctx: Context): Move[] {
    const state = ctx.state;
    const mover = state.mover;
    const cells = state.cells;
    const result: Move[] = [];

    const origFrom = ctx._evalFrom;

    for (let site = 0; site < cells.length; site++) {
      // @java ForEachPiece: check if this site holds a piece belonging to mover
      // In the simplified model: cells[site] === mover (owner check).
      // Java parity: owned.positions(specificPlayer) filtered by compIndices.
      if ((cells[site] ?? 0) !== mover) continue;

      // Set the eval-from scratch for the generator.
      // @java ForEachPiece movesIterator: context.setFrom(location)
      ctx._evalFrom = site;

      let pieceMoves: Move[];

      if (this.specificMoves !== null) {
        // Use the override generator.
        pieceMoves = this.specificMoves.eval(ctx);
      } else {
        // Use the piece's own generator from equipment.
        // Look up which piece is at this site.
        const what = state.whatAtSite(site);
        const generator = this.findGenerator(what, mover);
        if (generator === null) {
          pieceMoves = [];
        } else {
          pieceMoves = generator.eval(ctx);
        }
      }

      for (const m of pieceMoves) result.push(m);
    }

    // Restore _evalFrom.
    ctx._evalFrom = origFrom;

    return result;
  }

  /**
   * Look up the move generator for a piece identified by component index `what`
   * and owner `owner`. Falls back to first piece matching owner.
   *
   * @java ForEachPiece: component.generate(context) via equipment.components()
   */
  private findGenerator(what: number, owner: number): MovesFunction | null {
    if (this.equipment === null) return null;
    const pieces = this.equipment.pieces;
    // First try exact what-index match.
    if (what > 0) {
      const piece = pieces.find(p => p.index === what);
      if (piece?.generator) return piece.generator;
    }
    // Fallback: first piece for this owner.
    const fallback = pieces.find(p => p.owner === owner);
    return fallback?.generator ?? null;
  }
}
