// @java AI/src/decision_trees/logits/ExactLogitTreeLearner.java

/**
 * Class with methods for learning an exact logit tree.
 *
 * @java decision_trees/logits/ExactLogitTreeLearner.java
 * @author Dennis Soemers
 */

import { LogitTreeNode, type Feature, type AspatialFeature, type SpatialFeature, type BaseFeatureSet } from "./LogitTreeNode.js";
import { LogitDecisionNode } from "./LogitDecisionNode.js";
import { LogitModelNode } from "./LogitModelNode.js";

// Not-yet-ported escape-hatch interfaces

/** @java main.collections.FVector */
interface FVector {
  dim(): number;
  get(i: number): number;
}

/** @java features.WeightVector */
interface WeightVector {
  allWeights(): FVector;
}

/** @java function_approx.LinearFunction */
interface LinearFunction {
  effectiveParams(): WeightVector;
}

//-------------------------------------------------------------------------

/** Intercept feature singleton escape hatch */
const InterceptFeature: Feature & AspatialFeature = {
  __aspatial: true as const,
  toString() { return "Intercept"; },
};

//-------------------------------------------------------------------------

/**
 * Helper: removeSwap for a mutable array.
 * Removes element at idx by swapping last element into idx's position, then popping.
 * @java main.collections.ListUtils.removeSwap(List<E>, int)
 */
function removeSwapArr<T>(arr: T[], idx: number): void {
  const lastIdx = arr.length - 1;
  arr[idx] = arr[lastIdx] as T;
  arr.pop();
}

/**
 * Helper: removeSwap for a number array.
 * @java main.collections.ListUtils.removeSwap(TFloatArrayList, int)
 */
function removeSwapFloats(arr: number[], idx: number): void {
  const lastIdx = arr.length - 1;
  arr[idx] = arr[lastIdx] as number;
  arr.pop();
}

//-------------------------------------------------------------------------

/**
 * Class with methods for learning an exact logit tree.
 *
 * @java decision_trees.logits.ExactLogitTreeLearner
 */
export class ExactLogitTreeLearner {

  //-------------------------------------------------------------------------

  /**
   * Builds an exact logit tree node for given feature set and linear function of weights
   * @java ExactLogitTreeLearner.buildTree(BaseFeatureSet, LinearFunction, int)
   */
  public static buildTree(
    featureSet: BaseFeatureSet,
    linFunc: LinearFunction,
    maxDepth: number
  ): LogitTreeNode {
    const aspatialFeaturesArr = Array.from(featureSet.aspatialFeatures()) as AspatialFeature[];
    const spatialFeaturesArr = Array.from(featureSet.spatialFeatures()) as SpatialFeature[];

    const allWeights = linFunc.effectiveParams().allWeights();
    const aspatialWeights: number[] = [];
    const spatialWeights: number[] = [];

    for (let i = 0; i < allWeights.dim(); ++i) {
      if (i < aspatialFeaturesArr.length) {
        aspatialWeights.push(allWeights.get(i));
      } else {
        spatialWeights.push(allWeights.get(i));
      }
    }

    // Remove intercept features and collect accumulated intercept
    let accumInterceptWeight = 0;
    for (let i = aspatialFeaturesArr.length - 1; i >= 0; --i) {
      if (aspatialFeaturesArr[i]!.toString() === "Intercept") {
        accumInterceptWeight += aspatialWeights[i]!;
        removeSwapFloats(aspatialWeights, i);
        removeSwapArr(aspatialFeaturesArr, i);
      }
    }

    // Remove all 0-weight features
    for (let i = aspatialFeaturesArr.length - 1; i >= 0; --i) {
      if (aspatialWeights[i] === 0) {
        removeSwapFloats(aspatialWeights, i);
        removeSwapArr(aspatialFeaturesArr, i);
      }
    }
    for (let i = spatialFeaturesArr.length - 1; i >= 0; --i) {
      if (spatialWeights[i] === 0) {
        removeSwapFloats(spatialWeights, i);
        removeSwapArr(spatialFeaturesArr, i);
      }
    }

    return ExactLogitTreeLearner.buildNode(
      aspatialFeaturesArr,
      aspatialWeights,
      spatialFeaturesArr,
      spatialWeights,
      accumInterceptWeight,
      maxDepth
    );
  }

  /**
   * Builds an exact logit tree node for given feature set and linear function of weights,
   * using a naive approach that simply splits on the feature with the maximum absolute weight
   * @java ExactLogitTreeLearner.buildTreeNaiveMaxAbs(BaseFeatureSet, LinearFunction, int)
   */
  public static buildTreeNaiveMaxAbs(
    featureSet: BaseFeatureSet,
    linFunc: LinearFunction,
    maxDepth: number
  ): LogitTreeNode {
    const aspatialFeaturesArr = Array.from(featureSet.aspatialFeatures()) as AspatialFeature[];
    const spatialFeaturesArr = Array.from(featureSet.spatialFeatures()) as SpatialFeature[];

    const allWeights = linFunc.effectiveParams().allWeights();
    const aspatialWeights: number[] = [];
    const spatialWeights: number[] = [];

    for (let i = 0; i < allWeights.dim(); ++i) {
      if (i < aspatialFeaturesArr.length) {
        aspatialWeights.push(allWeights.get(i));
      } else {
        spatialWeights.push(allWeights.get(i));
      }
    }

    // Remove intercept features and collect accumulated intercept
    let accumInterceptWeight = 0;
    for (let i = aspatialFeaturesArr.length - 1; i >= 0; --i) {
      if (aspatialFeaturesArr[i]!.toString() === "Intercept") {
        accumInterceptWeight += aspatialWeights[i]!;
        removeSwapFloats(aspatialWeights, i);
        removeSwapArr(aspatialFeaturesArr, i);
      }
    }

    // Remove all 0-weight features
    for (let i = aspatialFeaturesArr.length - 1; i >= 0; --i) {
      if (aspatialWeights[i] === 0) {
        removeSwapFloats(aspatialWeights, i);
        removeSwapArr(aspatialFeaturesArr, i);
      }
    }
    for (let i = spatialFeaturesArr.length - 1; i >= 0; --i) {
      if (spatialWeights[i] === 0) {
        removeSwapFloats(spatialWeights, i);
        removeSwapArr(spatialFeaturesArr, i);
      }
    }

    return ExactLogitTreeLearner.buildNodeNaiveMaxAbs(
      aspatialFeaturesArr,
      aspatialWeights,
      spatialFeaturesArr,
      spatialWeights,
      accumInterceptWeight,
      maxDepth
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java ExactLogitTreeLearner.buildNode(List<AspatialFeature>, TFloatArrayList, List<SpatialFeature>, TFloatArrayList, float, int)
   */
  private static buildNode(
    remainingAspatialFeatures: AspatialFeature[],
    remainingAspatialWeights: number[],
    remainingSpatialFeatures: SpatialFeature[],
    remainingSpatialWeights: number[],
    accumInterceptWeight: number,
    allowedDepth: number
  ): LogitTreeNode {
    if (remainingAspatialFeatures.length === 0 && remainingSpatialFeatures.length === 0) {
      // Time to create leaf node: a model with just a single intercept feature
      return new LogitModelNode([InterceptFeature], [accumInterceptWeight]);
    }

    if (allowedDepth === 0) {
      // Have to create leaf node with remaining features
      const numModelFeatures = remainingAspatialFeatures.length + remainingSpatialFeatures.length + 1;
      const featuresArray: Feature[] = new Array(numModelFeatures);
      const weightsArray: number[] = new Array(numModelFeatures);

      let nextIdx = 0;

      // Start with intercept
      featuresArray[nextIdx] = InterceptFeature;
      weightsArray[nextIdx++] = accumInterceptWeight;

      // Now aspatial features
      for (let i = 0; i < remainingAspatialFeatures.length; ++i) {
        featuresArray[nextIdx] = remainingAspatialFeatures[i]!;
        weightsArray[nextIdx++] = remainingAspatialWeights[i]!;
      }

      // And finally spatial features
      for (let i = 0; i < remainingSpatialFeatures.length; ++i) {
        featuresArray[nextIdx] = remainingSpatialFeatures[i]!;
        weightsArray[nextIdx++] = remainingSpatialWeights[i]!;
      }

      return new LogitModelNode(featuresArray, weightsArray);
    }

    // Find optimal splitting feature
    let lowestScore = Infinity;
    let bestIdx = -1;
    let bestFeatureIsAspatial = true;

    let sumAllAbsWeights = 0;
    for (let i = 0; i < remainingAspatialWeights.length; ++i) {
      sumAllAbsWeights += Math.abs(remainingAspatialWeights[i]!);
    }
    for (let i = 0; i < remainingSpatialWeights.length; ++i) {
      sumAllAbsWeights += Math.abs(remainingSpatialWeights[i]!);
    }

    for (let i = 0; i < remainingAspatialFeatures.length; ++i) {
      const absFeatureWeight = Math.abs(remainingAspatialWeights[i]!);

      let falseScore = sumAllAbsWeights - absFeatureWeight;
      let trueScore = sumAllAbsWeights - absFeatureWeight;
      for (let j = 0; j < remainingSpatialWeights.length; ++j) {
        trueScore -= Math.abs(remainingSpatialWeights[j]!);
      }

      const splitScore = (falseScore + trueScore) / 2;

      if (splitScore < lowestScore) {
        lowestScore = splitScore;
        bestIdx = i;
      }
    }

    for (let i = 0; i < remainingSpatialFeatures.length; ++i) {
      const spatial = remainingSpatialFeatures[i]!;
      const absFeatureWeight = Math.abs(remainingSpatialWeights[i]!);

      let falseScore = sumAllAbsWeights - absFeatureWeight;
      let trueScore = sumAllAbsWeights - absFeatureWeight;

      // If a spatial feature is true, we lose all the aspatial weights (none of them can be true)
      for (let j = 0; j < remainingAspatialWeights.length; ++j) {
        trueScore -= Math.abs(remainingAspatialWeights[j]!);
      }

      for (let j = 0; j < remainingSpatialFeatures.length; ++j) {
        if (i === j) continue;

        const otherFeature = remainingSpatialFeatures[j]!;

        if (otherFeature.generalises(spatial)) {
          trueScore -= Math.abs(remainingSpatialWeights[j]!);
        }

        if (spatial.generalises(otherFeature)) {
          falseScore -= Math.abs(remainingSpatialWeights[j]!);
        }
      }

      const splitScore = (falseScore + trueScore) / 2;

      if (splitScore < lowestScore) {
        lowestScore = splitScore;
        bestIdx = i;
        bestFeatureIsAspatial = false;
      }
    }

    const splittingFeature: Feature = bestFeatureIsAspatial
      ? remainingAspatialFeatures[bestIdx]!
      : remainingSpatialFeatures[bestIdx]!;

    // Create the node for case where splitting feature is true
    const trueBranch: LogitTreeNode = (() => {
      let accumInterceptWhenTrue = accumInterceptWeight;

      if (bestFeatureIsAspatial) {
        const remainingAspatialsWhenTrue = remainingAspatialFeatures.slice();
        const remainingAspatialWeightsWhenTrue = remainingAspatialWeights.slice();
        accumInterceptWhenTrue += remainingAspatialWeightsWhenTrue[bestIdx]!;
        removeSwapArr(remainingAspatialsWhenTrue, bestIdx);
        removeSwapFloats(remainingAspatialWeightsWhenTrue, bestIdx);

        // Remove all spatial features when an aspatial feature is true
        const remainingSpatialsWhenTrue: SpatialFeature[] = [];
        const remainingSpatialWeightsWhenTrue: number[] = [];

        return ExactLogitTreeLearner.buildNode(
          remainingAspatialsWhenTrue, remainingAspatialWeightsWhenTrue,
          remainingSpatialsWhenTrue, remainingSpatialWeightsWhenTrue,
          accumInterceptWhenTrue, allowedDepth - 1
        );
      } else {
        // Remove all the aspatial features if a spatial feature is true
        const remainingAspatialsWhenTrue: AspatialFeature[] = [];
        const remainingAspatialWeightsWhenTrue: number[] = [];

        const remainingSpatialsWhenTrue = remainingSpatialFeatures.slice();
        const remainingSpatialWeightsWhenTrue = remainingSpatialWeights.slice();

        for (let i = remainingSpatialsWhenTrue.length - 1; i >= 0; --i) {
          if (i === bestIdx) {
            accumInterceptWhenTrue += remainingSpatialWeightsWhenTrue[i]!;
            removeSwapArr(remainingSpatialsWhenTrue, i);
            removeSwapFloats(remainingSpatialWeightsWhenTrue, i);
          } else {
            const other = remainingSpatialsWhenTrue[i]!;
            if (other.generalises(splittingFeature as SpatialFeature)) {
              accumInterceptWhenTrue += remainingSpatialWeightsWhenTrue[i]!;
              removeSwapArr(remainingSpatialsWhenTrue, i);
              removeSwapFloats(remainingSpatialWeightsWhenTrue, i);
            }
          }
        }

        return ExactLogitTreeLearner.buildNode(
          remainingAspatialsWhenTrue, remainingAspatialWeightsWhenTrue,
          remainingSpatialsWhenTrue, remainingSpatialWeightsWhenTrue,
          accumInterceptWhenTrue, allowedDepth - 1
        );
      }
    })();

    // Create the node for case where splitting feature is false
    const falseBranch: LogitTreeNode = (() => {
      const accumInterceptWhenFalse = accumInterceptWeight;

      if (bestFeatureIsAspatial) {
        const remainingAspatialsWhenFalse = remainingAspatialFeatures.slice();
        const remainingAspatialWeightsWhenFalse = remainingAspatialWeights.slice();
        removeSwapArr(remainingAspatialsWhenFalse, bestIdx);
        removeSwapFloats(remainingAspatialWeightsWhenFalse, bestIdx);

        // Keep all spatial features when an aspatial feature is false
        const remainingSpatialsWhenFalse = remainingSpatialFeatures.slice();
        const remainingSpatialWeightsWhenFalse = remainingSpatialWeights.slice();

        return ExactLogitTreeLearner.buildNode(
          remainingAspatialsWhenFalse, remainingAspatialWeightsWhenFalse,
          remainingSpatialsWhenFalse, remainingSpatialWeightsWhenFalse,
          accumInterceptWhenFalse, allowedDepth - 1
        );
      } else {
        // Keep all the aspatial features if a spatial feature is false
        const remainingAspatialsWhenFalse = remainingAspatialFeatures.slice();
        const remainingAspatialWeightsWhenFalse = remainingAspatialWeights.slice();

        const remainingSpatialsWhenFalse = remainingSpatialFeatures.slice();
        const remainingSpatialWeightsWhenFalse = remainingSpatialWeights.slice();

        for (let i = remainingSpatialsWhenFalse.length - 1; i >= 0; --i) {
          if (i === bestIdx) {
            removeSwapArr(remainingSpatialsWhenFalse, i);
            removeSwapFloats(remainingSpatialWeightsWhenFalse, i);
          } else {
            const other = remainingSpatialsWhenFalse[i]!;
            if ((splittingFeature as SpatialFeature).generalises(other)) {
              removeSwapArr(remainingSpatialsWhenFalse, i);
              removeSwapFloats(remainingSpatialWeightsWhenFalse, i);
            }
          }
        }

        return ExactLogitTreeLearner.buildNode(
          remainingAspatialsWhenFalse, remainingAspatialWeightsWhenFalse,
          remainingSpatialsWhenFalse, remainingSpatialWeightsWhenFalse,
          accumInterceptWhenFalse, allowedDepth - 1
        );
      }
    })();

    return new LogitDecisionNode(splittingFeature, trueBranch, falseBranch);
  }

  /**
   * Uses naive approach of splitting on features with max absolute weight.
   * @java ExactLogitTreeLearner.buildNodeNaiveMaxAbs(List<AspatialFeature>, TFloatArrayList, List<SpatialFeature>, TFloatArrayList, float, int)
   */
  private static buildNodeNaiveMaxAbs(
    remainingAspatialFeatures: AspatialFeature[],
    remainingAspatialWeights: number[],
    remainingSpatialFeatures: SpatialFeature[],
    remainingSpatialWeights: number[],
    accumInterceptWeight: number,
    allowedDepth: number
  ): LogitTreeNode {
    if (remainingAspatialFeatures.length === 0 && remainingSpatialFeatures.length === 0) {
      return new LogitModelNode([InterceptFeature], [accumInterceptWeight]);
    }

    if (allowedDepth === 0) {
      const numModelFeatures = remainingAspatialFeatures.length + remainingSpatialFeatures.length + 1;
      const featuresArray: Feature[] = new Array(numModelFeatures);
      const weightsArray: number[] = new Array(numModelFeatures);

      let nextIdx = 0;
      featuresArray[nextIdx] = InterceptFeature;
      weightsArray[nextIdx++] = accumInterceptWeight;

      for (let i = 0; i < remainingAspatialFeatures.length; ++i) {
        featuresArray[nextIdx] = remainingAspatialFeatures[i]!;
        weightsArray[nextIdx++] = remainingAspatialWeights[i]!;
      }

      for (let i = 0; i < remainingSpatialFeatures.length; ++i) {
        featuresArray[nextIdx] = remainingSpatialFeatures[i]!;
        weightsArray[nextIdx++] = remainingSpatialWeights[i]!;
      }

      return new LogitModelNode(featuresArray, weightsArray);
    }

    let lowestScore = Infinity;
    let bestIdx = -1;
    let bestFeatureIsAspatial = true;

    let sumAllAbsWeights = 0;
    for (let i = 0; i < remainingAspatialWeights.length; ++i) {
      sumAllAbsWeights += Math.abs(remainingAspatialWeights[i]!);
    }
    for (let i = 0; i < remainingSpatialWeights.length; ++i) {
      sumAllAbsWeights += Math.abs(remainingSpatialWeights[i]!);
    }

    for (let i = 0; i < remainingAspatialFeatures.length; ++i) {
      const absFeatureWeight = Math.abs(remainingAspatialWeights[i]!);
      const splitScore = (2 * (sumAllAbsWeights - absFeatureWeight)) / 2;

      if (splitScore < lowestScore) {
        lowestScore = splitScore;
        bestIdx = i;
      }
    }

    for (let i = 0; i < remainingSpatialFeatures.length; ++i) {
      const absFeatureWeight = Math.abs(remainingSpatialWeights[i]!);
      const splitScore = (2 * (sumAllAbsWeights - absFeatureWeight)) / 2;

      if (splitScore < lowestScore) {
        lowestScore = splitScore;
        bestIdx = i;
        bestFeatureIsAspatial = false;
      }
    }

    const splittingFeature: Feature = bestFeatureIsAspatial
      ? remainingAspatialFeatures[bestIdx]!
      : remainingSpatialFeatures[bestIdx]!;

    // Create the node for case where splitting feature is true
    const trueBranch: LogitTreeNode = (() => {
      let accumInterceptWhenTrue = accumInterceptWeight;

      if (bestFeatureIsAspatial) {
        const remainingAspatialsWhenTrue = remainingAspatialFeatures.slice();
        const remainingAspatialWeightsWhenTrue = remainingAspatialWeights.slice();
        accumInterceptWhenTrue += remainingAspatialWeightsWhenTrue[bestIdx]!;
        removeSwapArr(remainingAspatialsWhenTrue, bestIdx);
        removeSwapFloats(remainingAspatialWeightsWhenTrue, bestIdx);

        return ExactLogitTreeLearner.buildNodeNaiveMaxAbs(
          remainingAspatialsWhenTrue, remainingAspatialWeightsWhenTrue,
          [], [], accumInterceptWhenTrue, allowedDepth - 1
        );
      } else {
        const remainingSpatialsWhenTrue = remainingSpatialFeatures.slice();
        const remainingSpatialWeightsWhenTrue = remainingSpatialWeights.slice();

        for (let i = remainingSpatialsWhenTrue.length - 1; i >= 0; --i) {
          if (i === bestIdx) {
            accumInterceptWhenTrue += remainingSpatialWeightsWhenTrue[i]!;
            removeSwapArr(remainingSpatialsWhenTrue, i);
            removeSwapFloats(remainingSpatialWeightsWhenTrue, i);
          } else {
            const other = remainingSpatialsWhenTrue[i]!;
            if (other.generalises(splittingFeature as SpatialFeature)) {
              accumInterceptWhenTrue += remainingSpatialWeightsWhenTrue[i]!;
              removeSwapArr(remainingSpatialsWhenTrue, i);
              removeSwapFloats(remainingSpatialWeightsWhenTrue, i);
            }
          }
        }

        return ExactLogitTreeLearner.buildNodeNaiveMaxAbs(
          [], [], remainingSpatialsWhenTrue, remainingSpatialWeightsWhenTrue,
          accumInterceptWhenTrue, allowedDepth - 1
        );
      }
    })();

    // Create the node for case where splitting feature is false
    const falseBranch: LogitTreeNode = (() => {
      const accumInterceptWhenFalse = accumInterceptWeight;

      if (bestFeatureIsAspatial) {
        const remainingAspatialsWhenFalse = remainingAspatialFeatures.slice();
        const remainingAspatialWeightsWhenFalse = remainingAspatialWeights.slice();
        removeSwapArr(remainingAspatialsWhenFalse, bestIdx);
        removeSwapFloats(remainingAspatialWeightsWhenFalse, bestIdx);

        return ExactLogitTreeLearner.buildNodeNaiveMaxAbs(
          remainingAspatialsWhenFalse, remainingAspatialWeightsWhenFalse,
          remainingSpatialFeatures.slice(), remainingSpatialWeights.slice(),
          accumInterceptWhenFalse, allowedDepth - 1
        );
      } else {
        const remainingSpatialsWhenFalse = remainingSpatialFeatures.slice();
        const remainingSpatialWeightsWhenFalse = remainingSpatialWeights.slice();

        for (let i = remainingSpatialsWhenFalse.length - 1; i >= 0; --i) {
          if (i === bestIdx) {
            removeSwapArr(remainingSpatialsWhenFalse, i);
            removeSwapFloats(remainingSpatialWeightsWhenFalse, i);
          } else {
            const other = remainingSpatialsWhenFalse[i]!;
            if ((splittingFeature as SpatialFeature).generalises(other)) {
              removeSwapArr(remainingSpatialsWhenFalse, i);
              removeSwapFloats(remainingSpatialWeightsWhenFalse, i);
            }
          }
        }

        return ExactLogitTreeLearner.buildNodeNaiveMaxAbs(
          remainingAspatialFeatures.slice(), remainingAspatialWeights.slice(),
          remainingSpatialsWhenFalse, remainingSpatialWeightsWhenFalse,
          accumInterceptWhenFalse, allowedDepth - 1
        );
      }
    })();

    return new LogitDecisionNode(splittingFeature, trueBranch, falseBranch);
  }

  //-------------------------------------------------------------------------
}
