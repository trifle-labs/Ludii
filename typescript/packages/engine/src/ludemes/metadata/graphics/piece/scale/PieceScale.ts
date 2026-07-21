/**
 * Sets the image scale of a piece.
 *
 * @java metadata/graphics/piece/scale/PieceScale.java
 *
 * @remarks A scale of 0 shrinks the piece to nothing, 1 is full (100 percent) size.
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";

/**
 * @java metadata/graphics/piece/scale/PieceScale.java — class PieceScale implements GraphicsItem
 */
export class PieceScale {
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

  /** Component image scale to apply. */
  readonly scale: number;

  /** Scale of drawn image along x-axis. */
  readonly scaleX: number;

  /** Scale of drawn image along y-axis. */
  readonly scaleY: number;

  constructor(
    roleType: RoleTypeFull | null,
    pieceName: string | null,
    container: number | null,
    state: number | null,
    value: number | null,
    scale: number | null,
    scaleX: number | null,
    scaleY: number | null,
  ) {
    this.roleType = roleType;
    this.pieceName = pieceName;
    this.container = container;
    this.state = state;
    this.value = value;
    this.scale = scale === null ? 1.0 : scale;
    this.scaleX = scaleX === null ? 1.0 : scaleX;
    this.scaleY = scaleY === null ? 1.0 : scaleY;
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

  /** @return Piece state condition to check. */
  getState(): number | null {
    return this.state;
  }

  /** @return Piece value condition to check. */
  getValue(): number | null {
    return this.value;
  }

  /** @return X scale to apply onto component image. */
  getScale(): number {
    return this.scale;
  }

  /** @return Scale of drawn image along x-axis. */
  getScaleX(): number {
    return this.scaleX;
  }

  /** @return Scale of drawn image along y-axis. */
  getScaleY(): number {
    return this.scaleY;
  }

  needRedraw(): boolean {
    return false;
  }
}
