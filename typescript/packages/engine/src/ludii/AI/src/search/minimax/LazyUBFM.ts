// @java AI/src/search/minimax/LazyUBFM.java

import { UBFM } from "./UBFM.js";
import type { FastArrayList, FVector } from "../../training/expert_iteration/ExpertPolicy.js";
import type { Move } from "../../training/expert_iteration/ExpertPolicy.js";

// Escape-hatch types for not-yet-ported dependencies

/** @java metadata.ai.heuristics.Heuristics */
interface Heuristics {
  init(game: unknown): void;
  computeValue(context: unknown, player: number, threshold: number): number;
}

/** @java other.context.Context */
interface Context {
  game(): GameFull;
  trial(): Trial;
  state(): State;
  active(player: number): boolean;
  winners(): { contains(p: number): boolean };
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
  metadata(): {
    ai(): {
      heuristics(): Heuristics | null;
      features(): unknown | null;
      trainedFeatureTrees(): unknown | null;
    } | null;
  };
  isAlternatingMoveGame(): boolean;
  isStochasticGame(): boolean;
  hiddenInformation(): boolean;
  hasSubgames(): boolean;
}

/** @java policies.softmax.SoftmaxPolicy */
interface SoftmaxPolicy {
  computeLogit(context: unknown, move: Move): number;
  initAI(game: unknown, playerID: number): void;
}

/** @java policies.softmax.SoftmaxFromMetadataSelection */
interface SoftmaxFromMetadataSelectionConstructor {
  new(epsilon: number): SoftmaxPolicy;
}
const SoftmaxFromMetadataSelectionClass = null as unknown as SoftmaxFromMetadataSelectionConstructor;

//-------------------------------------------------------------------------

/**
 * AI based on Unbounded Best-First Search, using trained action evaluations to complete the heuristic scores.
 *
 * @java search.minimax.LazyUBFM
 * @author cyprien
 */
export class LazyUBFM extends UBFM {

  //-------------------------------------------------------------------------

  /** Weight of the action evaluation when linearly combined with the heuristic score */
  private static actionEvaluationWeight: number = 0.5;

  //-------------------------------------------------------------------------

  /** A learned policy to use in for the action evaluation */
  protected learnedSelectionPolicy: SoftmaxPolicy | null = null;

  /**
   * A boolean to know if it is the first turn the AI is playing on this game.
   * If so, it will just use a basic UBFM approach to have an idea of the heuristics range.
   */
  firstTurn: boolean = true;

  /** Different fields to have an idea of how to combine action evaluations and heuristic scores properly */
  estimatedHeuristicScoresRange: number = 0;
  maxActionLogit: number = -Infinity;
  minActionLogit: number = Infinity;
  estimatedActionLogitRange: number = 0;
  actionLogitSum: number = 0;
  actionLogitComputations: number = 0;
  estimatedActionLogitMean: number = 0;

  /** For the AI visualisation data: */
  maxRegisteredValue: number = -Infinity;
  minRegisteredValue: number = Infinity;

  //-------------------------------------------------------------------------

  /** @java LazyUBFM.createLazyUBFM() */
  public static createLazyUBFM(): LazyUBFM {
    return new LazyUBFM();
  }

  /**
   * Constructor:
   * @java LazyUBFM()
   */
  public constructor();

  /**
   * Constructor
   * @param heuristics
   * @java LazyUBFM(Heuristics)
   */
  public constructor(heuristics: Heuristics);

  public constructor(heuristicsOrUndefined?: Heuristics) {
    super(heuristicsOrUndefined as Heuristics);
    this.setLearnedSelectionPolicy(
      SoftmaxFromMetadataSelectionClass !== null
        ? new SoftmaxFromMetadataSelectionClass(0)
        : { computeLogit: () => 0, initAI: () => { /* stub */ } } as SoftmaxPolicy
    );
    this.friendlyName = "Lazy UBFM";
  }

  //-------------------------------------------------------------------------

  /** @java LazyUBFM.selectAction(Game, Context, double, int, int) */
  public override selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move {
    const bestMove = super.selectAction(game, context, maxSeconds, maxIterations, maxDepth);
    // super.selectAction will call this class's own estimateMovesValues

    this.firstTurn = false;

    this.estimatedHeuristicScoresRange = this.maxHeuristicEval - this.minHeuristicEval;
    this.estimatedActionLogitRange = this.maxActionLogit - this.minActionLogit;
    this.estimatedActionLogitMean = this.actionLogitSum / this.actionLogitComputations;

    return bestMove;
  }

  /** @java LazyUBFM.estimateMovesValues(FastArrayList, Context, int, TLongArrayList, int, long) */
  protected override estimateMovesValues(
    legalMoves: FastArrayList<Move>,
    context: Context,
    maximisingPlayer: number,
    nodeHashes: bigint[],
    depth: number,
    stopTime: number
  ): FVector {
    const state = context.state();
    const mover = state.playerToAgent(state.mover());

    const heuristicScore = this.getContextValue(context, maximisingPlayer, nodeHashes, mover);

    if (this.savingSearchTreeDescription) {
      this.searchTreeOutput.push(
        "(" + UBFM.stringOfNodeHashes(nodeHashes) + "," + heuristicScore + "," + (mover === maximisingPlayer ? 1 : 2) + "),\n"
      );
    }

    const numLegalMoves = legalMoves.size();
    const moveScoresArr = new Float32Array(numLegalMoves);

    // Computing action scores (stored in moveScores)
    for (let i = 0; i < numLegalMoves; ++i) {
      const m = legalMoves.get(i);

      const actionValue = this.learnedSelectionPolicy!.computeLogit(context, m);

      this.actionLogitSum += actionValue;
      this.actionLogitComputations += 1;
      this.maxActionLogit = Math.max(actionValue, this.maxActionLogit);
      this.minActionLogit = Math.min(actionValue, this.minActionLogit);

      moveScoresArr[i] = actionValue;
    }

    if (this.firstTurn) {
      // Uses the classical UBFM approach on the first turn.
      const res = super.estimateMovesValues(legalMoves, context, maximisingPlayer, nodeHashes, depth, stopTime);
      return res;
    } else {
      const sign = (maximisingPlayer === mover) ? 1 : -1;

      for (let i = 0; i < numLegalMoves; i++) {
        let r = 1;
        if (this.debugDisplay) {
          r = Math.random(); // just for occasional display
          if (r < 0.05) {
            console.log(
              "action score is " + moveScoresArr[i] + " and heuristicScore is " + heuristicScore
            );
          }
        }

        // (*2 because the maximal gap with the mean is about half of the range)
        const actionScore = (LazyUBFM.actionEvaluationWeight * ((moveScoresArr[i] ?? 0) - this.estimatedActionLogitMean) * sign * this.estimatedHeuristicScoresRange * 2) / this.estimatedActionLogitRange;

        moveScoresArr[i] = heuristicScore + actionScore;

        this.maxRegisteredValue = Math.max(heuristicScore + actionScore, this.maxRegisteredValue);
        this.minRegisteredValue = Math.min(heuristicScore + actionScore, this.minRegisteredValue);

        if (this.debugDisplay) {
          if (r < 0.05) {
            console.log("-> eval is " + moveScoresArr[i]);
          }
        }
      }

      return this._makeVector(moveScoresArr);
    }
  }

  //-------------------------------------------------------------------------

  /** @java LazyUBFM.initAI(Game, int) */
  public override initAI(game: unknown, playerID: number): void {
    super.initAI(game, playerID);

    // Instantiate feature sets for selection policy
    if (this.learnedSelectionPolicy !== null) {
      this.learnedSelectionPolicy.initAI(game, playerID);
    }

    this.firstTurn = true;
    this.actionLogitComputations = 0;
    this.actionLogitSum = 0;
    this.maxActionLogit = -Infinity;
    this.minActionLogit = Infinity;
    this.maxRegisteredValue = -Infinity;
    this.minRegisteredValue = Infinity;
  }

  /** @java LazyUBFM.supportsGame(Game) */
  public override supportsGame(game: unknown): boolean {
    const g = game as GameFull;
    if (g.isStochasticGame()) return false;
    if (g.hiddenInformation()) return false;
    if (g.hasSubgames()) return false; // Cant properly init most heuristics
    if (!g.isAlternatingMoveGame()) return false;
    const meta = g.metadata().ai();
    return (meta !== null && (meta.features() !== null || meta.trainedFeatureTrees() !== null));
  }

  //-------------------------------------------------------------------------

  /** @java LazyUBFM.scoreToValueEst(float, float, float) */
  public override scoreToValueEst(score: number, alpha: number, beta: number): number {
    if (score <= alpha + 10) return -1.0;
    if (score >= beta - 10) return 1.0;

    this.minRegisteredValue = Math.min(this.minRegisteredValue, this.minHeuristicEval);
    this.maxRegisteredValue = Math.max(this.maxRegisteredValue, this.maxHeuristicEval);

    // Map to range [-0.8, 0.8] based on most extreme heuristic evaluations observed so far.
    return -0.8 + (0.8 - -0.8) * ((score - this.minRegisteredValue) / (this.maxRegisteredValue - this.minRegisteredValue));
  }

  //-------------------------------------------------------------------------

  /**
   * Sets the learned policy to use in Selection phase
   * @java LazyUBFM.setLearnedSelectionPolicy(SoftmaxPolicy)
   */
  public setLearnedSelectionPolicy(policy: SoftmaxPolicy): void {
    this.learnedSelectionPolicy = policy;
  }

  /**
   * Sets the weight of the action evaluation in the context evaluations.
   * @java LazyUBFM.setActionEvaluationWeight(float)
   */
  public static setActionEvaluationWeight(value: number): void {
    LazyUBFM.actionEvaluationWeight = value;
  }
}
