// @java Language/src/compiler/exceptions/ParserException.java

/**
 * Parser-specific exception hierarchy.
 *
 * @java compiler/exceptions/ParserException.java
 * @author cambolbro, mrraow
 */
export class ParserException extends Error {
  /** @java ParserException.serialVersionUID */
  // serialVersionUID = 1L

  /**
   * @param messageBody The message.
   * @param cause       The exception.
   * @java ParserException(String, ParserException)
   */
  constructor(messageBody?: string, cause?: ParserException) {
    super(messageBody ?? "");
    this.name = "ParserException";
    if (cause !== undefined) {
      (this as unknown as { cause: unknown }).cause = cause;
    }
  }

  /**
   * @param gameDescription The game description.
   * @return The message to print.
   * @java ParserException.getMessageBody(String)
   */
  public getMessageBody(gameDescription: string): string {
    const sb: string[] = [];

    sb.push("<html>");
    sb.push("<h2>");
    sb.push(this.getMessageTitle());
    sb.push("</h2>");
    sb.push("<br/>");
    sb.push("<p>");
    sb.push(gameDescription);
    sb.push("</p>");
    sb.push("</html>");

    return sb.join("");
  }

  /**
   * @return The title of the message.
   * @java ParserException.getMessageTitle()
   */
  public getMessageTitle(): string {
    return "A parser error has occurred.";
  }
}
