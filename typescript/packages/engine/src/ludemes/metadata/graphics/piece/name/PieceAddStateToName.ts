/**
 * PieceAddStateToName.ts
 *
 * @java metadata/graphics/piece/name/PieceAddStateToName.java
 *
 * Indicates whether the local state value of a piece should be added to its name.
 * @author Matthew.Stephenson
 *
 * @remarks This ludeme is used for finding and displaying the correct piece image
 *          for components (e.g. for the game Chopsticks).
 */

import type { RoleTypeFull } from "../../../../game/types/play/RoleType.js";
import type { GraphicsItem } from "../../GraphicsItem.js";

/**
 * @java metadata/graphics/piece/name/PieceAddStateToName.java — class PieceAddStateToName implements GraphicsItem
 */
export class PieceAddStateToName implements GraphicsItem {
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

  /**
   * @param roleType  Player whose index is to be matched.
   * @param piece     Base piece name to match.
   * @param container Container index to match.
   * @param state     State to match.
   * @param value     Value to match.
   * @java PieceAddStateToName(RoleType, String, Integer, Integer, Integer)
   */
  constructor(
    roleType: RoleTypeFull | null,
    piece: string | null,
    container: number | null,
    state: number | null,
    value: number | null,
  ) {
    this._roleType = roleType;
    this._piece = piece;
    this._container = container;
    this._state = state;
    this._value = value;
  }

  /** @return State condition to check. */
  state(): number | null {
    return this._state;
  }

  /** @return Piece value condition to check. */
  value(): number | null {
    return this._value;
  }

  /** @return RoleType condition to check. */
  roleType(): RoleTypeFull | null {
    return this._roleType;
  }

  /** @return Piece name condition to check. */
  pieceName(): string | null {
    return this._piece;
  }

  /** @return Container index condition to check. */
  container(): number | null {
    return this._container;
  }

  /** @java PieceAddStateToName.concepts(Game) */
  concepts(_game: unknown): unknown {
    return {};
  }

  /** @java PieceAddStateToName.gameFlags(Game) */
  gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java PieceAddStateToName.needRedraw() */
  needRedraw(): boolean {
    return false;
  }
}
