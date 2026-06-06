// @java AI/src/search/flat/FlatMonteCarlo.java

/**
 * A simple Flat Monte-Carlo AI.
 *
 * @java search/flat/FlatMonteCarlo.java
 * @author Dennis Soemers
 */

import type {
  AI,
  FastArrayList,
  Game,
  Move,
} from "./HeuristicSampling.js";

// Re-export AI so subclasses in sibling files can extend it
export type { AI };

//-------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java main.collections.FVector */
export interface FVector {
  dim(): number;
  get(i: number): number;
  set(i: number, v: number): void;
}

/** @java other.RankUtils */
interface RankUtils {
  utilities(context: Context): number[];
}

/** @java other.context.Context */
export interface Context {
  state(): { mover(): number; playerToAgent(p: number): number };
  game(): Game;
  trial(): { over(): boolean };
  active(p: number): boolean;
  model(): Model;
}

/** @java other.model.Model */
export interface Model {
  startNewStep(
    context: Context,
    ais: unknown,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number,
    alpha: number,
    flag1: boolean,
    flag2: boolean,
    flag3: boolean
  ): void;
  applyHumanMove(context: Context, move: Move, player: number): void;
  isReady(): boolean;
  randomStep(context: Context, a: unknown, b: unknown): void;
}

/** @java other.AI.AIVisualisationData */
export interface AIVisualisationData {
  aiDistribution: FVector;
  valueEstimates: FVector;
  moves: FastArrayList<Move>;
}

// Rank utility escape hatch
const rankUtils: RankUtils = {
  utilities(_context: Context): number[] {
    // Not yet ported; return zeros
    return [];
  },
};

//-------------------------------------------------------------------------

/** @java AI.base */
abstract class AIBase {
  public friendlyName: string = "";

  public initAI(_game: unknown, _playerID: number): void { /* base */ }
  public closeAI(): void { /* base */ }
  public supportsGame(_game: unknown): boolean { return true; }

  /** @java AI.copyContext(Context) */
  protected copyContext(context: Context): Context {
    return (
      context as unknown as { _copyContext(): Context }
    )._copyContext?.() ?? context;
  }

  public abstract selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null;
}

//-------------------------------------------------------------------------

/**
 * A simple Flat Monte-Carlo AI.
 *
 * @java search.flat.FlatMonteCarlo
 */
export class FlatMonteCarlo extends AIBase {

  //-------------------------------------------------------------------------

  /** Our player index
   * @java FlatMonteCarlo.player */
  protected player: number = -1;

  /** Sums of scores of the last search we ran
   * @java FlatMonteCarlo.lastScoreSums */
  protected lastScoreSums: number[] | null = null;

  /** Visit counts of the last search we ran
   * @java FlatMonteCarlo.lastVisitCounts */
  protected lastVisitCounts: number[] | null = null;

  /** List of legal actions for which we ran last search
   * @java FlatMonteCarlo.lastActionList */
  protected lastActionList: FastArrayList<Move> | null = null;

  /** We'll automatically return our move after at most this number of seconds if we only have one move
   * @java FlatMonteCarlo.autoPlaySeconds */
  protected autoPlaySeconds: number = 0.5;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java FlatMonteCarlo()
   */
  public constructor() {
    super();
    this.friendlyName = "Flat MC";
  }

  //-------------------------------------------------------------------------

  /**
   * @java FlatMonteCarlo.selectAction(Game, Context, double, int, int)
   */
  public override selectAction(
    game: Game,
    context: Context,
    maxSeconds: number,
    maxIterations: number,
    _maxDepth: number
  ): Move | null {
    const startTime = Date.now();
    let stopTime = (maxSeconds > 0.0) ? startTime + maxSeconds * 1000 : Number.MAX_SAFE_INTEGER;
    const maxIts = (maxIterations >= 0) ? maxIterations : Number.MAX_SAFE_INTEGER;

    let legalMoves: FastArrayList<Move> = game.moves(context).moves();

    if (!game.isAlternatingMoveGame()) {
      // AIUtils.extractMovesForMover — escape hatch
      legalMoves = (
        legalMoves as unknown as { extractForMover(p: number): FastArrayList<Move> }
      ).extractForMover?.(this.player) ?? legalMoves;
    }

    const numActions = legalMoves.size();

    if (numActions === 1) {
      // play faster if we only have one move available anyway
      if (this.autoPlaySeconds >= 0.0 && this.autoPlaySeconds < maxSeconds)
        stopTime = startTime + this.autoPlaySeconds * 1000;
    }

    const sumScores: number[] = new Array(numActions).fill(0);
    const numVisits: number[] = new Array(numActions).fill(0);

    let numIterations = 0;

    // Simulate until we have to stop
    while (numIterations < maxIts && Date.now() < stopTime) {
      const copyContext = this.copyContext(context);
      const model = copyContext.model();

      model.startNewStep(copyContext, null, 1.0, -1, -1, 0.0, false, false, false);

      const firstAction = Math.trunc(Math.random() * numActions);
      model.applyHumanMove(copyContext, legalMoves.get(firstAction), this.player);

      if (!model.isReady()) {
        // simultaneous-move game — randomly select actions for opponents
        model.randomStep(copyContext, null, null);
      }

      if (!copyContext.trial().over()) {
        copyContext.game().playout(copyContext, null, 1.0, null, 0, -1, null);
      }

      numVisits[firstAction] = (numVisits[firstAction] ?? 0) + 1;

      const utilities = rankUtils.utilities(copyContext);
      sumScores[firstAction] = (sumScores[firstAction] ?? 0) + (utilities[this.player] ?? 0);

      ++numIterations;
    }

    const bestActions: Move[] = [];
    let maxAvgScore = -Infinity;

    for (let i = 0; i < numActions; ++i) {
      const nv = numVisits[i] ?? 0;
      const ss = sumScores[i] ?? 0;
      const avgScore = nv === 0 ? -100.0 : ss / nv;

      if (avgScore > maxAvgScore) {
        maxAvgScore = avgScore;
        bestActions.length = 0;
        bestActions.push(legalMoves.get(i));
      } else if (avgScore === maxAvgScore) {
        bestActions.push(legalMoves.get(i));
      }
    }

    this.lastScoreSums = sumScores;
    this.lastVisitCounts = numVisits;
    this.lastActionList = legalMoves;

    return bestActions[Math.trunc(Math.random() * bestActions.length)] ?? null;
  }

  //-------------------------------------------------------------------------

  /**
   * @java FlatMonteCarlo.initAI(Game, int)
   */
  public override initAI(_game: unknown, playerID: number): void {
    this.player = playerID;
    this.lastScoreSums = null;
    this.lastVisitCounts = null;
    this.lastActionList = null;
  }

  /**
   * @return Sums of scores of last search
   * @java FlatMonteCarlo.lastScoreSums()
   */
  public lastScoreSumsGetter(): number[] | null {
    return this.lastScoreSums;
  }

  /**
   * @return Visit counts of last search
   * @java FlatMonteCarlo.lastVisitCounts()
   */
  public lastVisitCountsGetter(): number[] | null {
    return this.lastVisitCounts;
  }

  /**
   * @return List of legal actions of last search
   * @java FlatMonteCarlo.lastActionList()
   */
  public lastActionListGetter(): FastArrayList<Move> | null {
    return this.lastActionList;
  }

  /** @java FlatMonteCarlo.supportsGame(Game) */
  public override supportsGame(game: Game): boolean {
    if ((game as unknown as { isDeductionPuzzle(): boolean }).isDeductionPuzzle?.())
      return false;

    return true;
  }

  /** @java FlatMonteCarlo.aiVisualisationData() */
  public aiVisualisationData(): AIVisualisationData | null {
    if (this.lastActionList === null)
      return null;

    // FVector not yet ported — escape hatch
    const aiDistribution = {
      dim: (): number => this.lastActionList!.size(),
      get: (i: number): number =>
        (this.lastScoreSums![i] ?? 0) / (this.lastVisitCounts![i] ?? 1),
      set: (_i: number, _v: number): void => { /* no-op */ },
    } as FVector;

    const valueEstimates = {
      dim: (): number => this.lastActionList!.size(),
      get: (i: number): number =>
        (this.lastScoreSums![i] ?? 0) / (this.lastVisitCounts![i] ?? 1),
      set: (_i: number, _v: number): void => { /* no-op */ },
    } as FVector;

    return {
      aiDistribution,
      valueEstimates,
      moves: this.lastActionList,
    };
  }

  //-------------------------------------------------------------------------
}
