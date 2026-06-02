// @java Core/src/metadata/graphics/no/Boolean/NoSunken.java NoSunken
/**
 * Java parity:
 * - Core/src/metadata/graphics/no/Boolean/NoSunken.java — faithful data-class port.
 *   Indicates whether the board should not be drawn sunken.
 *   Only applies to graph boards.
 */

export class NoSunken {
  private readonly _noSunken: boolean;

  /**
   * @param noSunken If the board should not be drawn sunken [true].
   */
  constructor(noSunken?: boolean | null) {
    this._noSunken = noSunken == null ? true : noSunken;
  }

  /** @return If the board should not be drawn sunken. */
  public noSunken(): boolean {
    return this._noSunken;
  }

  public needRedraw(): boolean {
    return false;
  }
}
