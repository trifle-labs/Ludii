// @java Core/src/metadata/graphics/others/StackType.java StackType
/**
 * Java parity:
 * - Core/src/metadata/graphics/others/StackType.java — faithful data-class port.
 *   Sets the stack design for a container.
 *   Different stack types are defined in PieceStackType.
 *   For games such as Snakes and Ladders, Backgammon, Tower of Hanoi, card games, etc.
 */

import type { SiteType } from "../../../../action/site-type.js";
import type { RoleTypeFull } from "../../../game/types/play/RoleType.js";
import type { PieceStackType } from "../util/PieceStackType.js";

export class StackType {
  private readonly _roleType: RoleTypeFull | null;
  private readonly _name: string | null;
  private readonly _index: number | null;
  private readonly _graphElementType: SiteType | null;
  private readonly _sites: number[] | null;
  private readonly _state: number | null;
  private readonly _value: number | null;
  private readonly _stackType: PieceStackType;
  private readonly _scale: number;
  private readonly _limit: number;

  /**
   * @param roleType         Player whose index to match.
   * @param name             Container name to match.
   * @param index            Container index to match.
   * @param graphElementType The GraphElementType for the specified sites [Cell].
   * @param sites            Draw image on all specified sites.
   * @param state            Local state to match.
   * @param value            Piece value to match.
   * @param stackType        Stack type for this piece.
   * @param scale            Scaling factor [1.0].
   * @param limit            Stack limit [5].
   */
  constructor(
    roleType: RoleTypeFull | null,
    name: string | null,
    index: number | null,
    graphElementType: SiteType | null,
    sites: number[] | null,
    state: number | null,
    value: number | null,
    stackType: PieceStackType,
    scale: number | null,
    limit: number | null,
  ) {
    this._roleType = roleType;
    this._name = name;
    this._index = index;
    this._graphElementType = graphElementType;
    this._sites = sites;
    this._state = state;
    this._value = value;
    this._stackType = stackType;
    this._scale = scale == null ? 1.0 : scale;
    this._limit = limit == null ? 5 : limit;
  }

  public roleType(): RoleTypeFull | null { return this._roleType; }
  public name(): string | null { return this._name; }
  public index(): number | null { return this._index; }
  public graphElementType(): SiteType | null { return this._graphElementType; }
  public sites(): number[] | null { return this._sites; }
  public state(): number | null { return this._state; }
  public value(): number | null { return this._value; }
  public stackType(): PieceStackType { return this._stackType; }
  public scale(): number { return this._scale; }
  public limit(): number { return this._limit; }

  public needRedraw(): boolean { return false; }
}
