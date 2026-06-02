/**
 * Sets the hidden information for one or more sites (for a given player).
 *
 * @java game/rules/start/set/hidden/SetHidden.java — eval(Context)
 *
 * DEFERRED: Java ActionSetHidden* writes to State.hiddenForPlayer[][] via Context.
 * The applyToInitialState interface only provides cells/whats/countAt arrays.
 * Hidden-information setup cannot be applied until Game1to1.start() exposes
 * the hiddenForPlayer[][] array or the StartRule interface is extended.
 * The compile1to1 path currently skips (set Hidden …) start rules.
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
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
export class SetHidden1to1 implements StartRule {
  /**
   * Which HiddenData facets to hide. null → all (Invisible).
   * @java dataTypes field
   */
  private readonly dataTypes: readonly HiddenData[] | null;

  /** Pre-evaluated site indices to hide. Java: region.eval(context) */
  private readonly sites: readonly number[];

  /** Level within a stack (Java: levelFn, default 0). */
  private readonly level: number;

  /** Whether to hide (true) or reveal (false). Java: valueFn, default true. */
  private readonly value: boolean;

  /** 1-based player id who has the hidden view. Java: whoFn. */
  private readonly who: number;

  /**
   * @param dataTypes  facets to hide (null = all)
   * @param sites      pre-evaluated site indices
   * @param level      stack level (default 0)
   * @param value      hide (true) or reveal (false)
   * @param who        1-based player id
   */
  public constructor(
    dataTypes: readonly HiddenData[] | null,
    sites: readonly number[],
    level: number,
    value: boolean,
    who: number,
  ) {
    this.dataTypes = dataTypes;
    this.sites = sites;
    this.level = level;
    this.value = value;
    this.who = who;
  }

  /**
   * @java game/rules/start/set/hidden/SetHidden.java — eval(Context)
   *
   * Java: for each site and each HiddenData facet:
   *   ActionSetHidden*(who, realType, site, level, value).apply(context)
   * TS-deferred: State.hiddenForPlayer[][] not accessible via applyToInitialState.
   */
  public applyToInitialState(
    _cells: number[],
    _whats: number[],
    _countAt: number[],
    _equipment: Equipment1to1,
    _numPlayers: number,
  ): void {
    // Deferred: State.hiddenForPlayer[][] not accessible via applyToInitialState.
    // Java: ActionSetHidden*(who, type, site, level, value) for each site/facet.
    void this.dataTypes;
    void this.sites;
    void this.level;
    void this.value;
    void this.who;
  }
}
