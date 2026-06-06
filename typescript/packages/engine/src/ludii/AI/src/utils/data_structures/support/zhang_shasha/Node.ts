// @java AI/src/utils/data_structures/support/zhang_shasha/Node.java

/**
 * Code originally from: https://github.com/ijkilchenko/ZhangShasha
 *
 * Afterwards modified for style / various improvements
 *
 * @java utils.data_structures.support.zhang_shasha.Node
 * @author Dennis Soemers
 */
export class Node {

  /** Label of this node. @java Node.label */
  public label: string = "";

  /** Index of this node for pre-order traversal of tree. @java Node.index */
  public index: number = 0;

  // note: trees need not be binary

  /** List of children. @java Node.children */
  public children: Node[] = [];

  /** Leftmost node in subtree rooted in this node (or this node if it's a leaf). @java Node.leftmost */
  public leftmost: Node | null = null;   // Used by the recursive O(n) leftmost() function

  /**
   * Constructor.
   * @java Node()
   */
  constructor();

  /**
   * Constructor.
   * @param label
   * @java Node(String)
   */
  constructor(label: string);

  constructor(label?: string) {
    if (label !== undefined) {
      this.label = label;
    }
  }
}
