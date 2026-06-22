// @java Core/src/game/functions/ints/count/Count.java

/**
 * Root dispatcher for Count ludeme — routes to concrete subtype classes.
 *
 * Java Count is a static-factory-only class: its private constructor and
 * concrete eval() throw UnsupportedOperationException. All real work is done
 * by the classes instantiated in construct(...) overloads. This TS module
 * mirrors that: it does NOT register an "int:count" key; the compiler1to1
 * dispatches through compound keys such as "count:Pieces", "count:Sites", etc.
 *
 * @java game/functions/ints/count/Count.java
 * @author Eric Piette
 */

import { BaseIntFunction } from "../BaseIntFunction.js";
import type { Context } from "../../../../../context.js";
import type { JavaIntFunction } from "../IntFunction.js";
import type { IntFunction, IntArrayFunction, RegionFunction, BooleanFunction } from "../../../../base.js";
import { BaseBooleanFunction } from "../../booleans/BaseBooleanFunction.js";
import { CountValue } from "./CountValue.js";
import { CountStack } from "./CountStack.js";
import { CountRows, CountColumns, CountPlayers, CountTurns, CountMovesThisTurn } from "./CountSimple.js";
import { CountCells } from "./simple/CountCells.js";
import { CountPhases } from "./simple/CountPhases.js";
import { CountTrials } from "./simple/CountTrials.js";
import { CountMoves as CountMoves1to1 } from "./CountMoves.js";
import { CountEdges } from "./CountEdges.js";
import { CountVertices } from "./CountVertices.js";
import { CountNumber } from "./site/CountNumber.js";
import { CountSiteNeighbours } from "./CountSiteNeighbours.js";
import { CountOff } from "./CountOff.js";
import { CountSites } from "./CountSites.js";
import { CountSitesPlatformBelow } from "./sitesPlatformBelow/CountSitesPlatformBelow.js";
import { CountPieces } from "./CountPieces.js";
import { CountGroups } from "./CountGroups.js";
import { CountSizeBiggestGroup } from "./CountSizeBiggestGroup.js";
import { CountSizeBiggestLine } from "./sizeBiggestLine/CountSizeBiggestLine.js";
import { CountLiberties } from "./CountLiberties.js";
import { CountSteps } from "./CountSteps.js";
import { CountStepsOnTrack } from "./stepsOnTrack/CountStepsOnTrack.js";

type SiteType = "Cell" | "Edge" | "Vertex";

const LAST_TO: IntFunction = { eval: (context: Context) => context._evalTo };
const LAST_FROM: IntFunction = { eval: (context: Context) => context._evalFrom };
const ZERO_INT: IntFunction = { eval: (_context: Context) => 0 };

class TrueBooleanFunction extends BaseBooleanFunction {
  public override eval(_context: Context): boolean {
    return true;
  }
}

class BooleanFunctionAdapter extends BaseBooleanFunction {
  public constructor(private readonly fn: BooleanFunction) {
    super();
  }

  public override eval(context: Context): boolean {
    return this.fn.eval(context);
  }
}

function asLeanInt(fn: unknown, fallback: IntFunction = ZERO_INT): IntFunction {
  return hasEval(fn) ? fn as IntFunction : fallback;
}

function asJavaInt(fn: unknown, fallback: IntFunction = ZERO_INT): JavaIntFunction {
  const lean = asLeanInt(fn, fallback);
  return {
    eval: (context: Context) => lean.eval(context),
    exceeds: (context: Context, other: JavaIntFunction) => lean.eval(context) > other.eval(context),
    isHint: () => false,
    isHand: () => false,
    concepts: (_game: unknown) => new Set<number>(),
    readsEvalContextRecursive: () => new Set<number>(),
    writesEvalContextRecursive: () => new Set<number>(),
    missingRequirement: (_game: unknown) => false,
    willCrash: (_game: unknown) => false,
    toEnglish: (_game: unknown) => "count argument",
  };
}

function asRegion(fn: unknown, fallbackSite: IntFunction = LAST_TO): RegionFunction {
  if (hasEval(fn)) {
    return {
      eval: (context: Context) => {
        const value = (fn as { eval(context: Context): unknown }).eval(context);
        if (Array.isArray(value)) return value as number[];
        return typeof value === "number" && value >= 0 ? [value] : [];
      },
    };
  }
  return {
    eval: (context: Context) => {
      const site = fallbackSite.eval(context);
      return site >= 0 ? [site] : [];
    },
  };
}

function asIntArray(fn: unknown): IntArrayFunction {
  return hasEval(fn) ? fn as IntArrayFunction : { eval: (_context: Context) => [] };
}

function asBool(fn: unknown): BooleanFunction | null {
  return hasEval(fn) ? fn as BooleanFunction : null;
}

function asBaseBool(fn: unknown): BaseBooleanFunction {
  const bool = asBool(fn);
  return bool === null ? new TrueBooleanFunction() : new BooleanFunctionAdapter(bool);
}

function hasEval(value: unknown): value is { eval(context: Context): unknown } {
  return typeof (value as { eval?: unknown } | null)?.eval === "function";
}

function roleToInt(role: unknown): IntFunction {
  if (hasEval(role)) return role as IntFunction;
  switch (role) {
    case "Mover":
      return { eval: (context: Context) => context.state.mover };
    case "Next":
      return { eval: (context: Context) => (context.state.mover % context.game.numPlayers) + 1 };
    case "Prev":
      return { eval: (context: Context) => ((context.state.mover - 2 + context.game.numPlayers) % context.game.numPlayers) + 1 };
    case "Player":
      // @java RoleType.Player — the player iterated by (forEach Player ...): context.player().
      return { eval: (context: Context) => (context as Context & { _evalPlayer?: number })._evalPlayer ?? context.state.mover };
    case "Neutral":
    case "Shared":
      return ZERO_INT;
    default: {
      if (typeof role === "string" && /^P\d+$/.test(role)) {
        const pid = Number(role.slice(1));
        return { eval: (_context: Context) => pid };
      }
      return ZERO_INT;
    }
  }
}

function roleToJavaInt(role: unknown): JavaIntFunction | null {
  if (role === null || role === undefined) return null;
  return asJavaInt(roleToInt(role));
}

function singleSiteRegion(siteFn: unknown, fallback: IntFunction = LAST_TO): RegionFunction {
  const intFn = asLeanInt(siteFn, fallback);
  return {
    eval: (context: Context) => {
      const site = intFn.eval(context);
      return site >= 0 ? [site] : [];
    },
  };
}

function firstSiteFn(regionFn: unknown, fallback: IntFunction = LAST_TO): IntFunction {
  if (!hasEval(regionFn)) return fallback;
  return {
    eval: (context: Context) => {
      const sites = (regionFn as RegionFunction).eval(context);
      return sites[0] ?? -1;
    },
  };
}

function regionFrom(inArg: unknown, atArg: unknown, fallback: IntFunction = LAST_TO): RegionFunction {
  if (inArg !== null && inArg !== undefined) return asRegion(inArg, fallback);
  if (atArg !== null && atArg !== undefined) return singleSiteRegion(atArg, fallback);
  return singleSiteRegion(fallback, fallback);
}

function directionChoice(direction: unknown): { absoluteDirection(): string; name: string } {
  const name = typeof direction === "string" ? direction : "Adjacent";
  return {
    name,
    absoluteDirection: () => name,
  };
}

function countPips(): IntFunction {
  return {
    eval: (context: Context) => context.state.diceValues?.reduce((sum, value) => sum + value, 0) ?? 0,
  };
}

function countLegalMoves(): IntFunction {
  return {
    eval: (context: Context) => {
      try {
        return context.game.moves(context)?.length ?? 0;
      } catch {
        return 0;
      }
    },
  };
}

function countActive(): IntFunction {
  return {
    eval: (context: Context) => context.game.numPlayers,
  };
}

function asJavaReturn(fn: IntFunction | JavaIntFunction): JavaIntFunction {
  return fn as unknown as JavaIntFunction;
}

/**
 * Root Count class — should never have eval() called on it directly.
 * Mirrors Java Count which throws UnsupportedOperationException from eval().
 *
 * @java game/functions/ints/count/Count.java
 */
export class Count extends BaseIntFunction {
  /**
   * Private constructor — Count is a static-factory-only class in Java.
   * @java Count() — private
   */
  private constructor() {
    super();
  }

  /**
   * @java Count.construct(CountValueType, IntFunction, IntArrayFunction)
   */
  public static constructValue(countType: unknown, of: unknown, inArg: unknown): JavaIntFunction {
    switch (countType) {
      case "Value":
        return asJavaReturn(new CountValue(asLeanInt(of), asIntArray(inArg)));
      default:
        throw new Error("Count(): A CountValueType is not implemented.");
    }
  }

  /**
   * @java Count.construct(CountStackType, StackDirection, SiteType, IntFunction, RegionFunction, BooleanFunction, BooleanFunction)
   */
  public static constructStack(countType: unknown, _stackDirection: unknown, _type: unknown, at: unknown, to: unknown, _If: unknown, _stop: unknown): JavaIntFunction {
    const numNonNull = (at !== null && at !== undefined ? 1 : 0) + (to !== null && to !== undefined ? 1 : 0);
    if (numNonNull !== 1) {
      throw new Error("Count(): With CountStackType one 'at', 'to' parameters must be non-null.");
    }

    switch (countType) {
      case "Stack": {
        // @java CountStack(stackDirection, type, to, If, stop) — the per-level
        // if:/stop: walk (Seesaw's "StackSize" counts only the Discs of a
        // stack); previously If/stop/direction were discarded.
        const regionFn = at !== null && at !== undefined
          ? asLeanInt(at)
          : { eval: (ctx: unknown) => (to as { eval(c: unknown): number[] }).eval(ctx) };
        return asJavaReturn(new CountStack(
          regionFn as never,
          (_If ?? null) as never,
          (_stop ?? null) as never,
          (typeof _stackDirection === "string" ? _stackDirection : null) as never,
          // @java type — SiteType; flat-state substrate, see pattern #5
          typeof _type === "string" ? _type : null,
        ));
      }
      default:
        throw new Error("Count(): A CountStackType is not implemented.");
    }
  }

  /**
   * @java Count.construct(CountSimpleType, SiteType)
   */
  public static constructSimple(countType: unknown, _type: unknown): JavaIntFunction {
    switch (countType) {
      case "Active":
        return asJavaReturn(countActive());
      case "Cells":
        return asJavaReturn(new CountCells());
      case "Columns":
        return asJavaReturn(new CountColumns());
      case "Edges":
        return asJavaReturn(new CountEdges());
      case "Moves":
        return asJavaReturn(new CountMoves1to1());
      case "MovesThisTurn":
        return asJavaReturn(new CountMovesThisTurn());
      case "Phases":
        return new CountPhases();
      case "Players":
        return asJavaReturn(new CountPlayers());
      case "Rows":
        return asJavaReturn(new CountRows());
      case "Trials":
        return new CountTrials();
      case "Turns":
        return asJavaReturn(new CountTurns());
      case "Vertices":
        return asJavaReturn(new CountVertices());
      case "LegalMoves":
        return asJavaReturn(countLegalMoves());
      default:
        throw new Error("Count(): A CountSimpleType is not implemented.");
    }
  }

  /**
   * @java Count.construct(CountSiteType, SiteType, RegionFunction, IntFunction, String, RoleType, IntFunction, IntFunction[])
   */
  public static constructSite(countType: unknown, type: unknown, inArg: unknown, at: unknown, name: unknown, who: unknown, what: unknown, whats: unknown): JavaIntFunction {
    const numNonNull =
      (inArg !== null && inArg !== undefined ? 1 : 0)
      + (at !== null && at !== undefined ? 1 : 0)
      + (name !== null && name !== undefined ? 1 : 0);

    if (numNonNull > 1) {
      throw new Error("Count(): With CountSiteType zero or one 'in', 'at' or 'name' parameters must be non-null.");
    }

    if (countType === null || countType === undefined) {
      return asJavaReturn(new CountNumber(regionFrom(inArg, at), typeof type === "string" ? type : null));
    }

    const siteFn = at !== null && at !== undefined ? asLeanInt(at) : firstSiteFn(inArg, LAST_TO);
    switch (countType) {
      case "Adjacent":
        return asJavaReturn(new CountSiteNeighbours(siteFn, "Adjacent"));
      case "Diagonal":
        return asJavaReturn(new CountSiteNeighbours(siteFn, "Diagonal"));
      case "Neighbours":
        return asJavaReturn(new CountSiteNeighbours(siteFn, "Adjacent"));
      case "Off":
        return asJavaReturn(new CountOff(at !== null && at !== undefined ? asLeanInt(at) : null, inArg !== null && inArg !== undefined ? asRegion(inArg) : null));
      case "Orthogonal":
        return asJavaReturn(new CountSiteNeighbours(siteFn, "Orthogonal"));
      case "Sites":
        return asJavaReturn(new CountSites(regionFrom(inArg, at)));
      case "SitesPlatformBelow":
        return new CountSitesPlatformBelow(
          type as SiteType | null,
          at !== null && at !== undefined ? asJavaInt(at) : null,
          roleToJavaInt(who),
          what !== null && what !== undefined ? asJavaInt(what) : null,
          Array.isArray(whats) ? whats.map((fn) => asJavaInt(fn)) : null,
        );
      default:
        throw new Error("Count(): A CountSiteType is not implemented.");
    }
  }

  /**
   * @java Count.construct(CountComponentType, SiteType, RoleType, IntFunction, String, RegionFunction, BooleanFunction)
   */
  public static constructComponent(countType: unknown, _type: unknown, role: unknown, of: unknown, name: unknown, inArg: unknown, _If: unknown): JavaIntFunction {
    const numNonNull = (role !== null && role !== undefined ? 1 : 0) + (of !== null && of !== undefined ? 1 : 0);
    if (numNonNull > 1) {
      throw new Error("Count(): With CountComponentType zero or one 'role' or 'of' parameters must be non-null.");
    }

    switch (countType) {
      case "Pieces": {
        const isAll = role === null || role === undefined || role === "All";
        const whoFn = of !== null && of !== undefined ? asLeanInt(of) : roleToInt(role);
        // @java CountPieces(type, role, of, name, in, If) — If was previously dropped.
        return asJavaReturn(new CountPieces(
          whoFn,
          inArg !== null && inArg !== undefined ? asRegion(inArg) : null,
          typeof name === "string" ? name : null,
          isAll,
          asBool(_If),
          // @java type — SiteType; flat-state substrate, see pattern #5
          typeof _type === "string" ? _type : null,
        ));
      }
      case "Pips":
        return asJavaReturn(countPips());
      default:
        throw new Error("Count(): A CountComponentType is not implemented.");
    }
  }

  /**
   * @java Count.construct(CountGroupsType, SiteType, Direction, RegionFunction, BooleanFunction, IntFunction, BooleanFunction)
   */
  public static constructGroups(countType: unknown, _type: unknown, _directions: unknown, _throughAny: unknown, If: unknown, min: unknown, _isVisible: unknown): JavaIntFunction {
    switch (countType) {
      case "Groups": {
        // @java CountGroups dirnChoice — the connection direction (default
        // Adjacent). Arrives from the compiler as a {name} direction token,
        // mirroring Sites.constructGroup. (count Groups Orthogonal …) needs it.
        // @java CountGroups dirnChoice default Adjacent. The Direction token
        // arrives from the reflection compiler RAW: a bare enum like Orthogonal
        // is a plain string, not a {name} object (the raw-literal trap).
        const dirName: string =
          typeof _directions === "string"
            ? _directions
            : (_directions as { name?: string } | null)?.name ?? "Adjacent";
        return asJavaReturn(new CountGroups(
          asBool(If),
          asLeanInt(min, ZERO_INT),
          dirName,
          // @java type — SiteType; flat-state substrate, see pattern #5
          typeof _type === "string" ? _type : null,
        ));
      }
      case "SizeBiggestGroup": {
        // @java CountSizeBiggestGroup(type, directions, throughAny, If, isVisible)
        // — directions and isVisible were previously dropped.
        const sbgDirName: string =
          typeof _directions === "string"
            ? _directions
            : (_directions as { name?: string } | null)?.name ?? "Adjacent";
        return asJavaReturn(new CountSizeBiggestGroup(
          asBool(If),
          sbgDirName,
          asBool(_isVisible),
          // @java type — SiteType; flat-state substrate, see pattern #5
          typeof _type === "string" ? _type : null,
        ));
      }
      default:
        throw new Error("Count(): A CountGroupsType is not implemented.");
    }
  }

  /**
   * @java Count.construct(CountLinesType, SiteType, AbsoluteDirection, BooleanFunction)
   */
  public static constructLines(countType: unknown, type: unknown, directions: unknown, If: unknown): JavaIntFunction {
    switch (countType) {
      case "SizeBiggestLine":
        return new CountSizeBiggestLine(type as string | null, directionChoice(directions), asBaseBool(If));
      default:
        throw new Error("Count(): A CountLineType is not implemented.");
    }
  }

  /**
   * @java Count.construct(CountLibertiesType, SiteType, IntFunction, Direction, BooleanFunction)
   */
  public static constructLiberties(countType: unknown, _type: unknown, at: unknown, _directions: unknown, If: unknown): JavaIntFunction {
    switch (countType) {
      case "Liberties": {
        // @java CountLiberties(type, at, directions, If) — directions was previously dropped.
        const libDirName: string =
          typeof _directions === "string"
            ? _directions
            : (_directions as { name?: string } | null)?.name ?? "Adjacent";
        return asJavaReturn(new CountLiberties(
          asLeanInt(at, LAST_TO),
          asBool(If),
          libDirName,
          // @java type — SiteType; flat-state substrate, see pattern #5
          typeof _type === "string" ? _type : null,
        ));
      }
      default:
        throw new Error("Count(): A CountLibertiesType is not implemented.");
    }
  }

  /**
   * @java Count.construct(CountStepsType, SiteType, RelationType, Step, IntFunction, IntFunction, IntFunction, RegionFunction)
   */
  public static constructSteps(countType: unknown, _type: unknown, _relation: unknown, _stepMove: unknown, _newRotation: unknown, site1: unknown, site2: unknown, region2: unknown): JavaIntFunction {
    switch (countType) {
      case "Steps": {
        // @java CountSteps(@Opt SiteType, @Opt RelationType relation, ...) — relation
        // selects the distance-table adjacency (Keryo-Pente: All incl. diagonals).

        // @java CountSteps.stepMove.goRule() — when a (step ...) is given, the
        // BFS must only traverse neighbours satisfying the step's "to" condition
        // (e.g. only empty cells for `(step (to if:(is Empty (to))))`).
        // Duck-type check: the TS Step class exposes goRule() after the fix.
        const stepCondFn: BooleanFunction | null =
          _stepMove !== null &&
          _stepMove !== undefined &&
          typeof (_stepMove as { goRule?: unknown }).goRule === "function"
            ? (_stepMove as { goRule(): BooleanFunction }).goRule()
            : null;

        // @java CountSteps.newRotationFn — updates piece rotation after each BFS
        // step (used by rotation-aware games). TS CountSteps has no rotation model;
        // _newRotation is received but not forwarded. Pattern #5 placeholder only.
        return asJavaReturn(new CountSteps(
          asLeanInt(site1),
          region2 !== null && region2 !== undefined ? asRegion(region2) : singleSiteRegion(site2),
          typeof _relation === "string" ? _relation : (_relation as { name?: string } | null)?.name ?? null,
          stepCondFn,
          // @java type — SiteType; flat-state substrate, see pattern #5
          typeof _type === "string" ? _type : null,
        ));
      }
      default:
        throw new Error("Count(): A CountStepsType is not implemented.");
    }
  }

  /**
   * @java Count.construct(CountStepsOnTrackType, RoleType, Player, String, IntFunction, IntFunction)
   */
  public static constructStepsOnTrack(countType: unknown, role: unknown, player: unknown, name: unknown, site1: unknown, site2: unknown): JavaIntFunction {
    switch (countType) {
      case "StepsOnTrack": {
        const playerFn = player !== null && player !== undefined ? asJavaInt(player) : roleToJavaInt(role);
        return new CountStepsOnTrack(playerFn, typeof name === "string" ? name : null, asJavaInt(site1, LAST_FROM), asJavaInt(site2, LAST_TO));
      }
      default:
        throw new Error("Count(): A CountStepsOnTrackType is not implemented.");
    }
  }

  /**
   * @java Count.eval(Context) — throws UnsupportedOperationException
   * Should not be called; dispatch always goes to a concrete subtype.
   */
  public override eval(_context: Context): number {
    throw new Error("Count.eval(): Should never be called directly.");
  }

  /** @java Count.isStatic() — should never be reached */
  public isStatic(): boolean {
    return false;
  }
}
