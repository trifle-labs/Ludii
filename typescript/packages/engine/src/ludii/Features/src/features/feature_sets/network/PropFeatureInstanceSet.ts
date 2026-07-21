// @java Features/src/features/feature_sets/network/PropFeatureInstanceSet.java

/**
 * A set of propositions and feature instances.
 *
 * @java features.feature_sets.network.PropFeatureInstanceSet
 * @author Dennis Soemers
 */

import { BitSet, State } from "./PropNode.js";
import { PropNode } from "./PropNode.js";

//-----------------------------------------------------------------------------
// Escape-hatch interfaces

/** @java features.spatial.instances.FeatureInstance */
export interface FeatureInstance {
  [key: string]: unknown;
}

//-----------------------------------------------------------------------------

/**
 * A set of propositions and feature instances.
 *
 * @java features.feature_sets.network.PropFeatureInstanceSet
 */
export class PropFeatureInstanceSet {

  //-------------------------------------------------------------------------

  /** Array of feature instances */
  protected readonly featureInstances: FeatureInstance[];

  /** Array of PropNodes */
  protected readonly propNodes: PropNode[];

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param featureInstances
   * @param propNodes
   * @java PropFeatureInstanceSet(FeatureInstance[], PropNode[])
   */
  constructor(featureInstances: FeatureInstance[], propNodes: PropNode[]) {
    this.featureInstances = featureInstances;
    this.propNodes = propNodes;
  }

  //-------------------------------------------------------------------------

  /**
   * @param state
   * @return List of active instances for given state
   * @java PropFeatureInstanceSet.getActiveInstances(State)
   */
  public getActiveInstances(state: State): FeatureInstance[] {
    const active: FeatureInstance[] = [];

    const activeNodes = new BitSet();
    activeNodes.setRange(0, this.propNodes.length);

    const activeInstances = new BitSet();
    activeInstances.setRange(0, this.featureInstances.length);

    for (let i = activeNodes.nextSetBit(0); i >= 0; i = activeNodes.nextSetBit(i + 1)) {
      this.propNodes[i]!.eval(state, activeNodes, activeInstances);
    }

    for (let i = activeInstances.nextSetBit(0); i >= 0; i = activeInstances.nextSetBit(i + 1)) {
      active.push(this.featureInstances[i]!);
    }

    return active;
  }

  //-------------------------------------------------------------------------
}
