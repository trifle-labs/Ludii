// @java AI/src/search/mcts/playout/NST.java

import type { Context, Game, MCTS, PlayoutStrategy, Trial } from "./PlayoutStrategy.js";

// Escape-hatch types

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

/** @java search.mcts.MCTS.ActionStatistics */
interface ActionStatistics {
  visitCount: number;
  accumulatedScore: number;
}

/** @java search.mcts.MCTS (extended interface for NST) */
interface MCTSWithNGram extends MCTS {
  maxNGramLength(): number;
  getOrCreateActionStatsEntry(moveKey: unknown): ActionStatistics;
  getNGramActionStatsEntry(nGramMoveKey: unknown): ActionStatistics | null;
}

/**
 * @java search.mcts.backpropagation.BackpropagationStrategy.GLOBAL_NGRAM_ACTION_STATS
 * Value = 0x8
 */
const GLOBAL_NGRAM_ACTION_STATS = 0x8;

/**
 * @java search.mcts.backpropagation.BackpropagationStrategy.GLOBAL_ACTION_STATS
 * Value = 0x4
 */
const GLOBAL_ACTION_STATS = 0x4;

/**
 * N-gram Selection Technique playouts
 *
 * @java search.mcts.playout.NST
 * @author Dennis Soemers
 */
export class NST implements PlayoutStrategy {

  //-------------------------------------------------------------------------

  /** Auto-end playouts in a draw if they take more turns than this */
  protected playoutTurnLimit: number = -1;

  /** For epsilon-greedy move selection */
  protected epsilon: number = 0.1;

  /** For every thread, an NST-based PlayoutMoveSelector */
  // In TS we use a single instance (no ThreadLocal)
  protected readonly moveSelector: NSTMoveSelector = new NSTMoveSelector();

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java NST()
   */
  public constructor();

  /**
   * Constructor
   * @param playoutTurnLimit
   * @param epsilon
   * @java NST(int, double)
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

  /** @java NST.runPlayout(MCTS, Context) */
  public runPlayout(mcts: MCTS, context: Context): Trial {
    const nst = this.moveSelector;
    (nst as unknown as { mcts: MCTS }).mcts = mcts;

    const epsilonWrapper: unknown = { __epsilonGreedy: true, inner: nst, epsilon: this.epsilon };
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

    (nst as unknown as { mcts: MCTS | null }).mcts = null;
    return trial;
  }

  /** @java NST.backpropFlags() */
  public backpropFlags(): number {
    return GLOBAL_NGRAM_ACTION_STATS | GLOBAL_ACTION_STATS;
  }

  //-------------------------------------------------------------------------

  /** @java NST.playoutSupportsGame(Game) */
  public playoutSupportsGame(game: Game): boolean {
    if (game.isDeductionPuzzle()) {
      return this.playoutTurnLimit > 0;
    } else {
      return true;
    }
  }

  /** @java NST.customise(String[]) */
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
   * @java NST.playoutTurnLimit()
   */
  public getPlayoutTurnLimit(): number {
    return this.playoutTurnLimit;
  }

  //-------------------------------------------------------------------------
}

/**
 * Playout Move Selector for NST (NOTE: this one is just greedy, need
 * to put an epsilon-greedy wrapper around it for epsilon-greedy behaviour).
 *
 * @java search.mcts.playout.NST.NSTMoveSelector
 * @author Dennis Soemers
 */
export class NSTMoveSelector {

  /** MCTS from which to get our global action stats */
  public mcts: MCTSWithNGram | null = null;

  /**
   * @java NSTMoveSelector.selectMove(Context, FastArrayList, int, IsMoveReallyLegal)
   */
  public selectMove(
    context: unknown,
    maybeLegalMoves: FastArrayList<Move>,
    p: number,
    isMoveReallyLegal: { checkMove(move: Move): boolean }
  ): Move | null {
    void p;
    const mcts = this.mcts!;
    const contextTyped = context as unknown as {
      trial(): {
        numMoves(): number;
        numberRealMoves(): number;
        reverseMoveIterator(): Iterator<Move>;
      };
    };
    const trial = contextTyped.trial();

    const actionScoresData = new Float32Array(maybeLegalMoves.size());
    const actionScores: FVector = {
      size: () => maybeLegalMoves.size(),
      get(i: number) { return actionScoresData[i] ?? 0; },
      set(i: number, v: number) { actionScoresData[i] = v; },
      argMaxRand() {
        let best = -Infinity;
        let bestIdx = 0;
        for (let j = 0; j < actionScoresData.length; j++) {
          const v = actionScoresData[j] ?? -Infinity;
          if (v > best) { best = v; bestIdx = j; }
        }
        return bestIdx;
      },
    } as unknown as FVector;

    const maxNGramLength = Math.min(mcts.maxNGramLength(), trial.numberRealMoves() + 1);

    for (let i = 0; i < maybeLegalMoves.size(); ++i) {
      let numNGramsConsidered = 0;
      let scoresSum = 0.0;

      // Start with "N-grams" for N = 1
      const moveKey = { move: maybeLegalMoves.get(i), depth: trial.numMoves() };
      const actionStats = mcts.getOrCreateActionStatsEntry(moveKey);

      ++numNGramsConsidered;
      if (actionStats.visitCount > 0.0) {
        scoresSum += actionStats.accumulatedScore / actionStats.visitCount;
      } else {
        scoresSum += 1.0;
      }

      // Now N-grams for N > 1
      const reverseActionSequence: Move[] = [];
      reverseActionSequence.push(maybeLegalMoves.get(i));
      const reverseTrialIterator = trial.reverseMoveIterator();

      for (let n = 2; n <= maxNGramLength; ++n) {
        const next = reverseTrialIterator.next();
        if (next.done) break;
        reverseActionSequence.push(next.value);
        const nGram: Move[] = new Array<Move>(n);

        for (let j = 0; j < n; ++j) {
          nGram[j] = reverseActionSequence[n - j - 1]!;
        }

        const nGramKey = { moves: nGram, depth: trial.numberRealMoves() - n + 1 };
        const nGramStats = mcts.getNGramActionStatsEntry(nGramKey);

        if (nGramStats === null || nGramStats.visitCount <= 0) {
          break;
        }

        ++numNGramsConsidered;
        scoresSum += nGramStats.accumulatedScore / nGramStats.visitCount;
      }

      actionScores.set(i, scoresSum / numNGramsConsidered);
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
