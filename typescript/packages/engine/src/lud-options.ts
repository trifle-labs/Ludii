// @java Language/src/compiler/Compiler.java Compiler
/**
 * Java parity: Compiler/src/compiler/Compiler.java's option-resolution
 * pass — `(option "Title" <Tag> args:{<arg1> <arg2> …} { (item …)** (item …) … })`
 * declarations injected into the game body via `<Tag>` / `<Tag:argName>`
 * placeholders.
 *
 * What's implemented here:
 *   - Top-level `(option …)` harvesting (also descends into curly blocks).
 *   - One item per option chosen as the default — the item marked with a
 *     `**` sibling token (Ludii's "default" marker) wins; otherwise the
 *     first item. The chosen item's `< … >` value blocks bind to the
 *     option's args in declaration order.
 *   - Substitution of `<Tag>` (uses the first arg) and `<Tag:argName>`
 *     anywhere in the AST. Value blocks may be a single node or a
 *     sequence; sequences are spliced into the enclosing list.
 *   - `(option …)` forms are stripped from the returned AST so the
 *     downstream compiler doesn't have to ignore them.
 *
 * Unknown placeholders are left intact (the downstream compiler will
 * fail with a normal "Expected …" diagnostic if they're still around),
 * matching Java behaviour for unresolved option references.
 */

import {
  isIdent,
  isList,
  isString,
  type LudIdent,
  type LudList,
  type LudNode,
  type LudNumber,
} from "@ludii/typescript-language";

interface OptionInfo {
  /** Category tag used by `<Tag>` / `<Tag:arg>` placeholders. */
  readonly tag: string;
  /** Human-facing option heading ("Board Size", "Play Rules", ...). */
  readonly heading: string;
  readonly args: readonly string[];
  /** values[argIndex] is the chosen item's value block for that arg. */
  readonly values: readonly (readonly LudNode[])[];
}

/**
 * Apply default-option substitution to `ast` and return a new tree with
 * `(option …)` forms removed.
 */
export function applyOptions(
  ast: LudNode,
  optionsOverride?: readonly OptionInfo[],
): LudNode {
  if (!isList(ast)) return ast;
  const options = optionsOverride ? [...optionsOverride] : collectDefaultOptions(ast);
  const stripped = stripOptions(ast);
  let current = stripped;
  for (const option of options) current = substitute(current, option);
  return current;
}

/** Test helper: enumerate option entries with their chosen values. */
export function collectDefaultOptions(ast: LudNode): OptionInfo[] {
  const out: OptionInfo[] = [];
  if (isList(ast)) collectOptions(ast, out);
  return out;
}

function collectOptions(node: LudNode, into: OptionInfo[]): void {
  if (!isList(node)) return;
  for (const item of node.items) {
    if (!isList(item)) continue;
    const head = item.items[0];
    if (head && isIdent(head) && head.name === "option") {
      const info = parseOption(item);
      if (info) into.push(info);
      continue;
    }
    // Java extracts option categories from the fully realised source, so nested
    // round-paren wrappers count too. Recursing only into `{ ... }` misses
    // options embedded in ordinary lists and leaves placeholders like
    // `<Row:tracks>` unresolved in option-driven board declarations.
    collectOptions(item, into);
  }
}

function parseOption(node: LudList): OptionInfo | undefined {
  // (option "Title" <Tag> args:{<a> <b> ...} { (item …)** (item …) ... })
  // The "args:" prefix is a Ludii keyword-argument token parsed as a
  // bare identifier preceding the args list.
  const headingNode = node.items[1];
  const tagNode = node.items[2];
  const heading = headingNode && isString(headingNode) ? headingNode.value : "";
  if (!tagNode || !isIdent(tagNode)) return undefined;
  const tag = unwrapAngles(tagNode.name);
  if (!tag) return undefined;

  let argsList: LudList | undefined;
  let itemsList: LudList | undefined;
  for (let i = 3; i < node.items.length; i += 1) {
    const piece = node.items[i];
    if (!piece) continue;
    if (isIdent(piece) && piece.name === "args:") {
      const next = node.items[i + 1];
      if (next && isList(next) && next.delimiter === "curly") {
        argsList = next;
        i += 1;
      }
      continue;
    }
    if (isList(piece) && piece.delimiter === "curly" && !itemsList) {
      // Heuristic: the curly block that contains (item …) forms is the
      // item collection; otherwise treat as args.
      if (containsItem(piece)) itemsList = piece;
      else if (!argsList) argsList = piece;
    }
  }
  if (!itemsList) return undefined;

  const argNames: string[] = [];
  if (argsList) {
    // The tokenizer can glue adjacent angle-params, e.g. Katro Bevohoka's
    // `args:{ <rowSize> <R1><S1><T1><R2><S2><T2> <CCW2> }` lexes the middle as
    // one fused ident. Split them the same way item values are (extractItemValues
    // already calls normalizeAngleTokens), so every `<name>` registers as its
    // own arg — otherwise the trailing params never substitute.
    for (const a of normalizeAngleTokens(argsList.items)) {
      if (isIdent(a)) {
        const name = unwrapAngles(a.name);
        if (name) argNames.push(name);
      }
    }
  }

  const items = collectItems(itemsList);
  if (items.length === 0) return undefined;
  // Java GameOptions.computeOptionSelections: when no option is explicitly
  // selected, take the one with the highest priority (number of trailing
  // asterisks), first wins on a tie. Items with no asterisk have priority 0.
  let chosen = items[0];
  let maxPriority = -1;
  for (const it of items) {
    if (it.priority > maxPriority) {
      maxPriority = it.priority;
      chosen = it;
    }
  }
  if (!chosen) return undefined;

  const values: LudNode[][] = chosen.values.slice(
    0,
    Math.max(argNames.length, chosen.values.length),
  );
  // Pad to args length so lookups by index don't undershoot.
  while (values.length < argNames.length) values.push([]);

  return { tag, heading, args: argNames, values };
}

interface ItemBlock {
  /** Number of trailing asterisks — Java Option.priority (default 0). */
  readonly priority: number;
  readonly values: LudNode[][];
}

function collectItems(itemsList: LudList): ItemBlock[] {
  const out: ItemBlock[] = [];
  const children = itemsList.items;
  for (let i = 0; i < children.length; i += 1) {
    const node = children[i];
    if (!node || !isList(node)) continue;
    const head = node.items[0];
    if (!head || !isIdent(head) || head.name !== "item") continue;
    const values = extractItemValues(node);
    const nextSibling = children[i + 1];
    // Java Option strips trailing asterisks and counts them as `priority`
    // (Option.java: "Extract priority (number of asterisks appended)"). An
    // item with no asterisk has priority 0; `*`=1, `**`=2, etc.
    const priority =
      !!nextSibling && isIdent(nextSibling) && /^\*+$/.test(nextSibling.name)
        ? nextSibling.name.length
        : 0;
    out.push({ priority, values });
  }
  return out;
}

function normalizeAngleTokens(items: readonly LudNode[]): LudNode[] {
  // Ludii's lexer may glue the angle delimiters onto their neighbours
  // (e.g. `<7 7>` tokenises as `<7`, `7`, `>`). Split such idents back
  // into a standalone `<` / `>` plus the bare token so the block parser
  // can pair them. `<X>` paired tokens are left intact — `unwrapAngles`
  // handles those as inline single-value blocks.
  const out: LudNode[] = [];
  for (const item of items) {
    if (!item || !isIdent(item)) {
      if (item) out.push(item);
      continue;
    }
    const name = item.name;
    if (name.length <= 1) {
      out.push(item);
      continue;
    }
    // General case: split a name composed of `<X>` paired tokens
    // and bare angle delimiters (`<`, `>`). Handles every fusion the
    // tokenizer can produce — `<12><14><4>` (all paired),
    // `<0><` (paired + opening), `><X>` (closing + paired),
    // `<7` (opening + bare), `7>` (bare + closing).
    if (name.includes("<") || name.includes(">")) {
      const tokens: { name: string; }[] = [];
      let i = 0;
      let buf = "";
      while (i < name.length) {
        const ch = name[i];
        if (ch === "<") {
          if (buf.length > 0) {
            tokens.push({ name: buf });
            buf = "";
          }
          // Look for a matching `>` to form a paired `<X>` token.
          const closeAt = name.indexOf(">", i + 1);
          if (closeAt < 0) {
            tokens.push({ name: "<" });
            i += 1;
            continue;
          }
          tokens.push({ name: name.slice(i, closeAt + 1) });
          i = closeAt + 1;
          continue;
        }
        if (ch === ">") {
          if (buf.length > 0) {
            tokens.push({ name: buf });
            buf = "";
          }
          tokens.push({ name: ">" });
          i += 1;
          continue;
        }
        buf += ch;
        i += 1;
      }
      if (buf.length > 0) tokens.push({ name: buf });
      if (tokens.length > 1 || (tokens[0] && tokens[0].name !== name)) {
        for (const t of tokens) {
          if (t.name === "<" || t.name === ">") {
            out.push({ kind: "ident", name: t.name, range: item.range });
          } else if (t.name.startsWith("<") && t.name.endsWith(">")) {
            out.push({ kind: "ident", name: t.name, range: item.range });
          } else {
            const r = identOrNumber(t.name, item.range);
            if (Array.isArray(r)) out.push(...r); else out.push(r);
          }
        }
        continue;
      }
    }
    out.push(item);
  }
  return out;
}

function extractItemValues(itemNode: LudList): LudNode[][] {
  // (item "Label" <val1> <val2> "Desc")
  //   - simple cases: one ident `<5>` per slot
  //   - block cases: `<` … `>` ident tokens flanking inline nodes
  const out: LudNode[][] = [];
  const items = normalizeAngleTokens(itemNode.items);
  // Skip the leading `item` head and string label.
  let i = items[1] && isString(items[1]) ? 2 : 1;
  while (i < items.length) {
    const node = items[i];
    if (!node) {
      i += 1;
      continue;
    }
    // Trailing description string — end of value blocks.
    if (isString(node)) break;
    if (isIdent(node)) {
      const name = node.name;
      if (name === "<") {
        // Block: collect until matching ">".
        let depth = 1;
        const block: LudNode[] = [];
        i += 1;
        while (i < items.length && depth > 0) {
          const inner = items[i];
          if (!inner) {
            i += 1;
            continue;
          }
          if (isIdent(inner)) {
            if (inner.name === "<") depth += 1;
            else if (inner.name === ">") {
              depth -= 1;
              if (depth === 0) {
                i += 1;
                break;
              }
            }
          }
          block.push(inner);
          i += 1;
        }
        out.push(block);
        continue;
      }
      const stripped = unwrapAngles(name);
      if (stripped !== undefined) {
        // <value> inline ident — numeric strings become number literals so
        // downstream parsers (e.g. expectInt for board sizes) accept them.
        // `<>` represents an empty substitution — push the slot with no
        // tokens so the placeholder evaporates rather than leaving an
        // empty-named ident downstream.
        if (stripped === "") {
          out.push([]);
        } else {
          const r = identOrNumber(stripped, node.range);
          out.push(Array.isArray(r) ? r : [r]);
        }
        i += 1;
        continue;
      }
    }
    // Unknown — skip.
    i += 1;
  }
  return out;
}

function containsItem(list: LudList): boolean {
  for (const child of list.items) {
    if (
      child &&
      isList(child) &&
      child.items[0] &&
      isIdent(child.items[0]) &&
      child.items[0].name === "item"
    ) {
      return true;
    }
  }
  return false;
}

function identOrNumber(
  text: string,
  range: LudIdent["range"],
): LudIdent | LudNumber | (LudIdent | LudNumber)[] {
  if (/^-?\d+$/.test(text)) {
    return { kind: "number", value: Number.parseInt(text, 10), range };
  }
  if (/^-?\d+\.\d+$/.test(text)) {
    return { kind: "number", value: Number.parseFloat(text), range };
  }
  // Java substitutes option values TEXTUALLY and re-lexes, so a labeled value like
  // `numSides:6` or `exact:True` becomes TWO tokens (`label:` ident + value) — exactly
  // how the same text lexes inline (Bravalath's <numSides:6>, Gomoku's <exact:True>).
  const labeled = text.match(/^([A-Za-z][A-Za-z0-9_]*:)(-?\d+(?:\.\d+)?|[A-Za-z][A-Za-z0-9_]*)$/);
  if (labeled) {
    const value = labeled[2]!;
    const valueNode: LudIdent | LudNumber = /^-?\d/.test(value)
      ? { kind: "number", value: /\./.test(value) ? Number.parseFloat(value) : Number.parseInt(value, 10), range }
      : { kind: "ident", name: value, range };
    return [{ kind: "ident", name: labeled[1]!, range }, valueNode];
  }
  return { kind: "ident", name: text, range };
}

function unwrapAngles(name: string): string | undefined {
  if (name.length >= 2 && name.startsWith("<") && name.endsWith(">")) {
    return name.slice(1, -1);
  }
  return undefined;
}

function stripOptions(node: LudNode): LudNode {
  if (!isList(node)) return node;
  const out: LudNode[] = [];
  let changed = false;
  let prev: LudNode | undefined;
  for (const item of node.items) {
    if (
      isList(item) &&
      item.items[0] &&
      isIdent(item.items[0]) &&
      (item.items[0].name === "option" || item.items[0].name === "rulesets")
    ) {
      // @java Language/src/parser/Expander.java:535 — realiseRulesets REMOVES the
      // (rulesets ...) block from the game description (rulesets are stored for the
      // UI; the game compiles with regular option priorities). Throngs' ruleset
      // selector strings ("Version/Simplified") otherwise leak into the tree as
      // string-headed lists.
      changed = true;
      prev = item;
      continue;
    }
    // Default-item markers (`*`, `**`, even `****`) appear as a bare
    // ident sibling immediately after an `(item …)` form inside an
    // option's curly block. We strip them only in that context so we
    // don't accidentally drop arithmetic `*` from non-option lists.
    if (
      isIdent(item) &&
      /^\*+$/.test(item.name) &&
      prev &&
      isList(prev) &&
      prev.items[0] &&
      isIdent(prev.items[0]) &&
      prev.items[0].name === "item"
    ) {
      changed = true;
      prev = item;
      continue;
    }
    const sub = stripOptions(item);
    if (sub !== item) changed = true;
    out.push(sub);
    prev = item;
  }
  if (!changed) return node;
  return {
    kind: "list",
    delimiter: node.delimiter,
    items: out,
    range: node.range,
  };
}

function substitute(node: LudNode, option: OptionInfo): LudNode {
  if (!isList(node)) return node;
  const out: LudNode[] = [];
  let changed = false;
  for (const item of node.items) {
    if (isIdent(item)) {
      const replacement = resolvePlaceholder(item, option);
      if (replacement) {
        changed = true;
        out.push(...replacement);
        continue;
      }
      out.push(item);
      continue;
    }
    const sub = substitute(item, option);
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

function resolvePlaceholder(
  ident: LudIdent,
  option: OptionInfo,
): LudNode[] | undefined {
  const inner = unwrapAngles(ident.name);
  if (inner === undefined) return undefined;
  // `<Tag>` or `<Tag:arg>`.
  const colonIdx = inner.indexOf(":");
  const tag = colonIdx < 0 ? inner : inner.slice(0, colonIdx);
  const argName = colonIdx < 0 ? undefined : inner.slice(colonIdx + 1);
  if (option.tag !== tag) return undefined;
  if (argName === undefined) {
    return [...(option.values[0] ?? [])];
  }
  const idx = option.args.indexOf(argName);
  if (idx < 0) return undefined;
  return [...(option.values[idx] ?? [])];
}
