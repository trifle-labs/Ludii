// @java Language/src/compiler/exceptions/CantDecomposeException.java

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
 * @java compiler/exceptions/CantDecomposeException.java
 * @author cambolbro
 */
export class CantDecomposeException extends CompilerException {
  /** @java CantDecomposeException.serialVersionUID */
  // serialVersionUID = 1L

  /** @java CantDecomposeException.source */
  private readonly source: string;

  /**
   * @param source
   * @java CantDecomposeException(String)
   */
  constructor(source: string) {
    super();
    this.name = "CantDecomposeException";
    this.source = source;
  }

  /**
   * @java CantDecomposeException.getMessageBody(String)
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
   * @java CantDecomposeException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    return (
      this.source +
      ": The game description could not be decomposed into parts."
    );
  }
}
