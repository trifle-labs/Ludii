/**
 * Dispatcher / factory for all "(set …)" start rules.
 *
 * In Java this is a static-factory class with overloaded construct() methods that
 * select and construct the appropriate concrete SetXxx rule. In the 1:1 TS port
 * the concrete sub-classes are the primary artefacts; this file provides the
 * dispatcher surface for callers that need to construct set-rules generically.
 *
 * @java game/rules/start/set/Set.java — static construct() dispatchers
 *
 * NOTE: eval() on the Java Set class is declared to throw
 * UnsupportedOperationException — it is never called directly; only the
 * concrete sub-class eval is invoked. The TS equivalent is the same pattern:
 * Set1to1 itself is not a StartRule; use the concrete sub-classes instead.
 */

export { SetStartSitesType } from "./SetStartSitesType.js";
export { SetStartPlayerType } from "./SetStartPlayerType.js";
export { SetStartPlayersType } from "./SetStartPlayersType.js";
export { SetStartHiddenType } from "./SetStartHiddenType.js";
export { SetStartGraphType } from "./SetStartGraphType.js";
export { SetRememberValueType } from "./SetRememberValueType.js";

// Concrete sub-rules (re-export for convenience)
export { SetHidden1to1 } from "./hidden/SetHidden.js";
export { SetAmount1to1 } from "./player/SetAmount.js";
export { SetScore1to1 } from "./player/SetScore.js";
export { SetTeam1to1 } from "./players/SetTeam.js";
export { SetRememberValue1to1 } from "./remember/SetRememberValue.js";
export { SetCost1to1 } from "./sites/SetCost.js";
export { SetCount1to1 } from "./sites/SetCount.js";
export { SetPhase1to1 } from "./sites/SetPhase.js";
export { SetSite1to1 } from "./sites/SetSite.js";

import type { BooleanFunction, IntFunction, RegionFunction } from "../../../../base.js";
import { IntArrayFromRegion } from "../../../../other/IntArrayFromRegion.js";
import type { SiteType } from "../../../../other/action/SiteType.js";
import type { RoleTypeFull } from "../../../types/play/RoleType.js";
import type { StartRule } from "../StartRule.js";
import { SetCountStart1to1 } from "../SetCountStart1to1.js";
import { SetHidden1to1, type HiddenData } from "./hidden/SetHidden.js";
import { SetAmount1to1 } from "./player/SetAmount.js";
import { SetScore1to1 } from "./player/SetScore.js";
import { SetTeam1to1 } from "./players/SetTeam.js";
import { SetRememberValue1to1 } from "./remember/SetRememberValue.js";
import { SetCost1to1 } from "./sites/SetCost.js";
import { SetPhase1to1 } from "./sites/SetPhase.js";
import { SetSite1to1 } from "./sites/SetSite.js";

/**
 * Static-factory dispatcher for "(set …)" start rules, mirroring Java's
 * game.rules.start.set.Set.construct() overloads. ArgCompiler invokes the static
 * construct* method whose arity matches the bound Java executable.
 *
 * @java game/rules/start/set/Set.java — construct() dispatchers
 */
export class SetDispatch {
  /**
   * @java Set.construct(SetRememberValueType setType, @Opt String name,
   *   @Or IntFunction value, @Or RegionFunction regionValue,
   *   @Opt @Name BooleanFunction unique) — routes RememberValue.
   */
  public static constructRememberValue(
    setType: string,
    name: string | null,
    value: IntFunction | null,
    regionValue: RegionFunction | null,
    unique: BooleanFunction | null,
  ): StartRule | null {
    switch (setType) {
      case "RememberValue": return new SetRememberValue1to1(name, value, regionValue, unique);
      default: return null;
    }
  }

  /**
   * @java Set.construct(SetStartHiddenType setType, @Opt @Or HiddenData dataType,
   *   @Opt @Or HiddenData[] dataTypes, @Opt SiteType type, @Name @Or2 IntFunction at,
   *   @Or2 RegionFunction region, @Name @Opt IntFunction level,
   *   @Opt BooleanFunction value, @Name RoleType to) — routes Hidden.
   */
  public static constructHidden(
    setType: string,
    dataType: HiddenData | null,
    dataTypes: readonly HiddenData[] | null,
    type: SiteType | null,
    at: IntFunction | null,
    region: RegionFunction | null,
    level: IntFunction | null,
    value: BooleanFunction | null,
    to: RoleTypeFull,
  ): StartRule | null {
    switch (setType) {
      case "Hidden":
        return new SetHidden1to1(
          dataTypes ?? (dataType !== null ? [dataType] : null),
          type,
          new IntArrayFromRegion(at as never, region as never),
          level,
          value,
          to,
        );
      default: return null;
    }
  }

  /**
   * @java Set.construct(RoleType role, @Opt SiteType type, @Opt IntFunction loc,
   *   @Opt @Name String coord) — routes single-site SetSite.
   */
  public static constructSite(
    role: string,
    type: SiteType | null,
    loc: IntFunction | null,
    coord: string | null,
  ): StartRule {
    return new SetSite1to1(role, type, loc, coord);
  }

  /**
   * @java Set.construct(RoleType role, @Opt SiteType type, @Opt IntFunction[] locs,
   *   @Opt RegionFunction region, @Opt String[] coords) — routes multi-site SetSite.
   */
  public static constructSiteRegion(
    role: string,
    type: SiteType | null,
    locs: readonly IntFunction[] | null,
    region: RegionFunction | null,
    coords: readonly string[] | null,
  ): StartRule {
    return new SetSite1to1(role, type, locs, region, coords);
  }

  /**
   * @java Set.construct(SetStartSitesType startType, IntFunction value, @Opt SiteType type,
   *   @Or @Name IntFunction at, @Or @Name RegionFunction to) — routes Count/Cost/Phase.
   * Java maps `at`->site, `to`->region. 5 required params so .length===5 matches the bind.
   */
  public static constructSites(
    startType: string,
    value: IntFunction,
    type: SiteType | null,
    at: IntFunction | null,
    to: RegionFunction | null,
  ): StartRule | null {
    switch (startType) {
      case "Count": return new SetCountStart1to1(value, type, at, to);
      case "Cost": return new SetCost1to1(value, type, at, to);
      case "Phase": return new SetPhase1to1(value, type, at, to);
      default: return null;
    }
  }

  /**
   * @java Set.construct(SetStartPlayerType startType, @Opt RoleType role,
   *   IntFunction value) — routes Amount/Score.
   */
  public static constructPlayer(
    startType: string,
    role: string | null,
    value: IntFunction,
  ): StartRule | null {
    switch (startType) {
      case "Amount": return new SetAmount1to1(roleToPlayerId(role), evalIntFunction(value));
      case "Score": return new SetScore1to1(role ?? "Each", value);
      default: return null;
    }
  }

  /**
   * @java Set.construct(SetStartPlayersType startType, IntFunction index,
   *   RoleType[] roles) — routes Team.
   */
  public static constructPlayers(
    startType: string,
    index: IntFunction,
    roles: readonly string[],
  ): StartRule | null {
    switch (startType) {
      case "Team": return new SetTeam1to1(evalIntFunction(index), roles.map(role => roleToPlayerId(role) ?? -1));
      default: return null;
    }
  }
}

function roleToPlayerId(role: string | null): number | null {
  if (role === null) return null;
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  if (role === "Neutral" || role === "Shared") return 0;
  if (/^Team\d+$/.test(role)) return Number(role.slice(4));
  return null;
}

function evalIntFunction(fn: IntFunction): number {
  try {
    return fn.eval({} as Parameters<IntFunction["eval"]>[0]);
  } catch {
    return 0;
  }
}
