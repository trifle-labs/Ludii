/**
 * PieceExtendName.ts
 *
 * @java metadata/graphics/piece/name/PieceExtendName.java
 *
 * Adds additional text to a piece name.
 * @author Matthew.Stephenson
 *
 * @remarks Used for finding and displaying the correct piece image for components.
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";
import type { GraphicsItem } from "../../GraphicsItem.js";

/**
 * @java metadata/graphics/piece/name/PieceExtendName.java — class PieceExtendName implements GraphicsItem
 */
export class PieceExtendName implements GraphicsItem {
  /** RoleType condition. */
  private readonly _roleType: RoleTypeFull | null;

  /** Piece name condition. */
  private readonly _piece: string | null;

  /** Container index condition. */
  private readonly _container: number | null;

  /** State condition. */
  private readonly _state: number | null;

  /** Value condition. */
  private readonly _value: number | null;

  /** String extension to add onto Piece name. */
  private readonly _nameExtension: string;

  /**
   * @param roleType      Player whose index is to be matched.
   * @param piece         Base piece name to match.
   * @param container     Container index to match.
   * @param state         State to match.
   * @param value         Value to match.
   * @param nameExtension Text to add onto piece name.
   * @java PieceExtendName(RoleType, String, Integer, Integer, Integer, String)
   */
  constructor(
    roleType: RoleTypeFull | null,
    piece: string | null,
    container: number | null,
    state: number | null,
    value: number | null,
    nameExtension: string,
  ) {
    this._roleType = roleType;
    this._piece = piece;
    this._container = container;
    this._state = state;
    this._value = value;
    this._nameExtension = nameExtension;
  }

  /** @return RoleType condition to check. */
  roleType(): RoleTypeFull | null {
    return this._roleType;
  }

  /** @return State condition to check. */
  state(): number | null {
    return this._state;
  }

  /** @return Piece value condition to check. */
  value(): number | null {
    return this._value;
  }

  /** @return Piece name condition to check. */
  pieceName(): string | null {
    return this._piece;
  }

  /** @return Container index condition to check. */
  container(): number | null {
    return this._container;
  }

  /** @return String to add onto piece name. */
  nameExtension(): string {
    return this._nameExtension;
  }

  /** @java PieceExtendName.concepts(Game) */
  concepts(_game: unknown): unknown {
    return {};
  }

  /** @java PieceExtendName.gameFlags(Game) */
  gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java PieceExtendName.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}
