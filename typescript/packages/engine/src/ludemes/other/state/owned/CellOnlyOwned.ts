// @java Core/src/other/state/owned/CellOnlyOwned.java

import type { Owned, SiteTypeOwned, Location } from "./Owned.js";
import type { GameLikeForMapper } from "../OwnedIndexMapper.js";
import { OwnedIndexMapper } from "../OwnedIndexMapper.js";

/**
 * A Cell+level location.
 * Java: other.location.CellOnlyLocation
 */
export class CellOnlyLocation implements Location {
  constructor(private readonly site_: number, private readonly level_: number) {}
  site(): number { return this.site_; }
  level(): number { return this.level_; }
  siteType(): SiteTypeOwned { return "Cell"; }
}

/**
 * A version of Owned for games that only use Cell (with levels / stacking).
 * Faithful 1:1 port of CellOnlyOwned.java.
 *
 * @author Dennis Soemers (Java), ported to TS
 */
export class CellOnlyOwned implements Owned {
  /** Java: protected final List<CellOnlyLocation>[][] locations */
  protected readonly locations: CellOnlyLocation[][][];

  protected readonly indexMapper: OwnedIndexMapper;

  constructor(game: GameLikeForMapper);
  constructor(other: CellOnlyOwned);
  constructor(gameOrOther: GameLikeForMapper | CellOnlyOwned) {
    if (gameOrOther instanceof CellOnlyOwned) {
      const other = gameOrOther;
      this.indexMapper = other.indexMapper;
      this.locations = other.locations.map((pl) => pl.map((cl) => [...cl]));
    } else {
      const game = gameOrOther;
      this.indexMapper = new OwnedIndexMapper(game);
      const numPlayers = game.players().size();
      this.locations = [];
      for (let p = 0; p <= numPlayers; p++) {
        const numValid = this.indexMapper.numValidIndices(p);
        this.locations.push(Array.from({ length: numValid }, () => []));
      }
    }
  }

  copy(): CellOnlyOwned { return new CellOnlyOwned(this); }
  mapCompIndex(p: number, c: number): number { return this.indexMapper.compIndex(p, c); }
  reverseMap(p: number, m: number): number { return this.indexMapper.reverseMap_(p, m); }

  levels(playerId: number, componentId: number, site: number): number[] {
    const mi = this.indexMapper.compIndex(playerId, componentId);
    if (mi < 0) return [];
    return this.locations[playerId]![mi]!.filter((l) => l.site() === site).map((l) => l.level());
  }

  sites(playerId: number, componentId?: number): number[] {
    if (componentId !== undefined) {
      const mi = this.indexMapper.compIndex(playerId, componentId);
      if (mi < 0) return [];
      return [...new Set(this.locations[playerId]![mi]!.map((l) => l.site()))];
    }
    const s = new Set<number>();
    for (const cl of this.locations[playerId] ?? []) for (const l of cl) s.add(l.site());
    return [...s];
  }

  sitesOnTop(playerId: number): number[] { return this.sites(playerId); }
  positions(playerId: number, componentId: number): CellOnlyLocation[] {
    const mi = this.indexMapper.compIndex(playerId, componentId);
    if (mi < 0) return [];
    return [...this.locations[playerId]![mi]!];
  }
  positionsAll(playerId: number): CellOnlyLocation[][] {
    return (this.locations[playerId] ?? []).map((a) => [...a]);
  }

  remove(playerId: number, componentId: number, pieceLoc: number, levelOrType: number | SiteTypeOwned, _type?: SiteTypeOwned): void {
    const mi = this.indexMapper.compIndex(playerId, componentId);
    if (mi < 0) return;
    const arr = this.locations[playerId]![mi]!;
    if (typeof levelOrType === "number") {
      const idx = arr.findIndex((l) => l.site() === pieceLoc && l.level() === levelOrType);
      if (idx >= 0) arr.splice(idx, 1);
    } else {
      const idx = arr.findIndex((l) => l.site() === pieceLoc);
      if (idx >= 0) arr.splice(idx, 1);
    }
  }

  removeNoUpdate(playerId: number, componentId: number, pieceLoc: number, level: number, _type: SiteTypeOwned): void {
    this.remove(playerId, componentId, pieceLoc, level);
  }

  add(playerId: number, componentId: number, pieceLoc: number, levelOrType: number | SiteTypeOwned, _type?: SiteTypeOwned): void {
    const mi = this.indexMapper.compIndex(playerId, componentId);
    if (mi < 0) return;
    const level = typeof levelOrType === "number" ? levelOrType : 0;
    this.locations[playerId]![mi]!.push(new CellOnlyLocation(pieceLoc, level));
  }
}
