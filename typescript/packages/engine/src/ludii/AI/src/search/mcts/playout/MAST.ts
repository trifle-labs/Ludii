// @java AI/src/search/mcts/playout/MAST.java

import type { Context, Game, MCTS, PlayoutStrategy, Trial } from "./PlayoutStrategy.js";

// Escape-hatch types for not-yet-ported dependencies

/** @java main.collections.FVector */
interface FVector {
  size(): number;
  get(i: number): number;
  set(i: number, v: number): void;
  argMaxRand(): number;
}

/** @java main.collections.FastArrayList */
interface FastArrayList<T> {
  size(): number;
  get(i: number): T;
}

/** @java other.move.Move */
interface Move {
  mover(): number;
}

/** @java other.playout.PlayoutMoveSelector */
interface PlayoutMoveSelector {
  __playoutMoveSelector: true;
}

/** @java search.mcts.MCTS.ActionStatistics */
interface ActionStatistics {
  visitCount: number;
  accumulatedScore: number;
}

/** @java search.mcts.MCTS (extended interface for MAST) */
interface MCTSWithStats extends MCTS {
  getOrCreateActionStatsEntry(moveKey: unknown): ActionStatistics;
}

/** @java playout_move_selectors.EpsilonGreedyWrapper */
interface EpsilonGreedyWrapper extends PlayoutMoveSelector {
  __epsilonGreedy: true;
}

/**
 * @java search.mcts.backpropagation.BackpropagationStrategy.GLOBAL_ACTION_STATS
 * Value = 0x4 (from BackpropagationStrategy Java source)
 */
const GLOBAL_ACTION_STATS = 0x4;

/**
 * Move-Average Sampling Technique (MAST) playout strategy (epsilon-greedy)
 *
 * @java search.mcts.playout.MAST
 * @author Dennis Soemers
 */
export class MAST implements PlayoutStrategy {

  //-------------------------------------------------------------------------

  /** Auto-end playouts in a draw if they take more turns than this */
  protected playoutTurnLimit: number = -1;

  /** For epsilon-greedy move selection */
  protected epsilon: number = 0.1;

  /** For every thread, a MAST-based PlayoutMoveSelector */
  // In TS we use a single instance (no ThreadLocal)
  protected readonly moveSelector: MASTMoveSelector = new MASTMoveSelector();

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java MAST()
   */
  public constructor();

  /**
   * Constructor
   * @param playoutTurnLimit
   * @param epsilon
   * @java MAST(int, double)
   */
  public constructor(playoutTurnLimit: number, epsilon: number);

  public constructor(playoutTurnLimit?: number, epsilon?: number) {
    if (playoutTurnLimit !== undefined) {
      this.playoutTurnLimit = playoutTurnLimit;
    } else {
      this.playoutTurnLimit = -1; // no limit
    }
    if (epsilon !== undefined) {
      this.epsilon = epsilon;
    }
  }

  //-------------------------------------------------------------------------

  /** @java MAST.runPlayout(MCTS, Context) */
  public runPlayout(mcts: MCTS, context: Context): Trial {
    const mast = this.moveSelector;
    (mast as unknown as { mcts: MCTS }).mcts = mcts;

    const epsilonWrapper: unknown = { __epsilonGreedy: true, inner: mast, epsilon: this.epsilon };
    const trial = (context as unknown as {
      game(): {
        playout(
          context: Context,
          agents: null,
          thinkTime: number,
          moveSelector: unknown,
          maxNumBiasedActions: number,
          maxNumPlayoutActions: number,
          rng: unknown
        ): Trial;
      };
    }).game().playout(context, null, 1.0, epsilonWrapper, -1, this.playoutTurnLimit, Math.random);

    (mast as unknown as { mcts: MCTS | null }).mcts = null;
    return trial;
  }

  /** @java MAST.backpropFlags() */
  public backpropFlags(): number {
    return GLOBAL_ACTION_STATS;
  }

  //-------------------------------------------------------------------------

  /** @java MAST.playoutSupportsGame(Game) */
  public playoutSupportsGame(game: Game): boolean {
    if (game.isDeductionPuzzle()) {
      return this.playoutTurnLimit > 0;
    } else {
      return true;
    }
  }

  /** @java MAST.customise(String[]) */
  public customise(inputs: string[]): void {
    for (let i = 1; i < inputs.length; ++i) {
      const input = inputs[i] ?? "";

      if (input.toLowerCase().startsWith("playoutturnlimit=")) {
        this.playoutTurnLimit = parseInt(input.substring("playoutturnlimit=".length), 10);
      }
    }
  }

  /**
   * @return The turn limit we use in playouts
   * @java MAST.playoutTurnLimit()
   */
  public getPlayoutTurnLimit(): number {
    return this.playoutTurnLimit;
  }

  //-------------------------------------------------------------------------
}

/**
 * Playout Move Selector for MAST (NOTE: this one is just greedy, need
 * to put an epsilon-greedy wrapper around it for epsilon-greedy behaviour).
 *
 * @java search.mcts.playout.MAST.MASTMoveSelector
 * @author Dennis Soemers
 */
export class MASTMoveSelector {

  /** MCTS from which to get our global action stats */
  public mcts: MCTSWithStats | null = null;

  /**
   * @java MASTMoveSelector.selectMove(Context, FastArrayList, int, IsMoveReallyLegal)
   */
  public selectMove(
    context: unknown,
    maybeLegalMoves: FastArrayList<Move>,
    p: number,
    isMoveReallyLegal: { checkMove(move: Move): boolean }
  ): Move | null {
    void p;
    const mcts = this.mcts!;
    const actionScores: FVector = {
      size: () => maybeLegalMoves.size(),
      _data: new Float32Array(maybeLegalMoves.size()),
      get(i: number) { return (this as unknown as { _data: Float32Array })._data[i] ?? 0; },
      set(i: number, v: number) { (this as unknown as { _data: Float32Array })._data[i] = v; },
      argMaxRand() {
        const data = (this as unknown as { _data: Float32Array })._data;
        let best = -Infinity;
        let bestIdx = 0;
        for (let j = 0; j < data.length; j++) {
          const v = data[j] ?? -Infinity;
          if (v > best) { best = v; bestIdx = j; }
        }
        return bestIdx;
      },
    } as unknown as FVector;

    const trial = (context as unknown as { trial(): { numMoves(): number } }).trial();

    for (let i = 0; i < maybeLegalMoves.size(); ++i) {
      const moveKey = { move: maybeLegalMoves.get(i), depth: trial.numMoves() };
      const actionStats = mcts.getOrCreateActionStatsEntry(moveKey);

      if (actionStats.visitCount > 0.0) {
        actionScores.set(i, actionStats.accumulatedScore / actionStats.visitCount);
      } else {
        actionScores.set(i, 1.0);
      }
    }

    let numLegalMoves = maybeLegalMoves.size();

    while (numLegalMoves > 0) {
      --numLegalMoves; // We're trying a move; if this one fails, it's actually not legal

      const n = actionScores.argMaxRand();
      const move = maybeLegalMoves.get(n);

      if (isMoveReallyLegal.checkMove(move)) {
        return move; // Only return this move if it's really legal
      } else {
        actionScores.set(n, -Infinity); // Illegal action
      }
    }

    // No legal moves?
    return null;
  }
}

//-------------------------------------------------------------------------
