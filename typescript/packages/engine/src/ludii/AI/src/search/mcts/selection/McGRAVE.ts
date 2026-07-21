// @java AI/src/search/mcts/selection/McGRAVE.java

import type { MCTS, BaseNode, MoveKey, NodeStatistics, SelectionStrategy } from "./SelectionStrategy.js";

/** BackpropagationStrategy.GRAVE_STATS = 0x1 */
const GRAVE_STATS = 0x1;

//-------------------------------------------------------------------------

/**
 * A Monte-Carlo variant of Generalized Rapid Action Value Estimation (GRAVE).
 * This is basically exactly the variant described in the Tristan Cazenave's
 * IJCAI 2015 paper; with no exploration term, pure exploitation.
 *
 * Note that Subsection 5.2 of Gelly and Silver's 2011 paper in Artificial Intelligence
 * describes that they found MC-RAVE (their MC-variant of RAVE, without exploration) to
 * outperform UCT-RAVE (their UCT-variant of RAVE, with exploration).
 *
 * With ref = 0, this is equivalent to Gelly and Silver's MC-RAVE.
 *
 * @java search.mcts.selection.McGRAVE
 * @author Dennis Soemers
 */
export class McGRAVE implements SelectionStrategy {

  //-------------------------------------------------------------------------

  /** Threshold number of playouts that a node must have had for its AMAF values to be used */
  protected readonly ref: number;

  /** Hyperparameter used in computation of weight for AMAF term */
  protected readonly bias: number;

  /**
   * Reference node in current MCTS simulation.
   * Java uses ThreadLocal<BaseNode>; here we use a plain field (single-threaded JS).
   */
  protected currentRefNode: BaseNode | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor with default values of ref = 100 and bias = 10^(-6),
   * loosely based on hyperparameter tuning in GRAVE paper.
   * @java McGRAVE()
   */
  constructor();

  /**
   * Constructor
   * @param ref
   * @param bias
   * @java McGRAVE(int, double)
   */
  constructor(ref: number, bias: number);

  constructor(ref?: number, bias?: number) {
    if (ref !== undefined && bias !== undefined) {
      this.ref = ref;
      this.bias = bias;
    } else {
      this.ref = 100;
      this.bias = 10.0e-6;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java McGRAVE.select(MCTS, BaseNode)
   */
  select(mcts: MCTS, current: BaseNode): number {
    let bestIdx = 0;
    let bestValue = -Infinity;
    let numBestFound = 0;

    const numChildren = current.numLegalMoves();
    const state = current.contextRef().state();
    const moverAgent = state.playerToAgent(state.mover());
    const unvisitedValueEstimate = current.valueEstimateUnvisitedChildren(moverAgent);

    if (this.currentRefNode === null || current.numVisits() > this.ref || current.parent() === null) {
      this.currentRefNode = current;
    }

    for (let i = 0; i < numChildren; ++i) {
      const child = current.childForNthLegalMove(i);
      let meanScore: number;
      let meanAMAF: number;
      let beta: number;

      if (child === null) {
        meanScore = unvisitedValueEstimate;
        meanAMAF = 0.0;
        beta = 0.0;
      } else {
        meanScore = child.exploitationScore(moverAgent);
        const move = child.parentMove();
        const moveKey = { __moveKey: true, move, numMoves: current.contextRef().trial().numMoves() } as unknown as MoveKey;
        const graveStats: NodeStatistics | null = this.currentRefNode!.graveStats(moveKey);

        if (graveStats === null) {
          // In single-threaded MCTS this should always be a bug,
          // but in multi-threaded MCTS it can happen
          meanAMAF = 0.0;
          beta = 0.0;
        } else {
          const graveScore = graveStats.accumulatedScore;
          const graveVisits = graveStats.visitCount;
          const childVisits = child.numVisits() + child.numVirtualVisits();
          meanAMAF = graveScore / graveVisits;
          beta = graveVisits / (graveVisits + childVisits + this.bias * graveVisits * childVisits);
        }
      }

      const graveValue = (1.0 - beta) * meanScore + beta * meanAMAF;

      if (graveValue > bestValue) {
        bestValue = graveValue;
        bestIdx = i;
        numBestFound = 1;
      } else if (
        graveValue === bestValue &&
        Math.trunc(Math.random() * 2147483647) % ++numBestFound === 0
      ) {
        bestIdx = i;
      }
    }

    // This can help garbage collector to clean up a bit more easily
    if (current.childForNthLegalMove(bestIdx) === null) {
      this.currentRefNode = null;
    }

    return bestIdx;
  }

  //-------------------------------------------------------------------------

  /**
   * @java McGRAVE.backpropFlags()
   */
  backpropFlags(): number {
    return GRAVE_STATS;
  }

  /**
   * @java McGRAVE.expansionFlags()
   */
  expansionFlags(): number {
    return 0;
  }

  /**
   * @java McGRAVE.customise(String[])
   */
  customise(inputs: string[]): void {
    // TODO
  }

  //-------------------------------------------------------------------------
}
