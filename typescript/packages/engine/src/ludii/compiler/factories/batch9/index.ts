import { BooleanConstant } from "../../../../ludemes/game/functions/booleans/BooleanConstant.js";
import { ToBool } from "../../../../ludemes/game/functions/booleans/ToBool.js";
import { WasPass } from "../../../../ludemes/game/functions/booleans/was/WasPass.js";
import { Xor1to1 } from "../../../../ludemes/game/functions/booleans/math1to1/Xor1to1.js";
import { FloatConstant } from "../../../../ludemes/game/functions/floats/FloatConstant.js";
import { ToFloat } from "../../../../ludemes/game/functions/floats/ToFloat.js";
import { FloatTan1to1 } from "../../../../ludemes/game/functions/floats1to1/math/FloatMath1to1.js";
import { Subdivide } from "../../../../ludemes/game/functions/graph/operators/Subdivide.js";
import { Trim } from "../../../../ludemes/game/functions/graph/operators/Trim.js";
import { constructTiling } from "../../../../ludemes/game/functions/graph/generators/basis/tiling/Tiling.js";
import { constructTri } from "../../../../ludemes/game/functions/graph/generators/basis/tri/Tri.js";
import { Wedge } from "../../../../ludemes/game/functions/graph/generators/shape/Wedge.js";
import { Team } from "../../../../ludemes/game/functions/intArray/iteraror/Team.js";
import { ValuesRemembered } from "../../../../ludemes/game/functions/intArray/values/ValuesRemembered.js";
import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { ToInt } from "../../../../ludemes/game/functions/ints/ToInt.js";
import type { JavaIntFunction } from "../../../../ludemes/game/functions/ints/IntFunction.js";
import { TrackSite } from "../../../../ludemes/game/functions/ints/trackSite/TrackSite.js";
import { TrackSiteFirstType } from "../../../../ludemes/game/functions/ints/trackSite/TrackSiteFirstType.js";
import { TrackSiteMoveType } from "../../../../ludemes/game/functions/ints/trackSite/TrackSiteMoveType.js";
import { TrackSiteType } from "../../../../ludemes/game/functions/ints/trackSite/TrackSiteType.js";
import { WhereLevel } from "../../../../ludemes/game/functions/ints/board/where/WhereLevel.js";
import { WhereSite } from "../../../../ludemes/game/functions/ints/board/where/WhereSite.js";
import { ValueIterated } from "../../../../ludemes/game/functions/ints/value/iterated/ValueIterated.js";
import { ValuePiece } from "../../../../ludemes/game/functions/ints/value/piece/ValuePiece.js";
import { ValuePlayer } from "../../../../ludemes/game/functions/ints/value/player/ValuePlayer.js";
import { ValueRandom } from "../../../../ludemes/game/functions/ints/value/random/ValueRandom.js";
import { ValueMoveLimit } from "../../../../ludemes/game/functions/ints/value/simple/ValueMoveLimit.js";
import { ValuePending } from "../../../../ludemes/game/functions/ints/value/simple/ValuePending.js";
import { ValueTurnLimit } from "../../../../ludemes/game/functions/ints/value/simple/ValueTurnLimit.js";
import { Score1to1, Var1to1 } from "../../../../ludemes/game/functions/ints1to1/state/State1to1.js";
import { Tile } from "../../../../ludemes/game/equipment/component/tile/Tile.js";
import { SurakartaBoard } from "../../../../ludemes/game/equipment/container/board/custom/SurakartaBoard.js";
import { Subgame1to1 } from "../../../../ludemes/game/match/Subgame1to1.js";
import { Swap as MetaSwap } from "../../../../ludemes/game/rules/meta/Swap.js";
import { SetAmount1to1 } from "../../../../ludemes/game/rules/start/set/player/SetAmount.js";
import { SetScore1to1 } from "../../../../ludemes/game/rules/start/set/player/SetScore.js";
import { SetTeam1to1 } from "../../../../ludemes/game/rules/start/set/players/SetTeam.js";
import { SetRememberValue1to1 } from "../../../../ludemes/game/rules/start/set/remember/SetRememberValue.js";
import { SetCost1to1 } from "../../../../ludemes/game/rules/start/set/sites/SetCost.js";
import { SetCount1to1 } from "../../../../ludemes/game/rules/start/set/sites/SetCount.js";
import { SetPhase1to1 } from "../../../../ludemes/game/rules/start/set/sites/SetPhase.js";
import { SetSite1to1 } from "../../../../ludemes/game/rules/start/set/sites/SetSite.js";
import { Then } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Then.js";
import { Trigger } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Trigger.js";
import { Vote } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Vote.js";
import { While } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/requirement/While.js";
import { Swap, SwapPlayersType, SwapSitesType } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/state/swap/Swap.js";
import { Take, TakeControlType, TakeSimpleType } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/take/Take.js";
import { RoleType as NumericRoleType } from "../../../../ludemes/game/util/end/RoleType.js";
import type {
  BooleanFunction,
  FloatFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "../../../../ludemes/base.js";
import type { Range } from "../../../../ludemes/game/functions/range/Range.js";
import type { GraphFunction } from "../../../../ludemes/game/functions/graph/GraphFunction.js";
import type { GraphFunction as BoardGraphFunction } from "../../../../ludemes/game/equipment/container/board/Board.js";
import type { SiteType } from "../../../../ludemes/other/action/SiteType.js";
import type { StepType } from "../../../../ludemes/game/types/board/StepType.js";
import type { Path } from "../../../../ludemes/game/equipment/component/tile/Path.js";
import type { Flips } from "../../../../ludemes/game/equipment/component/tile/Tile.js";
import type { ArgBundle } from "../../ArgBundle.js";
import type { LudemeRegistry } from "../../LudemeRegistry.js";

export function registerBatch9(registry: LudemeRegistry): void {
  registry.registerLudeme("start.set.set:set", makeStartSet);
  registry.registerLudeme("state:state", deferred("state"));
  registry.registerLudeme("state.score:score", makeScore);
  registry.registerLudeme("subdivide:subdivide", (b) => new Subdivide(requireGraph(b, 0), optionalNumber(b.named.get("min")) ?? 1));
  registry.registerLudeme("subgame:subgame", makeSubgame);
  registry.registerLudeme("surakartaBoard:surakartaBoard", makeSurakartaBoard);
  registry.registerLudeme("surround:surround", deferred("surround"));
  registry.registerLudeme("swap.swap:swap", makeSwap);
  registry.registerLudeme("take:take", makeTake);
  registry.registerLudeme("tan:tan", (b) => new FloatTan1to1(requireFloatFunction(b, 0)));
  registry.registerLudeme("team:team", () => new Team());
  registry.registerLudeme("then:then", (b) => new Then(requireMoves(b.positional[0]), optionalBoolean(b.named.get("applyafterallmoves")) ?? false));
  registry.registerLudeme("tile:tile", makeTile);
  registry.registerLudeme("tiling:tiling", makeTiling);
  registry.registerLudeme("toBool:toBool", makeToBool);
  registry.registerLudeme("toFloat:toFloat", makeToFloat);
  registry.registerLudeme("toInt:toInt", makeToInt);
  registry.registerLudeme("topLevel:topLevel", deferred("topLevel"));
  registry.registerLudeme("trackSite:trackSite", makeTrackSite);
  registry.registerLudeme("tri:tri", makeTri);
  registry.registerLudeme("trigger:trigger", makeTrigger);
  registry.registerLudeme("trim:trim", (b) => new Trim(requireGraph(b, 0)));
  registry.registerLudeme("value:value", makeValue);
  registry.registerLudeme("values.values:values", makeValues);
  registry.registerLudeme("var:var", (b) => new Var1to1(optionalString(b.positional[0])));
  registry.registerLudeme("vote:vote", makeVote);
  registry.registerLudeme("was:was", makeWas);
  registry.registerLudeme("wedge:wedge", (b) => new Wedge(requireNumber(b, 0), optionalNumber(b.positional[1]) ?? undefined));
  registry.registerLudeme("what:what", deferred("what"));
  registry.registerLudeme("where:where", makeWhere);
  registry.registerLudeme("while:while", (b) => new While(requireBooleanFunction(b, 0), requireMoves(b.positional[1]), optionalMoves(b.positional[2])));
  registry.registerLudeme("who:who", deferred("who"));
  registry.registerLudeme("xor:xor", (b) => new Xor1to1(requireBooleanFunction(b, 0), requireBooleanFunction(b, 1)));
}

function makeStartSet(b: ArgBundle): unknown {
  const kind = requireString(b, 0);
  switch (kind) {
    case "RememberValue": {
      const name = optionalString(b.positional[1]);
      const value = b.positional[2];
      const values = Array.isArray(value) ? value.map(asNumber) : [asNumber(value)];
      return new SetRememberValue1to1(name, values, optionalBoolean(b.named.get("unique")) ?? false);
    }
    case "Team":
      return new SetTeam1to1(requireNumber(b, 1), requireNumberArray(b.positional[2], "set Team roles"));
    case "Count":
      return new SetCount1to1(startSites(b), requireNumber(b, 1));
    case "Cost":
      return new SetCost1to1(startSites(b), requireNumber(b, 1));
    case "Phase":
      return new SetPhase1to1(startSites(b), requireNumber(b, 1));
    case "Amount":
      return new SetAmount1to1(optionalRoleOwner(b.positional[1]), requireLastNumber(b));
    case "Score": {
      const role = optionalString(b.positional[1]);
      const score = requireLastNumber(b);
      if (role === null || role === "Each" || role === "All") return new SetScore1to1(null, [score], true);
      return new SetScore1to1([roleOwner(role)], [score], false);
    }
    default: {
      const owner = roleOwner(kind);
      const site = b.named.has("at") ? asNumber(b.named.get("at")) : -1;
      const sites = b.named.has("to") ? requireNumberArray(b.named.get("to"), "set sites to") : null;
      return new SetSite1to1(owner, site, sites);
    }
  }
}

function makeScore(b: ArgBundle): Score1to1 {
  const value = b.positional[0];
  return new Score1to1(typeof value === "string" ? roleIntFunction(value) : asIntFunction(value));
}

function makeSubgame(b: ArgBundle): Subgame1to1 {
  return new Subgame1to1(
    requireString(b, 0),
    optionalString(b.positional[1]),
    optionalIntFunction(b.named.get("next")),
    optionalIntFunction(b.named.get("result")),
  );
}

function makeSurakartaBoard(b: ArgBundle): SurakartaBoard {
  return new SurakartaBoard(
    requireBoardGraph(b, 0),
    optionalNumber(b.named.get("loops")),
    optionalNumber(b.named.get("from")),
    optionalBoolean(b.named.get("largestack")),
  );
}

function makeSwap(b: ArgBundle): MovesFunction {
  const kind = requireString(b, 0);
  if (kind === "Players") {
    const a = b.positional[1];
    const c = b.positional[2];
    return Swap.constructPlayers(
      SwapPlayersType.Players,
      typeof a === "string" ? null : asIntFunction(a),
      typeof a === "string" ? a : null,
      typeof c === "string" ? null : asIntFunction(c),
      typeof c === "string" ? c : null,
      optionalThen(b.positional[3]),
    );
  }
  if (kind === "Pieces") {
    return Swap.constructPieces(
      SwapSitesType.Pieces,
      optionalIntFunction(b.positional[1]),
      optionalIntFunction(b.positional[2]),
      optionalThen(b.positional[3]),
    );
  }
  throw new Error("factory not yet wired: swap");
}

function makeTake(b: ArgBundle): MovesFunction {
  const kind = requireString(b, 0);
  if (kind === "Domino") return Take.constructSimple(TakeSimpleType.Domino, optionalMoves(b.positional[1]));
  if (kind !== "Control") throw new Error("factory not yet wired: take");

  const of = b.named.get("of");
  const by = b.named.get("by");
  return Take.constructControl(
    TakeControlType.Control,
    typeof of === "string" ? of : null,
    of !== undefined && typeof of !== "string" ? asIntFunction(of) : null,
    typeof by === "string" ? by : null,
    by !== undefined && typeof by !== "string" ? asIntFunction(by) : null,
    optionalIntFunction(b.named.get("at")),
    optionalRegion(b.named.get("to")),
    optionalSiteType(lastString(b.positional)),
    optionalMoves(lastMoves(b.positional)),
  );
}

function makeTile(b: ArgBundle): Tile {
  return new Tile(
    requireString(b, 0),
    optionalString(b.positional[1]) as never,
    optionalStepArray(b.positional[2]),
    optionalStepMatrix(b.positional[2]),
    optionalNumber(b.named.get("numsides")),
    optionalNumberArray(b.named.get("slots")),
    optionalNumber(b.named.get("slotsperside")),
    optionalPathArray(b.named.get("path")),
    optionalFlips(b.named.get("flips")),
    optionalMoves(b.named.get("moves")),
    optionalNumber(b.named.get("maxstate")),
    optionalNumber(b.named.get("maxcount")),
    optionalNumber(b.named.get("maxvalue")),
  );
}

function makeTiling(b: ArgBundle): GraphFunction {
  const tiling = requireString(b, 0);
  if (Array.isArray(b.positional[1]) || (b.positional[1] !== undefined && typeof b.positional[1] !== "number")) {
    throw new Error("factory not yet wired: tiling");
  }
  const dims = b.positional.slice(1).filter((v): v is number => typeof v === "number");
  if (dims.length === 0) throw new Error("factory not yet wired: tiling");
  return constructTiling(tiling as never, dims[0]!, dims[1]);
}

function makeToBool(b: ArgBundle): ToBool {
  const value = b.positional[0];
  if (isFloatFunction(value)) return new ToBool(null, value);
  return new ToBool(asIntFunction(value), null);
}

function makeToFloat(b: ArgBundle): ToFloat {
  const value = b.positional[0];
  if (isBooleanFunction(value)) return new ToFloat(value, null);
  return new ToFloat(null, asIntFunction(value));
}

function makeToInt(b: ArgBundle): ToInt {
  const value = b.positional[0];
  if (isBooleanFunction(value)) return new ToInt(value, null);
  return new ToInt(null, isFloatFunction(value) ? value : new FloatConstant(asNumber(value)));
}

function makeTrackSite(b: ArgBundle): IntFunction {
  const kind = requireString(b, 0);
  if (kind === "Move") {
    const second = b.positional[1];
    const role = typeof second === "string" && isRoleString(second) ? second : null;
    const player = role !== null ? roleIntFunction(role) : second !== undefined && typeof second !== "string" ? asIntFunction(second) : null;
    return TrackSite.constructMove(
      TrackSiteMoveType.Move,
      optionalIntFunction(b.named.get("from")),
      null,
      player,
      typeof second === "string" && role === null ? second : null,
      requireIntFunctionValue(b.named.get("steps")),
    );
  }
  if (kind === "EndSite") {
    const second = b.positional[1];
    const role = typeof second === "string" && isRoleString(second) ? second : null;
    return TrackSite.constructEnd(
      TrackSiteType.EndSite,
      role !== null ? roleIntFunction(role) : second !== undefined && typeof second !== "string" ? asIntFunction(second) : null,
      null,
      optionalString(typeof second === "string" ? role === null ? second : b.positional[2] : b.positional[1]),
    );
  }
  if (kind === "FirstSite") {
    const second = b.positional[1];
    const role = typeof second === "string" && isRoleString(second) ? second : null;
    return TrackSite.constructFirst(
      TrackSiteFirstType.FirstSite,
      role !== null ? roleIntFunction(role) : second !== undefined && typeof second !== "string" ? asIntFunction(second) : null,
      null,
      optionalString(typeof second === "string" ? role === null ? second : b.positional[2] : b.positional[1]),
      optionalIntFunction(b.named.get("from")),
      optionalBooleanFunction(b.named.get("if")) as never,
    );
  }
  throw new Error("factory not yet wired: trackSite");
}

function makeTri(b: ArgBundle): GraphFunction {
  const first = b.positional[0];
  if (typeof first === "number") return constructTri(null, first, optionalNumber(b.positional[1]) ?? undefined);
  if (typeof first === "string") return constructTri(first as never, requireNumber(b, 1), optionalNumber(b.positional[2]) ?? undefined);
  throw new Error("factory not yet wired: tri");
}

function makeTrigger(b: ArgBundle): Trigger {
  const player = b.positional[1];
  return new Trigger(
    requireString(b, 0),
    typeof player === "string" ? null : asIntFunction(player),
    typeof player === "string" ? player : null,
    optionalThen(b.positional[2]),
  );
}

function makeValue(b: ArgBundle): IntFunction {
  const kind = optionalString(b.positional[0]);
  switch (kind) {
    case null:
      return new ValueIterated();
    case "Piece":
      return new ValuePiece(optionalSiteType(b.positional[1]), requireIntFunctionValue(b.named.get("at")), optionalIntFunction(b.named.get("level")));
    case "Player": {
      const value = b.positional[1];
      return new ValuePlayer(typeof value === "string" ? null : asIntFunction(value), typeof value === "string" ? numericRole(value) : null);
    }
    case "Pending":
      return new ValuePending();
    case "MoveLimit":
      return new ValueMoveLimit();
    case "TurnLimit":
      return new ValueTurnLimit();
    case "Random":
      return new ValueRandom(b.positional[1] as Range);
    default:
      throw new Error("factory not yet wired: value");
  }
}

function makeValues(b: ArgBundle): ValuesRemembered {
  if (requireString(b, 0) !== "Remembered") throw new Error("factory not yet wired: values");
  return new ValuesRemembered(optionalString(b.positional[1]));
}

function makeVote(b: ArgBundle): Vote {
  const value = b.positional[0];
  return new Vote({
    vote: typeof value === "string" ? value : null,
    votes: Array.isArray(value) ? value.map(asString) : null,
    then: optionalMoves(b.positional[1]),
  });
}

function makeWas(b: ArgBundle): WasPass {
  if (requireString(b, 0) !== "Pass") throw new Error("factory not yet wired: was");
  return new WasPass();
}

function makeWhere(b: ArgBundle): IntFunction {
  const kind = optionalString(b.positional[0]);
  if (kind === "Level") {
    if (typeof b.positional[1] === "string") {
      const player = b.positional[2];
      return WhereLevel.byName(
        b.positional[1],
        typeof player === "string" ? roleIntFunction(player) : asIntFunction(player),
        optionalIntFunction(b.named.get("state")),
        optionalSiteType(lastString(b.positional)),
        requireIntFunctionValue(b.named.get("at")),
        optionalBooleanFunction(b.named.get("fromtop")) as never,
      );
    }
    return WhereLevel.byWhat(
      requireIntFunctionValue(b.positional[1]),
      optionalSiteType(b.positional[2]),
      requireIntFunctionValue(b.named.get("at")),
      optionalBooleanFunction(b.named.get("fromtop")) as never,
    );
  }
  if (typeof b.positional[0] === "string") {
    const player = b.positional[1];
    return WhereSite.byName(
      b.positional[0],
      typeof player === "string" ? roleIntFunction(player) : asIntFunction(player),
      optionalIntFunction(b.named.get("state")),
      optionalSiteType(lastString(b.positional)),
    );
  }
  return WhereSite.byWhat(requireIntFunctionValue(b.positional[0]), optionalSiteType(b.positional[1]));
}

function startSites(b: ArgBundle): number[] {
  if (b.named.has("at")) return [asNumber(b.named.get("at"))];
  if (b.named.has("to")) return requireNumberArray(b.named.get("to"), "set sites to");
  throw new Error("factory not yet wired: set");
}

function deferred(keyword: string): () => never {
  return () => {
    throw new Error(`factory not yet wired: ${keyword}`);
  };
}

function requireNumber(b: ArgBundle, index: number): number {
  return asNumber(b.positional[index]);
}

function requireLastNumber(b: ArgBundle): number {
  for (let i = b.positional.length - 1; i >= 0; i--) {
    const value = b.positional[i];
    if (typeof value === "number") return value;
  }
  throw new Error(`factory not yet wired: ${b.constructKey}`);
}

function requireString(b: ArgBundle, index: number): string {
  return asString(b.positional[index]);
}

function asNumber(value: unknown): number {
  if (typeof value !== "number") throw new Error("factory not yet wired: expected numeric terminal");
  return value;
}

function asString(value: unknown): string {
  if (typeof value !== "string") throw new Error("factory not yet wired: expected string terminal");
  return value;
}

function optionalNumber(value: unknown): number | null {
  return value === undefined || value === null ? null : asNumber(value);
}

function optionalString(value: unknown): string | null {
  return value === undefined || value === null ? null : asString(value);
}

function optionalBoolean(value: unknown): boolean | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "boolean") throw new Error("factory not yet wired: expected boolean terminal");
  return value;
}

function requireNumberArray(value: unknown, label: string): number[] {
  if (!Array.isArray(value)) throw new Error(`factory not yet wired: ${label}`);
  return value.map(asNumber);
}

function optionalNumberArray(value: unknown): number[] | null {
  if (value === undefined || value === null) return null;
  return requireNumberArray(value, "number array");
}

function asIntFunction(value: unknown): JavaIntFunction {
  if (typeof value === "number") return javaIntConstant(value);
  if (isIntFunction(value)) return value as JavaIntFunction;
  throw new Error("factory not yet wired: expected int function");
}

function optionalIntFunction(value: unknown): JavaIntFunction | null {
  return value === undefined || value === null ? null : asIntFunction(value);
}

function requireIntFunctionValue(value: unknown): JavaIntFunction {
  if (value === undefined || value === null) throw new Error("factory not yet wired: expected int function");
  return asIntFunction(value);
}

function javaIntConstant(value: number): JavaIntFunction {
  return {
    eval: () => value,
    exceeds: (_ctx, other) => value > other.eval(_ctx),
    isHint: () => false,
    isHand: () => false,
    concepts: () => new Set(),
    readsEvalContextRecursive: () => new Set(),
    writesEvalContextRecursive: () => new Set(),
    missingRequirement: () => false,
    willCrash: () => false,
    toEnglish: () => String(value),
  };
}

function roleIntFunction(role: string): JavaIntFunction {
  const owner = roleOwner(role);
  if (owner >= 0) return javaIntConstant(owner);
  return {
    ...javaIntConstant(0),
    eval: (ctx) => {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % ctx.numPlayers()) + 1;
      if (role === "Prev") return ((ctx.state.mover - 2 + ctx.numPlayers()) % ctx.numPlayers()) + 1;
      return 0;
    },
    toEnglish: () => role,
  };
}

function roleOwner(role: string): number {
  if (role === "Neutral" || role === "Shared") return 0;
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  return -1;
}

function isRoleString(value: string): boolean {
  return roleOwner(value) >= 0 || [
    "All",
    "Ally",
    "Each",
    "Enemy",
    "Friend",
    "Mover",
    "Next",
    "NonMover",
    "Player",
    "Prev",
  ].includes(value) || /^Team\d+$/.test(value);
}

function optionalRoleOwner(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const owner = roleOwner(asString(value));
  return owner < 0 ? null : owner;
}

function numericRole(role: string): NumericRoleType {
  const value = NumericRoleType[role as keyof typeof NumericRoleType];
  if (value === undefined) throw new Error("factory not yet wired: value");
  return value;
}

function requireGraph(b: ArgBundle, index: number): GraphFunction {
  const value = b.positional[index];
  if (!isGraphFunction(value)) throw new Error(`factory not yet wired: ${b.constructKey}`);
  return value;
}

function requireBoardGraph(b: ArgBundle, index: number): BoardGraphFunction {
  return requireGraph(b, index) as unknown as BoardGraphFunction;
}

function requireFloatFunction(b: ArgBundle, index: number): FloatFunction {
  const value = b.positional[index];
  if (typeof value === "number") return new FloatConstant(value);
  if (!isFloatFunction(value)) throw new Error(`factory not yet wired: ${b.constructKey}`);
  return value;
}

function requireBooleanFunction(b: ArgBundle, index: number): BooleanFunction {
  const value = b.positional[index];
  if (!isBooleanFunction(value)) throw new Error(`factory not yet wired: ${b.constructKey}`);
  return value;
}

function optionalBooleanFunction(value: unknown): BooleanFunction | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "boolean") return new BooleanConstant(value);
  if (!isBooleanFunction(value)) throw new Error("factory not yet wired: expected boolean function");
  return value;
}

function requireMoves(value: unknown): MovesFunction {
  if (!isMovesFunction(value)) throw new Error("factory not yet wired: expected moves");
  return value;
}

function optionalMoves(value: unknown): MovesFunction | null {
  return value === undefined || value === null ? null : requireMoves(value);
}

function optionalThen(value: unknown): Then | null {
  if (value === undefined || value === null) return null;
  if (!(value instanceof Then)) throw new Error("factory not yet wired: expected then");
  return value;
}

function optionalRegion(value: unknown): RegionFunction | null {
  if (value === undefined || value === null) return null;
  if (!isRegionFunction(value)) throw new Error("factory not yet wired: expected region");
  return value;
}

function optionalSiteType(value: unknown): SiteType | null {
  if (value === undefined || value === null) return null;
  return asString(value) as SiteType;
}

function lastString(values: readonly unknown[]): string | null {
  for (let i = values.length - 1; i >= 0; i--) {
    const value = values[i];
    if (typeof value === "string") return value;
  }
  return null;
}

function lastMoves(values: readonly unknown[]): MovesFunction | null {
  for (let i = values.length - 1; i >= 0; i--) {
    const value = values[i];
    if (isMovesFunction(value)) return value;
  }
  return null;
}

function optionalStepArray(value: unknown): StepType[] | null {
  if (!Array.isArray(value) || value.some(Array.isArray)) return null;
  return value.every((v) => typeof v === "string") ? value as StepType[] : null;
}

function optionalStepMatrix(value: unknown): StepType[][] | null {
  if (!Array.isArray(value) || !value.some(Array.isArray)) return null;
  return value as StepType[][];
}

function optionalPathArray(value: unknown): Path[] | null {
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? value as Path[] : [value as Path];
}

function optionalFlips(value: unknown): Flips | null {
  return value === undefined || value === null ? null : value as Flips;
}

function isIntFunction(value: unknown): value is IntFunction {
  return typeof (value as IntFunction | null)?.eval === "function";
}

function isFloatFunction(value: unknown): value is FloatFunction {
  return typeof (value as FloatFunction | null)?.eval === "function";
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return typeof (value as BooleanFunction | null)?.eval === "function";
}

function isMovesFunction(value: unknown): value is MovesFunction {
  return typeof (value as MovesFunction | null)?.eval === "function";
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return typeof (value as RegionFunction | null)?.eval === "function";
}

function isGraphFunction(value: unknown): value is GraphFunction {
  return typeof (value as GraphFunction | null)?.eval === "function";
}
