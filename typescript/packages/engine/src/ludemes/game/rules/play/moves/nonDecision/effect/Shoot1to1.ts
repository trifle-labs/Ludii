/**
 * @java game/rules/play/moves/nonDecision/effect/Shoot.java (1:1 port subset)
 *
 * Shoots a piece from the last-moved-to site along all adjacent directions.
 *
 * Java parity (Shoot.java — eval, lines 116-168):
 *   - startLocationFn defaults to (lastTo) when no `from` is specified
 *   - dirnChoice defaults to Adjacent
 *   - toRule defaults to (in (to) (sites Empty))
 *   - For each radial from the from-site, slide to empty cells and place `pieceType`
 *
 * In Amazons: `(move Shoot (piece "Dot0"))` — called after a queen slide.
 *   - from = last To (the queen's landing site, stored in ctx._evalTo from the
 *     previous move via Game1to1.apply step 2)
 *   - piece = the Dot0 component (index resolved from equipment)
 *   - generates ActionAdd(to, pieceIndex) for each reachable empty site
 *
 * @java game/rules/play/moves/nonDecision/effect/Shoot.java — eval(Context)
 */

import type { Context } from "../../../../../../../context.js";
import type { Move } from "../../../../../../../move.js";
import type { MovesFunction } from "../../../../../../base.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import { radialsForDirection } from "../../../../../../topology-radials.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { Move as LudiiMove } from "../../../../../../../move.js";
import type { Game1to1 } from "../../../../../../Game1to1.js";

export class Shoot1to1 implements MovesFunction {
  /**
   * The piece ID to place (e.g. "Dot0").
   * @java Shoot.pieceFn — component() index looked up at eval time
   */
  private readonly pieceId: string;

  /**
   * Direction to shoot along. Defaults to "Adjacent" (all 8 dirs for square boards).
   * @java Shoot.dirnChoice — defaults to Adjacent
   */
  private readonly dirnName: string;

  /**
   * @param pieceId  Full piece identifier including owner suffix (e.g. "Dot0")
   * @param dirnName Direction name (defaults to "Adjacent")
   */
  public constructor(pieceId: string, dirnName = "Adjacent") {
    this.pieceId = pieceId;
    this.dirnName = dirnName;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Shoot.java — eval(Context)
   *
   * from = (last To) = the landing site of the last move in the trial.
   * Walk each radial from `from`: add an ActionAdd(to, pieceIdx) for each
   * reachable empty cell. Stop when a non-empty cell is hit.
   */
  public eval(ctx: Context): LudiiMove[] {
    // @java Shoot.java:116 — from = startLocationFn.eval(context) = lastTo
    // Java's default `from` for Shoot is (lastTo) — the landing site of the
    // last played move. Read from trial.moves to mirror LastTo.java:50-62.
    let from = -1;
    const trialMoves = ctx.trial.moves;
    if (trialMoves.length > 0) {
      const lastMove = trialMoves[trialMoves.length - 1];
      if (lastMove) {
        // @java LastTo.java:50-62 — returns the non-decision to-site
        const t = lastMove.toNonDecision();
        if (t >= 0) from = t;
        else {
          // Fallback to to() if toNonDecision is unavailable
          const t2 = lastMove.to();
          if (t2 >= 0) from = t2;
        }
      }
    }
    if (from < 0) return [];

    const ctxAny = ctx as unknown as { _radials?: CellFlatRadials[] };
    const radials = ctxAny._radials;
    if (!radials) return [];

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    // Resolve the piece component index from the game's equipment.
    // @java Shoot.pieceFn.eval(context) — returns component index
    const game = ctx.game as unknown as Game1to1;
    const pieceId = this.pieceId;
    const piece = game.equipment?.pieces.find(
      p => `${p.name}${p.owner}` === pieceId || `${p.name}${p.owner}`.toLowerCase() === pieceId.toLowerCase()
    );
    if (!piece) return [];
    const pieceIndex = piece.index;

    const state = ctx.state;
    const mover = state.mover;
    const result: LudiiMove[] = [];

    // Select radial axes by direction.
    // @java Shoot.java:132 — dirnChoice.convertToAbsolute(...)
    const axes = radialsForDirection(cellRadials, this.dirnName);

    for (const { ray, opposite } of axes) {
      for (const rayToWalk of [ray, opposite]) {
        // Skip step 0 (the pivot itself)
        for (let i = 1; i < rayToWalk.length; i++) {
          const to = rayToWalk[i];
          if (to === undefined) break;
          // @java Shoot.java:142 — toRule: (in (to) (sites Empty))
          if (!state.isEmptySite(to)) break; // Non-empty: stop this ray
          // Empty cell: valid shot target
          // @java ActionAdd(type, to, pieceType, 1, ...)
          const action = new ActionAdd({ to, what: pieceIndex, owner: 0 });
          // @java Shoot.java: MoveUtilities.setGeneratedMovesData sets mover on each move
          // The move is attributed to the mover; the placed piece is neutral (owner=0 in ActionAdd).
          result.push(new LudiiMove({
            id: `shoot:${from}:${to}`,
            label: `Shoot(${from}→${to})`,
            siteIndices: [from, to],
            mover,
            placedOwner: mover, // The move is attributed to the current player (Java MoveUtilities)
            actions: [action],
            fromSite: from,
            toSite: to,
          }));
        }
      }
    }

    return result;
  }
}
