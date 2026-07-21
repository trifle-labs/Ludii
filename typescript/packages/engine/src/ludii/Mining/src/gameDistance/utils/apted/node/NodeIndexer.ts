// @java Mining/src/gameDistance/utils/apted/node/NodeIndexer.java

/* MIT License
 *
 * Copyright (c) 2017 Mateusz Pawlik
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { CostModel } from "../costmodel/CostModel.js";
import { Node } from "./Node.js";

/**
 * Indexes nodes of the input tree to the algorithm that is already parsed to
 * tree structure using Node class. Stores various indices on nodes required for
 * efficient computation of APTED [1,2]. Additionally, it stores single-value
 * properties of the tree.
 *
 * <p>For indexing we use four tree traversals that assign ids to the nodes:
 * <ul>
 * <li>left-to-right preorder [1],
 * <li>right-to-left preorder [1],
 * <li>left-to-right postorder [2],
 * <li>right-to-left postorder [2].
 * </ul>
 *
 * @param D type of node data.
 * @param C type of cost model.
 * @java gameDistance.utils.apted.node.NodeIndexer
 */
export class NodeIndexer<D, C extends CostModel<D>> {

  // [TODO] Be consistent in naming index variables: <FROM>_to_<TO>.

  // Structure indices.

  /**
   * Index from left-to-right preorder id of node n (starting with 0)
   * to Node object corresponding to n. Used for cost of edit operations.
   *
   * @java NodeIndexer.preL_to_node
   */
  public preL_to_node: (Node<D> | undefined)[];

  /**
   * Index from left-to-right preorder id of node n (starting with 0)
   * to the size of n's subtree (node n and all its descendants).
   *
   * @java NodeIndexer.sizes
   */
  public sizes: number[];

  /**
   * Index from left-to-right preorder id of node n (starting with 0)
   * to the left-to-right preorder id of n's parent.
   *
   * @java NodeIndexer.parents
   */
  public parents: number[];

  /**
   * Index from left-to-right preorder id of node n (starting with 0)
   * to the array of n's children.
   *
   * @java NodeIndexer.children
   */
  public children: number[][];

  /**
   * Index from left-to-right postorder id of node n (starting with 0)
   * to the left-to-right postorder id of n's leftmost leaf descendant.
   *
   * @java NodeIndexer.postL_to_lld
   */
  public postL_to_lld: number[];

  /**
   * Index from right-to-left postorder id of node n (starting with 0)
   * to the right-to-left postorder id of n's rightmost leaf descendant.
   *
   * @java NodeIndexer.postR_to_rld
   */
  public postR_to_rld: number[];

  /**
   * Index from left-to-right preorder id of node n (starting with 0)
   * to the left-to-right preorder id of the first leaf node to the left of n.
   * If there is no leaf node to the left of n, it is represented with the
   * value -1.
   *
   * @java NodeIndexer.preL_to_ln
   */
  public preL_to_ln: number[];

  /**
   * Index from right-to-left preorder id of node n (starting with 0)
   * to the right-to-left preorder id of the first leaf node to the right of n.
   * If there is no leaf node to the right of n, it is represented with the
   * value -1.
   *
   * @java NodeIndexer.preR_to_ln
   */
  public preR_to_ln: number[];

  /**
   * Index from left-to-right preorder id of node n (starting with 0)
   * to a boolean value that states if node n lies on the leftmost path
   * starting at n's parent.
   *
   * @java NodeIndexer.nodeType_L
   */
  public nodeType_L: boolean[];

  /**
   * Index from left-to-right preorder id of node n (starting with 0)
   * to a boolean value that states if node n lies on the rightmost path
   * starting at n's parent input tree.
   *
   * @java NodeIndexer.nodeType_R
   */
  public nodeType_R: boolean[];

  // Traversal translation indices.

  /**
   * Index from left-to-right preorder id of node n to right-to-left preorder id.
   * @java NodeIndexer.preL_to_preR
   */
  public preL_to_preR: number[];

  /**
   * Index from right-to-left preorder id of node n to left-to-right preorder id.
   * @java NodeIndexer.preR_to_preL
   */
  public preR_to_preL: number[];

  /**
   * Index from left-to-right preorder id of node n to left-to-right postorder id.
   * @java NodeIndexer.preL_to_postL
   */
  public preL_to_postL: number[];

  /**
   * Index from left-to-right postorder id of node n to left-to-right preorder id.
   * @java NodeIndexer.postL_to_preL
   */
  public postL_to_preL: number[];

  /**
   * Index from left-to-right preorder id of node n to right-to-left postorder id.
   * @java NodeIndexer.preL_to_postR
   */
  public preL_to_postR: number[];

  /**
   * Index from right-to-left postorder id of node n to left-to-right preorder id.
   * @java NodeIndexer.postR_to_preL
   */
  public postR_to_preL: number[];

  // Cost indices.

  /**
   * Index from left-to-right preorder id to cost of spf_L for the subtree.
   * @java NodeIndexer.preL_to_kr_sum
   */
  public preL_to_kr_sum: number[];

  /**
   * Index from left-to-right preorder id to cost of spf_R for the subtree.
   * @java NodeIndexer.preL_to_rev_kr_sum
   */
  public preL_to_rev_kr_sum: number[];

  /**
   * Index from left-to-right preorder id to cost of spf_A for the subtree.
   * @java NodeIndexer.preL_to_desc_sum
   */
  public preL_to_desc_sum: number[];

  /**
   * Index from left-to-right preorder id to the cost of deleting all nodes in
   * the subtree rooted at n.
   * @java NodeIndexer.preL_to_sumDelCost
   */
  public preL_to_sumDelCost: number[];

  /**
   * Index from left-to-right preorder id to the cost of inserting all nodes in
   * the subtree rooted at n.
   * @java NodeIndexer.preL_to_sumInsCost
   */
  public preL_to_sumInsCost: number[];

  // Variables holding values modified at runtime while the algorithm executes.

  /**
   * Stores the left-to-right preorder id of the current subtree's root node.
   * @java NodeIndexer.currentNode
   */
  private currentNode: number;

  // Structure single-value variables.

  /**
   * Stores the size of the input tree.
   * @java NodeIndexer.treeSize
   */
  private readonly treeSize: number;

  /**
   * Stores the number of leftmost-child leaf nodes in the input tree.
   * @java NodeIndexer.lchl
   */
  public lchl: number;

  /**
   * Stores the number of rightmost-child leaf nodes in the input tree.
   * @java NodeIndexer.rchl
   */
  public rchl: number;

  // Variables used temporarily while indexing.

  /**
   * Temporary variable used in indexing for storing subtree size.
   * @java NodeIndexer.sizeTmp
   */
  private sizeTmp: number;

  /**
   * Temporary variable used in indexing for storing sum of subtree sizes
   * rooted at descendant nodes.
   * @java NodeIndexer.descSizesTmp
   */
  private descSizesTmp: number;

  /**
   * Temporary variable used in indexing for storing sum of keyroot node sizes.
   * @java NodeIndexer.krSizesSumTmp
   */
  private krSizesSumTmp: number;

  /**
   * Temporary variable used in indexing for storing sum of right-to-left
   * keyroot node sizes.
   * @java NodeIndexer.revkrSizesSumTmp
   */
  private revkrSizesSumTmp: number;

  /**
   * Temporary variable used in indexing for storing preorder index of a node.
   * @java NodeIndexer.preorderTmp
   */
  private preorderTmp: number;

  /** @java NodeIndexer.costModel */
  private readonly costModel: C;

  /**
   * Indexes the nodes of input trees and stores the indices for quick access
   * from APTED algorithm.
   *
   * @param inputTree an input tree to APTED. Its nodes will be indexed.
   * @param costModel instance of a cost model to compute preL_to_sumDelCost
   *                  and preL_to_sumInsCost.
   * @java NodeIndexer(Node, CostModel)
   */
  public constructor(inputTree: Node<D>, costModel: C) {
    // Initialise variables.
    this.sizeTmp = 0;
    this.descSizesTmp = 0;
    this.krSizesSumTmp = 0;
    this.revkrSizesSumTmp = 0;
    this.preorderTmp = 0;
    this.currentNode = 0;
    this.lchl = 0;
    this.rchl = 0;
    this.treeSize = inputTree.getNodeCount();

    // Initialise indices with the lengths equal to the tree size.
    this.sizes = new Array<number>(this.treeSize).fill(0);
    this.preL_to_preR = new Array<number>(this.treeSize).fill(0);
    this.preR_to_preL = new Array<number>(this.treeSize).fill(0);
    this.preL_to_postL = new Array<number>(this.treeSize).fill(0);
    this.postL_to_preL = new Array<number>(this.treeSize).fill(0);
    this.preL_to_postR = new Array<number>(this.treeSize).fill(0);
    this.postR_to_preL = new Array<number>(this.treeSize).fill(0);
    this.postL_to_lld = new Array<number>(this.treeSize).fill(0);
    this.postR_to_rld = new Array<number>(this.treeSize).fill(0);
    this.preL_to_node = new Array<Node<D> | undefined>(this.treeSize).fill(undefined);
    this.preL_to_ln = new Array<number>(this.treeSize).fill(0);
    this.preR_to_ln = new Array<number>(this.treeSize).fill(0);
    this.preL_to_kr_sum = new Array<number>(this.treeSize).fill(0);
    this.preL_to_rev_kr_sum = new Array<number>(this.treeSize).fill(0);
    this.preL_to_desc_sum = new Array<number>(this.treeSize).fill(0);
    this.preL_to_sumDelCost = new Array<number>(this.treeSize).fill(0);
    this.preL_to_sumInsCost = new Array<number>(this.treeSize).fill(0);
    this.children = new Array<number[]>(this.treeSize).fill([]);
    this.nodeType_L = new Array<boolean>(this.treeSize).fill(false);
    this.nodeType_R = new Array<boolean>(this.treeSize).fill(false);
    this.parents = new Array<number>(this.treeSize).fill(0);
    this.parents[0] = -1; // The root has no parent.

    this.costModel = costModel;

    // Index the nodes.
    this.indexNodes(inputTree, -1);
    this.postTraversalIndexing();
  }

  /**
   * Indexes the nodes of the input tree. Stores information about each tree
   * node in index arrays.
   *
   * <p>It is a recursive method that traverses the tree once.
   *
   * @param node is the current node while traversing the input tree.
   * @param postorder is the postorder id of the current node.
   * @return postorder id of the current node.
   * @java NodeIndexer.indexNodes(Node, int)
   */
  private indexNodes(node: Node<D>, postorder: number): number {
    // Initialise variables.
    let currentSize = 0;
    let childrenCount = 0;
    let descSizes = 0;
    let krSizesSum = 0;
    let revkrSizesSum = 0;
    const preorder = this.preorderTmp;
    let preorderR = 0;
    let currentPreorder = -1;
    // Initialise empty array to store children of this node.
    const childrenPreorders: number[] = [];

    // Store the preorder id of the current node to use it after the recursion.
    this.preorderTmp++;

    // Loop over children of a node.
    const childrenList = node.getChildren();
    let childIndex = 0;
    while (childIndex < childrenList.length) {
      childrenCount++;
      currentPreorder = this.preorderTmp;
      this.parents[currentPreorder] = preorder;

      // Execute method recursively for next child.
      postorder = this.indexNodes(childrenList[childIndex]!, postorder);

      childrenPreorders.push(currentPreorder);

      currentSize += 1 + this.sizeTmp;
      descSizes += this.descSizesTmp;
      if (childrenCount > 1) {
        krSizesSum += this.krSizesSumTmp + this.sizeTmp + 1;
      } else {
        krSizesSum += this.krSizesSumTmp;
        this.nodeType_L[currentPreorder] = true;
      }
      childIndex++;
      if (childIndex < childrenList.length) {
        revkrSizesSum += this.revkrSizesSumTmp + this.sizeTmp + 1;
      } else {
        revkrSizesSum += this.revkrSizesSumTmp;
        this.nodeType_R[currentPreorder] = true;
      }
    }

    postorder++;

    const currentDescSizes = descSizes + currentSize + 1;
    this.preL_to_desc_sum[preorder] = ((currentSize + 1) * (currentSize + 1 + 3)) / 2 - currentDescSizes;
    this.preL_to_kr_sum[preorder] = krSizesSum + currentSize + 1;
    this.preL_to_rev_kr_sum[preorder] = revkrSizesSum + currentSize + 1;

    // Store pointer to a node object corresponding to preorder.
    this.preL_to_node[preorder] = node;

    this.sizes[preorder] = currentSize + 1;
    preorderR = this.treeSize - 1 - postorder;
    this.preL_to_preR[preorder] = preorderR;
    this.preR_to_preL[preorderR] = preorder;

    this.children[preorder] = childrenPreorders;

    this.descSizesTmp = currentDescSizes;
    this.sizeTmp = currentSize;
    this.krSizesSumTmp = krSizesSum;
    this.revkrSizesSumTmp = revkrSizesSum;

    this.postL_to_preL[postorder] = preorder;
    this.preL_to_postL[preorder] = postorder;
    this.preL_to_postR[preorder] = this.treeSize - 1 - preorder;
    this.postR_to_preL[this.treeSize - 1 - preorder] = preorder;

    return postorder;
  }

  /**
   * Indexes the nodes of the input tree. Computes indices which could not be
   * computed immediately while traversing the tree in indexNodes.
   *
   * <p>Runs in linear time in the input tree size. Currently requires two
   * loops over input tree nodes. Can be reduced to one loop.
   *
   * @java NodeIndexer.postTraversalIndexing()
   */
  private postTraversalIndexing(): void {
    let currentLeaf = -1;
    let nodeForSum = -1;
    let parentForSum = -1;
    for (let i = 0; i < this.treeSize; i++) {
      this.preL_to_ln[i] = currentLeaf;
      if (this.isLeaf(i)) {
        currentLeaf = i;
      }

      // This block stores leftmost leaf descendants for each node
      // indexed in postorder.
      const postl = i; // Assume that the for loop iterates postorder.
      let preorder = this.postL_to_preL[i]!;
      if (this.sizes[preorder]! === 1) {
        this.postL_to_lld[postl] = postl;
      } else {
        this.postL_to_lld[postl] = this.postL_to_lld[this.preL_to_postL[this.children[preorder]![0]!]!]!;
      }
      // This block stores rightmost leaf descendants for each node
      // indexed in right-to-left postorder.
      const postr = i; // Assume that the for loop iterates reversed postorder.
      preorder = this.postR_to_preL[postr]!;
      if (this.sizes[preorder]! === 1) {
        this.postR_to_rld[postr] = postr;
      } else {
        const childrenOfPreorder = this.children[preorder]!;
        this.postR_to_rld[postr] = this.postR_to_rld[this.preL_to_postR[childrenOfPreorder[childrenOfPreorder.length - 1]!]!]!;
      }
      // Count lchl and rchl.
      if (this.sizes[i]! === 1) {
        const parent = this.parents[i]!;
        if (parent > -1) {
          if (parent + 1 === i) {
            this.lchl++;
          } else if (this.preL_to_preR[parent] !== undefined && this.preL_to_preR[i] !== undefined &&
                     this.preL_to_preR[parent]! + 1 === this.preL_to_preR[i]!) {
            this.rchl++;
          }
        }
      }

      // Sum up costs of deleting and inserting entire subtrees.
      // Reverse the node index. Here, we need traverse nodes bottom-up.
      nodeForSum = this.treeSize - i - 1;
      parentForSum = this.parents[nodeForSum]!;
      // Update myself.
      this.preL_to_sumDelCost[nodeForSum] = (this.preL_to_sumDelCost[nodeForSum] ?? 0) + this.costModel.del(this.preL_to_node[nodeForSum]! as Node<D>);
      this.preL_to_sumInsCost[nodeForSum] = (this.preL_to_sumInsCost[nodeForSum] ?? 0) + this.costModel.ins(this.preL_to_node[nodeForSum]! as Node<D>);
      if (parentForSum > -1) {
        // Update my parent.
        this.preL_to_sumDelCost[parentForSum] = (this.preL_to_sumDelCost[parentForSum] ?? 0) + (this.preL_to_sumDelCost[nodeForSum] ?? 0);
        this.preL_to_sumInsCost[parentForSum] = (this.preL_to_sumInsCost[parentForSum] ?? 0) + (this.preL_to_sumInsCost[nodeForSum] ?? 0);
      }
    }

    currentLeaf = -1;
    // [TODO] Merge with the other loop. Assume different traversal.
    for (let i = 0; i < this.sizes[0]!; i++) {
      this.preR_to_ln[i] = currentLeaf;
      if (this.isLeaf(this.preR_to_preL[i]!)) {
        currentLeaf = i;
      }
    }
  }

  /**
   * An abbreviation that uses indices to calculate the left-to-right preorder
   * id of the leftmost leaf node of the given node.
   *
   * @param preL left-to-right preorder id of a node.
   * @return left-to-right preorder id of the leftmost leaf node of preL.
   * @java NodeIndexer.preL_to_lld(int)
   */
  public preL_to_lldFn(preL: number): number {
    return this.postL_to_preL[this.postL_to_lld[this.preL_to_postL[preL]!]!]!;
  }

  /**
   * An abbreviation that uses indices to calculate the left-to-right preorder
   * id of the rightmost leaf node of the given node.
   *
   * @param preL left-to-right preorder id of a node.
   * @return left-to-right preorder id of the rightmost leaf node of preL.
   * @java NodeIndexer.preL_to_rld(int)
   */
  public preL_to_rldFn(preL: number): number {
    return this.postR_to_preL[this.postR_to_rld[this.preL_to_postR[preL]!]!]!;
  }

  /**
   * An abbreviation that uses indices to retrieve pointer to Node of the given
   * node.
   *
   * @param postL left-to-right postorder id of a node.
   * @return Node corresponding to postL.
   * @java NodeIndexer.postL_to_node(int)
   */
  public postL_to_nodeFn(postL: number): Node<D> {
    return this.preL_to_node[this.postL_to_preL[postL]!]! as Node<D>;
  }

  /**
   * An abbreviation that uses indices to retrieve pointer to Node of the given
   * node.
   *
   * @param postR right-to-left postorder id of a node.
   * @return Node corresponding to postR.
   * @java NodeIndexer.postR_to_node(int)
   */
  public postR_to_nodeFn(postR: number): Node<D> {
    return this.preL_to_node[this.postR_to_preL[postR]!]! as Node<D>;
  }

  /**
   * Returns the number of nodes in the input tree.
   *
   * @return number of nodes in the tree.
   * @java NodeIndexer.getSize()
   */
  public getSize(): number {
    return this.treeSize;
  }

  /**
   * Verifies if node is a leaf.
   *
   * @param node preorder id of a node to verify.
   * @return true if node is a leaf, false otherwise.
   * @java NodeIndexer.isLeaf(int)
   */
  public isLeaf(node: number): boolean {
    return this.sizes[node] === 1;
  }

  /**
   * Returns the root node of the currently processed subtree in the tree
   * decomposition part of APTED.
   *
   * @return current subtree root node.
   * @java NodeIndexer.getCurrentNode()
   */
  public getCurrentNode(): number {
    return this.currentNode;
  }

  /**
   * Stores the root node's preorder id of the currently processed subtree.
   *
   * @param preorder preorder id of the root node.
   * @java NodeIndexer.setCurrentNode(int)
   */
  public setCurrentNode(preorder: number): void {
    this.currentNode = preorder;
  }
}
