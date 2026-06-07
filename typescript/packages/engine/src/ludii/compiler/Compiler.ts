import {
  isIdent,
  isList,
  isNumber,
  isString,
  listHead,
  parseLud,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getBuiltinDefines } from "../../builtin-defines.js";
import { expandDefines } from "../../lud-defines.js";
import { applyOptions } from "../../lud-options.js";
import {
  parseEbnfGrammar,
  type GrammarArg,
  type GrammarClause,
  type GrammarModel,
} from "../Language/src/grammar/ebnf-grammar-loader.js";
import { makeArgBundle } from "./ArgBundle.js";
import { type CompilerEnv, LudemeRegistry } from "./LudemeRegistry.js";

export interface CompilerOptions {
  readonly env?: Partial<CompilerEnv>;
}

interface ParsedArgs {
  readonly positional: readonly LudNode[];
  readonly named: ReadonlyMap<string, LudNode>;
}

interface Candidate {
  readonly symbol: string;
  readonly clause: GrammarClause;
  readonly clauseIndex: number;
}

interface MatchResult {
  readonly positional: readonly unknown[];
  readonly named: ReadonlyMap<string, unknown>;
}

class CompilerMatchError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "CompilerMatchError";
  }
}

export class Compiler {
  public constructor(
    private readonly grammar: GrammarModel,
    private readonly registry: LudemeRegistry,
  ) {}

  /** Deepest clause-match failure detail in the current compile (by recursion depth). */
  private deepestMiss: { depth: number; msg: string } | null = null;
  private depth = 0;

  private deepestMissMsg(): string | null {
    return this.deepestMiss ? this.deepestMiss.msg : null;
  }

  public compile<T = unknown>(ludAst: LudNode, opts: CompilerOptions = {}): T {
    const env: CompilerEnv = { numPlayers: opts.env?.numPlayers ?? 2 };
    this.deepestMiss = null;
    try {
      return this.compileActual<T>(findGameNode(ludAst), "game", env);
    } catch (e) {
      const missMsg = this.deepestMissMsg();
      if (e instanceof CompilerMatchError && missMsg) {
        throw new Error(`${e.message}  [deepest: ${missMsg}]`);
      }
      throw e;
    }
  }

  public compileActual<T = unknown>(
    node: LudNode,
    expectedSymbol: string,
    env: CompilerEnv,
  ): T {
    const terminal = this.tryCompileTerminal(node, expectedSymbol);
    if (terminal.matched) return terminal.value as T;

    if (!isList(node)) {
      const enumValue = this.tryCompileEnum(node, expectedSymbol);
      if (enumValue.matched) return enumValue.value as T;
      throw new CompilerMatchError(`Compiler: expected <${expectedSymbol}>, got ${describeNode(node)}`);
    }

    if (node.delimiter === "curly") {
      return node.items.map((item) => this.compileActual(item, expectedSymbol, env)) as T;
    }

    const head = listHead(node);
    if (!head) {
      if (node.items.length === 1 && isList(node.items[0]!)) {
        return this.compileActual<T>(node.items[0]!, expectedSymbol, env);
      }
      throw new CompilerMatchError(`Compiler: headless list cannot match <${expectedSymbol}>`);
    }

    const candidates = this.keywordCandidates(expectedSymbol, head);
    for (const candidate of candidates) {
      const matched = this.tryMatchClause(node, candidate, env);
      if (!matched) continue;

      const constructKey = constructKeyFor(head, matched.positional);
      const bundle = makeArgBundle({
        clause: candidate.clause,
        clauseIndex: candidate.clauseIndex,
        sourceKeyword: head,
        constructKey,
        symbol: candidate.symbol,
        positional: matched.positional,
        named: matched.named,
      });
      return this.registry.construct<T>(bundle, env);
    }

    if (this.deepestMiss === null || this.depth > this.deepestMiss.depth) {
      this.deepestMiss = {
        depth: this.depth,
        msg: candidates.length === 0
          ? `no grammar candidate: keyword '${head}' is not a <${expectedSymbol}>`
          : `<${expectedSymbol}> '${head}': args matched none of ${candidates.length} clause(s)`,
      };
    }
    throw new CompilerMatchError(`Compiler: no <${expectedSymbol}> clause matched ${describeNode(node)}`);
  }

  private tryMatchClause(node: LudList, candidate: Candidate, env: CompilerEnv): MatchResult | null {
    const parsed = parseNodeArgs(node);
    return this.matchArgs(candidate.clause.args, parsed.positional, parsed.named, env);
  }

  private matchArgs(
    grammarArgs: readonly GrammarArg[],
    positionalNodes: readonly LudNode[],
    namedNodes: ReadonlyMap<string, LudNode>,
    env: CompilerEnv,
  ): MatchResult | null {
    const go = (
      argIndex: number,
      posIndex: number,
      outPositional: unknown[],
      outNamed: Map<string, unknown>,
    ): MatchResult | null => {
      if (argIndex >= grammarArgs.length) {
        return posIndex === positionalNodes.length
          ? { positional: outPositional, named: outNamed }
          : null;
      }

      const arg = grammarArgs[argIndex]!;

      if (arg.orGroup !== null) {
        const group = grammarArgs.filter((a, i) => i >= argIndex && a.orGroup === arg.orGroup);
        const nextArgIndex = argIndex + group.length;
        let firstError: unknown;
        for (const alt of group) {
          let matched: ReturnType<Compiler["consumeArg"]>;
          try {
            matched = this.consumeArg(alt, positionalNodes, namedNodes, posIndex, outPositional, outNamed, env);
          } catch (error) {
            firstError ??= error;
            continue;
          }
          if (!matched) continue;
          const tail = go(nextArgIndex, matched.posIndex, matched.positional, matched.named);
          if (tail) return tail;
        }
        if (group.every((a) => a.optional)) return go(nextArgIndex, posIndex, outPositional, outNamed);
        if (firstError !== undefined) throw firstError;
        return null;
      }

      let consumed: ReturnType<Compiler["consumeArg"]>;
      const missBeforeProbe = this.deepestMiss;
      try {
        consumed = this.consumeArg(arg, positionalNodes, namedNodes, posIndex, outPositional, outNamed, env);
      } catch (error) {
        if (arg.optional) {
          // Benign probe: a node didn't fit this optional arg and is skipped.
          // Discard any deepestMiss recorded during the probe so it doesn't mask
          // the real (required-arg) failure elsewhere.
          this.deepestMiss = missBeforeProbe;
          return go(argIndex + 1, posIndex, outPositional, outNamed);
        }
        throw error;
      }
      if (consumed) {
        const tail = go(argIndex + 1, consumed.posIndex, consumed.positional, consumed.named);
        if (tail) return tail;
        // Optional arg matched but a later required arg failed: backtrack by
        // skipping it, but KEEP deepestMiss (the deeper failure is real).
        if (arg.optional) return go(argIndex + 1, posIndex, outPositional, outNamed);
        return null;
      }

      if (arg.optional) {
        this.deepestMiss = missBeforeProbe; // benign: optional arg didn't match, skip
        return go(argIndex + 1, posIndex, outPositional, outNamed);
      }
      return null;
    };

    return go(0, 0, [], new Map());
  }

  private consumeArg(
    arg: GrammarArg,
    positionalNodes: readonly LudNode[],
    namedNodes: ReadonlyMap<string, LudNode>,
    posIndex: number,
    outPositional: readonly unknown[],
    outNamed: ReadonlyMap<string, unknown>,
    env: CompilerEnv,
  ): { posIndex: number; positional: unknown[]; named: Map<string, unknown> } | null {
    if (arg.name !== null) {
      const namedNode = namedNodes.get(arg.name.toLowerCase());
      if (!namedNode && isGrammarListArg(arg)) {
        if (!arg.optional) return null;
        const named = new Map(outNamed);
        named.set(arg.name.toLowerCase(), []);
        return { posIndex, positional: [...outPositional], named };
      }
      if (!namedNode) return null;
      const value = this.compileArgValue(arg, namedNode, env);
      if (value.error !== undefined) throw value.error;
      if (!value.matched) return null;
      const named = new Map(outNamed);
      named.set(arg.name.toLowerCase(), value.value);
      return { posIndex, positional: [...outPositional], named };
    }

    const next = positionalNodes[posIndex];
    if (!next) return null;
    const value = this.compileArgValue(arg, next, env);
    if (value.error !== undefined) throw value.error;
    if (!value.matched) return null;
    return {
      posIndex: posIndex + 1,
      positional: [...outPositional, value.value],
      named: new Map(outNamed),
    };
  }

  private compileArgValue(
    arg: GrammarArg,
    node: LudNode,
    env: CompilerEnv,
  ): { matched: boolean; value?: unknown; error?: unknown } {
    this.depth++;
    try {
      if (arg.list) {
        if (isList(node) && node.delimiter === "curly") {
          return { matched: true, value: node.items.map((item) => this.compileActual(item, listElementSymbol(arg), env)) };
        }
        return { matched: false };
      }
      if (isGrammarListArg(arg)) {
        if (isList(node) && node.delimiter === "curly") {
          return { matched: true, value: node.items.map((item) => this.compileActual(item, listElementSymbol(arg), env)) };
        }
        return { matched: false };
      }
      let firstError: unknown;
      for (const symbol of alternativeSymbols(arg.symbol)) {
        try {
          return { matched: true, value: this.compileActual(node, symbol, env) };
        } catch (error) {
          if (error instanceof CompilerMatchError) {
            // Try the next union alternative.
            continue;
          }
          firstError ??= error;
        }
      }
      if (firstError !== undefined) return { matched: false, error: firstError };
      return { matched: false };
    } catch (error) {
      if (error instanceof CompilerMatchError) return { matched: false };
      return { matched: false, error };
    } finally {
      this.depth--;
    }
  }

  private keywordCandidates(expectedSymbol: string, keyword: string): Candidate[] {
    const out: Candidate[] = [];
    const seen = new Set<string>();

    const visit = (symbol: string): void => {
      if (seen.has(symbol)) return;
      seen.add(symbol);
      const rule = this.grammar.get(symbol);
      if (!rule) return;

      rule.clauses.forEach((clause, clauseIndex) => {
        if (clause.keyword !== null) {
          if (sameKeyword(clause.keyword, keyword)) out.push({ symbol, clause, clauseIndex });
        } else if (clause.alias !== null) {
          for (const alias of alternativeSymbols(clause.alias)) visit(alias);
        }
      });
    };

    visit(expectedSymbol);
    return out;
  }

  private tryCompileTerminal(
    node: LudNode,
    expectedSymbol: string,
  ): { matched: boolean; value?: unknown } {
    const symbol = expectedSymbol.toLowerCase();
    if (symbol === "string") {
      if (isString(node)) return { matched: true, value: node.value };
      return { matched: false };
    }
    if (symbol === "int" || symbol === "dim" || symbol === "float") {
      if (isNumber(node)) return { matched: true, value: node.value };
      if (isIdent(node)) {
        const n = Number(node.name);
        if (Number.isFinite(n)) return { matched: true, value: n };
        if (symbol === "int" && node.name.toLowerCase() === "number") {
          return { matched: true, value: { eval: (ctx: { _evalValue?: number }) => ctx._evalValue ?? 0 } };
        }
      }
      return { matched: false };
    }
    if (symbol === "boolean" && isIdent(node)) {
      const value = node.name.toLowerCase();
      if (value === "true") return { matched: true, value: true };
      if (value === "false") return { matched: true, value: false };
    }
    return { matched: false };
  }

  private tryCompileEnum(node: LudNode, expectedSymbol: string): { matched: boolean; value?: unknown } {
    if (!isIdent(node)) return { matched: false };
    if (this.symbolAcceptsIdent(expectedSymbol, node.name)) return { matched: true, value: node.name };
    return { matched: false };
  }

  private symbolAcceptsIdent(expectedSymbol: string, ident: string): boolean {
    if (sameKeyword(expectedSymbol, ident)) return true;
    const seen = new Set<string>();
    const visit = (symbol: string): boolean => {
      if (seen.has(symbol)) return false;
      seen.add(symbol);
      const rule = this.grammar.get(symbol);
      if (!rule) return false;
      for (const clause of rule.clauses) {
        if (clause.keyword !== null) continue;
        if (!clause.alias) continue;
        for (const alias of alternativeSymbols(clause.alias)) {
          if (sameKeyword(alias, ident)) return true;
          if (this.grammar.has(alias) && visit(alias)) return true;
        }
      }
      return false;
    };
    return visit(expectedSymbol);
  }
}

export function compileLud<T = unknown>(
  source: string,
  grammar: GrammarModel,
  registry: LudemeRegistry,
  opts: CompilerOptions = {},
): T {
  const ast = expandDefines(applyOptions(parseLud(source)), [...getBuiltinDefines()]);
  return new Compiler(grammar, registry).compile<T>(ast, opts);
}

export function loadDefaultGrammar(path = "tools/parity/java-grammar-current.txt"): GrammarModel {
  return parseEbnfGrammar(readFileSync(resolve(path), "utf8"));
}

function parseNodeArgs(node: LudList): ParsedArgs {
  const positional: LudNode[] = [];
  const named = new Map<string, LudNode>();

  for (let i = 1; i < node.items.length; i++) {
    const item = node.items[i]!;
    if (isIdent(item) && item.name.endsWith(":")) {
      const value = node.items[i + 1];
      if (value) {
        named.set(item.name.slice(0, -1).toLowerCase(), value);
        i++;
      }
      continue;
    }

    positional.push(item);
  }

  return { positional, named };
}

function findGameNode(root: LudNode): LudNode {
  if (isList(root)) {
    if (listHead(root) === "game") return root;
    for (const item of root.items) {
      if (isList(item) && listHead(item) === "game") return item;
    }
  }
  return root;
}

function constructKeyFor(keyword: string, positional: readonly unknown[]): string {
  const first = positional[0];
  if (typeof first === "string") {
    const head = keyword.toLowerCase();
    if (head === "move" || head === "sites" || head === "is") {
      return `${head}:${first.toLowerCase()}`;
    }
  }
  return keyword.toLowerCase();
}

function isGrammarListArg(arg: GrammarArg): boolean {
  return arg.list || (arg.symbol.startsWith("{<") && arg.symbol.endsWith(">}"));
}

function listElementSymbol(arg: GrammarArg): string {
  if (arg.symbol.startsWith("{<") && arg.symbol.endsWith(">}")) {
    return arg.symbol.slice(2, -2);
  }
  return arg.symbol;
}

function alternativeSymbols(symbol: string): string[] {
  const cleaned = symbol.trim();
  if (!cleaned.includes("|")) return [stripSymbol(cleaned)];
  return cleaned
    .split("|")
    .map((part) => stripSymbol(part.trim()))
    .filter((part) => part.length > 0);
}

function stripSymbol(symbol: string): string {
  let out = symbol.trim();
  if (out === "<>") return "<";
  if (out === "<<=>") return "<=";
  if (out === "<=>") return "=";
  if (out === "<>>") return ">";
  if (out === "<>=") return ">=";
  const colon = out.lastIndexOf(":");
  if (colon !== -1) out = out.slice(colon + 1).trim();
  while (out.startsWith("[") || out.startsWith("(") || out.startsWith("{")) out = out.slice(1).trim();
  while (out.endsWith("]") || out.endsWith(")") || out.endsWith("}")) out = out.slice(0, -1).trim();
  if (out.startsWith("<")) out = out.slice(1);
  if (out.endsWith(">")) out = out.slice(0, -1);
  return out;
}

function sameKeyword(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

function describeNode(node: LudNode): string {
  if (isString(node)) return `"${node.value}"`;
  if (isNumber(node)) return String(node.value);
  if (isIdent(node)) return node.name;
  return `(${listHead(node) ?? "..."})`;
}
