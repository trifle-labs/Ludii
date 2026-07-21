// @java Language/src/compiler/exceptions/InvalidOptionException.java

import { CompilerException } from "./CompilerException.js";

// StringRoutines not yet ported — inline the methods used here.
// @java main/StringRoutines.escapeText(String)
function escapeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;")
    .replace(/ /g, "&nbsp;")
    .replace(/\n/g, "<br/>");
}

/**
 * @java compiler/exceptions/InvalidOptionException.java
 * @author mrraow
 */
export class InvalidOptionException extends CompilerException {
  /** @java InvalidOptionException.serialVersionUID */
  // serialVersionUID = 1L

  /** @java InvalidOptionException.message */
  private readonly _message: string;

  /**
   * @param message The message.
   * @java InvalidOptionException(String)
   */
  constructor(message: string) {
    super();
    this.name = "InvalidOptionException";
    this._message = message;
  }

  /**
   * @java InvalidOptionException.getMessageBody(String)
   */
  public override getMessageBody(gameDescription: string): string {
    const safeDescription = escapeText(gameDescription);
    const sb: string[] = [];

    sb.push("<html>");
    sb.push("<h2>");
    sb.push(this.getMessageTitle());
    sb.push("</h2>");
    sb.push("<br/>");
    sb.push("<p>");
    sb.push(safeDescription);
    sb.push("</p>");
    sb.push("</html>");

    console.log(sb.join(""));

    return sb.join("");
  }

  /**
   * @java InvalidOptionException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    return this._message;
  }
}
