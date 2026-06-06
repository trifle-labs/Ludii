// @java Common/src/exception/DuplicateOptionUseException.java

/**
 * Exception indicating that a String description of an option was
 * used more than once (matched multiple distinct options).
 *
 * @java exception/DuplicateOptionUseException.java
 * @author Dennis Soemers
 */
export class DuplicateOptionUseException extends Error {

  /**
   * @param optionString
   * @java DuplicateOptionUseException(String)
   */
  public constructor(optionString: string) {
    super("Option with duplicate matches: " + optionString);
    this.name = "DuplicateOptionUseException";
  }
}
