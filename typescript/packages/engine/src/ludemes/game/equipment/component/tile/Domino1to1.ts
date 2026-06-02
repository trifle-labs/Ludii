/**
 * @java game/equipment/component/tile/Domino.java Domino
 *
 * A single domino tile component with two pip values.
 * Extends Component1to1. Always isTile() = true, isDomino() = true.
 * numSides() = 4 (dominoes are rectangular, 4 sides).
 * isDoubleDomino() returns true iff both values are equal.
 *
 * @java game/equipment/component/tile/Domino.java — constructor/getValue/getValue2/isDoubleDomino
 */

import { Component1to1 } from "../Component1to1.js";
import type { MovesFunction } from "../../../../base.js";

export class Domino1to1 extends Component1to1 {
  /** @java Domino.value — first pip value */
  private readonly _value: number;
  /** @java Domino.value2 — second pip value */
  private readonly _value2: number;

  /**
   * @java game/equipment/component/tile/Domino.java constructor
   *
   * @param name      The name of the domino (e.g. "Domino45").
   * @param owner     1-based player owner (0 = Shared/Neutral).
   * @param value     The first pip value.
   * @param value2    The second pip value.
   * @param generator Optional move generator.
   */
  public constructor(
    name: string,
    owner: number,
    value: number,
    value2: number,
    generator: MovesFunction | null = null,
  ) {
    super(name, owner, Component1to1.OFF, Component1to1.OFF, Component1to1.OFF, generator);
    this._value  = value;
    this._value2 = value2;
    // @java Domino.java:67 — nameWithoutNumber = StringRoutines.removeTrailingNumbers(name)
    this.nameWithoutNumber = name.replace(/\d+$/, "");
    // @java Domino.java:68 — style = ComponentStyleType.Domino
    this.style = "Domino";
  }

  /** @java Domino.getValue() — first pip value */
  public override getValue(): number  { return this._value; }
  /** @java Domino.getValue2() — second pip value */
  public override getValue2(): number { return this._value2; }
  /** @java Domino.isDomino() */
  public override isDomino(): boolean  { return true; }
  /** @java Domino.isTile() */
  public override isTile(): boolean    { return true; }
  /** @java Domino.numSides() — 4 sides */
  public override numSides(): number   { return 4; }
  /**
   * @java Domino.isDoubleDomino()
   * Returns true iff both values are equal.
   */
  public override isDoubleDomino(): boolean {
    // @java Domino.java:108 — return getValue() == getValue2()
    return this._value === this._value2;
  }
}
