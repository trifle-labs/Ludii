/**
 * @java game/equipment/component/Piece.java Piece
 *
 * A game piece: has a name, an owner (1-based player), and a component index.
 *
 * Java parity: Component (superclass) has `name`, `owner`, and `index` fields.
 * `index` is 1-based and assigned by Equipment when components are registered.
 *
 * @java game/equipment/component/Component.java — name/owner/index
 */

export class Piece {
  /** The piece name (e.g. "Disc", "Cross"). @java Component.name */
  public readonly name: string;
  /** 1-based owner player id. 0 = Neutral. @java Component.owner */
  public readonly owner: number;
  /**
   * 1-based component index assigned by Equipment.
   * @java Component.index (set by Equipment.create)
   */
  public index: number;

  /**
   * @java game/equipment/component/Piece.java — constructor
   *
   * @param name  Piece label (e.g. "Disc")
   * @param owner 1-based player owner (0 = Neutral)
   * @param index 1-based component index (set by Equipment)
   */
  public constructor(name: string, owner: number, index = 0) {
    this.name = name;
    this.owner = owner;
    this.index = index;
  }
}
