/**
 * Indicates whether the value of a piece should be displayed.
 *
 * @java metadata/graphics/show/component/ShowPieceValue.java
 *
 * @remarks Used for displaying information about pieces in specific games, e.g. Stratego.
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";
import type { ValueLocationType } from "../../util/ValueLocationType.js";

/**
 * @java metadata/graphics/show/component/ShowPieceValue.java — class ShowPieceValue implements GraphicsItem
 */
export class ShowPieceValue {
  /** RoleType condition. */
  readonly roleType: RoleTypeFull | null;

  /** Piece name condition. */
  readonly pieceName: string | null;

  /** The location to draw the value. */
  readonly location: ValueLocationType;

  /** Offset the image by the size of the displayed value. */
  readonly offsetImage: boolean;

  /** Draw outline around the displayed value. */
  readonly valueOutline: boolean;

  /** Scale of drawn image. */
  readonly scale: number;

  /** Offset right for drawn image. */
  readonly offsetX: number;

  /** Offset down for drawn image. */
  readonly offsetY: number;

  constructor(
    roleType: RoleTypeFull | null,
    pieceName: string | null,
    location: ValueLocationType | null,
    offsetImage: boolean | null,
    valueOutline: boolean | null,
    scale: number | null,
    offsetX: number | null,
    offsetY: number | null,
  ) {
    this.roleType = roleType;
    this.pieceName = pieceName;
    this.location = location === null ? "CornerLeft" : location;
    this.offsetImage = offsetImage === null ? false : offsetImage;
    this.valueOutline = valueOutline === null ? false : valueOutline;
    this.scale = scale === null ? 1.0 : scale;
    this.offsetX = offsetX === null ? 0 : offsetX;
    this.offsetY = offsetY === null ? 0 : offsetY;
  }

  /** @return RoleType condition to check. */
  getRoleType(): RoleTypeFull | null {
    return this.roleType;
  }

  /** @return Piece name condition to check. */
  getPieceName(): string | null {
    return this.pieceName;
  }

  /** @return The location to draw the value. */
  getLocation(): ValueLocationType {
    return this.location;
  }

  /** @return Offset the image by the size of the displayed value. */
  isOffsetImage(): boolean {
    return this.offsetImage;
  }

  /** @return Draw outline around the displayed value. */
  isValueOutline(): boolean {
    return this.valueOutline;
  }

  /** @return Scale of drawn image. */
  getScale(): number {
    return this.scale;
  }

  /** @return Offset right for drawn image. */
  getOffsetX(): number {
    return this.offsetX;
  }

  /** @return Offset down for drawn image. */
  getOffsetY(): number {
    return this.offsetY;
  }

  needRedraw(): boolean {
    return false;
  }
}
