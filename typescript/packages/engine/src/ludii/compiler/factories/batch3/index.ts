import type { ArgBundle } from "../../ArgBundle.js";
import type { LudemeRegistry } from "../../LudemeRegistry.js";

import { Hint } from "../../../../ludemes/game/util/equipment/Hint.js";
import { Values } from "../../../../ludemes/game/util/equipment/Values.js";
import { Exact } from "../../../../ludemes/game/functions/range/math/Exact.js";
import { Expand } from "../../../../ludemes/game/functions/region/math/Expand.js";
import { FirstMoveOnTrack } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/requirement/FirstMoveOnTrack.js";
import { Flip } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Flip.js";
import { Flips1to1 } from "../../../../ludemes/game/util/moves/Flips1to1.js";
import { ForAll } from "../../../../ludemes/game/functions/booleans/deductionPuzzle/ForAll.js";
import { ForEachPlayer as StartForEachPlayer } from "../../../../ludemes/game/rules/start/forEach/player/ForEachPlayer.js";
import { ForEachSite as StartForEachSite } from "../../../../ludemes/game/rules/start/forEach/site/ForEachSite.js";
import { ForEachTeam as StartForEachTeam } from "../../../../ludemes/game/rules/start/forEach/team/ForEachTeam.js";
import { ForEachValue as StartForEachValue } from "../../../../ludemes/game/rules/start/forEach/value/ForEachValue.js";
import { ForgetValue } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValue.js";
import { ForgetValueAll } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/state/forget/value/ForgetValueAll.js";
import { FromTo } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/FromTo.js";
import { Game1to1 } from "../../../../ludemes/Game1to1.js";
import { Equipment1to1 } from "../../../../ludemes/game/equipment/Equipment1to1.js";
import { Rules1to1 } from "../../../../ludemes/game/rules/Rules1to1.js";
import { Games1to1 } from "../../../../ludemes/game/match/Games1to1.js";
import { Subgame1to1 } from "../../../../ludemes/game/match/Subgame1to1.js";
import { Gravity } from "../../../../ludemes/game/rules/meta/Gravity.js";
import { HandSite } from "../../../../ludemes/game/functions/ints/board/HandSite.js";
import { constructHex } from "../../../../ludemes/game/functions/graph/generators/basis/hex/Hex.js";
import { Hints } from "../../../../ludemes/game/equipment/other/Hints.js";
import { Hole } from "../../../../ludemes/game/functions/graph/operators/Hole.js";
import { Hop } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Hop.js";
import {
  FloatAbs1to1,
  FloatAdd1to1,
  FloatDiv1to1,
  FloatExp1to1,
  FloatMax1to1,
  FloatMin1to1,
  FloatMul1to1,
  FloatPow1to1,
  FloatSub1to1,
} from "../../../../ludemes/game/functions/floats1to1/math/FloatMath1to1.js";
import { Difference1to1 } from "../../../../ludemes/game/functions/intArray/math/Difference1to1.js";
import { If1to1 as IntArrayIf1to1 } from "../../../../ludemes/game/functions/intArray/math/If1to1.js";
import { Intersection1to1 } from "../../../../ludemes/game/functions/intArray/math/Intersection1to1.js";
import { Union1to1 } from "../../../../ludemes/game/functions/intArray/math/Union1to1.js";
import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { FloatConstant } from "../../../../ludemes/game/functions/floats/FloatConstant.js";
import { From1to1 } from "../../../../ludemes/game/util/moves/From1to1.js";
import { To1to1 } from "../../../../ludemes/game/util/moves/To1to1.js";
import { Between1to1 } from "../../../../ludemes/game/util/moves/Between1to1.js";
import type { Then } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Then.js";
import { Graph } from "../../../../eval/graph/graph.js";

import type {
  BooleanFunction,
  DirectionsFunction,
  FloatFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "../../../../ludemes/base.js";
import type { RangeFunction1to1 } from "../../../../ludemes/game/functions/range/Range1to1.js";
import type { GraphFunction } from "../../../../ludemes/game/functions/graph/GraphFunction.js";
import type { HexShapeType } from "../../../../ludemes/game/functions/graph/generators/basis/hex/HexShapeType.js";
import type { PuzzleElementType } from "../../../../ludemes/game/types/board/PuzzleElementType.js";
import type { SiteType1to1 } from "../../../../ludemes/game/util/moves/From1to1.js";
import type { Context } from "../../../../context.js";
import type { JavaIntFunction } from "../../../../ludemes/game/functions/ints/IntFunction.js";

export function registerBatch3(registry: LudemeRegistry): void {
  registry.registerLudeme("equipment.hint:hint", (b) => {
    const first = b.positional[0];
    const hint = optionalNumber(b.positional[1]);
    if (Array.isArray(first)) return new Hint(numberArray(first), hint);
    return new Hint(asNumber(first, "hint region/site"), hint);
  });

  registry.registerLudeme("equipment.values:values", (b) => {
    return new Values(requireSiteType(b.positional[0]), asRange(b.positional[1]));
  });

  registry.registerLudeme("exact:exact", (b) => new Exact(asIntFunction(b.positional[0])));

  registry.registerLudeme("exp:exp", (b) => new FloatExp1to1(requireFloatArg(b, 0)));
  registry.registerLudeme("floats.math.-:-", (b) => {
    const args = floatArgs(b);
    if (args.length !== 2) throw new Error("factory -: expected two float arguments");
    return new FloatSub1to1(args[0]!, args[1]!);
  });
  registry.registerLudeme("floats.math.*:*", (b) => {
    const args = floatArgs(b);
    if (args.length === 2) return new FloatMul1to1(args[0]!, args[1]!);
    return new FloatMul1to1(args);
  });
  registry.registerLudeme("floats.math./:/", (b) => {
    const args = floatArgs(b);
    if (args.length !== 2) throw new Error("factory /: expected two float arguments");
    return new FloatDiv1to1(args[0]!, args[1]!);
  });
  registry.registerLudeme("floats.math.^:^", (b) => {
    const args = floatArgs(b);
    if (args.length !== 2) throw new Error("factory ^: expected two float arguments");
    return new FloatPow1to1(args[0]!, args[1]!);
  });
  registry.registerLudeme("floats.math.+:+", (b) => {
    const args = floatArgs(b);
    if (args.length === 2) return new FloatAdd1to1(args[0]!, args[1]!);
    return new FloatAdd1to1(args);
  });
  registry.registerLudeme("floats.math.abs:abs", (b) => new FloatAbs1to1(requireFloatArg(b, 0)));
  registry.registerLudeme("floats.math.max:max", (b) => {
    const args = floatArgs(b);
    if (args.length === 0) throw new Error("factory max: expected at least one float argument");
    if (args.length === 2) return new FloatMax1to1(args[0]!, args[1]!);
    return new FloatMax1to1(args);
  });
  registry.registerLudeme("floats.math.min:min", (b) => {
    const args = floatArgs(b);
    if (args.length === 0) throw new Error("factory min: expected at least one float argument");
    if (args.length === 2) return new FloatMin1to1(args[0]!, args[1]!);
    return new FloatMin1to1(args);
  });

  registry.registerLudeme("expand:expand", (b) => {
    const origin = optionalNamedInt(b, "origin");
    const steps = optionalNamedInt(b, "steps");
    let containerId: IntFunction | null = null;
    let containerName: string | null = null;
    let region: RegionFunction | null = null;
    let direction: string | null = null;
    let siteType: string | null = null;

    for (const value of flatten(b.positional)) {
      if (isRegionFunction(value)) region = value;
      else if (isIntLike(value) && origin !== null) containerId = asIntFunction(value);
      else if (isSiteType(value)) siteType = value;
      else if (typeof value === "string" && isDirectionName(value)) direction = value;
      else if (typeof value === "string") containerName = value;
    }

    return new Expand(containerId, containerName, region, origin, steps, direction, siteType);
  });

  registry.registerLudeme("firstmoveontrack:firstmoveontrack", (b) => {
    let trackName: string | null = null;
    let owner: string | null = null;
    const moves = findFirst(b, isMovesFunction);
    const then = findThen(b);

    for (const value of b.positional) {
      if (typeof value !== "string") continue;
      if (isRoleType(value)) owner = value;
      else trackName = value;
    }
    if (!moves) throw new Error("factory firstMoveOnTrack: missing moves");
    return new FirstMoveOnTrack(trackName, owner, moves, then);
  });

  registry.registerLudeme("flip:flip", (b) => {
    const type = findFirstValue(b, isSiteType) ?? null;
    const locValue = findFirstValue(b, isIntLike);
    return new Flip(type, locValue === undefined ? null : asIntFunction(locValue), findThen(b));
  });

  registry.registerLudeme("flips:flips", (b) => new Flips1to1(requireNumber(b, 0), requireNumber(b, 1)));

  registry.registerLudeme("forall:forall", (b) => {
    const type = requireString(b, 0) as PuzzleElementType;
    const constraint = findFirst(b, isBooleanFunction);
    if (!constraint) throw new Error("factory forAll: missing constraint");
    return new ForAll(type, constraint);
  });

  registry.registerLudeme("foreach.foreach:foreach", (b) => makeStartForEach(b));

  registry.registerLudeme("forget:forget", (b) => {
    const then = findThen(b);
    const values = b.positional.filter((v) => v !== "Value");
    const name = values.find((v): v is string => typeof v === "string" && v !== "All") ?? null;
    if (values.some((v) => v === "All")) return new ForgetValueAll(name, then);
    const value = values.find(isIntLike);
    if (value === undefined) throw new Error("factory forget: missing value");
    return new ForgetValue(name, asIntFunction(value), then);
  });

  registry.registerLudeme("fromto:fromto", (b) => {
    const from = findFirst(b, (v): v is From1to1 => v instanceof From1to1);
    const to = findFirst(b, (v): v is To1to1 => v instanceof To1to1);
    if (!from || !to) throw new Error("factory fromTo: missing from or to");
    return new FromTo({
      locFrom: from.locFn(),
      levelFrom: from.levelFn(),
      countFn: optionalNamedInt(b, "count"),
      locTo: to.locFn() ?? evalToFunction(),
      levelTo: to.levelFn(),
      regionFrom: from.regionFn(),
      regionTo: to.regionFn(),
      fromCondition: from.condFn(),
      moveRule: to.condFn(),
      captureEffect: toEffectAsMoves(to),
      stack: optionalNamedBooleanValue(b, "stack") ?? false,
      copy: optionalNamedBooleanFunction(b, "copy"),
      then: findThen(b),
    });
  });

  registry.registerLudeme("game:game", (b, env) => {
    if (b.positional.length === 1) throw new Error("factory game: missing equipment and rules");
    const name = requireString(b, 0);
    const players = findFirstValue(b, isPlayerCount) ?? env.numPlayers;
    const equipment = findFirst(b, (v): v is Equipment1to1 => v instanceof Equipment1to1);
    const rules = findFirst(b, (v): v is Rules1to1 => v instanceof Rules1to1);
    if (!equipment || !rules) throw new Error("factory game: missing equipment or rules");
    return new Game1to1(name, players, equipment, rules, [], false, false);
  });

  registry.registerLudeme("games:games", (b) => {
    const games = flatten(b.positional).filter((v): v is Subgame1to1 => v instanceof Subgame1to1);
    if (games.length === 0) throw new Error("factory games: missing subgames");
    return new Games1to1(games);
  });

  registry.registerLudeme("graph:graph", graphFactory);
  registry.registerLudeme("gravity:gravity", (b) => new Gravity((findFirstValue(b, isStringValue) as string | undefined) ?? null));

  registry.registerLudeme("handsite:handsite", (b) => {
    const owner = b.positional[0];
    const site = b.positional[1] === undefined ? new IntConstant(0) : asIntFunction(b.positional[1]);
    if (typeof owner === "string") return new HandSite(asJavaIntFunction(roleIntFunction(owner)), asJavaIntFunction(site));
    return new HandSite(asJavaIntFunction(asIntFunction(owner)), asJavaIntFunction(site));
  });

  registry.registerLudeme("hex:hex", (b) => {
    const args = flatten(b.positional);
    if (typeof args[0] === "string") {
      return constructHex(args[0] as HexShapeType, asNumber(args[1], "hex dimA"), optionalNumber(args[2]));
    }
    if (typeof args[0] === "number") {
      return constructHex(null, args[0], optionalNumber(args[1]));
    }
    throw new Error("factory hex: expected shape or dimension");
  });

  registry.registerLudeme("hints:hints", (b) => {
    const hints = flatten(b.positional).filter((v): v is Hint => v instanceof Hint);
    const label = b.positional.find((v): v is string => typeof v === "string" && !isSiteType(v)) ?? null;
    const type = findFirstValue(b, isSiteType) ?? null;
    return new Hints(label, hints.map((h) => ({ region: h.region, hint: h.hint })), type);
  });

  registry.registerLudeme("hole:hole", (b) => {
    const graph = findFirst(b, isGraphFunction);
    const polygon = b.positional.find(isPointList);
    if (!graph || !polygon) throw new Error("factory hole: missing graph or polygon");
    return new Hole(graph, polygon);
  });

  registry.registerLudeme("hop:hop", (b) => {
    const from = findFirst(b, (v): v is From1to1 => v instanceof From1to1);
    const to = findFirst(b, (v): v is To1to1 => v instanceof To1to1);
    const between = findFirst(b, (v): v is Between1to1 => v instanceof Between1to1);
    if (!to) throw new Error("factory hop: missing to");

    return new Hop({
      startLocationFn: from?.locFn() ?? evalFromFunction(),
      dirnChoice: findFirst(b, isDirectionsFunction) ?? staticDirections(findFirstValue(b, isDirectionName) ?? "Adjacent"),
      goRule: to.condFn() ?? trueFunction(),
      hurdleRule: between?.condition() ?? trueFunction(),
      stopRule: null,
      stopEffect: toEffectAsMoves(to),
      maxDistanceFromHurdleFn: between?.beforeFn() ?? new IntConstant(0),
      minLengthHurdleFn: between?.rangeFn()?.[0] ?? new IntConstant(1),
      maxLengthHurdleFn: between?.rangeFn()?.[1] ?? new IntConstant(1),
      maxDistanceHurdleToFn: between?.afterFn() ?? new IntConstant(0),
      sideEffect: betweenEffectAsMoves(between),
      fromCondition: from?.condFn() ?? null,
      stack: optionalNamedBooleanValue(b, "stack") ?? false,
      then: findThen(b) as unknown as ConstructorParameters<typeof Hop>[0]["then"],
    });
  });

  registry.registerLudeme("intarray.math.difference:difference", (b) => {
    const source = asIntArrayFunction(b.positional[0]);
    const remove = b.positional[1];
    if (isIntArrayFunction(remove)) return new Difference1to1(source, remove, null);
    return new Difference1to1(source, null, asIntFunction(remove));
  });

  registry.registerLudeme("intarray.math.if:if", (b) => {
    const notOk = b.positional[2] === undefined ? emptyIntArray() : asIntArrayFunction(b.positional[2]);
    return new IntArrayIf1to1(asBooleanFunction(b.positional[0]), asIntArrayFunction(b.positional[1]), notOk);
  });

  registry.registerLudeme("intarray.math.intersection:intersection", (b) => {
    return new Intersection1to1(intArrayArgs(b));
  });

  registry.registerLudeme("intarray.math.union:union", (b) => {
    return new Union1to1(intArrayArgs(b));
  });
}

class LiteralGraphFunction implements GraphFunction {
  private readonly graph: GraphFunction | null;
  private readonly vertices: ReadonlyArray<readonly [number, number]>;
  private readonly edges: ReadonlyArray<readonly [number, number]>;

  public constructor(args: {
    graph?: GraphFunction | null;
    vertices?: ReadonlyArray<readonly [number, number]>;
    edges?: ReadonlyArray<readonly [number, number]>;
  }) {
    this.graph = args.graph ?? null;
    this.vertices = args.vertices ?? [];
    this.edges = args.edges ?? [];
  }

  public eval(siteType: string): Graph {
    if (this.graph !== null && this.vertices.length === 0 && this.edges.length === 0) {
      return this.graph.eval(siteType);
    }

    const graph = this.graph?.eval(siteType) ?? new Graph();
    for (const [x, y] of this.vertices) graph.addVertex(x, y);
    for (const [a, b] of this.edges) graph.addEdge(a, b);
    graph.makeFaces();
    return graph;
  }

  public dim(): number[] {
    return this.graph?.dim() ?? [];
  }
}

function graphFactory(b: ArgBundle): GraphFunction {
  const graph = findFirst(b, isGraphFunction) ?? null;
  return new LiteralGraphFunction({
    graph,
    vertices: graphPoints(b.named.get("vertices")),
    edges: graphIndexPairs(b.named.get("edges")),
  });
}

function makeStartForEach(b: ArgBundle): unknown {
  const first = b.positional[0];
  const startRule = findLast(b, isStartRule);
  if (!startRule) throw new Error("factory forEach: missing start rule");

  if (first === "Player") return new StartForEachPlayer(startRule);
  if (first === "Team") return new StartForEachTeam(startRule);
  if (first === "Value") {
    const min = optionalNamedInt(b, "min");
    const max = optionalNamedInt(b, "max");
    if (!min || !max) throw new Error("factory forEach Value: missing min or max");
    return new StartForEachValue(min, max, startRule);
  }
  if (first === "Site") {
    const region = findFirst(b, isRegionFunction);
    if (!region) throw new Error("factory forEach Site: missing region");
    return new StartForEachSite(region, optionalNamedBooleanFunction(b, "if") ?? null, startRule);
  }
  if (isIntArrayFunction(first)) return new StartForEachPlayer(first, startRule);
  throw new Error("factory forEach: unsupported iteration type");
}

function notWired(keyword: string): () => never {
  return () => {
    throw new Error(`factory not yet wired: ${keyword}`);
  };
}

function flatten(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value) && !isPointList(value)) out.push(...flatten(value));
    else out.push(value);
  }
  return out;
}

function findFirst<T>(b: ArgBundle, guard: (value: unknown) => value is T): T | undefined {
  return flatten(b.positional).find(guard);
}

function findLast<T>(b: ArgBundle, guard: (value: unknown) => value is T): T | undefined {
  return flatten(b.positional).filter(guard).at(-1);
}

function findFirstValue<T>(
  b: ArgBundle,
  guard: (value: unknown) => value is T,
): T | undefined {
  return flatten(b.positional).find(guard);
}

function requireNumber(b: ArgBundle, index: number): number {
  return asNumber(b.positional[index], `${b.constructKey}[${index}]`);
}

function requireString(b: ArgBundle, index: number): string {
  const value = b.positional[index];
  if (typeof value !== "string") throw new Error(`factory ${b.constructKey}: expected string at ${index}`);
  return value;
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== "number") throw new Error(`factory ${label}: expected number`);
  return value;
}

function optionalNumber(value: unknown): number | undefined {
  return value === undefined || value === null ? undefined : asNumber(value, "optional number");
}

function numberArray(value: unknown): number[] {
  if (!Array.isArray(value) || !value.every((v) => typeof v === "number")) {
    throw new Error("factory: expected number array");
  }
  return value;
}

function isIntLike(value: unknown): value is number | IntFunction {
  return typeof value === "number" || typeof (value as IntFunction | null)?.eval === "function";
}

function asIntFunction(value: unknown): IntFunction {
  if (typeof value === "number") return new IntConstant(value);
  if (typeof (value as IntFunction | null)?.eval === "function") return value as IntFunction;
  throw new Error("factory: expected int function");
}

function asFloatFunction(value: unknown): FloatFunction {
  if (typeof value === "number") return new FloatConstant(value);
  if (typeof (value as FloatFunction | null)?.eval === "function") return value as FloatFunction;
  throw new Error("factory: expected float function");
}

function requireFloatArg(b: ArgBundle, index: number): FloatFunction {
  return asFloatFunction(flatten(b.positional)[index]);
}

function floatArgs(b: ArgBundle): FloatFunction[] {
  return flatten(b.positional).map(asFloatFunction);
}

function asRange(value: unknown): RangeFunction1to1 {
  if (value && typeof (value as { eval?: unknown }).eval === "function") return value as RangeFunction1to1;
  throw new Error("factory: expected range");
}

function asBooleanFunction(value: unknown): BooleanFunction {
  if (typeof value === "boolean") return { eval: () => value };
  if (typeof (value as BooleanFunction | null)?.eval === "function") return value as BooleanFunction;
  throw new Error("factory: expected boolean function");
}

function asIntArrayFunction(value: unknown): IntArrayFunction {
  if (Array.isArray(value) && value.every((v) => typeof v === "number")) return { eval: () => [...value] };
  if (isIntArrayFunction(value)) return value;
  throw new Error("factory: expected int array function");
}

function optionalNamedInt(b: ArgBundle, name: string): IntFunction | null {
  const value = b.named.get(name);
  return value === undefined ? null : asIntFunction(value);
}

function optionalNamedBooleanFunction(b: ArgBundle, name: string): BooleanFunction | undefined {
  const value = b.named.get(name);
  return value === undefined ? undefined : asBooleanFunction(value);
}

function optionalNamedBooleanValue(b: ArgBundle, name: string): boolean | undefined {
  const value = b.named.get(name);
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  return asBooleanFunction(value).eval(null as unknown as Context & { _evalTo: number; _evalFrom: number; _evalValue: number });
}

function emptyIntArray(): IntArrayFunction {
  return { eval: () => [] };
}

function intArrayArgs(b: ArgBundle): IntArrayFunction[] {
  const values = b.positional.length === 1 && Array.isArray(b.positional[0])
    ? b.positional[0]
    : b.positional;
  return values.map(asIntArrayFunction);
}

function isIntArrayFunction(value: unknown): value is IntArrayFunction {
  if (Array.isArray(value)) return value.every((v) => typeof v === "number");
  return typeof (value as IntArrayFunction | null)?.eval === "function";
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return typeof (value as BooleanFunction | null)?.eval === "function";
}

function isMovesFunction(value: unknown): value is MovesFunction {
  return typeof (value as MovesFunction | null)?.eval === "function";
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return typeof (value as RegionFunction | null)?.eval === "function" && !isMovesFunction(value);
}

function isDirectionsFunction(value: unknown): value is DirectionsFunction {
  return typeof (value as DirectionsFunction | null)?.eval === "function";
}

function isGraphFunction(value: unknown): value is GraphFunction {
  return typeof (value as GraphFunction | null)?.eval === "function" && typeof (value as GraphFunction).dim === "function";
}

function isStartRule(value: unknown): value is { eval(context: Context): void } {
  return typeof (value as { eval?: unknown } | null)?.eval === "function";
}

function findThen(b: ArgBundle): Then | null {
  const value = flatten(b.positional).find((v) => typeof (v as { moves?: unknown } | null)?.moves === "function");
  return (value as Then | undefined) ?? null;
}

function isPlayerCount(value: unknown): value is number {
  if (typeof value === "number") return true;
  return typeof (value as { count?: unknown } | null)?.count === "function";
}

function isStringValue(value: unknown): value is string {
  return typeof value === "string";
}

function requireSiteType(value: unknown): "Cell" | "Vertex" | "Edge" {
  if (!isSiteType(value)) throw new Error("factory: expected siteType");
  return value;
}

function isSiteType(value: unknown): value is SiteType1to1 {
  return value === "Cell" || value === "Vertex" || value === "Edge";
}

const ROLE_TYPES = new Set(["Mover", "Next", "Prev", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "All", "Shared", "Neutral"]);

function isRoleType(value: string): boolean {
  return ROLE_TYPES.has(value) || /^P\d+$/.test(value);
}

const DIRECTION_NAMES = new Set([
  "All", "Angled", "Adjacent", "Axial", "Orthogonal", "Diagonal", "OffDiagonal",
  "SameLayer", "Upward", "Downward", "Rotational", "Base", "Support",
  "N", "E", "S", "W", "NE", "SE", "NW", "SW",
  "NNW", "WNW", "WSW", "SSW", "SSE", "ESE", "ENE", "NNE",
  "CW", "CCW", "In", "Out",
  "U", "UN", "UNE", "UE", "USE", "US", "USW", "UW", "UNW",
  "D", "DN", "DNE", "DE", "DSE", "DS", "DSW", "DW", "DNW",
]);

function isDirectionName(value: unknown): value is string {
  return typeof value === "string" && DIRECTION_NAMES.has(value);
}

function staticDirections(name: string): DirectionsFunction {
  return { eval: () => [name] };
}

function trueFunction(): BooleanFunction {
  return { eval: () => true };
}

function evalFromFunction(): IntFunction {
  return { eval: (ctx) => ctx._evalFrom };
}

function evalToFunction(): IntFunction {
  return { eval: (ctx) => ctx._evalTo };
}

function roleIntFunction(role: string): IntFunction {
  return {
    eval(ctx) {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (role === "Shared" || role === "Neutral") return 0;
      if (/^P\d+$/.test(role)) return Number(role.slice(1));
      return ctx.state.mover;
    },
  };
}

function asJavaIntFunction(value: IntFunction): JavaIntFunction {
  return value as unknown as JavaIntFunction;
}

function toEffectAsMoves(to: To1to1): MovesFunction | null {
  const effect = to.effectFn();
  if (effect === null) return null;
  if (isMovesFunction(effect)) return effect;
  throw new Error("factory hop: to effect is not a moves function");
}

function betweenEffectAsMoves(between: Between1to1 | undefined): MovesFunction | null {
  const effect = between?.effectFn() ?? null;
  if (effect === null) return null;
  if (isMovesFunction(effect)) return effect;
  throw new Error("factory hop: between effect is not a moves function");
}

function isPointList(value: unknown): value is ReadonlyArray<readonly [number, number]> {
  return Array.isArray(value) &&
    value.length > 0 &&
    value.every((p) => Array.isArray(p) && p.length >= 2 && typeof p[0] === "number" && typeof p[1] === "number");
}

function graphPoints(value: unknown): ReadonlyArray<readonly [number, number]> {
  if (!Array.isArray(value)) return [];
  if (!value.every((point) => Array.isArray(point) && point.length >= 2)) {
    throw new Error("factory graph: expected vertices as coordinate pairs");
  }
  return value.map((point) => [asNumber(point[0], "graph vertex x"), asNumber(point[1], "graph vertex y")] as const);
}

function graphIndexPairs(value: unknown): ReadonlyArray<readonly [number, number]> {
  if (!Array.isArray(value)) return [];
  if (!value.every((edge) => Array.isArray(edge) && edge.length >= 2)) {
    throw new Error("factory graph: expected edges as index pairs");
  }
  return value.map((edge) => [asNumber(edge[0], "graph edge a"), asNumber(edge[1], "graph edge b")] as const);
}

void asFloatFunction;
