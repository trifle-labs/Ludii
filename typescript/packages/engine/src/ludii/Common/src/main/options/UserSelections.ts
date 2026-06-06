// @java Common/src/main/options/UserSelections.java

/**
 * Record of the user's option and ruleset selections.
 *
 * @java main/options/UserSelections.java
 * @author cambolbro and Dennis Soemers
 */

/** @java main.Constants.UNDEFINED */
const UNDEFINED = -1;

export class UserSelections {
  /** Record of user's current option selections. @java UserSelections.selectedOptionStrings */
  private selectedOptionStringsVal: string[];

  /** Record of user's current ruleset selection. @java UserSelections.ruleset */
  private rulesetVal: number = UNDEFINED;

  // --------------------------------------------------------------------------

  /** @java UserSelections(List<String>) */
  public constructor(selectedOptionStrings: string[]) {
    this.selectedOptionStringsVal = selectedOptionStrings;
  }

  // --------------------------------------------------------------------------

  /**
   * @return List of Strings describing option selections.
   * @java UserSelections.selectedOptionStrings()
   */
  public selectedOptionStrings(): string[] {
    return this.selectedOptionStringsVal;
  }

  /**
   * Sets the array of user option selections.
   * @java UserSelections.setSelectOptionStrings(List<String>)
   */
  public setSelectOptionStrings(optionSelections: string[]): void {
    this.selectedOptionStringsVal = optionSelections;
  }

  /** @java UserSelections.ruleset() */
  public ruleset(): number {
    return this.rulesetVal;
  }

  /** @java UserSelections.setRuleset(int) */
  public setRuleset(set: number): void {
    this.rulesetVal = set;
  }

  // --------------------------------------------------------------------------
}
