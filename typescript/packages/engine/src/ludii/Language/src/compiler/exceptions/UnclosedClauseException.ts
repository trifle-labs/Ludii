// @java Language/src/compiler/exceptions/UnclosedClauseException.java

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
 * @java compiler/exceptions/UnclosedClauseException.java
 * @author cambolbro
 */
export class UnclosedClauseException extends CompilerException {
  /** @java UnclosedClauseException.serialVersionUID */
  // serialVersionUID = 1L

  /** @java UnclosedClauseException.badClause */
  private readonly badClause: string;

  /**
   * @param badClause
   * @java UnclosedClauseException(String)
   */
  constructor(badClause: string) {
    super();
    this.name = "UnclosedClauseException";
    this.badClause = badClause;
  }

  /**
   * @java UnclosedClauseException.getMessageBody(String)
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
    sb.push(highlightText(safeDescription, this.badClause, "font", "red"));
    sb.push("</p>");
    sb.push("</html>");

    console.log(sb.join(""));

    return sb.join("");
  }

  /**
   * @java UnclosedClauseException.getMessageTitle()
   */
  public override getMessageTitle(): string {
    return 'The clause "' + this.badClause + '" was not closed.';
  }
}
