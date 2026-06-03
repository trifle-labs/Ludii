// @java Core/src/game/rules/play/moves/nonDecision/effect/set/Set.java

/**
 * Factory ludeme that dispatches to various Set* subclasses.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/Set.java
 *
 * Java parity:
 *   Set is a pure factory — multiple static `construct()` overloads
 *   dispatch to SetTeam, SetHidden, SetTrumpSuit, SetNextPlayer,
 *   SetRotation, SetValuePlayer, SetScore, SetPending, SetVar, SetCounter,
 *   SetPot, SetCount, SetState, SetValue.
 *   The private constructor and direct eval() throw UnsupportedOperationException.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../context.js";
import type { Move } from "../../../../../../../../move.js";
import type { MovesFunction, IntFunction, BooleanFunction, RegionFunction } from "../../../../../../../base.js";
import { SetTeam } from "./team/SetTeam.js";
import { SetHidden } from "./hidden/SetHidden.js";
import { SetPot } from "./value/SetPot.js";
import { SetTrumpSuit } from "./suit/SetTrumpSuit.js";
import { SetValuePlayer } from "./player/SetValuePlayer.js";

/** @java game/types/board/SiteType.java — minimal subset */
export type SiteType = "Cell" | "Edge" | "Vertex";

/** @java game/types/play/RoleType.java — minimal subset */
export type RoleType = string;

/** @java game/types/board/HiddenData.java — minimal subset */
export type HiddenData = "What" | "Who" | "State" | "Count" | "Rotation" | "Value";

/**
 * Enums for the various Set overload discriminants.
 * @java game/rules/play/moves/nonDecision/effect/set/Set*.java (enum types)
 */
export enum SetTeamType { Team = "Team" }
export enum SetHiddenType { Hidden = "Hidden" }
export enum SetTrumpType { TrumpSuit = "TrumpSuit" }
export enum SetNextPlayerType { NextPlayer = "NextPlayer" }
export enum SetRotationType { Rotation = "Rotation" }
export enum SetPlayerType { Value = "Value", Score = "Score" }
export enum SetPendingType { Pending = "Pending" }
export enum SetVarType { Var = "Var" }
export enum SetValueType { Counter = "Counter", Pot = "Pot" }
export enum SetSiteType { Count = "Count", State = "State", Value = "Value" }

/**
 * @java game/rules/play/moves/nonDecision/effect/set/Set.java
 *
 * Pure factory class — cannot be instantiated directly.
 * Use the static construct*() factory methods.
 *
 * Java parity:
 *   public final class Set extends Effect
 *   private Set() { super(null); }
 *   eval(Context): throws UnsupportedOperationException
 */
export class Set implements MovesFunction {
  private constructor() {}

  /**
   * @java Set.construct(SetTeamType, IntFunction, RoleType[], Then)
   */
  public static constructTeam(
    _setType: SetTeamType,
    team: IntFunction,
    roles: RoleType[],
    thenMoves: MovesFunction | null = null,
  ): MovesFunction {
    return new SetTeam(team, roles, thenMoves);
  }

  /**
   * @java Set.construct(SetHiddenType, HiddenData, HiddenData[], SiteType, IntFunction, RegionFunction, IntFunction, BooleanFunction, Player, RoleType, Then)
   */
  public static constructHidden(
    _setType: SetHiddenType,
    dataTypes: HiddenData[] | null,
    type: SiteType | null,
    atFn: IntFunction | null,
    region: RegionFunction | null,
    levelFn: IntFunction | null,
    valueFn: BooleanFunction | null,
    toPlayer: IntFunction | null,
    toRole: RoleType | null,
    thenMoves: MovesFunction | null = null,
  ): MovesFunction {
    return new SetHidden(dataTypes, type, atFn, region, levelFn, valueFn, toPlayer, toRole, thenMoves);
  }

  /**
   * @java Set.construct(SetTrumpType, IntFunction, Difference, Then)
   */
  public static constructTrump(
    _setType: SetTrumpType,
    suitFn: IntFunction | null,
    thenMoves: MovesFunction | null = null,
  ): MovesFunction {
    return new SetTrumpSuit(suitFn, thenMoves);
  }

  /**
   * @java Set.construct(SetPlayerType, Player, RoleType, IntFunction, Then)
   */
  public static constructPlayer(
    setType: SetPlayerType,
    playerFn: IntFunction | null,
    role: RoleType | null,
    valueFn: IntFunction,
    thenMoves: MovesFunction | null = null,
  ): MovesFunction {
    switch (setType) {
      case SetPlayerType.Value:
        return new SetValuePlayer(playerFn, role, valueFn, thenMoves);
      case SetPlayerType.Score:
        // SetScore not yet ported — throw informative error.
        throw new Error("not yet wired: Set.constructPlayer(Score) — SetScore not ported");
      default:
        throw new Error(`Set(): A SetPlayerType is not implemented: ${setType}`);
    }
  }

  /**
   * @java Set.construct(SetValueType, IntFunction, Then)
   */
  public static constructValue(
    setType: SetValueType,
    newValue: IntFunction | null,
    thenMoves: MovesFunction | null = null,
  ): MovesFunction {
    switch (setType) {
      case SetValueType.Pot:
        return new SetPot(newValue, thenMoves);
      case SetValueType.Counter:
        // SetCounter not yet ported — throw informative error.
        throw new Error("not yet wired: Set.constructValue(Counter) — SetCounter not ported");
      default:
        throw new Error(`Set(): A SetValueType is not implemented: ${setType}`);
    }
  }

  /**
   * @java Set.eval(Context) — should never be called directly.
   */
  public eval(_ctx: Context): Move[] {
    throw new Error("Set.eval(): Should never be called directly.");
  }
}
