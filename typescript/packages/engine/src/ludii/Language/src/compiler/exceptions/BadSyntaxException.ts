// @java Language/src/compiler/exceptions/BadSyntaxException.java

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

// @java main/StringRoutines.highlightText(String, String, String, String)
function highlightText(fullText: string, highlight: string, tag: string, colour: string): string {
  const replacement = "<" + tag + " color=" + colour + ">" + highlight + "</" + tag + ">";
  console.log(highlight + " --> " + replacement);
  return fullText.replace(highlight, replacement);
}

/**
 * @java compiler/exceptions/BadSyntaxException.java
 * @author cambolbro
 */
export class BadSyntaxException extends CompilerException {
  /** @java BadSyntaxException.serialVersionUID */
  // serialVersionUID = 1L

  /** @java BadSyntaxException.keyword */
  private readonly keyword: string | null;

  /** @java BadSyntaxException.message */
  private readonly _message: string;

  /**
   * @param keyword
   * @param message
   * @java BadSyntaxException(String, String)
   */
  constructor(keyword: string | null, message: string) {
    super();
    this.name = "BadSyntaxException";
    this.keyword = keyword;
    this._message = message;
  }

  /**
   * @java BadSyntaxException.getMessageBody(String)
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
    sb.push(
      this.keyword === null
        ? safeDescription
        : highlightText(safeDescription, this.keyword, "font", "red")
    );
    sb.push("</p>");
    sb.push("</html>");

    console.log(sb.join(""));

    return sb.join("");
  }

  /**
   * @java BadSyntaxException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    return "Syntax error: " + this._message;
  }
}
