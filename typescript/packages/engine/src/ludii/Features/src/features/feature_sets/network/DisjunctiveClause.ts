// @java Features/src/features/feature_sets/network/DisjunctiveClause.java

/**
 * A disjunctive clause: a disjunction of one or more conjunctions. Is mutable:
 * we can modify it by giving it propositions that are assumed to have already
 * been proven, which will then be removed from conjunctions they appear in,
 * and fully-proven conjunctions will also be removed entirely from the
 * disjunctive clause!
 *
 * @java features.feature_sets.network.DisjunctiveClause
 * @author Dennis Soemers
 */

import { BitSet } from "./PropNode.js";
import { Conjunction } from "./Conjunction.js";

//-----------------------------------------------------------------------------

/**
 * A disjunction of one or more conjunctions.
 *
 * @java features.feature_sets.network.DisjunctiveClause
 */
export class DisjunctiveClause {

  //-------------------------------------------------------------------------

  /** List of conjunctions, one of which must be true for this disjunction to be true */
  private readonly conjunctions: Conjunction[];

  /** Number of conjunctions that we assume to have already been proven */
  private numAssumedTrue: number = 0; // NOTE: field ignored in hashCode() and equals()

  /** BitSet of all propositions that show up anywhere in any of the conjunctions of this disjunction */
  private readonly usedPropositions: BitSet = new BitSet();

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java DisjunctiveClause()
   */
  constructor() {
    this.conjunctions = [];
  }

  //-------------------------------------------------------------------------

  /**
   * Adds the given conjunction to list of conjunctions that can prove this disjunction
   * @param conjunction
   * @java DisjunctiveClause.addConjunction(Conjunction)
   */
  public addConjunction(conjunction: Conjunction): void {
    this.conjunctions.push(conjunction);
    this.usedPropositions.or(conjunction.toProve());
  }

  /**
   * Tells this disjunction to assume that proposition of given ID is true. Will propagate
   * to all conjunctions, and remove fully-proven conjunctions.
   *
   * @param id
   * @java DisjunctiveClause.assumeTrue(int)
   */
  public assumeTrue(id: number): void;
  /**
   * Tells this disjunction to assume that all propositions in given
   * BitSet are true. Will propagate to all conjunctions, and remove
   * fully-proven conjunctions.
   *
   * @param propositions
   * @java DisjunctiveClause.assumeTrue(BitSet)
   */
  public assumeTrue(propositions: BitSet): void;
  public assumeTrue(arg: number | BitSet): void {
    if (typeof arg === "number") {
      const id = arg;
      if (this.usedPropositions.get(id)) {
        for (let i = this.conjunctions.length - 1; i >= 0; --i) {
          const conjunction = this.conjunctions[i]!;
          if (conjunction.assumeTrue(id)) {
            if (conjunction.lengthVal() === 0) {
              this.conjunctions.splice(i, 1);
              ++this.numAssumedTrue;
            }
          }
        }

        this.usedPropositions.clear(id);
      }
    } else {
      const propositions = arg;
      const intersection = propositions.clone();
      intersection.and(this.usedPropositions);

      for (let id = intersection.nextSetBit(0); id >= 0; id = intersection.nextSetBit(id + 1)) {
        for (let i = this.conjunctions.length - 1; i >= 0; --i) {
          const conjunction = this.conjunctions[i]!;
          if (conjunction.assumeTrue(id)) {
            if (conjunction.lengthVal() === 0) {
              this.conjunctions.splice(i, 1);
              ++this.numAssumedTrue;
            }
          }
        }
      }

      this.usedPropositions.andNot(intersection);
    }
  }

  /**
   * @return Our list of conjunctions
   * @java DisjunctiveClause.conjunctions()
   */
  public conjunctionsVal(): Conjunction[] {
    return this.conjunctions;
  }

  /**
   * Removes any conjunctions that are generalised by any other conjunctions
   * that are also in this disjunction.
   * @java DisjunctiveClause.eliminateGeneralisedConjunctions()
   */
  public eliminateGeneralisedConjunctions(): void {
    const oldSize = this.conjunctions.length;

    for (let i = 0; i < this.conjunctions.length; ++i) {
      const iConj = this.conjunctions[i]!;

      for (let j = this.conjunctions.length - 1; j > i; --j) {
        const jConj = this.conjunctions[j]!;
        if (iConj.generalises(jConj)) {
          this.conjunctions.splice(j, 1);
        }
      }
    }

    if (this.conjunctions.length !== oldSize) {
      // We've removed some conjunctions, should recompute usedPropositions to be safe
      // clear usedPropositions
      for (let id = this.usedPropositions.nextSetBit(0); id >= 0; id = this.usedPropositions.nextSetBit(id + 1)) {
        this.usedPropositions.clear(id);
      }
      for (const conj of this.conjunctions) {
        this.usedPropositions.or(conj.toProve());
      }
    }
  }

  /**
   * @param other
   * @return True if and only if this disjunctive clause generalises the given
   * other disjunctive clause.
   * @java DisjunctiveClause.generalises(DisjunctiveClause)
   */
  public generalises(other: DisjunctiveClause): boolean {
    outer:
    for (const otherConj of other.conjunctions) {
      for (const myConj of this.conjunctions) {
        if (myConj.generalises(otherConj)) continue outer;
      }

      return false;
    }

    return other.conjunctions.length > 0;
  }

  /**
   * @return Number of conjunctions (excluding ones already assumed to be true)
   * @java DisjunctiveClause.length()
   */
  public length(): number {
    return this.conjunctions.length;
  }

  /**
   * @return Number of conjunctions that we assume to have been fully proven
   * @java DisjunctiveClause.numAssumedTrue()
   */
  public numAssumedTrueVal(): number {
    return this.numAssumedTrue;
  }

  /**
   * Sets the number of conjunctions that are assumed to have already been fully proven.
   * @param num
   * @java DisjunctiveClause.setNumAssumedTrue(int)
   */
  public setNumAssumedTrue(num: number): void {
    this.numAssumedTrue = num;
  }

  /**
   * @return Bitset of all propositions that show up in any conjunctions in this disjunction
   * @java DisjunctiveClause.usedPropositions()
   */
  public usedPropositionsVal(): BitSet {
    return this.usedPropositions;
  }

  //-------------------------------------------------------------------------

  /** @java DisjunctiveClause.toString() */
  public toString(): string {
    return "[Disjunction: " + this.conjunctions + "]";
  }

  //-------------------------------------------------------------------------
}
