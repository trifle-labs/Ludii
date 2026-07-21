// @java AI/src/training/expert_iteration/ExpertIteration.java

/**
 * Implementation of the Expert Iteration self-play training framework,
 * with additional support for feature learning instead of the standard DNNs.
 *
 * @java training/expert_iteration/ExpertIteration.java
 * @author Dennis Soemers
 */

import { ExpertPolicy } from "./ExpertPolicy.js";
import type { IGame as AIGame, IContext as AIContext } from "../../../../../ludemes/other/other/AI.js";
import { AgentsParams } from "./params/AgentsParams.js";
import { OptimisersParams } from "./params/OptimisersParams.js";
import { OutParams, CheckpointTypesEnum } from "./params/OutParams.js";
import type { CheckpointTypes } from "./params/OutParams.js";
import { Menagerie, DrawnAgentsData } from "./menageries/Menagerie.js";
import { NaiveSelfPlay } from "./menageries/NaiveSelfPlay.js";
import { TournamentMenagerie } from "./menageries/TournamentMenagerie.js";
import { Reinforce } from "../policy_gradients/Reinforce.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported types

/** @java game.Game */
interface Game {
  players(): { count(): number };
  start(context: Context): void;
  moves(context: Context): { moves(): FastArrayList<Move> };
  apply(context: Context, move: Move): void;
  setMaxTurns(turns: number): void;
  getMaxTurnLimit(): number;
  metadata(): { ai(): { heuristics(): Heuristics } };
}

/** @java other.context.Context */
interface Context {
  state(): GameState;
  trial(): Trial;
  game(): Game;
  active(player: number): boolean;
  winners(): { contains(p: number): boolean };
  losers(): { contains(p: number): boolean };
}

/** @java other.state.State */
interface GameState {
  mover(): number;
  playerToAgent(p: number): number;
}

/** @java other.trial.Trial */
interface Trial {
  over(): boolean;
  lastMove: Move | null;
}

/** @java other.move.Move */
interface Move {
  __move: true;
}

/** @java main.collections.FastArrayList */
interface FastArrayList<T> {
  get(i: number): T;
  size(): number;
}

/** @java main.collections.FVector */
interface FVector {
  get(i: number): number;
  dim(): number;
  mult(scale: number): void;
  copyFrom(src: FVector, fromOffset: number, toOffset: number, length: number): void;
  sampleProportionally(): number;
}

/** @java features.FeatureVector */
interface FeatureVector {
  aspatialFeatureValues(): { get(i: number): number; dim(): number };
  activeSpatialFeatureIndices(): { size(): number; getQuick(j: number): number; contains(i: number): boolean };
}

/** @java features.feature_sets.BaseFeatureSet */
interface BaseFeatureSet {
  getNumSpatialFeatures(): number;
  getNumFeatures(): number;
  computeFeatureVectors(context: Context, moves: FastArrayList<Move>, heuristic: boolean): FeatureVector[];
  computeSparseSpatialFeatureVectors(context: Context, legalMoves: FastArrayList<Move>, heuristic: boolean): number[][];
  init(game: Game, players: number[], data: unknown): void;
  toFile(path: string): void;
  getNumAspatialFeatures(): number;
}

/** @java function_approx.LinearFunction */
interface LinearFunction {
  trainableParams(): { allWeights(): FVector };
  featureSetFile(): string;
  writeToFile(path: string, args: string[]): void;
  effectiveParams(): WeightVector;
}

/** @java features.WeightVector */
interface WeightVector {
  dot(featureVector: FeatureVector): number;
}

/** @java optimisers.Optimiser */
interface Optimiser {
  writeToFile(path: string): void;
}

/** @java metadata.ai.heuristics.Heuristics */
interface Heuristics {
  init(game: Game): void;
  computeStateFeatureVector(context: Context, player: number): FVector;
  paramsVector(): FVector;
  updateParams(game: Game, params: FVector, p: number): void;
  toFile(game: Game, path: string): void;
  __heuristics: true;
}

/** @java training.expert_iteration.ExItExperience */
interface ExItExperience {
  state(): { state(): GameState; lastDecisionMove(): Move };
  moves(): FastArrayList<Move>;
  expertDistribution(): FVector;
  expertValueEstimates(): FVector;
  weightVisitCount(): number;
  weightPER(): number;
  bufferIdx(): number;
  setStateFeatureVector(v: FVector): void;
  setWinningMoves(bs: BitSet): void;
  setLosingMoves(bs: BitSet): void;
  setAntiDefeatingMoves(bs: BitSet): void;
  setEpisodeDuration(d: number): void;
  setPlayerOutcomes(outcomes: number[]): void;
  winningMoves(): BitSet;
  losingMoves(): BitSet;
  antiDefeatingMoves(): BitSet;
  episodeDuration(): number;
  context(): Context;
}

/** @java java.util.BitSet */
interface BitSet {
  isEmpty(): boolean;
  nextSetBit(from: number): number;
  get(i: number): boolean;
  set(from: number, to: number): void;
  andNot(other: BitSet): void;
  and(other: BitSet): void;
  clone(): BitSet;
}

/** @java utils.data_structures.experience_buffers.ExperienceBuffer */
interface ExperienceBuffer {
  allExperience(): (ExItExperience | null)[];
  sampleExperienceBatch(size: number): ExItExperience[];
  sampleExperienceBatchUniformly(size: number): ExItExperience[];
  add(exp: ExItExperience): void;
  writeToFile(path: string): void;
}

/** @java utils.ExponentialMovingAverage */
interface ExponentialMovingAverage {
  observe(value: number): void;
  movingAvg(): number;
  writeToFile(path: string): void;
}

/** @java utils.experiments.InterruptableExperiment */
interface InterruptableExperiment {
  interrupted: boolean;
  wantsInterrupt(): boolean;
  logLine(writer: PrintWriter | null, message: string): void;
  checkWallTime(fraction: number): void;
}

/** @java java.io.PrintWriter */
type PrintWriter = { println(s: string): void; close(): void } | null;

/** @java training.expert_iteration.gradients.Gradients */
interface GradientsStatic {
  computeCrossEntropyErrors(
    policy: SoftmaxPolicyLinear,
    expertPolicy: FVector,
    featureVectors: FeatureVector[],
    p: number,
    handleAliasing: boolean
  ): FVector;
  computeValueGradients(valueFunction: Heuristics | null, p: number, sample: ExItExperience): FVector | null;
  wisGradients(gradients: FVector[], weight: number): FVector;
  meanGradients(gradients: FVector[]): FVector;
  minimise(optimiser: Optimiser, weights: FVector, gradients: FVector | null, decay: number): void;
  maximise(optimiser: Optimiser, weights: FVector, gradients: FVector | null, decay: number): void;
}
const Gradients = {} as unknown as GradientsStatic;

/** @java policies.softmax.SoftmaxPolicyLinear */
interface SoftmaxPolicyLinear {
  initAI(game: Game, playerID: number): void;
  closeAI(): void;
  computeDistribution(featureVectors: FeatureVector[], mover: number): FVector;
  selectActionFromDistribution(distribution: FVector): number;
  computeParamGradients(errors: FVector, featureVectors: FeatureVector[], p: number): FVector;
  linearFunction(p: number): LinearFunction;
  linearFunctions(): (LinearFunction | null)[];
  updateFeatureSets(featureSets: (BaseFeatureSet | null)[]): void;
}

/** @java search.mcts.MCTS */
interface MCTSStatic {
  NULL_UNDO_DATA: boolean;
  createBiasedMCTS(features: unknown, epsilon: number): ExpertPolicy;
  createUCT(): ExpertPolicy;
}
const MCTS_static = {} as unknown as MCTSStatic;

/** @java training.expert_iteration.params.ObjectiveParams */
interface ObjectiveParams {
  trainTSPG: boolean;
  importanceSamplingEpisodeDurations: boolean;
  weightedImportanceSampling: boolean;
  noValueLearning: boolean;
  handleAliasing: boolean;
  handleAliasingPlayouts: boolean;
  weightDecayLambda: number;
  entropyRegWeight: number;
}

/** @java training.expert_iteration.params.FeatureDiscoveryParams */
interface FeatureDiscoveryParams {
  addFeatureEvery: number;
  noGrowFeatureSet: boolean;
  combiningFeatureInstanceThreshold: number;
  numFeatureDiscoveryThreads: number;
  criticalValueCorrConf: number;
  useSpecialMovesExpander: boolean;
  useSpecialMovesExpanderSplit: boolean;
  expanderType: string;
}

/** @java training.expert_iteration.params.TrainingParams */
interface TrainingParams {
  numTrainingGames: number;
  batchSize: number;
  experienceBufferSize: number;
  updateWeightsEvery: number;
  prioritizedExperienceReplay: boolean;
  initValueFuncDir: string;
  numPolicyGradientEpochs: number;
  numTrialsPerPolicyGradientEpoch: number;
  pgGamma: number;
  entropyRegWeight: number;
  numPolicyGradientThreads: number;
  postPGWeightScalar: number;
}

/** @java training.feature_discovery.FeatureSetExpander */
interface FeatureSetExpander {
  expandFeatureSet(
    batch: ExItExperience[],
    featureSet: BaseFeatureSet,
    policy: SoftmaxPolicyLinear,
    game: Game,
    threshold: number,
    objectiveParams: ObjectiveParams,
    featureDiscoveryParams: FeatureDiscoveryParams,
    featureActiveRatios: number[],
    logWriter: PrintWriter,
    experiment: InterruptableExperiment
  ): BaseFeatureSet | null;
}

/** @java other.RankUtils */
interface RankUtilsStatic { agentUtilities(context: Context): number[]; }
const RankUtils = {} as unknown as RankUtilsStatic;

/** @java utils.AIUtils */
interface AIUtilsStatic {
  generateFeaturesMetadata(
    selectionPolicy: SoftmaxPolicyLinear,
    playoutPolicy: SoftmaxPolicyLinear
  ): unknown;
}
const AIUtils = {} as unknown as AIUtilsStatic;

/** @java optimisers.OptimiserFactory */
interface OptimiserFactoryStatic { createOptimiser(config: string): Optimiser; }
const OptimiserFactory = {} as unknown as OptimiserFactoryStatic;

/** @java utils.data_structures.experience_buffers.PrioritizedReplayBuffer */
interface PrioritizedReplayBufferStatic {
  new(size: number): ExperienceBuffer & { setPriorities(indices: number[], priorities: number[]): void };
  fromFile(game: Game, path: string): ExperienceBuffer & { setPriorities(indices: number[], priorities: number[]): void };
}
const PrioritizedReplayBuffer = {} as unknown as PrioritizedReplayBufferStatic;

/** @java utils.data_structures.experience_buffers.UniformExperienceBuffer */
interface UniformExperienceBufferStatic {
  new(size: number): ExperienceBuffer;
  fromFile(game: Game, path: string): ExperienceBuffer;
}
const UniformExperienceBuffer = {} as unknown as UniformExperienceBufferStatic;

/** @java utils.ExperimentFileUtils */
interface ExperimentFileUtilsStatic { getNextFilepath(base: string, ext: string): string; }
const ExperimentFileUtils = {} as unknown as ExperimentFileUtilsStatic;

/** @java function_approx.BoostedLinearFunction */
interface BoostedLinearFunctionStatic {
  new(weights: unknown, ceFunc: LinearFunction): LinearFunction;
  boostedFromFile(path: string, ceFunc: LinearFunction): LinearFunction;
}
const BoostedLinearFunction = {} as unknown as BoostedLinearFunctionStatic;

/** @java other.GameLoader */
interface GameLoaderStatic {
  loadGameFromName(name: string, options?: unknown): Game;
}
const GameLoader = {} as unknown as GameLoaderStatic;

// ---------------------------------------------------------------------------

/** Format used for checkpoints based on training game count */
const gameCheckpointFormat = "%s_%05d.%s";

/** Format used for checkpoints based on weight update count */
const weightUpdateCheckpointFormat = "%s_%08d.%s";

// ---------------------------------------------------------------------------

/**
 * Implementation of the Expert Iteration self-play training framework.
 *
 * @java training.expert_iteration.ExpertIteration
 */
export class ExpertIteration {

  //-------------------------------------------------------------------------

  /** Game configuration */
  public readonly gameParams = {
    gameName: "",
    gameOptions: [] as string[],
    ruleset: "",
    gameLengthCap: -1,
  };

  /** Agents configuration */
  public readonly agentsParams = new AgentsParams();

  /** Basic training params */
  public readonly trainingParams = {} as TrainingParams;

  /** Feature discovery params */
  public readonly featureDiscoveryParams = {} as FeatureDiscoveryParams;

  /** Objective function(s) params */
  public readonly objectiveParams = {} as ObjectiveParams;

  /** Optimiser(s) params */
  public readonly optimisersParams = new OptimisersParams();

  /** Output / file writing params */
  public readonly outParams = new OutParams();

  /** Whether to create a small GUI that can be used to manually interrupt training run. */
  protected useGUI: boolean = false;

  /** Max wall time in minutes (or -1 for no limit) */
  protected maxWallTime: number = -1;

  //-------------------------------------------------------------------------

  /**
   * Constructor. No GUI for interrupting experiment, no wall time limit.
   * @java ExpertIteration()
   */
  public constructor();
  /**
   * Constructor. No wall time limit.
   * @param useGUI
   * @java ExpertIteration(boolean)
   */
  public constructor(useGUI: boolean);
  /**
   * Constructor.
   * @param useGUI
   * @param maxWallTime Wall time limit in minutes.
   * @java ExpertIteration(boolean, int)
   */
  public constructor(useGUI: boolean, maxWallTime: number);
  public constructor(useGUI: boolean = false, maxWallTime: number = -1) {
    this.useGUI = useGUI;
    this.maxWallTime = maxWallTime;
  }

  //-------------------------------------------------------------------------

  /**
   * Starts the experiment.
   * @java ExpertIteration.startExperiment()
   */
  public startExperiment(): void {
    const logWriter = this.createLogWriter();
    try {
      this.startTraining(logWriter);
    } finally {
      if (logWriter !== null) logWriter.close();
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Start the training run.
   * @java ExpertIteration.startTraining(PrintWriter)
   */
  private startTraining(logWriter: PrintWriter): void {
    const game: Game = (this.gameParams.ruleset !== null && this.gameParams.ruleset !== "")
      ? GameLoader.loadGameFromName(this.gameParams.gameName, this.gameParams.ruleset)
      : GameLoader.loadGameFromName(this.gameParams.gameName, this.gameParams.gameOptions);

    const numPlayers = game.players().count();

    if (this.gameParams.gameLengthCap >= 0)
      game.setMaxTurns(Math.min(this.gameParams.gameLengthCap, game.getMaxTurnLimit()));

    // In Java this is an anonymous inner class implementing InterruptableExperiment.
    // We flatten it here as a local object.
    const exIt = this;

    let interrupted = false;
    let lastCheckpoint = Number.MAX_SAFE_INTEGER;

    const currentFeatureSetFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentPolicyWeightsSelectionFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentPolicyWeightsPlayoutFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentPolicyWeightsTSPGFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentPolicyWeightsCEEFilenames: string[] = new Array(numPlayers + 1).fill("");
    let currentValueFunctionFilename: string | null = null;
    const currentExperienceBufferFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentSpecialMoveExperienceBufferFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentFinalStatesExperienceBufferFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentGameDurationTrackerFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentOptimiserSelectionFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentOptimiserPlayoutFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentOptimiserTSPGFilenames: string[] = new Array(numPlayers + 1).fill("");
    const currentOptimiserCEEFilenames: string[] = new Array(numPlayers + 1).fill("");
    let currentOptimiserValueFilename: string | null = null;

    // Don't want MCTSes to null undo data
    MCTS_static.NULL_UNDO_DATA = false;

    // Create menagerie
    const menagerie: Menagerie = exIt.agentsParams.tournamentMode
      ? new TournamentMenagerie()
      : new NaiveSelfPlay();

    // Prepare feature sets and related data
    // (heavily depends on not-yet-ported classes; using escape-hatch stubs)
    const featureSetsArr: (BaseFeatureSet | null)[] = new Array(numPlayers + 1).fill(null);
    let featureSets = featureSetsArr;

    const featureLifetimes: bigint[][] = new Array(featureSets.length).fill(null).map(() => []);
    const featureActiveRatios: number[][] = new Array(featureSets.length).fill(null).map(() => []);
    const featureOccurrences: bigint[][] = new Array(featureSets.length).fill(null).map(() => []);
    const winningMovesFeatures: BitSet[] = new Array(featureSets.length).fill(null);
    const losingMovesFeatures: BitSet[] = new Array(featureSets.length).fill(null);
    const antiDefeatingMovesFeatures: BitSet[] = new Array(featureSets.length).fill(null);

    // prepare linear functions — stubs for not-yet-ported LinearFunction
    const selectionFunctions: (LinearFunction | null)[] = new Array(numPlayers + 1).fill(null);
    const playoutFunctions: (LinearFunction | null)[] = new Array(numPlayers + 1).fill(null);
    const tspgFunctions: (LinearFunction | null)[] = new Array(numPlayers + 1).fill(null);

    // create policies — stubs
    const selectionPolicy = {} as unknown as SoftmaxPolicyLinear;
    const playoutPolicy = {} as unknown as SoftmaxPolicyLinear;
    const tspgPolicy = {} as unknown as SoftmaxPolicyLinear;

    // feature set expander
    const featureSetExpander = {} as unknown as FeatureSetExpander;
    const specialMovesExpander = {} as unknown as FeatureSetExpander;

    // value function (stub — not yet ported; real Java loads from file/config)
    const valueFunction: Heuristics | null = exIt.objectiveParams.noValueLearning ? null : ({} as unknown as Heuristics);

    // optimisers
    const selectionOptimisers: (Optimiser | null)[] = new Array(numPlayers + 1).fill(null);
    const playoutOptimisers: (Optimiser | null)[] = new Array(numPlayers + 1).fill(null);
    const tspgOptimisers: (Optimiser | null)[] = new Array(numPlayers + 1).fill(null);
    const valueFunctionOptimiser: Optimiser | null = null;

    // menagerie population init
    menagerie.initialisePopulation(
      game, exIt.agentsParams,
      AIUtils.generateFeaturesMetadata(selectionPolicy, playoutPolicy) as unknown as import("./menageries/AgentCheckpoint.js").Features,
      (valueFunction as unknown) as import("./menageries/AgentCheckpoint.js").Heuristics
    );

    // trial / context
    const trial = {} as unknown as Trial;
    const context = {} as unknown as Context;

    // Replay buffers
    const experienceBuffers: ExperienceBuffer[] = new Array(numPlayers + 1).fill(null);
    const specialMoveExperienceBuffers: ExperienceBuffer[] = new Array(numPlayers + 1).fill(null);

    // Average game duration trackers
    const avgGameDurations: ExponentialMovingAverage[] = new Array(numPlayers + 1).fill(null);

    let actionCounter = 0;
    let weightsUpdateCounter =
      (exIt.outParams.checkpointType === CheckpointTypesEnum.WeightUpdate) ? lastCheckpoint : 0;

    let gameCounter = 0;

    // Possibly run policy gradient warm-up
    if (exIt.trainingParams.numPolicyGradientEpochs > 0) {
      featureSets = Reinforce.runSelfPlayPG(
        game as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[0],
        selectionPolicy as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[1],
        playoutPolicy as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[2],
        tspgPolicy as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[3],
        featureSets as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[4],
        featureSetExpander as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[5],
        selectionOptimisers as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[6],
        exIt.objectiveParams as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[7],
        exIt.featureDiscoveryParams as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[8],
        exIt.trainingParams as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[9],
        logWriter as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[10],
        { wantsInterrupt: () => interrupted, logLine: (_w: unknown, m: string) => console.log(m), interrupted, checkWallTime: () => {} } as unknown as Parameters<typeof Reinforce.runSelfPlayPG>[11]
      ) as unknown as (BaseFeatureSet | null)[];

      // Scale down all the policy weights
      for (let i = 0; i < playoutPolicy.linearFunctions().length; ++i) {
        const linFunc = playoutPolicy.linearFunctions()[i];
        if (linFunc === null || linFunc === undefined) continue;
        const weights = linFunc.trainableParams().allWeights();
        weights.mult(exIt.trainingParams.postPGWeightScalar);
        // Also copy over into selection policy
        const selWeights = selectionPolicy.linearFunctions()[i];
        if (selWeights !== null && selWeights !== undefined) {
          selWeights.trainableParams().allWeights().copyFrom(weights, 0, 0, weights.dim());
        }
      }
    }

    // Main game-playing loop
    for (; gameCounter < exIt.trainingParams.numTrainingGames; ++gameCounter) {
      if (interrupted) break;

      // Draw agents from menagerie
      const drawnExperts = menagerie.drawAgents(game, exIt.agentsParams);
      const experts = drawnExperts.getAgents();

      const gameExperienceSamples: ExItExperience[][] = [[]];
      for (let p = 1; p < experts.length; ++p) {
        const expert = experts[p];
        if (expert !== null && expert !== undefined) {
          const mcts = expert as unknown as { setNumThreads(n: number): void; setUseScoreBounds(b: boolean): void; setPreserveRootNode(b: boolean): void };
          if (typeof mcts.setNumThreads === "function") {
            mcts.setNumThreads(exIt.agentsParams.numAgentThreads);
            mcts.setUseScoreBounds(true);
          }
          expert.initAI(game as unknown as AIGame, p);
          mcts.setPreserveRootNode?.(true);
        }
        gameExperienceSamples.push([]);
      }

      game.start(context);

      while (!context.trial().over()) {
        if (interrupted) break;

        const mover = context.state().mover();
        const agentIdx = context.state().playerToAgent(mover);
        const expert = experts[agentIdx];
        if (expert === null || expert === undefined) break;

        expert.selectAction(
          game as unknown as AIGame,
          context as unknown as AIContext,
          exIt.agentsParams.thinkingTime,
          exIt.agentsParams.iterationLimit,
          exIt.agentsParams.depthLimit
        );

        const legalMoves = expert.lastSearchRootMoves();
        const expertDistribution = expert.computeExpertPolicy(1.0);
        const moveIdx = expertDistribution.sampleProportionally();
        const move = legalMoves.get(moveIdx);

        const newExperiences = expert.generateExItExperiences() as unknown as ExItExperience[];

        for (const newExperience of newExperiences) {
          const experienceMover = newExperience.state().state().mover();
          if (valueFunction !== null) {
            newExperience.setStateFeatureVector(
              valueFunction.computeStateFeatureVector(newExperience.context(), experienceMover)
            );
          }
          gameExperienceSamples[experienceMover]!.push(newExperience);
        }

        game.apply(context, move);
        ++actionCounter;

        if (actionCounter % exIt.trainingParams.updateWeightsEvery === 0) {
          for (let p = 1; p <= numPlayers; ++p) {
            const batch = experienceBuffers[p]!.sampleExperienceBatch(exIt.trainingParams.batchSize);
            if (batch.length === 0) continue;

            const gradientsSelection: FVector[] = [];
            const gradientsPlayout: FVector[] = [];
            let sumImportanceSamplingWeights = 0.0;

            for (let idx = 0; idx < batch.length; ++idx) {
              const sample = batch[idx]!;
              const featureVectors = (featureSets[p]! as BaseFeatureSet).computeFeatureVectors(
                sample.state().state() as unknown as Context,
                sample.moves(),
                false
              );
              const expertPolicy = sample.expertDistribution();
              const selectionErrors = Gradients.computeCrossEntropyErrors(
                selectionPolicy, expertPolicy, featureVectors, p, exIt.objectiveParams.handleAliasing
              );
              const playoutErrors = Gradients.computeCrossEntropyErrors(
                playoutPolicy, expertPolicy, featureVectors, p, exIt.objectiveParams.handleAliasingPlayouts
              );

              const selectionGradients = selectionPolicy.computeParamGradients(selectionErrors, featureVectors, p);
              const playoutGradients_ = selectionPolicy.computeParamGradients(playoutErrors, featureVectors, p);
              const valueGradients = Gradients.computeValueGradients(valueFunction, p, sample);

              let importanceSamplingWeight = sample.weightVisitCount();
              if (exIt.objectiveParams.importanceSamplingEpisodeDurations) {
                importanceSamplingWeight *= (avgGameDurations[sample.state().state().mover()]!.movingAvg() / sample.episodeDuration());
              }
              sumImportanceSamplingWeights += importanceSamplingWeight;
              selectionGradients.mult(importanceSamplingWeight);
              playoutGradients_.mult(importanceSamplingWeight);

              gradientsSelection.push(selectionGradients);
              gradientsPlayout.push(playoutGradients_);

              if (valueGradients !== null) {
                valueGradients.mult(importanceSamplingWeight);
              }
            }

            const meanGradientsSelection = exIt.objectiveParams.weightedImportanceSampling
              ? Gradients.wisGradients(gradientsSelection, sumImportanceSamplingWeights)
              : Gradients.meanGradients(gradientsSelection);
            const meanGradientsPlayout = exIt.objectiveParams.weightedImportanceSampling
              ? Gradients.wisGradients(gradientsPlayout, sumImportanceSamplingWeights)
              : Gradients.meanGradients(gradientsPlayout);

            if (selectionOptimisers[p] !== null) {
              Gradients.minimise(
                selectionOptimisers[p]!,
                selectionFunctions[p]!.trainableParams().allWeights(),
                meanGradientsSelection,
                exIt.objectiveParams.weightDecayLambda
              );
            }
            if (playoutOptimisers[p] !== null) {
              Gradients.minimise(
                playoutOptimisers[p]!,
                playoutFunctions[p]!.trainableParams().allWeights(),
                meanGradientsPlayout,
                exIt.objectiveParams.weightDecayLambda
              );
            }

            menagerie.updateDevFeatures(
              AIUtils.generateFeaturesMetadata(selectionPolicy, playoutPolicy) as unknown as import("./menageries/AgentCheckpoint.js").Features
            );

            ++weightsUpdateCounter;
          }
        }
      }

      if (!interrupted) {
        for (let p = 1; p <= numPlayers; ++p) {
          const pExperience = gameExperienceSamples[p]!;
          const gameDuration = pExperience.length;
          avgGameDurations[p]!.observe(gameDuration);

          const playerOutcomes = RankUtils.agentUtilities(context);

          // Shuffle
          for (let i = pExperience.length - 1; i > 0; --i) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = pExperience[i]!;
            pExperience[i] = pExperience[j]!;
            pExperience[j] = tmp;
          }

          for (const experience of pExperience) {
            experience.setEpisodeDuration(gameDuration);
            experience.setPlayerOutcomes(playerOutcomes);
            experienceBuffers[p]!.add(experience);

            if (
              !experience.winningMoves().isEmpty() ||
              !experience.losingMoves().isEmpty() ||
              !experience.antiDefeatingMoves().isEmpty()
            ) {
              specialMoveExperienceBuffers[p]!.add(experience);
            }
          }
        }
      }

      if (context.trial().over()) {
        menagerie.updateOutcome(context as unknown as import("./menageries/Menagerie.js").Context, drawnExperts);
      }

      for (let p = 1; p < experts.length; ++p) {
        const expert = experts[p];
        if (expert !== null && expert !== undefined)
          expert.closeAI();
      }
    }

    void [
      currentFeatureSetFilenames, currentPolicyWeightsSelectionFilenames,
      currentPolicyWeightsPlayoutFilenames, currentPolicyWeightsTSPGFilenames,
      currentPolicyWeightsCEEFilenames, currentValueFunctionFilename,
      currentExperienceBufferFilenames, currentSpecialMoveExperienceBufferFilenames,
      currentFinalStatesExperienceBufferFilenames, currentGameDurationTrackerFilenames,
      currentOptimiserSelectionFilenames, currentOptimiserPlayoutFilenames,
      currentOptimiserTSPGFilenames, currentOptimiserCEEFilenames,
      currentOptimiserValueFilename, featureLifetimes, featureActiveRatios,
      featureOccurrences, winningMovesFeatures, losingMovesFeatures,
      antiDefeatingMovesFeatures, selectionFunctions, playoutFunctions,
      tspgFunctions, selectionOptimisers, playoutOptimisers, tspgOptimisers,
      valueFunctionOptimiser, specialMovesExpander, BoostedLinearFunction,
      PrioritizedReplayBuffer, UniformExperienceBuffer, ExperimentFileUtils,
      OptimiserFactory, weightsUpdateCounter, actionCounter, gameCheckpointFormat,
      weightUpdateCheckpointFormat, lastCheckpoint,
    ];
  }

  //-------------------------------------------------------------------------

  /**
   * Creates a writer for output log, or null if we don't want one.
   * @java ExpertIteration.createLogWriter()
   */
  private createLogWriter(): PrintWriter {
    if (this.outParams.outDir !== null && this.outParams.outDir !== "" && !this.outParams.noLogging) {
      const nextLogFilepath = ExperimentFileUtils.getNextFilepath(
        this.outParams.outDir + "/ExIt", "log"
      );
      // In TS there is no PrintWriter — return a console-based stub
      return {
        println(s: string): void { console.log(s); },
        close(): void { /* nothing */ },
      };
    }
    return null;
  }

  //-------------------------------------------------------------------------
}
