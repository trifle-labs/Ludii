// @java Language/src/compiler/exceptions/BadRootException.java

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
 * @java compiler/exceptions/BadRootException.java
 * @author cambolbro
 */
export class BadRootException extends CompilerException {
  /** @java BadRootException.serialVersionUID */
  // serialVersionUID = 1L

  /** @java BadRootException.badRoot */
  private readonly badRoot: string;

  /** @java BadRootException.expectedRoot */
  private readonly expectedRoot: string;

  /**
   * @param badRoot
   * @param expectedRoot
   * @java BadRootException(String, String)
   */
  constructor(badRoot: string, expectedRoot: string) {
    super();
    this.name = "BadRootException";
    this.badRoot = badRoot;
    this.expectedRoot = expectedRoot;
  }

  /**
   * @java BadRootException.getMessageBody(String)
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
    sb.push(highlightText(safeDescription, this.badRoot, "font", "red"));
    sb.push("</p>");
    sb.push("</html>");

    console.log(sb.join(""));

    return sb.join("");
  }

  /**
   * @java BadRootException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    return (
      "Root " +
      this.badRoot +
      " found rather than expected root " +
      this.expectedRoot +
      "."
    );
  }
}
