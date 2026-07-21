// @java AI/src/search/minimax/UBFMKilothonContender.java

/**
 * UBFM-based AI that manages its own time budget over the course of a game.
 * On the first turn it runs sample playouts to estimate average game length,
 * then allocates time to each subsequent turn accordingly.
 *
 * @java search/minimax/UBFMKilothonContender.java
 */

import { NaiveActionBasedSelection } from "./NaiveActionBasedSelection.js";
import type { Move, Game, Context, SoftmaxPolicy } from "./NaiveActionBasedSelection.js";

//-------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java gnu.trove.list.array.TLongArrayList */
export interface TLongArrayList {
  add(v: bigint): void;
  size(): number;
  removeAt(i: number): void;
  get(i: number): bigint;
}

/** @java metadata.ai.heuristics.Heuristics */
export interface Heuristics {
  computeValue(ctx: unknown, player: number, threshold: number): number;
  init(game: unknown): void;
}

/** @java utils.data_structures.transposition_table.TranspositionTableUBFM */
export interface TranspositionTableUBFM {
  retrieve(zobrist: bigint): unknown;
  store(zobrist: bigint, value: number, depth: number, valueType: number, extra: unknown): void;
}

/** @java search.mcts.MCTS */
export interface MCTS {
  selectAction(
    game: Game,
    context: Context,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null;
  initAI(game: Game, playerID: number): void;
}

// UBFM escape hatch — not yet ported (batch 22)
export interface UBFMEscapeHatch {
  friendlyName: string;
  debugDisplay: boolean;
  savingSearchTreeDescription: boolean;
  heuristicsFromMetadata: boolean;
  _heuristicValueFunction: Heuristics | null;
  estimatedRootScore: number;
  maxHeuristicEval: number;
  minHeuristicEval: number;
  analysisReport: string | null;
  currentRootMoves: FastArrayList<Move> | null;
  rootValueEstimates: unknown;
  lastSearchedRootContext: Context | null;
  lastReturnedMove: Move | null;
  numPlayersInGame: number;
  numBitsPrimaryCodeForTT: number;
  transpositionTable: TranspositionTableUBFM | null;
  wantsInterrupt: boolean;
  selectAction(
    game: Game,
    context: Context,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null;
  initAI(game: Game, playerID: number): void;
  supportsGame(game: Game): boolean;
  getContextValue(
    context: Context,
    maximisingPlayer: number,
    nodeHashes: TLongArrayList,
    depth: number
  ): number;
  heuristicValueFunction(): Heuristics | null;
  setSelectionEpsilon(eps: number): void;
  setTTReset(value: boolean): void;
  setIfFullPlayouts(value: boolean): void;
}

/** @java main.collections.FastArrayList */
export interface FastArrayList<T> {
  size(): number;
  get(i: number): T;
  add(item: T): void;
}

// SoftmaxFromMetadataSelection stub
const SoftmaxFromMetadataSelectionStub: new (epsilon: number) => SoftmaxPolicy =
  class implements SoftmaxPolicy {
    constructor(_eps: number) { /* */ }
    computeLogit(_ctx: Context, _m: Move): number { return 0; }
    initAI(_g: Game, _p: number): void { /* */ }
  };

// MCTS.createUCT stub
function createUCT(): MCTS {
  return {
    selectAction: (_g, _c, _ms, _mi, _md): Move | null => null,
    initAI: (_g, _p): void => { /* */ },
  };
}

//-------------------------------------------------------------------------

/**
 * Kilothon time-managed UBFM contender.
 * Extends UBFM via escape hatch (UBFM not yet ported, batch 22).
 *
 * @java search.minimax.UBFMKilothonContender
 */
export class UBFMKilothonContender {

  //-------------------------------------------------------------------------

  /** A learned policy to use in the selection phase
   * @java UBFMKilothonContender.learnedSelectionPolicy */
  protected learnedSelectionPolicy: SoftmaxPolicy | null = null;

  /** @java UBFMKilothonContender.firstTurn */
  private firstTurn: boolean = true;

  /** @java UBFMKilothonContender.totalNumberOfTurns */
  private totalNumberOfTurns: number = 0;

  /** @java UBFMKilothonContender.avgNumberOfTurns */
  private avgNumberOfTurns: number = 0.0;

  /** @java UBFMKilothonContender.nbTerminalPlayouts */
  private nbTerminalPlayouts: number = 0;

  /** @java UBFMKilothonContender.nbSelectActionCalls */
  private nbSelectActionCalls: number = 0;

  /** @java UBFMKilothonContender.timeLeft */
  private timeLeft: number = 0.0;

  /** @java UBFMKilothonContender.stochasticGame */
  private stochasticGame: boolean = false;

  /** @java UBFMKilothonContender.UCT_Helper */
  private UCT_Helper: MCTS | null = null;

  /** @java UBFM escape-hatch base */
  protected readonly _ubfmBase: UBFMEscapeHatch;

  public friendlyName: string = "UBFM Kilothon Contender";

  //-------------------------------------------------------------------------

  public constructor() {
    this._ubfmBase = UBFMKilothonContender._makeUBFMBase();
  }

  private static _makeUBFMBase(): UBFMEscapeHatch {
    return {
      friendlyName: "UBFM",
      debugDisplay: false,
      savingSearchTreeDescription: false,
      heuristicsFromMetadata: true,
      _heuristicValueFunction: null,
      estimatedRootScore: 0.0,
      maxHeuristicEval: 0.0,
      minHeuristicEval: 0.0,
      analysisReport: null,
      currentRootMoves: null,
      rootValueEstimates: null,
      lastSearchedRootContext: null,
      lastReturnedMove: null,
      numPlayersInGame: 0,
      numBitsPrimaryCodeForTT: 12,
      transpositionTable: null,
      wantsInterrupt: false,
      selectAction: (_g: Game, _c: Context, _ms: number, _mi: number, _md: number): Move | null => null,
      initAI: (_g: Game, _p: number): void => { /* */ },
      supportsGame: (_g: Game): boolean => true,
      getContextValue: (_c: Context, _mp: number, _nh: TLongArrayList, _d: number): number => 0,
      heuristicValueFunction: (): Heuristics | null => null,
      setSelectionEpsilon: (_eps: number): void => { /* */ },
      setTTReset: (_v: boolean): void => { /* */ },
      setIfFullPlayouts: (_v: boolean): void => { /* */ },
    } as unknown as UBFMEscapeHatch;
  }

  //-------------------------------------------------------------------------

  /**
   * @java UBFMKilothonContender.selectAction(Game, Context, double, int, int)
   */
  public selectAction(
    game: Game,
    context: Context,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null {
    this.nbSelectActionCalls += 1;

    if (this.firstTurn) {
      for (let i = 0; i < 10; ++i) {
        // TempContext clone via escape hatch
        const contextCopy = (
          context as unknown as { _cloneAsTemp(): Context }
        )._cloneAsTemp?.() ?? context;

        const agents: Array<NaiveActionBasedSelection | null> = [null];

        const nbPlayers = game.players().count();
        for (let j = 1; j <= nbPlayers; ++j) {
          const playoutAI = new NaiveActionBasedSelection();
          playoutAI.initAI(game, j);
          agents.push(playoutAI);
        }

        // game.playout(contextCopy, agents, 0.01, null, 0, 120, rand)
        (game as unknown as {
          playout(
            ctx: unknown,
            agents: unknown,
            maxTime: number,
            sel: unknown,
            nb: number,
            maxMoves: number,
            rand: unknown
          ): unknown;
        }).playout?.(contextCopy, agents, 0.01, null, 0, 120, null);

        for (let j = 1; j <= nbPlayers; ++j) {
          const a = agents[j] ?? null;
          if (a !== null) {
            this.totalNumberOfTurns += a.getSelectActionNbCalls() * 5;
            this.nbTerminalPlayouts += 5;
          }
        }

        this.avgNumberOfTurns = this.totalNumberOfTurns / this.nbTerminalPlayouts;
      }

      this.firstTurn = false;
    }

    const timeForDecision =
      this.timeLeft /
      Math.max(1.0, 1.5 * (1.5 * this.avgNumberOfTurns - this.nbSelectActionCalls));

    const startTime = Date.now();

    let selectedMove: Move | null;
    if (!this.stochasticGame) {
      selectedMove = this._ubfmBase.selectAction(
        game, context, timeForDecision, maxIterations, maxDepth
      );
    } else {
      selectedMove = this.UCT_Helper!.selectAction(
        game, context, timeForDecision, maxIterations, maxDepth
      );
    }

    this.timeLeft -= Math.max(0, (Date.now() - startTime) / 1000.0);

    return selectedMove;
  }

  //-------------------------------------------------------------------------

  /**
   * Method to evaluate a state, with heuristics if the state is not terminal.
   *
   * @java UBFMKilothonContender.getContextValue(Context, int, TLongArrayList, int)
   */
  public getContextValue(
    context: Context,
    maximisingPlayer: number,
    nodeHashes: TLongArrayList,
    depth: number
  ): number {
    const ctx2 = context as unknown as {
      trial?(): { over(): boolean };
      active?(p: number): boolean;
    };
    if (
      ctx2.trial?.().over() ||
      !(ctx2.active?.(maximisingPlayer) ?? true)
    ) {
      // We want the latest information to have a more important weight
      this.totalNumberOfTurns +=
        (depth + this.nbSelectActionCalls) * this.nbSelectActionCalls;
      this.nbTerminalPlayouts += this.nbSelectActionCalls;

      this.avgNumberOfTurns = this.totalNumberOfTurns / this.nbTerminalPlayouts;
    }

    return this._ubfmBase.getContextValue(context, maximisingPlayer, nodeHashes, depth);
  }

  //-------------------------------------------------------------------------

  /**
   * Sets the learned policy to use in Selection phase
   * @param policy The policy.
   * @java UBFMKilothonContender.setLearnedSelectionPolicy(SoftmaxPolicy)
   */
  public setLearnedSelectionPolicy(policy: SoftmaxPolicy): void {
    this.learnedSelectionPolicy = policy;
  }

  //-------------------------------------------------------------------------

  /** @java UBFMKilothonContender.supportsGame(Game) */
  public supportsGame(game: Game): boolean {
    if ((game as unknown as { hiddenInformation(): boolean }).hiddenInformation?.())
      return false;

    if ((game as unknown as { hasSubgames(): boolean }).hasSubgames?.())
      return false;

    if (!(game as unknown as { isAlternatingMoveGame(): boolean }).isAlternatingMoveGame?.())
      return false;

    return true;
  }

  //-------------------------------------------------------------------------

  /**
   * Initialising the AI.
   *
   * @java UBFMKilothonContender.initAI(Game, int)
   */
  public initAI(game: Game, playerID: number): void {
    // Fix the parameters
    this._ubfmBase.setSelectionEpsilon(0.2);
    this._ubfmBase.setTTReset(false);
    this._ubfmBase.setIfFullPlayouts(false);
    this._ubfmBase.savingSearchTreeDescription = false;
    this._ubfmBase.debugDisplay = false;

    // Initialise new variables
    this.firstTurn = true;
    this.totalNumberOfTurns = 0;
    this.avgNumberOfTurns = 0.0;
    this.nbTerminalPlayouts = 0;
    this.nbSelectActionCalls = 0;

    this.timeLeft = 60.0;

    if (this._ubfmBase.heuristicsFromMetadata) {
      // Read heuristics from game metadata — escape hatch
      const aiMetadata = (
        game as unknown as { metadata(): { ai(): { heuristics(): Heuristics | null } } }
      ).metadata?.().ai();

      if (aiMetadata !== undefined && aiMetadata.heuristics() !== null) {
        this._ubfmBase._heuristicValueFunction = aiMetadata.heuristics();
      } else {
        // construct default heuristic — Material + MobilityAdvanced not yet ported
        this._ubfmBase._heuristicValueFunction = null;
      }
    }

    const aiMeta = (
      game as unknown as {
        metadata(): {
          ai(): { features(): unknown; trainedFeatureTrees(): unknown };
        };
      }
    ).metadata?.().ai();

    if (aiMeta !== undefined && (aiMeta.features() !== null || aiMeta.trainedFeatureTrees() !== null)) {
      this.setLearnedSelectionPolicy(new SoftmaxFromMetadataSelectionStub(0.3));
      this.learnedSelectionPolicy!.initAI(game, playerID);
    }

    if (this._ubfmBase._heuristicValueFunction !== null) {
      try {
        this._ubfmBase._heuristicValueFunction.init(game);
      } catch (_e) {
        this._ubfmBase._heuristicValueFunction = null;
      }
    }

    // Reset visualisation-purpose fields
    this._ubfmBase.estimatedRootScore = 0.0;
    this._ubfmBase.maxHeuristicEval = 0.0;
    this._ubfmBase.minHeuristicEval = 0.0;
    this._ubfmBase.analysisReport = null;

    this._ubfmBase.currentRootMoves = null;
    this._ubfmBase.rootValueEstimates = null;

    if ((game as unknown as { isStochasticGame(): boolean }).isStochasticGame?.()) {
      this.stochasticGame = true;
      console.log("game is stochastic...");
      this.UCT_Helper = createUCT();
      this.UCT_Helper.initAI(game, playerID);
    }

    // ExIt fields
    this._ubfmBase.lastSearchedRootContext = null;
    this._ubfmBase.lastReturnedMove = null;

    this._ubfmBase.numPlayersInGame = game.players().count();

    // transpositionTable = new TranspositionTableUBFM(numBitsPrimaryCodeForTT)
    // escape hatch — not yet ported
    this._ubfmBase.transpositionTable = null;
  }

  //-------------------------------------------------------------------------
}
