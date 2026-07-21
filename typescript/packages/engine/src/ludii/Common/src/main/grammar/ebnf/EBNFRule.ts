// @java Common/src/main/grammar/ebnf/EBNFRule.java

import { EBNFClause } from "./EBNFClause.js";

/**
 * EBNF style rule for interpreting grammar.
 *
 * @java main/grammar/ebnf/EBNFRule.java
 * @author cambolbro
 */
export class EBNFRule {
  /** @java EBNFRule.lhs */
  private _lhs: string = "?";

  /** @java EBNFRule.rhs */
  private readonly _rhs: EBNFClause[] = [];

  // -------------------------------------------------------------------------

  /**
   * @java EBNFRule(String)
   */
  public constructor(input: string) {
    this.decompose(input);
  }

  // -------------------------------------------------------------------------

  /** @java EBNFRule.lhs() */
  public lhs(): string {
    return this._lhs;
  }

  /** @java EBNFRule.rhs() */
  public rhs(): readonly EBNFClause[] {
    return this._rhs;
  }

  // -------------------------------------------------------------------------

  /**
   * @java EBNFRule.decompose(String)
   */
  private decompose(input: string): void {
    // Store and trim LHS
    const sides = input.split("::=");
    this._lhs = sides[0]!.trim();

    // Decompose RHS (sides[1])
    let str = sides[1]!.trim();

    // Avoid bad bracket interpretation in <boolean>: "<<> | <<=> | <=> | <>> | >=>"
    str = str.replace(/<<\b/g, "<#");
    str = str.replace(/<>/g, "<@");
    str = str.replace(/<>/g, "#>");
    str = str.replace(/>>/g, "@>");

    if (str.length === 0) {
      console.log("** Empty RHS for rule: " + input);
      return;
    }

    let c = 0;
    let cc: number;
    do {
      if (str.charAt(c) === "(" || str.charAt(c) === "<") {
        cc = matchingBracketAt(str, c);
        if (cc < 0) {
          console.log("** Failed to load clause from: " + str);
          return;
        }
      } else {
        cc = c + 1;
        while (cc < str.length && str.charAt(cc) !== " ") {
          cc++;
        }
      }

      if (cc >= str.length) {
        cc--;
      }

      let strClause = str.substring(c, cc + 1).trim();
      strClause = strClause.replace(/#/g, "<");
      strClause = strClause.replace(/@/g, ">");
      const clause = new EBNFClause(strClause);
      this._rhs.push(clause);

      c = cc + 1;
      while (c < str.length && (str.charAt(c) === " " || str.charAt(c) === "|")) {
        c++;
      }
    } while (c < str.length);
  }

  // -------------------------------------------------------------------------

  /** @java EBNFRule.toString() */
  public toString(): string {
    let sb = "";

    sb += this._lhs;
    sb += " ::= ";
    for (let c = 0; c < this._rhs.length; c++) {
      const clause = this._rhs[c]!;
      if (c > 0) {
        sb += " | ";
      }
      sb += clause.toString();
    }

    return sb;
  }

  // -------------------------------------------------------------------------
}

// -------------------------------------------------------------------------

/**
 * Find the position of the matching closing bracket in the string.
 * Mirrors StringRoutines.matchingBracketAt.
 *
 * @java main/StringRoutines.matchingBracketAt(String, int)
 */
function matchingBracketAt(str: string, from: number): number {
  const openBrackets  = ["(", "{", "[", "<"];
  const closeBrackets = [")", "}", "]", ">"];

  const ch = str.charAt(from);
  const bid = openBrackets.indexOf(ch);
  if (bid === -1) {
    console.log("** Specified char '" + ch + "' is not an open bracket.");
    return -1;
  }

  let bracketDepth = 0;
  let inString = false;
  let c = from;

  while (c < str.length) {
    const chB = str.charAt(c);

    if (chB === '"') {
      inString = !inString;
    }

    if (!inString) {
      const chA = c === 0 ? "?" : str.charAt(c - 1);
      if (chB === openBrackets[bid]) {
        if (!(chA === "(" && chB === "<")) {
          bracketDepth++;
        }
      } else if (chB === closeBrackets[bid]) {
        if (!(chA === "(" && chB === ">")) {
          bracketDepth--;
        }
      }
    }

    if (bracketDepth === 0) {
      break;
    }
    c++;
  }

  if (c >= str.length) {
    return -1;
  }

  return c;
}
