/**
 * Indicates how the hints for the puzzle should be shown.
 *
 * @java metadata/graphics/puzzle/DrawHint.java
 */

import type { PuzzleDrawHintType } from "../util/PuzzleDrawHintType.js";

/**
 * @java metadata/graphics/puzzle/DrawHint.java — class DrawHint implements GraphicsItem
 */
export class DrawHint {
  /** How hints should be shown. */
  readonly drawHint: PuzzleDrawHintType;

  /**
   * @param drawHint How hints should be shown.
   */
  constructor(drawHint: PuzzleDrawHintType) {
    this.drawHint = drawHint;
  }

  /** @return How the hint should be drawn. */
  getDrawHint(): PuzzleDrawHintType {
    return this.drawHint;
  }

  needRedraw(): boolean {
    return false;
  }
}
