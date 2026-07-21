// @java Features/src/features/feature_sets/network/PropNode.java

/**
 * A prop node in the PropFeatureInstanceSet representation.
 *
 * @java features.feature_sets.network.PropNode
 * @author Dennis Soemers
 */

//-----------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported deps

/** @java features.spatial.instances.AtomicProposition */
export interface AtomicProposition {
  matches(state: State): boolean;
}

/** @java other.state.State */
export interface State {
  [key: string]: unknown;
}

/**
 * Minimal BitSet mirroring java.util.BitSet surface used here.
 */
export class BitSet {
  private readonly _bits: Set<number> = new Set();

  /** @java new BitSet() */
  constructor() {}

  /** @java boolean get(int bitIndex) */
  get(bitIndex: number): boolean {
    return this._bits.has(bitIndex);
  }

  /** @java void set(int bitIndex) */
  set(bitIndex: number): void {
    this._bits.add(bitIndex);
  }

  /** @java boolean intersects(BitSet set) */
  intersects(other: BitSet): boolean {
    for (const b of other._bits) {
      if (this._bits.has(b)) return true;
    }
    return false;
  }

  /** @java void andNot(BitSet set) */
  andNot(other: BitSet): void {
    for (const b of other._bits) {
      this._bits.delete(b);
    }
  }

  /** @java int nextSetBit(int fromIndex) */
  nextSetBit(fromIndex: number): number {
    let min = -1;
    for (const b of this._bits) {
      if (b >= fromIndex && (min === -1 || b < min)) min = b;
    }
    return min;
  }

  /** @java int cardinality() */
  cardinality(): number {
    return this._bits.size;
  }

  /** @java void clear(int bitIndex) */
  clear(bitIndex: number): void {
    this._bits.delete(bitIndex);
  }

  /** @java void and(BitSet set) */
  and(other: BitSet): void {
    for (const b of [...this._bits]) {
      if (!other._bits.has(b)) this._bits.delete(b);
    }
  }

  /** @java void or(BitSet set) */
  or(other: BitSet): void {
    for (const b of other._bits) {
      this._bits.add(b);
    }
  }

  /** @java BitSet clone() */
  clone(): BitSet {
    const copy = new BitSet();
    for (const b of this._bits) copy._bits.add(b);
    return copy;
  }

  /** @java boolean isEmpty() */
  isEmpty(): boolean {
    return this._bits.size === 0;
  }

  /**
   * Sets bits from fromIndex (inclusive) to toIndex (exclusive).
   * @java void set(int fromIndex, int toIndex)
   */
  setRange(fromIndex: number, toIndex: number): void {
    for (let i = fromIndex; i < toIndex; i++) {
      this._bits.add(i);
    }
  }

  /** @java int hashCode() */
  hashCode(): number {
    let hash = 1234;
    const sorted = [...this._bits].sort((a, b) => a - b);
    for (const b of sorted) {
      hash = (hash * 31 + b) | 0;
    }
    return hash;
  }

  /** @java boolean equals(Object) */
  equals(other: BitSet): boolean {
    if (this._bits.size !== other._bits.size) return false;
    for (const b of this._bits) {
      if (!other._bits.has(b)) return false;
    }
    return true;
  }
}

//-----------------------------------------------------------------------------

/**
 * A prop node in the PropFeatureInstanceSet representation.
 *
 * @java features.feature_sets.network.PropNode
 */
export class PropNode {

  //-------------------------------------------------------------------------

  /** Unique index of this node in array */
  protected readonly index: number;

  /** Atomic proposition which must be true for this node to be true */
  protected readonly proposition: AtomicProposition;

  /** Bitset of instances to deactivate if this node is false */
  protected readonly dependentInstances: BitSet = new BitSet();

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param index
   * @param proposition
   * @java PropNode(int, AtomicProposition)
   */
  constructor(index: number, proposition: AtomicProposition) {
    this.index = index;
    this.proposition = proposition;
  }

  //-------------------------------------------------------------------------

  /**
   * Evaluate the given state.
   * @param state
   * @param activeNodes Bitset of nodes that are still active.
   * @param activeInstances Bitset of feature instances that are active.
   * @java PropNode.eval(State, BitSet, BitSet)
   */
  public eval(state: State, activeNodes: BitSet, activeInstances: BitSet): void {
    if (activeInstances.intersects(this.dependentInstances)) {
      // if false, might as well not check anything
      if (!this.proposition.matches(state)) {
        // Requirement not satisfied
        activeInstances.andNot(this.dependentInstances);
      }
    }
  }

  //-------------------------------------------------------------------------

  /**
   * Mark an instance ID that we should set to false if our proposition is false
   * @param instanceID
   * @java PropNode.setDependentInstance(int)
   */
  public setDependentInstance(instanceID: number): void {
    this.dependentInstances.set(instanceID);
  }

  /**
   * @return Our proposition
   * @java PropNode.proposition()
   */
  public propositionVal(): AtomicProposition {
    return this.proposition;
  }

  //-------------------------------------------------------------------------
}
