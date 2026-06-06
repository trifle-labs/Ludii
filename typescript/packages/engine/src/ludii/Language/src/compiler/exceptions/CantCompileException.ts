// @java Language/src/compiler/exceptions/CantCompileException.java

import { CompilerException } from "./CompilerException.js";

// StringRoutines not yet ported — inline the methods used here.
// @java main/StringRoutines.toDromedaryCase(String)
function toDromedaryCase(className: string): string {
  return className.substring(0, 1).toLowerCase() + className.substring(1);
}

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
 * @java compiler/exceptions/CantCompileException.java
 * @author cambolbro
 */
export class CantCompileException extends CompilerException {
  /** @java CantCompileException.serialVersionUID */
  // serialVersionUID = 1L

  /** @java CantCompileException.badKeyword */
  private readonly badKeyword: string;

  /**
   * @param badKeyword
   * @java CantCompileException(String)
   */
  constructor(badKeyword: string) {
    super();
    this.name = "CantCompileException";
    this.badKeyword = toDromedaryCase(badKeyword);
  }

  /**
   * @java CantCompileException.getMessageBody(String)
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
   * @java CantCompileException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    return "Can't compile the ludeme \"" + this.badKeyword + "\".";
  }
}
