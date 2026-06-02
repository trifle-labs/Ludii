// @java Core/src/other/concept/EndConcepts.java EndConcepts
/**
 * Utility to compute ending concepts from a terminal condition.
 *
 * Faithful 1:1 transliteration of other.concept.EndConcepts.
 *
 * @author Eric.Piette  (Java original)
 */

import { Concept } from "./Concept.js";

// ---------------------------------------------------------------------------
// Minimal opaque types for live-engine dependencies
// ---------------------------------------------------------------------------

/**
 * Mirrors game.types.play.ResultType.
 * @java game.types.play.ResultType
 */
export type ResultType = "Win" | "Loss" | "Draw";

/**
 * Mirrors game.types.play.RoleType values used in EndConcepts.
 * @java game.types.play.RoleType
 */
export type RoleType = "Mover" | "Next" | string;

/** Minimal interface for the game object. */
export interface GameLike {
  players(): { count(): number };
}

/** Minimal interface for the Result ludeme. */
export interface ResultLike {
  result(): ResultType | null;
  who():    RoleType | null;
  /** @java Result#concepts(Game) — returns a BitSet; we use Set<number> */
  concepts(game: GameLike): Set<number>;
}

/**
 * A BitSet-like mutable set of concept ids.
 * @java java.util.BitSet
 */
export class ConceptBitSet {
  private readonly bits: Set<number> = new Set();

  /** @java BitSet#set(int,boolean) */
  set(id: number, _value?: boolean): void { this.bits.add(id); }

  /** @java BitSet#get(int) */
  get(id: number): boolean { return this.bits.has(id); }

  /** @java BitSet#or(BitSet) */
  or(other: ConceptBitSet | Set<number>): void {
    const src = other instanceof ConceptBitSet ? other.bits : other;
    for (const id of src) this.bits.add(id);
  }

  toSet(): ReadonlySet<number> { return this.bits; }
}

// ---------------------------------------------------------------------------

/**
 * Utilities class used to compute the end concepts from the concepts of the
 * condition which is true.
 * @java other.concept.EndConcepts
 */
export class EndConcepts {
  /** Utility class — do not construct. */
  private constructor() { /* no-op */ }

  /**
   * Compute the ending concepts.
   *
   * @param condConcepts  The condition concepts (BitSet of concept ids).
   * @param game          The game.
   * @param result        The result (Win/Loss/Draw + who), or null.
   * @returns A ConceptBitSet of applicable end concept ids.
   *
   * @java EndConcepts#get(BooleanFunction,Context,Game,Result)
   */
  static get(
    condConcepts: ConceptBitSet,
    game: GameLike,
    result: ResultLike | null,
  ): ConceptBitSet {
    const resultType: ResultType | null = result !== null ? result.result() : null;
    const who:        RoleType    | null = result !== null ? result.who()    : null;
    const endConcepts = new ConceptBitSet();

    const numPlayers = game.players().count();

    // Helper: apply Win/Loss/Draw triplet
    const applyWLD = (
      endId:  Concept,
      winId:  Concept,
      lossId: Concept,
      drawId: Concept,
    ) => {
      endConcepts.set(endId);
      if (resultType === null || who === null) return;
      if (resultType === "Win") {
        if (who === "Mover") endConcepts.set(winId);
        else if (who === "Next" && numPlayers === 2) endConcepts.set(lossId);
      } else if (resultType === "Loss") {
        if (who === "Mover") endConcepts.set(lossId);
        else if (who === "Next" && numPlayers === 2) endConcepts.set(winId);
      } else if (resultType === "Draw") {
        endConcepts.set(drawId);
      }
    };

    // -------- Legal Moves End ------------------------------------------------

    if (condConcepts.get(Concept.NoMoves)) {
      applyWLD(
        Concept.NoMovesEnd,
        Concept.NoMovesWin,
        Concept.NoMovesLoss,
        Concept.NoMovesDraw,
      );
    }

    // -------- Time / Progress End -------------------------------------------

    if (condConcepts.get(Concept.ProgressCheck)) {
      applyWLD(
        Concept.NoProgressEnd,
        Concept.NoProgressWin,
        Concept.NoProgressLoss,
        Concept.NoProgressDraw,
      );
    }

    // -------- Scoring End ---------------------------------------------------

    if (condConcepts.get(Concept.Scoring)) {
      applyWLD(
        Concept.ScoringEnd,
        Concept.ScoringWin,
        Concept.ScoringLoss,
        Concept.ScoringDraw,
      );
    }

    // -------- Race End (NoOwnPieces) ----------------------------------------

    if (condConcepts.get(Concept.NoPieceMover)) {
      applyWLD(
        Concept.NoOwnPiecesEnd,
        Concept.NoOwnPiecesWin,
        Concept.NoOwnPiecesLoss,
        Concept.NoOwnPiecesDraw,
      );
    }

    // -------- Fill End ------------------------------------------------------

    if (condConcepts.get(Concept.Fill)) {
      endConcepts.set(Concept.FillEnd);
      if (resultType !== null && who !== null) {
        if (resultType === "Win") {
          if (who === "Next" && numPlayers === 2) endConcepts.set(Concept.FillLoss);
          else if (who === "Mover") endConcepts.set(Concept.FillWin);
        } else if (resultType === "Loss") {
          if (who === "Mover") endConcepts.set(Concept.FillLoss);
          else if (who === "Next" && numPlayers === 2) endConcepts.set(Concept.FillWin);
        } else if (resultType === "Draw") {
          endConcepts.set(Concept.FillDraw);
        }
      }
    }

    // -------- Reach End -----------------------------------------------------

    if (condConcepts.get(Concept.Contains)) {
      applyWLD(
        Concept.ReachEnd,
        Concept.ReachWin,
        Concept.ReachLoss,
        Concept.ReachDraw,
      );
    }

    // -------- Checkmate End -------------------------------------------------

    if (condConcepts.get(Concept.CanNotMove) && condConcepts.get(Concept.Threat)) {
      applyWLD(
        Concept.Checkmate,
        Concept.CheckmateWin,
        Concept.CheckmateLoss,
        Concept.CheckmateDraw,
      );
    }

    // -------- No Target Piece End -------------------------------------------

    if (condConcepts.get(Concept.NoTargetPieceEnd)) {
      applyWLD(
        Concept.NoTargetPieceEnd,
        Concept.NoTargetPieceWin,
        Concept.NoTargetPieceLoss,
        Concept.NoTargetPieceDraw,
      );
    }

    // -------- Eliminate Pieces End ------------------------------------------

    if (
      condConcepts.get(Concept.NoPieceNext) ||
      condConcepts.get(Concept.CountPiecesNextComparison) ||
      (condConcepts.get(Concept.NoPiece) && !condConcepts.get(Concept.NoPieceMover))
    ) {
      applyWLD(
        Concept.EliminatePiecesEnd,
        Concept.EliminatePiecesWin,
        Concept.EliminatePiecesLoss,
        Concept.EliminatePiecesDraw,
      );
    }

    // -------- Space End: Line -----------------------------------------------

    if (condConcepts.get(Concept.Line)) {
      applyWLD(
        Concept.LineEnd,
        Concept.LineWin,
        Concept.LineLoss,
        Concept.LineDraw,
      );
    }

    // -------- Space End: Connection -----------------------------------------

    if (condConcepts.get(Concept.Connection)) {
      applyWLD(
        Concept.ConnectionEnd,
        Concept.ConnectionWin,
        Concept.ConnectionLoss,
        Concept.ConnectionDraw,
      );
    }

    // -------- Space End: Group ----------------------------------------------

    if (condConcepts.get(Concept.Group)) {
      applyWLD(
        Concept.GroupEnd,
        Concept.GroupWin,
        Concept.GroupLoss,
        Concept.GroupDraw,
      );
    }

    // -------- Space End: Loop -----------------------------------------------

    if (condConcepts.get(Concept.Loop)) {
      applyWLD(
        Concept.LoopEnd,
        Concept.LoopWin,
        Concept.LoopLoss,
        Concept.LoopDraw,
      );
    }

    // -------- Space End: Pattern --------------------------------------------

    if (condConcepts.get(Concept.Pattern)) {
      applyWLD(
        Concept.PatternEnd,
        Concept.PatternWin,
        Concept.PatternLoss,
        Concept.PatternDraw,
      );
    }

    // -------- Space End: Territory ------------------------------------------

    if (condConcepts.get(Concept.Territory)) {
      applyWLD(
        Concept.TerritoryEnd,
        Concept.TerritoryWin,
        Concept.TerritoryLoss,
        Concept.TerritoryDraw,
      );
    }

    // -------- Space End: PathExtent -----------------------------------------

    if (condConcepts.get(Concept.PathExtent)) {
      applyWLD(
        Concept.PathExtentEnd,
        Concept.PathExtentWin,
        Concept.PathExtentLoss,
        Concept.PathExtentDraw,
      );
    }

    // -------- Misere --------------------------------------------------------

    if (numPlayers === 2 && resultType !== null && who !== null) {
      if (
        (resultType === "Win" && who === "Next") ||
        (resultType === "Loss" && who === "Mover")
      ) {
        endConcepts.set(Concept.Misere);
      }
    }

    // -------- Merge result concepts -----------------------------------------

    if (result !== null) {
      endConcepts.or(result.concepts(game));
    }

    return endConcepts;
  }
}
