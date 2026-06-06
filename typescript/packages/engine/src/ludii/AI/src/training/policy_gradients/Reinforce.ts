// @java AI/src/training/policy_gradients/Reinforce.java

/**
 * Self-play feature (pre-)training and discovery with REINFORCE.
 *
 * @java training/policy_gradients/Reinforce.java
 * @author Dennis Soemers
 */

import { ExperienceSample } from "../ExperienceSample.js";
import type { FeatureVector, BaseFeatureSet as BaseFeatureSetBase, FVector, FastArrayList, Move, State, BitSet } from "../ExperienceSample.js";

/** @java features.feature_sets.BaseFeatureSet — extended with spatial-feature count */
interface BaseFeatureSet extends BaseFeatureSetBase {
  /** @java BaseFeatureSet.getNumSpatialFeatures() */
  getNumSpatialFeatures(): number;
}

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported types

/** @java game.Game */
interface Game {
  players(): { count(): number };
  start(context: Context): void;
  moves(context: Context): { moves(): FastArrayList<Move> };
  apply(context: Context, move: Move): void;
}

/** @java other.context.Context */
interface Context {
  state(): { mover(): number };
  trial(): Trial;
  game(): Game;
}

/** @java other.trial.Trial */
interface Trial {
  over(): boolean;
  /** @java Trial.lastMove() */
  lastMove(): Move;
}

/** @java policies.softmax.SoftmaxPolicyLinear */
interface SoftmaxPolicyLinear {
  initAI(game: Game, playerID: number): void;
  closeAI(): void;
  computeDistribution(featureVectors: FeatureVector[], mover: number): FVector;
  selectActionFromDistribution(distribution: FVector): number;
  computeParamGradients(
    errors: FVector,
    featureVectors: FeatureVector[],
    p: number
  ): FVector;
  linearFunction(p: number): LinearFunction;
  linearFunctions(): (LinearFunction | null)[];
  updateFeatureSets(featureSets: (BaseFeatureSet | null)[]): void;
}

/** @java function_approx.LinearFunction */
interface LinearFunction {
  trainableParams(): { allWeights(): FVector };
}

/** @java optimisers.Optimiser */
interface Optimiser {
  maximiseObjective(weights: FVector, gradients: FVector): void;
}

/** @java training.expert_iteration.params.ObjectiveParams */
interface ObjectiveParams {
  entropyRegWeight: number;
}

/** @java training.expert_iteration.params.FeatureDiscoveryParams */
interface FeatureDiscoveryParams {
  noGrowFeatureSet: boolean;
  numFeatureDiscoveryThreads: number;
  combiningFeatureInstanceThreshold: number;
}

/** @java training.expert_iteration.params.TrainingParams */
interface TrainingParams {
  numPolicyGradientThreads: number;
  numPolicyGradientEpochs: number;
  numTrialsPerPolicyGradientEpoch: number;
  batchSize: number;
  pgGamma: number;
  entropyRegWeight: number;
}

/** @java training.feature_discovery.FeatureSetExpander */
interface FeatureSetExpander {
  expandFeatureSet(
    batch: PGExperience[],
    featureSet: BaseFeatureSet,
    policy: SoftmaxPolicyLinear,
    game: Game,
    combiningThreshold: number,
    objectiveParams: ObjectiveParams,
    featureDiscoveryParams: FeatureDiscoveryParams,
    featureActiveRatios: number[],
    logWriter: PrintWriter | null,
    experiment: InterruptableExperiment
  ): BaseFeatureSet | null;
}

/** @java utils.ExponentialMovingAverage */
interface ExponentialMovingAverage {
  observe(value: number): void;
  movingAvg(): number;
}

/** @java utils.experiments.InterruptableExperiment */
interface InterruptableExperiment {
  wantsInterrupt(): boolean;
  logLine(writer: PrintWriter | null, message: string): void;
}

/** @java java.io.PrintWriter */
type PrintWriter = { println(s: string): void } | null;

/** @java other.RankUtils */
interface RankUtilsStatic {
  agentUtilities(context: Context): number[];
}
const RankUtilsStub = {} as unknown as RankUtilsStatic;

/** @java features.spatial.FeatureUtils */
interface FeatureUtilsStatic {
  fromPos(move: Move): number;
  toPos(move: Move): number;
}
const FeatureUtilsStub = {} as unknown as FeatureUtilsStatic;

// ---------------------------------------------------------------------------

/** We don't store experiences for which the discount factor drops below this threshold */
const EXPERIENCE_DISCOUNT_THRESHOLD = 0.001;

/** If we have a discount factor gamma = 1, we'll use this threshold to limit amount of data stored per trial */
const DATA_PER_TRIAL_THRESHOLD = 50;

// ---------------------------------------------------------------------------

/**
 * Sample of experience for policy gradients.
 *
 * NOTE: since our experiences just collect feature vectors rather than contexts,
 * we cannot reuse the same experiences after growing our feature sets.
 *
 * @java training.policy_gradients.Reinforce.PGExperience
 */
class PGExperience extends ExperienceSample {

  /** Game state */
  protected readonly state_: State;

  /** From-position of last decision move */
  protected readonly lastFromPos_: number;

  /** To-position of last decision move */
  protected readonly lastToPos_: number;

  /** List of legal moves */
  protected readonly legalMoves: FastArrayList<Move>;

  /** Array of feature vectors (one per legal move) */
  protected readonly featureVectors_: FeatureVector[];

  /** Index of move that we ended up playing */
  protected readonly movePlayedIdx_: number;

  /** Returns we got at the end of the trial that this experience was a part of */
  protected readonly returns_: number;

  /** Multiplier we should use due to discounting */
  protected readonly discountMultiplier_: number;

  /**
   * Constructor
   * @java PGExperience(State, Move, FastArrayList<Move>, FeatureVector[], int, float, double)
   */
  public constructor(
    state: State,
    lastDecisionMove: Move,
    legalMoves: FastArrayList<Move>,
    featureVectors: FeatureVector[],
    movePlayedIdx: number,
    returns: number,
    discountMultiplier: number
  ) {
    super();
    this.state_ = state;
    this.lastFromPos_ = FeatureUtilsStub.fromPos(lastDecisionMove);
    this.lastToPos_ = FeatureUtilsStub.toPos(lastDecisionMove);
    this.legalMoves = legalMoves;
    this.featureVectors_ = featureVectors;
    this.movePlayedIdx_ = movePlayedIdx;
    this.returns_ = returns;
    this.discountMultiplier_ = discountMultiplier;
  }

  /** @java PGExperience.featureVectors() */
  public featureVectors(): FeatureVector[] {
    return this.featureVectors_;
  }

  /** @java PGExperience.movePlayedIdx() */
  public movePlayedIdx(): number {
    return this.movePlayedIdx_;
  }

  /** @java PGExperience.returns() */
  public returns(): number {
    return this.returns_;
  }

  /** @java PGExperience.discountMultiplier() */
  public discountMultiplier(): number {
    return this.discountMultiplier_;
  }

  /** @java PGExperience.generateFeatureVectors(BaseFeatureSet) */
  public override generateFeatureVectors(_featureSet: BaseFeatureSet): FeatureVector[] {
    return this.featureVectors_;
  }

  /** @java PGExperience.expertDistribution() */
  public override expertDistribution(): FVector {
    // As an estimation of a good expert distribution, we'll use the
    // discounted returns as logit for the played action, with logits of 0
    // everywhere else, and then use a softmax to turn it into a distribution
    const distribution = {} as unknown as FVector & {
      set(idx: number, val: number): void;
      softmax(): void;
    };
    distribution.set(this.movePlayedIdx_, this.returns_ * this.discountMultiplier_);
    distribution.softmax();
    return distribution;
  }

  /** @java PGExperience.gameState() */
  public override gameState(): State {
    return this.state_;
  }

  /** @java PGExperience.lastFromPos() */
  public override lastFromPos(): number {
    return this.lastFromPos_;
  }

  /** @java PGExperience.lastToPos() */
  public override lastToPos(): number {
    return this.lastToPos_;
  }

  /** @java PGExperience.moves() */
  public override moves(): FastArrayList<Move> {
    return this.legalMoves;
  }

  /** @java PGExperience.winningMoves() */
  public override winningMoves(): BitSet {
    return { isEmpty(): boolean { return true; }, nextSetBit(_from: number): number { return -1; } };
  }

  /** @java PGExperience.losingMoves() */
  public override losingMoves(): BitSet {
    return { isEmpty(): boolean { return true; }, nextSetBit(_from: number): number { return -1; } };
  }

  /** @java PGExperience.antiDefeatingMoves() */
  public override antiDefeatingMoves(): BitSet {
    return { isEmpty(): boolean { return true; }, nextSetBit(_from: number): number { return -1; } };
  }
}

// ---------------------------------------------------------------------------

/**
 * Self-play feature (pre-)training and discovery with REINFORCE.
 *
 * @java training.policy_gradients.Reinforce
 */
export class Reinforce {

  //-------------------------------------------------------------------------

  /**
   * Runs self-play with Policy Gradient training of features.
   *
   * @param game
   * @param selectionPolicy
   * @param playoutPolicy
   * @param tspgPolicy
   * @param inFeatureSets
   * @param featureSetExpander
   * @param optimisers
   * @param objectiveParams
   * @param featureDiscoveryParams
   * @param trainingParams
   * @param logWriter
   * @param experiment
   * @return New array of feature sets
   * @java Reinforce.runSelfPlayPG(...)
   */
  public static runSelfPlayPG(
    game: Game,
    selectionPolicy: SoftmaxPolicyLinear,
    playoutPolicy: SoftmaxPolicyLinear,
    tspgPolicy: SoftmaxPolicyLinear,
    inFeatureSets: (BaseFeatureSet | null)[],
    featureSetExpander: FeatureSetExpander,
    optimisers: (Optimiser | null)[],
    objectiveParams: ObjectiveParams,
    featureDiscoveryParams: FeatureDiscoveryParams,
    trainingParams: TrainingParams,
    logWriter: PrintWriter,
    experiment: InterruptableExperiment
  ): (BaseFeatureSet | null)[] {
    let featureSets = inFeatureSets;
    const numPlayers = game.players().count();

    const avgGameDurations: ExponentialMovingAverage[] = new Array(numPlayers + 1);
    const avgPlayerOutcomeTrackers: ExponentialMovingAverage[] = new Array(numPlayers + 1);
    for (let p = 1; p <= numPlayers; ++p) {
      avgGameDurations[p] = {} as unknown as ExponentialMovingAverage;
      avgPlayerOutcomeTrackers[p] = {} as unknown as ExponentialMovingAverage;
    }

    const featureLifetimes: bigint[][] = new Array(featureSets.length);
    const featureActiveRatios: number[][] = new Array(featureSets.length);

    for (let i = 0; i < featureSets.length; ++i) {
      const fs = featureSets[i];
      if (fs !== null && fs !== undefined) {
        featureLifetimes[i] = new Array(fs.getNumSpatialFeatures()).fill(0n);
        featureActiveRatios[i] = new Array(fs.getNumSpatialFeatures()).fill(0.0);
      }
    }

    for (let epoch = 0; epoch < trainingParams.numPolicyGradientEpochs; ++epoch) {
      if (experiment.wantsInterrupt())
        break;

      // Collect all experience (per player) for this epoch
      const epochExperiences: PGExperience[][] = new Array(numPlayers + 1).fill(null).map(() => []);

      // Softmax should be thread-safe except for initAI()/closeAI()
      // We init once before the batch of trials and close after
      playoutPolicy.initAI(game, -1);

      let epochTrialsCount = 0;
      const epochFeatureSets = featureSets;

      // In TS we run sequentially (no thread pool)
      while (epochTrialsCount < trainingParams.numTrialsPerPolicyGradientEpoch) {
        ++epochTrialsCount;

        const encounteredGameStates: State[][] = new Array(numPlayers + 1).fill(null).map(() => []);
        const lastDecisionMoves: Move[][] = new Array(numPlayers + 1).fill(null).map(() => []);
        const legalMovesLists: FastArrayList<Move>[][] = new Array(numPlayers + 1).fill(null).map(() => []);
        const featureVectorArrays: FeatureVector[][][] = new Array(numPlayers + 1).fill(null).map(() => []);
        const playedMoveIndices: number[][] = new Array(numPlayers + 1).fill(null).map(() => []);

        // trial / context are abstract here — we cannot instantiate them without the ported classes
        // Use escape-hatch stubs
        const trial = {} as unknown as Trial;
        const context = {} as unknown as Context;

        game.start(context);

        while (!trial.over()) {
          const mover = context.state().mover();
          const moves = game.moves(context).moves();
          const featureSet = epochFeatureSets[mover];

          if (featureSet === null || featureSet === undefined) break;

          const featureVectors = featureSet.computeFeatureVectors(context, moves, false);
          const distribution = playoutPolicy.computeDistribution(featureVectors, mover);

          const moveIdx = playoutPolicy.selectActionFromDistribution(distribution);
          const move = moves.get(moveIdx);

          encounteredGameStates[mover]!.push({} as State);
          lastDecisionMoves[mover]!.push(context.trial().lastMove());
          legalMovesLists[mover]!.push(moves);
          featureVectorArrays[mover]!.push(featureVectors);
          playedMoveIndices[mover]!.push(moveIdx);

          game.apply(context, move);

          Reinforce.updateFeatureActivityData(featureVectors, featureLifetimes, featureActiveRatios, mover);
        }

        const utilities = RankUtilsStub.agentUtilities(context);

        Reinforce.addTrialData(
          epochExperiences, numPlayers,
          encounteredGameStates, lastDecisionMoves,
          legalMovesLists, featureVectorArrays,
          playedMoveIndices, utilities,
          avgGameDurations, avgPlayerOutcomeTrackers,
          trainingParams
        );
      }

      playoutPolicy.closeAI();

      for (let p = 1; p <= numPlayers; ++p) {
        const experiences = epochExperiences[p]!;
        const numExperiences = experiences.length;

        const linearFunc = playoutPolicy.linearFunction(p);
        const grads = {} as unknown as FVector & {
          dim(): number;
          add(other: FVector): void;
          div(d: number): void;
        };

        const baseline = avgPlayerOutcomeTrackers[p]!.movingAvg();

        for (let i = 0; i < numExperiences; ++i) {
          const exp = experiences[i]!;
          const distribution = playoutPolicy.computeDistribution(exp.featureVectors(), p);

          const policyGradients = Reinforce.computePolicyGradients(
            exp,
            grads.dim(),
            baseline,
            trainingParams.entropyRegWeight,
            distribution.get(exp.movePlayedIdx())
          );

          // Divide by numExperiences and add to average gradients
          (policyGradients as unknown as { div(d: number): void }).div(numExperiences);
          grads.add(policyGradients);
        }

        // Take gradient step
        if (optimisers[p] !== null && optimisers[p] !== undefined) {
          optimisers[p]!.maximiseObjective(
            linearFunc.trainableParams().allWeights(),
            grads
          );
        }
      }

      if (!featureDiscoveryParams.noGrowFeatureSet && (epoch + 1) % 5 === 0) {
        // Try growing our feature set
        const expandedFeatureSets: (BaseFeatureSet | null)[] = new Array(numPlayers + 1).fill(null);

        for (let p = 1; p <= numPlayers; ++p) {
          const featureSetP = featureSets[p];
          const batchSize = trainingParams.batchSize;
          const batch: PGExperience[] = [];

          while (batch.length < batchSize && epochExperiences[p]!.length > 0) {
            const r = Math.floor(Math.random() * epochExperiences[p]!.length);
            batch.push(epochExperiences[p]![r]!);
            epochExperiences[p]!.splice(r, 1);
          }

          if (batch.length > 0 && featureSetP !== null && featureSetP !== undefined) {
            const expandedFeatureSet = featureSetExpander.expandFeatureSet(
              batch,
              featureSetP,
              playoutPolicy,
              game,
              featureDiscoveryParams.combiningFeatureInstanceThreshold,
              objectiveParams,
              featureDiscoveryParams,
              featureActiveRatios[p]!,
              logWriter,
              experiment
            );

            if (expandedFeatureSet !== null) {
              expandedFeatureSets[p] = expandedFeatureSet;

              while (featureActiveRatios[p]!.length < expandedFeatureSet.getNumSpatialFeatures()) {
                featureLifetimes[p]!.push(0n);
                featureActiveRatios[p]!.push(0.0);
              }
            } else {
              expandedFeatureSets[p] = featureSetP ?? null;
            }
          } else {
            expandedFeatureSets[p] = featureSetP ?? null;
          }
        }

        selectionPolicy.updateFeatureSets(expandedFeatureSets);
        playoutPolicy.updateFeatureSets(expandedFeatureSets);
        tspgPolicy.updateFeatureSets(expandedFeatureSets);

        featureSets = expandedFeatureSets;
      }
    }

    return featureSets;
  }

  //-------------------------------------------------------------------------

  /**
   * Computes vector of policy gradients for given sample of experience.
   *
   * @param exp
   * @param dim Dimensionality we want for output vector
   * @param valueBaseline
   * @param entropyRegWeight Weight for entropy regularisation term
   * @param playedMoveProb Probability with which our policy picks the move that we ended up picking
   * @return Computes vector of policy gradients for given sample of experience
   * @java Reinforce.computePolicyGradients(PGExperience, int, double, double, float)
   */
  private static computePolicyGradients(
    exp: PGExperience,
    dim: number,
    valueBaseline: number,
    entropyRegWeight: number,
    playedMoveProb: number
  ): FVector {
    const featureVectors = exp.featureVectors();

    // Use escape-hatch FVector stubs
    const expectedPhi = new Float32Array(dim);
    const gradLogPi = new Float32Array(dim);

    for (let moveIdx = 0; moveIdx < featureVectors.length; ++moveIdx) {
      const featureVector = featureVectors[moveIdx]!;

      // Dense representation for aspatial features
      const aspatialFeatureVals = featureVector.aspatialFeatureValues();
      const numAspatialFeatures = aspatialFeatureVals.dim();

      for (let k = 0; k < numAspatialFeatures; ++k) {
        expectedPhi[k]! += aspatialFeatureVals.get(k);
      }

      if (moveIdx === exp.movePlayedIdx()) {
        for (let k = 0; k < numAspatialFeatures; ++k) {
          gradLogPi[k]! += aspatialFeatureVals.get(k);
        }
      }

      // Sparse representation for spatial features
      const sparseSpatialFeatures = featureVector.activeSpatialFeatureIndices();

      for (let k = 0; k < sparseSpatialFeatures.size(); ++k) {
        const feature = sparseSpatialFeatures.getQuick(k);
        expectedPhi[feature + numAspatialFeatures]! += 1;
      }

      if (moveIdx === exp.movePlayedIdx()) {
        for (let k = 0; k < sparseSpatialFeatures.size(); ++k) {
          const feature = sparseSpatialFeatures.getQuick(k);
          gradLogPi[feature + numAspatialFeatures]! += 1;
        }
      }
    }

    // expectedPhi.div(featureVectors.length)
    const n = featureVectors.length;
    for (let i = 0; i < expectedPhi.length; ++i) expectedPhi[i]! /= n;

    // gradLogPi.subtract(expectedPhi)
    for (let i = 0; i < gradLogPi.length; ++i) gradLogPi[i]! -= expectedPhi[i]!;

    // Weight by returns
    const weight = exp.discountMultiplier() * (exp.returns() - valueBaseline) -
      entropyRegWeight * Math.log(playedMoveProb);
    for (let i = 0; i < gradLogPi.length; ++i) gradLogPi[i]! *= weight;

    // Wrap result as FVector escape-hatch
    const result = gradLogPi;
    return {
      get(i: number): number { return result[i]!; },
      dim(): number { return result.length; },
      sampleProportionally(): number { return 0; },
    } as unknown as FVector;
  }

  //-------------------------------------------------------------------------

  /**
   * Update feature activity data. Needs to be synchronized in Java; in TS we
   * run sequentially so no synchronisation needed.
   *
   * @param featureVectors
   * @param featureLifetimes
   * @param featureActiveRatios
   * @param mover
   * @java Reinforce.updateFeatureActivityData(FeatureVector[], TLongArrayList[], TDoubleArrayList[], int)
   */
  private static updateFeatureActivityData(
    featureVectors: FeatureVector[],
    featureLifetimes: bigint[][],
    featureActiveRatios: number[][],
    mover: number
  ): void {
    for (const featureVector of featureVectors) {
      const sparse = featureVector.activeSpatialFeatureIndices();

      if (sparse.size() === 0)
        continue; // Probably a pass/swap/other special move

      // Increase lifetime of all features by 1
      const lifetimes = featureLifetimes[mover]!;
      for (let i = 0; i < lifetimes.length; ++i) {
        lifetimes[i]! += 1n;
      }

      // Build a sorted index set from sparse
      const activeSet = new Set<number>();
      for (let j = 0; j < sparse.size(); ++j) {
        activeSet.add(sparse.getQuick(j));
      }

      // Incrementally update all average feature values
      const list = featureActiveRatios[mover]!;
      for (let i = 0; i < list.length; ++i) {
        const oldMean = list[i]!;
        const lifetime = Number(lifetimes[i]!);

        if (activeSet.has(i)) {
          list[i]! = oldMean + ((1.0 - oldMean) / lifetime);
        } else {
          list[i]! = oldMean + ((0.0 - oldMean) / lifetime);
        }
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Record data collected from a trial. In Java this is synchronized; in TS we
   * run sequentially.
   *
   * @java Reinforce.addTrialData(...)
   */
  private static addTrialData(
    epochExperiences: PGExperience[][],
    numPlayers: number,
    encounteredGameStates: State[][],
    lastDecisionMoves: Move[][],
    legalMovesLists: FastArrayList<Move>[][],
    featureVectorArrays: FeatureVector[][][],
    playedMoveIndices: number[][],
    utilities: number[],
    avgGameDurations: ExponentialMovingAverage[],
    avgPlayerOutcomeTrackers: ExponentialMovingAverage[],
    trainingParams: TrainingParams
  ): void {
    for (let p = 1; p <= numPlayers; ++p) {
      const gameStatesList = encounteredGameStates[p]!;
      const lastDecisionMovesList = lastDecisionMoves[p]!;
      const legalMovesList = legalMovesLists[p]!;
      const featureVectorsList = featureVectorArrays[p]!;
      const moveIndicesList = playedMoveIndices[p]!;

      const gameDuration = gameStatesList.length;
      avgGameDurations[p]!.observe(gameDuration);
      avgPlayerOutcomeTrackers[p]!.observe(utilities[p]!);

      let discountMultiplier = 1.0;

      const skipData: boolean[] = new Array(featureVectorsList.length).fill(false);
      if (trainingParams.pgGamma === 1.0) {
        let numSkipped = 0;
        while (skipData.length - numSkipped > DATA_PER_TRIAL_THRESHOLD) {
          const skipIdx = Math.floor(Math.random() * skipData.length);
          if (!skipData[skipIdx]) {
            skipData[skipIdx] = true;
            ++numSkipped;
          }
        }
      }

      for (let i = featureVectorsList.length - 1; i >= 0; --i) {
        if (!skipData[i] && legalMovesList[i]!.size() > 1) {
          epochExperiences[p]!.push(new PGExperience(
            gameStatesList[i]!,
            lastDecisionMovesList[i]!,
            legalMovesList[i]!,
            featureVectorsList[i]!,
            moveIndicesList[i]!,
            utilities[p]!,
            discountMultiplier
          ));
        }

        discountMultiplier *= trainingParams.pgGamma;

        if (discountMultiplier < EXPERIENCE_DISCOUNT_THRESHOLD)
          break;
      }
    }
  }

  //-------------------------------------------------------------------------
}
