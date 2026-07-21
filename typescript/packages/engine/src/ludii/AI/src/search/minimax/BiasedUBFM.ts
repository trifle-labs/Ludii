// @java AI/src/search/minimax/BiasedUBFM.java

/**
 * AI based on Unbounded Best-First Minimax, which uses the action evaluation
 * to select a small number of actions that will really be simulated (the most
 * promising ones). If selectionEpsilon != 0, then any other move can still be
 * randomly picked for exploration with a probability of selectionEpsilon.
 *
 * @java search/minimax/BiasedUBFM.java
 * @author cyprien
 */

//-------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java other.move.Move */
export interface Move {
  toString(): string;
}

/** @java main.collections.FastArrayList */
export interface FastArrayList<T> {
  size(): number;
  get(i: number): T;
  add(item: T): void;
  [Symbol.iterator](): Iterator<T>;
}

/** @java main.collections.FVector */
export interface FVector {
  dim(): number;
  get(i: number): number;
  set(i: number, v: number): void;
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
  metadata(): {
    ai(): {
      features(): unknown | null;
      trainedFeatureTrees(): unknown | null;
    };
  };
}

/** @java other.context.Context */
export interface Context {
  state(): { mover(): number; playerToAgent(p: number): number };
  game(): Game;
  active(p: number): boolean;
  winners(): { contains(p: number): boolean };
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

/** @java policies.softmax.SoftmaxPolicy */
export interface SoftmaxPolicy {
  computeLogit(context: Context, move: Move): number;
  initAI(game: Game, playerID: number): void;
}

/** @java utils.data_structures.ScoredIndex */
export interface ScoredIndex {
  index: number;
  score: number;
}

// UBFM escape hatch — not yet ported (batch 22)
export interface UBFM {
  friendlyName: string;
  selectAction(
    game: Game,
    context: Context,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null;
  initAI(game: Game, playerID: number): void;
  supportsGame(game: Game): boolean;
  estimateMovesValues(
    legalMoves: FastArrayList<Move>,
    context: Context,
    maximisingPlayer: number,
    nodeHashes: TLongArrayList,
    depth: number,
    stopTime: number
  ): FVector;
  getContextValue(
    context: Context,
    maximisingPlayer: number,
    nodeHashes: TLongArrayList,
    depth: number
  ): number;
  heuristicValueFunction(): Heuristics | null;
  opponents(player: number): number[];
  readonly BETA_INIT: number;
  readonly ABS_HEURISTIC_WEIGHT_THRESHOLD: number;
  readonly PARANOID_OPP_WIN_SCORE: number;
  wantsInterrupt: boolean;
}

// SoftmaxFromMetadataSelection stub
const SoftmaxFromMetadataSelectionStub: new (epsilon: number) => SoftmaxPolicy =
  class implements SoftmaxPolicy {
    constructor(_eps: number) { /* */ }
    computeLogit(_ctx: Context, _m: Move): number { return 0; }
    initAI(_g: Game, _p: number): void { /* */ }
  };

//-------------------------------------------------------------------------

/**
 * AI based on Unbounded Best-First Minimax with learned action evaluation.
 *
 * NOTE: UBFM (the parent class) is in batch 22 (not yet ported).
 * BiasedUBFM extends UBFM via an escape-hatch approach: it stores an
 * as-unknown UBFM base and delegates non-overridden calls to it.
 *
 * @java search.minimax.BiasedUBFM
 */
export class BiasedUBFM {

  //-------------------------------------------------------------------------

  /** Number of moves that are really evaluated with the heuristics at each step of the exploration.
   * @java BiasedUBFM.nbStateEvaluationsPerNode */
  private nbStateEvaluationsPerNode: number = 6;

  //-------------------------------------------------------------------------

  /** A learned policy to use in Selection phase
   * @java BiasedUBFM.learnedSelectionPolicy */
  protected learnedSelectionPolicy: SoftmaxPolicy | null = null;

  /** @java UBFM base instance (escape hatch — UBFM not yet ported) */
  protected readonly _ubfmBase: UBFM;

  public friendlyName: string = "Biased UBFM";

  //-------------------------------------------------------------------------

  /**
   * Factory method
   * @java BiasedUBFM.createBiasedUBFM()
   */
  public static createBiasedUBFM(): BiasedUBFM {
    return new BiasedUBFM();
  }

  /**
   * Constructor
   * @java BiasedUBFM()
   * @java BiasedUBFM(Heuristics)
   */
  public constructor(heuristics?: Heuristics) {
    // Delegate to UBFM escape hatch
    this._ubfmBase = BiasedUBFM._makeUBFMBase(heuristics);
    this.setLearnedSelectionPolicy(new SoftmaxFromMetadataSelectionStub(0.0));
    this.friendlyName = "Biased UBFM";
  }

  /** @internal Creates a UBFM base instance via escape hatch */
  private static _makeUBFMBase(_heuristics?: Heuristics): UBFM {
    // UBFM not yet ported — provide minimal stub
    return {
      friendlyName: "UBFM",
      selectAction: (_g, _c, _ms, _mi, _md) => null,
      initAI: (_g, _p) => { /* */ },
      supportsGame: (_g) => true,
      estimateMovesValues: (_lm, _ctx, _mp, _nh, _d, _st): FVector => ({
        dim: () => 0, get: () => 0, set: () => { /* */ },
      }),
      getContextValue: (_ctx, _mp, _nh, _d) => 0,
      heuristicValueFunction: () => null,
      opponents: (_p) => [],
      BETA_INIT: 100000.0,
      ABS_HEURISTIC_WEIGHT_THRESHOLD: 0.01,
      PARANOID_OPP_WIN_SCORE: 10000.0,
      wantsInterrupt: false,
    } as UBFM;
  }

  //-------------------------------------------------------------------------

  /**
   * Overrides UBFM.estimateMovesValues to use the learned selection policy.
   *
   * @java BiasedUBFM.estimateMovesValues(FastArrayList, Context, int, TLongArrayList, int, long)
   */
  public estimateMovesValues(
    legalMoves: FastArrayList<Move>,
    context: Context,
    maximisingPlayer: number,
    nodeHashes: TLongArrayList,
    depth: number,
    stopTime: number
  ): FVector {
    const numLegalMoves = legalMoves.size();
    const game = context.game();
    const state = context.state();
    const mover = state.playerToAgent(state.mover());

    const consideredMoveIndices: ScoredIndex[] = new Array(numLegalMoves);

    for (let i = 0; i < numLegalMoves; ++i) {
      const m = legalMoves.get(i);
      const actionValue = this.learnedSelectionPolicy!.computeLogit(context, m);
      consideredMoveIndices[i] = { index: i, score: actionValue };
    }
    // Sort descending by score
    consideredMoveIndices.sort((a, b) => b.score - a.score);

    const BETA_INIT = this._ubfmBase.BETA_INIT;
    const moveScoresArr: number[] = new Array(numLegalMoves).fill(
      mover === maximisingPlayer ? -BETA_INIT + 1 : BETA_INIT - 1
    );

    for (let k = 0; k < Math.min(this.nbStateEvaluationsPerNode, numLegalMoves); ++k) {
      const i = (consideredMoveIndices[k] as ScoredIndex).index;
      const m = legalMoves.get(i);

      // TempContext clone via escape hatch
      const contextCopy = (
        context as unknown as { _cloneAsTemp(): Context }
      )._cloneAsTemp?.() ?? context;

      game.apply(contextCopy as unknown, m);

      (nodeHashes as unknown as { add(v: bigint): void }).add(
        BigInt(
          (contextCopy as unknown as { state(): { fullHash(c: unknown): bigint } })
            .state().fullHash(contextCopy)
        )
      );
      const heuristicScore = this._ubfmBase.getContextValue(
        contextCopy, maximisingPlayer, nodeHashes, depth
      );
      nodeHashes.removeAt(nodeHashes.size() - 1);

      moveScoresArr[i] = heuristicScore;

      if (Date.now() >= stopTime || this._ubfmBase.wantsInterrupt) {
        break;
      }
    }

    return {
      dim: (): number => moveScoresArr.length,
      get: (i: number): number => moveScoresArr[i] ?? 0,
      set: (i: number, v: number): void => { moveScoresArr[i] = v; },
    };
  }

  //-------------------------------------------------------------------------

  /** @java BiasedUBFM.initAI(Game, int) */
  public initAI(game: Game, playerID: number): void {
    this._ubfmBase.initAI(game, playerID);

    // Instantiate feature sets for selection policy
    if (this.learnedSelectionPolicy !== null)
      this.learnedSelectionPolicy.initAI(game, playerID);
  }

  /** @java BiasedUBFM.supportsGame(Game) */
  public supportsGame(game: Game): boolean {
    if (game.isStochasticGame())
      return false;

    if (game.hiddenInformation())
      return false;

    if (game.hasSubgames())
      return false;

    if (!game.isAlternatingMoveGame())
      return false;

    return (
      game.metadata().ai().features() !== null ||
      game.metadata().ai().trainedFeatureTrees() !== null
    );
  }

  //-------------------------------------------------------------------------

  /** @java BiasedUBFM.selectAction(Game, Context, double, int, int) */
  public selectAction(
    game: Game,
    context: Context,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null {
    return this._ubfmBase.selectAction(game, context, maxSeconds, maxIterations, maxDepth);
  }

  //-------------------------------------------------------------------------

  /**
   * Sets the learned policy to use in Selection phase
   * @param policy The policy.
   * @java BiasedUBFM.setLearnedSelectionPolicy(SoftmaxPolicy)
   */
  public setLearnedSelectionPolicy(policy: SoftmaxPolicy): void {
    this.learnedSelectionPolicy = policy;
  }

  /**
   * Sets the number of moves that will be really evaluated with a simulation
   * and a call to the heuristicValue function.
   * @param value
   * @java BiasedUBFM.setNbStateEvaluationsPerNode(int)
   */
  public setNbStateEvaluationsPerNode(value: number): void {
    this.nbStateEvaluationsPerNode = value;
  }

  //-------------------------------------------------------------------------
}
