// @java Features/src/features/feature_sets/network/SPatterNet.java

/**
 * A set of propositions which can (dis)prove feature instances, which
 * in turn can prove features, with propositions and instances implicitly
 * arranged in a network (but using flat arrays for improved cache locality).
 *
 * @java features/feature_sets/network/SPatterNet.java
 * @author Dennis Soemers
 */

import type { State, AtomicProposition, BaseFootprint, ContainerState, ChunkSet } from "../BaseFeatureSet.js";

// Escape-hatch types

/** @java main.collections.FastTIntArrayList */
export type FastTIntArrayList = {
  add(v: number): void;
  add(arr: number[]): void;
  addAll(other: FastTIntArrayList): void;
  toArray(): number[];
  isEmpty(): boolean;
  size(): number;
};

/** Minimal BitSet implementation using a boolean array */
class BitSet {
  private bits: boolean[];

  constructor(size: number = 0) {
    this.bits = new Array(size).fill(false);
  }

  private ensureCapacity(index: number): void {
    while (this.bits.length <= index) {
      this.bits.push(false);
    }
  }

  set(index: number, to?: number): void {
    if (to !== undefined) {
      for (let i = index; i < to; ++i) {
        this.ensureCapacity(i);
        this.bits[i] = true;
      }
    } else {
      this.ensureCapacity(index);
      this.bits[index] = true;
    }
  }

  get(index: number): boolean {
    return index < this.bits.length && (this.bits[index] === true);
  }

  clear(index: number): void {
    if (index < this.bits.length) this.bits[index] = false;
  }

  nextSetBit(from: number): number {
    for (let i = from; i < this.bits.length; ++i) {
      if (this.bits[i] === true) return i;
    }
    return -1;
  }

  previousSetBit(from: number): number {
    for (let i = Math.min(from, this.bits.length - 1); i >= 0; --i) {
      if (this.bits[i] === true) return i;
    }
    return -1;
  }

  andNot(other: BitSet): void {
    for (let i = 0; i < Math.min(this.bits.length, other.bits.length); ++i) {
      if (other.bits[i]) this.bits[i] = false;
    }
  }

  and(other: BitSet): void {
    for (let i = 0; i < this.bits.length; ++i) {
      if (i >= other.bits.length) this.bits[i] = false;
      else this.bits[i] = (this.bits[i] === true) && (other.bits[i] === true);
    }
  }

  or(other: BitSet): void {
    for (let i = 0; i < other.bits.length; ++i) {
      this.ensureCapacity(i);
      this.bits[i] = (this.bits[i] === true) || (other.bits[i] === true);
    }
  }

  flip(from: number, to: number): void {
    for (let i = from; i < to; ++i) {
      this.ensureCapacity(i);
      this.bits[i] = !this.bits[i];
    }
  }

  cardinality(): number {
    return this.bits.filter(b => b).length;
  }

  clone(): BitSet {
    const bs = new BitSet();
    bs.bits = this.bits.slice();
    return bs;
  }

  isEmpty(): boolean {
    return !this.bits.some(b => b);
  }

  intersects(other: BitSet): boolean {
    for (let i = 0; i < Math.min(this.bits.length, other.bits.length); ++i) {
      if (this.bits[i] && other.bits[i]) return true;
    }
    return false;
  }

  length(): number {
    for (let i = this.bits.length - 1; i >= 0; --i) {
      if (this.bits[i]) return i + 1;
    }
    return 0;
  }
}

// Escape-hatch factories for ChunkSet
const ChunkSetFactory = null as unknown as {
  create(chunkSize: number, numChunks: number): ChunkSet;
};

const FullFootprintFactory = null as unknown as {
  create(
    emptyCells: ChunkSet | null,
    emptyVertices: ChunkSet | null,
    emptyEdges: ChunkSet | null,
    whoCells: ChunkSet | null,
    whoVertices: ChunkSet | null,
    whoEdges: ChunkSet | null,
    whatCells: ChunkSet | null,
    whatVertices: ChunkSet | null,
    whatEdges: ChunkSet | null
  ): BaseFootprint;
};

/**
 * Simple FastTIntArrayList implementation.
 */
function makeFastTIntArrayList(initialCapacity: number = 0): FastTIntArrayList {
  const data: number[] = [];
  return {
    add(v: number | number[]): void {
      if (Array.isArray(v)) { data.push(...v); }
      else { data.push(v); }
    },
    addAll(other: FastTIntArrayList): void {
      data.push(...other.toArray());
    },
    toArray(): number[] { return data.slice(); },
    isEmpty(): boolean { return data.length === 0; },
    size(): number { return data.length; },
  };
}

/**
 * A set of propositions which can (dis)prove feature instances, with
 * propositions and instances arranged in a network using flat arrays.
 *
 * @java features.feature_sets.network.SPatterNet
 */
export class SPatterNet {

  //-------------------------------------------------------------------------

  /** Array of feature indices, appropriately sorted */
  protected readonly featureIndices: number[];

  /** Array of propositions to test */
  protected readonly propositions: AtomicProposition[];

  /** For every proposition, a bitset of feature instances that depend on that proposition */
  protected readonly instancesPerProp: BitSet[];

  /** For every feature, a bitset containing the instances for that feature */
  protected readonly instancesPerFeature: (BitSet | null)[];

  /** Minimum feature index for which we have more than 0 instances */
  protected readonly featureOffset: number;

  /** For every feature instance, an array of the propositions required for that feature instance */
  protected readonly propsPerInstance: number[][];

  /** Array of feature indices that are always active */
  protected readonly autoActiveFeatures: number[];

  /** For every proposition, if it's true, an array of other propositions that are then proven */
  protected readonly provesPropsIfTruePerProp: number[][];

  /** For every proposition, if it's true, a bitset of instances that are then deactivated */
  protected readonly deactivateInstancesIfTrue: BitSet[];

  /** For every proposition, if it's false, an array of other propositions that are then proven */
  protected readonly provesPropsIfFalsePerProp: number[][];

  /** For every proposition, if it's false, a bitset of instances that are then deactivated */
  protected readonly deactivateInstancesIfFalse: BitSet[];

  /** Boolean array with true entry for every proposition */
  protected readonly ALL_PROPS_ACTIVE: boolean[];

  /** BitSet with a 1 entry for every instance, except auto-active/thresholded ones */
  protected readonly INIT_INSTANCES_ACTIVE: BitSet;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java SPatterNet(int[], AtomicProposition[], BitSet[], BitSet[], BitSet[], int[], BitSet, BitSet[], BitSet[], BitSet[], BitSet[])
   */
  public constructor(
    featureIndices: number[],
    propositions: AtomicProposition[],
    dependentFeatureInstances: BitSet[],
    instancesPerFeature: (BitSet | null)[],
    propsPerInstance: BitSet[],
    autoActiveFeatures: number[],
    thresholdedFeatures: BitSet,
    provesPropsIfTruePerProp: BitSet[],
    disprovesPropsIfTruePerProp: BitSet[],
    provesPropsIfFalsePerProp: BitSet[],
    disprovesPropsIfFalsePerProp: BitSet[]
  ) {
    this.featureIndices = featureIndices;

    // Compute featureOffset
    let firstValidFeatureIdx = -1;
    for (let i = 0; i < instancesPerFeature.length; ++i) {
      if (instancesPerFeature[i] !== null) {
        firstValidFeatureIdx = i;
        break;
      }
    }

    if (firstValidFeatureIdx < 0) {
      this.featureOffset = 0;
      this.instancesPerFeature = [];
    } else {
      this.featureOffset = firstValidFeatureIdx;
      let lastValidFeatureIdx = -1;
      for (let i = instancesPerFeature.length - 1; i >= firstValidFeatureIdx; --i) {
        if (instancesPerFeature[i] !== null) {
          lastValidFeatureIdx = i;
          break;
        }
      }

      this.instancesPerFeature = new Array(lastValidFeatureIdx - firstValidFeatureIdx + 1).fill(null);
      for (let i = 0; i < this.instancesPerFeature.length; ++i) {
        this.instancesPerFeature[i] = instancesPerFeature[i + this.featureOffset] ?? null;
      }
    }

    this.propositions = propositions;
    this.instancesPerProp = dependentFeatureInstances;
    this.autoActiveFeatures = autoActiveFeatures;

    // Convert provesPropsIfTruePerProp from BitSet[] to int[][]
    this.provesPropsIfTruePerProp = new Array(provesPropsIfTruePerProp.length);
    for (let i = 0; i < provesPropsIfTruePerProp.length; ++i) {
      const arr: number[] = [];
      for (let j = provesPropsIfTruePerProp[i]!.nextSetBit(0); j >= 0; j = provesPropsIfTruePerProp[i]!.nextSetBit(j + 1)) {
        arr.push(j);
      }
      this.provesPropsIfTruePerProp[i] = arr;
    }

    // Convert provesPropsIfFalsePerProp from BitSet[] to int[][]
    this.provesPropsIfFalsePerProp = new Array(provesPropsIfFalsePerProp.length);
    for (let i = 0; i < provesPropsIfFalsePerProp.length; ++i) {
      const arr: number[] = [];
      for (let j = provesPropsIfFalsePerProp[i]!.nextSetBit(0); j >= 0; j = provesPropsIfFalsePerProp[i]!.nextSetBit(j + 1)) {
        arr.push(j);
      }
      this.provesPropsIfFalsePerProp[i] = arr;
    }

    // Build deactivateInstancesIfTrue
    this.deactivateInstancesIfTrue = new Array(disprovesPropsIfTruePerProp.length);
    for (let i = 0; i < this.deactivateInstancesIfTrue.length; ++i) {
      const deactivate = new BitSet();
      for (let j = disprovesPropsIfTruePerProp[i]!.nextSetBit(0); j >= 0; j = disprovesPropsIfTruePerProp[i]!.nextSetBit(j + 1)) {
        deactivate.or(this.instancesPerProp[j]!);
      }
      this.deactivateInstancesIfTrue[i] = deactivate.clone();
    }

    // Build deactivateInstancesIfFalse
    this.deactivateInstancesIfFalse = new Array(disprovesPropsIfFalsePerProp.length);
    for (let i = 0; i < this.deactivateInstancesIfFalse.length; ++i) {
      const deactivate = new BitSet();
      for (let j = disprovesPropsIfFalsePerProp[i]!.nextSetBit(0); j >= 0; j = disprovesPropsIfFalsePerProp[i]!.nextSetBit(j + 1)) {
        deactivate.or(this.instancesPerProp[j]!);
      }
      // Also incorporate instances that require the proposition itself
      deactivate.or(this.instancesPerProp[i]!);
      this.deactivateInstancesIfFalse[i] = deactivate.clone();
    }

    this.ALL_PROPS_ACTIVE = new Array(propositions.length).fill(true);

    this.INIT_INSTANCES_ACTIVE = new BitSet(featureIndices.length);
    for (let i = 0; i < featureIndices.length; ++i) {
      this.INIT_INSTANCES_ACTIVE.set(i);
    }

    // Convert propsPerInstance from BitSet[] to int[][]
    // Remove propositions for instances if those propositions also appear in earlier propositions
    const firstInstancesOfFeature = new BitSet(featureIndices.length);
    const featuresObserved: boolean[] = new Array(this.instancesPerFeature.length).fill(false);
    for (let i = 0; i < featureIndices.length; ++i) {
      const featureIdx = featureIndices[i]!;

      if (!featuresObserved[featureIdx]) {
        firstInstancesOfFeature.set(i);
        featuresObserved[featureIdx] = true;
        const instanceProps = propsPerInstance[i]!;

        for (let j = i + 1; j < featureIndices.length; ++j) {
          if (featureIndices[j] === featureIdx)
            propsPerInstance[j]!.andNot(instanceProps);
        }
      }
    }

    this.propsPerInstance = new Array(propsPerInstance.length);
    for (let i = 0; i < propsPerInstance.length; ++i) {
      const arr: number[] = [];
      for (let j = propsPerInstance[i]!.nextSetBit(0); j >= 0; j = propsPerInstance[i]!.nextSetBit(j + 1)) {
        arr.push(j);
      }
      this.propsPerInstance[i] = arr;
    }

    // Additional optimisation passes (as in Java)
    const immuneInstances = new BitSet(featureIndices.length);

    const undeactivatableInstances = new BitSet(featureIndices.length);
    for (const bitset of this.deactivateInstancesIfTrue) {
      undeactivatableInstances.or(bitset);
    }
    for (const bitset of this.deactivateInstancesIfFalse) {
      undeactivatableInstances.or(bitset);
    }
    undeactivatableInstances.flip(0, featureIndices.length);
    undeactivatableInstances.and(firstInstancesOfFeature);

    for (let i = 0; i < propositions.length; ++i) {
      const mustTrueProps = new BitSet(propositions.length);

      for (let j = 0; j < i; ++j) {
        const jInstances = this.instancesPerProp[j]!.clone();
        jInstances.and(undeactivatableInstances);
        if (jInstances.isEmpty()) continue;

        const jDeactivatesIfFalse = this.deactivateInstancesIfFalse[j]!;
        const iInstances = this.instancesPerProp[i]!.clone();
        iInstances.andNot(jDeactivatesIfFalse);

        if (iInstances.isEmpty()) {
          mustTrueProps.set(j);
        }
      }

      for (let j = 0; j < featureIndices.length; ++j) {
        // Check if false case proves j
        const jPropsFalse = propsPerInstance[j]!.clone();
        jPropsFalse.andNot(mustTrueProps);
        // provesPropsIfFalsePerProp[i] is already an int[], convert back to BitSet for andNot
        const proveFalse = new BitSet();
        for (const k of this.provesPropsIfFalsePerProp[i]!) proveFalse.set(k);
        jPropsFalse.andNot(proveFalse);

        if (jPropsFalse.isEmpty()) {
          immuneInstances.set(j);
          const ftIdx = featureIndices[j]!;
          if (this.instancesPerFeature[ftIdx] !== null && this.instancesPerFeature[ftIdx] !== undefined) {
            const deactivateInstances = this.instancesPerFeature[ftIdx]!.clone();
            deactivateInstances.andNot(immuneInstances);
            this.deactivateInstancesIfFalse[i]!.or(deactivateInstances);
            undeactivatableInstances.andNot(deactivateInstances);
          }
        }

        // Check if true case proves j
        const jPropsTrue = propsPerInstance[j]!.clone();
        jPropsTrue.andNot(mustTrueProps);
        const proveTrue = new BitSet();
        for (const k of this.provesPropsIfTruePerProp[i]!) proveTrue.set(k);
        jPropsTrue.andNot(proveTrue);
        jPropsTrue.clear(i);

        if (jPropsTrue.isEmpty()) {
          immuneInstances.set(j);
          const ftIdx = featureIndices[j]!;
          if (this.instancesPerFeature[ftIdx] !== null && this.instancesPerFeature[ftIdx] !== undefined) {
            const deactivateInstances = this.instancesPerFeature[ftIdx]!.clone();
            deactivateInstances.andNot(immuneInstances);
            this.deactivateInstancesIfTrue[i]!.or(deactivateInstances);
            undeactivatableInstances.andNot(deactivateInstances);
          }
        }
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @param state
   * @return List of active feature indices for given state
   * @java SPatterNet.getActiveFeatures(State)
   */
  public getActiveFeatures(state: State): FastTIntArrayList {
    const activeFeatures = makeFastTIntArrayList(
      this.instancesPerFeature.length + this.autoActiveFeatures.length
    );
    activeFeatures.add(this.autoActiveFeatures);

    const activeProps = this.ALL_PROPS_ACTIVE.slice();
    const activeInstances = this.INIT_INSTANCES_ACTIVE.clone();

    outer:
    for (
      let instanceToCheck = activeInstances.nextSetBit(0);
      instanceToCheck >= 0;
      instanceToCheck = activeInstances.nextSetBit(instanceToCheck + 1)
    ) {
      const instanceProps = this.propsPerInstance[instanceToCheck]!;

      for (let i = 0; i < instanceProps.length; ++i) {
        const propID = instanceProps[i]!;

        if (!activeProps[propID])
          continue;  // Prop already known to be true

        // Mark as inactive (checked)
        activeProps[propID] = false;

        if (!this.propositions[propID]!.matches(state)) {
          // Proposition is false
          for (const j of this.provesPropsIfFalsePerProp[propID]!) {
            activeProps[j] = false;
          }

          activeInstances.andNot(this.deactivateInstancesIfFalse[propID]!);

          continue outer;
        } else {
          // Proposition is true
          for (const j of this.provesPropsIfTruePerProp[propID]!) {
            activeProps[j] = false;
          }

          activeInstances.andNot(this.deactivateInstancesIfTrue[propID]!);
        }
      }

      // Feature instance (and feature) is active
      const newActiveFeature = this.featureIndices[instanceToCheck]!;
      activeFeatures.add(newActiveFeature);

      // Skip remaining instances for the same feature
      const featureInstancesBS = this.instancesPerFeature[newActiveFeature - this.featureOffset];
      if (featureInstancesBS !== null && featureInstancesBS !== undefined) {
        activeInstances.andNot(featureInstancesBS);
      }
    }

    return activeFeatures;
  }

  //-------------------------------------------------------------------------

  /**
   * @param containerState
   * @return Footprint of the state members that may be tested by this set.
   * @java SPatterNet.generateFootprint(ContainerState)
   */
  public generateFootprint(containerState: ContainerState): BaseFootprint {
    const footprintEmptyCells = containerState.emptyChunkSetCell() !== null
      ? ChunkSetFactory.create(containerState.emptyChunkSetCell()!.chunkSize(), 1)
      : null;
    const footprintEmptyVertices = containerState.emptyChunkSetVertex() !== null
      ? ChunkSetFactory.create(containerState.emptyChunkSetVertex()!.chunkSize(), 1)
      : null;
    const footprintEmptyEdges = containerState.emptyChunkSetEdge() !== null
      ? ChunkSetFactory.create(containerState.emptyChunkSetEdge()!.chunkSize(), 1)
      : null;

    const footprintWhoCells = containerState.chunkSizeWhoCell() > 0
      ? ChunkSetFactory.create(containerState.chunkSizeWhoCell(), 1)
      : null;
    const footprintWhoVertices = containerState.chunkSizeWhoVertex() > 0
      ? ChunkSetFactory.create(containerState.chunkSizeWhoVertex(), 1)
      : null;
    const footprintWhoEdges = containerState.chunkSizeWhoEdge() > 0
      ? ChunkSetFactory.create(containerState.chunkSizeWhoEdge(), 1)
      : null;

    const footprintWhatCells = containerState.chunkSizeWhatCell() > 0
      ? ChunkSetFactory.create(containerState.chunkSizeWhatCell(), 1)
      : null;
    const footprintWhatVertices = containerState.chunkSizeWhatVertex() > 0
      ? ChunkSetFactory.create(containerState.chunkSizeWhatVertex(), 1)
      : null;
    const footprintWhatEdges = containerState.chunkSizeWhatEdge() > 0
      ? ChunkSetFactory.create(containerState.chunkSizeWhatEdge(), 1)
      : null;

    for (const prop of this.propositions) {
      switch (prop.graphElementType()) {
        case "Cell":
          switch (prop.stateVectorType()) {
            case "Empty": prop.addMaskTo(footprintEmptyCells); break;
            case "Who": prop.addMaskTo(footprintWhoCells); break;
            case "What": prop.addMaskTo(footprintWhatCells); break;
          }
          break;
        case "Edge":
          switch (prop.stateVectorType()) {
            case "Empty": prop.addMaskTo(footprintEmptyEdges); break;
            case "Who": prop.addMaskTo(footprintWhoEdges); break;
            case "What": prop.addMaskTo(footprintWhatEdges); break;
          }
          break;
        case "Vertex":
          switch (prop.stateVectorType()) {
            case "Empty": prop.addMaskTo(footprintEmptyVertices); break;
            case "Who": prop.addMaskTo(footprintWhoVertices); break;
            case "What": prop.addMaskTo(footprintWhatVertices); break;
          }
          break;
      }
    }

    return FullFootprintFactory.create(
      footprintEmptyCells,
      footprintEmptyVertices,
      footprintEmptyEdges,
      footprintWhoCells,
      footprintWhoVertices,
      footprintWhoEdges,
      footprintWhatCells,
      footprintWhatVertices,
      footprintWhatEdges
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @return Number of propositions in this SPatterNet
   * @java SPatterNet.numPropositions()
   */
  public numPropositions(): number {
    return this.propositions.length;
  }

  //-------------------------------------------------------------------------
}

// Re-export BitSet for use in other network files
export { BitSet as SPatterNetBitSet };
