// @java AI/src/search/mcts/selection/UCB1GRAVE.java

import type { MCTS, BaseNode, MoveKey, NodeStatistics, SelectionStrategy } from "./SelectionStrategy.js";

/** BackpropagationStrategy.GRAVE_STATS = 0x1 */
const GRAVE_STATS = 0x1;

//-------------------------------------------------------------------------

/**
 * A UCB1 variant of Generalized Rapid Action Value Estimation (GRAVE).
 * This variant differs from MC-GRAVE in that it also uses a UCB1-style
 * exploration term.
 *
 * Note that Subsection 5.2 of Gelly and Silver's 2011 paper in Artificial Intelligence
 * describes that they found MC-RAVE (their MC-variant of RAVE, without exploration) to
 * outperform UCT-RAVE (their UCT-variant of RAVE, with exploration).
 *
 * With ref = 0, this is equivalent to Gelly and Silver's UCT-RAVEe.
 *
 * @java search.mcts.selection.UCB1GRAVE
 * @author Dennis Soemers
 */
export class UCB1GRAVE implements SelectionStrategy {

  //-------------------------------------------------------------------------

  /** Threshold number of playouts that a node must have had for its AMAF values to be used */
  protected readonly ref: number;

  /** Hyperparameter used in computation of weight for AMAF term */
  protected readonly bias: number;

  /** Exploration constant */
  protected explorationConstant: number;

  /**
   * Reference node in current MCTS simulation.
   * Java uses ThreadLocal<BaseNode>; here we use a plain field (single-threaded JS).
   */
  protected currentRefNode: BaseNode | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor with default values of ref = 100 and bias = 10^(-6),
   * loosely based on hyperparameter tuning in GRAVE paper.
   * @java UCB1GRAVE()
   */
  constructor();

  /**
   * Constructor
   * @param ref
   * @param bias
   * @param explorationConstant
   * @java UCB1GRAVE(int, double, double)
   */
  constructor(ref: number, bias: number, explorationConstant: number);

  constructor(ref?: number, bias?: number, explorationConstant?: number) {
    if (ref !== undefined && bias !== undefined && explorationConstant !== undefined) {
      this.ref = ref;
      this.bias = bias;
      this.explorationConstant = explorationConstant;
    } else {
      this.ref = 100;
      this.bias = 10.0e-6;
      this.explorationConstant = Math.sqrt(2.0);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java UCB1GRAVE.select(MCTS, BaseNode)
   */
  select(mcts: MCTS, current: BaseNode): number {
    let bestIdx = 0;
    let bestValue = -Infinity;
    let numBestFound = 0;

    const parentLog = Math.log(Math.max(1, current.sumLegalChildVisits()));
    const numChildren = current.numLegalMoves();
    const state = current.contextRef().state();
    const moverAgent = state.playerToAgent(state.mover());
    const unvisitedValueEstimate = current.valueEstimateUnvisitedChildren(moverAgent);

    if (this.currentRefNode === null || current.numVisits() > this.ref || current.parent() === null) {
      this.currentRefNode = current;
    }

    for (let i = 0; i < numChildren; ++i) {
      const child = current.childForNthLegalMove(i);
      let explore: number;
      let meanScore: number;
      let meanAMAF: number;
      let beta: number;

      if (child === null) {
        meanScore = unvisitedValueEstimate;
        meanAMAF = 0.0;
        beta = 0.0;
        explore = Math.sqrt(parentLog);
      } else {
        meanScore = child.exploitationScore(moverAgent);
        const move = child.parentMove();
        const moveKey = { __moveKey: true, move, numMoves: current.contextRef().trial().numMoves() } as unknown as MoveKey;
        const graveStats: NodeStatistics | null = this.currentRefNode!.graveStats(moveKey);

        const childVisits = Math.max(child.numVisits() + child.numVirtualVisits(), 1);

        if (graveStats === null) {
          // In single-threaded MCTS this should always be a bug,
          // but in multi-threaded MCTS it can happen
          meanAMAF = 0.0;
          beta = 0.0;
        } else {
          const graveScore = graveStats.accumulatedScore;
          const graveVisits = graveStats.visitCount;
          meanAMAF = graveScore / graveVisits;
          beta = graveVisits / (graveVisits + childVisits + this.bias * graveVisits * childVisits);
        }

        explore = Math.sqrt(parentLog / childVisits);
      }

      const graveValue = (1.0 - beta) * meanScore + beta * meanAMAF;
      const ucb1GraveValue = graveValue + this.explorationConstant * explore;

      if (ucb1GraveValue > bestValue) {
        bestValue = ucb1GraveValue;
        bestIdx = i;
        numBestFound = 1;
      } else if (
        ucb1GraveValue === bestValue &&
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
   * @java UCB1GRAVE.backpropFlags()
   */
  backpropFlags(): number {
    return GRAVE_STATS;
  }

  /**
   * @java UCB1GRAVE.expansionFlags()
   */
  expansionFlags(): number {
    return 0;
  }

  /**
   * @java UCB1GRAVE.customise(String[])
   */
  customise(inputs: string[]): void {
    if (inputs.length > 1) {
      // We have more inputs than just the name of the strategy
      for (let i = 1; i < inputs.length; ++i) {
        const input = inputs[i]!;

        if (input.startsWith("explorationconstant=")) {
          this.explorationConstant = parseFloat(
            input.substring("explorationconstant=".length)
          );
        } else {
          console.error("UCB1GRAVE ignores unknown customisation: " + input);
        }
      }
    }
  }

  //-------------------------------------------------------------------------
}
