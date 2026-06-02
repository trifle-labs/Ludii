// @java Core/src/metadata/ai/features/trees/classifiers/If.java

import type { DecisionTreeNode } from "./DecisionTreeNode.js";
import { DecisionTreeNode as DecisionTreeNodeBase } from "./DecisionTreeNode.js";

/** @internal indent helper */
function indentStr(spaces: number, indent: number): string {
  return " ".repeat(spaces * indent);
}

/**
 * Describes a decision node in a decision tree for features; it contains one
 * feature (the condition we check), and two branches; one for the case
 * where the condition is true, and one for the case where the condition is false.
 *
 * @author Dennis Soemers
 */
export class If extends DecisionTreeNodeBase {
  /** String description of the feature we want to evaluate as condition */
  protected readonly feature: string;

  /** Node we navigate to when the condition is satisfied */
  protected readonly thenNode: DecisionTreeNode;

  /** Node we navigate to when condition is not satisfied */
  protected readonly elseNode: DecisionTreeNode;

  // -------------------------------------------------------------------------

  /**
   * Defines the feature (condition), and the two branches.
   * @param feature The feature to evaluate (the condition).
   * @param then The branch to take if the feature is active.
   * @param Else The branch to take if the feature is not active.
   *
   * @example (if "rel:to=<{}>:pat=<els=[f{0}]>" then:(leaf bottom25:0.0 iqr:0.2 top25:0.8) else:(leaf bottom25:0.6 iqr:0.35 top25:0.05))
   */
  constructor(feature: string, thenNode: DecisionTreeNode, elseNode: DecisionTreeNode) {
    super();
    this.feature = feature;
    this.thenNode = thenNode;
    this.elseNode = elseNode;
  }

  // -------------------------------------------------------------------------

  override collectFeatureStrings(outFeatureStrings: Set<string>): void {
    outFeatureStrings.add(this.feature);
    this.thenNode.collectFeatureStrings(outFeatureStrings);
    this.elseNode.collectFeatureStrings(outFeatureStrings);
  }

  // -------------------------------------------------------------------------

  /** @return String of our feature */
  featureString(): string {
    return this.feature;
  }

  /** @return Node we traverse to if condition holds */
  getThenNode(): DecisionTreeNode {
    return this.thenNode;
  }

  /** @return Node we traverse to if condition does not hold */
  getElseNode(): DecisionTreeNode {
    return this.elseNode;
  }

  // -------------------------------------------------------------------------

  override toString(): string {
    return this.toStringIndented(0);
  }

  override toStringIndented(indent: number): string {
    const outerIndent = indentStr(4, indent);
    const innerIndent = indentStr(4, indent + 1);
    let sb = `(if "${this.feature}"\n`;
    sb += innerIndent + "then:" + this.thenNode.toStringIndented(indent + 1) + "\n";
    sb += innerIndent + "else:" + this.elseNode.toStringIndented(indent + 1) + "\n";
    sb += outerIndent + ")";
    return sb;
  }
}
