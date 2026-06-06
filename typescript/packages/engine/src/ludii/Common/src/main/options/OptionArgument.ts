// @java Common/src/main/options/OptionArgument.java

/**
 * Record of an option argument, which may be named.
 *
 * @java main/options/OptionArgument.java
 * @author cambolbro
 */
export class OptionArgument {
  /** Optional name in definition. Format is: name:<expression>. @java OptionArgument.name */
  private readonly nameVal: string | null;

  /** This argument's expression to expand in the game description. @java OptionArgument.expression */
  private readonly expressionVal: string;

  // --------------------------------------------------------------------------

  /** @java OptionArgument(String, String) */
  public constructor(name: string | null, expression: string) {
    this.nameVal = name === null ? null : String(name);
    this.expressionVal = String(expression);
  }

  // --------------------------------------------------------------------------

  /** @java OptionArgument.name() */
  public name(): string | null {
    return this.nameVal;
  }

  /** @java OptionArgument.expression() */
  public expression(): string {
    return this.expressionVal;
  }

  // --------------------------------------------------------------------------

  /** @java OptionArgument.toString() */
  public toString(): string {
    let sb = "";
    if (this.nameVal !== null) {
      sb += this.nameVal + ":";
    }
    sb += "<" + this.expressionVal + ">";
    return sb;
  }

  // --------------------------------------------------------------------------
}
