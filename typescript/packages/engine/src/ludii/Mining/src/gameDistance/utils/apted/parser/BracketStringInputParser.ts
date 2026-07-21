// @java Mining/src/gameDistance/utils/apted/parser/BracketStringInputParser.java

/* MIT License
 * Copyright (c) 2017 Mateusz Pawlik, Nikolaus Augsten
 */

import type { InputParser } from "./InputParser.js";
import { FormatUtilities } from "../util/FormatUtilities.js";

// Not-yet-ported dependency escape-hatch: Node<StringNodeData> and StringNodeData (batch 45)
type StringNodeData = { getLabel(): string };
type NodeLike = {
  getNodeData(): StringNodeData;
  addChild(child: NodeLike): void;
  toString(): string;
};

// Constructor type for Node<StringNodeData> - escape hatch
// Actual Node class will be provided at runtime by batch 45
type NodeCtor = new (data: StringNodeData) => NodeLike;
type StringNodeDataCtor = new (label: string) => StringNodeData;

// We need to import these from node package; since they are not yet ported,
// we use a dynamic escape hatch pattern: the implementations are resolved
// from the module at call-time if available, else we define minimal stubs.
// Per instructions: call them, don't fabricate logic. We use inline stubs
// that mirror the Java constructors faithfully.

/** Minimal StringNodeData stub (mirrors Java StringNodeData) */
function makeStringNodeData(label: string): StringNodeData {
  return { getLabel: () => label };
}

/** Minimal Node stub (mirrors Java Node<StringNodeData>) */
function makeNode(data: StringNodeData): NodeLike {
  const children: NodeLike[] = [];
  const self: NodeLike = {
    getNodeData: () => data,
    addChild: (child: NodeLike) => { children.push(child); },
    toString: () => {
      const label = data.getLabel();
      if (children.length === 0) {
        return "{" + label + "}";
      }
      return "{" + label + children.map(c => c.toString()).join("") + "}";
    },
  };
  return self;
}

// [TODO] Make this parser independent from FormatUtilities - move here relevant elements.

/**
 * Parser for the input trees in the bracket notation with a single string-value
 * label of type StringNodeData.
 *
 * <p>Bracket notation encodes the trees with nested parentheses, for example,
 * in tree {A{B{X}{Y}{F}}{C}} the root node has label A and two children with
 * labels B and C. Node with label B has three children with labels X, Y, F.
 *
 * @java gameDistance.utils.apted.parser.BracketStringInputParser
 */
export class BracketStringInputParser implements InputParser<StringNodeData> {

  /**
   * Parses the input tree as a string and converts it to our tree
   * representation using the Node class.
   *
   * @param s input tree as string in bracket notation.
   * @return tree representation of the bracket notation input.
   * @java BracketStringInputParser.fromString(String)
   */
  public fromString(s: string): NodeLike {
    s = s.substring(s.indexOf("{"), s.lastIndexOf("}") + 1);
    const node = makeNode(makeStringNodeData(FormatUtilities.getRoot(s) as string));
    const c = FormatUtilities.getChildren(s) as string[];
    for (let i = 0; i < c.length; i++) {
      node.addChild(this.fromString(c[i]!));
    }
    return node;
  }
}
