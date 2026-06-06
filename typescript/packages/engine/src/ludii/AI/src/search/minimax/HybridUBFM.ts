// @java AI/src/search/minimax/HybridUBFM.java

/**
 * AI based on Unbounded Best-First Search, using trained action evaluations to
 * complete the heuristic scores with informed playouts.
 * Can also work with no trained features, and will then execute random playouts.
 *
 * @java search/minimax/HybridUBFM.java
 * @author cyprien
 */

//-------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java other.move.Move */
export interface Move {
  toString(): string;
}

/** @java game.Game */
export interface Game {
  players(): { count(): number };
  moves(ctx: unknown): { moves(): FastArrayList<Move> };
  isStochasticGame(): boolean;
  hiddenInformation(): boolean;
  isAlternatingMoveGame(): boolean;
  hasSubgames(): boolean;
  apply(ctx: unknown, move: Move): void;
  playout(ctx: unknown, agents: unknown, maxTime: number, sel: unknown, nb: number, maxMoves: number, rand: unknown): unknown;
  metadata(): {
    ai(): {
      features(): unknown | null;
      trainedFeatureTrees(): unknown | null;
    };
  };
}

/** @java main.collections.FastArrayList */
export interface FastArrayList<T> {
  size(): number;
  get(i: number): T;
  add(item: T): void;
  [Symbol.iterator](): Iterator<T>;
}

/** @java other.context.Context */
export interface Context {
  state(): {
    mover(): number;
    playerToAgent(p: number): number;
    fullHash(ctx: unknown): bigint;
  };
  game(): Game;
  active(p: number): boolean;
  winners(): { contains(p: number): boolean };
  trial(): { over(): boolean };
}

/** @java metadata.ai.heuristics.Heuristics */
export interface Heuristics {
  computeValue(ctx: unknown, player: number, threshold: number): number;
  init(game: unknown): void;
}

/** @java gnu.trove.list.array.TLongArrayList */
export interface TLongArrayList {
  add(v: bigint): void;
  size(): number;
  removeAt(i: number): void;
  get(i: number): bigint;
}

/** @java utils.data_structures.transposition_table.TranspositionTableUBFM */
export interface TranspositionTableUBFM {
  retrieve(zobrist: bigint): UBFMTTData | null;
  store(zobrist: bigint, value: number, depth: number, valueType: number, extra: unknown): void;
}

/** @java utils.data_structures.transposition_table.TranspositionTableUBFM.UBFMTTData */
export interface UBFMTTData {
  value: number;
  valueType: number;
}

/** @java policies.softmax.SoftmaxPolicy (extended for playout) */
export interface SoftmaxPolicy {
  computeLogit(context: Context, move: Move): number;
  initAI(game: Game, playerID: number): void;
  runPlayout(mcts: unknown, context: Context): void;
}

//-------------------------------------------------------------------------
// UBFM constants (escape hatch — UBFM not yet ported, batch 22)
const EXACT_VALUE = 1;
const BETA_INIT = 100000.0;
const ABS_HEURISTIC_WEIGHT_THRESHOLD = 0.01;
const PARANOID_OPP_WIN_SCORE = 10000.0;

// UBFM base escape hatch
export interface UBFMBase {
  friendlyName: string;
  debugDisplay: boolean;
  savingSearchTreeDescription: boolean;
  analysisReport: string;
  searchTreeOutput: { append(s: string): void };
  minHeuristicEval: number;
  maxHeuristicEval: number;
  nbStatesEvaluated: number;
  transpositionTable: TranspositionTableUBFM | null;
  heuristicValueFunction(): Heuristics | null;
  opponents(player: number): number[];
  initAI(game: Game, playerID: number): void;
  supportsGame(game: Game): boolean;
  selectAction(game: Game, context: Context, maxSeconds: number, maxIterations: number, maxDepth: number): Move | null;
  BFSSelection(game: Game, context: Context, maxSeconds: number, depthLimit: number): Move;
  getContextValue(context: Context, maximisingPlayer: number, nodeHashes: TLongArrayList, depth: number): number;
  scoreToValueEst(score: number, alpha: number, beta: number): number;
  stringOfNodeHashes(nodeHashes: TLongArrayList): string;
}

// SoftmaxFromMetadataSelection stub
const SoftmaxFromMetadataSelectionStub: new (epsilon: number) => SoftmaxPolicy =
  class implements SoftmaxPolicy {
    constructor(_eps: number) { /* */ }
    computeLogit(_ctx: Context, _m: Move): number { return 0; }
    initAI(_g: Game, _p: number): void { /* */ }
    runPlayout(_mcts: unknown, context: Context): void {
      // fallback: random playout via game.playout
      context.game().playout(context, null, 1.0, null, 0, 200, null);
    }
  };

// RankUtils escape hatch
const agentUtilities = (context: Context): number[] => {
  return (context as unknown as { _agentUtilities(): number[] })._agentUtilities?.() ?? [];
};

//-------------------------------------------------------------------------

/**
 * HybridUBFM — extends UBFM with heuristic-playout hybrid evaluation.
 *
 * NOTE: UBFM (parent) is in batch 22 — not yet ported. This class holds
 * a UBFM escape-hatch base instance and delegates non-overridden calls to it.
 *
 * @java search.minimax.HybridUBFM
 */
export class HybridUBFM {

  //-------------------------------------------------------------------------

  /** An epsilon parameter to give to the selection policy
   * @java HybridUBFM.epsilon */
  private readonly epsilon: number = 0.5;

  /** Number of playouts for each state's evaluation
   * @java HybridUBFM.nbPlayoutsPerEvaluation */
  protected nbPlayoutsPerEvaluation: number = 6;

  /** Weight of heuristics score in state evaluation
   * @java HybridUBFM.heuristicScoreWeight */
  protected heuristicScoreWeight: number = 0.5;

  //-------------------------------------------------------------------------

  /** A learned policy to use in the selection phase
   * @java HybridUBFM.learnedSelectionPolicy */
  protected learnedSelectionPolicy: SoftmaxPolicy | null = null;

  /** For analysis report
   * @java HybridUBFM.nbPlayoutsDone */
  private nbPlayoutsDone: number = 0;

  /** Maximum absolute value recorded for heuristic scores
   * @java HybridUBFM.maxAbsHeuristicScore */
  protected maxAbsHeuristicScore: number = 0.0;

  /** For the AI visualisation data
   * @java HybridUBFM.maxRegisteredValue */
  maxRegisteredValue: number = 0;
  /** @java HybridUBFM.minRegisteredValue */
  minRegisteredValue: number = 0;

  /** @java UBFM base escape hatch */
  protected readonly _ubfmBase: UBFMBase;

  public friendlyName: string = "Hybrid UBFM";

  //-------------------------------------------------------------------------

  /**
   * Factory method
   * @java HybridUBFM.createHybridUBFM()
   */
  public static createHybridUBFM(): HybridUBFM {
    return new HybridUBFM();
  }

  /**
   * Constructor
   * @java HybridUBFM()
   */
  public constructor() {
    this._ubfmBase = HybridUBFM._makeUBFMBase();
    this.friendlyName = "Hybrid UBFM";
  }

  /** @internal stub UBFM base */
  private static _makeUBFMBase(): UBFMBase {
    return {
      friendlyName: "UBFM",
      debugDisplay: false,
      savingSearchTreeDescription: false,
      analysisReport: "",
      searchTreeOutput: { append: (_s: string) => { /* */ } },
      minHeuristicEval: 0,
      maxHeuristicEval: 0,
      nbStatesEvaluated: 0,
      transpositionTable: null,
      heuristicValueFunction: () => null,
      opponents: (_p) => [],
      initAI: (_g, _p) => { /* */ },
      supportsGame: (_g) => true,
      selectAction: (_g, _c, _ms, _mi, _md) => null,
      BFSSelection: (_g, _c, _ms, _dl) => (null as unknown as Move),
      getContextValue: (_c, _mp, _nh, _d) => 0,
      scoreToValueEst: (_s, _a, _b) => 0,
      stringOfNodeHashes: (_nh) => "",
    } as UBFMBase;
  }

  //-------------------------------------------------------------------------

  /**
   * Override BFSSelection to track playout count.
   *
   * @java HybridUBFM.BFSSelection(Game, Context, double, int)
   */
  public BFSSelection(
    game: Game,
    context: Context,
    maxSeconds: number,
    depthLimit: number
  ): Move {
    this.nbPlayoutsDone = 0;

    const res = this._ubfmBase.BFSSelection(game, context, maxSeconds, depthLimit);

    this._ubfmBase.analysisReport += "(" + String(this.nbPlayoutsDone) + " playouts done)";

    return res;
  }

  //-------------------------------------------------------------------------

  /**
   * Override getContextValue to use hybrid heuristic+playout evaluation.
   *
   * @java HybridUBFM.getContextValue(Context, int, TLongArrayList, int)
   */
  public getContextValue(
    context: Context,
    maximisingPlayer: number,
    nodeHashes: TLongArrayList,
    depth: number
  ): number {
    const state = context.state();
    const zobrist = state.fullHash(context);
    const newMover = state.playerToAgent(state.mover());

    let valueRetrievedFromMemory = false;
    let contextScore: number = NaN;

    const tt = this._ubfmBase.transpositionTable;
    if (tt !== null) {
      const tableData = tt.retrieve(zobrist);

      if (tableData !== null) {
        switch (tableData.valueType) {
          case EXACT_VALUE:
            contextScore = tableData.value;
            valueRetrievedFromMemory = true;
            break;
          default:
            console.error("INVALID TRANSPOSITION TABLE DATA: INVALID VALUE");
            break;
        }
      }
    }

    // Only compute heuristicScore if we didn't have a score registered in the TT
    if (!valueRetrievedFromMemory) {
      if (context.trial().over() || !context.active(maximisingPlayer)) {
        // terminal node (at least for maximising player)
        const utils = agentUtilities(context);
        contextScore = (utils[maximisingPlayer] ?? 0) * BETA_INIT;
      } else {
        let scoreMean = 0.0;

        const hvf = this._ubfmBase.heuristicValueFunction();
        let heuristicScore = hvf
          ? hvf.computeValue(context, maximisingPlayer, ABS_HEURISTIC_WEIGHT_THRESHOLD)
          : 0.0;

        for (const opp of this._ubfmBase.opponents(maximisingPlayer)) {
          if (context.active(opp))
            heuristicScore -= hvf
              ? hvf.computeValue(context, opp, ABS_HEURISTIC_WEIGHT_THRESHOLD)
              : 0.0;
          else if (context.winners().contains(opp))
            heuristicScore -= PARANOID_OPP_WIN_SCORE;
        }

        for (let i = 0; i < this.nbPlayoutsPerEvaluation; ++i) {
          // TempContext clone via escape hatch
          const contextCopy = (
            context as unknown as { _cloneAsTemp(): Context }
          )._cloneAsTemp?.() ?? context;

          this.nbPlayoutsDone += 1;

          if (this.learnedSelectionPolicy !== null)
            this.learnedSelectionPolicy.runPlayout(null, contextCopy);
          else
            context.game().playout(contextCopy, null, 1.0, null, 0, 200, null);

          const utils = agentUtilities(contextCopy);
          scoreMean +=
            (utils[maximisingPlayer] ?? 0) *
            this.maxAbsHeuristicScore /
            this.nbPlayoutsPerEvaluation;
        }

        contextScore =
          heuristicScore * this.heuristicScoreWeight +
          scoreMean * (1.0 - this.heuristicScoreWeight);

        if (this._ubfmBase.debugDisplay) {
          if (Math.random() < 0.1) {
            console.log(
              `heuristic score is ${heuristicScore.toFixed(5)} ` +
              `while avg score is ${scoreMean.toFixed(5)} ` +
              `-> final value is ${contextScore.toFixed(5)}`
            );
          }
        }

        this._ubfmBase.minHeuristicEval = Math.min(
          this._ubfmBase.minHeuristicEval, heuristicScore
        );
        this._ubfmBase.maxHeuristicEval = Math.max(
          this._ubfmBase.maxHeuristicEval, heuristicScore
        );

        this.maxRegisteredValue = Math.max(contextScore, this.maxRegisteredValue);
        this.minRegisteredValue = Math.min(contextScore, this.minRegisteredValue);

        this.maxAbsHeuristicScore = Math.max(
          this.maxAbsHeuristicScore, Math.abs(heuristicScore)
        );
      }

      if (tt !== null)
        tt.store(zobrist, contextScore, depth, EXACT_VALUE, null);

      this._ubfmBase.nbStatesEvaluated += 1;
    }

    if (this._ubfmBase.savingSearchTreeDescription) {
      this._ubfmBase.searchTreeOutput.append(
        "(" +
        this._ubfmBase.stringOfNodeHashes(nodeHashes) +
        "," + String(contextScore) +
        "," + String(newMover === maximisingPlayer ? 1 : 2) +
        "),\n"
      );
    }

    return contextScore;
  }

  //-------------------------------------------------------------------------

  /**
   * @java HybridUBFM.initAI(Game, int)
   */
  public initAI(game: Game, playerID: number): void {
    this._ubfmBase.initAI(game, playerID);

    if (
      game.metadata().ai().features() !== null ||
      game.metadata().ai().trainedFeatureTrees() !== null
    ) {
      this.setLearnedSelectionPolicy(
        new SoftmaxFromMetadataSelectionStub(this.epsilon)
      );
      this.learnedSelectionPolicy!.initAI(game, playerID);
    }

    this.maxAbsHeuristicScore = 0;
  }

  //-------------------------------------------------------------------------

  /**
   * Converts a score into a value estimate in [-1, 1].
   *
   * @param score
   * @param alpha
   * @param beta
   * @return Value estimate in [-1, 1] from unbounded (heuristic) score.
   * @java HybridUBFM.scoreToValueEst(float, float, float)
   */
  public scoreToValueEst(score: number, alpha: number, beta: number): number {
    if (score <= alpha + 10)
      return -1.0;

    if (score >= beta - 10)
      return 1.0;

    this.minRegisteredValue = Math.min(
      this.minRegisteredValue, this._ubfmBase.minHeuristicEval
    );
    this.maxRegisteredValue = Math.max(
      this.maxRegisteredValue, this._ubfmBase.maxHeuristicEval
    );

    // Map to range [-0.8, 0.8] based on most extreme heuristic evaluations observed so far.
    return (
      -0.8 +
      (0.8 - -0.8) *
      ((score - this.minRegisteredValue) /
        (this.maxRegisteredValue - this.minRegisteredValue))
    );
  }

  //-------------------------------------------------------------------------

  /** @java HybridUBFM.selectAction(Game, Context, double, int, int) */
  public selectAction(
    game: Game,
    context: Context,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null {
    return this._ubfmBase.selectAction(game, context, maxSeconds, maxIterations, maxDepth);
  }

  /** @java HybridUBFM.supportsGame(Game) — inherited from UBFM */
  public supportsGame(game: Game): boolean {
    return this._ubfmBase.supportsGame(game);
  }

  //-------------------------------------------------------------------------

  /**
   * Sets the learned policy to use in Selection phase
   * @param policy The policy.
   * @java HybridUBFM.setLearnedSelectionPolicy(SoftmaxPolicy)
   */
  public setLearnedSelectionPolicy(policy: SoftmaxPolicy): void {
    this.learnedSelectionPolicy = policy;
  }

  /**
   * Sets the number of playouts per context evaluations.
   * @param n
   * @java HybridUBFM.setPlayoutsPerEvaluation(int)
   */
  public setPlayoutsPerEvaluation(n: number): void {
    this.nbPlayoutsPerEvaluation = n;
  }

  /**
   * Set the weight of the heuristic evaluation function in the evaluation of a move.
   * @param value
   * @java HybridUBFM.setHeuristicScoreWeight(float)
   */
  public setHeuristicScoreWeight(value: number): void {
    this.heuristicScoreWeight = value;
  }

  //-------------------------------------------------------------------------
}
