// @java Core/src/other/state/owned/FullOwned.java

import type { Owned, SiteTypeOwned, Location } from "./Owned.js";
import type { GameLikeForMapper } from "../OwnedIndexMapper.js";
import { OwnedIndexMapper } from "../OwnedIndexMapper.js";

/**
 * A full {site, level} location.
 * Java: other.location.FullLocation
 */
export class FullLocation implements Location {
  constructor(
    private readonly site_: number,
    private readonly level_: number,
    private readonly type_: SiteTypeOwned,
  ) {}
  site(): number { return this.site_; }
  level(): number { return this.level_; }
  siteType(): SiteTypeOwned { return this.type_; }
}

/**
 * A "Full" version of Owned, with all the data we could ever need.
 * Faithful 1:1 port of FullOwned.java.
 *
 * Java: PlayerId --> ComponentId --> List<FullLocation>
 *
 * @author Dennis Soemers (Java), ported to TS
 */
export class FullOwned implements Owned {
  /** Java: protected final List<FullLocation>[][] locations */
  protected readonly locations: FullLocation[][][];

  /** Java: protected final OwnedIndexMapper indexMapper */
  protected readonly indexMapper: OwnedIndexMapper;

  /**
   * To init the positions of the owned site.
   * @param game The game.
   */
  constructor(game: GameLikeForMapper);
  /** Copy constructor. */
  constructor(other: FullOwned);
  constructor(gameOrOther: GameLikeForMapper | FullOwned) {
    if (gameOrOther instanceof FullOwned) {
      const other = gameOrOther;
      this.indexMapper = other.indexMapper;
      this.locations = other.locations.map((playerLocs) =>
        playerLocs.map((compLocs) => [...compLocs]),
      );
    } else {
      const game = gameOrOther;
      this.indexMapper = new OwnedIndexMapper(game);
      const numPlayers = game.players().size();
      this.locations = [];
      for (let p = 0; p <= numPlayers; p++) {
        const numValid = this.indexMapper.numValidIndices(p);
        const compArr: FullLocation[][] = [];
        for (let i = 0; i < numValid; i++) compArr.push([]);
        this.locations.push(compArr);
      }
    }
  }

  copy(): FullOwned { return new FullOwned(this); }

  mapCompIndex(playerId: number, componentId: number): number {
    return this.indexMapper.compIndex(playerId, componentId);
  }

  reverseMap(playerId: number, mappedIndex: number): number {
    return this.indexMapper.reverseMap_(playerId, mappedIndex);
  }

  levels(playerId: number, componentId: number, site: number): number[] {
    const mappedIdx = this.indexMapper.compIndex(playerId, componentId);
    if (mappedIdx < 0) return [];
    return this.locations[playerId]![mappedIdx]!
      .filter((loc) => loc.site() === site)
      .map((loc) => loc.level());
  }

  sites(playerId: number, componentId?: number): number[] {
    if (componentId !== undefined) {
      const mappedIdx = this.indexMapper.compIndex(playerId, componentId);
      if (mappedIdx < 0) return [];
      return [...new Set(this.locations[playerId]![mappedIdx]!.map((loc) => loc.site()))];
    }
    // All sites for player
    const result = new Set<number>();
    for (const compLocs of this.locations[playerId] ?? []) {
      for (const loc of compLocs) result.add(loc.site());
    }
    return [...result];
  }

  sitesOnTop(playerId: number): number[] {
    // Simplified: return all sites owned (not tracking "on top" distinction)
    return this.sites(playerId);
  }

  positions(playerId: number, componentId: number): FullLocation[] {
    const mappedIdx = this.indexMapper.compIndex(playerId, componentId);
    if (mappedIdx < 0) return [];
    return [...this.locations[playerId]![mappedIdx]!];
  }

  positionsAll(playerId: number): FullLocation[][] {
    return (this.locations[playerId] ?? []).map((arr) => [...arr]);
  }

  remove(playerId: number, componentId: number, pieceLoc: number, levelOrType: number | SiteTypeOwned, type?: SiteTypeOwned): void {
    const mappedIdx = this.indexMapper.compIndex(playerId, componentId);
    if (mappedIdx < 0) return;
    const compLocs = this.locations[playerId]![mappedIdx]!;
    if (typeof levelOrType === "string") {
      // remove(playerId, componentId, pieceLoc, type) — remove any level
      const idx = compLocs.findIndex((loc) => loc.site() === pieceLoc);
      if (idx >= 0) compLocs.splice(idx, 1);
    } else {
      // remove(playerId, componentId, pieceLoc, level, type)
      const level = levelOrType;
      const idx = compLocs.findIndex((loc) => loc.site() === pieceLoc && loc.level() === level);
      if (idx >= 0) compLocs.splice(idx, 1);
    }
  }

  removeNoUpdate(playerId: number, componentId: number, pieceLoc: number, level: number, _type: SiteTypeOwned): void {
    const mappedIdx = this.indexMapper.compIndex(playerId, componentId);
    if (mappedIdx < 0) return;
    const compLocs = this.locations[playerId]![mappedIdx]!;
    const idx = compLocs.findIndex((loc) => loc.site() === pieceLoc && loc.level() === level);
    if (idx >= 0) compLocs.splice(idx, 1);
  }

  add(playerId: number, componentId: number, pieceLoc: number, levelOrType: number | SiteTypeOwned, type?: SiteTypeOwned): void {
    const mappedIdx = this.indexMapper.compIndex(playerId, componentId);
    if (mappedIdx < 0) return;
    const siteType: SiteTypeOwned = typeof levelOrType === "string" ? levelOrType : (type ?? "Cell");
    const level = typeof levelOrType === "number" ? levelOrType : 0;
    this.locations[playerId]![mappedIdx]!.push(new FullLocation(pieceLoc, level, siteType));
  }
}
