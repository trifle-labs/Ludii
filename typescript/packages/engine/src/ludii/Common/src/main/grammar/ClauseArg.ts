// @java Common/src/main/grammar/ClauseArg.java

/**
 * Argument in a symbol's clause (i.e. a constructor) with an optional label.
 *
 * @java main/grammar/ClauseArg.java
 * @author cambolbro
 */

// Symbol is not yet ported — minimal escape-hatch interface.
export interface ISymbol {
  ludemeType(): string;
  token(): string;
  grammarLabel(): string;
  path(): string;
}

export class ClauseArg {
  /** Parameter name in the code base. @java ClauseArg.actualParameterName */
  private readonly _actualParameterName: string | null;

  /** Local parameter name if parameter has @Name annotation, else null. @java ClauseArg.label */
  private _label: string | null;

  /** Symbol representing parameter type. @java ClauseArg.symbol */
  private _symbol: ISymbol | null;

  /** Whether arg is [optional]. @java ClauseArg.optional */
  private readonly _optional: boolean;

  /** Which @Or groups this arg belongs to (0 is none). @java ClauseArg.orGroup */
  private readonly _orGroup: number;

  /** Which @And groups this arg belongs to (0 is none). @java ClauseArg.andGroup */
  private readonly _andGroup: number;

  /** Degree of array nesting (0 for none). @java ClauseArg.nesting */
  private _nesting: number = 0;

  // -------------------------------------------------------------------------

  /**
   * Constructor.
   *
   * @java ClauseArg(Symbol, String, String, boolean, int, int)
   */
  public constructor(
    symbol: ISymbol | null,
    actualParameterName: string | null,
    label: string | null,
    optional: boolean,
    orGroup: number,
    andGroup: number
  );

  /**
   * Copy constructor.
   *
   * @java ClauseArg(ClauseArg)
   */
  public constructor(other: ClauseArg);

  public constructor(
    symbolOrOther: ISymbol | null | ClauseArg,
    actualParameterName?: string | null,
    label?: string | null,
    optional?: boolean,
    orGroup?: number,
    andGroup?: number
  ) {
    if (symbolOrOther instanceof ClauseArg) {
      // Copy constructor
      const other = symbolOrOther;
      this._symbol = other._symbol;
      this._actualParameterName = other._actualParameterName === null ? null : other._actualParameterName;
      this._label = other._label === null ? null : other._label;
      this._optional = other._optional;
      this._orGroup = other._orGroup;
      this._andGroup = other._andGroup;
      this._nesting = other._nesting;
    } else {
      // Normal constructor
      this._symbol = symbolOrOther;
      this._actualParameterName = actualParameterName === null || actualParameterName === undefined ? null : actualParameterName;
      this._label = label === null || label === undefined ? null : label;
      this._optional = optional ?? false;
      this._orGroup = orGroup ?? 0;
      this._andGroup = andGroup ?? 0;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return Parameter name in the code base.
   *
   * @java ClauseArg.actualParameterName()
   */
  public actualParameterName(): string | null {
    return this._actualParameterName;
  }

  /**
   * @return Local parameter name if parameter has @Name annotation, else null.
   *
   * @java ClauseArg.label()
   */
  public label(): string | null {
    return this._label;
  }

  /**
   * @return Symbol representing parameter type.
   *
   * @java ClauseArg.symbol()
   */
  public symbol(): ISymbol | null {
    return this._symbol;
  }

  /**
   * @java ClauseArg.setSymbol(Symbol)
   */
  public setSymbol(val: ISymbol): void {
    this._symbol = val;
  }

  /**
   * @return Degree of nesting (array depth).
   *
   * @java ClauseArg.nesting()
   */
  public nesting(): number {
    return this._nesting;
  }

  /**
   * @java ClauseArg.setNesting(int)
   */
  public setNesting(val: number): void {
    this._nesting = val;
  }

  /**
   * @return Whether arg is optional.
   *
   * @java ClauseArg.optional()
   */
  public optional(): boolean {
    return this._optional;
  }

  /** @java ClauseArg.orGroup() */
  public orGroup(): number {
    return this._orGroup;
  }

  /** @java ClauseArg.andGroup() */
  public andGroup(): number {
    return this._andGroup;
  }

  // -------------------------------------------------------------------------

  /** @java ClauseArg.toString() */
  public toString(): string {
    if (this._symbol === null) {
      return "NULL";
    }

    let str = "";

    switch (this._symbol.ludemeType()) {
      case "Primitive":
        str = this._symbol.token();
        break;
      case "Constant":
        str = this._symbol.token();
        break;
      case "Predefined":
      case "Ludeme":
      case "SuperLudeme":
      case "SubLudeme":
      case "Structural":
        // Hack to convert "<String>" args to "string" in the grammar
        if (this._symbol.token() === "String") {
          str = "string";
        } else {
          str = "<" + this._symbol.grammarLabel() + ">";
        }
        break;
      default:
        str += "[UNKNOWN]";
    }

    for (let n = 0; n < this._nesting; n++) {
      str = "{" + str + "}";
    }

    if (this._label !== null) {
      let labelSafe = this._label;
      if (labelSafe.length > 0 && labelSafe.charAt(0) === labelSafe.charAt(0).toUpperCase() && labelSafe.charAt(0) !== labelSafe.charAt(0).toLowerCase()) {
        // First char is capital, probably If, Else, etc.
        labelSafe = labelSafe.charAt(0).toLowerCase() + labelSafe.substring(1);
      }
      str = labelSafe + ":" + str; // named parameter
    }

    if (this._optional) {
      str = "[" + str + "]";
    }

    return str;
  }

  // -------------------------------------------------------------------------
}
