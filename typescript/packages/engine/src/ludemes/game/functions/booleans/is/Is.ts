// @java Core/src/game/functions/booleans/is/Is.java

import { IsConnected } from "./connect/IsConnected.js";
import type { Context } from "../../../../../context.js";
import type {
  BooleanFunction,
  EvalScratch,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "../../../../base.js";
import { IntConstant } from "../../ints/IntConstant.js";
import type { Range } from "../../range/Range.js";
import { BaseBooleanFunction } from "../BaseBooleanFunction.js";
import { IsAngle } from "./angle/IsAngle.js";
import { IsWithin } from "./component/IsWithin.js";
import { IsFreedom } from "./component/IsFreedom.js";
import { IsCrossing } from "./edge/IsCrossing.js";
import { IsHiddenCount } from "./Hidden/IsHiddenCount.js";
import { IsHiddenRotation } from "./Hidden/IsHiddenRotation.js";
import { IsHiddenState } from "./Hidden/IsHiddenState.js";
import { IsHiddenValue } from "./Hidden/IsHiddenValue.js";
import { IsHiddenWhat } from "./Hidden/IsHiddenWhat.js";
import { IsHiddenWho } from "./Hidden/IsHiddenWho.js";
import { IsIn } from "./in/IsIn.js";
import { IsAnyDie } from "./is/IsAnyDie.js";
import { IsCycle } from "./is/IsCycle.js";
import { IsHidden } from "./is/IsHidden.js";
import { IsLastFrom } from "./is/IsLastFrom.js";
import { IsLastTo } from "./is/IsLastTo.js";
import { IsRepeat } from "./is/IsRepeat.js";
import { IsTarget } from "./is/IsTarget.js";
import { IsTriggered } from "./is/IsTriggered.js";
import { IsPipsMatch } from "./integer/IsPipsMatch.js";
import { IsSidesMatch } from "./integer/IsSidesMatch.js";
import { IsThreatened } from "./component/IsThreatened.js";
import { IsEven } from "./integer/IsEven.js";
import { IsFlat } from "./integer/IsFlat.js";
import { IsOdd } from "./integer/IsOdd.js";
import { IsVisited } from "./integer/IsVisited.js";
import { IsLine } from "./line/IsLine.js";
import { IsLoop } from "./loop/IsLoop.js";
import { IsPath } from "./path/IsPath.js";
import { IsPattern } from "./pattern/IsPattern.js";
import { IsActive } from "./player/IsActive.js";
import { IsEnemy } from "./player/IsEnemy.js";
import { IsFriend } from "./player/IsFriend.js";
import { IsMover } from "./player/IsMover.js";
import { IsNext } from "./player/IsNext.js";
import { IsPrev } from "./player/IsPrev.js";
import { IsPyramidCorners } from "./pyramidCorners/IsPyramidCorners.js";
import { IsRegularGraph } from "./regularGraph/IsRegularGraph.js";
import { IsRelated } from "./related/IsRelated.js";
import { IsEmpty } from "./site/IsEmpty.js";
import { IsOccupied } from "./site/IsOccupied.js";
import { IsBlocked } from "./simple/IsBlocked.js";
import { IsFull } from "./simple/IsFull.js";
import { IsPending } from "./simple/IsPending.js";
import { IsDecided } from "./string/IsDecided.js";
import { IsProposed } from "./string/IsProposed.js";
import { IsCaterpillarTree } from "./tree/IsCaterpillarTree.js";
import { IsSpanningTree } from "./tree/IsSpanningTree.js";
import { IsTree } from "./tree/IsTree.js";
import { IsTreeCentre } from "./tree/IsTreeCentre.js";
import type { RoleTypeFull } from "../../../types/play/RoleType.js";
import { Player } from "../../../util/moves/Player.js";

type SiteTypeName = "Vertex" | "Edge" | "Cell";
type RangeLike = Range | { readonly minFn?: IntFunction; readonly maxFn?: IntFunction } | IntFunction;
type RepeatTypeName = "PositionalInTurn" | "SituationalInTurn" | "Positional" | "Situational";
type StepTypeName = "F" | "R" | "L";

const ZERO_INT = new IntConstant(0);
const ONE_INT = new IntConstant(1);
const INFINITY_INT = new IntConstant(999_999);
const LAST_TO_INT: IntFunction = { eval: (ctx: Context & EvalScratch) => ctx._evalTo };
const FALSE_BOOL: BooleanFunction = { eval: () => false };

function matchesType(value: unknown, name: string): boolean {
  return value === name;
}

function siteType(value: unknown): SiteTypeName | null {
  return typeof value === "string" ? value as SiteTypeName : null;
}

function asIntFunction(value: unknown, fallback: IntFunction | null = null): IntFunction {
  if (value instanceof Player) return value.index();
  if (value !== null && value !== undefined && typeof (value as { eval?: unknown }).eval === "function")
    return value as IntFunction;
  if (typeof value === "number") return new IntConstant(value);
  if (fallback !== null) return fallback;
  throw new Error("Is(): expected IntFunction.");
}

function roleToIntFunction(role: unknown): IntFunction {
  const key = String(role ?? "Mover").toLowerCase();
  return {
    eval(ctx: Context & EvalScratch): number {
      if (key === "neutral") return 0;
      if (key === "mover") return ctx.state.mover;
      if (key === "next") return ctx.state.next || ((ctx.state.mover % ctx.game.numPlayers) + 1);
      if (key === "prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (key === "player") return ctx._evalPlayer ?? ctx.state.mover;
      if (key === "shared" || key === "all" || key === "each") return ctx.game.numPlayers + 1;

      const playerMatch = /^p(\d+)$/i.exec(String(role));
      if (playerMatch) return Number(playerMatch[1]);
      const teamMatch = /^team(\d+)$/i.exec(String(role));
      if (teamMatch) return Number(teamMatch[1]);
      return -1;
    },
  };
}

function playerFrom(value: unknown): Player | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Player) return value;
  return new Player(asIntFunction(value));
}

function playerOrRoleInt(index: unknown, role: unknown): IntFunction {
  if (index !== null && index !== undefined) return asIntFunction(index);
  if (role !== null && role !== undefined) return roleToIntFunction(role);
  throw new Error("Is(): exactly one player/index or role parameter is required.");
}

function boolFn(value: unknown, fallback: BooleanFunction = FALSE_BOOL): BooleanFunction {
  if (value !== null && value !== undefined && typeof (value as { eval?: unknown }).eval === "function")
    return value as BooleanFunction;
  if (typeof value === "boolean") return { eval: () => value };
  return fallback;
}

function regionFromSite(site: IntFunction): RegionFunction {
  return { eval: (ctx: Context & EvalScratch) => [site.eval(ctx)] };
}

function rangeFns(range: unknown): { min: IntFunction; max: IntFunction } {
  if (range !== null && range !== undefined) {
    const r = range as RangeLike;
    if ("minFn" in r && r.minFn !== undefined) {
      return { min: r.minFn, max: r.maxFn ?? r.minFn };
    }
    if (typeof (r as { eval?: unknown }).eval === "function") {
      const fn = r as IntFunction;
      return { min: fn, max: fn };
    }
  }
  return { min: ONE_INT, max: INFINITY_INT };
}

class IsInArray implements BooleanFunction {
  public constructor(
    private readonly site: IntFunction | null,
    private readonly sites: readonly IntFunction[] | null,
    private readonly array: IntArrayFunction,
  ) {}

  public eval(ctx: Context & EvalScratch): boolean {
    const values = new Set(this.array.eval(ctx));
    if (this.site !== null) return values.has(this.site.eval(ctx));
    return (this.sites ?? []).every((fn) => values.has(fn.eval(ctx)));
  }
}

class IsAllInRegion implements BooleanFunction {
  public constructor(
    private readonly sites: readonly IntFunction[],
    private readonly region: RegionFunction,
  ) {}

  public eval(ctx: Context & EvalScratch): boolean {
    const values = new Set(this.region.eval(ctx));
    return this.sites.every((fn) => values.has(fn.eval(ctx)));
  }
}

/**
 * Returns whether the specified query about the game state is true or not.
 *
 * Java parity: `Is` is a pure dispatcher — all logic lives in subclasses.
 * Its own `eval()` throws, matching the Java UnsupportedOperationException.
 * Concrete callers should never call `new Is()` or `Is.eval()` directly;
 * instead they call one of the static `construct()` factories, which return
 * a concrete BooleanFunction subclass instance.
 *
 * @java game/functions/booleans/is/Is.java
 * @author Eric.Piette and cambolbro
 */
export class Is extends BaseBooleanFunction {
  /** @java Is.construct(IsAngleType, SiteType, IntFunction, BooleanFunction, BooleanFunction) */
  public static constructAngle(
    isType: unknown,
    _type: unknown,
    at: IntFunction,
    conditionSite: BooleanFunction,
    conditionSite2: BooleanFunction,
  ): BooleanFunction {
    if (matchesType(isType, "Acute")) return new IsAngle(at, conditionSite, conditionSite2, "acute");
    if (matchesType(isType, "Obtuse")) return new IsAngle(at, conditionSite, conditionSite2, "obtuse");
    if (matchesType(isType, "Reflex")) return new IsAngle(at, conditionSite, conditionSite2, "reflex");
    if (matchesType(isType, "Right")) return new IsAngle(at, conditionSite, conditionSite2, "right");
    throw new Error("Is(): An IsAngleType is not implemented.");
  }

  /** @java Is.construct(IsHiddenType, HiddenData, SiteType, IntFunction, IntFunction, Player, RoleType) */
  public static constructHidden(
    isType: unknown,
    dataType: unknown,
    type: unknown,
    at: IntFunction,
    level: IntFunction | null,
    to: unknown,
    To: unknown,
  ): BooleanFunction {
    if (!matchesType(isType, "Hidden")) throw new Error("Is(): An IsHiddenType is not implemented.");
    const whoFn = playerOrRoleInt(to, To);
    const toPlayer = playerFrom(to);
    const toRole = To as RoleTypeFull | null;
    const levelFn = level ?? ZERO_INT;
    const realType = siteType(type);
    if (dataType === null || dataType === undefined || dataType === "Invisible" || dataType === "Hidden")
      return new IsHidden(at, whoFn);
    if (dataType === "What") return new IsHiddenWhat(realType, at, levelFn, toPlayer, toRole);
    if (dataType === "Who") return new IsHiddenWho(realType, at, levelFn, toPlayer, toRole);
    if (dataType === "Count") return new IsHiddenCount(realType, at, levelFn, toPlayer, toRole);
    if (dataType === "State") return new IsHiddenState(realType, at, levelFn, toPlayer, toRole);
    if (dataType === "Rotation") return new IsHiddenRotation(realType, at, levelFn, toPlayer, toRole);
    if (dataType === "Value") return new IsHiddenValue(realType, at, levelFn, toPlayer, toRole);
    throw new Error("Is(): HiddenData is not implemented.");
  }

  /** @java Is.construct(IsRepeatType, RepetitionType) */
  public static constructRepeat(isType: unknown, repetitionType: unknown): BooleanFunction {
    if (matchesType(isType, "Repeat")) return new IsRepeat((repetitionType ?? "Positional") as RepeatTypeName);
    throw new Error("Is(): An IsRepeatType is not implemented.");
  }

  /** @java Is.construct(IsPatternType, StepType[], SiteType, IntFunction, IntFunction, IntFunction[], RegionFunction) */
  public static constructPattern(
    isType: unknown,
    walk: readonly string[] | null,
    _type: unknown,
    from: IntFunction | null,
    what: IntFunction | null,
    whats: readonly IntFunction[] | null,
    froms: RegionFunction | null,
  ): BooleanFunction {
    if (matchesType(isType, "Pattern"))
      return new IsPattern((walk ?? []) as readonly StepTypeName[], siteType(_type), from ?? LAST_TO_INT, what, whats);
    if (matchesType(isType, "PyramidCorners"))
      return new IsPyramidCorners(siteType(_type) ?? "Cell", from ?? LAST_TO_INT, froms ?? null);
    throw new Error("Is(): An IsPatternType is not implemented.");
  }

  /** @java Is.construct(IsTreeType, Player, RoleType) */
  public static constructTree(isType: unknown, who: unknown, role: unknown): BooleanFunction {
    const player = role === null || role === undefined ? playerFrom(who) : null;
    const roleName = role as RoleTypeFull | null;
    if (matchesType(isType, "Tree")) return new IsTree(player, roleName);
    if (matchesType(isType, "SpanningTree")) return new IsSpanningTree(player, roleName);
    if (matchesType(isType, "CaterpillarTree")) return new IsCaterpillarTree(player, roleName);
    if (matchesType(isType, "TreeCentre")) return new IsTreeCentre(player, roleName);
    throw new Error("Is(): A IsTreeType is not implemented.");
  }

  /** @java Is.construct(IsRegularGraphType, Player, RoleType, IntFunction, BooleanFunction, BooleanFunction) */
  public static constructRegularGraph(
    isType: unknown,
    who: unknown,
    role: unknown,
    k: IntFunction | null,
    odd: BooleanFunction | null,
    even: BooleanFunction | null,
  ): BooleanFunction {
    if (matchesType(isType, "RegularGraph"))
      return new IsRegularGraph(playerFrom(who), role as RoleTypeFull | null, k, odd, even);
    throw new Error("Is(): A IsRegularGraphType is not implemented.");
  }

  /** @java Is.construct(IsPlayerType, IntFunction, RoleType) */
  public static constructPlayer(isType: unknown, index: unknown, role: unknown): BooleanFunction {
    const who = index === null || index === undefined ? null : asIntFunction(index);
    const roleName = role as RoleTypeFull | null;
    if (matchesType(isType, "Enemy")) return new IsEnemy(who, roleName);
    if (matchesType(isType, "Friend")) return new IsFriend(who, roleName);
    if (matchesType(isType, "Mover")) return new IsMover(who, roleName);
    if (matchesType(isType, "Next")) return new IsNext(who, roleName);
    if (matchesType(isType, "Prev")) return new IsPrev(who, roleName);
    if (matchesType(isType, "Active")) return new IsActive(who, roleName);
    throw new Error("Is(): A IsPlayerType is not implemented.");
  }

  /** @java Is.construct(IsTriggeredType, String, IntFunction, RoleType) */
  public static constructTriggered(isType: unknown, event: string, index: unknown, role: unknown): BooleanFunction {
    if (matchesType(isType, "Triggered"))
      return new IsTriggered(event, index === null || index === undefined ? null : asIntFunction(index), role as RoleTypeFull | null);
    throw new Error("Is(): A IsTriggeredType is not implemented.");
  }

  /** @java Is.construct(IsSimpleType) */
  public static constructSimple(isType: unknown): BooleanFunction {
    if (matchesType(isType, "Cycle")) return new IsCycle();
    if (matchesType(isType, "Pending")) return new IsPending();
    if (matchesType(isType, "Full")) return new IsFull();
    throw new Error("Is(): A IsSimpleType is not implemented.");
  }

  /** @java Is.construct(IsEdgeType, IntFunction, IntFunction) */
  public static constructEdge(isType: unknown, edge1: IntFunction, edge2: IntFunction): BooleanFunction {
    if (matchesType(isType, "Crossing")) return new IsCrossing(edge1, edge2);
    throw new Error("Is(): A IsEdgeType is not implemented.");
  }

  /** @java Is.construct(IsStringType, String) */
  public static constructString(isType: unknown, string: string): BooleanFunction {
    if (matchesType(isType, "Decided")) return new IsDecided(string);
    if (matchesType(isType, "Proposed")) return new IsProposed(string);
    throw new Error("Is(): A IsStringType is not implemented.");
  }

  /** @java Is.construct(IsGraphType, SiteType) */
  public static constructGraph(isType: unknown, type: unknown): BooleanFunction {
    const realType = siteType(type) ?? "Cell";
    if (matchesType(isType, "LastFrom")) return new IsLastFrom(realType);
    if (matchesType(isType, "LastTo")) return new IsLastTo(realType);
    throw new Error("Is(): A IsGraphType is not implemented.");
  }

  /** @java Is.construct(IsIntegerType, IntFunction) */
  public static constructInteger(isType: unknown, value: IntFunction | null): BooleanFunction {
    const fn = value ?? LAST_TO_INT;
    if (matchesType(isType, "Even")) return new IsEven(fn);
    if (matchesType(isType, "Odd")) return new IsOdd(fn);
    if (matchesType(isType, "Flat")) return new IsFlat();
    if (matchesType(isType, "PipsMatch")) return new IsPipsMatch(value);
    if (matchesType(isType, "SidesMatch")) return new IsSidesMatch(value);
    if (matchesType(isType, "Visited")) return new IsVisited(fn);
    if (matchesType(isType, "AnyDie")) return value !== null ? new IsAnyDie(value) : FALSE_BOOL;
    throw new Error("Is(): A IsIntegerType is not implemented.");
  }

  /** @java Is.construct(IsComponentType, IntFunction, SiteType, IntFunction, RegionFunction, Moves) */
  public static constructComponent(
    isType: unknown,
    what: IntFunction | null,
    type: unknown,
    at: IntFunction | null,
    inArg: RegionFunction | null,
    _specificMoves: unknown,
  ): BooleanFunction {
    if (matchesType(isType, "Threatened")) return new IsThreatened(what, siteType(type), at, inArg, _specificMoves as MovesFunction | null);
    if (matchesType(isType, "Within")) return new IsWithin(what ?? ZERO_INT, siteType(type), at, inArg);
    throw new Error("Is(): A ported IsComponentType variant is not implemented.");
  }

  /** @java Is.construct(IsRelationType, RelationType, SiteType, IntFunction, IntFunction, RegionFunction) */
  public static constructRelation(
    isType: unknown,
    relationType: unknown,
    _type: unknown,
    siteA: IntFunction,
    siteB: IntFunction | null,
    region: RegionFunction | null,
  ): BooleanFunction {
    if (matchesType(isType, "Related"))
      return new IsRelated(String(relationType), siteType(_type), siteA, region ?? regionFromSite(asIntFunction(siteB)));
    throw new Error("Is(): A IsRelationType is not implemented.");
  }

  /** @java Is.construct(IsTargetType, IntFunction, String, Integer[], Integer, Integer[]) */
  public static constructTarget(
    isType: unknown,
    _containerIdFn: unknown,
    _containerName: unknown,
    configuration: readonly number[],
    specificSite: number | null,
    specificSites: readonly number[] | null,
  ): BooleanFunction {
    if (matchesType(isType, "Target"))
      return new IsTarget(
        _containerIdFn === null || _containerIdFn === undefined ? null : asIntFunction(_containerIdFn),
        _containerName === null || _containerName === undefined ? null : String(_containerName),
        configuration,
        specificSite,
        specificSites,
      );
    throw new Error("Is(): A IsTargetType is not implemented.");
  }

  /** @java Is.construct(IsConnectType, IntFunction, SiteType, IntFunction, Direction, RegionFunction[], RoleType, RegionTypeStatic) */
  public static constructConnect(
    isType: unknown,
    _number: unknown,
    _type: unknown,
    _at: unknown,
    _directions: unknown,
    _regions: unknown,
    _role: unknown,
    _regionType: unknown,
  ): BooleanFunction {
    if (matchesType(isType, "Blocked")) return new IsBlocked();
    if (matchesType(isType, "Connected")) {
      // @java case Connected: new IsConnected(number, type, at, directions, regions, role, regionType)
      const regions = Array.isArray(_regions) ? (_regions as never[]) : (_regions ? [_regions as never] : null);
      const role = typeof _role === "string" ? _role : null;
      // @java RegionTypeStatic (e.g. (is Connected 3 Sides)) + the minimum
      // number of regions to connect — IsConnected.java staticRegions/number.
      const regionType = typeof _regionType === "string" ? _regionType : null;
      const numberFn = _number as { eval(ctx: unknown): number } | number | null;
      // @java the Direction param selects the flood connectivity
      // (Crossway: (is Connected All Mover) — 8-connectivity incl. diagonals).
      const dirName = typeof _directions === "string"
        ? _directions
        : (_directions as { name?: string } | null)?.name ?? null;
      return new IsConnected(regions, role, regionType, numberFn ?? null, dirName);
    }
    throw new Error("Is(): A ported IsConnectType variant is not implemented.");
  }

  /** @java Is.construct(IsLineType, SiteType, IntFunction, AbsoluteDirection, IntFunction, RegionFunction, RoleType, IntFunction, IntFunction[], BooleanFunction, BooleanFunction, BooleanFunction, BooleanFunction, BooleanFunction, IntFunction, BooleanFunction, BooleanFunction) */
  public static constructLine(
    isType: unknown,
    type: unknown,
    length: IntFunction,
    dirn: unknown,
    through: IntFunction | null,
    throughAny: RegionFunction | null,
    who: unknown,
    what: IntFunction | null,
    whats: readonly IntFunction[] | null,
    exact: BooleanFunction | boolean | null,
    contiguous: BooleanFunction | null,
    If: BooleanFunction | null,
    byLevel: BooleanFunction | null,
    top: BooleanFunction | null,
    throughHowMuch: IntFunction | null,
    isVisible: BooleanFunction | null,
    useOpposites: BooleanFunction | null,
  ): BooleanFunction {
    if (matchesType(isType, "Line"))
      return new IsLine(
        siteType(type),
        length,
        dirn === null || dirn === undefined ? null : String(dirn),
        through,
        throughAny,
        who === null || who === undefined ? null : String(who),
        what,
        whats,
        exact,
        contiguous,
        If,
        byLevel,
        top,
        throughHowMuch,
        isVisible,
        useOpposites,
      );
    throw new Error("Is(): A IsLineType is not implemented.");
  }

  /** @java Is.construct(IsLoopType, SiteType, RoleType, RoleType[], Direction, IntFunction, IntFunction, RegionFunction, Boolean) */
  public static constructLoop(
    isType: unknown,
    _type: unknown,
    _surround: unknown,
    _surroundList: unknown,
    directions: unknown,
    colour: IntFunction | null,
    start: IntFunction | null,
    regionStart: RegionFunction | null,
    _path: boolean | null,
  ): BooleanFunction {
    if (matchesType(isType, "Loop"))
      return new IsLoop(
        siteType(_type),
        _surround === null || _surround === undefined ? null : String(_surround),
        _surroundList as readonly RoleTypeFull[] | null,
        directions === null || directions === undefined ? "Adjacent" : String(directions),
        colour,
        start,
        regionStart,
        _path,
      );
    throw new Error("Is(): A IsLoopType is not implemented.");
  }

  /** @java Is.construct(IsPathType, SiteType, IntFunction, Player, RoleType, RangeFunction, BooleanFunction) */
  public static constructPath(
    isType: unknown,
    type: unknown,
    from: IntFunction | null,
    who: unknown,
    role: unknown,
    length: unknown,
    closed: BooleanFunction | null,
  ): BooleanFunction {
    if (matchesType(isType, "Path")) {
      const range = rangeFns(length);
      return new IsPath(siteType(type) ?? "Edge", from ?? LAST_TO_INT, playerOrRoleInt(who, role), range.min, range.max, boolFn(closed));
    }
    throw new Error("Is(): A IsPathType is not implemented.");
  }

  /** @java Is.construct(IsSiteType, SiteType, IntFunction) */
  public static constructSite(isType: unknown, _type: unknown, at: IntFunction): BooleanFunction {
    if (matchesType(isType, "Empty")) return new IsEmpty(siteType(_type), at);
    if (matchesType(isType, "Occupied")) return new IsOccupied(siteType(_type), at);
    throw new Error("Is(): A IsSiteType is not implemented.");
  }

  /** @java Is.construct(IsInType, IntFunction, IntFunction[], RegionFunction, IntArrayFunction) */
  public static constructIn(
    isType: unknown,
    site: IntFunction | null,
    sites: readonly IntFunction[] | null,
    region: RegionFunction | null,
    array: IntArrayFunction | null,
  ): BooleanFunction {
    if (!matchesType(isType, "In")) throw new Error("Is(): A IsInType is not implemented.");
    // @java IsIn.construct: site == null -> To.instance() (the (to) iterator default).
    const toDefault = { eval: (ctx: { to?: () => number; _evalTo?: number }) =>
      ctx.to?.() ?? ctx._evalTo ?? -1 } as unknown as IntFunction;
    if (array !== null) return new IsInArray(site ?? (sites === null ? toDefault : null), sites, array);
    if (region !== null) {
      if (sites !== null) return new IsAllInRegion(sites, region);
      return new IsIn(site ?? toDefault, region);
    }
    throw new Error("Is(): With IsInType one region or array parameter must be non-null.");
  }

  /** @java Is.construct(IsGroupType, SiteType, RegionFunction, IntFunction) */
  public static constructGroup(isType: unknown, _type: unknown, inArg: RegionFunction, toPlace: IntFunction | null): BooleanFunction {
    if (matchesType(isType, "Freedom")) return new IsFreedom(siteType(_type), inArg, toPlace);
    throw new Error("Is(): A IsGroupType is not implemented.");
  }

  /**
   * Private constructor — this class is a pure static factory.
   * @java Is() private constructor
   */
  private constructor() {
    super();
    // Ensure that compiler does not pick up default constructor
  }

  /**
   * @java Is.eval(Context)
   * Should not be called; should only be called on subclasses.
   */
  public override eval(_context: Context): boolean {
    // Should not be called, should only be called on subclasses
    throw new Error("Is.eval(): Should never be called directly.");
  }

  /** @java Is.isStatic() */
  public override isStatic(): boolean {
    // Should never be there
    return false;
  }

  /** @java Is.gameFlags(Game) */
  public override gameFlags(_game: unknown): number {
    // Should never be there
    return 0;
  }

  /** @java Is.preprocess(Game) */
  public override preprocess(_game: unknown): void {
    // Nothing to do.
  }
}
