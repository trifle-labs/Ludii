/**
 * Sets the style of a piece.
 *
 * @java metadata/graphics/piece/style/PieceStyle.java
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";
import type { ComponentStyleType } from "../../util/ComponentStyleType.js";

/**
 * @java metadata/graphics/piece/style/PieceStyle.java — class PieceStyle implements GraphicsItem
 */
export class PieceStyle {
  /** RoleType condition. */
  readonly roleType: RoleTypeFull | null;

  /** Piece name condition. */
  readonly pieceName: string | null;

  /** Component style to apply. */
  readonly componentStyleType: ComponentStyleType;

  constructor(
    roleType: RoleTypeFull | null,
    pieceName: string | null,
    componentStyleType: ComponentStyleType,
  ) {
    this.roleType = roleType;
    this.pieceName = pieceName;
    this.componentStyleType = componentStyleType;
  }

  /** @return RoleType condition to check. */
  getRoleType(): RoleTypeFull | null {
    return this.roleType;
  }

  /** @return Piece name condition to check. */
  getPieceName(): string | null {
    return this.pieceName;
  }

  /** @return ComponentStyleType to apply onto component.
   * @java PieceStyle.componentStyleType()
   */
  getComponentStyleType(): ComponentStyleType {
    return this.componentStyleType;
  }

  needRedraw(): boolean {
    return false;
  }
}
