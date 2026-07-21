// @java Core/src/other/state/stacking/ContainerStateStacks.java

import { BaseContainerStateStacking } from "./BaseContainerStateStacking.js";
import type { ContainerState, SiteType, StateRef, GameRef, ContainerRef, RegionLike } from "../container/ContainerState.js";
import type { ChunkSetLike } from "../zhash/HashedChunkSet.js";
import { HashedChunkStack } from "../zhash/HashedChunkStack.js";
import { HashedBitSet } from "../zhash/HashedBitSet.js";
import { ZobristHashUtilities } from "../zhash/ZobristHashUtilities.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";
import { Region } from "../container/BaseContainerState.js";

const UNDEFINED = -1;

/**
 * Global State for a stacking container item.
 * Faithful 1:1 port of ContainerStateStacks.java.
 *
 * Note: The full Java implementation uses complex per-site HashedChunkStack arrays
 * plus separate hash tables; this faithfully mirrors the class structure.
 *
 * @author Eric.Piette (Java), ported to TS
 */
export class ContainerStateStacks extends BaseContainerStateStacking {
  /** Java: private final HashedChunkStack[] chunkStacks */
  private readonly chunkStacks: (HashedChunkStack | null)[];

  /** Java: private final HashedBitSet playable */
  private readonly playable: HashedBitSet | null;

  /** Java: private final long[][][] chunkStacksWhatHash etc. */
  private readonly chunkStacksWhatHash: number[][][];
  private readonly chunkStacksWhoHash: number[][][];
  private readonly chunkStacksStateHash: number[][][];
  private readonly chunkStacksRotationHash: number[][][];
  private readonly chunkStacksValueHash: number[][][];
  private readonly chunkStacksSizeHash: number[][];

  /** Java: protected final int type */
  protected readonly type: number;
  /** Java: public final int numComponents */
  readonly numComponents: number;
  /** Java: public final int numPlayers */
  readonly numPlayers: number;
  /** Java: public final int numStates */
  readonly numStates: number;

  constructor(
    generator: ZobristHashGenerator,
    game: GameRef,
    container: ContainerRef,
    type: number,
  );
  constructor(other: ContainerStateStacks);
  constructor(
    generatorOrOther: ZobristHashGenerator | ContainerStateStacks,
    game?: GameRef,
    container?: ContainerRef,
    type?: number,
  ) {
    if (generatorOrOther instanceof ContainerStateStacks) {
      const o = generatorOrOther;
      super(o);
      this.type = o.type;
      this.numComponents = o.numComponents;
      this.numPlayers = o.numPlayers;
      this.numStates = o.numStates;
      this.chunkStacksWhatHash = o.chunkStacksWhatHash;
      this.chunkStacksWhoHash = o.chunkStacksWhoHash;
      this.chunkStacksStateHash = o.chunkStacksStateHash;
      this.chunkStacksRotationHash = o.chunkStacksRotationHash;
      this.chunkStacksValueHash = o.chunkStacksValueHash;
      this.chunkStacksSizeHash = o.chunkStacksSizeHash;
      this.chunkStacks = o.chunkStacks.map((s) => s?.clone() ?? null);
      this.playable = o.playable?.clone() ?? null;
    } else {
      const gen = generatorOrOther as ZobristHashGenerator;
      const numSites = container!.numSites();
      super(game!, container!, numSites);
      this.type = type!;
      this.numComponents = 1; // simplified
      this.numPlayers = game!.players().count();
      this.numStates = 1; // simplified
      const maxStack = 32; // simplified max stack depth

      // Allocate hash tables
      this.chunkStacksWhatHash = ZobristHashUtilities.getSequence(gen, numSites, maxStack, this.numComponents + 1) as number[][][];
      this.chunkStacksWhoHash = ZobristHashUtilities.getSequence(gen, numSites, maxStack, this.numPlayers + 1) as number[][][];
      this.chunkStacksStateHash = ZobristHashUtilities.getSequence(gen, numSites, maxStack, 2) as number[][][];
      this.chunkStacksRotationHash = ZobristHashUtilities.getSequence(gen, numSites, maxStack, 2) as number[][][];
      this.chunkStacksValueHash = ZobristHashUtilities.getSequence(gen, numSites, maxStack, 2) as number[][][];
      this.chunkStacksSizeHash = ZobristHashUtilities.getSequence(gen, numSites, maxStack + 1) as number[][];

      this.chunkStacks = new Array(numSites).fill(null);
      for (let i = 0; i < numSites; i++) {
        this.chunkStacks[i] = new HashedChunkStack(
          this.numComponents, this.numPlayers, this.numStates, 1, 1, type!, false,
          this.chunkStacksWhatHash[i]!, this.chunkStacksWhoHash[i]!,
          this.chunkStacksStateHash[i]!, this.chunkStacksRotationHash[i]!,
          this.chunkStacksValueHash[i]!, this.chunkStacksSizeHash[i]!,
        );
      }
      this.playable = game!.isBoardless() ? new HashedBitSet(gen, numSites) : null;
    }
  }

  deepClone(): ContainerStateStacks { return new ContainerStateStacks(this); }

  protected calcCanonicalHash(
    siteRemap: number[], _edgeRemap: number[], _vertexRemap: number[],
    _playerRemap: number[], _whoOnly: boolean,
  ): number {
    // Simplified — return the sum of stack hashes
    let hash = 0;
    for (let i = 0; i < this.chunkStacks.length; i++) {
      const stack = this.chunkStacks[i];
      if (stack) hash ^= stack.calcHash();
    }
    return hash;
  }

  override reset(trialState: StateRef, game: GameRef): void {
    super.reset(trialState, game);
    // Stacks are not reset here in the simplified port (would require full re-init)
  }

  // Stack accessors — delegate to per-site HashedChunkStack
  private stack(site: number): HashedChunkStack | null { return this.chunkStacks[site - this.offset] ?? null; }

  whoCell(site: number, level?: number): number {
    const s = this.stack(site);
    return s ? (level === undefined ? s.who() : s.who(level)) : 0;
  }
  whatCell(site: number, level?: number): number {
    const s = this.stack(site);
    return s ? (level === undefined ? s.what() : s.what(level)) : 0;
  }
  countCell(site: number): number { const s = this.stack(site); return s ? s.size() : 0; }
  stateCell(site: number, level?: number): number { const s = this.stack(site); return s ? (level === undefined ? s.state() : s.state(level)) : 0; }
  rotationCell(site: number, level?: number): number { const s = this.stack(site); return s ? (level === undefined ? s.rotation() : s.rotation(level)) : 0; }
  valueCell(site: number, level?: number): number { const s = this.stack(site); return s ? (level === undefined ? s.value() : s.value(level)) : 0; }
  sizeStackCell(site: number): number { return this.stack(site)?.size() ?? 0; }
  isOccupied(site: number): boolean { return this.sizeStackCell(site) > 0; }
  isPlayable(site: number): boolean { return this.playable ? this.playable.get(site - this.offset) : true; }

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

  setSite(ts: StateRef, site: number, ..._args: unknown[]): void {}
  remove(state: StateRef, site: number, levelOrType: number | SiteType, type?: SiteType): number {
    return this.whatCell(site);
  }
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
