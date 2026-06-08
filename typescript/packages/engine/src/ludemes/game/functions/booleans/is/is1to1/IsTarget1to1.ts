// @java Core/src/game/functions/booleans/is/target/IsTarget.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, isList, isNumber, type LudList } from "@ludii/typescript-language";
import { parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";
import type { Game1to1 } from "../../../../../Game1to1.js";

/**
 * (is Target {<config>} [at:{<sites>}])
 * Returns true when a specific piece configuration is on the board.
 * Compares whatAtSite(site) against a compile-time integer array.
 * @java game/functions/booleans/is/target/IsTarget.java
 */
export class IsTarget1to1 implements BooleanFunction {
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
        if (ctx.state.whatAtSite(i) !== (configuration[i] ?? 0)) return false;
      }
      return true;
    } else if (configuration.length === specificSites.length) {
      for (let i = 0; i < specificSites.length; i++) {
        const site = specificSites[i]!;
        if (ctx.state.whatAtSite(site) !== (configuration[i] ?? 0)) return false;
      }
      return true;
    }
    return false;
  }
}

registerBool1to1("is:target", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  // (is Target {<config>} [at:<site>|{<sites>}])
  // positional[0] = "Target"
  // positional[1] = curly list of config integers
  // optional: named "at" = site integer or curly list of site integers
  const { positional, named } = parseArgs1to1((node as LudList).items);

  // Parse configuration from positional[1] (a curly-brace list of ints)
  const configNode = positional[1];
  const configuration: number[] = [];
  if (configNode && isList(configNode) && configNode.delimiter === "curly") {
    for (const item of configNode.items) {
      if (isNumber(item)) {
        configuration.push(item.value);
      } else if (isIdent(item)) {
        const n = parseInt(item.name, 10);
        if (!isNaN(n)) configuration.push(n);
        else configuration.push(0);
      } else {
        configuration.push(0);
      }
    }
  }

  // Parse specificSite/specificSites from named "at" or positional[2]
  let specificSite: number | null = null;
  let specificSites: number[] | null = null;
  const atNode = named.get("at") ?? positional[2];
  if (atNode && isNumber(atNode)) {
    specificSite = atNode.value;
  } else if (atNode && isIdent(atNode)) {
    const n = parseInt(atNode.name, 10);
    if (!isNaN(n)) specificSite = n;
  } else if (atNode && isList(atNode) && atNode.delimiter === "curly") {
    specificSites = [];
    for (const item of atNode.items) {
      if (isNumber(item)) {
        specificSites.push(item.value);
      } else if (isIdent(item)) {
        const n = parseInt(item.name, 10);
        if (!isNaN(n)) specificSites.push(n);
      }
    }
  }

  return new IsTarget1to1(null, null, configuration, specificSite, specificSites);
});
