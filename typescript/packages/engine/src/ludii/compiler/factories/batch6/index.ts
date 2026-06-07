import { BooleanConstant } from "../../../../ludemes/game/functions/booleans/BooleanConstant.js";
import { FloatConstant } from "../../../../ludemes/game/functions/floats/FloatConstant.js";
import { Add as GraphAdd } from "../../../../ludemes/game/functions/graph/operators/Add.js";
import { Remove as GraphRemove } from "../../../../ludemes/game/functions/graph/operators/Remove.js";
import { Union as GraphUnion } from "../../../../ludemes/game/functions/graph/operators/Union.js";
import { Quadhex } from "../../../../ludemes/game/functions/graph/generators/basis/quadhex/Quadhex.js";
import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { PathExtent } from "../../../../ludemes/game/functions/ints/tile/PathExtent.js";
import { Pips1to1 } from "../../../../ludemes/game/functions/ints1to1/iterator/Iterator1to1.js";
import { Pot } from "../../../../ludemes/game/functions/ints/state/Pot.js";
import { Prev1to1 } from "../../../../ludemes/game/functions/ints1to1/state/State1to1.js";
import { Hand } from "../../../../ludemes/game/equipment/container/other/Hand.js";
import { Path } from "../../../../ludemes/game/equipment/component/tile/Path.js";
import { GamePlayer1to1 } from "../../../../ludemes/game/players/GamePlayer1to1.js";
import { GamePlayers1to1 } from "../../../../ludemes/game/players/GamePlayers1to1.js";
import { Payoffs } from "../../../../ludemes/game/rules/end/Payoffs.js";
import { PassEnd } from "../../../../ludemes/game/rules/meta/PassEnd.js";
import { Pin } from "../../../../ludemes/game/rules/meta/Pin.js";
import { Play1to1 } from "../../../../ludemes/game/rules/play/Play1to1.js";
import { Note } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Note.js";
import { Pass1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Pass1to1.js";
import { PlayCard } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/PlayCard.js";
import { Promote } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Promote.js";
import { Propose } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Propose.js";
import { Push } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Push.js";
import { Random } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Random.js";
import { Priority } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/requirement/Priority.js";
import { ForEachDie } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/foreach/die/ForEachDie.js";
import { ForEachDirection } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/foreach/direction/ForEachDirection.js";
import { ForEachGroup } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/foreach/group/ForEachGroup.js";
import { ForEachLevel, type StackDirection } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/foreach/level/ForEachLevel.js";
import { ForEachPiece } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/foreach/piece/ForEachPiece.js";
import { ForEachPlayer } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/foreach/player/ForEachPlayer.js";
import { ForEachSite } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/foreach/site/ForEachSite.js";
import { ForEachTeam } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/foreach/team/ForEachTeam.js";
import { ForEachValue } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/foreach/value/ForEachValue.js";
import { Place } from "../../../../ludemes/game/rules/start/place/Place.js";
import { Phase } from "../../../../ludemes/game/rules/phase/Phase.js";
import type { NextPhase } from "../../../../ludemes/game/rules/phase/NextPhase.js";
import type { End } from "../../../../ludemes/game/rules/end/End.js";
import { Payoff } from "../../../../ludemes/game/util/end/Payoff.js";
import { Poly } from "../../../../ludemes/game/util/graph/Poly.js";
import { Between1to1 } from "../../../../ludemes/game/util/moves/Between1to1.js";
import { From1to1 } from "../../../../ludemes/game/util/moves/From1to1.js";
import { Player1to1 } from "../../../../ludemes/game/util/moves/Player1to1.js";
import { To1to1 } from "../../../../ludemes/game/util/moves/To1to1.js";
import type {
  BooleanFunction,
  DirectionsFunction,
  FloatFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
  RoleType,
} from "../../../../ludemes/base.js";
import { BaseGraphFunction } from "../../../../ludemes/game/functions/graph/BaseGraphFunction.js";
import type { GraphFunction } from "../../../../ludemes/game/functions/graph/GraphFunction.js";
import type { ArgBundle } from "../../ArgBundle.js";
import type { LudemeRegistry } from "../../LudemeRegistry.js";

type Pt = readonly [number, number];
type ThenLike = never;
type SiteType = string | null;
type PlaceCount = { item(): string; count(): IntFunction };

export function registerBatch6(registry: LudemeRegistry): void {
  registry.registerLudeme("note:note", noteFactory);
  registry.registerLudeme("operators.add:add", graphAddFactory);
  registry.registerLudeme("operators.foreach.forEach:forEach", forEachFactory);
  registry.registerLudeme("operators.remove:remove", graphRemoveFactory);
  registry.registerLudeme("operators.union:union", graphUnionFactory);
  registry.registerLudeme("other.hand:hand", handFactory);
  registry.registerLudeme("pass:pass", passFactory);
  registry.registerLudeme("passEnd:passEnd", passEndFactory);
  registry.registerLudeme("path:path", pathFactory);
  registry.registerLudeme("pathExtent:pathExtent", pathExtentFactory);
  registry.registerLudeme("payoff:payoff", payoffFactory);
  registry.registerLudeme("payoffs:payoffs", payoffsFactory);
  registry.registerLudeme("phase.phase:phase", phaseFactory);
  registry.registerLudeme("pin:pin", pinFactory);
  registry.registerLudeme("pips:pips", pipsFactory);
  registry.registerLudeme("place:place", placeFactory);
  registry.registerLudeme("play:play", playFactory);
  registry.registerLudeme("playCard:playCard", playCardFactory);
  registry.registerLudeme("players:players", playersFactory);
  registry.registerLudeme("players.player:player", playerFactory);
  registry.registerLudeme("poly:poly", polyFactory);
  registry.registerLudeme("pot:pot", potFactory);
  registry.registerLudeme("prev:prev", prevFactory);
  registry.registerLudeme("priority:priority", priorityFactory);
  registry.registerLudeme("promote:promote", promoteFactory);
  registry.registerLudeme("propose:propose", proposeFactory);
  registry.registerLudeme("push:push", pushFactory);
  registry.registerLudeme("quadhex:quadhex", quadhexFactory);
  registry.registerLudeme("random:random", randomFactory);
}

function noteFactory(b: ArgBundle): Note {
  const playerMessage = intFromRoleOrValue(b.named.get("player"));
  const to = b.named.get("to");
  const hasTo = to !== undefined && to !== null;
  const playerFn = to instanceof Player1to1 ? to.index() : intFromRoleOrValue(to) ?? roleInt("All");
  const role = typeof to === "string" ? to : hasTo ? "Player" : "All";
  const message = firstPositional(b);
  if (typeof message === "string") return new Note({ playerFn, role, playerMessage, message });
  if (isIntFunction(message)) return new Note({ playerFn, role, playerMessage, messageInt: message });
  if (isIntArrayFunction(message)) return new Note({ playerFn, role, playerMessage, messageIntArray: message });
  if (isFloatFunction(message)) return new Note({ playerFn, role, playerMessage, messageFloat: message });
  if (isBooleanFunction(message)) return new Note({ playerFn, role, playerMessage, messageBoolean: message });
  if (isRegionFunction(message)) return new Note({ playerFn, role, playerMessage, messageRegion: message });
  throw new Error("factory not yet wired: note");
}

function graphAddFactory(b: ArgBundle): GraphAdd {
  if (b.named.has("edgescurved")) throw new Error("factory not yet wired: add");
  const graph = firstOf<GraphFunction>(b, isGraphFunction) ?? null;
  const edges = b.named.get("edges");
  const cells = b.named.get("cells");
  const edgeArgs = classifyLinePairs(edges);
  const cellArgs = classifyRings(cells);
  return new GraphAdd({
    graph,
    vertices: toPoints(b.named.get("vertices")),
    edgesByCoord: edgeArgs.coord,
    edgesByIndex: edgeArgs.index,
    facesByCoord: cellArgs.coord,
    facesByIndex: cellArgs.index,
    connect: namedBoolean(b, "connect") ?? false,
  });
}

function forEachFactory(b: ArgBundle): MovesFunction {
  const kind = requiredString(b.positional[0], "forEach type");
  switch (kind) {
    case "Direction": {
      const from = findInstance(b, From1to1);
      const direction = firstDirectionFunction(b);
      const between = findInstance(b, Between1to1);
      const to = findInstance(b, To1to1);
      const moves = firstMovesAfterKind(b);
      if (!moves && (!to || !isMovesFunction(to.effectFn()))) throw new Error("factory not yet wired: forEach");
      return new ForEachDirection(
        from ?? null,
        direction,
        between ?? null,
        to ?? null,
        moves ?? null,
        thenArg(b),
      );
    }
    case "Site":
      return new ForEachSite(
        requiredRegion(b.positional[1], "forEach Site region"),
        requiredMoves(b.positional[2], "forEach Site moves"),
        asMoves(b.named.get("nomoveyet")) ?? null,
        thenArg(b),
      );
    case "Value": {
      if (b.named.has("min") || b.named.has("max")) {
        return new ForEachValue(
          requiredIntFn(b.named.get("min"), "forEach Value min"),
          requiredIntFn(b.named.get("max"), "forEach Value max"),
          requiredMoves(b.positional[1], "forEach Value moves"),
          thenArg(b),
        );
      }
      return new ForEachValue(
        requiredIntArrayFn(b.positional[1], "forEach Value values"),
        requiredMoves(b.positional[2], "forEach Value moves"),
        thenArg(b),
      );
    }
    case "Die":
      return new ForEachDie(
        asIntFn(b.positional[1]) ?? null,
        asBooleanFn(b.named.get("combined")) ?? null,
        asBooleanFn(b.named.get("replaydouble")) ?? null,
        asBooleanFn(b.named.get("if")) ?? null,
        requiredLastMoves(b, "forEach Die moves"),
        thenArg(b),
      );
    case "Team":
      return new ForEachTeam(requiredMoves(b.positional[1], "forEach Team moves"), thenArg(b));
    case "Group":
      return new ForEachGroup(
        firstSiteTypeAfterKind(b),
        firstDirectionFunction(b),
        asBooleanFn(b.named.get("if")) ?? null,
        requiredLastMoves(b, "forEach Group moves"),
        thenArg(b),
      );
    case "Level":
      return new ForEachLevel(
        firstSiteTypeAfterKind(b),
        firstOf<IntFunction>(b, isIntFunction) ?? iteratorFrom(),
        firstStringMatching(b, ["FromTop", "FromBottom"]) as StackDirection | null,
        requiredLastMoves(b, "forEach Level moves"),
        thenArg(b),
      );
    case "Player": {
      const players = firstOf<IntArrayFunction>(b, isIntArrayFunction);
      const moves = requiredLastMoves(b, "forEach Player moves");
      return new ForEachPlayer(players ?? null, moves, thenArg(b));
    }
    case "Piece":
      return new ForEachPiece(
        namedString(b, "on") ?? firstSiteTypeAfterKind(b),
        firstStringAfterKind(b),
        firstStringArray(b),
        asIntFn(b.named.get("container")) ?? null,
        containerNameForPiece(b),
        firstOf<MovesFunction>(b, isMovesFunction) ?? null,
        findInstance(b, Player1to1)?.index() ?? null,
        firstRoleAfterKind(b),
        asBooleanFn(b.named.get("top")) ?? null,
        thenArg(b),
      );
    default:
      throw new Error(`factory batch6: unsupported forEach type ${kind}`);
  }
}

function graphRemoveFactory(b: ArgBundle): GraphRemove {
  const graph = requiredGraph(b.positional[0], "remove graph");
  const poly = findInstance(b, Poly);
  if (poly) {
    return new GraphRemove(graph, { polygon: polygonPoints(poly) });
  }
  const cells = classifyRings(b.named.get("cells"));
  const edges = classifyLinePairs(b.named.get("edges"));
  const vertices = classifyPointsOrIndices(b.named.get("vertices"));
  return new GraphRemove(graph, {
    facePositions: cells.coord,
    faceIndices: cells.index.flat(),
    edgePositions: edges.coord,
    edgeIndices: edges.index,
    vertexPositions: vertices.coord,
    vertexIndices: vertices.index,
  });
}

function graphUnionFactory(b: ArgBundle): GraphUnion {
  const graphs = flatten(b.positional).filter(isGraphFunction);
  return new GraphUnion(graphs, namedBoolean(b, "connect") ?? false);
}

function handFactory(b: ArgBundle): Hand {
  return new Hand(requiredString(b.positional[0], "hand role") as never, namedNumber(b, "size") ?? null);
}

function passFactory(): Pass1to1 {
  return new Pass1to1();
}

function passEndFactory(b: ArgBundle): PassEnd {
  return new PassEnd(requiredString(b.positional[0], "passEnd type"));
}

function pathFactory(b: ArgBundle): Path {
  return new Path(
    requiredNumber(b.positional[0], "path from"),
    namedNumber(b, "slotsfrom"),
    requiredNumber(b.positional[1], "path to"),
    namedNumber(b, "slotsto"),
    requiredNumber(b.named.get("colour"), "path colour"),
  );
}

function pathExtentFactory(b: ArgBundle): PathExtent {
  const ints = flatten(b.positional).filter(isIntFunction);
  const region = firstOf<RegionFunction>(b, isRegionFunction) ?? null;
  return new PathExtent((ints[0] ?? null) as never, (ints[1] ?? null) as never, region);
}

function payoffFactory(b: ArgBundle): Payoff {
  return new Payoff(requiredString(b.positional[0], "payoff role") as never, asFloatFn(b.positional[1]) ?? new FloatConstant(requiredNumber(b.positional[1], "payoff")));
}

function payoffsFactory(b: ArgBundle): Payoffs {
  const payoffs = flatten(b.positional).filter((v): v is Payoff => v instanceof Payoff);
  return new Payoffs(payoffs);
}

function phaseFactory(b: ArgBundle): Phase {
  const name = requiredString(b.positional[0], "phase name");
  const role = firstRoleAfterIndex(b, 1);
  const play = firstOf<Play1to1>(b, (v): v is Play1to1 => v instanceof Play1to1);
  if (!play) throw new Error("factory batch6: expected play for phase");
  const end = b.positional.find((v): v is End => isObject(v) && "eval" in v) ?? null;
  const next = flatten(b.positional).filter((v): v is NextPhase => isObject(v) && "targetName" in v);
  return new Phase(name, role ?? null, null, play, end, null, next);
}

function pinFactory(b: ArgBundle): Pin {
  return new Pin(requiredString(b.positional[0], "pin type"));
}

function pipsFactory(): Pips1to1 {
  return new Pips1to1();
}

function placeFactory(b: ArgBundle): unknown {
  const kind = b.positional[0];
  if (kind === "Random") {
    const counts = firstPlaceCountArray(b);
    if (counts) {
      return Place.constructRandomCounts(
        "Random" as never,
        counts,
        requiredIntFn(lastNumberOrInt(b), "place Random where"),
        firstSiteTypeAfterKind(b),
      );
    }
    if (Array.isArray(b.named.get("count"))) {
      return Place.constructRandomStack(
        "Random" as never,
        firstStringArray(b) ?? [],
        intFnArray(b.named.get("count")),
        asIntFn(b.named.get("state")),
        asIntFn(b.named.get("value")),
        requiredIntFn(lastNumberOrInt(b), "place Random where"),
        firstSiteTypeAfterKind(b),
      );
    }
    const where = lastNumberOrInt(b);
    if (where !== undefined && !isRegionFunction(b.positional[1])) {
      return Place.constructRandomStack(
        "Random" as never,
        firstStringArray(b) ?? [],
        null,
        asIntFn(b.named.get("state")),
        asIntFn(b.named.get("value")),
        requiredIntFn(where, "place Random where"),
        firstSiteTypeAfterKind(b),
      );
    }
    return Place.constructRandom(
      "Random" as never,
      firstOf<RegionFunction>(b, isRegionFunction) ?? null,
      firstStringArray(b) ?? [],
      asIntFn(b.named.get("count")),
      asIntFn(b.named.get("state")),
      asIntFn(b.named.get("value")),
      firstSiteTypeAfterKind(b),
      asBooleanConstant(lastBoolean(b)),
    );
  }
  if (kind === "Stack") {
    return Place.constructStack(
      "Stack" as never,
      firstStringAfterKind(b),
      firstStringArray(b),
      containerNameForPiece(b),
      firstSiteTypeAfterKind(b),
      asIntFn(firstNumberAfterStrings(b)),
      intFnArray(firstNumberArray(b)),
      firstOf<RegionFunction>(b, isRegionFunction) ?? null,
      namedString(b, "coord"),
      firstStringArrayAfterFirst(b),
      asIntFn(b.named.get("count")),
      intFnArray(b.named.get("counts")),
      asIntFn(b.named.get("state")),
      asIntFn(b.named.get("rotation")),
      asIntFn(b.named.get("value")),
    );
  }
  if (b.clause.raw.includes("[<int>]") || b.clause.raw.includes("[<sites>]")) {
    return Place.constructFill(
      requiredString(b.positional[0], "place item"),
      firstSiteTypeAfterIndex(b, 1),
      intFnArray(firstNumberArray(b)),
      firstOf<RegionFunction>(b, isRegionFunction) ?? null,
      firstStringArrayAfterFirst(b),
      intFnArray(b.named.get("counts")),
      asIntFn(b.named.get("state")),
      asIntFn(b.named.get("rotation")),
      asIntFn(b.named.get("value")),
    );
  }
  return Place.constructItem(
    requiredString(b.positional[0], "place item"),
    secondPlainString(b),
    firstSiteTypeAfterIndex(b, 1),
    asIntFn(firstNumberAfterStrings(b)),
    namedString(b, "coord"),
    asIntFn(b.named.get("count")),
    asIntFn(b.named.get("state")),
    asIntFn(b.named.get("rotation")),
    asIntFn(b.named.get("value")),
  );
}

function playFactory(b: ArgBundle): Play1to1 {
  return new Play1to1(requiredMoves(b.positional[0], "play moves"));
}

function playCardFactory(b: ArgBundle): PlayCard {
  return new PlayCard(thenArg(b));
}

function playersFactory(b: ArgBundle, env: { numPlayers: number }): GamePlayers1to1 {
  const first = b.positional[0];
  if (typeof first === "number") {
    env.numPlayers = first;
    return GamePlayers1to1.fromCount(first);
  }
  const players = flatten(b.positional).filter((v): v is GamePlayer1to1 => v instanceof GamePlayer1to1);
  env.numPlayers = players.length;
  return GamePlayers1to1.fromPlayerArray(players);
}

function playerFactory(b: ArgBundle): GamePlayer1to1 {
  return new GamePlayer1to1(requiredString(b.positional[0], "player directionFacing"));
}

function polyFactory(b: ArgBundle): Poly {
  return new Poly(toPoints(b.positional[0]), namedNumber(b, "rotns"));
}

function potFactory(): Pot {
  return new Pot();
}

function prevFactory(b: ArgBundle): Prev1to1 {
  const type = b.positional[0];
  if (type === undefined || type === "Mover") return new Prev1to1();
  if (type !== "MoverLastTurn") throw new Error("factory batch6: expected PrevType for prev");
  throw new Error("factory not yet wired: prev MoverLastTurn");
}

function priorityFactory(b: ArgBundle): Priority {
  const moves = flatten(b.positional).filter(isMovesFunction);
  if (moves.length === 2 && !Array.isArray(b.positional[0])) return Priority.fromTwo(moves[0]!, moves[1]!, thenArg(b));
  return new Priority(moves, thenArg(b));
}

function promoteFactory(b: ArgBundle): Promote {
  const piece = b.positional.find(isPieceLike);
  if (!piece) throw new Error("factory batch6: expected piece for promote");
  return new Promote(
    firstOf<IntFunction>(b, isIntFunction) ?? iteratorTo(),
    piece.getNames() ?? (piece.getName() ? [piece.getName()!] : null),
    piece.component(),
    piece.components(),
    findInstance(b, Player1to1)?.index() ?? firstRoleIntAfterPiece(b),
    firstSiteTypeAfterKind(b),
    thenArg(b),
  );
}

function proposeFactory(b: ArgBundle): Propose {
  return new Propose({
    proposition: typeof b.positional[0] === "string" ? b.positional[0] : null,
    propositions: Array.isArray(b.positional[0]) ? b.positional[0].filter((v): v is string => typeof v === "string") : null,
    then: thenArg(b) as unknown as MovesFunction | null,
  });
}

function pushFactory(b: ArgBundle): Push {
  const from = findInstance(b, From1to1);
  const direction = firstDirectionFunction(b);
  if (!direction) throw new Error("factory batch6: expected direction for push");
  return new Push(from?.locFn() ?? iteratorTo(), direction, thenArg(b));
}

function quadhexFactory(b: ArgBundle): Quadhex {
  return new Quadhex(requiredNumber(b.positional[0], "quadhex layers"));
}

function randomFactory(b: ArgBundle): Random {
  return Random.fromNum(requiredMoves(b.positional[0], "random moves"), requiredIntFn(b.named.get("num"), "random num"));
}

function flatten(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) Array.isArray(value) ? out.push(...flatten(value)) : out.push(value);
  return out;
}

function firstPositional(b: ArgBundle): unknown {
  return b.positional[0];
}

function findInstance<T>(b: ArgBundle, ctor: abstract new (...args: never[]) => T): T | undefined {
  return flatten(b.positional).find((v): v is T => v instanceof ctor);
}

function firstOf<T>(b: ArgBundle, guard: (value: unknown) => value is T): T | undefined {
  return flatten(b.positional).find(guard);
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`factory batch6: expected string for ${label}`);
  return value;
}

function requiredNumber(value: unknown, label: string): number {
  if (typeof value !== "number") throw new Error(`factory batch6: expected number for ${label}`);
  return value;
}

function namedNumber(b: ArgBundle, name: string): number | null {
  const value = b.named.get(name);
  return typeof value === "number" ? value : null;
}

function namedBoolean(b: ArgBundle, name: string): boolean | null {
  const value = b.named.get(name);
  return typeof value === "boolean" ? value : null;
}

function namedString(b: ArgBundle, name: string): string | null {
  const value = b.named.get(name);
  return typeof value === "string" ? value : null;
}

function requiredMoves(value: unknown, label: string): MovesFunction {
  if (!isMovesFunction(value)) throw new Error(`factory batch6: expected moves for ${label}`);
  return value;
}

function requiredLastMoves(b: ArgBundle, label: string): MovesFunction {
  const moves = flatten(b.positional).filter(isMovesFunction).at(-1);
  if (!moves) throw new Error(`factory batch6: expected moves for ${label}`);
  return moves;
}

function requiredRegion(value: unknown, label: string): RegionFunction {
  if (!isRegionFunction(value)) throw new Error(`factory batch6: expected region for ${label}`);
  return value;
}

function requiredGraph(value: unknown, label: string): GraphFunction {
  if (!isGraphFunction(value)) throw new Error(`factory batch6: expected graph for ${label}`);
  return value;
}

function requiredIntFn(value: unknown, label: string): IntFunction {
  const fn = asIntFn(value);
  if (!fn) throw new Error(`factory batch6: expected int function for ${label}`);
  return fn;
}

function requiredIntArrayFn(value: unknown, label: string): IntArrayFunction {
  if (!isIntArrayFunction(value)) throw new Error(`factory batch6: expected int-array function for ${label}`);
  return value;
}

function asIntFn(value: unknown): IntFunction | null {
  if (typeof value === "number") return new IntConstant(value);
  return isIntFunction(value) ? value : null;
}

function asFloatFn(value: unknown): FloatFunction | null {
  if (typeof value === "number") return new FloatConstant(value);
  return isFloatFunction(value) ? value : null;
}

function asBooleanFn(value: unknown): BooleanFunction | null {
  if (typeof value === "boolean") return new BooleanConstant(value);
  return isBooleanFunction(value) ? value : null;
}

function asBooleanConstant(value: unknown): BooleanConstant | null {
  return typeof value === "boolean" ? new BooleanConstant(value) : value instanceof BooleanConstant ? value : null;
}

function asMoves(value: unknown): MovesFunction | null {
  return isMovesFunction(value) ? value : null;
}

function intFnArray(value: unknown): IntFunction[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((v) => requiredIntFn(v, "int array"));
}

function firstMovesAfterKind(b: ArgBundle): MovesFunction | null {
  return b.positional.slice(1).find(isMovesFunction) ?? null;
}

function thenArg(b: ArgBundle): ThenLike | null {
  const last = b.positional.at(-1);
  return isThenLike(last) ? last as ThenLike : null;
}

function firstSiteTypeAfterKind(b: ArgBundle): SiteType {
  return firstSiteTypeAfterIndex(b, 1);
}

function firstSiteTypeAfterIndex(b: ArgBundle, start: number): SiteType {
  for (let i = start; i < b.positional.length; i++) {
    const value = b.positional[i];
    if (isSiteType(value)) return value;
  }
  return null;
}

function firstStringMatching(b: ArgBundle, choices: readonly string[]): string | null {
  return flatten(b.positional).find((v): v is string => typeof v === "string" && choices.includes(v)) ?? null;
}

function firstStringAfterKind(b: ArgBundle): string | null {
  return b.positional.slice(1).find((v): v is string => typeof v === "string" && !isSiteType(v) && !isRoleType(v)) ?? null;
}

function firstStringArray(b: ArgBundle): string[] | null {
  return flatten(b.positional).find((v): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string")) ?? null;
}

function firstStringArrayAfterFirst(b: ArgBundle): string[] | null {
  return b.positional.slice(1).find((v): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string")) ?? null;
}

function firstPlaceCountArray(b: ArgBundle): PlaceCount[] | null {
  for (const value of b.positional) {
    const counts = normalizePlaceCountArray(value);
    if (counts) return counts;
  }
  return null;
}

function normalizePlaceCountArray(value: unknown): PlaceCount[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const counts = value.map(normalizePlaceCount);
  return counts.every((count): count is PlaceCount => count !== null) ? counts : null;
}

function normalizePlaceCount(value: unknown): PlaceCount | null {
  if (!isObject(value)) return null;
  const item = value.item;
  const count = value.count;
  if (typeof item === "function" && typeof count === "function") return value as PlaceCount;
  if (typeof item === "string" && isIntFunction(count)) {
    return {
      item: () => item,
      count: () => count,
    };
  }
  return null;
}

function firstNumberArray(b: ArgBundle): unknown {
  return b.positional.find((v) => Array.isArray(v) && flatten(v).every((x) => typeof x === "number" || isIntFunction(x)));
}

function firstNumberAfterStrings(b: ArgBundle): unknown {
  return b.positional.find((v, i) => i > 0 && (typeof v === "number" || isIntFunction(v)));
}

function lastNumberOrInt(b: ArgBundle): unknown {
  return b.positional.slice().reverse().find((v) => typeof v === "number" || isIntFunction(v));
}

function lastBoolean(b: ArgBundle): unknown {
  return b.positional.slice().reverse().find((v) => typeof v === "boolean" || v instanceof BooleanConstant);
}

function secondPlainString(b: ArgBundle): string | null {
  const strings = b.positional.filter((v): v is string => typeof v === "string" && !isSiteType(v));
  return strings[1] ?? null;
}

function containerNameForPiece(b: ArgBundle): string | null {
  const container = b.positional.find((v): v is string => typeof v === "string" && !isSiteType(v) && !isRoleType(v) && v !== "Piece" && v !== "Stack");
  return b.named.has("container") ? null : container ?? null;
}

function firstRoleAfterKind(b: ArgBundle): string | null {
  return firstRoleAfterIndex(b, 1);
}

function firstRoleAfterIndex(b: ArgBundle, start: number): string | null {
  for (let i = start; i < b.positional.length; i++) {
    const value = b.positional[i];
    if (typeof value === "string" && isRoleType(value)) return value;
  }
  return null;
}

function firstRoleIntAfterPiece(b: ArgBundle): IntFunction | null {
  const role = firstRoleAfterKind(b);
  return role ? roleInt(role) : null;
}

function roleInt(role: string): IntFunction {
  return { eval: (ctx) => roleToPlayerId(role, ctx.state.mover, ctx.game.numPlayers) };
}

function intFromRoleOrValue(value: unknown): IntFunction | null {
  if (value instanceof Player1to1) return value.index();
  if (typeof value === "string") return roleInt(value);
  return asIntFn(value);
}

function roleToPlayerId(role: string, mover = 1, numPlayers = 2): number {
  if (role === "Mover") return mover;
  if (role === "Next") return (mover % numPlayers) + 1;
  if (role === "Prev") return ((mover - 2 + numPlayers) % numPlayers) + 1;
  if (role === "Shared" || role === "All") return 0;
  const match = /^P(\d+)$/.exec(role);
  return match ? Number(match[1]) : 0;
}

function iteratorFrom(): IntFunction {
  return { eval: (ctx) => ctx._evalFrom };
}

function iteratorTo(): IntFunction {
  return { eval: (ctx) => ctx._evalTo };
}

function firstDirectionFunction(b: ArgBundle): DirectionsFunction | null {
  return firstOf<DirectionsFunction>(b, isDirectionsFunction) ?? directionFunction(firstDirectionName(b));
}

function directionFunction(name: string | null): DirectionsFunction | null {
  return name === null ? null : { eval: () => [name] };
}

function firstDirectionName(b: ArgBundle): string | null {
  return flatten(b.positional).find((value): value is string =>
    typeof value === "string" && DIRECTION_NAMES.has(value)) ?? null;
}

function toPoints(value: unknown): Pt[] {
  if (!Array.isArray(value)) return [];
  if (value.every((v) => Array.isArray(v) && v.length >= 2)) {
    return value.map((v) => [Number(v[0]), Number(v[1])] as const);
  }
  const nums = flatten(value).filter((v): v is number => typeof v === "number");
  const points: Pt[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) points.push([nums[i]!, nums[i + 1]!] as const);
  return points;
}

function classifyLinePairs(value: unknown): {
  coord: ReadonlyArray<readonly [Pt, Pt]>;
  index: ReadonlyArray<readonly [number, number]>;
} {
  if (!Array.isArray(value)) return { coord: [], index: [] };
  const flat = flatten(value);
  if (flat.every((v) => typeof v === "number") && value.every((v) => Array.isArray(v) && flatten(v).length === 2)) {
    return { coord: [], index: value.map((v) => [Number(flatten(v)[0]), Number(flatten(v)[1])] as const) };
  }
  return { coord: value.map((edge) => toPoints(edge)).filter((pts) => pts.length >= 2).map((pts) => [pts[0]!, pts[1]!] as const), index: [] };
}

function classifyRings(value: unknown): {
  coord: ReadonlyArray<ReadonlyArray<Pt>>;
  index: ReadonlyArray<ReadonlyArray<number>>;
} {
  if (!Array.isArray(value)) return { coord: [], index: [] };
  if (value.every((ring) => Array.isArray(ring) && ring.every((n) => typeof n === "number"))) {
    return { coord: [], index: value as number[][] };
  }
  return { coord: value.map(toPoints).filter((pts) => pts.length >= 3), index: [] };
}

function classifyPointsOrIndices(value: unknown): { coord: Pt[]; index: number[] } {
  if (!Array.isArray(value)) return { coord: [], index: [] };
  if (value.every((v) => typeof v === "number")) return { coord: [], index: value as number[] };
  return { coord: toPoints(value), index: [] };
}

function polygonPoints(poly: Poly): Pt[] {
  return poly.polygon().points().map((p) => [p.x, p.y] as const);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSiteType(value: unknown): value is string {
  return value === "Cell" || value === "Edge" || value === "Vertex";
}

function isRoleType(value: string): boolean {
  return ["Mover", "Next", "Prev", "All", "Each", "Shared", "Team", "Neutral"].includes(value) || /^P\d+$/.test(value);
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

function isMovesFunction(value: unknown): value is MovesFunction {
  return isObject(value) && typeof value.eval === "function" && !isIntFunction(value) && !isRegionFunction(value) && !isGraphFunction(value);
}

function isIntFunction(value: unknown): value is IntFunction {
  return value instanceof IntConstant || value instanceof Pips1to1 || value instanceof Pot || (isObject(value) && typeof value.eval === "function" && value.constructor.name.includes("Int"));
}

function isIntArrayFunction(value: unknown): value is IntArrayFunction {
  return isObject(value) && typeof value.eval === "function" && value.constructor.name.includes("Array");
}

function isFloatFunction(value: unknown): value is FloatFunction {
  return value instanceof FloatConstant || (isObject(value) && typeof value.eval === "function" && value.constructor.name.includes("Float"));
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return value instanceof BooleanConstant || (isObject(value) && typeof value.eval === "function" && value.constructor.name.includes("Boolean"));
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return isObject(value) && typeof value.eval === "function" && (value.constructor.name.includes("Sites") || value.constructor.name.includes("Region"));
}

function isDirectionsFunction(value: unknown): value is DirectionsFunction {
  return isObject(value) && typeof value.eval === "function" && (value.constructor.name.includes("Direction") || value.constructor.name.includes("Directions"));
}

function isGraphFunction(value: unknown): value is GraphFunction {
  return value instanceof BaseGraphFunction
    || (isObject(value) && typeof value.eval === "function" && (value.constructor.name.includes("Graph") || value.constructor.name.includes("Basis") || value instanceof GraphAdd || value instanceof GraphRemove || value instanceof GraphUnion || value instanceof Quadhex));
}

function isThenLike(value: unknown): boolean {
  return isObject(value) && typeof value.moves === "function";
}

function isPieceLike(value: unknown): value is {
  getName(): string | null;
  getNames(): string[] | null;
  component(): IntFunction | null;
  components(): IntFunction[] | null;
} {
  return isObject(value) && typeof value.getName === "function" && typeof value.component === "function";
}
