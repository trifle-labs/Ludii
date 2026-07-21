// @java Core/src/metadata/ai/features/trees/logits/If.java

import type { LogitNode } from "./LogitNode.js";
import { LogitNode as LogitNodeBase } from "./LogitNode.js";

/** @internal indent helper */
function indentStr(spaces: number, indent: number): string {
  return " ".repeat(spaces * indent);
}

/**
 * Describes a decision node in a logit tree for features; it contains one
 * feature (the condition we check), and two branches; one for the case
 * where the condition is true, and one for the case where the condition is false.
 *
 * @author Dennis Soemers
 */
export class If extends LogitNodeBase {
  /** String description of the feature we want to evaluate as condition */
  protected readonly feature: string;

  /** Node we navigate to when the condition is satisfied */
  protected readonly thenNode: LogitNode;

  /** Node we navigate to when condition is not satisfied */
  protected readonly elseNode: LogitNode;

  // -------------------------------------------------------------------------

  /**
   * Defines the feature (condition), and the two branches.
   * @param feature The feature to evaluate (the condition).
   * @param then The branch to take if the feature is active.
   * @param Else The branch to take if the feature is not active.
   *
   * @example (if "rel:to=<{}>:pat=<els=[f{0}]>" then:(leaf { (pair "Intercept" 1.0) }) else:(leaf { (pair "Intercept" -1.0) }))
   */
  constructor(feature: string, thenNode: LogitNode, elseNode: LogitNode) {
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

  /** @return The feature string */
  featureString(): string {
    return this.feature;
  }

  /** @return The then node */
  getThenNode(): LogitNode {
    return this.thenNode;
  }

  /** @return The else node */
  getElseNode(): LogitNode {
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
