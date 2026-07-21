/**
 * @java game/equipment/other/Dominoes.java Dominoes
 *
 * Defines a full set of dominoes from (0|0) to (upTo|upTo).
 * The set has (upTo+1)*(upTo+2)/2 dominoes total.
 *
 * @java game/equipment/other/Dominoes.java — constructor/generateDominoes/upTo
 */

import { Item, type RoleType } from "../Item.js";
import { Domino } from "../component/tile/Domino.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** Java Constants.MAX_PITS_DOMINOES = 10 */
const MAX_PITS_DOMINOES = 10;

export class Dominoes extends Item {
  /** @java Dominoes.upTo — max pips per side [6] */
  public readonly upTo: number;

  /**
   * @java game/equipment/other/Dominoes.java constructor
   *
   * @param upTo The maximum pip value (number of dots on the highest tile) [6].
   */
  public constructor(upTo: number | null) {
    // @java Dominoes.java:38 — super(null, Constants.UNDEFINED, RoleType.Shared)
    super(null, UNDEFINED, "Shared" as RoleType);

    // @java Dominoes.java:39 — this.upTo = (upTo == null) ? 6 : upTo.intValue()
    this.upTo = (upTo === null) ? 6 : upTo;

    // @java Dominoes.java:42–45 — range validation
    if (this.upTo < 0 || this.upTo > MAX_PITS_DOMINOES) {
      throw new Error(
        "The limit of the dominoes pips can not be negative or to exceed " +
        MAX_PITS_DOMINOES + ".",
      );
    }

    // @java Dominoes.java:47 — setType(ItemType.Dominoes)
    this.setType("Dominoes");
  }

  /**
   * @java Dominoes.generateDominoes()
   *
   * Generates all domino tiles for this set.
   * For i in [0..upTo] and j in [i..upTo]: creates Domino("DominoIJ", Shared, i, j).
   *
   * @returns Array of Domino objects in i-major order.
   */
  public generateDominoes(): Domino[] {
    // @java Dominoes.java:53–66
    const dominoes: Domino[] = [];
    for (let i = 0; i <= this.upTo; i++) {
      for (let j = i; j <= this.upTo; j++) {
        dominoes.push(
          new Domino("Domino" + i + j, "Shared" as RoleType, i, j, null),
        );
      }
    }
    return dominoes;
  }
}
