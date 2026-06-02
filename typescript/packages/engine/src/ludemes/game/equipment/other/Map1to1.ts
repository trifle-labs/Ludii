/**
 * @java game/equipment/other/Map.java Map
 *
 * Stores a computed int→int lookup table for a game (e.g. "Entry" maps
 * player id → starting board position). The map is populated by
 * computeMap() (which in Java resolves coordinate strings to site indices).
 *
 * In the 1:1 TS port, computeMap() is not wired to the Java topology (that
 * remains in the legacy compiler path). Instead, Map1to1 exposes a simple
 * put/get interface plus a pre-populated constructor for the compiled path.
 *
 * @java game/equipment/other/Map.java — constructor/to/map/computeMap
 */

import { Item1to1 } from "../Item1to1.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

export class Map1to1 extends Item1to1 {
  /** @java Map.map — the actual int→int table */
  private readonly _map: Map<number, number>;

  /**
   * Construct with a pre-resolved key→value mapping.
   *
   * @param name    Optional name ["Map"].
   * @param entries Pre-resolved key→value pairs.
   */
  public constructor(
    name: string | null,
    entries: ReadonlyMap<number, number> = new Map(),
  ) {
    // @java Map.java:60 — super(name == null ? "Map" : name, Constants.UNDEFINED, RoleType.Neutral)
    super(name ?? "Map", UNDEFINED, 0 /* Neutral */);
    this._map = new Map(entries);
    // @java Map.java:63 — setType(ItemType.Map)
    this.setType("Map");
  }

  /**
   * @java Map.to(int key) — returns mapped value, or map's noEntryValue if absent.
   *
   * Java uses TIntIntHashMap whose noEntryValue() is 0 by default (NOT -1).
   * We mirror that: missing keys return 0.
   */
  public to(key: number): number {
    // @java Map.java:116 — return map.get(key)
    return this._map.get(key) ?? 0;
  }

  /**
   * @java Map.noEntryValue() — the value returned for absent keys [0].
   */
  public noEntryValue(): number { return 0; }

  /**
   * Add a key→value pair to the map.
   * Used during game compilation once coordinates are resolved.
   */
  public put(key: number, value: number): void {
    this._map.set(key, value);
  }

  /**
   * @java Map.map() — returns the underlying TIntIntHashMap.
   * Here returns the TS Map for iteration.
   */
  public map(): ReadonlyMap<number, number> { return this._map; }
}
