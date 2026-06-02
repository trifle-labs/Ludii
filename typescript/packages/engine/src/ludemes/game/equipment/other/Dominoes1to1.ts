/**
 * @java game/equipment/other/Dominoes.java Dominoes
 *
 * Defines a full set of dominoes from (0|0) to (upTo|upTo).
 * The set has (upTo+1)*(upTo+2)/2 dominoes total.
 *
 * @java game/equipment/other/Dominoes.java — constructor/generateDominoes/upTo
 */

import { Item1to1 } from "../Item1to1.js";
import { Domino1to1 } from "../component/tile/Domino1to1.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** Java Constants.MAX_PITS_DOMINOES = 10 (not enforced here, kept for docs) */
// const MAX_PITS_DOMINOES = 10;

export class Dominoes1to1 extends Item1to1 {
  /** @java Dominoes.upTo — max pips per side [6] */
  public readonly upTo: number;

  /**
   * @java game/equipment/other/Dominoes.java constructor
   *
   * @param upTo The maximum pip value (number of dots on the highest tile) [6].
   */
  public constructor(upTo: number | null) {
    // @java Dominoes.java:38 — super(null, Constants.UNDEFINED, RoleType.Shared)
    super(null, UNDEFINED, 0 /* Shared = owner 0 */);
    // @java Dominoes.java:39 — this.upTo = (upTo == null) ? 6 : upTo.intValue()
    this.upTo = (upTo === null) ? 6 : upTo;
    // @java Dominoes.java:47 — setType(ItemType.Dominoes)
    this.setType("Dominoes");
  }

  /**
   * @java Dominoes.generateDominoes()
   *
   * Generates all domino tiles for this set.
   * For i in [0..upTo] and j in [i..upTo]: creates Domino("DominoIJ", Shared, i, j).
   *
   * @returns Array of Domino1to1 objects in i-major order.
   */
  public generateDominoes(): Domino1to1[] {
    // @java Dominoes.java:53–66
    const dominoes: Domino1to1[] = [];
    for (let i = 0; i <= this.upTo; i++) {
      for (let j = i; j <= this.upTo; j++) {
        dominoes.push(
          new Domino1to1("Domino" + i + j, 0 /* Shared */, i, j, null),
        );
      }
    }
    return dominoes;
  }
}
