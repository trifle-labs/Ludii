// @java Features/src/features/WeightVector.java

/**
 * Wrapper to represent a vector of weights. Internally stores it as just a single
 * vector, where the first N weights are for aspatial features, and the remaining
 * weights are for spatial features.
 *
 * @java features.WeightVector
 * @author Dennis Soemers
 */

import { FVector } from "../../../Common/src/main/collections/FVector.js";

//-----------------------------------------------------------------------------
// Escape-hatch interface for FeatureVector

/** @java features.FeatureVector */
export interface FeatureVector {
  aspatialFeatureValues(): { dot(weights: FVector): number; dim(): number };
  activeSpatialFeatureIndices(): number[];
}

//-----------------------------------------------------------------------------

/**
 * A vector of weights where the first N are for aspatial features,
 * and the remaining are for spatial features.
 *
 * @java features.WeightVector
 */
export class WeightVector {

  //-------------------------------------------------------------------------

  /** Our vector of weights */
  private readonly weights: FVector;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param weights
   * @java WeightVector(FVector)
   */
  constructor(weights: FVector);

  /**
   * Copy constructor
   * @param other
   * @java WeightVector(WeightVector)
   */
  constructor(other: WeightVector);

  constructor(arg: FVector | WeightVector) {
    if (arg instanceof WeightVector) {
      this.weights = new FVector(arg.weights);
    } else {
      this.weights = arg;
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @param featureVector
   * @return Dot product of this weight vector with given feature vector
   * @java WeightVector.dot(FeatureVector)
   */
  public dot(featureVector: FeatureVector): number {
    const aspatialFeatureValues = featureVector.aspatialFeatureValues();

    // This dot product call will only use the first N weights, where N is the length
    // of the aspatial feature values vector
    const aspatialFeaturesVal = aspatialFeatureValues.dot(this.weights);

    // For the spatial features, use this offset (to skip weights for aspatial features)
    const offset = aspatialFeatureValues.dim();

    return aspatialFeaturesVal + this.weights.dotSparse(featureVector.activeSpatialFeatureIndices(), offset);
  }

  //-------------------------------------------------------------------------

  /**
   * @return Vector containing all weights; first those for aspatial features, followed
   * by those for spatial features.
   * @java WeightVector.allWeights()
   */
  public allWeights(): FVector {
    return this.weights;
  }

  //-------------------------------------------------------------------------

  /** @java WeightVector.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = (prime * result + (this.weights === null ? 0 : this.weights.hashCode())) | 0;
    return result;
  }

  /** @java WeightVector.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof WeightVector)) return false;
    const other = obj as WeightVector;
    if (this.weights === null) {
      if (other.weights !== null) return false;
    }
    return this.weights.equals(other.weights);
  }

  //-------------------------------------------------------------------------
}
