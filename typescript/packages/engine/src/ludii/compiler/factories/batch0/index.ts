import { Equals1to1 } from "../../../../ludemes/game/functions/booleans/math1to1/Equals1to1.js";
import { Ge1to1 } from "../../../../ludemes/game/functions/booleans/math1to1/Ge1to1.js";
import { Gt1to1 } from "../../../../ludemes/game/functions/booleans/math1to1/Gt1to1.js";
import { Le1to1 } from "../../../../ludemes/game/functions/booleans/math1to1/Le1to1.js";
import { Lt1to1 } from "../../../../ludemes/game/functions/booleans/math1to1/Lt1to1.js";
import { NotEqual1to1 } from "../../../../ludemes/game/functions/booleans/math1to1/NotEqual1to1.js";
import { All } from "../../../../ludemes/game/functions/booleans/all/All.js";
import { AllGroupsType } from "../../../../ludemes/game/functions/booleans/all/AllGroupsType.js";
import { AllSimpleType } from "../../../../ludemes/game/functions/booleans/all/AllSimpleType.js";
import { AllSitesType } from "../../../../ludemes/game/functions/booleans/all/AllSitesType.js";
import { AllValuesType } from "../../../../ludemes/game/functions/booleans/all/AllValuesType.js";
import { IsAngle1to1 } from "../../../../ludemes/game/functions/booleans/is/angle1to1/IsAngle1to1.js";
import { IsCrossing1to1 } from "../../../../ludemes/game/functions/booleans/is/edge/IsCrossing1to1.js";
import { IsHidden1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsHidden1to1.js";
import { IsCycle1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsCycle1to1.js";
import { IsLastFrom1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsLastFrom1to1.js";
import { IsLastTo1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsLastTo1to1.js";
import { IsRepeat1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsRepeat1to1.js";
import { IsTriggered1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsTriggered1to1.js";
import { IsActive1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsActive1to1.js";
import { IsEnemy1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsEnemy1to1.js";
import { IsFriend1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsFriend1to1.js";
import { IsMover1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsMover1to1.js";
import { IsNext1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsNext1to1.js";
import { IsPrev1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsPrev1to1.js";
import { IsRegularGraph1to1 } from "../../../../ludemes/game/functions/booleans/is/regularGraph1to1/IsRegularGraph1to1.js";
import { IsEmpty1to1 } from "../../../../ludemes/game/functions/booleans/is/site1to1/IsEmpty1to1.js";
import { IsOccupied1to1 } from "../../../../ludemes/game/functions/booleans/is/site1to1/IsOccupied1to1.js";
import { IsFull1to1 } from "../../../../ludemes/game/functions/booleans/is/simple1to1/IsFull1to1.js";
import { IsPending1to1 } from "../../../../ludemes/game/functions/booleans/is/simple1to1/IsPending1to1.js";
import { IsDecided } from "../../../../ludemes/game/functions/booleans/is/string/IsDecided.js";
import { IsProposed } from "../../../../ludemes/game/functions/booleans/is/string/IsProposed.js";
import { IsTree1to1 } from "../../../../ludemes/game/functions/booleans/is/tree1to1/IsTree1to1.js";
import { Boardless } from "../../../../ludemes/game/equipment/container/board/Boardless.js";
import { Track } from "../../../../ludemes/game/equipment/container/board/Track.js";
import { Array1to1 } from "../../../../ludemes/game/functions/intArray/array/Array1to1.js";
import { Ahead } from "../../../../ludemes/game/functions/ints/board/Ahead.js";
import { ArrayValue } from "../../../../ludemes/game/functions/ints/board/ArrayValue.js";
import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { Mod1to1 } from "../../../../ludemes/game/functions/ints1to1/math/Math1to1.js";
import { LastTo1to1 } from "../../../../ludemes/game/functions/ints1to1/board/Board1to1.js";
import { Automove } from "../../../../ludemes/game/rules/meta/Automove.js";
import { Apply } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Apply.js";
import { Attract } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Attract.js";
import { AvoidStoredState } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/requirement/AvoidStoredState.js";
import { AddScore1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/state/AddScore1to1.js";
import { AllCombinations } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/logical/AllCombinations.js";
import { Append } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/logical/Append.js";
import { Then } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Then.js";
import { From1to1 } from "../../../../ludemes/game/util/moves/From1to1.js";
import { Player1to1 } from "../../../../ludemes/game/util/moves/Player1to1.js";
import type {
  BooleanFunction,
  DirectionsFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
  RoleType,
} from "../../../../ludemes/base.js";
import type { SiteType } from "../../../../ludemes/other/action/SiteType.js";
import type { TilingBoardlessType } from "../../../../ludemes/game/types/board/TilingBoardlessType.js";
import type { ThenLike } from "../../../../ludemes/game/rules/play/moves/Moves.js";
import type { ArgBundle } from "../../ArgBundle.js";
import type { LudemeRegistry } from "../../LudemeRegistry.js";

export function registerBatch0(registry: LudemeRegistry): void {
  registry.registerLudeme("!=:!=", (b): NotEqual1to1 => {
    requireNonSitesComparison(b, "!=");
    return new NotEqual1to1(toIntFunction(requirePos(b, 0)), toIntFunction(requirePos(b, 1)));
  });

  registry.registerLudeme("%:%", (b): Mod1to1 =>
    new Mod1to1(toIntFunction(requirePos(b, 0)), toIntFunction(requirePos(b, 1))));

  registry.registerLudeme("<:<", (b): Lt1to1 =>
    new Lt1to1(toIntFunction(requirePos(b, 0)), toIntFunction(requirePos(b, 1))));

  registry.registerLudeme("<=:<=", (b): Le1to1 =>
    new Le1to1(toIntFunction(requirePos(b, 0)), toIntFunction(requirePos(b, 1))));

  registry.registerLudeme("=:=", (b): Equals1to1 => {
    requireNonSitesComparison(b, "=");
    return new Equals1to1(toIntFunction(requirePos(b, 0)), toIntFunction(requirePos(b, 1)));
  });

  registry.registerLudeme(">:>", (b): Gt1to1 =>
    new Gt1to1(toIntFunction(requirePos(b, 0)), toIntFunction(requirePos(b, 1))));

  registry.registerLudeme(">=:>=", (b): Ge1to1 =>
    new Ge1to1(toIntFunction(requirePos(b, 0)), toIntFunction(requirePos(b, 1))));

  registry.registerLudeme("addScore:addScore", (b): AddScore1to1 => {
    if (hasThen(b) || Array.isArray(b.positional[0])) throw deferred("addScore");
    const who = requirePos(b, 0);
    if (who instanceof Player1to1) throw deferred("addScore");
    return new AddScore1to1(toRoleName(who), toIntFunction(requirePos(b, 1)));
  });

  registry.registerLudeme("ahead:ahead", (b): Ahead => {
    const site = toIntFunction(requirePos(b, firstNonSiteTypeIndex(b)));
    const steps = optionalNamed(b, "steps", toIntFunction) ?? new IntConstant(1);
    const direction = findDirection(b) ?? "Forward";
    const type = firstSiteType(b);
    return new Ahead(site as ConstructorParameters<typeof Ahead>[0], steps as ConstructorParameters<typeof Ahead>[1], { name: direction }, type);
  });

  registry.registerLudeme("allCombinations:allCombinations", (b): AllCombinations =>
    new AllCombinations(
      toMovesFunction(requirePos(b, 0)),
      toMovesFunction(requirePos(b, 1)),
      optionalThen(b),
    ));

  registry.registerLudeme("amount:amount", () => {
    throw deferred("amount");
  });

  registry.registerLudeme("append:append", (b): Append =>
    new Append(toMovesFunction(requirePos(b, 0)), optionalThen(b)));

  registry.registerLudeme("apply:apply", (b): Apply => {
    const cond = optionalNamed(b, "if", toBooleanFunction);
    const effect = firstMovesFunction(b);
    return new Apply(cond, effect);
  });

  registry.registerLudeme("array:array", (b): Array1to1 => {
    const firstArg = b.clause.args[0]?.symbol;
    const value = requirePos(b, 0);
    if (firstArg === "sites") return new Array1to1(toRegionFunction(value), null);
    return new Array1to1(null, asArray(value).map(toIntFunction));
  });

  registry.registerLudeme("arrayValue:arrayValue", (b): ArrayValue =>
    new ArrayValue(
      toIntArrayFunction(requirePos(b, 0)) as ConstructorParameters<typeof ArrayValue>[0],
      requireNamed(b, "index", toIntFunction) as ConstructorParameters<typeof ArrayValue>[1],
    ));

  registry.registerLudeme("attract:attract", (b): Attract => {
    const from = b.positional.find((value): value is From1to1 => value instanceof From1to1);
    const start = from?.locFn() ?? new LastTo1to1();
    const direction = findDirection(b) ?? "Adjacent";
    return new Attract(start, directionFunction(direction), optionalThen(b));
  });

  registry.registerLudeme("automove:automove", (): Automove => new Automove());

  registry.registerLudeme("avoidStoredState:avoidStoredState", (b): AvoidStoredState =>
    new AvoidStoredState(toMovesFunction(requirePos(b, 0)), optionalThen(b) as unknown as MovesFunction | null));

  registry.registerLudeme("bet:bet", () => {
    throw deferred("bet");
  });

  registry.registerLudeme("board.id:id", () => {
    throw deferred("id");
  });

  registry.registerLudeme("board.phase:phase", () => {
    throw deferred("phase");
  });

  registry.registerLudeme("board.track:track", (b): Track => {
    const name = optionalString(b.positional[0]) ?? null;
    const path = requirePos(b, 1);
    const track = isNumberArray(path) ? path : null;
    const trackDirection = typeof path === "string" ? path : null;
    const trackSteps = Array.isArray(path) && !isNumberArray(path) ? path : null;
    const ownerOrRole = b.positional.find((value, index) => index > 1 && (typeof value === "number" || typeof value === "string"));
    return new Track(
      name,
      track,
      trackDirection,
      trackSteps,
      optionalNamed(b, "loop", toBoolean) ?? null,
      typeof ownerOrRole === "number" ? ownerOrRole : null,
      typeof ownerOrRole === "string" && !isDirectionName(ownerOrRole) ? ownerOrRole : null,
      optionalNamed(b, "directed", toBoolean) ?? null,
    );
  });

  registry.registerLudeme("boardless:boardless", (b): Boardless =>
    new Boardless(
      toTilingBoardlessType(requirePos(b, 0)),
      optionalNumber(b.positional[1]),
      optionalNamed(b, "largeStack", toBoolean) ?? null,
    ));

  registry.registerLudeme("booleans.all.all:all", (b): BooleanFunction => makeAll(b));
  registry.registerLudeme("booleans.is.is:is", (b): BooleanFunction => makeIs(b));
}

function makeAll(b: ArgBundle): BooleanFunction {
  const kind = requireStringValue(requirePos(b, 0));
  if (kind === "Values") {
    return All.constructValues(AllValuesType.Values, toIntArrayFunction(requirePos(b, 1)), requireNamed(b, "if", toBooleanFunction));
  }
  if (kind === "Sites" || kind === "Different") {
    return All.constructSites(
      kind === "Different" ? AllSitesType.Different : AllSitesType.Sites,
      toRegionFunction(requirePos(b, 1)),
      requireNamed(b, "if", toBooleanFunction),
    );
  }
  if (kind === "Groups") {
    return All.constructGroups(
      AllGroupsType.Groups,
      firstSiteType(b),
      findDirection(b),
      optionalNamed(b, "of", toBooleanFunction),
      requireNamed(b, "if", toBooleanFunction),
    );
  }
  if (kind === "DiceUsed" || kind === "Passed" || kind === "DiceEqual") {
    return All.constructSimple(kind as AllSimpleType);
  }
  throw deferred("all");
}

function makeIs(b: ArgBundle): BooleanFunction {
  const kind = requireStringValue(requirePos(b, 0));
  switch (kind) {
    case "Cycle": return new IsCycle1to1();
    case "Pending": return new IsPending1to1();
    case "Full": return new IsFull1to1();
    case "Triggered": return new IsTriggered1to1(toIntFunction(b.positional[2] ?? "Mover"));
    case "Mover": return new IsMover1to1(toIntFunction(b.positional[1] ?? "Mover"));
    case "Next": return new IsNext1to1(toIntFunction(b.positional[1] ?? "Next"));
    case "Prev": return new IsPrev1to1(toIntFunction(b.positional[1] ?? "Mover"));
    case "Friend": return new IsFriend1to1(toIntFunction(b.positional[1] ?? "Mover"));
    case "Enemy": return new IsEnemy1to1(toIntFunction(b.positional[1] ?? "Next"));
    case "Active": return new IsActive1to1(toIntFunction(b.positional[1] ?? "Mover"));
    case "Crossing": return new IsCrossing1to1(toIntFunction(requirePos(b, 1)), toIntFunction(requirePos(b, 2)));
    case "Decided": return new IsDecided(requireStringValue(requirePos(b, 1)));
    case "Proposed": return new IsProposed(requireStringValue(requirePos(b, 1)));
    case "LastFrom": return new IsLastFrom1to1((firstSiteType(b, 1) ?? "Cell") as SiteType);
    case "LastTo": return new IsLastTo1to1((firstSiteType(b, 1) ?? "Cell") as SiteType);
    case "Acute": return makeAngle(b, "acute");
    case "Right": return makeAngle(b, "right");
    case "Obtuse": return makeAngle(b, "obtuse");
    case "Reflex": return makeAngle(b, "reflex");
    case "Hidden": return new IsHidden1to1(
      optionalNamed(b, "at", toIntFunction) ?? new IntConstant(-1),
      optionalNamed(b, "to", toIntFunction) ?? roleToIntFunction("Mover"),
    );
    case "Repeat": return new IsRepeat1to1((optionalString(b.positional[1]) ?? "Positional") as ConstructorParameters<typeof IsRepeat1to1>[0]);
    case "Tree": return new IsTree1to1(toIntFunction(b.positional[1] ?? "Mover"));
    case "RegularGraph": return new IsRegularGraph1to1(
      toIntFunction(b.positional[1] ?? "Mover"),
      optionalNamed(b, "k", toIntFunction) ?? new IntConstant(0),
      optionalNamed(b, "odd", toBooleanFunction) ?? falseFunction(),
      optionalNamed(b, "even", toBooleanFunction) ?? falseFunction(),
    );
    case "Path":
      throw deferred("is");
    case "Empty": return new IsEmpty1to1(toIntFunction(lastNonSiteTypePos(b) ?? -1));
    case "Occupied": return new IsOccupied1to1(toIntFunction(lastNonSiteTypePos(b) ?? -1));
    case "Pattern":
    case "Loop":
      throw deferred("is");
    default:
      throw deferred("is");
  }
}

function makeAngle(b: ArgBundle, predicate: "acute" | "right" | "obtuse" | "reflex"): IsAngle1to1 {
  const booleans = b.positional.filter((value): value is BooleanFunction => isBooleanFunction(value));
  return new IsAngle1to1(
    requireNamed(b, "at", toIntFunction),
    booleans[0] ?? falseFunction(),
    booleans[1] ?? falseFunction(),
    predicate,
  );
}

function requireNonSitesComparison(b: ArgBundle, keyword: string): void {
  if (b.clause.args.some((arg) => arg.symbol === "sites")) throw deferred(keyword);
}

function requirePos(b: ArgBundle, index: number): unknown {
  const value = b.positional[index];
  if (value === undefined) throw new Error(`factory ${b.symbol}:${b.constructKey}: missing positional arg ${index}`);
  return value;
}

function requireNamed<T>(b: ArgBundle, name: string, map: (value: unknown) => T): T {
  const value = b.named.get(name.toLowerCase());
  if (value === undefined) throw new Error(`factory ${b.symbol}:${b.constructKey}: missing named arg ${name}`);
  return map(value);
}

function optionalNamed<T>(b: ArgBundle, name: string, map: (value: unknown) => T): T | null {
  const value = b.named.get(name.toLowerCase());
  return value === undefined ? null : map(value);
}

function toIntFunction(value: unknown): IntFunction {
  if (typeof value === "number") return new IntConstant(value);
  if (typeof value === "string") return roleToIntFunction(value);
  if (value instanceof Player1to1) return value.index();
  if (hasEval(value)) return value as IntFunction;
  throw new Error(`factory: expected IntFunction-compatible value, got ${String(value)}`);
}

function roleToIntFunction(role: string): IntFunction {
  const key = role.toLowerCase();
  return {
    eval(ctx): number {
      if (key === "mover") return ctx.state.mover;
      if (key === "next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (key === "prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (key === "neutral" || key === "shared") return 0;
      const match = /^p(\d+)$/.exec(key);
      return match ? Number(match[1]) : ctx.state.mover;
    },
  };
}

function toRoleName(value: unknown): RoleType | "Each" {
  if (typeof value !== "string") throw new Error(`factory: expected roleType, got ${String(value)}`);
  return value as RoleType | "Each";
}

function toMovesFunction(value: unknown): MovesFunction {
  if (hasEval(value)) return value as MovesFunction;
  throw new Error(`factory: expected MovesFunction-compatible value, got ${String(value)}`);
}

function firstMovesFunction(b: ArgBundle): MovesFunction | null {
  for (const value of b.positional) {
    if (value instanceof Then) continue;
    if (hasEval(value)) return value as MovesFunction;
  }
  return null;
}

function toBooleanFunction(value: unknown): BooleanFunction {
  if (typeof value === "boolean") return { eval: () => value };
  if (hasEval(value)) return value as BooleanFunction;
  throw new Error(`factory: expected BooleanFunction-compatible value, got ${String(value)}`);
}

function toRegionFunction(value: unknown): RegionFunction {
  if (hasEval(value)) return value as RegionFunction;
  throw new Error(`factory: expected RegionFunction-compatible value, got ${String(value)}`);
}

function toIntArrayFunction(value: unknown): IntArrayFunction {
  if (hasEval(value)) return value as IntArrayFunction;
  if (Array.isArray(value)) return new Array1to1(null, value.map(toIntFunction));
  throw new Error(`factory: expected IntArrayFunction-compatible value, got ${String(value)}`);
}

function toBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error(`factory: expected boolean, got ${String(value)}`);
  return value;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function requireStringValue(value: unknown): string {
  if (typeof value !== "string") throw new Error(`factory: expected string token, got ${String(value)}`);
  return value;
}

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [value];
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function hasEval(value: unknown): value is { eval: (...args: never[]) => unknown } {
  return typeof (value as { eval?: unknown } | null)?.eval === "function";
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return hasEval(value);
}

function optionalThen(b: ArgBundle): ThenLike | null {
  const then = b.positional.find((value): value is Then => value instanceof Then);
  return (then as unknown as ThenLike | undefined) ?? null;
}

function hasThen(b: ArgBundle): boolean {
  return b.positional.some((value) => value instanceof Then);
}

function firstSiteType(b: ArgBundle, startIndex = 0): SiteType | null {
  for (let i = startIndex; i < b.positional.length; i++) {
    const value = b.positional[i];
    if (value === "Cell" || value === "Edge" || value === "Vertex") return value;
  }
  return null;
}

function firstNonSiteTypeIndex(b: ArgBundle): number {
  const index = b.positional.findIndex((value) => value !== "Cell" && value !== "Edge" && value !== "Vertex");
  return index === -1 ? 0 : index;
}

function lastNonSiteTypePos(b: ArgBundle): unknown | undefined {
  for (let i = b.positional.length - 1; i >= 1; i--) {
    const value = b.positional[i];
    if (value !== "Cell" && value !== "Edge" && value !== "Vertex") return value;
  }
  return undefined;
}

function findDirection(b: ArgBundle): string | null {
  const value = b.positional.find((item) => typeof item === "string" && isDirectionName(item));
  return typeof value === "string" ? value : null;
}

function isDirectionName(value: string): boolean {
  return !["Cell", "Edge", "Vertex", "Mover", "Next", "Prev", "All", "Each", "Shared", "Neutral"].includes(value)
    && !/^P\d+$/.test(value);
}

function directionFunction(direction: string): DirectionsFunction {
  return { eval: () => [direction] };
}

function toTilingBoardlessType(value: unknown): TilingBoardlessType {
  if (value === "Square" || value === "Triangular" || value === "Hexagonal") return value;
  throw new Error(`factory: expected TilingBoardlessType, got ${String(value)}`);
}

function falseFunction(): BooleanFunction {
  return { eval: () => false };
}

function deferred(keyword: string): Error {
  return new Error(`factory not yet wired: ${keyword}`);
}
