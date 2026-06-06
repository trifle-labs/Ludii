// @java AI/src/search/flat/OnePlyNoHeuristic.java

/**
 * One-ply search with no heuristics (only optimises for best ranking achievable
 * in a single move, with random tie-breaking). For stochastic games, only randomly
 * considers one outcome for every move.
 *
 * @java search/flat/OnePlyNoHeuristic.java
 * @author Dennis Soemers
 */

import type { AI, FastArrayList, Game, Move } from "./HeuristicSampling.js";

//-------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java other.context.Context */
export interface Context {
  state(): {
    mover(): number;
    playerToAgent(p: number): number;
    currentPlayerOrder(agent: number): number;
  };
  game(): Game;
  trial(): { over(): boolean; ranking(): number[] };
  active(p: number): boolean;
  computeNextLossRank(): number;
  computeNextWinRank(): number;
}

/** @java other.RankUtils */
const RankUtils = {
  /**
   * @java RankUtils.rankToUtil(double, int)
   */
  rankToUtil(rank: number, numPlayers: number): number {
    // escape hatch — not yet ported; return normalised rank utility
    return (numPlayers - rank) / (numPlayers - 1.0);
  },
};

//-------------------------------------------------------------------------

/** @java other.AI base */
abstract class AIBase {
  public friendlyName: string = "";

  public initAI(_game: unknown, _playerID: number): void { /* base */ }
  public closeAI(): void { /* base */ }
  public supportsGame(_game: unknown): boolean { return true; }

  public abstract selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null;
}

//-------------------------------------------------------------------------

/**
 * One-ply search with no heuristics.
 *
 * @java search.flat.OnePlyNoHeuristic
 */
export class OnePlyNoHeuristic extends AIBase {

  //-------------------------------------------------------------------------

  /** The number of players in the game we're currently playing
   * @java OnePlyNoHeuristic.numPlayersInGame */
  protected numPlayersInGame: number = 0;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java OnePlyNoHeuristic()
   */
  public constructor() {
    super();
    this.friendlyName = "One-Ply (No Heuristic)";
  }

  //-------------------------------------------------------------------------

  /**
   * @java OnePlyNoHeuristic.selectAction(Game, Context, double, int, int)
   */
  public override selectAction(
    game: Game,
    context: Context,
    _maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): Move | null {
    const legalMoves: FastArrayList<Move> = game.moves(context).moves();
    const agent: number = context.state().playerToAgent(context.state().mover());

    let bestScore: number = -Infinity;
    const bestMoves: Move[] = [];

    const utilLowerBound: number = RankUtils.rankToUtil(
      context.computeNextLossRank(), this.numPlayersInGame
    );
    const utilUpperBound: number = RankUtils.rankToUtil(
      context.computeNextWinRank(), this.numPlayersInGame
    );

    for (let i = 0; i < legalMoves.size(); ++i) {
      const move = legalMoves.get(i);
      game.apply(context as unknown, move);
      const player: number = context.state().currentPlayerOrder(agent);

      let score: number;
      if (context.active(player)) {
        // Still active, so just assume average between lower and upper bound
        score = (utilLowerBound + utilUpperBound) / 2.0;
      } else {
        // Not active, so take actual utility
        score = RankUtils.rankToUtil(context.trial().ranking()[player] ?? 0, this.numPlayersInGame);
      }

      if (score > bestScore)
        bestMoves.length = 0;

      if (score >= bestScore) {
        bestMoves.push(move);
        bestScore = score;
      }

      // game.undo(context) — escape hatch
      (game as unknown as { undo(ctx: unknown): void }).undo?.(context);
    }

    return bestMoves[Math.trunc(Math.random() * bestMoves.length)] ?? null;
  }

  //-------------------------------------------------------------------------

  /**
   * @java OnePlyNoHeuristic.initAI(Game, int)
   */
  public override initAI(game: Game, _playerID: number): void {
    this.numPlayersInGame = game.players().count();
  }

  /** @java OnePlyNoHeuristic.supportsGame(Game) */
  public override supportsGame(game: Game): boolean {
    if (game.players().count() <= 1)
      return false;

    if (game.hiddenInformation())
      return false;

    return game.isAlternatingMoveGame();
  }

  //-------------------------------------------------------------------------
}
