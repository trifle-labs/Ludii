// @java Common/src/main/options/OptionCategory.java

/**
 * Maintains a named category of game options.
 *
 * @java main/options/OptionCategory.java
 * @author cambolbro
 */

import { OptionArgument } from "./OptionArgument.js";

// Forward-declare Option to avoid circular import; the real Option class
// is defined in Option.ts which imports OptionCategory.
// We break the cycle by importing only the type via a local interface.
/** @java main.options.Option (minimal interface for OptionCategory) */
export interface IOption {
  tag(): string;
  menuHeadings(): readonly string[];
  priority(): number;
  arguments(): readonly OptionArgument[];
  description(): string;
  toString(): string;
  // interpret is package-private in Java, exposed here for OptionCategory.
  interpret?(strIn: string, category: OptionCategory): void;
}

// Minimal StringRoutines shim — matchingBracketAt used by extractOptions.
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

export class OptionCategory {
  /** @java OptionCategory.tag */
  private tagVal: string = "";

  /** @java OptionCategory.heading */
  private headingVal: string = "";

  /**
   * List of argument tags; may be null when constructed from Option(s).
   * @java OptionCategory.argTags
   */
  private readonly argTagsVal: string[] | null;

  /** @java OptionCategory.options */
  private optionsVal: IOption[];

  // --------------------------------------------------------------------------

  /**
   * Construct from a raw description string.
   * @java OptionCategory(String)
   */
  public constructor(description: string);
  /**
   * Construct from a single Option.
   * @java OptionCategory(Option)
   */
  public constructor(option: IOption);
  /**
   * Construct from a list of Options.
   * @java OptionCategory(List<Option>)
   */
  public constructor(options: IOption[]);
  public constructor(arg: string | IOption | IOption[]) {
    if (typeof arg === "string") {
      // OptionCategory(String description)
      this.argTagsVal = [];
      this.optionsVal = [];
      try {
        this.extractOptions(arg);
      } catch (e) {
        console.error(e);
      }
    } else if (Array.isArray(arg)) {
      // OptionCategory(List<Option>)
      const options = arg as IOption[];
      this.tagVal = String(options[0]!.tag());
      this.headingVal = String(options[0]!.menuHeadings()[0]);
      this.argTagsVal = null;
      this.optionsVal = options.slice();
    } else {
      // OptionCategory(Option)
      const option = arg as IOption;
      this.tagVal = String(option.tag());
      this.headingVal = String(option.menuHeadings()[0]);
      this.argTagsVal = null;
      this.optionsVal = [option];
    }
  }

  // --------------------------------------------------------------------------

  /** @java OptionCategory.tag() */
  public tag(): string {
    return this.tagVal;
  }

  /** @java OptionCategory.heading() */
  public heading(): string {
    return this.headingVal;
  }

  /** @java OptionCategory.options() */
  public options(): readonly IOption[] {
    return this.optionsVal;
  }

  /** @java OptionCategory.argTags() */
  public argTags(): readonly string[] | null {
    if (this.argTagsVal === null) return null;
    return this.argTagsVal;
  }

  // --------------------------------------------------------------------------

  /** @java OptionCategory.add(Option) */
  public add(option: IOption): void {
    if (this.tagVal !== option.tag()) {
      console.log("** Option label does not match option category label.");
    }
    this.optionsVal.push(option);
  }

  // --------------------------------------------------------------------------

  /**
   * Extract an option set from a raw options description string.
   * @java OptionCategory.extractOptions(String)
   */
  extractOptions(strIn: string): void {
    let str = String(strIn);

    str = this.extractHeading(str);
    str = this.extractTag(str);
    str = this.extractArgTags(str);

    // Extract list of options
    const c0 = str.indexOf('{');
    if (c0 < 0) throw new Error("Couldn't find opening bracket '{' for option list " + str.substring(c0));

    const cc0 = matchingBracketAt(str, c0);
    if (cc0 < 0 || cc0 >= str.length)
      throw new Error("Couldn't close option bracket '>' in " + str.substring(c0));

    let optionList = str.substring(c0 + 1, cc0);

    while (true) {
      const c = optionList.indexOf("(item ");
      if (c < 0) break;

      let cc = matchingBracketAt(optionList, c);
      if (cc < 0 || cc >= optionList.length)
        throw new Error("No closing bracket ')' for option: " + optionList.substring(c));
      cc++;
      while (cc < optionList.length && optionList.charAt(cc) === '*') cc++;

      const optionString = optionList.substring(c, cc);
      // Lazy-import to avoid circular dependency: import Option from Option.ts
      // at call time. In TS we use a dynamic import shim stored via registration.
      const option = OptionCategory._optionFactory(optionString, this);
      this.optionsVal.push(option);

      optionList = optionList.substring(c + 1).trim();
    }
  }

  /**
   * Factory for creating Option instances; injected by Option.ts to break
   * the circular dependency.
   * @java new Option(String, OptionCategory)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static _optionFactory: (str: string, category: OptionCategory) => IOption = (str, category) => {
    // Default no-op; real implementation is set by Option.ts at module load.
    throw new Error("OptionCategory._optionFactory not registered. Import Option.ts first. str=" + str + " cat=" + category.tag());
  };

  // --------------------------------------------------------------------------

  /**
   * @java OptionCategory.extractHeading(String)
   */
  extractHeading(str: string): string {
    let c = 0;
    while (c < str.length && str.charAt(c) !== '"') c++;
    if (c >= str.length) throw new Error("Failed to find option category heading: " + str);

    let cc = c + 1;
    while (cc < str.length && str.charAt(cc) !== '"') cc++;
    if (cc < 0 || cc >= str.length) throw new Error("Failed to find option category heading: " + str);

    this.headingVal = str.substring(c + 1, cc);
    return str.substring(cc + 1);
  }

  /**
   * @java OptionCategory.extractTag(String)
   */
  extractTag(str: string): string {
    const c = str.indexOf('<');
    if (c < 0) throw new Error("Failed to find option category tag: " + str);

    const cc = matchingBracketAt(str, c);
    if (cc < 0 || cc >= str.length) throw new Error("Couldn't close option bracket '>' in " + str.substring(c));

    this.tagVal = str.substring(c + 1, cc);
    return str.substring(cc + 1);
  }

  /**
   * @java OptionCategory.extractArgTags(String)
   */
  extractArgTags(strIn: string): string {
    if (!strIn.includes("args:")) throw new Error("Option category must define args:{...}." + strIn);

    let c = strIn.indexOf("args:");
    if (c < 0) throw new Error("No option argument tags of form args:{...}: " + strIn);

    c = strIn.indexOf("{");
    if (c < 0) throw new Error("Couldn't find opening bracket '{' in option category " + strIn.substring(c));

    const cc = matchingBracketAt(strIn, c);
    if (cc < 0 || cc >= strIn.length) throw new Error("Couldn't find closing bracket '}' in option category " + strIn.substring(c));

    let str = strIn.substring(c, cc).trim();

    const argTagsList = this.argTagsVal as string[];
    while (true) {
      const a = str.indexOf("<");
      if (a < 0) break;

      const aa = matchingBracketAt(str, a);
      if (aa < 0 || aa >= str.length) throw new Error("No closing bracket '>' for option argument: " + str);

      const arg = str.substring(a + 1, aa);
      argTagsList.push(arg);

      str = str.substring(aa + 1).trim();
    }

    return strIn.substring(cc + 1);
  }

  // --------------------------------------------------------------------------

  /** @java OptionCategory.toString() */
  public toString(): string {
    let sb = "<" + this.tagVal + "> \"" + this.headingVal + "\"";
    if (this.argTagsVal !== null) {
      sb += " [ ";
      for (const arg of this.argTagsVal) sb += arg + " ";
      sb += "]";
    }
    return sb;
  }

  // --------------------------------------------------------------------------
}
