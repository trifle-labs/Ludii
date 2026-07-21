/**
 * Indicates whether to rotate a piece image.
 *
 * @java metadata/graphics/piece/rotate/PieceRotate.java
 *
 * @remarks For games in which each player should see the piece from their own
 * perspective, e.g. Shogi or Chopsticks.
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";

/**
 * @java metadata/graphics/piece/rotate/PieceRotate.java — class PieceRotate implements GraphicsItem
 */
export class PieceRotate {
  /** RoleType condition. */
  readonly roleType: RoleTypeFull | null;

  /** Piece name condition. */
  readonly pieceName: string | null;

  /** Container index condition. */
  readonly container: number | null;

  /** State condition. */
  readonly state: number | null;

  /** Value condition. */
  readonly value: number | null;

  /** Degrees to rotate the image clockwise. */
  readonly degrees: number;

  constructor(
    roleType: RoleTypeFull | null,
    pieceName: string | null,
    container: number | null,
    state: number | null,
    value: number | null,
    degrees: number,
  ) {
    this.roleType = roleType;
    this.pieceName = pieceName;
    this.container = container;
    this.state = state;
    this.value = value;
    this.degrees = degrees;
  }

  /** @return RoleType condition to check. */
  getRoleType(): RoleTypeFull | null {
    return this.roleType;
  }

  /** @return Piece name condition to check. */
  getPieceName(): string | null {
    return this.pieceName;
  }

  /** @return Container index condition to check. */
  getContainer(): number | null {
    return this.container;
  }

  /** @return Rotation for piece image in degrees. */
  rotation(): number {
    return this.degrees;
  }

  /** @return Piece state condition to check. */
  getState(): number | null {
    return this.state;
  }

  /** @return Piece value condition to check. */
  getValue(): number | null {
    return this.value;
  }

  needRedraw(): boolean {
    return false;
  }
}
