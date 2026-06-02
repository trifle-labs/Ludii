/**
 * Sets a site (or region of sites) to the first piece of a given player/role.
 *
 * @java game/rules/start/set/sites/SetSite.java — eval(Context)
 */

import type { Equipment1to1 } from "../../../../equipment/Equipment1to1.js";
import type { StartRule } from "../../StartRule.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * @java game/rules/start/set/sites/SetSite.java
 *
 * Sets a board site (or multiple sites / a region) to the first piece of the
 * given RoleType owner. Mirrors Java SetSite.eval(Context).
 */
export class SetSite1to1 implements StartRule {
  /** 0-based player index who owns the piece (0 = neutral). */
  private readonly owner: number;

  /** Single site index, or -1 if not set. */
  private readonly siteId: number;

  /** Multiple explicit site indices, or null if not used. */
  private readonly locationIds: readonly number[] | null;

  /**
   * @param owner      0-based player owner (P1=1, P2=2, Neutral=0)
   * @param siteId     single site index (-1 if using locationIds)
   * @param locationIds list of site indices (null if using siteId)
   */
  public constructor(
    owner: number,
    siteId: number,
    locationIds: readonly number[] | null,
  ) {
    this.owner = owner;
    this.siteId = siteId;
    this.locationIds = locationIds;
  }

  /**
   * @java game/rules/start/set/sites/SetSite.java — eval(Context)
   *
   * Finds the first piece owned by `owner` and places it at all target sites.
   * Mirrors Java: SetSite.eval finds the matching component and calls
   * Start.placePieces(context, site, what, 1, UNDEFINED, UNDEFINED, UNDEFINED, false, type).
   */
  public applyToInitialState(
    cells: number[],
    whats: number[],
    countAt: number[],
    equipment: Equipment1to1,
    _numPlayers: number,
  ): void {
    // Find the first piece owned by this player (Java: iterates components until component.index() == what)
    const piece = equipment.pieces.find(p => p.owner === this.owner);
    if (piece === undefined) return;

    const what = piece.index;
    const n = cells.length;

    const place = (site: number): void => {
      if (site < 0 || site >= n) return;
      // Java: Start.placePieces(...) → ActionAdd → sets who=owner, what=piece
      cells[site] = this.owner;
      whats[site] = what;
      countAt[site] = 1;
    };

    if (this.locationIds !== null) {
      // Java: evalFill — iterate locationIds
      for (const loc of this.locationIds) {
        place(loc);
      }
    } else if (this.siteId !== UNDEFINED && this.siteId >= 0) {
      // Java: single site path
      place(this.siteId);
    }
  }
}
