/**
 * Replaces a piece's name with an alternative.
 *
 * @java metadata/graphics/piece/name/PieceRename.java
 *
 * @remarks Used for finding and displaying the correct piece image for components.
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";

/**
 * @java metadata/graphics/piece/name/PieceRename.java — class PieceRename implements GraphicsItem
 */
export class PieceRename {
  /** RoleType condition. */
  readonly roleType: RoleTypeFull | null;

  /** Piece name condition. */
  readonly piece: string | null;

  /** Container index condition. */
  readonly container: number | null;

  /** State condition. */
  readonly state: number | null;

  /** Value condition. */
  readonly value: number | null;

  /** String extension to replace Piece name. */
  readonly nameReplacement: string;

  constructor(
    roleType: RoleTypeFull | null,
    piece: string | null,
    container: number | null,
    state: number | null,
    value: number | null,
    nameReplacement: string,
  ) {
    this.roleType = roleType;
    this.piece = piece;
    this.container = container;
    this.state = state;
    this.value = value;
    this.nameReplacement = nameReplacement;
  }

  /** @return RoleType condition to check. */
  getRoleType(): RoleTypeFull | null {
    return this.roleType;
  }

  /** @return Piece name condition to check. */
  pieceName(): string | null {
    return this.piece;
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

  /** @return String to replace piece name. */
  getNameReplacement(): string {
    return this.nameReplacement;
  }

  needRedraw(): boolean {
    return false;
  }
}
