// @java Language/src/compiler/exceptions/BadArrayElementException.java

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
 * @java compiler/exceptions/BadArrayElementException.java
 * @author cambolbro
 */
export class BadArrayElementException extends CompilerException {
  /** @java BadArrayElementException.serialVersionUID */
  // serialVersionUID = 1L

  /** @java BadArrayElementException.expectedType */
  private readonly expectedType: string;

  /** @java BadArrayElementException.elementType */
  private readonly elementType: string;

  /**
   * @param expectedType
   * @param elementType
   * @java BadArrayElementException(String, String)
   */
  constructor(expectedType: string, elementType: string) {
    super();
    this.name = "BadArrayElementException";
    this.expectedType = expectedType;
    this.elementType = elementType;
  }

  /**
   * @java BadArrayElementException.getMessageBody(String)
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
    sb.push(highlightText(safeDescription, this.elementType, "font", "red"));
    sb.push("</p>");
    sb.push("</html>");

    console.log(sb.join(""));

    return sb.join("");
  }

  /**
   * @java BadArrayElementException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    return (
      "Array element of type " +
      this.elementType +
      " but type " +
      this.expectedType +
      " expected."
    );
  }
}
