// Faithful grammar substrate for the TS port.
//
// Java builds its Grammar by REFLECTING over every ludeme class (scanning
// constructors + @Opt/@Name/@Or annotations) — see Language/src/grammar/Grammar.java
// and Common/src/main/grammar/{Symbol,Clause,ClauseArg}.java. TypeScript erases
// types at runtime and cannot reflect constructor parameters, so instead of
// regenerating the grammar by reflection we LOAD the grammar Java already
// emitted: tools/parity/java-grammar-current.txt (the EBNF produced by
// Language/src/grammar/DumpGrammar.java). That text is the faithful serialized
// form of exactly what reflection produces.
//
// This module parses that EBNF into an in-memory model:
//   GrammarModel: symbolName -> GrammarRule { clauses }
//   GrammarClause: either an alias (a bare <symbolRef>) or a constructor clause
//                  (keyword + ordered args).
//   GrammarArg: one constructor argument — its symbol/terminal, and whether it
//               is optional ([...] => @Opt), a list ({...} => array), named
//               (name: => @Name), and/or part of an @Or alternative group.
//
// The downstream faithful Compiler (Compiler.ts + ArgClass) uses this to decide,
// for a parsed (.lud) token, which symbol/clause it matches; a per-class
// constructor factory (the reflection substitute) then instantiates the ported
// ludeme class from the matched, arg-resolved clause.

export interface GrammarArg {
  /** The referenced grammar symbol or terminal name, e.g. "int", "moves.to", "boolean". */
  readonly symbol: string;
  /** @Opt — the argument may be omitted ([...] in the EBNF). */
  readonly optional: boolean;
  /** Array/list argument ({...} in the EBNF). */
  readonly list: boolean;
  /** @Name — keyword-style label, e.g. count:<int> => name "count". null if positional. */
  readonly name: string | null;
  /**
   * @Or group id: args sharing the same non-null orGroup are mutually-exclusive
   * alternatives written as (<a> | <b>) in the EBNF. null if not in an Or group.
   */
  readonly orGroup: number | null;
}

export interface GrammarClause {
  /**
   * The leading keyword of a constructor clause, e.g. "hop" for (hop ...). null
   * when this clause is a bare alias to another symbol (a union member), in
   * which case `alias` is set.
   */
  readonly keyword: string | null;
  /** For alias clauses (<otherSymbol>), the referenced symbol name. null otherwise. */
  readonly alias: string | null;
  /** Ordered constructor arguments (empty for aliases / nullary keywords). */
  readonly args: readonly GrammarArg[];
  /** The raw clause text (for diagnostics). */
  readonly raw: string;
}

export interface GrammarRule {
  readonly symbol: string;
  readonly clauses: readonly GrammarClause[];
}

export type GrammarModel = Map<string, GrammarRule>;

// --- parsing -----------------------------------------------------------------

/** Split a rule RHS on top-level `|`, ignoring `|` nested in () [] {} or <...>. */
function splitTopLevel(rhs: string, sep: string): string[] {
  // NOTE: we deliberately do NOT track `<`/`>` nesting. Ludii grammar symbols
  // can be operators (e.g. <>=>, <<=>, <!=>) whose names contain bare `<`/`>`,
  // which would corrupt angle-depth tracking. Nonterminals never contain a top-
  // level `|` or space, so tracking only ()/[]/{} is correct and robust.
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < rhs.length; i++) {
    const c = rhs[i]!;
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    if (c === sep && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/** Tokenise the inside of a constructor clause into top-level arg tokens. */
function splitArgs(inner: string): string[] {
  return splitTopLevel(inner, " ").flatMap((t) => (t ? [t] : []));
}

/** Parse one arg token like `[count:<int>]`, `{<int>}`, `<boolean>`, `name:<x>`. */
function parseArg(tokenRaw: string, orGroup: number | null): GrammarArg {
  let token = tokenRaw.trim();
  let optional = false;
  let list = false;

  // Strip a single outer [...] (optional) or {...} (list); they can nest as [{...}].
  // EBNF uses [<x>] for @Opt, {<x>} for arrays, and [{<x>}] for optional arrays.
  for (let changed = true; changed; ) {
    changed = false;
    if (token.startsWith("[") && token.endsWith("]")) {
      optional = true;
      token = token.slice(1, -1).trim();
      changed = true;
    } else if (token.startsWith("{") && token.endsWith("}")) {
      list = true;
      token = token.slice(1, -1).trim();
      changed = true;
    }
  }

  // Named arg: name:<symbol>  (the colon precedes the <...> or terminal).
  let name: string | null = null;
  const colon = token.indexOf(":");
  if (colon > 0 && !token.startsWith("<")) {
    name = token.slice(0, colon);
    token = token.slice(colon + 1).trim();
  }

  // Strip <...> wrapper to get the bare symbol/terminal name.
  let symbol = token;
  if (symbol.startsWith("<") && symbol.endsWith(">")) symbol = symbol.slice(1, -1);

  return { symbol, optional, list, name, orGroup };
}

/** Parse the argument list of a constructor clause, expanding (<a> | <b>) Or-groups. */
function parseArgList(inner: string): GrammarArg[] {
  const out: GrammarArg[] = [];
  let orCounter = 0;
  for (const tok of splitArgs(inner)) {
    // An Or-group is a parenthesised alternation at the top level: (<a> | <b> ...)
    if (tok.startsWith("(") && tok.endsWith(")") && splitTopLevel(tok.slice(1, -1), "|").length > 1) {
      const gid = orCounter++;
      for (const alt of splitTopLevel(tok.slice(1, -1), "|")) out.push(parseArg(alt, gid));
    } else {
      out.push(parseArg(tok, null));
    }
  }
  return out;
}

function parseClause(clauseRaw: string): GrammarClause {
  const raw = clauseRaw.trim();
  // Constructor clause: (keyword args...)
  if (raw.startsWith("(") && raw.endsWith(")")) {
    const inner = raw.slice(1, -1).trim();
    const sp = firstTopLevelSpace(inner);
    const keyword = sp === -1 ? inner : inner.slice(0, sp);
    const argText = sp === -1 ? "" : inner.slice(sp + 1).trim();
    return { keyword, alias: null, args: parseArgList(argText), raw };
  }
  // Alias / union member: <otherSymbol>  (or a bare terminal like `string`).
  const alias = raw.startsWith("<") && raw.endsWith(">") ? raw.slice(1, -1) : raw;
  return { keyword: null, alias, args: [], raw };
}

/** Index of the first space not nested inside <>, (), [], {}. */
function firstTopLevelSpace(s: string): number {
  // See splitTopLevel: no `<`/`>` tracking (operator symbols break it).
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === " " && depth === 0) return i;
  }
  return -1;
}

/**
 * Parse the EBNF grammar text (java-grammar-current.txt) into a GrammarModel.
 * @java Language/src/grammar/Grammar.java (built by reflection there; loaded here).
 */
export function parseEbnfGrammar(text: string): GrammarModel {
  const model: GrammarModel = new Map();

  // 1. Drop // comment lines, then re-join continuation lines into one rule each.
  //    A rule begins at a line matching `<symbol> ::=`; following indented lines
  //    (no `::=`) continue its RHS.
  const ruleLines: string[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (/^\s*\/\//.test(line) || line.trim() === "") continue;
    if (/::=/.test(line)) {
      ruleLines.push(line.trim());
    } else if (ruleLines.length > 0) {
      ruleLines[ruleLines.length - 1] += " " + line.trim();
    }
  }

  // 2. Parse each rule.
  for (const rule of ruleLines) {
    const eq = rule.indexOf("::=");
    if (eq === -1) continue;
    const lhs = rule.slice(0, eq).trim();
    const symbol = lhs.startsWith("<") && lhs.endsWith(">") ? lhs.slice(1, -1) : lhs;
    const rhs = rule.slice(eq + 3).trim();
    const clauses = splitTopLevel(rhs, "|").map(parseClause);
    model.set(symbol, { symbol, clauses });
  }

  return model;
}
