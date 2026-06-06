import type { ArgBundle } from "../../ArgBundle.js";
import type { LudemeRegistry } from "../../LudemeRegistry.js";

import type {
  BooleanFunction,
  FloatFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "../../../../ludemes/base.js";
import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { BooleanConstant, TrueConstant } from "../../../../ludemes/game/functions/booleans/BooleanConstant.js";
import { FloatConstant } from "../../../../ludemes/game/functions/floats/FloatConstant.js";

import { PlayersTeam } from "../../../../ludemes/game/functions/intArray/players/team/PlayersTeam.js";
import { PlayersMany } from "../../../../ludemes/game/functions/intArray/players/many/PlayersMany.js";
import { PlayersTeamType } from "../../../../ludemes/game/functions/intArray/players/PlayersTeamType.js";
import { PlayersManyType } from "../../../../ludemes/game/functions/intArray/players/PlayersManyType.js";

import type { GraphFunction } from "../../../../ludemes/game/functions/graph/GraphFunction.js";
import { Intersect } from "../../../../ludemes/game/functions/graph/operators/Intersect.js";
import { Keep } from "../../../../ludemes/game/functions/graph/operators/Keep.js";
import { Layers } from "../../../../ludemes/game/functions/graph/operators/Layers.js";
import { MakeFaces } from "../../../../ludemes/game/functions/graph/operators/MakeFaces.js";
import { Poly } from "../../../../ludemes/game/util/graph/Poly.js";

import { Intervene } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Intervene.js";
import { Leap } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Leap.js";
import { Then } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Then.js";
import { And as AndMoves } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/logical/And.js";
import { Or as OrMoves } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/logical/Or.js";
import { If as IfMoves } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/logical/If.js";
import { From1to1 as MoveFrom } from "../../../../ludemes/game/util/moves/From1to1.js";
import { Between1to1 as MoveBetween } from "../../../../ludemes/game/util/moves/Between1to1.js";
import { To1to1 as MoveTo } from "../../../../ludemes/game/util/moves/To1to1.js";

import { LastFrom } from "../../../../ludemes/game/functions/ints/last/LastFrom.js";
import { LastTo } from "../../../../ludemes/game/functions/ints/last/LastTo.js";
import { LastLevelFrom } from "../../../../ludemes/game/functions/ints/last/LastLevelFrom.js";
import { LastLevelTo } from "../../../../ludemes/game/functions/ints/last/LastLevelTo.js";
import {
  Abs1to1,
  Add1to1,
  Div1to1,
  IfInt1to1,
  Max1to1,
  Min1to1,
  Mul1to1,
  Pow1to1,
  Sub1to1,
} from "../../../../ludemes/game/functions/ints1to1/math/Math1to1.js";
import {
  Between1to1 as IterBetween,
  From1to1 as IterFrom,
  Level1to1 as IterLevel,
  To1to1 as IterTo,
} from "../../../../ludemes/game/functions/ints1to1/iterator/Iterator1to1.js";
import { Layer } from "../../../../ludemes/game/functions/ints/board/Layer.js";
import { MapEntry1to1 } from "../../../../ludemes/game/functions/ints1to1/board/Board1to1.js";
import { SitesWalk1to1 } from "../../../../ludemes/game/functions/region/sites/walk/SitesWalk1to1.js";
import { FloatLog1to1, FloatLog10_1to1 } from "../../../../ludemes/game/functions/floats1to1/math/FloatMath1to1.js";
import { AndBool } from "../../../../ludemes/game/functions/booleans/math1to1/AndBool.js";

import { MancalaBoard } from "../../../../ludemes/game/equipment/container/board/custom/MancalaBoard.js";
import { Board1to1 } from "../../../../ludemes/game/equipment/container/board/Board1to1.js";
import { buildMancalaGraph } from "../../../../eval/graph/board-graph.js";
import type { TrackDescriptor } from "../../../../ludemes/game/equipment/container/board/Board.js";
import type { StoreType } from "../../../../ludemes/game/types/board/StoreType.js";
import { Map as LudiiMap } from "../../../../ludemes/game/equipment/other/Map.js";
import { Pair } from "../../../../ludemes/game/util/math/Pair.js";
import { Match1to1 } from "../../../../ludemes/game/match/Match1to1.js";
import { Games1to1 } from "../../../../ludemes/game/match/Games1to1.js";
import type { End } from "../../../../ludemes/game/rules/end/End.js";
import { GamePlayers1to1 } from "../../../../ludemes/game/players/GamePlayers1to1.js";
import { MatchScore } from "../../../../ludemes/game/functions/ints/match/MatchScore.js";
import { RoleType } from "../../../../ludemes/game/util/end/RoleType.js";
import type { SiteType } from "../../../../ludemes/other/action/SiteType.js";

export function registerBatch4(registry: LudemeRegistry): void {
  registry.registerLudeme("intArray.players.players:players", playersFactory);
  registry.registerLudeme("intersect:intersect", intersectFactory);
  registry.registerLudeme("intervene:intervene", interveneFactory);
  registry.registerLudeme("ints.last.last:last", lastFactory);
  registry.registerLudeme("ints.math.-:-", subFactory);
  registry.registerLudeme("ints.math.*:*", mulFactory);
  registry.registerLudeme("ints.math./:/", divFactory);
  registry.registerLudeme("ints.math.^:^", powFactory);
  registry.registerLudeme("ints.math.+:+", addFactory);
  registry.registerLudeme("ints.math.abs:abs", absFactory);
  registry.registerLudeme("ints.math.if:if", ifIntFactory);
  registry.registerLudeme("ints.math.max:max", maxFactory);
  registry.registerLudeme("ints.math.min:min", minFactory);
  registry.registerLudeme("iterator.between:between", () => new IterBetween());
  registry.registerLudeme("iterator.edge:edge", notWired("edge"));
  registry.registerLudeme("iterator.from:from", fromIteratorFactory);
  registry.registerLudeme("iterator.hint:hint", notWired("hint"));
  registry.registerLudeme("iterator.player:player", notWired("player"));
  registry.registerLudeme("iterator.to:to", () => new IterTo());
  registry.registerLudeme("iterator.track:track", notWired("track"));
  registry.registerLudeme("keep:keep", keepFactory);
  registry.registerLudeme("layer:layer", layerFactory);
  registry.registerLudeme("layers:layers", layersFactory);
  registry.registerLudeme("leap:leap", leapFactory);
  registry.registerLudeme("level:level", () => new IterLevel());
  registry.registerLudeme("log:log", logFactory);
  registry.registerLudeme("log10:log10", log10Factory);
  registry.registerLudeme("logical.and:and", andMovesFactory);
  registry.registerLudeme("logical.if:if", ifMovesFactory);
  registry.registerLudeme("logical.or:or", orMovesFactory);
  registry.registerLudeme("makeFaces:makeFaces", makeFacesFactory);
  registry.registerLudeme("mancalaBoard:mancalaBoard", mancalaBoardFactory);
  registry.registerLudeme("map:map", mapFactory);
  registry.registerLudeme("mapEntry:mapEntry", mapEntryFactory);
  registry.registerLudeme("match:match", matchFactory);
  registry.registerLudeme("matchScore:matchScore", matchScoreFactory);
  registry.registerLudeme("math.and:and", andBoolFactory);
}

function playersFactory(b: ArgBundle): IntArrayFunction {
  const kind = requireString(b.positional[0], "players kind");
  const cond = boolFn(named(b, "if"), new TrueConstant());
  if (kind in PlayersTeamType) {
    return new PlayersTeam(kind as PlayersTeamType, cond);
  }
  if (kind in PlayersManyType) {
    return new PlayersMany(kind as PlayersManyType, intFnOrNull(named(b, "of")), cond);
  }
  throw new Error(`factory not yet wired: players (${kind})`);
}

function intersectFactory(b: ArgBundle): Intersect {
  const graphs = flatten(b.positional).filter(isGraphFunction);
  if (graphs.length === 0) throw new Error("factory not yet wired: intersect");
  return new Intersect(graphs);
}

function interveneFactory(b: ArgBundle): Intervene {
  const from = first(b, isMoveFrom);
  const between = first(b, isMoveBetween);
  const to = first(b, isMoveTo);
  const then = first(b, isThen) ?? null;
  const startLocationFn = from?.locFn() ?? new LastTo();
  const range = between?.rangeFn() ?? null;
  const targetRule = to?.condFn() ?? null;
  const targetEffect = asMovesFunction(to?.effectFn());
  if (targetRule === null || targetEffect === null) {
    throw new Error("factory not yet wired: intervene");
  }
  return new Intervene({
    startLocationFn,
    dirnChoice: firstStringExcept(b, ["From", "Between", "To"]),
    limit: range?.[1] ?? new IntConstant(1),
    min: range?.[0] ?? new IntConstant(1),
    targetRule,
    targetEffect,
    then: then as unknown as ConstructorParameters<typeof Intervene>[0]["then"],
  });
}

function lastFactory(b: ArgBundle): IntFunction {
  const lastType = requireString(b.positional[0], "lastType");
  const after = boolFnOrNull(named(b, "afterConsequence"));
  switch (lastType) {
    case "From": return new LastFrom(after ?? undefined);
    case "To": return new LastTo(after ?? undefined);
    case "LevelFrom": return new LastLevelFrom(after ?? undefined);
    case "LevelTo": return new LastLevelTo(after ?? undefined);
    default: throw new Error(`factory not yet wired: last (${lastType})`);
  }
}

function addFactory(b: ArgBundle): IntFunction {
  return new Add1to1(requireIntFunctionList(b, "+"));
}

function subFactory(b: ArgBundle): IntFunction {
  const fns = flatten(b.positional).map(toIntFn);
  if (fns.length === 1) return new Sub1to1(new IntConstant(0), fns[0]!);
  if (fns.length === 2) return new Sub1to1(fns[0]!, fns[1]!);
  throw new Error("factory not yet wired: -");
}

function mulFactory(b: ArgBundle): IntFunction {
  return new Mul1to1(requireIntFunctionList(b, "*"));
}

function divFactory(b: ArgBundle): IntFunction {
  const [a, c] = requireTwoIntFns(b, "/");
  return new Div1to1(a, c);
}

function powFactory(b: ArgBundle): IntFunction {
  const [a, c] = requireTwoIntFns(b, "^");
  return new Pow1to1(a, c);
}

function absFactory(b: ArgBundle): IntFunction {
  return new Abs1to1(toIntFn(requireValue(b.positional[0], "abs value")));
}

function ifIntFactory(b: ArgBundle): IntFunction {
  const cond = toBoolFn(requireValue(b.positional[0], "if condition"));
  const thenFn = toIntFn(requireValue(b.positional[1], "if true value"));
  const elseFn = toIntFn(requireValue(b.positional[2], "if false value"));
  return new IfInt1to1(cond, thenFn, elseFn);
}

function maxFactory(b: ArgBundle): IntFunction {
  return new Max1to1(requireIntFunctionList(b, "max"));
}

function minFactory(b: ArgBundle): IntFunction {
  return new Min1to1(requireIntFunctionList(b, "min"));
}

function fromIteratorFactory(b: ArgBundle): IntFunction {
  const when = named(b, "at");
  if (when !== undefined) throw new Error("factory not yet wired: from");
  return new IterFrom();
}

function keepFactory(b: ArgBundle): Keep {
  const graph = first(b, isGraphFunction);
  const poly = first(b, (v): v is Poly => v instanceof Poly);
  if (!graph || !poly) throw new Error("factory not yet wired: keep");
  return new Keep(graph, poly.polygon().points().map((p) => [p.x, p.y] as const));
}

function layerFactory(b: ArgBundle): Layer {
  const of = toIntFn(requireValue(named(b, "of") ?? b.positional[0], "layer of"));
  const type = first(b, isSiteType) ?? null;
  return new Layer(of as unknown as ConstructorParameters<typeof Layer>[0], type);
}

function layersFactory(b: ArgBundle): Layers {
  const count = numberValue(requireValue(b.positional[0], "layers count"));
  const graph = first(b, isGraphFunction);
  if (!graph) throw new Error("factory not yet wired: layers");
  return new Layers(count, graph);
}

function leapFactory(b: ArgBundle): Leap {
  const from = first(b, isMoveFrom);
  const to = first(b, isMoveTo);
  if (!to || !to.condFn()) throw new Error("factory not yet wired: leap");
  const startLocationFn = from?.locFn() ?? new IterFrom();
  const walk = new SitesWalk1to1(
    startLocationFn,
    normaliseWalks(firstValue(b, isStepList)),
    boolFn(named(b, "rotations"), new BooleanConstant(true)),
  );
  return new Leap({
    startLocationFn,
    fromCondition: from?.condFn() ?? null,
    walk,
    forward: boolFn(named(b, "forward"), new BooleanConstant(false)),
    goRule: to.condFn()!,
    sideEffect: asMovesFunction(to.effectFn()),
    then: first(b, isThen) ?? null,
  });
}

function logFactory(b: ArgBundle): FloatFunction {
  return new FloatLog1to1(toFloatFn(requireValue(b.positional[0], "log value")));
}

function log10Factory(b: ArgBundle): FloatFunction {
  return new FloatLog10_1to1(toFloatFn(requireValue(b.positional[0], "log10 value")));
}

function andMovesFactory(b: ArgBundle): MovesFunction {
  const moves = flatten(b.positional).filter(isMoveOperand);
  const then = first(b, isThen) ?? null;
  if (moves.length === 2) return new AndMoves(moves[0]!, moves[1]!, then);
  return new AndMoves(moves, then);
}

function ifMovesFactory(b: ArgBundle): MovesFunction {
  const cond = toBoolFn(requireValue(b.positional[0], "logical if condition"));
  const moves = b.positional.slice(1).filter(isMoveOperand);
  if (moves.length < 1) throw new Error("factory not yet wired: if");
  return new IfMoves(cond, moves[0]!, moves[1] ?? null, first(b, isThen) ?? null);
}

function orMovesFactory(b: ArgBundle): MovesFunction {
  const moves = flatten(b.positional).filter(isMoveOperand);
  const then = first(b, isThen) ?? null;
  if (moves.length === 2) return new OrMoves(moves[0]!, moves[1]!, then);
  return new OrMoves(moves, then);
}

function makeFacesFactory(b: ArgBundle): MakeFaces {
  const graph = first(b, isGraphFunction);
  if (!graph) throw new Error("factory not yet wired: makeFaces");
  return new MakeFaces(graph);
}

function mancalaBoardFactory(b: ArgBundle): Board1to1 | MancalaBoard {
  const rows = numberValue(requireValue(b.positional[0], "mancala rows"));
  const columns = numberValue(requireValue(b.positional[1], "mancala columns"));
  const store = (named(b, "store") as StoreType | undefined) ?? null;
  const spec = buildMancalaGraph(rows, columns, store !== "None");
  if (spec) return new Board1to1(spec.width, spec.height, spec.numSites, spec.traj, spec.numFaces);
  const tracksValue =
    b.positional.find(isTrackList) ?? flatten(b.positional).find(isTrackDescriptor);
  return new MancalaBoard(
    rows,
    columns,
    store,
    optionalNumber(named(b, "numStores")),
    optionalBoolean(named(b, "largeStack")),
    isTrackDescriptor(tracksValue) ? tracksValue : null,
    isTrackList(tracksValue) ? tracksValue : null,
  );
}

function mapFactory(b: ArgBundle): LudiiMap {
  const name = typeof b.positional[0] === "string" ? b.positional[0] : null;
  const rest = name === null ? b.positional : b.positional.slice(1);
  const pairs = flatten(rest).filter((v): v is Pair => v instanceof Pair);
  if (pairs.length > 0) return new LudiiMap(name, pairs);
  const arrays = rest.filter(Array.isArray);
  if (arrays.length >= 2) {
    return new LudiiMap(name, arrays[0]!.map(toIntFn), arrays[1]!.map(toIntFn));
  }
  throw new Error("factory not yet wired: map");
}

function mapEntryFactory(b: ArgBundle): MapEntry1to1 {
  const flat = flatten(b.positional);
  let name: string | null = null;
  let keyValue: unknown;

  if (typeof flat[0] === "string" && !(flat.length === 1 && isRoleTypeName(flat[0]))) {
    name = flat[0];
    keyValue = flat[1];
  } else {
    keyValue = flat[0];
  }

  return new MapEntry1to1(name, mapEntryKeyFn(requireValue(keyValue, "mapEntry key")));
}

function matchFactory(b: ArgBundle, env: { numPlayers: number }): Match1to1 {
  if (b.positional.length === 1) throw new Error("factory not yet wired: match");
  const name = requireString(b.positional[0], "match name");
  const players = first(b, (v): v is GamePlayers1to1 => v instanceof GamePlayers1to1);
  const games = first(b, (v): v is Games1to1 => v instanceof Games1to1);
  const end = first(b, isEnd);
  if (!games || !end) throw new Error("factory not yet wired: match");
  return new Match1to1(name, players?.count() ?? env.numPlayers, games.games(), end);
}

function matchScoreFactory(b: ArgBundle): MatchScore {
  return new MatchScore(toRoleType(requireString(b.positional[0], "matchScore role")));
}

function andBoolFactory(b: ArgBundle): BooleanFunction {
  const bools = flatten(b.positional).map(toBoolFn);
  return new AndBool(bools);
}

function requireIntFunctionList(b: ArgBundle, keyword: string): IntFunction[] {
  const flat = flatten(b.positional);
  if (flat.length === 1 && isIntArrayFunction(flat[0])) {
    throw new Error(`factory not yet wired: ${keyword}`);
  }
  return flat.map(toIntFn);
}

function requireTwoIntFns(b: ArgBundle, keyword: string): [IntFunction, IntFunction] {
  const fns = flatten(b.positional).map(toIntFn);
  if (fns.length !== 2) throw new Error(`factory not yet wired: ${keyword}`);
  return [fns[0]!, fns[1]!];
}

function named(b: ArgBundle, name: string): unknown {
  return b.named.get(name) ?? b.named.get(name.toLowerCase()) ?? b.named.get(name[0]!.toUpperCase() + name.slice(1));
}

function flatten(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value)) out.push(...flatten(value));
    else out.push(value);
  }
  return out;
}

function first<T>(b: ArgBundle, guard: (value: unknown) => value is T): T | undefined {
  return flatten(b.positional).find(guard);
}

function firstValue<T>(b: ArgBundle, guard: (value: unknown) => value is T): T | undefined {
  return b.positional.find(guard);
}

function requireValue(value: unknown, label: string): unknown {
  if (value === undefined || value === null) throw new Error(`factory not yet wired: ${label}`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`factory not yet wired: ${label}`);
  return value;
}

function numberValue(value: unknown): number {
  if (typeof value !== "number") throw new Error("factory not yet wired: number");
  return value;
}

function optionalNumber(value: unknown): number | null {
  return value === undefined || value === null ? null : numberValue(value);
}

function optionalBoolean(value: unknown): boolean | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return value;
  if (value instanceof BooleanConstant) return null;
  throw new Error("factory not yet wired: boolean");
}

function intFnOrNull(value: unknown): IntFunction | null {
  return value === undefined || value === null ? null : toIntFn(value);
}

function toIntFn(value: unknown): IntFunction {
  if (typeof value === "number") return new IntConstant(value);
  if (isIntFunction(value)) return value;
  throw new Error("factory not yet wired: int");
}

function toBoolFn(value: unknown): BooleanFunction {
  if (typeof value === "boolean") return new BooleanConstant(value);
  if (isBooleanFunction(value)) return value;
  throw new Error("factory not yet wired: boolean");
}

function boolFn(value: unknown, fallback: BooleanFunction): BooleanFunction {
  if (value === undefined || value === null) return fallback;
  return toBoolFn(value);
}

function boolFnOrNull(value: unknown): BooleanConstant | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return new BooleanConstant(value);
  if (value instanceof BooleanConstant) return value;
  throw new Error("factory not yet wired: boolean");
}

function toFloatFn(value: unknown): FloatFunction {
  if (typeof value === "number") return new FloatConstant(value);
  if (isFloatFunction(value)) return value;
  throw new Error("factory not yet wired: float");
}

function asMovesFunction(value: unknown): MovesFunction | null {
  return isMovesFunction(value) ? value : null;
}

function isIntFunction(value: unknown): value is IntFunction {
  return typeof (value as IntFunction | null)?.eval === "function";
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return typeof (value as BooleanFunction | null)?.eval === "function";
}

function isFloatFunction(value: unknown): value is FloatFunction {
  return typeof (value as FloatFunction | null)?.eval === "function";
}

function isIntArrayFunction(value: unknown): value is IntArrayFunction {
  return typeof (value as IntArrayFunction | null)?.eval === "function";
}

function isMovesFunction(value: unknown): value is MovesFunction {
  return typeof (value as MovesFunction | null)?.eval === "function";
}

function isMoveOperand(value: unknown): value is MovesFunction {
  return isMovesFunction(value) && !isThen(value);
}

function isGraphFunction(value: unknown): value is GraphFunction {
  return typeof (value as GraphFunction | null)?.dim === "function" &&
    typeof (value as GraphFunction | null)?.eval === "function";
}

function isMoveFrom(value: unknown): value is MoveFrom {
  return value instanceof MoveFrom;
}

function isMoveBetween(value: unknown): value is MoveBetween {
  return value instanceof MoveBetween;
}

function isMoveTo(value: unknown): value is MoveTo {
  return value instanceof MoveTo;
}

function isThen(value: unknown): value is Then {
  return value instanceof Then;
}

function isEnd(value: unknown): value is End {
  return typeof (value as End | null)?.eval === "function";
}

function isSiteType(value: unknown): value is SiteType {
  return value === "Cell" || value === "Vertex" || value === "Edge";
}

function isTrackDescriptor(value: unknown): value is TrackDescriptor {
  return typeof (value as TrackDescriptor | null)?.name === "function" &&
    typeof (value as TrackDescriptor | null)?.owner === "function" &&
    typeof (value as TrackDescriptor | null)?.islooped === "function";
}

function isTrackList(value: unknown): value is TrackDescriptor[] {
  return Array.isArray(value) && value.every(isTrackDescriptor);
}

function isStepList(value: unknown): value is readonly unknown[] {
  return Array.isArray(value) &&
    (value.every((v) => typeof v === "string") || value.every(Array.isArray));
}

function normaliseWalks(value: readonly unknown[] | undefined): readonly (readonly string[])[] {
  if (value === undefined) throw new Error("factory not yet wired: leap");
  if (value.every((v) => typeof v === "string")) return [value as readonly string[]];
  return value.map((entry) => {
    if (!Array.isArray(entry) || !entry.every((v) => typeof v === "string")) {
      throw new Error("factory not yet wired: leap");
    }
    return entry as readonly string[];
  });
}

function firstStringExcept(b: ArgBundle, excluded: readonly string[]): string | undefined {
  const blocked = new Set(excluded.map((s) => s.toLowerCase()));
  return flatten(b.positional).find((v): v is string => typeof v === "string" && !blocked.has(v.toLowerCase()));
}

function toRoleType(value: string): RoleType {
  if (value in RoleType) return RoleType[value as keyof typeof RoleType];
  throw new Error(`factory not yet wired: matchScore (${value})`);
}

function mapEntryKeyFn(value: unknown): IntFunction {
  if (typeof value !== "string") return toIntFn(value);
  if (!isRoleTypeName(value)) return toIntFn(value);
  if (/^P\d+$/.test(value)) return new IntConstant(Number(value.slice(1)));
  if (/^Team\d+$/.test(value)) return new IntConstant(Number(value.slice(4)));
  if (value === "Mover") return { eval: (ctx) => ctx.state.mover };
  if (value === "Next") return { eval: (ctx) => (ctx.state.mover % ctx.game.numPlayers) + 1 };
  if (value === "Prev") return { eval: (ctx) => (ctx.state as unknown as { prev?: number }).prev ?? ctx.state.mover };
  if (value === "Player") return { eval: (ctx) => ctx._evalPlayer ?? ctx.state.mover };
  if (value === "Neutral") return new IntConstant(0);
  return new IntConstant(0);
}

function isRoleTypeName(value: string): boolean {
  return value in RoleType;
}

function notWired(keyword: string): () => never {
  return () => {
    throw new Error(`factory not yet wired: ${keyword}`);
  };
}
