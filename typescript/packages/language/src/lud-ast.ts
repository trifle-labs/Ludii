/**
 * Minimal `.lud` AST.
 *
 * The Java front-end produces a rich ludeme tree; the TS port currently
 * only needs the S-expression shape (lists + atoms) plus enough metadata
 * to walk the form once and instantiate engine objects.
 */

import type { TokenRange } from "./token-range.js";

export type LudNodeKind = "list" | "ident" | "string" | "number";

export interface LudNodeBase {
  readonly kind: LudNodeKind;
  readonly range: TokenRange;
}

export interface LudList extends LudNodeBase {
  readonly kind: "list";
  /** Whether the list was written with `()` or `{}`. */
  readonly delimiter: "round" | "curly";
  readonly items: readonly LudNode[];
}

export interface LudIdent extends LudNodeBase {
  readonly kind: "ident";
  readonly name: string;
}

export interface LudString extends LudNodeBase {
  readonly kind: "string";
  readonly value: string;
}

export interface LudNumber extends LudNodeBase {
  readonly kind: "number";
  readonly value: number;
}

export type LudNode = LudList | LudIdent | LudString | LudNumber;

export function isList(node: LudNode): node is LudList {
  return node.kind === "list";
}

export function isIdent(node: LudNode): node is LudIdent {
  return node.kind === "ident";
}

export function isString(node: LudNode): node is LudString {
  return node.kind === "string";
}

export function isNumber(node: LudNode): node is LudNumber {
  return node.kind === "number";
}

/**
 * Returns the head identifier of a list (the first element). Useful for
 * dispatching on the form name, e.g. `(game ...)` → "game".
 */
export function listHead(node: LudList): string | undefined {
  const first = node.items[0];
  if (first && first.kind === "ident") {
    return first.name;
  }
  return undefined;
}
