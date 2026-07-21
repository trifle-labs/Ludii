// @java AI/src/search/minimax/AlphaBetaSearch.java

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
  fromLines(lineParts: string[]): Heuristics;
}
const HeuristicsStatic = {} as HeuristicsStatic;

/** @java other.context.Context */
interface Context {
  game(): GameFull;
  trial(): Trial;
  state(): State;
  active(player: number): boolean;
  winners(): { contains(p: number): boolean };
  computeNextLossRank(): number;
  computeNextWinRank(): number;
  numActive(): number;
}

/** @java other.trial.Trial */
interface Trial {
  over(): boolean;
  lastMove(): Move | null;
  numMoves(): number;
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
  usesNoRepeatPositionalInGame(): boolean;
  usesNoRepeatPositionalInTurn(): boolean;
  isAlternatingMoveGame(): boolean;
  hiddenInformation(): boolean;
  hasSubgames(): boolean;
  gameFlags(): bigint;
}

/** @java other.RankUtils */
interface RankUtils {
  agentUtilities(ctx: Context): number[];
  utilities(ctx: Context): number[];
  rankToUtil(rank: number, numPlayers: number): number;
}
const RankUtils = {} as RankUtils;

/** @java utils.data_structures.transposition_table.TranspositionTable */
interface TranspositionTable {
  allocate(): void;
  deallocate(): void;
  retrieve(hash: bigint): ABTTData | null;
  store(bestMove: Move, hash: bigint, score: number, depth: number, valueType: number): void;
}
/** @java utils.data_structures.transposition_table.TranspositionTable.ABTTData */
interface ABTTData {
  depth: number;
  valueType: number;
  value: number;
  bestMove: Move;
}
/** @java utils.data_structures.transposition_table.TranspositionTable (static constants) */
const TranspositionTableConstants = {
  EXACT_VALUE: 1,
  LOWER_BOUND: 2,
  UPPER_BOUND: 3,
};
/** @java utils.data_structures.transposition_table.TranspositionTable constructor */
function createTranspositionTable(_bits: number): TranspositionTable {
  return null as unknown as TranspositionTable; // escape hatch
}

/** @java training.expert_iteration.ExItExperience.ExItExperienceState */
interface ExItExperienceState {
  __state: true;
}

//-------------------------------------------------------------------------

/**
 * Controls whether searches can search to any depth, or only odd
 * or only even depths.
 *
 * @java search.minimax.AlphaBetaSearch.AllowedSearchDepths
 * @author Dennis Soemers
 */
export enum AllowedSearchDepths {
  /** Allow any search depth */
  Any = "Any",
  /** Allow only even search depths */
  Even = "Even",
  /** Allow only odd search depths */
  Odd = "Odd",
}

//-------------------------------------------------------------------------

/**
 * Wrapper for score + move, used for sorting moves based on scores.
 *
 * @java search.minimax.AlphaBetaSearch.ScoredMove
 * @author Dennis Soemers
 */
export class ScoredMove {
  /** The move */
  public readonly move: Move;
  /** The move's score */
  public readonly score: number;

  /**
   * Constructor
   * @java ScoredMove(Move, float)
   */
  public constructor(move: Move, score: number) {
    this.move = move;
    this.score = score;
  }

  /** @java ScoredMove.compareTo(ScoredMove) — descending by score */
  public compareTo(other: ScoredMove): number {
    const delta = other.score - this.score;
    if (delta < 0) return -1;
    else if (delta > 0) return 1;
    else return 0;
  }
}

//-------------------------------------------------------------------------

/**
 * Implementation of alpha-beta search. Assumes perfect-information games.
 * Uses iterative deepening when time-restricted, goes straight for
 * depth limit when only depth-limited. Extracts heuristics to use from game's metadata.
 *
 * For games with > 2 players, we use Paranoid search (i.e. all other players
 * just try to minimise the score for the maximising player).
 *
 * @java search.minimax.AlphaBetaSearch
 * @author Dennis Soemers
 */
export class AlphaBetaSearch extends ExpertPolicy {

  //-------------------------------------------------------------------------

  // Re-declare inherited fields to ensure correct typing in this class
  /** @java AI.friendlyName */
  protected declare friendlyName: string;
  /** @java AI.wantsInterrupt */
  protected declare wantsInterrupt: boolean;
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
  protected readonly heuristicsFromMetadata: boolean;

  /** We'll automatically return our move after at most this number of seconds if we only have one move */
  protected autoPlaySeconds: number = 0.0;

  /** Estimated score of the root node based on last-run search */
  protected estimatedRootScore: number = 0.0;

  /** The maximum heuristic eval we have ever observed */
  protected maxHeuristicEval: number = 0.0;

  /** The minimum heuristic eval we have ever observed */
  protected minHeuristicEval: number = 0.0;

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

  /** Remember if we proved a win in one of our searches */
  protected provedWin: boolean = false;

  /** Needed for visualisations */
  protected rootAlphaInit: number = AlphaBetaSearch.ALPHA_INIT;

  /** Needed for visualisations */
  protected rootBetaInit: number = AlphaBetaSearch.BETA_INIT;

  /** Sorted (hopefully cleverly) list of moves available in root node */
  protected sortedRootMoves: FastArrayList<Move> | null = null;

  /** If true at end of a search, it means we searched full tree (probably proved a draw) */
  protected searchedFullTree: boolean = false;

  /** Do we want to allow using Transposition Table? */
  protected allowTranspositionTable: boolean = true;

  /** Transposition Table */
  protected transpositionTable: TranspositionTable | null = null;

  /** Do we allow any search depth, or only odd, or only even? */
  protected allowedSearchDepths: AllowedSearchDepths = AllowedSearchDepths.Any;

  //-------------------------------------------------------------------------

  /**
   * Creates a standard alpha-beta searcher.
   * @return Alpha-beta search algorithm.
   * @java AlphaBetaSearch.createAlphaBeta()
   */
  public static createAlphaBeta(): AlphaBetaSearch {
    return new AlphaBetaSearch();
  }

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java AlphaBetaSearch()
   */
  public constructor();

  /**
   * Constructor
   * @param allowTranspositionTable
   * @java AlphaBetaSearch(boolean)
   */
  public constructor(allowTranspositionTable: boolean);

  /**
   * Constructor
   * @param heuristics
   * @java AlphaBetaSearch(Heuristics)
   */
  public constructor(heuristics: Heuristics);

  public constructor(arg?: boolean | Heuristics) {
    super();
    this.friendlyName = "Alpha-Beta";
    if (arg === undefined) {
      this.heuristicsFromMetadata = true;
    } else if (typeof arg === "boolean") {
      this.heuristicsFromMetadata = true;
      this.allowTranspositionTable = arg;
    } else {
      this.heuristicValueFunction = arg;
      this.heuristicsFromMetadata = false;
    }
  }

  //-------------------------------------------------------------------------

  /** @java AlphaBetaSearch.selectAction(Game, Context, double, int, int) */
  public selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    _maxIterations: number,
    maxDepth: number
  ): Move {
    const ctx = context as Context;
    const g = game as GameFull;

    this.provedWin = false;
    const depthLimit = maxDepth > 0 ? maxDepth : Number.MAX_SAFE_INTEGER;
    this.lastSearchedRootContext = ctx;

    if (this.transpositionTable !== null) {
      this.transpositionTable.allocate();
    }

    const initDepth = this.allowedSearchDepths === AllowedSearchDepths.Even ? 2 : 1;

    if (maxSeconds > 0) {
      const startTime = Date.now();
      const stopTime = startTime + maxSeconds * 1000;

      // First do normal iterative deepening alphabeta (paranoid if > 2 players)
      this.lastReturnedMove = this.iterativeDeepening(g, ctx, maxSeconds, depthLimit, initDepth);

      const currentTime = Date.now();

      if (g.players().count() > 2 && currentTime < stopTime) {
        // We still have time left in game with > 2 players;
        // this probably means that paranoid search proved a win or a loss

        // If a win for us was proven even under paranoid assumption, just play it!
        if (this.provedWin) {
          if (this.transpositionTable !== null) {
            this.transpositionTable.deallocate();
          }
          return this.lastReturnedMove!;
        }

        // Otherwise, we assume a loss was proven under paranoid assumption.
        // This can lead to poor play in end-games (or extremely simple games) due
        // to unrealistic paranoid assumption, so now we switch to Max^N and run again
        this.lastReturnedMove = this.iterativeDeepeningMaxN(g, ctx, (stopTime - currentTime) / 1000.0, depthLimit, initDepth);
      }

      if (this.transpositionTable !== null) {
        this.transpositionTable.deallocate();
      }

      return this.lastReturnedMove!;
    } else {
      // We'll just do iterative deepening with the depth limit as starting depth
      this.lastReturnedMove = this.iterativeDeepening(g, ctx, maxSeconds, depthLimit, depthLimit);
      if (this.transpositionTable !== null) {
        this.transpositionTable.deallocate();
      }
      return this.lastReturnedMove!;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Runs iterative deepening alpha-beta
   * @java AlphaBetaSearch.iterativeDeepening(Game, Context, double, int, int)
   */
  public iterativeDeepening(
    game: GameFull,
    context: Context,
    maxSeconds: number,
    maxDepth: number,
    startDepth: number
  ): Move {
    const startTime = Date.now();
    let stopTime = maxSeconds > 0.0 ? startTime + maxSeconds * 1000 : Number.MAX_SAFE_INTEGER;

    const numPlayers = game.players().count();
    const tempList = game.moves(context).moves();
    // currentRootMoves = copy of tempList
    const currentRootMovesArr: Move[] = [];
    for (let i = 0; i < tempList.size(); i++) {
      currentRootMovesArr.push(tempList.get(i));
    }
    this.currentRootMoves = this._makeList(currentRootMovesArr);

    // Create a shuffled version of list of moves (random tie-breaking)
    const shuffled = [...currentRootMovesArr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i]!;
      shuffled[i] = shuffled[j]!;
      shuffled[j] = tmp;
    }
    this.sortedRootMoves = this._makeList(shuffled);

    const numRootMoves = shuffled.length;
    const scoredMoves: ScoredMove[] = [];

    if (numRootMoves === 1) {
      // play faster if we only have one move available anyway
      if (this.autoPlaySeconds >= 0.0 && this.autoPlaySeconds < maxSeconds) {
        stopTime = startTime + this.autoPlaySeconds * 1000;
      }
    }

    // Vector for visualisation purposes
    const rootValueEstimatesArr = new Float32Array(currentRootMovesArr.length);
    this.rootValueEstimates = this._makeVector(rootValueEstimatesArr);

    // Storing scores found for purpose of move ordering
    const moveScoresArr = new Float32Array(numRootMoves);

    const searchDepthIncrement = this.allowedSearchDepths === AllowedSearchDepths.Any ? 1 : 2;
    let searchDepth = startDepth - searchDepthIncrement;
    const maximisingPlayer = context.state().playerToAgent(context.state().mover());

    // Best move found so far during a fully-completed search
    let bestMoveCompleteSearch: Move = shuffled[0]!;

    if (numPlayers > 2) {
      // For paranoid search, we can narrow alpha-beta window if some players already won/lost
      this.rootAlphaInit = RankUtils.rankToUtil(context.computeNextLossRank(), numPlayers) * AlphaBetaSearch.BETA_INIT;
      this.rootBetaInit = RankUtils.rankToUtil(context.computeNextWinRank(), numPlayers) * AlphaBetaSearch.BETA_INIT;
    } else {
      this.rootAlphaInit = AlphaBetaSearch.ALPHA_INIT;
      this.rootBetaInit = AlphaBetaSearch.BETA_INIT;
    }

    while (searchDepth < maxDepth) {
      searchDepth += searchDepthIncrement;
      this.searchedFullTree = true;

      // the real alpha-beta stuff starts here
      let score = this.rootAlphaInit;
      let alpha = this.rootAlphaInit;
      const beta = this.rootBetaInit;

      // best move during this particular search
      let bestMove: Move | null = this.sortedRootMoves.get(0);

      for (let i = 0; i < numRootMoves; ++i) {
        const copyContext = this.copyContext(context as unknown as IContext) as unknown as Context;
        const m = this.sortedRootMoves.get(i);
        game.apply(copyContext, m);

        const value = this.alphaBeta(copyContext, searchDepth - 1, alpha, beta, maximisingPlayer, stopTime);

        if (Date.now() >= stopTime || this.wantsInterrupt) { // time to abort search
          bestMove = null;
          break;
        }

        const origMoveIdx = this._indexOf(this.currentRootMoves, m);
        if (origMoveIdx >= 0) {
          rootValueEstimatesArr[origMoveIdx] = this.scoreToValueEst(value, this.rootAlphaInit, this.rootBetaInit);
        }

        moveScoresArr[i] = value;

        if (value > score) { // new best move found
          score = value;
          bestMove = m;
        }

        if (score > alpha) { // new lower bound
          alpha = score;
        }

        if (alpha >= beta) { // beta cut-off
          break;
        }
      }

      // alpha-beta is over, this is iterative deepening stuff again

      if (bestMove !== null) { // search was not interrupted
        this.estimatedRootScore = score;

        if (score === this.rootBetaInit) {
          // we've just proven a win, so we can return best move found during this search
          this.analysisReport = this.friendlyName + " (player " + maximisingPlayer + ") found a proven win at depth " + searchDepth + ".";
          this.provedWin = true;
          return bestMove;
        } else if (score === this.rootAlphaInit) {
          // we've just proven a loss, so we return the best move
          // of the PREVIOUS search (delays loss for the longest amount of time)
          this.analysisReport = this.friendlyName + " (player " + maximisingPlayer + ") found a proven loss at depth " + searchDepth + ".";
          return bestMoveCompleteSearch;
        } else if (this.searchedFullTree) {
          // We've searched full tree but did not prove a win or loss
          // probably means a draw, play best line we have
          this.analysisReport = this.friendlyName + " (player " + maximisingPlayer + ") completed search of depth " + searchDepth + " (no proven win or loss).";
          return bestMove;
        }

        bestMoveCompleteSearch = bestMove;
      } else {
        // decrement because we didn't manage to complete this search
        searchDepth -= searchDepthIncrement;
      }

      if (Date.now() >= stopTime || this.wantsInterrupt) {
        // we need to return
        this.analysisReport = this.friendlyName + " (player " + maximisingPlayer + ") completed search of depth " + searchDepth + ".";
        return bestMoveCompleteSearch;
      }

      // order moves based on scores found, for next search
      scoredMoves.length = 0;
      const sortedArr: Move[] = [];
      for (let i = 0; i < this.sortedRootMoves.size(); i++) {
        sortedArr.push(this.sortedRootMoves.get(i));
      }
      for (let i = 0; i < numRootMoves; ++i) {
        scoredMoves.push(new ScoredMove(sortedArr[i]!, moveScoresArr[i]!));
      }
      scoredMoves.sort((a, b) => a.compareTo(b));

      const newSorted: Move[] = scoredMoves.map(sm => sm.move);
      this.sortedRootMoves = this._makeList(newSorted);

      // clear the vector of scores
      moveScoresArr.fill(0);
    }

    this.analysisReport = this.friendlyName + " (player " + maximisingPlayer + ") completed search of depth " + searchDepth + ".";
    return bestMoveCompleteSearch;
  }

  /**
   * Recursive alpha-beta search function.
   *
   * @java AlphaBetaSearch.alphaBeta(Context, int, float, float, int, long)
   */
  public alphaBeta(
    context: Context,
    depth: number,
    inAlpha: number,
    inBeta: number,
    maximisingPlayer: number,
    stopTime: number
  ): number {
    const trial = context.trial();
    const state = context.state();

    const originalAlpha = inAlpha;
    let alpha = inAlpha;
    let beta = inBeta;

    const zobrist = state.fullHash(context);
    let tableData: ABTTData | null = null;
    if (this.transpositionTable !== null) {
      tableData = this.transpositionTable.retrieve(zobrist);

      if (tableData !== null) {
        if (tableData.depth >= depth) {
          // Already searched deep enough for data in TT, use results
          switch (tableData.valueType) {
            case TranspositionTableConstants.EXACT_VALUE:
              return tableData.value;
            case TranspositionTableConstants.LOWER_BOUND:
              alpha = Math.max(alpha, tableData.value);
              break;
            case TranspositionTableConstants.UPPER_BOUND:
              beta = Math.min(beta, tableData.value);
              break;
            default:
              console.error("INVALID TRANSPOSITION TABLE DATA!");
              break;
          }

          if (alpha >= beta) {
            return tableData.value;
          }
        }
      }
    }

    if (trial.over() || !context.active(maximisingPlayer)) {
      // terminal node (at least for maximising player)
      return (RankUtils.agentUtilities(context)[maximisingPlayer] ?? 0) * AlphaBetaSearch.BETA_INIT;
    } else if (depth === 0) {
      this.searchedFullTree = false;

      // heuristic evaluation
      let heuristicScore = this.heuristicValueFunction!.computeValue(
        context, maximisingPlayer, AlphaBetaSearch.ABS_HEURISTIC_WEIGHT_THRESHOLD
      );

      for (const opp of this.opponents(maximisingPlayer)) {
        if (context.active(opp)) {
          heuristicScore -= this.heuristicValueFunction!.computeValue(context, opp, AlphaBetaSearch.ABS_HEURISTIC_WEIGHT_THRESHOLD);
        } else if (context.winners().contains(opp)) {
          heuristicScore -= AlphaBetaSearch.PARANOID_OPP_WIN_SCORE;
        }
      }

      // Invert scores if players swapped
      if (state.playerToAgent(maximisingPlayer) !== maximisingPlayer) {
        heuristicScore = -heuristicScore;
      }

      this.minHeuristicEval = Math.min(this.minHeuristicEval, heuristicScore);
      this.maxHeuristicEval = Math.max(this.maxHeuristicEval, heuristicScore);

      return heuristicScore;
    }

    const game = context.game();
    const mover = state.playerToAgent(state.mover());

    let legalMoves = game.moves(context).moves();
    const numLegalMoves = legalMoves.size();

    if (tableData !== null) {
      // Put best move according to Transposition Table first
      const transpositionBestMove = tableData.bestMove;
      const legalArr: Move[] = [];
      for (let i = 0; i < numLegalMoves; i++) {
        legalArr.push(legalMoves.get(i));
      }

      for (let i = 0; i < numLegalMoves; ++i) {
        if (this._movesEqual(transpositionBestMove, legalArr[i]!)) {
          const temp = legalArr[0]!;
          legalArr[0] = legalArr[i]!;
          legalArr[i] = temp;
          break;
        }
      }
      legalMoves = this._makeList(legalArr);
    }

    const numPlayers = game.players().count();

    if (numPlayers > 2) {
      // For paranoid search, we can maybe narrow alpha-beta window if some players already won/lost
      alpha = Math.max(alpha, RankUtils.rankToUtil(context.computeNextLossRank(), numPlayers) * AlphaBetaSearch.BETA_INIT);
      beta = Math.min(beta, RankUtils.rankToUtil(context.computeNextWinRank(), numPlayers) * AlphaBetaSearch.BETA_INIT);
    }

    let bestMove: Move = legalMoves.get(0);

    if (mover === maximisingPlayer) {
      let score = AlphaBetaSearch.ALPHA_INIT;

      for (let i = 0; i < numLegalMoves; ++i) {
        const copyContext = this.copyContext(context as unknown as IContext) as unknown as Context;
        const m = legalMoves.get(i);
        game.apply(copyContext, m);

        const value = this.alphaBeta(copyContext, depth - 1, alpha, beta, maximisingPlayer, stopTime);

        if (Date.now() >= stopTime || this.wantsInterrupt) { // time to abort search
          return 0;
        }

        if (value > score) {
          bestMove = m;
          score = value;
        }

        if (score > alpha) {
          alpha = score;
        }

        if (alpha >= beta) { // beta cut-off
          break;
        }
      }

      if (this.transpositionTable !== null) {
        // Store data in transposition table
        if (score <= originalAlpha) { // Found upper bound
          this.transpositionTable.store(bestMove, zobrist, score, depth, TranspositionTableConstants.UPPER_BOUND);
        } else if (score >= beta) { // Found lower bound
          this.transpositionTable.store(bestMove, zobrist, score, depth, TranspositionTableConstants.LOWER_BOUND);
        } else { // Found exact value
          this.transpositionTable.store(bestMove, zobrist, score, depth, TranspositionTableConstants.EXACT_VALUE);
        }
      }

      return score;
    } else {
      let score = AlphaBetaSearch.BETA_INIT;

      for (let i = 0; i < numLegalMoves; ++i) {
        const copyContext = this.copyContext(context as unknown as IContext) as unknown as Context;
        const m = legalMoves.get(i);
        game.apply(copyContext, m);

        const value = this.alphaBeta(copyContext, depth - 1, alpha, beta, maximisingPlayer, stopTime);

        if (Date.now() >= stopTime || this.wantsInterrupt) { // time to abort search
          return 0;
        }

        if (value < score) {
          bestMove = m;
          score = value;
        }

        if (score < beta) {
          beta = score;
        }

        if (alpha >= beta) { // alpha cut-off
          break;
        }
      }

      if (this.transpositionTable !== null) {
        // Store data in transposition table
        if (score <= originalAlpha) { // Found upper bound
          this.transpositionTable.store(bestMove, zobrist, score, depth, TranspositionTableConstants.UPPER_BOUND);
        } else if (score >= beta) { // Found lower bound
          this.transpositionTable.store(bestMove, zobrist, score, depth, TranspositionTableConstants.LOWER_BOUND);
        } else { // Found exact value
          this.transpositionTable.store(bestMove, zobrist, score, depth, TranspositionTableConstants.EXACT_VALUE);
        }
      }

      return score;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Runs iterative deepening Max^N
   * @java AlphaBetaSearch.iterativeDeepeningMaxN(Game, Context, double, int, int)
   */
  public iterativeDeepeningMaxN(
    game: GameFull,
    context: Context,
    maxSeconds: number,
    maxDepth: number,
    startDepth: number
  ): Move {
    const startTime = Date.now();
    let stopTime = maxSeconds > 0.0 ? startTime + maxSeconds * 1000 : Number.MAX_SAFE_INTEGER;

    // No need to initialise list of root moves, we re-use the ones from previous paranoid search
    const numRootMoves = this.sortedRootMoves!.size();
    const scoredMoves: ScoredMove[] = [];

    if (numRootMoves === 1) {
      // play faster if we only have one move available anyway
      if (this.autoPlaySeconds >= 0.0 && this.autoPlaySeconds < maxSeconds) {
        stopTime = startTime + this.autoPlaySeconds * 1000;
      }
    }

    // Vector for visualisation purposes
    const rootValueEstimatesArr = new Float32Array(this.currentRootMoves!.size());
    this.rootValueEstimates = this._makeVector(rootValueEstimatesArr);

    // Storing scores found for purpose of move ordering
    const moveScoresArr = new Float32Array(numRootMoves);

    const searchDepthIncrement = this.allowedSearchDepths === AllowedSearchDepths.Any ? 1 : 2;
    let searchDepth = startDepth - searchDepthIncrement;
    const maximisingPlayer = context.state().mover();
    const numPlayers = game.players().count();

    // best move found so far during a fully-completed search
    let bestMoveCompleteSearch: Move = this.sortedRootMoves!.get(0);

    // We can maybe narrow alpha-beta window if some players already won/lost
    this.rootAlphaInit = RankUtils.rankToUtil(context.computeNextLossRank(), numPlayers) * AlphaBetaSearch.BETA_INIT;
    this.rootBetaInit = RankUtils.rankToUtil(context.computeNextWinRank(), numPlayers) * AlphaBetaSearch.BETA_INIT;

    while (searchDepth < maxDepth) {
      searchDepth += searchDepthIncrement;
      this.searchedFullTree = true;

      let score = AlphaBetaSearch.ALPHA_INIT;

      // best move during this particular search
      let bestMove: Move | null = this.sortedRootMoves!.get(0);

      for (let i = 0; i < numRootMoves; ++i) {
        const copyContext = this.copyContext(context as unknown as IContext) as unknown as Context;
        const m = this.sortedRootMoves!.get(i);
        game.apply(copyContext, m);
        const values = this.maxN(copyContext, searchDepth - 1, maximisingPlayer, this.rootAlphaInit, this.rootBetaInit, numPlayers, stopTime);

        if (Date.now() >= stopTime || this.wantsInterrupt) { // time to abort search
          bestMove = null;
          break;
        }

        if (values === null) {
          bestMove = null;
          break;
        }

        const origMoveIdx = this._indexOf(this.currentRootMoves!, m);
        if (origMoveIdx >= 0) {
          rootValueEstimatesArr[origMoveIdx] = this.scoreToValueEst(values[maximisingPlayer]!, this.rootAlphaInit, this.rootBetaInit);
        }

        moveScoresArr[i] = values[maximisingPlayer]!;

        if (values[maximisingPlayer]! > score) { // new best move found
          score = values[maximisingPlayer]!;
          bestMove = m;
        }

        if (score >= this.rootBetaInit) { // a winning move, only type of pruning we can do in Max^n
          break;
        }
      }

      // this is iterative deepening stuff again

      if (bestMove !== null) { // search was not interrupted
        this.estimatedRootScore = score;

        if (score === this.rootBetaInit) {
          // we've just proven a win, so we can return best move found during this search
          this.analysisReport += " (subsequent Max^n found proven win at depth " + searchDepth + ")";
          this.provedWin = true;
          return bestMove;
        } else if (score === this.rootAlphaInit) {
          // we've just proven a loss, so we return the best move of the PREVIOUS search
          this.analysisReport += " (subsequent Max^n found proven loss at depth " + searchDepth + ")";
          return bestMoveCompleteSearch;
        } else if (this.searchedFullTree) {
          // We've searched full tree but did not prove a win or loss
          this.analysisReport += " (subsequent Max^n completed search of depth " + searchDepth + " (no proven win or loss))";
          return bestMove;
        }

        bestMoveCompleteSearch = bestMove;
      } else {
        // Decrement because we didn't manage to complete this search
        searchDepth -= searchDepthIncrement;
      }

      if (Date.now() >= stopTime || this.wantsInterrupt) {
        // we need to return
        this.analysisReport += " (subsequent Max^n completed search of depth " + searchDepth + ")";
        return bestMoveCompleteSearch;
      }

      // order moves based on scores found, for next search
      scoredMoves.length = 0;
      const sortedArr: Move[] = [];
      for (let i = 0; i < this.sortedRootMoves!.size(); i++) {
        sortedArr.push(this.sortedRootMoves!.get(i));
      }
      for (let i = 0; i < numRootMoves; ++i) {
        scoredMoves.push(new ScoredMove(sortedArr[i]!, moveScoresArr[i]!));
      }
      scoredMoves.sort((a, b) => a.compareTo(b));

      const newSorted: Move[] = scoredMoves.map(sm => sm.move);
      this.sortedRootMoves = this._makeList(newSorted);

      // clear the vector of scores
      moveScoresArr.fill(0);
    }

    this.analysisReport += " (subsequent Max^n completed search of depth " + searchDepth + ")";
    return bestMoveCompleteSearch;
  }

  /**
   * Recursive Max^n search function.
   *
   * @java AlphaBetaSearch.maxN(Context, int, int, float, float, int, long)
   */
  public maxN(
    context: Context,
    depth: number,
    maximisingPlayer: number,
    inAlpha: number,
    inBeta: number,
    numPlayers: number,
    stopTime: number
  ): number[] | null {
    const trial = context.trial();
    const state = context.state();

    if (trial.over()) {
      // terminal node
      const utils = RankUtils.utilities(context);
      const toReturn: number[] = new Array(utils.length).fill(0);

      for (let p = 1; p < utils.length; ++p) {
        toReturn[p] = (utils[p] ?? 0) * AlphaBetaSearch.BETA_INIT;

        const tp = toReturn[p]!;
        if (tp !== inAlpha && tp !== inBeta) {
          this.minHeuristicEval = Math.min(this.minHeuristicEval, tp);
          this.maxHeuristicEval = Math.max(this.maxHeuristicEval, tp);
        }
      }

      return toReturn;
    } else if (depth === 0) {
      this.searchedFullTree = false;

      // heuristic evaluations
      const playerScores: number[] = new Array(numPlayers + 1).fill(0);
      const utils = context.numActive() === numPlayers ? null : RankUtils.utilities(context);

      for (let p = 1; p <= numPlayers; ++p) {
        if (context.active(p)) {
          playerScores[p] = this.heuristicValueFunction!.computeValue(context, p, AlphaBetaSearch.ABS_HEURISTIC_WEIGHT_THRESHOLD);
        } else {
          playerScores[p] = (utils![p] ?? 0) * AlphaBetaSearch.BETA_INIT;
        }
      }

      const oppScoreMultiplier = 1.0 / numPlayers; // this gives us nicer heuristics around 0
      const toReturn: number[] = new Array(numPlayers + 1).fill(0);

      for (let p = 1; p <= numPlayers; ++p) {
        for (let other = 1; other <= numPlayers; ++other) {
          if (other === p) {
            toReturn[p] = (toReturn[p] ?? 0) + (playerScores[other] ?? 0);
          } else {
            toReturn[p] = (toReturn[p] ?? 0) - oppScoreMultiplier * (playerScores[other] ?? 0);
          }
        }

        this.minHeuristicEval = Math.min(this.minHeuristicEval, toReturn[p] ?? 0);
        this.maxHeuristicEval = Math.max(this.maxHeuristicEval, toReturn[p] ?? 0);
      }

      return toReturn;
    }

    const game = context.game();
    const mover = state.mover();

    const legalMoves = game.moves(context).moves();

    // We can maybe narrow alpha and beta if some players already won/lost
    const alpha = Math.max(inAlpha, RankUtils.rankToUtil(context.computeNextLossRank(), numPlayers) * AlphaBetaSearch.BETA_INIT);
    const beta = Math.min(inBeta, RankUtils.rankToUtil(context.computeNextWinRank(), numPlayers) * AlphaBetaSearch.BETA_INIT);

    const numLegalMoves = legalMoves.size();

    let returnScores: number[] = new Array(numPlayers + 1).fill(AlphaBetaSearch.ALPHA_INIT);
    let score = AlphaBetaSearch.ALPHA_INIT;
    let maximisingPlayerTieBreaker = AlphaBetaSearch.BETA_INIT;
    for (let i = 0; i < numLegalMoves; ++i) {
      const copyContext = this.copyContext(context as unknown as IContext) as unknown as Context;
      const m = legalMoves.get(i);
      game.apply(copyContext, m);
      const values = this.maxN(copyContext, depth - 1, maximisingPlayer, alpha, beta, numPlayers, stopTime);

      if (Date.now() >= stopTime || this.wantsInterrupt) { // time to abort search
        return null;
      }

      if (values === null) {
        return null;
      }

      const vmover = values[mover] ?? 0;
      const vmax = values[maximisingPlayer] ?? 0;
      if (vmover > score) {
        score = vmover;
        returnScores = values;
        maximisingPlayerTieBreaker = vmax;
      } else if (vmover === score && mover !== maximisingPlayer) {
        if (vmax < maximisingPlayerTieBreaker) {
          returnScores = values;
          maximisingPlayerTieBreaker = vmax;
        }
      }

      if (score >= beta) { // a winning move, only type of pruning we can do in Max^n
        break;
      }
    }

    return returnScores;
  }

  //-------------------------------------------------------------------------

  /**
   * @param player
   * @return Opponents of given player
   * @java AlphaBetaSearch.opponents(int)
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
   * Converts a score into a value estimate in [-1, 1]. Useful for visualisations.
   *
   * @java AlphaBetaSearch.scoreToValueEst(float, float, float)
   */
  public scoreToValueEst(score: number, alpha: number, beta: number): number {
    if (score === alpha) return -1.0;

    if (score === beta) return 1.0;

    // Map to range [-0.8, 0.8] based on most extreme heuristic evaluations observed so far.
    return -0.8 + (0.8 - -0.8) * ((score - this.minHeuristicEval) / (this.maxHeuristicEval - this.minHeuristicEval));
  }

  //-------------------------------------------------------------------------

  /** @java AlphaBetaSearch.initAI(Game, int) */
  public override initAI(game: unknown, _playerID: number): void {
    const g = game as GameFull;

    if (this.heuristicsFromMetadata) {
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
    this.maxHeuristicEval = 0.0;
    this.minHeuristicEval = 0.0;
    this.analysisReport = null;

    this.currentRootMoves = null;
    this.rootValueEstimates = null;

    // and these things for ExIt
    this.lastSearchedRootContext = null;
    this.lastReturnedMove = null;

    this.numPlayersInGame = g.players().count();

    if (g.usesNoRepeatPositionalInGame() || g.usesNoRepeatPositionalInTurn()) {
      this.transpositionTable = null;
    } else if (!this.allowTranspositionTable) {
      this.transpositionTable = null;
    } else {
      this.transpositionTable = createTranspositionTable(12);
    }
  }

  /** @java AlphaBetaSearch.supportsGame(Game) */
  public override supportsGame(game: unknown): boolean {
    const g = game as GameFull;
    if (g.players().count() <= 1) return false;
    if (g.hiddenInformation()) return false;
    if (g.hasSubgames()) return false; // Cant properly init most heuristics
    return g.isAlternatingMoveGame();
  }

  /** @java AlphaBetaSearch.estimateValue() */
  public override estimateValue(): number {
    return this.scoreToValueEst(this.estimatedRootScore, this.rootAlphaInit, this.rootBetaInit);
  }

  /** @java AlphaBetaSearch.generateAnalysisReport() */
  public override generateAnalysisReport(): string | null {
    return this.analysisReport;
  }

  /** @java AlphaBetaSearch.aiVisualisationData() */
  public override aiVisualisationData(): AIVisualisationData | null {
    if (this.currentRootMoves === null || this.rootValueEstimates === null) {
      return null;
    }

    // Use escape hatch for AIVisualisationData
    return {
      aiDistribution: this.rootValueEstimates,
      valueEstimates: this.rootValueEstimates,
      moves: this.currentRootMoves,
    } as unknown as AIVisualisationData;
  }

  //-------------------------------------------------------------------------

  /** @java AlphaBetaSearch.lastSearchRootMoves() */
  public override lastSearchRootMoves(): FastArrayList<Move> {
    const arr: Move[] = [];
    for (let i = 0; i < this.currentRootMoves!.size(); i++) {
      arr.push(this.currentRootMoves!.get(i));
    }
    return this._makeList(arr);
  }

  /** @java AlphaBetaSearch.computeExpertPolicy(double) */
  public override computeExpertPolicy(_tau: number): FVector {
    const size = this.currentRootMoves!.size();
    const arr = new Float32Array(size);
    const idx = this._indexOf(this.currentRootMoves!, this.lastReturnedMove!);
    if (idx >= 0) arr[idx] = 1.0;
    // softmax (just normalize as single hot)
    return this._makeVector(arr);
  }

  /** @java AlphaBetaSearch.generateExItExperiences() */
  public override generateExItExperiences(): ExItExperience[] {
    // Escape hatch — return empty, as ExItExperience not yet ported
    return [];
  }

  //-------------------------------------------------------------------------

  /**
   * @return the heuristic value function
   * @java AlphaBetaSearch.heuristicValueFunction()
   */
  public getHeuristicValueFunction(): Heuristics | null {
    return this.heuristicValueFunction;
  }

  //-------------------------------------------------------------------------

  /**
   * Sets which search depths are allowed
   * @java AlphaBetaSearch.setAllowedSearchDepths(AllowedSearchDepths)
   */
  public setAllowedSearchDepths(allowed: AllowedSearchDepths): void {
    this.allowedSearchDepths = allowed;
  }

  //-------------------------------------------------------------------------

  /**
   * @param lines
   * @return Constructs an Alpha-Beta Search object from instructions in the given array of lines
   * @java AlphaBetaSearch.fromLines(String[])
   */
  public static fromLines(lines: string[]): AlphaBetaSearch {
    let friendlyName = "Alpha-Beta";
    let heuristics: Heuristics | null = null;

    for (const line of lines) {
      const lineParts = line.split(",");
      const part0 = lineParts[0] ?? "";

      if (part0.toLowerCase().startsWith("heuristics=")) {
        heuristics = HeuristicsStatic.fromLines(lineParts);
      } else if (part0.toLowerCase().startsWith("friendly_name=")) {
        friendlyName = part0.substring("friendly_name=".length);
      }
    }

    let alphaBeta: AlphaBetaSearch;

    if (heuristics !== null) {
      alphaBeta = new AlphaBetaSearch(heuristics);
    } else {
      alphaBeta = new AlphaBetaSearch();
    }

    alphaBeta.friendlyName = friendlyName;

    return alphaBeta;
  }

  //-------------------------------------------------------------------------

  // Helper: create FastArrayList from array
  private _makeList<T>(arr: T[]): FastArrayList<T> {
    return {
      size: () => arr.length,
      get: (i: number) => arr[i],
    } as unknown as FastArrayList<T>;
  }

  // Helper: create FVector from Float32Array
  private _makeVector(arr: Float32Array): FVector {
    return {
      dim: () => arr.length,
      get: (i: number) => arr[i],
      sampleProportionally: () => 0,
    } as unknown as FVector;
  }

  // Helper: find index of move in list
  private _indexOf(list: FastArrayList<Move>, target: Move): number {
    for (let i = 0; i < list.size(); i++) {
      if (list.get(i) === target) return i;
    }
    return -1;
  }

  // Helper: compare moves for equality (simplified)
  private _movesEqual(a: Move, b: Move): boolean {
    return a === b;
  }

  //-------------------------------------------------------------------------
}
