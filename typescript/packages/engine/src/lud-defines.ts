// @java Common/src/main/grammar/Define.java Define
// @java Language/src/parser/Expander.java Expander
/**
 * Java parity: Compiler/src/compiler/Define.java + Expander.java —
 * `(define "Name" body)` macros and their `("Name" arg1 arg2 …)`
 * invocations.
 *
 * A define is a top-level form whose body is substituted at every
 * call site. Inside the body, `#1`, `#2`, … reference the call's
 * positional arguments. Anything not matched leaves the body
 * untouched, so a define without arguments behaves like a paste.
 *
 * Identifiers inside the body are taken literally (no scoping rules
 * here — Ludii treats defines as hygiene-free macros). Nested
 * invocations work: substituted bodies are re-walked so a define
 * can reference another define.
 */

import {
  isIdent,
  isList,
  isString,
  type LudNode,
  listHead,
} from "@ludii/typescript-language";

interface DefineEntry {
  readonly name: string;
  readonly body: LudNode;
  /** True when `body` is the synthetic curly wrapper around a MULTI-term define
   * body — Java's textual expansion SPLICES those terms into the parent list
   * (e.g. Morra's "InitHand" = six (place …) forms inside one (start {…})). */
  readonly synthetic?: boolean;
}

/** Maximum number of substitution passes before we give up on a recursive expansion. */
const MAX_PASSES = 32;

/**
 * Public entry point. Walks `ast`, harvests every top-level
 * `(define "Name" body)`, then walks again replacing every
 * `("Name" args…)` invocation with the macro body (with `#k`
 * substituted by the k-th argument). Returns a new AST with
 * defines removed and invocations expanded.
 */
export function expandDefines(ast: LudNode, extras?: DefineEntry[]): LudNode {
  const defines = new Map<string, DefineEntry>();
  if (extras) {
    for (const entry of extras) {
      defines.set(entry.name, entry);
    }
  }
  collectDefines(ast, defines);

  let current = ast;
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    const next = expand(current, defines);
    if (next === current) return current;
    current = next;
  }
  return current;
}

/**
 * Strip top-level `(define …)` forms from `ast` without expanding
 * anything. Useful when callers want to enumerate the defines a
 * file contains (e.g. for tooling).
 */
export function collectTopLevelDefines(ast: LudNode): DefineEntry[] {
  const map = new Map<string, DefineEntry>();
  collectDefines(ast, map);
  return [...map.values()];
}

function collectDefines(node: LudNode, into: Map<string, DefineEntry>): void {
  if (!isList(node)) return;
  for (const item of node.items) {
    if (!isList(item)) continue;
    if (listHead(item) === "define") {
      // `(define "Name" body)` — there can be one or many body terms; we
      // wrap multiple bodies in a synthetic curly list to keep the
      // substitution machinery uniform.
      const nameNode = item.items[1];
      if (!nameNode || !isString(nameNode)) continue;
      const bodyTerms = item.items.slice(2);
      let body: LudNode;
      if (bodyTerms.length === 0) continue;
      const first = bodyTerms[0];
      if (bodyTerms.length === 1 && first) {
        body = first;
      } else {
        body = {
          kind: "list",
          delimiter: "curly",
          items: bodyTerms,
          range: item.range,
        };
      }
      into.set(nameNode.value, { name: nameNode.value, body, synthetic: bodyTerms.length > 1 });
    } else {
      // Defines can be nested anywhere in the (post-option) tree, not just at
      // the file top level or inside a curly block. Java's `Expander` extracts
      // every `(define …)` token from the whole expanded source regardless of
      // nesting. In particular an `(option … args:{ … <rules> } …)` whose
      // selected item supplies `(define "X" …) (rules …)` in its `<rules>` slot
      // injects that define as a *direct child of `(game …)`* once
      // `applyOptions` substitutes the placeholder — a round-paren list we must
      // descend into. (58 Holes / Hounds-and-Jackals declare `"Teleportation"`
      // this way; without recursing here, `("Teleportation")` never expands and
      // the teleport-on-landing consequence is silently dropped.) Recurse into
      // every list child (the `(define …)` branch above already collected and
      // intentionally does not recurse into a define's own body).
      collectDefines(item, into);
    }
  }
}

function expand(node: LudNode, defines: Map<string, DefineEntry>): LudNode {
  if (!isList(node)) return node;

  // Strip out `(define …)` siblings from this list since they live in
  // the same scope but should not survive into the engine AST. Anything
  // else is recursively expanded.
  const out: LudNode[] = [];
  let changed = false;
  for (const item of node.items) {
    if (isList(item) && listHead(item) === "define") {
      changed = true;
      continue;
    }
    const expanded = expandItem(item, defines);
    if (expanded !== item) changed = true;
    if (Array.isArray(expanded)) {
      out.push(...expanded);
    } else {
      out.push(expanded);
    }
  }
  if (!changed) return node;
  return {
    kind: "list",
    delimiter: node.delimiter,
    items: out,
    range: node.range,
  };
}

function expandItem(
  node: LudNode,
  defines: Map<string, DefineEntry>,
  expanding: Set<string> = new Set(),
): LudNode | LudNode[] {
  if (!isList(node)) return node;

  // Detect a define invocation: a round-paren list whose first item is a
  // string. Curly `{ "Name" … }` lists are groups, not call sites — Ludii
  // only treats `("Name" args…)` as a macro call.
  const head = node.items[0];
  if (node.delimiter === "round" && head && isString(head)) {
    const entry = defines.get(head.value);
    if (entry && !expanding.has(entry.name)) {
      // Expand each call-site token, then group `kwname:` ident +
      // following value into a single argument so a single `#k`
      // reference splices both tokens back in at use site. Without
      // this, calls like `("X" (square 8) cells:{0..3 8 9})` would
      // mis-align — `#2` would bind only to `cells:` and the curly
      // list would leak past the end of the parameter list.
      const expanded = node.items
        .slice(1)
        .map((arg) => expandSingle(arg, defines, expanding));
      const args: LudNode[][] = [];
      for (let i = 0; i < expanded.length; i += 1) {
        const tok = expanded[i];
        if (!tok) continue;
        if (
          isIdent(tok) &&
          tok.name.endsWith(":") &&
          tok.name.length > 1 &&
          i + 1 < expanded.length
        ) {
          const next = expanded[i + 1];
          if (next) {
            args.push([tok, next]);
            i += 1;
            continue;
          }
        }
        args.push([tok]);
      }
      const substituted = substitute(entry.body, args);
      // Re-walk in case the substituted body has its own invocations.
      // Mark this define as in-progress so a recursive self-call is left
      // as-is on the second pass (preventing infinite expansion of
      // self-referential macros like (define "X" ("X"))).
      const nextExpanding = new Set(expanding);
      nextExpanding.add(entry.name);
      const result = expandSingle(substituted, defines, nextExpanding);
      // A multi-term define body (synthetic curly wrapper) SPLICES into the
      // parent list, exactly like Java's textual expansion.
      if (entry.synthetic && isList(result) && result.delimiter === "curly") {
        return [...result.items];
      }
      return result;
    }
  }

  return expandList(node, defines, expanding);
}

function expandList(
  node: LudNode,
  defines: Map<string, DefineEntry>,
  expanding: Set<string>,
): LudNode {
  if (!isList(node)) return node;
  const out: LudNode[] = [];
  let changed = false;
  for (const item of node.items) {
    if (isList(item) && listHead(item) === "define") {
      changed = true;
      continue;
    }
    // Bare string referencing a zero-arg define — Ludii allows
    // `"DefName"` to stand in for `("DefName")` when the define has no
    // parameters. Expand here so equipment slots like a single
    // `"BoardUsed"` resolve to their full board definition.
    if (isString(item)) {
      const entry = defines.get(item.value);
      if (entry && !expanding.has(entry.name)) {
        const substituted = substitute(entry.body, []);
        const nextExpanding = new Set(expanding);
        nextExpanding.add(entry.name);
        const expanded = expandSingle(substituted, defines, nextExpanding);
        changed = true;
        if (entry.synthetic && isList(expanded) && expanded.delimiter === "curly") {
          out.push(...expanded.items);
        } else {
          out.push(expanded);
        }
        continue;
      }
    }
    const expanded = expandItem(item, defines, expanding);
    if (expanded !== item) changed = true;
    if (Array.isArray(expanded)) {
      out.push(...expanded);
    } else {
      out.push(expanded);
    }
  }
  if (!changed) return node;
  return {
    kind: "list",
    delimiter: node.delimiter,
    items: out,
    range: node.range,
  };
}

function expandSingle(
  node: LudNode,
  defines: Map<string, DefineEntry>,
  expanding: Set<string>,
): LudNode {
  const result = expandItem(node, defines, expanding);
  if (Array.isArray(result)) {
    return {
      kind: "list",
      delimiter: "curly",
      items: result,
      range: node.range,
    };
  }
  return result;
}

/**
 * A define argument that should be deleted at the use site: either no arg was
 * supplied for this `#k`, or the supplied arg is the explicit null placeholder
 * `~` (Java `Expander.DEFINE_PARAMETER_PLACEHOLDER`). Java replaces both with
 * `<DELETE_ME>` and then strips it, so an unfilled trailing parameter such as
 * the `#4` in `(if cond (moveAgain) #4)` vanishes rather than surviving as a
 * literal token. Keeping it would, e.g., give `(if …)` a bogus else branch.
 */
function isDeletedArg(replacement: readonly LudNode[] | undefined): boolean {
  if (!replacement || replacement.length === 0) return true;
  const only = replacement.length === 1 ? replacement[0] : undefined;
  return only !== undefined && isIdent(only) && only.name === "~";
}

/**
 * Replace `#k` identifiers in `node` with `args[k-1]`. A `#k` reference whose
 * argument is missing (or the explicit `~` placeholder) is deleted, matching
 * Java's `<DELETE_ME>` handling in `Expander.expandDefineArgs`. Each arg is a
 * sequence of tokens so a keyword-arg pair (`cells:` + value) can be spliced
 * back in as two tokens from a single `#k`.
 */
/** @java Expander: textual substitution replaces `#k` ANYWHERE in a token —
 * including glued inside idents (Vigilance's `(handSite P#1 0)` → `P2`). When the
 * arg is a single number/ident, splice its text into the ident's name. */
function spliceGluedParams(node: LudNode, args: readonly (readonly LudNode[])[]): LudNode {
  if (!isIdent(node) || !/#\d+/.test(node.name) || /^#\d+$/.test(node.name)) return node;
  let name = node.name;
  let changed = false;
  name = name.replace(/#(\d+)/g, (whole, d: string) => {
    const arg = args[Number.parseInt(d, 10) - 1]?.[0];
    if (!arg) return whole;
    const text = isIdent(arg) ? arg.name
      : (arg as { kind?: string }).kind === "number" ? String((arg as { value: number }).value)
      : isString(arg) ? arg.value : null;
    if (text === null) return whole;
    changed = true;
    return text;
  });
  if (!changed) return node;
  return { kind: "ident", name, range: node.range };
}

function substitute(node: LudNode, args: readonly (readonly LudNode[])[]): LudNode {
  if (isIdent(node)) {
    node = spliceGluedParams(node, args) as typeof node;
    if (!isIdent(node)) return node;
    const match = /^#(\d+)$/.exec(node.name);
    if (match) {
      const idx = Number.parseInt(match[1] ?? "0", 10) - 1;
      const replacement = args[idx];
      if (!isDeletedArg(replacement)) {
        // Top-level (non-list-child) — return the first token. The
        // remaining tokens of a multi-token arg are only meaningful
        // when spliced into a surrounding list; outside one there's
        // nothing they can attach to.
        return replacement?.[0] ?? node;
      }
      // A deleted root-level `#k` has nothing to attach to; leave it for the
      // placeholder filter (this only arises for a define body that is a bare
      // `#k`, which is vanishingly rare).
    }
    return node;
  }
  if (!isList(node)) return node;
  let changed = false;
  const out: LudNode[] = [];
  for (const rawItem of node.items) {
    const item = isIdent(rawItem) ? spliceGluedParams(rawItem, args) : rawItem;
    if (item !== rawItem) changed = true;
    if (isIdent(item)) {
      const m = /^#(\d+)$/.exec(item.name);
      if (m) {
        const idx = Number.parseInt(m[1] ?? "0", 10) - 1;
        const replacement = args[idx];
        if (isDeletedArg(replacement)) {
          // Unfilled / `~` argument: drop the token entirely (Java `<DELETE_ME>`).
          changed = true;
          continue;
        }
        for (const r of replacement as readonly LudNode[]) out.push(r);
        changed = true;
        continue;
      }
    }
    const sub = substitute(item, args);
    if (sub !== item) changed = true;
    out.push(sub);
  }
  if (!changed) return node;
  return {
    kind: "list",
    delimiter: node.delimiter,
    items: out,
    range: node.range,
  };
}
