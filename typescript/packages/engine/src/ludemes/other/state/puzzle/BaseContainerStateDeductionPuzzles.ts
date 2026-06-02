// @java Core/src/other/state/puzzle/BaseContainerStateDeductionPuzzles.java

import type { ContainerState, SiteType, StateRef, GameRef, ContainerRef, RegionLike } from "../container/ContainerState.js";
import type { SymmetryValidator } from "../symmetry/SymmetryValidator.js";
import type { ChunkSetLike } from "../zhash/HashedChunkSet.js";
import { Region } from "../container/BaseContainerState.js";

const UNDEFINED = -1;

/**
 * Global State for a deduction puzzle container — abstract base.
 * Faithful 1:1 port of BaseContainerStateDeductionPuzzles.java.
 *
 * @author cambolbro and mrraow (Java), ported to TS
 */
export abstract class BaseContainerStateDeductionPuzzles implements ContainerState {
  private container_: ContainerRef;
  private nameFromFile_: string | null = null;
  protected readonly offset: number;
  private readonly empty_: Region;

  constructor(game: GameRef, container: ContainerRef, numSites: number);
  constructor(other: BaseContainerStateDeductionPuzzles);
  constructor(
    gameOrOther: GameRef | BaseContainerStateDeductionPuzzles,
    container?: ContainerRef,
    numSites?: number,
  ) {
    if (gameOrOther instanceof BaseContainerStateDeductionPuzzles) {
      const o = gameOrOther;
      this.container_ = o.container_;
      this.empty_ = new Region(o.empty_);
      this.offset = o.offset;
    } else {
      const game = gameOrOther as GameRef;
      this.container_ = container!;
      this.empty_ = new Region(numSites!);
      this.offset = game.equipment().sitesFrom()[container!.index()]!;
    }
  }

  reset(trialState: StateRef, _game: GameRef): void {
    // reset the empty region to all sites
    this.empty_.set(this.empty_.count());
  }

  nameFromFile(): string | null { return this.nameFromFile_; }
  container(): ContainerRef { return this.container_; }
  setContainer(cont: ContainerRef): void { this.container_ = cont; }
  emptySites(): number[] { return this.empty_.sites(); }
  numEmpty(): number { return this.empty_.count(); }
  isEmpty(site: number, type: SiteType): boolean { return this.isEmptyCell(site); }
  isEmptyCell(site: number): boolean { return this.empty_.contains(site - this.offset); }
  isEmptyEdge(_edge: number): boolean { return true; }
  isEmptyVertex(_vertex: number): boolean { return true; }
  emptyRegion(_type: SiteType): RegionLike { return this.empty_; }
  addToEmptyCell(site: number): void { this.empty_.add(site - this.offset); }
  removeFromEmptyCell(site: number): void { this.empty_.remove(site - this.offset); }
  addToEmpty(site: number, _type: SiteType): void { this.addToEmptyCell(site); }
  removeFromEmpty(site: number, _type: SiteType): void { this.removeFromEmptyCell(site); }
  addToEmptyVertex(_site: number): void {}
  removeFromEmptyVertex(_site: number): void {}
  addToEmptyEdge(_site: number): void {}
  removeFromEmptyEdge(_site: number): void {}
  setPlayable(_ts: StateRef, _site: number, _on: boolean): void {}

  // Abstract — implemented by subclasses
  abstract deepClone(): ContainerState;
  abstract canonicalHash(validator: SymmetryValidator, state: StateRef, whoOnly: boolean): number;
  abstract setSite(trialState: StateRef, site: number, ...args: unknown[]): void;
  abstract remove(state: StateRef, site: number, ...args: unknown[]): number;

  // No-op or 0 defaults
  whoCell(_s: number, _l?: number): number { return 0; }
  whatCell(_s: number, _l?: number): number { return 0; }
  countCell(_s: number): number { return 0; }
  stateCell(_s: number, _l?: number): number { return 0; }
  rotationCell(_s: number, _l?: number): number { return 0; }
  valueCell(_s: number, _l?: number): number { return 0; }
  sizeStackCell(_s: number): number { return 0; }
  isOccupied(_s: number): boolean { return false; }
  isPlayable(_s: number): boolean { return true; }
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
  what(_s: number, _t: SiteType | number, _gt?: SiteType): number { return 0; }
  who(_s: number, _t: SiteType | number, _gt?: SiteType): number { return 0; }
  count(_s: number, _t: SiteType): number { return 0; }
  sizeStack(_s: number, _t: SiteType): number { return 0; }
  state(_s: number, _t: SiteType | number, _gt?: SiteType): number { return 0; }
  rotation(_s: number, _t: SiteType | number, _gt?: SiteType): number { return 0; }
  value(_s: number, _t: SiteType | number, _gt?: SiteType): number { return 0; }
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

  // Deduction puzzle — abstract
  abstract bit(varSite: number, value: number, type: SiteType): boolean;
  abstract isResolved(varSite: number, type: SiteType): boolean;
  isResolvedEdges(_v: number): boolean { return false; }
  isResolvedCell(_v: number): boolean { return false; }
  isResolvedVerts(_v: number): boolean { return false; }
  set(_var: number, _value: number, _type: SiteType): void {}
  values(_type: SiteType, _var: number): Set<number> { return new Set(); }

  emptyChunkSetCell(): ChunkSetLike { return this.empty_.bitSet(); }
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
