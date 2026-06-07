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
import { getBuiltinDefines } from "../../../builtin-defines.js";
import { expandDefines } from "../../../lud-defines.js";
import { applyOptions } from "../../../lud-options.js";
import {
  parseEbnfGrammar,
  type GrammarClause,
  type GrammarModel,
} from "../../Language/src/grammar/ebnf-grammar-loader.js";
import { makeArgBundle } from "../ArgBundle.js";
import { type CompilerEnv, type LudemeRegistry } from "../LudemeRegistry.js";
import { createFullRegistry } from "../createFullRegistry.js";
import { JAVA_TS_CTORS } from "../gen/java-ts-ctors.js";

export interface ArgCompilerOptions {
  readonly reflectionPath?: string;
  readonly grammarPath?: string;
  readonly grammar?: GrammarModel;
  readonly registry?: LudemeRegistry;
}

export interface ArgCompilerEnv extends CompilerEnv {
  readonly registry?: LudemeRegistry;
}

interface ReflectionParam {
  readonly name?: string;
  readonly type: string;
  readonly array: boolean;
  readonly ann: readonly string[];
}

interface ReflectionExecutable {
  readonly kind: "construct" | "constructor";
  readonly params: readonly ReflectionParam[];
}

interface ReflectionClass {
  readonly token: string;
  readonly label: string;
  readonly assignableTo: readonly string[];
  readonly executables: readonly ReflectionExecutable[];
}

interface Candidate {
  readonly className: string;
  readonly meta: ReflectionClass;
}

interface ArgIn {
  readonly node: LudNode;
  readonly parameterName: string | null;
}

interface ParsedArgs {
  readonly argsIn: readonly ArgIn[];
}

interface JavaType {
  readonly name: string;
  readonly dims: number;
}

interface InstantiationInfo {
  readonly className: string;
  readonly meta: ReflectionClass;
  readonly executable: ReflectionExecutable;
  readonly execIndex: number;
  readonly args: readonly unknown[];
  readonly paramNames: readonly (string | null)[];
  readonly clause: GrammarClause;
}

class ArgCompileMiss extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ArgCompileMiss";
  }
}

export class ArgCompiler {
  private readonly reflection: ReadonlyMap<string, ReflectionClass>;
  private readonly grammar: GrammarModel;
  private readonly registry: LudemeRegistry;
  private readonly byToken = new Map<string, Candidate[]>();
  private readonly paramNameCache = new Map<string, readonly (string | null)[]>();

  public lastDivergence: string | null = null;

  public constructor(opts: ArgCompilerOptions = {}) {
    this.reflection = loadReflection(opts.reflectionPath);
    this.grammar = opts.grammar ?? loadGrammar(opts.grammarPath);
    this.registry = opts.registry ?? createFullRegistry();

    for (const [className, meta] of this.reflection) {
      const key = normalise(meta.token);
      const candidates = this.byToken.get(key) ?? [];
      candidates.push({ className, meta });
      this.byToken.set(key, candidates);
    }
  }

  public compile<T = unknown>(
    node: LudNode,
    expectedJavaTypes: readonly string[],
    env: Partial<ArgCompilerEnv> = {},
  ): T {
    const compileEnv: ArgCompilerEnv = {
      numPlayers: env.numPlayers ?? 2,
      ...(env.registry ? { registry: env.registry } : {}),
    };
    this.lastDivergence = null;
    this.deepest = null;
    this.depth = 0;
    this.resolveTrace = [];
    const result = this.compileMaybe(findGameNode(node), expectedJavaTypes.map(parseJavaType), compileEnv);
    if (result === null) {
      throw new Error(this.deepestMsg() ?? this.lastDivergence ?? `ArgCompiler: could not compile ${describeNode(node)} as ${expectedJavaTypes.join(" | ")}`);
    }
    return result as T;
  }

  public compileGame<T = unknown>(source: string, env: Partial<ArgCompilerEnv> = {}): T {
    const ast = expandDefines(applyOptions(parseLud(source)), [...getBuiltinDefines()]);
    return this.compile<T>(ast, ["game.Game"], env);
  }

  private compileMaybe(
    node: LudNode,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    this.depth++;
    const snap = this.deepest;
    const r = this.compileMaybeInner(node, expectedTypes, env);
    this.depth--;
    // Discard misses recorded while compiling a subtree that ultimately
    // succeeded (benign probes), so `deepest` reflects only the failed subtree.
    if (r !== null) this.deepest = snap;
    return r;
  }

  private compileMaybeInner(
    node: LudNode,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    const terminal = this.compileTerminal(node, expectedTypes, env);
    if (terminal !== NO_MATCH) return terminal;

    if (!isList(node)) {
      const enumValue = this.compileEnum(node, expectedTypes);
      if (enumValue !== NO_MATCH) return enumValue;
      this.note(`terminal ${describeNode(node)} did not match ${formatExpected(expectedTypes)}`);
      return null;
    }

    if (node.delimiter === "curly") {
      return this.compileArray(node, expectedTypes, env);
    }

    if (node.items.length === 1 && isList(node.items[0]!)) {
      return this.compileMaybe(node.items[0]!, expectedTypes, env);
    }

    const head = listHead(node);
    if (!head) {
      this.note(`headless list did not match ${formatExpected(expectedTypes)}`);
      return null;
    }

    if (expectedTypes.some((type) => type.dims > 0)) {
      return null;
    }

    const candidates = (this.byToken.get(normalise(head)) ?? [])
      .filter((candidate) => expectedTypes.some((expected) => isAssignable(candidate.meta, expected.name)));

    for (const candidate of candidates) {
      const object = this.compileCandidate(node, candidate, env);
      if (object !== null) {
        this.resolveTrace.push({ token: head, cls: candidate.className });
        return object;
      }
    }

    this.note(
      candidates.length === 0
        ? `no reflection candidate for (${head}) as ${formatExpected(expectedTypes)}`
        : `(${head}) matched none of ${candidates.length} reflection candidate(s) for ${formatExpected(expectedTypes)}`,
    );
    return null;
  }

  private compileCandidate(node: LudList, candidate: Candidate, env: ArgCompilerEnv): unknown | null {
    const parsed = parseNodeArgs(node);

    for (const kind of ["construct", "constructor"] as const) {
      for (let execIndex = 0; execIndex < candidate.meta.executables.length; execIndex++) {
        const executable = candidate.meta.executables[execIndex]!;
        if (executable.kind !== kind) continue;

        const object = this.compileExecutable(candidate, executable, execIndex, parsed, env);
        if (object !== null) return object;
      }
    }

    return null;
  }

  private compileExecutable(
    candidate: Candidate,
    executable: ReflectionExecutable,
    execIndex: number,
    parsed: ParsedArgs,
    env: ArgCompilerEnv,
  ): unknown | null {
    const numSlots = executable.params.length;
    if (numSlots < parsed.argsIn.length) return null;

    if (numSlots === 0) {
      return this.instantiate({
        className: candidate.className,
        meta: candidate.meta,
        executable,
        execIndex,
        args: [],
        paramNames: [],
        clause: this.clauseFor(candidate.meta, executable, execIndex, [], null),
      }, env);
    }

    const optional = executable.params.map((param) => isOptionalParam(param));
    const numOptional = optional.filter(Boolean).length;
    if (parsed.argsIn.length < numSlots - numOptional) return null;

    const firstArgText = parsed.argsIn[0] ? leadingText(parsed.argsIn[0].node) : null;
    const paramNames = this.paramNames(candidate.meta, executable, execIndex, firstArgText);

    for (const combo of argCombos(parsed.argsIn, numSlots)) {
      if (combo.some((arg, slot) => arg === null && !optional[slot])) continue;

      const argObjects: unknown[] = new Array(numSlots).fill(null);
      let matched = true;

      for (let slot = 0; slot < numSlots; slot++) {
        const argIn = combo[slot]!;
        if (argIn === null) continue;

        const paramName = paramNames[slot] ?? null;
        const paramHasName = executable.params[slot]!.ann.includes("Name");
        if (paramName !== null && (argIn.parameterName === null || argIn.parameterName !== paramName)) {
          matched = false;
          break;
        }
        if (argIn.parameterName !== null) {
          if (paramName === null) {
            matched = false;
            break;
          }
          if (argIn.parameterName !== paramName) {
            matched = false;
            break;
          }
        }
        if (paramHasName && paramName === null && argIn.parameterName === null) {
          matched = false;
          break;
        }

        const paramType = paramJavaType(executable.params[slot]!);
        const value = this.compileMaybe(argIn.node, [paramType], env);
        if (value === null) {
          matched = false;
          break;
        }
        argObjects[slot] = value;
      }

      if (!matched) continue;

      const object = this.instantiate({
        className: candidate.className,
        meta: candidate.meta,
        executable,
        execIndex,
        args: argObjects,
        paramNames,
        clause: this.clauseFor(candidate.meta, executable, execIndex, paramNames, firstArgText),
      }, env);
      if (object !== null) return object;
    }

    return null;
  }

  private compileArray(node: LudList, expectedTypes: readonly JavaType[], env: ArgCompilerEnv): unknown | null {
    for (const expected of expectedTypes) {
      if (expected.dims < 1) continue;
      const elementType: JavaType = { name: expected.name, dims: expected.dims - 1 };
      const out: unknown[] = [];
      let ok = true;
      for (const item of node.items) {
        const value = this.compileMaybe(item, [elementType], env);
        if (value === null) {
          ok = false;
          break;
        }
        out.push(value);
      }
      if (ok) return out;
    }
    this.note(`array ${describeNode(node)} did not match ${formatExpected(expectedTypes)}`);
    return null;
  }

  private compileTerminal(node: LudNode, expectedTypes: readonly JavaType[], env: ArgCompilerEnv): unknown | typeof NO_MATCH {
    if (isString(node)) {
      if (expectedTypes.some((type) => type.dims === 0 && type.name === "java.lang.String")) return node.value;
      return NO_MATCH;
    }

    if (isNumber(node) || (isIdent(node) && isNumericText(node.name))) {
      const value = isNumber(node) ? node.value : Number(node.name);
      const integer = Number.isInteger(value);
      if (expectedTypes.some((type) => type.dims === 0 && numericFunctionExpected(type.name, integer))) {
        return value;
      }
      // Java's ArgTerminal coerces a numeric token to the EXPECTED constant type,
      // so an integer literal also satisfies float/dim function params (FloatConstant)
      // and raw Float/Double/long. Order = most-specific first; isAssignable picks
      // the one matching the expected type.
      const terminalClasses = integer
        ? [
            "game.functions.ints.IntConstant", "game.functions.dim.DimConstant",
            "game.functions.floats.FloatConstant",
            "java.lang.Integer", "int", "long", "java.lang.Long",
            "java.lang.Float", "float", "java.lang.Double", "double",
          ]
        : ["game.functions.floats.FloatConstant", "game.functions.dim.DimConstant", "java.lang.Float", "float", "java.lang.Double", "double"];
      for (const className of terminalClasses) {
        for (const expected of expectedTypes) {
          if (expected.dims !== 0) continue;
          const meta = this.reflection.get(className);
          const fits = meta ? isAssignable(meta, expected.name) : className === expected.name;
          if (!fits) continue;
          if (className === "java.lang.Integer" || className === "int" || className === "java.lang.Float" || className === "float") {
            return value;
          }
          const terminalMeta = this.reflection.get(className);
          if (!terminalMeta) continue;
          const object = this.instantiateTerminal(className, terminalMeta, [value], env);
          if (object !== null) return object;
        }
      }
      return NO_MATCH;
    }

    if (isIdent(node)) {
      const lower = node.name.toLowerCase();
      if (lower === "true" || lower === "false") {
        const value = lower === "true";
        if (expectedTypes.some((type) => type.dims === 0 && type.name === "game.functions.booleans.BooleanFunction")) {
          return value;
        }
        const terminalClasses = ["game.functions.booleans.BooleanConstant", "java.lang.Boolean", "boolean"];
        for (const className of terminalClasses) {
          for (const expected of expectedTypes) {
            if (expected.dims !== 0) continue;
            const meta = this.reflection.get(className);
            const fits = meta ? isAssignable(meta, expected.name) : className === expected.name;
            if (!fits) continue;
            if (className === "java.lang.Boolean" || className === "boolean") return value;
            if (meta) {
              const object = this.instantiateTerminal(className, meta, [value], env);
              if (object !== null) return object;
            }
          }
        }
      }
    }

    return NO_MATCH;
  }

  private compileEnum(node: LudNode, expectedTypes: readonly JavaType[]): unknown | typeof NO_MATCH {
    if (!isIdent(node)) return NO_MATCH;
    for (const expected of expectedTypes) {
      if (expected.dims !== 0) continue;
      const meta = this.reflection.get(expected.name);
      if (meta?.assignableTo.includes("java.lang.Enum") || expected.name.startsWith("game.types.")) {
        return node.name;
      }
      if (meta && meta.executables.length === 0) {
        return node.name;
      }
    }
    return NO_MATCH;
  }

  private instantiateTerminal(
    className: string,
    meta: ReflectionClass,
    args: readonly unknown[],
    env: ArgCompilerEnv,
  ): unknown | null {
    const executable = meta.executables.find((exec) => exec.kind === "constructor" && exec.params.length === args.length);
    if (!executable) return null;
    return this.instantiate({
      className,
      meta,
      executable,
      execIndex: meta.executables.indexOf(executable),
      args,
      paramNames: executable.params.map(() => null),
      clause: this.clauseFor(meta, executable, meta.executables.indexOf(executable), [], null),
    }, env);
  }

  private instantiate(info: InstantiationInfo, env: ArgCompilerEnv): unknown | null {
    const registry = env.registry ?? this.registry;
    const named = new Map<string, unknown>();
    info.paramNames.forEach((name, index) => {
      if (name !== null) named.set(name, info.args[index]);
    });

    try {
      const bundle = makeArgBundle({
        clause: info.clause,
        clauseIndex: info.execIndex,
        sourceKeyword: info.meta.token,
        constructKey: constructKeyFor(info.meta.token, info.args),
        symbol: info.meta.label,
        positional: info.args.filter((value) => value !== null && value !== undefined),
        named,
      });
      return registry.construct(bundle, env);
    } catch {
      // The registry is TS glue only; Java's search continues if object creation fails.
    }

    const ctor = JAVA_TS_CTORS.get(info.className) as (new (...args: unknown[]) => unknown) & {
      construct?: (...args: unknown[]) => unknown;
      length: number;
    } | undefined;
    if (!ctor) return null;

    try {
      if (info.executable.kind === "construct") {
        // Java overloads `construct(...)` by signature; TS cannot, so the faithful
        // port named the overloads `constructSimple`/`constructIndex`/… on the
        // class. Try the static methods named `construct*` with a matching arity,
        // returning the first that yields a non-null result.
        const ctorObj = ctor as unknown as Record<string, unknown>;
        const exact = ctorObj["construct"];
        const fns: Array<(...a: unknown[]) => unknown> = [];
        if (typeof exact === "function" && (exact as { length: number }).length === info.args.length)
          fns.push(exact as (...a: unknown[]) => unknown);
        for (const name of Object.getOwnPropertyNames(ctorObj)) {
          if (name === "construct" || !name.startsWith("construct")) continue;
          const fn = ctorObj[name];
          if (typeof fn === "function" && (fn as { length: number }).length === info.args.length)
            fns.push(fn as (...a: unknown[]) => unknown);
        }
        for (const fn of fns) {
          try {
            const result = fn.apply(ctor, [...info.args]);
            if (result !== null && result !== undefined) return result;
          } catch { /* try next construct* overload */ }
        }
        return null;
      }
      if (ctor.length !== info.args.length) return null;
      return new ctor(...info.args);
    } catch {
      return null;
    }
  }

  private paramNames(
    meta: ReflectionClass,
    executable: ReflectionExecutable,
    execIndex: number,
    firstArgText: string | null,
  ): readonly (string | null)[] {
    const key = `${meta.label}#${execIndex}#${firstArgText ?? ""}`;
    const cached = this.paramNameCache.get(key);
    if (cached) return cached;

    const params = executable.params;
    // NOTE: .lud named-args use the GRAMMAR LABEL (count:, if:), which can differ
    // from the raw reflected Java parameter identifier — so we derive labels from
    // the grammar clause below rather than from p.name. (Using p.name regressed
    // coverage 15%->3%.)
    const nulls = params.map(() => null as string | null);
    const rule = this.grammar.get(meta.label);
    if (!rule) {
      this.paramNameCache.set(key, nulls);
      return nulls;
    }

    const keywordClauses = rule.clauses.filter(
      (clause) => clause.keyword !== null && normalise(clause.keyword) === normalise(meta.token),
    );
    const clauses = keywordClauses.filter((clause) => clause.args.length === params.length);
    const poolBase = clauses.length > 0 ? clauses : keywordClauses;
    const pool = firstArgText === null ? poolBase : preferLeadingLiteral(poolBase, meta.token, firstArgText);
    const clause = pool[Math.min(execIndex, pool.length - 1)];
    if (!clause) {
      this.paramNameCache.set(key, nulls);
      return nulls;
    }

    const labels = labelsFromClauseRaw(clause.raw);
    let labelIndex = 0;
    const names = params.map((param) => {
      if (!param.ann.includes("Name")) return null;
      const label = labels[labelIndex] ?? null;
      labelIndex++;
      return label;
    });
    this.paramNameCache.set(key, names);
    return names;
  }

  private clauseFor(
    meta: ReflectionClass,
    executable: ReflectionExecutable,
    execIndex: number,
    paramNames: readonly (string | null)[],
    firstArgText: string | null,
  ): GrammarClause {
    const rule = this.grammar.get(meta.label);
    const keywordClauses = rule?.clauses.filter(
      (clause) => clause.keyword !== null && normalise(clause.keyword) === normalise(meta.token),
    ) ?? [];
    const exactClauses = keywordClauses.filter((clause) => clause.args.length === executable.params.length);
    const baseClauses = exactClauses.length > 0 ? exactClauses : keywordClauses;
    const clauses = firstArgText === null ? baseClauses : preferLeadingLiteral(baseClauses, meta.token, firstArgText);
    const clause = clauses[Math.min(execIndex, clauses.length - 1)];
    if (clause) return clause;

    const args = executable.params.map((param, index) => ({
      symbol: param.type,
      optional: isOptionalParam(param),
      list: param.array,
      name: paramNames[index] ?? null,
      orGroup: null,
    }));
    return {
      keyword: meta.token,
      alias: null,
      args,
      raw: `(${meta.token} ${executable.params.map((p) => p.type).join(" ")})`,
    };
  }

  private deepest: { depth: number; msg: string } | null = null;
  private depth = 0;
  /** Per-compile resolution trace (token -> resolved Java class), for oracle diff. */
  public resolveTrace: Array<{ token: string; cls: string }> = [];
  private deepestMsg(): string | null { return this.deepest ? this.deepest.msg : null; }
  private note(message: string): void {
    // Deepest-by-recursion-depth wins, so the recorded divergence is the true
    // (deepest) bind failure rather than a shallow/benign sibling probe.
    if (this.deepest === null || this.depth >= this.deepest.depth)
      this.deepest = { depth: this.depth, msg: message };
    this.lastDivergence = message;
  }
}

export function compile<T = unknown>(
  node: LudNode,
  expectedJavaTypes: readonly string[],
  env: Partial<ArgCompilerEnv> = {},
): T {
  return new ArgCompiler().compile<T>(node, expectedJavaTypes, env);
}

export function compileGame<T = unknown>(source: string, env: Partial<ArgCompilerEnv> = {}): T {
  return new ArgCompiler().compileGame<T>(source, env);
}

export function loadDefaultReflection(path = "tools/parity/ludeme-reflection.json"): ReadonlyMap<string, ReflectionClass> {
  return loadReflection(path);
}

function loadReflection(path = "tools/parity/ludeme-reflection.json"): ReadonlyMap<string, ReflectionClass> {
  const raw = JSON.parse(readFileSync(resolve(path), "utf8")) as Record<string, ReflectionClass>;
  return new Map(Object.entries(raw));
}

function loadGrammar(path = "tools/parity/java-grammar-current.txt"): GrammarModel {
  return parseEbnfGrammar(readFileSync(resolve(path), "utf8"));
}

function parseNodeArgs(node: LudList): ParsedArgs {
  const argsIn: ArgIn[] = [];
  for (let i = 1; i < node.items.length; i++) {
    const item = node.items[i]!;
    if (isIdent(item) && item.name.endsWith(":")) {
      const value = node.items[i + 1];
      if (value) {
        argsIn.push({ node: value, parameterName: item.name.slice(0, -1).toLowerCase() });
        i++;
      }
    } else {
      argsIn.push({ node: item, parameterName: null });
    }
  }
  return { argsIn };
}

function argCombos(args: readonly ArgIn[], numSlots: number): Array<Array<ArgIn | null>> {
  const combos: Array<Array<ArgIn | null>> = [];
  const current = new Array<ArgIn | null>(numSlots).fill(null);
  argCombosInner(args, numSlots, 0, 0, current, combos);
  return combos;
}

function argCombosInner(
  args: readonly ArgIn[],
  numSlots: number,
  numUsed: number,
  slot: number,
  current: Array<ArgIn | null>,
  combos: Array<Array<ArgIn | null>>,
): void {
  if (numUsed > args.length) return;
  if (slot === numSlots) {
    if (numUsed < args.length) return;
    combos.push([...current]);
    return;
  }
  if (numUsed < args.length) {
    current[slot] = args[numUsed]!;
    argCombosInner(args, numSlots, numUsed + 1, slot + 1, current, combos);
    current[slot] = null;
  }
  argCombosInner(args, numSlots, numUsed, slot + 1, current, combos);
}

function isOptionalParam(param: ReflectionParam): boolean {
  return param.ann.includes("Opt") || param.ann.includes("Or") || param.ann.includes("Or2");
}

function paramJavaType(param: ReflectionParam): JavaType {
  return parseJavaType(param.type);
}

function parseJavaType(raw: string): JavaType {
  let dims = 0;
  let text = raw;
  while (text.startsWith("[")) {
    dims++;
    text = text.slice(1);
  }
  if (dims === 0) return { name: raw, dims: 0 };
  if (text.startsWith("L") && text.endsWith(";")) return { name: text.slice(1, -1), dims };
  return { name: primitiveArrayName(text), dims };
}

function primitiveArrayName(code: string): string {
  switch (code) {
    case "I": return "int";
    case "F": return "float";
    case "D": return "double";
    case "Z": return "boolean";
    case "B": return "byte";
    case "C": return "char";
    case "J": return "long";
    case "S": return "short";
    default: return code;
  }
}

function isAssignable(meta: ReflectionClass, expected: string): boolean {
  return meta.assignableTo.includes(expected);
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
  const first = positional.find((value) => value !== null && value !== undefined);
  if (typeof first === "string") {
    const head = keyword.toLowerCase();
    if (head === "move" || head === "sites" || head === "is") {
      return `${head}:${first.toLowerCase()}`;
    }
  }
  return keyword.toLowerCase();
}

function describeNode(node: LudNode): string {
  if (isString(node)) return `"${node.value}"`;
  if (isNumber(node)) return String(node.value);
  if (isIdent(node)) return node.name;
  if (isList(node)) return `(${listHead(node) ?? "?"})`;
  return String(node);
}

function formatExpected(types: readonly JavaType[]): string {
  return types.map((type) => `${type.name}${"[]".repeat(type.dims)}`).join(" | ");
}

function normalise(value: string): string {
  return value.toLowerCase();
}

function isNumericText(text: string): boolean {
  return text.trim() !== "" && Number.isFinite(Number(text));
}

function labelsFromClauseRaw(raw: string): string[] {
  const labels: string[] = [];
  const re = /(?:^|[\s[(|{])([A-Za-z][A-Za-z0-9_]*)\s*:/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw)) !== null) {
    labels.push(match[1]!.toLowerCase());
  }
  return labels;
}

function leadingText(node: LudNode): string | null {
  if (isIdent(node)) return node.name;
  if (isString(node)) return node.value;
  return null;
}

function preferLeadingLiteral(
  clauses: readonly GrammarClause[],
  keyword: string,
  firstArgText: string,
): readonly GrammarClause[] {
  const needle = `(${keyword} ${firstArgText}`.toLowerCase();
  const filtered = clauses.filter((clause) => clause.raw.toLowerCase().startsWith(needle));
  return filtered.length > 0 ? filtered : clauses;
}

function numericFunctionExpected(expected: string, integer: boolean): boolean {
  if (expected === "game.functions.dim.DimFunction") return integer;
  if (expected === "game.functions.ints.IntFunction") return integer;
  if (expected === "game.functions.floats.FloatFunction") return true;
  return false;
}

const NO_MATCH = Symbol("NO_MATCH");
