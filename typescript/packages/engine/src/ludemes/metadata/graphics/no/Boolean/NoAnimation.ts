// @java Core/src/metadata/graphics/no/Boolean/NoAnimation.java NoAnimation
/**
 * Java parity:
 * - Core/src/metadata/graphics/no/Boolean/NoAnimation.java — faithful data-class port.
 *   Indicates whether movement animation should be disabled.
 *   Should be used when specific BoardStyles or rule combinations may cause
 *   incorrect animations.
 */

export class NoAnimation {
  private readonly _noAnimation: boolean;

  /**
   * @param noAnimation Whether animations are disabled or not [true].
   */
  constructor(noAnimation?: boolean | null) {
    this._noAnimation = noAnimation == null ? true : noAnimation;
  }

  /** @return If animations are disabled. */
  public noAnimation(): boolean {
    return this._noAnimation;
  }

  public needRedraw(): boolean {
    return false;
  }
}
