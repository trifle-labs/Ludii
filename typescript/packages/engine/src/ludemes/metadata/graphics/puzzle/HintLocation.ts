/**
 * Indicates how to determine the site for the hint to be drawn.
 *
 * @java metadata/graphics/puzzle/HintLocation.java
 */

import type { PuzzleHintLocationType } from "../util/PuzzleHintLocationType.js";

/**
 * @java metadata/graphics/puzzle/HintLocation.java — class HintLocation implements GraphicsItem
 */
export class HintLocation {
  /** How to determine hint location. */
  readonly hintLocation: PuzzleHintLocationType;

  /**
   * @param hintLocation How to determine hint location.
   */
  constructor(hintLocation: PuzzleHintLocationType) {
    this.hintLocation = hintLocation;
  }

  /** @return How to determine hint location. */
  getHintLocation(): PuzzleHintLocationType {
    return this.hintLocation;
  }

  needRedraw(): boolean {
    return false;
  }
}
