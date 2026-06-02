/**
 * @java game/equipment/container/other/Hand.java Hand
 *
 * A hand container for a player. Holds numLocs slots (default 1).
 * Mirrors Java Hand: owner → player id, numLocs → number of hand slots.
 *
 * In the 1:1 data path this is a lightweight descriptor — the actual site
 * allocation is done in Equipment1to1 via HandSpec.
 *
 * @java game/equipment/container/other/Hand.java — constructor/numLocs/isHand
 */

import { Item1to1 } from "../../Item1to1.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

export class Hand1to1 extends Item1to1 {
  /** @java Hand.numLocs — number of slots in this hand */
  public readonly numLocs: number;

  /**
   * @java game/equipment/container/other/Hand.java constructor
   *
   * @param role    1-based player id (or 0 for Neutral/Shared).
   * @param size    Number of slots [1].
   */
  public constructor(role: number, size: number | null) {
    // @java Hand.java:55 — super(null, Constants.UNDEFINED, role)
    super(null, UNDEFINED, role);
    // @java Hand.java:76 — this.numLocs = (size == null) ? 1 : size.intValue()
    this.numLocs = (size === null) ? 1 : size;
    // @java Hand.java:78 — setType(ItemType.Hand)
    this.setType("Hand");
    // Set name to "Hand" + owner (mirrors Java)
    // @java Hand.java:62–66
    this.setName("Hand" + role);
  }

  /** @java Hand.isHand() */
  public isHand(): boolean { return true; }
  /** @java Hand.isDice() */
  public isDice(): boolean { return false; }
  /** @java Hand.isDeck() */
  public isDeck(): boolean { return false; }
}
