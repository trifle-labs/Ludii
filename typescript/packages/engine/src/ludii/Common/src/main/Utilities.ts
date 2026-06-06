// @java Common/src/main/Utilities.java

/**
 * A home for miscellaneous useful routines. Like stackTrace().
 *
 * @java main/Utilities.java
 * @author cambolbro
 */
export class Utilities {
  // -------------------------------------------------------------------------

  /**
   * Show a stack trace.
   *
   * @java Utilities.stackTrace()
   */
  public static stackTrace(): void {
    const err = new Error();
    const stack = err.stack ?? "";
    console.log("======================");
    for (const line of stack.split("\n")) {
      console.log(line);
    }
    console.log("======================");
  }

  // -------------------------------------------------------------------------

  /**
   * Get a stack trace.
   *
   * @java Utilities.stackTraceString()
   */
  public static stackTraceString(): string {
    const err = new Error();
    const stack = err.stack ?? "";
    let stackTrace = "";
    stackTrace += "======================";
    for (const line of stack.split("\n")) {
      stackTrace += line;
    }
    stackTrace += "======================";
    return stackTrace;
  }

  // -------------------------------------------------------------------------
}
