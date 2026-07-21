// @java Core/src/other/state/owned/Owned.java

/**
 * Interface for objects that can quickly tell us which locations contain
 * pieces (of certain types) for certain players.
 * Faithful 1:1 port of Owned.java.
 *
 * @author Eric.Piette and Dennis Soemers (Java), ported to TS
 */

export type SiteTypeOwned = "Cell" | "Edge" | "Vertex";

/** Minimal Location interface. */
export interface Location {
  site(): number;
  level(): number;
  siteType(): SiteTypeOwned;
}

export interface Owned {
  /** @returns A deep copy of this Owned object. */
  copy(): Owned;

  /**
   * @returns Mapped index that this Owned object would use instead of componentId (for given player)
   * Java: public int mapCompIndex(final int playerId, final int componentId)
   */
  mapCompIndex(playerId: number, componentId: number): number;

  /**
   * @returns Reverses a given mapped index back into a component ID.
   * Java: public int reverseMap(final int playerId, final int mappedIndex)
   */
  reverseMap(playerId: number, mappedIndex: number): number;

  /**
   * All the levels on the site owned by the playerId with the componentId.
   * Java: public TIntArrayList levels(final int playerId, final int componentId, final int site)
   */
  levels(playerId: number, componentId: number, site: number): number[];

  /**
   * All the sites with at least one specific component owned by the player.
   * Java: public TIntArrayList sites(final int playerId, final int componentId)
   */
  sites(playerId: number, componentId: number): number[];

  /**
   * All the sites with at least one component owned by the player.
   * Java: public TIntArrayList sites(final int playerId)
   */
  sites(playerId: number): number[];

  /**
   * All the sites owned by a player, only if the top component is owned by him.
   * Java: public TIntArrayList sitesOnTop(final int playerId)
   */
  sitesOnTop(playerId: number): number[];

  /**
   * All the positions owned by the playerId with the componentId.
   * Java: public List<? extends Location> positions(final int playerId, final int componentId)
   */
  positions(playerId: number, componentId: number): Location[];

  /**
   * All the positions of all the components owned by the player.
   * Java: public List<? extends Location>[] positions(final int playerId)
   */
  positionsAll(playerId: number): Location[][];

  /** Remove a loc (at any level) for a player and a specific component. */
  remove(playerId: number, componentId: number, pieceLoc: number, type: SiteTypeOwned): void;

  /** Remove a loc at a specific level for a player and a specific component. */
  remove(playerId: number, componentId: number, pieceLoc: number, level: number, type: SiteTypeOwned): void;

  /** Remove without decrementing higher levels. */
  removeNoUpdate(playerId: number, componentId: number, pieceLoc: number, level: number, type: SiteTypeOwned): void;

  /** Add a loc for a player with a component (at level 0). */
  add(playerId: number, componentId: number, pieceLoc: number, type: SiteTypeOwned): void;

  /** Add a loc for a player with a component at a specific level. */
  add(playerId: number, componentId: number, pieceLoc: number, level: number, type: SiteTypeOwned): void;
}
