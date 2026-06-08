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
import { IsWithin } from "../../../../ludemes/game/functions/booleans/is/component/IsWithin.js";
import { IsAngle1to1 } from "../../../../ludemes/game/functions/booleans/is/angle1to1/IsAngle1to1.js";
import { IsCrossing1to1 } from "../../../../ludemes/game/functions/booleans/is/edge/IsCrossing1to1.js";
import { IsIn1to1 } from "../../../../ludemes/game/functions/booleans/is/in1to1/IsIn1to1.js";
import { IsEven1to1 } from "../../../../ludemes/game/functions/booleans/is/integer1to1/IsEven1to1.js";
import { IsHidden1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsHidden1to1.js";
import { IsCycle1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsCycle1to1.js";
import { IsLastFrom1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsLastFrom1to1.js";
import { IsLastTo1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsLastTo1to1.js";
import { IsAnyDie1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsAnyDie1to1.js";
import { IsLoop1to1 } from "../../../../ludemes/game/functions/booleans/is/loop1to1/IsLoop1to1.js";
import { IsPath1to1 } from "../../../../ludemes/game/functions/booleans/is/path1to1/IsPath1to1.js";
import { IsPattern1to1 } from "../../../../ludemes/game/functions/booleans/is/pattern1to1/IsPattern1to1.js";
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
import { NonDecision } from "../../../../ludemes/game/rules/play/moves/nonDecision/NonDecision.js";
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
import type { RoleTypeFull } from "../../../../ludemes/game/types/play/RoleType.js";
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

  registry.registerLudeme("addScore:addScore", (b): MovesFunction => {
    if (hasThen(b)) throw deferred("addScore");
    const who = requirePos(b, 0);
    if (who instanceof Player1to1) throw deferred("addScore");
    if (Array.isArray(who)) {
      const scores = asArray(requirePos(b, 1));
      if (who.length !== scores.length) throw new Error("factory addScore:addScore: player and score lists must have same length");
      return new AddScoreList(who.map(roleNameFromAddScoreValue), scores.map(toIntFunction));
    }
    return new AddScore1to1(null, toRoleName(who), toIntFunction(requirePos(b, 1)), null);
  });

  registry.registerLudeme("ahead:ahead", (b): Ahead => {
    const site = toIntFunction(requirePos(b, firstNonSiteTypeIndex(b)));
    const steps = optionalNamed(b, "steps", toIntFunction) ?? new IntConstant(1);
    const direction = findDirection(b) ?? "Forward";
    const type = firstSiteType(b);
    return new Ahead(type, site as ConstructorParameters<typeof Ahead>[1], steps as ConstructorParameters<typeof Ahead>[2], { name: direction });
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
    new Append(toNonDecision(requirePos(b, 0)), optionalThen(b)));

  registry.registerLudeme("apply:apply", (b): Apply => {
    const cond = optionalNamed(b, "if", toBooleanFunction);
    const effect = firstMovesFunction(b);
    return new Apply(cond, effect);
  });

  registry.registerLudeme("array:array", (b): Array1to1 => {
    const firstArg = b.clause.args[0]?.symbol;
    const value = requirePos(b, 0);
    if (firstArg === "sites") return new Array1to1(toRegionFunction(value));
    return new Array1to1(asArray(value).map(toIntFunction));
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

  registry.registerLudeme("board.id:id", makeId);

  registry.registerLudeme("board.phase:phase", makeBoardPhase);

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
    case "Triggered": return new IsTriggered1to1(triggeredEvent(b), toIntFunction(b.positional[2] ?? "Mover"), null);
    case "Mover": return b.positional[1] === undefined || typeof b.positional[1] === "string"
      ? new IsMover1to1(null, (b.positional[1] ?? "Mover") as ConstructorParameters<typeof IsMover1to1>[1])
      : new IsMover1to1(toIntFunction(b.positional[1]), null);
    case "Next": {
      const who = b.positional[1];
      return who === undefined || typeof who === "string"
        ? new IsNext1to1(null, (who ?? "Next") as RoleTypeFull)
        : new IsNext1to1(toIntFunction(who ?? "Next"), null);
    }
    case "Prev": return new IsPrev1to1(toIntFunction(b.positional[1] ?? "Mover"), null);
    case "Friend": {
      const who = b.positional[1];
      return typeof who === "string"
        ? new IsFriend1to1(null, who as RoleTypeFull)
        : new IsFriend1to1(toIntFunction(who ?? "Mover"), null);
    }
    case "Enemy": return new IsEnemy1to1(toIntFunction(b.positional[1] ?? "Next"), null);
    case "Active": return new IsActive1to1(toIntFunction(b.positional[1] ?? "Mover"), null);
    case "AnyDie": return new IsAnyDie1to1(toIntFunction(b.positional[1] ?? new IntConstant(0)));
    case "Even": return new IsEven1to1(toIntFunction(requirePos(b, 1)));
    case "Crossing": return new IsCrossing1to1(toIntFunction(requirePos(b, 1)), toIntFunction(requirePos(b, 2)));
    case "Decided": return new IsDecided(requireStringValue(requirePos(b, 1)));
    case "Proposed": return new IsProposed(requireStringValue(requirePos(b, 1)));
    case "LastFrom": return new IsLastFrom1to1((firstSiteType(b, 1) ?? "Cell") as SiteType);
    case "LastTo": return new IsLastTo1to1((firstSiteType(b, 1) ?? "Cell") as SiteType);
    case "Acute": return makeAngle(b, "acute");
    case "Right": return makeAngle(b, "right");
    case "Obtuse": return makeAngle(b, "obtuse");
    case "Reflex": return makeAngle(b, "reflex");
    case "Hidden": {
      const toValue = b.named.get("to");
      const to = toValue instanceof Player1to1
        ? toValue
        : toValue !== undefined && typeof toValue !== "string"
          ? new Player1to1(toIntFunction(toValue))
          : null;
      const To: RoleTypeFull | null =
        typeof toValue === "string" ? toValue as RoleTypeFull : toValue === undefined ? "Mover" : null;
      return new IsHidden1to1(
        firstSiteType(b, 1),
        optionalNamed(b, "at", toIntFunction) ?? new IntConstant(-1),
        optionalNamed(b, "level", toIntFunction),
        to,
        To,
      );
    }
    case "Repeat": return new IsRepeat1to1((optionalString(b.positional[1]) ?? "Positional") as ConstructorParameters<typeof IsRepeat1to1>[0]);
    case "Tree": {
      const whoArg = b.positional[1] ?? "Mover";
      const player = whoArg instanceof Player1to1
        ? whoArg
        : (typeof whoArg === "string" ? null : new Player1to1(toIntFunction(whoArg)));
      const role = typeof whoArg === "string"
        ? whoArg as ConstructorParameters<typeof IsTree1to1>[1]
        : null;
      return new IsTree1to1(player, role);
    }
    case "RegularGraph": {
      const whoArg = b.positional[1] ?? "Mover";
      const player = whoArg instanceof Player1to1
        ? whoArg
        : (typeof whoArg === "string" ? null : new Player1to1(toIntFunction(whoArg)));
      const role = typeof whoArg === "string"
        ? whoArg as ConstructorParameters<typeof IsRegularGraph1to1>[1]
        : null;
      return new IsRegularGraph1to1(
        player,
        role,
        optionalNamed(b, "k", toIntFunction) ?? new IntConstant(0),
        optionalNamed(b, "odd", toBooleanFunction) ?? falseFunction(),
        optionalNamed(b, "even", toBooleanFunction) ?? falseFunction(),
      );
    }
    case "Path": return makePath(b);
    case "Empty": return new IsEmpty1to1(firstSiteType(b, 1), toIntFunction(lastNonSiteTypePos(b) ?? -1));
    case "Occupied": return new IsOccupied1to1(firstSiteType(b, 1), toIntFunction(lastNonSiteTypePos(b) ?? -1));
    case "In": return new IsIn1to1(
      toIntFunction(b.positional[1] ?? new LastTo1to1()),
      toRegionFunction(requirePos(b, 2)),
    );
    case "Within": return new IsWithin(
      toIntFunction(firstNonKindNonSiteValue(b, "Within") ?? "Mover"),
      firstSiteType(b, 1),
      optionalNamed(b, "at", toIntFunction),
      optionalNamed(b, "in", toRegionFunction),
    );
    case "Pattern": return makePattern(b);
    case "Loop": return makeLoop(b);
    default:
      throw deferred(`is ${kind}`);
  }
}

function triggeredEvent(b: ArgBundle): string {
  return optionalString(b.positional[1]) ?? "";
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

function makeId(b: ArgBundle): IntFunction {
  const first = b.positional[0];
  const second = b.positional[1];
  if (typeof first === "string" && second === undefined && isRoleValue(first)) return roleToIntFunction(first);
  if (typeof first !== "string") return roleToIntFunction(String(first ?? "Mover"));
  const owner = typeof second === "string" ? roleToStaticOwner(second) : null;
  return {
    eval(ctx): number {
      const pieces = (ctx.game as unknown as { equipment?: { pieces?: readonly { name: string; owner: number; index: number }[] } }).equipment?.pieces ?? [];
      const parsed = parsePieceNameOwner(first);
      const name = parsed?.name ?? first;
      const ownerId = owner ?? parsed?.owner ?? -1;
      const piece = pieces.find((p) => p.name === name && (ownerId < 0 || p.owner === ownerId))
        ?? pieces.find((p) => `${p.name}${p.owner}` === first);
      return piece?.index ?? roleToIntFunction(first).eval(ctx);
    },
  };
}

function makeBoardPhase(b: ArgBundle): IntFunction {
  const type = firstSiteType(b);
  const of = requireNamed(b, "of", toIntFunction);
  return {
    eval(ctx): number {
      const index = of.eval(ctx);
      if (index < 0) return -1;

      const topology = (ctx as unknown as {
        topology?: () => {
          getGraphElements(type: SiteType): Array<{ phase(): number }>;
        };
      }).topology?.();
      if (topology) {
        const elements = topology.getGraphElements(type ?? "Cell");
        return elements[index]?.phase() ?? -1;
      }

      const width = (ctx.game as unknown as { width?: number }).width;
      if (width !== undefined && width > 0) {
        const col = index % width;
        const row = Math.floor(index / width);
        return (row + col) % 2;
      }

      return 0;
    },
  };
}

function makePath(b: ArgBundle): IsPath1to1 {
  const type = firstSiteType(b, 1);
  if (type === null) throw new Error("factory is Path: missing site type");
  const range = rangeBounds(requireNamed(b, "length", (value) => value));
  return new IsPath1to1(
    type,
    optionalNamed(b, "from", toIntFunction) ?? new LastTo1to1(),
    toIntFunction(firstNonKindNonSiteValue(b, "Path") ?? "Mover"),
    range.minFn,
    range.maxFn,
    optionalNamed(b, "closed", toBooleanFunction) ?? falseFunction(),
  );
}

function makePattern(b: ArgBundle): IsPattern1to1 {
  const froms = b.named.get("froms");
  if (froms !== undefined && (!Array.isArray(froms) || froms.length > 0)) throw deferred("is");

  const walk = patternWalk(b.positional.find(isStepArray) ?? []);
  const type = firstSiteType(b, 1);
  const what = b.named.get("what");
  const whats = b.named.get("whats");
  const whatFn = what === undefined ? null : toIntFunction(what);
  const whatsFn = Array.isArray(whats) && whats.length > 0 ? whats.map(toIntFunction) : null;

  return new IsPattern1to1(
    walk,
    type,
    optionalNamed(b, "from", toIntFunction) ?? new LastTo1to1(),
    whatFn,
    whatsFn,
  );
}

function makeLoop(b: ArgBundle): IsLoop1to1 {
  if (b.named.has("surround")) throw deferred("is");
  if ((optionalNamed(b, "path", toBoolean) ?? false) === true) throw deferred("is");
  if (flatten(b.positional).some((value) => Array.isArray(value) && value.some(isRoleValue))) throw deferred("is");
  if (b.positional.some((value) => value !== "Loop" && isRegionFunction(value))) throw deferred("is");

  const type = firstSiteType(b, 1);
  if (type !== null && type !== "Cell") throw deferred("is");

  const ints = b.positional
    .filter((value) => value !== "Loop" && !isSiteType(value) && !isDirectionToken(value))
    .filter(isIntFunctionLike)
    .map(toIntFunction);

  return new IsLoop1to1(
    type,
    null,
    null,
    findDirection(b),
    ints[0] ?? roleToIntFunction("Mover"),
    ints[1] ?? new LastTo1to1(),
    null,
    null,
  );
}

class AddScoreList implements MovesFunction {
  private readonly delegates: readonly AddScore1to1[];

  public constructor(roles: readonly (RoleType | "All" | "Each")[], scores: readonly IntFunction[]) {
    this.delegates = roles.map((role, index) => new AddScore1to1(null, role, scores[index] ?? null, null));
  }

  public eval(...args: Parameters<MovesFunction["eval"]>): ReturnType<MovesFunction["eval"]> {
    return this.delegates.flatMap((delegate) => delegate.eval(...args));
  }
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

function roleToStaticOwner(role: string): number {
  const key = role.toLowerCase();
  const match = /^p(\d+)$/.exec(key);
  if (match) return Number(match[1]);
  if (key === "neutral" || key === "shared") return 0;
  return -1;
}

function parsePieceNameOwner(value: string): { name: string; owner: number } | null {
  const match = /^(.+?)(\d+)$/.exec(value);
  if (!match) return null;
  return { name: match[1]!, owner: Number(match[2]) };
}

function toRoleName(value: unknown): RoleType | "Each" {
  if (typeof value !== "string") throw new Error(`factory: expected roleType, got ${String(value)}`);
  return value as RoleType | "Each";
}

function toMovesFunction(value: unknown): MovesFunction {
  if (hasEval(value)) return value as MovesFunction;
  throw new Error(`factory: expected MovesFunction-compatible value, got ${String(value)}`);
}

function toNonDecision(value: unknown): NonDecision {
  if (value instanceof NonDecision) return value;
  throw new Error(`factory: expected NonDecision value, got ${String(value)}`);
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
  if (Array.isArray(value)) return new Array1to1(value.map(toIntFunction));
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

function flatten(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value)) out.push(...flatten(value));
    else out.push(value);
  }
  return out;
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function isSiteType(value: unknown): value is SiteType {
  return value === "Cell" || value === "Edge" || value === "Vertex";
}

function hasEval(value: unknown): value is { eval: (...args: never[]) => unknown } {
  return typeof (value as { eval?: unknown } | null)?.eval === "function";
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return hasEval(value);
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return hasEval(value) && !isIntFunctionLike(value);
}

function isIntFunctionLike(value: unknown): boolean {
  return typeof value === "number" || typeof value === "string" || value instanceof Player1to1 || hasEval(value);
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
    if (isSiteType(value)) return value;
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

function isDirectionToken(value: unknown): boolean {
  return typeof value === "string" && isDirectionName(value);
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

function firstNonKindNonSiteValue(b: ArgBundle, kind: string): unknown | undefined {
  return b.positional.find((value) => value !== kind && !isSiteType(value));
}

function rangeBounds(value: unknown): { minFn: IntFunction; maxFn: IntFunction } {
  const range = value as { minFn?: unknown; maxFn?: unknown } | null;
  if (range !== null && hasEval(value) && isIntFunction(range.minFn) && isIntFunction(range.maxFn)) {
    return { minFn: range.minFn, maxFn: range.maxFn };
  }
  if (isIntFunctionLike(value)) {
    const fn = toIntFunction(value);
    return { minFn: fn, maxFn: fn };
  }
  throw new Error(`factory: expected range-compatible value, got ${String(value)}`);
}

function isIntFunction(value: unknown): value is IntFunction {
  return hasEval(value);
}

function isStepArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => item === "F" || item === "R" || item === "L");
}

function patternWalk(value: readonly string[]): ConstructorParameters<typeof IsPattern1to1>[0] {
  return value.map((step) => step.toUpperCase()).filter((step) => step === "F" || step === "R" || step === "L") as ConstructorParameters<typeof IsPattern1to1>[0];
}

function roleNameFromAddScoreValue(value: unknown): RoleType | "All" | "Each" {
  if (value instanceof Player1to1 || typeof value === "number" || (hasEval(value) && typeof value !== "string")) throw deferred("addScore");
  return toRoleName(value);
}

function isRoleValue(value: unknown): boolean {
  return typeof value === "string" && !isSiteType(value) && !isDirectionName(value);
}

function falseFunction(): BooleanFunction {
  return { eval: () => false };
}

function deferred(keyword: string): Error {
  return new Error(`factory not yet wired: ${keyword}`);
}
