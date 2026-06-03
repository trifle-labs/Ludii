// @java Core/src/game/rules/play/moves/nonDecision/effect/set/hidden/SetHidden.java

/**
 * Sets the hidden information of a region.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/hidden/SetHidden.java
 *
 * Java parity (SetHidden.eval):
 *   1. Evaluate the region of sites to operate on.
 *   2. Evaluate the level, value (visible/hidden flag), and target player.
 *   3. For each site and each target player, emit the appropriate
 *      ActionSetHidden* action variant.
 *   4. Gather all actions into a single Move.
 *
 * NOTE: coverage-only transliteration; not registered in the 1:1 moves registry.
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { BooleanFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../../../../base.js";
import {
  ActionSetHidden,
  ActionSetHiddenCount,
  ActionSetHiddenRotation,
  ActionSetHiddenState,
  ActionSetHiddenValue,
  ActionSetHiddenWhat,
  ActionSetHiddenWho,
} from "../../../../../../../../../action/action-set-hidden.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";

/** @java game/types/board/SiteType.java — minimal subset */
export type SiteType = "Cell" | "Edge" | "Vertex";

/** @java game/types/play/RoleType.java — minimal subset */
export type RoleType = string;

/** @java game/types/board/HiddenData.java — minimal subset */
export type HiddenData = "What" | "Who" | "State" | "Count" | "Rotation" | "Value";

/**
 * @java game/rules/play/moves/nonDecision/effect/set/hidden/SetHidden.java
 *
 * Sets the hidden information for a region of sites.
 *
 * Java parity:
 *   public final class SetHidden extends Effect
 *   eval(Context): build ActionSetHidden* actions for each site × player.
 */
export class SetHidden implements MovesFunction {
  /** Hidden data types (null = all / Invisible). @java SetHidden.dataTypes */
  private readonly dataTypes: HiddenData[] | null;

  /** Region of sites to set. @java SetHidden.region */
  private readonly atFn: IntFunction | null;
  private readonly regionFn: RegionFunction | null;

  /** Level (stack depth). @java SetHidden.levelFn */
  private readonly levelFn: IntFunction | null;

  /** Whether to hide (true) or show (false). @java SetHidden.valueFn */
  private readonly valueFn: BooleanFunction | null;

  /** Target player function. @java SetHidden.whoFn */
  private readonly whoFn: IntFunction | null;

  /** Role type if specified. @java SetHidden.roleType */
  private readonly roleType: RoleType | null;

  /** Graph element type. @java SetHidden.type */
  private readonly type: SiteType | null;

  /** Optional subsequent moves. */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetHidden(HiddenData[], SiteType, IntArrayFromRegion, IntFunction, BooleanFunction, Player, RoleType, Then)
   */
  public constructor(
    dataTypes: HiddenData[] | null,
    type: SiteType | null,
    atFn: IntFunction | null,
    regionFn: RegionFunction | null,
    levelFn: IntFunction | null,
    valueFn: BooleanFunction | null,
    whoFn: IntFunction | null,
    roleType: RoleType | null,
    thenMoves: MovesFunction | null = null,
  ) {
    this.dataTypes = dataTypes;
    this.type = type;
    this.atFn = atFn;
    this.regionFn = regionFn;
    this.levelFn = levelFn;
    this.valueFn = valueFn;
    this.whoFn = whoFn;
    this.roleType = roleType;
    this.thenMoves = thenMoves;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/set/hidden/SetHidden.java — eval(Context)
   *
   * Java parity (SetHidden.eval lines 112-295):
   *   1. Evaluate sites array, level, value, who.
   *   2. If roleType refers to many players (e.g. All): iterate over all real players.
   *   3. For each HiddenData type: emit appropriate ActionSetHidden* per site per player.
   *   4. Gather all actions into a single Move.
   */
  public eval(ctx: Context): Move[] {
    // Resolve the sites array.
    const sites: number[] = this.atFn != null
      ? [this.atFn.eval(ctx)]
      : this.regionFn != null
        ? this.regionFn.eval(ctx)
        : [];

    const level = this.levelFn != null ? this.levelFn.eval(ctx) : 0;
    const value = this.valueFn != null ? this.valueFn.eval(ctx) : true;

    // Resolve the target player(s).
    const numPlayers = this._numPlayers(ctx);
    let playerList: number[];
    if (this.roleType != null && this._roleTypeManyIds(this.roleType)) {
      playerList = this._getRealPlayerIds(ctx, this.roleType);
    } else {
      const who = this.whoFn != null ? this.whoFn.eval(ctx) : 1;
      playerList = (who >= 1 && who <= numPlayers) ? [who] : [];
    }

    const actions: import("../../../../../../../../../action/action.js").Action[] = [];

    // Build actions for each site × player.
    for (const site of sites) {
      for (const pid of playerList) {
        if (this.dataTypes == null) {
          // null dataTypes → set "all" hidden info (ActionSetHidden = Invisible).
          actions.push(new ActionSetHidden(site, pid, value));
        } else {
          for (const hiddenData of this.dataTypes) {
            switch (hiddenData) {
              case "What":
                actions.push(new ActionSetHiddenWhat(site, pid, value));
                break;
              case "Who":
                actions.push(new ActionSetHiddenWho(site, pid, value));
                break;
              case "State":
                actions.push(new ActionSetHiddenState(site, pid, value));
                break;
              case "Count":
                actions.push(new ActionSetHiddenCount(site, pid, value));
                break;
              case "Rotation":
                actions.push(new ActionSetHiddenRotation(site, pid, value));
                break;
              case "Value":
                actions.push(new ActionSetHiddenValue(site, pid, value));
                break;
              default:
                break;
            }
          }
        }
      }
    }

    const mover = ctx.state.mover;
    const firstSite = sites[0] ?? 0;

    if (actions.length === 0) {
      return [];
    }

    const move = new LudiiMove({
      id: "setHidden",
      label: "setHidden",
      siteIndices: sites.length > 0 ? [firstSite] : [0],
      mover,
      placedOwner: mover,
      actions,
    });

    const thenList: Move[] = this.thenMoves != null ? this.thenMoves.eval(ctx) : [];
    if (thenList.length === 0) {
      return [move];
    }

    const withThen = new LudiiMove({
      id: "setHidden",
      label: "setHidden",
      siteIndices: sites.length > 0 ? [firstSite] : [0],
      mover,
      placedOwner: mover,
      actions,
      then: thenList,
    });
    return [withThen];
  }

  /** Check whether a RoleType refers to many players (e.g. All, Team1, …). */
  private _roleTypeManyIds(role: RoleType): boolean {
    return role === "All" || role === "NonMover" || role.startsWith("Team");
  }

  /** Collect all real player indices for a group role. */
  private _getRealPlayerIds(ctx: Context, role: RoleType): number[] {
    const n = this._numPlayers(ctx);
    if (role === "All") {
      const ids: number[] = [];
      for (let i = 1; i <= n; i++) ids.push(i);
      return ids;
    }
    if (role === "NonMover") {
      const mover = ctx.state.mover;
      const ids: number[] = [];
      for (let i = 1; i <= n; i++) if (i !== mover) ids.push(i);
      return ids;
    }
    return [];
  }

  /** Helper: get the number of players. */
  private _numPlayers(ctx: Context): number {
    const gameAny = ctx.game as unknown as { players?: { count?: number } };
    return gameAny.players?.count ?? 2;
  }

  /** @java SetHidden.isStatic() → false */
  public isStatic(): boolean {
    return false;
  }

  /** @java SetHidden.toEnglish() */
  public toEnglish(): string {
    return "set the hidden values";
  }
}
