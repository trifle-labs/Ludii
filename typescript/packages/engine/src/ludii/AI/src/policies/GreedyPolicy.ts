// @java AI/src/policies/GreedyPolicy.java

import { Policy } from "./Policy.js";
import type { FVector, FastArrayList, Move, BaseFeatureSet, FeatureVector, Game } from "./Policy.js";
import { ExperimentFileUtils } from "../utils/ExperimentFileUtils.js";

/** @java features.WeightVector */
interface WeightVector {
  allWeights(): FVector;
}

/** @java function_approx.LinearFunction */
interface LinearFunction {
  predict(featureVector: FeatureVector): number;
  effectiveParams(): WeightVector;
  featureSetFile(): string;
}

/**
 * A greedy policy (plays greedily according to estimates by a linear function
 * approximator).
 *
 * @java policies/GreedyPolicy.java
 * @author Dennis Soemers and cambolbro
 */
export class GreedyPolicy extends Policy {

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

  /** Auto-end playouts in a draw if they take more turns than this */
  protected playoutTurnLimit: number = 200;

  //-------------------------------------------------------------------------

  /**
   * Default constructor. Will initialize important parts to null and break
   * down if used directly. Should customize() it first!
   * @java GreedyPolicy()
   */
  public constructor();
  /**
   * Constructs a greedy policy with linear function approximators
   * @java GreedyPolicy(LinearFunction[], BaseFeatureSet[])
   */
  public constructor(linearFunctions: LinearFunction[], featureSets: BaseFeatureSet[]);
  public constructor(
    linearFunctions?: LinearFunction[],
    featureSets?: BaseFeatureSet[]
  ) {
    super();
    if (linearFunctions !== undefined && featureSets !== undefined) {
      this.linearFunctions = linearFunctions;
      this.featureSets = featureSets;
    } else {
      this.linearFunctions = null;
      this.featureSets = null;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java GreedyPolicy.computeDistribution(Context, FastArrayList, boolean)
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
   * @param featureVectors
   * @param player
   * @return Logits for the actions implied by a list of feature vectors.
   * @java GreedyPolicy.computeLogits(FeatureVector[], int)
   */
  public computeLogits(featureVectors: FeatureVector[], player: number): number[] {
    const logits: number[] = new Array(featureVectors.length);
    const linearFunction = this.linearFunctions!.length === 1
      ? this.linearFunctions![0]!
      : this.linearFunctions![player]!;

    for (let i = 0; i < featureVectors.length; ++i) {
      logits[i] = linearFunction.predict(featureVectors[i]!);
    }

    return logits;
  }

  /**
   * @java GreedyPolicy.computeLogit(Context, Move)
   */
  public override computeLogit(context: unknown, move: Move): number {
    const ctx = context as { state(): { mover(): number } };
    const linearFunction = this.linearFunctions!.length === 1
      ? this.linearFunctions![0]!
      : this.linearFunctions![ctx.state().mover()]!;

    const featureSet = this.featureSets!.length === 1
      ? this.featureSets![0]!
      : this.featureSets![ctx.state().mover()]!;

    return linearFunction.predict(featureSet.computeFeatureVector(context, move, true));
  }

  /**
   * @param featureVectors One feature vector per action
   * @param player Player for which to use features
   * @return Probability distribution over actions implied by a list of sparse feature vectors
   * @java GreedyPolicy.computeDistribution(FeatureVector[], int)
   */
  public computeDistributionFromVectors(
    featureVectors: FeatureVector[],
    player: number
  ): FVector {
    const logits = this.computeLogits(featureVectors, player);

    let maxLogit = -Infinity;
    const maxLogitIndices: number[] = [];

    for (let i = 0; i < logits.length; ++i) {
      const logit = logits[i]!;
      if (logit > maxLogit) {
        maxLogit = logit;
        maxLogitIndices.length = 0;
        maxLogitIndices.push(i);
      } else if (logit === maxLogit) {
        maxLogitIndices.push(i);
      }
    }

    // this is the probability we assign to all max logits
    const maxProb = 1.0 / maxLogitIndices.length;

    // now create the distribution
    const distribution = GreedyPolicy._newFVector(logits.length);
    for (let i = 0; i < maxLogitIndices.length; ++i) {
      distribution.set(maxLogitIndices[i]!, maxProb);
    }

    return distribution;
  }

  //-------------------------------------------------------------------------

  /**
   * @java GreedyPolicy.runPlayout(MCTS, Context)
   */
  public override runPlayout(_mcts: unknown, context: unknown): unknown {
    const params: (unknown | null)[] = new Array(this.linearFunctions!.length);
    for (let i = 0; i < this.linearFunctions!.length; ++i) {
      if (this.linearFunctions![i] === null) {
        params[i] = null;
      } else {
        params[i] = this.linearFunctions![i]!.effectiveParams();
      }
    }

    const ctx = context as { game(): { playout: (...args: unknown[]) => unknown } };
    return ctx.game().playout(
      context,
      null,
      1.0,
      GreedyPolicy._newFeaturesSoftmaxMoveSelector(this.featureSets!, params, true),
      -1,
      this.playoutTurnLimit,
      Math.random
    );
  }

  /**
   * @java GreedyPolicy.playoutSupportsGame(Game)
   */
  public override playoutSupportsGame(game: unknown): boolean {
    return this.supportsGame(game);
  }

  /**
   * @java GreedyPolicy.backpropFlags()
   */
  public override backpropFlags(): number {
    return 0;
  }

  /**
   * @java GreedyPolicy.customise(String[])
   */
  public override customise(inputs: string[]): void {
    const policyWeightsFilepaths: (string | null)[] = [];
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
      } else if (input.toLowerCase().startsWith("playoutturnlimit=")) {
        this.playoutTurnLimit = parseInt(input.substring("playoutturnlimit=".length), 10);
      } else if (input.toLowerCase().startsWith("friendly_name=")) {
        this.friendlyName = input.substring("friendly_name=".length);
      } else if (input.toLowerCase().startsWith("boosted=")) {
        if (input.toLowerCase().endsWith("true")) {
          boosted = true;
        }
      }
    }

    if (policyWeightsFilepaths.length > 0) {
      this.linearFunctions = new Array(policyWeightsFilepaths.length).fill(null);
      this.featureSets = new Array(policyWeightsFilepaths.length).fill(null);

      for (let i = 0; i < policyWeightsFilepaths.length; ++i) {
        let policyWeightsFilepath = policyWeightsFilepaths[i];

        if (policyWeightsFilepath !== null && policyWeightsFilepath !== undefined) {
          const parentDir = GreedyPolicy._getParentDir(policyWeightsFilepath);

          if (!GreedyPolicy._fileExists(policyWeightsFilepath)) {
            if (policyWeightsFilepath.includes("Selection")) {
              policyWeightsFilepath =
                ExperimentFileUtils.getLastFilepath(parentDir + "/PolicyWeightsSelection_P" + i, "txt");
            } else if (policyWeightsFilepath.includes("Playout")) {
              policyWeightsFilepath =
                ExperimentFileUtils.getLastFilepath(parentDir + "/PolicyWeightsPlayout_P" + i, "txt");
            } else if (policyWeightsFilepath.includes("TSPG")) {
              policyWeightsFilepath =
                ExperimentFileUtils.getLastFilepath(parentDir + "/PolicyWeightsTSPG_P" + i, "txt");
            } else {
              policyWeightsFilepath = null;
            }
          }

          if (boosted)
            this.linearFunctions[i] = GreedyPolicy._boostedFromFile(policyWeightsFilepath, null);
          else
            this.linearFunctions[i] = GreedyPolicy._linearFromFile(policyWeightsFilepath);

          this.featureSets[i] = GreedyPolicy._constructJITSPatterNetFromFile(
            parentDir + "/" + this.linearFunctions[i]!.featureSetFile()
          );
        }
      }
    } else {
      console.error("Cannot construct Greedy Policy from: " + inputs.toString());
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @java GreedyPolicy.selectAction(Game, Context, double, int, int)
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
      GreedyPolicy._fVectorWrap(
        this.computeLogits(
          featureSet.computeFeatureVectors(context, actions.moves(), true),
          ctx.state().mover()
        )
      ).argMaxRand()
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @param lines
   * @return A greedy policy constructed from a given array of input lines
   * @java GreedyPolicy.fromLines(String[])
   */
  public static fromLines(lines: string[]): GreedyPolicy {
    const policy = new GreedyPolicy();
    policy.customise(lines);
    return policy;
  }

  //-------------------------------------------------------------------------

  /**
   * @java GreedyPolicy.initAI(Game, int)
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

  //-------------------------------------------------------------------------
  // Escape-hatch factory stubs

  /** @java FVector.wrap(float[]) */
  private static _fVectorWrap(arr: number[]): FVector {
    return arr as unknown as FVector;
  }

  /** @java new FVector(int) */
  private static _newFVector(_dim: number): FVector {
    return {} as unknown as FVector;
  }

  /** @java LinearFunction.fromFile(String) */
  private static _linearFromFile(_path: string | null): LinearFunction {
    return {} as unknown as LinearFunction;
  }

  /** @java BoostedLinearFunction.boostedFromFile(String, null) */
  private static _boostedFromFile(_path: string | null, _aux: unknown): LinearFunction {
    return {} as unknown as LinearFunction;
  }

  /** @java JITSPatterNetFeatureSet.construct(String) */
  private static _constructJITSPatterNetFromFile(_path: string): BaseFeatureSet {
    return {} as unknown as BaseFeatureSet;
  }

  /** @java new FeaturesSoftmaxMoveSelector(BaseFeatureSet[], WeightVector[], boolean) */
  private static _newFeaturesSoftmaxMoveSelector(
    _featureSets: unknown[],
    _params: unknown[],
    _greedy: boolean
  ): unknown {
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

  //-------------------------------------------------------------------------
}
