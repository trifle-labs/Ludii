/**
 * Sets a site (or region of sites) to the first piece of a given player/role.
 *
 * @java game/rules/start/set/sites/SetSite.java — eval(Context)
 */

import type { EquipmentSurface } from "../../../../equipment/EquipmentSurface.js";
import type { IntFunction, RegionFunction } from "../../../../../base.js";
import type { Context } from "../../../../../../context.js";
import type { StartRule } from "../../StartRule.js";
import type { SiteType } from "../../../../../../action/site-type.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** @java game/types/play/RoleType.java — enum value name string */
export type RoleType = string;

/**
 * @java game/rules/start/set/sites/SetSite.java
 *
 * Sets a board site (or multiple sites / a region) to the first piece of the
 * given RoleType owner. Mirrors Java SetSite.eval(Context).
 */
export class SetSite implements StartRule {
  /** The role of the owner of the piece to set. */
  private readonly role: RoleType;

  /** Cell, Edge or Vertex. */
  private readonly type: SiteType | null;

  /** Single site index, or -1 if not set. */
  private readonly siteId: IntFunction | null;

  /** Single coordinate, or null if not used. */
  private readonly coord: string | null;

  /** Multiple explicit site functions, or null if not used. */
  private readonly locationIds: readonly IntFunction[] | null;

  /** Region to fill, or null if not used. */
  private readonly region: RegionFunction | null;

  /** Multiple coordinates, or null if not used. */
  private readonly coords: readonly string[] | null;

  /**
   * @java SetSite(RoleType role, @Opt SiteType type, @Opt IntFunction loc, @Opt @Name String coord)
   */
  public constructor(
    role: RoleType,
    type?: SiteType | null,
    loc?: IntFunction | null,
    coord?: string | null,
  );

  /**
   * @java SetSite(RoleType role, @Opt SiteType type, @Opt IntFunction[] locs, @Opt RegionFunction region, @Opt String[] coords)
   */
  public constructor(
    role: RoleType,
    type?: SiteType | null,
    locs?: readonly IntFunction[] | null,
    region?: RegionFunction | null,
    coords?: readonly string[] | null,
  );

  public constructor(
    role: RoleType,
    type: SiteType | null | undefined,
    locOrLocs: IntFunction | readonly IntFunction[] | null | undefined,
    regionOrCoord: RegionFunction | string | null | undefined,
    coords: readonly string[] | null | undefined = null,
  ) {
    this.role = role;
    this.type = type ?? null;
    const locOrLocsOrNull = locOrLocs ?? null;
    const regionOrCoordOrNull = regionOrCoord ?? null;
    const coordsOrNull = coords ?? null;

    if (isIntFunctionArray(locOrLocsOrNull)) {
      this.locationIds = locOrLocsOrNull;
      this.region = regionOrCoordOrNull !== null && typeof regionOrCoordOrNull !== "string" ? regionOrCoordOrNull : null;
      this.coords = coordsOrNull;
      this.coord = null;
      this.siteId = null;
    } else {
      this.siteId = locOrLocsOrNull;
      this.coord = typeof regionOrCoordOrNull === "string" ? regionOrCoordOrNull : null;
      this.locationIds = null;
      this.region = regionOrCoordOrNull !== null && typeof regionOrCoordOrNull !== "string" ? regionOrCoordOrNull : null;
      this.coords = coordsOrNull;
    }
  }

  /**
   * @java game/rules/start/set/sites/SetSite.java — eval(Context)
   *
   * Finds the first piece owned by `owner` and places it at all target sites.
   * Mirrors Java: SetSite.eval finds the matching component and calls
   * Start.placePieces(context, site, what, 1, UNDEFINED, UNDEFINED, UNDEFINED, false, type).
   */
  public eval(ctx: Context): void {
    const cs = (ctx as unknown as { _startState?: { setSite(site: number, who: number, what: number, count: number, stateVal: number, value: number): void; setScore(pid: number, score: number): void; setAmount(pid: number, amount: number): void } })._startState;
    if (!cs) return;
    const game = ctx.game as unknown as { equipment: EquipmentSurface; numPlayers: number };

    // Find the first piece owned by this player (Java: iterates components until component.index() == what)
    const owner = roleOwner(this.role, game.numPlayers);
    const piece = game.equipment.pieces.find(p => p.owner === owner);
    if (piece === undefined) return;

    const what = piece.index;

    const place = (site: number): void => {
      // Java: Start.placePieces(...) -> ActionAdd -> ContainerState.setSite(...)
      cs.setSite(site, owner, what, 1, -1, -1);
    };

    if (this.coords !== null) {
      return;
    }

    if (this.region !== null) {
      for (const loc of this.region.eval(ctx)) place(loc);
    } else if (this.locationIds !== null) {
      // Java: evalFill — iterate locationIds
      for (const loc of this.locationIds) place(loc.eval(ctx));
    } else if (this.siteId !== null) {
      // Java: single site path
      place(this.siteId.eval(ctx));
    }
  }
}


function roleOwner(role: RoleType, numPlayers: number): number {
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  if (role === "Shared" || role === "All") return numPlayers;
  if (role === "Neutral") return 0;
  if (/^Team\d+$/.test(role)) return Number(role.slice(4));
  return UNDEFINED;
}

function isIntFunctionArray(value: IntFunction | readonly IntFunction[] | null): value is readonly IntFunction[] {
  return Array.isArray(value);
}
