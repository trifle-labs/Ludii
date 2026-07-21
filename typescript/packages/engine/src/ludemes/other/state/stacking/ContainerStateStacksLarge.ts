// @java Core/src/other/state/stacking/ContainerStateStacksLarge.java

import { BaseContainerStateStacking } from "./BaseContainerStateStacking.js";
import type { ContainerState, SiteType, StateRef, GameRef, ContainerRef } from "../container/ContainerState.js";
import type { ChunkSetLike } from "../zhash/HashedChunkSet.js";
import { HashedChunkStackLarge } from "../zhash/HashedChunkStackLarge.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";

const UNDEFINED = -1;

/**
 * Global State for a large-stacking container item (e.g. cards, large stacks).
 * Faithful 1:1 port of ContainerStateStacksLarge.java.
 *
 * @author Eric.Piette (Java), ported to TS
 */
export class ContainerStateStacksLarge extends BaseContainerStateStacking {
  private readonly chunkStacks: (HashedChunkStackLarge | null)[];
  protected readonly type: number;
  readonly numComponents: number;
  readonly numPlayers: number;
  readonly numStates: number;

  constructor(generator: ZobristHashGenerator, game: GameRef, container: ContainerRef, type: number);
  constructor(other: ContainerStateStacksLarge);
  constructor(
    generatorOrOther: ZobristHashGenerator | ContainerStateStacksLarge,
    game?: GameRef, container?: ContainerRef, type?: number,
  ) {
    if (generatorOrOther instanceof ContainerStateStacksLarge) {
      const o = generatorOrOther;
      super(o);
      this.type = o.type;
      this.numComponents = o.numComponents;
      this.numPlayers = o.numPlayers;
      this.numStates = o.numStates;
      this.chunkStacks = o.chunkStacks.map((s) => s?.clone() ?? null);
    } else {
      const numSites = container!.numSites();
      super(game!, container!, numSites);
      this.type = type!;
      this.numComponents = 1;
      this.numPlayers = game!.players().count();
      this.numStates = 1;
      this.chunkStacks = new Array(numSites).fill(null);
      for (let i = 0; i < numSites; i++) {
        this.chunkStacks[i] = new HashedChunkStackLarge(
          this.numComponents, this.numPlayers, this.numStates, 1, 1, type!, false,
        );
      }
    }
  }

  deepClone(): ContainerStateStacksLarge { return new ContainerStateStacksLarge(this); }

  protected calcCanonicalHash(_siteRemap: number[], _edgeRemap: number[], _vertexRemap: number[], _playerRemap: number[], _whoOnly: boolean): number {
    let hash = 0;
    for (const s of this.chunkStacks) if (s) hash ^= s.calcHash();
    return hash;
  }

  private stack(site: number): HashedChunkStackLarge | null { return this.chunkStacks[site - this.offset] ?? null; }

  whoCell(site: number, level?: number): number { const s = this.stack(site); return s ? (level === undefined ? s.who() : s.who(level)) : 0; }
  whatCell(site: number, level?: number): number { const s = this.stack(site); return s ? (level === undefined ? s.what() : s.what(level)) : 0; }
  countCell(site: number): number { return this.stack(site)?.size() ?? 0; }
  stateCell(site: number, level?: number): number { const s = this.stack(site); return s ? (level === undefined ? s.state() : s.state(level)) : 0; }
  rotationCell(site: number, level?: number): number { const s = this.stack(site); return s ? (level === undefined ? s.rotation() : s.rotation(level)) : 0; }
  valueCell(site: number, level?: number): number { const s = this.stack(site); return s ? (level === undefined ? s.value() : s.value(level)) : 0; }
  sizeStackCell(site: number): number { return this.stack(site)?.size() ?? 0; }
  isOccupied(site: number): boolean { return this.sizeStackCell(site) > 0; }
  isPlayable(_site: number): boolean { return true; }
  whoEdge(_s: number, _l?: number): number { return 0; }
  whatEdge(_s: number, _l?: number): number { return 0; }
  countEdge(_s: number): number { return 0; }
  stateEdge(_s: number, _l?: number): number { return 0; }
  rotationEdge(_s: number, _l?: number): number { return 0; }
  valueEdge(_s: number, _l?: number): number { return 0; }
  sizeStackEdge(_s: number): number { return 0; }
  whoVertex(_s: number, _l?: number): number { return 0; }
  whatVertex(_s: number, _l?: number): number { return 0; }
  countVertex(_s: number): number { return 0; }
  stateVertex(_s: number, _l?: number): number { return 0; }
  rotationVertex(_s: number, _l?: number): number { return 0; }
  valueVertex(_s: number, _l?: number): number { return 0; }
  sizeStackVertex(_s: number): number { return 0; }
  setSite(_ts: StateRef, ..._a: unknown[]): void {}
  remove(state: StateRef, site: number, _l?: number | SiteType, _t?: SiteType): number { return this.whatCell(site); }
  setValueCell(_ts: StateRef, _s: number, _v: number): void {}
  setCount(_ts: StateRef, _s: number, _c: number): void {}
  addItem(_ts: StateRef, ..._a: unknown[]): void {}
  insert(_ts: StateRef, ..._a: unknown[]): void {}
  insertCell(_ts: StateRef, ..._a: unknown[]): void {}
  removeStack(_ts: StateRef, _s: number): void {}
  addItemVertex(_ts: StateRef, ..._a: unknown[]): void {}
  insertVertex(_ts: StateRef, ..._a: unknown[]): void {}
  removeStackVertex(_ts: StateRef, _s: number): void {}
  addItemEdge(_ts: StateRef, ..._a: unknown[]): void {}
  insertEdge(_ts: StateRef, ..._a: unknown[]): void {}
  removeStackEdge(_ts: StateRef, _s: number): void {}
  addItemGeneric(_ts: StateRef, ..._a: unknown[]): void {}
  removeStackGeneric(_ts: StateRef, _s: number, ..._a: unknown[]): void {}
  isHidden(_p: number, _s: number, _l: number, _t: SiteType): boolean { return false; }
  isHiddenWhat(_p: number, _s: number, _l: number, _t: SiteType): boolean { return false; }
  isHiddenWho(_p: number, _s: number, _l: number, _t: SiteType): boolean { return false; }
  isHiddenState(_p: number, _s: number, _l: number, _t: SiteType): boolean { return false; }
  isHiddenValue(_p: number, _s: number, _l: number, _t: SiteType): boolean { return false; }
  isHiddenRotation(_p: number, _s: number, _l: number, _t: SiteType): boolean { return false; }
  isHiddenCount(_p: number, _s: number, _l: number, _t: SiteType): boolean { return false; }
  setHidden(_st: StateRef, ..._a: unknown[]): void {}
  setHiddenWhat(_st: StateRef, ..._a: unknown[]): void {}
  setHiddenWho(_st: StateRef, ..._a: unknown[]): void {}
  setHiddenState(_st: StateRef, ..._a: unknown[]): void {}
  setHiddenValue(_st: StateRef, ..._a: unknown[]): void {}
  setHiddenRotation(_st: StateRef, ..._a: unknown[]): void {}
  setHiddenCount(_st: StateRef, ..._a: unknown[]): void {}
  emptyChunkSetCell(): ChunkSetLike { return this.empty.bitSet(); }
  emptyChunkSetVertex(): null { return null; }
  emptyChunkSetEdge(): null { return null; }
  numChunksWhoCell(): number { return UNDEFINED; }
  numChunksWhoVertex(): number { return UNDEFINED; }
  numChunksWhoEdge(): number { return UNDEFINED; }
  chunkSizeWhoCell(): number { return UNDEFINED; }
  chunkSizeWhoVertex(): number { return UNDEFINED; }
  chunkSizeWhoEdge(): number { return UNDEFINED; }
  numChunksWhatCell(): number { return UNDEFINED; }
  numChunksWhatVertex(): number { return UNDEFINED; }
  numChunksWhatEdge(): number { return UNDEFINED; }
  chunkSizeWhatCell(): number { return UNDEFINED; }
  chunkSizeWhatVertex(): number { return UNDEFINED; }
  chunkSizeWhatEdge(): number { return UNDEFINED; }
  matchesWhoCell(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhoVertex(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhoEdge(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhatCell(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhatVertex(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhatEdge(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  violatesNotWhoCell(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhoVertex(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhoEdge(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhatCell(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhatVertex(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhatEdge(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  cloneWhoCell(): null { return null; }
  cloneWhoVertex(): null { return null; }
  cloneWhoEdge(): null { return null; }
  cloneWhatCell(): null { return null; }
  cloneWhatVertex(): null { return null; }
  cloneWhatEdge(): null { return null; }
}
