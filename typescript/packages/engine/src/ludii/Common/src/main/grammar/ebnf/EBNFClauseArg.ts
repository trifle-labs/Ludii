// @java Common/src/main/grammar/ebnf/EBNFClauseArg.java

/**
 * EBNF style clause argument for interpreting grammar.
 *
 * @java main/grammar/ebnf/EBNFClauseArg.java
 * @author cambolbro
 */
export class EBNFClauseArg {
  /** @java EBNFClauseArg.token — from EBNFClause superclass */
  protected token: string = "?";

  /** @java EBNFClauseArg.isOptional */
  private _isOptional: boolean = false;

  /** @java EBNFClauseArg.orGroup */
  private _orGroup: number = 0;

  /** @java EBNFClauseArg.parameterName */
  private _parameterName: string | null = null;

  /** @java EBNFClauseArg.nesting */
  private _nesting: number = 0;

  // -------------------------------------------------------------------------

  /**
   * @java EBNFClauseArg(String, boolean, int)
   */
  public constructor(input: string, isOptional: boolean, orGroup: number) {
    this._isOptional = isOptional;
    this._orGroup = orGroup;
    this.decompose(input);
  }

  // -------------------------------------------------------------------------

  /** @java EBNFClauseArg.isOptional() */
  public isOptional(): boolean {
    return this._isOptional;
  }

  /** @java EBNFClauseArg.orGroup() */
  public orGroup(): number {
    return this._orGroup;
  }

  /** @java EBNFClauseArg.parameterName() */
  public parameterName(): string | null {
    return this._parameterName;
  }

  /** @java EBNFClauseArg.nesting() */
  public nesting(): number {
    return this._nesting;
  }

  /** @java EBNFClauseArg.token() — inherited from EBNFClause */
  public getToken(): string {
    return this.token;
  }

  // -------------------------------------------------------------------------

  /**
   * @java EBNFClauseArg.decompose(String)
   */
  protected decompose(input: string): void {
    let str = input.trim();

    // Assume that optional status has already been set and brackets '[...]' removed

    // Strip parameter name, if any
    const colonAt = str.indexOf(":");
    if (colonAt >= 0) {
      this._parameterName = str.substring(0, colonAt).trim();
      str = str.substring(colonAt + 1).trim();
    }

    // Strip array braces, if any
    while (str.charAt(0) === "{") {
      if (str.charAt(str.length - 1) !== "}") {
        console.log("** No closing brace for array in: " + str);
        return;
      }
      this._nesting++;
      str = str.substring(1, str.length - 1).trim();
    }

    this.token = str.trim();
  }

  // -------------------------------------------------------------------------

  /** @java EBNFClauseArg.toString() */
  public toString(): string {
    let sb = "";

    if (this._parameterName !== null) {
      sb += this._parameterName + ":";
    }

    for (let n = 0; n < this._nesting; n++) {
      sb += "{";
    }

    sb += this.token;

    for (let n = 0; n < this._nesting; n++) {
      sb += "}";
    }

    return sb;
  }

  // -------------------------------------------------------------------------
}
