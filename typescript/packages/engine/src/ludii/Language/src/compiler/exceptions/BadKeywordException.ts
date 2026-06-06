// @java Language/src/compiler/exceptions/BadKeywordException.java

import { CompilerException } from "./CompilerException.js";

// StringRoutines not yet ported — inline the two methods used here.
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
 * @java compiler/exceptions/BadKeywordException.java
 * @author cambolbro
 */
export class BadKeywordException extends CompilerException {
  /** @java BadKeywordException.serialVersionUID */
  // serialVersionUID = 1L

  /** @java BadKeywordException.badKeyword */
  private readonly badKeyword: string;

  /** @java BadKeywordException.message */
  private readonly _message: string | null;

  /**
   * @param badKeyword
   * @param message
   * @java BadKeywordException(String, String)
   */
  constructor(badKeyword: string, message: string | null) {
    super();
    this.name = "BadKeywordException";
    this.badKeyword = badKeyword; // StringRoutines.toDromedaryCase(badKeyword) — commented out in Java
    this._message = message;
  }

  /**
   * @java BadKeywordException.getMessageBody(String)
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
    sb.push(highlightText(safeDescription, this.badKeyword, "font", "red"));
    sb.push("</p>");
    sb.push("</html>");

    console.log(sb.join(""));

    return sb.join("");
  }

  /**
   * @java BadKeywordException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    let str = 'The keyword "' + this.badKeyword + '" cannot be recognised.';
    if (this._message !== null) {
      str += " " + this._message;
    }
    return str;
  }
}
