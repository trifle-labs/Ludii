/**
 * @java game/equipment/component/tile/Path.java Path
 *
 * Defines the internal connection path of a Tile component.
 * Each Path connects two sides of a tile (by side index and terminus slot index)
 * with an associated colour index.
 *
 * @java game/equipment/component/tile/Path.java — constructor/side1/side2/terminus1/terminus2/colour
 */

export class Path1to1 {
  /** @java Path.from — "from" side index */
  public readonly from: number;
  /** @java Path.slotsFrom — terminus slot on "from" side [default 0] */
  public readonly slotsFrom: number;
  /** @java Path.to — "to" side index */
  public readonly to: number;
  /** @java Path.slotsTo — terminus slot on "to" side [default 0] */
  public readonly slotsTo: number;
  /** @java Path.colour — colour index of this connection */
  public readonly colour: number;

  /**
   * @java game/equipment/component/tile/Path.java constructor
   *
   * @param from       The "from" side index.
   * @param slotsFrom  The terminus slot on the "from" side [0].
   * @param to         The "to" side index.
   * @param slotsTo    The terminus slot on the "to" side [0].
   * @param colour     The colour of the connection.
   */
  public constructor(
    from: number,
    slotsFrom: number | null,
    to: number,
    slotsTo: number | null,
    colour: number,
  ) {
    this.from      = from;
    this.slotsFrom = slotsFrom ?? 0;   // @java Path.java:59 — (slotsFrom == null) ? 0 : slotsFrom
    this.to        = to;
    this.slotsTo   = slotsTo ?? 0;     // @java Path.java:60 — (slotsTo == null) ? 0 : slotsTo
    this.colour    = colour;
  }

  /** @java Path.side1() */
  public side1(): number      { return this.from; }
  /** @java Path.side2() */
  public side2(): number      { return this.to; }
  /** @java Path.terminus1() */
  public terminus1(): number  { return this.slotsFrom; }
  /** @java Path.terminus2() */
  public terminus2(): number  { return this.slotsTo; }

  /**
   * @java Path.side1(int rotation, int maxOrthoRotation)
   * Returns the rotated "from" side index.
   */
  public side1Rotated(rotation: number, maxOrthoRotation: number): number {
    // @java Path.java:114 — (from + rotation) % maxOrthoRotation
    return (this.from + rotation) % maxOrthoRotation;
  }

  /**
   * @java Path.side2(int rotation, int maxOrthoRotation)
   * Returns the rotated "to" side index.
   */
  public side2Rotated(rotation: number, maxOrthoRotation: number): number {
    // @java Path.java:122 — (to + rotation) % maxOrthoRotation
    return (this.to + rotation) % maxOrthoRotation;
  }
}
