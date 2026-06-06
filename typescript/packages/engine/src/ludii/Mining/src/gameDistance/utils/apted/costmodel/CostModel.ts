// @java Mining/src/gameDistance/utils/apted/costmodel/CostModel.java

/* MIT License
 * Copyright (c) 2017 Mateusz Pawlik
 */

// Not-yet-ported dependency escape-hatch: Node<D> from batch 45
type NodeLike<D> = { getNodeData(): D };

/**
 * This interface specifies the methods to implement for a custom cost model.
 * The methods represent the costs of edit operations (delete, insert, rename).
 *
 * <p>If the cost function is a metric, the tree edit distance is a metric too.
 *
 * <p>However, the cost function does not have to be a metric - the costs of
 * deletion, insertion and rename can be arbitrary.
 *
 * <p>IMPORTANT: Mind the <b>float</b> type use for costs.
 *
 * @param D type of node data on which the cost model is defined.
 * @java gameDistance.utils.apted.costmodel.CostModel
 */
export interface CostModel<D> {

  /**
   * Calculates the cost of deleting a node.
   *
   * @param n the node considered to be deleted.
   * @return the cost of deleting node n.
   * @java CostModel.del(Node)
   */
  del(n: NodeLike<D>): number;

  /**
   * Calculates the cost of inserting a node.
   *
   * @param n the node considered to be inserted.
   * @return the cost of inserting node n.
   * @java CostModel.ins(Node)
   */
  ins(n: NodeLike<D>): number;

  /**
   * Calculates the cost of renaming (mapping) two nodes.
   *
   * @param n1 the source node of rename.
   * @param n2 the destination node of rename.
   * @return the cost of renaming (mapping) node n1 to n2.
   * @java CostModel.ren(Node, Node)
   */
  ren(n1: NodeLike<D>, n2: NodeLike<D>): number;
}

export type { NodeLike };
