// @java AI/src/search/mcts/MCTS.java

import { ExpertPolicy } from "../../training/expert_iteration/ExpertPolicy.js";
import type { FVector, FastArrayList, Move, ExItExperience } from "../../training/expert_iteration/ExpertPolicy.js";
import type { AIVisualisationData } from "../../../../../ludemes/other/other/AI.js";

// Escape-hatch types for not-yet-ported dependencies

/** @java game.Game */
interface Game {
  name(): string;
  players(): { count(): number };
  moves(ctx: Context): { moves(): FastArrayList<Move> };
  metadata(): {
    ai(): {
      heuristics(): Heuristics | null;
    } | null;
  };
  isAlternatingMoveGame(): boolean;
  isStochasticGame(): boolean;
  hiddenInformation(): boolean;
  hasSubgames(): boolean;
  gameFlags(): bigint;
}

/** @java other.context.Context */
interface Context {
  game(): Game;
  trial(): Trial;
  state(): State;
  active(player: number): boolean;
}

/** @java other.trial.Trial */
interface Trial {
  over(): boolean;
  numMoves(): number;
  lastMove(): Move | null;
  generateCompleteMovesList(): Move[];
  status(): { winner(): number } | null;
}

/** @java other.state.State */
interface State {
  mover(): number;
  playerToAgent(p: number): number;
  stateHash(): bigint;
}

/** @java metadata.ai.heuristics.Heuristics */
interface Heuristics {
  init(game: unknown): void;
  computeValue(context: unknown, player: number, threshold: number): number;
}
/** @java metadata.ai.heuristics.Heuristics (static) */
interface HeuristicsStatic {
  copy(h: Heuristics): Heuristics;
}
const HeuristicsStatic = {} as HeuristicsStatic;

/** @java metadata.ai.features.Features */
interface Features {
  __features: true;
}

/** @java other.RankUtils */
interface RankUtils {
  agentUtilities(ctx: Context): number[];
}
const RankUtils = {} as RankUtils;

/** @java main.math.statistics.IncrementalStats */
interface IncrementalStats {
  init(n: number, mean: number, variance: number): void;
}

/** @java search.mcts.nodes.BaseNode */
interface BaseNode {
  numLegalMoves(): number;
  numVisits(): number;
  childForNthLegalMove(i: number): BaseNode | null;
  nthLegalMove(i: number): Move;
  findChildForMove(move: Move): BaseNode | null;
  addVirtualVisit(): void;
  startNewIteration(ctx: Context): void;
  contextRef(): { trial(): Trial; game(): Game };
  getLock(): { lock(): void; unlock(): void };
  setParent(parent: BaseNode | null): void;
  rootInit(ctx: Context): void;
  updateContextRef(): void;
  playoutContext(): Context;
  addChild(node: BaseNode, idx: number): void;
  setHeuristicValueEstimates(estimates: number[]): void;
  deterministicContextRef(): Context | null;
  expectedScore(player: number): number;
  valueEstimateUnvisitedChildren(player: number): number;
  cleanThreadLocals(): void;
  movesFromNode(): FastArrayList<Move>;
  computeVisitCountPolicy(tau: number): FVector;
  generateExItExperiences(): ExItExperience[];
}

/** @java search.mcts.selection.SelectionStrategy */
interface SelectionStrategy {
  select(mcts: MCTS, node: BaseNode): number;
  backpropFlags(): number;
  expansionFlags(): number;
  customise(inputs: string[]): void;
}

/** @java search.mcts.playout.PlayoutStrategy */
interface PlayoutStrategy {
  runPlayout(mcts: MCTS, context: Context): Trial;
  playoutSupportsGame(game: Game): boolean;
  backpropFlags(): number;
  customise(inputs: string[]): void;
}

/** @java search.mcts.backpropagation.BackpropagationStrategy */
interface BackpropagationStrategy {
  setBackpropFlags(flags: number): void;
  backpropagationFlags(): number;
  update(mcts: MCTS, node: BaseNode, context: Context, outcome: number[], numPlayoutActions: number): void;
}

/** @java search.mcts.finalmoveselection.FinalMoveSelectionStrategy */
interface FinalMoveSelectionStrategy {
  selectMove(mcts: MCTS, root: BaseNode): Move;
  customise(inputs: string[]): void;
}

/** @java policies.Policy */
interface Policy {
  initAI(game: unknown, playerID: number): void;
  closeAI(): void;
  supportsGame(game: unknown): boolean;
  customise(inputs: string[]): void;
}

/** @java utils.AIUtils */
interface AIUtils {
  heuristicValueEstimates(ctx: Context, heuristics: Heuristics): number[];
}
const AIUtils = {} as AIUtils;

//-------------------------------------------------------------------------

/**
 * @java search.mcts.backpropagation.BackpropagationStrategy.GLOBAL_ACTION_STATS
 */
const GLOBAL_ACTION_STATS = 0x4;

/**
 * @java search.mcts.backpropagation.BackpropagationStrategy.GLOBAL_NGRAM_ACTION_STATS
 */
const GLOBAL_NGRAM_ACTION_STATS = 0x8;

/**
 * @java search.mcts.backpropagation.BackpropagationStrategy.GLOBAL_HEURISTIC_STATS
 */
const GLOBAL_HEURISTIC_STATS = 0x10;

/**
 * @java game.types.state.GameType.Stochastic
 */
const GameType_Stochastic = BigInt(0x2);

//-------------------------------------------------------------------------

/**
 * Different strategies for initializing Q(s, a) values (or V(s) values of nodes)
 *
 * @java search.mcts.MCTS.QInit
 * @author Dennis Soemers
 */
export enum QInit {
  /** Give unvisited nodes a very large value */
  INF = "INF",
  /** Estimate the value of unvisited nodes as a loss (-1). */
  LOSS = "LOSS",
  /** Estimate the value of unvisited nodes as a draw (0.0). */
  DRAW = "DRAW",
  /** Estimate the value of unvisited nodes as a win (1). */
  WIN = "WIN",
  /** Estimate the value of unvisited nodes as the value estimate of the parent. */
  PARENT = "PARENT",
}

//-------------------------------------------------------------------------

// Flags for things we want to do when expanding a node

/** Compute a heuristic-based value estimate for expanded nodes */
const HEURISTIC_INIT = 0x1;

//-------------------------------------------------------------------------

/**
 * Wrapper class for global (MCTS-wide) action statistics (accumulated scores + visit count)
 *
 * @java search.mcts.MCTS.ActionStatistics
 * @author Dennis Soemers
 */
export class ActionStatistics {
  /** Visit count (not int because we want to be able to decay) */
  public visitCount: number = 0.0;

  /** Accumulated score */
  public accumulatedScore: number = 0.0;

  /** @java ActionStatistics.toString() */
  public toString(): string {
    return "[visits = " + this.visitCount + ", accum. score = " + this.accumulatedScore + "]";
  }
}

//-------------------------------------------------------------------------

/**
 * Object to be used as key for a move in hash tables.
 *
 * @java search.mcts.MCTS.MoveKey
 * @author Dennis Soemers
 */
export class MoveKey {
  /** The full move object */
  public readonly move: Move;

  /** Depth at which move was played (only taken into account for passes and swaps) */
  public readonly moveDepth: number;

  /** Cached hashCode */
  private readonly cachedHashCode: number;

  /**
   * Constructor
   * @java MoveKey(Move, int)
   */
  public constructor(move: Move, depth: number) {
    this.move = move;
    this.moveDepth = depth;

    const typedMove = move as unknown as {
      isPass(): boolean;
      isSwap(): boolean;
      isOrientedMove(): boolean;
      toNonDecision(): number;
      fromNonDecision(): number;
      stateNonDecision(): number;
      mover(): number;
    };

    const prime = 31;
    let result = 1;

    if (typedMove.isPass()) {
      result = prime * result + depth + 1297;
    } else if (typedMove.isSwap()) {
      result = prime * result + depth + 587;
    } else {
      if (!typedMove.isOrientedMove()) {
        result = prime * result + (typedMove.toNonDecision() + typedMove.fromNonDecision());
      } else {
        result = prime * result + typedMove.toNonDecision();
        result = prime * result + typedMove.fromNonDecision();
      }

      result = prime * result + typedMove.stateNonDecision();
    }

    result = prime * result + typedMove.mover();

    this.cachedHashCode = result;
  }

  /** @java MoveKey.hashCode() */
  public hashCode(): number {
    return this.cachedHashCode;
  }

  /** @java MoveKey.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj) return true;

    if (!(obj instanceof MoveKey)) return false;

    const other = obj as MoveKey;
    const typedMove = this.move as unknown as {
      isPass(): boolean;
      isSwap(): boolean;
      isOrientedMove(): boolean;
      toNonDecision(): number;
      fromNonDecision(): number;
      stateNonDecision(): number;
      mover(): number;
    };
    const typedOther = other.move as unknown as typeof typedMove;

    if (this.move === null) return other.move === null;

    if (typedMove.mover() !== typedOther.mover()) return false;

    const movePass = typedMove.isPass();
    const otherMovePass = typedOther.isPass();
    const moveSwap = typedMove.isSwap();
    const otherMoveSwap = typedOther.isSwap();

    if (movePass) {
      return (otherMovePass && this.moveDepth === other.moveDepth);
    } else if (moveSwap) {
      return (otherMoveSwap && this.moveDepth === other.moveDepth);
    } else {
      if (otherMovePass || otherMoveSwap) return false;

      if (typedMove.isOrientedMove() !== typedOther.isOrientedMove()) return false;

      if (typedMove.isOrientedMove()) {
        if (typedMove.toNonDecision() !== typedOther.toNonDecision() || typedMove.fromNonDecision() !== typedOther.fromNonDecision()) {
          return false;
        }
      } else {
        let fine = false;

        if (
          (typedMove.toNonDecision() === typedOther.toNonDecision() && typedMove.fromNonDecision() === typedOther.fromNonDecision())
          ||
          (typedMove.toNonDecision() === typedOther.fromNonDecision() && typedMove.fromNonDecision() === typedOther.toNonDecision())
        ) {
          fine = true;
        }

        if (!fine) return false;
      }

      return typedMove.stateNonDecision() === typedOther.stateNonDecision();
    }
  }

  /** @java MoveKey.toString() */
  public toString(): string {
    return "[Move = " + this.move + ", Hash = " + this.cachedHashCode + "]";
  }
}

//-------------------------------------------------------------------------

/**
 * Object to be used as key for an N-gram of moves in hash tables.
 *
 * @java search.mcts.MCTS.NGramMoveKey
 * @author Dennis Soemers
 */
export class NGramMoveKey {
  /** The array of full move objects */
  public readonly moves: Move[];

  /** Depth at which move was played (only taken into account for passes and swaps) */
  private readonly moveDepth: number;

  /** Cached hashCode */
  private readonly cachedHashCode: number;

  /**
   * Constructor
   * @java NGramMoveKey(Move[], int)
   */
  public constructor(moves: Move[], depth: number) {
    this.moves = moves;
    this.moveDepth = depth;
    const prime = 31;
    let result = 1;

    for (let i = 0; i < moves.length; ++i) {
      const move = moves[i];
      const typedMove = move as unknown as {
        isPass(): boolean;
        isSwap(): boolean;
        isOrientedMove(): boolean;
        toNonDecision(): number;
        fromNonDecision(): number;
        stateNonDecision(): number;
        mover(): number;
      };

      if (typedMove.isPass()) {
        result = prime * result + depth + i + 1297;
      } else if (typedMove.isSwap()) {
        result = prime * result + depth + i + 587;
      } else {
        if (!typedMove.isOrientedMove()) {
          result = prime * result + (typedMove.toNonDecision() + typedMove.fromNonDecision());
        } else {
          result = prime * result + typedMove.toNonDecision();
          result = prime * result + typedMove.fromNonDecision();
        }

        result = prime * result + typedMove.stateNonDecision();
      }

      result = prime * result + typedMove.mover();
    }

    this.cachedHashCode = result;
  }

  /** @java NGramMoveKey.hashCode() */
  public hashCode(): number {
    return this.cachedHashCode;
  }

  /** @java NGramMoveKey.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj) return true;

    if (!(obj instanceof NGramMoveKey)) return false;

    const other = obj as NGramMoveKey;

    if (this.moves.length !== other.moves.length) return false;

    for (let i = 0; i < this.moves.length; ++i) {
      const move = this.moves[i];
      const otherMove = other.moves[i];
      const typedMove = move as unknown as {
        isPass(): boolean;
        isSwap(): boolean;
        isOrientedMove(): boolean;
        toNonDecision(): number;
        fromNonDecision(): number;
        stateNonDecision(): number;
        mover(): number;
      };
      const typedOther = otherMove as unknown as typeof typedMove;

      if (typedMove.mover() !== typedOther.mover()) return false;

      const movePass = typedMove.isPass();
      const otherMovePass = typedOther.isPass();
      const moveSwap = typedMove.isSwap();
      const otherMoveSwap = typedOther.isSwap();

      if (movePass) {
        return (otherMovePass && this.moveDepth === other.moveDepth);
      } else if (moveSwap) {
        return (otherMoveSwap && this.moveDepth === other.moveDepth);
      } else {
        if (otherMovePass || otherMoveSwap) return false;

        if (typedMove.isOrientedMove() !== typedOther.isOrientedMove()) return false;

        if (typedMove.isOrientedMove()) {
          if (typedMove.toNonDecision() !== typedOther.toNonDecision() || typedMove.fromNonDecision() !== typedOther.fromNonDecision()) {
            return false;
          }
        } else {
          let fine = false;

          if (
            (typedMove.toNonDecision() === typedOther.toNonDecision() && typedMove.fromNonDecision() === typedOther.fromNonDecision())
            ||
            (typedMove.toNonDecision() === typedOther.fromNonDecision() && typedMove.fromNonDecision() === typedOther.toNonDecision())
          ) {
            fine = true;
          }

          if (!fine) return false;

          if (typedMove.stateNonDecision() !== typedOther.stateNonDecision()) return false;
        }
      }
    }

    return true;
  }

  /** @java NGramMoveKey.toString() */
  public toString(): string {
    return "[Moves = " + JSON.stringify(this.moves) + ", Hash = " + this.cachedHashCode + "]";
  }
}

//-------------------------------------------------------------------------

/**
 * A modular implementation of Monte-Carlo Tree Search (MCTS) for playing games in Ludii.
 *
 * @java search.mcts.MCTS
 * @author Dennis Soemers
 */
export class MCTS extends ExpertPolicy {

  //-------------------------------------------------------------------------

  /** Compute a heuristic-based value estimate for expanded nodes */
  public static readonly HEURISTIC_INIT: number = HEURISTIC_INIT;

  //-------------------------------------------------------------------------

  // Accessor helpers for inherited fields (typed as unknown in parent)

  /** @java AI.friendlyName */
  protected declare friendlyName: string;

  /** @java AI.wantsInterrupt */
  protected declare wantsInterrupt: boolean;

  /** Access heuristicFunction with correct type */
  private get _hf(): Heuristics | null {
    return (this as unknown as { heuristicFunction: unknown }).heuristicFunction as Heuristics | null;
  }
  private set _hf(v: Heuristics | null) {
    (this as unknown as { heuristicFunction: unknown }).heuristicFunction = v;
  }

  //-------------------------------------------------------------------------

  // Basic members of MCTS

  /** Root node of the last search process */
  protected rootNode: BaseNode | null = null;

  /** Implementation of Selection phase */
  protected selectionStrategy: SelectionStrategy;

  /** Implementation of Play-out phase */
  protected playoutStrategy: PlayoutStrategy;

  /** Implementation of Backpropagation of results through the tree */
  protected backpropagationStrategy: BackpropagationStrategy;

  /** Algorithm to select move to play in the "real" game after searching */
  protected finalMoveSelectionStrategy: FinalMoveSelectionStrategy;

  /** Strategy for init of Q-values for unvisited nodes. */
  protected qInit: QInit = QInit.PARENT;

  /** Flags indicating what data needs to be backpropagated */
  protected backpropFlags: number = 0;

  /** Flags indicating things we want to do when expanding a node */
  protected expansionFlags: number = 0;

  /** We'll automatically return our move after at most this number of seconds if we only have one move */
  protected autoPlaySeconds: number = 0.0;

  /** Number of threads this MCTS should use for parallel iterations */
  private numThreads: number = 1;

  //-------------------------------------------------------------------------

  /** State flags of the game we're currently playing */
  protected currentGameFlags: bigint = BigInt(0);

  /** We'll memorise the number of iterations we have executed in our last search here */
  protected lastNumMctsIterations: number = -1;

  /** We'll memorise the number of actions we have executed in play-outs during our last search here */
  protected lastNumPlayoutActions: number = -1;

  /** Value estimate of the last move we returned */
  protected lastReturnedMoveValueEst: number = 0.0;

  /** String to print to Analysis tab of the Ludii app */
  protected analysisReport: string | null = null;

  /**
   * If true, we preserve our root node after running search.
   * Will increase memory usage, but allows us to use it to access data afterwards.
   */
  protected preserveRootNode: boolean = false;

  //-------------------------------------------------------------------------

  // Following members are related to and/or required because of Tree Reuse

  /** Whether or not to reuse trees generated in previous searches in the same game */
  protected treeReuse: boolean = true;

  /** Need to memorise this such that we know which parts of the tree to traverse to before starting Tree Reuse */
  protected lastActionHistorySize: number = 0;

  /** Decay factor for global action statistics when reusing trees */
  protected readonly globalActionDecayFactor: number = 0.6;

  //-------------------------------------------------------------------------

  /** A learned policy to use in Selection phase */
  protected learnedSelectionPolicy: Policy | null = null;

  /** Do we want to load heuristics from metadata on init? */
  protected wantsMetadataHeuristics: boolean = false;

  /** Do we want to track pessimistic and optimistic score bounds in nodes, for solving? */
  protected useScoreBounds: boolean = false;

  /**
   * If we have heuristic value estimates in nodes, we assign this weight to playout outcomes,
   * and 1 minus this weight to the value estimate of node before playout.
   *
   * 1.0 --> normal MCTS
   * 0.5 --> AlphaGo
   * 0.0 --> AlphaGo Zero
   */
  protected playoutValueWeight: number = 1.0;

  //-------------------------------------------------------------------------

  /** Table of global (MCTS-wide) action stats (e.g., for Progressive History) */
  protected readonly globalActionStats: Map<string, ActionStatistics> | null;

  /** Table of global (MCTS-wide) N-gram action stats (e.g., for NST) */
  protected readonly globalNGramActionStats: Map<string, ActionStatistics> | null;

  /** Max length of N-grams of actions we consider */
  protected readonly _maxNGramLength: number;

  /** For every player, a global MCTS-wide tracker of statistics on heuristics */
  protected heuristicStats: IncrementalStats[] | null = null;

  //-------------------------------------------------------------------------

  /**
   * Global flag telling us whether we want MCTS objects to null (clear) undo data in Trial objects stored in their nodes.
   * True by default.
   */
  public static NULL_UNDO_DATA: boolean = true;

  //-------------------------------------------------------------------------

  /**
   * Creates standard UCT algorithm, with exploration constant = sqrt(2.0)
   * @return UCT agent
   * @java MCTS.createUCT()
   */
  public static createUCT(): MCTS {
    return MCTS.createUCTWithExploration(Math.sqrt(2.0));
  }

  /**
   * Creates standard UCT algorithm with parameter for UCB1's exploration constant
   * @java MCTS.createUCT(double)
   */
  public static createUCTWithExploration(explorationConstant: number): MCTS {
    // Escape hatch: UCB1, MonteCarloBackprop, RobustChild not yet ported; caller must supply
    const uct = new MCTS(
      { select: () => 0, backpropFlags: () => 0, expansionFlags: () => 0, customise: () => { /* stub */ } } as SelectionStrategy,
      { runPlayout: (_m, ctx) => ctx.trial(), playoutSupportsGame: () => true, backpropFlags: () => 0, customise: () => { /* stub */ } } as PlayoutStrategy,
      { setBackpropFlags: () => { /* stub */ }, backpropagationFlags: () => 0, update: () => { /* stub */ } } as BackpropagationStrategy,
      { selectMove: (_m, root) => root.nthLegalMove(0), customise: () => { /* stub */ } } as FinalMoveSelectionStrategy
    );

    uct.friendlyName = "UCT";
    void explorationConstant;

    return uct;
  }

  /**
   * Creates a Biased MCTS agent which attempts to use features and weights embedded in a game's metadata file.
   * @java MCTS.createBiasedMCTS(double)
   */
  public static createBiasedMCTS(epsilon: number): MCTS {
    const mcts = MCTS.createUCT();
    mcts.setQInit(QInit.WIN);
    mcts.friendlyName = epsilon < 1.0 ? "Biased MCTS" : "Biased MCTS (Uniform Playouts)";
    return mcts;
  }

  /**
   * Creates a Biased MCTS agent using given collection of features
   * @java MCTS.createBiasedMCTS(Features, double)
   */
  public static createBiasedMCTSWithFeatures(features: Features, epsilon: number): MCTS {
    void features;
    return MCTS.createBiasedMCTS(epsilon);
  }

  /**
   * Creates a Hybrid MCTS agent which attempts to use heuristics in a game's metadata file.
   * @return Hybrid MCTS agent
   * @java MCTS.createHybridMCTS()
   */
  public static createHybridMCTS(): MCTS {
    const mcts = MCTS.createUCT();
    mcts.setWantsMetadataHeuristics(true);
    mcts.setPlayoutValueWeight(0.5);
    mcts.friendlyName = "MCTS (Hybrid Selection)";
    return mcts;
  }

  /**
   * Creates a Bandit Tree Search using heuristic to guide the search but no playout.
   * @return Bandit Tree Search agent
   * @java MCTS.createBanditTreeSearch()
   */
  public static createBanditTreeSearch(): MCTS {
    const mcts = MCTS.createUCT();
    mcts.setWantsMetadataHeuristics(true);
    mcts.setPlayoutValueWeight(0.0);
    mcts.friendlyName = "Bandit Tree Search (Avg)";
    return mcts;
  }

  /**
   * Creates a Policy-Value Tree Search agent, using features for policy and heuristics for value function.
   * @java MCTS.createPVTS(Features, Heuristics)
   */
  public static createPVTS(features: Features, heuristics: Heuristics): MCTS {
    void features;
    const mcts = MCTS.createUCT();
    mcts.setPlayoutValueWeight(0.0);
    mcts.setWantsMetadataHeuristics(false);
    mcts._hf = heuristics;
    mcts.friendlyName = "PVTS";
    return mcts;
  }

  //-------------------------------------------------------------------------

  /**
   * Constructor with arguments for all strategies
   * @java MCTS(SelectionStrategy, PlayoutStrategy, BackpropagationStrategy, FinalMoveSelectionStrategy)
   */
  public constructor(
    selectionStrategy: SelectionStrategy,
    playoutStrategy: PlayoutStrategy,
    backpropagationStrategy: BackpropagationStrategy,
    finalMoveSelectionStrategy: FinalMoveSelectionStrategy
  ) {
    super();
    this.selectionStrategy = selectionStrategy;
    this.playoutStrategy = playoutStrategy;
    this.backpropagationStrategy = backpropagationStrategy;

    this.backpropFlags = selectionStrategy.backpropFlags() | playoutStrategy.backpropFlags();
    this.expansionFlags = selectionStrategy.expansionFlags();

    this.backpropagationStrategy.setBackpropFlags(this.backpropFlags);
    this.backpropFlags = this.backpropFlags | this.backpropagationStrategy.backpropagationFlags();

    this.finalMoveSelectionStrategy = finalMoveSelectionStrategy;

    if ((this.backpropFlags & GLOBAL_ACTION_STATS) !== 0) {
      this.globalActionStats = new Map<string, ActionStatistics>();
    } else {
      this.globalActionStats = null;
    }

    if ((this.backpropFlags & GLOBAL_NGRAM_ACTION_STATS) !== 0) {
      this.globalNGramActionStats = new Map<string, ActionStatistics>();
      this._maxNGramLength = 3; // Hardcoded to 3 for now
    } else {
      this.globalNGramActionStats = null;
      this._maxNGramLength = 0;
    }
  }

  //-------------------------------------------------------------------------

  /** @java MCTS.selectAction(Game, Context, double, int, int) */
  public selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    _maxDepth: number
  ): Move {
    const g = game as Game;
    const ctx = context as Context;

    const startTime = Date.now();
    let stopTime = maxSeconds > 0.0 ? startTime + maxSeconds * 1000 : Number.MAX_SAFE_INTEGER;
    const maxIts = maxIterations >= 0 ? maxIterations : Number.MAX_SAFE_INTEGER;

    // Find or create root node
    if (this.treeReuse && this.rootNode !== null) {
      // Want to reuse part of existing search tree
      const actionHistory = ctx.trial().generateCompleteMovesList();
      let offsetActionToTraverse = actionHistory.length - this.lastActionHistorySize;

      if (offsetActionToTraverse < 0) {
        // Something strange happened, probably forgot to call initAI() for a newly-started game.
        this.rootNode = null;
      }

      while (offsetActionToTraverse > 0) {
        const move = actionHistory[actionHistory.length - offsetActionToTraverse]!;
        this.rootNode = this.rootNode !== null ? this.rootNode.findChildForMove(move) : null;

        if (this.rootNode === null) {
          // Didn't have a node in tree corresponding to action played, so can't reuse tree
          break;
        }

        --offsetActionToTraverse;
      }
    }

    if (this.rootNode === null || !this.treeReuse) {
      // Need to create a fresh root
      this.rootNode = this.createNode(this, null, null, null, ctx);
    } else {
      // We're reusing a part of previous search tree
      // Clean up unused parts of search tree from memory
      this.rootNode.setParent(null);
    }

    if (this.heuristicStats !== null) {
      // Clear all heuristic stats
      for (let p = 1; p < this.heuristicStats.length; ++p) {
        this.heuristicStats[p]?.init(0, 0.0, 0.0);
      }
    }

    this.rootNode.rootInit(ctx);

    if (this.rootNode.numLegalMoves() === 1) {
      // play faster if we only have one move available anyway
      if (this.autoPlaySeconds >= 0.0 && this.autoPlaySeconds < maxSeconds) {
        stopTime = startTime + this.autoPlaySeconds * 1000;
      }
    }

    this.lastActionHistorySize = ctx.trial().numMoves();
    this.lastNumPlayoutActions = 0;

    const rootThisCall = this.rootNode;

    let numIterations = 0;

    // Search until we have to stop
    while (numIterations < maxIts && Date.now() < stopTime && !this.wantsInterrupt) {
      /*********************
        Selection Phase
       *********************/
      let current: BaseNode = rootThisCall;
      current.addVirtualVisit();
      current.startNewIteration(ctx);

      let playoutContext: Context | null = null;

      while (current.contextRef().trial().status() === null) {
        const prevNode = current;
        prevNode.getLock().lock();

        try {
          const selectedIdx = this.selectionStrategy.select(this, current);
          let nextNode = current.childForNthLegalMove(selectedIdx);

          const newContext = current.contextRef() as unknown as Context;
          // In Java: current.traverse(selectedIdx) — simplified here
          // The actual traverse creates or reuses context, we just use contextRef as approximation

          if (nextNode === null) {
            /*********************
                  Expand
             *********************/
            nextNode = this.createNode(
              this,
              current,
              current.contextRef().trial().lastMove(),
              current.nthLegalMove(selectedIdx),
              newContext
            );

            current.addChild(nextNode, selectedIdx);
            current = nextNode;
            current.addVirtualVisit();
            current.updateContextRef();

            if ((this.expansionFlags & HEURISTIC_INIT) !== 0) {
              const hf = this._hf;
              if (hf !== null) {
                nextNode.setHeuristicValueEstimates(
                  AIUtils.heuristicValueEstimates(nextNode.playoutContext(), hf)
                );
              }
            }

            playoutContext = current.playoutContext();
            break; // stop Selection phase
          }

          current = nextNode;
          current.addVirtualVisit();
          current.updateContextRef();
        } finally {
          prevNode.getLock().unlock();
        }
      }

      let endTrial: Trial = current.contextRef().trial();
      let numPlayoutActions = 0;

      if (!endTrial.over() && this.playoutValueWeight > 0.0) {
        // Did not reach a terminal game state yet

        /********************************
              Play-out
         ********************************/

        const numActionsBeforePlayout = current.contextRef().trial().numMoves();

        endTrial = this.playoutStrategy.runPlayout(this, playoutContext ?? (current.contextRef() as unknown as Context));
        numPlayoutActions = (endTrial.numMoves() - numActionsBeforePlayout);

        this.lastNumPlayoutActions +=
          ((playoutContext !== null ? playoutContext : current.contextRef() as unknown as Context).trial().numMoves() - numActionsBeforePlayout);
      } else {
        // Reached a terminal game state
        playoutContext = current.contextRef() as unknown as Context;
      }

      /***************************
        Backpropagation Phase
       ***************************/
      const outcome = RankUtils.agentUtilities(playoutContext!);
      this.backpropagationStrategy.update(this, current, playoutContext!, outcome, numPlayoutActions);

      numIterations++;
    }

    this.lastNumMctsIterations = numIterations;

    const returnMove = this.finalMoveSelectionStrategy.selectMove(this, rootThisCall);
    let playedChildIdx = -1;

    if (!this.wantsInterrupt) {
      let moveVisits = -1;

      for (let i = 0; i < rootThisCall.numLegalMoves(); ++i) {
        const child = rootThisCall.childForNthLegalMove(i);

        if (child !== null) {
          if (rootThisCall.nthLegalMove(i) === returnMove) {
            const state = rootThisCall.deterministicContextRef()!.state();
            const moverAgent = state.playerToAgent(state.mover());
            moveVisits = child.numVisits();
            this.lastReturnedMoveValueEst = child.expectedScore(moverAgent);
            playedChildIdx = i;
            break;
          }
        }
      }

      const numRootIts = rootThisCall.numVisits();

      this.analysisReport =
        this.friendlyName +
        " made move after " +
        numRootIts +
        " iterations (selected child visits = " +
        moveVisits +
        ", value = " +
        this.lastReturnedMoveValueEst +
        ").";
    } else {
      this.analysisReport = null;
    }

    // We can already try to clean up a bit of memory here
    if (!this.preserveRootNode) {
      if (!this.treeReuse) {
        this.rootNode = null; // clean up entire search tree
      } else if (!this.wantsInterrupt) {
        if (playedChildIdx >= 0) {
          this.rootNode = rootThisCall.childForNthLegalMove(playedChildIdx);
        } else {
          this.rootNode = null;
        }

        if (this.rootNode !== null) {
          this.rootNode.setParent(null);
          ++this.lastActionHistorySize;
        }
      }
    }

    if (this.globalActionStats !== null) {
      if (!this.treeReuse) {
        // Completely clear statistics if we're not reusing the tree
        this.globalActionStats.clear();
      } else {
        // Otherwise, decay statistics
        const toDelete: string[] = [];
        for (const [key, stats] of this.globalActionStats.entries()) {
          stats.visitCount *= this.globalActionDecayFactor;

          if (stats.visitCount < 10.0) {
            toDelete.push(key);
          } else {
            stats.accumulatedScore *= this.globalActionDecayFactor;
          }
        }
        for (const key of toDelete) {
          this.globalActionStats.delete(key);
        }
      }
    }

    if (this.globalNGramActionStats !== null) {
      if (!this.treeReuse) {
        // Completely clear statistics if we're not reusing the tree
        this.globalNGramActionStats.clear();
      } else {
        // Otherwise, decay statistics
        const toDelete: string[] = [];
        for (const [key, stats] of this.globalNGramActionStats.entries()) {
          stats.visitCount *= this.globalActionDecayFactor;

          if (stats.visitCount < 10.0) {
            toDelete.push(key);
          } else {
            stats.accumulatedScore *= this.globalActionDecayFactor;
          }
        }
        for (const key of toDelete) {
          this.globalNGramActionStats.delete(key);
        }
      }
    }

    return returnMove;
  }

  /**
   * @java MCTS.createNode(MCTS, BaseNode, Move, Move, Context)
   */
  protected createNode(
    _mcts: MCTS,
    _parent: BaseNode | null,
    _parentMove: Move | null,
    _parentMoveWithoutConseq: Move | null,
    _context: Context
  ): BaseNode {
    // Escape hatch: node types not yet ported
    return null as unknown as BaseNode;
  }

  //-------------------------------------------------------------------------

  /**
   * Sets number of seconds after which we auto-play if we only have one legal move.
   * @java MCTS.setAutoPlaySeconds(double)
   */
  public setAutoPlaySeconds(seconds: number): void {
    this.autoPlaySeconds = seconds;
  }

  /**
   * Set whether or not to reuse tree from previous search processes
   * @java MCTS.setTreeReuse(boolean)
   */
  public setTreeReuse(treeReuse: boolean): void {
    this.treeReuse = treeReuse;
  }

  /**
   * Set the number of threads to use for Tree Parallelisation
   * @java MCTS.setNumThreads(int)
   */
  public setNumThreads(numThreads: number): void {
    this.numThreads = numThreads;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Flags indicating what data we need to backpropagate
   * @java MCTS.backpropFlags()
   */
  public getBackpropFlags(): number {
    return this.backpropFlags;
  }

  /**
   * @return Learned (linear or tree) policy for Selection phase
   * @java MCTS.learnedSelectionPolicy()
   */
  public getLearnedSelectionPolicy(): Policy | null {
    return this.learnedSelectionPolicy;
  }

  /**
   * @return Max length of N-grams of actions for which we collect statistics
   * @java MCTS.maxNGramLength()
   */
  public maxNGramLength(): number {
    return this._maxNGramLength;
  }

  /**
   * @return Heuristics used by MCTS
   * @java MCTS.heuristics()
   */
  public heuristics(): Heuristics | null {
    return this._hf;
  }

  /**
   * @return Play-out strategy used by this MCTS object
   * @java MCTS.playoutStrategy()
   */
  public getPlayoutStrategy(): PlayoutStrategy {
    return this.playoutStrategy;
  }

  /**
   * @return Init strategy for Q-values of unvisited nodes
   * @java MCTS.qInit()
   */
  public getQInit(): QInit {
    return this.qInit;
  }

  /**
   * @return Current root node
   * @java MCTS.rootNode()
   */
  public getRootNode(): BaseNode | null {
    return this.rootNode;
  }

  /**
   * Sets the learned policy to use in Selection phase
   * @java MCTS.setLearnedSelectionPolicy(Policy)
   */
  public setLearnedSelectionPolicy(policy: Policy | null): void {
    this.learnedSelectionPolicy = policy;
  }

  /**
   * Sets whether we want to load heuristics from metadata
   * @java MCTS.setWantsMetadataHeuristics(boolean)
   */
  public setWantsMetadataHeuristics(val: boolean): void {
    this.wantsMetadataHeuristics = val;
  }

  /**
   * Sets whether we want to use pessimistic and optimistic score bounds for solving nodes
   * @java MCTS.setUseScoreBounds(boolean)
   */
  public setUseScoreBounds(val: boolean): void {
    this.useScoreBounds = val;
  }

  /**
   * Sets the Q-init strategy
   * @java MCTS.setQInit(QInit)
   */
  public setQInit(init: QInit): void {
    this.qInit = init;
  }

  /**
   * Sets whether we want to preserve root node after running search
   * @java MCTS.setPreserveRootNode(boolean)
   */
  public setPreserveRootNode(preserveRootNode: boolean): void {
    this.preserveRootNode = preserveRootNode;
  }

  /**
   * Sets the weight to use for playout value estimates
   * @java MCTS.setPlayoutValueWeight(double)
   */
  public setPlayoutValueWeight(playoutValueWeight: number): void {
    if (playoutValueWeight < 0.0) {
      this.playoutValueWeight = 0.0;
      console.error("MCTS playoutValueWeight cannot be lower than 0.0!");
    } else if (playoutValueWeight > 1.0) {
      this.playoutValueWeight = 1.0;
      console.error("MCTS playoutValueWeight cannot be greater than 1.0!");
    } else {
      this.playoutValueWeight = playoutValueWeight;
    }

    if (this.playoutValueWeight < 1.0) { // We'll need heuristic values in nodes
      this.expansionFlags = this.expansionFlags | HEURISTIC_INIT;
    }
  }

  /**
   * @java MCTS.playoutValueWeight()
   */
  public getPlayoutValueWeight(): number {
    return this.playoutValueWeight;
  }

  /**
   * @return Array of incremental stat trackers for heuristics (one per player)
   * @java MCTS.heuristicStats()
   */
  public getHeuristicStats(): IncrementalStats[] | null {
    return this.heuristicStats;
  }

  //-------------------------------------------------------------------------

  /**
   * @return Number of MCTS iterations performed during our last search
   * @java MCTS.getNumMctsIterations()
   */
  public getNumMctsIterations(): number {
    return this.lastNumMctsIterations;
  }

  /**
   * @return Number of actions executed in play-outs during our last search
   * @java MCTS.getNumPlayoutActions()
   */
  public getNumPlayoutActions(): number {
    return this.lastNumPlayoutActions;
  }

  //-------------------------------------------------------------------------

  /** @java MCTS.usesFeatures(Game) */
  public override usesFeatures(game: unknown): boolean {
    void game;
    return this.learnedSelectionPolicy !== null;
  }

  /** @java MCTS.initAI(Game, int) */
  public override initAI(game: unknown, playerID: number): void {
    const g = game as Game;

    // Store state flags
    this.currentGameFlags = g.gameFlags();

    // Reset counters
    this.lastNumMctsIterations = -1;
    this.lastNumPlayoutActions = -1;

    // Reset tree reuse stuff
    this.rootNode = null;
    this.lastActionHistorySize = 0;

    // Instantiate feature sets for selection policy
    if (this.learnedSelectionPolicy !== null) {
      this.learnedSelectionPolicy.initAI(game, playerID);
    }

    // May also have to instantiate feature sets for Playout policy if it doubles as an AI
    const playoutAsAny = this.playoutStrategy as unknown as { initAI?: (g: unknown, p: number) => void };
    if (playoutAsAny.initAI !== undefined) {
      if ((this.playoutStrategy as unknown) !== (this.learnedSelectionPolicy as unknown)) {
        playoutAsAny.initAI(game, playerID);
      }
    }

    // Init heuristics
    if (this.wantsMetadataHeuristics) {
      // Read heuristics from game metadata
      const aiMetadata = g.metadata().ai();
      if (aiMetadata !== null && aiMetadata.heuristics() !== null) {
        this._hf = HeuristicsStatic.copy(aiMetadata.heuristics()!);
      } else {
        // construct default heuristic — escape hatch
        this._hf = {
          init: (_g: unknown) => { /* stub */ },
          computeValue: (_ctx: unknown, _player: number, _threshold: number) => 0,
        } as unknown as Heuristics;
      }
    }

    if (this._hf !== null) {
      this._hf.init(game);
    }

    // Reset visualisation stuff
    this.lastReturnedMoveValueEst = 0.0;
    this.analysisReport = null;

    // Completely clear any global action statistics
    if (this.globalActionStats !== null) {
      this.globalActionStats.clear();
    }
    if (this.globalNGramActionStats !== null) {
      this.globalNGramActionStats.clear();
    }

    if ((this.backpropFlags & GLOBAL_HEURISTIC_STATS) !== 0) {
      this.heuristicStats = new Array(g.players().count() + 1).fill(null);
      for (let p = 1; p < this.heuristicStats.length; ++p) {
        this.heuristicStats[p] = { init: () => { /* stub */ } } as IncrementalStats;
      }
    } else {
      this.heuristicStats = null;
    }
  }

  /** @java MCTS.closeAI() */
  public override closeAI(): void {
    // This may help to clean up some memory
    this.rootNode = null;

    // Close trained selection policy
    if (this.learnedSelectionPolicy !== null) {
      this.learnedSelectionPolicy.closeAI();
    }

    // May also have to close Playout policy if it doubles as an AI
    const playoutAsAny2 = this.playoutStrategy as unknown as { closeAI?: () => void };
    if (playoutAsAny2.closeAI !== undefined) {
      if ((this.playoutStrategy as unknown) !== (this.learnedSelectionPolicy as unknown)) {
        playoutAsAny2.closeAI();
      }
    }
  }

  /** @java MCTS.supportsGame(Game) */
  public override supportsGame(game: unknown): boolean {
    const g = game as Game;
    const gameFlags = g.gameFlags();

    // this MCTS implementation does not support simultaneous-move games
    // GameType.Simultaneous = 0x4 in Java; approximated here
    const GameType_Simultaneous = BigInt(0x4);
    if ((gameFlags & GameType_Simultaneous) !== BigInt(0)) {
      return false;
    }

    if (this.learnedSelectionPolicy !== null && !this.learnedSelectionPolicy.supportsGame(game)) {
      return false;
    }

    return this.playoutStrategy.playoutSupportsGame(g);
  }

  /** @java MCTS.estimateValue() */
  public override estimateValue(): number {
    return this.lastReturnedMoveValueEst;
  }

  /** @java MCTS.generateAnalysisReport() */
  public override generateAnalysisReport(): string | null {
    return this.analysisReport;
  }

  /** @java MCTS.aiVisualisationData() */
  public override aiVisualisationData(): AIVisualisationData | null {
    if (this.rootNode === null) return null;
    if (this.rootNode.numVisits() === 0) return null;
    if (this.rootNode.deterministicContextRef() === null) return null;

    const numChildren = this.rootNode.numLegalMoves();
    const aiDistributionArr = new Float32Array(numChildren);
    const valueEstimatesArr = new Float32Array(numChildren);
    const moves: Move[] = [];

    const state = this.rootNode.deterministicContextRef()!.state();
    const moverAgent = state.playerToAgent(state.mover());

    for (let i = 0; i < numChildren; ++i) {
      const child = this.rootNode.childForNthLegalMove(i);

      if (child === null) {
        aiDistributionArr[i] = 0;

        if (this.rootNode.numVisits() === 0) {
          valueEstimatesArr[i] = 0;
        } else {
          valueEstimatesArr[i] = this.rootNode.valueEstimateUnvisitedChildren(moverAgent);
        }
      } else {
        aiDistributionArr[i] = child.numVisits();
        valueEstimatesArr[i] = child.expectedScore(moverAgent);
      }

      const ve = valueEstimatesArr[i] ?? 0;
      if (ve > 1.0) valueEstimatesArr[i] = 1.0;
      else if (ve < -1.0) valueEstimatesArr[i] = -1.0;

      moves.push(this.rootNode.nthLegalMove(i));
    }

    return {
      aiDistribution: aiDistributionArr,
      valueEstimates: valueEstimatesArr,
      moves,
    } as unknown as AIVisualisationData;
  }

  //-------------------------------------------------------------------------

  /**
   * @param moveKey
   * @return global MCTS-wide action statistics for given move key
   * @java MCTS.getOrCreateActionStatsEntry(MoveKey)
   */
  public getOrCreateActionStatsEntry(moveKey: MoveKey | unknown): ActionStatistics {
    const key = moveKey instanceof MoveKey ? moveKey.hashCode().toString() : String(moveKey);
    let stats = this.globalActionStats!.get(key);

    if (stats === undefined) {
      stats = new ActionStatistics();
      this.globalActionStats!.set(key, stats);
    }

    return stats;
  }

  /**
   * @param nGramMoveKey
   * @return global MCTS-wide N-gram action statistics for given N-gram move key,
   *   or null if it doesn't exist yet
   * @java MCTS.getNGramActionStatsEntry(NGramMoveKey)
   */
  public getNGramActionStatsEntry(nGramMoveKey: NGramMoveKey | unknown): ActionStatistics | null {
    const key = nGramMoveKey instanceof NGramMoveKey ? nGramMoveKey.hashCode().toString() : String(nGramMoveKey);
    return this.globalNGramActionStats!.get(key) ?? null;
  }

  /**
   * @param nGramMoveKey
   * @return global MCTS-wide N-gram action statistics for given N-gram move key
   * @java MCTS.getOrCreateNGramActionStatsEntry(NGramMoveKey)
   */
  public getOrCreateNGramActionStatsEntry(nGramMoveKey: NGramMoveKey | unknown): ActionStatistics {
    const key = nGramMoveKey instanceof NGramMoveKey ? nGramMoveKey.hashCode().toString() : String(nGramMoveKey);
    let stats = this.globalNGramActionStats!.get(key);

    if (stats === undefined) {
      stats = new ActionStatistics();
      this.globalNGramActionStats!.set(key, stats);
    }

    return stats;
  }

  //-------------------------------------------------------------------------

  /**
   * @param json
   * @return MCTS agent constructed from given JSON object
   * @java MCTS.fromJson(JSONObject)
   */
  public static fromJson(json: Record<string, unknown>): MCTS {
    // Escape hatch: concrete strategy types not yet ported
    const mcts = MCTS.createUCT();

    if (json["tree_reuse"] !== undefined) {
      mcts.setTreeReuse(Boolean(json["tree_reuse"]));
    }

    if (json["friendly_name"] !== undefined) {
      mcts.friendlyName = String(json["friendly_name"]);
    }

    return mcts;
  }

  //-------------------------------------------------------------------------

  /** @java MCTS.lastSearchRootMoves() */
  public override lastSearchRootMoves(): FastArrayList<Move> {
    return this.rootNode!.movesFromNode();
  }

  /** @java MCTS.computeExpertPolicy(double) */
  public override computeExpertPolicy(tau: number): FVector {
    return this.rootNode!.computeVisitCountPolicy(tau);
  }

  /** @java MCTS.generateExItExperiences() */
  public override generateExItExperiences(): ExItExperience[] {
    return this.rootNode!.generateExItExperiences();
  }

  //-------------------------------------------------------------------------

  /**
   * @param lines
   * @return Constructs an MCTS object from instructions in the given array of lines
   * @java MCTS.fromLines(String[])
   */
  public static fromLines(lines: string[]): MCTS {
    // Defaults - some extras
    let treeReuse = false;
    let useScoreBounds = false;
    let numThreads = 1;
    let qinit: QInit = QInit.PARENT;
    let friendlyName = "MCTS";
    let playoutValueWeight = 1.0;
    let heuristics: Heuristics | null = null;

    for (const line of lines) {
      const lineParts = line.split(",");
      const part0 = lineParts[0] ?? "";

      if (part0.toLowerCase().startsWith("tree_reuse=")) {
        treeReuse = part0.toLowerCase().endsWith("true");
      } else if (part0.toLowerCase().startsWith("use_score_bounds=")) {
        useScoreBounds = part0.toLowerCase().endsWith("true");
      } else if (part0.toLowerCase().startsWith("num_threads=")) {
        numThreads = parseInt(part0.substring("num_threads=".length), 10);
      } else if (part0.toLowerCase().startsWith("qinit=")) {
        const qinitStr = part0.substring("qinit=".length).toUpperCase();
        qinit = QInit[qinitStr as keyof typeof QInit] ?? QInit.PARENT;
      } else if (part0.toLowerCase().startsWith("playout_value_weight=")) {
        playoutValueWeight = parseFloat(part0.substring("playout_value_weight=".length));
      } else if (part0.toLowerCase().startsWith("friendly_name=")) {
        friendlyName = part0.substring("friendly_name=".length);
      }
    }

    void heuristics; // escape hatch

    const mcts = MCTS.createUCT();

    mcts.setTreeReuse(treeReuse);
    mcts.setUseScoreBounds(useScoreBounds);
    mcts.setNumThreads(numThreads);
    mcts.setQInit(qinit);
    mcts.setPlayoutValueWeight(playoutValueWeight);
    mcts.friendlyName = friendlyName;

    return mcts;
  }

  //-------------------------------------------------------------------------

  /**
   * @return A string describing our MCTS configuration
   * @java MCTS.describeMCTS()
   */
  public describeMCTS(): string {
    const sb: string[] = [];

    sb.push("Selection = " + this.selectionStrategy + "\n");
    sb.push("Playout = " + this.playoutStrategy + "\n");
    sb.push("Backprop = " + this.backpropagationStrategy + "\n");
    sb.push("friendly name = " + this.friendlyName + "\n");
    sb.push("tree reuse = " + this.treeReuse + "\n");
    sb.push("use score bounds = " + this.useScoreBounds + "\n");
    sb.push("qinit = " + this.qInit + "\n");
    sb.push("playout value weight = " + this.playoutValueWeight + "\n");
    sb.push("final move selection = " + this.finalMoveSelectionStrategy + "\n");
    sb.push("heuristics:\n");
    sb.push(String(this._hf) + "\n");

    return sb.join("");
  }

  //-------------------------------------------------------------------------
}
