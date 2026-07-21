/**
 * HandPlacement.ts
 *
 * @java metadata/graphics/hand/placement/HandPlacement.java
 *
 * Changes the placement of the hands.
 * @author Matthew.Stephenson
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";
import type { GraphicsItem } from "../../GraphicsItem.js";

/**
 * @java metadata/graphics/hand/placement/HandPlacement.java — class HandPlacement implements GraphicsItem
 */
export class HandPlacement implements GraphicsItem {
  /** The owner of the hand. */
  private readonly _player: RoleTypeFull | null;

  /** Scale of hand. */
  private readonly _scale: number;

  /** Offset right for hand. */
  private readonly _offsetX: number;

  /** Offset down for hand. */
  private readonly _offsetY: number;

  /** If the hand should be drawn vertically. */
  private readonly _vertical: boolean;

  /**
   * @param player   Roletype owner of the hand.
   * @param scale    Scale for the board [1.0].
   * @param offsetX  Offset distance percentage to push the board to the right [0].
   * @param offsetY  Offset distance percentage to push the board down [0].
   * @param vertical If the hand should be drawn vertically [false].
   * @java HandPlacement(RoleType, Float, Float, Float, Boolean)
   */
  constructor(
    player: RoleTypeFull | null,
    scale: number | null,
    offsetX: number | null,
    offsetY: number | null,
    vertical: boolean | null,
  ) {
    this._player = player;
    this._scale = scale == null ? 1.0 : scale;
    this._offsetX = offsetX == null ? 0 : offsetX;
    this._offsetY = offsetY == null ? 0 : offsetY;
    this._vertical = vertical == null ? false : vertical;
  }

  /** @return Scale of board. */
  scale(): number {
    return this._scale;
  }

  /** @return Offset right for board. */
  offsetX(): number {
    return this._offsetX;
  }

  /** @return Offset down for board. */
  offsetY(): number {
    return this._offsetY;
  }

  /** @return If the hand should be drawn vertically. */
  isVertical(): boolean {
    return this._vertical;
  }

  /** @return The owner of the hand. */
  getPlayer(): RoleTypeFull | null {
    return this._player;
  }

  /** @java HandPlacement.concepts(Game) */
  concepts(_game: unknown): unknown {
    return {};
  }

  /** @java HandPlacement.gameFlags(Game) */
  gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java HandPlacement.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}
