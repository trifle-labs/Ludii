import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { FloatConstant } from "../../../../ludemes/game/functions/floats/FloatConstant.js";
import { DimConstant } from "../../../../ludemes/game/functions/dim/DimConstant.js";
import type { DimFunction } from "../../../../ludemes/game/functions/dim/DimFunction.js";
import { Range } from "../../../../ludemes/game/functions/range/Range.js";
import { Max as RangeMax } from "../../../../ludemes/game/functions/range/math/Max.js";
import { Min as RangeMin } from "../../../../ludemes/game/functions/range/math/Min.js";
import { ArrayValue } from "../../../../ludemes/game/functions/ints/board/ArrayValue.js";
import { Recoordinate } from "../../../../ludemes/game/functions/graph/operators/Recoordinate.js";
import { Renumber } from "../../../../ludemes/game/functions/graph/operators/Renumber.js";
import { Rotate } from "../../../../ludemes/game/functions/graph/operators/Rotate.js";
import { Scale } from "../../../../ludemes/game/functions/graph/operators/Scale.js";
import { Shift } from "../../../../ludemes/game/functions/graph/operators/Shift.js";
import { Rectangle } from "../../../../ludemes/game/functions/graph/generators/shape/Rectangle.js";
import { Regular } from "../../../../ludemes/game/functions/graph/generators/shape/Regular.js";
import { Repeat } from "../../../../ludemes/game/functions/graph/generators/shape/Repeat.js";
import { Poly } from "../../../../ludemes/game/util/graph/Poly.js";
import { ForEachLevel } from "../../../../ludemes/game/functions/region/foreach/level/ForEachLevel.js";
import { ForEachPlayer } from "../../../../ludemes/game/functions/region/foreach/player/ForEachPlayer.js";
import { ForEachSite } from "../../../../ludemes/game/functions/region/foreach/sites/ForEachSite.js";
import { ForEachSiteInRegion } from "../../../../ludemes/game/functions/region/foreach/sites/ForEachSiteInRegion.js";
import { ForEachTeam } from "../../../../ludemes/game/functions/region/foreach/team/ForEachTeam.js";
import { Last } from "../../../../ludemes/game/functions/region/last/Last.js";
import { LastRegionType } from "../../../../ludemes/game/functions/region/last/LastRegionType.js";
import { RegionConstant } from "../../../../ludemes/game/functions/region/RegionConstant.js";
import { Sites } from "../../../../ludemes/game/functions/region/sites/Sites.js";
import { SitesSimpleType } from "../../../../ludemes/game/functions/region/sites/SitesSimpleType.js";
import { Regions } from "../../../../ludemes/game/equipment/other/Regions.js";
import { Remember } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/state/remember/Remember.js";
import { Random } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Random.js";
import { Result } from "../../../../ludemes/game/rules/end/Result.js";
import { Results1to1 } from "../../../../ludemes/game/functions/intArray/math/Results1to1.js";
import { Roll } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Roll.js";
import { Rotation } from "../../../../ludemes/game/functions/ints/state/Rotation.js";
import { Rotations } from "../../../../ludemes/game/functions/intArray/state/Rotations.js";
import { Row } from "../../../../ludemes/game/functions/ints/board/Row.js";
import { Rules1to1 } from "../../../../ludemes/game/rules/Rules1to1.js";
import { Select } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Select.js";
import { Seq1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/operators/logical/Seq1to1.js";
import { Shoot } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Shoot.js";
import { Shoot1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Shoot1to1.js";
import { Satisfy1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/requirement/Satisfy1to1.js";
import { FloatSin1to1 } from "../../../../ludemes/game/functions/floats1to1/math/FloatMath1to1.js";
import { Site1to1 } from "../../../../ludemes/game/functions/ints1to1/iterator/Iterator1to1.js";
import { From1to1 } from "../../../../ludemes/game/util/moves/From1to1.js";
import { To1to1 } from "../../../../ludemes/game/util/moves/To1to1.js";
import { Between1to1 } from "../../../../ludemes/game/util/moves/Between1to1.js";
import { Piece1to1 } from "../../../../ludemes/game/util/moves/Piece1to1.js";
import { Then } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Then.js";
import { StackDirection } from "../../../../ludemes/game/util/directions/StackDirection.js";
import { isRegionTypeStatic, type RegionTypeStatic } from "../../../../ludemes/game/types/board/RegionTypeStatic.js";
import type { GraphFunction } from "../../../../ludemes/game/functions/graph/GraphFunction.js";
import type {
  BooleanFunction,
  FloatFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
  ResultType,
  RoleType,
} from "../../../../ludemes/base.js";
import { Phase } from "../../../../ludemes/game/rules/phase/Phase.js";
import { End } from "../../../../ludemes/game/rules/end/End.js";
import type { Play1to1 } from "../../../../ludemes/game/rules/play/Play1to1.js";
import type { ArgBundle } from "../../ArgBundle.js";
import type { LudemeRegistry } from "../../LudemeRegistry.js";

export function registerBatch7(registry: LudemeRegistry): void {
  registry.registerLudeme("random:random", randomFactory);
  registry.registerLudeme("range:range", (b) => new Range(requireIntFn(b, 0), optionalIntFn(b, 1)));
  registry.registerLudeme("range.math.max:max", (b) => new RangeMax(requireIntFn(b, 0)));
  registry.registerLudeme("range.math.min:min", (b) => new RangeMin(requireIntFn(b, 0)));
  registry.registerLudeme("recoordinate:recoordinate", (b) => {
    const siteTypes = siteTypesFrom(b);
    return new Recoordinate(
      siteTypes?.[0],
      siteTypes?.[1],
      siteTypes?.[2],
      requireGraph(b),
    );
  });
  registry.registerLudeme("rectangle:rectangle", rectangleFactory);
  registry.registerLudeme("region.foreach.forEach:forEach", forEachRegionFactory);
  registry.registerLudeme("region.last.last:last", (b) => {
    const value = requireStringValue(b.positional[0], "region.last.last:last type");
    if (value !== LastRegionType.Between && value !== "Between") throw notWired("last");
    return Last.construct(LastRegionType.Between);
  });
  registry.registerLudeme("region.math.difference:difference", regionDifferenceFactory);
  registry.registerLudeme("region.math.if:if", regionIfFactory);
  registry.registerLudeme("region.math.intersection:intersection", regionIntersectionFactory);
  registry.registerLudeme("region.math.union:union", regionUnionFactory);
  registry.registerLudeme("regions:regions", regionsFactory);
  registry.registerLudeme("regionSite:regionSite", regionSiteFactory);
  registry.registerLudeme("regular:regular", regularFactory);
  registry.registerLudeme("remember:remember", rememberFactory);
  registry.registerLudeme("renumber:renumber", renumberFactory);
  registry.registerLudeme("repeat:repeat", repeatFactory);
  registry.registerLudeme("result:result", (b) => new Result(requireString(b, 0) as RoleType, requireString(b, 1) as ResultType));
  registry.registerLudeme("results:results", resultsFactory);
  registry.registerLudeme("roll:roll", (b) => new Roll(optionalThen(b)));
  registry.registerLudeme("rotate:rotate", (b) => new Rotate(requireNumber(b, 0), requireGraph(b)));
  registry.registerLudeme("rotation:rotation", rotationFactory);
  registry.registerLudeme("rotations:rotations", (b) => new Rotations(stringsFrom(flatten(b.positional))));
  registry.registerLudeme("row:row", (b) => new Row(
    requireNamedIntFn(b, "of") as ConstructorParameters<typeof Row>[0],
    optionalSiteType(b),
  ));
  registry.registerLudeme("rules.rules:rules", rulesFactory);
  registry.registerLudeme("satisfy:satisfy", () => new Satisfy1to1());
  registry.registerLudeme("scale:scale", scaleFactory);
  registry.registerLudeme("select:select", selectFactory);
  registry.registerLudeme("seq:seq", (b) => new Seq1to1(flatten(b.positional).filter(isMovesFunction)));
  registry.registerLudeme("shift:shift", shiftFactory);
  registry.registerLudeme("shoot:shoot", shootFactory);
  registry.registerLudeme("sin:sin", (b) => new FloatSin1to1(requireFloatFn(b, 0)));
  registry.registerLudeme("site:site", () => new Site1to1());
  for (const simpleType of [
    SitesSimpleType.Board,
    SitesSimpleType.Top,
    SitesSimpleType.Bottom,
    SitesSimpleType.Left,
    SitesSimpleType.Right,
    SitesSimpleType.Inner,
    SitesSimpleType.Outer,
    SitesSimpleType.Perimeter,
    SitesSimpleType.Corners,
    SitesSimpleType.Centre,
  ]) {
    registry.registerLudeme(`sites:${simpleType.toLowerCase()}`, sitesSimpleFactory(simpleType));
  }
  registry.registerLudeme("sites:player", (b) => Sites.constructEquipmentOrCoord(null, requireString(b, 0), optionalSiteType(b), null));
  registry.registerLudeme("sites:region", sitesRegionFactory);
}

function randomFactory(b: ArgBundle): Random {
  const moves = flatten(b.positional).filter(isMovesFunction);
  const probas = flatten(b.positional).filter(isFloatFunction);
  const namedNum = b.named.get("num");
  if (namedNum !== undefined) {
    if (moves.length !== 1) throw new Error("factory random: expected one moves argument with num:");
    return Random.fromNum(moves[0]!, toIntFn(namedNum));
  }
  if (probas.length > 0 && moves.length > 0) return Random.fromProbabilities(probas, moves);
  throw new Error("factory random: missing probabilities/moves");
}

function rectangleFactory(b: ArgBundle): GraphFunction {
  const rows = requireNumber(b, 0);
  const columns = optionalNumber(b, 1);
  const diagonals = optionalNamedString(b, "diagonals");
  return Rectangle.construct(rows, columns, diagonals as Parameters<typeof Rectangle.construct>[2]);
}

function renumberFactory(b: ArgBundle): Renumber {
  const siteTypes = siteTypesFrom(b);
  return new Renumber(
    siteTypes?.[0],
    siteTypes?.[1],
    siteTypes?.[2],
    requireGraph(b),
  );
}

function forEachRegionFactory(b: ArgBundle): RegionFunction {
  const first = b.positional[0];
  if (typeof first === "string" && first === "Level") {
    return new ForEachLevel(
      optionalSiteType(b),
      requireNamedIntFn(b, "at"),
      stackDirectionFrom(b.positional.find((v) => v === "FromBottom" || v === "FromTop")),
      optionalNamedBoolean(b, "if"),
      optionalNamedIntFn(b, "startAt"),
    );
  }
  if (typeof first === "string" && first === "Team") {
    return new ForEachTeam(requireRegion(b, 1));
  }
  const of = b.named.get("of");
  if (of !== undefined) return new ForEachSiteInRegion(toRegion(of), requireRegion(b, 0));
  const condition = b.named.get("if");
  if (condition !== undefined) return new ForEachSite(requireRegion(b, 0), toBooleanFn(condition));
  const players = flatten(b.positional).find(isIntArrayFunction);
  if (players !== undefined) return new ForEachPlayer(players, firstRegion(b));
  throw new Error("factory forEach: unsupported region foreach signature");
}

function regionsFactory(b: ArgBundle): Regions {
  let argIndex = 0;
  const first = b.positional[argIndex];
  const second = b.positional[argIndex + 1];
  const name = typeof first === "string" && !looksLikeRole(first) && (b.positional.length > 1 || !isRegionTypeStatic(first))
    ? first
    : null;
  if (name !== null) argIndex++;
  const roleValue = b.positional[argIndex];
  const role = typeof roleValue === "string" && looksLikeRole(roleValue) ? roleValue : null;
  if (role !== null) argIndex++;

  const payload = b.positional.slice(argIndex);
  const hintRegionLabel = typeof payload[payload.length - 1] === "string" &&
    payload.length > 1 &&
    !isRegionTypeStatic(payload[payload.length - 1] as string) &&
    payload[payload.length - 1] !== second
    ? payload[payload.length - 1] as string
    : null;
  const orPayload = hintRegionLabel !== null ? payload.slice(0, -1) : payload;
  const flatPayload = flatten(orPayload);

  const intArray = orPayload.find(isNumberArray) ?? null;
  const regionFns = flatPayload.filter(isRegionFunction);
  const region = regionFns.length === 1 ? regionFns[0]! : null;
  const regions = regionFns.length > 1 ? regionFns : null;
  const staticRegionValues = flatPayload.filter((v): v is RegionTypeStatic => typeof v === "string" && isRegionTypeStatic(v));
  const regionType = staticRegionValues.length === 1 ? staticRegionValues[0]! : null;
  const regionTypes = staticRegionValues.length > 1 ? staticRegionValues : null;
  return new Regions(
    name,
    role as ConstructorParameters<typeof Regions>[1],
    intArray,
    region,
    regions,
    regionType as ConstructorParameters<typeof Regions>[5],
    regionTypes as ConstructorParameters<typeof Regions>[6],
    hintRegionLabel,
  );
}

function regionDifferenceFactory(b: ArgBundle): RegionFunction {
  const source = toRegion(b.positional[0]);
  const remove = toRegion(b.positional[1]);
  return {
    eval: (ctx) => {
      const removed = new Set(remove.eval(ctx));
      return source.eval(ctx).filter((site) => !removed.has(site));
    },
  };
}

function regionIntersectionFactory(b: ArgBundle): RegionFunction {
  const a = toRegion(b.positional[0]);
  const c = toRegion(b.positional[1]);
  return {
    eval: (ctx) => {
      const keep = new Set(c.eval(ctx));
      return a.eval(ctx).filter((site) => keep.has(site));
    },
  };
}

function regionIfFactory(b: ArgBundle): RegionFunction {
  const condition = toBooleanFn(b.positional[0]);
  const ok = toRegion(b.positional[1]);
  const notOk = b.positional[2] === undefined ? new RegionConstant([]) : toRegion(b.positional[2]);
  return {
    eval: (ctx) => condition.eval(ctx) ? ok.eval(ctx) : notOk.eval(ctx),
  };
}

function regionUnionFactory(b: ArgBundle): RegionFunction {
  const regions = flatten(b.positional).map(toRegion);
  return {
    eval: (ctx) => [...new Set(regions.flatMap((region) => region.eval(ctx)))],
  };
}

function regularFactory(b: ArgBundle): Regular {
  const values = flatten(b.positional);
  const star = values.includes("Star") ? "Star" : undefined;
  if (values.length > 0 && typeof values[0] === "string" && values[0] !== "Star") throw notWired("regular");
  const sides = values.find((v): v is number => typeof v === "number");
  if (sides === undefined) throw new Error("factory regular: missing dimension");
  return new Regular(sides, star);
}

function rememberFactory(b: ArgBundle): MovesFunction {
  const first = requireString(b, 0);
  const then = optionalThen(b);
  if (first === "State") return Remember.constructState("State", then);
  if (first === "Value") {
    const name = typeof b.positional[1] === "string" ? b.positional[1] : null;
    const value = flatten(b.positional).find(isIntFunction);
    if (value === undefined) throw new Error("factory remember: missing value int function");
    return Remember.constructValue("Value", name, value, optionalNamedBoolean(b, "unique"), then);
  }
  throw new Error(`factory remember: unsupported remember type ${first}`);
}

function repeatFactory(b: ArgBundle): Repeat {
  const rows = toDimFn(b.positional[0]);
  const columns = toDimFn(b.positional[1]);
  const stepValue = b.named.get("step") ?? b.positional[2];
  const step = toStep(stepValue);
  const polyStart = b.named.has("step") ? 2 : 3;
  const polyValues = flatten(b.positional.slice(polyStart)).filter(isPoly);
  if (polyValues.length === 0) throw new Error("factory repeat: missing polygon");
  return new Repeat(rows, columns, step, polyValues.length === 1 ? polyValues[0]! : null, polyValues.length === 1 ? null : polyValues);
}

function resultsFactory(b: ArgBundle): Results1to1 {
  const fromValue = b.named.get("from");
  const toValue = b.named.get("to");
  const body = flatten(b.positional).find(isIntFunction);
  if (body === undefined) throw new Error("factory results: missing body int function");
  return new Results1to1(
    fromValue !== undefined ? intOrRegion(fromValue) : contextRegion("_evalFrom"),
    toValue !== undefined ? intOrRegion(toValue) : contextRegion("_evalTo"),
    body,
  );
}

function rotationFactory(b: ArgBundle): Rotation {
  return new Rotation(
    optionalSiteType(b),
    requireNamedIntFn(b, "at") as ConstructorParameters<typeof Rotation>[1],
    optionalNamedIntFn(b, "level") as ConstructorParameters<typeof Rotation>[2],
  );
}

function regionSiteFactory(b: ArgBundle): IntFunction {
  const region = firstRegion(b);
  return new ArrayValue(
    regionAsIntArray(region),
    requireNamedIntFn(b, "index") as ConstructorParameters<typeof ArrayValue>[1],
  );
}

function rulesFactory(b: ArgBundle): Rules1to1 {
  const play = flatten(b.positional).find(isPlay) ?? null;
  const end = flatten(b.positional).find(isEnd) ?? null;
  const phases = [
    ...flatten(b.positional).filter(isPhase),
    ...flatten([b.named.get("phases")]).filter(isPhase),
  ];
  if (!end) throw new Error("factory rules: missing end");
  if (phases.length > 0) {
    return new Rules1to1(null, null, play ?? phases[0]!.play, phases, end);
  }
  if (!play) throw new Error("factory rules: missing play");
  return new Rules1to1(null, null, play, end);
}

function scaleFactory(b: ArgBundle): Scale {
  const graph = requireGraph(b);
  const args = flatten(b.positional).filter((v) => !isGraphFunction(v));
  const sxArg = args[0];
  if (sxArg === undefined) throw new Error("factory scale: missing scaleX");
  return new Scale(
    toFloatFn(sxArg),
    args[1] === undefined ? null : toFloatFn(args[1]),
    args[2] === undefined ? null : toFloatFn(args[2]),
    graph,
  );
}

function selectFactory(b: ArgBundle): Select {
  const from = flatten(b.positional).find((v): v is From1to1 => v instanceof From1to1);
  if (from === undefined) throw new Error("factory select: missing from");
  const to = flatten(b.positional).find((v): v is To1to1 => v instanceof To1to1) ?? null;
  const role = flatten(b.positional).find((v) => typeof v === "string" && looksLikeRole(v));
  return new Select(
    from,
    to,
    role as ConstructorParameters<typeof Select>[2],
    optionalThen(b) as ConstructorParameters<typeof Select>[3],
  );
}

function shiftFactory(b: ArgBundle): Shift {
  const graph = requireGraph(b);
  const args = b.positional.filter((v) => !isGraphFunction(v));
  const dxArg = b.named.get("dx") ?? args[0];
  const dyArg = b.named.get("dy") ?? args[1];
  const dzArg = b.named.get("dz") ?? args[2];
  if (dxArg === undefined || dyArg === undefined) throw new Error("factory shift: missing dx/dy");
  return new Shift(toFloatFn(dxArg), toFloatFn(dyArg), dzArg === undefined ? undefined : toFloatFn(dzArg), graph);
}

function shootFactory(b: ArgBundle): MovesFunction {
  const values = flatten(b.positional);
  const piece = values.find((v): v is Piece1to1 => v instanceof Piece1to1);
  if (!piece) throw new Error("factory shoot: missing piece");
  const from = values.find((v): v is From1to1 => v instanceof From1to1) ?? null;
  const between = values.find((v): v is Between1to1 => v instanceof Between1to1) ?? null;
  const to = values.find((v): v is To1to1 => v instanceof To1to1) ?? null;
  const dirn = values.find((v): v is string => typeof v === "string" && !looksLikeRole(v));
  const then = optionalThen(b);
  const component = piece.component();
  if (component !== null) {
    return new Shoot({
      startLocationFn: from?.locFn() ?? contextInt("_evalTo"),
      dirnName: dirn,
      goRule: between?.condition() ?? undefined,
      toRule: to?.condFn() ?? undefined,
      pieceFn: component,
      type: from?.siteType() ?? to?.siteType() ?? null,
      then,
    });
  }
  if (piece.getName() !== null && from === null && between === null && to === null && then === null) {
    return new Shoot1to1(piece.getName()!, dirn ?? "Adjacent");
  }
  throw notWired("shoot");
}

function sitesRegionFactory(b: ArgBundle): RegionFunction {
  const values = flatten(b.positional);
  if (values.length === 0) return Sites.constructContext();
  const region = values.find(isRegionFunction);
  if (region !== undefined) return region;
  const numbers = values.filter((v): v is number => typeof v === "number");
  if (numbers.length === 1) return new RegionConstant(Array.from({ length: numbers[0]! }, (_, i) => i));
  if (numbers.length > 1) return new RegionConstant(numbers);
  const strings = values.filter((v): v is string => typeof v === "string");
  if (strings.length > 0) return Sites.constructCoords(null, strings);
  throw notWired("region");
}

function sitesSimpleFactory(simpleType: SitesSimpleType): (b: ArgBundle) => RegionFunction {
  return (b) => Sites.constructSimple(simpleType, optionalSiteType(b));
}

function requireGraph(b: ArgBundle): GraphFunction {
  const graph = flatten(b.positional).find(isGraphFunction);
  if (graph === undefined) throw new Error(`factory ${b.constructKey}: missing graph`);
  return graph;
}

function requireRegion(b: ArgBundle, index: number): RegionFunction {
  return toRegion(b.positional[index]);
}

function firstRegion(b: ArgBundle): RegionFunction {
  const region = flatten(b.positional).find(isRegionFunction);
  if (region === undefined) throw new Error(`factory ${b.constructKey}: missing region`);
  return region;
}

function requireString(b: ArgBundle, index: number): string {
  return requireStringValue(b.positional[index], `${b.constructKey} arg ${index}`);
}

function requireStringValue(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`factory ${label}: expected string`);
  return value;
}

function requireNumber(b: ArgBundle, index: number): number {
  const value = b.positional[index];
  if (typeof value !== "number") throw new Error(`factory ${b.constructKey}: expected number at ${index}`);
  return value;
}

function optionalNumber(b: ArgBundle, index: number): number | undefined {
  const value = b.positional[index];
  return typeof value === "number" ? value : undefined;
}

function optionalNamedString(b: ArgBundle, name: string): string | undefined {
  const value = b.named.get(name);
  return typeof value === "string" ? value : undefined;
}

function optionalSiteType(b: ArgBundle): "Cell" | "Vertex" | "Edge" | null {
  const value = flatten(b.positional).find((v) => v === "Cell" || v === "Vertex" || v === "Edge");
  return (value ?? null) as "Cell" | "Vertex" | "Edge" | null;
}

function requireIntFn(b: ArgBundle, index: number): IntFunction {
  return toIntFn(b.positional[index]);
}

function optionalIntFn(b: ArgBundle, index: number): IntFunction | undefined {
  const value = b.positional[index];
  return value === undefined ? undefined : toIntFn(value);
}

function requireNamedIntFn(b: ArgBundle, name: string): IntFunction {
  const value = b.named.get(name);
  if (value === undefined) throw new Error(`factory ${b.constructKey}: missing ${name}:`);
  return toIntFn(value);
}

function optionalNamedIntFn(b: ArgBundle, name: string): IntFunction | null {
  const value = b.named.get(name);
  return value === undefined ? null : toIntFn(value);
}

function optionalNamedBoolean(b: ArgBundle, name: string): BooleanFunction | null {
  const value = b.named.get(name);
  return value === undefined ? null : toBooleanFn(value);
}

function requireFloatFn(b: ArgBundle, index: number): FloatFunction {
  return toFloatFn(b.positional[index]);
}

function optionalThen(b: ArgBundle): Then | null {
  return flatten([...b.positional, ...b.named.values()]).find((v): v is Then => v instanceof Then) ?? null;
}

function toIntFn(value: unknown): IntFunction {
  if (isIntFunction(value)) return value;
  if (typeof value === "number") return new IntConstant(value);
  throw new Error("factory: expected int function");
}

function toFloatFn(value: unknown): FloatFunction {
  if (isFloatFunction(value)) return value;
  if (typeof value === "number") return new FloatConstant(value);
  throw new Error("factory: expected float function");
}

function toDimFn(value: unknown): DimFunction {
  if (isDimFunction(value)) return value;
  if (typeof value === "number") return new DimConstant(value);
  throw new Error("factory: expected dim function");
}

function toBooleanFn(value: unknown): BooleanFunction {
  if (isBooleanFunction(value)) return value;
  if (typeof value === "boolean") return { eval: () => value };
  throw new Error("factory: expected boolean function");
}

function regionAsIntArray(region: RegionFunction): ConstructorParameters<typeof ArrayValue>[0] {
  return {
    eval: (ctx) => region.eval(ctx),
    isStatic: () => false,
    concepts: () => new Set<number>(),
    writesEvalContextRecursive: () => new Set<number>(),
    readsEvalContextRecursive: () => new Set<number>(),
    missingRequirement: () => false,
    willCrash: () => false,
    preprocess: () => undefined,
    toEnglish: () => "region",
  };
}

function toRegion(value: unknown): RegionFunction {
  if (isRegionFunction(value)) return value;
  if (typeof value === "number") return new RegionConstant([value]);
  if (isNumberArray(value)) return new RegionConstant(value);
  throw new Error("factory: expected region");
}

function intOrRegion(value: unknown): RegionFunction {
  return isRegionFunction(value) ? value : intAsRegion(toIntFn(value));
}

function intAsRegion(fn: IntFunction): RegionFunction {
  return { eval: (ctx) => [fn.eval(ctx)] };
}

function contextRegion(field: "_evalFrom" | "_evalTo"): RegionFunction {
  return { eval: (ctx) => [ctx[field]] };
}

function contextInt(field: "_evalFrom" | "_evalTo"): IntFunction {
  return { eval: (ctx) => ctx[field] };
}

function siteTypesFrom(b: ArgBundle): ("Cell" | "Vertex" | "Edge")[] | undefined {
  const siteTypes = flatten(b.positional).filter((v): v is "Cell" | "Vertex" | "Edge" =>
    v === "Cell" || v === "Vertex" || v === "Edge",
  );
  return siteTypes.length > 0 ? siteTypes : undefined;
}

function stackDirectionFrom(value: unknown): StackDirection | null {
  if (value === "FromBottom") return StackDirection.FromBottom;
  if (value === "FromTop") return StackDirection.FromTop;
  return null;
}

function stringsFrom(values: unknown[]): string[] {
  return values.map((v) => requireStringValue(v, "string list"));
}

function toStep(value: unknown): readonly [readonly [number, number], readonly [number, number]] {
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    Array.isArray(value[0]) &&
    Array.isArray(value[1]) &&
    typeof value[0][0] === "number" &&
    typeof value[0][1] === "number" &&
    typeof value[1][0] === "number" &&
    typeof value[1][1] === "number"
  ) {
    return [[value[0][0], value[0][1]], [value[1][0], value[1][1]]];
  }
  throw new Error("factory repeat: expected step:[[float,float],[float,float]]");
}

function flatten(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value)) out.push(...flatten(value));
    else out.push(value);
  }
  return out;
}

function looksLikeRole(value: string): boolean {
  return [
    "Mover",
    "Next",
    "Prev",
    "All",
    "Each",
    "Shared",
    "Neutral",
    "Enemy",
    "Friend",
  ].includes(value) || /^P\d+$/.test(value) || /^Team\d+$/.test(value);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === "number");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isIntFunction(value: unknown): value is IntFunction {
  return isObjectWithEval(value) && !(value instanceof FloatConstant);
}

function isDimFunction(value: unknown): value is DimFunction {
  return isObjectWithEval(value);
}

function isFloatFunction(value: unknown): value is FloatFunction {
  return isObjectWithEval(value) || typeof value === "number";
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return isObjectWithEval(value);
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return isObjectWithEval(value);
}

function isMovesFunction(value: unknown): value is MovesFunction {
  return isObjectWithEval(value);
}

function isIntArrayFunction(value: unknown): value is IntArrayFunction {
  return isObjectWithEval(value);
}

function isGraphFunction(value: unknown): value is GraphFunction {
  return typeof (value as GraphFunction | null)?.eval === "function" &&
    typeof (value as GraphFunction | null)?.dim === "function";
}

function isObjectWithEval(value: unknown): value is { eval: (...args: never[]) => unknown } {
  return value !== null && typeof value === "object" && typeof (value as { eval?: unknown }).eval === "function";
}

function isPoly(value: unknown): value is Poly {
  return value instanceof Poly;
}

function isPlay(value: unknown): value is Play1to1 {
  return value !== null && typeof value === "object" && isMovesFunction((value as { moves?: unknown }).moves);
}

function isEnd(value: unknown): value is End {
  return value instanceof End;
}

function isPhase(value: unknown): value is Phase {
  return value instanceof Phase ||
    (value !== null && typeof value === "object" && isPlay((value as { play?: unknown }).play));
}

function notWired(keyword: string): Error {
  return new Error(`factory not yet wired: ${keyword}`);
}
