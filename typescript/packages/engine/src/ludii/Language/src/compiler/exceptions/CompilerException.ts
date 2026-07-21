// @java Language/src/compiler/exceptions/CompilerException.java

/**
 * Compiler-specific exception hierarchy.
 *
 * @java compiler/exceptions/CompilerException.java
 * @author cambolbro, mrraow
 */
export class CompilerException extends Error {
  /** @java CompilerException.serialVersionUID */
  // serialVersionUID = 1L (Java serial — not applicable in TS)

  /**
   * @param messageBody
   * @param cause
   * @java CompilerException(String, CompilerException)
   */
  constructor(messageBody?: string, cause?: CompilerException) {
    super(messageBody ?? "");
    this.name = "CompilerException";
    if (cause !== undefined) {
      (this as unknown as { cause: unknown }).cause = cause;
    }
  }

  /**
   * @param gameDescription The description of the game.
   * @return The body message.
   * @java CompilerException.getMessageBody(String)
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
   * @return The message of the title.
   * @java CompilerException.getMessageTitle()
   */
  public getMessageTitle(): string {
    return "A compiler error has occurred.";
  }
}
