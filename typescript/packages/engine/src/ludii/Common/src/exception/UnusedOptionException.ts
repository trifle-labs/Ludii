// @java Common/src/exception/UnusedOptionException.java

/**
 * Exception indicating that a String description of an option was
 * not used at all in a game.
 *
 * @java exception/UnusedOptionException.java
 * @author Dennis Soemers
 */
export class UnusedOptionException extends Error {

  /**
   * @param optionString
   * @java UnusedOptionException(String)
   */
  public constructor(optionString: string) {
    super("Unused option: " + optionString);
    this.name = "UnusedOptionException";
  }
}
