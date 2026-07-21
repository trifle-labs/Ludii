// @java Core/src/other/state/owned/FlatCellOnlyOwned.java

import type { Owned, SiteTypeOwned, Location } from "./Owned.js";
import type { GameLikeForMapper } from "../OwnedIndexMapper.js";
import { OwnedIndexMapper } from "../OwnedIndexMapper.js";

/**
 * A flat Cell location (no levels).
 * Java: other.location.FlatCellOnlyLocation
 */
export class FlatCellOnlyLocation implements Location {
  constructor(private readonly site_: number) {}
  site(): number { return this.site_; }
  level(): number { return 0; }
  siteType(): SiteTypeOwned { return "Cell"; }
}

/**
 * A version of Owned for games that only use Cells and no levels.
 * Faithful 1:1 port of FlatCellOnlyOwned.java.
 *
 * @author Dennis Soemers (Java), ported to TS
 */
export class FlatCellOnlyOwned implements Owned {
  /** Java: protected final FastTIntArrayList[][] locations */
  protected readonly locations: number[][][];

  protected readonly indexMapper: OwnedIndexMapper;

  constructor(game: GameLikeForMapper);
  constructor(other: FlatCellOnlyOwned);
  constructor(gameOrOther: GameLikeForMapper | FlatCellOnlyOwned) {
    if (gameOrOther instanceof FlatCellOnlyOwned) {
      const other = gameOrOther;
      this.indexMapper = other.indexMapper;
      this.locations = other.locations.map((pl) => pl.map((cl) => [...cl]));
    } else {
      const game = gameOrOther;
      this.indexMapper = new OwnedIndexMapper(game);
      const numPlayers = game.players().size();
      this.locations = [];
      for (let p = 0; p < numPlayers + 1; p++) {
        const numValid = this.indexMapper.numValidIndices(p);
        this.locations.push(Array.from({ length: numValid }, () => []));
      }
    }
  }

  copy(): FlatCellOnlyOwned { return new FlatCellOnlyOwned(this); }
  mapCompIndex(p: number, c: number): number { return this.indexMapper.compIndex(p, c); }
  reverseMap(p: number, m: number): number { return this.indexMapper.reverseMap_(p, m); }

  levels(_playerId: number, _componentId: number, _site: number): number[] { return [0]; }

  sites(playerId: number, componentId?: number): number[] {
    if (componentId !== undefined) {
      const mi = this.indexMapper.compIndex(playerId, componentId);
      if (mi < 0) return [];
      return [...this.locations[playerId]![mi]!];
    }
    const s = new Set<number>();
    for (const cl of this.locations[playerId] ?? []) for (const site of cl) s.add(site);
    return [...s];
  }

  sitesOnTop(playerId: number): number[] { return this.sites(playerId); }

  positions(playerId: number, componentId: number): FlatCellOnlyLocation[] {
    const mi = this.indexMapper.compIndex(playerId, componentId);
    if (mi < 0) return [];
    return this.locations[playerId]![mi]!.map((s) => new FlatCellOnlyLocation(s));
  }

  positionsAll(playerId: number): FlatCellOnlyLocation[][] {
    return (this.locations[playerId] ?? []).map((arr) => arr.map((s) => new FlatCellOnlyLocation(s)));
  }

  remove(playerId: number, componentId: number, pieceLoc: number, _levelOrType?: number | SiteTypeOwned, _type?: SiteTypeOwned): void {
    const mi = this.indexMapper.compIndex(playerId, componentId);
    if (mi < 0) return;
    const arr = this.locations[playerId]![mi]!;
    const idx = arr.indexOf(pieceLoc);
    if (idx >= 0) arr.splice(idx, 1);
  }

  removeNoUpdate(playerId: number, componentId: number, pieceLoc: number, _level: number, _type: SiteTypeOwned): void {
    this.remove(playerId, componentId, pieceLoc);
  }

  add(playerId: number, componentId: number, pieceLoc: number, _levelOrType?: number | SiteTypeOwned, _type?: SiteTypeOwned): void {
    const mi = this.indexMapper.compIndex(playerId, componentId);
    if (mi < 0) return;
    this.locations[playerId]![mi]!.push(pieceLoc);
  }
}
