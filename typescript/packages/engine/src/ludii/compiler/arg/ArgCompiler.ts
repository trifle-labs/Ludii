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
import { ENUM_CONSTANTS } from "../gen/enum-constants.js";
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
import { Sites } from "../../../ludemes/game/functions/region/sites/Sites.js";
import { EmptyDefault } from "../../../ludemes/game/functions/region/sites/index/SitesEmpty.js";
import { SitesPhase } from "../../../ludemes/game/functions/region/sites/simple/SitesSide1to1.js";
import { IsIn1to1 } from "../../../ludemes/game/functions/booleans/is/in1to1/IsIn1to1.js";
import { IsPending1to1 } from "../../../ludemes/game/functions/booleans/is/simple1to1/IsPending1to1.js";
import { IsMover1to1 } from "../../../ludemes/game/functions/booleans/is/player1to1/IsMover1to1.js";
import { IsPrev1to1 } from "../../../ludemes/game/functions/booleans/is/player1to1/IsPrev1to1.js";
import { NoMoves } from "../../../ludemes/game/functions/booleans/no1to1/NoMoves.js";
import { SetPending } from "../../../ludemes/game/rules/play/moves/nonDecision/effect/set/pending/SetPending.js";
import { SetCountStart1to1 } from "../../../ludemes/game/rules/start/SetCountStart1to1.js";
import { Board1to1 } from "../../../ludemes/game/equipment/container/board/Board1to1.js";
import { RectangleOnSquare } from "../../../ludemes/game/functions/graph/generators/basis/square/RectangleOnSquare.js";
import { ConcentricCircle } from "../../../ludemes/game/functions/graph/generators/shape/concentric/ConcentricCircle.js";
import { Rules1to1 } from "../../../ludemes/game/rules/Rules1to1.js";
import { Play1to1 } from "../../../ludemes/game/rules/play/Play1to1.js";

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
  private readonly _enumConstantsByAssignable = new Map<string, Set<string>>();
  private readonly headPath: string[] = [];
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
    this.deepestInst = null;
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
    const pathHead = isList(node) ? (listHead(node) ?? "?") : null;
    if (pathHead !== null) this.headPath.push(pathHead);
    const snap = this.deepest;
    const snapInst = this.deepestInst;
    const r = this.compileMaybeInner(node, expectedTypes, env);
    if (pathHead !== null) this.headPath.pop();
    this.depth--;
    // Discard misses recorded while compiling a subtree that ultimately
    // succeeded (benign probes), so `deepest` reflects only the failed subtree.
    if (r !== null) {
      this.deepest = snap;
      this.deepestInst = snapInst;
    }
    return r;
  }

  private compileMaybeInner(
    node: LudNode,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    if (isReconHash(node) || isReconQuestion(node)) {
      const completion = this.compileReconHash(expectedTypes);
      if (completion !== NO_MATCH) return completion;
    }

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

    const preferredBooleanVariant = this.compilePreferredBooleanVariant(node, head, expectedTypes, env);
    if (preferredBooleanVariant !== null) return preferredBooleanVariant;

    const preferredStartSetCount = this.compileStartSetCount(node, head, expectedTypes, env);
    if (preferredStartSetCount !== null) return preferredStartSetCount;

    const faithfulMoveVariant = this.compileFaithfulMoveVariant(node, head, expectedTypes, env);
    if (faithfulMoveVariant !== null) return faithfulMoveVariant;

    const fallbackReconRules = this.compileFallbackReconRules(node, head, expectedTypes);
    if (fallbackReconRules !== null) return fallbackReconRules;

    const fallbackCircle = this.compileFallbackCircle(node, head, expectedTypes);
    if (fallbackCircle !== null) return fallbackCircle;

    const preferredSites = this.compilePreferredSitesVariant(node, head, expectedTypes, env);
    if (preferredSites !== null) return preferredSites;

    const preferredDirectionsFromTo = this.compilePreferredDirectionsFromTo(node, head, expectedTypes, env);
    if (preferredDirectionsFromTo !== null) return preferredDirectionsFromTo;

    const preferred = this.compilePreferredTokenClass(node, head, expectedTypes, env);
    if (preferred !== null) return preferred;

    const candidates = (this.byToken.get(normalise(head)) ?? [])
      .filter((candidate) => expectedTypes.some((expected) => isAssignable(candidate.meta, expected.name)));

    for (const candidate of candidates) {
      const object = this.compileCandidate(node, candidate, env);
      if (object !== null) {
        this.resolveTrace.push({ token: head, cls: candidate.className });
        return object;
      }
    }

    const fallbackIsPending = this.compileFallbackIsPending(node, head, expectedTypes);
    if (fallbackIsPending !== null) return fallbackIsPending;

    const fallbackStartSetCount = this.compileStartSetCount(node, head, expectedTypes, env);
    if (fallbackStartSetCount !== null) return fallbackStartSetCount;

    const fallbackMoveSetPending = this.compileFallbackMoveSetPending(node, head, expectedTypes, env);
    if (fallbackMoveSetPending !== null) return fallbackMoveSetPending;

    const fallbackSitesList = this.compileFallbackSitesList(node, head, expectedTypes, env);
    if (fallbackSitesList !== null) return fallbackSitesList;

    const fallbackRegionIf = this.compileFallbackRegionIf(node, head, expectedTypes, env);
    if (fallbackRegionIf !== null) return fallbackRegionIf;

    const fallbackBooleanCombinator = this.compileFallbackBooleanCombinator(node, head, expectedTypes, env);
    if (fallbackBooleanCombinator !== null) return fallbackBooleanCombinator;

    this.note(
      candidates.length === 0
        ? `no reflection candidate for (${head}) as ${formatExpected(expectedTypes)}`
        : `(${head}) matched none of ${candidates.length} reflection candidate(s) for ${formatExpected(expectedTypes)}`,
    );
    return null;
  }

  private compileFallbackReconRules(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
  ): unknown | null {
    if (normalise(head) !== "rules") return null;
    const body = node.items[1];
    if (!body || node.items.length !== 2 || !isReconHash(body)) return null;
    if (!expectedTypes.some((expected) => expected.dims === 0 && expected.name === "game.rules.Rules")) return null;
    this.resolveTrace.push({ token: head, cls: "game.rules.Rules" });
    return new Rules1to1(null, null, new Play1to1({ eval: () => [] }), null as never);
  }

  private compileFallbackCircle(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
  ): unknown | null {
    if (normalise(head) !== "circle") return null;
    if (!expectedTypes.some((expected) => expected.dims === 0 && expected.name === "game.functions.graph.GraphFunction")) {
      return null;
    }
    if (node.items.length !== 2) return null;
    const rings = literalIntArray(node.items[1]!);
    if (rings === null) return null;
    this.resolveTrace.push({ token: head, cls: "game.functions.graph.generators.shape.concentric.ConcentricCircle" });
    return new ConcentricCircle(rings, false);
  }

  private compileReconHash(expectedTypes: readonly JavaType[]): unknown | typeof NO_MATCH {
    for (const expected of expectedTypes) {
      if (expected.dims > 0) return [];
      switch (expected.name) {
        case "game.rules.start.StartRule":
          return { applyToInitialState() { /* reconstruction placeholder: no-op */ } };
        case "game.rules.end.EndRule":
          return { eval: () => null };
        case "game.rules.play.moves.Moves":
          return { eval: () => [] };
        case "game.functions.region.RegionFunction":
          return { eval: () => [] };
        case "game.functions.intArray.IntArrayFunction":
          return { eval: () => [] };
        case "game.functions.ints.IntFunction":
        case "game.functions.dim.DimFunction":
          return { eval: () => 0 };
        case "game.functions.booleans.BooleanFunction":
          return { eval: () => false };
        case "game.functions.graph.GraphFunction":
          return defaultReconGraphFunction();
        case "java.lang.String":
          return "Reconstruction";
        case "java.lang.Integer":
        case "int":
          return 0;
        default:
          break;
      }
    }
    return NO_MATCH;
  }

  private compileFaithfulMoveVariant(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    if (normalise(head) !== "move") return null;
    const variant = node.items[1];
    if (variant && isReconHash(variant) && expectedTypes.some((expected) =>
      expected.dims === 0 && expected.name === "game.rules.play.moves.Moves"
    )) {
      return { eval: () => [] };
    }
    if (!variant || !isIdent(variant)) return null;

    const className = FAITHFUL_MOVE_VARIANTS.get(`move:${normalise(variant.name)}`);
    if (!className) return null;

    const meta = this.reflection.get(className);
    if (!meta || !expectedTypes.some((expected) => isAssignable(meta, expected.name))) return null;

    const synthetic: LudList = {
      ...node,
      items: [variant, ...node.items.slice(2)],
    };
    const object = this.compileCandidate(synthetic, { className, meta }, env);
    if (object !== null) {
      this.resolveTrace.push({ token: head, cls: className });
      return object;
    }

    return null;
  }

  private compileFallbackIsPending(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
  ): unknown | null {
    if (normalise(head) !== "is") return null;
    const variant = node.items[1];
    if (!variant || !isIdent(variant) || normalise(variant.name) !== "pending") return null;
    if (!this.fitsExpected("game.functions.booleans.is.simple.IsPending", expectedTypes)) return null;
    this.resolveTrace.push({ token: head, cls: "game.functions.booleans.is.simple.IsPending" });
    return new IsPending1to1();
  }

  private compileStartSetCount(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    if (normalise(head) !== "set") return null;
    if (!expectedTypes.some((expected) =>
      expected.dims === 0 && (expected.name === "game.rules.start.StartRule" || expected.name === "game.rules.Rule")
    )) return null;
    const variant = node.items[1];
    if (!variant || !isIdent(variant) || normalise(variant.name) !== "count") return null;

    const parsed = parseNodeArgs(node);
    const countNode = parsed.argsIn.find((arg) => arg.parameterName === null && arg.node !== variant)?.node;
    const toNode = parsed.argsIn.find((arg) => arg.parameterName === "to")?.node;
    const atNode = parsed.argsIn.find((arg) => arg.parameterName === "at")?.node;
    const count = countNode
      ? this.compileMaybe(countNode, [parseJavaType("game.functions.ints.IntFunction")], env)
      : null;
    if (count === null) return null;
    const region = toNode
      ? this.compileMaybe(toNode, [parseJavaType("game.functions.region.RegionFunction")], env)
      : null;
    const at = atNode
      ? this.compileMaybe(atNode, [parseJavaType("game.functions.ints.IntFunction")], env)
      : null;
    if (region === null && at === null) return null;

    this.resolveTrace.push({ token: head, cls: "game.rules.start.set.sites.SetCount" });
    return new SetCountStart1to1(count as never, null, at as never, region as never);
  }

  private compileFallbackMoveSetPending(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    if (normalise(head) !== "set") return null;
    if (expectedTypes.some((expected) =>
      expected.dims === 0 && (expected.name === "game.rules.start.StartRule" || expected.name === "game.rules.Rule")
    )) return null;
    if (!expectedTypes.some((expected) =>
      expected.dims === 0 && (
        expected.name === "game.rules.play.moves.Moves" ||
        expected.name === "game.rules.play.moves.nonDecision.NonDecision" ||
        expected.name === "game.rules.play.moves.nonDecision.effect.Effect"
      )
    )) return null;

    const variant = node.items[1];
    if (!variant || !isIdent(variant) || normalise(variant.name) !== "pending") return null;
    const parsed = parseNodeArgs(node);
    const payload = parsed.argsIn.find((arg) => arg.parameterName === null && arg.node !== variant)?.node;
    const value = payload
      ? this.compileMaybe(payload, [parseJavaType("game.functions.ints.IntFunction")], env)
      : null;
    const region = payload && value === null
      ? this.compileMaybe(payload, [parseJavaType("game.functions.region.RegionFunction")], env)
      : null;
    if (payload && value === null && region === null) return null;

    this.resolveTrace.push({ token: head, cls: "game.rules.play.moves.nonDecision.effect.set.pending.SetPending" });
    return new SetPending(value as never, region as never, null);
  }

  private compileFallbackSitesList(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    if (normalise(head) !== "sites") return null;
    const variant = node.items[1];
    if (!variant || !isList(variant) || variant.delimiter !== "curly") return null;
    if (!expectedTypes.some((expected) =>
      expected.dims === 0 && expected.name === "game.functions.region.RegionFunction"
    )) return null;

    const sites = variant.items
      .map((item) => this.compileMaybe(item, [parseJavaType("game.functions.ints.IntFunction")], env));
    if (sites.some((site) => site === null)) return null;

    this.resolveTrace.push({ token: head, cls: "game.functions.region.sites.Sites" });
    const compiled = sites as Array<{ eval(ctx: unknown): number }>;
    return {
      eval: (ctx: unknown) => compiled.map((site) => site.eval(ctx)),
    };
  }

  private compileFallbackRegionIf(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    if (normalise(head) !== "if") return null;
    if (!expectedTypes.some((expected) =>
      expected.dims === 0 && expected.name === "game.functions.region.RegionFunction"
    )) return null;

    const conditionNode = node.items[1];
    const okNode = node.items[2];
    const elseNode = node.items[3];
    if (!conditionNode || !okNode) return null;

    const condition = this.compileMaybe(conditionNode, [parseJavaType("game.functions.booleans.BooleanFunction")], env);
    if (condition === null) return null;
    const ok = this.compileMaybe(okNode, [parseJavaType("game.functions.region.RegionFunction")], env);
    if (ok === null) return null;
    const otherwise = elseNode
      ? this.compileMaybe(elseNode, [parseJavaType("game.functions.region.RegionFunction")], env)
      : { eval: () => [] };
    if (otherwise === null) return null;

    this.resolveTrace.push({ token: head, cls: "game.functions.region.math.If" });
    return {
      eval: (ctx: unknown) =>
        (condition as { eval(ctx: unknown): boolean }).eval(ctx)
          ? (ok as { eval(ctx: unknown): number[] }).eval(ctx)
          : (otherwise as { eval(ctx: unknown): number[] }).eval(ctx),
    };
  }

  private compileFallbackBooleanCombinator(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    const headName = normalise(head);
    if (headName !== "and" && headName !== "or" && headName !== "not") return null;
    if (!expectedTypes.some((expected) =>
      expected.dims === 0 && expected.name === "game.functions.booleans.BooleanFunction"
    )) return null;

    const operands = node.items.slice(1)
      .map((item) => this.compileMaybe(item, [parseJavaType("game.functions.booleans.BooleanFunction")], env));
    if (operands.some((operand) => operand === null)) return null;
    if (headName === "not" && operands.length !== 1) return null;
    if (headName !== "not" && operands.length === 0) return null;

    this.resolveTrace.push({ token: head, cls: `game.functions.booleans.math.${headName}` });
    if (headName === "not") {
      const operand = operands[0] as { eval(ctx: unknown): boolean };
      return { eval: (ctx: unknown) => !operand.eval(ctx) };
    }

    const compiled = operands as Array<{ eval(ctx: unknown): boolean }>;
    return {
      eval: (ctx: unknown) => headName === "and"
        ? compiled.every((operand) => operand.eval(ctx))
        : compiled.some((operand) => operand.eval(ctx)),
    };
  }

  private compilePreferredBooleanVariant(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    const headName = normalise(head);
    if (headName !== "is" && headName !== "no") return null;

    const variant = node.items[1];
    if (!variant || !isIdent(variant)) return null;
    const variantName = normalise(variant.name);

    if (headName === "is" && variantName === "in") {
      if (!this.fitsExpected("game.functions.booleans.is.in.IsIn", expectedTypes)) return null;
      const siteNode = node.items[2];
      const regionNode = node.items[3];
      if (!siteNode || !regionNode) return null;
      const siteFn = this.compileMaybe(siteNode, [parseJavaType("game.functions.ints.IntFunction")], env);
      if (siteFn === null) return null;
      const regionFn = this.compileMaybe(regionNode, [parseJavaType("game.functions.region.RegionFunction")], env);
      if (regionFn === null) return null;
      this.resolveTrace.push({ token: head, cls: "game.functions.booleans.is.in.IsIn" });
      return new IsIn1to1(siteFn as never, regionFn as never);
    }

    if (headName === "is" && variantName === "mover") {
      if (!this.fitsExpected("game.functions.booleans.is.player.IsMover", expectedTypes)) return null;
      const whoNode = node.items[2];
      if (!whoNode) return { eval: () => true };
      if (isIdent(whoNode)) {
        this.resolveTrace.push({ token: head, cls: "game.functions.booleans.is.player.IsMover" });
        return new IsMover1to1(null, whoNode.name as never);
      }
      const whoFn = this.compileMaybe(whoNode, [parseJavaType("game.functions.ints.IntFunction")], env);
      if (whoFn === null) return null;
      this.resolveTrace.push({ token: head, cls: "game.functions.booleans.is.player.IsMover" });
      return new IsMover1to1(whoFn as never, null);
    }

    if (headName === "is" && variantName === "prev") {
      if (!this.fitsExpected("game.functions.booleans.is.player.IsPrev", expectedTypes)) return null;
      const whoNode = node.items[2];
      if (!whoNode) return null;
      if (isIdent(whoNode)) {
        this.resolveTrace.push({ token: head, cls: "game.functions.booleans.is.player.IsPrev" });
        return new IsPrev1to1(null, whoNode.name as never);
      }
      const whoFn = this.compileMaybe(whoNode, [parseJavaType("game.functions.ints.IntFunction")], env);
      if (whoFn === null) return null;
      this.resolveTrace.push({ token: head, cls: "game.functions.booleans.is.player.IsPrev" });
      return new IsPrev1to1(whoFn as never, null);
    }

    if (headName === "no" && variantName === "moves") {
      if (!this.fitsExpected("game.functions.booleans.no.moves.NoMoves", expectedTypes)) return null;
      const roleNode = node.items[2];
      const role = roleNode && isIdent(roleNode) ? roleNode.name : "Mover";
      this.resolveTrace.push({ token: head, cls: "game.functions.booleans.no.moves.NoMoves" });
      return new NoMoves(role as never);
    }

    return null;
  }

  private fitsExpected(className: string, expectedTypes: readonly JavaType[]): boolean {
    const meta = this.reflection.get(className);
    if (!meta) return false;
    return expectedTypes.some((expected) => expected.dims === 0 && isAssignable(meta, expected.name));
  }

  private compilePreferredTokenClass(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    const className = PREFERRED_TOKEN_CLASSES.get(normalise(head));
    if (!className) return null;
    if (normalise(head) === "is") {
      const variant = node.items[1];
      if (!variant || !isIdent(variant) || !PREFERRED_IS_VARIANTS.has(normalise(variant.name))) return null;
    }

    const meta = this.reflection.get(className);
    if (!meta || !expectedTypes.some((expected) => isAssignable(meta, expected.name))) return null;

    const object = this.compileCandidate(node, { className, meta }, env);
    if (object !== null) {
      this.resolveTrace.push({ token: head, cls: className });
      return object;
    }

    return null;
  }

  private compilePreferredSitesVariant(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    if (normalise(head) !== "sites") return null;
    const variant = node.items[1];
    if (!variant || !isIdent(variant)) return null;
    const variantName = normalise(variant.name);
    if (
      variantName !== "empty" &&
      variantName !== "board" &&
      variantName !== "phase" &&
      variantName !== "track" &&
      variantName !== "hand" &&
      variantName !== "occupied" &&
      !PLAYER_SITE_VARIANTS.has(variantName) &&
      !SIMPLE_SITE_VARIANTS.has(variantName)
    ) return null;

    const meta = this.reflection.get("game.functions.region.sites.Sites");
    if (!meta || !expectedTypes.some((expected) => isAssignable(meta, expected.name))) return null;

    const siteType = node.items[2] && isIdent(node.items[2]) ? node.items[2].name : null;
    this.resolveTrace.push({ token: head, cls: "game.functions.region.sites.Sites" });
    if (variantName === "empty") return new EmptyDefault(siteType);
    if (variantName === "phase") {
      const phaseNode = node.items[2];
      const phaseFn = phaseNode
        ? this.compileMaybe(phaseNode, [parseJavaType("game.functions.ints.IntFunction")], env)
        : null;
      if (phaseFn === null) return null;
      return new SitesPhase(phaseFn as never);
    }
    if (variantName === "track") {
      const role = node.items[2] && isIdent(node.items[2]) ? node.items[2].name : null;
      const name = node.items[2] && isString(node.items[2]) ? node.items[2].value : null;
      const parsed = parseNodeArgs(node);
      const fromNode = parsed.argsIn.find((arg) => arg.parameterName === "from")?.node;
      const toNode = parsed.argsIn.find((arg) => arg.parameterName === "to")?.node;
      const from = fromNode
        ? this.compileMaybe(fromNode, [parseJavaType("game.functions.ints.IntFunction")], env)
        : null;
      const to = toNode
        ? this.compileMaybe(toNode, [parseJavaType("game.functions.ints.IntFunction")], env)
        : null;
      return Sites.constructTrack("Track" as never, null, role as never, name, from as never, to as never);
    }
    if (variantName === "occupied") {
      // @java Sites.construct(SitesOccupiedType, ...) -> SitesOccupied. The generic
      // candidate path mis-resolved (sites Occupied by:Mover) to SitesTrack (empty),
      // breaking late-game rules like Nine Men's Morris flying.
      const parsed = parseNodeArgs(node);
      const byNode = parsed.argsIn.find((arg) => arg.parameterName === "by")?.node;
      const byRole = byNode && isIdent(byNode) ? byNode.name : null;
      const byFn = byNode && !byRole
        ? this.compileMaybe(byNode, [parseJavaType("game.functions.ints.IntFunction")], env)
        : null;
      if (byNode && byRole === null && byFn === null) return null;
      return Sites.constructOccupied(
        "Occupied" as never,
        byFn as never,
        byRole as never,
        null, null, null, null, null, null,
        (node.items[2] && isIdent(node.items[2]) && ["Cell","Vertex","Edge"].includes(node.items[2].name) ? node.items[2].name : null) as never,
      );
    }
    if (variantName === "hand") {
      // @java Sites.construct(SitesPlayerType.Hand, ...) -> SitesHand. The role/player
      // arg is node.items[2] (e.g. `(sites Hand Mover)`); the generic candidate path
      // mis-resolved this to SitesEquipmentRegion (empty), breaking HandEmpty conditions.
      const roleArg = node.items[2] && isIdent(node.items[2]) ? node.items[2].name : null;
      return Sites.constructPlayer("Hand" as never, null, null, roleArg, null, null);
    }
    if (PLAYER_SITE_VARIANTS.has(variantName)) return playerSitesRegion(variantName);
    return Sites.constructSimple(simpleSiteVariant(variantName) as never, siteType);
  }

  /**
   * @java Directions(SiteType, from:IntFunction, to:IntFunction) — the direction(s) from
   * one site to another, computed from the board geometry. The generic candidate path
   * mis-binds this overload onto the static-names Directions ctor (empty names), breaking
   * push mechanics like Gekitai's (directions Cell from:(last To) to:(site)).
   */
  private compilePreferredDirectionsFromTo(
    node: LudList,
    head: string,
    expectedTypes: readonly JavaType[],
    env: ArgCompilerEnv,
  ): unknown | null {
    if (normalise(head) !== "directions") return null;
    if (!expectedTypes.some((expected) => expected.dims === 0 &&
      (expected.name === "game.functions.directions.DirectionsFunction" ||
       expected.name === "game.util.directions.Direction" ||
       expected.name === "game.functions.directions.Directions"))) return null;
    const parsed = parseNodeArgs(node);
    const fromNode = parsed.argsIn.find((arg) => arg.parameterName === "from")?.node;
    const toNode = parsed.argsIn.find((arg) => arg.parameterName === "to")?.node;
    if (!fromNode || !toNode) return null;
    const fromFn = this.compileMaybe(fromNode, [parseJavaType("game.functions.ints.IntFunction")], env);
    const toFn = this.compileMaybe(toNode, [parseJavaType("game.functions.ints.IntFunction")], env);
    if (fromFn === null || toFn === null) return null;
    this.resolveTrace.push({ token: head, cls: "game.functions.directions.Directions" });
    type Ctx = { game?: { equipment?: { board?: { trajectories?: { xOf(s: number): number; yOf(s: number): number } | null; width?: number } } } };
    const f = fromFn as { eval(c: unknown): number };
    const t = toFn as { eval(c: unknown): number };
    return {
      eval(ctx: unknown): string[] {
        const a = f.eval(ctx);
        const b = t.eval(ctx);
        if (a < 0 || b < 0 || a === b) return [];
        const board = (ctx as Ctx).game?.equipment?.board;
        const traj = board?.trajectories;
        let dx: number; let dy: number;
        if (traj) {
          dx = traj.xOf(b) - traj.xOf(a);
          dy = traj.yOf(b) - traj.yOf(a);
        } else {
          const W = board?.width ?? 8;
          dx = (b % W) - (a % W);
          dy = Math.floor(b / W) - Math.floor(a / W);
        }
        const sx = Math.sign(dx); const sy = Math.sign(dy);
        const name =
          sx === 0 && sy > 0 ? "N" : sx > 0 && sy > 0 ? "NE" :
          sx > 0 && sy === 0 ? "E" : sx > 0 && sy < 0 ? "SE" :
          sx === 0 && sy < 0 ? "S" : sx < 0 && sy < 0 ? "SW" :
          sx < 0 && sy === 0 ? "W" : "NW";
        return [name];
      },
    };
  }

  private compileCandidate(node: LudList, candidate: Candidate, env: ArgCompilerEnv): unknown | null {
    if (this.rejectIncompatibleCandidate(node, candidate)) return null;
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

  private rejectIncompatibleCandidate(node: LudList, candidate: Candidate): boolean {
    if (
      (candidate.className === "game.functions.region.sites.coords.SitesCoords" ||
        candidate.className === "game.functions.region.sites.Sites") &&
      normalise(listHead(node) ?? "") === "sites"
    ) {
      const variant = node.items[1];
      if (variant !== undefined && isList(variant) && variant.delimiter === "curly") {
        return variant.items.some((item) => !isString(item));
      }
    }
    return false;
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
        // Reflected Java parameter name, offered as an ALTERNATIVE to the grammar label
        // for @Name params — needed for static construct() executables (e.g. count's
        // `in:`/`at:`) whose params don't align to a grammar clause, so the clause-derived
        // label is absent or misaligned. Grammar label stays primary (no regression).
        const reflName = paramHasName ? (executable.params[slot]!.name ?? null) : null;
        // Case-insensitive: .lud labels are lowercase (if:, in:) while keyword-escaped
        // Java params are capitalized (If, In, Do) — match them regardless of case.
        const nameMatches = (an: string): boolean => {
          const a = an.toLowerCase();
          return a === paramName?.toLowerCase() || (reflName !== null && a === reflName.toLowerCase());
        };
        // A labeled (@Name) slot must be filled by a NAMED arg matching its label/refl-name.
        if (paramName !== null && (argIn.parameterName === null || !nameMatches(argIn.parameterName))) {
          matched = false;
          break;
        }
        if (argIn.parameterName !== null) {
          if (paramName === null && reflName === null) {
            matched = false;
            break;
          }
          if (!nameMatches(argIn.parameterName)) {
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

    if (isNumber(node) || (isIdent(node) && (isNumericText(node.name) || APPLICATION_CONSTANTS.has(node.name)))) {
      const value = isNumber(node)
        ? node.value
        : (APPLICATION_CONSTANTS.get(node.name) ?? Number(node.name));
      const integer = Number.isInteger(value);
      // Faithful: a numeric literal for an IntFunction/FloatFunction/DimFunction param is
      // wrapped in an IntConstant/FloatConstant/DimConstant (a function object with eval()),
      // NOT returned as a raw number — Java does this, and ludeme eval calls `.eval(ctx)`.
      // Fall through to the constant-function instantiation below. (Primitive int/Integer/
      // float params are still returned as raw numbers, handled in the loop.)
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
        // @java Enum.valueOf during reflection compilation: an ident only matches an
        // enum-typed parameter when it IS one of that enum's constants. Without this
        // check `(no Pieces P2)` binds P2 to the @Opt SiteType slot and the RoleType
        // is silently dropped (El Perro's winner detection). ENUM_CONSTANTS is
        // generated from the Java sources by tools/parity/extract-enum-constants.py.
        const constants = ENUM_CONSTANTS.get(expected.name);
        if (constants && !constants.has(node.name)) continue;
        return node.name;
      }
      if (meta && meta.executables.length === 0) {
        // Interface/abstract grammar type with no constructors (e.g. game.util.directions.
        // Direction): Java matches an ident here by Enum.valueOf against the enums that
        // IMPLEMENT it (AbsoluteDirection.N satisfies a Direction param). Accept the ident
        // only when it is a constant of an enum assignable to this expected type — a bare
        // ident is never a legal value for a non-enum interface like IntFunction (it used
        // to leak through as a raw string, e.g. (value Player Mover) binding "Mover" into
        // the @Or IntFunction slot instead of the RoleType slot).
        if (this.enumConstantsAssignableTo(expected.name).has(node.name)) {
          return node.name;
        }
        continue;
      }
    }
    return NO_MATCH;
  }

  /** Union of constants of every enum class assignable to `typeName` (lazily built). */
  private enumConstantsAssignableTo(typeName: string): ReadonlySet<string> {
    let set = this._enumConstantsByAssignable.get(typeName);
    if (set === undefined) {
      set = new Set<string>();
      for (const [enumClass, constants] of ENUM_CONSTANTS) {
        const enumMeta = this.reflection.get(enumClass);
        if (enumMeta?.assignableTo.includes(typeName)) {
          for (const c of constants) set.add(c);
        }
      }
      this._enumConstantsByAssignable.set(typeName, set);
    }
    return set;
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
    if (REGISTRY_FIRST_CLASSES.has(info.className)) {
      const registryFirst = this.instantiateRegistry(info, env);
      if (registryFirst !== null && registryFirst !== undefined) {
        if (info.className === "game.equipment.container.board.custom.MancalaBoard") {
          return boardWithCompiledTracks(registryFirst, info.args);
        }
        return registryFirst;
      }
    }

    // FAITHFUL FIRST: the canonical reflection-driven path (JAVA_TS_CTORS). This is the
    // one true port. The bespoke LudemeRegistry factories are only a fallback for ludemes
    // whose faithful mapping is still missing, and are being phased out entirely.
    const faithful = this.instantiateFaithful(info);
    if (faithful !== null && faithful !== undefined) {
      if (info.className === "game.equipment.Equipment") {
        hydrateEquipmentRegions(faithful, info.args);
        hydrateEquipmentMaps(faithful, info.args);
      }
      return faithful;
    }

    const faithfulMoveVariant = this.instantiateFaithfulMoveVariant(info);
    if (faithfulMoveVariant !== null && faithfulMoveVariant !== undefined) return faithfulMoveVariant;

    const registryFallback = this.instantiateRegistry(info, env);
    if (registryFallback !== null && registryFallback !== undefined) return registryFallback;
    // instantiateFaithful already recorded a specific noteInstFail on its miss.
    return null;
  }

  private instantiateRegistry(info: InstantiationInfo, env: ArgCompilerEnv): unknown | null {
    const result = this.instantiateRegistryInner(info, env);
    // Trace registry WINS (non-null) — the true bespoke-factory dependency of the
    // faithful path (item-2 deletion worklist). Attempts that return null are probes.
    if (result !== null && result !== undefined && process.env["LUDII_TRACE_REGISTRY"])
      console.error("[registry]", info.className);
    return result;
  }

  private instantiateRegistryInner(info: InstantiationInfo, env: ArgCompilerEnv): unknown | null {
    const registry = env.registry ?? this.registry;
    const named = new Map<string, unknown>();
    info.paramNames.forEach((name, index) => {
      if (name !== null) named.set(name, info.args[index]);
    });
    const constructKey = constructKeyFor(info.meta.token, info.args);
    try {
      const bundle = makeArgBundle({
        clause: info.clause,
        clauseIndex: info.execIndex,
        sourceKeyword: info.meta.token,
        constructKey,
        symbol: info.meta.label,
        positional: info.args.filter((value) => value !== null && value !== undefined),
        named,
      });
      const r = registry.construct(bundle, env);
      if (r !== null && r !== undefined) {
        if (info.className === "game.equipment.Equipment") {
          hydrateEquipmentRegions(r, info.args);
          hydrateEquipmentMaps(r, info.args);
        }
        return r;
      }
    } catch {
      // Registry is bespoke glue; faithful is canonical. Fall through.
    }
    // instantiateFaithful already recorded a specific noteInstFail on its miss.
    return null;
  }

  private instantiateFaithfulMoveVariant(info: InstantiationInfo): unknown | null {
    const constructKey = constructKeyFor(info.meta.token, info.args);
    const className = FAITHFUL_MOVE_VARIANTS.get(constructKey);
    if (!className) return null;

    const meta = this.reflection.get(className);
    if (!meta) return null;

    const args = info.args.slice(1);
    for (let execIndex = 0; execIndex < meta.executables.length; execIndex++) {
      const executable = meta.executables[execIndex]!;
      if (executable.kind !== "constructor" || executable.params.length !== args.length) continue;

      const firstArgText = typeof args[0] === "string" ? args[0] : null;
      const paramNames = this.paramNames(meta, executable, execIndex, firstArgText);
      const object = this.instantiateFaithful({
        className,
        meta,
        executable,
        execIndex,
        args,
        paramNames,
        clause: this.clauseFor(meta, executable, execIndex, paramNames, firstArgText),
      });
      if (object !== null && object !== undefined) return object;
    }

    return null;
  }

  /** The canonical faithful instantiation via JAVA_TS_CTORS. Returns null on any miss. */
  private instantiateFaithful(info: InstantiationInfo): unknown | null {
    const builtin = instantiateBuiltinFaithful(info.className, info.args);
    if (builtin !== NO_BUILTIN) return builtin;

    const ctor = JAVA_TS_CTORS.get(info.className) as (new (...args: unknown[]) => unknown) & {
      construct?: (...args: unknown[]) => unknown;
      length: number;
    } | undefined;
    if (!ctor) {
      this.noteInstFail(`cannot instantiate ${info.className}: no TS constructor mapped`);
      return null;
    }

    try {
      if (info.executable.kind === "construct") {
        // Java overloads `construct(...)` by signature; TS cannot, so the faithful
        // port named the overloads `constructSimple`/`constructIndex`/… on the
        // class. Try the static methods named `construct*` with a matching arity,
        // returning the first that yields a non-null result.
        const ctorObj = ctor as unknown as Record<string, unknown>;
        // JS Function.length counts only params before the first default, so a
        // faithfully-ported static construct with an @Opt/default tail (e.g.
        // All.construct(allType, type=null, region=null, except=null, excepts=null)
        // has length 1) must match when its REQUIRED params are satisfiable:
        // fn.length <= args.length. Exact-arity candidates are tried first.
        const exactFns: Array<(...a: unknown[]) => unknown> = [];
        const relaxedFns: Array<(...a: unknown[]) => unknown> = [];
        const consider = (fn: unknown): void => {
          if (typeof fn !== "function") return;
          const len = (fn as { length: number }).length;
          if (len === info.args.length) exactFns.push(fn as (...a: unknown[]) => unknown);
          else if (len < info.args.length) relaxedFns.push(fn as (...a: unknown[]) => unknown);
        };
        consider(ctorObj["construct"]);
        for (const name of Object.getOwnPropertyNames(ctorObj)) {
          if (name === "construct" || !name.startsWith("construct")) continue;
          consider(ctorObj[name]);
        }
        const fns = [...exactFns, ...relaxedFns];
        for (const fn of fns) {
          try {
            const result = fn.apply(ctor, [...info.args]);
            if (result !== null && result !== undefined) return result;
          } catch { /* try next construct* overload */ }
        }
        this.noteInstFail(`cannot instantiate ${info.className}: no static construct(${info.args.length}) overload (Java construct arity drift)`);
        return null;
      }
      // Construct when enough args are bound to satisfy the TS ctor's REQUIRED params.
      // JS Function.length counts only params before the first default/optional, so a
      // faithfully-ported class with an @Opt/default tail (e.g. Card: type,rank,value +
      // 3 optional) reports ctor.length < the bound Java arity; passing all bound args
      // fills the optionals (and JS ignores any surplus). Only too-FEW args is a real
      // drift failure.
      if (info.args.length < ctor.length) {
        this.noteInstFail(`cannot instantiate ${info.className}: TS ctor needs >=${ctor.length} args but only ${info.args.length} bound (constructor drift)`);
        return null;
      }
      if (
        info.className === "game.rules.play.moves.nonDecision.effect.Apply" &&
        info.args.length === 1 &&
        info.executable.params[0]?.name === "effect"
      ) {
        return new ctor(null, info.args[0]);
      }
      if (
        info.className === "game.rules.Rules" &&
        info.args.length === 5 &&
        Array.isArray(info.args[3]) &&
        info.args[3].length > 0
      ) {
        resolveNextPhaseTargets(info.args[3]);
      }
      if (
        info.className === "game.rules.Rules" &&
        info.args.length === 5 &&
        info.args[2] === null &&
        Array.isArray(info.args[3]) &&
        info.args[3].length > 0
      ) {
        const firstPhasePlay = (info.args[3][0] as { play?: unknown } | undefined)?.play;
        if (firstPhasePlay !== undefined && firstPhasePlay !== null) {
          return new ctor(info.args[0], info.args[1], firstPhasePlay, info.args[3], info.args[4]);
        }
      }
      return new ctor(...info.args);
    } catch (e) {
      this.noteInstFail(`cannot instantiate ${info.className}: constructor threw (${String((e as Error)?.message ?? e).slice(0, 80)})`);
      if (process.env["LUDII_DEBUG_INST"]) console.error("[inst threw]", (e as Error)?.stack?.split("\n").slice(0, 4).join(" | "));
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
    // .lud named-args use the GRAMMAR LABEL (count:, if:), which can differ from the raw
    // reflected Java identifier — derive labels from the grammar clause, NOT p.name.
    // (Using p.name as the PRIMARY name regressed coverage 15%->3%.) The reflected name
    // is offered as an ALTERNATIVE match in compileExecutable (needed for static
    // construct() executables like count's `in:`, which don't align to a grammar clause).
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

  private deepest: { depth: number; msg: string; path?: string } | null = null;
  /**
   * Instantiation-drift failures: the args bound to a Java constructor fine, but
   * the mapped TS class could not be built (e.g. its ported constructor arity
   * differs from Java's — constructor drift). These are HIGH-signal real blockers
   * and outrank ordinary type-match probes (which are often benign stale misses
   * from alternative @Or/@Opt combos that a sibling later satisfied).
   */
  private deepestInst: { depth: number; msg: string } | null = null;
  private depth = 0;
  /** Per-compile resolution trace (token -> resolved Java class), for oracle diff. */
  public resolveTrace: Array<{ token: string; cls: string }> = [];
  private deepestMsg(): string | null {
    return this.deepestInst ? this.deepestInst.msg : this.deepest ? this.deepest.msg : null;
  }
  private noteInstFail(message: string): void {
    if (this.deepestInst === null || this.depth >= this.deepestInst.depth)
      this.deepestInst = { depth: this.depth, msg: message };
    this.lastDivergence = message;
  }
  private note(message: string): void {
    // Deepest-by-recursion-depth wins, so the recorded divergence is the true
    // (deepest) bind failure rather than a shallow/benign sibling probe.
    if (this.deepest === null || this.depth >= this.deepest.depth)
      this.deepest = { depth: this.depth, msg: message, path: this.headPath.join(">") };
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

function isReconHash(node: LudNode): boolean {
  if (isIdent(node) && node.name === "[#]") return true;
  return (
    isList(node) &&
    (node as { delimiter: string }).delimiter === "square" &&
    node.items.length === 1 &&
    isIdent(node.items[0]!) &&
    node.items[0]!.name === "#"
  );
}

function isReconQuestion(node: LudNode): boolean {
  if (isIdent(node) && node.name === "[?]") return true;
  return (
    isList(node) &&
    (node as { delimiter: string }).delimiter === "square" &&
    node.items.length === 1 &&
    isIdent(node.items[0]!) &&
    node.items[0]!.name === "?"
  );
}

function literalIntArray(node: LudNode): number[] | null {
  const literal = literalInt(node);
  if (literal !== null) return [literal];
  if (!isList(node)) return null;
  if (node.delimiter !== "curly") return null;
  const values: number[] = [];
  for (const item of node.items) {
    const value = literalInt(item);
    if (value === null) return null;
    values.push(value);
  }
  return values;
}

function literalInt(node: LudNode): number | null {
  if (isNumber(node)) return Math.trunc(node.value);
  if (isIdent(node) && isNumericText(node.name)) return Math.trunc(Number(node.name));
  return null;
}

function defaultReconGraphFunction(): unknown {
  const graph = new RectangleOnSquare(1, 1);
  return {
    eval(_context: unknown, siteType: string): unknown {
      return graph.eval(siteType);
    },
    gameFlags(_game: unknown): bigint {
      return BigInt(0);
    },
    preprocess(_game: unknown): void {
      // Nothing to do.
    },
  };
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

function resolveNextPhaseTargets(phases: readonly unknown[]): void {
  const nameToIdx = new Map<string, number>();
  for (let idx = 0; idx < phases.length; idx++) {
    const name = (phases[idx] as { name?: unknown } | undefined)?.name;
    if (typeof name === "string") nameToIdx.set(name, idx);
  }
  for (const phase of phases) {
    const nextPhases = (phase as { nextPhases?: readonly unknown[] } | undefined)?.nextPhases ?? [];
    for (const np of nextPhases) {
      const next = np as { targetName?: unknown; targetIndex?: number };
      if (typeof next.targetName !== "string") continue;
      const idx = nameToIdx.get(next.targetName);
      if (idx !== undefined) next.targetIndex = idx;
    }
  }
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
const NO_BUILTIN = Symbol("NO_BUILTIN");

function instantiateBuiltinFaithful(className: string, args: readonly unknown[]): unknown | typeof NO_BUILTIN {
  if (args.length !== 0) return NO_BUILTIN;
  switch (className) {
    case "game.functions.ints.iterator.From":
      return { eval: (ctx: { _evalFrom: number }) => ctx._evalFrom };
    case "game.functions.ints.iterator.To":
      return { eval: (ctx: { _evalTo: number }) => ctx._evalTo };
    case "game.functions.ints.iterator.Between":
      return { eval: (ctx: { _evalBetween: number }) => ctx._evalBetween };
    default:
      return NO_BUILTIN;
  }
}

const PREFERRED_TOKEN_CLASSES = new Map<string, string>([
  ["is", "game.functions.booleans.is.Is"],
  ["no", "game.functions.booleans.no.No"],
]);
const PREFERRED_IS_VARIANTS = new Set<string>(["empty", "enemy", "in", "line", "occupied"]);
const PLAYER_SITE_VARIANTS = new Set<string>([
  "mover", "next", "player", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8",
  "p9", "p10", "p11", "p12", "p13", "p14", "p15", "p16",
]);
/**
 * @java Language/src/grammar/Grammar.java:114 ApplicationConstants — named int
 * constants the Java compiler resolves to IntConstant(value) in ArgTerminal
 * (e.g. `(= (trackSite …) End)` in IsEndTrack.def). Values from Common/src/main/Constants.java.
 */
const APPLICATION_CONSTANTS = new Map<string, number>([
  ["Off", -1],
  ["End", -2],
  ["Undefined", -1],
  ["Infinity", 1000000000],
]);

const SIMPLE_SITE_VARIANTS = new Set<string>([
  "board", "bottom", "center", "centre", "corners", "left", "outer", "perimeter", "right", "top",
]);

function playerSitesRegion(variantName: string): { eval(ctx: unknown): number[] } {
  return {
    eval(ctx: unknown): number[] {
      const c = ctx as {
        state: { mover: number; next?: number; cells: readonly number[] };
        game: {
          numPlayers: number;
          equipment?: {
            board?: { numSites?: number };
            playerRegions?: ReadonlyMap<number, { eval(ctx: unknown): readonly number[] }>;
          };
        };
      };
      const pid = resolveSitesPlayer(variantName, c);
      if (pid < 1) return [];
      const region = c.game.equipment?.playerRegions?.get(pid);
      if (region) return [...region.eval(ctx)];

      const cells = c.state.cells;
      const boardN = c.game.equipment?.board?.numSites ?? cells.length;
      const sites: number[] = [];
      for (let site = 0; site < boardN; site++) {
        if (cells[site] === pid) sites.push(site);
      }
      return sites;
    },
  };
}

function resolveSitesPlayer(
  variantName: string,
  ctx: { state: { mover: number; next?: number }; game: { numPlayers: number } },
): number {
  if (variantName === "mover") return ctx.state.mover;
  // @java RoleType.Player — the player iterated by (forEach Player ...): context.player().
  if (variantName === "player") {
    const p = (ctx as { _evalPlayer?: number })._evalPlayer;
    return p !== undefined ? p : ctx.state.mover;
  }
  if (variantName === "next") {
    const stateNext = ctx.state.next ?? 0;
    return stateNext > 0 ? stateNext : (ctx.state.mover % ctx.game.numPlayers) + 1;
  }
  if (/^p\d+$/.test(variantName)) return Number(variantName.slice(1));
  return -1;
}

function simpleSiteVariant(variantName: string): string {
  switch (variantName) {
    case "bottom": return "Bottom";
    case "center": return "Centre";
    case "centre": return "Centre";
    case "corners": return "Corners";
    case "left": return "Left";
    case "outer": return "Outer";
    case "perimeter": return "Perimeter";
    case "right": return "Right";
    case "top": return "Top";
    default: return "Board";
  }
}

function boardWithCompiledTracks(board: unknown, args: readonly unknown[]): unknown {
  if (!(board instanceof Board1to1)) return board;
  if (board.getTracks().length > 0 || board.trajectories === null) return board;
  const tracks = flattenUnknown(args).filter(isCompiledTrack);
  if (tracks.length === 0) return board;
  return new Board1to1(
    board.width,
    board.height,
    board.numSites,
    board.trajectories,
    board.containerSpan,
    tracks as never,
  );
}

function hydrateEquipmentRegions(equipment: unknown, args: readonly unknown[]): void {
  const target = equipment as {
    playerRegions?: ReadonlyMap<number, { eval(ctx: unknown): readonly number[] }>;
    namedPlayerRegions?: ReadonlyMap<string, ReadonlyMap<number, { eval(ctx: unknown): readonly number[] }>>;
  };
  if (target.playerRegions !== undefined && target.playerRegions.size > 0) return;
  if (target.namedPlayerRegions !== undefined && target.namedPlayerRegions.size > 0) return;

  const playerRegions = new Map<number, { eval(ctx: unknown): number[] }>();
  const namedPlayerRegions = new Map<string, Map<number, { eval(ctx: unknown): number[] }>>();

  for (const region of flattenUnknown(args).filter(isCompiledRegionItem)) {
    const owner = roleOwnerId(region.role());
    if (owner < 0) continue;
    const fn = regionFunctionFromItem(region);
    if (fn === null) continue;
    const name = region.name();
    if (typeof name === "string" && !/^RegionP?\d+$/i.test(name)) {
      const key = name.toLowerCase();
      const byOwner = namedPlayerRegions.get(key) ?? new Map<number, { eval(ctx: unknown): number[] }>();
      byOwner.set(owner, fn);
      namedPlayerRegions.set(key, byOwner);
      if (!playerRegions.has(owner)) playerRegions.set(owner, fn);
    } else {
      playerRegions.set(owner, fn);
    }
  }

  if (playerRegions.size > 0) {
    Object.defineProperty(equipment as object, "playerRegions", {
      value: playerRegions,
      configurable: true,
      enumerable: true,
    });
  }
  if (namedPlayerRegions.size > 0) {
    Object.defineProperty(equipment as object, "namedPlayerRegions", {
      value: namedPlayerRegions,
      configurable: true,
      enumerable: true,
    });
  }
}

function hydrateEquipmentMaps(equipment: unknown, args: readonly unknown[]): void {
  let board: unknown;
  try {
    board = (equipment as { board?: unknown }).board;
  } catch {
    return;
  }
  if (board === null || typeof board !== "object") return;
  const boardTarget = board as { _pendingMaps?: Map<string, Map<number, number>> };
  if (boardTarget._pendingMaps !== undefined && boardTarget._pendingMaps.size > 0) return;

  const pendingMaps = new Map<string, Map<number, number>>();
  for (const item of flattenUnknown(args)) {
    if (!isCompiledMapItem(item)) continue;
    if (item.map().size === 0 && typeof item.computeMap === "function") {
      try {
        item.computeMap({
          board: () => board,
          equipment: () => ({
            components: () => [null, ...((equipment as { pieces?: readonly unknown[] }).pieces ?? [])],
          }),
        });
      } catch {
        /* Keep any entries already present; mapEntry falls back on misses. */
      }
    }
    const name = item.name();
    const key = name === null || name === "Map" ? "__default__" : name;
    pendingMaps.set(key, mapEntriesWithLandmarkFallback(item, board));
  }

  if (pendingMaps.size > 0) {
    Object.defineProperty(board, "_pendingMaps", {
      value: pendingMaps,
      configurable: true,
      enumerable: true,
    });
  }
}

function mapEntriesWithLandmarkFallback(
  item: { map(): ReadonlyMap<number, number> },
  board: object,
): Map<number, number> {
  const entries = new Map(item.map());
  const pairs = (item as { _mapPairs?: readonly unknown[] })._mapPairs;
  if (!Array.isArray(pairs)) return entries;
  const boardInfo = board as { containerSpan?: number; numSites?: number };
  const lastSite = (boardInfo.containerSpan ?? boardInfo.numSites ?? 0) - 1;
  for (const pair of pairs) {
    const pairAny = pair as {
      getIntKey?: () => { eval(ctx: unknown): number };
      landmark?: number | null;
    };
    const landmark = pairAny.landmark ?? null;
    if (landmark !== 5 && landmark !== 6) continue;
    const key = pairAny.getIntKey?.().eval({}) ?? -1;
    if (key < 0) continue;
    entries.set(key, landmark === 5 ? 0 : lastSite);
  }
  return entries;
}

function flattenUnknown(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value)) out.push(...flattenUnknown(value));
    else out.push(value);
  }
  return out;
}

function isCompiledTrack(value: unknown): value is { buildTrack(width: number, height: number, traj?: unknown): void } {
  return value !== null && typeof value === "object" &&
    typeof (value as { buildTrack?: unknown }).buildTrack === "function" &&
    typeof (value as { elems?: unknown }).elems === "function";
}

function isCompiledRegionItem(value: unknown): value is {
  role(): unknown;
  name(): unknown;
  sites(): readonly number[] | null;
  region(): readonly { eval(ctx: unknown): readonly number[] }[] | null;
} {
  return value !== null && typeof value === "object" &&
    typeof (value as { role?: unknown }).role === "function" &&
    typeof (value as { name?: unknown }).name === "function" &&
    typeof (value as { sites?: unknown }).sites === "function" &&
    typeof (value as { region?: unknown }).region === "function";
}

function isCompiledMapItem(value: unknown): value is {
  name(): string | null;
  map(): ReadonlyMap<number, number>;
  computeMap?: (game: unknown) => void;
} {
  return value !== null && typeof value === "object" &&
    typeof (value as { name?: unknown }).name === "function" &&
    typeof (value as { map?: unknown }).map === "function";
}

function regionFunctionFromItem(region: {
  sites(): readonly number[] | null;
  region(): readonly { eval(ctx: unknown): readonly number[] }[] | null;
}): { eval(ctx: unknown): number[] } | null {
  const regions = region.region();
  if (regions !== null && regions.length > 0) {
    return {
      eval(ctx: unknown): number[] {
        const seen = new Set<number>();
        for (const fn of regions) for (const site of fn.eval(ctx)) seen.add(site);
        return [...seen];
      },
    };
  }
  const sites = region.sites();
  if (sites !== null) return { eval: () => [...sites] };
  return null;
}

function roleOwnerId(role: unknown): number {
  if (typeof role !== "string") return -1;
  if (/^P\d+$/i.test(role)) return Number(role.slice(1));
  if (role === "Shared" || role === "Neutral") return 0;
  return -1;
}

const FAITHFUL_MOVE_VARIANTS = new Map<string, string>([
  ["move:add", "game.rules.play.moves.nonDecision.effect.Add"],
  ["move:hop", "game.rules.play.moves.nonDecision.effect.Hop"],
  ["move:remove", "game.rules.play.moves.nonDecision.effect.Remove"],
  ["move:shoot", "game.rules.play.moves.nonDecision.effect.Shoot"],
  ["move:select", "game.rules.play.moves.nonDecision.effect.Select"],
  ["move:step", "game.rules.play.moves.nonDecision.effect.Step"],
  ["move:slide", "game.rules.play.moves.nonDecision.effect.Slide"],
]);

const REGISTRY_FIRST_CLASSES = new Set<string>([
]);
