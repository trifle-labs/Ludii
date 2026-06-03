/**
 * @java game/equipment/component/tile/Path.java Path
 *
 * Defines the internal connection path of a Tile component.
 * Each Path connects two sides of a tile (by side index and terminus slot index)
 * with an associated colour index.
 *
 * @java game/equipment/component/tile/Path.java — constructor/side1/side2/terminus1/terminus2/colour/side1Rotated/side2Rotated
 */

export class Path {
  /** @java Path.from — "from" side index */
  private readonly _from: number;

  /** @java Path.slotsFrom — terminus slot on "from" side [default 0] */
  private readonly _slotsFrom: number;

  /** @java Path.to — "to" side index */
  private readonly _to: number;

  /** @java Path.slotsTo — terminus slot on "to" side [default 0] */
  private readonly _slotsTo: number;

  /** @java Path.colour — colour index of this connection */
  private readonly _colour: number;

  /**
   * @java game/equipment/component/tile/Path.java constructor
   *
   * @param from       The "from" side of the connection.
   * @param slotsFrom  The slot of the "from" side [0].
   * @param to         The "to" side of the connection.
   * @param slotsTo    The slot of the "to" side [0].
   * @param colour     The colour of the connection.
   */
  public constructor(
    from: number,
    slotsFrom: number | null,
    to: number,
    slotsTo: number | null,
    colour: number,
  ) {
    this._from      = from;
    // @java Path.java:59 — (slotsFrom == null) ? Integer.valueOf(0) : slotsFrom
    this._slotsFrom = slotsFrom !== null ? slotsFrom : 0;
    this._to        = to;
    // @java Path.java:60 — (slotsTo == null) ? Integer.valueOf(0) : slotsTo
    this._slotsTo   = slotsTo !== null ? slotsTo : 0;
    this._colour    = colour;
  }

  /**
   * @java Path.side1()
   * @returns The "from" side index.
   */
  public side1(): number {
    return this._from;
  }

  /**
   * @java Path.side2()
   * @returns The "to" side index.
   */
  public side2(): number {
    return this._to;
  }

  /**
   * @java Path.terminus1()
   * @returns The terminus slot on the "from" side.
   */
  public terminus1(): number {
    return this._slotsFrom;
  }

  /**
   * @java Path.terminus2()
   * @returns The terminus slot on the "to" side.
   */
  public terminus2(): number {
    return this._slotsTo;
  }

  /**
   * @java Path.colour()
   * @returns The colour index of this path.
   */
  public colour(): number {
    return this._colour;
  }

  /**
   * @java Path.side1(int rotation, int maxOrthoRotation)
   * Returns the "from" side index with the given rotation applied.
   *
   * @param rotation         The rotation amount.
   * @param maxOrthoRotation The number of orthogonal directions (modulus).
   */
  public side1Rotated(rotation: number, maxOrthoRotation: number): number {
    // @java Path.java:114 — (from.intValue() + rotation) % maxOrthoRotation
    return (this._from + rotation) % maxOrthoRotation;
  }

  /**
   * @java Path.side2(int rotation, int maxOrthoRotation)
   * Returns the "to" side index with the given rotation applied.
   *
   * @param rotation         The rotation amount.
   * @param maxOrthoRotation The number of orthogonal directions (modulus).
   */
  public side2Rotated(rotation: number, maxOrthoRotation: number): number {
    // @java Path.java:122 — (to.intValue() + rotation) % maxOrthoRotation
    return (this._to + rotation) % maxOrthoRotation;
  }

  /**
   * @java Path.toEnglish(Game)
   * @returns Human-readable description of this path.
   */
  public toEnglish(): string {
    return (
      "with path from side " + this._from +
      " (terminus " + this._slotsFrom + ")" +
      " to side " + this._to +
      " (terminus " + this._slotsTo + ")" +
      " coloured " + this._colour
    );
  }
}
