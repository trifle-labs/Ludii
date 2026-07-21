/**
 * Ported from `Language/src/parser/SelectionType.java`.
 *
 * Types of ways in which editor text can be replaced.
 *
 * Java's enum is modelled here as a string-literal union plus a frozen
 * `SelectionType` namespace exposing the three constants. The string values
 * match the Java `name()` output so they can be used directly in serialised
 * IDE state without a translation layer.
 */
export const SelectionType = Object.freeze({
  /** Replacement through right-click context selection. */
  CONTEXT: "CONTEXT",
  /** Replacement of selected text. */
  SELECTION: "SELECTION",
  /** Replacement through autosuggest in response to typing. */
  TYPING: "TYPING",
} as const);

export type SelectionType = (typeof SelectionType)[keyof typeof SelectionType];

/** All defined `SelectionType` values in declaration order (Java `values()`). */
export const SELECTION_TYPE_VALUES: readonly SelectionType[] = Object.freeze([
  SelectionType.CONTEXT,
  SelectionType.SELECTION,
  SelectionType.TYPING,
]);
