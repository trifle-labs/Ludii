// @java Features/src/features/feature_sets/network/FeaturePropNode.java

/**
 * A feature prop node in the FeaturePropSet representation.
 *
 * @java features/feature_sets/network/FeaturePropNode.java
 * @author Dennis Soemers
 */

import type { State, AtomicProposition } from "../BaseFeatureSet.js";

/**
 * A feature prop node in the FeaturePropSet representation.
 *
 * @java features.feature_sets.network.FeaturePropNode
 */
export class FeaturePropNode {

  //-------------------------------------------------------------------------

  /** Unique index of this node in array */
  protected readonly index: number;

  /** Atomic proposition which must be true for this node to be true */
  protected readonly proposition: AtomicProposition;

  /** Bitset of feature indices to deactivate if this node is false */
  protected readonly dependentFeatures: Set<number> = new Set<number>();

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java FeaturePropNode(int, AtomicProposition)
   */
  public constructor(index: number, proposition: AtomicProposition) {
    this.index = index;
    this.proposition = proposition;
  }

  //-------------------------------------------------------------------------

  /**
   * Evaluate the given state.
   * @param state
   * @param activeNodes Bitset of nodes that are still active.
   * @param activeFeatures Bitset of feature indices that are active.
   * @java FeaturePropNode.eval(State, BitSet, BitSet)
   */
  public eval(state: State, _activeNodes: Set<number>, activeFeatures: Set<number>): void {
    // Check if any dependent feature is still active
    let intersects = false;
    for (const dep of this.dependentFeatures) {
      if (activeFeatures.has(dep)) {
        intersects = true;
        break;
      }
    }

    if (intersects) {
      if (!this.proposition.matches(state)) {
        // Requirement not satisfied: remove all dependent features
        for (const dep of this.dependentFeatures) {
          activeFeatures.delete(dep);
        }
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Mark a feature ID that we should set to false if our proposition is false.
   * @java FeaturePropNode.setDependentFeature(int)
   */
  public setDependentFeature(featureID: number): void {
    this.dependentFeatures.add(featureID);
  }

  /**
   * @return Our proposition
   * @java FeaturePropNode.proposition()
   */
  public proposition_(): AtomicProposition {
    return this.proposition;
  }

  //-------------------------------------------------------------------------
}
