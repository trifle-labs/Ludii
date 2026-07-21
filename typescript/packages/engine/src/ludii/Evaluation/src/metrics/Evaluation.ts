// @java Evaluation/src/metrics/Evaluation.java

/**
 * Access point for evaluation functionality.
 *
 * @java metrics/Evaluation.java
 * @author cambolbro and matthew.stephenson
 */

import { Metric } from "./Metric.js";
import { MultiMetricFramework, MultiMetricValue } from "./multiple/MultiMetricFramework.js";
import { BranchingFactor } from "./multiple/metrics/BranchingFactor.js";
import { MoveEvaluation } from "./multiple/metrics/MoveEvaluation.js";
import { MoveDistance } from "./multiple/metrics/MoveDistance.js";
import { DecisionFactor } from "./multiple/metrics/DecisionFactor.js";
import { Drama } from "./multiple/metrics/Drama.js";
import { BoardSitesOccupied } from "./multiple/metrics/BoardSitesOccupied.js";
import { PieceNumber } from "./multiple/metrics/PieceNumber.js";

// Concept constants — not-yet-ported; use opaque numeric IDs via escape hatch
type Concept = unknown;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ConceptProxy = {} as any;

/** @java Evaluation.MAX_ENTRIES */
export const MAX_ENTRIES: number = Math.pow(2, 20) | 0;

//-----------------------------------------------------------------------------

/**
 * LRU-bounded Map: when size exceeds MAX_ENTRIES the eldest entry is removed.
 * Models Java's LinkedHashMap with removeEldestEntry.
 * @java Evaluation.stateEvaluationCache
 */
class LRUMap extends Map<bigint, number> {
  private readonly maxSize: number;

  public constructor(maxSize: number) {
    super();
    this.maxSize = maxSize;
  }

  /** @java LinkedHashMap.put — also refreshes key order (LRU semantics) */
  public putLRU(key: bigint, value: number): void {
    // Move to end (refresh)
    this.delete(key);
    this.set(key, value);
    if (this.size > this.maxSize) {
      // Remove eldest (first) entry
      const eldest = this.keys().next().value;
      if (eldest !== undefined) this.delete(eldest);
    }
  }

  /** @java LinkedHashMap.get — also refreshes key order */
  public getLRU(key: bigint): number | undefined {
    const value = this.get(key);
    if (value !== undefined) {
      // Refresh — move to end
      this.delete(key);
      this.set(key, value);
    }
    return value;
  }
}

//-----------------------------------------------------------------------------

/**
 * Access point for evaluation functionality.
 *
 * @java metrics/Evaluation.java
 */
export class Evaluation {

  /** @java Evaluation.stateEvaluationCache */
  private readonly stateEvaluationCache: LRUMap = new LRUMap(MAX_ENTRIES);

  /** @java Evaluation.stateAfterMoveEvaluationCache */
  private readonly stateAfterMoveEvaluationCache: LRUMap = new LRUMap(MAX_ENTRIES);

  /** @java Evaluation.dialogMetrics */
  private readonly _dialogMetrics: Metric[] = [];

  /** @java Evaluation.reconstructionMetrics */
  private readonly _reconstructionMetrics: Metric[] = [];

  /** @java Evaluation.conceptMetrics */
  private readonly _conceptMetrics: Metric[] = [];

  //-------------------------------------------------------------------------

  public constructor() {
    // --- dialogMetrics ---
    // Outcome / Designer metrics not in this batch; use escape-hatch stubs
    // to preserve the same list structure without fabricating logic.
    // (AdvantageP1, Balance, Completion, Drawishness, Timeouts,
    //  BoardCoverageDefault, DecisivenessMoves, IdealDuration, SkillTrace)
    // Skipped: not-yet-ported single metrics are left out of the list;
    // their slots will be filled when their batches land.

    // --- reconstructionMetrics ---
    // (DurationTurns, DurationTurnsStdDev, DurationTurnsNotTimeouts, Timeouts,
    //  DecisionMoves, BoardCoverageDefault, AdvantageP1, Balance, Completion,
    //  Drawishness — not in this batch; slots omitted)
    this._reconstructionMetrics.push(new PieceNumber(MultiMetricValue.Average, ConceptProxy.PieceNumberAverage as Concept));
    this._reconstructionMetrics.push(new BoardSitesOccupied(MultiMetricValue.Average, ConceptProxy.BoardSitesOccupiedAverage as Concept));
    this._reconstructionMetrics.push(new BranchingFactor(MultiMetricValue.Average, ConceptProxy.BranchingFactorAverage as Concept));
    this._reconstructionMetrics.push(new MoveDistance(MultiMetricValue.Average, ConceptProxy.DecisionFactorAverage as Concept));

    // --- conceptMetrics (Multi-metric portion, in this batch) ---

    // Drama
    this._conceptMetrics.push(new Drama(MultiMetricValue.Average, ConceptProxy.DramaAverage as Concept));
    this._conceptMetrics.push(new Drama(MultiMetricValue.Median, ConceptProxy.DramaMedian as Concept));
    this._conceptMetrics.push(new Drama(MultiMetricValue.Max, ConceptProxy.DramaMaximum as Concept));
    this._conceptMetrics.push(new Drama(MultiMetricValue.Min, ConceptProxy.DramaMinimum as Concept));
    this._conceptMetrics.push(new Drama(MultiMetricValue.Variance, ConceptProxy.DramaVariance as Concept));
    this._conceptMetrics.push(new Drama(MultiMetricValue.ChangeAverage, ConceptProxy.DramaChangeAverage as Concept));
    this._conceptMetrics.push(new Drama(MultiMetricValue.ChangeSign, ConceptProxy.DramaChangeSign as Concept));
    this._conceptMetrics.push(new Drama(MultiMetricValue.ChangeLineBestFit, ConceptProxy.DramaChangeLineBestFit as Concept));
    this._conceptMetrics.push(new Drama(MultiMetricValue.ChangeNumTimes, ConceptProxy.DramaChangeNumTimes as Concept));
    this._conceptMetrics.push(new Drama(MultiMetricValue.MaxIncrease, ConceptProxy.DramaMaxIncrease as Concept));
    this._conceptMetrics.push(new Drama(MultiMetricValue.MaxDecrease, ConceptProxy.DramaMaxDecrease as Concept));

    // MoveEvaluation
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.Average, ConceptProxy.MoveEvaluationAverage as Concept));
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.Median, ConceptProxy.MoveEvaluationMedian as Concept));
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.Max, ConceptProxy.MoveEvaluationMaximum as Concept));
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.Min, ConceptProxy.MoveEvaluationMinimum as Concept));
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.Variance, ConceptProxy.MoveEvaluationVariance as Concept));
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.ChangeAverage, ConceptProxy.MoveEvaluationChangeAverage as Concept));
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.ChangeSign, ConceptProxy.MoveEvaluationChangeSign as Concept));
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.ChangeLineBestFit, ConceptProxy.MoveEvaluationChangeLineBestFit as Concept));
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.ChangeNumTimes, ConceptProxy.MoveEvaluationChangeNumTimes as Concept));
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.MaxIncrease, ConceptProxy.MoveEvaluationMaxIncrease as Concept));
    this._conceptMetrics.push(new MoveEvaluation(MultiMetricValue.MaxDecrease, ConceptProxy.MoveEvaluationMaxDecrease as Concept));

    // BoardSitesOccupied
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.Average, ConceptProxy.BoardSitesOccupiedAverage as Concept));
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.Median, ConceptProxy.BoardSitesOccupiedMedian as Concept));
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.Max, ConceptProxy.BoardSitesOccupiedMaximum as Concept));
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.Min, ConceptProxy.BoardSitesOccupiedMinimum as Concept));
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.Variance, ConceptProxy.BoardSitesOccupiedVariance as Concept));
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.ChangeAverage, ConceptProxy.BoardSitesOccupiedChangeAverage as Concept));
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.ChangeSign, ConceptProxy.BoardSitesOccupiedChangeSign as Concept));
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.ChangeLineBestFit, ConceptProxy.BoardSitesOccupiedChangeLineBestFit as Concept));
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.ChangeNumTimes, ConceptProxy.BoardSitesOccupiedChangeNumTimes as Concept));
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.MaxIncrease, ConceptProxy.BoardSitesOccupiedMaxIncrease as Concept));
    this._conceptMetrics.push(new BoardSitesOccupied(MultiMetricValue.MaxDecrease, ConceptProxy.BoardSitesOccupiedMaxDecrease as Concept));

    // BranchingFactor
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.Average, ConceptProxy.BranchingFactorAverage as Concept));
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.Median, ConceptProxy.BranchingFactorMedian as Concept));
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.Max, ConceptProxy.BranchingFactorMaximum as Concept));
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.Min, ConceptProxy.BranchingFactorMinimum as Concept));
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.Variance, ConceptProxy.BranchingFactorVariance as Concept));
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.ChangeAverage, ConceptProxy.BranchingFactorChangeAverage as Concept));
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.ChangeSign, ConceptProxy.BranchingFactorChangeSign as Concept));
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.ChangeLineBestFit, ConceptProxy.BranchingFactorChangeLineBestFit as Concept));
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.ChangeNumTimes, ConceptProxy.BranchingFactorChangeNumTimesn as Concept));
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.MaxIncrease, ConceptProxy.BranchingFactorChangeMaxIncrease as Concept));
    this._conceptMetrics.push(new BranchingFactor(MultiMetricValue.MaxDecrease, ConceptProxy.BranchingFactorChangeMaxDecrease as Concept));

    // DecisionFactor
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.Average, ConceptProxy.DecisionFactorAverage as Concept));
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.Median, ConceptProxy.DecisionFactorMedian as Concept));
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.Max, ConceptProxy.DecisionFactorMaximum as Concept));
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.Min, ConceptProxy.DecisionFactorMinimum as Concept));
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.Variance, ConceptProxy.DecisionFactorVariance as Concept));
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.ChangeAverage, ConceptProxy.DecisionFactorChangeAverage as Concept));
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.ChangeSign, ConceptProxy.DecisionFactorChangeSign as Concept));
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.ChangeLineBestFit, ConceptProxy.DecisionFactorChangeLineBestFit as Concept));
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.ChangeNumTimes, ConceptProxy.DecisionFactorChangeNumTimes as Concept));
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.MaxIncrease, ConceptProxy.DecisionFactorMaxIncrease as Concept));
    this._conceptMetrics.push(new DecisionFactor(MultiMetricValue.MaxDecrease, ConceptProxy.DecisionFactorMaxDecrease as Concept));

    // MoveDistance
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.Average, ConceptProxy.MoveDistanceAverage as Concept));
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.Median, ConceptProxy.MoveDistanceMedian as Concept));
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.Max, ConceptProxy.MoveDistanceMaximum as Concept));
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.Min, ConceptProxy.MoveDistanceMinimum as Concept));
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.Variance, ConceptProxy.MoveDistanceVariance as Concept));
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.ChangeAverage, ConceptProxy.MoveDistanceChangeAverage as Concept));
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.ChangeSign, ConceptProxy.MoveDistanceChangeSign as Concept));
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.ChangeLineBestFit, ConceptProxy.MoveDistanceChangeLineBestFit as Concept));
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.ChangeNumTimes, ConceptProxy.MoveDistanceChangeNumTimes as Concept));
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.MaxIncrease, ConceptProxy.MoveDistanceMaxIncrease as Concept));
    this._conceptMetrics.push(new MoveDistance(MultiMetricValue.MaxDecrease, ConceptProxy.MoveDistanceMaxDecrease as Concept));

    // PieceNumber
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.Average, ConceptProxy.PieceNumberAverage as Concept));
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.Median, ConceptProxy.PieceNumberMedian as Concept));
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.Max, ConceptProxy.PieceNumberMaximum as Concept));
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.Min, ConceptProxy.PieceNumberMinimum as Concept));
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.Variance, ConceptProxy.PieceNumberVariance as Concept));
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.ChangeAverage, ConceptProxy.PieceNumberChangeAverage as Concept));
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.ChangeSign, ConceptProxy.PieceNumberChangeSign as Concept));
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.ChangeLineBestFit, ConceptProxy.PieceNumberChangeLineBestFit as Concept));
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.ChangeNumTimes, ConceptProxy.PieceNumberChangeNumTimes as Concept));
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.MaxIncrease, ConceptProxy.PieceNumberMaxIncrease as Concept));
    this._conceptMetrics.push(new PieceNumber(MultiMetricValue.MaxDecrease, ConceptProxy.PieceNumberMaxDecrease as Concept));
  }

  //-------------------------------------------------------------------------

  /** @java Evaluation.dialogMetrics() */
  public dialogMetrics(): readonly Metric[] {
    return Object.freeze([...this._dialogMetrics]);
  }

  /** @java Evaluation.reconstructionMetrics() */
  public reconstructionMetrics(): readonly Metric[] {
    return Object.freeze([...this._reconstructionMetrics]);
  }

  /** @java Evaluation.conceptMetrics() */
  public conceptMetrics(): readonly Metric[] {
    return Object.freeze([...this._conceptMetrics]);
  }

  //-------------------------------------------------------------------------

  /**
   * @java Evaluation.getStateEvaluationCacheValue(long)
   */
  public getStateEvaluationCacheValue(key: bigint): number {
    // Java: put is needed to update eldest value (LRU refresh)
    const val = this.stateEvaluationCache.getLRU(key);
    return val ?? 0;
  }

  /**
   * @java Evaluation.getStateAfterMoveEvaluationCache(long)
   */
  public getStateAfterMoveEvaluationCache(key: bigint): number {
    const val = this.stateAfterMoveEvaluationCache.getLRU(key);
    return val ?? 0;
  }

  /**
   * @java Evaluation.putStateEvaluationCacheValue(long, double)
   */
  public putStateEvaluationCacheValue(key: bigint, value: number): void {
    this.stateEvaluationCache.putLRU(key, value);
  }

  /**
   * @java Evaluation.putStateAfterMoveEvaluationCache(long, double)
   */
  public putStateAfterMoveEvaluationCache(key: bigint, value: number): void {
    this.stateAfterMoveEvaluationCache.putLRU(key, value);
  }

  /**
   * @java Evaluation.stateEvaluationCacheContains(long)
   */
  public stateEvaluationCacheContains(key: bigint): boolean {
    return this.stateEvaluationCache.has(key);
  }

  /**
   * @java Evaluation.stateAfterMoveEvaluationCacheContains(long)
   */
  public stateAfterMoveEvaluationCacheContains(key: bigint): boolean {
    return this.stateAfterMoveEvaluationCache.has(key);
  }

  //-------------------------------------------------------------------------
}

// Re-export MultiMetricFramework so Evaluation.ts is the single import for
// the multiple-metric infrastructure (matches Java's import chain).
export { MultiMetricFramework, MultiMetricValue };
