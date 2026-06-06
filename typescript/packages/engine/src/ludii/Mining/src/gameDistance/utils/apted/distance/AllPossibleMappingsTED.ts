// @java Mining/src/gameDistance/utils/apted/distance/AllPossibleMappingsTED.java
// @ts-nocheck

/* MIT License
 * Copyright (c) 2017 Mateusz Pawlik
 */

import type { CostModel, NodeLike } from "../costmodel/CostModel.js";

// Not-yet-ported dependency escape-hatch: NodeIndexer (batch 45)
type NodeIndexerLike<D> = {
  getSize(): number;
  preL_to_node: Array<NodeLike<D>>;
  preL_to_preR: number[];
};

type NodeIndexerCtor = new <D>(node: NodeLike<D>, costModel: CostModel<D>) => NodeIndexerLike<D>;

// Escape hatch: NodeIndexer is not yet ported (batch 45)
// We use a minimal structural approximation sufficient to call the Java logic.
// The actual implementation will be provided by batch 45.
function createNodeIndexer<D>(node: NodeLike<D>, costModel: CostModel<D>): NodeIndexerLike<D> {
  // Defer to actual NodeIndexer if available at runtime; otherwise this is a stub.
  // Since batch 45 hasn't been ported yet, we provide a functional escape hatch
  // that will be replaced when batch 45 is ported.
  return (void 0, ((): never => {
    throw new Error("NodeIndexer not yet ported (batch 45). Cannot construct AllPossibleMappingsTED.");
  }))();
}

/**
 * Implements an exponential algorithm for the tree edit distance. It computes
 * all possible TED mappings between two trees and calculated their minimal
 * cost.
 *
 * @param C type of cost model.
 * @param D type of node data.
 * @java gameDistance.utils.apted.distance.AllPossibleMappingsTED
 */
export class AllPossibleMappingsTED<C extends CostModel<D>, D> {

  /**
   * Indexer of the source tree.
   * @java AllPossibleMappingsTED.it1
   */
  private it1: NodeIndexerLike<D> = null as unknown as NodeIndexerLike<D>;

  /**
   * Indexer of the destination tree.
   * @java AllPossibleMappingsTED.it2
   */
  private it2: NodeIndexerLike<D> = null as unknown as NodeIndexerLike<D>;

  /**
   * The size of the source input tree.
   * @java AllPossibleMappingsTED.size1
   */
  private size1: number = 0;

  /**
   * The size of the destination tree.
   * @java AllPossibleMappingsTED.size2
   */
  private size2: number = 0;

  /**
   * Cost model to be used for calculating costs of edit operations.
   * @java AllPossibleMappingsTED.costModel
   */
  private readonly costModel: C;

  /**
   * Constructs the AllPossibleMappingsTED algorithm with a specific cost model.
   *
   * @param costModel a cost model used in the algorithm.
   * @java AllPossibleMappingsTED(C)
   */
  public constructor(costModel: C) {
    this.costModel = costModel;
  }

  /**
   * Computes the tree edit distance between two trees by trying all possible
   * TED mappings. It uses the specified cost model.
   *
   * @param t1 source tree.
   * @param t2 destination tree.
   * @return the tree edit distance between two trees.
   * @java AllPossibleMappingsTED.computeEditDistance(Node, Node)
   */
  public computeEditDistance(t1: NodeLike<D>, t2: NodeLike<D>): number {
    // Index the nodes of both input trees.
    this.init(t1, t2);
    const mappings = this.generateAllOneToOneMappings();
    this.removeNonTEDMappings(mappings);
    return this.getMinCost(mappings);
  }

  /**
   * Indexes the input trees.
   *
   * @param t1 source tree.
   * @param t2 destination tree.
   * @java AllPossibleMappingsTED.init(Node, Node)
   */
  public init(t1: NodeLike<D>, t2: NodeLike<D>): void {
    this.it1 = createNodeIndexer(t1, this.costModel);
    this.it2 = createNodeIndexer(t2, this.costModel);
    this.size1 = this.it1.getSize();
    this.size2 = this.it2.getSize();
  }

  /**
   * Generate all possible 1-1 mappings.
   *
   * <p>These mappings do not conform to TED conditions (sibling-order and
   * ancestor-descendant).
   *
   * <p>A mapping is a list of pairs (arrays) of preorder IDs (identifying
   * nodes).
   *
   * @return set of all 1-1 mappings.
   * @java AllPossibleMappingsTED.generateAllOneToOneMappings()
   */
  private generateAllOneToOneMappings(): Array<Array<number[]>> {
    // Start with an empty mapping - all nodes are deleted or inserted.
    const mappings: Array<Array<number[]>> = [];
    const firstMapping: Array<number[]> = [];
    mappings.push(firstMapping);
    // Add all deleted nodes.
    for (let n1 = 0; n1 < this.size1; n1++) {
      firstMapping.push([n1, -1]);
    }
    // Add all inserted nodes.
    for (let n2 = 0; n2 < this.size2; n2++) {
      firstMapping.push([-1, n2]);
    }
    // For each node in the source tree.
    for (let n1 = 0; n1 < this.size1; n1++) {
      // Duplicate all mappings and store in mappings_copy.
      const mappings_copy = this.deepMappingsCopy(mappings);
      // For each node in the destination tree.
      for (let n2 = 0; n2 < this.size2; n2++) {
        // For each mapping (produced for all n1 values smaller than current n1).
        for (const m of mappings_copy) {
          // Produce new mappings with the pair (n1, n2) by adding this
          // pair to all mappings where it is valid to add.
          let element_add = true;
          // Verify if (n1, n2) can be added to mapping m.
          // All elements in m are checked with (n1, n2) for possible violation.
          // One-to-one condition.
          for (const e of m) {
            // n1 is not in any of previous mappings
            if (e[0] !== -1 && e[1] !== -1 && e[1] === n2) {
              element_add = false;
              break;
            }
          }
          // New mappings must be produced by duplicating a previous
          // mapping and extending it by (n1, n2).
          if (element_add) {
            const m_copy = this.deepMappingCopy(m);
            m_copy.push([n1, n2]);
            // If a pair (n1,n2) is added, (n1,-1) and (-1,n2) must be removed.
            this.removeMappingElement(m_copy, [n1, -1]);
            this.removeMappingElement(m_copy, [-1, n2]);
            mappings.push(m_copy);
          }
        }
      }
    }
    return mappings;
  }

  /**
   * Given all 1-1 mappings, discard these that violate TED conditions
   * (ancestor-descendant and sibling order).
   *
   * @param mappings set of all 1-1 mappings.
   * @java AllPossibleMappingsTED.removeNonTEDMappings(ArrayList)
   */
  private removeNonTEDMappings(mappings: Array<Array<number[]>>): void {
    // Validate each mapping separately.
    // Filter out non-TED mappings.
    let i = 0;
    while (i < mappings.length) {
      if (!this.isTEDMapping(mappings[i])) {
        mappings.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  /**
   * Test if a 1-1 mapping is a TED mapping.
   *
   * @param m a 1-1 mapping.
   * @return {@code true} if {@code m} is a TED mapping, and {@code false} otherwise.
   * @java AllPossibleMappingsTED.isTEDMapping(ArrayList)
   */
  public isTEDMapping(m: Array<number[]>): boolean {
    // Validate each pair of pairs of mapped nodes in the mapping.
    for (const e1 of m) {
      // Use only pairs of mapped nodes for validation.
      if (e1[0] === -1 || e1[1] === -1) {
        continue;
      }
      for (const e2 of m) {
        // Use only pairs of mapped nodes for validation.
        if (e2[0] === -1 || e2[1] === -1) {
          continue;
        }
        // If any of the conditions below doesn't hold, discard m.
        // Validate ancestor-descendant condition.
        let a = e1[0] < e2[0] && this.it1.preL_to_preR[e1[0]] < this.it1.preL_to_preR[e2[0]];
        let b = e1[1] < e2[1] && this.it2.preL_to_preR[e1[1]] < this.it2.preL_to_preR[e2[1]];
        if ((a && !b) || (!a && b)) {
          return false;
        }
        // Validate sibling-order condition.
        a = e1[0] < e2[0] && this.it1.preL_to_preR[e1[0]] > this.it1.preL_to_preR[e2[0]];
        b = e1[1] < e2[1] && this.it2.preL_to_preR[e1[1]] > this.it2.preL_to_preR[e2[1]];
        if ((a && !b) || (!a && b)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Given list of all TED mappings, calculate the cost of the minimal-cost
   * mapping.
   *
   * @param tedMappings set of all TED mappings.
   * @return the minimal cost among all TED mappings.
   * @java AllPossibleMappingsTED.getMinCost(ArrayList)
   */
  public getMinCost(tedMappings: Array<Array<number[]>>): number {
    // Initialize min_cost to the upper bound.
    let min_cost = this.size1 + this.size2;
    for (const m of tedMappings) {
      let m_cost = 0;
      // Sum up edit costs for all elements in the mapping m.
      for (const e of m) {
        // Add edit operation cost.
        if (e[0] > -1 && e[1] > -1) {
          m_cost += this.costModel.ren(this.it1.preL_to_node[e[0]], this.it2.preL_to_node[e[1]]); // USE COST MODEL - rename e[0] to e[1].
        } else if (e[0] > -1) {
          m_cost += this.costModel.del(this.it1.preL_to_node[e[0]]); // USE COST MODEL - insert e[1].
        } else {
          m_cost += this.costModel.ins(this.it2.preL_to_node[e[1]]); // USE COST MODEL - delete e[0].
        }
        // Break as soon as the current min_cost is exceeded.
        // Only for early loop break.
        if (m_cost >= min_cost) {
          break;
        }
      }
      // Store the minimal cost - compare m_cost and min_cost
      if (m_cost < min_cost) {
        min_cost = m_cost;
      }
    }
    return min_cost;
  }

  /**
   * Makes a deep copy of a mapping.
   *
   * @param mapping mapping to copy.
   * @return a mapping.
   * @java AllPossibleMappingsTED.deepMappingCopy(ArrayList)
   */
  private deepMappingCopy(mapping: Array<number[]>): Array<number[]> {
    const mapping_copy: Array<number[]> = [];
    for (const me of mapping) {
      mapping_copy.push([...me]);
    }
    return mapping_copy;
  }

  /**
   * Makes a deep copy of a set of mappings.
   *
   * @param mappings set of mappings to copy.
   * @return set of mappings.
   * @java AllPossibleMappingsTED.deepMappingsCopy(ArrayList)
   */
  private deepMappingsCopy(mappings: Array<Array<number[]>>): Array<Array<number[]>> {
    const mappings_copy: Array<Array<number[]>> = [];
    for (const m of mappings) {
      const m_copy: Array<number[]> = [];
      for (const me of m) {
        m_copy.push([...me]);
      }
      mappings_copy.push(m_copy);
    }
    return mappings_copy;
  }

  /**
   * Constructs a string representation of a set of mappings.
   *
   * @param mappings set of mappings to convert.
   * @return string representation of a set of mappings.
   * @java AllPossibleMappingsTED.mappingsToString(ArrayList)
   */
  private mappingsToString(mappings: Array<Array<number[]>>): string {
    let result = "Mappings:\n";
    for (const m of mappings) {
      result += "{";
      for (const me of m) {
        result += "[" + me[0] + "," + me[1] + "]";
      }
      result += "}\n";
    }
    return result;
  }

  /**
   * Removes an element (edit operation) from a mapping by its value. In our
   * case the element to remove can be always found in the mapping.
   *
   * @param m an edit mapping.
   * @param e element to remove from m.
   * @return {@code true} if e has been removed, and {@code false} otherwise.
   * @java AllPossibleMappingsTED.removeMappingElement(ArrayList, int[])
   */
  private removeMappingElement(m: Array<number[]>, e: number[]): boolean {
    for (let i = 0; i < m.length; i++) {
      const me = m[i];
      if (me[0] === e[0] && me[1] === e[1]) {
        m.splice(i, 1);
        return true;
      }
    }
    return false;
  }
}
