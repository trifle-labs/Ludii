// @java AI/src/search/mcts/nodes/BaseNode.java

/**
 * Abstract base class for nodes in MCTS search trees.
 *
 * @java search.mcts.nodes.BaseNode
 * @author Dennis Soemers
 */

import { FVector } from "../../../../../Common/src/main/collections/FVector.js";
import { FastArrayList } from "../../../../../Common/src/main/collections/FastArrayList.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java game.Game */
type Game = {
  players(): { count(): number };
};

/** @java other.context.Context */
type Context = {
  state(): State;
  game(): Game;
  trial(): Trial;
  active(): boolean;
  active(p: number): boolean;
};

/** @java other.trial.Trial */
type Trial = {
  over(): boolean;
  numMoves(): number;
  reverseMoveIterator(): Iterator<Move>;
  lastMove(): Move | null;
};

/** @java other.state.State */
type State = {
  mover(): number;
  playerToAgent(player: number): number;
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
  equals(other: Move): boolean;
  then(): { clear(): void };
};

/** @java search.mcts.MCTS */
type MCTS = {
  backpropFlags(): number;
  qInit(): QInit;
  learnedSelectionPolicy(): { computeDistribution(ctx: Context, moves: FastArrayList<Move>, thresholded: boolean): FVector } | null;
  playoutStrategy(): { computeDistribution(ctx: Context, moves: FastArrayList<Move>, thresholded: boolean): FVector };
  copyContext(ctx: Context): Context;
  heuristics(): unknown;
  heuristicStats(): IncrementalStats[] | null;
  playoutValueWeight(): number;
  maxNGramLength(): number;
  getOrCreateActionStatsEntry(key: ActionStatistics_MoveKey): ActionStatistics;
  getOrCreateNGramActionStatsEntry(key: NGramMoveKey): ActionStatistics;
};

/** @java search.mcts.MCTS.QInit */
export const enum QInit {
  DRAW = "DRAW",
  INF = "INF",
  LOSS = "LOSS",
  PARENT = "PARENT",
  WIN = "WIN",
}

/** @java search.mcts.MCTS.ActionStatistics */
export interface ActionStatistics {
  visitCount: number;
  accumulatedScore: number;
}

/** @java search.mcts.MCTS.MoveKey — used as key in maps */
export type ActionStatistics_MoveKey = unknown;

/** @java search.mcts.MCTS.NGramMoveKey — used as key in maps */
export type NGramMoveKey = unknown;

/** @java main.math.statistics.IncrementalStats */
type IncrementalStats = {
  getMean(): number;
  getStd(): number;
  observe(v: number): void;
};

/** @java training.expert_iteration.ExItExperience */
type ExItExperience = unknown;

/** @java policies.softmax.SoftmaxPolicyLinear */
type SoftmaxPolicyLinear = unknown;

// ---------------------------------------------------------------------------
// GRAVE_STATS constant mirrored from BackpropagationStrategy
/** @java search.mcts.backpropagation.BackpropagationStrategy.GRAVE_STATS */
const GRAVE_STATS = 0x1;

// ---------------------------------------------------------------------------

/**
 * Wrapper class for statistics stored inside nodes.
 *
 * @java search.mcts.nodes.BaseNode.NodeStatistics
 */
export class NodeStatistics {
  /** @java NodeStatistics.visitCount */
  public visitCount: number = 0;

  /** @java NodeStatistics.accumulatedScore */
  public accumulatedScore: number = 0.0;

  public toString(): string {
    return `[visits = ${this.visitCount}, accum. score = ${this.accumulatedScore}]`;
  }
}

// ---------------------------------------------------------------------------

/**
 * Abstract base class for nodes in MCTS search trees.
 *
 * @java search.mcts.nodes.BaseNode
 */
export abstract class BaseNode {

  // -------------------------------------------------------------------------

  /** @java BaseNode.parent */
  protected parent: BaseNode | null;

  /** @java BaseNode.parentMove */
  protected readonly parentMove: Move | null;

  /** @java BaseNode.parentMoveWithoutConseq */
  protected readonly parentMoveWithoutConseq: Move | null;

  /** @java BaseNode.mcts */
  protected readonly mcts: MCTS;

  /** @java BaseNode.numVisits */
  protected _numVisits: number = 0;

  /**
   * Number of virtual visits (for Tree Parallelisation).
   * Java uses AtomicInteger — we simulate with a plain number (single-threaded JS).
   * @java BaseNode.numVirtualVisits
   */
  protected _numVirtualVisits: number = 0;

  /** @java BaseNode.totalScores */
  protected readonly totalScores: number[];

  /** @java BaseNode.sumSquaredScores */
  protected readonly sumSquaredScores: number[];

  /** @java BaseNode.heuristicValueEstimates */
  protected heuristicValueEstimates: number[] | null;

  /** @java BaseNode.graveStats */
  protected readonly graveStats: Map<ActionStatistics_MoveKey, NodeStatistics> | null;

  // -------------------------------------------------------------------------

  /**
   * @java BaseNode(MCTS, BaseNode, Move, Move, Game)
   */
  public constructor(
    mcts: MCTS,
    parent: BaseNode | null,
    parentMove: Move | null,
    parentMoveWithoutConseq: Move | null,
    game: Game,
  ) {
    this.mcts = mcts;
    this.parent = parent;
    this.parentMove = parentMove;
    this.parentMoveWithoutConseq = parentMoveWithoutConseq;

    this.totalScores = new Array<number>(game.players().count() + 1).fill(0.0);
    this.sumSquaredScores = new Array<number>(game.players().count() + 1).fill(0.0);
    this.heuristicValueEstimates = null;

    const backpropFlags = mcts.backpropFlags();

    if ((backpropFlags & GRAVE_STATS) !== 0) {
      this.graveStats = new Map<ActionStatistics_MoveKey, NodeStatistics>();
    } else {
      this.graveStats = null;
    }
  }

  // -------------------------------------------------------------------------
  // Abstract methods

  /** @java BaseNode.addChild(BaseNode, int) */
  public abstract addChild(child: BaseNode, moveIdx: number): void;

  /** @java BaseNode.childForNthLegalMove(int) */
  public abstract childForNthLegalMove(n: number): BaseNode | null;

  /**
   * @return Reference to Context object for this node. Callers are
   * expected NOT to modify this object.
   * @java BaseNode.contextRef()
   */
  public abstract contextRef(): Context | null;

  /**
   * @return Deterministic reference to Context object. Null for non-root
   * nodes in open-loop trees.
   * @java BaseNode.deterministicContextRef()
   */
  public abstract deterministicContextRef(): Context | null;

  /** @java BaseNode.findChildForMove(Move) */
  public abstract findChildForMove(move: Move): BaseNode | null;

  /** @java BaseNode.learnedSelectionPolicy() */
  public abstract learnedSelectionPolicy(): FVector;

  /** @java BaseNode.movesFromNode() */
  public abstract movesFromNode(): FastArrayList<Move>;

  /**
   * @return "colour" (= player ID) for this node.
   * @java BaseNode.nodeColour()
   */
  public abstract nodeColour(): number;

  /** @java BaseNode.nthLegalMove(int) */
  public abstract nthLegalMove(n: number): Move;

  /** @java BaseNode.numLegalMoves() */
  public abstract numLegalMoves(): number;

  /** @java BaseNode.playoutContext() */
  public abstract playoutContext(): Context;

  /** @java BaseNode.rootInit(Context) */
  public abstract rootInit(context: Context): void;

  /** @java BaseNode.startNewIteration(Context) */
  public abstract startNewIteration(context: Context): void;

  /** @java BaseNode.sumLegalChildVisits() */
  public abstract sumLegalChildVisits(): number;

  /** @java BaseNode.traverse(int) */
  public abstract traverse(moveIdx: number): Context;

  /** @java BaseNode.updateContextRef() */
  public abstract updateContextRef(): void;

  /** @java BaseNode.cleanThreadLocals() */
  public abstract cleanThreadLocals(): void;

  // -------------------------------------------------------------------------
  // Concrete methods

  /**
   * @param agent Agent index
   * @return Expected score for given agent.
   * @java BaseNode.expectedScore(int)
   */
  public expectedScore(agent: number): number {
    return (this._numVisits === 0)
      ? 0.0
      : (this.totalScores[agent]! - this._numVirtualVisits) / (this._numVisits + this._numVirtualVisits);
  }

  /**
   * @param agent Agent index
   * @return Exploitation score / term for given agent.
   * @java BaseNode.exploitationScore(int)
   */
  public exploitationScore(agent: number): number {
    return this.expectedScore(agent);
  }

  /**
   * @param agent
   * @return Is the value for given agent fully proven in this node?
   * @java BaseNode.isValueProven(int)
   */
  public isValueProven(_agent: number): boolean {
    return false;
  }

  /**
   * @return Array of heuristic value estimates: one per player. Can be null.
   * @java BaseNode.heuristicValueEstimates()
   */
  public heuristicValueEstimatesArray(): number[] | null {
    return this.heuristicValueEstimates;
  }

  /**
   * @return Num visits for this node
   * @java BaseNode.numVisits()
   */
  public numVisits(): number {
    return this._numVisits;
  }

  /**
   * @return Number of virtual visits
   * @java BaseNode.numVirtualVisits()
   */
  public numVirtualVisits(): number {
    return this._numVirtualVisits;
  }

  /**
   * Adds one virtual visit to this node.
   * @java BaseNode.addVirtualVisit()
   */
  public addVirtualVisit(): void {
    this._numVirtualVisits++;
  }

  /**
   * @return Parent node, or null if this is the root
   * @java BaseNode.parent()
   */
  public parentNode(): BaseNode | null {
    return this.parent;
  }

  /**
   * @return Move leading from parent node to this node
   * @java BaseNode.parentMove()
   */
  public parentMoveRef(): Move | null {
    return this.parentMove;
  }

  /**
   * Sets the number of visits of this node.
   * @java BaseNode.setNumVisits(int)
   */
  public setNumVisits(numVisits: number): void {
    this._numVisits = numVisits;
  }

  /**
   * Set the parent node of this node.
   * @java BaseNode.setParent(BaseNode)
   */
  public setParent(newParent: BaseNode | null): void {
    this.parent = newParent;
  }

  /**
   * Sets the array of heuristic value estimates for this node.
   * @java BaseNode.setHeuristicValueEstimates(double[])
   */
  public setHeuristicValueEstimates(heuristicValueEstimates: number[] | null): void {
    this.heuristicValueEstimates = heuristicValueEstimates;
  }

  /**
   * @param player Player index
   * @return Total score backpropagated into this node for player
   * @java BaseNode.totalScore(int)
   */
  public totalScore(player: number): number {
    return this.totalScores[player]!;
  }

  /**
   * @param player Player index
   * @return Sum of squared scores backpropagated into this node for player. Includes virtual losses.
   * @java BaseNode.sumSquaredScores(int)
   */
  public sumSquaredScoresForPlayer(player: number): number {
    return this.sumSquaredScores[player]! + this._numVirtualVisits;
  }

  /**
   * Backpropagates result with vector of utilities.
   * @java BaseNode.update(double[])
   */
  public update(utilities: number[]): void {
    ++this._numVisits;
    for (let p = 1; p < this.totalScores.length; ++p) {
      this.totalScores[p]! += utilities[p]!;
      this.sumSquaredScores[p]! += utilities[p]! * utilities[p]!;
    }
    this._numVirtualVisits--;
  }

  /**
   * @param agent Agent index
   * @return Value estimate for unvisited children of this node
   * @java BaseNode.valueEstimateUnvisitedChildren(int)
   */
  public valueEstimateUnvisitedChildren(agent: number): number {
    switch (this.mcts.qInit()) {
      case QInit.DRAW:
        return 0.0;
      case QInit.INF:
        return 10000.0;
      case QInit.LOSS:
        return -1.0;
      case QInit.PARENT:
        if (this._numVisits === 0) {
          return 10000.0;
        } else {
          return this.expectedScore(agent);
        }
      case QInit.WIN:
        return 1.0;
      default:
        return 0.0;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @param moveKey
   * @return GRAVE's AMAF stats for given move key. Creates new entry if needed.
   * @java BaseNode.getOrCreateGraveStatsEntry(MoveKey)
   */
  public getOrCreateGraveStatsEntry(moveKey: ActionStatistics_MoveKey): NodeStatistics {
    const map = this.graveStats!;
    let stats = map.get(moveKey);
    if (stats === undefined) {
      stats = new NodeStatistics();
      map.set(moveKey, stats);
    }
    return stats;
  }

  /**
   * @param moveKey
   * @return GRAVE's AMAF stats for given move key.
   * @java BaseNode.graveStats(MoveKey)
   */
  public graveStatsFor(moveKey: ActionStatistics_MoveKey): NodeStatistics | undefined {
    return this.graveStats?.get(moveKey);
  }

  // -------------------------------------------------------------------------

  /**
   * Computes a policy over the list of children based on visit counts.
   * @param tau Temperature parameter
   * @java BaseNode.computeVisitCountPolicy(double)
   */
  public computeVisitCountPolicy(tau: number): FVector {
    const policy = new FVector(this.numLegalMoves());

    if (tau === 0.0) {
      // Greedy w.r.t. visit count
      let maxVisitCount = -1;
      const maxVisitCountChildren: number[] = [];

      for (let i = 0; i < this.numLegalMoves(); ++i) {
        const child = this.childForNthLegalMove(i);
        const visitCount = (child === null) ? 0 : child._numVisits;

        if (visitCount > maxVisitCount) {
          maxVisitCount = visitCount;
          maxVisitCountChildren.length = 0;
          maxVisitCountChildren.push(i);
        } else if (visitCount === maxVisitCount) {
          maxVisitCountChildren.push(i);
        }
      }

      const maxProb = 1.0 / maxVisitCountChildren.length;
      for (let i = 0; i < maxVisitCountChildren.length; ++i) {
        policy.set(maxVisitCountChildren[i]!, maxProb);
      }
    } else {
      // Collect visit counts
      for (let i = 0; i < this.numLegalMoves(); ++i) {
        const child = this.childForNthLegalMove(i);
        const visitCount = (child === null) ? 0 : child._numVisits;
        policy.set(i, visitCount);
      }

      if (tau !== 1.0) {
        policy.raiseToPower(1.0 / tau);
      }

      const sumVisits = policy.sum();
      if (sumVisits > 0.0) {
        policy.mult(1.0 / policy.sum());
      }
    }

    return policy;
  }

  // -------------------------------------------------------------------------

  /**
   * @return The normalised entropy of the discrete distribution implied by
   * the MCTS visit counts among this node's children.
   * @java BaseNode.normalisedEntropy()
   */
  public normalisedEntropy(): number {
    const distribution = this.computeVisitCountPolicy(1.0);
    const dim = distribution.dim();

    if (dim <= 1) {
      return 0.0;
    }

    let entropy = 0.0;
    for (let i = 0; i < dim; ++i) {
      const prob = distribution.get(i);
      if (prob > 0.0) {
        entropy -= prob * Math.log(prob);
      }
    }

    return entropy / Math.log(dim);
  }

  /**
   * @return The normalised entropy of the distribution computed by the
   * learned Selection policy for this node.
   * @java BaseNode.learnedSelectionPolicyNormalisedEntropy()
   */
  public learnedSelectionPolicyNormalisedEntropy(): number {
    const distribution = this.learnedSelectionPolicy();
    const dim = distribution.dim();

    if (dim <= 1) {
      return 0.0;
    }

    let entropy = 0.0;
    for (let i = 0; i < dim; ++i) {
      const prob = distribution.get(i);
      if (prob > 0.0) {
        entropy -= prob * Math.log(prob);
      }
    }

    return entropy / Math.log(dim);
  }

  /**
   * @return The normalised entropy of the distribution computed by the
   * learned Play-out policy for this node.
   * @java BaseNode.learnedPlayoutPolicyNormalisedEntropy()
   */
  public learnedPlayoutPolicyNormalisedEntropy(): number {
    const ctx = this.contextRef()!;
    const moves = (ctx.game() as unknown as { moves(ctx: Context): { moves(): FastArrayList<Move> } }).moves(ctx).moves();
    const distribution = (this.mcts.playoutStrategy() as unknown as {
      computeDistribution(ctx: Context, moves: FastArrayList<Move>, thresholded: boolean): FVector;
    }).computeDistribution(ctx, moves, true);

    const dim = distribution.dim();

    if (dim <= 1) {
      return 0.0;
    }

    let entropy = 0.0;
    for (let i = 0; i < dim; ++i) {
      const prob = distribution.get(i);
      if (prob > 0.0) {
        entropy -= prob * Math.log(prob);
      }
    }

    return entropy / Math.log(dim);
  }

  // -------------------------------------------------------------------------

  /**
   * @param weightVisitCount
   * @return A sample of experience for learning with Expert Iteration
   * @java BaseNode.generateExItExperience(float)
   */
  public generateExItExperience(weightVisitCount: number): ExItExperience {
    // Escape-hatch: ExItExperience not yet fully ported — return minimal object
    const ctx = this.deterministicContextRef()!;
    const state = ctx.state();
    const actions = new FastArrayList<Move>(this.numLegalMoves());
    const valueEstimates = new Float32Array(this.numLegalMoves());

    for (let i = 0; i < this.numLegalMoves(); ++i) {
      const child = this.childForNthLegalMove(i);
      const m = this.nthLegalMove(i);
      // clone the move minimally
      const cloned = Object.create(Object.getPrototypeOf(m), Object.getOwnPropertyDescriptors(m)) as Move;
      cloned.then().clear();
      actions.add(cloned);

      if (child === null) {
        valueEstimates[i] = -1.0;
      } else {
        valueEstimates[i] = child.expectedScore(state.playerToAgent(state.mover()));
      }
    }

    let visitCountPolicy = this.computeVisitCountPolicy(1.0);
    const min = visitCountPolicy.min();
    let allPruned = true;

    for (let i = 0; i < this.numLegalMoves(); ++i) {
      const child = this.childForNthLegalMove(i);
      if (child !== null && (child as unknown as { isPruned?: () => boolean }).isPruned?.()) {
        visitCountPolicy.set(i, min);
      } else {
        allPruned = false;
      }
    }

    if (allPruned) {
      visitCountPolicy = this.computeVisitCountPolicy(1.0);
    } else {
      visitCountPolicy.normalise();
    }

    return {
      ctx,
      actions,
      visitCountPolicy,
      valueEstimates: FVector.wrap(valueEstimates),
      weightVisitCount,
    } as unknown as ExItExperience;
  }

  /**
   * @return List of samples of experience for learning with Expert Iteration
   * @java BaseNode.generateExItExperiences()
   */
  public generateExItExperiences(): ExItExperience[] {
    const experiences: ExItExperience[] = [];
    experiences.push(this.generateExItExperience(1.0));
    return experiences;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Lock for this node (no-op in single-threaded JS)
   * @java BaseNode.getLock()
   */
  public getLock(): { lock(): void; unlock(): void } {
    return { lock() { /* no-op */ }, unlock() { /* no-op */ } };
  }

  // -------------------------------------------------------------------------
}
