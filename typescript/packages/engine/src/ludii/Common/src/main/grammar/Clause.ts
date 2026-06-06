// @java Common/src/main/grammar/Clause.java

import { ClauseArg, type ISymbol } from "./ClauseArg.js";

/**
 * Clause on RHS of rule delimited by "|".
 *
 * @java main/grammar/Clause.java
 * @author cambolbro
 */

// Clauses can be either:
//  1. Constructors    : denoted (name ...) with arg list (terminal except for args).
//  2. Type references : denoted <name> with no arg list (non-terminal).

export class Clause {
  /** Symbol describing base type. @java Clause.symbol */
  private readonly _symbol: ISymbol;

  /** List of constructor arguments (null if not constructor). @java Clause.args */
  private readonly _args: ClauseArg[] | null;

  /** Whether this clause is hidden from the grammar. @java Clause.isHidden */
  private readonly _isHidden: boolean;

  /**
   * Which arguments are mandatory, taking @Or groups into account.
   * Stored as a Set of argument indices.
   * @java Clause.mandatory
   */
  private _mandatory: Set<number> = new Set();

  // -------------------------------------------------------------------------

  /**
   * Constructor for non-Class clauses (no args).
   *
   * @java Clause(Symbol)
   */
  public constructor(symbol: ISymbol);

  /**
   * Constructor for Class clauses (with args).
   *
   * @java Clause(Symbol, List<ClauseArg>, boolean)
   */
  public constructor(symbol: ISymbol, args: ClauseArg[], isHidden: boolean);

  /**
   * Copy constructor.
   *
   * @java Clause(Clause)
   */
  public constructor(other: Clause);

  public constructor(
    symbolOrOther: ISymbol | Clause,
    args?: ClauseArg[],
    isHidden?: boolean
  ) {
    if (symbolOrOther instanceof Clause) {
      // Copy constructor
      const other = symbolOrOther;
      this._symbol = other._symbol;
      if (other._args === null) {
        this._args = null;
      } else {
        this._args = other._args.map(arg => new ClauseArg(arg));
      }
      this._isHidden = other._isHidden;
      this._mandatory = new Set(other._mandatory);
    } else if (args !== undefined) {
      // Class clause constructor (with args)
      this._symbol = symbolOrOther;
      this._args = args.map(arg => new ClauseArg(arg));
      this._isHidden = isHidden ?? false;
      this.setMandatory();
    } else {
      // Non-class clause constructor (no args)
      this._symbol = symbolOrOther;
      this._args = null;
      this._isHidden = false;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return Symbol describing base type.
   *
   * @java Clause.symbol()
   */
  public symbol(): ISymbol {
    return this._symbol;
  }

  /**
   * @return List of constructor arguments (null if not constructor).
   *
   * @java Clause.args()
   */
  public args(): readonly ClauseArg[] | null {
    if (this._args === null) {
      return null;
    }
    return this._args;
  }

  /**
   * @return Whether this clause is a constructor.
   *
   * @java Clause.isConstructor()
   */
  public isConstructor(): boolean {
    return this._args !== null;
  }

  /**
   * @return Whether this clause is hidden from the grammar.
   *
   * @java Clause.isHidden()
   */
  public isHidden(): boolean {
    return this._isHidden;
  }

  /** @java Clause.mandatory() */
  public mandatory(): Set<number> {
    return this._mandatory;
  }

  // -------------------------------------------------------------------------

  /** @java Clause.matches(Clause) */
  public matches(other: Clause): boolean {
    return this._symbol.path() === other._symbol.path();
  }

  // -------------------------------------------------------------------------

  /** @java Clause.setMandatory() */
  public setMandatory(): void {
    this._mandatory.clear();
    if (this._args === null) return;
    for (let a = 0; a < this._args.length; a++) {
      const arg = this._args[a]!;
      if (!arg.optional() && arg.orGroup() === 0) {
        this._mandatory.add(a); // this argument *must* exist
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @param other
   * @return Whether this sequence is a subset of the other.
   *
   * @java Clause.isSubsetOf(Clause)
   */
  public isSubsetOf(other: Clause): boolean {
    if (this._symbol.path() !== other._symbol.path()) {
      return false; // different base symbols
    }

    if (this._args === null || other._args === null) {
      return false;
    }

    for (const argA of this._args) {
      let p: number;
      for (p = 0; p < other._args.length; p++) {
        const argB = other._args[p]!;
        if (
          (argA.label() === null || argB.label() === null || argA.label() === argB.label()) &&
          argA.symbol()!.path() === argB.symbol()!.path() &&
          argA.nesting() === argB.nesting()
        ) {
          break; // arg found in other clause
        }
      }
      if (p >= other._args.length) {
        return false;
      }
    }
    return true;
  }

  // -------------------------------------------------------------------------

  /** @java Clause.toString() */
  public toString(): string {
    let str = "";

    const safeKeyword = this._symbol.grammarLabel();

    if (this._args !== null) {
      // Clause is a constructor
      str += "(";

      str += this._symbol.token();

      let prevArg: ClauseArg | null = null;
      for (let p = 0; p < this._args.length; p++) {
        const arg = this._args[p]!;

        str += " ";

        const orGroup = arg.orGroup();
        const andGroup = arg.andGroup();
        const isAnd = arg.andGroup() !== 0;

        if (orGroup !== 0) {
          if (prevArg === null && !arg.optional()) {
            // Open an @Or group at start
            str += "(";
          } else if (prevArg !== null && orGroup !== prevArg.orGroup()) {
            // Open a new @Or group
            if (prevArg.orGroup() !== 0 && !prevArg.optional()) {
              // Close the previous @Or group
              str += ") ";
            }

            if (!arg.optional()) {
              // Open the new group
              str += "(";
            }
          } else if (
            prevArg !== null &&
            orGroup === prevArg.orGroup() &&
            (andGroup === 0 || andGroup !== prevArg.andGroup())
          ) {
            // Continue an @Or choice
            str += "| ";
          }
        }

        if (orGroup === 0 && prevArg !== null && prevArg.orGroup() !== 0 && !prevArg.optional()) {
          // Close an @Or choice (in middle of clause)
          str += ") ";
        }

        let prevAnd = false;
        let nextAnd = false;

        if (prevArg !== null) {
          prevAnd =
            (orGroup === 0 || (orGroup !== 0 && orGroup === prevArg.orGroup())) &&
            andGroup === prevArg.andGroup();
        }

        if (p < this._args.length - 1) {
          const nextArg = this._args[p + 1]!;
          nextAnd =
            (orGroup === 0 || (orGroup !== 0 && orGroup === nextArg.orGroup())) &&
            andGroup === nextArg.andGroup();
        }

        let argString = arg.toString();

        if (prevAnd && orGroup !== 0 && argString.charAt(0) === "[") {
          // Strip opening optional bracket '['
          argString = argString.substring(1);
        }

        if (nextAnd && orGroup !== 0 && argString.charAt(argString.length - 1) === "]") {
          // Strip closing optional bracket ']'
          argString = argString.substring(0, argString.length - 1);
        }

        if (isAnd) {
          // Mark up @And args so that optional @And args can be processed below
          argString = "&" + argString + "&";
        }

        str += argString;

        if (orGroup !== 0 && p === this._args.length - 1 && !arg.optional()) {
          // Close an @Or choice (at end of clause)
          str += ")";
        }

        prevArg = arg;
      }

      // Close this clause
      str += ")";

      // Correct consecutive optional @And args
      str = str.replace(/\]& &\[/g, " ");
      str = str.replace(/&/g, "");

      // Tidy up constructors with no parameters
      str = str.replace(" )", ")");
    } else {
      // Clause is not a constructor
      switch (this._symbol.ludemeType()) {
        case "Primitive":
        case "Predefined":
        case "Constant":
          str = this._symbol.token();
          break;
        case "Ludeme":
        case "SuperLudeme":
        case "SubLudeme":
        case "Structural":
          str = "<" + safeKeyword + ">";
          break;
        default:
          str += "[UNKNOWN]";
      }
    }

    const nesting = (this._symbol as unknown as { nesting(): number }).nesting?.() ?? 0;
    for (let n = 0; n < nesting; n++) {
      str = "{" + str + "}";
    }

    return str;
  }

  // -------------------------------------------------------------------------
}
