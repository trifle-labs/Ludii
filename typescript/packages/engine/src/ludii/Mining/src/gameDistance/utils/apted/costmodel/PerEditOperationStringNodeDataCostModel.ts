// @java Mining/src/gameDistance/utils/apted/costmodel/PerEditOperationStringNodeDataCostModel.java

/* MIT License
 * Copyright (c) 2017 Mateusz Pawlik
 */

import type { CostModel, NodeLike } from "./CostModel.js";

// Not-yet-ported dependency escape-hatch: StringNodeData (batch 45)
type StringNodeData = { getLabel(): string };

/**
 * This is a cost model defined with a fixed cost per edit operation.
 *
 * @java gameDistance.utils.apted.costmodel.PerEditOperationStringNodeDataCostModel
 */
export class PerEditOperationStringNodeDataCostModel implements CostModel<StringNodeData> {

  /**
   * Stores the cost of deleting a node.
   * @java PerEditOperationStringNodeDataCostModel.delCost
   */
  private readonly delCost: number;

  /**
   * Stores the cost of inserting a node.
   * @java PerEditOperationStringNodeDataCostModel.insCost
   */
  private readonly insCost: number;

  /**
   * Stores the cost of mapping two nodes (renaming their labels).
   * @java PerEditOperationStringNodeDataCostModel.renCost
   */
  private readonly renCost: number;

  /**
   * Initialises the cost model with the passed edit operation costs.
   *
   * @param delCost deletion cost.
   * @param insCost insertion cost.
   * @param renCost rename cost.
   * @java PerEditOperationStringNodeDataCostModel(float, float, float)
   */
  public constructor(delCost: number, insCost: number, renCost: number) {
    this.delCost = delCost;
    this.insCost = insCost;
    this.renCost = renCost;
  }

  /**
   * Calculates the cost of deleting a node.
   *
   * @param n the node considered to be deleted.
   * @return the cost of deleting node n.
   * @java PerEditOperationStringNodeDataCostModel.del(Node)
   */
  public del(_n: NodeLike<StringNodeData>): number {
    return this.delCost;
  }

  /**
   * Calculates the cost of inserting a node.
   *
   * @param n the node considered to be inserted.
   * @return the cost of inserting node n.
   * @java PerEditOperationStringNodeDataCostModel.ins(Node)
   */
  public ins(_n: NodeLike<StringNodeData>): number {
    return this.insCost;
  }

  /**
   * Calculates the cost of renaming the string labels of two nodes.
   *
   * @param n1 the source node of rename.
   * @param n2 the destination node of rename.
   * @return the cost of renaming node n1 to n2.
   * @java PerEditOperationStringNodeDataCostModel.ren(Node, Node)
   */
  public ren(n1: NodeLike<StringNodeData>, n2: NodeLike<StringNodeData>): number {
    return (n1.getNodeData().getLabel() === n2.getNodeData().getLabel()) ? 0.0 : this.renCost;
  }
}
