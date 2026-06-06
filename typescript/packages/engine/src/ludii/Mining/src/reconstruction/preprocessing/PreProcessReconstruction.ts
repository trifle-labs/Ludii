// @java Mining/src/reconstruction/preprocessing/PreProcessReconstruction.java

import { ComputeCommonExpectedConcepts } from "./ComputeCommonExpectedConcepts.js";

// Escape-hatch: FormatRulesetAndIdOnOneLine not yet ported
type FormatRulesetAndIdOnOneLineLike = {
  generateCSV(): void;
};

/**
 * Run the preprocessing steps of the recons process (not the CSN generation).
 *
 * @java reconstruction.preprocessing.PreProcessReconstruction
 * @author Eric.Piette
 */
export class PreProcessReconstruction {

  /**
   * @java PreProcessReconstruction.main(String[])
   */
  public static main(_args: string[]): void {
    console.log("********** Generate all the complete ruleset description on a single line **********");

    // Escape-hatch: FormatRulesetAndIdOnOneLine not yet ported
    const FormatRulesetAndIdOnOneLine: FormatRulesetAndIdOnOneLineLike | undefined =
      (globalThis as unknown as { FormatRulesetAndIdOnOneLine?: FormatRulesetAndIdOnOneLineLike }).FormatRulesetAndIdOnOneLine;

    if (FormatRulesetAndIdOnOneLine)
      FormatRulesetAndIdOnOneLine.generateCSV();
    else
      console.warn("FormatRulesetAndIdOnOneLine not available (not yet ported).");

    console.log("********** Generate avg true concepts between recons and complete rulesets **********");
    ComputeCommonExpectedConcepts.generateCSVs();
  }
}
