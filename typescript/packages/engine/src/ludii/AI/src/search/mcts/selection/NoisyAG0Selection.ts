// @java AI/src/search/mcts/selection/NoisyAG0Selection.java

import type { MCTS, BaseNode, FVector, SelectionStrategy } from "./SelectionStrategy.js";

//-------------------------------------------------------------------------

/**
 * A noisy variant of the AlphaGo Zero selection phase; mixes the prior
 * policy with a uniform policy.
 *
 * @java search.mcts.selection.NoisyAG0Selection
 * @author Dennis Soemers
 */
export class NoisyAG0Selection implements SelectionStrategy {

  //-------------------------------------------------------------------------

  /** Exploration constant for AlphaGo Zero's selection strategy */
  protected explorationConstant: number;

  /** Weight to assign to the uniform distribution */
  protected uniformDistWeight: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor with default exploration constant of 2.5 and weight of 0.25
   * for the uniform distribution.
   * @java NoisyAG0Selection()
   */
  constructor();

  /**
   * Constructor with custom hyperparams
   * @param explorationConstant
   * @param uniformDistWeight
   * @java NoisyAG0Selection(double, double)
   */
  constructor(explorationConstant: number, uniformDistWeight: number);

  constructor(explorationConstant?: number, uniformDistWeight?: number) {
    if (explorationConstant !== undefined && uniformDistWeight !== undefined) {
      this.explorationConstant = explorationConstant;
      this.uniformDistWeight = uniformDistWeight;
    } else {
      this.explorationConstant = 2.5;
      this.uniformDistWeight = 0.25;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java NoisyAG0Selection.select(MCTS, BaseNode)
   */
  select(mcts: MCTS, current: BaseNode): number {
    let bestIdx = 0;
    let bestValue = -Infinity;
    let numBestFound = 0;

    const numChildren = current.numLegalMoves();
    const distribution: FVector = current.learnedSelectionPolicy().copy();
    distribution.mult(1.0 - this.uniformDistWeight);
    const uniformDist = { get(_i: number) { return 0; }, size() { return numChildren; } } as unknown as FVector;
    // Build a proper uniform distribution via the FVector fill mechanism
    // We inline the uniform distribution logic since we can't construct a new FVector directly
    // without the ported FVector class. Instead we apply it inline:
    const uniformVal = this.uniformDistWeight / numChildren;
    // We create a minimal shim to pass to distribution.add
    const uniformDistShim: FVector = {
      get(_i: number): number { return uniformVal; },
      size(): number { return numChildren; },
      copy(): FVector { return this; },
      mult(_f: number): void {},
      fill(_from: number, _to: number, _value: number): void {},
      add(_other: FVector): void {},
      sampleProportionally(): number { return 0; },
    };
    distribution.add(uniformDistShim);

    const parentSqrt = Math.sqrt(current.sumLegalChildVisits());

    const state = current.contextRef().state();
    const moverAgent = state.playerToAgent(state.mover());
    const unvisitedValueEstimate = current.valueEstimateUnvisitedChildren(moverAgent);

    for (let i = 0; i < numChildren; ++i) {
      const child = current.childForNthLegalMove(i);
      let exploit: number;
      let numVisits: number;

      if (child === null) {
        exploit = unvisitedValueEstimate;
        numVisits = 0;
      } else {
        exploit = child.exploitationScore(moverAgent);
        numVisits = child.numVisits() + child.numVirtualVisits();
      }

      const priorProb = distribution.get(i);
      const explore = (parentSqrt === 0.0) ? 1.0 : parentSqrt / (1.0 + numVisits);

      const pucb1Value = exploit + this.explorationConstant * priorProb * explore;

      if (pucb1Value > bestValue) {
        bestValue = pucb1Value;
        bestIdx = i;
        numBestFound = 1;
      } else if (
        pucb1Value === bestValue &&
        Math.trunc(Math.random() * 2147483647) % ++numBestFound === 0
      ) {
        bestIdx = i;
      }
    }

    return bestIdx;
  }

  //-------------------------------------------------------------------------

  /**
   * @java NoisyAG0Selection.backpropFlags()
   */
  backpropFlags(): number {
    return 0;
  }

  /**
   * @java NoisyAG0Selection.expansionFlags()
   */
  expansionFlags(): number {
    return 0;
  }

  /**
   * @java NoisyAG0Selection.customise(String[])
   */
  customise(inputs: string[]): void {
    if (inputs.length > 1) {
      // we have more inputs than just the name of the strategy
      for (let i = 1; i < inputs.length; ++i) {
        const input = inputs[i]!;

        if (input.startsWith("explorationconstant=")) {
          this.explorationConstant = parseFloat(
            input.substring("explorationconstant=".length)
          );
        } else if (input.startsWith("uniformdistweight=")) {
          this.uniformDistWeight = parseFloat(
            input.substring("uniformdistweight=".length)
          );
        } else {
          console.error("NoisyAG0Selection ignores unknown customisation: " + input);
        }
      }
    }
  }

  //-------------------------------------------------------------------------
}
