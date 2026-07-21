// @java Language/src/compiler/exceptions/ListNotSupportedException.java

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
 * An exception for the not supported symbols.
 *
 * @java compiler/exceptions/ListNotSupportedException.java
 * @author cambolbro
 */
export class ListNotSupportedException extends CompilerException {
  /** @java ListNotSupportedException.serialVersionUID */
  // serialVersionUID = 1L

  /**
   * @java ListNotSupportedException()
   */
  constructor() {
    super();
    this.name = "ListNotSupportedException";
  }

  /**
   * @java ListNotSupportedException.getMessageBody(String)
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
    sb.push(highlightText(safeDescription, "List", "font", "red"));
    sb.push("</p>");
    sb.push("</html>");

    console.log(sb.join(""));

    return sb.join("");
  }

  /**
   * @java ListNotSupportedException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    return "List<> not supported as ludeme constructor argument.";
  }
}
