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
import type { MovesFunction, IntArrayFunction, IntFunction, BooleanFunction, RegionFunction } from "../../../../../../../base.js";
import { IntArrayFromRegion } from "../../../../../../../other/IntArrayFromRegion.js";
import type { Player } from "../../../../../../util/moves/Player.js";
import type { To } from "../../../../../../util/moves/To.js";
import { SetTeam } from "./team/SetTeam.js";
import { SetHidden } from "./hidden/SetHidden.js";
import { SetPot } from "./value/SetPot.js";
import { SetCounter } from "./value/SetCounter.js";
import { SetTrumpSuit } from "./suit/SetTrumpSuit.js";
import { SetNextPlayer } from "./nextPlayer/SetNextPlayer.js";
import { SetRotation } from "./direction/SetRotation.js";
import { SetValuePlayer } from "./player/SetValuePlayer.js";
import { SetScore } from "./player/SetScore.js";
import { SetPending } from "./pending/SetPending.js";
import { SetVar } from "./var/SetVar.js";
import { SetCount } from "./site/SetCount.js";
import { SetState } from "./site/SetState.js";
import { SetValue } from "./site/SetValue.js";

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
    thenMoves: MovesFunction | null,
  ): MovesFunction | null {
    // @java overload resolution — the SetTeamType discriminant selects this clause
    if ((_setType as string) !== SetTeamType.Team) return null;
    return new SetTeam(team, roles, thenMoves);
  }

  /**
   * @java Set.construct(SetHiddenType, HiddenData, HiddenData[], SiteType, IntFunction, RegionFunction, IntFunction, BooleanFunction, Player, RoleType, Then)
   */
  public static constructHidden(
    _setType: SetHiddenType,
    dataType: HiddenData | null,
    dataTypes: HiddenData[] | null,
    type: SiteType | null,
    atFn: IntFunction | null,
    region: RegionFunction | null,
    levelFn: IntFunction | null,
    valueFn: BooleanFunction | null,
    toPlayer: Player | IntFunction | null,
    toRole: RoleType | null,
    thenMoves: MovesFunction | null,
  ): MovesFunction | null {
    // @java overload resolution — the SetHiddenType discriminant selects this clause
    if ((_setType as string) !== SetHiddenType.Hidden) return null;
    const selectedDataTypes = dataTypes ?? (dataType != null ? [dataType] : null);
    return new SetHidden(
      selectedDataTypes,
      type,
      new IntArrayFromRegion(atFn as never, region as never),
      levelFn,
      valueFn,
      toPlayer,
      toRole,
      thenMoves,
    );
  }

  /**
   * @java Set.construct(SetTrumpType, IntFunction, Difference, Then)
   */
  public static constructTrump(
    _setType: SetTrumpType,
    suitFn: IntFunction | null,
    suitsFn: IntArrayFunction | null,
    thenMoves: MovesFunction | null,
  ): MovesFunction | null {
    // @java overload resolution — the SetTrumpType discriminant selects this clause
    if ((_setType as string) !== SetTrumpType.TrumpSuit) return null;
    return new SetTrumpSuit(suitFn, suitsFn, thenMoves);
  }

  /**
   * @java Set.construct(SetNextPlayerType, Player, IntArrayFunction, Then)
   */
  public static constructNextPlayer(
    _setType: SetNextPlayerType,
    who: Player | null,
    nextPlayers: IntArrayFunction | null,
    thenMoves: MovesFunction | null,
  ): MovesFunction | null {
    // @java overload resolution — the SetNextPlayerType discriminant selects this clause
    if ((_setType as string) !== SetNextPlayerType.NextPlayer) return null;
    return new SetNextPlayer(who, nextPlayers, thenMoves);
  }

  /**
   * @java Set.construct(SetRotationType, To, IntFunction[], IntFunction, BooleanFunction, BooleanFunction, Then)
   */
  public static constructRotation(
    _setType: SetRotationType,
    to: To | null,
    directions: IntFunction[] | null,
    direction: IntFunction | null,
    previous: BooleanFunction | null,
    next: BooleanFunction | null,
    thenMoves: MovesFunction | null,
  ): MovesFunction | null {
    // @java overload resolution — the SetRotationType discriminant selects this clause
    if ((_setType as string) !== SetRotationType.Rotation) return null;
    const directionFns = directions ?? (direction != null ? [direction] : null);
    return new SetRotation(
      to?.locFn() ?? { eval: (ctx) => ctx._evalTo },
      to?.siteType() as SiteType | null,
      directionFns,
      previous,
      next,
      thenMoves,
    );
  }

  /**
   * @java Set.construct(SetPlayerType, Player, RoleType, IntFunction, Then)
   */
  public static constructPlayer(
    setType: SetPlayerType,
    player: Player | IntFunction | null,
    role: RoleType | null,
    valueFn: IntFunction,
    thenMoves: MovesFunction | null,
  ): MovesFunction | null {
    switch (setType) {
      case SetPlayerType.Value:
        return new SetValuePlayer(Set.playerIndexFn(player), role, valueFn, thenMoves);
      case SetPlayerType.Score:
        return new SetScore(Set.playerHolder(player), role as never, valueFn, thenMoves as never);
      default:
        // @java overload resolution — not a SetPlayerType discriminant: not this clause
        return null;
    }
  }

  /**
   * @java Set.construct(SetPendingType, IntFunction, RegionFunction, Then)
   */
  public static constructPending(
    _setType: SetPendingType,
    valueFn: IntFunction | null,
    region: RegionFunction | null,
    thenMoves: MovesFunction | null,
  ): MovesFunction | null {
    // @java overload resolution — the SetPendingType discriminant selects this clause.
    // Without the gate, (set Var "Double" (count Pips)) instantiated SetPending
    // (constructPending precedes constructVar in arity dispatch) and Dubblets'
    // doubles counter never wrote the named var.
    if ((_setType as string) !== SetPendingType.Pending) return null;
    return new SetPending(valueFn, region, thenMoves);
  }

  /**
   * @java Set.construct(SetVarType, String, IntFunction, Then)
   */
  public static constructVar(
    _setType: SetVarType,
    name: string | null,
    newValue: IntFunction | null,
    thenMoves: MovesFunction | null,
  ): MovesFunction | null {
    // @java overload resolution — the SetVarType discriminant selects this clause
    if ((_setType as string) !== SetVarType.Var) return null;
    return new SetVar(name, newValue, thenMoves as never);
  }

  /**
   * @java Set.construct(SetValueType, IntFunction, Then)
   */
  public static constructValue(
    setType: SetValueType,
    newValue: IntFunction | null,
    thenMoves: MovesFunction | null,
  ): MovesFunction | null {
    switch (setType) {
      case SetValueType.Pot:
        return new SetPot(newValue, thenMoves);
      case SetValueType.Counter:
        return new SetCounter(newValue, thenMoves);
      default:
        // @java overload resolution — not a SetValueType discriminant: not this clause
        return null;
    }
  }

  /**
   * @java Set.construct(SetSiteType, SiteType, IntFunction, IntFunction, IntFunction, Then)
   */
  public static constructSite(
    setType: SetSiteType,
    type: SiteType | null,
    atFn: IntFunction,
    levelFn: IntFunction | null,
    valueFn: IntFunction,
    thenMoves: MovesFunction | null,
  ): MovesFunction | null {
    switch (setType) {
      case SetSiteType.Count:
        return new SetCount(type as never, atFn, valueFn, thenMoves as never);
      case SetSiteType.State:
        return new SetState(type as never, atFn, levelFn, valueFn, thenMoves as never);
      case SetSiteType.Value:
        return new SetValue(type as never, atFn, levelFn, valueFn, thenMoves);
      default:
        // @java overload resolution — not a SetSiteType discriminant: not this clause
        return null;
    }
  }

  private static playerIndexFn(player: Player | IntFunction | null): IntFunction | null {
    if (player == null) return null;
    if ("eval" in player && typeof player.eval === "function") return player;
    return (player as Player).index();
  }

  private static playerHolder(player: Player | IntFunction | null): Player | null {
    if (player == null) return null;
    if ("index" in player && typeof player.index === "function") return player;
    return { index: () => player } as Player;
  }

  /**
   * @java Set.eval(Context) — should never be called directly.
   */
  public eval(_ctx: Context): Move[] {
    throw new Error("Set.eval(): Should never be called directly.");
  }
}
