import type { ArgBundle } from "../../ArgBundle.js";
import type { LudemeRegistry } from "../../LudemeRegistry.js";

import type {
  BooleanFunction,
  DirectionsFunction,
  EndRuleFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "../../../../ludemes/base.js";
import { BooleanConstant } from "../../../../ludemes/game/functions/booleans/BooleanConstant.js";
import { IsSolved } from "../../../../ludemes/game/functions/booleans/deductionPuzzle/is/simple/IsSolved.js";
import { IsIn1to1 } from "../../../../ludemes/game/functions/booleans/is/in1to1/IsIn1to1.js";
import { IsRepeat1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsRepeat1to1.js";
import { IsLastFrom1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsLastFrom1to1.js";
import { IsLastTo1to1 } from "../../../../ludemes/game/functions/booleans/is/is1to1/IsLastTo1to1.js";
import { IsEven1to1 } from "../../../../ludemes/game/functions/booleans/is/integer1to1/IsEven1to1.js";
import { IsOdd1to1 } from "../../../../ludemes/game/functions/booleans/is/integer1to1/IsOdd1to1.js";
import { IsFull1to1 } from "../../../../ludemes/game/functions/booleans/is/simple1to1/IsFull1to1.js";
import { IsPending1to1 } from "../../../../ludemes/game/functions/booleans/is/simple1to1/IsPending1to1.js";
import { IsBlocked1to1 } from "../../../../ludemes/game/functions/booleans/is/simple1to1/IsBlocked1to1.js";
import { IsEmpty1to1 } from "../../../../ludemes/game/functions/booleans/is/site1to1/IsEmpty1to1.js";
import { IsOccupied1to1 } from "../../../../ludemes/game/functions/booleans/is/site1to1/IsOccupied1to1.js";
import { IsActive1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsActive1to1.js";
import { IsEnemy1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsEnemy1to1.js";
import { IsFriend1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsFriend1to1.js";
import { IsMover1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsMover1to1.js";
import { IsNext1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsNext1to1.js";
import { IsPrev1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsPrev1to1.js";
import { DimAbs1to1 } from "../../../../ludemes/game/functions/dim/math/Abs1to1.js";
import { DimAdd1to1 } from "../../../../ludemes/game/functions/dim/math/Add1to1.js";
import { DimDiv1to1 } from "../../../../ludemes/game/functions/dim/math/Div1to1.js";
import { DimMax1to1 } from "../../../../ludemes/game/functions/dim/math/Max1to1.js";
import { DimMin1to1 } from "../../../../ludemes/game/functions/dim/math/Min1to1.js";
import { DimMul1to1 } from "../../../../ludemes/game/functions/dim/math/Mul1to1.js";
import { DimPow1to1 } from "../../../../ludemes/game/functions/dim/math/Pow1to1.js";
import { DimSub1to1 } from "../../../../ludemes/game/functions/dim/math/Sub1to1.js";
import { DimConstant1to1, type DimFunction1to1 } from "../../../../ludemes/game/functions/dim/DimConstant1to1.js";
import { Who1to1 } from "../../../../ludemes/game/functions/ints1to1/board/Board1to1.js";
import { Difference } from "../../../../ludemes/game/functions/directions/Difference.js";
import { Directions1to1Static } from "../../../../ludemes/game/functions/directions/Directions1to1.js";
import { If as DirectionIf } from "../../../../ludemes/game/functions/directions/If.js";
import { Union } from "../../../../ludemes/game/functions/directions/Union.js";
import { Face } from "../../../../ludemes/game/functions/ints/dice/Face.js";
import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { Dual } from "../../../../ludemes/game/functions/graph/operators/Dual.js";
import { Concentric } from "../../../../ludemes/game/functions/graph/generators/shape/concentric/Concentric.js";
import type { ConcentricShapeType } from "../../../../ludemes/game/functions/graph/generators/shape/concentric/ConcentricShapeType.js";
import type { GraphFunction } from "../../../../ludemes/game/functions/graph/GraphFunction.js";
import { Trajectories } from "../../../../eval/graph/trajectories.js";
import { Dice } from "../../../../ludemes/game/equipment/container/other/Dice.js";
import { Die } from "../../../../ludemes/game/equipment/component/Die.js";
import { Card as EquipmentCard } from "../../../../ludemes/game/util/equipment/Card.js";
import { Domino } from "../../../../ludemes/game/equipment/component/tile/Domino.js";
import { Dominoes } from "../../../../ludemes/game/equipment/other/Dominoes.js";
import { Regions } from "../../../../ludemes/game/equipment/other/Regions.js";
import { Equipment1to1 } from "../../../../ludemes/game/equipment/Equipment1to1.js";
import { Board1to1 } from "../../../../ludemes/game/equipment/container/board/Board1to1.js";
import { Piece } from "../../../../ludemes/game/equipment/component/Piece.js";
import type { Item, RoleType as EquipmentRoleType } from "../../../../ludemes/game/equipment/Item.js";
import { Hint } from "../../../../ludemes/game/util/equipment/Hint.js";
import { CountPieces1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountPieces1to1.js";
import { CountSites1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountSites1to1.js";
import { CountValue1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountValue1to1.js";
import { CountCells1to1, CountPhases1to1, CountNumber1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountSimpleExtra1to1.js";
import {
  CountColumns1to1,
  CountMovesThisTurn1to1,
  CountPlayers1to1,
  CountRows1to1,
  CountTurns1to1,
} from "../../../../ludemes/game/functions/ints1to1/count/CountSimple1to1.js";
import { CountMoves1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountMoves1to1.js";
import { CountEdges1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountEdges1to1.js";
import { CountVertices1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountVertices1to1.js";
import { CountSizeBiggestGroup1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountSizeBiggestGroup1to1.js";
import { CountTrials } from "../../../../ludemes/game/functions/ints/count/simple/CountTrials.js";
import {
  SitesBottom,
  SitesTop,
  SitesLeft,
  SitesRight,
  UnionRegion,
} from "../../../../ludemes/game/functions/region/sites/simple/SitesSide1to1.js";
import { SitesContext } from "../../../../ludemes/game/functions/region/sites/context/SitesContext.js";
import { SitesHand } from "../../../../ludemes/game/functions/region/sites/player/SitesHand.js";
import { SitesEquipmentRegion } from "../../../../ludemes/game/functions/region/sites/player/SitesEquipmentRegion.js";
import { Set as DeductionSet } from "../../../../ludemes/game/rules/start/deductionPuzzle/Set.js";
import { Rules1to1 } from "../../../../ludemes/game/rules/Rules1to1.js";
import { Play1to1 } from "../../../../ludemes/game/rules/play/Play1to1.js";
import { Phase } from "../../../../ludemes/game/rules/phase/Phase.js";
import { End } from "../../../../ludemes/game/rules/end/End.js";
import { ForEach as EndForEach } from "../../../../ludemes/game/rules/end/ForEach.js";
import { If as EndIf } from "../../../../ludemes/game/rules/end/If.js";
import { Result } from "../../../../ludemes/game/rules/end/Result.js";
import { Score } from "../../../../ludemes/game/util/end/Score.js";
import { Add } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Add.js";
import { Deal } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Deal.js";
import { Directional } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Directional.js";
import { Do } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/requirement/Do.js";
import { Enclose } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Enclose.js";
import { Remove } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Remove.js";
import { Step } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Step.js";
import { Then } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Then.js";
import { SetHidden } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/hidden/SetHidden.js";
import { SetNextPlayer } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/nextPlayer/SetNextPlayer.js";
import { SetScore1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/player/SetScore1to1.js";
import { SetValuePlayer } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/player/SetValuePlayer.js";
import { SetPending } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/pending/SetPending.js";
import { SetRotation } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/direction/SetRotation.js";
import { SetCount1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/site/SetCount1to1.js";
import { SetState1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/site/SetState1to1.js";
import { SetValue } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/site/SetValue.js";
import { SetTrumpSuit } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/suit/SetTrumpSuit.js";
import { SetTeam } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/team/SetTeam.js";
import { SetVar1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/var/SetVar1to1.js";
import { SetCounter } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/value/SetCounter.js";
import { SetPot } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/value/SetPot.js";
import { From1to1 } from "../../../../ludemes/game/util/moves/From1to1.js";
import { Piece1to1 } from "../../../../ludemes/game/util/moves/Piece1to1.js";
import { To1to1 } from "../../../../ludemes/game/util/moves/To1to1.js";

type SiteType = "Cell" | "Edge" | "Vertex";
type HiddenData = "What" | "Who" | "State" | "Count" | "Rotation" | "Value";
type RegistryWithPatch = LudemeRegistry & { __batch2ProtectedKeys?: Set<string> };

const ABSOLUTE_DIRECTIONS = new Set([
  "All", "Angled", "Adjacent", "Axial", "Orthogonal", "Diagonal",
  "OffDiagonal", "SameLayer", "Upward", "Downward", "Rotational",
  "Base", "Support", "N", "E", "S", "W", "NE", "SE", "NW", "SW",
  "NNW", "WNW", "WSW", "SSW", "SSE", "ESE", "ENE", "NNE",
  "CW", "CCW", "In", "Out", "U", "UN", "UNE", "UE", "USE", "US",
  "USW", "UW", "UNW", "D", "DN", "DNE", "DE", "DSE", "DS", "DSW",
  "DW", "DNW",
]);

export function registerBatch2(registry: LudemeRegistry): void {
  forceRegister(registry, "board", makeBoardFallback);
  forceRegister(registry, "container.board.board:board", makeBoardFallback);
  forceRegister(registry, "booleans.is.is:is:connected", makeConnectedFallback);
  forceRegister(registry, "is:connected", makeConnectedFallback);
  forceRegister(registry, "concentric", makeConcentricFallback);
  forceRegister(registry, "concentric:concentric", makeConcentricFallback);
  forceRegister(registry, "count", makeCountFallback);
  forceRegister(registry, "count.count:count", makeCountFallback);
  forceRegister(registry, "count:pieces", makeCountFallback);
  forceRegister(registry, "count:sites", makeCountFallback);
  forceRegister(registry, "count:sizebiggestgroup", makeCountFallback);
  forceRegister(registry, "is", makeIsFallback);
  forceRegister(registry, "booleans.is.is:is", makeIsFallback);
  forceRegister(registry, "regionSite", makeRegionSite);
  forceRegister(registry, "regionSite:regionSite", makeRegionSite);
  forceRegister(registry, "regions", makeRegionsFallback);
  forceRegister(registry, "regions:regions", makeRegionsFallback);
  forceRegister(registry, "rules", makeRulesFallback);
  forceRegister(registry, "rules:rules", makeRulesFallback);
  forceRegister(registry, "sites", makeSitesFallback);
  forceRegister(registry, "sites:sites", makeSitesFallback);
  forceRegister(registry, "sites:side", makeSitesFallback);
  for (const side of ["board", "bottom", "top", "left", "right", "side"]) {
    forceRegister(registry, `sites:sites:${side}`, makeSitesFallback);
  }
  for (const role of ["mover", "next", "prev", "player", "shared", "all", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]) {
    forceRegister(registry, `sites:sites:${role}`, makeSitesFallback);
  }
  preserveFallbackKeys(registry, [
    "board",
    "container.board.board:board",
    "booleans.is.is:is:connected",
    "is:connected",
    "concentric",
    "concentric:concentric",
    "count",
    "count.count:count",
    "count:pieces",
    "count:sites",
    "is",
    "booleans.is.is:is",
    "regions:regions",
    "regions",
    "rules",
    "rules:rules",
    "sites",
    "sites:sites",
    "sites:side",
  ]);
  registry.registerLudeme("deductionPuzzle.is.is:is", () => new IsSolved());
  registry.registerLudeme("deductionPuzzle.set:set", makeDeductionSet);
  registry.registerLudeme("dice:dice", makeDice);
  registry.registerLudeme("dice.face:face", (b) => new Face(requireIntFunction(b, 0) as ConstructorParameters<typeof Face>[0]));
  registry.registerLudeme("die:die", makeDie);
  registry.registerLudeme("dim.math.-:-", (b) => new DimSub1to1(requireDim(b, 0), requireDim(b, 1)));
  registry.registerLudeme("dim.math.*:*", makeDimMul);
  registry.registerLudeme("dim.math./:/", (b) => new DimDiv1to1(requireDim(b, 0), requireDim(b, 1)));
  registry.registerLudeme("dim.math.^:^", (b) => new DimPow1to1(requireDim(b, 0), requireDim(b, 1)));
  registry.registerLudeme("dim.math.+:+", makeDimAdd);
  registry.registerLudeme("dim.math.abs:abs", (b) => new DimAbs1to1(requireDim(b, 0)));
  registry.registerLudeme("dim.math.max:max", (b) => new DimMax1to1(requireDim(b, 0), requireDim(b, 1)));
  registry.registerLudeme("dim.math.min:min", (b) => new DimMin1to1(requireDim(b, 0), requireDim(b, 1)));
  registry.registerLudeme("directional:directional", makeDirectional);
  registry.registerLudeme("directions:directions", makeDirections);
  registry.registerLudeme("directions.difference:difference", (b) =>
    new Difference(requireDirections(b, 0), requireDirections(b, 1)));
  registry.registerLudeme("directions.if:if", (b) =>
    new DirectionIf(requireBooleanFunction(b, 0), requireDirections(b, 1), requireDirections(b, 2)));
  registry.registerLudeme("directions.union:union", (b) =>
    new Union(requireDirections(b, 0), requireDirections(b, 1)));
  registry.registerLudeme("do:do", (b) =>
    new Do(requireMovesFunction(b, 0), movesNamed(b, "next"), boolNamed(b, "ifafterwards"), thenMoves(b)));
  registry.registerLudeme("domino:domino", makeDomino);
  registry.registerLudeme("dominoes:dominoes", (b) => new Dominoes(numberNamed(b, "upto")));
  registry.registerLudeme("dual:dual", (b) => new Dual(requireGraphFunction(b, 0)));
  registry.registerLudeme("effect.add:add", makeAdd);
  registry.registerLudeme("effect.deal:deal", (b) =>
    new Deal(requireString(b, 0) as ConstructorParameters<typeof Deal>[0], intAt(b, 1) ?? new IntConstant(1), intNamed(b, "beginwith"), null));
  registry.registerLudeme("effect.remove:remove", makeRemove);
  registry.registerLudeme("effect.set.set:set", makeEffectSet);
  registry.registerLudeme("effect.step:step", makeStep);
  registry.registerLudeme("enclose:enclose", makeEnclose);
  registry.registerLudeme("end:end", (b) => new End(null, flatten(b.positional).filter(isEndRuleFunction)));
  registry.registerLudeme("end.forEach:forEach", (b, env) =>
    {
      void env;
      const type = stringAt(b, 0);
      return new EndForEach(
        type === "Track" ? null : (type?.toLowerCase() ?? null),
        type === "Track" ? "Track" : null,
        requireNamedBooleanFunction(b, "if"),
        requireResult(b),
      );
    });
  registry.registerLudeme("end.if:if", (b) => makeEndIf(b));
  registry.registerLudeme("end.score:score", (b) => new Score(requireString(b, 0) as unknown as ConstructorParameters<typeof Score>[0], requireIntFunction(b, 1)));
  registry.registerLudeme("equipment:equipment", makeEquipment);
  registry.registerLudeme("equipment.card:card", (b) =>
    new EquipmentCard(
      requireString(b, 0) as ConstructorParameters<typeof EquipmentCard>[0],
      requireNamedNumber(b, "rank"),
      requireNamedNumber(b, "value"),
      numberNamed(b, "trumprank"),
      numberNamed(b, "trumpvalue"),
      numberNamed(b, "biased"),
    ));
  registry.registerLudeme("equipment.hint:hint", (b) => {
    const first = b.positional[0];
    const hint = numberAt(b, 1);
    if (Array.isArray(first) && first.every((v) => typeof v === "number")) return new Hint(first, hint);
    return new Hint(requireNumber(b, 0), hint);
  });
}

function forceRegister(registry: LudemeRegistry, key: string, factory: LudemeRegistry["construct"] extends never ? never : Parameters<LudemeRegistry["registerLudeme"]>[1]): void {
  const raw = registry as unknown as { factories?: Map<string, Parameters<LudemeRegistry["registerLudeme"]>[1]> };
  if (raw.factories instanceof Map) Map.prototype.set.call(raw.factories, key.toLowerCase(), factory);
  else registry.registerLudeme(key, factory);
}

function preserveFallbackKeys(registry: LudemeRegistry, keys: readonly string[]): void {
  const patched = registry as RegistryWithPatch;
  const protectedKeys = patched.__batch2ProtectedKeys ?? new Set<string>();
  for (const key of keys) protectedKeys.add(key.toLowerCase());
  if (patched.__batch2ProtectedKeys) return;
  patched.__batch2ProtectedKeys = protectedKeys;
  const original = registry.registerLudeme.bind(registry);
  registry.registerLudeme = ((key, factory) => {
    if (protectedKeys.has(key.toLowerCase())) return;
    original(key, factory);
  }) as LudemeRegistry["registerLudeme"];
}

function makeBoardFallback(b: ArgBundle): Board1to1 {
  const existing = flatten(b.positional).find((v): v is Board1to1 => v instanceof Board1to1);
  if (existing) return existing;

  const graphFn = flatten(b.positional).find(isGraphFunctionLike);
  if (!graphFn) deferred("board");

  const siteType = siteTypeFromValue(b.named.get("use")) ?? firstSiteType(b) ?? "Cell";
  let graph = graphFn.eval(siteType);
  let traj = new Trajectories(graph, siteType);
  if (traj.numSites === 0 && siteType !== "Vertex") {
    graph = graphFn.eval("Vertex");
    traj = new Trajectories(graph, "Vertex");
  }
  if (traj.numSites === 0) return fallbackRectBoard(b, siteType);

  const dim = typeof graphFn.dim === "function" ? graphFn.dim() : [];
  let width = Math.max(1, Math.ceil(dim[0] ?? 0));
  let height = Math.max(1, Math.ceil(dim[1] ?? 0));
  if (width === 1 && height === 1 && traj.numSites > 1) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let site = 0; site < traj.numSites; site += 1) {
      minX = Math.min(minX, traj.xOf(site));
      maxX = Math.max(maxX, traj.xOf(site));
      minY = Math.min(minY, traj.yOf(site));
      maxY = Math.max(maxY, traj.yOf(site));
    }
    width = Math.max(1, Math.ceil(maxX - minX) + 1);
    height = Math.max(1, Math.ceil(maxY - minY) + 1);
  }
  return new Board1to1(width, height, traj.numSites, traj, graph.faces.length);
}

function fallbackRectBoard(b: ArgBundle, siteType: SiteType): Board1to1 {
  const trackMax = maxTrackSite(b);
  const sites = trackMax !== null ? trackMax + 1 : siteType === "Vertex" ? 64 : 1;
  const width = Math.max(1, Math.ceil(Math.sqrt(sites)));
  const height = Math.max(1, Math.ceil(sites / width));
  return new Board1to1(width, height);
}

function maxTrackSite(b: ArgBundle): number | null {
  let max: number | null = null;
  for (const value of flatten(b.positional)) {
    const sites = (value as { sites?: unknown; track?: unknown; _sites?: unknown } | null)?.sites ??
      (value as { sites?: unknown; track?: unknown; _sites?: unknown } | null)?._sites;
    if (Array.isArray(sites) && sites.every((site) => typeof site === "number")) {
      for (const site of sites) max = Math.max(max ?? site, site);
    }
  }
  return max;
}

function makeConcentricFallback(b: ArgBundle): GraphFunction {
  const first = stringAt(b, 0);
  const shape = isConcentricShape(first) ? first : undefined;
  return Concentric.construct({
    shape,
    sides: numberNamed(b, "sides") ?? undefined,
    cells: firstNumberArrayPreservingList(b) ?? undefined,
    rings: numberNamed(b, "rings") ?? undefined,
    steps: numberNamed(b, "steps") ?? undefined,
    midpoints: booleanNamedValue(b, "midpoints") ?? undefined,
    joinMidpoints: booleanNamedValue(b, "joinmidpoints") ?? undefined,
    joinCorners: booleanNamedValue(b, "joincorners") ?? undefined,
    stagger: booleanNamedValue(b, "stagger") ?? undefined,
  });
}

function makeCountFallback(b: ArgBundle): IntFunction {
  const kind = stringAt(b, 0);
  if (kind === "Pieces") {
    const role = firstRoleAfter(b, 0) ?? "All";
    const of = intNamed(b, "of");
    return new CountPieces1to1(
      of ?? roleToIntFunction(role),
      regionNamed(b, "in") ?? firstRegionFunction(b),
      stringNamed(b, "name"),
      of === null && (role === "All" || role === "Each" || role === "Any"),
    );
  }
  if (kind === "Sites") {
    const region = regionNamed(b, "in") ?? firstRegionFunction(b);
    if (region) return new CountSites1to1(region);
    return new CountCells1to1();
  }
  if (kind === "Value") {
    const array = intArrayNamed(b, "in") ?? firstIntArrayFunction(b);
    if (array) return new CountValue1to1(intNamed(b, "of") ?? firstIntFunctionAfter(b, 0) ?? new IntConstant(0), array);
  }
  if (kind === "Rows") return new CountRows1to1();
  if (kind === "Columns") return new CountColumns1to1();
  if (kind === "Cells") return new CountCells1to1();
  if (kind === "Vertices") return new CountVertices1to1();
  if (kind === "Edges") return new CountEdges1to1();
  if (kind === "Players") return new CountPlayers1to1();
  if (kind === "Turns") return new CountTurns1to1();
  if (kind === "Moves") return new CountMoves1to1();
  if (kind === "MovesThisTurn") return new CountMovesThisTurn1to1();
  if (kind === "Phases") return new CountPhases1to1();
  if (kind === "Trials") return new CountTrials();
  if (kind === "LegalMoves" || kind === "Active") return new IntConstant(0);
  if (kind === "SizeBiggestGroup") return new CountSizeBiggestGroup1to1(boolNamed(b, "if") ?? null);

  const at = intNamed(b, "at");
  if (at) return new CountNumber1to1(singleSiteRegion(at));
  const region = regionNamed(b, "in") ?? firstRegionFunction(b);
  if (region) return new CountNumber1to1(region);
  if (kind === null) return new CountNumber1to1(singleSiteRegion(lastTo()));
  deferred(kind === null ? "count" : `count ${kind}`);
}

function makeIsFallback(b: ArgBundle): BooleanFunction {
  const kind = requireString(b, 0);
  if (kind === "Empty") return new IsEmpty1to1(firstIntFunctionAfter(b, 0) ?? lastTo());
  if (kind === "Occupied") return new IsOccupied1to1(firstIntFunctionAfter(b, 0) ?? lastTo());
  if (kind === "In") {
    const region = firstRegionFunction(b);
    if (!region) deferred("is In");
    return new IsIn1to1(firstIntFunctionAfter(b, 0) ?? lastTo(), region);
  }
  if (kind === "Mover") return new IsMover1to1(firstIntFunctionAfter(b, 0) ?? roleToIntFunction(firstRoleAfter(b, 0) ?? "Mover"));
  if (kind === "Next") return new IsNext1to1(firstIntFunctionAfter(b, 0) ?? roleToIntFunction(firstRoleAfter(b, 0) ?? "Next"));
  if (kind === "Prev") return new IsPrev1to1(firstIntFunctionAfter(b, 0) ?? roleToIntFunction(firstRoleAfter(b, 0) ?? "Mover"));
  if (kind === "Friend") return new IsFriend1to1(firstIntFunctionAfter(b, 0) ?? roleToIntFunction(firstRoleAfter(b, 0) ?? "Mover"));
  if (kind === "Enemy") return new IsEnemy1to1(firstIntFunctionAfter(b, 0) ?? roleToIntFunction(firstRoleAfter(b, 0) ?? "Next"));
  if (kind === "Active") return new IsActive1to1(firstIntFunctionAfter(b, 0) ?? roleToIntFunction(firstRoleAfter(b, 0) ?? "Mover"));
  if (kind === "Even") return new IsEven1to1(requireIntAfterKind(b, "Even"));
  if (kind === "Odd") return new IsOdd1to1(requireIntAfterKind(b, "Odd"));
  if (kind === "Blocked") return new IsBlocked1to1();
  if (kind === "Full") return new IsFull1to1();
  if (kind === "Pending") return new IsPending1to1();
  if (kind === "Repeat") return new IsRepeat1to1((firstStringAfter(b, 0) ?? "Positional") as ConstructorParameters<typeof IsRepeat1to1>[0]);
  if (kind === "LastFrom") return new IsLastFrom1to1(firstSiteType(b) ?? "Cell");
  if (kind === "LastTo") return new IsLastTo1to1(firstSiteType(b) ?? "Cell");
  if (kind === "Connected") return connectedFallback(b);
  deferred("is");
}

function makeConnectedFallback(b: ArgBundle): BooleanFunction {
  return connectedFallback(b);
}

function makeRegionSite(b: ArgBundle): IntFunction {
  const region = firstRegionFunction(b);
  if (!region) throw new Error("factory regionSite: missing region");
  const index = intNamed(b, "index") ?? firstIntFunctionAfter(b, -1) ?? new IntConstant(0);
  return {
    eval: (ctx) => {
      const sites = region.eval(ctx);
      const i = index.eval(ctx);
      return i >= 0 && i < sites.length ? sites[i]! : -1;
    },
  };
}

function makeRegionsFallback(b: ArgBundle): Regions {
  let index = 0;
  const first = b.positional[index];
  const name = typeof first === "string" && !isRoleString(first) && b.positional.length > 1 ? first : null;
  if (name !== null) index += 1;
  const roleValue = b.positional[index];
  const role = isRoleString(roleValue) ? roleValue : null;
  if (role !== null) index += 1;

  const payload = b.positional.slice(index);
  const sites = payload.find((v): v is number[] => Array.isArray(v) && v.every((x) => typeof x === "number")) ?? null;
  const regionFns = flatten(payload).filter(isRegionFunction);
  const region = regionFns.length === 1 ? regionFns[0]! : null;
  const regions = regionFns.length > 1 ? regionFns : null;
  return new Regions(
    name,
    role,
    sites,
    region,
    regions,
    null,
    null,
    null,
  );
}

function connectedFallback(b: ArgBundle): BooleanFunction {
  const regions = flatten(b.positional).filter(isRegionFunction);
  const role = firstRoleAfter(b, 0);
  const whoFn = role ? roleToIntFunction(role) : null;
  return {
    eval: (ctx) => {
      const board = (ctx.game as unknown as { equipment?: { board?: Board1to1 } }).equipment?.board;
      const start = ctx._evalTo;
      if (!board || start < 0) return false;
      const owner = whoFn?.eval(ctx) ?? ctx.state.cells[start] ?? 0;
      if (owner <= 0) return false;
      const seen = new Set<number>([start]);
      const queue = [start];
      for (let i = 0; i < queue.length; i += 1) {
        const site = queue[i]!;
        for (const next of board.trajectories?.neighbours(site) ?? gridNeighbours(board, site)) {
          if (seen.has(next) || (ctx.state.cells[next] ?? 0) !== owner) continue;
          seen.add(next);
          queue.push(next);
        }
      }
      if (regions.length === 0) return seen.size > 0;
      return regions.every((region) => region.eval(ctx).some((site) => seen.has(site)));
    },
  };
}

function gridNeighbours(board: Board1to1, site: number): number[] {
  const out: number[] = [];
  const x = site % board.width;
  const y = Math.floor(site / board.width);
  if (x > 0) out.push(site - 1);
  if (x < board.width - 1) out.push(site + 1);
  if (y > 0) out.push(site - board.width);
  if (y < board.height - 1) out.push(site + board.width);
  return out.filter((s) => s >= 0 && s < board.numSites);
}

function makeRulesFallback(b: ArgBundle): Rules1to1 {
  const values = flatten([...b.positional, ...b.named.values()]);
  const end = values.find((v): v is End => v instanceof End) ?? new End(null, []);
  const phases = values.filter((v): v is Phase => v instanceof Phase);
  const play = firstOfValue(values, isPlay);
  if (phases.length > 0) {
    const completedPhases = play ? phases.map((phase) => phase.play ? phase : phaseWithPlay(phase, play)) : phases;
    const phasePlay = play ?? completedPhases.find((phase) => phase.play)?.play;
    if (!phasePlay) throw new Error("factory rules: missing play");
    return new Rules1to1(null, null, phasePlay, completedPhases, end);
  }
  if (!play) throw new Error("factory rules: missing play");
  return new Rules1to1(null, null, play, end);
}

function makeSitesFallback(b: ArgBundle): RegionFunction {
  const kind = stringAt(b, 0);
  if (kind === null) return new SitesContext();
  if (kind === "Bottom") return new SitesBottom();
  if (kind === "Top") return new SitesTop();
  if (kind === "Left") return new SitesLeft();
  if (kind === "Right") return new SitesRight();
  if (kind === "Board") return allBoardSites();
  if (kind === "Hand") return new SitesHand(roleToIntFunction(firstRoleAfter(b, 0) ?? "Mover"), firstRoleAfter(b, 0));
  if (isRoleString(kind)) return new SitesEquipmentRegion(roleToIntFunction(kind), stringNamed(b, "name") ?? firstNonRoleStringAfter(b, 0) ?? "");
  if (kind !== "Side") deferred(`sites ${kind ?? ""}`.trim());
  const direction = firstDirectionName(b);
  if (!direction) return new UnionRegion([new SitesBottom(), new SitesTop(), new SitesLeft(), new SitesRight()]);
  return sideRegion(direction);
}

function makeDeductionSet(b: ArgBundle): DeductionSet {
  const type = firstSiteType(b);
  const pairs = flatten(b.positional)
    .filter((v): v is number[] => Array.isArray(v) && v.length >= 2 && v.every((x) => typeof x === "number"))
    .map((p) => [p[0]!, p[1]!] as [number, number]);
  if (pairs.length === 0) {
    const nums = numbers(b);
    for (let i = 0; i + 1 < nums.length; i += 2) pairs.push([nums[i]!, nums[i + 1]!]);
  }
  return new DeductionSet(type, ...pairs);
}

function makeDice(b: ArgBundle): Dice {
  return new Dice(
    numberNamed(b, "d"),
    numberArrayNamed(b, "faces"),
    numberMatrixNamed(b, "facesbydie"),
    numberNamed(b, "from"),
    firstRole(b),
    requireNamedNumber(b, "num"),
    numberArrayNamed(b, "biased"),
  );
}

function makeDie(b: ArgBundle): Die {
  return new Die(
    requireString(b, 0),
    requireString(b, 1) as EquipmentRoleType,
    requireNamedNumber(b, "numfaces"),
    stringAt(b, 2) as ConstructorParameters<typeof Die>[3],
    movesAt(b, 3),
  );
}

function makeDimAdd(b: ArgBundle): DimAdd1to1 {
  const list = firstArray(b);
  if (list) return new DimAdd1to1(list.map(dimValue));
  return new DimAdd1to1(requireDim(b, 0), requireDim(b, 1));
}

function makeDimMul(b: ArgBundle): DimMul1to1 {
  const list = firstArray(b);
  if (list) return new DimMul1to1(list.map(dimValue));
  return new DimMul1to1(requireDim(b, 0), requireDim(b, 1));
}

function makeDirections(b: ArgBundle): DirectionsFunction {
  if (stringAt(b, 0) === "Random") deferred("directions Random");
  if (b.named.has("from") || b.named.has("to")) deferred("directions from/to");
  const names = flatten(b.positional).filter((v): v is string => typeof v === "string");
  if (names.length === 0) return new Directions1to1Static(null, ["Adjacent"]);
  if (!names.every((name) => ABSOLUTE_DIRECTIONS.has(name))) deferred("directions relative");
  return new Directions1to1Static(null, names);
}

function makeDomino(b: ArgBundle): Domino {
  return new Domino(
    requireString(b, 0),
    requireString(b, 1) as EquipmentRoleType,
    requireNamedNumber(b, "value"),
    requireNamedNumber(b, "value2"),
    movesAt(b, 2),
  );
}

function makeAdd(b: ArgBundle): Add {
  if (b.named.has("count") || b.named.has("stack") || thenMoves(b)) deferred("add");
  const piece = firstOf(b, isPieceArg);
  const to = firstOf(b, isTo);
  const region = to?.regionFn() ?? singleSiteRegion(to?.locFn() ?? lastTo());
  const pieceFn = piece === null ? null : addPieceFn(piece);
  if (piece !== null && pieceFn === null) deferred("add piece");
  return new Add(region, pieceFn);
}

function makeRemove(b: ArgBundle): Remove {
  const site = firstIntFunction(b);
  const region = firstRegionFunction(b);
  return new Remove({
    locationFn: site,
    regionFn: region,
    countFn: intNamed(b, "count"),
    levelFn: intNamed(b, "level"),
    type: firstSiteType(b),
    when: stringNamed(b, "at"),
    then: null,
  });
}

function makeEffectSet(b: ArgBundle): MovesFunction {
  const kind = requireString(b, 0);
  if (kind === "Rotation") return makeSetRotation(b);
  if (kind === "Value" || kind === "Score") return makeSetPlayerOrSite(b, kind);
  if (kind === "Pending") return new SetPending(firstIntFunctionAfter(b, 0), firstRegionFunction(b), thenMoves(b));
  if (kind === "NextPlayer") return new SetNextPlayer({ who: firstIntFunctionAfter(b, 0), nextPlayers: firstIntArrayFunction(b), then: thenMoves(b) });
  if (kind === "Hidden") return makeSetHidden(b);
  if (kind === "TrumpSuit") return new SetTrumpSuit((firstIntArrayFunction(b) ?? firstIntFunctionAfter(b, 0)) as IntFunction | null, thenMoves(b));
  if (kind === "Team") return new SetTeam(requireIntFunction(b, 1), flatten(b.positional).filter(isRoleString), thenMoves(b));
  if (kind === "Count") {
    if (b.named.has("level") || firstSiteType(b) !== null) deferred("set Count");
    return new SetCount1to1(requireNamedIntFunction(b, "at"), requireLastIntFunction(b));
  }
  if (kind === "State") {
    if (b.named.has("level") || firstSiteType(b) !== null) deferred("set State");
    return new SetState1to1(requireNamedIntFunction(b, "at"), requireLastIntFunction(b));
  }
  if (kind === "Counter") return new SetCounter(firstIntFunctionAfter(b, 0), thenMoves(b));
  if (kind === "Pot") return new SetPot(firstIntFunctionAfter(b, 0), thenMoves(b));
  if (kind === "Var") return new SetVar1to1(firstStringAfter(b, 0), firstIntFunctionAfter(b, 0) ?? new IntConstant(-1));
  deferred(`set ${kind}`);
}

function makeSetPlayerOrSite(b: ArgBundle, kind: string): MovesFunction {
  if (b.named.has("at")) {
    return new SetValue(firstSiteType(b), requireNamedIntFunction(b, "at"), intNamed(b, "level"), requireLastIntFunction(b), thenMoves(b));
  }
  const value = requireLastIntFunction(b);
  const player = firstIntFunctionAfter(b, 0);
  const role = firstRoleAfter(b, 0);
  if (kind === "Value") return new SetValuePlayer(player, role, value, thenMoves(b));
  return new SetScore1to1(player ?? roleToIntFunction(role ?? "Mover"), value);
}

function makeDirectional(b: ArgBundle): Directional {
  const from = firstOf(b, isFrom);
  const to = firstOf(b, isTo);
  const toFn = lastTo();
  const effect = firstMovesFunctionAfter(b, 0) ?? new Remove({
    locationFn: toFn,
    regionFn: null,
    countFn: null,
    levelFn: null,
    type: to?.siteType() ?? firstSiteType(b),
    when: null,
    then: null,
  });
  return new Directional({
    startLocationFn: from?.locFn() ?? lastTo(),
    targetRule: to?.condFn() ?? new IsEnemy1to1(new Who1to1(toFn)),
    effect,
    dirnChoice: firstDirectionsFunction(b) ?? directionFromName(firstDirectionName(b)),
    then: null,
  });
}

function makeSetRotation(b: ArgBundle): SetRotation {
  const to = firstOf(b, isTo);
  const directions = firstNumberArray(b)?.map((n) => new IntConstant(n)) ?? (firstNumberAfter(b, 0) !== null ? [new IntConstant(firstNumberAfter(b, 0)!)] : null);
  return new SetRotation(
    to?.locFn() ?? lastTo(),
    to?.siteType() ?? null,
    directions,
    boolNamed(b, "previous"),
    boolNamed(b, "next"),
    thenMoves(b),
  );
}

function makeSetHidden(b: ArgBundle): SetHidden {
  const data = flatten(b.positional).filter(isHiddenData);
  const toPlayer = valueNamed(b, "to");
  return new SetHidden(
    data.length > 0 ? data : null,
    firstSiteType(b),
    firstIntFunctionAfter(b, 0),
    firstRegionFunction(b),
    intNamed(b, "level"),
    firstBooleanFunctionAfter(b, 0),
    isIntFunction(toPlayer) ? toPlayer : null,
    typeof toPlayer === "string" ? toPlayer : null,
    thenMoves(b),
  );
}

function makeStep(b: ArgBundle): Step {
  const from = firstOf(b, isFrom);
  const to = firstOf(b, isTo);
  return new Step({
    startLocationFn: from?.locFn() ?? lastFrom(),
    fromCondition: from?.condFn() ?? null,
    startRegionFn: from?.regionFn() ?? null,
    levelFromFn: from?.levelFn() ?? null,
    rule: to?.condFn() ?? trueBool(),
    sideEffect: null,
    stack: booleanNamedValue(b, "stack") ?? false,
    dirnChoice: firstDirectionsFunction(b) ?? new Directions1to1Static(null, ["Adjacent"]),
    then: null,
  });
}

function makeEnclose(b: ArgBundle): Enclose {
  const from = firstOf(b, isFrom);
  const between = firstBetweenLike(b);
  const betweenFn = betweenInt();
  const effect = between?.effect ?? firstMovesFunctionAfter(b, 0) ?? new Remove({
    locationFn: betweenFn,
    regionFn: null,
    countFn: null,
    levelFn: null,
    type: firstSiteType(b),
    when: null,
    then: null,
  });
  return new Enclose({
    startFn: from?.locFn() ?? lastTo(),
    dirnName: firstDirectionName(b) ?? "Adjacent",
    targetRule: between?.cond ?? new IsEnemy1to1(new Who1to1(betweenFn)),
    numEmptySitesInGroup: intNamed(b, "numexception") ?? new IntConstant(0),
    effect,
    type: firstSiteType(b),
    then: null,
  });
}

function makeEndIf(b: ArgBundle): EndIf {
  const condition = requireBooleanFunction(b, 0);
  const sub = b.positional.find((v): v is EndIf => v instanceof EndIf) ?? null;
  const subs = b.positional.find((v): v is EndIf[] => Array.isArray(v) && v.every((item) => item instanceof EndIf)) ?? null;
  const result = b.positional.find((v): v is Result => v instanceof Result) ?? null;
  if (!result) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected result`);
  return new EndIf(condition, sub, subs, result);
}

function makeEquipment(b: ArgBundle): Equipment1to1 {
  const values = flatten(b.positional);
  const board = values.find((value): value is Board1to1 => value instanceof Board1to1);
  if (!board) throw new Error("factory equipment: missing board");
  return new Equipment1to1(board, values.filter((value): value is Piece => value instanceof Piece));
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

function valueNamed(b: ArgBundle, name: string): unknown {
  return b.named.get(name);
}

function stringAt(b: ArgBundle, index: number): string | null {
  const value = b.positional[index];
  return typeof value === "string" ? value : null;
}

function firstStringAfter(b: ArgBundle, start: number): string | null {
  return b.positional.slice(start + 1).find((v): v is string => typeof v === "string") ?? null;
}

function firstNonRoleStringAfter(b: ArgBundle, start: number): string | null {
  return b.positional.slice(start + 1).find((v): v is string => typeof v === "string" && !isRoleString(v)) ?? null;
}

function requireString(b: ArgBundle, index: number): string {
  const value = stringAt(b, index);
  if (value === null) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected string at ${index}`);
  return value;
}

function stringNamed(b: ArgBundle, name: string): string | null {
  const value = b.named.get(name);
  return typeof value === "string" ? value : null;
}

function requireNumber(b: ArgBundle, index: number): number {
  const value = numberAt(b, index);
  if (value === null) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected number at ${index}`);
  return value;
}

function numberAt(b: ArgBundle, index: number): number | null {
  const value = b.positional[index];
  return typeof value === "number" ? value : null;
}

function firstNumberAfter(b: ArgBundle, start: number): number | null {
  return b.positional.slice(start + 1).find((v): v is number => typeof v === "number") ?? null;
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

function numberArrayNamed(b: ArgBundle, name: string): number[] | null {
  const value = b.named.get(name);
  return Array.isArray(value) && value.every((v) => typeof v === "number") ? value : null;
}

function numberMatrixNamed(b: ArgBundle, name: string): number[][] | null {
  const value = b.named.get(name);
  return Array.isArray(value) && value.every((row) => Array.isArray(row) && row.every((v) => typeof v === "number"))
    ? value
    : null;
}

function firstArray(b: ArgBundle): unknown[] | null {
  return flatten(b.positional).find((v): v is unknown[] => Array.isArray(v)) ?? null;
}

function firstNumberArray(b: ArgBundle): number[] | null {
  return flatten(b.positional).find((v): v is number[] => Array.isArray(v) && v.every((x) => typeof x === "number")) ?? null;
}

function dimValue(value: unknown): DimFunction1to1 {
  if (typeof value === "number") return new DimConstant1to1(value);
  if (isDimFunction(value)) return value;
  throw new Error("factory dim: expected dim");
}

function requireDim(b: ArgBundle, index: number): DimFunction1to1 {
  return dimValue(b.positional[index]);
}

function intAt(b: ArgBundle, index: number): IntFunction | null {
  const value = b.positional[index];
  if (isIntFunction(value)) return value;
  if (typeof value === "number") return new IntConstant(value);
  return null;
}

function requireIntFunction(b: ArgBundle, index: number): IntFunction {
  const value = intAt(b, index);
  if (!value) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected int at ${index}`);
  return value;
}

function intNamed(b: ArgBundle, name: string): IntFunction | null {
  const value = b.named.get(name);
  if (isIntFunction(value)) return value;
  if (typeof value === "number") return new IntConstant(value);
  return null;
}

function requireNamedIntFunction(b: ArgBundle, name: string): IntFunction {
  const value = intNamed(b, name);
  if (!value) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected named int ${name}`);
  return value;
}

function firstIntFunction(b: ArgBundle): IntFunction | null {
  return flatten(b.positional).map(intValue).find((v): v is IntFunction => v !== null) ?? null;
}

function firstIntFunctionAfter(b: ArgBundle, start: number): IntFunction | null {
  return b.positional.slice(start + 1).map(intValue).find((v): v is IntFunction => v !== null) ?? null;
}

function requireIntAfterKind(b: ArgBundle, kind: string): IntFunction {
  const value = firstIntFunctionAfter(b, 0);
  if (!value) throw new Error(`factory is:${kind}: expected int`);
  return value;
}

function requireLastIntFunction(b: ArgBundle): IntFunction {
  for (let i = b.positional.length - 1; i >= 0; i--) {
    const value = intValue(b.positional[i]);
    if (value) return value;
  }
  throw new Error(`factory ${b.symbol}:${b.constructKey}: expected int`);
}

function intValue(value: unknown): IntFunction | null {
  if (isIntFunction(value)) return value;
  if (typeof value === "number") return new IntConstant(value);
  return null;
}

function firstIntArrayFunction(b: ArgBundle): IntArrayFunction | null {
  return flatten(b.positional).find(isIntArrayFunction) ?? null;
}

function booleanNamedValue(b: ArgBundle, name: string): boolean | null {
  const value = b.named.get(name);
  return typeof value === "boolean" ? value : null;
}

function boolNamed(b: ArgBundle, name: string): BooleanFunction | null {
  const value = b.named.get(name);
  if (isBooleanFunction(value)) return value;
  if (typeof value === "boolean") return new BooleanConstant(value);
  return null;
}

function requireNamedBooleanFunction(b: ArgBundle, name: string): BooleanFunction {
  const value = boolNamed(b, name);
  if (!value) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected named boolean ${name}`);
  return value;
}

function requireBooleanFunction(b: ArgBundle, index: number): BooleanFunction {
  const value = b.positional[index];
  if (isBooleanFunction(value)) return value;
  if (typeof value === "boolean") return new BooleanConstant(value);
  throw new Error(`factory ${b.symbol}:${b.constructKey}: expected boolean at ${index}`);
}

function firstBooleanFunctionAfter(b: ArgBundle, start: number): BooleanFunction | null {
  for (const value of b.positional.slice(start + 1)) {
    if (isBooleanFunction(value)) return value;
    if (typeof value === "boolean") return new BooleanConstant(value);
  }
  return null;
}

function trueBool(): BooleanFunction {
  return new BooleanConstant(true);
}

function movesAt(b: ArgBundle, index: number): MovesFunction | null {
  const value = b.positional[index];
  return isMovesFunction(value) ? value : null;
}

function movesNamed(b: ArgBundle, name: string): MovesFunction | null {
  const value = b.named.get(name);
  return isMovesFunction(value) ? value : null;
}

function requireMovesFunction(b: ArgBundle, index: number): MovesFunction {
  const value = movesAt(b, index);
  if (!value) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected moves at ${index}`);
  return value;
}

function thenMoves(b: ArgBundle): MovesFunction | null {
  return optionalThen(b)?.moves() ?? null;
}

function firstMovesFunctionAfter(b: ArgBundle, start: number): MovesFunction | null {
  return b.positional.slice(start + 1).find(isMovesFunction) ?? null;
}

function firstRegionFunction(b: ArgBundle): RegionFunction | null {
  return flatten(b.positional).find(isRegionFunction) ?? null;
}

function requireDirections(b: ArgBundle, index: number): DirectionsFunction {
  const value = b.positional[index];
  if (!isDirectionsFunction(value)) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected directions at ${index}`);
  return value;
}

function firstDirectionsFunction(b: ArgBundle): DirectionsFunction | null {
  return flatten(b.positional).find(isDirectionsFunction) ?? null;
}

function firstDirectionName(b: ArgBundle): string | null {
  return flatten(b.positional).find((v): v is string => typeof v === "string" && ABSOLUTE_DIRECTIONS.has(v)) ?? null;
}

function directionFromName(name: string | null): DirectionsFunction | null {
  return name === null ? null : new Directions1to1Static(name, null);
}

function requireGraphFunction(b: ArgBundle, index: number): GraphFunction {
  const value = b.positional[index];
  if (!isGraphFunction(value)) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected graph at ${index}`);
  return value;
}

function requireResult(b: ArgBundle): Result {
  const result = flatten(b.positional).find((v): v is Result => v instanceof Result);
  if (!result) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected result`);
  return result;
}

function firstOf<T>(b: ArgBundle, guard: (value: unknown) => value is T): T | null {
  return flatten(b.positional).find(guard) ?? null;
}

function firstSiteType(b: ArgBundle): SiteType | null {
  return flatten(b.positional).find(isSiteType) ?? null;
}

function siteTypeFromValue(value: unknown): SiteType | null {
  return isSiteType(value) ? value : null;
}

function regionNamed(b: ArgBundle, name: string): RegionFunction | null {
  const value = b.named.get(name);
  return isRegionFunction(value) ? value : null;
}

function intArrayNamed(b: ArgBundle, name: string): IntArrayFunction | null {
  const value = b.named.get(name);
  return isIntArrayFunction(value) ? value : null;
}

function firstNumberArrayPreservingList(b: ArgBundle): number[] | null {
  for (const value of b.positional) {
    if (Array.isArray(value) && value.every((v) => typeof v === "number")) return value;
    if (Array.isArray(value)) {
      const nested = findNumberArray(value);
      if (nested) return nested;
    }
  }
  return null;
}

function findNumberArray(values: readonly unknown[]): number[] | null {
  if (values.every((v) => typeof v === "number")) return values as number[];
  for (const value of values) {
    if (Array.isArray(value)) {
      const nested = findNumberArray(value);
      if (nested) return nested;
    }
  }
  return null;
}

function firstOfValue<T>(values: readonly unknown[], guard: (value: unknown) => value is T): T | null {
  return values.find(guard) ?? null;
}

function isPlay(value: unknown): value is Play1to1 {
  return value instanceof Play1to1;
}

function phaseWithPlay(phase: Phase, play: Play1to1): Phase {
  return new Phase(
    phase.name,
    phase.role,
    phase.mode(),
    play,
    phase.end,
    null,
    [...phase.nextPhases],
  );
}

function firstRole(b: ArgBundle): EquipmentRoleType | null {
  return flatten(b.positional).find(isRoleString) ?? null;
}

function firstRoleAfter(b: ArgBundle, start: number): string | null {
  return b.positional.slice(start + 1).find(isRoleString) ?? null;
}

function roleToIntFunction(role: string): IntFunction {
  return {
    eval: (ctx) => {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return ctx.state.mover % ctx.game.numPlayers + 1;
      if (role === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (role === "Player") return ctx._evalPlayer ?? ctx.state.mover;
      if (/^P\d+$/.test(role)) return Number(role.slice(1));
      return 0;
    },
  };
}

function lastFrom(): IntFunction {
  return { eval: (ctx) => ctx._evalFrom };
}

function lastTo(): IntFunction {
  return { eval: (ctx) => ctx._evalTo };
}

function firstBetweenLike(b: ArgBundle): { cond?: BooleanFunction; effect?: MovesFunction } | null {
  return flatten(b.positional).find((value): value is { cond?: BooleanFunction; effect?: MovesFunction } =>
    typeof value === "object" && value !== null && ("cond" in value || "effect" in value)) ?? null;
}

function optionalThen(b: ArgBundle): Then | null {
  return flatten([...b.positional, ...b.named.values()]).find((v): v is Then => v instanceof Then) ?? null;
}

function singleSiteRegion(siteFn: IntFunction): RegionFunction {
  return { eval: (ctx) => [siteFn.eval(ctx)] };
}

function allBoardSites(): RegionFunction {
  return {
    eval: (ctx) => {
      const board = (ctx.game as unknown as { equipment?: { board?: Board1to1 } }).equipment?.board;
      return board ? Array.from({ length: board.numSites }, (_, site) => site) : [];
    },
  };
}

function betweenInt(): IntFunction {
  return { eval: (ctx) => ctx._evalBetween };
}

function addPieceFn(piece: Piece1to1): { what: IntFunction; owner: number; state?: IntFunction } | null {
  const component = piece.component();
  if (component !== null) return { what: component, owner: -1, state: piece.state() ?? undefined };

  const name = piece.getName();
  if (name === null || piece.components() !== null || piece.getNames() !== null) return null;

  const owner = ownerSuffix(name);
  const baseName = name.replace(/\d+$/, "").toLowerCase();
  return {
    what: {
      eval: (ctx) => {
        const pieces = (ctx.game as unknown as { equipment?: { pieces?: Array<{ name: string; owner: number; index: number }> } })
          .equipment?.pieces ?? [];
        const exact = pieces.find((p) => `${p.name}${p.owner}`.toLowerCase() === name.toLowerCase());
        const byBase = pieces.find((p) => p.name.toLowerCase() === baseName && (owner === null || p.owner === owner));
        return exact?.index ?? byBase?.index ?? (owner ?? ctx.state.mover);
      },
    },
    owner: owner ?? -1,
    state: piece.state() ?? undefined,
  };
}

function ownerSuffix(name: string): number | null {
  const match = name.match(/\d+$/);
  return match ? Number(match[0]) : null;
}

function sideRegion(direction: string): RegionFunction {
  if (direction === "N") return new SitesTop();
  if (direction === "S") return new SitesBottom();
  if (direction === "E") return new SitesRight();
  if (direction === "W") return new SitesLeft();
  return {
    eval: (ctx) => {
      const board = (ctx.game as unknown as { equipment?: { board?: Board1to1 } }).equipment?.board;
      if (!board) return [];
      const n = board.numSites;
      const score = sideProjection(direction);
      let best = -Infinity;
      const points: Array<[number, number, number]> = [];
      for (let site = 0; site < n; site += 1) {
        const x = board.trajectories?.xOf(site) ?? site % board.width;
        const y = board.trajectories?.yOf(site) ?? Math.floor(site / board.width);
        const value = score(x, y);
        points.push([site, value, 0]);
        best = Math.max(best, value);
      }
      const tol = board.trajectories ? 0.1 : 0;
      return points.filter(([, value]) => Math.abs(value - best) <= tol).map(([site]) => site);
    },
  };
}

function sideProjection(direction: string): (x: number, y: number) => number {
  switch (direction) {
    case "NE": return (x, y) => x + y;
    case "NW": return (x, y) => y - x;
    case "SE": return (x, y) => x - y;
    case "SW": return (x, y) => -x - y;
    case "NNE": return (x, y) => x * 0.5 + y;
    case "NNW": return (x, y) => -x * 0.5 + y;
    case "SSE": return (x, y) => x * 0.5 - y;
    case "SSW": return (x, y) => -x * 0.5 - y;
    case "ENE": return (x, y) => x + y * 0.5;
    case "ESE": return (x, y) => x - y * 0.5;
    case "WNW": return (x, y) => -x + y * 0.5;
    case "WSW": return (x, y) => -x - y * 0.5;
    default: return () => 0;
  }
}

function isSiteType(value: unknown): value is SiteType {
  return value === "Cell" || value === "Edge" || value === "Vertex";
}

function isConcentricShape(value: unknown): value is ConcentricShapeType {
  return value === "Square" || value === "Triangle" || value === "Hexagon" || value === "Target";
}

function isRoleString(value: unknown): value is EquipmentRoleType {
  return typeof value === "string" && /^(P[1-8]|Neutral|Shared|All|Any|Each|Enemy|Team|Mover|Next|Prev|Player|NonMover)$/.test(value);
}

function isHiddenData(value: unknown): value is HiddenData {
  return value === "What" || value === "Who" || value === "State" || value === "Count" || value === "Rotation" || value === "Value";
}

function isDimFunction(value: unknown): value is DimFunction1to1 {
  return typeof (value as DimFunction1to1 | null)?.eval === "function";
}

function isIntFunction(value: unknown): value is IntFunction {
  return hasEval(value) && !isDirectionsFunction(value) && !isKnownMove(value) && !(value instanceof BooleanConstant) && !(value instanceof IsSolved);
}

function isIntArrayFunction(value: unknown): value is IntArrayFunction {
  return hasEval(value) && !isIntFunction(value) && !isDirectionsFunction(value) && !isKnownMove(value) && !(value instanceof BooleanConstant);
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return hasEval(value) && !(value instanceof IntConstant) && !(value instanceof Face) && !isDirectionsFunction(value) && !isKnownMove(value);
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return hasEval(value) && !(value instanceof IntConstant) && !(value instanceof Face) && !(value instanceof BooleanConstant) && !(value instanceof IsSolved) && !isDirectionsFunction(value) && !isKnownMove(value);
}

function isMovesFunction(value: unknown): value is MovesFunction {
  return hasEval(value) && !(value instanceof Then) && (isKnownMove(value) || (!(value instanceof IntConstant) && !(value instanceof Face) && !(value instanceof BooleanConstant) && !(value instanceof IsSolved) && !isDirectionsFunction(value)));
}

function isDirectionsFunction(value: unknown): value is DirectionsFunction {
  return value instanceof Directions1to1Static || value instanceof Difference || value instanceof Union || value instanceof DirectionIf;
}

function isGraphFunction(value: unknown): value is GraphFunction {
  return typeof (value as GraphFunction | null)?.eval === "function" && typeof (value as GraphFunction | null)?.dim === "function";
}

function isGraphFunctionLike(value: unknown): value is GraphFunction {
  return typeof (value as GraphFunction | null)?.eval === "function" && !isKnownMove(value);
}

function isEndRuleFunction(value: unknown): value is EndRuleFunction {
  return typeof (value as EndRuleFunction | null)?.eval === "function" && (value instanceof EndIf || value instanceof EndForEach);
}

function isItem(value: unknown): value is Item {
  return typeof (value as Item | null)?.type === "function";
}

function isFrom(value: unknown): value is From1to1 {
  return value instanceof From1to1;
}

function isTo(value: unknown): value is To1to1 {
  return value instanceof To1to1;
}

function isPieceArg(value: unknown): value is Piece1to1 {
  return value instanceof Piece1to1;
}

function hasEval(value: unknown): boolean {
  return typeof (value as { eval?: unknown } | null)?.eval === "function";
}

function isKnownMove(value: unknown): value is MovesFunction {
  return value instanceof Add ||
    value instanceof Deal ||
    value instanceof Directional ||
    value instanceof Do ||
    value instanceof Enclose ||
    value instanceof Remove ||
    value instanceof Step ||
    value instanceof SetHidden ||
    value instanceof SetNextPlayer ||
    value instanceof SetScore1to1 ||
    value instanceof SetValuePlayer ||
    value instanceof SetPending ||
    value instanceof SetRotation ||
    value instanceof SetCount1to1 ||
    value instanceof SetState1to1 ||
    value instanceof SetValue ||
    value instanceof SetTrumpSuit ||
    value instanceof SetTeam ||
    value instanceof SetVar1to1 ||
    value instanceof SetCounter ||
    value instanceof SetPot;
}
