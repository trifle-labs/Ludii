import { IntConstant } from "../../../../ludemes/game/functions/ints/IntConstant.js";
import { From1to1 as IteratorFrom } from "../../../../ludemes/game/functions/ints1to1/iterator/Iterator1to1.js";
import { To1to1 as IteratorTo } from "../../../../ludemes/game/functions/ints1to1/iterator/Iterator1to1.js";
import { Mover1to1, Next1to1 } from "../../../../ludemes/game/functions/ints1to1/state/State1to1.js";
import { Or1to1 as BooleanOr } from "../../../../ludemes/game/functions/booleans/math1to1/Or1to1.js";
import { Not1to1 } from "../../../../ludemes/game/functions/booleans/math1to1/Not1to1.js";
import { IsEven1to1 } from "../../../../ludemes/game/functions/booleans/is/integer1to1/IsEven1to1.js";
import { IsOdd1to1 } from "../../../../ludemes/game/functions/booleans/is/integer1to1/IsOdd1to1.js";
import { IsVisited1to1 } from "../../../../ludemes/game/functions/booleans/is/integer1to1/IsVisited1to1.js";
import { IsIn1to1 } from "../../../../ludemes/game/functions/booleans/is/in1to1/IsIn1to1.js";
import { IsEmpty1to1 } from "../../../../ludemes/game/functions/booleans/is/site1to1/IsEmpty1to1.js";
import { IsOccupied1to1 } from "../../../../ludemes/game/functions/booleans/is/site1to1/IsOccupied1to1.js";
import { IsActive1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsActive1to1.js";
import { IsEnemy1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsEnemy1to1.js";
import { IsFriend1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsFriend1to1.js";
import { IsMover1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsMover1to1.js";
import { IsNext1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsNext1to1.js";
import { IsPrev1to1 } from "../../../../ludemes/game/functions/booleans/is/player1to1/IsPrev1to1.js";
import { IsBlocked1to1 } from "../../../../ludemes/game/functions/booleans/is/simple1to1/IsBlocked1to1.js";
import { IsFull1to1 } from "../../../../ludemes/game/functions/booleans/is/simple1to1/IsFull1to1.js";
import { IsPending1to1 } from "../../../../ludemes/game/functions/booleans/is/simple1to1/IsPending1to1.js";
import { IsWithin } from "../../../../ludemes/game/functions/booleans/is/component/IsWithin.js";
import { Merge } from "../../../../ludemes/game/functions/graph/operators/Merge.js";
import { Concentric } from "../../../../ludemes/game/functions/graph/generators/shape/concentric/Concentric.js";
import { isConcentricShapeType, type ConcentricShapeType } from "../../../../ludemes/game/functions/graph/generators/shape/concentric/ConcentricShapeType.js";
import { Board1to1 } from "../../../../ludemes/game/equipment/container/board/Board1to1.js";
import { Track } from "../../../../ludemes/game/equipment/container/board/Track.js";
import { Regions } from "../../../../ludemes/game/equipment/other/Regions.js";
import { Trajectories } from "../../../../eval/graph/trajectories.js";
import { Sites } from "../../../../ludemes/game/functions/region/sites/Sites.js";
import { CountPieces1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountPieces1to1.js";
import { CountMoves1to1 } from "../../../../ludemes/game/functions/ints1to1/count/CountMoves1to1.js";
import { CountPhases } from "../../../../ludemes/game/functions/ints/count/simple/CountPhases.js";
import { CountTrials } from "../../../../ludemes/game/functions/ints/count/simple/CountTrials.js";
import { Max as MaxRequirement } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/requirement/max/Max.js";
import { MaxCaptures } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxCaptures.js";
import { MaxMoves } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/requirement/max/moves/MaxMoves.js";
import { Meta } from "../../../../ludemes/game/rules/meta/Meta.js";
import type { MetaRule } from "../../../../ludemes/game/rules/meta/MetaRule.js";
import { No } from "../../../../ludemes/game/rules/meta/no/No.js";
import { Swap as MetaSwap } from "../../../../ludemes/game/rules/meta/Swap.js";
import { NoStackOn } from "../../../../ludemes/game/rules/meta/NoStackOn.js";
import { Mode1to1 } from "../../../../ludemes/game/mode/Mode1to1.js";
import { Slide } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Slide.js";
import { Step } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Step.js";
import { Shoot } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Shoot.js";
import { Select } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Select.js";
import { Add } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Add.js";
import { Claim1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Claim1to1.js";
import { Remove } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Remove.js";
import { Leap } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Leap.js";
import { Promote } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Promote.js";
import { Hop } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Hop.js";
import { FromTo } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/FromTo.js";
import { Pass1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Pass1to1.js";
import { PlayCard } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/PlayCard.js";
import { Propose } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Propose.js";
import { Vote } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Vote.js";
import { MoveAgain1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/state/MoveAgain1to1.js";
import { SetNextPlayer } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/nextPlayer/SetNextPlayer.js";
import { SetRotation } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/direction/SetRotation.js";
import { SetTrumpSuit } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/suit/SetTrumpSuit.js";
import { SetTeam } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/team/SetTeam.js";
import { SetHidden, type HiddenData } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/hidden/SetHidden.js";
import { IntArrayFromRegion } from "../../../../ludemes/other/IntArrayFromRegion.js";
import { SetPending } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/pending/SetPending.js";
import { SetScore1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/player/SetScore1to1.js";
import { SetValuePlayer } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/player/SetValuePlayer.js";
import { SetCount1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/site/SetCount1to1.js";
import { SetState1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/site/SetState1to1.js";
import { SetValue } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/site/SetValue.js";
import { SetCounter } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/value/SetCounter.js";
import { SetPot } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/value/SetPot.js";
import { SetVar1to1 } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/set/var/SetVar1to1.js";
import { Swap as MoveSwap, SwapPlayersType, SwapSitesType } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/state/swap/Swap.js";
import { SitesWalk1to1 } from "../../../../ludemes/game/functions/region/sites/walk/SitesWalk1to1.js";
import { From1to1 } from "../../../../ludemes/game/util/moves/From1to1.js";
import { To1to1 } from "../../../../ludemes/game/util/moves/To1to1.js";
import { Between1to1 } from "../../../../ludemes/game/util/moves/Between1to1.js";
import { Piece1to1 } from "../../../../ludemes/game/util/moves/Piece1to1.js";
import { Player1to1 } from "../../../../ludemes/game/util/moves/Player1to1.js";
import { Count } from "../../../../ludemes/game/util/math/Count.js";
import { Pair } from "../../../../ludemes/game/util/math/Pair.js";
import { LandmarkType } from "../../../../ludemes/game/util/math/LandmarkType.js";
import { RoleType as PairRoleType } from "../../../../ludemes/game/util/end/RoleType.js";
import { NextPhase } from "../../../../ludemes/game/rules/phase/NextPhase.js";
import { Phase } from "../../../../ludemes/game/rules/phase/Phase.js";
import { Rules1to1 } from "../../../../ludemes/game/rules/Rules1to1.js";
import { Play1to1 } from "../../../../ludemes/game/rules/play/Play1to1.js";
import { End } from "../../../../ludemes/game/rules/end/End.js";
import type {
  BooleanFunction,
  DirectionsFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "../../../../ludemes/base.js";
import type { GraphFunction } from "../../../../ludemes/game/functions/graph/GraphFunction.js";
import type { Then } from "../../../../ludemes/game/rules/play/moves/nonDecision/effect/Then.js";
import type { ArgBundle } from "../../ArgBundle.js";
import type { LudemeRegistry } from "../../LudemeRegistry.js";

type SiteTypeName = "Cell" | "Vertex" | "Edge";

export function registerBatch5(registry: LudemeRegistry): void {
  registry.registerLudeme("math.count:count", (b): Count => {
    return new Count(requireString(b, 0), asIntFunction(requireValue(b, 1), "count"));
  });
  registry.registerLudeme("count", makeCountFallback);

  registry.registerLudeme("math.or:or", (b): BooleanFunction => {
    return new BooleanOr(flatten(b.positional).filter(isBooleanFunction));
  });

  registry.registerLudeme("math.pair:pair", makePair);

  registry.registerLudeme("max.max:max", (b): MovesFunction => {
    const [kind] = b.positional;
    if (kind === "Distance") {
      return MaxRequirement.construct(
        "Distance",
        optionalString(b.positional[1]),
        optionalString(b.positional[2]),
        requireMoves(findFirst(b, isMovesFunction), "max Distance"),
        optionalThen(b),
      );
    }
    if (kind === "Moves" || kind === "Captures") {
      const moves = requireMoves(findFirst(b, isMovesFunction), `max ${kind}`);
      const withValue = optionalBooleanFunctionNamed(b, "withValue") ?? falseFunction();
      const then = movesFromThen(optionalThenLike(b));
      return kind === "Moves" ? new MaxMoves(withValue, moves, then) : new MaxCaptures(withValue, moves, then);
    }
    throw notWired("max");
  });

  registry.registerLudeme("merge:merge", (b): Merge => {
    const graphFns = flatten(b.positional).filter(isGraphFunction);
    if (graphFns.length < 2) throw new Error("factory not yet wired: merge");
    return new Merge(graphFns, optionalBooleanNamed(b, "connect") ?? false);
  });

  registry.registerLudeme("meta:meta", (b): Meta => {
    const rules = flatten(b.positional) as MetaRule[];
    return rules.length === 1 ? new Meta(null, rules[0]!) : new Meta(rules, null);
  });
  registry.registerLudeme("meta.no.no:no", (b) => {
    const kind = requireString(b, 0);
    if (kind === "Suicide") return No.constructSimple("Suicide");
    if (kind === "Repeat") return No.constructRepeat("Repeat", optionalString(b.positional[1]));
    throw notWired(`no ${kind}`);
  });
  registry.registerLudeme("meta.swap:swap", (): MetaSwap => new MetaSwap());
  registry.registerLudeme("noStackOn:noStackOn", (b): NoStackOn => new NoStackOn(requireString(b, 0)));

  registry.registerLudeme("mode:mode", (b): Mode1to1 => new Mode1to1(requireString(b, 0) as never));

  registry.registerLudeme("board", makeBoardFallback);
  registry.registerLudeme("concentric", makeConcentricFallback);

  registry.registerLudeme("move:slide", makeSlide);
  registry.registerLudeme("move:step", makeStep);
  registry.registerLudeme("move:shoot", makeShoot);
  registry.registerLudeme("move:select", makeSelect);
  registry.registerLudeme("move:remove", makeRemove);
  registry.registerLudeme("move:set", makeSet);
  registry.registerLudeme("move:swap", makeMoveSwap);
  registry.registerLudeme("move:promote", makePromote);
  registry.registerLudeme("move:hop", makeHop);
  registry.registerLudeme("move:pass", (): Pass1to1 => new Pass1to1());
  registry.registerLudeme("move:playcard", (b): PlayCard => new PlayCard(optionalThen(b)));
  registry.registerLudeme("move:propose", makeMessageMove);
  registry.registerLudeme("move:vote", makeMessageMove);
  registry.registerLudeme("move:move", makeMoveFallback);

  registry.registerLudeme("moveAgain:moveAgain", (): MoveAgain1to1 => new MoveAgain1to1());
  registry.registerLudeme("mover:mover", (): Mover1to1 => new Mover1to1());
  registry.registerLudeme("next:next", (): Next1to1 => new Next1to1());

  registry.registerLudeme("moves.between:between", makeBetween);
  registry.registerLudeme("moves.from:from", makeFrom);
  registry.registerLudeme("moves.piece:piece", makePiece);
  registry.registerLudeme("moves.player:player", (b): Player1to1 => new Player1to1(asIntFunction(requireValue(b, 0), "player")));
  registry.registerLudeme("moves.to:to", makeTo);

  registry.registerLudeme("nextPhase:nextPhase", makeNextPhase);
  registry.registerLudeme("not:not", (b): Not1to1 => new Not1to1(requireBooleanFunction(b.positional[0], "not")));
  registry.registerLudeme("is", makeIsFallback);
  registry.registerLudeme("regions", makeRegionsFallback);
  registry.registerLudeme("rules", makeRulesFallback);
  registry.registerLudeme("sites:sites", makeSitesFallback);
  registry.registerLudeme("sites", makeSitesFallback);
}

function makeCountFallback(b: ArgBundle): IntFunction {
  const kind = optionalString(b.positional[0]);
  if (kind === null) {
    const at = asOptionalIntFunction(namedValue(b, "at"), "count at");
    if (at !== null) return { eval: (ctx) => ctx.state.countAtSite(at.eval(ctx)) };
    const region = optionalRegionFunction(namedValue(b, "in"));
    if (region !== null) {
      return {
        eval: (ctx) => region.eval(ctx).reduce((total, site) => total + ctx.state.countAtSite(site), 0),
      };
    }
  }
  if (kind === "Value") {
    const of = requireIntFunction(firstIntishAfterKind(b, "Value"), "count Value of");
    const array = requireIntArrayFunction(namedValue(b, "in"), "count Value in");
    return {
      eval: (ctx) => array.eval(ctx).filter((value) => value === of.eval(ctx)).length,
    };
  }
  if (kind === "Pieces") {
    const role = firstRoleAfterKind(b, "Pieces");
    const of = asOptionalIntFunction(namedValue(b, "of"), "count Pieces of");
    return new CountPieces1to1(
      of ?? (role ? roleIntFunction(role) : roleIntFunction("All")),
      optionalRegionFunction(namedValue(b, "in")),
      optionalString(namedValue(b, "name")),
      of === null && (role === null || role === "All" || role === "Each"),
    );
  }
  if (kind === "Moves") return new CountMoves1to1();
  if (kind === "Trials") return new CountTrials();
  if (kind === "Phases") return new CountPhases();
  if (kind === "Sites") {
    const region = optionalRegionFunction(namedValue(b, "in")) ?? flatten(b.positional).find(isRegionFunction) ?? null;
    return { eval: (ctx) => region?.eval(ctx).length ?? 0 };
  }
  if (kind === "Rows") return { eval: (ctx) => gameBoard(ctx).height };
  if (kind === "Columns") return { eval: (ctx) => gameBoard(ctx).width };
  if (kind === "Cells" || kind === "Vertices") return { eval: (ctx) => gameBoard(ctx).numSites };
  if (kind === "Edges") return { eval: (ctx) => gameBoard(ctx).trajectories?.numSites ?? 0 };
  if (kind === "Players") return { eval: (ctx) => ctx.game.numPlayers };
  if (kind === "Turns" || kind === "MovesThisTurn" || kind === "LegalMoves" || kind === "Active") {
    return new IntConstant(0);
  }
  throw notWired(`count${kind ? ` ${kind}` : ""}`);
}

function makeBoardFallback(b: ArgBundle): Board1to1 {
  const existing = flatten(b.positional).find((v): v is Board1to1 => v instanceof Board1to1);
  if (existing) return existing;
  const graphFn = flatten(b.positional).find(isGraphFunction);
  if (graphFn === undefined) throw notWired("board");
  const requestedType = optionalSiteType(namedValue(b, "use")) ?? "Cell";
  let graph = graphFn.eval(requestedType);
  let trajectories = new Trajectories(graph, requestedType);
  if (trajectories.numSites === 0 && (requestedType === "Cell" || requestedType === "Edge")) {
    graph = graphFn.eval("Vertex");
    trajectories = new Trajectories(graph, "Vertex");
  }
  if (trajectories.numSites === 0) {
    const trackBoard = boardFromTrack(b);
    if (trackBoard !== null) return trackBoard;
    throw notWired("board");
  }

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

function boardFromTrack(b: ArgBundle): Board1to1 | null {
  const tracks = flatten(b.positional).filter((value): value is Track => value instanceof Track);
  const rawSites = tracks.flatMap((track) => ((track as unknown as { _track?: number[] | null })._track ?? []));
  if (rawSites.length === 0) return null;
  const numSites = Math.max(...rawSites) + 1;
  const width = Math.max(1, Math.ceil(Math.sqrt(numSites)));
  const height = Math.max(1, Math.ceil(numSites / width));
  return new Board1to1(width, height);
}

function makeConcentricFallback(b: ArgBundle): GraphFunction {
  const first = optionalString(b.positional[0]);
  const shape = first && isConcentricShapeType(first) ? first as ConcentricShapeType : undefined;
  const positionalNumbers = flatten(b.positional).filter((value): value is number => typeof value === "number");
  const cells = firstNumberArray(b);
  return Concentric.construct({
    shape,
    sides: optionalNumber(namedValue(b, "sides")) ?? (!shape && cells === undefined ? positionalNumbers[0] : undefined),
    cells,
    rings: optionalNumber(namedValue(b, "rings")) ?? (shape ? positionalNumbers[0] : undefined),
    steps: optionalNumber(namedValue(b, "steps")) ?? positionalNumbers[1],
    midpoints: optionalBooleanNamed(b, "midpoints") ?? undefined,
    joinMidpoints: optionalBooleanNamed(b, "joinmidpoints") ?? undefined,
    joinCorners: optionalBooleanNamed(b, "joincorners") ?? undefined,
    stagger: optionalBooleanNamed(b, "stagger") ?? undefined,
  });
}

function makeIsFallback(b: ArgBundle): BooleanFunction {
  const kind = optionalString(b.positional[0]);
  if (kind === "Even") return new IsEven1to1(requireIntFunction(firstIntishAfterKind(b, "Even"), "is Even"));
  if (kind === "Odd") return new IsOdd1to1(requireIntFunction(firstIntishAfterKind(b, "Odd"), "is Odd"));
  if (kind === "Visited") {
    return new IsVisited1to1(
      asOptionalIntFunction(firstIntishAfterKind(b, "Visited"), "is Visited") ?? new IteratorTo(),
    );
  }
  if (kind === "In") {
    const values = flatten(b.positional).filter((value) => value !== "In" && !isSiteTypeName(value));
    const site = values.find(isIntish);
    const region = values.find(isRegionFunction);
    return new IsIn1to1(
      asOptionalIntFunction(site, "is In") ?? new IteratorTo(),
      requireRegionFunction(region, "is In"),
    );
  }
  if (kind === "Empty") {
    return new IsEmpty1to1(
      asOptionalIntFunction(firstIntishAfterKind(b, "Empty"), "is Empty") ?? new IteratorTo(),
    );
  }
  if (kind === "Occupied") {
    return new IsOccupied1to1(
      asOptionalIntFunction(firstIntishAfterKind(b, "Occupied"), "is Occupied") ?? new IteratorTo(),
    );
  }
  if (kind === "Mover") {
    return new IsMover1to1(firstPlayerIntAfterKind(b, "Mover") ?? roleIntFunction("Mover"));
  }
  if (kind === "Next") {
    return new IsNext1to1(firstPlayerIntAfterKind(b, "Next") ?? new IntConstant(-1));
  }
  if (kind === "Prev") {
    return new IsPrev1to1(firstPlayerIntAfterKind(b, "Prev") ?? new IntConstant(-1));
  }
  if (kind === "Enemy") {
    return new IsEnemy1to1(firstPlayerIntAfterKind(b, "Enemy") ?? new IntConstant(-1));
  }
  if (kind === "Friend" || kind === "Friendly") {
    return new IsFriend1to1(firstPlayerIntAfterKind(b, kind) ?? new IntConstant(-1));
  }
  if (kind === "Active") {
    return new IsActive1to1(firstPlayerIntAfterKind(b, "Active") ?? roleIntFunction("Mover"));
  }
  if (kind === "Full") return new IsFull1to1();
  if (kind === "Pending") return new IsPending1to1();
  if (kind === "Blocked") return new IsBlocked1to1();
  if (kind === "Within") {
    const pieceId = requireIntFunction(firstIntishAfterKind(b, "Within"), "is Within piece");
    return new IsWithin(
      pieceId,
      optionalSiteType(flatten(b.positional).find(isSiteTypeName)),
      asOptionalIntFunction(namedValue(b, "at"), "is Within at"),
      optionalRegionFunction(namedValue(b, "in")) ?? flatten(b.positional).find(isRegionFunction) ?? null,
    );
  }
  throw notWired(`is${kind ? ` ${kind}` : ""}`);
}

function makeRegionsFallback(b: ArgBundle): Regions {
  const values = flatten(b.positional);
  const role = values.find((value): value is string => typeof value === "string" && isRoleTypeName(value)) ?? null;
  const name = values.find((value): value is string =>
    typeof value === "string" && !isRoleTypeName(value) && !isStaticRegionName(value),
  ) ?? null;
  const sites = values.find(isNumberArray) ?? null;
  const regions = values.filter(isRegionFunction);
  const staticRegions = values.filter(isStaticRegionName);
  if (sites !== null) return new Regions(name, role as never, sites, null, null, null, null, null);
  if (regions.length === 1) return new Regions(name, role as never, null, regions[0]!, null, null, null, null);
  if (regions.length > 1) return new Regions(name, role as never, null, null, regions, null, null, null);
  if (staticRegions.length === 1) return new Regions(name, role as never, null, null, null, staticRegions[0] as never, null, null);
  if (staticRegions.length > 1) return new Regions(name, role as never, null, null, null, null, staticRegions as never, null);
  throw notWired("regions");
}

function makeRulesFallback(b: ArgBundle): Rules1to1 {
  const play = flatten(b.positional).find((v): v is Play1to1 => v instanceof Play1to1) ?? null;
  const end = flatten(b.positional).find((v): v is End => v instanceof End) ?? null;
  const phases = [
    ...flatten(b.positional).filter((v): v is Phase => v instanceof Phase),
    ...flatten([namedValue(b, "phases")]).filter((v): v is Phase => v instanceof Phase),
  ];
  if (!end) throw new Error("factory rules: missing end");
  if (phases.length > 0) return new Rules1to1(null, null, play ?? phases[0]!.play, phases, end);
  if (!play) throw new Error("factory rules: missing play");
  return new Rules1to1(null, null, play, end);
}

function makeSitesFallback(b: ArgBundle): RegionFunction {
  const kind = optionalString(b.positional[0]);
  if (kind === null) {
    const siteType = optionalSiteType(namedValue(b, "type", "siteType")) ?? optionalSiteType(flatten(b.positional).find(isSiteTypeName)) ?? null;
    const coords = firstStringArray(b);
    if (coords !== null) return Sites.constructCoords(siteType, coords);
    const sites = firstNumberArray(b);
    if (sites !== undefined) return Sites.constructCustom(sites.map((site) => new IntConstant(site)), null);
    const array = flatten(b.positional).find(isIntArrayFunction);
    if (array !== undefined) return Sites.constructCustom(null, array);
    return Sites.constructContext();
  }
  if (isRoleTypeName(kind)) {
    const values = flatten(b.positional);
    const siteType = optionalSiteType(namedValue(b, "type", "siteType")) ?? optionalSiteType(values.find(isSiteTypeName)) ?? null;
    const name = values.find((value): value is string =>
      typeof value === "string" && value !== kind && value !== siteType && !isRoleTypeName(value),
    ) ?? null;
    return Sites.constructEquipmentOrCoord(roleIntFunction(kind), null, siteType, name);
  }
  if (isSitesSimpleTypeName(kind)) {
    const values = flatten(b.positional);
    const siteType = optionalSiteType(namedValue(b, "type", "siteType")) ?? optionalSiteType(values.find(isSiteTypeName)) ?? null;
    return Sites.constructSimple((kind === "Center" ? "Centre" : kind) as never, siteType);
  }
  if (isSitesIndexTypeName(kind)) {
    const values = flatten(b.positional);
    const siteType = optionalSiteType(namedValue(b, "type", "siteType")) ?? optionalSiteType(values.find(isSiteTypeName)) ?? null;
    return Sites.constructIndex(
      kind as never,
      siteType,
      asOptionalIntFunction(firstIntishAfterKind(b, kind), `sites ${kind}`),
    );
  }
  if (kind !== "Side") throw notWired(`sites${kind ? ` ${kind}` : ""}`);
  const values = flatten(b.positional);
  const siteType = optionalSiteType(namedValue(b, "type", "siteType")) ?? optionalSiteType(values.find(isSiteTypeName)) ?? null;
  const stringArgs = values.filter((value): value is string =>
    typeof value === "string" && value !== "Side" && value !== siteType,
  );
  const role = stringArgs.find(isRoleTypeName) ?? null;
  const direction = stringArgs.find((value) => value !== role && !isRoleTypeName(value)) ?? null;
  const player = findFirst(b, isPlayer);
  return Sites.constructSide("Side", siteType, player, role, direction);
}

function makePair(b: ArgBundle): Pair {
  const a = requireValue(b, 0);
  const c = requireValue(b, 1);
  if (typeof a === "string" && typeof c === "string" && !isRoleTypeName(a)) return Pair.fromStringString(a, c);
  if (isRoleTypeName(a) && isRoleTypeName(c)) return Pair.fromRoleRole(toPairRole(a), toPairRole(c));
  if (isRoleTypeName(a) && isIntish(c)) return Pair.fromRoleInt(toPairRole(a), asIntFunction(c, "pair"));
  if (isIntish(a) && isIntish(c)) return Pair.fromIntInt(asIntFunction(a, "pair"), asIntFunction(c, "pair"));
  if (typeof a === "string" && isRoleTypeName(c)) return Pair.fromStringRole(a, toPairRole(c));
  if (isRoleTypeName(a) && isLandmarkTypeName(c)) return Pair.fromRoleLandmark(toPairRole(a), toLandmark(c));
  if (isRoleTypeName(a) && typeof c === "string") return Pair.fromRoleString(toPairRole(a), c);
  if (isIntish(a) && typeof c === "string") return Pair.fromIntString(asIntFunction(a, "pair"), c);
  throw new Error("factory not yet wired: pair");
}

function makeSlide(b: ArgBundle): Slide {
  const from = findFirst(b, isFrom);
  const between = findFirst(b, isBetween);
  const to = findFirst(b, isTo);
  const track = firstStringAfterDiscriminator(b, "Slide");
  return new Slide({
    startLocationFn: from?.locFn() ?? new IteratorFrom(),
    levelFromFn: from?.levelFn() ?? null,
    fromCondition: from?.condFn() ?? null,
    limit: between?.rangeFn()?.[1],
    minFn: between?.rangeFn()?.[0],
    goRule: between?.condition() ?? isEmptyBetween(),
    stopRule: to?.condFn() ?? null,
    toRule: null,
    letFn: between?.trailFn() ?? null,
    betweenEffect: null,
    sideEffect: null,
    dirnName: firstDirectionName(b) ?? "Adjacent",
    trackName: track,
    stack: optionalBooleanNamed(b, "stack") ?? false,
    then: optionalThen(b) as never,
  });
}

function makeStep(b: ArgBundle): Step {
  const from = findFirst(b, isFrom);
  const to = requireTo(findFirst(b, isTo), "move Step");
  return new Step({
    startLocationFn: from?.locFn() ?? new IteratorFrom(),
    startRegionFn: from?.regionFn() ?? null,
    levelFromFn: from?.levelFn() ?? null,
    fromCondition: from?.condFn() ?? null,
    rule: to.condFn() ?? trueFunction(),
    sideEffect: null,
    stack: optionalBooleanNamed(b, "stack") ?? false,
    dirnChoice: directionFunction(firstDirectionName(b) ?? "Adjacent"),
    then: optionalThen(b) as never,
  });
}

function makeShoot(b: ArgBundle): Shoot {
  const piece = requirePiece(findFirst(b, isPiece), "move Shoot");
  const pieceFn = piece.component();
  if (pieceFn === null) throw new Error("factory not yet wired: move Shoot");
  const from = findFirst(b, isFrom);
  const between = findFirst(b, isBetween);
  const to = findFirst(b, isTo);
  return new Shoot({
    startLocationFn: from?.locFn() ?? new IteratorTo(),
    dirnName: firstDirectionName(b) ?? "Adjacent",
    goRule: between?.condition() ?? isEmptyBetween(),
    toRule: to?.condFn() ?? isEmptyTo(),
    pieceFn,
    type: from?.siteType() ?? null,
    then: optionalThen(b) as never,
  });
}

function makeSelect(b: ArgBundle): Select {
  const from = requireFrom(findFirst(b, isFrom), "move Select");
  const to = findFirst(b, isTo);
  const role = flatten(b.positional).find((v): v is string => typeof v === "string" && isRoleTypeName(v));
  return new Select(
    from,
    to ?? null,
    role as ConstructorParameters<typeof Select>[2],
    optionalThen(b) as ConstructorParameters<typeof Select>[3],
  );
}

function makeRemove(b: ArgBundle): Remove {
  const locOrRegion = firstNonDiscriminator(b, "Remove");
  const locationFn = isRegionFunction(locOrRegion) ? null : asOptionalIntFunction(locOrRegion, "remove");
  const regionFn = isRegionFunction(locOrRegion) ? locOrRegion : null;
  if (locationFn === null && regionFn === null) throw new Error("factory not yet wired: move Remove");
  return new Remove({
    locationFn,
    regionFn,
    countFn: asOptionalIntFunction(b.named.get("count"), "remove"),
    levelFn: asOptionalIntFunction(b.named.get("level"), "remove"),
    type: optionalSiteType(firstAfterKindString(b, "Remove")),
    when: optionalString(b.named.get("at")),
    then: optionalThen(b) as never,
  });
}

function makeSet(b: ArgBundle): MovesFunction {
  const kind = requireString(b, 0);
  const then = movesFromThen(optionalThenLike(b));
  if (kind === "Team") {
    const team = firstIntishAfterKind(b, "Team");
    const roles = firstStringArray(b) ?? flatten(b.positional)
      .filter((v): v is string => typeof v === "string" && v !== "Team" && isRoleTypeName(v));
    if (team === undefined || roles.length === 0) throw notWired("move Set Team");
    return new SetTeam(asIntFunction(team, "set Team"), roles, then);
  }
  if (kind === "Hidden") {
    const dataTypes = hiddenDataTypes(b);
    const at = namedValue(b, "at");
    const region = flatten(b.positional).find(isRegionFunction);
    const player = namedValue(b, "to");
    const role = namedValue(b, "To", "to");
    const whoFn = player instanceof Player1to1
      ? player.index()
      : isIntish(player)
        ? asIntFunction(player, "set Hidden to")
        : null;
    const roleName = typeof role === "string" ? role : null;
    if (at === undefined && !region) throw notWired("move Set Hidden");
    if (whoFn === null && roleName === null) throw notWired("move Set Hidden");
    return new SetHidden(
      dataTypes,
      optionalSiteType(flatten(b.positional).find(isSiteTypeName)) ?? null,
      new IntArrayFromRegion(asOptionalIntFunction(at, "set Hidden at") as never, (region ?? null) as never),
      asOptionalIntFunction(namedValue(b, "level"), "set Hidden level"),
      optionalBooleanFunctionValue(namedValue(b, "value") ?? flatten(b.positional).find(isBooleanFunction)),
      whoFn,
      roleName,
      then,
    );
  }
  if (kind === "TrumpSuit") {
    const suits = flatten(b.positional).find(isIntArrayFunction) ?? null;
    const suit = suits === null
      ? flatten(b.positional).find((v) => v !== "Set" && v !== "TrumpSuit" && isIntish(v))
      : undefined;
    return new SetTrumpSuit(asOptionalIntFunction(suit, "set TrumpSuit"), suits, then);
  }
  if (kind === "NextPlayer") {
    const player = findFirst(b, isPlayer);
    const ints = flatten(b.positional).find(isIntArrayFunction);
    return new SetNextPlayer(player ?? null, ints ?? null, then);
  }
  if (kind === "Rotation") {
    const to = findFirst(b, isTo);
    const directionFns = flatten(b.positional)
      .filter((v) => v !== "Set" && v !== "Rotation" && isIntish(v))
      .map((v) => asIntFunction(v, "set Rotation"));
    return new SetRotation(
      to?.locFn() ?? new IteratorTo(),
      to?.siteType() ?? null,
      directionFns.length > 0 ? directionFns : null,
      optionalBooleanFunctionNamed(b, "previous"),
      optionalBooleanFunctionNamed(b, "next"),
      then,
    );
  }
  if (kind === "Value") {
    if (namedValue(b, "at") !== undefined || !hasPlayerOrRoleAfterKind(b, "Value")) return makeSetSiteValue(b, then);
    return makeSetPlayerValue(b, then);
  }
  if (kind === "Score") return makeSetScore(b);
  if (kind === "Pending") {
    const payload = firstNonDiscriminator(b, "Pending");
    return new SetPending(
      isRegionFunction(payload) ? null : asOptionalIntFunction(payload, "set Pending"),
      isRegionFunction(payload) ? payload : null,
      then,
    );
  }
  if (kind === "Var") {
    const name = flatten(b.positional).find((v): v is string => typeof v === "string" && v !== "Var") ?? null;
    const value = firstIntishAfterKind(b, "Var");
    return new SetVar1to1(name, asOptionalIntFunction(value, "set Var") ?? new IntConstant(-1), optionalThen(b));
  }
  if (kind === "Counter") return new SetCounter(asOptionalIntFunction(firstIntishAfterKind(b, "Counter"), "set Counter"), then);
  if (kind === "Pot") return new SetPot(asOptionalIntFunction(firstIntishAfterKind(b, "Pot"), "set Pot"), then);
  if (kind === "Count") {
    const atNamed = namedValue(b, "at");
    const at = requireIntFunction(atNamed ?? firstIntishAfterKind(b, "Count"), "set Count at");
    const value = requireIntFunction(atNamed === undefined ? secondIntishAfterKind(b, "Count") : firstIntishAfterKind(b, "Count"), "set Count value");
    return new SetCount1to1(optionalSiteType(flatten(b.positional).find(isSiteTypeName)), at, value, optionalThen(b));
  }
  if (kind === "State") {
    const atNamed = namedValue(b, "at");
    const at = requireIntFunction(atNamed ?? firstIntishAfterKind(b, "State"), "set State at");
    const level = asOptionalIntFunction(namedValue(b, "level"), "set State level");
    const value = requireIntFunction(atNamed === undefined ? secondIntishAfterKind(b, "State") : firstIntishAfterKind(b, "State"), "set State value");
    return new SetState1to1(optionalSiteType(flatten(b.positional).find(isSiteTypeName)), at, level, value, optionalThen(b));
  }
  throw new Error(`factory not yet wired: move Set ${kind}`);
}

function makeSetPlayerValue(b: ArgBundle, then: MovesFunction | null): SetValuePlayer {
  const player = findFirst(b, isPlayer);
  const role = firstRoleAfterKind(b, "Value");
  const value = requireIntFunction(firstIntishAfterKind(b, "Value", player?.index()), "set Value");
  return new SetValuePlayer(player?.index() ?? null, player ? null : role, value, then);
}

function makeSetSiteValue(b: ArgBundle, then: MovesFunction | null): SetValue {
  const atNamed = namedValue(b, "at");
  const at = requireIntFunction(atNamed ?? firstIntishAfterKind(b, "Value"), "set Value at");
  const level = asOptionalIntFunction(namedValue(b, "level"), "set Value level");
  const value = requireIntFunction(atNamed === undefined ? secondIntishAfterKind(b, "Value") : firstIntishAfterKind(b, "Value"), "set Value value");
  return new SetValue(optionalSiteType(flatten(b.positional).find(isSiteTypeName)), at, level, value, then);
}

function makeSetScore(b: ArgBundle): SetScore1to1 {
  const player = findFirst(b, isPlayer);
  const role = firstRoleAfterKind(b, "Score");
  const scoreFn = firstIntishAfterKind(b, "Score");
  if ((player === undefined && role === null) || scoreFn === undefined) throw notWired("move Set Score");
  return new SetScore1to1(player ?? null, role as ConstructorParameters<typeof SetScore1to1>[1], asIntFunction(scoreFn, "set Score"), optionalThen(b));
}

function makeMoveSwap(b: ArgBundle): MovesFunction {
  const kind = requireString(b, 1) === "Players" ? "Players" : requireString(b, 0) === "Players" ? "Players" : "Pieces";
  if (kind === "Pieces") {
    const ints = flatten(b.positional).filter((v) => isIntish(v)).map((v) => asIntFunction(v, "swap Pieces"));
    return MoveSwap.constructPieces(SwapSitesType.Pieces, ints[0] ?? null, ints[1] ?? null, optionalThen(b));
  }
  const args = flatten(b.positional).filter((v) => v !== "Swap" && v !== "Players");
  const first = args[0];
  const second = args[1];
  return MoveSwap.constructPlayers(
    SwapPlayersType.Players,
    isIntish(first) ? asIntFunction(first, "swap Players") : null,
    typeof first === "string" ? first : null,
    isIntish(second) ? asIntFunction(second, "swap Players") : null,
    typeof second === "string" ? second : null,
    optionalThen(b),
  );
}

function makePromote(b: ArgBundle): Promote {
  const piece = requirePiece(findFirst(b, isPiece), "move Promote");
  const location = flatten(b.positional).find((v) => isIntish(v));
  const ownerPlayer = findFirst(b, isPlayer);
  const ownerRole = flatten(b.positional).find((v): v is string => typeof v === "string" && isRoleTypeName(v));
  return new Promote(
    asOptionalIntFunction(location, "promote") ?? new IteratorTo(),
    piece.getNames() ?? (piece.getName() !== null ? [piece.getName()!] : null),
    piece.component(),
    piece.components(),
    ownerPlayer?.index() ?? (ownerRole ? roleIntFunction(ownerRole) : null),
    optionalSiteType(firstAfterKindString(b, "Promote")),
    optionalThen(b),
  );
}

function makeHop(b: ArgBundle): Hop {
  const from = findFirst(b, isFrom);
  const between = findFirst(b, isBetween);
  const to = requireTo(findFirst(b, isTo), "move Hop");
  return new Hop({
    startLocationFn: from?.locFn() ?? new IteratorFrom(),
    dirnChoice: directionFunction(firstDirectionName(b) ?? "Adjacent"),
    goRule: to.condFn() ?? trueFunction(),
    hurdleRule: between?.condition() ?? trueFunction(),
    stopRule: null,
    stopEffect: null,
    maxDistanceFromHurdleFn: between?.beforeFn() ?? new IntConstant(0),
    minLengthHurdleFn: between?.rangeFn()?.[0] ?? new IntConstant(1),
    maxLengthHurdleFn: between?.rangeFn()?.[1] ?? new IntConstant(1),
    maxDistanceHurdleToFn: between?.afterFn() ?? new IntConstant(0),
    sideEffect: null,
    fromCondition: from?.condFn() ?? null,
    stack: optionalBooleanNamed(b, "stack") ?? false,
    then: optionalThen(b) as never,
  });
}

function makeMessageMove(b: ArgBundle): MovesFunction {
  const kind = requireString(b, 0);
  const payload = b.positional[1];
  const then = movesFromThen(optionalThenLike(b));
  if (kind === "Propose") {
    return Array.isArray(payload)
      ? new Propose(null, payload.filter(isString), optionalThen(b))
      : new Propose(optionalString(payload), null, optionalThen(b));
  }
  if (kind === "Vote") {
    return Array.isArray(payload)
      ? new Vote(null, payload.filter(isString), then)
      : new Vote(optionalString(payload), null, then);
  }
  throw new Error(`factory not yet wired: move ${kind}`);
}

function makeAdd(b: ArgBundle): Add {
  const to = requireTo(findFirst(b, isTo), "move Add");
  const region = to.regionFn() ?? singleSiteRegion(to.locFn() ?? new IteratorTo());
  const piece = findFirst(b, isPiece);
  const component = piece?.component();
  return new Add(
    region,
    component ? { what: component, owner: -1, state: piece?.state() ?? undefined } : null,
  );
}

function makeClaim(b: ArgBundle): Claim1to1 {
  const to = requireTo(findFirst(b, isTo), "move Claim");
  const piece = findFirst(b, isPiece) ?? null;
  return new Claim1to1(piece, to, optionalThen(b));
}

function makeLeap(b: ArgBundle): Leap {
  const from = findFirst(b, isFrom);
  const to = requireTo(findFirst(b, isTo), "move Leap");
  const walk = new SitesWalk1to1(
    from?.locFn() ?? new IteratorFrom(),
    normaliseWalks(findRaw(b.positional, isStepList)),
    optionalBooleanFunctionValue(namedValue(b, "rotations")) ?? trueFunction(),
  );
  return new Leap({
    startLocationFn: from?.locFn() ?? new IteratorFrom(),
    fromCondition: from?.condFn() ?? null,
    walk,
    forward: optionalBooleanFunctionValue(namedValue(b, "forward")) ?? falseFunction(),
    goRule: to.condFn() ?? trueFunction(),
    sideEffect: null,
    then: optionalThen(b),
  });
}

function makeMoveFallback(b: ArgBundle): MovesFunction {
  const kind = typeof b.positional[0] === "string" ? b.positional[0] : null;
  if (kind === "Pass") return new Pass1to1();
  if (kind === "PlayCard") return new PlayCard(optionalThen(b));
  if (kind === "Leap") return makeLeap(b);
  if (kind === "Bet") throw notWired("move Bet");
  if (kind === "Add") return makeAdd(b);
  if (kind === "Claim") return makeClaim(b);
  if (kind === "Move") throw notWired(`move ${kind}`);
  if (findFirst(b, isFrom) && findFirst(b, isTo)) {
    const from = requireFrom(findFirst(b, isFrom), "move from-to");
    const to = requireTo(findFirst(b, isTo), "move from-to");
    return new FromTo({
      locFrom: from.locFn(),
      levelFrom: from.levelFn(),
      countFn: asOptionalIntFunction(b.named.get("count"), "from-to"),
      locTo: to.locFn() ?? new IteratorTo(),
      levelTo: to.levelFn(),
      regionFrom: from.regionFn(),
      regionTo: to.regionFn(),
      fromCondition: from.condFn(),
      moveRule: to.condFn(),
      captureRule: null,
      captureEffect: null,
      stack: optionalBooleanNamed(b, "stack") ?? false,
      copy: optionalBooleanFunctionNamed(b, "copy") ?? falseFunction(),
      then: optionalThen(b),
    });
  }
  throw notWired("move");
}

function singleSiteRegion(siteFn: IntFunction): RegionFunction {
  return { eval: (ctx) => [siteFn.eval(ctx)] };
}

function makeBetween(b: ArgBundle): Between1to1 {
  const rangeValue = flatten(b.positional).find(isRangeLike);
  return new Between1to1({
    before: asOptionalIntFunction(b.named.get("before"), "between"),
    range: rangeValue ? [rangeValue.minFn, rangeValue.maxFn] : null,
    after: asOptionalIntFunction(b.named.get("after"), "between"),
    cond: optionalBooleanFunctionNamed(b, "if"),
    trail: asOptionalIntFunction(b.named.get("trail"), "between"),
    effect: null,
  });
}

function makeFrom(b: ArgBundle): From1to1 {
  const values = flatten(b.positional);
  const type = values.find(isSiteTypeName) ?? null;
  const payload = values.find((v) => v !== type);
  return new From1to1({
    type,
    region: isRegionFunction(payload) ? payload : null,
    loc: isRegionFunction(payload) ? null : asOptionalIntFunction(payload, "from"),
    level: asOptionalIntFunction(b.named.get("level"), "from"),
    cond: optionalBooleanFunctionNamed(b, "if"),
  });
}

function makePiece(b: ArgBundle): Piece1to1 {
  const stateFn = asOptionalIntFunction(b.named.get("state"), "piece");
  const value = b.positional[0];
  if (typeof value === "string") return new Piece1to1({ nameComponent: value, stateFn });
  if (typeof value === "number" || isIntFunction(value)) return new Piece1to1({ componentFn: asIntFunction(value, "piece"), stateFn });
  if (Array.isArray(value) && value.every(isString)) return new Piece1to1({ nameComponents: value, stateFn });
  if (Array.isArray(value) && value.every(isIntish)) {
    return new Piece1to1({ componentsFn: value.map((v) => asIntFunction(v, "piece")), stateFn });
  }
  throw notWired("piece");
}

function makeTo(b: ArgBundle): To1to1 {
  const values = flatten(b.positional);
  const type = values.find(isSiteTypeName) ?? null;
  const payload = values.find((v) => v !== type && !isRotationLike(v));
  return new To1to1({
    type,
    region: isRegionFunction(payload) ? payload : null,
    loc: isRegionFunction(payload) ? null : asOptionalIntFunction(payload, "to"),
    level: asOptionalIntFunction(b.named.get("level"), "to"),
    cond: optionalBooleanFunctionNamed(b, "if"),
    effect: null,
  });
}

function makeNextPhase(b: ArgBundle): NextPhase {
  const role = flatten(b.positional).find((v): v is string => typeof v === "string" && isRoleTypeName(v));
  const player = findFirst(b, isPlayer);
  const cond = flatten(b.positional).find(isBooleanFunction);
  const phaseName = flatten(b.positional).find((v): v is string => typeof v === "string" && !isRoleTypeName(v));
  return new NextPhase(role ?? null, player ?? null, cond ?? null, phaseName ?? null);
}

function requireValue(b: ArgBundle, index: number): unknown {
  if (index >= b.positional.length) throw new Error(`factory not yet wired: ${b.sourceKeyword}`);
  return b.positional[index];
}

function requireString(b: ArgBundle, index: number): string {
  const value = b.positional[index];
  if (typeof value !== "string") throw new Error(`factory not yet wired: ${b.sourceKeyword}`);
  return value;
}

function flatten(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) Array.isArray(value) ? out.push(...flatten(value)) : out.push(value);
  return out;
}

function findFirst<T>(b: ArgBundle, guard: (value: unknown) => value is T): T | undefined {
  return flatten(b.positional).find(guard);
}

function namedValue(b: ArgBundle, ...names: string[]): unknown {
  for (const name of names) {
    if (b.named.has(name)) return b.named.get(name);
  }
  return undefined;
}

function firstNonDiscriminator(b: ArgBundle, discriminator: string): unknown {
  return flatten(b.positional).find((value) => value !== discriminator && !(typeof value === "string" && isSiteTypeName(value)));
}

function firstIntishAfterKind(b: ArgBundle, kind: string, except?: unknown): number | IntFunction | undefined {
  return flatten(b.positional).find((value): value is number | IntFunction =>
    value !== kind && value !== except && isIntish(value),
  );
}

function secondIntishAfterKind(b: ArgBundle, kind: string): number | IntFunction | undefined {
  return flatten(b.positional).filter((value): value is number | IntFunction => value !== kind && isIntish(value))[1];
}

function firstRoleAfterKind(b: ArgBundle, kind: string): string | null {
  return flatten(b.positional).find((value): value is string =>
    typeof value === "string" && value !== kind && isRoleTypeName(value),
  ) ?? null;
}

function firstPlayerIntAfterKind(b: ArgBundle, kind: string): IntFunction | null {
  for (const value of flatten(b.positional)) {
    if (value === kind || isSiteTypeName(value)) continue;
    if (value instanceof Player1to1) return value.index();
    if (isIntish(value)) return asIntFunction(value, `is ${kind}`);
    if (typeof value === "string" && isRoleTypeName(value)) return roleIntFunction(value);
  }
  return null;
}

function firstStringArray(b: ArgBundle): string[] | null {
  return findRaw(b.positional, (value): value is string[] =>
    Array.isArray(value) && value.every((entry) => typeof entry === "string"),
  ) ?? null;
}

function firstNumberArray(b: ArgBundle): number[] | undefined {
  return findRaw(b.positional, (value): value is number[] =>
    Array.isArray(value) && value.every((entry) => typeof entry === "number"),
  );
}

function hasPlayerOrRoleAfterKind(b: ArgBundle, kind: string): boolean {
  return findFirst(b, isPlayer) !== undefined || firstRoleAfterKind(b, kind) !== null;
}

function hiddenDataTypes(b: ArgBundle): HiddenData[] | null {
  const values = flatten(b.positional);
  const arrayValue = findRaw(b.positional, (value): value is HiddenData[] => Array.isArray(value) && value.every(isHiddenDataName));
  if (arrayValue) return arrayValue;
  const dataType = values.find(isHiddenDataName);
  return dataType ? [dataType] : null;
}

function findRaw<T>(values: readonly unknown[], guard: (value: unknown) => value is T): T | undefined {
  for (const value of values) {
    if (guard(value)) return value;
    if (Array.isArray(value)) {
      const nested = findRaw(value, guard);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

function firstAfterKindString(b: ArgBundle, discriminator: string): string | null {
  return flatten(b.positional).find((value): value is string => typeof value === "string" && value !== discriminator) ?? null;
}

function firstStringAfterDiscriminator(b: ArgBundle, discriminator: string): string | null {
  return flatten(b.positional).find((value): value is string => typeof value === "string" && value !== discriminator && !isDirectionName(value)) ?? null;
}

function firstDirectionName(b: ArgBundle): string | null {
  return flatten(b.positional).find((value): value is string => typeof value === "string" && isDirectionName(value)) ?? null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function optionalSiteType(value: unknown): SiteTypeName | null {
  return isSiteTypeName(value) ? value : null;
}

function optionalRegionFunction(value: unknown): RegionFunction | null {
  return isRegionFunction(value) ? value : null;
}

function optionalBooleanNamed(b: ArgBundle, name: string): boolean | null {
  const value = b.named.get(name);
  return typeof value === "boolean" ? value : null;
}

function optionalBooleanFunctionNamed(b: ArgBundle, name: string): BooleanFunction | null {
  const value = b.named.get(name);
  if (typeof value === "boolean") return value ? trueFunction() : falseFunction();
  return isBooleanFunction(value) ? value : null;
}

function optionalBooleanFunctionValue(value: unknown): BooleanFunction | null {
  if (typeof value === "boolean") return value ? trueFunction() : falseFunction();
  return isBooleanFunction(value) ? value : null;
}

function optionalThen(b: ArgBundle): Then | null {
  return flatten(b.positional).find(isThen) ?? null;
}

function optionalThenLike(b: ArgBundle): Then | MovesFunction | null {
  return optionalThen(b) ?? flatten(b.positional).find(isMovesFunction) ?? null;
}

function movesFromThen(value: Then | MovesFunction | null): MovesFunction | null {
  if (value === null) return null;
  if (isThen(value)) return value.moves();
  return value;
}

function asOptionalIntFunction(value: unknown, label: string): IntFunction | null {
  if (value === undefined || value === null) return null;
  return asIntFunction(value, label);
}

function asIntFunction(value: unknown, label: string): IntFunction {
  if (typeof value === "number") return new IntConstant(value);
  if (isIntFunction(value)) return value;
  throw new Error(`factory not yet wired: ${label}`);
}

function requireIntFunction(value: unknown, label: string): IntFunction {
  return asIntFunction(value, label);
}

function requireBooleanFunction(value: unknown, label: string): BooleanFunction {
  if (typeof value === "boolean") return value ? trueFunction() : falseFunction();
  if (isBooleanFunction(value)) return value;
  throw new Error(`factory not yet wired: ${label}`);
}

function requireMoves(value: MovesFunction | undefined, label: string): MovesFunction {
  if (!value) throw new Error(`factory not yet wired: ${label}`);
  return value;
}

function requireIntArrayFunction(value: unknown, label: string): IntArrayFunction {
  if (isIntArrayFunction(value)) return value;
  throw new Error(`factory not yet wired: ${label}`);
}

function requireRegionFunction(value: unknown, label: string): RegionFunction {
  if (isRegionFunction(value)) return value;
  throw new Error(`factory not yet wired: ${label}`);
}

function requireFrom(value: From1to1 | undefined, label: string): From1to1 {
  if (!value) throw new Error(`factory not yet wired: ${label}`);
  return value;
}

function requireTo(value: To1to1 | undefined, label: string): To1to1 {
  if (!value) throw new Error(`factory not yet wired: ${label}`);
  return value;
}

function requirePiece(value: Piece1to1 | undefined, label: string): Piece1to1 {
  if (!value) throw new Error(`factory not yet wired: ${label}`);
  return value;
}

function trueFunction(): BooleanFunction {
  return { eval: () => true };
}

function falseFunction(): BooleanFunction {
  return { eval: () => false };
}

function isEmptyTo(): BooleanFunction {
  return { eval: (ctx) => ctx.state.isEmptySite(ctx._evalTo) };
}

function isEmptyBetween(): BooleanFunction {
  return { eval: (ctx) => ctx.state.isEmptySite(ctx._evalBetween) };
}

function directionFunction(name: string): DirectionsFunction {
  return { eval: () => [name] };
}

function intAsRegion(fn: IntFunction): RegionFunction {
  return { eval: (ctx) => [fn.eval(ctx)] };
}

function gameBoard(ctx: { game: unknown }): Board1to1 {
  return (ctx.game as { equipment: { board: Board1to1 } }).equipment.board;
}

function roleIntFunction(role: string): IntFunction {
  return {
    eval: (ctx) => {
      if (role === "Mover") return ctx.state.mover;
      if (role === "Next") return (ctx.state.mover % ctx.game.numPlayers) + 1;
      if (role === "Prev") return ((ctx.state.mover - 2 + ctx.game.numPlayers) % ctx.game.numPlayers) + 1;
      if (role === "Player") return ctx._evalPlayer ?? 0;
      if (role === "Shared" || role === "All") return ctx.game.numPlayers + 1;
      if (/^P\d+$/.test(role)) return Number(role.slice(1));
      return 0;
    },
  };
}

function toPairRole(value: string): PairRoleType {
  const found = (PairRoleType as unknown as Record<string, PairRoleType>)[value];
  if (found === undefined) throw new Error("factory not yet wired: pair");
  return found;
}

function toLandmark(value: string): LandmarkType {
  const found = (LandmarkType as unknown as Record<string, LandmarkType>)[value];
  if (found === undefined) throw new Error("factory not yet wired: pair");
  return found;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isIntish(value: unknown): value is number | IntFunction {
  return typeof value === "number" || isIntFunction(value);
}

function isIntFunction(value: unknown): value is IntFunction {
  return typeof (value as IntFunction | null)?.eval === "function" && !isKnownNonIntFunction(value);
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return typeof (value as BooleanFunction | null)?.eval === "function" && !isKnownNonBooleanFunction(value);
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return typeof (value as RegionFunction | null)?.eval === "function" && !isIntFunction(value) && !isBooleanFunction(value) && !isKnownMove(value);
}

function isMovesFunction(value: unknown): value is MovesFunction {
  return isKnownMove(value);
}

function isGraphFunction(value: unknown): value is GraphFunction {
  return typeof (value as GraphFunction | null)?.eval === "function";
}

function isIntArrayFunction(value: unknown): value is IntArrayFunction {
  return typeof (value as IntArrayFunction | null)?.eval === "function";
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "number");
}

function isKnownNonIntFunction(value: unknown): boolean {
  return value instanceof From1to1 ||
    value instanceof To1to1 ||
    value instanceof Between1to1 ||
    value instanceof Player1to1 ||
    value instanceof Piece1to1 ||
    isRegionLikeObject(value);
}

function isKnownNonBooleanFunction(value: unknown): boolean {
  return isKnownNonIntFunction(value);
}

function isKnownMove(value: unknown): value is MovesFunction {
  return value instanceof Add ||
    value instanceof Claim1to1 ||
    value instanceof Slide ||
    value instanceof Step ||
    value instanceof Shoot ||
    value instanceof Select ||
    value instanceof Remove ||
    value instanceof Leap ||
    value instanceof Promote ||
    value instanceof Hop ||
    value instanceof FromTo ||
    value instanceof Pass1to1 ||
    value instanceof PlayCard ||
    value instanceof Propose ||
    value instanceof Vote ||
    value instanceof SetNextPlayer ||
    value instanceof SetRotation ||
    value instanceof SetTrumpSuit ||
    value instanceof SetTeam ||
    value instanceof SetHidden ||
    value instanceof SetPending ||
    value instanceof SetScore1to1 ||
    value instanceof SetValuePlayer ||
    value instanceof SetCount1to1 ||
    value instanceof SetState1to1 ||
    value instanceof SetValue ||
    value instanceof SetCounter ||
    value instanceof SetPot ||
    value instanceof SetVar1to1 ||
    value instanceof MaxMoves ||
    value instanceof MaxCaptures;
}

function isRegionLikeObject(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  const name = value.constructor?.name ?? "";
  return name.startsWith("Sites") || name.startsWith("Region");
}

function isFrom(value: unknown): value is From1to1 {
  return value instanceof From1to1;
}

function isTo(value: unknown): value is To1to1 {
  return value instanceof To1to1;
}

function isBetween(value: unknown): value is Between1to1 {
  return value instanceof Between1to1;
}

function isPiece(value: unknown): value is Piece1to1 {
  return value instanceof Piece1to1;
}

function isPlayer(value: unknown): value is Player1to1 {
  return value instanceof Player1to1;
}

function isThen(value: unknown): value is Then {
  return typeof (value as Then | null)?.moves === "function";
}

function isRangeLike(value: unknown): value is { minFn: IntFunction; maxFn: IntFunction } {
  const v = value as { minFn?: unknown; maxFn?: unknown } | null;
  return isIntFunction(v?.minFn) && isIntFunction(v?.maxFn);
}

function isRotationLike(_value: unknown): boolean {
  return false;
}

function isSiteTypeName(value: unknown): value is SiteTypeName {
  return value === "Cell" || value === "Vertex" || value === "Edge";
}

function isRoleTypeName(value: unknown): value is string {
  return typeof value === "string" && /^(Neutral|P\d+|Team\d+|TeamMover|Each|Shared|All|Mover|Next|Prev|NonMover|Enemy|Friend|Ally|Player)$/.test(value);
}

function isLandmarkTypeName(value: unknown): value is string {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(LandmarkType, value);
}

function isHiddenDataName(value: unknown): value is HiddenData {
  return value === "What" || value === "Who" || value === "State" || value === "Count" || value === "Rotation" || value === "Value";
}

function isStaticRegionName(value: unknown): value is string {
  return typeof value === "string" && /^(AllSites|Board|Corners|Sides|Centre|Center|Top|Bottom|Left|Right|Inner|Outer|Perimeter|Major|Minor)$/.test(value);
}

function isSitesSimpleTypeName(value: unknown): value is string {
  return typeof value === "string" &&
    /^(Board|Bottom|Corners|ConcaveCorners|ConvexCorners|Hint|Inner|Left|LineOfPlay|Major|Minor|Outer|Right|ToClear|Top|Pending|Playable|LastTo|LastFrom|Centre|Center|Perimeter)$/.test(value);
}

function isSitesIndexTypeName(value: unknown): value is string {
  return typeof value === "string" && /^(Cell|Column|Layer|Edge|Phase|Row|State|Empty|Support)$/.test(value);
}

function isDirectionName(value: unknown): value is string {
  return typeof value === "string" && /^(Adjacent|Orthogonal|Diagonal|All|Forward|Backward|Leftward|Rightward|SameDirection|Opposite|N|S|E|W|NE|NW|SE|SW|NNE|ENE|ESE|SSE|SSW|WSW|WNW|NNW)$/.test(value);
}

function isStepList(value: unknown): value is readonly unknown[] {
  return Array.isArray(value) &&
    (value.every((entry) => typeof entry === "string") || value.every(Array.isArray));
}

function normaliseWalks(value: readonly unknown[] | undefined): readonly (readonly string[])[] {
  if (value === undefined) throw notWired("move Leap");
  if (value.every((entry) => typeof entry === "string")) return [value as readonly string[]];
  return value.map((entry) => {
    if (!Array.isArray(entry) || !entry.every((step) => typeof step === "string")) {
      throw notWired("move Leap");
    }
    return entry as readonly string[];
  });
}

function notWired(keyword: string): Error {
  return new Error(`factory not yet wired: ${keyword}`);
}
