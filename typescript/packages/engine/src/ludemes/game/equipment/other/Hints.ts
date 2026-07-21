/**
 * @java game/equipment/other/Hints.java Hints
 *
 * Stores hint data for deduction puzzles: each record maps a set of site indices
 * to a hint value, with an optional SiteType (Cell/Vertex/Edge).
 *
 * @java game/equipment/other/Hints.java — constructor/where/values/getType
 */

import { Item, type RoleType, type GameLike } from "../Item.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Mirrors Java's game.types.board.SiteType enum (only the values
 * actually used by Hints).
 * @java game.types.board.SiteType
 */
export type SiteType = "Cell" | "Vertex" | "Edge";

/**
 * A single hint record: a group of sites and the hint value for that group.
 * Mirrors Java's game.util.equipment.Hint.
 * @java game.util.equipment.Hint
 */
export interface HintRecord {
  /** @java Hint.region() — site indices */
  readonly region: readonly number[];
  /** @java Hint.hint() */
  readonly hint: number;
}

export class Hints extends Item {
  /** @java Hints.where — per-record site arrays */
  private readonly _where: number[][] | null;

  /** @java Hints.values — per-record hint values */
  private readonly _values: number[] | null;

  /** @java Hints.type — site type [Cell] */
  private readonly _siteType: SiteType;

  /**
   * @java game/equipment/other/Hints.java constructor
   *
   * @param label   Optional name for these hints.
   * @param records Array of HintRecord entries (null → null where/values).
   * @param type    Site type [Cell].
   */
  public constructor(
    label: string | null,
    records: readonly HintRecord[] | null,
    type: SiteType | null,
  ) {
    // @java Hints.java:50 — super(label, Constants.UNDEFINED, RoleType.Neutral)
    super(label, UNDEFINED, "Neutral" as RoleType);

    if (records === null) {
      // @java Hints.java:53–54
      this._values = null;
      this._where  = null;
    } else {
      // @java Hints.java:56–65
      this._values = records.map(r => r.hint);
      this._where  = records.map(r => [...r.region]);
    }

    // @java Hints.java:67 — this.type = (type == null) ? SiteType.Cell : type
    this._siteType = (type === null) ? "Cell" : type;

    // @java Hints.java:68 — setType(ItemType.Hints)
    this.setType("Hints");
  }

  /**
   * @java Hints.where()
   * @returns Per-record site index arrays, or null if no records given.
   */
  public where(): number[][] | null {
    return this._where;
  }

  /**
   * @java Hints.values()
   * @returns Per-record hint values, or null if no records given.
   */
  public values(): number[] | null {
    return this._values;
  }

  /**
   * @java Hints.getType()
   * @returns The SiteType for this hints set.
   */
  public getType(): SiteType {
    return this._siteType;
  }

  /**
   * @java Hints.willCrash(Game)
   * Returns true and reports an error if the game doesn't have exactly 1 player.
   */
  public willCrash(game: GameLike & { addCrashToReport?: (msg: string) => void }): boolean {
    let willCrash = false;
    if (game.players().count() !== 1) {
      game.addCrashToReport?.("The ludeme (hints ...) is used but the number of players is not 1.");
      willCrash = true;
    }
    return willCrash;
  }
}
