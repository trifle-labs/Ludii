/**
 * @java game/rules/play/moves/nonDecision/operators/foreach/piece/ForEachPiece.java
 *
 * (forEach Piece [specificMoves]) — iterates over every board site occupied by
 * the current mover's pieces. For each site, sets context._evalFrom and
 * calls either the provided specificMoves generator or the piece's own
 * generator (from equipment).
 *
 * Java parity (ForEachPiece.eval, lines 410-416):
 *   Iterates movesIterator, which scans owned.positions(specificPlayer) for
 *   each component filtered by container range (minIndex..maxIndex).
 *
 * Container semantics (Java ContainerId default = 0 = board container):
 *   - No container arg → scan board sites only [0..board.numSites).
 *     @java ContainerId(null,null,null,null,null) → index=new IntConstant(0) → board.
 *   - container:(mover) → scan mover's hand sites only [handBase..handBase+1).
 *     @java ContainerId(container=moverFn) → cont=mover → hand container.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/piece/ForEachPiece.java — eval(Context)
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction, IntFunction } from "../../../../../../../base.js";
import type { Equipment1to1 } from "../../../../../../../game/equipment/Equipment1to1.js";
import type { Game1to1 } from "../../../../../../../Game1to1.js";

export class ForEachPiece1to1 implements MovesFunction {
  /**
   * Optional override move generator (used when specificMoves are given).
   * If null, each piece uses its own generator from equipment.
   * @java ForEachPiece.specificMoves
   */
  private readonly specificMoves: MovesFunction | null;

  /**
   * Optional piece-name filter.
   * When non-null, only iterate sites where the piece's component name
   * starts with this string (Java parity: ForEachPiece filters by component).
   * @java ForEachPiece — compIndices filter on owned.positions()
   */
  public pieceName: string | null = null;

  /**
   * Reference to equipment so we can look up each piece's generator.
   * Set during compilation.
   */
  public equipment: Equipment1to1 | null = null;

  /**
   * Optional container selector.
   * When null → board-only range (Java default: ContainerId→index=0→board).
   * When provided → evaluates to a container index: > 0 means hand container
   * for the player whose ID equals the value (e.g. mover → hand for mover).
   * @java ForEachPiece — containerId.eval(context) with ContainerId default=0(board)
   */
  public containerFn: IntFunction | null = null;

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
   * Scan the appropriate container's sites for the mover's pieces. For each,
   * set _evalFrom and call the appropriate generator.
   *
   * Container range:
   *   - No container (default board, cont=0): [0..board.numSites)
   *   - container:(mover) → hand range for mover: [handBase..handBase+1)
   *
   * When pieceName is set, only iterate sites whose piece component name matches.
   * @java ForEachPiece — filters by compIndices (piece type) within owned positions
   */
  public eval(ctx: Context): Move[] {
    const state = ctx.state;
    const mover = state.mover;
    const cells = state.cells;
    const result: Move[] = [];

    const origFrom = ctx._evalFrom;

    // Determine site range based on container selection.
    // @java ForEachPiece: minIndex = sitesFrom[cont], maxIndex = minIndex + cont.numSites()
    //   cont=0 (board): maxIndex = topology.cells().size() = board.numSites
    //   cont=mover (hand): minIndex = handSiteOf[mover], maxIndex = minIndex + 1
    const game = ctx.game as unknown as Game1to1;
    const eq = this.equipment ?? game?.equipment ?? null;
    let startSite = 0;
    let endSite = cells.length;

    if (this.containerFn !== null && eq !== null) {
      const containerIdx = this.containerFn.eval(ctx);
      if (containerIdx <= 0) {
        // Container 0 = board: iterate board sites only.
        endSite = eq.board.numSites;
      } else {
        // Container N (player N's hand): iterate that player's hand sites.
        // @java equipment.sitesFrom()[cont] gives hand base index.
        const handBase = eq.handSiteOf.get(containerIdx);
        if (handBase !== undefined) {
          const hand = eq.hands.find(h => h.owner === containerIdx);
          startSite = handBase;
          endSite = handBase + (hand?.size ?? 1);
        } else {
          // No hand for this container — return empty.
          ctx._evalFrom = origFrom;
          return [];
        }
      }
    } else {
      // No container specified → board-only (Java default: ContainerId → index=0 → board).
      // @java ContainerId(null,...) → this.index = new IntConstant(0) → cont=0 → board.
      if (eq !== null) {
        endSite = eq.board.numSites;
      }
    }

    // Build piece-name → set-of-what-indices map for filtering, if needed.
    // @java ForEachPiece: compIndices built from component name match.
    let allowedWhats: Set<number> | null = null;
    if (this.pieceName !== null && eq !== null) {
      allowedWhats = new Set<number>();
      const nameFilter = this.pieceName;
      for (const piece of eq.pieces) {
        if (piece.name.startsWith(nameFilter)) {
          allowedWhats.add(piece.index);
        }
      }
    }

    for (let site = startSite; site < endSite; site++) {
      // @java ForEachPiece: check if this site holds a piece belonging to mover
      // In the simplified model: cells[site] === mover (owner check).
      // Java parity: owned.positions(specificPlayer) filtered by compIndices.
      if ((cells[site] ?? 0) !== mover) continue;

      // Note: the `cells[site] === mover` check above is the primary occupancy
      // guard for both board and hand sites. We intentionally do NOT add a
      // `countAt[site] > 0` guard for hand sites because a piece knocked back
      // to an *empty* hand sets cells[hand]=owner but countAt[hand]=0 (Java
      // ActionMoveTopPiece sets who/what/count=1 at the destination, but TS
      // ActionMove only updates cells/whats in the plain branch). The cells[]
      // check already prevents false-positives for truly empty hands (cells=0).

      // Filter by piece type (component name) when a pieceName filter is set.
      // @java ForEachPiece — compIndices filter
      if (allowedWhats !== null) {
        const what = state.whatAtSite(site);
        if (!allowedWhats.has(what)) continue;
      }

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
    const eq = this.equipment;
    if (eq === null) return null;
    const pieces = eq.pieces;
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
