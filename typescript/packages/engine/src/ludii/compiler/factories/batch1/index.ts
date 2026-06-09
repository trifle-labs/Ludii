import type { ArgBundle } from "../../ArgBundle.js";
import type { LudemeRegistry } from "../../LudemeRegistry.js";

import type {
  BooleanFunction,
  FloatFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
  RoleType as BaseRoleType,
} from "../../../../ludemes/base.js";
import type { Context } from "../../../../context.js";
import { BooleanConstant } from "../../../../ludemes/game/functions/booleans/BooleanConstant.js";
import { Can } from "../../../../ludemes/game/functions/booleans/can/Can.js";
import { CanType } from "../../../../ludemes/game/functions/booleans/can/CanType.js";
import { IfBool1to1 } from "../../../../ludemes/game/functions/booleans/math1to1/IfBool1to1.js";
import { NoMoves } from "../../../../ludemes/game/functions/booleans/no1to1/NoMoves.js";
import { NoPieces1to1 } from "../../../../ludemes/game/functions/booleans/no1to1/NoPieces.js";
import { IsFreedom1to1 } from "../../../../ludemes/game/functions/booleans/is/component1to1/IsFreedom1to1.js";
import { IsWithin } from "../../../../ludemes/game/functions/booleans/is/component/IsWithin.js";
import { IsIn1to1 } from "../../../../ludemes/game/functions/booleans/is/in1to1/IsIn1to1.js";
import { IsEven1to1 } from "../../../../ludemes/game/functions/booleans/is/integer1to1/IsEven1to1.js";
import { IsFlat1to1 } from "../../../../ludemes/game/functions/booleans/is/integer1to1/IsFlat1to1.js";
import { IsOdd1to1 } from "../../../../ludemes/game/functions/booleans/is/integer1to1/IsOdd1to1.js";
import { IsVisited1to1 } from "../../../../ludemes/game/functions/booleans/is/integer1to1/IsVisited1to1.js";
import { IsPipsMatch } from "../../../../ludemes/game/functions/booleans/is/integer/IsPipsMatch.js";
import { IsSidesMatch } from "../../../../ludemes/game/functions/booleans/is/integer/IsSidesMatch.js";
import { IsTarget1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsTarget1to1.js";
import { IsTriggered1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsTriggered1to1.js";
import { IsLine } from "../../../../ludemes/game/functions/booleans/is/line/IsLine.js";
import { IsRelated1to1 } from "../../../../ludemes/game/functions/booleans/is/related/IsRelated1to1.js";
import { AllDifferent } from "../../../../ludemes/game/functions/booleans/deductionPuzzle/all/AllDifferent.js";
import { IsUnique } from "../../../../ludemes/game/functions/booleans/deductionPuzzle/is/graph/IsUnique.js";
import { IsCount } from "../../../../ludemes/game/functions/booleans/deductionPuzzle/is/regionResult/IsCount.js";
import { IsSum } from "../../../../ludemes/game/functions/booleans/deductionPuzzle/is/regionResult/IsSum.js";
import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import type { JavaIntFunction } from "../../../../ludemes/game/functions/ints/IntFunction.js";
import { Counter1to1 } from "../../../../ludemes/game/functions/ints1to1/state/State1to1.js";
import { CardTrumpSuit1to1 } from "../../../../ludemes/game/functions/ints/card/simple/CardTrumpSuit1to1.js";
import { CardRank } from "../../../../ludemes/game/functions/ints/card/site/CardRank.js";
import { CardSuit } from "../../../../ludemes/game/functions/ints/card/site/CardSuit.js";
import { CardTrumpRank } from "../../../../ludemes/game/functions/ints/card/site/CardTrumpRank.js";
import { CardTrumpValue } from "../../../../ludemes/game/functions/ints/card/site/CardTrumpValue.js";
import { CentrePoint } from "../../../../ludemes/game/functions/ints/board/CentrePoint.js";
import { Column } from "../../../../ludemes/game/functions/ints/board/Column.js";
import { Coord } from "../../../../ludemes/game/functions/ints/board/Coord.js";
import { Cost } from "../../../../ludemes/game/functions/ints/board/Cost.js";
import { CountMoves1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountMoves1to1.js";
import { CountPieces1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountPieces1to1.js";
import { CountEdges1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountEdges1to1.js";
import { CountGroups1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountGroups1to1.js";
import { CountNumber1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountSimpleExtra1to1.js";
import { CountOff1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountOff1to1.js";
import { CountSiteNeighbours1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountSiteNeighbours1to1.js";
import { CountSites1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountSites1to1.js";
import { CountSizeBiggestGroup1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountSizeBiggestGroup1to1.js";
import { CountSizeBiggestLine } from "../../../../ludemes/game/functions/ints/count/sizeBiggestLine/CountSizeBiggestLine.js";
import { CountStack1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountStack1to1.js";
import { CountVertices1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountVertices1to1.js";
import { CountPhases } from "../../../../ludemes/game/functions/ints/count/simple/CountPhases.js";
import { CountTrials } from "../../../../ludemes/game/functions/ints/count/simple/CountTrials.js";
import { CountValue1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountValue1to1.js";
import {
  CountColumns1to1,
  CountMovesThisTurn1to1,
  CountPlayers1to1,
  CountRows1to1,
  CountTurns1to1,
} from "../../../../ludemes/game/functions/ints1to1/count/CountSimple1to1.js";
import { FloatCos1to1 } from "../../../../ludemes/game/functions/floats1to1/math/FloatMath1to1.js";
import type { GraphFunction } from "../../../../ludemes/game/functions/graph/GraphFunction.js";
import { Trajectories } from "../../../../eval/graph/trajectories.js";
import { constructBrick } from "../../../../ludemes/game/functions/graph/generators/basis/brick/Brick.js";
import type { BrickShapeType } from "../../../../ludemes/game/functions/graph/generators/basis/brick/BrickShapeType.js";
import { Celtic } from "../../../../ludemes/game/functions/graph/generators/basis/celtic/Celtic.js";
import { Concentric } from "../../../../ludemes/game/functions/graph/generators/shape/concentric/Concentric.js";
import type { ConcentricShapeType } from "../../../../ludemes/game/functions/graph/generators/shape/concentric/ConcentricShapeType.js";
import { Clip } from "../../../../ludemes/game/functions/graph/operators/Clip.js";
import { Complete } from "../../../../ludemes/game/functions/graph/operators/Complete.js";
import { RegionConstant } from "../../../../ludemes/game/functions/region/RegionConstant.js";
import { Board1to1 } from "../../../../ludemes/game/equipment/container/board/Board1to1.js";
import { Deck } from "../../../../ludemes/game/equipment/container/other/Deck.js";
import { Card as EquipmentCard, type CardType as EquipmentCardType } from "../../../../ludemes/game/equipment/component/Card.js";
import { Component } from "../../../../ludemes/game/equipment/component/Component.js";
import { Piece } from "../../../../ludemes/game/equipment/component/Piece.js";
import type { RoleType as EquipmentRoleType } from "../../../../ludemes/game/equipment/Item.js";
import { Regions } from "../../../../ludemes/game/equipment/other/Regions.js";
import { ByScore } from "../../../../ludemes/game/rules/end/ByScore.js";
import { Claim1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Claim1to1.js";
import { Custodial } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Custodial.js";
import { From1to1 } from "../../../../ludemes/game/util/moves/From1to1.js";
import { To1to1 } from "../../../../ludemes/game/util/moves/To1to1.js";

type SiteType = "Cell" | "Edge" | "Vertex";
type Point = readonly [number, number];

const MAX_DISTANCE = 1000;

export function registerBatch1(registry: LudemeRegistry): void {
  registry.registerLudeme("booleans.is.is:in", makeIsIn);
  registry.registerLudeme("booleans.is.is:is:in", makeIsIn);
  registry.registerLudeme("is:in", makeIsIn);
  registry.registerLudeme("booleans.is.is:freedom", makeIsFreedom);
  registry.registerLudeme("booleans.is.is:is:freedom", makeIsFreedom);
  registry.registerLudeme("is:freedom", makeIsFreedom);
  registry.registerLudeme("booleans.is.is:line", makeIsLine);
  registry.registerLudeme("booleans.is.is:is:line", makeIsLine);
  registry.registerLudeme("is:line", makeIsLine);
  registry.registerLudeme("booleans.is.is:related", makeIsRelated);
  registry.registerLudeme("booleans.is.is:is:related", makeIsRelated);
  registry.registerLudeme("is:related", makeIsRelated);
  registry.registerLudeme("booleans.is.is:target", makeIsTarget);
  registry.registerLudeme("booleans.is.is:is:target", makeIsTarget);
  registry.registerLudeme("is:target", makeIsTarget);
  registry.registerLudeme("booleans.is.is:even", (b) => new IsEven1to1(requireIntFunction(b, 1)));
  registry.registerLudeme("is:even", (b) => new IsEven1to1(requireIntFunction(b, 1)));
  registry.registerLudeme("booleans.is.is:odd", (b) => new IsOdd1to1(requireIntFunction(b, 1)));
  registry.registerLudeme("is:odd", (b) => new IsOdd1to1(requireIntFunction(b, 1)));
  registry.registerLudeme("booleans.is.is:flat", () => new IsFlat1to1());
  registry.registerLudeme("is:flat", () => new IsFlat1to1());
  registry.registerLudeme("booleans.is.is:visited", (b) => new IsVisited1to1(optionalIntFunction(b, 1) ?? lastTo()));
  registry.registerLudeme("is:visited", (b) => new IsVisited1to1(optionalIntFunction(b, 1) ?? lastTo()));
  registry.registerLudeme("booleans.is.is:pipsmatch", (b) => new IsPipsMatch(optionalIntFunction(b, 1)));
  registry.registerLudeme("is:pipsmatch", (b) => new IsPipsMatch(optionalIntFunction(b, 1)));
  registry.registerLudeme("booleans.is.is:sidesmatch", (b) => new IsSidesMatch(optionalIntFunction(b, 1)));
  registry.registerLudeme("is:sidesmatch", (b) => new IsSidesMatch(optionalIntFunction(b, 1)));
  registry.registerLudeme("booleans.is.is:within", makeIsWithin);
  registry.registerLudeme("booleans.is.is:is:within", makeIsWithin);
  registry.registerLudeme("is:within", makeIsWithin);
  registry.registerLudeme("booleans.is.is:is:connected", makeIsConnected);
  registry.registerLudeme("is:connected", makeIsConnected);
  registry.registerLudeme("booleans.is.is:is:triggered", makeIsTriggered);
  registry.registerLudeme("is:triggered", makeIsTriggered);
  registry.registerLudeme("booleans.is.is:connect", () => deferred("is Connect"));

  registry.registerLudeme("booleans.math.if:if", makeBooleanIf);
  registry.registerLudeme("if", makeBooleanIf);
  registry.registerLudeme("booleans.no.no:no", makeNo);
  registry.registerLudeme("brick:brick", makeBrick);
  registry.registerLudeme("byScore:byScore", (b, env) => {
    if (flatten(b.positional).length > 0) deferred("byScore finalScore");
    return new ByScore(null, boolNamed(b, "misere") ?? falseBool());
  });
  registry.registerLudeme("can:can", makeCan);
  registry.registerLudeme("card.card:card", makeCardInt);
  registry.registerLudeme("celtic:celtic", makeCeltic);
  registry.registerLudeme("centrePoint:centrePoint", (b) => new CentrePoint(siteTypeAt(b, 0)));
  registry.registerLudeme("claim:claim", makeClaim);
  registry.registerLudeme("clip:clip", (b) => new Clip(requireGraphFunction(b, 0), requirePolygon(b, 1)));
  registry.registerLudeme("column:column", (b) => new Column(asJavaIntFunction(requireNamedIntFunction(b, "of")), siteTypeAt(b, 0)));
  registry.registerLudeme("complete:complete", (b) => new Complete(requireGraphFunction(b, 0), booleanNamedValue(b, "eachcell") ?? false));
  registry.registerLudeme("component:component", makeComponent);
  registry.registerLudeme("component.card:card", makeEquipmentCard);
  registry.registerLudeme("component.piece:piece", makePiece);
  registry.registerLudeme("concentric:concentric", makeConcentric);
  registry.registerLudeme("concentric", makeConcentric);
  registry.registerLudeme("container.board.board:board", makeBoard);
  registry.registerLudeme("board", makeBoard);
  registry.registerLudeme("coord:coord", makeCoord);
  registry.registerLudeme("cos:cos", (b) => new FloatCos1to1(requireFloatFunction(b, 0)));
  registry.registerLudeme("cost:cost", (b) => new Cost(siteTypeAt(b, 0), asJavaIntFunctionOrNull(intNamed(b, "at")), regionNamed(b, "in")));
  registry.registerLudeme("count.count:count", makeCount);
  registry.registerLudeme("count", makeCount);
  registry.registerLudeme("count:pieces", makeCount);
  registry.registerLudeme("count:sites", makeCount);
  registry.registerLudeme("count:cell", makeCount);
  registry.registerLudeme("count:stack", makeCount);
  registry.registerLudeme("count:pips", makeCount);
  registry.registerLudeme("count:adjacent", makeCount);
  registry.registerLudeme("count:diagonal", makeCount);
  registry.registerLudeme("count:groups", makeCount);
  registry.registerLudeme("count:neighbours", makeCount);
  registry.registerLudeme("count:off", makeCount);
  registry.registerLudeme("count:orthogonal", makeCount);
  registry.registerLudeme("count:sizebiggestgroup", makeCount);
  registry.registerLudeme("counter:counter", () => new Counter1to1());
  registry.registerLudeme("countSizeBiggestGroup:countSizeBiggestGroup", (b) =>
    new CountSizeBiggestGroup1to1(boolNamed(b, "if") ?? boolNamed(b, "isvisible") ?? null),
  );
  registry.registerLudeme("custodial:custodial", makeCustodial);
  registry.registerLudeme("deck:deck", makeDeck);
  registry.registerLudeme("deductionPuzzle.all.all:different", makePuzzleAllDifferent);
  registry.registerLudeme("deductionPuzzle.is.is:unique", (b) => new IsUnique(firstSiteType(b)));
  registry.registerLudeme("deductionPuzzle.is.is:is", makePuzzleIs);
  registry.registerLudeme("regions", makeRegions);
  registry.registerLudeme("regionSite:regionSite", makeRegionSite);
  registry.registerLudeme("regionSite", makeRegionSite);
  registry.registerLudeme("sites", makeSites);
  registry.registerLudeme("sites:sites", makeSites);
  registry.registerLudeme("sites:side", makeSites);
  protectBatch1Factories(registry);
}

function protectBatch1Factories(registry: LudemeRegistry): void {
  const protectedKeys = new Set([
    "board",
    "concentric",
    "concentric:concentric",
    "container.board.board:board",
    "count",
    "count.count:count",
    "count:adjacent",
    "count:cell",
    "count:diagonal",
    "count:groups",
    "count:neighbours",
    "count:off",
    "count:orthogonal",
    "count:pieces",
    "count:pips",
    "count:sites",
    "count:sizebiggestgroup",
    "count:stack",
    "regionSite",
    "regionSite:regionSite",
    "sites",
    "sites:side",
    "sites:sites",
  ].map((key) => key.toLowerCase()));
  const original = registry.registerLudeme.bind(registry);
  registry.registerLudeme = ((key, factory) => {
    if (protectedKeys.has(key.toLowerCase())) return;
    original(key, factory);
  }) as LudemeRegistry["registerLudeme"];

  const raw = registry as unknown as { factories?: Map<string, Parameters<LudemeRegistry["registerLudeme"]>[1]> };
  if (raw.factories instanceof Map) {
    const originalSet = raw.factories.set.bind(raw.factories);
    raw.factories.set = ((key, factory) => {
      if (protectedKeys.has(String(key).toLowerCase())) return raw.factories!;
      return originalSet(key, factory);
    }) as typeof raw.factories.set;
  }
}

function makeIsIn(b: ArgBundle): BooleanFunction {
  const site = optionalIntFunction(b, 1) ?? lastTo();
  const region = firstRegionFunction(b);
  if (!region) deferred("is In");
  return new IsIn1to1(site, region);
}

function makeIsFreedom(b: ArgBundle): BooleanFunction {
  const region = firstRegionFunction(b);
  if (!region) deferred("is Freedom");
  const toPlace = flatten(b.positional).find((value): value is IntFunction => isIntFunction(value)) ?? null;
  return new IsFreedom1to1(firstSiteType(b), region, toPlace);
}

function makeIsLine(b: ArgBundle): BooleanFunction {
  const supportedNamed = new Set([
    "exact",
    "contiguous",
    "if",
    "bylevel",
    "top",
    "through",
    "throughany",
    "what",
    "whats",
    "throughhowmuch",
    "useopposites",
  ]);
  const unsupportedNamed = [...b.named.keys()].filter((key) => !supportedNamed.has(key));
  if (unsupportedNamed.length > 0) deferred(`is Line with ${unsupportedNamed.join(",")}`);
  const length = firstIntFunctionAfter(b, 0);
  if (!length) deferred("is Line");
  const dirn = b.positional.find((value): value is string =>
    typeof value === "string" && isLineDirection(value),
  ) ?? "Adjacent";
  const who = b.positional.find((value): value is string =>
    typeof value === "string" && isRoleLike(value) && value !== "All" && value !== "Each",
  ) ?? null;
  const what = intNamed(b, "what");
  const whats = intFunctionArrayNamed(b, "whats");
  return new IsLine(
    firstSiteType(b),
    length,
    dirn,
    intNamed(b, "through"),
    regionNamed(b, "throughany"),
    who,
    what,
    whats.length > 0 ? whats : null,
    booleanNamedValue(b, "exact") ?? false,
    boolNamed(b, "contiguous"),
    boolNamed(b, "if"),
    boolNamed(b, "bylevel"),
    boolNamed(b, "top"),
    intNamed(b, "throughhowmuch"),
    null,
    boolNamed(b, "useopposites"),
  );
}

function makeIsRelated(b: ArgBundle): BooleanFunction {
  const relation = stringAt(b, 1) ?? "Adjacent";
  const type = siteTypeAt(b, 2);
  const site = firstIntFunctionAfter(b, 1);
  const region = firstRegionFunction(b);
  if (!site || !region) deferred("is Related");
  return new IsRelated1to1(relation, type, site, region);
}

function makeIsTarget(b: ArgBundle): BooleanFunction {
  const configuration = numberArrayAt(b, 1) ?? numberArrayAt(b, 4);
  if (!configuration) deferred("is Target");
  return new IsTarget1to1(null, null, configuration, null, numberArrayNamed(b, "at"));
}

function makeIsWithin(b: ArgBundle): BooleanFunction {
  const region = regionNamed(b, "in");
  const locn = intNamed(b, "at");
  const pieceId = firstIntFunctionAfter(b, 0) ?? whatAt(locn ?? lastTo());
  return new IsWithin(pieceId, firstSiteType(b), locn, region);
}

function makeIsTriggered(b: ArgBundle): BooleanFunction {
  return new IsTriggered1to1(triggeredEvent(b), roleOrIntAt(b, 2) ?? roleOrIntAt(b, 1) ?? roleToIntFunction("Mover"), null);
}

function makeBooleanIf(b: ArgBundle): BooleanFunction {
  return new IfBool1to1(requireBooleanFunction(b, 0), requireBooleanFunction(b, 1), boolAt(b, 2));
}

function triggeredEvent(b: ArgBundle): string {
  return stringAt(b, 0) === "Triggered" ? stringAt(b, 1) ?? "" : stringAt(b, 0) ?? "";
}

function makeNo(b: ArgBundle): BooleanFunction {
  const kind = stringAt(b, 0);
  if (kind === "Moves") return new NoMoves(requireRole(b, 1));
  if (kind === "Pieces") {
    if (b.named.size > 0 || b.positional.some((v, i) => i > 0 && isRegionFunction(v))) {
      deferred("no Pieces with type/of/name/in arguments");
    }
    return new NoPieces1to1(undefined, (stringAt(b, 2) ?? stringAt(b, 1) ?? "All") as BaseRoleType);
  }
  deferred(`no ${kind ?? ""}`.trim());
}

function makeBrick(b: ArgBundle): GraphFunction {
  const shape = isBrickShape(stringAt(b, 0)) ? stringAt(b, 0) as BrickShapeType : null;
  const dims = numbers(b);
  if (dims.length === 0) deferred("brick");
  return constructBrick(shape, dims[0]!, dims[1], booleanNamedValue(b, "trim") ?? false);
}

function makeCan(b: ArgBundle): BooleanFunction {
  const type = stringAt(b, 0);
  if (type !== "Move") deferred(`can ${type ?? ""}`.trim());
  return Can.construct(CanType.Move, requireMovesWithCanMove(b, 1));
}

function makeCardInt(b: ArgBundle): IntFunction {
  const type = stringAt(b, 0);
  if (type === "TrumpSuit") return new CardTrumpSuit1to1();
  const at = asJavaIntFunction(requireNamedIntFunction(b, "at"));
  const level = asJavaIntFunctionOrNull(intNamed(b, "level")) ?? asJavaIntFunction(new IntConstant(0));
  if (type === "Rank") return new CardRank(at, level);
  if (type === "Suit") return new CardSuit(at, intNamed(b, "level") ? level : null);
  if (type === "TrumpRank") return new CardTrumpRank(at, level);
  if (type === "TrumpValue") return new CardTrumpValue(at, level);
  deferred(`card ${type ?? ""}`.trim());
}

function makeCeltic(b: ArgBundle): GraphFunction {
  const dims = numbers(b);
  if (dims.length === 0) deferred("celtic poly");
  return new Celtic(dims[0]!, dims[1]);
}

function makeClaim(b: ArgBundle): MovesFunction {
  const to = b.positional.find(isTo);
  if (!to) deferred("claim");
  return new Claim1to1(null, to, null);
}

function makeComponent(b: ArgBundle): Component {
  return new Component(
    requireString(b, 0),
    (stringAt(b, 1) ?? "Shared") as EquipmentRoleType,
    (arrayAt(b, 2) ?? null) as ConstructorParameters<typeof Component>[2],
    (b.positional[3] ?? null) as ConstructorParameters<typeof Component>[3],
    movesAt(b, 4),
    numberAt(b, 5),
    numberAt(b, 6),
    numberAt(b, 7),
  );
}

function makeEquipmentCard(b: ArgBundle): EquipmentCard {
  return new EquipmentCard(
    requireString(b, 0),
    (stringAt(b, 1) ?? "Shared") as EquipmentRoleType,
    stringAt(b, 2) as EquipmentCardType | null,
    numberNamed(b, "rank"),
    requireNamedNumber(b, "value"),
    numberNamed(b, "trumprank"),
    numberNamed(b, "trumpvalue"),
    numberNamed(b, "suit"),
    movesAt(b, 3) ?? firstMovesFunction(b),
    numberNamed(b, "maxstate"),
    numberNamed(b, "maxcount"),
    numberNamed(b, "maxvalue"),
  );
}

function makePiece(b: ArgBundle, env: { numPlayers: number }): Piece | Piece[] {
  const name = requireString(b, 0);
  const role = stringAt(b, 1) ?? "Each";
  const generator = firstMovesFunction(b);
  const build = (owner: number) => new Piece(name, owner, 0, generator);
  if (role === "Each") return Array.from({ length: env.numPlayers }, (_, i) => build(i + 1));
  return build(roleToOwner(role));
}

function makeConcentric(b: ArgBundle): GraphFunction {
  const first = stringAt(b, 0);
  const shape = isConcentricShape(first) ? first as ConcentricShapeType : undefined;
  const cells = firstNumberArray(b);
  const positionalNumbers = numbers(b);
  return Concentric.construct({
    shape,
    sides: numberNamed(b, "sides") ?? undefined,
    cells,
    rings: numberNamed(b, "rings") ?? (shape && positionalNumbers.length > 0 ? positionalNumbers[0] : undefined),
    steps: numberNamed(b, "steps") ?? undefined,
    midpoints: booleanNamedValue(b, "midpoints") ?? undefined,
    joinMidpoints: booleanNamedValue(b, "joinmidpoints") ?? undefined,
    joinCorners: booleanNamedValue(b, "joincorners") ?? undefined,
    stagger: booleanNamedValue(b, "stagger") ?? undefined,
  });
}

function makeBoard(b: ArgBundle): Board1to1 {
  const existing = b.positional.find((v): v is Board1to1 => v instanceof Board1to1);
  if (existing) return existing;
  const graphFn = b.positional.find(isGraphFunction);
  if (!graphFn) deferred("board");
  const siteType = siteTypeFromValue(b.named.get("use")) ?? "Cell";
  let graph = graphFn.eval(siteType);
  let traj = new Trajectories(graph, siteType);
  if (traj.numSites === 0 && (siteType === "Cell" || siteType === "Edge")) {
    graph = graphFn.eval("Vertex");
    traj = new Trajectories(graph, "Vertex");
  }
  if (traj.numSites === 0) return emptyGraphBoardFallback(b);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let site = 0; site < traj.numSites; site += 1) {
    minX = Math.min(minX, traj.xOf(site));
    maxX = Math.max(maxX, traj.xOf(site));
    minY = Math.min(minY, traj.yOf(site));
    maxY = Math.max(maxY, traj.yOf(site));
  }
  const width = Math.max(1, Math.ceil(maxX - minX) + 1);
  const height = Math.max(1, Math.ceil(maxY - minY) + 1);
  const board = new Board1to1(width, height, traj.numSites, traj, graph.faces.length);
  const sideMap = siteType === "Vertex" ? graph.measureSides().vertex : graph.measureSides().cell;
  if (sideMap.size > 0) {
    (board as Board1to1 & { sideRegions?: Partial<Record<string, readonly number[]>> }).sideRegions =
      Object.fromEntries(sideMap.entries());
  }
  return board;
}

function emptyGraphBoardFallback(b: ArgBundle): Board1to1 {
  const trackSites = flatten(b.positional)
    .map((value) => (value as { _track?: unknown })._track)
    .find(isNumberArray);
  if (trackSites && trackSites.length > 0) {
    return new Board1to1(Math.max(...trackSites) + 1, 1);
  }
  return new Board1to1(1, 1);
}

function makeCoord(b: ArgBundle): Coord {
  const type = siteTypeAt(b, 0);
  const coord = b.positional.find((v): v is string => typeof v === "string" && !isSiteType(v));
  if (coord) return new Coord(type, coord);
  return new Coord(type, asJavaIntFunction(requireNamedIntFunction(b, "row")), asJavaIntFunction(requireNamedIntFunction(b, "column")));
}

function makeCount(b: ArgBundle): IntFunction {
  const kind = stringAt(b, 0);
  const at = intNamed(b, "at") ?? intNamed(b, "to");
  const inRegion = regionNamed(b, "in");
  if (kind === null) {
    return new CountNumber1to1(regionFromAtOrIn(at, inRegion));
  }
  if (kind === "Adjacent") return new CountSiteNeighbours1to1(firstSiteFromAtOrIn(at, inRegion, lastTo()), "Adjacent");
  if (kind === "Orthogonal") return new CountSiteNeighbours1to1(firstSiteFromAtOrIn(at, inRegion, lastTo()), "Orthogonal");
  if (kind === "Diagonal") return new CountSiteNeighbours1to1(firstSiteFromAtOrIn(at, inRegion, lastTo()), "Diagonal");
  if (kind === "Neighbours") return new CountSiteNeighbours1to1(firstSiteFromAtOrIn(at, inRegion, lastTo()), "Adjacent");
  if (kind === "Off") return new CountOff1to1(at, inRegion);
  if (kind === "SitesPlatformBelow") return new IntConstant(0);
  if (kind === "Pieces") {
    const role = stringAt(b, 1) ?? "All";
    const of = intNamed(b, "of");
    const who = of ?? roleToIntFunction(role);
    return new CountPieces1to1(who, inRegion, stringNamed(b, "name"), !of && (role === "All" || role === "Any" || role === "Each"));
  }
  if (kind === "Moves") return new CountMoves1to1();
  if (kind === "Players") return new CountPlayers1to1();
  if (kind === "Turns") return new CountTurns1to1();
  if (kind === "MovesThisTurn") return new CountMovesThisTurn1to1();
  if (kind === "Trials") return new CountTrials();
  if (kind === "Phases") return new CountPhases();
  if (kind === "Value") return new CountValue1to1(requireIntFunction(b, 1), requireNamedIntArrayFunction(b, "in"));
  if (kind === "Pips") return countPips(roleOrIntAt(b, 1) ?? intNamed(b, "of") ?? roleToIntFunction("Shared"));
  if (kind === "LegalMoves" || kind === "Active") return new IntConstant(0);
  if (kind === "Cell" || kind === "Stack") {
    if (!at) return new IntConstant(0);
    return new CountStack1to1(at);
  }
  if (kind === "Sites") {
    return inRegion ? new CountSites1to1(inRegion) : { eval: (ctx) => (ctx.game as unknown as { equipment: { board: { numSites: number } } }).equipment.board.numSites };
  }
  if (kind === "Rows") {
    return new CountRows1to1();
  }
  if (kind === "Columns") {
    return new CountColumns1to1();
  }
  if (kind === "Cells") {
    return { eval: (ctx) => (ctx.game as unknown as { equipment: { board: { numSites: number } } }).equipment.board.numSites };
  }
  if (kind === "Vertices") {
    return new CountVertices1to1();
  }
  if (kind === "Edges") {
    return new CountEdges1to1();
  }
  if (kind === "Groups") {
    return new CountGroups1to1(boolNamed(b, "if"), intNamed(b, "min") ?? new IntConstant(0));
  }
  if (kind === "SizeBiggestGroup") {
    return new CountSizeBiggestGroup1to1(boolNamed(b, "if") ?? boolNamed(b, "isvisible") ?? null);
  }
  if (kind === "SizeBiggestLine") {
    return new CountSizeBiggestLine(
      siteTypeAt(b, 1),
      { name: stringAt(b, 2) ?? "Adjacent" },
      requireBaseBoolean(b, "if") as ConstructorParameters<typeof CountSizeBiggestLine>[2],
    );
  }
  deferred(`count ${kind ?? ""}`.trim());
}

function makeCustodial(b: ArgBundle): MovesFunction {
  const from = b.positional.find(isFrom);
  const between = b.positional.find(isBetweenLike) ?? {};
  const to = b.positional.find(isTo);
  return new Custodial({
    startLocationFn: from?.locFn() ?? lastTo(),
    dirnChoice: b.positional.find((v): v is string => typeof v === "string") ?? "Adjacent",
    minimum: between.min ?? new IntConstant(0),
    limit: between.max ?? new IntConstant(MAX_DISTANCE),
    targetRule: between.cond ?? falseBool(),
    targetEffect: between.effect ?? emptyMoves(),
    friendRule: to?.condFn() ?? falseBool(),
    then: null,
  });
}

function makeDeck(b: ArgBundle): Deck {
  const cards = flatten(b.positional).filter(isCardData);
  return new Deck(
    (stringAt(b, 0) ?? null) as EquipmentRoleType | null,
    numberNamed(b, "cardsbysuit"),
    numberNamed(b, "suits"),
    (cards.length > 0 ? cards : null) as ConstructorParameters<typeof Deck>[3],
  );
}

function makePuzzleAllDifferent(b: ArgBundle): BooleanFunction {
  const excepts = intFunctionArrayNamed(b, "excepts");
  return new AllDifferent(
    firstSiteType(b),
    firstRegionFunction(b),
    intNamed(b, "except"),
    excepts.length > 0 ? excepts : null,
  );
}

function makePuzzleIs(b: ArgBundle): BooleanFunction {
  const kind = stringAt(b, 0);
  const result = lastIntFunction(b);
  if (!result) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected result for deduction puzzle is`);
  if (kind === "Count") return new IsCount(firstSiteType(b), firstRegionFunction(b), intNamed(b, "of"), result);
  if (kind === "Sum") return new IsSum(firstSiteType(b), firstRegionFunction(b), firstNonSiteStringAfter(b, 0), result);
  if (kind === "Unique") return new IsUnique(firstSiteType(b));
  deferred(`deduction puzzle is ${kind ?? ""}`.trim());
}

function makeRegions(b: ArgBundle): Regions {
  const values = b.positional;
  const name = values.find((v): v is string => typeof v === "string" && !isRoleLike(v) && !isSiteType(v)) ?? null;
  const role = values.find((v): v is string => typeof v === "string" && isRoleLike(v)) ?? null;
  const intArray = values.find(isNumberArray) ?? null;
  const regionFns = flatten(values).filter(isRegionFunction);
  return new Regions(
    name,
    role as ConstructorParameters<typeof Regions>[1],
    intArray,
    regionFns.length === 1 ? regionFns[0]! : null,
    regionFns.length > 1 ? regionFns : null,
    null,
    null,
    null,
  );
}

function makeIsConnected(b: ArgBundle): BooleanFunction {
  const explicitRegions = flatten(b.positional).filter(isRegionFunction);
  const role = [...b.positional].reverse().find((v): v is string => typeof v === "string" && isRoleLike(v)) ?? "Mover";
  return {
    eval: (ctx) => {
      const pid = roleToIntFunction(role).eval(ctx);
      const targets = explicitRegions.length > 0 ? explicitRegions.map((r) => r.eval(ctx)) : playerConnectionRegions(ctx, pid);
      if (targets.length === 0) return false;
      return ownedComponentTouchesEveryTarget(ctx, pid, targets);
    },
  };
}

function playerConnectionRegions(ctx: Context, pid: number): number[][] {
  const equipment = (ctx.game as unknown as {
    equipment?: {
      playerRegions?: ReadonlyMap<number, RegionFunction>;
      namedPlayerRegions?: ReadonlyMap<string, ReadonlyMap<number, RegionFunction>>;
    };
  }).equipment;
  const region = equipment?.playerRegions?.get(pid);
  if (region) return [region.eval(ctx)];
  const out: number[][] = [];
  for (const byPlayer of equipment?.namedPlayerRegions?.values() ?? []) {
    const fn = byPlayer.get(pid);
    if (fn) out.push(fn.eval(ctx));
  }
  return out;
}

function ownedComponentTouchesEveryTarget(ctx: Context, pid: number, targets: readonly number[][]): boolean {
  const board = (ctx.game as unknown as { equipment: { board: Board1to1 } }).equipment.board;
  const owned = new Set<number>();
  for (let site = 0; site < board.numSites; site += 1) {
    if (ownerAt(ctx, site) === pid) owned.add(site);
  }
  if (owned.size === 0) return false;
  const targetSets = targets.map((sites) => new Set(sites));
  const seen = new Set<number>();
  for (const start of owned) {
    if (seen.has(start)) continue;
    const touched = new Set<number>();
    const stack = [start];
    seen.add(start);
    while (stack.length > 0) {
      const site = stack.pop()!;
      for (let i = 0; i < targetSets.length; i += 1) {
        if (targetSets[i]!.has(site)) touched.add(i);
      }
      for (const next of adjacentSites(board, site)) {
        if (!seen.has(next) && owned.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    if (touched.size === targetSets.length) return true;
  }
  return false;
}

function adjacentSites(board: Board1to1, site: number): number[] {
  const radials = board.radials[site]?.axes ?? [];
  const out = new Set<number>();
  for (const radial of radials) {
    const a = radial.ray[1];
    const b = radial.opposite[1];
    if (a !== undefined) out.add(a);
    if (b !== undefined) out.add(b);
  }
  return [...out];
}

function ownerAt(ctx: Context, site: number): number {
  const state = ctx.state as unknown as { cells?: readonly number[]; whoAtSite?: (site: number) => number };
  return state.whoAtSite?.(site) ?? state.cells?.[site] ?? 0;
}

function makeRegionSite(b: ArgBundle): IntFunction {
  const region = firstRegionFunction(b);
  const index = intNamed(b, "index") ?? optionalIntFunction(b, 1) ?? new IntConstant(0);
  if (!region) deferred("regionSite");
  return {
    eval: (ctx) => {
      const sites = region.eval(ctx);
      const i = index.eval(ctx);
      return i >= 0 && i < sites.length ? sites[i]! : -1;
    },
  };
}

function makeSites(b: ArgBundle): RegionFunction {
  const kind = stringAt(b, 0);
  const constantSites = firstNumberArray(b);
  if (constantSites) return new RegionConstant(constantSites);
  if (kind === "Side") return sideRegion(stringAt(b, 1), firstSiteType(b));
  if (kind === "Bottom") return sideRegion("S", firstSiteType(b));
  if (kind === "Top") return sideRegion("N", firstSiteType(b));
  if (kind === "Left") return sideRegion("W", firstSiteType(b));
  if (kind === "Right") return sideRegion("E", firstSiteType(b));
  if (kind === "Board") return allBoardSites();
  deferred(`sites ${kind ?? ""}`.trim());
}

function allBoardSites(): RegionFunction {
  return {
    eval: (ctx) => {
      const board = (ctx.game as unknown as { equipment: { board: { numSites: number } } }).equipment.board;
      return Array.from({ length: board.numSites }, (_, site) => site);
    },
  };
}

function sideRegion(direction: string | null, siteType: SiteType | null): RegionFunction {
  return {
    eval: (ctx) => {
      const dir = directionFromRole(direction, ctx);
      const board = (ctx.game as unknown as {
        equipment: {
          board: {
            width: number;
            height: number;
            numSites: number;
            trajectories: Trajectories | null;
            sideRegions?: Partial<Record<string, readonly number[]>>;
          };
        };
      }).equipment.board;
      const graphSide = board.sideRegions?.[dir];
      if (graphSide) return [...graphSide];
      const traj = board.trajectories;
      if (traj) return sitesByCompassBoundingBox(traj, dir);
      return flatSideSites(board.width, board.height, dir, siteType);
    },
  };
}

function flatSideSites(width: number, height: number, direction: string, _siteType: SiteType | null): number[] {
  const out: number[] = [];
  const wantN = direction.includes("N");
  const wantS = direction.includes("S");
  const wantE = direction.includes("E");
  const wantW = direction.includes("W");
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      if (wantN && row !== height - 1) continue;
      if (wantS && row !== 0) continue;
      if (wantE && col !== width - 1) continue;
      if (wantW && col !== 0) continue;
      if (!wantN && !wantS && !wantE && !wantW) continue;
      out.push(row * width + col);
    }
  }
  return out;
}

function sitesByCompassBoundingBox(traj: Trajectories, direction: string): number[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let site = 0; site < traj.numSites; site += 1) {
    minX = Math.min(minX, traj.xOf(site));
    maxX = Math.max(maxX, traj.xOf(site));
    minY = Math.min(minY, traj.yOf(site));
    maxY = Math.max(maxY, traj.yOf(site));
  }
  const tol = 0.001;
  const wantN = direction.includes("N");
  const wantS = direction.includes("S");
  const wantE = direction.includes("E");
  const wantW = direction.includes("W");
  const out: number[] = [];
  for (let site = 0; site < traj.numSites; site += 1) {
    const x = traj.xOf(site);
    const y = traj.yOf(site);
    if (wantN && Math.abs(y - maxY) > tol) continue;
    if (wantS && Math.abs(y - minY) > tol) continue;
    if (wantE && Math.abs(x - maxX) > tol) continue;
    if (wantW && Math.abs(x - minX) > tol) continue;
    if (!wantN && !wantS && !wantE && !wantW) continue;
    out.push(site);
  }
  return out;
}

function directionFromRole(direction: string | null, ctx: Context): string {
  if (direction && isCompassDirection(direction)) return direction;
  if (direction === "P1" || direction === "South") return "S";
  if (direction === "P2" || direction === "North") return "N";
  if (direction === "P3" || direction === "West") return "W";
  if (direction === "P4" || direction === "East") return "E";
  if (direction === "Mover") return ctx.state.mover === 2 ? "N" : "S";
  return "N";
}

function regionFromAtOrIn(at: IntFunction | null, region: RegionFunction | null): RegionFunction {
  if (region) return region;
  const siteFn = at ?? lastTo();
  return {
    eval: (ctx) => {
      const site = siteFn.eval(ctx);
      return site >= 0 ? [site] : [];
    },
  };
}

function firstSiteFromAtOrIn(at: IntFunction | null, region: RegionFunction | null, fallback: IntFunction): IntFunction {
  if (!region) return at ?? fallback;
  return {
    eval: (ctx) => region.eval(ctx)[0] ?? -1,
  };
}

function countPips(who: IntFunction): IntFunction {
  return {
    eval: (ctx) => {
      const pid = who.eval(ctx);
      const state = ctx.state as unknown as { sumDice?: (index: number) => number };
      const game = ctx.game as unknown as { handDice?: Array<{ owner?: number }> | (() => Array<{ owner?: () => number }>) };
      const handDice = typeof game.handDice === "function" ? game.handDice() : game.handDice;
      if (!handDice) return 0;
      for (let i = 0; i < handDice.length; i += 1) {
        const dice = handDice[i]!;
        const owner = typeof dice.owner === "function" ? dice.owner() : dice.owner;
        if (owner === pid) return state.sumDice?.(i) ?? 0;
      }
      return 0;
    },
  };
}

function deferred(keyword: string): never {
  throw new Error(`factory not yet wired: ${keyword}`);
}

function flatten(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value)) out.push(...flatten(value));
    else out.push(value);
  }
  return out;
}

function stringAt(b: ArgBundle, index: number): string | null {
  const value = b.positional[index];
  return typeof value === "string" ? value : null;
}

function stringNamed(b: ArgBundle, name: string): string | null {
  const value = b.named.get(name);
  return typeof value === "string" ? value : null;
}

function requireString(b: ArgBundle, index: number): string {
  const value = stringAt(b, index);
  if (value === null) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected string at ${index}`);
  return value;
}

function numberAt(b: ArgBundle, index: number): number | null {
  const value = b.positional[index];
  return typeof value === "number" ? value : null;
}

function numbers(b: ArgBundle): number[] {
  return flatten(b.positional).filter((v): v is number => typeof v === "number");
}

function numberNamed(b: ArgBundle, name: string): number | null {
  const value = b.named.get(name);
  return typeof value === "number" ? value : null;
}

function requireNamedNumber(b: ArgBundle, name: string): number {
  const value = numberNamed(b, name);
  if (value === null) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected named number ${name}`);
  return value;
}

function booleanNamedValue(b: ArgBundle, name: string): boolean | null {
  const value = b.named.get(name);
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return null;
}

function boolAt(b: ArgBundle, index: number): BooleanFunction | null {
  const value = b.positional[index];
  return isBooleanFunction(value) ? value : null;
}

function boolNamed(b: ArgBundle, name: string): BooleanFunction | null {
  const value = b.named.get(name);
  if (isBooleanFunction(value)) return value;
  if (typeof value === "boolean") return new BooleanConstant(value);
  return null;
}

function requireBooleanFunction(b: ArgBundle, index: number): BooleanFunction {
  const value = boolAt(b, index);
  if (!value) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected boolean function at ${index}`);
  return value;
}

function falseBool(): BooleanFunction {
  return new BooleanConstant(false);
}

function requireBaseBoolean(b: ArgBundle, name: string): BooleanConstant {
  const value = boolNamed(b, name);
  if (value instanceof BooleanConstant) return value;
  if (!value) return new BooleanConstant(true);
  return value as BooleanConstant;
}

function optionalIntFunction(b: ArgBundle, index: number): IntFunction | null {
  const value = b.positional[index];
  return isIntFunction(value) ? value : typeof value === "number" ? new IntConstant(value) : null;
}

function requireIntFunction(b: ArgBundle, index: number): IntFunction {
  const value = optionalIntFunction(b, index);
  if (!value) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected int function at ${index}`);
  return value;
}

function intNamed(b: ArgBundle, name: string): IntFunction | null {
  const value = b.named.get(name);
  return isIntFunction(value) ? value : typeof value === "number" ? new IntConstant(value) : null;
}

function requireNamedIntFunction(b: ArgBundle, name: string): IntFunction {
  const value = intNamed(b, name);
  if (!value) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected named int ${name}`);
  return value;
}

function requireNamedIntArrayFunction(b: ArgBundle, name: string): IntArrayFunction {
  const value = b.named.get(name);
  if (isIntArrayFunction(value)) return value;
  throw new Error(`factory ${b.symbol}:${b.constructKey}: expected named int array ${name}`);
}

function intFunctionArrayNamed(b: ArgBundle, name: string): IntFunction[] {
  const value = b.named.get(name);
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (isIntFunction(item)) return item;
    if (typeof item === "number") return new IntConstant(item);
    throw new Error(`factory ${b.symbol}:${b.constructKey}: expected named int array ${name}`);
  });
}

function asJavaIntFunction(fn: IntFunction): JavaIntFunction {
  const maybe = fn as Partial<JavaIntFunction>;
  return {
    eval: fn.eval.bind(fn),
    exceeds: maybe.exceeds?.bind(fn) ?? ((ctx, other) => fn.eval(ctx) > other.eval(ctx)),
    isHint: maybe.isHint?.bind(fn) ?? (() => false),
    isHand: maybe.isHand?.bind(fn) ?? (() => false),
    concepts: maybe.concepts?.bind(fn) ?? (() => new Set<number>()),
    readsEvalContextRecursive: maybe.readsEvalContextRecursive?.bind(fn) ?? (() => new Set<number>()),
    writesEvalContextRecursive: maybe.writesEvalContextRecursive?.bind(fn) ?? (() => new Set<number>()),
    missingRequirement: maybe.missingRequirement?.bind(fn) ?? (() => false),
    willCrash: maybe.willCrash?.bind(fn) ?? (() => false),
    toEnglish: maybe.toEnglish?.bind(fn) ?? (() => "an integer"),
  };
}

function asJavaIntFunctionOrNull(fn: IntFunction | null): JavaIntFunction | null {
  return fn === null ? null : asJavaIntFunction(fn);
}

function firstIntFunctionAfter(b: ArgBundle, start: number): IntFunction | null {
  for (let i = start + 1; i < b.positional.length; i++) {
    const value = optionalIntFunction(b, i);
    if (value) return value;
  }
  return null;
}

function lastIntFunction(b: ArgBundle): IntFunction | null {
  for (let i = b.positional.length - 1; i >= 0; i--) {
    const value = optionalIntFunction(b, i);
    if (value) return value;
  }
  return null;
}

function regionNamed(b: ArgBundle, name: string): RegionFunction | null {
  const value = b.named.get(name);
  return isRegionFunction(value) ? value : null;
}

function firstRegionFunction(b: ArgBundle): RegionFunction | null {
  return flatten(b.positional).find(isRegionFunction) ?? null;
}

function movesAt(b: ArgBundle, index: number): MovesFunction | null {
  const value = b.positional[index];
  return isMovesFunction(value) ? value : null;
}

function firstMovesFunction(b: ArgBundle): MovesFunction | null {
  return flatten(b.positional).find(isMovesFunction) ?? null;
}

function requireFloatFunction(b: ArgBundle, index: number): FloatFunction {
  const value = b.positional[index];
  if (isFloatFunction(value)) return value;
  if (typeof value === "number") return { eval: () => value };
  throw new Error(`factory ${b.symbol}:${b.constructKey}: expected float function at ${index}`);
}

function requireGraphFunction(b: ArgBundle, index: number): GraphFunction {
  const value = b.positional[index];
  if (!isGraphFunction(value)) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected graph at ${index}`);
  return value;
}

function requirePolygon(b: ArgBundle, index: number): readonly Point[] {
  const value = b.positional[index];
  if (Array.isArray(value) && value.every(isPoint)) return value;
  throw new Error(`factory ${b.symbol}:${b.constructKey}: expected polygon at ${index}`);
}

function numberArrayAt(b: ArgBundle, index: number): number[] | null {
  const value = b.positional[index];
  return isNumberArray(value) ? value : null;
}

function numberArrayNamed(b: ArgBundle, name: string): number[] | null {
  const value = b.named.get(name);
  return isNumberArray(value) ? value : null;
}

function firstNumberArray(b: ArgBundle): number[] | undefined {
  return findNumberArray(b.positional);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === "number");
}

function findNumberArray(values: readonly unknown[]): number[] | undefined {
  for (const value of values) {
    if (isNumberArray(value)) return value;
    if (Array.isArray(value)) {
      const nested = findNumberArray(value);
      if (nested) return nested;
    }
  }
  return undefined;
}

function arrayAt(b: ArgBundle, index: number): unknown[] | null {
  const value = b.positional[index];
  return Array.isArray(value) ? value : null;
}

function siteTypeAt(b: ArgBundle, index: number): SiteType | null {
  const value = stringAt(b, index);
  return siteTypeFromValue(value);
}

function firstSiteType(b: ArgBundle): SiteType | null {
  return flatten(b.positional).find(isSiteType) ?? null;
}

function siteTypeFromValue(value: unknown): SiteType | null {
  return isSiteType(value) ? value : null;
}

function firstNonSiteStringAfter(b: ArgBundle, start: number): string | null {
  for (let i = start + 1; i < b.positional.length; i++) {
    const value = b.positional[i];
    if (typeof value === "string" && !isSiteType(value)) return value;
  }
  return null;
}

function requireRole(b: ArgBundle, index: number): BaseRoleType {
  const value = stringAt(b, index);
  if (value === null) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected role at ${index}`);
  return value as BaseRoleType;
}

function lastTo(): IntFunction {
  return { eval: (ctx) => ctx._evalTo };
}

function whatAt(site: IntFunction): IntFunction {
  return { eval: (ctx) => ctx.state.whatAtSite(site.eval(ctx)) };
}

function emptyMoves(): MovesFunction {
  return { eval: () => [] };
}

function requireMovesWithCanMove(b: ArgBundle, index: number): Parameters<typeof Can.construct>[1] {
  const value = b.positional[index];
  if (isMovesFunction(value)) return value as Parameters<typeof Can.construct>[1];
  throw new Error(`factory ${b.symbol}:${b.constructKey}: expected moves at ${index}`);
}

function roleToOwner(role: string): number {
  if (role === "Shared" || role === "Neutral") return 0;
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  return 0;
}

function roleToIntFunction(role: string): IntFunction {
  if (role === "Shared" || role === "Neutral") return new IntConstant(0);
  if (role === "Mover") return { eval: (ctx) => ctx.state.mover };
  if (role === "Next") return { eval: (ctx) => (ctx.state.mover % ctx.game.numPlayers) + 1 };
  if (role === "Prev") {
    return {
      eval: (ctx) => {
        const n = ctx.game.numPlayers;
        return ((ctx.state.mover - 2 + n) % n) + 1;
      },
    };
  }
  if (/^P\d+$/.test(role)) return new IntConstant(Number(role.slice(1)));
  return new IntConstant(0);
}

function roleOrIntAt(b: ArgBundle, index: number): IntFunction | null {
  return optionalIntFunction(b, index) ?? (stringAt(b, index) ? roleToIntFunction(stringAt(b, index)!) : null);
}

function isSiteType(value: unknown): value is SiteType {
  return value === "Cell" || value === "Edge" || value === "Vertex";
}

function isCompassDirection(value: unknown): value is string {
  return typeof value === "string" && (
    value === "N" || value === "NNE" || value === "NE" || value === "ENE" ||
    value === "E" || value === "ESE" || value === "SE" || value === "SSE" ||
    value === "S" || value === "SSW" || value === "SW" || value === "WSW" ||
    value === "W" || value === "WNW" || value === "NW" || value === "NNW"
  );
}

function isLineDirection(value: unknown): value is string {
  if (typeof value !== "string" || value.includes(":") || value === "Line" || isSiteType(value) || isRoleLike(value)) {
    return false;
  }
  return value === "Adjacent" || value === "All" || value === "Orthogonal" || value === "Diagonal" ||
    value === "SameLayer" || isCompassDirection(value) ||
    value === "DNE" || value === "DNW" || value === "DSE" || value === "DSW";
}

function isRoleLike(value: string): boolean {
  return value === "Mover" || value === "Next" || value === "All" || value === "Each" || /^P\d+$/.test(value);
}

function isBrickShape(value: unknown): value is BrickShapeType {
  return value === "Square" || value === "Rectangle" || value === "Diamond" || value === "Prism" || value === "Spiral" || value === "Limping";
}

function isConcentricShape(value: unknown): value is ConcentricShapeType {
  return value === "Square" || value === "Triangle" || value === "Hexagon" || value === "Target";
}

function isPoint(value: unknown): value is Point {
  return Array.isArray(value) && value.length === 2 && value.every((v) => typeof v === "number");
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return typeof (value as BooleanFunction | null)?.eval === "function";
}

function isIntFunction(value: unknown): value is IntFunction {
  return typeof (value as IntFunction | null)?.eval === "function";
}

function isIntArrayFunction(value: unknown): value is IntArrayFunction {
  return typeof (value as IntArrayFunction | null)?.eval === "function";
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return typeof (value as RegionFunction | null)?.eval === "function";
}

function isMovesFunction(value: unknown): value is MovesFunction {
  return typeof (value as MovesFunction | null)?.eval === "function";
}

function isFloatFunction(value: unknown): value is FloatFunction {
  return typeof (value as FloatFunction | null)?.eval === "function";
}

function isGraphFunction(value: unknown): value is GraphFunction {
  return typeof (value as GraphFunction | null)?.eval === "function" && typeof (value as GraphFunction | null)?.dim === "function";
}

function isTo(value: unknown): value is To1to1 {
  return value instanceof To1to1;
}

function isFrom(value: unknown): value is From1to1 {
  return value instanceof From1to1;
}

function isBetweenLike(value: unknown): value is {
  min?: IntFunction;
  max?: IntFunction;
  cond?: BooleanFunction;
  effect?: MovesFunction;
} {
  return typeof value === "object" && value !== null && ("min" in value || "max" in value || "cond" in value || "effect" in value);
}

function isCardData(value: unknown): value is {
  value: number;
  trumpValue: number;
  rank: number;
  trumpRank: number;
  biased: number;
  type: EquipmentCardType | null;
} {
  return typeof value === "object" && value !== null &&
    typeof (value as { value?: unknown }).value === "number" &&
    typeof (value as { trumpValue?: unknown }).trumpValue === "number" &&
    typeof (value as { rank?: unknown }).rank === "number" &&
    typeof (value as { trumpRank?: unknown }).trumpRank === "number" &&
    typeof (value as { biased?: unknown }).biased === "number";
}
