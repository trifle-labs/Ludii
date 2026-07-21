// @java AI/src/search/mcts/selection/SelectionStrategy.java

// Escape-hatch types for not-yet-ported dependencies

/** @java search.mcts.MCTS */
export interface MCTS {
  __mcts: true;
  heuristics(): unknown | null;
  learnedSelectionPolicy(): unknown | null;
}

/** @java search.mcts.nodes.BaseNode */
export interface BaseNode {
  sumLegalChildVisits(): number;
  numLegalMoves(): number;
  contextRef(): Context;
  valueEstimateUnvisitedChildren(moverAgent: number): number;
  childForNthLegalMove(i: number): BaseNode | null;
  exploitationScore(moverAgent: number): number;
  numVisits(): number;
  numVirtualVisits(): number;
  parent(): BaseNode | null;
  parentMove(): Move;
  graveStats(moveKey: MoveKey): NodeStatistics | null;
  heuristicValueEstimates(): number[];
  sumSquaredScores(moverAgent: number): number;
  learnedSelectionPolicy(): FVector;
  computeVisitCountPolicy(tau: number): FVector;
  nthLegalMove(i: number): Move;
  expectedScore(moverAgent: number): number;
}

/** @java search.mcts.nodes.BaseNode.NodeStatistics */
export interface NodeStatistics {
  accumulatedScore: number;
  visitCount: number;
}

/** @java search.mcts.MCTS.MoveKey */
export interface MoveKey {
  __moveKey: true;
}

/** @java other.move.Move */
export interface Move {
  __move: true;
  mover(): number;
}

/** @java other.state.State */
export interface State {
  mover(): number;
  playerToAgent(player: number): number;
}

/** @java other.context.Context */
export interface Context {
  state(): State;
  trial(): Trial;
}

/** @java other.trial.Trial */
export interface Trial {
  numMoves(): number;
}

/** @java main.collections.FVector */
export interface FVector {
  get(i: number): number;
  size(): number;
  copy(): FVector;
  mult(factor: number): void;
  fill(from: number, to: number, value: number): void;
  add(other: FVector): void;
  sampleProportionally(): number;
}

//-------------------------------------------------------------------------

/**
 * Interface for Selection strategies for MCTS
 *
 * @java search.mcts.selection.SelectionStrategy
 * @author Dennis Soemers
 */
export interface SelectionStrategy {

  /**
   * Should be implemented to select the index of a child of the current
   * node to traverse to.
   *
   * @param mcts
   * @param current
   * @return Index of child.
   * @java SelectionStrategy.select(MCTS, BaseNode)
   */
  select(mcts: MCTS, current: BaseNode): number;

  //-------------------------------------------------------------------------

  /**
   * @return Flags indicating stats that should be backpropagated
   * @java SelectionStrategy.backpropFlags()
   */
  backpropFlags(): number;

  /**
   * @return Flags indicating special things we want to do when expanding nodes
   * @java SelectionStrategy.expansionFlags()
   */
  expansionFlags(): number;

  /**
   * Customize the selection strategy based on a list of given string inputs
   *
   * @param inputs
   * @java SelectionStrategy.customise(String[])
   */
  customise(inputs: string[]): void;

  //-------------------------------------------------------------------------
}

//-------------------------------------------------------------------------

/**
 * Factory: construct from JSON
 * @java SelectionStrategy.fromJson(JSONObject)
 */
export function selectionStrategyFromJson(json: { getString(k: string): string }): SelectionStrategy | null {
  const strategy = json.getString("strategy");

  if (strategy.toLowerCase() === "ucb1") {
    // Avoid circular import — caller must handle this if needed
    return null; // UCB1 is in a separate file
  }

  return null;
}

//-------------------------------------------------------------------------
