// @java Features/src/features/feature_sets/network/BipartiteGraphFeatureInstanceSet.java

/**
 * A bipartite graph representation of a feature instance set. We have one
 * group of nodes representing atomic propositions, and one group of nodes
 * representing all feature instances.
 *
 * @java features/feature_sets/network/BipartiteGraphFeatureInstanceSet.java
 * @author Dennis Soemers
 */

import type { AtomicProposition, FeatureInstance, Game, State } from "../BaseFeatureSet.js";
import { SPatterNet, SPatterNetBitSet as BitSet } from "./SPatterNet.js";
import type { FastTIntArrayList } from "./SPatterNet.js";

// PropFeatureInstanceSet inline (same package in Java)

/**
 * A prop node in the PropFeatureInstanceSet representation.
 *
 * @java features.feature_sets.network.PropNode
 */
class PropNode {
  /** Unique index of this node in array */
  public readonly index: number;
  /** Atomic proposition which must be true for this node to be true */
  public readonly proposition: AtomicProposition;
  /** Bitset of instances to deactivate if this node is false */
  public readonly dependentInstances: BitSet = new BitSet();

  public constructor(index: number, proposition: AtomicProposition) {
    this.index = index;
    this.proposition = proposition;
  }

  public eval(state: State, _activeNodes: BitSet, activeInstances: BitSet): void {
    if (activeInstances.intersects(this.dependentInstances)) {
      if (!this.proposition.matches(state)) {
        activeInstances.andNot(this.dependentInstances);
      }
    }
  }

  public setDependentInstance(instanceID: number): void {
    this.dependentInstances.set(instanceID);
  }

  public proposition_(): AtomicProposition {
    return this.proposition;
  }
}

/**
 * A set of propositions and feature instances.
 *
 * @java features.feature_sets.network.PropFeatureInstanceSet
 */
export class PropFeatureInstanceSet {
  protected readonly featureInstances: FeatureInstance[];
  protected readonly propNodes: PropNode[];

  public constructor(featureInstances: FeatureInstance[], propNodes: PropNode[]) {
    this.featureInstances = featureInstances;
    this.propNodes = propNodes;
  }

  public getActiveInstances(state: State): FeatureInstance[] {
    const active: FeatureInstance[] = [];

    const activeNodes = new BitSet(this.propNodes.length);
    for (let i = 0; i < this.propNodes.length; ++i) activeNodes.set(i);

    const activeInstances = new BitSet(this.featureInstances.length);
    for (let i = 0; i < this.featureInstances.length; ++i) activeInstances.set(i);

    for (
      let i = activeNodes.nextSetBit(0);
      i >= 0;
      i = activeNodes.nextSetBit(i + 1)
    ) {
      this.propNodes[i]!.eval(state, activeNodes, activeInstances);
    }

    for (
      let i = activeInstances.nextSetBit(0);
      i >= 0;
      i = activeInstances.nextSetBit(i + 1)
    ) {
      active.push(this.featureInstances[i]!);
    }

    return active;
  }
}

//-----------------------------------------------------------------------------

/** Conjunction class (analogous to Java Conjunction) */
class Conjunction {
  private readonly mustTrue: BitSet;
  private _length: number;

  public constructor(mustTrue: BitSet) {
    this.mustTrue = mustTrue;
    this._length = mustTrue.cardinality();
  }

  public assumeTrue(id: number): boolean {
    if (this.mustTrue.get(id)) {
      this.mustTrue.clear(id);
      --this._length;
      return true;
    }
    return false;
  }

  public generalises(other: Conjunction): boolean {
    if (this._length > other._length) return false;
    const otherToProve = other.toProve();
    const toProve = this.mustTrue.clone();
    toProve.andNot(otherToProve);
    return toProve.isEmpty();
  }

  public length(): number { return this._length; }
  public toProve(): BitSet { return this.mustTrue; }

  public hashCode(): number {
    let h = 0;
    for (let i = this.mustTrue.nextSetBit(0); i >= 0; i = this.mustTrue.nextSetBit(i + 1)) {
      h = (31 * h + i) | 0;
    }
    return h;
  }

  public equals(other: Conjunction): boolean {
    const a = this.mustTrue;
    const b = other.mustTrue;
    let i = a.nextSetBit(0);
    let j = b.nextSetBit(0);
    while (i === j && i >= 0) {
      i = a.nextSetBit(i + 1);
      j = b.nextSetBit(j + 1);
    }
    return i === j;
  }

  public toString(): string { return `[Conjunction: ${this.mustTrue}]`; }
}

/** DisjunctiveClause class (analogous to Java DisjunctiveClause) */
class DisjunctiveClause {
  private readonly _conjunctions: Conjunction[] = [];
  private _numAssumedTrue: number = 0;
  private readonly _usedPropositions: BitSet = new BitSet();

  public addConjunction(conjunction: Conjunction): void {
    this._conjunctions.push(conjunction);
    this._usedPropositions.or(conjunction.toProve());
  }

  public assumeTrue(id: number): void {
    if (this._usedPropositions.get(id)) {
      for (let i = this._conjunctions.length - 1; i >= 0; --i) {
        const conjunction = this._conjunctions[i]!;
        if (conjunction.assumeTrue(id)) {
          if (conjunction.length() === 0) {
            this._conjunctions.splice(i, 1);
            ++this._numAssumedTrue;
          }
        }
      }
      this._usedPropositions.clear(id);
    }
  }

  public assumeTrueBitSet(propositions: BitSet): void {
    const intersection = propositions.clone();
    intersection.and(this._usedPropositions);

    for (let id = intersection.nextSetBit(0); id >= 0; id = intersection.nextSetBit(id + 1)) {
      for (let i = this._conjunctions.length - 1; i >= 0; --i) {
        const conjunction = this._conjunctions[i]!;
        if (conjunction.assumeTrue(id)) {
          if (conjunction.length() === 0) {
            this._conjunctions.splice(i, 1);
            ++this._numAssumedTrue;
          }
        }
      }
    }

    this._usedPropositions.andNot(intersection);
  }

  public conjunctions(): Conjunction[] { return this._conjunctions; }

  public eliminateGeneralisedConjunctions(): void {
    const oldSize = this._conjunctions.length;

    for (let i = 0; i < this._conjunctions.length; ++i) {
      const iConj = this._conjunctions[i]!;

      for (let j = this._conjunctions.length - 1; j > i; --j) {
        const jConj = this._conjunctions[j]!;
        if (iConj.generalises(jConj))
          this._conjunctions.splice(j, 1);
      }
    }

    if (this._conjunctions.length !== oldSize) {
      this._usedPropositions.andNot(this._usedPropositions);  // Clear
      for (const conj of this._conjunctions) {
        this._usedPropositions.or(conj.toProve());
      }
    }
  }

  public generalises(other: DisjunctiveClause): boolean {
    outer:
    for (const otherConj of other._conjunctions) {
      for (const myConj of this._conjunctions) {
        if (myConj.generalises(otherConj)) continue outer;
      }
      return false;
    }
    return other._conjunctions.length > 0;
  }

  public length(): number { return this._conjunctions.length; }
  public numAssumedTrue(): number { return this._numAssumedTrue; }
  public setNumAssumedTrue(num: number): void { this._numAssumedTrue = num; }
  public usedPropositions(): BitSet { return this._usedPropositions; }

  public toString(): string { return `[Disjunction: ${this._conjunctions}]`; }
}

//-----------------------------------------------------------------------------

/**
 * Node for a proposition in the bipartite graph.
 *
 * @java features.feature_sets.network.BipartiteGraphFeatureInstanceSet.PropositionNode
 */
export class PropositionNode {
  public readonly id: number;
  public readonly proposition: AtomicProposition;
  public readonly instances: FeatureInstanceNodeBG[] = [];

  public constructor(id: number, proposition: AtomicProposition) {
    this.id = id;
    this.proposition = proposition;
  }

  public toString(): string {
    return `[PropNode ${this.id}: ${String(this.proposition)}]`;
  }
}

/**
 * Node for a feature instance in the bipartite graph.
 *
 * @java features.feature_sets.network.BipartiteGraphFeatureInstanceSet.FeatureInstanceNode
 */
export class FeatureInstanceNodeBG {
  public readonly id: number;
  public readonly instance: FeatureInstance;
  public readonly propositions: PropositionNode[] = [];

  public constructor(id: number, instance: FeatureInstance) {
    this.id = id;
    this.instance = instance;
  }
}

/** Wrapper for ungeneralised/generalised pair */
interface UngeneralisedGeneralisedWrapper {
  ungeneralisedDisjunctions: DisjunctiveClause[][];
  generalisedDisjunctions: DisjunctiveClause[][];
}

/** Sortable feature instance for ordering */
class SortableFeatureInstance implements Comparable<SortableFeatureInstance> {
  public readonly featureInstance: FeatureInstance;
  public readonly propIDs: BitSet = new BitSet();

  public constructor(featureInstance: FeatureInstance) {
    this.featureInstance = featureInstance;
  }

  public compareTo(o: SortableFeatureInstance): number {
    let myRightmost = this.propIDs.length() - 1;
    let otherRightmost = o.propIDs.length() - 1;

    while (myRightmost === otherRightmost && myRightmost >= 0) {
      myRightmost = this.propIDs.previousSetBit(myRightmost - 1);
      otherRightmost = o.propIDs.previousSetBit(otherRightmost - 1);
    }

    if (myRightmost > otherRightmost) return 1;
    else if (myRightmost < otherRightmost) return -1;
    return 0;
  }
}

interface Comparable<T> {
  compareTo(other: T): number;
}

//-----------------------------------------------------------------------------

/**
 * A bipartite graph representation of a feature instance set.
 *
 * @java features.feature_sets.network.BipartiteGraphFeatureInstanceSet
 */
export class BipartiteGraphFeatureInstanceSet {

  //-------------------------------------------------------------------------

  /** Proposition nodes stored as map to avoid duplicates */
  protected readonly propositionNodes: Map<AtomicProposition, PropositionNode> = new Map();

  /** Same propositions in a list */
  protected readonly propositionNodesList: PropositionNode[] = [];

  /** List of all feature instance nodes */
  protected readonly instanceNodes: FeatureInstanceNodeBG[] = [];

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java BipartiteGraphFeatureInstanceSet()
   */
  public constructor() {}

  //-------------------------------------------------------------------------

  /**
   * Inserts given instance into this set.
   * @java BipartiteGraphFeatureInstanceSet.insertInstance(FeatureInstance)
   */
  public insertInstance(instance: FeatureInstance): void {
    const atomicPropositions: AtomicProposition[] = instance.generateAtomicPropositions();
    const instanceNode = new FeatureInstanceNodeBG(this.instanceNodes.length, instance);
    this.instanceNodes.push(instanceNode);

    for (const proposition of atomicPropositions) {
      let propNode = this.propositionNodes.get(proposition);
      if (propNode === undefined) {
        propNode = new PropositionNode(this.propositionNodesList.length, proposition);
        this.propositionNodesList.push(propNode);
        this.propositionNodes.set(proposition, propNode);
      }

      propNode.instances.push(instanceNode);
      instanceNode.propositions.push(propNode);
    }
  }

  //-------------------------------------------------------------------------

  /**
   * @return A PropFeatureInstanceSet representation of this feature set
   * @java BipartiteGraphFeatureInstanceSet.toPropFeatureInstanceSet()
   */
  public toPropFeatureInstanceSet(): PropFeatureInstanceSet {
    const nodes: PropNode[] = [];
    const conjunctiveClauses = this.computeConjunctiveClauses();

    // Split into ungeneralised and generalised
    let ungeneralised: BitSet[] = [];
    let generalised: BitSet[] = [];

    for (let i = 0; i < conjunctiveClauses.length; ++i) {
      const iProps = conjunctiveClauses[i]!;
      if (iProps.isEmpty()) continue;

      let isGeneralised = false;

      for (let j = 0; j < conjunctiveClauses.length; ++j) {
        if (i === j) continue;

        const jProps = conjunctiveClauses[j]!;
        if (jProps.isEmpty()) continue;
        if (BipartiteGraphFeatureInstanceSet.bitSetsEqual(iProps, jProps)) continue;

        const jPropsCopy = jProps.clone();
        jPropsCopy.andNot(iProps);

        if (jPropsCopy.isEmpty()) {
          isGeneralised = true;
          break;
        }
      }

      if (isGeneralised) generalised.push(iProps);
      else ungeneralised.push(iProps);
    }

    while (ungeneralised.length > 0) {
      const ungeneralisedBins: BitSet[][] = [[]];

      for (const clause of ungeneralised) {
        const clauseLength = clause.cardinality();
        while (ungeneralisedBins.length <= clauseLength) ungeneralisedBins.push([]);
        ungeneralisedBins[clauseLength]!.push(clause);
      }

      const generalisedPropCounts: number[] = new Array(this.propositionNodesList.length).fill(0);
      for (const props of generalised) {
        for (let i = props.nextSetBit(0); i >= 0; i = props.nextSetBit(i + 1)) {
          generalisedPropCounts[i]!++;
        }
      }

      const propsToAdd: number[] = [];
      const selectedProps = new BitSet();

      // All length-1 props must be added
      for (const clause of ungeneralisedBins[1] ?? []) {
        const propID = clause.nextSetBit(0);
        if (propID >= 0) {
          propsToAdd.push(propID);
          selectedProps.set(propID);
        }
      }

      for (let l = 2; l < ungeneralisedBins.length; ++l) {
        const candidateProps = new BitSet();
        const propOccurrences: number[] = new Array(this.propositionNodesList.length).fill(0);

        for (const clause of ungeneralisedBins[l]!) {
          if (clause.intersects(selectedProps)) continue;

          for (let i = clause.nextSetBit(0); i >= 0; i = clause.nextSetBit(i + 1)) {
            candidateProps.set(i);
            propOccurrences[i]!++;
          }
        }

        if (!candidateProps.isEmpty()) {
          let bestCandidates: number[] = [];
          let maxOccurrence = 0;

          for (let i = candidateProps.nextSetBit(0); i >= 0; i = candidateProps.nextSetBit(i + 1)) {
            if ((propOccurrences[i] ?? 0) > maxOccurrence) {
              maxOccurrence = propOccurrences[i]!;
              bestCandidates = [i];
            } else if ((propOccurrences[i] ?? 0) === maxOccurrence) {
              bestCandidates.push(i);
            }
          }

          let propToAdd = bestCandidates[0]!;
          let maxGeneralisedOccurrences = generalisedPropCounts[propToAdd]!;

          for (let i = 1; i < bestCandidates.length; ++i) {
            const propID = bestCandidates[i]!;
            const generalisedOccurrences = generalisedPropCounts[propID]!;
            if (generalisedOccurrences > maxGeneralisedOccurrences) {
              maxGeneralisedOccurrences = generalisedOccurrences;
              propToAdd = propID;
            }
          }

          propsToAdd.push(propToAdd);
          selectedProps.set(propToAdd);
        }
      }

      for (const propID of propsToAdd) {
        nodes.push(new PropNode(nodes.length, this.propositionNodesList[propID]!.proposition));
      }

      // Update ungeneralised and generalised
      for (let i = ungeneralised.length - 1; i >= 0; --i) {
        ungeneralised[i]!.andNot(selectedProps);
        if (ungeneralised[i]!.isEmpty()) ungeneralised.splice(i, 1);
      }

      for (let i = generalised.length - 1; i >= 0; --i) {
        generalised[i]!.andNot(selectedProps);
        if (generalised[i]!.isEmpty()) generalised.splice(i, 1);
      }

      // Re-compute ungeneralised/generalised
      const newUngeneralised: BitSet[] = [];
      const newGeneralised: BitSet[] = [];

      const allClausesSet = new Set<BitSet>();
      for (const c of generalised) allClausesSet.add(c);
      for (const c of ungeneralised) allClausesSet.add(c);
      const allClauses = Array.from(allClausesSet);

      for (let i = 0; i < allClauses.length; ++i) {
        const iProps = allClauses[i]!;
        if (iProps.isEmpty()) continue;

        let isGeneralised = false;

        for (let j = 0; j < allClauses.length; ++j) {
          if (i === j) continue;

          const jProps = allClauses[j]!;
          if (jProps.isEmpty()) continue;

          const jPropsCopy = jProps.clone();
          jPropsCopy.andNot(iProps);

          if (jPropsCopy.isEmpty()) {
            isGeneralised = true;
            break;
          }
        }

        if (isGeneralised) newGeneralised.push(iProps);
        else newUngeneralised.push(iProps);
      }

      generalised = newGeneralised;
      ungeneralised = newUngeneralised;
    }

    // Tell every propnode which feature instances it should deactivate if false
    for (const propNode of nodes) {
      const instances = this.propositionNodes.get(propNode.proposition_())?.instances ?? [];
      for (let i = instances.length - 1; i >= 0; --i) {
        propNode.setDependentInstance(instances[i]!.id);
      }
    }

    const featureInstances: FeatureInstance[] = this.instanceNodes.map(n => n.instance);
    const propNodes = nodes;

    return new PropFeatureInstanceSet(featureInstances, propNodes);
  }

  //-------------------------------------------------------------------------

  /**
   * @param numFeatures
   * @param thresholdedFeatures Features to ignore
   * @param game
   * @param perspectivePlayer
   * @return A SPatterNet representation of this feature set
   * @java BipartiteGraphFeatureInstanceSet.toSPatterNet(int, BitSet, Game, int)
   */
  public toSPatterNet(
    numFeatures: number,
    thresholdedFeatures: BitSet,
    game: Game,
    perspectivePlayer: number
  ): SPatterNet {
    const propositionsList: AtomicProposition[] = [];

    const conjunctiveClauses: BitSet[] = this.computeConjunctiveClauses().map(bs => bs);

    const autoActiveFeatures = new BitSet();

    // Filter instance nodes
    const filteredInstanceNodes: FeatureInstanceNodeBG[] = [];
    filteredInstanceNodes.push(...this.instanceNodes);

    for (let i = filteredInstanceNodes.length - 1; i >= 0; --i) {
      const node = filteredInstanceNodes[i]!;
      const featureIdx = node.instance.feature().spatialFeatureSetIndex();

      if (thresholdedFeatures.get(featureIdx)) {
        filteredInstanceNodes.splice(i, 1);
        conjunctiveClauses.splice(i, 1);
      } else if (conjunctiveClauses[i]!.isEmpty()) {
        filteredInstanceNodes.splice(i, 1);
        conjunctiveClauses.splice(i, 1);
        autoActiveFeatures.set(featureIdx);
      }
    }

    // Remove instances of auto-active features
    for (let i = filteredInstanceNodes.length - 1; i >= 0; --i) {
      const featureIdx = filteredInstanceNodes[i]!.instance.feature().spatialFeatureSetIndex();
      if (autoActiveFeatures.get(featureIdx)) {
        filteredInstanceNodes.splice(i, 1);
        conjunctiveClauses.splice(i, 1);
      }
    }

    // Remove instances generalised by other instances for same feature
    for (let i = filteredInstanceNodes.length - 1; i >= 0; --i) {
      const instanceNode = filteredInstanceNodes[i]!;
      const featureIdx = instanceNode.instance.feature().spatialFeatureSetIndex();

      for (let k = 0; k < filteredInstanceNodes.length; ++k) {
        if (i !== k) {
          const other = filteredInstanceNodes[k]!;
          if (other.instance.feature().spatialFeatureSetIndex() === featureIdx) {
            if (other.instance.generalises(instanceNode.instance)) {
              filteredInstanceNodes.splice(i, 1);
              conjunctiveClauses.splice(i, 1);
              break;
            }
          }
        }
      }
    }

    const sortableFeatureInstances: SortableFeatureInstance[] =
      filteredInstanceNodes.map(n => new SortableFeatureInstance(n.instance));

    const disjunctions: DisjunctiveClause[] = new Array(numFeatures).fill(null).map(() => new DisjunctiveClause());
    for (let i = 0; i < filteredInstanceNodes.length; ++i) {
      const featureIdx = filteredInstanceNodes[i]!.instance.feature().spatialFeatureSetIndex();
      disjunctions[featureIdx]!.addConjunction(new Conjunction(conjunctiveClauses[i]!));
    }

    const relevantProps = new BitSet(this.propositionNodesList.length);
    for (const disjunction of disjunctions) {
      relevantProps.or(disjunction.usedPropositions());
    }

    // Compute prove/disprove relations between propositions
    const proveIfTrue: BitSet[] = new Array(this.propositionNodesList.length).fill(null).map(() => new BitSet());
    const disproveIfTrue: BitSet[] = new Array(this.propositionNodesList.length).fill(null).map(() => new BitSet());
    const proveIfFalse: BitSet[] = new Array(this.propositionNodesList.length).fill(null).map(() => new BitSet());
    const disproveIfFalse: BitSet[] = new Array(this.propositionNodesList.length).fill(null).map(() => new BitSet());

    for (let i = 0; i < this.propositionNodesList.length; ++i) {
      const propI = this.propositionNodesList[i]!.proposition;

      for (let j = 0; j < this.propositionNodesList.length; ++j) {
        if (i === j) continue;

        const propJ = this.propositionNodesList[j]!.proposition;

        if (propI.provesIfTrue(propJ, game)) proveIfTrue[i]!.set(j);
        else if (propI.disprovesIfTrue(propJ, game)) disproveIfTrue[i]!.set(j);

        if (propI.provesIfFalse(propJ, game)) proveIfFalse[i]!.set(j);
        else if (propI.disprovesIfFalse(propJ, game)) disproveIfFalse[i]!.set(j);
      }
    }

    let ungeneralisedDisjunctions: DisjunctiveClause[][] = [];
    let generalisedDisjunctions: DisjunctiveClause[][] = [];

    const zeroProvenDisjunctions: DisjunctiveClause[] = [];
    for (const clause of disjunctions) {
      clause.eliminateGeneralisedConjunctions();
      if (clause.length() > 0)
        zeroProvenDisjunctions.push(clause);
    }

    zeroProvenDisjunctions.sort((o1, o2) => o1.length() - o2.length());

    generalisedDisjunctions.push(zeroProvenDisjunctions);

    let ungenGenWrapper = BipartiteGraphFeatureInstanceSet.updateUngeneralisedGeneralised(
      ungeneralisedDisjunctions,
      generalisedDisjunctions
    );
    ungeneralisedDisjunctions = ungenGenWrapper.ungeneralisedDisjunctions;
    generalisedDisjunctions = ungenGenWrapper.generalisedDisjunctions;

    const pickedPropsList: number[] = [];
    const pickedPropsBitset = new BitSet();

    const irrelevantProps = relevantProps.clone();
    irrelevantProps.flip(0, this.propositionNodesList.length);
    irrelevantProps.and(new BitSet(this.propositionNodesList.length));  // Keep only actual irrelevant ones

    // Mark irrelevant as already picked
    for (let i = 0; i < this.propositionNodesList.length; ++i) {
      if (!relevantProps.get(i)) pickedPropsBitset.set(i);
    }

    let i: number;
    while ((i = BipartiteGraphFeatureInstanceSet.firstNonEmptyListIndex(ungeneralisedDisjunctions)) >= 0) {
      const ungeneralised_i = ungeneralisedDisjunctions[i]!;
      pickedPropsList.length = 0;

      // Build bins
      const disjunctionBins: DisjunctiveClause[][] = [];
      for (const clause of ungeneralised_i) {
        const clauseLength = clause.length();
        while (disjunctionBins.length <= clauseLength) disjunctionBins.push([]);
        disjunctionBins[clauseLength]!.push(clause);
      }

      const singleConjList = disjunctionBins[1] ?? [];

      // Sort by number of empty checks (descending)
      singleConjList.sort((o1, o2) => {
        const conj1BitSet = o1.conjunctions()[0]?.toProve() ?? new BitSet();
        const conj2BitSet = o2.conjunctions()[0]?.toProve() ?? new BitSet();

        let numEmptyChecks1 = 0;
        for (let j = conj1BitSet.nextSetBit(0); j >= 0; j = conj1BitSet.nextSetBit(j + 1)) {
          if (this.propositionNodesList[j]?.proposition.stateVectorType() === "Empty") ++numEmptyChecks1;
        }

        let numEmptyChecks2 = 0;
        for (let j = conj2BitSet.nextSetBit(0); j >= 0; j = conj2BitSet.nextSetBit(j + 1)) {
          if (this.propositionNodesList[j]?.proposition.stateVectorType() === "Empty") ++numEmptyChecks2;
        }

        return numEmptyChecks2 - numEmptyChecks1;
      });

      // Pick length-1 conjunction single props
      for (let j = singleConjList.length - 1; j >= 0; --j) {
        const disj = singleConjList[j]!;
        if (disj.usedPropositions().cardinality() === 1) {
          const propID = disj.usedPropositions().nextSetBit(0);
          if (propID >= 0 && !pickedPropsBitset.get(propID)) {
            this._pickProp(propID, pickedPropsList, pickedPropsBitset);
          }
          singleConjList.splice(j, 1);
        }
      }

      for (let j = 0; j < singleConjList.length; ++j) {
        const disj = singleConjList[j]!;
        this._pickCoveringPropositions(
          disj, pickedPropsList, pickedPropsBitset,
          singleConjList, j + 1,
          disjunctionBins, 2,
          ungeneralisedDisjunctions, i + 1,
          generalisedDisjunctions, 0,
          proveIfTrue, disproveIfTrue, proveIfFalse, disproveIfFalse
        );
      }

      for (let j = 2; j < disjunctionBins.length; ++j) {
        const bin = disjunctionBins[j]!;
        for (let k = 0; k < bin.length; ++k) {
          const disj = bin[k]!;
          this._pickCoveringPropositions(
            disj, pickedPropsList, pickedPropsBitset,
            bin, k + 1,
            disjunctionBins, j + 1,
            ungeneralisedDisjunctions, i + 1,
            generalisedDisjunctions, 0,
            proveIfTrue, disproveIfTrue, proveIfFalse, disproveIfFalse
          );
        }
      }

      // Add all picked propositions
      for (const propID of pickedPropsList) {
        const prop = this.propositionNodesList[propID]!.proposition;
        propositionsList.push(prop);
      }

      // Inform all disjunctions about proven propositions
      for (const list of ungeneralisedDisjunctions) {
        for (const clause of list) clause.assumeTrueBitSet(pickedPropsBitset);
      }
      for (const list of generalisedDisjunctions) {
        for (const clause of list) clause.assumeTrueBitSet(pickedPropsBitset);
      }

      ungenGenWrapper = BipartiteGraphFeatureInstanceSet.updateUngeneralisedGeneralised(
        ungeneralisedDisjunctions,
        generalisedDisjunctions
      );
      ungeneralisedDisjunctions = ungenGenWrapper.ungeneralisedDisjunctions;
      generalisedDisjunctions = ungenGenWrapper.generalisedDisjunctions;
    }

    // Tell sortable instances which propositions they use
    for (let j = 0; j < filteredInstanceNodes.length; ++j) {
      const instanceNode = filteredInstanceNodes[j]!;

      for (const propNode of instanceNode.propositions) {
        const newPropID = propositionsList.indexOf(propNode.proposition);
        if (newPropID >= 0)
          sortableFeatureInstances[j]!.propIDs.set(newPropID);
      }
    }

    autoActiveFeatures.andNot(thresholdedFeatures);

    sortableFeatureInstances.sort((a, b) => a.compareTo(b));

    const sortedFeatureInstances: FeatureInstance[] = sortableFeatureInstances.map(s => s.featureInstance);
    const instancesPerPropBS: BitSet[] = new Array(propositionsList.length).fill(null).map(() => new BitSet());
    const instancesPerFeatureBS: (BitSet | null)[] = new Array(numFeatures).fill(null);
    const propsPerInstanceBS: BitSet[] = new Array(sortableFeatureInstances.length).fill(null).map(() => new BitSet());

    for (let j = sortableFeatureInstances.length - 1; j >= 0; --j) {
      const instanceProps = sortableFeatureInstances[j]!.propIDs;
      propsPerInstanceBS[j] = instanceProps.clone();

      for (let k = instanceProps.nextSetBit(0); k >= 0; k = instanceProps.nextSetBit(k + 1)) {
        instancesPerPropBS[k]!.set(j);
      }

      const featureIdx = sortedFeatureInstances[j]!.feature().spatialFeatureSetIndex();
      if (instancesPerFeatureBS[featureIdx] === null)
        instancesPerFeatureBS[featureIdx] = new BitSet();
      instancesPerFeatureBS[featureIdx]!.set(j);
    }

    const autoActiveFeaturesList: number[] = [];
    for (let j = autoActiveFeatures.nextSetBit(0); j >= 0; j = autoActiveFeatures.nextSetBit(j + 1)) {
      autoActiveFeaturesList.push(j);
    }

    // Recompute proves/disproves for sorted propositions (forward only)
    const provesIfTruePerProp: BitSet[] = new Array(propositionsList.length).fill(null).map(() => new BitSet());
    const disprovesIfTruePerProp: BitSet[] = new Array(propositionsList.length).fill(null).map(() => new BitSet());
    const provesIfFalsePerProp: BitSet[] = new Array(propositionsList.length).fill(null).map(() => new BitSet());
    const disprovesIfFalsePerProp: BitSet[] = new Array(propositionsList.length).fill(null).map(() => new BitSet());

    for (let j = 0; j < propositionsList.length; ++j) {
      const propJ = propositionsList[j]!;

      for (let k = j + 1; k < propositionsList.length; ++k) {
        const propK = propositionsList[k]!;

        if (propJ.provesIfTrue(propK, game)) provesIfTruePerProp[j]!.set(k);
        else if (propJ.disprovesIfTrue(propK, game)) disprovesIfTruePerProp[j]!.set(k);

        if (propJ.provesIfFalse(propK, game)) provesIfFalsePerProp[j]!.set(k);
        else if (propJ.disprovesIfFalse(propK, game)) disprovesIfFalsePerProp[j]!.set(k);
      }
    }

    const featureIndicesArr: number[] = sortedFeatureInstances.map(
      fi => fi.feature().spatialFeatureSetIndex()
    );

    return new SPatterNet(
      featureIndicesArr,
      propositionsList,
      instancesPerPropBS,
      instancesPerFeatureBS,
      propsPerInstanceBS,
      autoActiveFeaturesList,
      thresholdedFeatures,
      provesIfTruePerProp,
      disprovesIfTruePerProp,
      provesIfFalsePerProp,
      disprovesIfFalsePerProp
    );
  }

  //-------------------------------------------------------------------------

  private static updateUngeneralisedGeneralised(
    ungeneralisedDisjunctions: DisjunctiveClause[][],
    generalisedDisjunctions: DisjunctiveClause[][]
  ): UngeneralisedGeneralisedWrapper {
    const newUngeneralised: DisjunctiveClause[][] = [];
    const newGeneralised: DisjunctiveClause[][] = [];

    const lists = [ungeneralisedDisjunctions, generalisedDisjunctions];

    for (const list of lists) {
      for (let i = 0; i < list.length; ++i) {
        const list_i = list[i]!;

        for (let j = list_i.length - 1; j >= 0; --j) {
          if (j >= list_i.length) { j = list_i.length; continue; }

          const disjunction = list_i[j]!;
          if (disjunction.length() > 0) {
            const hasGeneraliser = BipartiteGraphFeatureInstanceSet.searchGeneraliser(
              disjunction,
              ungeneralisedDisjunctions,
              generalisedDisjunctions
            );

            const numAssumedTrue = disjunction.numAssumedTrue();
            if (hasGeneraliser) {
              while (newGeneralised.length <= numAssumedTrue) newGeneralised.push([]);
              newGeneralised[numAssumedTrue]!.push(disjunction);
            } else {
              while (newUngeneralised.length <= numAssumedTrue) newUngeneralised.push([]);
              newUngeneralised[numAssumedTrue]!.push(disjunction);
            }
          }
        }
      }
    }

    return { ungeneralisedDisjunctions: newUngeneralised, generalisedDisjunctions: newGeneralised };
  }

  private static searchGeneraliser(
    clause: DisjunctiveClause,
    ungeneralisedDisjunctions: DisjunctiveClause[][],
    generalisedDisjunctions: DisjunctiveClause[][]
  ): boolean {
    const lists = [ungeneralisedDisjunctions, generalisedDisjunctions];
    for (const list_outer of lists) {
      for (const list_j of list_outer) {
        for (let k = 0; k < list_j.length; /**/) {
          const other = list_j[k]!;

          if (other.generalises(clause)) {
            if (clause.generalises(other)) {
              if (clause.numAssumedTrue() > other.numAssumedTrue()) {
                clause.setNumAssumedTrue(other.numAssumedTrue());
              }
              list_j.splice(k, 1);
              continue;
            } else {
              return true;
            }
          }

          ++k;
        }
      }
    }
    return false;
  }

  private _pickCoveringPropositions(
    disjunction: DisjunctiveClause,
    pickedPropsList: number[],
    pickedPropsBitset: BitSet,
    firstTiebreakerList: DisjunctiveClause[],
    firstTiebreakerIndex: number,
    secondTiebreakerLists: DisjunctiveClause[][],
    secondTiebreakerIndex: number,
    thirdTiebreakerLists: DisjunctiveClause[][],
    thirdTiebreakerIndex: number,
    fourthTiebreakerLists: DisjunctiveClause[][],
    fourthTiebreakerIndex: number,
    proveIfTrue: BitSet[],
    disproveIfTrue: BitSet[],
    proveIfFalse: BitSet[],
    disproveIfFalse: BitSet[]
  ): void {
    const candidateProps = disjunction.usedPropositions().clone();
    if (candidateProps.intersects(pickedPropsBitset)) return;

    let maxIndices = this._maxScorePropIndices(
      candidateProps, disjunction,
      firstTiebreakerList, firstTiebreakerIndex,
      pickedPropsBitset, proveIfTrue, disproveIfTrue, proveIfFalse, disproveIfFalse
    );

    if (maxIndices.length === 1) {
      this._pickProp(maxIndices[0]!, pickedPropsList, pickedPropsBitset);
      return;
    }

    candidateProps.andNot(candidateProps); // Clear
    for (const idx of maxIndices) candidateProps.set(idx);

    for (let i = secondTiebreakerIndex; i < secondTiebreakerLists.length; ++i) {
      maxIndices = this._maxScorePropIndices(
        candidateProps, null,
        secondTiebreakerLists[i]!, 0,
        pickedPropsBitset, proveIfTrue, disproveIfTrue, proveIfFalse, disproveIfFalse
      );
      if (maxIndices.length === 1) {
        this._pickProp(maxIndices[0]!, pickedPropsList, pickedPropsBitset);
        return;
      }
      candidateProps.andNot(candidateProps);
      for (const idx of maxIndices) candidateProps.set(idx);
    }

    for (let i = thirdTiebreakerIndex; i < thirdTiebreakerLists.length; ++i) {
      maxIndices = this._maxScorePropIndices(
        candidateProps, null,
        thirdTiebreakerLists[i]!, 0,
        pickedPropsBitset, proveIfTrue, disproveIfTrue, proveIfFalse, disproveIfFalse
      );
      if (maxIndices.length === 1) {
        this._pickProp(maxIndices[0]!, pickedPropsList, pickedPropsBitset);
        return;
      }
      candidateProps.andNot(candidateProps);
      for (const idx of maxIndices) candidateProps.set(idx);
    }

    for (let i = fourthTiebreakerIndex; i < fourthTiebreakerLists.length; ++i) {
      maxIndices = this._maxScorePropIndices(
        candidateProps, null,
        fourthTiebreakerLists[i]!, 0,
        pickedPropsBitset, proveIfTrue, disproveIfTrue, proveIfFalse, disproveIfFalse
      );
      if (maxIndices.length === 1) {
        this._pickProp(maxIndices[0]!, pickedPropsList, pickedPropsBitset);
        return;
      }
      candidateProps.andNot(candidateProps);
      for (const idx of maxIndices) candidateProps.set(idx);
    }

    // Random tiebreak
    this._pickProp(
      maxIndices[Math.floor(Math.random() * maxIndices.length)]!,
      pickedPropsList,
      pickedPropsBitset
    );
  }

  private _pickProp(propID: number, pickedPropsList: number[], pickedPropsBitset: BitSet): void {
    pickedPropsBitset.set(propID);
    const pickedProp = this.propositionNodesList[propID]!.proposition;

    if (pickedProp.stateVectorType() !== "Empty") {
      const site = pickedProp.testedSite();

      for (
        let i = pickedPropsBitset.nextSetBit(0) === 0 ? 0 : pickedPropsBitset.nextSetBit(0);
        i < this.propositionNodesList.length;
        ++i
      ) {
        if (pickedPropsBitset.get(i)) continue;

        const unpickedProp = this.propositionNodesList[i]!.proposition;
        if (unpickedProp.testedSite() === site && unpickedProp.stateVectorType() === "Empty") {
          pickedPropsBitset.set(i);
          pickedPropsList.push(i);
        }
      }
    }

    pickedPropsList.push(propID);
  }

  private _maxScorePropIndices(
    candidateProps: BitSet,
    disjunction: DisjunctiveClause | null,
    clauses: DisjunctiveClause[],
    startIdx: number,
    coveredProps: BitSet,
    proveIfTrue: BitSet[],
    disproveIfTrue: BitSet[],
    proveIfFalse: BitSet[],
    disproveIfFalse: BitSet[]
  ): number[] {
    const propScores: number[] = new Array(this.propositionNodesList.length).fill(0.0);

    if (disjunction !== null) {
      for (
        let candidateProp = candidateProps.nextSetBit(0);
        candidateProp >= 0;
        candidateProp = candidateProps.nextSetBit(candidateProp + 1)
      ) {
        propScores[candidateProp]! += BipartiteGraphFeatureInstanceSet.propScoreForDisjunction(
          disjunction, candidateProp, proveIfTrue, disproveIfTrue, proveIfFalse, disproveIfFalse
        );
      }
    }

    for (let i = startIdx; i < clauses.length; ++i) {
      const dis = clauses[i]!;
      const disProps = dis.usedPropositions();
      if (disProps.intersects(coveredProps)) continue;

      for (
        let candidateProp = candidateProps.nextSetBit(0);
        candidateProp >= 0;
        candidateProp = candidateProps.nextSetBit(candidateProp + 1)
      ) {
        if (disProps.get(candidateProp)) {
          propScores[candidateProp]! += BipartiteGraphFeatureInstanceSet.propScoreForDisjunction(
            dis, candidateProp, proveIfTrue, disproveIfTrue, proveIfFalse, disproveIfFalse
          );
        }
      }
    }

    const maxIndices: number[] = [];
    let maxScore = -1.0;

    for (
      let candidateProp = candidateProps.nextSetBit(0);
      candidateProp >= 0;
      candidateProp = candidateProps.nextSetBit(candidateProp + 1)
    ) {
      if ((propScores[candidateProp] ?? 0) > maxScore) {
        maxIndices.length = 0;
        maxIndices.push(candidateProp);
        maxScore = propScores[candidateProp]!;
      } else if ((propScores[candidateProp] ?? 0) === maxScore) {
        maxIndices.push(candidateProp);
      }
    }

    return maxIndices;
  }

  private static propScoreForDisjunction(
    disjunction: DisjunctiveClause,
    prop: number,
    proveIfTrue: BitSet[],
    disproveIfTrue: BitSet[],
    proveIfFalse: BitSet[],
    disproveIfFalse: BitSet[]
  ): number {
    let score = 0.0;

    for (const conj of disjunction.conjunctions()) {
      const conjProps = conj.toProve();

      if (conjProps.get(prop)) {
        score += Math.pow(2.0, -conj.length());
      } else {
        const ifTrueOverlap = proveIfTrue[prop]!.clone();
        ifTrueOverlap.or(disproveIfTrue[prop]!);
        ifTrueOverlap.and(conjProps);

        const ifFalseOverlap = proveIfFalse[prop]!.clone();
        ifFalseOverlap.or(disproveIfFalse[prop]!);
        ifFalseOverlap.and(conjProps);

        score += (0.5 * ifTrueOverlap.cardinality() + 0.5 * ifFalseOverlap.cardinality()) * Math.pow(2.0, -conj.length());
      }
    }

    return score;
  }

  //-------------------------------------------------------------------------

  private computeConjunctiveClauses(): BitSet[] {
    const conjunctiveClauses: BitSet[] = new Array(this.instanceNodes.length);

    for (let i = 0; i < this.instanceNodes.length; ++i) {
      const instanceNode = this.instanceNodes[i]!;
      const propIDs = new BitSet(this.propositionNodes.size);

      for (const propNode of instanceNode.propositions) {
        propIDs.set(propNode.id);
      }

      conjunctiveClauses[i] = propIDs;
    }

    return conjunctiveClauses;
  }

  private static firstNonEmptyListIndex(lists: DisjunctiveClause[][]): number {
    for (let i = 0; i < lists.length; ++i) {
      if (lists[i]!.length > 0) return i;
    }
    return -1;
  }

  private static bitSetsEqual(a: BitSet, b: BitSet): boolean {
    let i = a.nextSetBit(0);
    let j = b.nextSetBit(0);
    while (i === j && i >= 0) {
      i = a.nextSetBit(i + 1);
      j = b.nextSetBit(j + 1);
    }
    return i === j;
  }

  //-------------------------------------------------------------------------
}
