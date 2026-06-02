/**
 * @java game/equipment/Item.java Item
 *
 * Abstract base for all equipment items (Board, Component, Hand, Map, Hints, etc.).
 * Provides name, index, owner, and item-type bookkeeping.
 *
 * @java game/equipment/Item.java — name/index/owner/setType
 */

/** Mirrors Java's other.ItemType enum (only the values used in equipment). */
export type ItemType =
  | "Component"
  | "Map"
  | "Hints"
  | "Regions"
  | "Dominoes"
  | "Dice"
  | "Hand"
  | "Container"
  | "Board";

export abstract class Item1to1 {
  /** @java Item.name */
  private _name: string | null;
  /** @java Item.index — 1-based index in the game's item list; -1 = unset */
  private _index: number;
  /** @java Item.owner — 1-based player id; 0 = Neutral/Shared */
  private _owner: number;
  /** @java Item.type */
  private _type: ItemType | null;

  /** @java Item(String, int, RoleType) */
  protected constructor(name: string | null, index: number, owner: number) {
    this._name  = name;
    this._index = index;
    this._owner = owner;
    this._type  = null;
  }

  /** @java Item.name() */
  public name(): string | null { return this._name; }

  /** @java Item.setName(String) */
  public setName(n: string): void { this._name = n; }

  /** @java Item.index() */
  public index(): number { return this._index; }

  /** @java Item.setIndex(int) */
  public setIndex(id: number): void { this._index = id; }

  /** @java Item.owner() — numeric player id */
  public owner(): number { return this._owner; }

  /**
   * @java Item.type()
   */
  public type(): ItemType | null { return this._type; }

  /** @java Item.setType(ItemType) */
  protected setType(t: ItemType): void { this._type = t; }
}
