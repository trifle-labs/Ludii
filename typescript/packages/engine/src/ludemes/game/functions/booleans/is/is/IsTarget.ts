// @java Core/src/game/functions/booleans/is/target/IsTarget.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isList, isNumber, type LudList } from "@ludii/typescript-language";
import type { Game1to1 } from "../../../../../Game1to1.js";

/**
 * (is Target {<config>} [at:{<sites>}])
 * Returns true when a specific piece configuration is on the board.
 * Compares whatAtSite(site) against a compile-time integer array.
 * @java game/functions/booleans/is/target/IsTarget.java
 */
export class IsTarget implements BooleanFunction {
  /** @java IsTarget.containerId — containerIdFn/name are currently constructor-mapped only */
  private readonly containerIdFn: IntFunction | null;
  private readonly containerName: string | null;
  /** @java IsTarget.configuration */
  private readonly configuration: readonly number[];
  /** @java IsTarget.specificSites — null means check all board sites in order */
  private readonly specificSites: readonly number[] | null;

  public constructor(
    containerIdFn: IntFunction | null,
    containerName: string | null,
    configuration: readonly number[],
    specificSite?: number | null,
    specificSites?: readonly number[] | null,
  ) {
    this.containerIdFn = containerIdFn;
    this.containerName = containerName;
    this.configuration = configuration;
    this.specificSites = specificSites ?? (specificSite == null ? null : [specificSite]);
  }

  /**
   * @java IsTarget.eval(Context):
   *   if (specificSites == null):
   *     for each board site: state.what(site) != config[site] → false
   *     return true
   *   else if (config.length == specificSites.length):
   *     for each i: state.what(specificSites[i]) != config[i] → false
   *     return true
   *   else false
   */
  public eval(ctx: Context): boolean {
    const configuration = this.configuration;
    const specificSites = this.specificSites;

    if (specificSites === null) {
      // Check all board sites
      const g = ctx.game as unknown as Game1to1;
      const boardN = g.equipment ? g.equipment.board.numSites : ctx.state.cells.length;
      if (boardN !== configuration.length) return false;
      for (let i = 0; i < boardN; i++) {
        if (ctx.state.what(i) !== (configuration[i] ?? 0)) return false;
      }
      return true;
    } else if (configuration.length === specificSites.length) {
      for (let i = 0; i < specificSites.length; i++) {
        const site = specificSites[i]!;
        if (ctx.state.what(site) !== (configuration[i] ?? 0)) return false;
      }
      return true;
    }
    return false;
  }
}

