// @java Language/src/compiler/exceptions/CreationErrorWithMessageException.java

import { CompilerException } from "./CompilerException.js";

/**
 * @java compiler/exceptions/CreationErrorWithMessageException.java
 * @author cambolbro
 */
export class CreationErrorWithMessageException extends CompilerException {
  /** @java CreationErrorWithMessageException.serialVersionUID */
  // serialVersionUID = 1L

  /** @java CreationErrorWithMessageException.message */
  private readonly _message: string;

  /**
   * @param message
   * @java CreationErrorWithMessageException(String)
   */
  constructor(message: string) {
    super();
    this.name = "CreationErrorWithMessageException";
    this._message = message;
  }

  /**
   * @java CreationErrorWithMessageException.getMessageBody(String)
   */
  public override getMessageBody(_gameDescription: string): string {
    const sb: string[] = [];

    sb.push(this._message);

    console.log(sb.join(""));

    return sb.join("");
  }

  /**
   * @java CreationErrorWithMessageException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    return this._message;
  }
}
