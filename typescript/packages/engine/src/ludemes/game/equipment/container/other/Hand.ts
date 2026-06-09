// @java Core/src/game/equipment/container/other/Hand.java

/**
 * Defines a hand of a player.
 *
 * @java game/equipment/container/other/Hand.java
 * @author Eric.Piette
 *
 * @remarks For any game with components outside of the board.
 */

import { Container } from "../Container.js";
import type { RoleType } from "../../Item.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** Java Constants.MAX_PLAYERS = 16 */
const MAX_PLAYERS = 16;

/**
 * A hand container belonging to a specific player.
 *
 * @java game/equipment/container/other/Hand.java — class Hand extends Container
 */
export class Hand extends Container {
  /** @java Hand.numLocs — number of locations in this container */
  protected _numLocs: number;

  /**
   * @java game/equipment/container/other/Hand.java constructor
   *
   * @param role The owner of the hand.
   * @param size The number of sites in the hand [1].
   */
  public constructor(role: RoleType, size: number | null) {
    // @java Hand.java:55 — super(null, Constants.UNDEFINED, role)
    super(null, UNDEFINED, role);

    // @java Hand.java:57–73 — derive container name
    const containerName = "Hand";

    // @java Hand.java:61–70 — set name based on role
    const ownerIdx = roleOwnerIndex(role);
    if (ownerIdx > 0 && ownerIdx <= MAX_PLAYERS) {
      if (this.name() === null) this.setName(containerName + ownerIdx);
    } else if (role === "Neutral") {
      if (this.name() === null) this.setName(containerName + "0");
    } else if (role === "Shared") {
      if (this.name() === null) this.setName(containerName + "-1");
    }

    // @java Hand.java:76
    this._numLocs = (size === null) ? 1 : size;

    // @java Hand.java:78
    this.style = "Hand";
    // @java Hand.java:79 — setType(ItemType.Hand)
    this.setType("Hand");
  }

  /**
   * @java Hand.createTopology(int, int)
   */
  public createTopology(beginIndex: number, numEdges: number): void {
    this.createHandTopology(beginIndex, this._numLocs, numEdges);
  }

  /** @java Hand.numLocs() */
  public numLocs(): number { return this._numLocs; }

  /** TS compatibility accessor for existing callers. @java Hand.numLocs() */
  public getNumLocs(): number { return this.numLocs(); }

  /** @java Hand.isHand() */
  public override isHand(): boolean { return true; }

  /** @java Hand.clone() */
  public clone(): Hand {
    // @java Hand.java:153–154 — return new Hand(this)
    const cloned = new Hand(this.role() as RoleType, this._numLocs);
    cloned._numLocs = this._numLocs;
    return cloned;
  }

  /**
   * @java Hand.missingRequirement(Game)
   */
  public missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    const role = this.role();
    if (role !== null) {
      const indexOwnerPhase = roleOwnerIndex(role as RoleType);
      const playerCount = (game as unknown as { players(): { count(): number } }).players().count();
      if (
        (indexOwnerPhase < 1 && role !== "Shared" && role !== "All")
        || indexOwnerPhase > playerCount
      ) {
        missingRequirement = true;
      }
    }
    return missingRequirement;
  }
}

/** Map from RoleType to numeric owner index. */
function roleOwnerIndex(role: RoleType): number {
  if (role === "Neutral") return 0;
  if (role === "Shared")  return -1;
  if (role === "All")     return -1;
  const m = /^P(\d+)$/.exec(role);
  if (m) return parseInt(m[1]!, 10);
  return 0;
}
