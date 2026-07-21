// @java Features/src/features/feature_sets/network/Conjunction.java

/**
 * Represents a conjunction of atomic propositions. Is mutable: we can modify
 * it by giving it propositions that we "assume to have been proven", which will
 * then be removed from the requirements.
 *
 * @java features.feature_sets.network.Conjunction
 * @author Dennis Soemers
 */

import { BitSet } from "./PropNode.js";

//-----------------------------------------------------------------------------

/**
 * A conjunction of atomic propositions.
 *
 * @java features.feature_sets.network.Conjunction
 */
export class Conjunction {

  //-------------------------------------------------------------------------

  /** IDs of atomic propositions that must be true */
  private readonly mustTrue: BitSet;

  /** Number of propositions that are to be proven */
  private length: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @param mustTrue
   * @java Conjunction(BitSet)
   */
  constructor(mustTrue: BitSet) {
    this.mustTrue = mustTrue;
    this.length = mustTrue.cardinality();
  }

  //-------------------------------------------------------------------------

  /**
   * Tells this conjunction to assume that proposition of given ID is true
   * (safe to also call on conjunctions that do not require this proposition at all)
   * @param id
   * @return True if and only if the given proposition was a requirement of this conjunction
   * @java Conjunction.assumeTrue(int)
   */
  public assumeTrue(id: number): boolean {
    if (this.mustTrue.get(id)) {
      this.mustTrue.clear(id);
      --this.length;
      return true;
    }

    return false;
  }

  /**
   * @param other
   * @return True if, ignoring propositions that are already assumed to have been proven,
   * this conjunction generalises the given other conjunction.
   * @java Conjunction.generalises(Conjunction)
   */
  public generalises(other: Conjunction): boolean {
    if (this.length > other.length) return false;

    const otherToProve = other.toProve();
    const toProve = this.mustTrue.clone();
    toProve.andNot(otherToProve);
    return toProve.isEmpty();
  }

  /**
   * @return Length of this conjunction: number of propositions remaining to be proven
   * @java Conjunction.length()
   */
  public lengthVal(): number {
    return this.length;
  }

  /**
   * @return BitSet of IDs that must still be proven
   * @java Conjunction.toProve()
   */
  public toProve(): BitSet {
    return this.mustTrue;
  }

  //-------------------------------------------------------------------------

  /** @java Conjunction.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = (prime * result + this.mustTrue.hashCode()) | 0;
    return result;
  }

  /** @java Conjunction.equals(Object) */
  public equals(obj: unknown): boolean {
    if (this === obj) return true;
    if (!(obj instanceof Conjunction)) return false;
    return this.mustTrue.equals((obj as Conjunction).mustTrue);
  }

  //-------------------------------------------------------------------------

  /** @java Conjunction.toString() */
  public toString(): string {
    return "[Conjunction: " + this.mustTrue + "]";
  }

  //-------------------------------------------------------------------------
}
