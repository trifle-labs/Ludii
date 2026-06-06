// @java Mining/src/gameDistance/utils/apted/distance/APTED.java
// @ts-nocheck

/* MIT License
 * Copyright (c) 2017 Mateusz Pawlik
 */

import type { CostModel, NodeLike } from "../costmodel/CostModel.js";

// Not-yet-ported dependency escape-hatch: NodeIndexer (batch 45)
// We define the minimal interface needed to use NodeIndexer from APTED.
type NodeIndexerLike<D> = {
  preL_to_node: Array<NodeLike<D>>;
  sizes: number[];
  parents: number[];
  children: number[][];
  postL_to_lld: number[];
  postR_to_rld: number[];
  preL_to_ln: number[];
  preR_to_ln: number[];
  nodeType_L: boolean[];
  nodeType_R: boolean[];
  preL_to_preR: number[];
  preR_to_preL: number[];
  preL_to_postL: number[];
  postL_to_preL: number[];
  preL_to_postR: number[];
  postR_to_preL: number[];
  preL_to_kr_sum: number[];
  preL_to_rev_kr_sum: number[];
  preL_to_desc_sum: number[];
  preL_to_sumDelCost: number[];
  preL_to_sumInsCost: number[];
  lchl: number;
  rchl: number;
  getSize(): number;
  getCurrentNode(): number;
  setCurrentNode(node: number): void;
  isLeaf(nodePreL: number): boolean;
  preL_to_lld(preL: number): number;
  preL_to_rld(preL: number): number;
  postL_to_node(postL: number): NodeLike<D>;
  postR_to_node(postR: number): NodeLike<D>;
};

// NodeIndexer constructor escape hatch
function createNodeIndexer<D>(node: NodeLike<D>, costModel: CostModel<D>): NodeIndexerLike<D> {
  // NodeIndexer is in batch 45, not yet ported.
  // This will be replaced once batch 45 is available.
  throw new Error("NodeIndexer not yet ported (batch 45). Cannot construct APTED.");
}

/**
 * Implements APTED algorithm [1,2].
 *
 * <ul>
 * <li>Optimal strategy with all paths.
 * <li>Single-node single path function supports currently only unit cost.
 * <li>Two-node single path function not included.
 * <li>Delta^L and Delta^R based on Zhang and Shasha's algorithm for executing
 *     left and right paths (as in [3]).
 * <li>For any other path Delta^A from [1] is used.
 * </ul>
 *
 * @param C type of cost model.
 * @param D type of node data.
 * @java gameDistance.utils.apted.distance.APTED
 */
export class APTED<C extends CostModel<D>, D> {

  /**
   * Identifier of left path type = 0.
   * @java APTED.LEFT
   */
  private static readonly LEFT: number = 0;

  /**
   * Identifier of right path type = 1.
   * @java APTED.RIGHT
   */
  private static readonly RIGHT: number = 1;

  /**
   * Identifier of inner path type = 2.
   * @java APTED.INNER
   */
  private static readonly INNER: number = 2;

  /**
   * Indexer of the source tree.
   * @java APTED.it1
   */
  private it1: NodeIndexerLike<D> = null as unknown as NodeIndexerLike<D>;

  /**
   * Indexer of the destination tree.
   * @java APTED.it2
   */
  private it2: NodeIndexerLike<D> = null as unknown as NodeIndexerLike<D>;

  /**
   * The size of the source input tree.
   * @java APTED.size1
   */
  private size1: number = 0;

  /**
   * The size of the destination tree.
   * @java APTED.size2
   */
  private size2: number = 0;

  /**
   * The distance matrix. Used to store intermediate distances between pairs of subtrees.
   * @java APTED.delta
   */
  private delta: number[][] = [];

  /**
   * One of distance arrays to store intermediate distances in spfA.
   * @java APTED.q
   */
  private q: number[] = [];

  /**
   * Array used in the algorithm before [1].
   * @java APTED.fn
   */
  private fn: number[] = [];

  /**
   * Array used in the algorithm before [1].
   * @java APTED.ft
   */
  private ft: number[] = [];

  /**
   * Stores the number of subproblems encountered while computing the distance.
   * @java APTED.counter
   */
  private counter: number = 0;

  /**
   * Cost model to be used for calculating costs of edit operations.
   * @java APTED.costModel
   */
  private readonly costModel: C;

  /**
   * Constructs the APTED algorithm object with the specified cost model.
   *
   * @param costModel cost model for edit operations.
   * @java APTED(C)
   */
  public constructor(costModel: C) {
    this.costModel = costModel;
  }

  /**
   * Compute tree edit distance between source and destination trees using APTED algorithm.
   *
   * @param t1 source tree.
   * @param t2 destination tree.
   * @return tree edit distance.
   * @java APTED.computeEditDistance(Node, Node)
   */
  public computeEditDistance(t1: NodeLike<D>, t2: NodeLike<D>): number {
    // Index the nodes of both input trees.
    this.init(t1, t2);
    // Determine the optimal strategy for the distance computation.
    // Use the heuristic from [2, Section 5.3].
    if (this.it1.lchl < this.it1.rchl) {
      this.delta = this.computeOptStrategy_postL(this.it1, this.it2);
    } else {
      this.delta = this.computeOptStrategy_postR(this.it1, this.it2);
    }
    // Initialise structures for distance computation.
    this.tedInit();
    // Compute the distance.
    return this.gted(this.it1, this.it2);
  }

  /**
   * This method is only for testing purpose. It computes TED with a fixed
   * path type in the strategy to trigger execution of a specific single-path function.
   *
   * @param t1 source tree.
   * @param t2 destination tree.
   * @param spfType single-path function to trigger (LEFT or RIGHT).
   * @return tree edit distance.
   * @java APTED.computeEditDistance_spfTest(Node, Node, int)
   */
  public computeEditDistance_spfTest(t1: NodeLike<D>, t2: NodeLike<D>, spfType: number): number {
    // Index the nodes of both input trees.
    this.init(t1, t2);
    // Initialise delta array.
    this.delta = [];
    for (let i = 0; i < this.size1; i++) {
      this.delta.push(new Array(this.size2).fill(0));
    }
    // Fix a path type to trigger specific spf.
    for (let i = 0; i < this.delta.length; i++) {
      for (let j = 0; j < this.delta[i].length; j++) {
        // Fix path type.
        if (spfType === APTED.LEFT) {
          this.delta[i][j] = this.it1.preL_to_lld(i) + 1;
        } else if (spfType === APTED.RIGHT) {
          this.delta[i][j] = this.it1.preL_to_rld(i) + 1;
        }
      }
    }
    // Initialise structures for distance computation.
    this.tedInit();
    // Compute the distance.
    return this.gted(this.it1, this.it2);
  }

  /**
   * Initialises node indexers and stores input tree sizes.
   *
   * @param t1 source input tree.
   * @param t2 destination input tree.
   * @java APTED.init(Node, Node)
   */
  public init(t1: NodeLike<D>, t2: NodeLike<D>): void {
    this.it1 = createNodeIndexer(t1, this.costModel);
    this.it2 = createNodeIndexer(t2, this.costModel);
    this.size1 = this.it1.getSize();
    this.size2 = this.it2.getSize();
  }

  /**
   * After the optimal strategy is computed, initialises distances of deleting
   * and inserting subtrees without their root nodes.
   * @java APTED.tedInit()
   */
  private tedInit(): void {
    // Reset the subproblems counter.
    this.counter = 0;
    // Initialize arrays.
    const maxSize = Math.max(this.size1, this.size2) + 1;
    this.q = new Array(maxSize).fill(0);
    this.fn = new Array(maxSize + 1).fill(0);
    this.ft = new Array(maxSize + 1).fill(0);
    // Compute subtree distances without the root nodes when one of subtrees is a single node.
    let sizeX = -1;
    let sizeY = -1;
    let parentX = -1;
    let parentY = -1;
    // Loop over the nodes in reversed left-to-right preorder.
    for (let x = 0; x < this.size1; x++) {
      sizeX = this.it1.sizes[x];
      parentX = this.it1.parents[x];
      for (let y = 0; y < this.size2; y++) {
        sizeY = this.it2.sizes[y];
        parentY = this.it2.parents[y];
        // Set values in delta based on the sums of deletion and insertion costs.
        // Subtract the costs for root nodes.
        if (sizeX === 1 && sizeY === 1) {
          this.delta[x][y] = 0.0;
        } else if (sizeX === 1) {
          this.delta[x][y] = this.it2.preL_to_sumInsCost[y] - this.costModel.ins(this.it2.preL_to_node[y]); // USE COST MODEL.
        } else if (sizeY === 1) {
          this.delta[x][y] = this.it1.preL_to_sumDelCost[x] - this.costModel.del(this.it1.preL_to_node[x]); // USE COST MODEL.
        }
      }
    }
  }

  /**
   * Compute the optimal strategy using left-to-right postorder traversal of the nodes.
   *
   * @param it1 node indexer of the source input tree.
   * @param it2 node indexer of the destination input tree.
   * @return array with the optimal strategy.
   * @java APTED.computeOptStrategy_postL(NodeIndexer, NodeIndexer)
   */
  public computeOptStrategy_postL(it1: NodeIndexerLike<D>, it2: NodeIndexerLike<D>): number[][] {
    const size1 = it1.getSize();
    const size2 = it2.getSize();
    const strategy: number[][] = [];
    for (let i = 0; i < size1; i++) strategy.push(new Array(size2).fill(0));
    const cost1_L: (number[] | null)[] = new Array(size1).fill(null);
    const cost1_R: (number[] | null)[] = new Array(size1).fill(null);
    const cost1_I: (number[] | null)[] = new Array(size1).fill(null);
    const cost2_L: number[] = new Array(size2).fill(0);
    const cost2_R: number[] = new Array(size2).fill(0);
    const cost2_I: number[] = new Array(size2).fill(0);
    const cost2_path: number[] = new Array(size2).fill(0);
    const leafRow: number[] = new Array(size2).fill(0);
    const pathIDOffset = size1;
    let minCost = 0x7fffffffffffffff;
    let strategyPath = -1;

    const pre2size1 = it1.sizes;
    const pre2size2 = it2.sizes;
    const pre2descSum1 = it1.preL_to_desc_sum;
    const pre2descSum2 = it2.preL_to_desc_sum;
    const pre2krSum1 = it1.preL_to_kr_sum;
    const pre2krSum2 = it2.preL_to_kr_sum;
    const pre2revkrSum1 = it1.preL_to_rev_kr_sum;
    const pre2revkrSum2 = it2.preL_to_rev_kr_sum;
    const preL_to_preR_1 = it1.preL_to_preR;
    const preL_to_preR_2 = it2.preL_to_preR;
    const preR_to_preL_1 = it1.preR_to_preL;
    const preR_to_preL_2 = it2.preR_to_preL;
    const pre2parent1 = it1.parents;
    const pre2parent2 = it2.parents;
    const nodeType_L_1 = it1.nodeType_L;
    const nodeType_L_2 = it2.nodeType_L;
    const nodeType_R_1 = it1.nodeType_R;
    const nodeType_R_2 = it2.nodeType_R;

    const preL_to_postL_1 = it1.preL_to_postL;
    const preL_to_postL_2 = it2.preL_to_postL;
    const postL_to_preL_1 = it1.postL_to_preL;
    const postL_to_preL_2 = it2.postL_to_preL;

    const rowsToReuse_L: number[][] = [];
    const rowsToReuse_R: number[][] = [];
    const rowsToReuse_I: number[][] = [];

    for (let v = 0; v < size1; v++) {
      const v_in_preL = postL_to_preL_1[v];

      const is_v_leaf = it1.isLeaf(v_in_preL);
      const parent_v_preL = pre2parent1[v_in_preL];

      let parent_v_postL = -1;
      if (parent_v_preL !== -1) {
        parent_v_postL = preL_to_postL_1[parent_v_preL];
      }

      const strategypointer_v = strategy[v_in_preL];

      const size_v = pre2size1[v_in_preL];
      const leftPath_v = -(preR_to_preL_1[preL_to_preR_1[v_in_preL] + size_v - 1] + 1);
      const rightPath_v = v_in_preL + size_v - 1 + 1;
      const krSum_v = pre2krSum1[v_in_preL];
      const revkrSum_v = pre2revkrSum1[v_in_preL];
      const descSum_v = pre2descSum1[v_in_preL];

      if (is_v_leaf) {
        cost1_L[v] = leafRow;
        cost1_R[v] = leafRow;
        cost1_I[v] = leafRow;
        for (let i = 0; i < size2; i++) {
          strategypointer_v[postL_to_preL_2[i]] = v_in_preL;
        }
      }

      const cost_Lpointer_v = cost1_L[v]!;
      const cost_Rpointer_v = cost1_R[v]!;
      const cost_Ipointer_v = cost1_I[v]!;

      if (parent_v_preL !== -1 && cost1_L[parent_v_postL] == null) {
        if (rowsToReuse_L.length === 0) {
          cost1_L[parent_v_postL] = new Array(size2).fill(0);
          cost1_R[parent_v_postL] = new Array(size2).fill(0);
          cost1_I[parent_v_postL] = new Array(size2).fill(0);
        } else {
          cost1_L[parent_v_postL] = rowsToReuse_L.pop()!;
          cost1_R[parent_v_postL] = rowsToReuse_R.pop()!;
          cost1_I[parent_v_postL] = rowsToReuse_I.pop()!;
        }
      }

      let cost_Lpointer_parent_v: number[] | null = null;
      let cost_Rpointer_parent_v: number[] | null = null;
      let cost_Ipointer_parent_v: number[] | null = null;
      let strategypointer_parent_v: number[] | null = null;
      if (parent_v_preL !== -1) {
        cost_Lpointer_parent_v = cost1_L[parent_v_postL];
        cost_Rpointer_parent_v = cost1_R[parent_v_postL];
        cost_Ipointer_parent_v = cost1_I[parent_v_postL];
        strategypointer_parent_v = strategy[parent_v_preL];
      }

      cost2_L.fill(0);
      cost2_R.fill(0);
      cost2_I.fill(0);
      cost2_path.fill(0);

      for (let w = 0; w < size2; w++) {
        const w_in_preL = postL_to_preL_2[w];

        const parent_w_preL = pre2parent2[w_in_preL];
        let parent_w_postL = -1;
        if (parent_w_preL !== -1) {
          parent_w_postL = preL_to_postL_2[parent_w_preL];
        }

        const size_w = pre2size2[w_in_preL];
        if (it2.isLeaf(w_in_preL)) {
          cost2_L[w] = 0;
          cost2_R[w] = 0;
          cost2_I[w] = 0;
          cost2_path[w] = w_in_preL;
        }
        minCost = 0x7fffffffffffffff;
        strategyPath = -1;
        let tmpCost = 0x7fffffffffffffff;

        if (size_v <= 1 || size_w <= 1) { // USE NEW SINGLE_PATH FUNCTIONS FOR SMALL SUBTREES
          minCost = Math.max(size_v, size_w);
        } else {
          tmpCost = size_v * pre2krSum2[w_in_preL] + cost_Lpointer_v[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = leftPath_v;
          }
          tmpCost = size_v * pre2revkrSum2[w_in_preL] + cost_Rpointer_v[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = rightPath_v;
          }
          tmpCost = size_v * pre2descSum2[w_in_preL] + cost_Ipointer_v[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = strategypointer_v[w_in_preL] + 1;
          }
          tmpCost = size_w * krSum_v + cost2_L[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = -(preR_to_preL_2[preL_to_preR_2[w_in_preL] + size_w - 1] + pathIDOffset + 1);
          }
          tmpCost = size_w * revkrSum_v + cost2_R[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = w_in_preL + size_w - 1 + pathIDOffset + 1;
          }
          tmpCost = size_w * descSum_v + cost2_I[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = cost2_path[w] + pathIDOffset + 1;
          }
        }

        if (parent_v_preL !== -1) {
          cost_Rpointer_parent_v![w] += minCost;
          tmpCost = -minCost + cost1_I[v]![w];
          if (tmpCost < cost1_I[parent_v_postL]![w]) {
            cost_Ipointer_parent_v![w] = tmpCost;
            strategypointer_parent_v![w_in_preL] = strategypointer_v[w_in_preL];
          }
          if (nodeType_R_1[v_in_preL]) {
            cost_Ipointer_parent_v![w] += cost_Rpointer_parent_v![w];
            cost_Rpointer_parent_v![w] += cost_Rpointer_v[w] - minCost;
          }
          if (nodeType_L_1[v_in_preL]) {
            cost_Lpointer_parent_v![w] += cost_Lpointer_v[w];
          } else {
            cost_Lpointer_parent_v![w] += minCost;
          }
        }
        if (parent_w_preL !== -1) {
          cost2_R[parent_w_postL] += minCost;
          tmpCost = -minCost + cost2_I[w];
          if (tmpCost < cost2_I[parent_w_postL]) {
            cost2_I[parent_w_postL] = tmpCost;
            cost2_path[parent_w_postL] = cost2_path[w];
          }
          if (nodeType_R_2[w_in_preL]) {
            cost2_I[parent_w_postL] += cost2_R[parent_w_postL];
            cost2_R[parent_w_postL] += cost2_R[w] - minCost;
          }
          if (nodeType_L_2[w_in_preL]) {
            cost2_L[parent_w_postL] += cost2_L[w];
          } else {
            cost2_L[parent_w_postL] += minCost;
          }
        }
        strategypointer_v[w_in_preL] = strategyPath;
      }

      if (!it1.isLeaf(v_in_preL)) {
        cost1_L[v]!.fill(0);
        cost1_R[v]!.fill(0);
        cost1_I[v]!.fill(0);
        rowsToReuse_L.push(cost1_L[v]!);
        rowsToReuse_R.push(cost1_R[v]!);
        rowsToReuse_I.push(cost1_I[v]!);
      }
    }
    return strategy;
  }

  /**
   * Compute the optimal strategy using right-to-left postorder traversal of the nodes.
   *
   * @param it1 node indexer of the source input tree.
   * @param it2 node indexer of the destination input tree.
   * @return array with the optimal strategy.
   * @java APTED.computeOptStrategy_postR(NodeIndexer, NodeIndexer)
   */
  public computeOptStrategy_postR(it1: NodeIndexerLike<D>, it2: NodeIndexerLike<D>): number[][] {
    const size1 = it1.getSize();
    const size2 = it2.getSize();
    const strategy: number[][] = [];
    for (let i = 0; i < size1; i++) strategy.push(new Array(size2).fill(0));
    const cost1_L: (number[] | null)[] = new Array(size1).fill(null);
    const cost1_R: (number[] | null)[] = new Array(size1).fill(null);
    const cost1_I: (number[] | null)[] = new Array(size1).fill(null);
    const cost2_L: number[] = new Array(size2).fill(0);
    const cost2_R: number[] = new Array(size2).fill(0);
    const cost2_I: number[] = new Array(size2).fill(0);
    const cost2_path: number[] = new Array(size2).fill(0);
    const leafRow: number[] = new Array(size2).fill(0);
    const pathIDOffset = size1;
    let minCost = 0x7fffffffffffffff;
    let strategyPath = -1;

    const pre2size1 = it1.sizes;
    const pre2size2 = it2.sizes;
    const pre2descSum1 = it1.preL_to_desc_sum;
    const pre2descSum2 = it2.preL_to_desc_sum;
    const pre2krSum1 = it1.preL_to_kr_sum;
    const pre2krSum2 = it2.preL_to_kr_sum;
    const pre2revkrSum1 = it1.preL_to_rev_kr_sum;
    const pre2revkrSum2 = it2.preL_to_rev_kr_sum;
    const preL_to_preR_1 = it1.preL_to_preR;
    const preL_to_preR_2 = it2.preL_to_preR;
    const preR_to_preL_1 = it1.preR_to_preL;
    const preR_to_preL_2 = it2.preR_to_preL;
    const pre2parent1 = it1.parents;
    const pre2parent2 = it2.parents;
    const nodeType_L_1 = it1.nodeType_L;
    const nodeType_L_2 = it2.nodeType_L;
    const nodeType_R_1 = it1.nodeType_R;
    const nodeType_R_2 = it2.nodeType_R;

    const rowsToReuse_L: number[][] = [];
    const rowsToReuse_R: number[][] = [];
    const rowsToReuse_I: number[][] = [];

    for (let v = size1 - 1; v >= 0; v--) {
      const is_v_leaf = it1.isLeaf(v);
      const parent_v = pre2parent1[v];

      const strategypointer_v = strategy[v];

      const size_v = pre2size1[v];
      const leftPath_v = -(preR_to_preL_1[preL_to_preR_1[v] + pre2size1[v] - 1] + 1);
      const rightPath_v = v + pre2size1[v] - 1 + 1;
      const krSum_v = pre2krSum1[v];
      const revkrSum_v = pre2revkrSum1[v];
      const descSum_v = pre2descSum1[v];

      if (is_v_leaf) {
        cost1_L[v] = leafRow;
        cost1_R[v] = leafRow;
        cost1_I[v] = leafRow;
        for (let i = 0; i < size2; i++) {
          strategypointer_v[i] = v;
        }
      }

      const cost_Lpointer_v = cost1_L[v]!;
      const cost_Rpointer_v = cost1_R[v]!;
      const cost_Ipointer_v = cost1_I[v]!;

      if (parent_v !== -1 && cost1_L[parent_v] == null) {
        if (rowsToReuse_L.length === 0) {
          cost1_L[parent_v] = new Array(size2).fill(0);
          cost1_R[parent_v] = new Array(size2).fill(0);
          cost1_I[parent_v] = new Array(size2).fill(0);
        } else {
          cost1_L[parent_v] = rowsToReuse_L.pop()!;
          cost1_R[parent_v] = rowsToReuse_R.pop()!;
          cost1_I[parent_v] = rowsToReuse_I.pop()!;
        }
      }

      let cost_Lpointer_parent_v: number[] | null = null;
      let cost_Rpointer_parent_v: number[] | null = null;
      let cost_Ipointer_parent_v: number[] | null = null;
      let strategypointer_parent_v: number[] | null = null;
      if (parent_v !== -1) {
        cost_Lpointer_parent_v = cost1_L[parent_v];
        cost_Rpointer_parent_v = cost1_R[parent_v];
        cost_Ipointer_parent_v = cost1_I[parent_v];
        strategypointer_parent_v = strategy[parent_v];
      }

      cost2_L.fill(0);
      cost2_R.fill(0);
      cost2_I.fill(0);
      cost2_path.fill(0);
      for (let w = size2 - 1; w >= 0; w--) {
        const size_w = pre2size2[w];
        if (it2.isLeaf(w)) {
          cost2_L[w] = 0;
          cost2_R[w] = 0;
          cost2_I[w] = 0;
          cost2_path[w] = w;
        }
        minCost = 0x7fffffffffffffff;
        strategyPath = -1;
        let tmpCost = 0x7fffffffffffffff;

        if (size_v <= 1 || size_w <= 1) { // USE NEW SINGLE_PATH FUNCTIONS FOR SMALL SUBTREES
          minCost = Math.max(size_v, size_w);
        } else {
          tmpCost = size_v * pre2krSum2[w] + cost_Lpointer_v[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = leftPath_v;
          }
          tmpCost = size_v * pre2revkrSum2[w] + cost_Rpointer_v[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = rightPath_v;
          }
          tmpCost = size_v * pre2descSum2[w] + cost_Ipointer_v[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = strategypointer_v[w] + 1;
          }
          tmpCost = size_w * krSum_v + cost2_L[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = -(preR_to_preL_2[preL_to_preR_2[w] + size_w - 1] + pathIDOffset + 1);
          }
          tmpCost = size_w * revkrSum_v + cost2_R[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = w + size_w - 1 + pathIDOffset + 1;
          }
          tmpCost = size_w * descSum_v + cost2_I[w];
          if (tmpCost < minCost) {
            minCost = tmpCost;
            strategyPath = cost2_path[w] + pathIDOffset + 1;
          }
        }

        if (parent_v !== -1) {
          cost_Lpointer_parent_v![w] += minCost;
          tmpCost = -minCost + cost1_I[v]![w];
          if (tmpCost < cost1_I[parent_v]![w]) {
            cost_Ipointer_parent_v![w] = tmpCost;
            strategypointer_parent_v![w] = strategypointer_v[w];
          }
          if (nodeType_L_1[v]) {
            cost_Ipointer_parent_v![w] += cost_Lpointer_parent_v![w];
            cost_Lpointer_parent_v![w] += cost_Lpointer_v[w] - minCost;
          }
          if (nodeType_R_1[v]) {
            cost_Rpointer_parent_v![w] += cost_Rpointer_v[w];
          } else {
            cost_Rpointer_parent_v![w] += minCost;
          }
        }
        const parent_w = pre2parent2[w];
        if (parent_w !== -1) {
          cost2_L[parent_w] += minCost;
          tmpCost = -minCost + cost2_I[w];
          if (tmpCost < cost2_I[parent_w]) {
            cost2_I[parent_w] = tmpCost;
            cost2_path[parent_w] = cost2_path[w];
          }
          if (nodeType_L_2[w]) {
            cost2_I[parent_w] += cost2_L[parent_w];
            cost2_L[parent_w] += cost2_L[w] - minCost;
          }
          if (nodeType_R_2[w]) {
            cost2_R[parent_w] += cost2_R[w];
          } else {
            cost2_R[parent_w] += minCost;
          }
        }
        strategypointer_v[w] = strategyPath;
      }

      if (!it1.isLeaf(v)) {
        cost1_L[v]!.fill(0);
        cost1_R[v]!.fill(0);
        cost1_I[v]!.fill(0);
        rowsToReuse_L.push(cost1_L[v]!);
        rowsToReuse_R.push(cost1_R[v]!);
        rowsToReuse_I.push(cost1_I[v]!);
      }
    }
    return strategy;
  }

  /**
   * Implements spf1 single path function for the case when one of the subtrees is a single node.
   *
   * @param ni1 node indexer for the source input subtree.
   * @param ni2 node indexer for the destination input subtree.
   * @param subtreeRootNode1 root node of a subtree in the source input tree.
   * @param subtreeRootNode2 root node of a subtree in the destination input tree.
   * @return the tree edit distance between two subtrees.
   * @java APTED.spf1(NodeIndexer, int, NodeIndexer, int)
   */
  private spf1(ni1: NodeIndexerLike<D>, subtreeRootNode1: number, ni2: NodeIndexerLike<D>, subtreeRootNode2: number): number {
    const subtreeSize1 = ni1.sizes[subtreeRootNode1];
    const subtreeSize2 = ni2.sizes[subtreeRootNode2];
    if (subtreeSize1 === 1 && subtreeSize2 === 1) {
      const n1 = ni1.preL_to_node[subtreeRootNode1];
      const n2 = ni2.preL_to_node[subtreeRootNode2];
      const maxCost = this.costModel.del(n1) + this.costModel.ins(n2);
      const renCost = this.costModel.ren(n1, n2);
      return renCost < maxCost ? renCost : maxCost;
    }
    if (subtreeSize1 === 1) {
      const n1 = ni1.preL_to_node[subtreeRootNode1];
      let n2: NodeLike<D>;
      let cost = ni2.preL_to_sumInsCost[subtreeRootNode2];
      const maxCost = cost + this.costModel.del(n1);
      let minRenMinusIns = cost;
      let nodeRenMinusIns = 0;
      for (let i = subtreeRootNode2; i < subtreeRootNode2 + subtreeSize2; i++) {
        n2 = ni2.preL_to_node[i];
        nodeRenMinusIns = this.costModel.ren(n1, n2) - this.costModel.ins(n2);
        if (nodeRenMinusIns < minRenMinusIns) {
          minRenMinusIns = nodeRenMinusIns;
        }
      }
      cost += minRenMinusIns;
      return cost < maxCost ? cost : maxCost;
    }
    if (subtreeSize2 === 1) {
      let n1: NodeLike<D>;
      const n2 = ni2.preL_to_node[subtreeRootNode2];
      let cost = ni1.preL_to_sumDelCost[subtreeRootNode1];
      const maxCost = cost + this.costModel.ins(n2);
      let minRenMinusDel = cost;
      let nodeRenMinusDel = 0;
      for (let i = subtreeRootNode1; i < subtreeRootNode1 + subtreeSize1; i++) {
        n1 = ni1.preL_to_node[i];
        nodeRenMinusDel = this.costModel.ren(n1, n2) - this.costModel.del(n1);
        if (nodeRenMinusDel < minRenMinusDel) {
          minRenMinusDel = nodeRenMinusDel;
        }
      }
      cost += minRenMinusDel;
      return cost < maxCost ? cost : maxCost;
    }
    return -1;
  }

  /**
   * Implements GTED algorithm.
   *
   * @param it1 node indexer for the source input tree.
   * @param it2 node indexer for the destination input tree.
   * @return the tree edit distance between the source and destination trees.
   * @java APTED.gted(NodeIndexer, NodeIndexer)
   */
  private gted(it1: NodeIndexerLike<D>, it2: NodeIndexerLike<D>): number {
    const currentSubtree1 = it1.getCurrentNode();
    const currentSubtree2 = it2.getCurrentNode();
    const subtreeSize1 = it1.sizes[currentSubtree1];
    const subtreeSize2 = it2.sizes[currentSubtree2];

    // Use spf1.
    if (subtreeSize1 === 1 || subtreeSize2 === 1) {
      return this.spf1(it1, currentSubtree1, it2, currentSubtree2);
    }

    const strategyPathID = this.delta[currentSubtree1][currentSubtree2];

    let strategyPathType = -1;
    let currentPathNode = Math.abs(strategyPathID) - 1;
    const pathIDOffset = it1.getSize();

    let parent = -1;
    if (currentPathNode < pathIDOffset) {
      strategyPathType = this.getStrategyPathType(strategyPathID, pathIDOffset, it1, currentSubtree1, subtreeSize1);
      while ((parent = it1.parents[currentPathNode]) >= currentSubtree1) {
        const children = it1.children[parent];
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          if (child !== currentPathNode) {
            it1.setCurrentNode(child);
            this.gted(it1, it2);
          }
        }
        currentPathNode = parent;
      }
      it1.setCurrentNode(currentSubtree1);

      if (strategyPathType === 0) {
        return this.spfL(it1, it2, false);
      }
      if (strategyPathType === 1) {
        return this.spfR(it1, it2, false);
      }
      return this.spfA(it1, it2, Math.abs(strategyPathID) - 1, strategyPathType, false);
    }

    currentPathNode -= pathIDOffset;
    strategyPathType = this.getStrategyPathType(strategyPathID, pathIDOffset, it2, currentSubtree2, subtreeSize2);
    while ((parent = it2.parents[currentPathNode]) >= currentSubtree2) {
      const children2 = it2.children[parent];
      for (let j = 0; j < children2.length; j++) {
        const child = children2[j];
        if (child !== currentPathNode) {
          it2.setCurrentNode(child);
          this.gted(it1, it2);
        }
      }
      currentPathNode = parent;
    }
    it2.setCurrentNode(currentSubtree2);

    if (strategyPathType === 0) {
      return this.spfL(it2, it1, true);
    }
    if (strategyPathType === 1) {
      return this.spfR(it2, it1, true);
    }
    return this.spfA(it2, it1, Math.abs(strategyPathID) - pathIDOffset - 1, strategyPathType, true);
  }

  /**
   * Implements the single-path function spfA for inner paths.
   *
   * @param it1 node indexer of the left-hand input subtree.
   * @param it2 node indexer of the right-hand input subtree.
   * @param pathID the left-to-right preorder id of the strategy path's leaf node.
   * @param pathType type of the strategy path (LEFT, RIGHT, INNER).
   * @param treesSwapped says if the order of input subtrees has been swapped.
   * @return tree edit distance between left-hand and right-hand input subtrees.
   * @java APTED.spfA(NodeIndexer, NodeIndexer, int, byte, boolean)
   */
  private spfA(it1: NodeIndexerLike<D>, it2: NodeIndexerLike<D>, pathID: number, pathType: number, treesSwapped: boolean): number {
    const it2nodes = it2.preL_to_node;
    const it1sizes = it1.sizes;
    const it2sizes = it2.sizes;
    const it1parents = it1.parents;
    const it2parents = it2.parents;
    const it1preL_to_preR = it1.preL_to_preR;
    const it2preL_to_preR = it2.preL_to_preR;
    const it1preR_to_preL = it1.preR_to_preL;
    const it2preR_to_preL = it2.preR_to_preL;
    const currentSubtreePreL1 = it1.getCurrentNode();
    const currentSubtreePreL2 = it2.getCurrentNode();

    let currentForestSize1 = 0;
    let currentForestSize2 = 0;
    let tmpForestSize1 = 0;
    let currentForestCost1 = 0;
    let currentForestCost2 = 0;
    let tmpForestCost1 = 0;

    const subtreeSize2 = it2.sizes[currentSubtreePreL2];
    const subtreeSize1 = it1.sizes[currentSubtreePreL1];
    const t: number[][] = [];
    for (let i = 0; i <= subtreeSize2; i++) t.push(new Array(subtreeSize2 + 1).fill(0));
    const s: number[][] = [];
    for (let i = 0; i <= subtreeSize1; i++) s.push(new Array(subtreeSize2 + 1).fill(0));
    let minCost = -1;
    let sp1 = 0;
    let sp2 = 0;
    let sp3 = 0;
    let startPathNode = -1;
    let endPathNode = pathID;
    let it1PreLoff = endPathNode;
    const it2PreLoff = currentSubtreePreL2;
    let it1PreRoff = it1preL_to_preR[endPathNode];
    const it2PreRoff = it2preL_to_preR[it2PreLoff];

    let rFlast: number, lFlast: number, endPathNode_in_preR: number, startPathNode_in_preR: number,
      parent_of_endPathNode: number, parent_of_endPathNode_in_preR: number,
      lFfirst: number, rFfirst: number, rGlast: number, rGfirst: number, lGfirst: number, rG_in_preL: number,
      rGminus1_in_preL: number, parent_of_rG_in_preL: number, lGlast: number, lF_in_preR: number, lFSubtreeSize: number,
      lGminus1_in_preR: number, parent_of_lG: number, parent_of_lG_in_preR: number, rF_in_preL: number, rFSubtreeSize: number,
      rGfirst_in_preL: number;
    let leftPart: boolean, rightPart: boolean, fForestIsTree: boolean,
      lFIsConsecutiveNodeOfCurrentPathNode: boolean, lFIsLeftSiblingOfCurrentPathNode: boolean,
      rFIsConsecutiveNodeOfCurrentPathNode: boolean, rFIsRightSiblingOfCurrentPathNode: boolean;
    let sp1spointer: number[], sp2spointer: number[], sp3spointer: number[], sp3deltapointer: number[] | null,
      swritepointer: number[], sp1tpointer: number[], sp3tpointer: number[];
    let sp1source: number, sp3source: number;

    // Loop A - walk up the path.
    while (endPathNode >= currentSubtreePreL1) {
      it1PreLoff = endPathNode;
      it1PreRoff = it1preL_to_preR[endPathNode];
      rFlast = -1;
      lFlast = -1;
      endPathNode_in_preR = it1preL_to_preR[endPathNode];
      startPathNode_in_preR = startPathNode === -1 ? 0x7fffffff : it1preL_to_preR[startPathNode];
      parent_of_endPathNode = it1parents[endPathNode];
      parent_of_endPathNode_in_preR = parent_of_endPathNode === -1 ? 0x7fffffff : it1preL_to_preR[parent_of_endPathNode];
      if (startPathNode - endPathNode > 1) {
        leftPart = true;
      } else {
        leftPart = false;
      }
      if (startPathNode >= 0 && startPathNode_in_preR - endPathNode_in_preR > 1) {
        rightPart = true;
      } else {
        rightPart = false;
      }

      // Deal with nodes to the left of the path.
      if (pathType === 1 || (pathType === 2 && leftPart)) {
        if (startPathNode === -1) {
          rFfirst = endPathNode_in_preR;
          lFfirst = endPathNode;
        } else {
          rFfirst = startPathNode_in_preR;
          lFfirst = startPathNode - 1;
        }
        if (!rightPart) {
          rFlast = endPathNode_in_preR;
        }
        rGlast = it2preL_to_preR[currentSubtreePreL2];
        rGfirst = (rGlast + subtreeSize2) - 1;
        lFlast = rightPart ? endPathNode + 1 : endPathNode;
        this.fn[this.fn.length - 1] = -1;
        for (let i = currentSubtreePreL2; i < currentSubtreePreL2 + subtreeSize2; i++) {
          this.fn[i] = -1;
          this.ft[i] = -1;
        }
        tmpForestSize1 = currentForestSize1;
        tmpForestCost1 = currentForestCost1;

        // Loop B - for all nodes in G.
        for (let rG = rGfirst; rG >= rGlast; rG--) {
          lGfirst = it2preR_to_preL[rG];
          rG_in_preL = it2preR_to_preL[rG];
          rGminus1_in_preL = rG <= it2preL_to_preR[currentSubtreePreL2] ? 0x7fffffff : it2preR_to_preL[rG - 1];
          parent_of_rG_in_preL = it2parents[rG_in_preL];
          if (pathType === 1) {
            if (lGfirst === currentSubtreePreL2 || rGminus1_in_preL !== parent_of_rG_in_preL) {
              lGlast = lGfirst;
            } else {
              lGlast = it2parents[lGfirst] + 1;
            }
          } else {
            lGlast = lGfirst === currentSubtreePreL2 ? lGfirst : currentSubtreePreL2 + 1;
          }
          this.updateFnArray(it2.preL_to_ln[lGfirst], lGfirst, currentSubtreePreL2);
          this.updateFtArray(it2.preL_to_ln[lGfirst], lGfirst);
          let rF = rFfirst;
          currentForestSize1 = tmpForestSize1;
          currentForestCost1 = tmpForestCost1;

          // Loop C - for all nodes to the left of the path node.
          for (let lF = lFfirst; lF >= lFlast; lF--) {
            if (lF === lFlast && !rightPart) {
              rF = rFlast;
            }
            const lFNode = it1.preL_to_node[lF];
            currentForestSize1++;
            currentForestCost1 += (treesSwapped ? this.costModel.ins(lFNode) : this.costModel.del(lFNode)); // USE COST MODEL
            currentForestSize2 = it2sizes[lGfirst];
            currentForestCost2 = (treesSwapped ? it2.preL_to_sumDelCost[lGfirst] : it2.preL_to_sumInsCost[lGfirst]); // USE COST MODEL
            lF_in_preR = it1preL_to_preR[lF];
            fForestIsTree = lF_in_preR === rF;
            lFSubtreeSize = it1sizes[lF];
            lFIsConsecutiveNodeOfCurrentPathNode = startPathNode - lF === 1;
            lFIsLeftSiblingOfCurrentPathNode = lF + lFSubtreeSize === startPathNode;
            sp1spointer = s[(lF + 1) - it1PreLoff];
            sp2spointer = s[lF - it1PreLoff];
            sp3spointer = s[0];
            sp3deltapointer = treesSwapped ? null : this.delta[lF];
            swritepointer = s[lF - it1PreLoff];
            sp1source = 1;
            sp3source = 1;
            if (fForestIsTree) {
              if (lFSubtreeSize === 1) {
                sp1source = 3;
              } else if (lFIsConsecutiveNodeOfCurrentPathNode) {
                sp1source = 2;
              }
              sp3 = 0;
              sp3source = 2;
            } else {
              if (lFIsConsecutiveNodeOfCurrentPathNode) {
                sp1source = 2;
              }
              sp3 = currentForestCost1 - (treesSwapped ? it1.preL_to_sumInsCost[lF] : it1.preL_to_sumDelCost[lF]); // USE COST MODEL
              if (lFIsLeftSiblingOfCurrentPathNode) {
                sp3source = 3;
              }
            }
            if (sp3source === 1) {
              sp3spointer = s[(lF + lFSubtreeSize) - it1PreLoff];
            }
            // Go to first lG.
            let lG = lGfirst;
            // sp1, sp2, sp3 for first node in Loop D.
            switch (sp1source) {
              case 1: sp1 = sp1spointer[lG - it2PreLoff]; break;
              case 2: sp1 = t[lG - it2PreLoff][rG - it2PreRoff]; break;
              case 3: sp1 = currentForestCost2; break; // USE COST MODEL
            }
            sp1 += (treesSwapped ? this.costModel.ins(lFNode) : this.costModel.del(lFNode)); // USE COST MODEL
            minCost = sp1;
            if (currentForestSize2 === 1) {
              sp2 = currentForestCost1; // USE COST MODEL
            } else {
              sp2 = this.q[lF];
            }
            sp2 += (treesSwapped ? this.costModel.del(it2nodes[lG]) : this.costModel.ins(it2nodes[lG])); // USE COST MODEL
            if (sp2 < minCost) {
              minCost = sp2;
            }
            if (sp3 < minCost) {
              sp3 += treesSwapped ? this.delta[lG][lF] : sp3deltapointer![lG];
              if (sp3 < minCost) {
                sp3 += (treesSwapped ? this.costModel.ren(it2nodes[lG], lFNode) : this.costModel.ren(lFNode, it2nodes[lG])); // USE COST MODEL
                if (sp3 < minCost) {
                  minCost = sp3;
                }
              }
            }
            swritepointer[lG - it2PreLoff] = minCost;
            lG = this.ft[lG];
            this.counter++;

            // Loop D - for all nodes to the left of rG.
            while (lG >= lGlast) {
              currentForestSize2++;
              currentForestCost2 += (treesSwapped ? this.costModel.del(it2nodes[lG]) : this.costModel.ins(it2nodes[lG]));
              switch (sp1source) {
                case 1: sp1 = sp1spointer[lG - it2PreLoff] + (treesSwapped ? this.costModel.ins(lFNode) : this.costModel.del(lFNode)); break;
                case 2: sp1 = t[lG - it2PreLoff][rG - it2PreRoff] + (treesSwapped ? this.costModel.ins(lFNode) : this.costModel.del(lFNode)); break;
                case 3: sp1 = currentForestCost2 + (treesSwapped ? this.costModel.ins(lFNode) : this.costModel.del(lFNode)); break;
              }
              sp2 = sp2spointer[this.fn[lG] - it2PreLoff] + (treesSwapped ? this.costModel.del(it2nodes[lG]) : this.costModel.ins(it2nodes[lG]));
              minCost = sp1;
              if (sp2 < minCost) {
                minCost = sp2;
              }
              sp3 = treesSwapped ? this.delta[lG][lF] : sp3deltapointer![lG];
              if (sp3 < minCost) {
                switch (sp3source) {
                  case 1: sp3 += sp3spointer[this.fn[(lG + it2sizes[lG]) - 1] - it2PreLoff]; break;
                  case 2: sp3 += currentForestCost2 - (treesSwapped ? it2.preL_to_sumDelCost[lG] : it2.preL_to_sumInsCost[lG]); break;
                  case 3: sp3 += t[this.fn[(lG + it2sizes[lG]) - 1] - it2PreLoff][rG - it2PreRoff]; break;
                }
                if (sp3 < minCost) {
                  sp3 += (treesSwapped ? this.costModel.ren(it2nodes[lG], lFNode) : this.costModel.ren(lFNode, it2nodes[lG]));
                  if (sp3 < minCost) {
                    minCost = sp3;
                  }
                }
              }
              swritepointer[lG - it2PreLoff] = minCost;
              lG = this.ft[lG];
              this.counter++;
            }
          }
          if (rGminus1_in_preL === parent_of_rG_in_preL) {
            if (!rightPart) {
              if (leftPart) {
                if (treesSwapped) {
                  this.delta[parent_of_rG_in_preL][endPathNode] = s[(lFlast + 1) - it1PreLoff][(rGminus1_in_preL + 1) - it2PreLoff];
                } else {
                  this.delta[endPathNode][parent_of_rG_in_preL] = s[(lFlast + 1) - it1PreLoff][(rGminus1_in_preL + 1) - it2PreLoff];
                }
              }
              if (endPathNode > 0 && endPathNode === parent_of_endPathNode + 1 && endPathNode_in_preR === parent_of_endPathNode_in_preR + 1) {
                if (treesSwapped) {
                  this.delta[parent_of_rG_in_preL][parent_of_endPathNode] = s[lFlast - it1PreLoff][(rGminus1_in_preL + 1) - it2PreLoff];
                } else {
                  this.delta[parent_of_endPathNode][parent_of_rG_in_preL] = s[lFlast - it1PreLoff][(rGminus1_in_preL + 1) - it2PreLoff];
                }
              }
            }
            for (let lF = lFfirst; lF >= lFlast; lF--) {
              this.q[lF] = s[lF - it1PreLoff][(parent_of_rG_in_preL + 1) - it2PreLoff];
            }
          }
          for (let lG = lGfirst; lG >= lGlast; lG = this.ft[lG]) {
            t[lG - it2PreLoff][rG - it2PreRoff] = s[lFlast - it1PreLoff][lG - it2PreLoff];
          }
        }
      }

      // Deal with nodes to the right of the path.
      if (pathType === 0 || (pathType === 2 && rightPart) || (pathType === 2 && !leftPart && !rightPart)) {
        if (startPathNode === -1) {
          lFfirst = endPathNode;
          rFfirst = it1preL_to_preR[endPathNode];
        } else {
          rFfirst = it1preL_to_preR[startPathNode] - 1;
          lFfirst = endPathNode + 1;
        }
        lFlast = endPathNode;
        lGlast = currentSubtreePreL2;
        lGfirst = (lGlast + subtreeSize2) - 1;
        rFlast = it1preL_to_preR[endPathNode];
        this.fn[this.fn.length - 1] = -1;
        for (let i = currentSubtreePreL2; i < currentSubtreePreL2 + subtreeSize2; i++) {
          this.fn[i] = -1;
          this.ft[i] = -1;
        }
        tmpForestSize1 = currentForestSize1;
        tmpForestCost1 = currentForestCost1;

        // Loop B' - for all nodes in G.
        for (let lG = lGfirst; lG >= lGlast; lG--) {
          rGfirst = it2preL_to_preR[lG];
          this.updateFnArray(it2.preR_to_ln[rGfirst], rGfirst, it2preL_to_preR[currentSubtreePreL2]);
          this.updateFtArray(it2.preR_to_ln[rGfirst], rGfirst);
          let lF = lFfirst;
          lGminus1_in_preR = lG <= currentSubtreePreL2 ? 0x7fffffff : it2preL_to_preR[lG - 1];
          parent_of_lG = it2parents[lG];
          parent_of_lG_in_preR = parent_of_lG === -1 ? -1 : it2preL_to_preR[parent_of_lG];
          currentForestSize1 = tmpForestSize1;
          currentForestCost1 = tmpForestCost1;
          if (pathType === 0) {
            if (lG === currentSubtreePreL2) {
              rGlast = rGfirst;
            } else if (it2.children[parent_of_lG][0] !== lG) {
              rGlast = rGfirst;
            } else {
              rGlast = it2preL_to_preR[parent_of_lG] + 1;
            }
          } else {
            rGlast = rGfirst === it2preL_to_preR[currentSubtreePreL2] ? rGfirst : it2preL_to_preR[currentSubtreePreL2];
          }

          // Loop C' - for all nodes to the right of the path node.
          for (let rF = rFfirst; rF >= rFlast; rF--) {
            if (rF === rFlast) {
              lF = lFlast;
            }
            rF_in_preL = it1preR_to_preL[rF];
            currentForestSize1++;
            currentForestCost1 += (treesSwapped ? this.costModel.ins(it1.preL_to_node[rF_in_preL]) : this.costModel.del(it1.preL_to_node[rF_in_preL])); // USE COST MODEL
            currentForestSize2 = it2sizes[lG];
            currentForestCost2 = (treesSwapped ? it2.preL_to_sumDelCost[lG] : it2.preL_to_sumInsCost[lG]); // USE COST MODEL
            rFSubtreeSize = it1sizes[rF_in_preL];
            if (startPathNode > 0) {
              rFIsConsecutiveNodeOfCurrentPathNode = startPathNode_in_preR - rF === 1;
              rFIsRightSiblingOfCurrentPathNode = rF + rFSubtreeSize === startPathNode_in_preR;
            } else {
              rFIsConsecutiveNodeOfCurrentPathNode = false;
              rFIsRightSiblingOfCurrentPathNode = false;
            }
            fForestIsTree = rF_in_preL === lF;
            const rFNode = it1.preL_to_node[rF_in_preL];
            sp1spointer = s[(rF + 1) - it1PreRoff];
            sp2spointer = s[rF - it1PreRoff];
            sp3spointer = s[0];
            sp3deltapointer = treesSwapped ? null : this.delta[rF_in_preL];
            swritepointer = s[rF - it1PreRoff];
            sp1tpointer = t[lG - it2PreLoff];
            sp3tpointer = t[lG - it2PreLoff];
            sp1source = 1;
            sp3source = 1;
            if (fForestIsTree) {
              if (rFSubtreeSize === 1) {
                sp1source = 3;
              } else if (rFIsConsecutiveNodeOfCurrentPathNode) {
                sp1source = 2;
              }
              sp3 = 0;
              sp3source = 2;
            } else {
              if (rFIsConsecutiveNodeOfCurrentPathNode) {
                sp1source = 2;
              }
              sp3 = currentForestCost1 - (treesSwapped ? it1.preL_to_sumInsCost[rF_in_preL] : it1.preL_to_sumDelCost[rF_in_preL]); // USE COST MODEL
              if (rFIsRightSiblingOfCurrentPathNode) {
                sp3source = 3;
              }
            }
            if (sp3source === 1) {
              sp3spointer = s[(rF + rFSubtreeSize) - it1PreRoff];
            }
            if (currentForestSize2 === 1) {
              sp2 = currentForestCost1; // USE COST MODEL
            } else {
              sp2 = this.q[rF];
            }
            let rG = rGfirst;
            rGfirst_in_preL = it2preR_to_preL[rGfirst];
            currentForestSize2++;
            switch (sp1source) {
              case 1: sp1 = sp1spointer[rG - it2PreRoff]; break;
              case 2: sp1 = sp1tpointer[rG - it2PreRoff]; break;
              case 3: sp1 = currentForestCost2; break; // USE COST MODEL
            }
            sp1 += (treesSwapped ? this.costModel.ins(rFNode) : this.costModel.del(rFNode)); // USE COST MODEL
            minCost = sp1;
            sp2 += (treesSwapped ? this.costModel.del(it2nodes[rGfirst_in_preL]) : this.costModel.ins(it2nodes[rGfirst_in_preL])); // USE COST MODEL
            if (sp2 < minCost) {
              minCost = sp2;
            }
            if (sp3 < minCost) {
              sp3 += treesSwapped ? this.delta[rGfirst_in_preL][rF_in_preL] : sp3deltapointer![rGfirst_in_preL];
              if (sp3 < minCost) {
                sp3 += (treesSwapped ? this.costModel.ren(it2nodes[rGfirst_in_preL], rFNode) : this.costModel.ren(rFNode, it2nodes[rGfirst_in_preL]));
                if (sp3 < minCost) {
                  minCost = sp3;
                }
              }
            }
            swritepointer[rG - it2PreRoff] = minCost;
            rG = this.ft[rG];
            this.counter++;

            // Loop D' - for all nodes to the right of lG.
            while (rG >= rGlast) {
              rG_in_preL = it2preR_to_preL[rG];
              currentForestSize2++;
              currentForestCost2 += (treesSwapped ? this.costModel.del(it2nodes[rG_in_preL]) : this.costModel.ins(it2nodes[rG_in_preL]));
              switch (sp1source) {
                case 1: sp1 = sp1spointer[rG - it2PreRoff] + (treesSwapped ? this.costModel.ins(rFNode) : this.costModel.del(rFNode)); break;
                case 2: sp1 = sp1tpointer[rG - it2PreRoff] + (treesSwapped ? this.costModel.ins(rFNode) : this.costModel.del(rFNode)); break;
                case 3: sp1 = currentForestCost2 + (treesSwapped ? this.costModel.ins(rFNode) : this.costModel.del(rFNode)); break;
              }
              sp2 = sp2spointer[this.fn[rG] - it2PreRoff] + (treesSwapped ? this.costModel.del(it2nodes[rG_in_preL]) : this.costModel.ins(it2nodes[rG_in_preL])); // USE COST MODEL
              minCost = sp1;
              if (sp2 < minCost) {
                minCost = sp2;
              }
              sp3 = treesSwapped ? this.delta[rG_in_preL][rF_in_preL] : sp3deltapointer![rG_in_preL];
              if (sp3 < minCost) {
                switch (sp3source) {
                  case 1: sp3 += sp3spointer[this.fn[(rG + it2sizes[rG_in_preL]) - 1] - it2PreRoff]; break;
                  case 2: sp3 += currentForestCost2 - (treesSwapped ? it2.preL_to_sumDelCost[rG_in_preL] : it2.preL_to_sumInsCost[rG_in_preL]); break;
                  case 3: sp3 += sp3tpointer[this.fn[(rG + it2sizes[rG_in_preL]) - 1] - it2PreRoff]; break;
                }
                if (sp3 < minCost) {
                  sp3 += (treesSwapped ? this.costModel.ren(it2nodes[rG_in_preL], rFNode) : this.costModel.ren(rFNode, it2nodes[rG_in_preL]));
                  if (sp3 < minCost) {
                    minCost = sp3;
                  }
                }
              }
              swritepointer[rG - it2PreRoff] = minCost;
              rG = this.ft[rG];
              this.counter++;
            }
          }
          if (lG > currentSubtreePreL2 && lG - 1 === parent_of_lG) {
            if (rightPart) {
              if (treesSwapped) {
                this.delta[parent_of_lG][endPathNode] = s[(rFlast + 1) - it1PreRoff][(lGminus1_in_preR + 1) - it2PreRoff];
              } else {
                this.delta[endPathNode][parent_of_lG] = s[(rFlast + 1) - it1PreRoff][(lGminus1_in_preR + 1) - it2PreRoff];
              }
            }
            if (endPathNode > 0 && endPathNode === parent_of_endPathNode + 1 && endPathNode_in_preR === parent_of_endPathNode_in_preR + 1) {
              if (treesSwapped) {
                this.delta[parent_of_lG][parent_of_endPathNode] = s[rFlast - it1PreRoff][(lGminus1_in_preR + 1) - it2PreRoff];
              } else {
                this.delta[parent_of_endPathNode][parent_of_lG] = s[rFlast - it1PreRoff][(lGminus1_in_preR + 1) - it2PreRoff];
              }
            }
            for (let rF = rFfirst; rF >= rFlast; rF--) {
              this.q[rF] = s[rF - it1PreRoff][(parent_of_lG_in_preR + 1) - it2PreRoff];
            }
          }
          for (let rG = rGfirst; rG >= rGlast; rG = this.ft[rG]) {
            t[lG - it2PreLoff][rG - it2PreRoff] = s[rFlast - it1PreRoff][rG - it2PreRoff];
          }
        }
      }

      // Walk up the path by one node.
      startPathNode = endPathNode;
      endPathNode = it1parents[endPathNode];
    }
    return minCost;
  }

  // ===================== BEGIN spfL
  /**
   * Implements single-path function for left paths.
   *
   * @param it1 node indexer of the left-hand input subtree.
   * @param it2 node indexer of the right-hand input subtree.
   * @param treesSwapped says if the order of input subtrees has been swapped.
   * @return tree edit distance between left-hand and right-hand input subtrees.
   * @java APTED.spfL(NodeIndexer, NodeIndexer, boolean)
   */
  private spfL(it1: NodeIndexerLike<D>, it2: NodeIndexerLike<D>, treesSwapped: boolean): number {
    const keyRoots: number[] = new Array(it2.sizes[it2.getCurrentNode()]).fill(-1);
    const pathID = it2.preL_to_lld(it2.getCurrentNode());
    const firstKeyRoot = this.computeKeyRoots(it2, it2.getCurrentNode(), pathID, keyRoots, 0);
    const forestdist: number[][] = [];
    for (let i = 0; i <= it1.sizes[it1.getCurrentNode()]; i++) {
      forestdist.push(new Array(it2.sizes[it2.getCurrentNode()] + 1).fill(0));
    }
    for (let i = firstKeyRoot - 1; i >= 0; i--) {
      this.treeEditDist(it1, it2, it1.getCurrentNode(), keyRoots[i], forestdist, treesSwapped);
    }
    return forestdist[it1.sizes[it1.getCurrentNode()]][it2.sizes[it2.getCurrentNode()]];
  }

  /**
   * Calculates and stores keyroot nodes for left paths of the given subtree recursively.
   *
   * @param it2 node indexer.
   * @param subtreeRootNode keyroot node.
   * @param pathID left-to-right preorder id of the leftmost leaf node.
   * @param keyRoots array that stores all key roots.
   * @param index the index of keyRoots where to store the next keyroot node.
   * @return the index of the first keyroot node to process.
   * @java APTED.computeKeyRoots(NodeIndexer, int, int, int[], int)
   */
  private computeKeyRoots(it2: NodeIndexerLike<D>, subtreeRootNode: number, pathID: number, keyRoots: number[], index: number): number {
    keyRoots[index] = subtreeRootNode;
    index++;
    let pathNode = pathID;
    while (pathNode > subtreeRootNode) {
      const parent = it2.parents[pathNode];
      for (const child of it2.children[parent]) {
        if (child !== pathNode) {
          index = this.computeKeyRoots(it2, child, it2.preL_to_lld(child), keyRoots, index);
        }
      }
      pathNode = parent;
    }
    return index;
  }

  /**
   * Implements the core of spfL. Fills in forestdist array with intermediate distances.
   *
   * @param it1 node indexer of the left-hand input subtree.
   * @param it2 node indexer of the right-hand input subtree.
   * @param it1subtree left-to-right preorder id of root of left-hand input subtree.
   * @param it2subtree left-to-right preorder id of root of right-hand input subtree.
   * @param forestdist the array to fill with intermediate distances.
   * @param treesSwapped says if the order of input subtrees has been swapped.
   * @java APTED.treeEditDist(NodeIndexer, NodeIndexer, int, int, float[][], boolean)
   */
  private treeEditDist(it1: NodeIndexerLike<D>, it2: NodeIndexerLike<D>, it1subtree: number, it2subtree: number, forestdist: number[][], treesSwapped: boolean): void {
    const i = it1.preL_to_postL[it1subtree];
    const j = it2.preL_to_postL[it2subtree];
    const ioff = it1.postL_to_lld[i] - 1;
    const joff = it2.postL_to_lld[j] - 1;
    let da = 0;
    let db = 0;
    let dc = 0;
    forestdist[0][0] = 0;
    for (let i1 = 1; i1 <= i - ioff; i1++) {
      forestdist[i1][0] = forestdist[i1 - 1][0] + (treesSwapped ? this.costModel.ins(it1.postL_to_node(i1 + ioff)) : this.costModel.del(it1.postL_to_node(i1 + ioff))); // USE COST MODEL
    }
    for (let j1 = 1; j1 <= j - joff; j1++) {
      forestdist[0][j1] = forestdist[0][j1 - 1] + (treesSwapped ? this.costModel.del(it2.postL_to_node(j1 + joff)) : this.costModel.ins(it2.postL_to_node(j1 + joff))); // USE COST MODEL
    }
    for (let i1 = 1; i1 <= i - ioff; i1++) {
      for (let j1 = 1; j1 <= j - joff; j1++) {
        this.counter++;
        const u = (treesSwapped ? this.costModel.ren(it2.postL_to_node(j1 + joff), it1.postL_to_node(i1 + ioff)) : this.costModel.ren(it1.postL_to_node(i1 + ioff), it2.postL_to_node(j1 + joff))); // USE COST MODEL
        da = forestdist[i1 - 1][j1] + (treesSwapped ? this.costModel.ins(it1.postL_to_node(i1 + ioff)) : this.costModel.del(it1.postL_to_node(i1 + ioff))); // USE COST MODEL
        db = forestdist[i1][j1 - 1] + (treesSwapped ? this.costModel.del(it2.postL_to_node(j1 + joff)) : this.costModel.ins(it2.postL_to_node(j1 + joff))); // USE COST MODEL
        if (it1.postL_to_lld[i1 + ioff] === it1.postL_to_lld[i] && it2.postL_to_lld[j1 + joff] === it2.postL_to_lld[j]) {
          dc = forestdist[i1 - 1][j1 - 1] + u;
          if (treesSwapped) {
            this.delta[it2.postL_to_preL[j1 + joff]][it1.postL_to_preL[i1 + ioff]] = forestdist[i1 - 1][j1 - 1];
          } else {
            this.delta[it1.postL_to_preL[i1 + ioff]][it2.postL_to_preL[j1 + joff]] = forestdist[i1 - 1][j1 - 1];
          }
        } else {
          dc = forestdist[it1.postL_to_lld[i1 + ioff] - 1 - ioff][it2.postL_to_lld[j1 + joff] - 1 - joff] +
            (treesSwapped ? this.delta[it2.postL_to_preL[j1 + joff]][it1.postL_to_preL[i1 + ioff]] : this.delta[it1.postL_to_preL[i1 + ioff]][it2.postL_to_preL[j1 + joff]]) + u;
        }
        forestdist[i1][j1] = da >= db ? db >= dc ? dc : db : da >= dc ? dc : da;
      }
    }
  }
  // ===================== END spfL

  // ===================== BEGIN spfR
  /**
   * Implements single-path function for right paths.
   *
   * @param it1 node indexer of the left-hand input subtree.
   * @param it2 node indexer of the right-hand input subtree.
   * @param treesSwapped says if the order of input subtrees has been swapped.
   * @return tree edit distance between left-hand and right-hand input subtrees.
   * @java APTED.spfR(NodeIndexer, NodeIndexer, boolean)
   */
  private spfR(it1: NodeIndexerLike<D>, it2: NodeIndexerLike<D>, treesSwapped: boolean): number {
    const revKeyRoots: number[] = new Array(it2.sizes[it2.getCurrentNode()]).fill(-1);
    const pathID = it2.preL_to_rld(it2.getCurrentNode());
    const firstKeyRoot = this.computeRevKeyRoots(it2, it2.getCurrentNode(), pathID, revKeyRoots, 0);
    const forestdist: number[][] = [];
    for (let i = 0; i <= it1.sizes[it1.getCurrentNode()]; i++) {
      forestdist.push(new Array(it2.sizes[it2.getCurrentNode()] + 1).fill(0));
    }
    for (let i = firstKeyRoot - 1; i >= 0; i--) {
      this.revTreeEditDist(it1, it2, it1.getCurrentNode(), revKeyRoots[i], forestdist, treesSwapped);
    }
    return forestdist[it1.sizes[it1.getCurrentNode()]][it2.sizes[it2.getCurrentNode()]];
  }

  /**
   * Calculates and stores keyroot nodes for right paths of the given subtree recursively.
   *
   * @param it2 node indexer.
   * @param subtreeRootNode keyroot node.
   * @param pathID left-to-right preorder id of the rightmost leaf node.
   * @param revKeyRoots array that stores all key roots.
   * @param index the index of keyRoots where to store the next keyroot node.
   * @return the index of the first keyroot node to process.
   * @java APTED.computeRevKeyRoots(NodeIndexer, int, int, int[], int)
   */
  private computeRevKeyRoots(it2: NodeIndexerLike<D>, subtreeRootNode: number, pathID: number, revKeyRoots: number[], index: number): number {
    revKeyRoots[index] = subtreeRootNode;
    index++;
    let pathNode = pathID;
    while (pathNode > subtreeRootNode) {
      const parent = it2.parents[pathNode];
      for (const child of it2.children[parent]) {
        if (child !== pathNode) {
          index = this.computeRevKeyRoots(it2, child, it2.preL_to_rld(child), revKeyRoots, index);
        }
      }
      pathNode = parent;
    }
    return index;
  }

  /**
   * Implements the core of spfR. Fills in forestdist array with intermediate distances.
   *
   * @param it1 node indexer of the left-hand input subtree.
   * @param it2 node indexer of the right-hand input subtree.
   * @param it1subtree left-to-right preorder id of root of the left-hand input subtree.
   * @param it2subtree left-to-right preorder id of root of the right-hand input subtree.
   * @param forestdist the array to fill with intermediate distances of subforest pairs.
   * @param treesSwapped says if the order of input subtrees has been swapped.
   * @java APTED.revTreeEditDist(NodeIndexer, NodeIndexer, int, int, float[][], boolean)
   */
  private revTreeEditDist(it1: NodeIndexerLike<D>, it2: NodeIndexerLike<D>, it1subtree: number, it2subtree: number, forestdist: number[][], treesSwapped: boolean): void {
    const i = it1.preL_to_postR[it1subtree];
    const j = it2.preL_to_postR[it2subtree];
    const ioff = it1.postR_to_rld[i] - 1;
    const joff = it2.postR_to_rld[j] - 1;
    let da = 0;
    let db = 0;
    let dc = 0;
    forestdist[0][0] = 0;
    for (let i1 = 1; i1 <= i - ioff; i1++) {
      forestdist[i1][0] = forestdist[i1 - 1][0] + (treesSwapped ? this.costModel.ins(it1.postR_to_node(i1 + ioff)) : this.costModel.del(it1.postR_to_node(i1 + ioff))); // USE COST MODEL
    }
    for (let j1 = 1; j1 <= j - joff; j1++) {
      forestdist[0][j1] = forestdist[0][j1 - 1] + (treesSwapped ? this.costModel.del(it2.postR_to_node(j1 + joff)) : this.costModel.ins(it2.postR_to_node(j1 + joff))); // USE COST MODEL
    }
    for (let i1 = 1; i1 <= i - ioff; i1++) {
      for (let j1 = 1; j1 <= j - joff; j1++) {
        this.counter++;
        const u = (treesSwapped ? this.costModel.ren(it2.postR_to_node(j1 + joff), it1.postR_to_node(i1 + ioff)) : this.costModel.ren(it1.postR_to_node(i1 + ioff), it2.postR_to_node(j1 + joff))); // USE COST MODEL
        da = forestdist[i1 - 1][j1] + (treesSwapped ? this.costModel.ins(it1.postR_to_node(i1 + ioff)) : this.costModel.del(it1.postR_to_node(i1 + ioff))); // USE COST MODEL
        db = forestdist[i1][j1 - 1] + (treesSwapped ? this.costModel.del(it2.postR_to_node(j1 + joff)) : this.costModel.ins(it2.postR_to_node(j1 + joff))); // USE COST MODEL
        if (it1.postR_to_rld[i1 + ioff] === it1.postR_to_rld[i] && it2.postR_to_rld[j1 + joff] === it2.postR_to_rld[j]) {
          dc = forestdist[i1 - 1][j1 - 1] + u;
          if (treesSwapped) {
            this.delta[it2.postR_to_preL[j1 + joff]][it1.postR_to_preL[i1 + ioff]] = forestdist[i1 - 1][j1 - 1];
          } else {
            this.delta[it1.postR_to_preL[i1 + ioff]][it2.postR_to_preL[j1 + joff]] = forestdist[i1 - 1][j1 - 1];
          }
        } else {
          dc = forestdist[it1.postR_to_rld[i1 + ioff] - 1 - ioff][it2.postR_to_rld[j1 + joff] - 1 - joff] +
            (treesSwapped ? this.delta[it2.postR_to_preL[j1 + joff]][it1.postR_to_preL[i1 + ioff]] : this.delta[it1.postR_to_preL[i1 + ioff]][it2.postR_to_preL[j1 + joff]]) + u;
        }
        forestdist[i1][j1] = da >= db ? db >= dc ? dc : db : da >= dc ? dc : da;
      }
    }
  }
  // ===================== END spfR

  /**
   * Decodes the path from the optimal strategy to its type.
   *
   * @param pathIDWithPathIDOffset raw path id from strategy array.
   * @param pathIDOffset offset used to distinguish between paths in the source and destination trees.
   * @param it node indexer.
   * @param currentRootNodePreL the left-to-right preorder id of the current subtree processed.
   * @param currentSubtreeSize the size of the subtree currently processed.
   * @return type of the strategy path (LEFT, RIGHT, INNER).
   * @java APTED.getStrategyPathType(int, int, NodeIndexer, int, int)
   */
  private getStrategyPathType(pathIDWithPathIDOffset: number, pathIDOffset: number, it: NodeIndexerLike<D>, currentRootNodePreL: number, currentSubtreeSize: number): number {
    if (Math.sign(pathIDWithPathIDOffset) === -1) {
      return APTED.LEFT;
    }
    let pathID = Math.abs(pathIDWithPathIDOffset) - 1;
    if (pathID >= pathIDOffset) {
      pathID = pathID - pathIDOffset;
    }
    if (pathID === (currentRootNodePreL + currentSubtreeSize) - 1) {
      return APTED.RIGHT;
    }
    return APTED.INNER;
  }

  /**
   * fn array used in the algorithm before [1].
   *
   * @param lnForNode ---
   * @param node ---
   * @param currentSubtreePreL ---
   * @java APTED.updateFnArray(int, int, int)
   */
  private updateFnArray(lnForNode: number, node: number, currentSubtreePreL: number): void {
    if (lnForNode >= currentSubtreePreL) {
      this.fn[node] = this.fn[lnForNode];
      this.fn[lnForNode] = node;
    } else {
      this.fn[node] = this.fn[this.fn.length - 1];
      this.fn[this.fn.length - 1] = node;
    }
  }

  /**
   * ft array used in the algorithm before [1].
   *
   * @param lnForNode ---
   * @param node ---
   * @java APTED.updateFtArray(int, int)
   */
  private updateFtArray(lnForNode: number, node: number): void {
    this.ft[node] = lnForNode;
    if (this.fn[node] > -1) {
      this.ft[this.fn[node]] = node;
    }
  }

  /**
   * Compute the edit mapping between two trees. The trees are input trees
   * to the distance computation and the distance must be computed before
   * computing the edit mapping.
   *
   * @return Returns list of pairs of nodes that are mapped as pairs of their
   *         postorder IDs (starting with 1). Nodes that are deleted or
   *         inserted are mapped to 0.
   * @java APTED.computeEditMapping()
   */
  public computeEditMapping(): number[][] {
    // Initialize tree and forest distance arrays.
    const forestdist: number[][] = [];
    for (let i = 0; i <= this.size1; i++) {
      forestdist.push(new Array(this.size2 + 1).fill(0));
    }

    let rootNodePair = true;

    // forestdist for input trees has to be computed.
    this.forestDist(this.it1, this.it2, this.size1, this.size2, forestdist);

    // empty edit mapping
    const editMapping: number[][] = [];

    // empty stack of tree pairs
    const treePairs: number[][] = [];

    // push the pair of trees (ted1, ted2) to stack
    treePairs.push([this.size1, this.size2]);

    while (treePairs.length > 0) {
      // get next tree pair to be processed
      const treePair = treePairs.pop()!;
      const lastRow = treePair[0];
      const lastCol = treePair[1];

      // compute forest distance matrix
      if (!rootNodePair) {
        this.forestDist(this.it1, this.it2, lastRow, lastCol, forestdist);
      }
      rootNodePair = false;

      // compute mapping for current forest distance matrix
      const firstRow = this.it1.postL_to_lld[lastRow - 1];
      const firstCol = this.it2.postL_to_lld[lastCol - 1];
      let row = lastRow;
      let col = lastCol;
      while (row > firstRow || col > firstCol) {
        if (row > firstRow && forestdist[row - 1][col] + this.costModel.del(this.it1.postL_to_node(row - 1)) === forestdist[row][col]) { // USE COST MODEL
          // node with postorderID row is deleted from ted1
          editMapping.unshift([row, 0]);
          row--;
        } else if (col > firstCol && forestdist[row][col - 1] + this.costModel.ins(this.it2.postL_to_node(col - 1)) === forestdist[row][col]) { // USE COST MODEL
          // node with postorderID col is inserted into ted2
          editMapping.unshift([0, col]);
          col--;
        } else {
          // node with postorderID row in ted1 is renamed to node col in ted2
          if (this.it1.postL_to_lld[row - 1] === this.it1.postL_to_lld[lastRow - 1] && this.it2.postL_to_lld[col - 1] === this.it2.postL_to_lld[lastCol - 1]) {
            // if both subforests are trees, map nodes
            editMapping.unshift([row, col]);
            row--;
            col--;
          } else {
            // push subtree pair
            treePairs.push([row, col]);
            // continue with forest to the left of the popped subtree pair
            row = this.it1.postL_to_lld[row - 1];
            col = this.it2.postL_to_lld[col - 1];
          }
        }
      }
    }
    return editMapping;
  }

  /**
   * Recalculates distances between subforests of two subtrees. Based on Zhang and Shasha algorithm.
   *
   * @param ted1 node indexer of the source input tree.
   * @param ted2 node indexer of the destination input tree.
   * @param i subtree root of source tree that is to be mapped.
   * @param j subtree root of destination tree that is to be mapped.
   * @param forestdist array to store distances between subforest pairs.
   * @java APTED.forestDist(NodeIndexer, NodeIndexer, int, int, float[][])
   */
  private forestDist(ted1: NodeIndexerLike<D>, ted2: NodeIndexerLike<D>, i: number, j: number, forestdist: number[][]): void {
    forestdist[ted1.postL_to_lld[i - 1]][ted2.postL_to_lld[j - 1]] = 0;

    for (let di = ted1.postL_to_lld[i - 1] + 1; di <= i; di++) {
      forestdist[di][ted2.postL_to_lld[j - 1]] = forestdist[di - 1][ted2.postL_to_lld[j - 1]] + this.costModel.del(ted1.postL_to_node(di - 1));
      for (let dj = ted2.postL_to_lld[j - 1] + 1; dj <= j; dj++) {
        forestdist[ted1.postL_to_lld[i - 1]][dj] = forestdist[ted1.postL_to_lld[i - 1]][dj - 1] + this.costModel.ins(ted2.postL_to_node(dj - 1));
        const costRen = this.costModel.ren(ted1.postL_to_node(di - 1), ted2.postL_to_node(dj - 1));
        if (ted1.postL_to_lld[di - 1] === ted1.postL_to_lld[i - 1] && ted2.postL_to_lld[dj - 1] === ted2.postL_to_lld[j - 1]) {
          forestdist[di][dj] = Math.min(
            Math.min(
              forestdist[di - 1][dj] + this.costModel.del(ted1.postL_to_node(di - 1)),
              forestdist[di][dj - 1] + this.costModel.ins(ted2.postL_to_node(dj - 1))
            ),
            forestdist[di - 1][dj - 1] + costRen
          );
        } else {
          forestdist[di][dj] = Math.min(
            Math.min(
              forestdist[di - 1][dj] + this.costModel.del(ted1.postL_to_node(di - 1)),
              forestdist[di][dj - 1] + this.costModel.ins(ted2.postL_to_node(dj - 1))
            ),
            forestdist[ted1.postL_to_lld[di - 1]][ted2.postL_to_lld[dj - 1]] +
              this.delta[this.it1.postL_to_preL[di - 1]][this.it2.postL_to_preL[dj - 1]] + costRen
          );
        }
      }
    }
  }

  /**
   * Calculates the cost of an edit mapping. It traverses the mapping and sums up the cost.
   *
   * @param mapping an edit mapping.
   * @return cost of edit mapping.
   * @java APTED.mappingCost(List)
   */
  public mappingCost(mapping: number[][]): number {
    let cost = 0.0;
    for (let i = 0; i < mapping.length; i++) {
      if (mapping[i][0] === 0) { // Insertion.
        cost += this.costModel.ins(this.it2.postL_to_node(mapping[i][1] - 1));
      } else if (mapping[i][1] === 0) { // Deletion.
        cost += this.costModel.del(this.it1.postL_to_node(mapping[i][0] - 1));
      } else { // Rename.
        cost += this.costModel.ren(this.it1.postL_to_node(mapping[i][0] - 1), this.it2.postL_to_node(mapping[i][1] - 1));
      }
    }
    return cost;
  }
}
