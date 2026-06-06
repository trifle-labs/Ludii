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
import { DimAbs1to1 } from "../../../../ludemes/game/functions/dim/math/Abs1to1.js";
import { DimAdd1to1 } from "../../../../ludemes/game/functions/dim/math/Add1to1.js";
import { DimDiv1to1 } from "../../../../ludemes/game/functions/dim/math/Div1to1.js";
import { DimMax1to1 } from "../../../../ludemes/game/functions/dim/math/Max1to1.js";
import { DimMin1to1 } from "../../../../ludemes/game/functions/dim/math/Min1to1.js";
import { DimMul1to1 } from "../../../../ludemes/game/functions/dim/math/Mul1to1.js";
import { DimPow1to1 } from "../../../../ludemes/game/functions/dim/math/Pow1to1.js";
import { DimSub1to1 } from "../../../../ludemes/game/functions/dim/math/Sub1to1.js";
import { DimConstant1to1, type DimFunction1to1 } from "../../../../ludemes/game/functions/dim/DimConstant1to1.js";
import { Difference } from "../../../../ludemes/game/functions/directions/Difference.js";
import { Directions1to1Static } from "../../../../ludemes/game/functions/directions/Directions1to1.js";
import { If as DirectionIf } from "../../../../ludemes/game/functions/directions/If.js";
import { Union } from "../../../../ludemes/game/functions/directions/Union.js";
import { Face } from "../../../../ludemes/game/functions/ints/dice/Face.js";
import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { Dual } from "../../../../ludemes/game/functions/graph/operators/Dual.js";
import type { GraphFunction } from "../../../../ludemes/game/functions/graph/GraphFunction.js";
import { Dice } from "../../../../ludemes/game/equipment/container/other/Dice.js";
import { Die } from "../../../../ludemes/game/equipment/component/Die.js";
import { Card as EquipmentCard } from "../../../../ludemes/game/util/equipment/Card.js";
import { Domino } from "../../../../ludemes/game/equipment/component/tile/Domino.js";
import { Dominoes } from "../../../../ludemes/game/equipment/other/Dominoes.js";
import { Equipment1to1 } from "../../../../ludemes/game/equipment/Equipment1to1.js";
import { Board1to1 } from "../../../../ludemes/game/equipment/container/board/Board1to1.js";
import { Piece } from "../../../../ludemes/game/equipment/component/Piece.js";
import type { Item, RoleType as EquipmentRoleType } from "../../../../ludemes/game/equipment/Item.js";
import { Hint } from "../../../../ludemes/game/util/equipment/Hint.js";
import { Set as DeductionSet } from "../../../../ludemes/game/rules/start/deductionPuzzle/Set.js";
import { End } from "../../../../ludemes/game/rules/end/End.js";
import { ForEach as EndForEach } from "../../../../ludemes/game/rules/end/ForEach.js";
import { If as EndIf } from "../../../../ludemes/game/rules/end/If.js";
import { Result } from "../../../../ludemes/game/rules/end/Result.js";
import { Score } from "../../../../ludemes/game/util/end/Score.js";
import { Add } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Add.js";
import { Deal } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Deal.js";
import { Do } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/requirement/Do.js";
import { Enclose } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Enclose.js";
import { Remove } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Remove.js";
import { Step } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Step.js";
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
  registry.registerLudeme("directional:directional", () => deferred("directional"));
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
  registry.registerLudeme("end:end", (b) => new End(flatten(b.positional).filter(isEndRuleFunction)));
  registry.registerLudeme("end.forEach:forEach", (b, env) =>
    new EndForEach((stringAt(b, 0) ?? "Shared").toLowerCase(), requireNamedBooleanFunction(b, "if"), requireResult(b), env.numPlayers));
  registry.registerLudeme("end.if:if", (b, env) => makeEndIf(b, env.numPlayers));
  registry.registerLudeme("end.score:score", (b) => new Score(requireString(b, 0) as unknown as ConstructorParameters<typeof Score>[0], requireIntFunction(b, 1)));
  registry.registerLudeme("equipment:equipment", makeEquipment);
  registry.registerLudeme("equipment.card:card", (b) =>
    new EquipmentCard(
      requireString(b, 0) as unknown as ConstructorParameters<typeof EquipmentCard>[0],
      requireNamedNumber(b, "rank"),
      requireNamedNumber(b, "value"),
      numberNamed(b, "trumprank") ?? undefined,
      numberNamed(b, "trumpvalue") ?? undefined,
      numberNamed(b, "biased") ?? undefined,
    ));
  registry.registerLudeme("equipment.hint:hint", (b) => new Hint(requireNumber(b, 0), numberAt(b, 1) ?? undefined));
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
  if (names.length === 0) return new Directions1to1Static(["Adjacent"]);
  if (!names.every((name) => ABSOLUTE_DIRECTIONS.has(name))) deferred("directions relative");
  return new Directions1to1Static(names);
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
  if (piece) deferred("add piece");
  const to = firstOf(b, isTo);
  const region = to?.regionFn();
  if (!region) deferred("add");
  return new Add(region);
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
  if (thenMoves(b)) deferred("set Score");
  return new SetScore1to1(player ?? roleToIntFunction(role ?? "Mover"), value);
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
    dirnChoice: firstDirectionsFunction(b) ?? new Directions1to1Static(["Adjacent"]),
    then: null,
  });
}

function makeEnclose(b: ArgBundle): Enclose {
  const from = firstOf(b, isFrom);
  const between = firstBetweenLike(b);
  const effect = between?.effect ?? firstMovesFunctionAfter(b, 0);
  if (!effect) deferred("enclose");
  return new Enclose({
    startFn: from?.locFn() ?? lastTo(),
    dirnName: firstDirectionName(b) ?? "Adjacent",
    targetRule: between?.cond ?? trueBool(),
    numEmptySitesInGroup: intNamed(b, "numexception") ?? new IntConstant(0),
    effect,
    type: firstSiteType(b),
    then: null,
  });
}

function makeEndIf(b: ArgBundle, numPlayers: number): EndIf {
  const subconditions = flatten(b.positional).filter((v): v is EndIf => v instanceof EndIf);
  if (subconditions.length > 0) deferred("end if subconditions");
  const condition = requireBooleanFunction(b, 0);
  const result = flatten(b.positional).find((v): v is Result => v instanceof Result);
  if (!result) throw new Error(`factory ${b.symbol}:${b.constructKey}: expected result`);
  return new EndIf(condition, result, numPlayers);
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
  return flatten(b.positional).find(isMovesFunction) ?? null;
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
      if (role === "Next") return ctx.state.mover % 2 + 1;
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

function isSiteType(value: unknown): value is SiteType {
  return value === "Cell" || value === "Edge" || value === "Vertex";
}

function isRoleString(value: unknown): value is EquipmentRoleType {
  return typeof value === "string" && /^(P[1-8]|Neutral|Shared|All|Enemy|Team|Mover|Next|Player|NonMover)$/.test(value);
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
  return hasEval(value) && (isKnownMove(value) || (!(value instanceof IntConstant) && !(value instanceof Face) && !(value instanceof BooleanConstant) && !(value instanceof IsSolved) && !isDirectionsFunction(value)));
}

function isDirectionsFunction(value: unknown): value is DirectionsFunction {
  return value instanceof Directions1to1Static || value instanceof Difference || value instanceof Union || value instanceof DirectionIf;
}

function isGraphFunction(value: unknown): value is GraphFunction {
  return typeof (value as GraphFunction | null)?.eval === "function" && typeof (value as GraphFunction | null)?.dim === "function";
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
