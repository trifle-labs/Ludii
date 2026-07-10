/**
 * @java game/equipment/Item.java Item
 *
 * Abstract base class for all equipment items (boards, components, hands, maps, hints, etc.).
 * Provides name, index, owner (RoleType), ownerID, and ItemType bookkeeping.
 *
 * @java game/equipment/Item.java — name/index/owner/ownerID/type/create
 */

// Java Constants.UNDEFINED = -1
const UNDEFINED = -1;

/**
 * Mirrors Java's other.ItemType enum (only the values used in equipment).
 * @java other.ItemType
 */
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

/**
 * Mirrors Java's game.types.play.RoleType enum values used in equipment.
 * @java game.types.play.RoleType
 */
export type RoleType =
  | "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | "P8"
  | "P9" | "P10" | "P11" | "P12" | "P13" | "P14" | "P15" | "P16"
  | "Neutral"
  | "Shared"
  | "All"
  | "Enemy"
  | "Team"
  // @java game.types.play.RoleType — player-set / relative roles (owner() = NOBODY = 0,
  // resolved per-context; Each is the workhorse for per-player piece definitions).
  | "Each"
  | "Mover"
  | "Next"
  | "Prev"
  | "NonMover"
  | "Friend"
  | "Ally"
  | "TeamMover";

/**
 * Returns the numeric owner ID for a given RoleType.
 * Mirrors Java's RoleType.owner() method.
 * @java game.types.play.RoleType.owner()
 */
export function roleOwner(role: RoleType): number {
  // @java RoleType.PN.owner() == N for every concrete player role P1..P16
  // (Constants.MAX_PLAYERS). The old switch stopped at P8, so a 16-handed
  // game's Disc9..Disc16 (Pagade Kayi Ata, Shing Quon Tu) resolved to
  // UNDEFINED and the "component DiscN is not defined" start rule threw.
  const playerMatch = /^P(\d+)$/.exec(role);
  if (playerMatch) return Number(playerMatch[1]);
  switch (role) {
    case "Neutral": return 0;
    case "Each":    return 0; // @java RoleType.Each.owner() = Constants.NOBODY (0)
    case "Shared":  return -1; // RoleType.Shared.owner() in Java returns numPlayers+1 after create()
    case "All":     return -1;
    default:        return UNDEFINED;
  }
}

/**
 * Minimal game interface needed by Item.create().
 * @java game.Game — players().count()
 */
export interface GameLike {
  players(): { count(): number };
}

/**
 * Abstract base for all equipment items.
 * @java game.equipment.Item
 */
export abstract class Item {
  /** @java Item.owner — the RoleType owner */
  private _role: RoleType;

  /** @java Item.type */
  private _type: ItemType | null;

  /** @java Item.index — unique index in the item list; -1 = unset */
  private _index: number;

  /** @java Item.name — unique name within the game */
  private _name: string | null;

  /** @java Item.ownerID — numeric ID of owner, resolved by create() */
  private _ownerID: number;

  /**
   * @java game/equipment/Item.java constructor(String, int, RoleType)
   *
   * @param name  The name of the item.
   * @param index The index of the item.
   * @param owner The owner role of the item.
   */
  protected constructor(name: string | null, index: number, owner: RoleType) {
    this._name    = name;
    this._index   = index;
    this._role    = owner;
    this._type    = null;
    this._ownerID = UNDEFINED;
  }

  /**
   * @java Item.index()
   * @returns Unique index in master game object's list of equipment.
   */
  public index(): number {
    return this._index;
  }

  /**
   * @java Item.setIndex(int)
   * @param id The new index.
   */
  public setIndex(id: number): void {
    this._index = id;
  }

  /**
   * @java Item.role()
   * @returns The RoleType owner.
   */
  public role(): RoleType {
    return this._role;
  }

  /**
   * @java Item.setRole(RoleType)
   * @param role The new role.
   */
  public setRole(role: RoleType): void {
    this._role = role;
  }

  /**
   * @java Item.setRoleFromPlayerId(int)
   * Sets the role from a numeric player ID.
   * @param pid 1-based player id.
   */
  public setRoleFromPlayerId(pid: number): void {
    // @java Item.setRoleFromPlayerId — owner = RoleType.roleForPlayerId(pid),
    // which maps 1..MAX_PLAYERS (16) to P1..P16 and anything else to Neutral.
    // The old literal map stopped at P8, so (piece "Disc" Each) in a 16-handed
    // game left Disc9..Disc16 as Neutral (owner 0) and their DiscN names never
    // existed (Pagade Kayi Ata (Sixteen-handed), Shing Quon Tu).
    this._role = pid >= 1 && pid <= 16 ? (`P${pid}` as RoleType) : "Neutral";
  }

  /**
   * @java Item.owner()
   * @returns The numeric owner ID (resolved after create()).
   */
  public owner(): number {
    return this._ownerID;
  }

  /**
   * @java Item.create(Game)
   * Makes sure this item is fully created: resolves ownerID from role.
   * @param game The game.
   */
  public create(game: GameLike): void {
    // @java Item.java:130–133
    if (this._role === "Shared" || this._role === "All") {
      this._ownerID = game.players().count() + 1;
    } else {
      this._ownerID = roleOwner(this._role);
    }
  }

  /**
   * @java Item.name()
   * @returns Unique name within game.
   */
  public name(): string | null {
    return this._name;
  }

  /**
   * @java Item.setName(String)
   * @param name The new name.
   */
  public setName(name: string): void {
    this._name = name;
  }

  /**
   * @java Item.type()
   * @returns The ItemType.
   */
  public type(): ItemType | null {
    return this._type;
  }

  /**
   * @java Item.setType(ItemType)
   * @param type The ItemType.
   */
  public setType(type: ItemType): void {
    this._type = type;
  }

  /**
   * @java Item.gameFlags(Game)
   * @returns Accumulated flags for ludeme (0 by default).
   */
  public gameFlags(_game: GameLike): bigint {
    return 0n;
  }

  /**
   * @java Item.credit()
   * @returns Credit details for images and other resources, else null.
   */
  public credit(): string | null {
    return null;
  }
}
