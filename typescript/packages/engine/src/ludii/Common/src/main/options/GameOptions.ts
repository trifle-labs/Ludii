// @java Common/src/main/options/GameOptions.java

/**
 * Maintains a list of game option categories, with the current user selection
 * for each.
 *
 * @java main/options/GameOptions.java
 * @author cambolbro and mrraow
 */

import { DuplicateOptionUseException } from "../../exception/DuplicateOptionUseException.js";
import { UnusedOptionException } from "../../exception/UnusedOptionException.js";
import { type IOption } from "./OptionCategory.js";
import { OptionCategory } from "./OptionCategory.js";

/** @java main.Constants.UNDEFINED */
const UNDEFINED = -1;

export class GameOptions {
  /** Maximum number of option categories. @java GameOptions.MAX_OPTION_CATEGORIES */
  public static readonly MAX_OPTION_CATEGORIES: number = 10;

  /** List of option categories. @java GameOptions.categories */
  private readonly categoriesVal: OptionCategory[] = [];

  /** Whether options have been loaded for this Game instance. @java GameOptions.optionsLoaded */
  private optionsLoadedVal: boolean = false;

  // --------------------------------------------------------------------------

  /** @java GameOptions.categories() */
  public categories(): readonly OptionCategory[] {
    return this.categoriesVal;
  }

  /** @java GameOptions.optionsLoaded() */
  public optionsLoaded(): boolean {
    return this.optionsLoadedVal;
  }

  /** @java GameOptions.setOptionsLoaded(boolean) */
  public setOptionsLoaded(set: boolean): void {
    this.optionsLoadedVal = set;
  }

  /** @java GameOptions.setOptionCategories(List<Option>[]) */
  public setOptionCategories(optionsAvList: readonly (readonly IOption[])[]): void {
    this.categoriesVal.length = 0;
    for (let n = 0; n < optionsAvList.length; n++) {
      this.categoriesVal.push(new OptionCategory(optionsAvList[n] as IOption[]));
    }
    this.optionsLoadedVal = true;
  }

  // --------------------------------------------------------------------------

  /** @java GameOptions.clear() */
  public clear(): void {
    this.categoriesVal.length = 0;
    this.optionsLoadedVal = false;
  }

  // --------------------------------------------------------------------------

  /**
   * @return The number of option categories we have.
   * @java GameOptions.numCategories()
   */
  public numCategories(): number {
    return this.categoriesVal.length;
  }

  // --------------------------------------------------------------------------

  /**
   * Add this option to the relevant option category, else create a new category.
   * @java GameOptions.add(Option)
   */
  public add(option: IOption): void;
  /**
   * Add an option category directly.
   * @java GameOptions.add(OptionCategory)
   */
  public add(category: OptionCategory): void;
  public add(arg: IOption | OptionCategory): void {
    if (arg instanceof OptionCategory) {
      this.categoriesVal.push(arg);
      return;
    }
    const option = arg as IOption;
    for (const category of this.categoriesVal) {
      if (option.tag() === category.tag()) {
        category.add(option);
        return;
      }
    }
    // Start a new option category
    const category = new OptionCategory(option);
    this.categoriesVal.push(category);
  }

  // --------------------------------------------------------------------------

  /**
   * @param selectedOptionStrings Strings for current option string selections.
   * @return An int array with for each option category, the index of the
   *   current option within that category.
   * @java GameOptions.computeOptionSelections(List<String>)
   */
  public computeOptionSelections(selectedOptionStrings: string[]): number[] {
    const optionSelections = new Array<number>(this.numCategories()).fill(UNDEFINED);
    const usedOptionStrings = new Array<boolean>(selectedOptionStrings.length).fill(false);

    for (let cat = 0; cat < this.categoriesVal.length; cat++) {
      const category = this.categoriesVal[cat]!;

      let maxPriority = Number.MIN_SAFE_INTEGER;
      let activeOptionIdx: number = UNDEFINED;
      for (let i = 0; i < category.options().length; i++) {
        const option = category.options()[i]!;
        const optionStr = option.menuHeadings().join("/");

        const optionStrIndex = selectedOptionStrings.indexOf(optionStr);
        if (optionStrIndex >= 0) {
          if (usedOptionStrings[optionStrIndex]) throw new DuplicateOptionUseException(optionStr);
          usedOptionStrings[optionStrIndex] = true;
          activeOptionIdx = i;
          break;
        }

        if (option.priority() > maxPriority) {
          activeOptionIdx = i;
          maxPriority = option.priority();
        }
      }

      optionSelections[cat] = activeOptionIdx;
    }

    for (let i = 0; i < usedOptionStrings.length; ++i) {
      if (!usedOptionStrings[i]) throw new UnusedOptionException(selectedOptionStrings[i]!);
    }

    return optionSelections;
  }

  /**
   * @param selectedOptionStrings Strings of explicitly selected options.
   * @return A list of strings for ALL active options.
   * @java GameOptions.allOptionStrings(List<String>)
   */
  public allOptionStrings(selectedOptionStrings: string[]): string[] {
    const strings: string[] = [];
    const usedOptionStrings = new Array<boolean>(selectedOptionStrings.length).fill(false);

    for (let cat = 0; cat < this.categoriesVal.length; cat++) {
      const category = this.categoriesVal[cat]!;

      let maxPriority = Number.MIN_SAFE_INTEGER;
      let activeOptionStr: string | null = null;
      for (let i = 0; i < category.options().length; i++) {
        const option = category.options()[i]!;
        const optionStr = option.menuHeadings().join("/");

        const optionStrIndex = selectedOptionStrings.indexOf(optionStr);
        if (optionStrIndex >= 0) {
          if (usedOptionStrings[optionStrIndex]) throw new DuplicateOptionUseException(optionStr);
          usedOptionStrings[optionStrIndex] = true;
          activeOptionStr = optionStr;
          break;
        }

        if (option.priority() > maxPriority) {
          activeOptionStr = optionStr;
          maxPriority = option.priority();
        }
      }

      strings.push(activeOptionStr as string);
    }

    for (let i = 0; i < usedOptionStrings.length; ++i) {
      if (!usedOptionStrings[i]) throw new UnusedOptionException(selectedOptionStrings[i]!);
    }

    return strings;
  }

  /**
   * @param optionString
   * @return True if an option described by the given String exists.
   * @java GameOptions.optionExists(String)
   */
  public optionExists(optionString: string): boolean {
    for (let cat = 0; cat < this.categoriesVal.length; cat++) {
      const category = this.categoriesVal[cat]!;
      for (let i = 0; i < category.options().length; i++) {
        const option = category.options()[i]!;
        const optionStr = option.menuHeadings().join("/");
        if (optionString === optionStr) return true;
      }
    }
    return false;
  }

  /**
   * @param optionSelections
   * @return List of strings describing selected options in int-array format.
   * @java GameOptions.toStrings(int[])
   */
  public toStrings(optionSelections: number[]): string[] {
    const strings: string[] = [];
    for (let cat = 0; cat < this.categoriesVal.length; cat++) {
      const category = this.categoriesVal[cat]!;
      const selection = optionSelections[cat]!;
      const option = category.options()[selection]!;
      const headings = option.menuHeadings();
      strings.push(headings.join("/"));
    }
    return strings;
  }

  /**
   * @param selectedOptionStrings List of Strings describing explicitly-selected options.
   * @return List of Option objects for all active objects.
   * @java GameOptions.activeOptionObjects(List<String>)
   */
  public activeOptionObjects(selectedOptionStrings: string[]): IOption[] {
    const options: IOption[] = new Array(this.numCategories());
    const selections = this.computeOptionSelections(selectedOptionStrings);
    for (let i = 0; i < this.categoriesVal.length; ++i) {
      const category = this.categoriesVal[i]!;
      options[i] = category.options()[selections[i]!]!;
    }
    return options;
  }

  // --------------------------------------------------------------------------

  /** @java GameOptions.toString() */
  public toString(): string {
    let sb = "";
    for (const category of this.categoriesVal) {
      sb += category.toString() + "\n";
    }
    return sb;
  }

  // --------------------------------------------------------------------------
}
