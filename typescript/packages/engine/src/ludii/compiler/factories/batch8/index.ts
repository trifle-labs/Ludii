import type { LudemeRegistry } from "../../LudemeRegistry.js";
import type { ArgBundle } from "../../ArgBundle.js";
import type {
  BooleanFunction,
  FloatFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "../../../../ludemes/base.js";
import type { GraphFunction } from "../../../../ludemes/game/functions/graph/GraphFunction.js";

import { BooleanConstant } from "../../../../ludemes/game/functions/booleans/BooleanConstant.js";
import { FloatSqrt1to1 } from "../../../../ludemes/game/functions/floats1to1/math/FloatMath1to1.js";
import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { LastTo } from "../../../../ludemes/game/functions/ints/last/LastTo.js";
import { SizeArray1to1, SizeGroup1to1, SizeStack1to1 } from "../../../../ludemes/game/functions/ints1to1/size/Size1to1.js";
import { SizeLargePiece } from "../../../../ludemes/game/functions/ints/size/largePiece/SizeLargePiece.js";
import { SizeTerritory } from "../../../../ludemes/game/functions/ints/size/connection/SizeTerritory.js";
import { Sizes } from "../../../../ludemes/game/functions/intArray/sizes/Sizes.js";
import { Skew } from "../../../../ludemes/game/functions/graph/operators/Skew.js";
import { SplitCrossings } from "../../../../ludemes/game/functions/graph/operators/SplitCrossings.js";
import { Spiral } from "../../../../ludemes/game/functions/graph/generators/shape/Spiral.js";
import { constructSquare } from "../../../../ludemes/game/functions/graph/generators/basis/square/Square.js";
import { CustomOnSquare } from "../../../../ludemes/game/functions/graph/generators/basis/square/CustomOnSquare.js";
import type { DiagonalsType } from "../../../../ludemes/game/functions/graph/generators/basis/square/DiagonalsType.js";
import type { SquareShapeType } from "../../../../ludemes/game/functions/graph/generators/basis/square/SquareShapeType.js";
import { Region } from "../../../../ludemes/game/util/equipment/Region.js";
import { Sites } from "../../../../ludemes/game/functions/region/sites/Sites.js";
import { SitesContext } from "../../../../ludemes/game/functions/region/sites/context/SitesContext.js";
import { SitesCoords } from "../../../../ludemes/game/functions/region/sites/coords/SitesCoords.js";
import { SitesCrossing } from "../../../../ludemes/game/functions/region/sites/crossing/SitesCrossing.js";
import { SitesCustom } from "../../../../ludemes/game/functions/region/sites/custom/SitesCustom.js";
import { SitesBetween } from "../../../../ludemes/game/functions/region/sites/between/SitesBetween.js";
import { SitesBetween as MoveSitesBetween } from "../../../../ludemes/game/functions/region/sites/moves/SitesBetween.js";
import { SitesFrom } from "../../../../ludemes/game/functions/region/sites/moves/SitesFrom.js";
import { SitesTo } from "../../../../ludemes/game/functions/region/sites/moves/SitesTo.js";
import { SitesGroup } from "../../../../ludemes/game/functions/region/sites/group/SitesGroup.js";
import { SitesHiddenCount } from "../../../../ludemes/game/functions/region/sites/hidden/SitesHiddenCount.js";
import { SitesHidden1to1 } from "../../../../ludemes/game/functions/region/sites/hidden/SitesHidden1to1.js";
import { SitesHiddenRotation } from "../../../../ludemes/game/functions/region/sites/hidden/SitesHiddenRotation.js";
import { SitesHiddenState } from "../../../../ludemes/game/functions/region/sites/hidden/SitesHiddenState.js";
import { SitesHiddenValue } from "../../../../ludemes/game/functions/region/sites/hidden/SitesHiddenValue.js";
import { SitesHiddenWhat } from "../../../../ludemes/game/functions/region/sites/hidden/SitesHiddenWhat.js";
import { SitesHiddenWho } from "../../../../ludemes/game/functions/region/sites/hidden/SitesHiddenWho.js";
import { SitesIncident } from "../../../../ludemes/game/functions/region/sites/incidents/SitesIncident.js";
import { SitesLargePiece } from "../../../../ludemes/game/functions/region/sites/largePiece/SitesLargePiece.js";
import { SitesLineOfSight } from "../../../../ludemes/game/functions/region/sites/lineOfSight/SitesLineOfSight.js";
import { LineOfSightType } from "../../../../ludemes/game/functions/region/sites/LineOfSightType.js";
import { SitesLoop } from "../../../../ludemes/game/functions/region/sites/loop/SitesLoop.js";
import { SitesOccupied } from "../../../../ludemes/game/functions/region/sites/occupied/SitesOccupied.js";
import { SitesPattern1to1 } from "../../../../ludemes/game/functions/region/sites/pattern/SitesPattern1to1.js";
import { SitesRandom } from "../../../../ludemes/game/functions/region/sites/random/SitesRandom.js";
import { SitesDistance1to1 } from "../../../../ludemes/game/functions/region/sites/distance/SitesDistance1to1.js";
import { SitesStart } from "../../../../ludemes/game/functions/region/sites/piece/SitesStart.js";
import { SitesTrack } from "../../../../ludemes/game/functions/region/sites/track/SitesTrack.js";
import { SitesWalk1to1 } from "../../../../ludemes/game/functions/region/sites/walk/SitesWalk1to1.js";
import { SitesHand } from "../../../../ludemes/game/functions/region/sites/player/SitesHand.js";
import { SitesEquipmentRegion } from "../../../../ludemes/game/functions/region/sites/player/SitesEquipmentRegion.js";
import { SitesWinning } from "../../../../ludemes/game/functions/region/sites/player/SitesWinning.js";
import { SitesBottom } from "../../../../ludemes/game/functions/region/sites/simple/SitesBottom.js";
import { SitesCentre } from "../../../../ludemes/game/functions/region/sites/simple/SitesCentre.js";
import { SitesConcaveCorners } from "../../../../ludemes/game/functions/region/sites/simple/SitesConcaveCorners.js";
import { SitesConvexCorners } from "../../../../ludemes/game/functions/region/sites/simple/SitesConvexCorners.js";
import { SitesHint } from "../../../../ludemes/game/functions/region/sites/simple/SitesHint.js";
import { SitesLeft } from "../../../../ludemes/game/functions/region/sites/simple/SitesLeft.js";
import { SitesRight } from "../../../../ludemes/game/functions/region/sites/simple/SitesRight.js";
import { SitesTop } from "../../../../ludemes/game/functions/region/sites/simple/SitesTop.js";
import { SitesColumn } from "../../../../ludemes/game/functions/region/sites/index/SitesColumn.js";
import { SitesCell } from "../../../../ludemes/game/functions/region/sites/index/SitesCell.js";
import { SitesEdge } from "../../../../ludemes/game/functions/region/sites/index/SitesEdge.js";
import { SitesAngled1to1, SitesAxial1to1, SitesHorizontal1to1, SitesSlash1to1, SitesSlosh1to1, SitesVertical1to1 } from "../../../../ludemes/game/functions/region/sites/edges/SitesEdge1to1.js";
import { SitesEmpty } from "../../../../ludemes/game/functions/region/sites/index/SitesEmpty.js";
import { SitesLayer } from "../../../../ludemes/game/functions/region/sites/index/SitesLayer.js";
import { SitesRow } from "../../../../ludemes/game/functions/region/sites/index/SitesRow.js";
import { SitesState } from "../../../../ludemes/game/functions/region/sites/index/SitesState.js";
import { SitesSupport } from "../../../../ludemes/game/functions/region/sites/index/SitesSupport.js";
import { Slide } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Slide.js";
import { Sow } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Sow.js";
import type { Then } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Then.js";
import type { MovesLike, ThenLike } from "../../../../ludemes/game/rules/play/moves/Moves.js";
import { Deal1to1 } from "../../../../ludemes/game/rules/start/Deal.js";
import { Split1to1 } from "../../../../ludemes/game/rules/start/split/Split.js";
import type { SplitType } from "../../../../ludemes/game/rules/start/split/SplitType.js";
import { Start1to1 } from "../../../../ludemes/game/rules/start/Start.js";
import type { StartRule } from "../../../../ludemes/game/rules/start/StartRule.js";
import { SetHidden1to1, type HiddenData } from "../../../../ludemes/game/rules/start/set/hidden/SetHidden.js";
import { SetAmount1to1 } from "../../../../ludemes/game/rules/start/set/player/SetAmount.js";
import { SetScore1to1 } from "../../../../ludemes/game/rules/start/set/player/SetScore.js";
import { SetTeam1to1 } from "../../../../ludemes/game/rules/start/set/players/SetTeam.js";
import { SetRememberValue1to1 } from "../../../../ludemes/game/rules/start/set/remember/SetRememberValue.js";
import { SetCost1to1 } from "../../../../ludemes/game/rules/start/set/sites/SetCost.js";
import { SetCount1to1 } from "../../../../ludemes/game/rules/start/set/sites/SetCount.js";
import { SetPhase1to1 } from "../../../../ludemes/game/rules/start/set/sites/SetPhase.js";
import { SetSite1to1 } from "../../../../ludemes/game/rules/start/set/sites/SetSite.js";

export function registerBatch8(registry: LudemeRegistry): void {
  registry.registerLudeme("sites:region", makeRegion);

  for (const key of [
    "sites:sites",
    "sites:group",
    "sites:crossing",
    "sites:from",
    "sites:between",
    "sites:to",
    "sites:loop",
    "sites:pattern",
    "sites:random",
    "sites:largepiece",
    "sites:hidden",
    "sites:start",
    "sites:occupied",
    "sites:incident",
    "sites:around",
    "sites:direction",
    "sites:lineofsight",
    "sites:row",
    "sites:column",
    "sites:phase",
    "sites:cell",
    "sites:edge",
    "sites:state",
    "sites:empty",
    "sites:layer",
    "sites:support",
    "sites:side",
    "sites:hand",
    "sites:winning",
    "sites:track",
    "sites:distance",
  ]) {
    registry.registerLudeme(key, makeSites);
  }

  registry.registerLudeme("size:size", makeSize);
  registry.registerLudeme("sizes:sizes", makeSizes);
  registry.registerLudeme("skew:skew", makeSkew);
  registry.registerLudeme("slide:slide", makeSlide);
  registry.registerLudeme("sow:sow", makeSow);
  registry.registerLudeme("spiral:spiral", makeSpiral);
  registry.registerLudeme("split:split", makeSplit);
  registry.registerLudeme("splitcrossings:splitcrossings", makeSplitCrossings);
  registry.registerLudeme("sqrt:sqrt", makeSqrt);
  registry.registerLudeme("square:square", makeSquare);
  registry.registerLudeme("start:start", makeStart);
  registry.registerLudeme("start.deal:deal", makeDeal);
  registry.registerLudeme("start.set.set:set", makeStartSet);
}

function makeRegion(b: ArgBundle): Region {
  const sites = firstNumberArray(b);
  return sites ? new Region(sites) : new Region();
}

function makeSites(b: ArgBundle): RegionFunction {
  const first = stringAt(b, 0);
  switch (first) {
    case undefined:
      return new SitesContext();
    case "Group":
      return new SitesGroup(startArrayFn(named(b, "at"), named(b, "from")), boolOrNull(named(b, "if")), directionName(positionalAfterFirstString(b)), boolOrNull(named(b, "isvisible")));
    case "Crossing":
      return new SitesCrossing(requireIntFn(named(b, "at")), playerOrRoleFn(positionalAfterFirstString(b)[0] ?? null));
    case "From":
      return new SitesFrom(requireMoves(positionalAfterFirstString(b)[0]));
    case "Between":
      if (isMovesFunction(positionalAfterFirstString(b)[0])) return new MoveSitesBetween(requireMoves(positionalAfterFirstString(b)[0]));
      return new SitesBetween(
        directionsFunction(directionName(positionalAfterFirstString(b))),
        siteTypeAt(b),
        requireIntFn(named(b, "from")),
        boolOrNull(named(b, "fromincluded")),
        requireIntFn(named(b, "to")),
        boolOrNull(named(b, "toincluded")),
        boolOrNull(named(b, "cond")),
      );
    case "To":
      return new SitesTo(requireMoves(positionalAfterFirstString(b)[0]));
    case "Loop":
      return new SitesLoop(
        roleListFns(named(b, "surround"), positionalAfterFirstString(b)),
        intOrDefault(lastIntLike(positionalAfterFirstString(b)), new LastTo()),
        regionOrNull(lastRegionLike(positionalAfterFirstString(b))),
        directionName(positionalAfterFirstString(b)),
        intOrDefault(lastIntLike(positionalAfterFirstString(b)), moverFn()),
        boolOrDefault(named(b, "inside"), false),
      );
    case "Pattern":
      return new SitesPattern1to1(stepArray(positionalAfterFirstString(b)[0]), intOrDefault(named(b, "from"), new LastTo()), intFnArray(named(b, "whats") ?? named(b, "what")));
    case "Random":
      return new SitesRandom(regionOrNull(positionalAfterFirstString(b)[0]) ?? emptyRegionFn(), intOrDefault(named(b, "num"), constInt(1)));
    case "LargePiece":
      return new SitesLargePiece(siteTypeAt(b), requireIntFn(named(b, "at")));
    case "Hidden":
      return hiddenSites(b);
    case "Start":
      return new SitesStart(pieceIndexFn(positionalAfterFirstString(b)[0]));
    case "Occupied":
      return new SitesOccupied(playerOrRoleFn(named(b, "by")), roleOrNull(named(b, "by")) as never, intOrNull(named(b, "component")), boolValue(named(b, "top"), true), siteTypeNamed(b, "on"));
    case "Incident":
      return new SitesIncident(siteTypeAt(b) ?? "Cell", siteTypeNamed(b, "of") ?? "Cell", requireIntFn(named(b, "at")), intOrNull(named(b, "owner")));
    case "Around":
      throw deferred("sites Around");
    case "Direction":
      throw deferred("sites Direction");
    case "LineOfSight":
      return new SitesLineOfSight(lineOfSightType(positionalAfterFirstString(b)), siteTypeAt(b), intOrDefault(named(b, "at"), constInt(-1)), directionName(positionalAfterFirstString(b)));
    case "Distance":
      return distanceSites(b);
    case "Side":
      throw deferred("sites Side");
    case "Hand":
      return new SitesHand(playerOrRoleMaybe(positionalAfterFirstString(b)[0]), roleOrNull(positionalAfterFirstString(b)[0]));
    case "Winning":
      return new SitesWinning(playerOrRoleMaybe(positionalAfterFirstString(b)[0]), requireMoves(positionalAfterFirstString(b)[1]) as unknown as MovesLike);
    case "Track":
      return new SitesTrack(playerOrRoleMaybe(positionalAfterFirstString(b)[0]), stringOrNull(positionalAfterFirstString(b)[1]), intOrNull(named(b, "from")), intOrNull(named(b, "to")));
    default:
      return makeAmbiguousSites(b, first);
  }
}

function makeAmbiguousSites(b: ArgBundle, first: string): RegionFunction {
  if (isSitesEdgeType(first)) return edgeSites(first);
  if (isSitesSimpleType(first)) return simpleSites(first, siteTypeAt(b));
  if (isSitesIndexType(first)) return indexSites(first, siteTypeAt(b), intOrNull(positionalAfterFirstString(b)[0]));
  if (isSiteType(first)) {
    const strings = firstArrayOfStrings(b) ?? positionalAfterFirstString(b).find(isStringArray);
    if (strings) return new SitesCoords(first, strings);
    const index = positionalAfterFirstString(b).find(isIntLike);
    const steps = positionalAfterFirstString(b).find(isStringArray);
    if (steps) return new SitesWalk1to1(intOrDefault(index, new LastTo()), [steps], boolOrDefault(named(b, "rotations"), true));
  }
  const coords = firstArrayOfStrings(b);
  if (coords) return new SitesCoords(null, coords);
  const numbers = firstNumberArray(b);
  if (numbers) return new SitesCustom(arrayFn(numbers));
  const intArray = firstIntArrayFn(b);
  if (intArray) return new SitesCustom(intArray);
  return Sites.constructEquipmentOrCoord(playerOrRoleMaybe(first), roleOrNull(first), siteTypeAt(b), stringOrNull(positionalAfterFirstString(b).find(isString)));
}

function simpleSites(type: string, siteType: string | null): RegionFunction {
  switch (type) {
    case "Bottom": return new SitesBottom(siteType);
    case "Centre": return new SitesCentre(siteType);
    case "ConcaveCorners": return new SitesConcaveCorners(siteType);
    case "ConvexCorners": return new SitesConvexCorners(siteType);
    case "Hint": return new SitesHint();
    case "Left": return new SitesLeft(siteType);
    case "Right": return new SitesRight(siteType);
    case "Top": return new SitesTop(siteType);
    case "Board":
    case "Corners":
    case "Inner":
    case "LineOfPlay":
    case "Major":
    case "Minor":
    case "Outer":
    case "Pending":
    case "Perimeter":
    case "Playable":
    case "ToClear":
    case "LastTo":
    case "LastFrom":
      return Sites.constructSimple(type as never, siteType);
    default:
      throw deferred(`sites ${type}`);
  }
}

function indexSites(type: string, siteType: string | null, index: IntFunction | null): RegionFunction {
  switch (type) {
    case "Cell": return new SitesCell(siteType, index);
    case "Column": return new SitesColumn(siteType, index);
    case "Edge": return new SitesEdge(siteType, index);
    case "Empty": return new SitesEmpty(siteType, constInt(0));
    case "Layer": return new SitesLayer(siteType, index);
    case "Row": return new SitesRow(siteType, index);
    case "State": return new SitesState(siteType, index ?? constInt(0));
    case "Support": return new SitesSupport(siteType, index);
    case "Phase": return Sites.constructIndex(type as never, siteType, index);
    default: throw deferred(`sites ${type}`);
  }
}

function hiddenSites(b: ArgBundle): RegionFunction {
  const dataType = positionalAfterFirstString(b).find(isHiddenData) ?? null;
  const who = playerOrRoleFn(named(b, "to"));
  const siteType = siteTypeAt(b);
  switch (dataType) {
    case null:
      return hiddenAllSites(named(b, "to"));
    case "What": return new SitesHiddenWhat(siteType, who);
    case "Who": return new SitesHiddenWho(siteType, who);
    case "Count": return new SitesHiddenCount(siteType, who);
    case "State": return new SitesHiddenState(siteType, who);
    case "Rotation": return new SitesHiddenRotation(siteType, who);
    case "Value": return new SitesHiddenValue(siteType, who);
  }
}

function distanceSites(b: ArgBundle): RegionFunction {
  const range = named(b, "range") ?? b.positional[b.positional.length - 1];
  if (!isRangeLike(range)) throw deferred("sites Distance");
  return new SitesDistance1to1(
    requireIntFn(named(b, "from")),
    intOrDefault(range.min, constInt(1)),
    intOrDefault(range.max, constInt(1)),
    stringOrNull(b.positional.find((v) => typeof v === "string" && v !== "Distance" && !isSiteType(v))) ?? "Adjacent",
  );
}

function makeSize(b: ArgBundle): IntFunction {
  const kind = stringAt(b, 0);
  switch (kind) {
    case "Group":
      return new SizeGroup1to1(requireIntFn(named(b, "at")), directionName(positionalAfterFirstString(b)));
    case "LargePiece":
      return new SizeLargePiece(siteTypeAt(b) as never, intOrNull(named(b, "at")) as never, regionOrNull(named(b, "in")) as never);
    case "Stack":
      return new SizeStack1to1(intOrDefault(named(b, "at") ?? b.positional.find(isIntLike), new LastTo()));
    case "Array":
      return new SizeArray1to1(arrayAsRegion(requireIntArrayFn(positionalAfterFirstString(b)[0])));
    case "Territory":
      return new SizeTerritory(siteTypeAt(b) as never, roleOrNull(positionalAfterFirstString(b)[0]) as never, playerOrRoleFn(positionalAfterFirstString(b)[0]) as never, directionName(positionalAfterFirstString(b)));
    default:
      throw deferred(`size ${kind ?? ""}`.trim());
  }
}

function makeSizes(b: ArgBundle): IntArrayFunction {
  if (stringAt(b, 0) !== "Group") throw deferred(`sizes ${stringAt(b, 0) ?? ""}`.trim());
  const selector = positionalAfterFirstString(b).find((v) => isRole(v) || isIntLike(v) || isBooleanFunction(v));
  const condition = isBooleanFunction(selector) ? selector : boolOrNull(named(b, "if"));
  const allPieces = selector === undefined || selector === "All";
  return Sizes.construct(
    "Group" as never,
    siteTypeAt(b),
    directionName(positionalAfterFirstString(b)),
    playerOrRoleFn(selector ?? "All"),
    intOrDefault(named(b, "min"), constInt(0)),
    condition,
    allPieces,
    boolOrNull(named(b, "isvisible")),
  );
}

function makeSkew(b: ArgBundle): Skew {
  return new Skew(requireNumber(b.positional[0]), requireGraph(b.positional[1]));
}

function makeSlide(b: ArgBundle): Slide {
  const from = b.positional.find(isFromLike);
  const between = b.positional.find(isBetweenLike);
  const to = b.positional.find(isToLike);
  return new Slide({
    startLocationFn: from?.locFn() ?? constIntFromContext("_evalFrom"),
    levelFromFn: from?.levelFn() ?? null,
    fromCondition: from?.condFn() ?? null,
    limit: between?.rangeFn()?.[1],
    minFn: between?.rangeFn()?.[0],
    goRule: between?.condition() ?? new BooleanConstant(true),
    stopRule: to?.condFn() ?? null,
    toRule: to?.condFn() ?? null,
    letFn: between?.trailFn() ?? null,
    dirnName: directionName(b.positional),
    trackName: b.positional.find((v): v is string => typeof v === "string" && !isDirection(v)) ?? null,
    stack: boolValue(named(b, "stack"), false),
    then: b.positional.find(isThen) ?? null,
  });
}

function makeSow(b: ArgBundle): Sow {
  const start = b.positional.find(isIntLike);
  return new Sow({
    startLoc: intOrDefault(start, new LastTo()),
    countFn: intOrDefault(named(b, "count"), constInt(1)),
    numPerHoleFn: intOrDefault(named(b, "numperhole"), constInt(1)),
    captureRule: boolOrDefault(named(b, "if"), true),
    origin: boolOrDefault(named(b, "origin"), false),
    trackName: b.positional.find((v): v is string => typeof v === "string" && !isSiteType(v)) ?? null,
    ownerFn: intOrNull(named(b, "owner")),
    includeSelf: boolValue(named(b, "includeself"), true),
    skipFn: boolOrNull(named(b, "skipif")),
    captureEffect: movesOrNull(named(b, "apply")),
    sowEffect: movesOrNull(named(b, "soweffect")),
    backtracking: boolOrNull(named(b, "backtracking")),
    forward: boolOrNull(named(b, "forward")),
    then: (b.positional.find(isThen) ?? null) as unknown as ThenLike | null,
  });
}

function makeSpiral(b: ArgBundle): Spiral {
  return new Spiral(requireNumber(named(b, "turns")), requireNumber(named(b, "sites")), boolValue(named(b, "clockwise"), true));
}

function makeSplit(b: ArgBundle): Split1to1 {
  return new Split1to1(requireStringValue(b.positional[0]) as SplitType);
}

function makeSplitCrossings(b: ArgBundle): SplitCrossings {
  return new SplitCrossings(requireGraph(b.positional[0]));
}

function makeSqrt(b: ArgBundle): FloatSqrt1to1 {
  const value = b.positional[0];
  return new FloatSqrt1to1(isFloatFunction(value) ? value : { eval: () => requireNumber(value) });
}

function makeSquare(b: ArgBundle): GraphFunction {
  const sides = firstNumberArray(b);
  const poly = b.positional.find(isPolyLike);
  const diagonals = named(b, "diagonals") as DiagonalsType | undefined;
  if (poly) return new CustomOnSquare(poly, diagonals ?? null, true);
  if (sides) return new CustomOnSquare(sides, diagonals ?? null);
  const shape = isSquareShape(stringAt(b, 0)) ? stringAt(b, 0) as SquareShapeType : null;
  const dim = b.positional.find((v) => typeof v === "number");
  return constructSquare(shape, requireNumber(dim), diagonals ?? null, boolValue(named(b, "pyramidal"), false));
}

function makeStart(b: ArgBundle): Start1to1 {
  const rules = flatten(b.positional).filter(isStartRule);
  if (rules.length === 0) throw new Error("factory start: missing start rule");
  return new Start1to1(rules as StartRule[]);
}

function makeDeal(b: ArgBundle): Deal1to1 {
  return new Deal1to1(requireStringValue(b.positional[0]) as never, numberOrDefault(b.positional[1], 1));
}

function makeStartSet(b: ArgBundle): StartRule {
  const kind = stringAt(b, 0);
  switch (kind) {
    case "Hidden":
      return makeSetHidden(b);
    case "RememberValue":
      return makeSetRememberValue(b);
    case "Team":
      return new SetTeam1to1(requireNumber(b.positional[1]), requireRoleOwnerArray(b.positional[2]));
    case "Count":
      return new SetCount1to1(startSetSites(b), requireNumber(b.positional[1]));
    case "Cost":
      return new SetCost1to1(startSetSites(b), requireNumber(b.positional[1]));
    case "Phase":
      return new SetPhase1to1(startSetSites(b), requireNumber(b.positional[1]));
    case "Amount":
      return new SetAmount1to1(roleOwnerOrNull(b.positional[1]), requireLastNumber(b));
    case "Score": {
      const role = stringOrNull(b.positional[1]);
      const score = requireLastNumber(b);
      if (role === null || role === "Each" || role === "All") return new SetScore1to1(null, [score], true);
      return new SetScore1to1([requireStaticPlayerId(role, "set Score")], [score], false);
    }
  }
  const role = roleOrNull(b.positional[0]);
  if (role === null) throw deferred(`set ${stringAt(b, 0) ?? ""}`.trim());
  const owner = roleToOwner(role);
  const loc = b.positional.find((v, i) => i > 0 && typeof v === "number");
  const locs = firstNumberArray(b);
  if (typeof loc === "number" || locs) return new SetSite1to1(owner, typeof loc === "number" ? loc : -1, locs ?? null);
  throw deferred("set role sites");
}

function edgeSites(type: string): RegionFunction {
  switch (type) {
    case "Angled": return new SitesAngled1to1();
    case "Axial": return new SitesAxial1to1();
    case "Horizontal": return new SitesHorizontal1to1();
    case "Vertical": return new SitesVertical1to1();
    case "Slash": return new SitesSlash1to1();
    case "Slosh": return new SitesSlosh1to1();
    default: throw deferred(`sites ${type}`);
  }
}

function hiddenAllSites(to: unknown): RegionFunction {
  const { fixedPid, roleStr } = hiddenPlayerArgs(to);
  return new SitesHidden1to1(fixedPid, roleStr);
}

function hiddenPlayerArgs(value: unknown): { fixedPid: number; roleStr: string } {
  if (typeof value === "number" && value >= 1) return { fixedPid: value, roleStr: `p${value}` };
  if (typeof value === "string") {
    const roleStr = value.toLowerCase();
    if (/^p\d+$/.test(roleStr)) return { fixedPid: Number(roleStr.slice(1)), roleStr };
    return { fixedPid: -1, roleStr };
  }
  return { fixedPid: -1, roleStr: "mover" };
}

function makeSetHidden(b: ArgBundle): SetHidden1to1 {
  return new SetHidden1to1(
    hiddenDataArray(b),
    startSetSites(b, false),
    numberOrDefault(named(b, "level"), 0),
    boolValue(named(b, "value"), true),
    requireStaticPlayerId(requireRoleString(named(b, "to")), "set Hidden"),
  );
}

function makeSetRememberValue(b: ArgBundle): SetRememberValue1to1 {
  const rest = positionalAfterFirstString(b);
  const name = typeof rest[0] === "string" ? rest[0] : null;
  const value = name === null ? rest[0] : rest[1];
  return new SetRememberValue1to1(name, numberArrayFromValue(value), boolValue(named(b, "unique"), false));
}

function hiddenDataArray(b: ArgBundle): readonly HiddenData[] | null {
  const values = positionalAfterFirstString(b).filter(isHiddenData);
  return values.length === 0 ? null : values;
}

function startSetSites(b: ArgBundle, includeNamedTo = true): number[] {
  const at = named(b, "at");
  if (typeof at === "number") return [at];
  if (includeNamedTo) {
    const to = named(b, "to");
    if (to !== undefined && to !== null) return numberArrayFromValue(to);
  }
  const region = b.positional.find((v) => v instanceof Region);
  if (region instanceof Region) return region.sites();
  const sites = firstNumberArray(b);
  if (sites) return sites;
  const loc = b.positional.find((v, i) => i > 0 && typeof v === "number");
  if (typeof loc === "number") return [loc];
  throw deferred("set dynamic region");
}

function numberArrayFromValue(value: unknown): number[] {
  if (typeof value === "number") return [value];
  if (value instanceof Region) return value.sites();
  if (Array.isArray(value)) return value.map((v) => requireNumber(v));
  throw deferred("set numeric sites");
}

function requireLastNumber(b: ArgBundle): number {
  for (let i = b.positional.length - 1; i >= 0; i--) {
    const value = b.positional[i];
    if (typeof value === "number") return value;
  }
  throw deferred(`set ${stringAt(b, 0) ?? ""}`.trim());
}

function requireRoleString(value: unknown): string {
  if (typeof value === "string") return value;
  throw deferred("set role");
}

function roleOwnerOrNull(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw deferred("set role");
  if (value === "All" || value === "Each") return null;
  return requireStaticPlayerId(value, "set role");
}

function requireRoleOwnerArray(value: unknown): number[] {
  if (!Array.isArray(value)) throw deferred("set Team roles");
  return value.map((role) => requireStaticPlayerId(requireRoleString(role), "set Team"));
}

function requireStaticPlayerId(role: string, keyword: string): number {
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  if (role === "Neutral" || role === "Shared") return 0;
  throw deferred(`${keyword} ${role}`);
}

function named(b: ArgBundle, key: string): unknown {
  return b.named.get(key.toLowerCase());
}

function stringAt(b: ArgBundle, index: number): string | undefined {
  const value = b.positional[index];
  return typeof value === "string" ? value : undefined;
}

function positionalAfterFirstString(b: ArgBundle): unknown[] {
  return typeof b.positional[0] === "string" ? [...b.positional.slice(1)] : [...b.positional];
}

function flatten(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) Array.isArray(value) ? out.push(...flatten(value)) : out.push(value);
  return out;
}

function requireNumber(value: unknown): number {
  if (typeof value !== "number") throw new Error("factory batch8: expected number");
  return value;
}

function numberOrDefault(value: unknown, defaultValue: number): number {
  return typeof value === "number" ? value : defaultValue;
}

function requireStringValue(value: unknown): string {
  if (typeof value !== "string") throw new Error("factory batch8: expected string");
  return value;
}

function requireGraph(value: unknown): GraphFunction {
  if (!isGraphFunction(value)) throw new Error("factory batch8: expected graph function");
  return value;
}

function requireMoves(value: unknown): MovesFunction {
  if (!isMovesFunction(value)) throw new Error("factory batch8: expected moves");
  return value;
}

function requireIntFn(value: unknown): IntFunction {
  const fn = intOrNull(value);
  if (fn === null) throw new Error("factory batch8: expected int function");
  return fn;
}

function requireIntArrayFn(value: unknown): IntArrayFunction {
  if (isIntArrayFunction(value)) return value;
  if (Array.isArray(value)) return arrayFn(value.map((v) => requireNumber(v)));
  throw new Error("factory batch8: expected int array function");
}

function intOrNull(value: unknown): IntFunction | null {
  if (typeof value === "number") return constInt(value);
  return isIntFunction(value) ? value : null;
}

function intOrDefault(value: unknown, defaultValue: IntFunction): IntFunction {
  return intOrNull(value) ?? defaultValue;
}

function constInt(value: number): IntFunction {
  return new IntConstant(value);
}

function constIntFromContext(field: "_evalFrom" | "_evalTo"): IntFunction {
  return { eval: (ctx) => ctx[field] };
}

function moverFn(): IntFunction {
  return { eval: (ctx) => ctx.state.mover };
}

function playerOrRoleFn(value: unknown): IntFunction {
  if (isIntFunction(value) || typeof value === "number") return requireIntFn(value);
  if (typeof value === "string") {
    if (value === "Mover") return moverFn();
    if (value === "Next") return { eval: (ctx) => ((ctx.state as unknown as { next?: number }).next ?? ctx.state.mover) };
    if (/^P\d+$/.test(value)) return constInt(Number(value.slice(1)));
    if (value === "All" || value === "Neutral") return constInt(-1);
  }
  return constInt(-1);
}

function playerOrRoleMaybe(value: unknown): IntFunction | null {
  if (value === undefined || value === null) return null;
  return playerOrRoleFn(value);
}

function roleOrNull(value: unknown): string | null {
  return typeof value === "string" && isRole(value) ? value : null;
}

function roleToOwner(role: string): number {
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  if (role === "Neutral" || role === "Shared") return 0;
  return 0;
}

function boolOrNull(value: unknown): BooleanFunction | null {
  if (typeof value === "boolean") return new BooleanConstant(value);
  return isBooleanFunction(value) ? value : null;
}

function boolOrDefault(value: unknown, defaultValue: boolean): BooleanFunction {
  return boolOrNull(value) ?? new BooleanConstant(defaultValue);
}

function boolValue(value: unknown, defaultValue: boolean): boolean {
  return typeof value === "boolean" ? value : defaultValue;
}

function movesOrNull(value: unknown): MovesFunction | null {
  return isMovesFunction(value) ? value : null;
}

function regionOrNull(value: unknown): RegionFunction | null {
  return isRegionFunction(value) ? value : null;
}

function startArrayFn(at: unknown, from: unknown): IntArrayFunction {
  const atFn = intOrNull(at);
  if (atFn) return { eval: (ctx) => [atFn.eval(ctx)] };
  const region = regionOrNull(from);
  if (region) return { eval: (ctx) => region.eval(ctx) };
  return arrayFn([]);
}

function arrayFn(values: readonly number[]): IntArrayFunction {
  return { eval: () => [...values] };
}

function arrayAsRegion(array: IntArrayFunction): RegionFunction {
  return { eval: (ctx) => array.eval(ctx) };
}

function emptyRegionFn(): RegionFunction {
  return { eval: () => [] };
}

function directionName(values: readonly unknown[]): string {
  return values.find((v): v is string => typeof v === "string" && isDirection(v)) ?? "Adjacent";
}

function directionsFunction(direction: string): { eval: () => string[] } {
  return { eval: () => [direction] };
}

function siteTypeAt(b: ArgBundle): string | null {
  return b.positional.find((v): v is string => typeof v === "string" && isSiteType(v)) ?? null;
}

function siteTypeNamed(b: ArgBundle, key: string): string | null {
  const value = named(b, key);
  return typeof value === "string" && isSiteType(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function firstNumberArray(b: ArgBundle): number[] | null {
  const arr = findNumberArray(b.positional);
  return arr ?? null;
}

function findNumberArray(values: readonly unknown[]): number[] | null {
  for (const value of values) {
    if (Array.isArray(value)) {
      if (value.every((v) => typeof v === "number")) return value;
      const nested = findNumberArray(value);
      if (nested) return nested;
    }
  }
  return null;
}

function firstArrayOfStrings(b: ArgBundle): string[] | null {
  const arr = flatten(b.positional).find(isStringArray);
  return arr ?? null;
}

function firstIntArrayFn(b: ArgBundle): IntArrayFunction | null {
  return flatten(b.positional).find(isIntArrayFunction) ?? null;
}

function intFnArray(value: unknown): readonly IntFunction[] | null {
  if (Array.isArray(value)) return value.map(requireIntFn);
  const fn = intOrNull(value);
  return fn ? [fn] : null;
}

function roleListFns(namedSurround: unknown, positional: readonly unknown[]): IntFunction[] | null {
  const source = namedSurround ?? positional.find((v) => Array.isArray(v) && v.every(isRole)) ?? positional.find(isRole);
  if (Array.isArray(source)) return source.map(playerOrRoleFn);
  return typeof source === "string" && isRole(source) ? [playerOrRoleFn(source)] : null;
}

function lastIntLike(values: readonly unknown[]): unknown {
  return [...values].reverse().find(isIntLike);
}

function lastRegionLike(values: readonly unknown[]): unknown {
  return [...values].reverse().find(isRegionFunction);
}

function pieceIndexFn(value: unknown): IntFunction {
  if (isIntFunction(value) || typeof value === "number") return requireIntFn(value);
  if (value && typeof value === "object" && "index" in value && typeof (value as { index: unknown }).index === "number") {
    return constInt((value as { index: number }).index);
  }
  return constInt(-1);
}

function stepArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(isString);
  return typeof value === "string" ? [value] : [];
}

function lineOfSightType(values: readonly unknown[]): LineOfSightType | null {
  const value = values.find((v): v is string => typeof v === "string" && Object.values(LineOfSightType).includes(v as LineOfSightType));
  return value ? value as LineOfSightType : null;
}

function isRangeLike(value: unknown): value is { min: unknown; max: unknown } {
  return value !== null && typeof value === "object" && "min" in value && "max" in value;
}

function isPolyLike(value: unknown): value is [number, number][] {
  return Array.isArray(value) && value.every((point) => Array.isArray(point) && point.length === 2 && point.every((n) => typeof n === "number"));
}

function isSquareShape(value: unknown): value is SquareShapeType {
  return typeof value === "string" && ["NoShape", "Square", "Rectangle", "Diamond", "Limping"].includes(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isIntLike(value: unknown): boolean {
  return typeof value === "number" || isIntFunction(value);
}

function isIntFunction(value: unknown): value is IntFunction {
  return typeof (value as IntFunction | null)?.eval === "function";
}

function isIntArrayFunction(value: unknown): value is IntArrayFunction {
  return typeof (value as IntArrayFunction | null)?.eval === "function";
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return typeof (value as BooleanFunction | null)?.eval === "function";
}

function isFloatFunction(value: unknown): value is FloatFunction {
  return typeof (value as FloatFunction | null)?.eval === "function";
}

function isGraphFunction(value: unknown): value is GraphFunction {
  return typeof (value as GraphFunction | null)?.eval === "function" && typeof (value as GraphFunction | null)?.dim === "function";
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return typeof (value as RegionFunction | null)?.eval === "function";
}

function isMovesFunction(value: unknown): value is MovesFunction {
  return typeof (value as MovesFunction | null)?.eval === "function";
}

function isStartRule(value: unknown): value is StartRule {
  return (
    typeof (value as StartRule | null)?.applyToInitialState === "function" ||
    typeof (value as { eval?: unknown } | null)?.eval === "function"
  );
}

function isThen(value: unknown): value is Then {
  return value !== null && typeof value === "object" && "then" in value;
}

function isFromLike(value: unknown): value is {
  locFn(): IntFunction | null;
  levelFn(): IntFunction | null;
  condFn(): BooleanFunction | null;
} {
  return value !== null && typeof value === "object" && typeof (value as { locFn?: unknown }).locFn === "function";
}

function isBetweenLike(value: unknown): value is {
  rangeFn(): [IntFunction, IntFunction] | null;
  condition(): BooleanFunction | null;
  trailFn(): IntFunction | null;
} {
  return value !== null && typeof value === "object" && typeof (value as { rangeFn?: unknown }).rangeFn === "function";
}

function isToLike(value: unknown): value is { condFn(): BooleanFunction | null } {
  return value !== null && typeof value === "object" && typeof (value as { condFn?: unknown }).condFn === "function";
}

function isRole(value: unknown): value is string {
  return typeof value === "string" && (/^P\d+$/.test(value) || ["Mover", "Next", "All", "Neutral", "Shared", "Enemy", "NonMover"].includes(value));
}

function isHiddenData(value: unknown): value is "What" | "Who" | "Count" | "State" | "Rotation" | "Value" {
  return typeof value === "string" && ["What", "Who", "Count", "State", "Rotation", "Value"].includes(value);
}

function isSiteType(value: unknown): value is string {
  return value === "Cell" || value === "Vertex" || value === "Edge";
}

function isDirection(value: unknown): value is string {
  return typeof value === "string" && ["Adjacent", "Orthogonal", "Diagonal", "All", "Horizontal", "Vertical", "OffDiagonal", "Rotational", "Forward", "Backward"].includes(value);
}

function isSitesSimpleType(value: string): boolean {
  return [
    "Board", "Top", "Bottom", "Left", "Right", "Inner", "Outer", "Perimeter", "Corners",
    "ConcaveCorners", "ConvexCorners", "Major", "Minor", "Centre", "Hint", "ToClear",
    "LineOfPlay", "Pending", "Playable", "LastTo", "LastFrom",
  ].includes(value);
}

function isSitesIndexType(value: string): boolean {
  return ["Row", "Column", "Phase", "Cell", "Edge", "State", "Empty", "Layer", "Support"].includes(value);
}

function isSitesEdgeType(value: string): boolean {
  return ["Axial", "Horizontal", "Vertical", "Angled", "Slash", "Slosh"].includes(value);
}

function deferred(keyword: string): Error {
  return new Error(`factory not yet wired: ${keyword}`);
}
