// @java Core/src/metadata/graphics/no/Boolean/NoDicePips.java NoDicePips
/**
 * Java parity:
 * - Core/src/metadata/graphics/no/Boolean/NoDicePips.java — faithful data-class port.
 *   Indicates whether pips on the dice should always be drawn as a single number.
 */

export class NoDicePips {
  private readonly _noDicePips: boolean;

  /**
   * @param noDicePips Whether dice pips should be replaced by a number [true].
   */
  constructor(noDicePips?: boolean | null) {
    this._noDicePips = noDicePips == null ? true : noDicePips;
  }

  /** @return If pips on the dice should always be drawn as a single number. */
  public noDicePips(): boolean {
    return this._noDicePips;
  }

  public needRedraw(): boolean {
    return false;
  }
}
