// @java Core/src/game/functions/booleans/is/IsTreeType.java

/**
 * Defines the types of Is test for a tree / spanning tree.
 * @java game.functions.booleans.is.IsTreeType
 */
export enum IsTreeType {
  /** To check if the induced graph (by adding or deleting edges) is a tree. */
  Tree = "Tree",

  /**
   * To check if the induced graph (by adding or deleting edges) is a spanning
   * tree or not.
   */
  SpanningTree = "SpanningTree",

  /**
   * To check if the induced graph (by adding or deleting edges) is the largest
   * caterpillar Tree or not.
   */
  CaterpillarTree = "CaterpillarTree",

  /** To check whether the last vertex is the centre of the tree (or sub tree). */
  TreeCentre = "TreeCentre",
}
