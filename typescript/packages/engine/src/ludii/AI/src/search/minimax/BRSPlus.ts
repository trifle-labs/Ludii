// @java AI/src/search/minimax/BRSPlus.java

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
  computeNextLossRank(): number;
  computeNextWinRank(): number;
}

/** @java other.trial.Trial */
interface Trial {
  over(): boolean;
}

/** @java other.state.State */
interface State {
  mover(): number;
  playerToAgent(p: number): number;
  fullHash(): bigint;
  next(): number;
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
}

/** @java other.RankUtils */
interface RankUtils {
  agentUtilities(ctx: Context): number[];
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
const TranspositionTableConstants = {
  EXACT_VALUE: 1,
  LOWER_BOUND: 2,
  UPPER_BOUND: 3,
};
function createTranspositionTable(_bits: number): TranspositionTable {
  return null as unknown as TranspositionTable; // escape hatch
}

//-------------------------------------------------------------------------

/**
 * Wrapper for score + move, used for sorting moves based on scores.
 * @java search.minimax.BRSPlus.ScoredMove
 */
class ScoredMove {
  public readonly move: Move;
  public readonly score: number;

  public constructor(move: Move, score: number) {
    this.move = move;
    this.score = score;
  }

  public compareTo(other: ScoredMove): number {
    const delta = other.score - this.score;
    if (delta < 0) return -1;
    else if (delta > 0) return 1;
    else return 0;
  }
}

//-------------------------------------------------------------------------

/**
 * Implementation of BRS+ (Esser et al., 2013). Assumes perfect-information games.
 * Uses iterative deepening when time-restricted, goes straight for
 * depth limit when only depth-limited. Extracts heuristics to use from game's metadata.
 *
 * Cannot play games with fewer than 3 players (since then it would just revert to the
 * normal AlphaBetaSearch that we already have).
 *
 * @java search.minimax.BRSPlus
 * @author Dennis Soemers
 */
export class BRSPlus extends ExpertPolicy {

  //-------------------------------------------------------------------------

  // Re-declare inherited fields to ensure correct typing in this class
  /** @java AI.friendlyName */
  protected declare friendlyName: string;
  /** @java AI.wantsInterrupt */
  protected declare wantsInterrupt: boolean;
  //-------------------------------------------------------------------------

  /** Value we use to initialise alpha ("negative infinity", but not really) */
  private static readonly ALPHA_INIT: number = -1000000.0;

  /** Value we use to initialise beta ("positive infinity", but not really) */
  private static readonly BETA_INIT: number = 1000000.0;

  /** Score we give to winning opponents in paranoid searches in states where game is still going (> 2 players) */
  private static readonly PARANOID_OPP_WIN_SCORE: number = 10000.0;

  /** We skip computing heuristics with absolute weight value lower than this */
  public static readonly ABS_HEURISTIC_WEIGHT_THRESHOLD: number = 0.01;

  //-------------------------------------------------------------------------

  /** Our heuristic value function estimator */
  private heuristicValueFunction: Heuristics | null = null;

  /** If true, we read our heuristic function to use from game's metadata */
  private readonly heuristicsFromMetadata: boolean;

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

  /** Needed for visualisations */
  protected rootAlphaInit: number = BRSPlus.ALPHA_INIT;

  /** Needed for visualisations */
  protected rootBetaInit: number = BRSPlus.BETA_INIT;

  /** Sorted (hopefully cleverly) list of moves available in root node */
  protected sortedRootMoves: FastArrayList<Move> | null = null;

  /** If true at end of a search, it means we searched full tree (probably proved a draw) */
  protected searchedFullTree: boolean = false;

  /** Transposition Table */
  protected transpositionTable: TranspositionTable | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java BRSPlus()
   */
  public constructor();

  /**
   * Constructor
   * @param heuristicsFilepath
   * @java BRSPlus(String)
   */
  public constructor(heuristicsFilepath: string);

  public constructor(heuristicsFilepath?: string) {
    super();
    this.friendlyName = "BRS+";
    if (heuristicsFilepath !== undefined) {
      // heuristicsFilepath variant — escape hatch (no file loading in TS)
      this.heuristicsFromMetadata = false;
    } else {
      this.heuristicsFromMetadata = true;
    }
    this.transpositionTable = createTranspositionTable(12);
  }

  //-------------------------------------------------------------------------

  /** @java BRSPlus.selectAction(Game, Context, double, int, int) */
  public selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    _maxIterations: number,
    maxDepth: number
  ): Move {
    const ctx = context as Context;
    const g = game as GameFull;

    const depthLimit = maxDepth > 0 ? maxDepth : Number.MAX_SAFE_INTEGER;
    this.lastSearchedRootContext = ctx;

    if (this.transpositionTable !== null) {
      this.transpositionTable.allocate();
    }

    if (maxSeconds > 0) {
      this.lastReturnedMove = this.iterativeDeepening(g, ctx, maxSeconds, depthLimit, 1);
      if (this.transpositionTable !== null) {
        this.transpositionTable.deallocate();
      }
      return this.lastReturnedMove!;
    } else {
      // we'll just do iterative deepening with the depth limit as starting depth
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
   * @java BRSPlus.iterativeDeepening(Game, Context, double, int, int)
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

    // storing scores found for purpose of move ordering
    const moveScoresArr = new Float32Array(numRootMoves);
    let searchDepth = startDepth - 1;
    const maximisingPlayer = context.state().playerToAgent(context.state().mover());

    // best move found so far during a fully-completed search
    let bestMoveCompleteSearch: Move = shuffled[0]!;

    // For paranoid search, we can narrow alpha-beta window if some players already won/lost
    this.rootAlphaInit = RankUtils.rankToUtil(context.computeNextLossRank(), numPlayers) * BRSPlus.BETA_INIT;
    this.rootBetaInit = RankUtils.rankToUtil(context.computeNextWinRank(), numPlayers) * BRSPlus.BETA_INIT;

    while (searchDepth < maxDepth) {
      ++searchDepth;
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
        const value = this.alphaBeta(copyContext, searchDepth - 1, alpha, beta, maximisingPlayer, stopTime, 1);

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
          this.analysisReport = this.friendlyName + " found a proven win at depth " + searchDepth + ".";
          return bestMove;
        } else if (score === this.rootAlphaInit) {
          this.analysisReport = this.friendlyName + " found a proven loss at depth " + searchDepth + ".";
          return bestMoveCompleteSearch;
        } else if (this.searchedFullTree) {
          this.analysisReport = this.friendlyName + " completed search of depth " + searchDepth + " (no proven win or loss).";
          return bestMove;
        }

        bestMoveCompleteSearch = bestMove;
      } else {
        // decrement because we didn't manage to complete this search
        --searchDepth;
      }

      if (Date.now() >= stopTime || this.wantsInterrupt) {
        // we need to return
        this.analysisReport = this.friendlyName + " completed search of depth " + searchDepth + ".";
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

    this.analysisReport = this.friendlyName + " completed search of depth " + searchDepth + ".";
    return bestMoveCompleteSearch;
  }

  /**
   * Recursive alpha-beta search function.
   *
   * @param regMoveCounter Tracks the number of regular moves between successive turns of root player (for BRS+)
   * @java BRSPlus.alphaBeta(Context, int, float, float, int, long, int)
   */
  public alphaBeta(
    context: Context,
    depth: number,
    inAlpha: number,
    inBeta: number,
    maximisingPlayer: number,
    stopTime: number,
    regMoveCounter: number
  ): number {
    const trial = context.trial();
    const state = context.state();

    const originalAlpha = inAlpha;
    let alpha = inAlpha;
    let beta = inBeta;

    const zobrist = state.fullHash();
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
      return (RankUtils.agentUtilities(context)[maximisingPlayer] ?? 0) * BRSPlus.BETA_INIT;
    } else if (depth === 0) {
      this.searchedFullTree = false;

      // heuristic evaluation
      let heuristicScore = this.heuristicValueFunction!.computeValue(
        context, maximisingPlayer, BRSPlus.ABS_HEURISTIC_WEIGHT_THRESHOLD
      );

      for (const opp of this.opponents(maximisingPlayer)) {
        if (context.active(opp)) {
          heuristicScore -= this.heuristicValueFunction!.computeValue(context, opp, BRSPlus.ABS_HEURISTIC_WEIGHT_THRESHOLD);
        } else if (context.winners().contains(opp)) {
          heuristicScore -= BRSPlus.PARANOID_OPP_WIN_SCORE;
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

      for (let i = 0; i < legalMoves.size(); ++i) {
        if (legalArr[i] === transpositionBestMove) {
          const temp = legalArr[0]!;
          legalArr[0] = legalArr[i]!;
          legalArr[i] = temp;
          break;
        }
      }
      legalMoves = this._makeList(legalArr);
    }

    const numPlayers = game.players().count();

    // For paranoid search, we can maybe narrow alpha-beta window if some players already won/lost
    alpha = Math.max(alpha, RankUtils.rankToUtil(context.computeNextLossRank(), numPlayers) * BRSPlus.BETA_INIT);
    beta = Math.min(beta, RankUtils.rankToUtil(context.computeNextWinRank(), numPlayers) * BRSPlus.BETA_INIT);

    let bestMove: Move = legalMoves.get(0);

    if (mover === maximisingPlayer) {
      let score = BRSPlus.ALPHA_INIT;

      for (let i = 0; i < numLegalMoves; ++i) {
        const copyContext = this.copyContext(context as unknown as IContext) as unknown as Context;
        const m = legalMoves.get(i);
        game.apply(copyContext, m);
        const value = this.alphaBeta(copyContext, depth - 1, alpha, beta, maximisingPlayer, stopTime, 1);

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
      let score = BRSPlus.BETA_INIT;

      let allowRegularMoves = true;
      let allowSpecialMove = false;
      if (regMoveCounter === 2) {
        allowRegularMoves = false;
        allowSpecialMove = true;
      } else if (state.playerToAgent(state.next()) !== maximisingPlayer) {
        allowSpecialMove = true;
      }

      let cutOff = false;

      if (allowRegularMoves) {
        for (let i = 0; i < numLegalMoves; ++i) {
          const copyContext = this.copyContext(context as unknown as IContext) as unknown as Context;
          const m = legalMoves.get(i);
          game.apply(copyContext, m);
          const value = this.alphaBeta(copyContext, depth - 1, alpha, beta, maximisingPlayer, stopTime, regMoveCounter + 1);

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
            cutOff = true;
            break;
          }
        }
      }

      if (allowSpecialMove && !cutOff) {
        const copyContext = this.copyContext(context as unknown as IContext) as unknown as Context;

        const m: Move = tableData !== null ? // We have move ordering from TT
          legalMoves.get(0) : // No move ordering, just randomly pick a move
          legalMoves.get(Math.floor(Math.random() * legalMoves.size()));

        game.apply(copyContext, m);
        const value = this.alphaBeta(copyContext, depth - 1, alpha, beta, maximisingPlayer, stopTime, regMoveCounter + 1);

        if (Date.now() >= stopTime || this.wantsInterrupt) { // time to abort search
          return 0;
        }

        if (value < score) {
          bestMove = m;
          score = value;
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
   * @param player
   * @return Opponents of given player
   * @java BRSPlus.opponents(int)
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
   * @java BRSPlus.scoreToValueEst(float, float, float)
   */
  public scoreToValueEst(score: number, alpha: number, beta: number): number {
    if (score === alpha) return -1.0;

    if (score === beta) return 1.0;

    // Map to range [-0.8, 0.8] based on most extreme heuristic evaluations observed so far.
    return -0.8 + (0.8 - -0.8) * ((score - this.minHeuristicEval) / (this.maxHeuristicEval - this.minHeuristicEval));
  }

  //-------------------------------------------------------------------------

  /** @java BRSPlus.initAI(Game, int) */
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
  }

  /** @java BRSPlus.supportsGame(Game) */
  public override supportsGame(game: unknown): boolean {
    const g = game as GameFull;
    if (g.players().count() <= 2) return false;
    if (g.isStochasticGame()) return false;
    if (g.hiddenInformation()) return false;
    return g.isAlternatingMoveGame();
  }

  /** @java BRSPlus.estimateValue() */
  public override estimateValue(): number {
    return this.scoreToValueEst(this.estimatedRootScore, this.rootAlphaInit, this.rootBetaInit);
  }

  /** @java BRSPlus.generateAnalysisReport() */
  public override generateAnalysisReport(): string | null {
    return this.analysisReport;
  }

  /** @java BRSPlus.aiVisualisationData() */
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

  //-------------------------------------------------------------------------

  /** @java BRSPlus.lastSearchRootMoves() */
  public override lastSearchRootMoves(): FastArrayList<Move> {
    const arr: Move[] = [];
    for (let i = 0; i < this.currentRootMoves!.size(); i++) {
      arr.push(this.currentRootMoves!.get(i));
    }
    return this._makeList(arr);
  }

  /** @java BRSPlus.computeExpertPolicy(double) */
  public override computeExpertPolicy(_tau: number): FVector {
    const size = this.currentRootMoves!.size();
    const arr = new Float32Array(size);
    const idx = this._indexOf(this.currentRootMoves!, this.lastReturnedMove!);
    if (idx >= 0) arr[idx] = 1.0;
    return this._makeVector(arr);
  }

  /** @java BRSPlus.generateExItExperiences() */
  public override generateExItExperiences(): ExItExperience[] {
    return [];
  }

  //-------------------------------------------------------------------------

  /**
   * @param lines
   * @return Constructs a BRS+ object from instructions in the given array of lines
   * @java BRSPlus.fromLines(String[])
   */
  public static fromLines(lines: string[]): BRSPlus {
    let friendlyName = "BRS+";

    for (const line of lines) {
      const lineParts = line.split(",");
      const part0 = lineParts[0] ?? "";

      if (part0.toLowerCase().startsWith("friendly_name=")) {
        friendlyName = part0.substring("friendly_name=".length);
      }
    }

    const brsPlus = new BRSPlus();
    brsPlus.friendlyName = friendlyName;

    return brsPlus;
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

  //-------------------------------------------------------------------------
}
