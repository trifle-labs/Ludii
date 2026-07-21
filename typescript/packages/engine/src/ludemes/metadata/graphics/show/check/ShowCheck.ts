/**
 * Indicates whether a "Check" should be displayed when a piece is threatened.
 *
 * @java metadata/graphics/show/check/ShowCheck.java
 *
 * @remarks Should be used only for specific games where this is prudent, e.g. Chess.
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";

/**
 * @java metadata/graphics/show/check/ShowCheck.java — class ShowCheck implements GraphicsItem
 */
export class ShowCheck {
  /** RoleType condition. */
  readonly roleType: RoleTypeFull | null;

  /** Piece name condition. */
  readonly pieceName: string | null;

  constructor(roleType: RoleTypeFull | null, pieceName: string | null) {
    this.roleType = roleType;
    this.pieceName = pieceName;
  }

  /** @return RoleType condition to check. */
  getRoleType(): RoleTypeFull | null {
    return this.roleType;
  }

  /** @return Piece name condition to check. */
  getPieceName(): string | null {
    return this.pieceName;
  }

  needRedraw(): boolean {
    return false;
  }
}
