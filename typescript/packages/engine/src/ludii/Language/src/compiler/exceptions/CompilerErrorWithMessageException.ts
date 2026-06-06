// @java Language/src/compiler/exceptions/CompilerErrorWithMessageException.java

import { CompilerException } from "./CompilerException.js";

/**
 * @java compiler/exceptions/CompilerErrorWithMessageException.java
 * @author cambolbro
 */
export class CompilerErrorWithMessageException extends CompilerException {
  /** @java CompilerErrorWithMessageException.serialVersionUID */
  // serialVersionUID = 1L

  /** @java CompilerErrorWithMessageException.message */
  private readonly _message: string;

  /**
   * @param message
   * @java CompilerErrorWithMessageException(String)
   */
  constructor(message: string) {
    super();
    this.name = "CompilerErrorWithMessageException";
    this._message = message;
  }

  /**
   * @java CompilerErrorWithMessageException.getMessageBody(String)
   */
  public override getMessageBody(_gameDescription: string): string {
    const sb: string[] = [];

    // Java: commented-out HTML block; only appends message
    sb.push(this._message);

    console.log(sb.join(""));

    return sb.join("");
  }

  /**
   * @java CompilerErrorWithMessageException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    return this._message;
  }
}
