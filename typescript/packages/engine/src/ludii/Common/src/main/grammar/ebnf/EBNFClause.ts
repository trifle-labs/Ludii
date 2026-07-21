// @java Common/src/main/grammar/ebnf/EBNFClause.java

import { EBNFClauseArg } from "./EBNFClauseArg.js";

/**
 * EBNF style clause for interpreting grammar.
 *
 * @java main/grammar/ebnf/EBNFClause.java
 * @author cambolbro
 */
export class EBNFClause {
  /** @java EBNFClause.token */
  protected token: string = "?";

  /** @java EBNFClause.isConstructor */
  private _isConstructor: boolean = false;

  /** @java EBNFClause.isRule */
  private _isRule: boolean = false;

  /** @java EBNFClause.isTerminal */
  private _isTerminal: boolean = false;

  /** @java EBNFClause.args */
  private _args: EBNFClauseArg[] | null = null;

  // -------------------------------------------------------------------------

  /** @java EBNFClause() — default constructor */
  public constructor();
  /** @java EBNFClause(String) */
  public constructor(input: string);
  public constructor(input?: string) {
    if (input !== undefined) {
      this.decompose(input);
    }
  }

  // -------------------------------------------------------------------------

  /** @java EBNFClause.token() */
  public getToken(): string {
    return this.token;
  }

  /** @java EBNFClause.isConstructor() */
  public isConstructor(): boolean {
    return this._isConstructor;
  }

  /** @java EBNFClause.isRule() */
  public isRule(): boolean {
    return this._isRule;
  }

  /** @java EBNFClause.isTerminal() */
  public isTerminal(): boolean {
    return this._isTerminal;
  }

  /** @java EBNFClause.args() */
  public args(): readonly EBNFClauseArg[] | null {
    if (this._args === null) {
      return null;
    }
    return this._args;
  }

  // -------------------------------------------------------------------------

  /**
   * @java EBNFClause.decompose(String)
   */
  protected decompose(input: string): void {
    const str = input.trim();

    if (str.length === 0) {
      return;
    }

    const firstChar = str.charAt(0);
    switch (firstChar) {
      case "(":
        this._isConstructor = true;
        break;
      case "<":
        this._isRule = true;
        this.token = str;
        return;
      default:
        this._isTerminal = true;
        this.token = str;
        return;
    }

    // Must be constructor: strip opening and closing brackets
    if (str.charAt(0) !== "(" || str.charAt(str.length - 1) !== ")") {
      console.log("** Bad bracketing of constructor: " + str);
      return;
    }
    let inner = str.substring(1, str.length - 1);

    // Extract leading token
    let c = 0;
    while (c < inner.length && inner.charAt(c) !== " ") {
      c++;
    }
    this.token = inner.substring(0, c).trim();
    inner = c >= inner.length ? "" : inner.substring(c + 1).trim();

    // Create args
    this._args = [];
    if (inner === "") {
      return;
    }

    const subs = inner.split(" ");
    const orGroups: number[] = new Array<number>(subs.length).fill(0);
    const optional: boolean[] = new Array<boolean>(subs.length).fill(false);

    // Determine 'or' groups
    let orGroup = 0;
    for (let n = 1; n < subs.length - 1; n++) {
      if (subs[n] !== "|") {
        continue;
      }

      if (n < 2 || subs[n - 2] !== "|") {
        orGroup++;
      }

      orGroups[n - 1] = orGroup;
      orGroups[n + 1] = orGroup;
    }

    // Determine optional items
    let on = false;
    for (let n = 0; n < subs.length; n++) {
      const isOpen = subs[n]!.includes("[");
      const isClose = subs[n]!.includes("]");

      if (isOpen || isClose || on) {
        optional[n] = true;
      }

      if (isOpen) {
        on = true;
      }

      if (isClose) {
        on = false;
      }
    }

    // Create args, stripping optional '[' and ']' brackets and 'or' brackets '(' and ')'
    for (let n = 0; n < subs.length; n++) {
      if (subs[n] === "|") {
        continue;
      }

      const strArg = subs[n]!
        .replace(/\[/g, "")
        .replace(/\]/g, "")
        .replace(/\(/g, "")
        .replace(/\)/g, "");
      const arg = new EBNFClauseArg(strArg, optional[n]!, orGroups[n]!);
      this._args.push(arg);
    }
  }

  // -------------------------------------------------------------------------

  /** @java EBNFClause.toString() */
  public toString(): string {
    let sb = "";

    if (this._isConstructor) {
      sb += "(";
    }

    sb += this.token;

    if (this._args !== null) {
      for (let a = 0; a < this._args.length; a++) {
        const arg = this._args[a]!;
        sb += " ";

        // Check opening bracket
        if (arg.orGroup() !== 0) {
          // Check if must show opening bracket
          if (a === 0 || this._args[a - 1]!.orGroup() !== arg.orGroup()) {
            // Must show opening bracket, determine what type
            if (arg.isOptional()) {
              sb += "[";
            } else {
              sb += "(";
            }
          }

          // Check if must show 'or' separator
          if (a > 0 && this._args[a - 1]!.orGroup() === arg.orGroup()) {
            sb += "| ";
          }
        } else {
          // Individual item
          if (arg.isOptional()) {
            sb += "[";
          }
        }

        sb += arg.toString();

        // Check closing bracket
        if (arg.orGroup() !== 0) {
          // Check if must show closing bracket
          if (
            a === this._args.length - 1 ||
            this._args[a + 1]!.orGroup() !== arg.orGroup()
          ) {
            // Must show closing bracket, determine what type
            if (arg.isOptional()) {
              sb += "]";
            } else {
              sb += ")";
            }
          }
        } else {
          // Individual item
          if (arg.isOptional()) {
            sb += "]";
          }
        }
      }
    }

    if (this._isConstructor) {
      sb += ")";
    }

    return sb;
  }

  // -------------------------------------------------------------------------
}
