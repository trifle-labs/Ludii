// @java Common/src/main/options/Option.java

/**
 * Record of an "(option ...)" instance.
 *
 * @java main/options/Option.java
 * @author cambolbro
 */

import { OptionArgument } from "./OptionArgument.js";
import { OptionCategory, type IOption } from "./OptionCategory.js";

// Minimal StringRoutines.matchingBracketAt shim
// @java main.StringRoutines
function matchingBracketAt(str: string, from: number, doNesting = true): number {
  const brackets: [string, string][] = [
    ["(", ")"],
    ["{", "}"],
    ["[", "]"],
    ["<", ">"],
  ];
  const ch = str.charAt(from);
  const pair = brackets.find(([o]) => o === ch);
  if (!pair) return -1;
  const [open, close] = pair;
  let depth = 0;
  let inString = false;
  for (let c = from; c < str.length; c++) {
    const chB = str.charAt(c);
    if (chB === '"') inString = !inString;
    if (!inString) {
      const chA = c === 0 ? '?' : str.charAt(c - 1);
      if (chB === open) {
        if (chA !== '(' || chB !== '<') depth++;
      } else if (chB === close) {
        if (chA !== '(' || chB !== '>') {
          if (!doNesting) return c;
          depth--;
        }
      }
    }
    if (depth === 0) return c;
  }
  return -1;
}

export class Option implements IOption {
  /**
   * Tag for this option used to identify it in the game description.
   * @java Option.tag
   */
  private tagVal: string = "";

  /** Description for showing in help etc. @java Option.description */
  private descriptionVal: string = "";

  /** List of arguments for this option. @java Option.arguments */
  private readonly argumentsVal: OptionArgument[] = [];

  /**
   * Headings to be shown in the menu, split by level of nesting.
   * @java Option.headings
   */
  private headingsVal: string[] = [];

  /** Option's priority within its category. @java Option.priority */
  private priorityVal: number = 0;

  // --------------------------------------------------------------------------

  /**
   * @java Option(String, OptionCategory)
   */
  public constructor(str: string, category: OptionCategory);
  /**
   * Default constructor.
   * @java Option()
   */
  public constructor();
  public constructor(str?: string, category?: OptionCategory) {
    if (str !== undefined && category !== undefined) {
      try {
        this.interpret(str, category);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // --------------------------------------------------------------------------

  /** @java Option.tag() */
  public tag(): string {
    return this.tagVal;
  }

  /** @java Option.description() */
  public description(): string {
    return this.descriptionVal;
  }

  /** @java Option.menuHeadings() */
  public menuHeadings(): readonly string[] {
    return this.headingsVal.slice();
  }

  /** @java Option.setHeadings(List<String>) */
  public setHeadings(headings: string[]): void {
    this.headingsVal = headings;
  }

  /** @java Option.arguments() */
  public arguments(): readonly OptionArgument[] {
    return this.argumentsVal.slice();
  }

  /** @java Option.priority() */
  public priority(): number {
    return this.priorityVal;
  }

  // --------------------------------------------------------------------------

  /**
   * Interprets options from a given string in the new format, based on its category.
   * @java Option.interpret(String, OptionCategory)
   */
  public interpret(strIn: string, category: OptionCategory): void {
    // New format:  ("2x2" <2 2>  <4>  <2> "Played on a square 2x2 board.")
    let str = strIn.trim();

    if (!str.includes("(item ") || !str.includes(")"))
      throw new Error("Option not bracketed properly: " + str);

    this.tagVal = category.tag();

    // Extract priority (number of asterisks appended)
    this.priorityVal = 0;
    while (str.charAt(str.length - 1) === '*') {
      this.priorityVal++;
      str = str.substring(0, str.length - 1);
    }
    str = str.substring(1, str.length - 1).trim();

    // Extract option heading
    let c = str.indexOf('"');
    if (c < 0) throw new Error("Failed to find option heading: " + str);

    let cc = c + 1;
    while (cc < str.length && str.charAt(cc) !== '"') cc++;
    if (cc < 0 || cc >= str.length) throw new Error("Failed to find option heading: " + str);

    const heading = str.substring(c + 1, cc);
    this.headingsVal.push(String(category.heading()));
    this.headingsVal.push(heading);

    str = str.substring(cc + 1).trim();

    // Extract option description (search backwards from end)
    cc = str.length - 1;
    while (cc >= 0 && str.charAt(cc) !== '"') cc--;
    if (cc < 0) throw new Error("Failed to find option description: " + str);

    c = cc - 1;
    while (c >= 0 && str.charAt(c) !== '"') c--;
    if (c < 0) throw new Error("Failed to find option description: " + str);

    this.descriptionVal = str.substring(c + 1, cc);

    str = str.substring(0, c).trim();

    // Extract option arguments
    const argTags = category.argTags();
    while (true) {
      c = str.indexOf("<");
      if (c < 0) break;

      if (c > 0 && str.charAt(c - 1) === '(') {
        // Is an embedded alias "(< a b)" or "(<= a b)"
        str = str.substring(c + 1).trim();
        continue;
      }

      cc = matchingBracketAt(str, c, false);
      if (cc < 0 || cc >= str.length) throw new Error("No closing bracket '>' for option argument: " + str);
      cc++;

      const arg = (c + 1 >= cc - 1) ? "" : str.substring(c + 1, cc - 1);

      if (argTags !== null && this.argumentsVal.length >= argTags.length) {
        throw new Error("Not enough tags for option arguments: " + strIn);
      }

      const name = (argTags !== null) ? argTags[this.argumentsVal.length] : null;
      const optArg = new OptionArgument(name ?? null, arg);
      this.argumentsVal.push(optArg);

      str = str.substring(cc).trim();
    }
  }

  // --------------------------------------------------------------------------

  /** @java Option.toString() */
  public toString(): string {
    let sb = "[" + this.tagVal + ", \"";
    for (let n = 0; n < this.headingsVal.length; n++) {
      if (n > 0) sb += "/";
      sb += this.headingsVal[n];
    }
    sb += "\",";
    for (const arg of this.argumentsVal) {
      sb += " ";
      if (arg.name() !== null) sb += arg.name() + ":";
      sb += "<" + arg.expression() + ">";
    }
    sb += ", priority " + this.priorityVal + "]";
    return sb;
  }

  // --------------------------------------------------------------------------
}

// Register the factory in OptionCategory so it can create Option instances
// without a direct circular import.
OptionCategory._optionFactory = (str: string, category: OptionCategory): IOption => {
  return new Option(str, category);
};
