// @java Features/src/features/FeatureVector.java

import type { FastTIntArrayList } from "../../../Common/src/main/collections/FastTIntArrayList.js";
import type { FVector } from "../../../Common/src/main/collections/FVector.js";

/**
 * Wrapper to represent a "vector" of features; internally, does not just hold a
 * single vector, but uses a sparse representation for binary (typically sparsely
 * active) spatial features, and a dense floats representation for aspatial features
 * (which are not necessarily binary).
 *
 * @java features.FeatureVector
 * @author Dennis Soemers
 */
export class FeatureVector {

	//-------------------------------------------------------------------------

	/** Indices of spatial features that are active */
	private readonly _activeSpatialFeatureIndices: FastTIntArrayList;

	/** Vector of values for aspatial features */
	private readonly _aspatialFeatureValues: FVector;

	//-------------------------------------------------------------------------

	/**
	 * Constructor
	 * @param activeSpatialFeatureIndices
	 * @param aspatialFeatureValues
	 * @java FeatureVector(TIntArrayList, FVector)
	 */
	constructor(activeSpatialFeatureIndices: FastTIntArrayList, aspatialFeatureValues: FVector) {
		this._activeSpatialFeatureIndices = activeSpatialFeatureIndices;
		this._aspatialFeatureValues = aspatialFeatureValues;
	}

	//-------------------------------------------------------------------------

	/**
	 * @return Indices of active spatial features (sparse representation)
	 * @java FeatureVector.activeSpatialFeatureIndices()
	 */
	public activeSpatialFeatureIndices(): FastTIntArrayList {
		return this._activeSpatialFeatureIndices;
	}

	/**
	 * @return Vector of feature values for aspatial features (dense representation)
	 * @java FeatureVector.aspatialFeatureValues()
	 */
	public aspatialFeatureValues(): FVector {
		return this._aspatialFeatureValues;
	}

	//-------------------------------------------------------------------------

	public hashCode(): number {
		const prime = 31;
		let result = 1;
		result = (prime * result + (this._activeSpatialFeatureIndices == null ? 0 : (this._activeSpatialFeatureIndices as unknown as { hashCode(): number }).hashCode())) | 0;
		result = (prime * result + (this._aspatialFeatureValues == null ? 0 : (this._aspatialFeatureValues as unknown as { hashCode(): number }).hashCode())) | 0;
		return result;
	}

	public equals(obj: unknown): boolean {
		if (this === obj)
			return true;

		if (!(obj instanceof FeatureVector))
			return false;

		const other = obj as FeatureVector;
		if (this._activeSpatialFeatureIndices == null) {
			if (other._activeSpatialFeatureIndices != null)
				return false;
		} else if (!(this._activeSpatialFeatureIndices as unknown as { equals(o: unknown): boolean }).equals(other._activeSpatialFeatureIndices)) {
			return false;
		}

		if (this._aspatialFeatureValues == null) {
			if (other._aspatialFeatureValues != null)
				return false;
		} else if (!(this._aspatialFeatureValues as unknown as { equals(o: unknown): boolean }).equals(other._aspatialFeatureValues)) {
			return false;
		}

		return true;
	}

	//-------------------------------------------------------------------------

	public toString(): string {
		return `<Aspatial feature values: ${this._aspatialFeatureValues}, Spatial indices: ${this._activeSpatialFeatureIndices}>`;
	}

	//-------------------------------------------------------------------------
}
