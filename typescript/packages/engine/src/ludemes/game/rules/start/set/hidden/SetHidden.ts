/**
 * Sets the hidden information for one or more sites (for a given player).
 *
 * @java game/rules/start/set/hidden/SetHidden.java — eval(Context)
 *
 * DEFERRED: Java ActionSetHidden* writes to State.hiddenForPlayer[][] via Context.
 * The applyToInitialState interface only provides cells/whats/countAt arrays.
 * Hidden-information setup cannot be applied until Game.start() exposes
 * the hiddenForPlayer[][] array or the StartRule interface is extended.
 * The compile1to1 path currently skips (set Hidden …) start rules.
 */

import type { EquipmentSurface } from "../../../../equipment/EquipmentSurface.js";
import type { BooleanFunction, EvalScratch, IntFunction } from "../../../../../base.js";
import type { Context } from "../../../../../../context.js";
import { BooleanConstant } from "../../../../functions/booleans/BooleanConstant.js";
import { IntConstant } from "../../../../functions/ints/IntConstant.js";
import { IntArrayFromRegion } from "../../../../../other/IntArrayFromRegion.js";
import type { SiteType } from "../../../../../other/action/SiteType.js";
import type { RoleTypeFull } from "../../../../types/play/RoleType.js";
import type { StartRule } from "../../StartRule.js";

/**
 * Identifies which aspect of a piece is hidden.
 * @java game/types/board/HiddenData.java
 */
export type HiddenData = "What" | "Who" | "State" | "Count" | "Rotation" | "Value";

/**
 * @java game/rules/start/set/hidden/SetHidden.java
 *
 * Sets hidden-information flags at given sites for a specified player/role.
 * applyToInitialState is a no-op because State.hiddenForPlayer is not accessible.
 */
export class SetHidden implements StartRule {
  /**
   * Which HiddenData facets to hide. null → all (Invisible).
   * @java dataTypes field
   */
  private readonly dataTypes: readonly HiddenData[] | null;

  /** Which region. @java SetHidden.region */
  private readonly region: IntArrayFromRegion;

  /** Level within a stack (Java: levelFn, default 0). */
  private readonly levelFn: IntFunction;

  /** Whether to hide (true) or reveal (false). Java: valueFn, default true. */
  private readonly valueFn: BooleanFunction;

  /** The player to set the hidden information. @java SetHidden.whoFn */
  private readonly whoFn: IntFunction;

  /** The RoleType if used. @java SetHidden.roleType */
  private readonly roleType: RoleTypeFull;

  /** Cell/Edge/Vertex. @java SetHidden.type */
  private readonly type: SiteType | null;

  /**
   * @java SetHidden(HiddenData[], SiteType, IntArrayFromRegion, IntFunction, BooleanFunction, RoleType)
   *
   * @param dataTypes  The types of hidden data [Invisible].
   * @param type       The graph element type [default of the board].
   * @param region     The region to set the hidden information.
   * @param level      The level to set the hidden information [0].
   * @param value      The value to set [True].
   * @param to         The roleType with these hidden information.
   */
  public constructor(
    dataTypes: readonly HiddenData[] | null,
    type: SiteType | null,
    region: IntArrayFromRegion,
    level: IntFunction | null,
    value: BooleanFunction | null,
    to: RoleTypeFull,
  ) {
    this.dataTypes = dataTypes ?? null;
    this.region = region;
    this.levelFn = level ?? new IntConstant(0);
    this.valueFn = value ?? new BooleanConstant(true);
    this.type = type ?? null;
    this.whoFn = roleToIntFunction(to);
    this.roleType = to;
  }

  /**
   * Compatibility helper for existing compiler fallbacks that pre-evaluate
   * start sites before hidden state can be applied through StartRule.
   */
  public static fromSites(
    dataTypes: readonly HiddenData[] | null,
    sites: readonly number[],
    level: number,
    value: boolean,
    who: number,
  ): SetHidden {
    return new SetHidden(
      dataTypes,
      null,
      intArrayFromSites(sites),
      new IntConstant(level),
      new BooleanConstant(value),
      roleTypeFromPlayerId(who),
    );
  }

  /**
   * @java game/rules/start/set/hidden/SetHidden.java — eval(Context)
   *
   * Java: for each site and each HiddenData facet:
   *   ActionSetHidden*(who, realType, site, level, value).apply(context)
   * TS-deferred: State.hiddenForPlayer[][] not accessible via applyToInitialState.
   */
  public eval(ctx: Context): void {
    const cs = (ctx as unknown as {
      _startState?: { setHidden(pid: number, site: number, value: boolean): void };
    })._startState;
    if (!cs) return;
    // @java SetHidden.eval(Context): for each site, ActionSetHidden*(who, type,
    // site, level, value).apply(context). The engine's hidden model is per
    // (player, site) visibility; HiddenData facets collapse onto it.
    void this.type;
    void this.dataTypes;
    void this.levelFn;
    const sites = this.region.eval(ctx as unknown as Parameters<IntArrayFromRegion["eval"]>[0]);
    const value = this.valueFn.eval(ctx);
    const who = this.whoFn.eval(ctx);
    for (const site of sites) {
      if (site < 0) continue;
      cs.setHidden(who, site, value);
    }
  }
}

function intArrayFromSites(sites: readonly number[]): IntArrayFromRegion {
  const region = new IntArrayFromRegion(null, null);
  (region as unknown as { precomputedArray: number[] }).precomputedArray = [...sites];
  return region;
}

function roleTypeFromPlayerId(pid: number): RoleTypeFull {
  if (pid >= 1 && pid <= 16) return `P${pid}` as RoleTypeFull;
  return "Shared";
}

function roleToIntFunction(role: RoleTypeFull): IntFunction {
  return {
    eval: (ctx: Context & EvalScratch): number => {
      switch (role) {
        case "Mover":
          return ctx.state.mover;
        case "Next":
          return (ctx.state.mover % ctx.numPlayers()) + 1;
        case "Prev":
          return Math.max(1, ctx.state.mover - 1);
        case "Neutral":
        case "Shared":
          return 0;
        default:
          if (/^P\d+$/.test(role)) return Number(role.slice(1));
          return ctx.state.mover;
      }
    },
  };
}
