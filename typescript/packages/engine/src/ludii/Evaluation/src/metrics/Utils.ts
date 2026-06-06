// @java Evaluation/src/metrics/Utils.java

/**
 * Helpful functions for metric analysis.
 *
 * @java metrics/Utils.java
 * @author Matthew.Stephenson
 */

import { Evaluation } from "./Evaluation.js";

//-----------------------------------------------------------------------------

/** Minimal escape-hatch types for not-yet-ported dependencies */
type Game = unknown;
type Trial = unknown;
type RandomProviderState = unknown;
type Move = unknown;
type Context = unknown;
type TempContext = unknown;
type TopologyElement = unknown;
type ContainerState = unknown;

//-----------------------------------------------------------------------------

/**
 * Escape-hatch interface for Context.
 * @java other/context/Context.java
 */
interface ContextLike {
  rng(): { restoreState(s: RandomProviderState): void; saveState(): RandomProviderState };
  reset(): void;
  state(): {
    initialise(game: Game): void;
    mover: number;
    fullHash(): bigint;
    playerToAgent(mover: number): number;
  };
  currentInstanceContext(): ContextLike;
  containerState(idx: number): ContainerState;
  board(): {
    topology(): TopologyLike;
    defaultSite(): unknown;
  };
  game(): GameLike;
  trial(): TrialLike;
  active(player: number): boolean;
  winners(): { contains(p: number): boolean };
}

interface GameLike {
  start(ctx: ContextLike): void;
  apply(ctx: ContextLike, move: Move): void;
  moves(ctx: ContextLike): { moves(): { size(): number } };
  booleanConcepts(): { get(id: number): boolean };
  players(): { count(): number };
  isStacking(): boolean;
}

interface TrialLike {
  over(): boolean;
  generateRealMovesList(): Move[];
  numberRealMoves(): number;
  lastMove(): Move;
  setStatus(s: null): void;
  ranking(): number[];
}

interface TopologyLike {
  getAllGraphElements(): TopologyElement[];
  getAllUsedGraphElements(game: Game): TopologyElement[];
  getGraphElements(siteType: unknown): TopologyElement[];
  numSites(siteType: unknown): number;
  preGenerateDistanceToEachElementToEachOther(siteType: unknown, relationType: unknown): void;
  distancesToOtherSite(siteType: unknown): number[][];
}

interface ContainerStateLike {
  sizeStack(index: number, elementType: unknown): number;
  count(index: number, elementType: unknown): number;
  what(index: number, elementType: unknown): number;
}

interface TopologyElementLike {
  index(): number;
  elementType(): unknown;
}

//-----------------------------------------------------------------------------

/**
 * Helpful functions for metric analysis.
 * @java metrics/Utils.java
 */
export class Utils {

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @param rngState
   * @return A new context for a given game and RNG.
   * @java Utils.setupNewContext(Game, RandomProviderState)
   */
  public static setupNewContext(game: Game, rngState: RandomProviderState): ContextLike {
    const g = game as GameLike;
    // Escape hatch: calls to Trial and Context constructors via unknown
    const trial = (new (as_unknown_as_Trial as unknown as new (g: Game) => TrialLike)(game));
    const context = (new (as_unknown_as_Context as unknown as new (g: Game, t: TrialLike) => ContextLike)(game, trial));
    context.rng().restoreState(rngState);
    context.reset();
    context.state().initialise(context.currentInstanceContext().game() as Game);
    g.start(context);
    context.trial().setStatus(null);
    return context;
  }

  /**
   * @java Utils.setupTrialContext(Game, RandomProviderState, Trial)
   */
  public static setupTrialContext(game: Game, rngState: RandomProviderState, trial: Trial): ContextLike {
    const context = Utils.setupNewContext(game, rngState);
    const t = trial as TrialLike;
    for (const m of t.generateRealMovesList())
      (game as GameLike).apply(context, m);
    return context;
  }

  //-------------------------------------------------------------------------

  /**
   * The number of pieces on the board.
   * @java Utils.numPieces(Context)
   */
  public static numPieces(context: ContextLike): number {
    let numPieces = 0;
    const cs = context.containerState(0) as unknown as ContainerStateLike;
    const allElements = context.board().topology().getAllGraphElements();

    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i] as unknown as TopologyElementLike;
      if ((context.game() as GameLike).isStacking())
        numPieces += cs.sizeStack(element.index(), element.elementType());
      else
        numPieces += cs.count(element.index(), element.elementType());
    }

    return numPieces;
  }

  //-------------------------------------------------------------------------

  /**
   * A list of all board sites which have a piece on them.
   * @java Utils.boardAllSitesCovered(Context)
   */
  public static boardAllSitesCovered(context: ContextLike): TopologyElement[] {
    const boardSitesCovered: TopologyElement[] = [];
    const cs = context.containerState(0) as unknown as ContainerStateLike;

    for (const topologyElement of context.board().topology().getAllGraphElements()) {
      const e = topologyElement as unknown as TopologyElementLike;
      if (cs.what(e.index(), e.elementType()) !== 0)
        boardSitesCovered.push(topologyElement);
    }

    return boardSitesCovered;
  }

  /**
   * A list of all used board sites which have a piece on them.
   * @java Utils.boardUsedSitesCovered(Context)
   */
  public static boardUsedSitesCovered(context: ContextLike): TopologyElement[] {
    const boardSitesCovered: TopologyElement[] = [];
    const cs = context.containerState(0) as unknown as ContainerStateLike;

    for (const topologyElement of context.board().topology().getAllUsedGraphElements(context.game())) {
      const e = topologyElement as unknown as TopologyElementLike;
      if (cs.what(e.index(), e.elementType()) !== 0)
        boardSitesCovered.push(topologyElement);
    }

    return boardSitesCovered;
  }

  /**
   * A list of all default board sites which have a piece on them.
   * @java Utils.boardDefaultSitesCovered(Context)
   */
  public static boardDefaultSitesCovered(context: ContextLike): TopologyElement[] {
    const boardSitesCovered: TopologyElement[] = [];
    const cs = context.containerState(0) as unknown as ContainerStateLike;

    for (const topologyElement of context.board().topology().getGraphElements(context.board().defaultSite())) {
      const e = topologyElement as unknown as TopologyElementLike;
      if (cs.what(e.index(), e.elementType()) !== 0)
        boardSitesCovered.push(topologyElement);
    }

    return boardSitesCovered;
  }

  //-------------------------------------------------------------------------

  /**
   * Returns an evaluation between -1 and 1 for the current (context) state of the mover.
   * @java Utils.evaluateState(Evaluation, Context, int)
   */
  public static evaluateState(evaluation: Evaluation, context: ContextLike, mover: number): number {
    const instanceContext = context.currentInstanceContext();
    // AlphaBetaSearch is not-yet-ported; use escape hatch
    const agent = as_unknown_as_newAlphaBeta(false) as unknown as {
      initAI(game: Game, player: number): void;
      heuristicValueFunction(): { computeValue(ctx: ContextLike, player: number, threshold: number): number };
      opponents(mover: number): number[];
    };
    agent.initAI(instanceContext.game() as Game, mover);

    // Java: Arrays.hashCode(rngState.getState())
    const rngHashcode = as_unknown_as_rngHashcode(instanceContext.rng().saveState());
    const stateAndMoverHash =
      BigInt.asIntN(64, instanceContext.state().fullHash() ^ BigInt(mover) ^ BigInt(rngHashcode));

    if (instanceContext.trial().over() || !instanceContext.active(mover)) {
      // Terminal node (at least for mover)
      return as_unknown_as_agentUtilities(instanceContext)[mover] ?? 0;
    } else if (evaluation.stateEvaluationCacheContains(stateAndMoverHash)) {
      return evaluation.getStateEvaluationCacheValue(stateAndMoverHash);
    } else {
      // Heuristic evaluation
      // ABS_HEURISTIC_WEIGHT_THRESHOLD escape hatch
      const ABS_HEURISTIC_WEIGHT_THRESHOLD = 0.01;
      const PARANOID_OPP_WIN_SCORE = 1000.0;

      let heuristicScore = agent.heuristicValueFunction().computeValue(instanceContext, mover, ABS_HEURISTIC_WEIGHT_THRESHOLD);

      for (const opp of agent.opponents(mover)) {
        if (instanceContext.active(opp))
          heuristicScore -= agent.heuristicValueFunction().computeValue(instanceContext, opp, ABS_HEURISTIC_WEIGHT_THRESHOLD);
        else if (instanceContext.winners().contains(opp))
          heuristicScore -= PARANOID_OPP_WIN_SCORE;
      }

      // Invert scores if players swapped (only works for two player games)
      if (instanceContext.state().playerToAgent(mover) !== mover)
        heuristicScore = -heuristicScore;

      // Normalise to between -1 and 1
      const heuristicScoreTanh = Math.tanh(heuristicScore);
      evaluation.putStateEvaluationCacheValue(stateAndMoverHash, heuristicScoreTanh);
      return heuristicScoreTanh;
    }
  }

  /**
   * Returns an evaluation of a given move from the current (context) state.
   * @java Utils.evaluateMove(Evaluation, Context, Move)
   */
  public static evaluateMove(evaluation: Evaluation, context: ContextLike, move: Move): number | null {
    const rngHashcode = as_unknown_as_rngHashcode(context.rng().saveState());
    const moveHash = as_unknown_as_moveHash(context, move);
    const stateAndMoveHash = BigInt.asIntN(64,
      context.state().fullHash() ^ BigInt(moveHash) ^ BigInt(rngHashcode)
    );

    if (evaluation.stateAfterMoveEvaluationCacheContains(stateAndMoveHash))
      return evaluation.getStateAfterMoveEvaluationCache(stateAndMoveHash);

    const copyContext = as_unknown_as_newTempContext(context) as unknown as ContextLike;
    (copyContext.game() as GameLike).apply(copyContext, move);

    const moveMover = (move as unknown as { mover(): number }).mover?.() ?? context.state().mover;
    const stateEvaluationAfterMove = Utils.evaluateState(evaluation, copyContext, moveMover);
    evaluation.putStateAfterMoveEvaluationCache(stateAndMoveHash, stateEvaluationAfterMove);

    return stateEvaluationAfterMove;
  }

  /**
   * Returns an evaluation between 0 and 1 for the current (context) state of each player.
   * @java Utils.allPlayerStateEvaluations(Evaluation, Context)
   */
  public static allPlayerStateEvaluations(evaluation: Evaluation, context: ContextLike): number[] {
    const allPlayerStateEvaluations: number[] = [];
    allPlayerStateEvaluations.push(-1.0);
    const playerCount = (context.game() as GameLike).players().count();
    for (let i = 1; i <= playerCount; i++)
      allPlayerStateEvaluations.push(Utils.evaluateState(evaluation, context, i));
    return allPlayerStateEvaluations;
  }

  //-------------------------------------------------------------------------

  /**
   * Get the highest ranked players based on the final player rankings.
   * @java Utils.highestRankedPlayers(Trial, Context)
   */
  public static highestRankedPlayers(trial: Trial, context: ContextLike): number[] | null {
    const playerCount = (context.game() as GameLike).players().count();
    if (playerCount <= 0) return null;

    const highestRankedPlayers: number[] = [];
    const utilities = as_unknown_as_agentUtilities(context);

    let highestRanking = -Infinity;
    for (let i = 1; i <= playerCount; i++) {
      const util = utilities[i] ?? -Infinity;
      if (util > highestRanking) highestRanking = util;
    }

    for (let i = 1; i <= playerCount; i++) {
      const util = utilities[i] ?? -Infinity;
      if (util === highestRanking) highestRankedPlayers.push(i);
    }

    return highestRankedPlayers;
  }

  //-------------------------------------------------------------------------
}

//-----------------------------------------------------------------------------
// Escape-hatch stubs for not-yet-ported dependencies
//-----------------------------------------------------------------------------

/** Stub for RankUtils.agentUtilities(Context) */
function as_unknown_as_agentUtilities(_context: ContextLike): number[] {
  throw new Error("RankUtils.agentUtilities not yet ported");
}

/** Stub for new AlphaBetaSearch(boolean) */
function as_unknown_as_newAlphaBeta(_warmStart: boolean): unknown {
  throw new Error("AlphaBetaSearch not yet ported");
}

/** Stub for Arrays.hashCode(rngState.getState()) */
function as_unknown_as_rngHashcode(_state: RandomProviderState): number {
  throw new Error("RandomProviderDefaultState.getState not yet ported");
}

/** Stub for move.toTrialFormat(context).hashCode() */
function as_unknown_as_moveHash(_context: ContextLike, _move: Move): number {
  throw new Error("Move.toTrialFormat hashCode not yet ported");
}

/** Stub for new TempContext(context) */
function as_unknown_as_newTempContext(_context: ContextLike): unknown {
  throw new Error("TempContext not yet ported");
}

/** Stub for new Trial(game) */
const as_unknown_as_Trial: unknown = null;

/** Stub for new Context(game, trial) */
const as_unknown_as_Context: unknown = null;
