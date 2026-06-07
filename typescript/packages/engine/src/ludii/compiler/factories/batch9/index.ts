import { BooleanConstant } from "../../../../ludemes/game/functions/booleans/BooleanConstant.js";
import { ToBool } from "../../../../ludemes/game/functions/booleans/ToBool.js";
import { WasPass } from "../../../../ludemes/game/functions/booleans/was/WasPass.js";
import { Xor1to1 } from "../../../../ludemes/game/functions/booleans/math1to1/Xor1to1.js";
import { FloatConstant } from "../../../../ludemes/game/functions/floats/FloatConstant.js";
import { ToFloat } from "../../../../ludemes/game/functions/floats/ToFloat.js";
import { FloatTan1to1 } from "../../../../ludemes/game/functions/floats1to1/math/FloatMath1to1.js";
import { Concentric } from "../../../../ludemes/game/functions/graph/generators/shape/concentric/Concentric.js";
import type { ConcentricShapeType } from "../../../../ludemes/game/functions/graph/generators/shape/concentric/ConcentricShapeType.js";
import { Subdivide } from "../../../../ludemes/game/functions/graph/operators/Subdivide.js";
import { Trim } from "../../../../ludemes/game/functions/graph/operators/Trim.js";
import { constructTiling } from "../../../../ludemes/game/functions/graph/generators/basis/tiling/Tiling.js";
import { CustomOn33344 } from "../../../../ludemes/game/functions/graph/generators/basis/tiling/tiling33344/CustomOn33344.js";
import { CustomOn3464 } from "../../../../ludemes/game/functions/graph/generators/basis/tiling/tiling3464/CustomOn3464.js";
import { CustomOn3636 } from "../../../../ludemes/game/functions/graph/generators/basis/tiling/tiling3636/CustomOn3636.js";
import { CustomOn488 } from "../../../../ludemes/game/functions/graph/generators/basis/tiling/tiling488/CustomOn488.js";
import { Tiling33434 } from "../../../../ludemes/game/functions/graph/generators/basis/tiling/tiling33434/Tiling33434.js";
import { constructTri } from "../../../../ludemes/game/functions/graph/generators/basis/tri/Tri.js";
import { CustomOnTri } from "../../../../ludemes/game/functions/graph/generators/basis/tri/CustomOnTri.js";
import { Wedge } from "../../../../ludemes/game/functions/graph/generators/shape/Wedge.js";
import { Keep } from "../../../../ludemes/game/functions/graph/operators/Keep.js";
import { Team } from "../../../../ludemes/game/functions/intArray/iteraror/Team.js";
import { ValuesRemembered } from "../../../../ludemes/game/functions/intArray/values/ValuesRemembered.js";
import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { ToInt } from "../../../../ludemes/game/functions/ints/ToInt.js";
import type { JavaIntFunction } from "../../../../ludemes/game/functions/ints/IntFunction.js";
import { Between1to1 as IteratorBetween, From1to1 as IteratorFrom, To1to1 as IteratorTo } from "../../../../ludemes/game/functions/ints1to1/iterator/Iterator1to1.js";
import { What1to1, Who1to1 } from "../../../../ludemes/game/functions/ints1to1/board/Board1to1.js";
import { TrackSite } from "../../../../ludemes/game/functions/ints/trackSite/TrackSite.js";
import { TrackSiteFirstType } from "../../../../ludemes/game/functions/ints/trackSite/TrackSiteFirstType.js";
import { TrackSiteMoveType } from "../../../../ludemes/game/functions/ints/trackSite/TrackSiteMoveType.js";
import { TrackSiteType } from "../../../../ludemes/game/functions/ints/trackSite/TrackSiteType.js";
import { ArrayValue } from "../../../../ludemes/game/functions/ints/board/ArrayValue.js";
import { WhereLevel } from "../../../../ludemes/game/functions/ints/board/where/WhereLevel.js";
import { WhereSite } from "../../../../ludemes/game/functions/ints/board/where/WhereSite.js";
import { ValueIterated } from "../../../../ludemes/game/functions/ints/value/iterated/ValueIterated.js";
import { ValuePiece } from "../../../../ludemes/game/functions/ints/value/piece/ValuePiece.js";
import { ValuePlayer } from "../../../../ludemes/game/functions/ints/value/player/ValuePlayer.js";
import { ValueRandom } from "../../../../ludemes/game/functions/ints/value/random/ValueRandom.js";
import { ValueMoveLimit } from "../../../../ludemes/game/functions/ints/value/simple/ValueMoveLimit.js";
import { ValuePending } from "../../../../ludemes/game/functions/ints/value/simple/ValuePending.js";
import { ValueTurnLimit } from "../../../../ludemes/game/functions/ints/value/simple/ValueTurnLimit.js";
import { CountPieces1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountPieces1to1.js";
import { Score1to1, Var1to1 } from "../../../../ludemes/game/functions/ints1to1/state/State1to1.js";
import { IsEnemy1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsEnemy1to1.js";
import { IsFriend1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsFriend1to1.js";
import { Tile } from "../../../../ludemes/game/equipment/component/tile/Tile.js";
import { Regions } from "../../../../ludemes/game/equipment/other/Regions.js";
import { Board1to1 } from "../../../../ludemes/game/equipment/container/board/Board1to1.js";
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
import { Remove } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Remove.js";
import { Surround } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Surround.js";
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
import { Poly } from "../../../../ludemes/game/util/graph/Poly.js";
import { Between1to1 } from "../../../../ludemes/game/util/moves/Between1to1.js";
import { From1to1 } from "../../../../ludemes/game/util/moves/From1to1.js";
import { Piece1to1 } from "../../../../ludemes/game/util/moves/Piece1to1.js";
import { To1to1 } from "../../../../ludemes/game/util/moves/To1to1.js";
import { Trajectories } from "../../../../eval/graph/trajectories.js";
import type { ArgBundle } from "../../ArgBundle.js";
import type { LudemeRegistry } from "../../LudemeRegistry.js";

export function registerBatch9(registry: LudemeRegistry): void {
  registry.registerLudeme("container.board.board:board", makeBoard);
  registry.registerLudeme("board", makeBoard);
  registry.registerLudeme("concentric:concentric", makeConcentric);
  registry.registerLudeme("concentric", makeConcentric);
  registry.registerLudeme("count.count:count", makeCount);
  registry.registerLudeme("count", makeCount);
  registry.registerLudeme("regions:regions", makeRegions);
  registry.registerLudeme("regions", makeRegions);
  registry.registerLudeme("regionSite:regionSite", makeRegionSite);
  registry.registerLudeme("regionSite", makeRegionSite);
  registry.registerLudeme("start.set.set:set", makeStartSet);
  registry.registerLudeme("state:state", deferred("state"));
  registry.registerLudeme("state.score:score", makeScore);
  registry.registerLudeme("subdivide:subdivide", (b) => new Subdivide(requireGraph(b, 0), optionalNumber(b.named.get("min")) ?? 1));
  registry.registerLudeme("subgame:subgame", makeSubgame);
  registry.registerLudeme("surakartaBoard:surakartaBoard", makeSurakartaBoard);
  registry.registerLudeme("surround:surround", makeSurround);
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
  registry.registerLudeme("what:what", makeWhat);
  registry.registerLudeme("where:where", makeWhere);
  registry.registerLudeme("while:while", (b) => new While(requireBooleanFunction(b, 0), requireMoves(b.positional[1]), optionalMoves(b.positional[2])));
  registry.registerLudeme("who:who", makeWho);
  registry.registerLudeme("xor:xor", (b) => new Xor1to1(requireBooleanFunction(b, 0), requireBooleanFunction(b, 1)));
}

function makeBoard(b: ArgBundle): Board1to1 {
  const existing = flatten(b.positional).find((value): value is Board1to1 => value instanceof Board1to1);
  if (existing) return existing;
  const graphFn = flatten(b.positional).find(isGraphFunction);
  if (graphFn === undefined) throw new Error("factory not yet wired: board");
  const requestedType = optionalSiteType(b.named.get("use")) ?? "Cell";
  let graph = graphFn.eval(requestedType);
  let trajectories = new Trajectories(graph, requestedType);
  if (trajectories.numSites === 0 && (requestedType === "Cell" || requestedType === "Edge")) {
    graph = graphFn.eval("Vertex");
    trajectories = new Trajectories(graph, "Vertex");
  }
  if (trajectories.numSites === 0) throw new Error("factory not yet wired: board");

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let site = 0; site < trajectories.numSites; site += 1) {
    minX = Math.min(minX, trajectories.xOf(site));
    maxX = Math.max(maxX, trajectories.xOf(site));
    minY = Math.min(minY, trajectories.yOf(site));
    maxY = Math.max(maxY, trajectories.yOf(site));
  }
  return new Board1to1(
    Math.max(1, Math.ceil(maxX - minX) + 1),
    Math.max(1, Math.ceil(maxY - minY) + 1),
    trajectories.numSites,
    trajectories,
    graph.faces.length,
  );
}

function makeConcentric(b: ArgBundle): GraphFunction {
  const shape = b.positional.find((value): value is ConcentricShapeType =>
    typeof value === "string" && ["Triangle", "Square", "Hexagon", "Target"].includes(value),
  );
  const cells = b.positional.find(isNumberArray);
  return Concentric.construct({
    shape,
    sides: optionalNumber(b.named.get("sides")) ?? undefined,
    cells: cells ?? undefined,
    rings: optionalNumber(b.named.get("rings")) ?? undefined,
    steps: optionalNumber(b.named.get("steps")) ?? undefined,
    midpoints: optionalBoolean(b.named.get("midpoints")) ?? undefined,
    joinMidpoints: optionalBoolean(b.named.get("joinmidpoints")) ?? undefined,
    joinCorners: optionalBoolean(b.named.get("joincorners")) ?? undefined,
    stagger: optionalBoolean(b.named.get("stagger")) ?? undefined,
  });
}

function makeCount(b: ArgBundle): IntFunction {
  const kind = optionalString(b.positional[0]);
  if (kind === "Pieces") {
    const role = roleStringAfter(b, 0) ?? "All";
    return new CountPieces1to1(
      roleIntFunction(role),
      optionalRegion(b.named.get("in")),
      optionalString(b.named.get("name")),
      role === "All" || role === "Any" || role === "Each",
    );
  }
  if (kind === "Cell" || kind === "Stack" || kind === null) {
    const at = optionalIntFunction(b.named.get("at"));
    return { eval: (ctx) => at === null ? 0 : ctx.state.countAtSite(at.eval(ctx)) };
  }
  if (kind === "Sites") {
    const region = optionalRegion(b.named.get("in"));
    return { eval: (ctx) => region?.eval(ctx).length ?? 0 };
  }
  if (kind === "Rows") {
    return { eval: (ctx) => (ctx.game as unknown as { equipment: { board: { height: number } } }).equipment.board.height };
  }
  if (kind === "Columns") {
    return { eval: (ctx) => (ctx.game as unknown as { equipment: { board: { width: number } } }).equipment.board.width };
  }
  if (kind === "Cells") {
    return { eval: (ctx) => (ctx.game as unknown as { equipment: { board: { numSites: number } } }).equipment.board.numSites };
  }
  if (kind === "Players") {
    return { eval: (ctx) => ctx.numPlayers() };
  }
  throw new Error(`factory not yet wired: count${kind === null ? "" : ` ${kind}`}`);
}

function makeRegions(b: ArgBundle): Regions {
  const values = flatten(b.positional);
  const name = values.find((value): value is string => typeof value === "string" && !isRoleString(value)) ?? null;
  const role = values.find((value): value is string => typeof value === "string" && isRoleString(value)) ?? null;
  const intArray = findNumberArray(b.positional);
  const regions = values.filter(isRegionFunction);
  if (intArray !== null) {
    return new Regions(name, role as never, intArray, null, null, null, null, null);
  }
  if (regions.length === 1) {
    return new Regions(name, role as never, null, regions[0]!, null, null, null, null);
  }
  if (regions.length > 1) {
    return new Regions(name, role as never, null, null, regions, null, null, null);
  }
  const regionTypes = values.find(isStringArray);
  if (regionTypes) {
    return new Regions(name, role as never, null, null, null, null, regionTypes as never, null);
  }
  const regionType = values.find((value): value is string =>
    typeof value === "string" && value !== name && !isRoleString(value),
  ) ?? null;
  if (regionType !== null) {
    return new Regions(name, role as never, null, null, null, regionType as never, null, null);
  }
  throw new Error("factory not yet wired: regions");
}

function makeRegionSite(b: ArgBundle): IntFunction {
  return new ArrayValue(asJavaIntArrayFunction(requireRegion(b.positional[0])), requireIntFunctionValue(b.named.get("index") ?? b.positional[1]));
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

function makeSurround(b: ArgBundle): Surround {
  const values = flatten(b.positional);
  const from = values.find((v): v is From1to1 => v instanceof From1to1) ?? null;
  const between = values.find((v): v is Between1to1 => v instanceof Between1to1) ?? null;
  const to = values.find((v): v is To1to1 => v instanceof To1to1) ?? null;
  const withPiece = values.find((v): v is Piece1to1 => v instanceof Piece1to1) ?? null;
  return new Surround({
    startLocationFn: from?.locFn() ?? new IteratorFrom(),
    dirnChoice: values.find((v): v is string => typeof v === "string") ?? undefined,
    targetRule: between?.condition() ?? new IsEnemy1to1(new IteratorBetween()),
    friendRule: to?.condFn() ?? new IsFriend1to1(new IteratorTo()),
    exception: optionalIntFunction(b.named.get("except")) ?? javaIntConstant(0),
    withAtLeastPiece: withPiece?.component() ?? null,
    effect: movesEffect(between?.effectFn()) ?? new Remove({ locationFn: new IteratorBetween() }),
    then: lastThen(values) as never,
  });
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
  throw new Error(`unsupported swap type: ${kind}`);
}

function makeTake(b: ArgBundle): MovesFunction {
  const kind = requireString(b, 0);
  if (kind === "Domino") return Take.constructSimple(TakeSimpleType.Domino, optionalMoves(b.positional[1]));
  if (kind !== "Control") throw new Error(`unsupported take type: ${kind}`);

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
  const shape = b.positional[1];
  const poly = polyPoints(shape);
  if (poly) return customTiling(tiling, poly, true);
  if (isNumberArray(shape)) return customTiling(tiling, shape, false);
  if (shape !== undefined && typeof shape !== "number") {
    throw new Error(`unsupported tiling shape: ${tiling}`);
  }
  const dims = b.positional.slice(1).filter((v): v is number => typeof v === "number");
  if (dims.length === 0) throw new Error("tiling: missing dimension");
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
  throw new Error(`unsupported trackSite type: ${kind}`);
}

function makeTri(b: ArgBundle): GraphFunction {
  const first = b.positional[0];
  const poly = polyPoints(first);
  if (poly) return new CustomOnTri(poly, true);
  if (isNumberArray(first)) return new CustomOnTri(first);
  if (typeof first === "number") return constructTri(null, first, optionalNumber(b.positional[1]) ?? undefined);
  if (typeof first === "string") return constructTri(first as never, requireNumber(b, 1), optionalNumber(b.positional[2]) ?? undefined);
  throw new Error("unsupported tri shape");
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
      throw new Error(`unsupported value type: ${kind}`);
  }
}

function makeValues(b: ArgBundle): ValuesRemembered {
  const kind = requireString(b, 0);
  if (kind !== "Remembered") throw new Error(`unsupported values type: ${kind}`);
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
  const kind = requireString(b, 0);
  if (kind !== "Pass") throw new Error(`unsupported was type: ${kind}`);
  return new WasPass();
}

function makeWhat(b: ArgBundle): What1to1 {
  return new What1to1(requireIntFunctionValue(siteArg(b)));
}

function makeWho(b: ArgBundle): Who1to1 {
  return new Who1to1(requireIntFunctionValue(siteArg(b)));
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

function customTiling(tiling: string, shape: [number, number][] | number[], isPoly: boolean): GraphFunction {
  switch (tiling) {
    case "T333333_33434":
      return constructTiling(tiling as never, 2);
    case "T3636":
      return new CustomOn3636(shape, isPoly);
    case "T3464":
      return new CustomOn3464(shape, isPoly);
    case "T33344":
      return new CustomOn33344(shape, isPoly);
    case "T488":
      return new CustomOn488(shape, isPoly);
    case "T4612":
      return constructTiling(tiling as never, 3);
    case "T31212":
      return constructTiling(tiling as never, 3);
    case "T33336":
      return constructTiling(tiling as never, 3);
    case "T33434":
      return isPoly ? new Keep(new Tiling33434(5), shape as [number, number][]) : new Tiling33434(3);
    default:
      throw new Error(`unsupported tiling type: ${tiling}`);
  }
}

function siteArg(b: ArgBundle): unknown {
  if (b.named.has("at")) return b.named.get("at");
  return b.positional.find((v) => !isSiteTypeString(v));
}

function movesEffect(value: unknown): MovesFunction | null {
  if (value === undefined || value === null) return null;
  if (!isMovesFunction(value)) throw new Error("surround: expected between effect moves");
  return value;
}

function lastThen(values: readonly unknown[]): Then | null {
  for (let i = values.length - 1; i >= 0; i--) {
    const value = values[i];
    if (value instanceof Then) return value;
  }
  return null;
}

function polyPoints(value: unknown): [number, number][] | null {
  if (value instanceof Poly) return value.polygon().points().map((p) => [p.x, p.y]);
  if (isPointList(value)) return value.map((p) => [p[0], p[1]]);
  return null;
}

function isPointList(value: unknown): value is [number, number][] {
  return Array.isArray(value) && value.every((point) =>
    Array.isArray(point) && point.length === 2 && point.every((coord) => typeof coord === "number"));
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number");
}

function findNumberArray(values: readonly unknown[]): number[] | null {
  for (const value of values) {
    if (isNumberArray(value)) return value;
    if (Array.isArray(value)) {
      const nested = findNumberArray(value);
      if (nested !== null) return nested;
    }
  }
  return null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function flatten(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value) && !isPointList(value)) out.push(...flatten(value));
    else out.push(value);
  }
  return out;
}

function isSiteTypeString(value: unknown): boolean {
  return value === "Cell" || value === "Edge" || value === "Vertex";
}

function startSites(b: ArgBundle): number[] {
  if (b.named.has("at")) return [asNumber(b.named.get("at"))];
  if (b.named.has("to")) return requireNumberArray(b.named.get("to"), "set sites to");
  throw new Error("set: expected at or to sites");
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
  if (value === undefined) throw new Error(`unsupported role type: ${role}`);
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

function requireRegion(value: unknown): RegionFunction {
  if (!isRegionFunction(value)) throw new Error("factory not yet wired: expected region");
  return value;
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

function roleStringAfter(b: ArgBundle, index: number): string | null {
  for (let i = index + 1; i < b.positional.length; i++) {
    const value = b.positional[i];
    if (typeof value === "string" && isRoleString(value)) return value;
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

function asJavaIntArrayFunction(region: RegionFunction): ConstructorParameters<typeof ArrayValue>[0] {
  return {
    eval: (ctx) => region.eval(ctx),
    isStatic: () => false,
    concepts: () => new Set(),
    writesEvalContextRecursive: () => new Set(),
    readsEvalContextRecursive: () => new Set(),
    missingRequirement: () => false,
    willCrash: () => false,
    preprocess: () => undefined,
    toEnglish: () => "region",
  };
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
