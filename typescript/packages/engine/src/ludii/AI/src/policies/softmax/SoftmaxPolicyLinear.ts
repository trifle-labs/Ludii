// @java AI/src/policies/softmax/SoftmaxPolicyLinear.java

import { SoftmaxPolicy } from "./SoftmaxPolicy.js";
import type {
  FVector,
  FastArrayList,
  Move,
  BaseFeatureSet,
  FeatureVector,
  Game,
  FeaturesMetadata,
  FeatureSetMetadata,
} from "../Policy.js";
import { ExperimentFileUtils } from "../../utils/ExperimentFileUtils.js";

// Escape-hatch interfaces for not-yet-ported dependencies

/** @java features.WeightVector */
interface WeightVector {
  allWeights(): FVector;
}

/** @java function_approx.LinearFunction */
interface LinearFunction {
  predict(featureVector: FeatureVector): number;
  effectiveParams(): WeightVector;
  trainableParams(): { allWeights(): FVector };
  setTheta(wv: WeightVector): void;
  featureSetFile(): string;
}

/** @java function_approx.LinearFunction (static) */
interface LinearFunctionStatic {
  fromFile(path: string): LinearFunction;
  fromString(lines: string[]): LinearFunction;
}

/** @java function_approx.BoostedLinearFunction (static) */
interface BoostedLinearFunctionStatic {
  boostedFromFile(path: string | null, aux: unknown): LinearFunction;
}

/** @java features.feature_sets.BaseFeatureSet.FeatureSetImplementations */
const FeatureSetImplementations = {
  NAIVE: "NAIVE",
  TREE: "TREE",
  SPATTERNET: "SPATTERNET",
  JITSPATTERNET: "JITSPATTERNET",
} as const;
type FeatureSetImplementation = typeof FeatureSetImplementations[keyof typeof FeatureSetImplementations];

/** @java features.aspatial.AspatialFeature */
interface AspatialFeature {
  __aspatial: true;
  toString(): string;
}

/** @java features.spatial.SpatialFeature */
interface SpatialFeature {
  __spatial: true;
  toString(): string;
}

/** @java features.Feature */
interface Feature {
  toString(): string;
}

/** @java features.Feature.fromString(String) — escape hatch */
declare function featureFromString(s: string): Feature;

/**
 * Escape-hatch stubs for not-yet-ported feature-set constructors.
 * Real implementations will come from ported classes.
 */
const featureSetFactory = {
  construct: (_aspatial: AspatialFeature[], _spatial: SpatialFeature[]): BaseFeatureSet => {
    throw new Error("JITSPatterNetFeatureSet not yet ported");
  },
  constructFromFile: (_path: string): BaseFeatureSet => {
    throw new Error("JITSPatterNetFeatureSet.construct(String) not yet ported");
  },
  constructNaive: (_aspatial: AspatialFeature[], _spatial: SpatialFeature[]): BaseFeatureSet => {
    throw new Error("NaiveFeatureSet not yet ported");
  },
  constructNaiveFromFile: (_path: string): BaseFeatureSet => {
    throw new Error("NaiveFeatureSet(String) not yet ported");
  },
  constructLegacy: (_aspatial: AspatialFeature[], _spatial: SpatialFeature[]): BaseFeatureSet => {
    throw new Error("LegacyFeatureSet not yet ported");
  },
  constructLegacyFromFile: (_path: string): BaseFeatureSet => {
    throw new Error("LegacyFeatureSet(String) not yet ported");
  },
  constructSPatterNet: (_aspatial: AspatialFeature[], _spatial: SpatialFeature[]): BaseFeatureSet => {
    throw new Error("SPatterNetFeatureSet not yet ported");
  },
  constructSPatterNetFromFile: (_path: string): BaseFeatureSet => {
    throw new Error("SPatterNetFeatureSet(String) not yet ported");
  },
};

/** @java compiler.Compiler.compileObject */
declare function compileObject(source: string, className: string, report: unknown): unknown;

/** @java main.FileHandling.loadTextContentsFromFile */
declare function loadTextContentsFromFile(path: string): string;

/** @java main.grammar.Report */
declare function newReport(): unknown;

/** @java function_approx.LinearFunction */
declare const LinearFunctionImpl: LinearFunctionStatic;

/** @java function_approx.BoostedLinearFunction */
declare const BoostedLinearFunctionImpl: BoostedLinearFunctionStatic;

/** @java gnu.trove.list.array.TFloatArrayList */
class TFloatArrayList {
  private data: number[] = [];
  public add(v: number): void { this.data.push(v); }
  public toArray(): number[] { return this.data.slice(); }
}

/**
 * A policy which:
 *  - Uses a linear function approximator to compute one logit per action.
 *  - Uses softmax to compute a probability distribution from those logits.
 *  - Selects actions according to the softmax distribution.
 *
 * @java policies/softmax/SoftmaxPolicyLinear.java
 * @author Dennis Soemers
 */
export class SoftmaxPolicyLinear extends SoftmaxPolicy {

  //-------------------------------------------------------------------------

  /**
   * Linear function approximators (can output one logit per action)
   * If it contains only one function, it will be shared across all players.
   * Otherwise, it will contain one function per player.
   */
  protected linearFunctions: (LinearFunction | null)[] | null;

  /**
   * Feature Sets to use to generate feature vectors for state+action pairs.
   * If it contains only one feature set, it will be shared across all players.
   * Otherwise, it will contain one Feature Set per player.
   */
  protected featureSets: (BaseFeatureSet | null)[] | null;

  /** Implementation to use for feature sets */
  protected implementation: FeatureSetImplementation = FeatureSetImplementations.JITSPATTERNET;

  //-------------------------------------------------------------------------

  /**
   * Default constructor. Will initialise important parts to null and break
   * down if used directly. Should customise() it first!
   * @java SoftmaxPolicyLinear()
   */
  public constructor();
  /**
   * Constructs a softmax policy with a linear function approximator
   * @java SoftmaxPolicyLinear(LinearFunction[], BaseFeatureSet[])
   */
  public constructor(linearFunctions: LinearFunction[], featureSets: BaseFeatureSet[]);
  /**
   * Constructs a softmax policy with a linear function approximator,
   * and a limit on the number of play-out actions to run.
   * @java SoftmaxPolicyLinear(LinearFunction[], BaseFeatureSet[], int)
   */
  public constructor(linearFunctions: LinearFunction[], featureSets: BaseFeatureSet[], playoutActionLimit: number);
  public constructor(
    linearFunctions?: LinearFunction[],
    featureSets?: BaseFeatureSet[],
    playoutActionLimit?: number
  ) {
    super();
    if (linearFunctions !== undefined && featureSets !== undefined) {
      this.linearFunctions = linearFunctions.slice();
      this.featureSets = featureSets.slice();
      if (playoutActionLimit !== undefined) {
        this.playoutActionLimit = playoutActionLimit;
      }
    } else {
      this.linearFunctions = null;
      this.featureSets = null;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Constructs a softmax policy from a given set of features as created
   * by the compiler, using the Selection weights.
   * @java SoftmaxPolicyLinear.constructSelectionPolicy(Features, double)
   */
  public static constructSelectionPolicy(features: FeaturesMetadata, epsilon: number): SoftmaxPolicyLinear {
    const softmax = new SoftmaxPolicyLinear();

    const featureSetsList: (BaseFeatureSet | null)[] = [];
    const linFuncs: (LinearFunction | null)[] = [];

    for (const featureSet of features.featureSets()) {
      const role = featureSet.role();
      const isSharedOrNeutral = role.name() === "Shared" || role.name() === "Neutral";
      if (isSharedOrNeutral)
        softmax.addFeatureSetWeights(0, featureSet.featureStrings(), featureSet.selectionWeights(), featureSetsList, linFuncs);
      else
        softmax.addFeatureSetWeights(role.owner(), featureSet.featureStrings(), featureSet.selectionWeights(), featureSetsList, linFuncs);
    }

    softmax.featureSets = featureSetsList;
    softmax.linearFunctions = linFuncs;
    softmax.epsilon = epsilon;

    return softmax;
  }

  /**
   * Constructs a softmax policy from a given set of features as created
   * by the compiler, using the Playout weights.
   * @java SoftmaxPolicyLinear.constructPlayoutPolicy(Features, double)
   */
  public static constructPlayoutPolicy(features: FeaturesMetadata, epsilon: number): SoftmaxPolicyLinear {
    const softmax = new SoftmaxPolicyLinear();

    const featureSetsList: (BaseFeatureSet | null)[] = [];
    const linFuncs: (LinearFunction | null)[] = [];

    for (const featureSet of features.featureSets()) {
      const role = featureSet.role();
      const isSharedOrNeutral = role.name() === "Shared" || role.name() === "Neutral";
      if (isSharedOrNeutral)
        softmax.addFeatureSetWeights(0, featureSet.featureStrings(), featureSet.playoutWeights(), featureSetsList, linFuncs);
      else
        softmax.addFeatureSetWeights(role.owner(), featureSet.featureStrings(), featureSet.playoutWeights(), featureSetsList, linFuncs);
    }

    softmax.featureSets = featureSetsList;
    softmax.linearFunctions = linFuncs;
    softmax.epsilon = epsilon;

    return softmax;
  }

  //-------------------------------------------------------------------------

  /**
   * @java SoftmaxPolicyLinear.computeDistribution(Context, FastArrayList, boolean)
   */
  public override computeDistribution(
    context: unknown,
    actions: FastArrayList<Move>,
    thresholded: boolean
  ): FVector {
    const ctx = context as { state(): { mover(): number } };
    const featureSet = this.featureSets!.length === 1
      ? this.featureSets![0]!
      : this.featureSets![ctx.state().mover()]!;

    return this.computeDistributionFromVectors(
      featureSet.computeFeatureVectors(context, actions, thresholded),
      ctx.state().mover()
    );
  }

  /**
   * @java SoftmaxPolicyLinear.computeLogit(Context, Move)
   */
  public override computeLogit(context: unknown, move: Move): number {
    const ctx = context as { state(): { mover(): number } };
    const featureSet = this.featureSets!.length === 1
      ? this.featureSets![0]!
      : this.featureSets![ctx.state().mover()]!;

    const linearFunction = this.linearFunctions!.length === 1
      ? this.linearFunctions![0]!
      : this.linearFunctions![ctx.state().mover()]!;

    return linearFunction.predict(featureSet.computeFeatureVector(context, move, true));
  }

  /**
   * @param featureVectors
   * @param player
   * @return Probability distribution over actions implied by a list of sparse feature vectors
   * @java SoftmaxPolicyLinear.computeDistribution(FeatureVector[], int)
   */
  public computeDistributionFromVectors(
    featureVectors: FeatureVector[],
    player: number
  ): FVector {
    const logits: number[] = new Array(featureVectors.length);
    const linearFunction = this.linearFunctions!.length === 1
      ? this.linearFunctions![0]!
      : this.linearFunctions![player]!;

    for (let i = 0; i < featureVectors.length; ++i) {
      logits[i] = linearFunction.predict(featureVectors[i]!);
    }

    const distribution = (this.constructor as typeof SoftmaxPolicyLinear)._fVectorWrap(logits);
    distribution.softmax();

    return distribution;
  }

  /**
   * @java SoftmaxPolicyLinear.computeParamGradients(FVector, FeatureVector[], int)
   */
  public computeParamGradients(
    errors: FVector,
    featureVectors: FeatureVector[],
    player: number
  ): FVector {
    const linearFunction = this.linearFunctions!.length === 1
      ? this.linearFunctions![0]!
      : this.linearFunctions![player]!;

    const grads = SoftmaxPolicyLinear._newFVector(linearFunction.trainableParams().allWeights().dim());
    const numActions = errors.dim();

    for (let i = 0; i < numActions; ++i) {
      const error = errors.get(i);
      const featureVector = featureVectors[i]!;

      const aspatialFeatureValues = featureVector.aspatialFeatureValues();
      const numAspatialFeatures = aspatialFeatureValues.dim();

      for (let j = 0; j < numAspatialFeatures; ++j) {
        grads.addToEntry(j, error * aspatialFeatureValues.get(j));
      }

      const activeSpatialFeatureIndices = featureVector.activeSpatialFeatureIndices();
      for (let j = 0; j < activeSpatialFeatureIndices.size(); ++j) {
        const featureIdx = activeSpatialFeatureIndices.getQuick(j);
        grads.addToEntry(featureIdx + numAspatialFeatures, error);
      }
    }

    return grads;
  }

  /**
   * @java SoftmaxPolicyLinear.selectActionFromDistribution(FVector)
   */
  public selectActionFromDistribution(distribution: FVector): number {
    return distribution.sampleFromDistribution();
  }

  /**
   * Updates this policy to use a new array of Feature Sets.
   * @java SoftmaxPolicyLinear.updateFeatureSets(BaseFeatureSet[])
   */
  public updateFeatureSets(newFeatureSets: (BaseFeatureSet | null)[]): void {
    for (let i = 0; i < this.linearFunctions!.length; ++i) {
      if (newFeatureSets[i] !== null && newFeatureSets[i] !== undefined) {
        const numExtraFeatures =
          newFeatureSets[i]!.getNumSpatialFeatures() - this.featureSets![i]!.getNumSpatialFeatures();

        for (let j = 0; j < numExtraFeatures; ++j) {
          this.linearFunctions![i]!.setTheta(
            SoftmaxPolicyLinear._makeWeightVector(
              this.linearFunctions![i]!.trainableParams().allWeights().append(0.0)
            )
          );
        }

        this.featureSets![i] = newFeatureSets[i] ?? null;
      } else if (newFeatureSets[0] !== null && newFeatureSets[0] !== undefined) {
        const numExtraFeatures =
          newFeatureSets[0]!.getNumSpatialFeatures() - this.featureSets![0]!.getNumSpatialFeatures();

        for (let j = 0; j < numExtraFeatures; ++j) {
          this.linearFunctions![i]!.setTheta(
            SoftmaxPolicyLinear._makeWeightVector(
              this.linearFunctions![i]!.trainableParams().allWeights().append(0.0)
            )
          );
        }
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java SoftmaxPolicyLinear.runPlayout(MCTS, Context)
   */
  public override runPlayout(mcts: unknown, context: unknown): unknown {
    const params: (unknown | null)[] = new Array(this.linearFunctions!.length);
    for (let i = 0; i < this.linearFunctions!.length; ++i) {
      if (this.linearFunctions![i] === null) {
        params[i] = null;
      } else {
        params[i] = this.linearFunctions![i]!.effectiveParams();
      }
    }

    const playoutMoveSelector = this._makePlayoutMoveSelector(params);
    const ctx = context as { game(): { playout: (...args: unknown[]) => unknown } };

    return ctx.game().playout(
      context,
      null,
      1.0,
      playoutMoveSelector,
      this.playoutActionLimit,
      this.playoutTurnLimit,
      Math.random // ThreadLocalRandom equivalent
    );
  }

  private _makePlayoutMoveSelector(params: unknown[]): unknown {
    if (this.epsilon < 1.0) {
      if (this.epsilon <= 0.0) {
        return SoftmaxPolicyLinear._newFeaturesSoftmaxMoveSelector(this.featureSets!, params, true);
      } else {
        return SoftmaxPolicyLinear._newEpsilonGreedyWrapper(
          SoftmaxPolicyLinear._newFeaturesSoftmaxMoveSelector(this.featureSets!, params, true),
          this.epsilon
        );
      }
    } else {
      return null;
    }
  }

  /**
   * @java SoftmaxPolicyLinear.playoutSupportsGame(Game)
   */
  public override playoutSupportsGame(game: unknown): boolean {
    return this.supportsGame(game);
  }

  /**
   * @java SoftmaxPolicyLinear.backpropFlags()
   */
  public override backpropFlags(): number {
    return 0;
  }

  /**
   * @java SoftmaxPolicyLinear.customise(String[])
   */
  public override customise(inputs: string[]): void {
    const policyWeightsFilepaths: (string | null)[] = [];
    let featuresMetadata: FeaturesMetadata | null = null;
    let boosted = false;

    const MAX_PLAYERS = 32; // main.Constants.MAX_PLAYERS

    for (let i = 1; i < inputs.length; ++i) {
      const input = inputs[i]!;

      if (input.toLowerCase().startsWith("policyweights=")) {
        if (policyWeightsFilepaths.length > 0)
          policyWeightsFilepaths.length = 0;
        policyWeightsFilepaths.push(input.substring("policyweights=".length));
      } else if (input.toLowerCase().startsWith("policyweights")) {
        for (let p = 1; p <= MAX_PLAYERS; ++p) {
          if (input.toLowerCase().startsWith("policyweights" + p + "=")) {
            while (policyWeightsFilepaths.length <= p) {
              policyWeightsFilepaths.push(null);
            }
            if (p < 10)
              policyWeightsFilepaths[p] = input.substring("policyweightsX=".length);
            else
              policyWeightsFilepaths[p] = input.substring("policyweightsXX=".length);
          }
        }
      } else if (input.toLowerCase().startsWith("featuresmetadata=")) {
        // Not loading compiler features from file in TS — escape hatch
        console.error("SoftmaxPolicyLinear: featuresmetadata= loading not supported in TypeScript");
      } else if (input.toLowerCase().startsWith("playoutactionlimit=")) {
        this.playoutActionLimit = parseInt(input.substring("playoutactionlimit=".length), 10);
      } else if (input.toLowerCase().startsWith("playoutturnlimit=")) {
        this.playoutTurnLimit = parseInt(input.substring("playoutturnlimit=".length), 10);
      } else if (input.toLowerCase().startsWith("friendly_name=")) {
        this.friendlyName = input.substring("friendly_name=".length);
      } else if (input.toLowerCase().startsWith("boosted=")) {
        if (input.toLowerCase().endsWith("true")) {
          boosted = true;
        }
      } else if (input.toLowerCase().startsWith("epsilon=")) {
        this.epsilon = parseFloat(input.substring("epsilon=".length));
      } else if (input.toLowerCase().startsWith("implementation=")) {
        const impl = input.substring("implementation=".length).toUpperCase();
        this.implementation = impl as FeatureSetImplementation;
      }
    }

    void featuresMetadata; // suppress unused warning

    if (policyWeightsFilepaths.length > 0) {
      this.linearFunctions = new Array(policyWeightsFilepaths.length).fill(null);
      this.featureSets = new Array(policyWeightsFilepaths.length).fill(null);

      for (let i = 0; i < policyWeightsFilepaths.length; ++i) {
        let policyWeightsFilepath = policyWeightsFilepaths[i];

        if (policyWeightsFilepath !== null && policyWeightsFilepath !== undefined) {
          const parentDir = SoftmaxPolicyLinear._getParentDir(policyWeightsFilepath);

          if (!SoftmaxPolicyLinear._fileExists(policyWeightsFilepath)) {
            if (policyWeightsFilepath.includes("Selection")) {
              policyWeightsFilepath =
                ExperimentFileUtils.getLastFilepath(parentDir + "/PolicyWeightsSelection_P" + i, "txt");
            } else if (policyWeightsFilepath.includes("Playout")) {
              policyWeightsFilepath =
                ExperimentFileUtils.getLastFilepath(parentDir + "/PolicyWeightsPlayout_P" + i, "txt");
            } else if (policyWeightsFilepath.includes("TSPG")) {
              policyWeightsFilepath =
                ExperimentFileUtils.getLastFilepath(parentDir + "/PolicyWeightsTSPG_P" + i, "txt");
            } else if (policyWeightsFilepath.includes("PolicyWeightsCE")) {
              policyWeightsFilepath =
                ExperimentFileUtils.getLastFilepath(parentDir + "/PolicyWeightsCE_P" + i, "txt");
            } else {
              policyWeightsFilepath = null;
            }
          }

          if (policyWeightsFilepath === null)
            console.error("Cannot resolve policy weights filepath: " + policyWeightsFilepaths[i]);

          if (boosted)
            this.linearFunctions[i] = SoftmaxPolicyLinear._boostedFromFile(policyWeightsFilepath, null);
          else
            this.linearFunctions[i] = SoftmaxPolicyLinear._linearFromFile(policyWeightsFilepath);

          const featureSetFilepath = parentDir + "/" + this.linearFunctions[i]!.featureSetFile();
          this.featureSets[i] = SoftmaxPolicyLinear._constructFeatureSetFromFile(
            this.implementation, featureSetFilepath
          );
        }
      }
    } else {
      console.error("Cannot construct linear Softmax Policy from: " + inputs.toString());
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java SoftmaxPolicyLinear.selectAction(Game, Context, double, int, int)
   */
  public override selectAction(
    game: unknown,
    context: unknown,
    _maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): Move {
    const g = game as Game;
    const ctx = context as { state(): { mover(): number } };
    const actions = g.moves(context);

    const featureSet = this.featureSets!.length === 1
      ? this.featureSets![0]!
      : this.featureSets![ctx.state().mover()]!;

    return actions.moves().get(
      this.selectActionFromDistribution(
        this.computeDistributionFromVectors(
          featureSet.computeFeatureVectors(context, actions.moves(), true),
          ctx.state().mover()
        )
      )
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java SoftmaxPolicyLinear.initAI(Game, int)
   */
  public override initAI(game: unknown, _playerID: number): void {
    const g = game as Game;
    if (this.featureSets!.length === 1) {
      const supportedPlayers: number[] = new Array(g.players().count());
      for (let i = 0; i < supportedPlayers.length; ++i) {
        supportedPlayers[i] = i + 1;
      }
      this.featureSets![0]!.init(game, supportedPlayers, this.linearFunctions![0]!.effectiveParams());
    } else {
      for (let i = 1; i < this.featureSets!.length; ++i) {
        this.featureSets![i]!.init(game, [i], this.linearFunctions![i]!.effectiveParams());
      }
    }
  }

  /**
   * @java SoftmaxPolicyLinear.closeAI()
   */
  public override closeAI(): void {
    if (this.featureSets === null) return;

    if (this.featureSets.length === 1) {
      this.featureSets[0]?.closeCache();
    } else {
      for (let i = 1; i < this.featureSets.length; ++i) {
        this.featureSets[i]?.closeCache();
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @param player
   * @return Linear function corresponding to given player
   * @java SoftmaxPolicyLinear.linearFunction(int)
   */
  public linearFunction(player: number): LinearFunction | null {
    if (this.linearFunctions!.length === 1)
      return this.linearFunctions![0]!;
    else
      return this.linearFunctions![player]!;
  }

  /**
   * @return The linear functions used to compute logits
   * @java SoftmaxPolicyLinear.linearFunctions()
   */
  public linearFunctionsArr(): (LinearFunction | null)[] | null {
    return this.linearFunctions;
  }

  /**
   * @return Feature Sets used by this policy
   * @java SoftmaxPolicyLinear.featureSets()
   */
  public featureSetsArr(): (BaseFeatureSet | null)[] | null {
    return this.featureSets;
  }

  //-------------------------------------------------------------------------

  /**
   * @param lines
   * @return A softmax policy constructed from a given array of input lines
   * @java SoftmaxPolicyLinear.fromLines(String[])
   */
  public static fromLines(lines: string[]): SoftmaxPolicy {
    let policy: SoftmaxPolicy | null = null;

    for (const line of lines) {
      if (line.toLowerCase() === "features=from_metadata") {
        // Defer to dynamic import; use escape hatch
        policy = SoftmaxPolicyLinear._makeSoftmaxFromMetadataSelection(0.0);
        break;
      }
    }

    if (policy === null)
      policy = new SoftmaxPolicyLinear();

    policy.customise(lines);
    return policy;
  }

  /**
   * @param weightsFile
   * @return A Softmax policy constructed from a given file
   * @java SoftmaxPolicyLinear.fromFile(File)
   */
  public static fromFile(weightsFilePath: string): SoftmaxPolicyLinear {
    const policy = new SoftmaxPolicyLinear();
    let boosted = false;

    try {
      const content = SoftmaxPolicyLinear._readFileAsString(weightsFilePath);
      const lines = content.split(/\r?\n/);
      const lastLine = lines[lines.length - 1] ?? "";
      if (!lastLine.startsWith("FeatureSet=")) {
        boosted = true;
      }
    } catch (_e) {
      console.error("SoftmaxPolicyLinear.fromFile: error reading file " + weightsFilePath);
    }

    policy.customise([
      "softmax",
      "policyweights=" + weightsFilePath,
      "boosted=" + boosted,
    ]);
    return policy;
  }

  //-------------------------------------------------------------------------

  /**
   * Helper method that adds a Feature Set and a Linear Function for the
   * given player index
   * @java SoftmaxPolicyLinear.addFeatureSetWeights(int, String[], float[], List, List)
   */
  protected addFeatureSetWeights(
    playerIdx: number,
    featureStrings: string[],
    featureWeights: number[],
    outFeatureSets: (BaseFeatureSet | null)[],
    outLinFuncs: (LinearFunction | null)[]
  ): void {
    while (outFeatureSets.length <= playerIdx) {
      outFeatureSets.push(null);
    }
    while (outLinFuncs.length <= playerIdx) {
      outLinFuncs.push(null);
    }

    const aspatialFeatures: AspatialFeature[] = [];
    const spatialFeatures: SpatialFeature[] = [];
    const weights = new TFloatArrayList();

    for (let i = 0; i < featureStrings.length; ++i) {
      const feature = SoftmaxPolicyLinear._featureFromString(featureStrings[i]!);
      if (SoftmaxPolicyLinear._isAspatial(feature)) {
        aspatialFeatures.push(feature as AspatialFeature);
      } else {
        spatialFeatures.push(feature as SpatialFeature);
      }
      weights.add(featureWeights[i]!);
    }

    const featureSet = SoftmaxPolicyLinear._constructFeatureSet(
      this.implementation, aspatialFeatures, spatialFeatures
    );
    outFeatureSets[playerIdx] = featureSet;
    outLinFuncs[playerIdx] = SoftmaxPolicyLinear._makeLinearFunction(
      SoftmaxPolicyLinear._makeWeightVector(
        SoftmaxPolicyLinear._fVectorWrap(weights.toArray())
      )
    );
  }

  //-------------------------------------------------------------------------
  // Escape-hatch factory stubs — real implementations come from ported deps

  /** @java FVector.wrap(float[]) */
  private static _fVectorWrap(arr: number[]): FVector {
    return (arr as unknown as { __fvec: true }) as unknown as FVector;
  }

  /** @java new FVector(int) */
  private static _newFVector(_dim: number): FVector {
    return ({} as unknown) as FVector;
  }

  /** @java new WeightVector(FVector) */
  private static _makeWeightVector(fv: FVector): WeightVector {
    return { allWeights: () => fv };
  }

  /** @java new LinearFunction(WeightVector) */
  private static _makeLinearFunction(_wv: WeightVector): LinearFunction {
    return {} as unknown as LinearFunction;
  }

  /** @java Feature.fromString(String) */
  private static _featureFromString(_s: string): Feature {
    return {} as unknown as Feature;
  }

  /** @java feature instanceof AspatialFeature */
  private static _isAspatial(_f: Feature): boolean {
    return false; // escape hatch
  }

  /** @java LinearFunction.fromFile(String) */
  private static _linearFromFile(_path: string | null): LinearFunction {
    return {} as unknown as LinearFunction;
  }

  /** @java BoostedLinearFunction.boostedFromFile(String, null) */
  private static _boostedFromFile(_path: string | null, _aux: unknown): LinearFunction {
    return {} as unknown as LinearFunction;
  }

  /** @java SoftmaxFromMetadataSelection(double) */
  private static _makeSoftmaxFromMetadataSelection(_epsilon: number): SoftmaxPolicy {
    return {} as unknown as SoftmaxPolicy;
  }

  /** @java new FeaturesSoftmaxMoveSelector(BaseFeatureSet[], WeightVector[], boolean) */
  private static _newFeaturesSoftmaxMoveSelector(
    _featureSets: unknown[],
    _params: unknown[],
    _greedy: boolean
  ): unknown {
    return {} as unknown;
  }

  /** @java new EpsilonGreedyWrapper(PlayoutMoveSelector, double) */
  private static _newEpsilonGreedyWrapper(_inner: unknown, _epsilon: number): unknown {
    return {} as unknown;
  }

  /** @java file.getParent() */
  private static _getParentDir(filepath: string): string {
    const idx = Math.max(filepath.lastIndexOf("/"), filepath.lastIndexOf("\\"));
    return idx >= 0 ? filepath.substring(0, idx) : ".";
  }

  /** @java new File(path).exists() */
  private static _fileExists(path: string): boolean {
    try {
      const fs = require("fs") as typeof import("fs");
      return fs.existsSync(path);
    } catch (_e) {
      return false;
    }
  }

  /** @java Files.readString(...) */
  private static _readFileAsString(path: string): string {
    const fs = require("fs") as typeof import("fs");
    return fs.readFileSync(path, "utf8");
  }

  /** @java JITSPatterNetFeatureSet.construct(String) etc */
  private static _constructFeatureSetFromFile(
    impl: FeatureSetImplementation,
    filepath: string
  ): BaseFeatureSet {
    void impl; void filepath;
    return {} as unknown as BaseFeatureSet;
  }

  /** @java JITSPatterNetFeatureSet.construct(List, List) etc */
  private static _constructFeatureSet(
    impl: FeatureSetImplementation,
    aspatial: AspatialFeature[],
    spatial: SpatialFeature[]
  ): BaseFeatureSet {
    void impl; void aspatial; void spatial;
    return {} as unknown as BaseFeatureSet;
  }

  //-------------------------------------------------------------------------
}
