// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/ForEach.java

/**
 * Iterates over a set of items.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/ForEach.java
 * @author Eric.Piette
 *
 * Use this ludeme to iterate over a set of items such as pieces, players,
 * directions or regions, and apply specified actions to each item.
 *
 * In Java this is a pure factory class whose static construct(...) methods
 * delegate to concrete subclasses. The instance eval() throws
 * UnsupportedOperationException and should never be called directly.
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type {
  BooleanFunction,
  IntArrayFunction,
  IntFunction,
  MovesFunction,
  RegionFunction,
} from "../../../../../../../base.js";
import type { ThenLike } from "../../../Moves.js";
import { Effect } from "../../effect/Effect.js";
import type { DirectionArg } from "../../effect/EffectCtorAdapters.js";
import type { Between } from "../../../../../../util/moves/Between1to1.js";
import type { From } from "../../../../../../util/moves/From1to1.js";
import type { Player1to1 } from "../../../../../../util/moves/Player1to1.js";
import type { To } from "../../../../../../util/moves/To1to1.js";
import { ForEachDie } from "./die/ForEachDie.js";
import { ForEachDirection } from "./direction/ForEachDirection.js";
import { ForEachGroup } from "./group/ForEachGroup.js";
import { ForEachLevel, type StackDirection } from "./level/ForEachLevel.js";
import { ForEachPiece } from "./piece/ForEachPiece.js";
import { ForEachPlayer } from "./player/ForEachPlayer.js";
import { ForEachSite } from "./site/ForEachSite.js";
import { ForEachTeam } from "./team/ForEachTeam.js";
import { ForEachValue } from "./value/ForEachValue.js";

type SiteType = "Cell" | "Edge" | "Vertex" | string;
type RoleType = string;

/**
 * @java game/rules/play/moves/nonDecision/operators/foreach/ForEach.java
 *
 * Factory/marker class for the ForEach family. eval() must never be called
 * directly (Java throws UnsupportedOperationException).
 */
export class ForEach extends Effect {
  /**
   * @java ForEach()
   */
  public constructor() {
    super(null);
  }

  /**
   * @java ForEach.eval(Context)
   * Should not be called, should only be called on subclasses.
   */
  public override eval(_ctx: Context): Move[] {
    throw new Error("ForEach.eval(): Should never be called directly.");
  }

  /**
   * @java ForEach.isStatic()
   */
  public override isStatic(): boolean {
    return false;
  }

  /**
   * @java ForEach.gameFlags(Game)
   */
  public override gameFlags(): number {
    return 0;
  }

  /**
   * @java ForEach.preprocess(Game)
   */
  public override preprocess(): void {
    // Nothing to do.
  }

  /**
   * For iterating through levels at a site.
   *
   * @java ForEach.construct(ForEachLevelType, SiteType, IntFunction, StackDirection, Moves, Then)
   */
  public static constructLevel(
    forEachType: string,
    type: SiteType | null,
    site: IntFunction,
    stackDirection: StackDirection | null,
    moves: MovesFunction,
    then: ThenLike | null,
  ): MovesFunction {
    switch (forEachType) {
      case "Level":
        return new ForEachLevel(type, site, stackDirection, moves, then);
      default:
        throw new Error("ForEach(): A ForEachLevelType is not implemented.");
    }
  }

  /**
   * For iterating on teams.
   *
   * @java ForEach.construct(ForEachTeamType, Moves, Then)
   */
  public static constructTeam(
    forEachType: string,
    moves: MovesFunction,
    then: ThenLike | null,
  ): MovesFunction {
    switch (forEachType) {
      case "Team":
        return new ForEachTeam(moves, then);
      default:
        throw new Error("ForEach(): A ForEachTeamType is not implemented.");
    }
  }

  /**
   * For iterating through the groups.
   *
   * @java ForEach.construct(ForEachGroupType, SiteType, Direction, BooleanFunction, Moves, Then)
   */
  public static constructGroup(
    forEachType: string,
    type: SiteType | null,
    directions: DirectionArg,
    If: BooleanFunction | null,
    moves: MovesFunction,
    then: ThenLike | null,
  ): MovesFunction {
    switch (forEachType) {
      case "Group":
        return new ForEachGroup(type, directions, If, moves, then);
      default:
        throw new Error("ForEach(): A ForEachGroupType is not implemented.");
    }
  }

  /**
   * For iterating through the dice.
   *
   * @java ForEach.construct(ForEachDieType, IntFunction, BooleanFunction, BooleanFunction, BooleanFunction, Moves, Then)
   */
  public static constructDie(
    forEachType: string,
    handDiceIndex: IntFunction | null,
    combined: BooleanFunction | null,
    replayDouble: BooleanFunction | null,
    If: BooleanFunction | null,
    moves: MovesFunction,
    then: ThenLike | null,
  ): MovesFunction {
    switch (forEachType) {
      case "Die":
        return new ForEachDie(handDiceIndex, combined, replayDouble, If, moves, then);
      default:
        throw new Error("ForEach(): A ForEachDieType is not implemented.");
    }
  }

  /**
   * For iterating through the directions.
   *
   * @java ForEach.construct(ForEachDirectionType, From, Direction, Between, To, Moves, Then)
   */
  public static constructDirection(
    forEachType: string,
    from: From | null,
    directions: DirectionArg,
    between: Between | null,
    to: To | null,
    moves: MovesFunction | null,
    then: ThenLike | null,
  ): MovesFunction {
    let numNonNull = 0;
    if (to !== null) numNonNull++;
    if (moves !== null) numNonNull++;

    if (numNonNull !== 1) {
      throw new Error("ForEach(): With ForEachDirectionType one to, moves parameter must be non-null.");
    }

    switch (forEachType) {
      case "Direction":
        return new ForEachDirection(from, directions, between, to, moves, then);
      default:
        throw new Error("ForEach(): A ForEachDirectionType is not implemented.");
    }
  }

  /**
   * For iterating through the sites of a region.
   *
   * @java ForEach.construct(ForEachSiteType, RegionFunction, Moves, Moves, Then)
   */
  public static constructSite(
    forEachType: string,
    regionFn: RegionFunction,
    generator: MovesFunction,
    noMoveYet: MovesFunction | null,
    then: ThenLike | null,
  ): MovesFunction {
    switch (forEachType) {
      case "Site":
        return new ForEachSite(regionFn, generator, noMoveYet, then);
      default:
        throw new Error("ForEach(): A ForEachSiteType is not implemented.");
    }
  }

  /**
   * For iterating through values from an IntArrayFunction.
   *
   * @java ForEach.construct(ForEachValueType, IntArrayFunction, Moves, Then)
   */
  public static constructValueArray(
    forEachType: string,
    values: IntArrayFunction,
    generator: MovesFunction,
    then: ThenLike | null,
  ): MovesFunction {
    switch (forEachType) {
      case "Value":
        return new ForEachValue(values, generator, then);
      default:
        throw new Error("ForEach(): A ForEachValueType is not implemented.");
    }
  }

  /**
   * For iterating through values between two.
   *
   * @java ForEach.construct(ForEachValueType, IntFunction, IntFunction, Moves, Then)
   */
  public static constructValueRange(
    forEachType: string,
    min: IntFunction,
    max: IntFunction,
    generator: MovesFunction,
    then: ThenLike | null,
  ): MovesFunction {
    switch (forEachType) {
      case "Value":
        return new ForEachValue(min, max, generator, then);
      default:
        throw new Error("ForEach(): A ForEachValueType is not implemented.");
    }
  }

  /**
   * For iterating through the pieces.
   *
   * @java ForEach.construct(ForEachPieceType, SiteType, String, String[], IntFunction, String, Moves, Player, RoleType, BooleanFunction, Then)
   */
  public static constructPiece(
    forEachType: string,
    on: SiteType | null,
    item: string | null,
    items: readonly string[] | null,
    container: IntFunction | null,
    containerName: string | null,
    specificMoves: MovesFunction | null,
    player: Player1to1 | IntFunction | null,
    role: RoleType | null,
    top: BooleanFunction | null,
    then: ThenLike | null,
  ): MovesFunction {
    let numItemArgs = 0;
    if (item !== null) numItemArgs++;
    if (items !== null) numItemArgs++;

    if (numItemArgs > 1) {
      throw new Error("ForEach(): With ForEachPieceType zero or one item, items parameter must be non-null.");
    }

    let numContainerArgs = 0;
    if (container !== null) numContainerArgs++;
    if (containerName !== null) numContainerArgs++;

    if (numContainerArgs > 1) {
      throw new Error("ForEach(): With ForEachPieceType zero or one container, containerName parameter must be non-null.");
    }

    let numPlayerArgs = 0;
    if (player !== null) numPlayerArgs++;
    if (role !== null) numPlayerArgs++;

    if (numPlayerArgs > 1) {
      throw new Error("ForEach(): With ForEachPieceType zero or one player, role parameter must be non-null.");
    }

    switch (forEachType) {
      case "Piece":
        return new ForEachPiece(
          on,
          item,
          items,
          container,
          containerName,
          specificMoves,
          ForEach.playerIndexFn(player),
          role,
          top,
          then,
        );
      default:
        throw new Error("ForEach(): A ForEachPieceType is not implemented.");
    }
  }

  /**
   * For iterating through the players.
   *
   * @java ForEach.construct(ForEachPlayerType, Moves, Then)
   */
  public static constructPlayer(
    forEachType: string,
    moves: MovesFunction,
    then: ThenLike | null,
  ): MovesFunction {
    switch (forEachType) {
      case "Player":
        return new ForEachPlayer(moves, then as never);
      default:
        throw new Error("ForEach(): A ForEachPlayerType is not implemented.");
    }
  }

  /**
   * For iterating through the players using an IntArrayFunction.
   *
   * @java ForEach.construct(IntArrayFunction, Moves, Then)
   */
  public static constructPlayers(
    players: IntArrayFunction,
    moves: MovesFunction,
    then: ThenLike | null,
  ): MovesFunction {
    return new ForEachPlayer(players, moves, then as never);
  }

  private static playerIndexFn(player: Player1to1 | IntFunction | null): IntFunction | null {
    if (player === null) return null;
    if (typeof (player as IntFunction).eval === "function") return player as IntFunction;
    return (player as Player1to1).index();
  }
}
