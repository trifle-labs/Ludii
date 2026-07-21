// @java AI/src/search/minimax/UBFM.java

import { ExpertPolicy } from "../../training/expert_iteration/ExpertPolicy.js";
import type { FVector, FastArrayList, Move, ExItExperience } from "../../training/expert_iteration/ExpertPolicy.js";
import type { AIVisualisationData, IContext } from "../../../../../ludemes/other/other/AI.js";

// Escape-hatch types for not-yet-ported dependencies

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

/** @java other.context.Context */
interface Context {
  game(): GameFull;
  trial(): Trial;
  state(): State;
  active(player: number): boolean;
  winners(): { contains(p: number): boolean };
}

/** @java other.context.TempContext */
interface TempContext extends Context {
  __tempContext: true;
}

/** @java other.trial.Trial */
interface Trial {
  over(): boolean;
}

/** @java other.state.State */
interface State {
  mover(): number;
  playerToAgent(p: number): number;
  fullHash(ctx?: Context): bigint;
}

/** @java game.Game */
interface GameFull {
  moves(ctx: Context): { moves(): FastArrayList<Move> };
  apply(ctx: Context, move: Move): void;
  players(): { count(): number };
  metadata(): { ai(): { heuristics(): Heuristics | null } | null };
  isAlternatingMoveGame(): boolean;
  isStochasticGame(): boolean;
  hiddenInformation(): boolean;
  hasSubgames(): boolean;
}

/** @java other.RankUtils */
interface RankUtils {
  agentUtilities(ctx: Context): number[];
}
const RankUtils = {} as RankUtils;

/** @java utils.data_structures.transposition_table.TranspositionTableUBFM */
interface TranspositionTableUBFM {
  isAllocated(): boolean;
  allocate(): void;
  deallocate(): void;
  retrieve(hash: bigint): UBFMTTData | null;
  store(hash: bigint, value: number, depth: number, valueType: number, sortedScoredMoves: ScoredMove[] | null): void;
  nbEntries(): number;
}
/** @java utils.data_structures.transposition_table.TranspositionTableUBFM.UBFMTTData */
interface UBFMTTData {
  valueType: number;
  value: number;
  sortedScoredMoves: ScoredMove[] | null;
}
const TranspositionTableUBFMConstants = {
  EXACT_VALUE: 1,
  INVALID_VALUE: 0,
};
function createTranspositionTableUBFM(_bits: number): TranspositionTableUBFM {
  return null as unknown as TranspositionTableUBFM; // escape hatch
}

/** @java utils.data_structures.ScoredMove */
export class ScoredMove {
  public readonly move: Move;
  public score: number;
  public nbVisits: number;

  public constructor(move: Move, score: number, nbVisits: number = 0) {
    this.move = move;
    this.score = score;
    this.nbVisits = nbVisits;
  }

  /** Natural order: descending by score */
  public compareTo(other: ScoredMove): number {
    if (other.score > this.score) return 1;
    if (other.score < this.score) return -1;
    return 0;
  }
}

//-------------------------------------------------------------------------

/**
 * A type for the selection policy
 * @java search.minimax.UBFM.SelectionPolicy
 */
export enum SelectionPolicy {
  /** picks the move of the current principal path (the one with the best score) */
  BEST = "BEST",
  /** variant to pick the move that was explored the most */
  SAFEST = "SAFEST",
}

/**
 * A type for the exploration policy
 * @java search.minimax.UBFM.ExplorationPolicy
 */
export enum ExplorationPolicy {
  /** always picks the move that seems the best */
  BEST = "BEST",
  /** with a probability epsilon, picks a uniformly random move, else picks the best */
  EPSILON_GREEDY = "EPSILON_GREEDY",
}

//-------------------------------------------------------------------------

/**
 * Implementation of Unbounded Best-First Minimax
 * (as described in Learning to Play Two-Player Perfect-Information Games
 * without Knowledge by Quentin Cohen-Solal (2021))
 *
 * @java search.minimax.UBFM
 * @author cyprien
 */
export class UBFM extends ExpertPolicy {

  //-------------------------------------------------------------------------

  // Re-declare inherited fields to ensure correct typing in this class
  /** @java AI.friendlyName */
  protected declare friendlyName: string;
  /** @java AI.wantsInterrupt */
  protected declare wantsInterrupt: boolean;
  //-------------------------------------------------------------------------

  /** Boolean to activate additional outputs for debugging */
  public debugDisplay: boolean = false;

  /** Set to true to store a description of the search tree in the treeSaveFile. */
  public savingSearchTreeDescription: boolean = false;
  public treeSaveFile: string = "/default.sav";

  /** If true, each exploration will be continued up to the end of the tree. */
  protected fullPlayouts: boolean = false;

  /** Set to true to reset the TT after each move */
  public resetTTeachTurn: boolean = true;

  /** Value of epsilon if a randomised policy is picked (default is epsilon-greedy) */
  protected selectionEpsilon: number = 0.1;

  /**
   * If set to an integer, the AI will always play for the same maximising player.
   * @java UBFM.forcedMaximisingPlayer
   */
  protected forcedMaximisingPlayer: number | null = null;

  //-------------------------------------------------------------------------

  /** Selection policy used */
  protected selectionPolicy: SelectionPolicy = SelectionPolicy.SAFEST;

  /** Exploration policy used */
  protected explorationPolicy: ExplorationPolicy = ExplorationPolicy.EPSILON_GREEDY;

  //-------------------------------------------------------------------------

  /** Value we use to initialise alpha ("negative infinity", but not really) */
  public static readonly ALPHA_INIT: number = -1000000.0;

  /** Value we use to initialise beta ("positive infinity", but not really) */
  public static readonly BETA_INIT: number = 1000000.0;

  /** Score we give to winning opponents in paranoid searches in states where game is still going (> 2 players) */
  public static readonly PARANOID_OPP_WIN_SCORE: number = 10000.0;

  /** We skip computing heuristics with absolute weight value lower than this */
  public static readonly ABS_HEURISTIC_WEIGHT_THRESHOLD: number = 0.001;

  //-------------------------------------------------------------------------

  /** Our heuristic value function estimator */
  protected heuristicValueFunction: Heuristics | null = null;

  /** If true, we read our heuristic function to use from game's metadata */
  readonly heuristicsFromMetadata: boolean;

  /** We'll automatically return our move after at most this number of seconds if we only have one move */
  protected readonly autoPlaySeconds: number = 0.3;

  /** Estimated score of the root node based on last-run search */
  protected estimatedRootScore: number = 0.0;

  //-------------------------------------------------------------------------

  /** The maximum heuristic eval we have ever observed */
  protected maxHeuristicEval: number = UBFM.ALPHA_INIT;

  /** The minimum heuristic eval we have ever observed */
  protected minHeuristicEval: number = UBFM.BETA_INIT;

  /** String to print to Analysis tab of the Ludii app */
  protected analysisReport: string | null = null;

  /** Current list of moves available in root */
  protected currentRootMoves: FastArrayList<Move> | null = null;

  /** The last move we returned. Need to memorise this for Expert Iteration with AlphaBeta */
  protected lastReturnedMove: Move | null = null;

  /** Root context for which we've last performed a search */
  protected lastSearchedRootContext: Context | null = null;

  /** Value estimates of moves available in root */
  protected rootValueEstimates: FVector | null = null;

  /** The number of players in the game we're currently playing */
  protected numPlayersInGame: number = 0;

  /** Needed for visualisations */
  protected readonly rootAlphaInit: number = UBFM.ALPHA_INIT;

  /** Needed for visualisations */
  protected readonly rootBetaInit: number = UBFM.BETA_INIT;

  /** Transposition Table */
  protected transpositionTable: TranspositionTableUBFM | null = null;

  //-------------------------------------------------------------------------

  /** Maximum depth of the analysis performed, for an analysis report */
  protected maxDepthReached: number = 0;

  /** Number of different states evaluated, for an analysis report */
  protected nbStatesEvaluated: number = 0;

  /** Scores of the moves from the root, for the final decision of the move to play */
  protected rootMovesScores: number[] | null = null;

  /** numBitsPrimaryCode argument given when a TT is created */
  protected readonly numBitsPrimaryCodeForTT: number = 12;

  //-------------------------------------------------------------------------

  public searchTreeOutput: string[] = [];

  /** Number of calls of the recursive MinimaxBFS function since the last call of selectAction */
  protected callsOfMinimax: number = 0;

  /** Sum of the entries in the TT at each turn, assuming the TT is reset each turn, for debug display */
  protected totalNumberOfEntriesTT: number = 0;

  //-------------------------------------------------------------------------

  /**
   * Creates a standard unbounded best-first minimax searcher.
   * @return UBFM agent
   * @java UBFM.createUBFM()
   */
  public static createUBFM(): UBFM {
    return new UBFM();
  }

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java UBFM()
   */
  public constructor();

  /**
   * Constructor
   * @param heuristics
   * @java UBFM(Heuristics)
   */
  public constructor(heuristics: Heuristics);

  public constructor(heuristicsOrUndefined?: Heuristics) {
    super();
    this.friendlyName = "UBFM";
    if (heuristicsOrUndefined !== undefined) {
      this.heuristicValueFunction = heuristicsOrUndefined;
      this.heuristicsFromMetadata = false;
    } else {
      this.heuristicsFromMetadata = true;
    }
  }

  //-------------------------------------------------------------------------

  /** @java UBFM.selectAction(Game, Context, double, int, int) */
  public selectAction(
    _game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    _maxDepth: number
  ): Move {
    const ctx = context as Context;

    this.maxDepthReached = 0;
    this.nbStatesEvaluated = 0;
    this.callsOfMinimax = 0;

    this.lastReturnedMove = this.BFSSelection(ctx.game(), ctx, maxSeconds >= 0 ? maxSeconds : Number.MAX_VALUE, maxIterations);

    return this.lastReturnedMove!;
  }

  /**
   * Decides the move to play from the root.
   * @java UBFM.finalDecision(UBFMTTData, boolean)
   */
  protected finalDecision(rootTableData: UBFMTTData, maximising: boolean): ScoredMove {
    switch (this.selectionPolicy) {
      case SelectionPolicy.BEST:
        return rootTableData.sortedScoredMoves![0]!;

      case SelectionPolicy.SAFEST: {
        let safestScoredMove = rootTableData.sortedScoredMoves![0]!;
        for (let i = 0; i < rootTableData.sortedScoredMoves!.length; i++) {
          const scoredMove = rootTableData.sortedScoredMoves![i]!;
          if (
            (scoredMove.nbVisits > safestScoredMove.nbVisits)
            ||
            (
              (scoredMove.nbVisits === safestScoredMove.nbVisits)
              &&
              (
                (maximising && (scoredMove.score > safestScoredMove.score))
                ||
                ((!maximising) && (scoredMove.score < safestScoredMove.score))
              )
            )
          ) {
            safestScoredMove = scoredMove;
          }
        }
        return safestScoredMove;
      }

      default:
        console.error("Error: selectionPolicy not implemented");
        return rootTableData.sortedScoredMoves![0]!;
    }
  }

  /**
   * Performs the unbounded best-first search algorithm.
   * @java UBFM.BFSSelection(Game, Context, double, int)
   */
  protected BFSSelection(
    game: GameFull,
    context: Context,
    maxSeconds: number,
    iterationLimit: number
  ): Move {
    const startTime = Date.now();
    let stopTime = maxSeconds > 0.0 ? startTime + maxSeconds * 1000 : Number.MAX_SAFE_INTEGER;

    const tempMoves = game.moves(context).moves();
    const currentRootMovesArr: Move[] = [];
    for (let i = 0; i < tempMoves.size(); i++) {
      currentRootMovesArr.push(tempMoves.get(i));
    }
    this.currentRootMoves = this._makeList(currentRootMovesArr);

    const numRootMoves = currentRootMovesArr.length;
    const state = context.state();
    const mover = state.playerToAgent(state.mover());

    const maximisingPlayer: number =
      this.forcedMaximisingPlayer !== null
        ? this.forcedMaximisingPlayer
        : context.state().playerToAgent(context.state().mover());

    if (!this.transpositionTable!.isAllocated()) {
      this.transpositionTable!.allocate();
      // For visualisation purpose:
      this.minHeuristicEval = 0;
      this.maxHeuristicEval = 0;
    }

    if (numRootMoves === 1) {
      // play faster if we only have one move available anyway
      if (this.autoPlaySeconds >= 0.0 && this.autoPlaySeconds < maxSeconds) {
        stopTime = startTime + this.autoPlaySeconds * 1000;
      }
    }

    // Vector for visualisation purposes
    const rootValueEstimatesArr = new Float32Array(numRootMoves);
    this.rootValueEstimates = this._makeVector(rootValueEstimatesArr);
    this.rootMovesScores = new Array(numRootMoves).fill(0);

    // To output a visual graph of the search tree:
    this.searchTreeOutput = ["[\n"];

    let zobrist = context.state().fullHash(context);
    const contextCopy = this.copyContext(context as unknown as IContext) as unknown as Context;
    const initialnodeHashes: bigint[] = [zobrist];
    if (this.savingSearchTreeDescription) {
      this.searchTreeOutput.push(
        "(" + UBFM.stringOfNodeHashes(initialnodeHashes) + "," +
        this.getContextValue(context, maximisingPlayer, initialnodeHashes, 0) + "," +
        (mover === maximisingPlayer ? 1 : 2) + "),\n"
      );
    }

    let iterationCount = 0;
    const maxNbIterations = iterationLimit > 0 ? iterationLimit : Number.MAX_SAFE_INTEGER;
    while (
      (iterationCount === 0) ||
      (Date.now() < stopTime && (!this.wantsInterrupt) && (iterationCount < maxNbIterations))
    ) {
      // Calling the recursive minimaxBFS:
      const minimaxResult = this.minimaxBFS(contextCopy, maximisingPlayer, stopTime, 1, initialnodeHashes);

      this.estimatedRootScore = this.scoreToValueEst(minimaxResult, this.rootAlphaInit, this.rootBetaInit);
      iterationCount += 1;
    }

    const rootTableData = this.transpositionTable!.retrieve(zobrist);
    const finalChoice = this.finalDecision(rootTableData!, mover === maximisingPlayer);

    this.analysisReport = this.friendlyName + " (player " + maximisingPlayer + ") completed an analysis that reached at some point a depth of " + this.maxDepthReached + ":\n";
    this.analysisReport += "best value observed at root " + finalChoice.score + ",\n";
    this.analysisReport += this.nbStatesEvaluated + " different states were evaluated\n";
    this.analysisReport +=
      iterationCount + " iterations, with " + this.callsOfMinimax + " calls of minimax";
    if (maxSeconds > 0.0 && Date.now() < stopTime) {
      this.analysisReport += " (finished analysis early) ";
    }

    if (this.debugDisplay) {
      const entriesTTthisTurn = this.transpositionTable!.nbEntries();
      this.totalNumberOfEntriesTT += entriesTTthisTurn;
      console.log("Nb of entries in the TT this turn: " + entriesTTthisTurn + " (total: " + this.totalNumberOfEntriesTT + ")");
    }

    if (this.resetTTeachTurn) {
      this.transpositionTable!.deallocate();
      if (this.debugDisplay) {
        console.log("deallocated");
      }
    }

    // To output a visual graph of the search tree:
    this.searchTreeOutput.push("]");

    return finalChoice.move;
  }

  /**
   * Recursive strategy to evaluate the different options on a possible line of actions.
   *
   * @java UBFM.minimaxBFS(Context, int, long, int, TLongArrayList)
   */
  protected minimaxBFS(
    context: Context,
    maximisingPlayer: number,
    stopTime: number,
    analysisDepth: number,
    nodeHashes: bigint[]
  ): number {
    const trial = context.trial();
    const state = context.state();
    const game = context.game();
    const mover = state.playerToAgent(state.mover());

    const legalMoves = game.moves(context).moves();
    const numLegalMoves = legalMoves.size();

    this.callsOfMinimax += 1;
    if (analysisDepth > this.maxDepthReached) {
      this.maxDepthReached = analysisDepth;
    }

    /**
     * First we check if the state is terminal (at least for maximising player).
     * If so we can just return the value of the state for maximising player
     */
    if (trial.over() || !context.active(maximisingPlayer)) {
      return this.getContextValue(context, maximisingPlayer, nodeHashes, analysisDepth - 1);
    } else if (this.savingSearchTreeDescription) {
      // we call getContextValue to make sure the node is added to the search tree
      this.getContextValue(context, maximisingPlayer, nodeHashes, analysisDepth);
    }

    let sortedScoredMoves: ScoredMove[] | null = null;
    const zobrist = context.state().fullHash(context);
    const tableData = this.transpositionTable!.retrieve(zobrist);
    if (tableData !== null) {
      if (tableData.sortedScoredMoves !== null) {
        sortedScoredMoves = [...tableData.sortedScoredMoves];
      }
    }

    let outputScore: number = NaN; // this value should always be replaced before it is read

    if (sortedScoredMoves !== null) {
      if (sortedScoredMoves.length !== numLegalMoves) {
        console.error("Error sortedScoredMoves.size() != numLegalMoves");
        sortedScoredMoves = null;
      }
    }

    let firstExploration = false;
    if (sortedScoredMoves === null) {
      /**
       * In this case it is the first full analysis of this state.
       * Thus we compute a quick evaluation of all the possible moves to order them before exploration.
       */
      firstExploration = true;

      const moveScores = this.estimateMovesValues(legalMoves, context, maximisingPlayer, nodeHashes, analysisDepth, stopTime);

      // Create a shuffled version of list of moves indices (random tie-breaking)
      const tempScoredMoves: ScoredMove[] = [];
      for (let i = 0; i < numLegalMoves; i++) {
        tempScoredMoves.push(new ScoredMove(legalMoves.get(i), moveScores.get(i), 1));
      }
      // Shuffle
      for (let i = tempScoredMoves.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const _tmp2 = tempScoredMoves[i]!;
        tempScoredMoves[i] = tempScoredMoves[j]!;
        tempScoredMoves[j] = _tmp2;
      }
      sortedScoredMoves = [...tempScoredMoves];

      if (mover === maximisingPlayer) {
        sortedScoredMoves.sort((a, b) => b.score - a.score); // descending
      } else {
        sortedScoredMoves.sort((a, b) => a.score - b.score); // ascending
      }

      if (analysisDepth === 1) {
        for (let k = 0; k < numLegalMoves; k++) {
          (this.rootValueEstimates as unknown as { _data: Float32Array })._data[k] =
            this.scoreToValueEst(moveScores.get(k), this.rootAlphaInit, this.rootBetaInit);
        }
      }

      outputScore = sortedScoredMoves[0]!.score;
    }

    if ((!firstExploration) || (this.fullPlayouts && !this.wantsInterrupt && (Date.now() < stopTime))) {
      /**
       * If we already explored this state (or if fullPlayout is true), then we will recursively
       * explore the most promising move at this state.
       */

      let indexPicked: number;
      switch (this.explorationPolicy) {
        case ExplorationPolicy.BEST:
          indexPicked = 0;
          break;
        case ExplorationPolicy.EPSILON_GREEDY:
          if (Math.random() < this.selectionEpsilon) {
            indexPicked = Math.floor(Math.random() * numLegalMoves);
          } else {
            indexPicked = 0;
          }
          break;
        default:
          throw new Error("Unknown exploration policy");
      }

      const bestMove = sortedScoredMoves![indexPicked]!.move;
      const previousNbVisits = sortedScoredMoves![indexPicked]!.nbVisits;

      const contextCopy = this.copyContext(context as unknown as IContext) as unknown as Context;
      game.apply(contextCopy, bestMove);

      const newZobrist = contextCopy.state().fullHash(contextCopy);

      let scoreOfMostPromisingMove: number;
      if ((nodeHashes.length > 100) && (nodeHashes.includes(newZobrist))) {
        // security against infinite loops
        if (this.debugDisplay) {
          console.log("security against infinite loops activated ");
        }
        scoreOfMostPromisingMove = 0;
      } else {
        nodeHashes.push(newZobrist);

        // Recursive call:
        scoreOfMostPromisingMove = this.minimaxBFS(contextCopy, maximisingPlayer, stopTime, analysisDepth + 1, nodeHashes);

        nodeHashes.pop();
      }

      // Re-inserting the new value in the list of scored moves, last among moves of equal values
      let k = indexPicked;
      while (k < numLegalMoves - 1) {
        if (
          ((sortedScoredMoves![k + 1]!.score >= scoreOfMostPromisingMove) && (mover === maximisingPlayer))
          ||
          ((sortedScoredMoves![k + 1]!.score <= scoreOfMostPromisingMove) && (mover !== maximisingPlayer))
        ) {
          sortedScoredMoves![k] = sortedScoredMoves![k + 1]!;
          k += 1;
        } else {
          if (k > 0) {
            if (
              ((sortedScoredMoves![k - 1]!.score < scoreOfMostPromisingMove) && (mover === maximisingPlayer))
              ||
              ((sortedScoredMoves![k - 1]!.score > scoreOfMostPromisingMove) && (mover !== maximisingPlayer))
            ) {
              sortedScoredMoves![k] = sortedScoredMoves![k - 1]!;
              k -= 1;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }
      sortedScoredMoves![k] = new ScoredMove(bestMove, scoreOfMostPromisingMove, previousNbVisits + 1);

      if (analysisDepth === 1) {
        const idx = this._indexOf(this.currentRootMoves!, bestMove);
        if (idx >= 0) {
          (this.rootValueEstimates as unknown as { _data: Float32Array })._data[idx] =
            this.scoreToValueEst(scoreOfMostPromisingMove, this.rootAlphaInit, this.rootBetaInit);
        }
      }

      outputScore = sortedScoredMoves![0]!.score;
    }

    // Updating the transposition table at each call:
    this.transpositionTable!.store(zobrist, outputScore, analysisDepth - 1, TranspositionTableUBFMConstants.EXACT_VALUE, sortedScoredMoves);

    return outputScore;
  }

  /**
   * Compute scores for the moves in argument
   *
   * @java UBFM.estimateMovesValues(FastArrayList, Context, int, TLongArrayList, int, long)
   */
  protected estimateMovesValues(
    legalMoves: FastArrayList<Move>,
    context: Context,
    maximisingPlayer: number,
    nodeHashes: bigint[],
    depth: number,
    stopTime: number
  ): FVector {
    const numLegalMoves = legalMoves.size();
    const game = context.game();
    const state = context.state();
    const mover = state.playerToAgent(state.mover());

    const moveScoresArr = new Float32Array(numLegalMoves);

    if (this.savingSearchTreeDescription) {
      this.getContextValue(context, maximisingPlayer, nodeHashes, depth - 1);
    }

    for (let i = 0; i < numLegalMoves; ++i) {
      const m = legalMoves.get(i);
      // Use TempContext-like copy
      const contextCopy = this.copyContext(context as unknown as IContext) as unknown as Context;

      game.apply(contextCopy, m);

      nodeHashes.push(contextCopy.state().fullHash(contextCopy));
      const heuristicScore = this.getContextValue(contextCopy, maximisingPlayer, nodeHashes, depth);
      nodeHashes.pop();

      moveScoresArr[i] = heuristicScore;

      // If this process is taking too long we abort
      if (Date.now() >= stopTime || this.wantsInterrupt) {
        for (let j = i + 1; j < numLegalMoves; j++) {
          moveScoresArr[j] = mover === maximisingPlayer ? -UBFM.BETA_INIT + 1 : UBFM.BETA_INIT - 1;
        }
        break;
      }
    }

    return this._makeVector(moveScoresArr);
  }

  /**
   * Method to evaluate a state, with heuristics if the state is not terminal.
   *
   * @java UBFM.getContextValue(Context, int, TLongArrayList, int)
   */
  protected getContextValue(
    context: Context,
    maximisingPlayer: number,
    nodeHashes: bigint[],
    depth: number
  ): number {
    let valueRetrievedFromMemory = false;
    let heuristicScore = 0;
    const zobrist = context.state().fullHash(context);
    const state = context.state();

    const tableData = this.transpositionTable!.retrieve(zobrist);

    if (tableData !== null) {
      // Already searched for data in TT, use results
      switch (tableData.valueType) {
        case TranspositionTableUBFMConstants.EXACT_VALUE:
          heuristicScore = tableData.value;
          valueRetrievedFromMemory = true;
          break;
        case TranspositionTableUBFMConstants.INVALID_VALUE:
          console.error("INVALID TRANSPOSITION TABLE DATA: INVALID VALUE");
          break;
        default:
          // bounds are not used up to this point
          console.error("INVALID TRANSPOSITION TABLE DATA: UNKNOWN");
          break;
      }
    }

    // Only compute heuristicScore if we didn't have a score registered in the TT
    if (!valueRetrievedFromMemory) {
      if (context.trial().over() || !context.active(maximisingPlayer)) {
        // terminal node (at least for maximising player)
        heuristicScore = (RankUtils.agentUtilities(context)[maximisingPlayer] ?? 0) * UBFM.BETA_INIT;
      } else {
        heuristicScore = this.heuristicValueFunction!.computeValue(
          context, maximisingPlayer, UBFM.ABS_HEURISTIC_WEIGHT_THRESHOLD
        );

        for (const opp of this.opponents(maximisingPlayer)) {
          if (context.active(opp)) {
            heuristicScore -= this.heuristicValueFunction!.computeValue(context, opp, UBFM.ABS_HEURISTIC_WEIGHT_THRESHOLD);
          } else if (context.winners().contains(opp)) {
            heuristicScore -= UBFM.PARANOID_OPP_WIN_SCORE;
          }
        }

        this.minHeuristicEval = Math.min(this.minHeuristicEval, heuristicScore);
        this.maxHeuristicEval = Math.max(this.maxHeuristicEval, heuristicScore);
      }

      // Every time a state is evaluated, we store the value in the transposition table
      this.transpositionTable!.store(zobrist, heuristicScore, depth, TranspositionTableUBFMConstants.EXACT_VALUE, null);

      // Invert scores if players swapped (to check)
      if (context.state().playerToAgent(maximisingPlayer) !== maximisingPlayer) {
        heuristicScore = -heuristicScore;
      }

      this.nbStatesEvaluated += 1;
    }

    if (this.savingSearchTreeDescription) {
      const newMover = state.playerToAgent(state.mover());
      this.searchTreeOutput.push(
        "(" + UBFM.stringOfNodeHashes(nodeHashes) + "," + heuristicScore + "," + (newMover === maximisingPlayer ? 1 : 2) + "),\n"
      );
    }

    return heuristicScore;
  }

  //-------------------------------------------------------------------------

  /**
   * Converts a score into a value estimate in [-1, 1]. Useful for visualisations.
   * @java UBFM.scoreToValueEst(float, float, float)
   */
  public scoreToValueEst(score: number, alpha: number, beta: number): number {
    if (score <= alpha + 10) return -1.0;
    if (score >= beta - 10) return 1.0;

    // Map to range [-0.8, 0.8] based on most extreme heuristic evaluations observed so far.
    return -0.8 + (0.8 - -0.8) * ((score - this.minHeuristicEval) / (this.maxHeuristicEval - this.minHeuristicEval));
  }

  //-------------------------------------------------------------------------

  /**
   * @param player
   * @return Opponents of given player
   * @java UBFM.opponents(int)
   */
  public opponents(player: number): number[] {
    const opponents: number[] = [];
    for (let p = 1; p <= this.numPlayersInGame; ++p) {
      if (p !== player) {
        opponents.push(p);
      }
    }
    return opponents;
  }

  /**
   * Initialising the AI
   * @java UBFM.initAI(Game, int)
   */
  public override initAI(game: unknown, _playerID: number): void {
    const g = game as GameFull;

    if (this.heuristicsFromMetadata) {
      if (this.debugDisplay) console.log("Reading heuristics from game metadata...");

      // Read heuristics from game metadata
      const aiMetadata = g.metadata().ai();
      if (aiMetadata !== null && aiMetadata.heuristics() !== null) {
        this.heuristicValueFunction = HeuristicsStatic.copy(aiMetadata.heuristics()!);
      } else {
        // construct default heuristic — escape hatch
        this.heuristicValueFunction = {
          init: (_g: unknown) => { /* stub */ },
          computeValue: (_ctx: unknown, _player: number, _threshold: number) => 0,
        } as unknown as Heuristics;
      }
    }

    if (this.heuristicValueFunction !== null) {
      this.heuristicValueFunction.init(game);
    }

    // reset these things used for visualisation purposes
    this.estimatedRootScore = 0.0;
    this.maxHeuristicEval = 0;
    this.minHeuristicEval = 0;
    this.analysisReport = null;

    this.currentRootMoves = null;
    this.rootValueEstimates = null;

    this.totalNumberOfEntriesTT = 0;

    // and these things for ExIt
    this.lastSearchedRootContext = null;
    this.lastReturnedMove = null;

    this.numPlayersInGame = g.players().count();

    this.transpositionTable = createTranspositionTableUBFM(this.numBitsPrimaryCodeForTT);
  }

  /** @java UBFM.supportsGame(Game) */
  public override supportsGame(game: unknown): boolean {
    const g = game as GameFull;
    if (g.isStochasticGame()) return false;
    if (g.hiddenInformation()) return false;
    if (g.hasSubgames()) return false; // Cant properly init most heuristics
    if (!g.isAlternatingMoveGame()) return false;
    return true;
  }

  /** @java UBFM.estimateValue() */
  public override estimateValue(): number {
    return this.scoreToValueEst(this.estimatedRootScore, this.rootAlphaInit, this.rootBetaInit);
  }

  /** @java UBFM.generateAnalysisReport() */
  public override generateAnalysisReport(): string | null {
    return this.analysisReport;
  }

  /** @java UBFM.aiVisualisationData() */
  public override aiVisualisationData(): AIVisualisationData | null {
    if (this.currentRootMoves === null || this.rootValueEstimates === null) {
      return null;
    }

    return {
      aiDistribution: this.rootValueEstimates,
      valueEstimates: this.rootValueEstimates,
      moves: this.currentRootMoves,
    } as unknown as AIVisualisationData;
  }

  /** @java UBFM.heuristicValueFunction() */
  public getHeuristicValueFunction(): Heuristics | null {
    return this.heuristicValueFunction;
  }

  //-------------------------------------------------------------------------

  /** @java UBFM.lastSearchRootMoves() */
  public override lastSearchRootMoves(): FastArrayList<Move> {
    const arr: Move[] = [];
    for (let i = 0; i < this.currentRootMoves!.size(); i++) {
      arr.push(this.currentRootMoves!.get(i));
    }
    return this._makeList(arr);
  }

  /** @java UBFM.computeExpertPolicy(double) */
  public override computeExpertPolicy(_tau: number): FVector {
    const size = this.currentRootMoves!.size();
    const arr = new Float32Array(size);
    const idx = this._indexOf(this.currentRootMoves!, this.lastReturnedMove!);
    if (idx >= 0) arr[idx] = 1.0;
    return this._makeVector(arr);
  }

  /** @java UBFM.generateExItExperiences() */
  public override generateExItExperiences(): ExItExperience[] {
    return [];
  }

  //-------------------------------------------------------------------------

  /**
   * Sets the selection policy used for the final decision of the move to play.
   * @java UBFM.setSelectionPolicy(SelectionPolicy)
   */
  public setSelectionPolicy(s: SelectionPolicy): void {
    this.selectionPolicy = s;
  }

  /**
   * Sets if we want the AI to fully explore one path at each iteration of the algorithm (Descent UBFM).
   * @java UBFM.setIfFullPlayouts(boolean)
   */
  public setIfFullPlayouts(b: boolean): void {
    this.fullPlayouts = b;
  }

  /**
   * Sets the epsilon value (randomisation parameter) of the best first search.
   * @java UBFM.setSelectionEpsilon(float)
   */
  public setSelectionEpsilon(value: number): void {
    this.selectionEpsilon = value;
  }

  /**
   * Sets if we want the Transposition Table to be reset at each call of selectAction.
   * @java UBFM.setTTReset(boolean)
   */
  public setTTReset(value: boolean): void {
    this.resetTTeachTurn = value;
  }

  /** @java UBFM.getTranspositionTable() */
  public getTranspositionTable(): TranspositionTableUBFM | null {
    return this.transpositionTable;
  }

  /**
   * Sets if we want the maximisingPlayer to remain the same regardless of whose turn it is.
   * @java UBFM.forceAMaximisingPlayer(Integer)
   */
  public forceAMaximisingPlayer(player: number | null): void {
    this.forcedMaximisingPlayer = player;
  }

  //-------------------------------------------------------------------------

  /** @java UBFM.stringOfNodeHashes(TLongArrayList) */
  public static stringOfNodeHashes(nodeHashes: bigint[]): string {
    let res = "(";
    for (let i = 0; i < nodeHashes.length; ++i) {
      res += (nodeHashes[i] ?? BigInt(0)).toString();
      res += ",";
    }
    res += ")";
    return res;
  }

  //-------------------------------------------------------------------------

  // Helper: create FastArrayList from array
  protected _makeList<T>(arr: T[]): FastArrayList<T> {
    return {
      size: () => arr.length,
      get: (i: number) => arr[i],
    } as unknown as FastArrayList<T>;
  }

  // Helper: create FVector from Float32Array
  protected _makeVector(arr: Float32Array): FVector {
    return {
      _data: arr,
      dim: () => arr.length,
      get: (i: number) => arr[i],
      sampleProportionally: () => 0,
    } as unknown as FVector;
  }

  // Helper: find index of move in list
  protected _indexOf(list: FastArrayList<Move>, target: Move): number {
    for (let i = 0; i < list.size(); i++) {
      if (list.get(i) === target) return i;
    }
    return -1;
  }

  //-------------------------------------------------------------------------
}
