// @java Common/src/main/options/Ruleset.java

/**
 * Record of an "(option ...)" instance (Ruleset).
 *
 * @java main/options/Ruleset.java
 * @author cambolbro and Dennis Soemers and Eric.Piette and Matthew.Stephenson
 */

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

export class Ruleset {
  /**
   * Heading for this ruleset as it appears in the menu.
   * @java Ruleset.heading
   */
  private headingVal: string | null = null;

  /** List of option selections for this rule set. @java Ruleset.optionSettings */
  private readonly optionSettingsVal: string[] = [];

  /** Map between option header and option tags. @java Ruleset.variations */
  private readonly variationsVal: Map<string, string[]> = new Map();

  /** Ruleset's priority. @java Ruleset.priority */
  private priorityVal: number = 0;

  // --------------------------------------------------------------------------

  /** @java Ruleset(String) */
  public constructor(str: string) {
    try {
      this.interpret(str);
    } catch (e) {
      console.error(e);
    }
  }

  // --------------------------------------------------------------------------

  /** @java Ruleset.heading() */
  public heading(): string | null {
    return this.headingVal;
  }

  /**
   * @return List of options that this ruleset selects.
   * @java Ruleset.optionSettings()
   */
  public optionSettings(): readonly string[] {
    return this.optionSettingsVal;
  }

  /**
   * @return Map of allowed option variations within this ruleset for each option header.
   * @java Ruleset.variations()
   */
  public variations(): Map<string, string[]> {
    return this.variationsVal;
  }

  /**
   * @return The priority.
   * @java Ruleset.priority()
   */
  public priority(): number {
    return this.priorityVal;
  }

  // --------------------------------------------------------------------------

  /**
   * Interprets ruleset from a given string.
   * @java Ruleset.interpret(String)
   */
  private interpret(strIn: string): void {
    let str = String(strIn).trim();

    // Extract priority (number of asterisks appended)
    this.priorityVal = 0;
    while (str.charAt(str.length - 1) === '*') {
      this.priorityVal++;
      str = str.substring(0, str.length - 1);
    }

    // Strip off opening and closing chars
    const c0 = str.indexOf("(ruleset ");
    if (c0 < 0) throw new Error("Ruleset not found: " + str);

    const cc0 = matchingBracketAt(str, c0);
    if (cc0 < 0) throw new Error("No closing bracket ')' in ruleset: " + str);

    str = this.extractVariations(str);

    // Extract menu heading
    let c = str.indexOf('"');
    if (c < 0) throw new Error("Ruleset heading not found: " + str);

    let cc = c + 1;
    while (cc < str.length && (str.charAt(cc) !== '"' || str.charAt(cc - 1) === '\\')) cc++;
    if (cc < 0) throw new Error("No closing quote for ruleset heading: " + str);

    this.headingVal = str.substring(c + 1, cc);

    // Move past heading string
    str = str.substring(cc + 1).trim();

    // Extract option settings
    while (true) {
      c = str.indexOf('"');
      if (c < 0) break;

      cc = c + 1;
      while (cc < str.length && str.charAt(cc) !== '"') cc++;
      if (cc < 0) throw new Error("No closing quote for option setting: " + str);

      const option = str.substring(c + 1, cc);
      this.optionSettingsVal.push(option);

      str = str.substring(cc + 1).trim();
    }

    // Add the default tags to the possible variations tags.
    for (const variation of this.optionSettingsVal) {
      const slashIdx = variation.indexOf('/');
      const header = variation.substring(0, slashIdx);
      const tag = variation.substring(slashIdx + 1);
      if (this.variationsVal.has(header)) {
        this.variationsVal.get(header)!.unshift(tag);
      }
    }
  }

  // --------------------------------------------------------------------------

  /**
   * Extracts variations section from string and populates variationsVal.
   * @java Ruleset.extractVariations(String)
   */
  private extractVariations(strIn: string): string {
    const vars: string[] = [];

    const varAt = strIn.indexOf("variations:");
    if (varAt === -1) return strIn;

    let openAt = varAt + 11;
    while (openAt < strIn.length && strIn.charAt(openAt) !== '{') openAt++;

    if (openAt >= strIn.length) throw new Error("No opening bracket for ruleset variations: " + strIn);

    const closeAt = matchingBracketAt(strIn, openAt);
    if (closeAt === -1) throw new Error("No closing bracket for ruleset variations: " + strIn);

    let c = openAt + 1;

    // Extract ruleset variations
    while (true) {
      c = strIn.indexOf('"', c);
      if (c < 0) break;

      let cc = c + 1;
      while (cc < strIn.length && strIn.charAt(cc) !== '"') cc++;
      if (cc < 0) throw new Error("No closing quote for option variation: " + strIn.substring(c));

      const varn = strIn.substring(c + 1, cc);
      vars.push(varn);

      c = cc + 1;
    }

    // Get the map of variations according to each header.
    for (const variation of vars) {
      const slashIdx = variation.indexOf('/');
      const header = variation.substring(0, slashIdx);
      const tag = variation.substring(slashIdx + 1);
      if (!this.variationsVal.has(header)) {
        this.variationsVal.set(header, []);
      }
      this.variationsVal.get(header)!.push(tag);
    }

    // Return string with variations section removed
    return strIn.substring(0, varAt) + strIn.substring(closeAt + 1);
  }

  // --------------------------------------------------------------------------

  /**
   * @return List of all option string lists (optionSettings) that this ruleset can have.
   * @java Ruleset.allOptionSettings()
   */
  public allOptionSettings(): string[][] {
    let allOptionSettings: string[][] = [];

    if (this.variationsVal.size === 0) {
      allOptionSettings.push(this.optionSettings() as string[]);
    } else {
      allOptionSettings.push([]);
      for (const [optionHeader, variations] of this.variationsVal) {
        const nextOptionSettings: string[][] = [];
        for (const optionSetting of allOptionSettings) {
          for (let i = 0; i < variations.length; i++) {
            const newOptionSetting = [...optionSetting];
            newOptionSetting.push(optionHeader + "/" + variations[i]);
            nextOptionSettings.push(newOptionSetting);
          }
        }
        allOptionSettings = [...nextOptionSettings];
      }
    }

    return allOptionSettings;
  }

  // --------------------------------------------------------------------------

  /** @java Ruleset.toString() */
  public toString(): string {
    let sb = "[\"" + this.headingVal + "\" {";
    for (const option of this.optionSettingsVal) {
      sb += " \"" + option + "\"";
    }
    sb += " }]";
    return sb;
  }

  // --------------------------------------------------------------------------
}
