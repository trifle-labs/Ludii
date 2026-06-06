// @java Common/src/main/grammar/ebnf/EBNF.java

import { EBNFRule } from "./EBNFRule.js";

/**
 * EBNF style interpreter for grammar.
 *
 * @java main/grammar/ebnf/EBNF.java
 * @author cambolbro
 */
export class EBNF {
  /** @java EBNF.rules */
  private readonly _rules: Map<string, EBNFRule> = new Map<string, EBNFRule>();

  // -------------------------------------------------------------------------

  /**
   * @java EBNF(String)
   */
  public constructor(grammar: string) {
    this.interpret(grammar);
  }

  // -------------------------------------------------------------------------

  /** @java EBNF.rules() */
  public rules(): ReadonlyMap<string, EBNFRule> {
    return this._rules;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Whether the given string is a terminal symbol, typically int, boolean, float, string.
   *
   * @java EBNF.isTerminal(String)
   */
  public static isTerminal(token: string): boolean {
    return (
      token.charAt(0) !== "<" &&
      token.charAt(token.length - 1) !== ">" &&
      !token.trim().includes(" ")
    );
  }

  // -------------------------------------------------------------------------

  /**
   * @java EBNF.interpret(String)
   */
  public interpret(grammar: string): void {
    const split = grammar.trim().split("\n");

    // Remove comments
    for (let n = 0; n < split.length; n++) {
      const c = split[n]!.indexOf("//");
      if (c >= 0) {
        split[n] = split[n]!.substring(0, c);
      }
    }

    // Merge split lines
    for (let n = split.length - 1; n >= 1; n--) {
      const c = split[n]!.indexOf("::=");
      if (c < 0) {
        split[n - 1] = split[n - 1]! + " " + split[n]!.trim();
        split[n] = "";
      }
    }

    for (let n = 0; n < split.length; n++) {
      if (split[n]!.includes("::=")) {
        let strRule = split[n]!;
        while (strRule.includes("  ")) {
          strRule = strRule.replace(/  /g, " ");
        }

        const rule = new EBNFRule(strRule);
        this._rules.set(rule.lhs(), rule);
      }
    }
  }

  // -------------------------------------------------------------------------
}
