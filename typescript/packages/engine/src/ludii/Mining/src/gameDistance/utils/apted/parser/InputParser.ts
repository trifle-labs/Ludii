// @java Mining/src/gameDistance/utils/apted/parser/InputParser.java

/* MIT License
 * Copyright (c) 2017 Mateusz Pawlik
 */

// Not-yet-ported dependency escape-hatch: Node<D> from batch 45
type NodeLike<D> = { getNodeData(): D };

/**
 * This interface specifies methods (currently only one) that must be
 * implemented for a custom input parser.
 *
 * @param D the type of node data.
 * @java gameDistance.utils.apted.parser.InputParser
 */
export interface InputParser<D> {

  /**
   * Convert the input tree passed as string (e.g., bracket notation, XML)
   * into the tree structure.
   *
   * @param s input tree as string.
   * @return tree structure.
   * @java InputParser.fromString(String)
   */
  fromString(s: string): NodeLike<D>;
}

export type { NodeLike };
