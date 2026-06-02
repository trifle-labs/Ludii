// @java Core/src/metadata/graphics/no/Boolean/NoCurves.java NoCurves
/**
 * Java parity:
 * - Core/src/metadata/graphics/no/Boolean/NoCurves.java — faithful data-class port.
 *   Indicates if the lines making up the board's rings should be drawn as straight lines.
 *   Only used by specific board styles, e.g. Wheel.
 */

export class NoCurves {
  private readonly _straightRingLines: boolean;

  /**
   * @param straightRingLines Whether rings should be drawn straight rather than curved [true].
   */
  constructor(straightRingLines?: boolean | null) {
    this._straightRingLines = straightRingLines == null ? true : straightRingLines;
  }

  /** @return If rings on the board should be drawn straight rather than curved. */
  public straightRingLines(): boolean {
    return this._straightRingLines;
  }

  public needRedraw(): boolean {
    return false;
  }
}
