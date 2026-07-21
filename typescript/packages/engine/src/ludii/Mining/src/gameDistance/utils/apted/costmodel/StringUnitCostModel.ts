// @java Mining/src/gameDistance/utils/apted/costmodel/StringUnitCostModel.java

/* MIT License
 * Copyright (c) 2017 Mateusz Pawlik
 */

import type { CostModel, NodeLike } from "./CostModel.js";

// Not-yet-ported dependency escape-hatch: StringNodeData (batch 45)
type StringNodeData = { getLabel(): string };

/**
 * This is a unit-cost model defined on string labels.
 *
 * @see CostModel
 * @java gameDistance.utils.apted.costmodel.StringUnitCostModel
 */
// TODO: Use a label dictionary to encode string labels with integers for
//       faster rename cost computation.
export class StringUnitCostModel implements CostModel<StringNodeData> {

  /**
   * Calculates the cost of deleting a node.
   *
   * @param n a node considered to be deleted.
   * @return {@code 1} - a fixed cost of deleting a node.
   * @java StringUnitCostModel.del(Node)
   */
  public del(_n: NodeLike<StringNodeData>): number {
    return 1.0;
  }

  /**
   * Calculates the cost of inserting a node.
   *
   * @param n a node considered to be inserted.
   * @return {@code 1} - a fixed cost of inserting a node.
   * @java StringUnitCostModel.ins(Node)
   */
  public ins(_n: NodeLike<StringNodeData>): number {
    return 1.0;
  }

  /**
   * Calculates the cost of renaming the label of the source node to the label
   * of the destination node.
   *
   * @param n1 a source node for rename.
   * @param n2 a destination node for rename.
   * @return {@code 1} if labels of renamed nodes are equal, and {@code 0} otherwise.
   * @java StringUnitCostModel.ren(Node, Node)
   */
  public ren(n1: NodeLike<StringNodeData>, n2: NodeLike<StringNodeData>): number {
    return (n1.getNodeData().getLabel() === n2.getNodeData().getLabel()) ? 0.0 : 1.0;
  }
}
