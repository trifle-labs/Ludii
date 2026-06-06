// @java Common/src/main/grammar/Instance.java

import { Symbol } from "./Symbol.js";

// Clause is not yet ported — escape-hatch interface.
interface Clause {
  symbol(): Symbol;
  args(): readonly unknown[] | null;
  toString(): string;
}

/**
 * Instance of a symbol which may be a compiled object (compile stage) or a
 * list of possible clauses (parse stage).
 *
 * @java main/grammar/Instance.java
 */
export class Instance {
  /** @java Instance.symbol */
  protected readonly _symbol: Symbol;

  /** @java Instance.clauses */
  private _clauses: Clause[] | null = null;

  /** @java Instance.object */
  protected _object: unknown = null;

  /** @java Instance.constant — name of constant if derived from application constant */
  private readonly _constant: string | null;

  // -------------------------------------------------------------------------

  /**
   * Constructor for Compiler specifying actual object compiled.
   *
   * @java Instance(Symbol, Object)
   */
  public constructor(symbol: Symbol, object: unknown);
  /**
   * Constructor for Compiler specifying actual object compiled, with constant.
   *
   * @java Instance(Symbol, Object, String)
   */
  public constructor(symbol: Symbol, object: unknown, constant: string | null);
  public constructor(
    symbol: Symbol,
    object: unknown,
    constant?: string | null
  ) {
    this._symbol   = symbol;
    this._object   = object;
    this._constant = constant !== undefined ? constant : null;
  }

  // -------------------------------------------------------------------------

  /** @java Instance.symbol() */
  public symbol(): Symbol {
    return this._symbol;
  }

  /** @java Instance.clauses() */
  public clauses(): readonly Clause[] | null {
    if (this._clauses === null) {
      return null;
    }
    return this._clauses;
  }

  /** @java Instance.setClauses(List<Clause>) */
  public setClauses(list: readonly Clause[]): void {
    this._clauses = [...list];
  }

  /** @java Instance.object() */
  public object(): unknown {
    return this._object;
  }

  /** @java Instance.setObject(Object) */
  public setObject(object: unknown): void {
    this._object = object;
  }

  /** @java Instance.constant() */
  public constant(): string | null {
    return this._constant;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Class for this symbol.
   *
   * @java Instance.cls()
   */
  public cls(): object | null {
    if (this._symbol.cls() === null) {
      console.log(
        "** Instance: null symbol.cls() for symbol " + this._symbol.name() + "."
      );
    }
    return this._symbol.cls();
  }

  // -------------------------------------------------------------------------

  /** @java Instance.toString() */
  public toString(): string {
    if (this._symbol === null) {
      return "Unknown";
    }

    return (
      this._symbol.grammarLabel() +
      (this.cls() === null ? " (null)" : ", cls: " + String(this.cls())) +
      (this._object === null ? " (null)" : ", object: " + String(this._object))
    );
  }

  // -------------------------------------------------------------------------
}
