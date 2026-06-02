/**
 * @java game/equipment/other/Hints.java Hints
 *
 * Stores hint data for deduction puzzles: each record maps a set of site indices
 * to a hint value, with an optional SiteType (Cell/Vertex/Edge).
 *
 * @java game/equipment/other/Hints.java — constructor/where/values/getType
 */

import { Item1to1 } from "../Item1to1.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Mirrors Java's game.types.board.SiteType enum (only the values
 * actually used by Hints).
 */
export type SiteType = "Cell" | "Vertex" | "Edge";

/** A single hint record: a group of sites and the hint value for that group. */
export interface HintRecord1to1 {
  /** @java Hint.region() — site indices */
  readonly region: readonly number[];
  /** @java Hint.hint() */
  readonly hint: number;
}

export class Hints1to1 extends Item1to1 {
  /** @java Hints.where — per-record site arrays */
  private readonly _where: readonly (readonly number[])[] | null;
  /** @java Hints.values — per-record hint values */
  private readonly _values: readonly number[] | null;
  /** @java Hints.type — site type [Cell] */
  public readonly siteType: SiteType;

  /**
   * @java game/equipment/other/Hints.java constructor
   *
   * @param label   Optional name for these hints.
   * @param records Array of {region, hint} records (null → empty hints).
   * @param type    Site type [Cell].
   */
  public constructor(
    label: string | null,
    records: readonly HintRecord1to1[] | null,
    type: SiteType | null,
  ) {
    // @java Hints.java:50 — super(label, Constants.UNDEFINED, RoleType.Neutral)
    super(label, UNDEFINED, 0 /* Neutral */);

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
    this.siteType = (type === null) ? "Cell" : type;

    // @java Hints.java:68 — setType(ItemType.Hints)
    this.setType("Hints");
  }

  /** @java Hints.where() */
  public where(): readonly (readonly number[])[] | null { return this._where; }
  /** @java Hints.values() */
  public values(): readonly number[] | null { return this._values; }
  /** @java Hints.getType() */
  public getType(): SiteType { return this.siteType; }
}
