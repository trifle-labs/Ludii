/**
 * GraphicsItem.ts
 *
 * @java metadata/graphics/GraphicsItem.java
 *
 * Metadata containing graphics hints.
 * @author cambolbro
 */

import type { MetadataItem } from "../MetadataItem.js";

/**
 * @java metadata/graphics/GraphicsItem.java — interface GraphicsItem extends MetadataItem
 */
export interface GraphicsItem extends MetadataItem {
  /**
   * @param game The game.
   * @return Accumulated concepts.
   * @java GraphicsItem.concepts(Game)
   */
  concepts(game: unknown): unknown;

  /**
   * @param game The game.
   * @return Accumulated game flags.
   * @java GraphicsItem.gameFlags(Game)
   */
  gameFlags(game: unknown): number;

  /**
   * @return True if this ludeme needs to be redrawn after each move.
   * @java GraphicsItem.needRedraw()
   */
  needRedraw(): boolean;
}
