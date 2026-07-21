// @java Common/src/main/grammar/GrammarRule.java

import { Symbol, LudemeType } from "./Symbol.js";

// Clause is not yet ported — escape-hatch interface.
interface Clause {
  symbol(): Symbol;
  args(): readonly unknown[] | null;
  toString(): string;
}

/**
 * Rule within the grammar.
 *
 * @java main/grammar/GrammarRule.java
 * @author cambolbro
 */
export class GrammarRule {
  /** @java GrammarRule.lhs — LHS symbol, must be non-terminal or primitive, not constant. */
  private _lhs: Symbol | null = null;

  /** @java GrammarRule.rhs — RHS expression, consisting of clauses separated by "|". */
  private readonly _rhs: Clause[] = [];

  // -------------------------------------------------------------------------
  // Formatting

  /** @java GrammarRule.MAX_LINE_WIDTH */
  public static readonly MAX_LINE_WIDTH: number = 80;

  /** @java GrammarRule.IMPLIES */
  public static readonly IMPLIES: string = " ::= ";

  /** @java GrammarRule.TAB_LHS */
  public static readonly TAB_LHS: number = 10;

  /** @java GrammarRule.TAB_RHS */
  public static readonly TAB_RHS: number =
    GrammarRule.TAB_LHS + GrammarRule.IMPLIES.length;

  // -------------------------------------------------------------------------

  /**
   * @java GrammarRule(Symbol)
   */
  public constructor(lhs: Symbol) {
    this._lhs = lhs;
    lhs.setRule(this);
  }

  // -------------------------------------------------------------------------

  /** @java GrammarRule.lhs() */
  public lhs(): Symbol | null {
    return this._lhs;
  }

  /** @java GrammarRule.rhs() */
  public rhs(): readonly Clause[] | null {
    if (this._rhs === null) {
      return null;
    }
    return this._rhs;
  }

  // -------------------------------------------------------------------------

  /** @java GrammarRule.addToRHS(Clause) */
  public addToRHS(clause: Clause): void {
    this._rhs.push(clause);
  }

  /** @java GrammarRule.removeFromRHS(int) */
  public removeFromRHS(n: number): void {
    this._rhs.splice(n, 1);
  }

  /** @java GrammarRule.clearRHS() */
  public clearRHS(): void {
    this._rhs.length = 0;
  }

  // -------------------------------------------------------------------------

  /**
   * @param clause
   * @return Whether this rule's RHS expression already contains the specified clause.
   *
   * @java GrammarRule.containsClause(Clause)
   */
  public containsClause(clause: Clause): boolean {
    const str = clause.toString();
    for (const clauseR of this._rhs) {
      if (clauseR.toString() === str) {
        return true;
      }
    }
    return false;
  }

  // -------------------------------------------------------------------------

  /** @java GrammarRule.alphabetiseClauses() */
  public alphabetiseClauses(): void {
    this._rhs.sort((a, b) =>
      a.symbol().token().localeCompare(b.symbol().token())
    );

    // Move constructor clauses to front of list
    for (let n = 0; n < this._rhs.length; n++) {
      const clause = this._rhs[n]!;
      if (clause.args() !== null) {
        // Clause is for a constructor
        this._rhs.splice(n, 1);
        this._rhs.unshift(clause);
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java GrammarRule.toString() */
  public toString(): string {
    let ruleStr = "";

    if (this._lhs === null) {
      return "** No LHS. **";
    }

    ruleStr +=
      this._lhs.ludemeType() === LudemeType.Constant
        ? this._lhs.grammarLabel()
        : this._lhs.toStringForced(true); // force lowerCamelCase on LHS

    // Special handling for IntArrayFunction
    const isInts = ruleStr === "<int>{<int>}";
    if (isInts) {
      ruleStr = "<ints>";
    }

    while (ruleStr.length < GrammarRule.TAB_LHS) {
      ruleStr += " ";
    }

    ruleStr += GrammarRule.IMPLIES;

    // Assemble string description for RHS
    let rhsStr = "";

    if (isInts) {
      rhsStr = "{<int>}";
    }

    for (const clause of this._rhs) {
      if (!rhsStr) {
        rhsStr = "";
      } else {
        rhsStr += " | ";
      }

      const expStr = clause.toString();
      rhsStr += expStr;
    }

    ruleStr += rhsStr;

    // Prepare tab if needed
    let tab = "";
    for (let c = 0; c < GrammarRule.TAB_RHS; c++) {
      tab += " ";
    }

    // Split line as needed
    let lastBreakAt = 0;
    for (let c = 0; c < ruleStr.length; c++) {
      if (c - lastBreakAt > GrammarRule.MAX_LINE_WIDTH) {
        // Break the line — backtrack to previous '|' symbol (if any)
        let barAt = c;
        while (barAt > 2 && ruleStr.charAt(barAt - 2) !== "|") {
          barAt--;
        }

        if (barAt < lastBreakAt + tab.length) {
          // Look for next '|' symbol
          barAt = c;
          while (barAt < ruleStr.length && ruleStr.charAt(barAt) !== "|") {
            barAt++;
          }
        }

        if (barAt > 0 && barAt < ruleStr.length) {
          ruleStr =
            ruleStr.substring(0, barAt) +
            "\n" +
            tab +
            ruleStr.substring(barAt);
        }
        lastBreakAt = barAt;
      }
    }

    return ruleStr;
  }

  // -------------------------------------------------------------------------
}
