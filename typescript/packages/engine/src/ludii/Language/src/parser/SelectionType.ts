// @java Language/src/parser/SelectionType.java

/**
 * Types of ways in which editor text can be replaced.
 *
 * @java parser/SelectionType.java
 * @author cambolbro
 */
export enum SelectionType {
  /** Replacement through right-click context selection. */
  CONTEXT = "CONTEXT",

  /** Replacement of selected text. */
  SELECTION = "SELECTION",

  /** Replacement through autosuggest in response to typing. */
  TYPING = "TYPING",
}
