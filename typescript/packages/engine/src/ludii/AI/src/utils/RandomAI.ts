// @java AI/src/utils/RandomAI.java

/**
 * AI player which selects actions uniformly at random.
 *
 * @java utils.RandomAI
 * @author Dennis Soemers
 */

import { AI, type IGame, type IContext, type IMove } from "../../../../ludemes/other/other/AI.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java main.collections.FastArrayList<Move> */
type FastArrayList<T> = {
  size(): number;
  get(index: number): T;
};

/** @java game.Game (opaque surface used here) */
type GameWithMoves = IGame & {
  moves(context: IContext): { moves(): FastArrayList<IMove> };
  isAlternatingMoveGame(): boolean;
};

/** @java utils.AIUtils (deferred — in batch AI#3) */
type AIUtils = {
  extractMovesForMover(moves: FastArrayList<IMove>, player: number): FastArrayList<IMove>;
};

/** Deferred AIUtils stub */
const AIUtilsDeferred: AIUtils = {
  extractMovesForMover(moves: FastArrayList<IMove>, _player: number): FastArrayList<IMove> {
    // DEFERRED: AIUtils is in batch AI#3
    return moves;
  },
};

// ---------------------------------------------------------------------------

/**
 * @java utils.RandomAI
 */
export class RandomAI extends AI {

  //-------------------------------------------------------------------------

  /** Our player index. @java RandomAI.player */
  protected player: number = -1;

  /** The last move we returned. @java RandomAI.lastReturnedMove */
  protected _lastReturnedMove: IMove | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java RandomAI()
   */
  constructor() {
    super();
    this.friendlyName = "Random";
  }

  //-------------------------------------------------------------------------

  /**
   * @java RandomAI.selectAction(Game, Context, double, int, int)
   */
  override selectAction(
    game: IGame,
    context: IContext,
    _maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): IMove {
    const g = game as GameWithMoves;
    let legalMoves = g.moves(context).moves();

    if (!g.isAlternatingMoveGame()) {
      legalMoves = AIUtilsDeferred.extractMovesForMover(legalMoves, this.player);
    }

    const r = Math.floor(Math.random() * legalMoves.size());
    const move = legalMoves.get(r);
    this._lastReturnedMove = move;
    return move;
  }

  /**
   * @return The last move we returned
   * @java RandomAI.lastReturnedMove()
   */
  lastReturnedMove(): IMove | null {
    return this._lastReturnedMove;
  }

  /**
   * @java RandomAI.initAI(Game, int)
   */
  override initAI(_game: IGame, playerID: number): void {
    this.player = playerID;
    this._lastReturnedMove = null;
  }

  //-------------------------------------------------------------------------
}
