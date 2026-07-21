// @java AI/src/search/mcts/backpropagation/BackpropagationStrategy.java

/**
 * Abstract class for implementations of backpropagation in MCTS.
 *
 * @java search.mcts.backpropagation.BackpropagationStrategy
 * @author Dennis Soemers
 */

import { BaseNode, NodeStatistics } from "../nodes/BaseNode.js";

// ---------------------------------------------------------------------------
// Escape-hatch types

/** @java other.context.Context */
type Context = {
  state(): { playerToAgent(player: number): number };
  trial(): { numMoves(): number; reverseMoveIterator(): Iterator<Move> };
  active(): boolean;
};

/** @java other.move.Move */
type Move = {
  mover(): number;
  isPass(): boolean;
  isSwap(): boolean;
  isOrientedMove(): boolean;
  toNonDecision(): number;
  fromNonDecision(): number;
  stateNonDecision(): number;
};

/** @java search.mcts.MCTS */
type MCTS = {
  maxNGramLength(): number;
  getOrCreateActionStatsEntry(key: MoveKey): ActionStatistics;
  getOrCreateNGramActionStatsEntry(key: NGramMoveKey): ActionStatistics;
};

/** @java search.mcts.MCTS.ActionStatistics */
export interface ActionStatistics {
  visitCount: number;
  accumulatedScore: number;
}

/** @java search.mcts.MCTS.MoveKey */
export interface MoveKey {
  move: Move;
  moveDepth: number;
}

/** @java search.mcts.MCTS.NGramMoveKey */
export interface NGramMoveKey {
  moves: Move[];
  moveDepth: number;
}

// ---------------------------------------------------------------------------

/**
 * Abstract class for implementations of backpropagation in MCTS.
 *
 * @java search.mcts.backpropagation.BackpropagationStrategy
 */
export abstract class BackpropagationStrategy {

  // -------------------------------------------------------------------------

  /** @java BackpropagationStrategy.backpropFlags */
  protected backpropFlags: number = 0;

  /** @java BackpropagationStrategy.GRAVE_STATS */
  public static readonly GRAVE_STATS: number                 = 0x1;
  /** @java BackpropagationStrategy.GLOBAL_ACTION_STATS */
  public static readonly GLOBAL_ACTION_STATS: number         = (0x1 << 1);
  /** @java BackpropagationStrategy.GLOBAL_NGRAM_ACTION_STATS */
  public static readonly GLOBAL_NGRAM_ACTION_STATS: number   = (0x1 << 2);
  /** @java BackpropagationStrategy.GLOBAL_HEURISTIC_STATS */
  public static readonly GLOBAL_HEURISTIC_STATS: number      = (0x1 << 3);

  // -------------------------------------------------------------------------

  /**
   * Set backprop flags for this backpropagation implementation.
   * @java BackpropagationStrategy.setBackpropFlags(int)
   */
  public setBackpropFlags(backpropFlags: number): void {
    this.backpropFlags = backpropFlags;
  }

  // -------------------------------------------------------------------------

  /**
   * Computes the array of utilities that we want to backpropagate.
   * @java BackpropagationStrategy.computeUtilities(MCTS, BaseNode, Context, double[], int)
   */
  public abstract computeUtilities(
    mcts: MCTS,
    startNode: BaseNode,
    context: Context,
    utilities: number[],
    numPlayoutMoves: number,
  ): void;

  /**
   * @return Additional flags for data this Backpropagation wants to track.
   * @java BackpropagationStrategy.backpropagationFlags()
   */
  public abstract backpropagationFlags(): number;

  // -------------------------------------------------------------------------

  /**
   * Updates the given node with statistics based on the given trial.
   * @java BackpropagationStrategy.update(MCTS, BaseNode, Context, double[], int)
   */
  public update(
    mcts: MCTS,
    startNode: BaseNode,
    context: Context,
    utilities: number[],
    numPlayoutMoves: number,
  ): void {
    let node: BaseNode | null = startNode;
    this.computeUtilities(mcts, startNode, context, utilities, numPlayoutMoves);

    const updateGRAVE = ((this.backpropFlags & BackpropagationStrategy.GRAVE_STATS) !== 0);
    const updateGlobalActionStats = ((this.backpropFlags & BackpropagationStrategy.GLOBAL_ACTION_STATS) !== 0);
    const updateGlobalNGramActionStats = ((this.backpropFlags & BackpropagationStrategy.GLOBAL_NGRAM_ACTION_STATS) !== 0);
    const moveKeysAMAF: MoveKey[] = [];
    const reverseMovesIterator = context.trial().reverseMoveIterator();
    const numTrialMoves = context.trial().numMoves();
    let movesIdxAMAF = numTrialMoves - 1;

    if (updateGRAVE || updateGlobalActionStats || updateGlobalNGramActionStats) {
      // Collect all move keys for playout moves
      while (movesIdxAMAF >= (numTrialMoves - numPlayoutMoves)) {
        const iterResult = reverseMovesIterator.next();
        if (iterResult.done) break;
        moveKeysAMAF.push({ move: iterResult.value, moveDepth: movesIdxAMAF });
        --movesIdxAMAF;
      }
    }

    while (node !== null) {
      // Java: synchronized(node)
      node.update(utilities);

      if (updateGRAVE) {
        for (const moveKey of moveKeysAMAF) {
          const graveStats: NodeStatistics = node.getOrCreateGraveStatsEntry(moveKey as unknown as Parameters<typeof node.getOrCreateGraveStatsEntry>[0]);
          graveStats.visitCount += 1;
          graveStats.accumulatedScore += utilities[context.state().playerToAgent(moveKey.move.mover())]!;
        }
      }

      if (updateGRAVE || updateGlobalActionStats) {
        // Going up one level — add one more move as AMAF-move
        if (movesIdxAMAF >= 0) {
          const iterResult = reverseMovesIterator.next();
          if (!iterResult.done) {
            moveKeysAMAF.push({ move: iterResult.value, moveDepth: movesIdxAMAF });
            --movesIdxAMAF;
          }
        }
      }

      node = node.parentNode();
    }

    BackpropagationStrategy.updateGlobalActionStats(
      mcts,
      updateGlobalActionStats,
      updateGlobalNGramActionStats,
      moveKeysAMAF,
      context,
      utilities,
    );
  }

  // -------------------------------------------------------------------------

  /**
   * Helper method to update global (MCTS-wide) action stats for
   * techniques such as RAVE, GRAVE, MAST, NST, etc.
   *
   * @java BackpropagationStrategy.updateGlobalActionStats(MCTS, boolean, boolean, List, Context, double[])
   */
  public static updateGlobalActionStats(
    mcts: MCTS,
    updateGlobalActionStats: boolean,
    updateGlobalNGramActionStats: boolean,
    moveKeysAMAF: MoveKey[],
    context: Context,
    utilities: number[],
  ): void {
    if (updateGlobalActionStats || updateGlobalNGramActionStats) {
      // Update global, MCTS-wide action statistics
      for (const moveKey of moveKeysAMAF) {
        const actionStats = mcts.getOrCreateActionStatsEntry(moveKey);
        actionStats.visitCount += 1.0;
        actionStats.accumulatedScore += utilities[context.state().playerToAgent(moveKey.move.mover())]!;
      }

      if (updateGlobalNGramActionStats) {
        // N-grams for N > 1
        // note: list of move keys is stored in reverse order
        for (let startMove = moveKeysAMAF.length - 1; startMove >= 1; --startMove) {
          const maxNGramLength = Math.min(mcts.maxNGramLength(), startMove + 1);
          const nGramsDepth = moveKeysAMAF[startMove]!.moveDepth;
          const nGramsMover = moveKeysAMAF[startMove]!.move.mover();

          // Start at 2, since 1-length "n-grams" are already handled
          for (let n = 2; n <= maxNGramLength; ++n) {
            const nGram: Move[] = new Array<Move>(n);
            for (let i = 0; i < n; ++i) {
              nGram[i] = moveKeysAMAF[startMove - i]!.move;
            }
            const nGramStats = mcts.getOrCreateNGramActionStatsEntry({ moves: nGram, moveDepth: nGramsDepth });
            nGramStats.visitCount += 1.0;
            nGramStats.accumulatedScore += utilities[context.state().playerToAgent(nGramsMover)]!;
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @param json
   * @return Backpropagation strategy constructed from given JSON object
   * @java BackpropagationStrategy.fromJson(JSONObject)
   */
  public static fromJson(json: { getString(key: string): string }): BackpropagationStrategy | null {
    const strategy = json.getString("strategy");

    if (strategy.toLowerCase() === "montecarlo") {
      // MonteCarloBackprop is a subclass in a sibling file.
      // To avoid circular import issues and since this is a runtime-only lookup,
      // return null here (caller should use MonteCarloBackprop directly).
      return null;
    }

    return null;
  }

  // -------------------------------------------------------------------------
}
