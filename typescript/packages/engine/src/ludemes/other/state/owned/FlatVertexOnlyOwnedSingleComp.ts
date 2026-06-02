// @java Core/src/other/state/owned/FlatVertexOnlyOwnedSingleComp.java

import type { Owned, SiteTypeOwned, Location } from "./Owned.js";
import type { GameLikeForMapper } from "../OwnedIndexMapper.js";
import { OwnedIndexMapper } from "../OwnedIndexMapper.js";
import { FlatVertexOnlyLocation } from "./FlatVertexOnlyOwned.js";

/**
 * A version of Owned for games that only use Vertices, no levels, and at most
 * one component ID per player.
 * Faithful 1:1 port of FlatVertexOnlyOwnedSingleComp.java.
 *
 * Java: PlayerId --> Sites (no component-ID dimension)
 *
 * @author Dennis Soemers (Java), ported to TS
 */
export class FlatVertexOnlyOwnedSingleComp implements Owned {
  /** Java: protected final FastTIntArrayList[] locations */
  protected readonly locations: number[][];

  protected readonly indexMapper: OwnedIndexMapper;

  constructor(game: GameLikeForMapper);
  constructor(other: FlatVertexOnlyOwnedSingleComp);
  constructor(gameOrOther: GameLikeForMapper | FlatVertexOnlyOwnedSingleComp) {
    if (gameOrOther instanceof FlatVertexOnlyOwnedSingleComp) {
      const other = gameOrOther;
      this.indexMapper = other.indexMapper;
      this.locations = other.locations.map((arr) => [...arr]);
    } else {
      const game = gameOrOther;
      this.indexMapper = new OwnedIndexMapper(game);
      const numPlayers = game.players().size();
      this.locations = Array.from({ length: numPlayers + 1 }, () => []);
    }
  }

  copy(): FlatVertexOnlyOwnedSingleComp { return new FlatVertexOnlyOwnedSingleComp(this); }
  mapCompIndex(p: number, c: number): number { return this.indexMapper.compIndex(p, c); }
  reverseMap(p: number, m: number): number { return this.indexMapper.reverseMap_(p, m); }
  levels(_p: number, _c: number, _site: number): number[] { return [0]; }

  sites(playerId: number, _componentId?: number): number[] {
    return [...this.locations[playerId]!];
  }

  sitesOnTop(playerId: number): number[] { return this.sites(playerId); }

  positions(playerId: number, _componentId: number): FlatVertexOnlyLocation[] {
    return this.locations[playerId]!.map((s) => new FlatVertexOnlyLocation(s));
  }

  positionsAll(playerId: number): FlatVertexOnlyLocation[][] {
    return [this.positions(playerId, 0)];
  }

  remove(playerId: number, _componentId: number, pieceLoc: number, _levelOrType?: number | SiteTypeOwned, _type?: SiteTypeOwned): void {
    const arr = this.locations[playerId]!;
    const idx = arr.indexOf(pieceLoc);
    if (idx >= 0) arr.splice(idx, 1);
  }

  removeNoUpdate(playerId: number, componentId: number, pieceLoc: number, _level: number, _type: SiteTypeOwned): void {
    this.remove(playerId, componentId, pieceLoc);
  }

  add(playerId: number, _componentId: number, pieceLoc: number, _levelOrType?: number | SiteTypeOwned, _type?: SiteTypeOwned): void {
    this.locations[playerId]!.push(pieceLoc);
  }
}
