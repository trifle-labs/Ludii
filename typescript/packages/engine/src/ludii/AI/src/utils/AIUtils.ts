// @java AI/src/utils/AIUtils.java

/**
 * Some general utility methods for AI.
 *
 * @java utils/AIUtils.java
 * @author Dennis Soemers
 */

// Escape-hatch types for not-yet-ported dependencies

/** @java main.collections.FastArrayList */
type FastArrayList<T> = {
  size(): number;
  get(i: number): T;
  add(item: T): void;
};

/** @java other.move.Move */
type Move = {
  mover(): number;
};

/** @java other.context.Context */
type Context = {
  active(): boolean;
  active(p: number): boolean;
  game(): GameT;
  state(): StateT;
  computeNextLossRank(): number;
  computeNextWinRank(): number;
  score(p: number): number;
};

type GameT = {
  players(): { count(): number };
};

type StateT = {
  currentPlayerOrder(p: number): number;
};

/** @java metadata.ai.heuristics.Heuristics */
type Heuristics = {
  computeValue(context: Context, p: number, threshold: number): number;
};

/** @java main.collections.StringPair */
type StringPair = {
  key(): string;
  value(): string;
};

/** @java features.feature_sets.BaseFeatureSet */
type BaseFeatureSet = {
  spatialFeatures(): SpatialFeature[];
};

/** @java features.spatial.SpatialFeature */
type SpatialFeature = {
  toString(): string;
};

/** @java function_approx.LinearFunction */
type LinearFunction = {
  effectiveParams(): { allWeights(): { get(i: number): number } };
};

/** @java policies.softmax.SoftmaxPolicyLinear */
type SoftmaxPolicyLinear = {
  featureSets(): BaseFeatureSet[];
  linearFunctions(): LinearFunction[];
};

/** @java metadata.ai.misc.Pair */
type AIPair = {
  // metadata.ai.misc.Pair wraps feature string + weight
};

/** @java metadata.ai.features.Features */
type Features = {
  // metadata.ai.features.Features not yet ported
};

// Escape-hatch singletons
const RankUtils = null as unknown as {
  agentUtilities(context: Context): number[];
  rankToUtil(rank: number, numPlayers: number): number;
};
const AlphaBetaSearch = null as unknown as { ABS_HEURISTIC_WEIGHT_THRESHOLD: number };
const LudiiAI = null as unknown as { new(): { /* AI */ } };
const MetadataFeatureSet = null as unknown as {
  new(roleType: unknown, selPairs: unknown, plPairs: unknown, tspgPairs: unknown): unknown;
};
const FeaturesMetadata = null as unknown as {
  new(...args: unknown[]): Features;
};
const RoleType = null as unknown as {
  Shared: unknown;
  roleForPlayerId(p: number): unknown;
};

/** Maximum absolute value for value function estimates */
const MAX_ABS_VALUE_FUNCTION_ESTIMATE = 0.95;

//-------------------------------------------------------------------------

/**
 * Some general utility methods for AI.
 *
 * @java utils.AIUtils
 */
export class AIUtils {

  //-------------------------------------------------------------------------

  /** @java AIUtils() - private constructor, do not instantiate */
  private constructor() {
    // do not instantiate
  }

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @return Constructs and returns a default AI for the given game.
   * @java AIUtils.defaultAiForGame(Game)
   */
  public static defaultAiForGame(_game: unknown): unknown {
    return new (LudiiAI as unknown as new () => unknown)();
  }

  /**
   * @param allMoves List of legal moves for all current players
   * @param mover Mover for which we want the list of legal moves
   * @return A list of legal moves for the given mover
   * @java AIUtils.extractMovesForMover(FastArrayList, int)
   */
  public static extractMovesForMover(
    allMoves: FastArrayList<Move>,
    mover: number
  ): FastArrayList<Move> {
    const moves: Move[] = [];

    for (let i = 0; i < allMoves.size(); ++i) {
      const move = allMoves.get(i);
      if (move.mover() === mover) {
        moves.push(move);
      }
    }

    // Return a FastArrayList-compatible object
    return {
      size(): number { return moves.length; },
      get(i: number): Move { return moves[i]!; },
      add(item: Move): void { moves.push(item); },
    };
  }

  //-------------------------------------------------------------------------

  /**
   * @param context
   * @param heuristics
   * @return An array of value estimates for all players (accounting for swaps), based on a heuristic function
   * @java AIUtils.heuristicValueEstimates(Context, Heuristics)
   */
  public static heuristicValueEstimates(context: Context, heuristics: Heuristics): number[] {
    const valueEstimates = RankUtils.agentUtilities(context);

    if (context.active()) {
      const heuristicScores: number[] = new Array(valueEstimates.length).fill(0.0);
      const numPlayers = valueEstimates.length - 1;

      for (let p = 1; p < heuristicScores.length; ++p) {
        const score = heuristics.computeValue(context, p, AlphaBetaSearch.ABS_HEURISTIC_WEIGHT_THRESHOLD);
        heuristicScores[p]! += score;

        for (let other = 1; other < heuristicScores.length; ++other) {
          if (other !== p) {
            heuristicScores[other]! -= score;
          }
        }
      }

      // Lower and upper bounds on util that may still be achieved
      const utilLowerBound = RankUtils.rankToUtil(context.computeNextLossRank(), numPlayers);
      const utilUpperBound = RankUtils.rankToUtil(context.computeNextWinRank(), numPlayers);
      const deltaUtilBounds = utilUpperBound - utilLowerBound;

      for (let p = 1; p < valueEstimates.length; ++p) {
        if (context.active(context.state().currentPlayerOrder(p))) {
          // Need to set value estimate for this player, since rank not already determined
          let valueEstimate = Math.tanh(heuristicScores[context.state().currentPlayerOrder(p)]!);

          // Map to range given by lower and upper bounds
          valueEstimate = (((valueEstimate + 1.0) / 2.0) * deltaUtilBounds) + utilLowerBound;
          valueEstimates[p] = valueEstimate * MAX_ABS_VALUE_FUNCTION_ESTIMATE;
        }
      }
    }

    return valueEstimates;
  }

  /**
   * @param context
   * @param heuristics
   * @return An array of value bonus estimates for all players (accounting for swaps), based on a heuristic function.
   * @java AIUtils.heuristicValueBonusEstimates(Context, Heuristics)
   */
  public static heuristicValueBonusEstimates(context: Context, heuristics: Heuristics): number[] {
    const heuristicScores: number[] = new Array(context.game().players().count() + 1).fill(0.0);

    for (let p = 1; p < heuristicScores.length; ++p) {
      const score = heuristics.computeValue(context, p, AlphaBetaSearch.ABS_HEURISTIC_WEIGHT_THRESHOLD);
      heuristicScores[p]! += score;

      for (let other = 1; other < heuristicScores.length; ++other) {
        if (other !== p) {
          heuristicScores[other]! -= score;
        }
      }
    }

    for (let p = 1; p < heuristicScores.length; ++p) {
      heuristicScores[p] = Math.tanh(heuristicScores[context.state().currentPlayerOrder(p)]!);
    }

    return heuristicScores;
  }

  //-------------------------------------------------------------------------

  /**
   * @param pair
   * @return True if the given pair of Strings is recognised as AI-related metadata
   * @java AIUtils.isAIMetadata(StringPair)
   */
  public static isAIMetadata(pair: StringPair): boolean {
    const key = pair.key();

    return (
      key.startsWith("BestAgent") ||
      key.startsWith("AIMetadataGameNameCheck") ||
      AIUtils.isFeaturesMetadata(pair) ||
      AIUtils.isHeuristicsMetadata(pair)
    );
  }

  /**
   * @param pair
   * @return True if the given pair of Strings is recognised as features-related metadata
   * @java AIUtils.isFeaturesMetadata(StringPair)
   */
  public static isFeaturesMetadata(pair: StringPair): boolean {
    const key = pair.key();
    return key.startsWith("Features");
  }

  /**
   * @param pair
   * @return True if the given pair of Strings is recognised as heuristics-related metadata
   * @java AIUtils.isHeuristicsMetadata(StringPair)
   */
  public static isHeuristicsMetadata(pair: StringPair): boolean {
    const key = pair.key();

    return (
      key.startsWith("DivNumBoardCells") ||
      key.startsWith("DivNumInitPlacement") ||
      key.startsWith("Logistic") ||
      key.startsWith("Tanh") ||
      key.startsWith("CentreProximity") ||
      key.startsWith("ComponentValues") ||
      key.startsWith("CornerProximity") ||
      key.startsWith("CurrentMoverHeuristic") ||
      key.startsWith("Influence") ||
      key.startsWith("InfluenceAdvanced") ||
      key.startsWith("Intercept") ||
      key.startsWith("LineCompletionHeuristic") ||
      key.startsWith("Material") ||
      key.startsWith("MobilityAdvanced") ||
      key.startsWith("MobilitySimple") ||
      key.startsWith("NullHeuristic") ||
      key.startsWith("OpponentPieceProximity") ||
      key.startsWith("OwnRegionsCount") ||
      key.startsWith("PlayerRegionsProximity") ||
      key.startsWith("PlayerSiteMapCount") ||
      key.startsWith("RegionProximity") ||
      key.startsWith("Score") ||
      key.startsWith("SidesProximity") ||
      key.startsWith("UnthreatenedMaterial")
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @param gameOptions
   * @param metadata
   * @return All features metadata relevant for given game with given options
   * @java AIUtils.extractFeaturesMetadata(Game, List, List)
   */
  public static extractFeaturesMetadata(
    _game: unknown,
    gameOptions: string[],
    metadata: StringPair[]
  ): StringPair[] {
    const relevantFeaturesMetadata: StringPair[] = [];

    for (const pair of metadata) {
      if (AIUtils.isFeaturesMetadata(pair)) {
        const key = pair.key();
        const keySplit = key.split(":");

        let allOptionsMatch = true;
        if (keySplit.length > 1) {
          const metadataOptions = keySplit[1]!.split(";");

          for (let i = 0; i < metadataOptions.length; ++i) {
            if (!gameOptions.includes(metadataOptions[i]!)) {
              allOptionsMatch = false;
              break;
            }
          }
        }

        if (allOptionsMatch) {
          relevantFeaturesMetadata.push(pair);
        }
      }
    }

    return relevantFeaturesMetadata;
  }

  /**
   * @param game
   * @param gameOptions
   * @param metadata
   * @return All heuristics metadata relevant for given game with given options
   * @java AIUtils.extractHeuristicsMetadata(Game, List, List)
   */
  public static extractHeuristicsMetadata(
    _game: unknown,
    gameOptions: string[],
    metadata: StringPair[]
  ): StringPair[] {
    const relevantHeuristicsMetadata: StringPair[] = [];

    for (const pair of metadata) {
      if (AIUtils.isHeuristicsMetadata(pair)) {
        const key = pair.key();
        const keySplit = key.split(":");

        let allOptionsMatch = true;
        if (keySplit.length > 1) {
          const metadataOptions = keySplit[1]!.split(";");

          for (let i = 0; i < metadataOptions.length; ++i) {
            if (!gameOptions.includes(metadataOptions[i]!)) {
              allOptionsMatch = false;
              break;
            }
          }
        }

        if (allOptionsMatch) {
          relevantHeuristicsMetadata.push(pair);
        }
      }
    }

    return relevantHeuristicsMetadata;
  }

  //-------------------------------------------------------------------------

  /**
   * @java AIUtils.convertStringtoHeuristic(String)
   */
  public static convertStringtoHeuristic(s: string): unknown {
    // Escape-hatch: heuristic term constructors not yet ported
    const makeHeuristics = null as unknown as (term: unknown) => Heuristics;
    const makeMaterial = (w: number) => null as unknown as unknown;
    const makeUnthreatenedMaterial = (w: number) => null as unknown as unknown;
    const makeInfluence = (w: number) => null as unknown as unknown;
    const makeInfluenceAdvanced = (w: number) => null as unknown as unknown;
    const makeSidesProximity = (w: number) => null as unknown as unknown;
    const makeLineCompletionHeuristic = (w: number) => null as unknown as unknown;
    const makeCornerProximity = (w: number) => null as unknown as unknown;
    const makeMobilitySimple = (w: number) => null as unknown as unknown;
    const makeMobilityAdvanced = (w: number) => null as unknown as unknown;
    const makeCentreProximity = (w: number) => null as unknown as unknown;
    const makeRegionProximity = (w: number) => null as unknown as unknown;
    const makeScore = (w: number) => null as unknown as unknown;
    const makePlayerRegionsProximity = (w: number) => null as unknown as unknown;
    const makePlayerSiteMapCount = (w: number) => null as unknown as unknown;
    const makeOwnRegionsCount = (w: number) => null as unknown as unknown;
    const makeComponentValues = (w: number) => null as unknown as unknown;
    const makeNullHeuristic = () => null as unknown as unknown;

    switch (s) {
      case "MaterialPos": return makeHeuristics(makeMaterial(1.0));
      case "UnthreatenedMaterialPos": return makeHeuristics(makeUnthreatenedMaterial(1.0));
      case "InfluencePos": return makeHeuristics(makeInfluence(1.0));
      case "InfluenceAdvancedPos": return makeHeuristics(makeInfluenceAdvanced(1.0));
      case "SidesProximityPos": return makeHeuristics(makeSidesProximity(1.0));
      case "LineCompletionHeuristicPos": return makeHeuristics(makeLineCompletionHeuristic(1.0));
      case "CornerProximityPos": return makeHeuristics(makeCornerProximity(1.0));
      case "MobilitySimplePos": return makeHeuristics(makeMobilitySimple(1.0));
      case "MobilityAdvancedPos": return makeHeuristics(makeMobilityAdvanced(1.0));
      case "CentreProximityPos": return makeHeuristics(makeCentreProximity(1.0));
      case "RegionProximityPos": return makeHeuristics(makeRegionProximity(1.0));
      case "ScorePos": return makeHeuristics(makeScore(1.0));
      case "PlayerRegionsProximityPos": return makeHeuristics(makePlayerRegionsProximity(1.0));
      case "PlayerSiteMapCountPos": return makeHeuristics(makePlayerSiteMapCount(1.0));
      case "OwnRegionsCountPos": return makeHeuristics(makeOwnRegionsCount(1.0));
      case "ComponentValuesPos": return makeHeuristics(makeComponentValues(1.0));

      case "MaterialNeg": return makeHeuristics(makeMaterial(-1.0));
      case "UnthreatenedMaterialNeg": return makeHeuristics(makeUnthreatenedMaterial(-1.0));
      case "InfluenceNeg": return makeHeuristics(makeInfluence(-1.0));
      case "InfluenceAdvancedNeg": return makeHeuristics(makeInfluenceAdvanced(-1.0));
      case "SidesProximityNeg": return makeHeuristics(makeSidesProximity(-1.0));
      case "LineCompletionHeuristicNeg": return makeHeuristics(makeLineCompletionHeuristic(-1.0));
      case "CornerProximityNeg": return makeHeuristics(makeCornerProximity(-1.0));
      case "MobilitySimpleNeg": return makeHeuristics(makeMobilitySimple(-1.0));
      case "MobilityAdvancedNeg": return makeHeuristics(makeMobilityAdvanced(-1.0));
      case "CentreProximityNeg": return makeHeuristics(makeCentreProximity(-1.0));
      case "RegionProximityNeg": return makeHeuristics(makeRegionProximity(-1.0));
      case "ScoreNeg": return makeHeuristics(makeScore(-1.0));
      case "PlayerRegionsProximityNeg": return makeHeuristics(makePlayerRegionsProximity(-1.0));
      case "PlayerSiteMapCountNeg": return makeHeuristics(makePlayerSiteMapCount(-1.0));
      case "OwnRegionsCountNeg": return makeHeuristics(makeOwnRegionsCount(-1.0));
      case "ComponentValuesNeg": return makeHeuristics(makeComponentValues(-1.0));

      case "NullHeuristicPos": return makeHeuristics(makeMaterial(1.0));
      default: return makeHeuristics(makeNullHeuristic());
    }
  }

  /**
   * @java AIUtils.allHeuristicNames()
   */
  public static allHeuristicNames(): string[] {
    return [
      "MaterialPos", "InfluencePos", "SidesProximityPos", "LineCompletionHeuristicNeg", "NullHeuristicPos",
      "LineCompletionHeuristicPos", "CornerProximityNeg", "MobilitySimpleNeg", "CentreProximityNeg", "InfluenceNeg",
      "MaterialNeg", "CornerProximityPos", "MobilitySimplePos", "CentreProximityPos", "SidesProximityNeg", "RegionProximityNeg",
      "RegionProximityPos", "ScorePos", "ScoreNeg", "PlayerRegionsProximityNeg", "PlayerRegionsProximityPos", "PlayerSiteMapCountPos",
      "PlayerSiteMapCountNeg", "OwnRegionsCountPos", "OwnRegionsCountNeg", "ComponentValuesPos", "ComponentValuesNeg",
      "UnthreatenedMaterialPos", "UnthreatenedMaterialNeg", "MobilityAdvancedPos", "MobilityAdvancedNeg",
      "InfluenceAdvancedPos", "InfluenceAdvancedNeg",
    ];
  }

  //-------------------------------------------------------------------------

  /**
   * Generates features metadata from given Selection and Playout policies.
   * @java AIUtils.generateFeaturesMetadata(SoftmaxPolicyLinear, SoftmaxPolicyLinear)
   */
  public static generateFeaturesMetadata(
    selectionPolicy: SoftmaxPolicyLinear | null,
    playoutPolicy: SoftmaxPolicyLinear | null
  ): Features | null {
    // Escape-hatch: metadata.ai.features constructors not yet ported
    let selectionPairs: unknown[][] | null = null;
    let playoutPairs: unknown[][] | null = null;
    let tspgPairs: unknown[][] | null = null;
    let numRoles = 0;

    if (selectionPolicy !== null) {
      const featureSets = selectionPolicy.featureSets();
      const linearFunctions = selectionPolicy.linearFunctions();

      selectionPairs = new Array(featureSets.length);
      playoutPairs = new Array(featureSets.length);
      tspgPairs = new Array(featureSets.length);

      if (featureSets.length === 1) {
        numRoles = 1;
        const featureSet = featureSets[0]!;
        const linFunc = linearFunctions[0]!;
        const pairs: unknown[] = new Array(featureSet.spatialFeatures().length);

        for (let i = 0; i < pairs.length; ++i) {
          const weight = linFunc.effectiveParams().allWeights().get(i);
          pairs[i] = { featureStr: featureSet.spatialFeatures()[i]!.toString(), weight };

          if (isNaN(weight)) console.error("WARNING: writing NaN weight");
          else if (!isFinite(weight)) console.error("WARNING: writing infinity weight");
        }

        selectionPairs[0] = pairs;
      } else {
        numRoles = featureSets.length;

        for (let p = 0; p < featureSets.length; ++p) {
          const featureSet = featureSets[p];
          if (featureSet == null) continue;

          const linFunc = linearFunctions[p]!;
          const pairs: unknown[] = new Array(featureSet.spatialFeatures().length);

          for (let i = 0; i < pairs.length; ++i) {
            const weight = linFunc.effectiveParams().allWeights().get(i);
            pairs[i] = { featureStr: featureSet.spatialFeatures()[i]!.toString(), weight };

            if (isNaN(weight)) console.error("WARNING: writing NaN weight");
            else if (!isFinite(weight)) console.error("WARNING: writing infinity weight");
          }

          selectionPairs[p] = pairs;
        }
      }
    }

    if (playoutPolicy !== null) {
      const featureSets = playoutPolicy.featureSets();
      const linearFunctions = playoutPolicy.linearFunctions();

      if (playoutPairs === null) {
        selectionPairs = new Array(featureSets.length);
        playoutPairs = new Array(featureSets.length);
        tspgPairs = new Array(featureSets.length);
      }

      if (featureSets.length === 1) {
        numRoles = 1;
        const featureSet = featureSets[0]!;
        const linFunc = linearFunctions[0]!;
        const pairs: unknown[] = new Array(featureSet.spatialFeatures().length);

        for (let i = 0; i < pairs.length; ++i) {
          const weight = linFunc.effectiveParams().allWeights().get(i);
          pairs[i] = { featureStr: featureSet.spatialFeatures()[i]!.toString(), weight };

          if (isNaN(weight)) console.error("WARNING: writing NaN weight");
          else if (!isFinite(weight)) console.error("WARNING: writing infinity weight");
        }

        playoutPairs[0] = pairs;
      } else {
        numRoles = featureSets.length;

        for (let p = 0; p < featureSets.length; ++p) {
          const featureSet = featureSets[p];
          if (featureSet == null) continue;

          const linFunc = linearFunctions[p]!;
          const pairs: unknown[] = new Array(featureSet.spatialFeatures().length);

          for (let i = 0; i < pairs.length; ++i) {
            const weight = linFunc.effectiveParams().allWeights().get(i);
            pairs[i] = { featureStr: featureSet.spatialFeatures()[i]!.toString(), weight };

            if (isNaN(weight)) console.error("WARNING: writing NaN weight");
            else if (!isFinite(weight)) console.error("WARNING: writing infinity weight");
          }

          playoutPairs[p] = pairs;
        }
      }
    }

    if (selectionPairs === null || playoutPairs === null || tspgPairs === null) {
      return null;
    }

    // Escape-hatch: metadata.ai.features.Features constructor not yet ported
    return null as unknown as Features;
  }

  //-------------------------------------------------------------------------

  /**
   * @param heuristicName
   * @return Shortened version of given heuristic name
   * @java AIUtils.shortenHeuristicName(String)
   */
  public static shortenHeuristicName(heuristicName: string): string {
    return heuristicName
      .replace(/CentreProximity/g, "CeProx")
      .replace(/ComponentValues/g, "CompVal")
      .replace(/CornerProximity/g, "CoProx")
      .replace(/CurrentMoverHeuristic/g, "CurrMov")
      .replace(/InfluenceAdvanced/g, "InfAdv")
      .replace(/Influence/g, "Inf")
      .replace(/Intercept/g, "Inter")
      .replace(/LineCompletionHeuristic/g, "LineComp")
      .replace(/MobilityAdvanced/g, "MobAdv")
      .replace(/MobilitySimple/g, "MobS")
      .replace(/NullHeuristic/g, "Null")
      .replace(/OwnRegionsCount/g, "OwnRegC")
      .replace(/PlayerRegionsProximity/g, "PRegProx")
      .replace(/PlayerSiteMapCount/g, "PSMapC")
      .replace(/RegionProximity/g, "ReProx")
      .replace(/SidesProximity/g, "SiProx")
      .replace(/UnthreatenedMaterial/g, "UntMat")
      .replace(/Material/g, "Mat");
  }

  //-------------------------------------------------------------------------
}
