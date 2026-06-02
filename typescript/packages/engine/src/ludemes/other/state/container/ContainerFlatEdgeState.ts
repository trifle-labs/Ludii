// @java Core/src/other/state/container/ContainerFlatEdgeState.java

import { BaseContainerState, Region } from "./BaseContainerState.js";
import type { SiteType, StateRef, GameRef, ContainerRef, RegionLike } from "./ContainerState.js";
import type { ContainerState } from "./ContainerState.js";
import { HashedBitSet } from "../zhash/HashedBitSet.js";
import { HashedChunkSet, ChunkSetLike } from "../zhash/HashedChunkSet.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";

const UNDEFINED = -1;
const HIDDEN_INFO_FLAG = 0x20000n;

/**
 * Global State for a container item using only edges.
 * Faithful 1:1 port of ContainerFlatEdgeState.java.
 *
 * @author Eric.Piette (Java), ported to TS
 */
export class ContainerFlatEdgeState extends BaseContainerState {
  private readonly whoEdge_: HashedChunkSet;
  private readonly whatEdge_: HashedChunkSet | null;
  private readonly countEdge_: HashedChunkSet | null;
  private readonly stateEdge_: HashedChunkSet | null;
  private readonly rotationEdge_: HashedChunkSet | null;
  private readonly valueEdge_: HashedChunkSet | null;
  private readonly hiddenEdge_: (HashedBitSet | null)[] | null;
  private readonly hiddenWhatEdge_: (HashedBitSet | null)[] | null;
  private readonly hiddenWhoEdge_: (HashedBitSet | null)[] | null;
  private readonly hiddenCountEdge_: (HashedBitSet | null)[] | null;
  private readonly hiddenStateEdge_: (HashedBitSet | null)[] | null;
  private readonly hiddenRotationEdge_: (HashedBitSet | null)[] | null;
  private readonly hiddenValueEdge_: (HashedBitSet | null)[] | null;
  private readonly emptyEdge_: Region;

  constructor(
    generator: ZobristHashGenerator, game: GameRef, container: ContainerRef,
    maxWhatVal: number, maxStateVal: number, maxCountVal: number, maxRotationVal: number, maxPieceValue: number,
  );
  constructor(other: ContainerFlatEdgeState);
  constructor(
    generatorOrOther: ZobristHashGenerator | ContainerFlatEdgeState,
    game?: GameRef, container?: ContainerRef,
    maxWhatVal?: number, maxStateVal?: number, maxCountVal?: number, maxRotationVal?: number, maxPieceValue?: number,
  ) {
    if (generatorOrOther instanceof ContainerFlatEdgeState) {
      const o = generatorOrOther;
      super(o);
      this.whoEdge_ = o.whoEdge_.clone();
      this.whatEdge_ = o.whatEdge_?.clone() ?? null;
      this.countEdge_ = o.countEdge_?.clone() ?? null;
      this.stateEdge_ = o.stateEdge_?.clone() ?? null;
      this.rotationEdge_ = o.rotationEdge_?.clone() ?? null;
      this.valueEdge_ = o.valueEdge_?.clone() ?? null;
      this.emptyEdge_ = new Region(o.emptyEdge_);
      if (o.hiddenEdge_) {
        this.hiddenEdge_ = o.hiddenEdge_.map((h) => h?.clone() ?? null);
        this.hiddenWhatEdge_ = o.hiddenWhatEdge_!.map((h) => h?.clone() ?? null);
        this.hiddenWhoEdge_ = o.hiddenWhoEdge_!.map((h) => h?.clone() ?? null);
        this.hiddenCountEdge_ = o.hiddenCountEdge_!.map((h) => h?.clone() ?? null);
        this.hiddenStateEdge_ = o.hiddenStateEdge_!.map((h) => h?.clone() ?? null);
        this.hiddenRotationEdge_ = o.hiddenRotationEdge_!.map((h) => h?.clone() ?? null);
        this.hiddenValueEdge_ = o.hiddenValueEdge_!.map((h) => h?.clone() ?? null);
      } else {
        this.hiddenEdge_ = this.hiddenWhatEdge_ = this.hiddenWhoEdge_ = this.hiddenCountEdge_ =
          this.hiddenStateEdge_ = this.hiddenRotationEdge_ = this.hiddenValueEdge_ = null;
      }
    } else {
      const gen = generatorOrOther as ZobristHashGenerator;
      super(game!, container!, container!.numSites());
      const numPlayers = game!.players().count();
      const numEdges = game!.board().topology().cells().size(); // simplified: use topology size
      this.emptyEdge_ = new Region(numEdges);
      if ((game!.gameFlags() & HIDDEN_INFO_FLAG) === 0n) {
        this.hiddenEdge_ = this.hiddenWhatEdge_ = this.hiddenWhoEdge_ = this.hiddenCountEdge_ =
          this.hiddenStateEdge_ = this.hiddenRotationEdge_ = this.hiddenValueEdge_ = null;
      } else {
        const mk = (n: number) => {
          const arr: (HashedBitSet | null)[] = new Array(numPlayers + 1).fill(null);
          for (let i = 1; i <= numPlayers; i++) arr[i] = new HashedBitSet(gen, n);
          return arr;
        };
        this.hiddenEdge_ = mk(numEdges);
        this.hiddenWhatEdge_ = mk(numEdges);
        this.hiddenWhoEdge_ = mk(numEdges);
        this.hiddenCountEdge_ = mk(numEdges);
        this.hiddenStateEdge_ = mk(numEdges);
        this.hiddenRotationEdge_ = mk(numEdges);
        this.hiddenValueEdge_ = mk(numEdges);
      }
      this.whoEdge_ = new HashedChunkSet(gen, numPlayers + 1, numEdges);
      this.whatEdge_ = maxWhatVal! > 0 ? new HashedChunkSet(gen, maxWhatVal!, numEdges) : null;
      this.countEdge_ = maxCountVal! > 0 ? new HashedChunkSet(gen, maxCountVal!, numEdges) : null;
      this.stateEdge_ = maxStateVal! > 0 ? new HashedChunkSet(gen, maxStateVal!, numEdges) : null;
      this.rotationEdge_ = maxRotationVal! > 0 ? new HashedChunkSet(gen, maxRotationVal!, numEdges) : null;
      this.valueEdge_ = maxPieceValue! > 0 ? new HashedChunkSet(gen, maxPieceValue!, numEdges) : null;
    }
  }

  deepClone(): ContainerFlatEdgeState { return new ContainerFlatEdgeState(this); }

  protected calcCanonicalHash(
    _siteRemap: number[], _edgeRemap: number[], vertexRemap: number[],
    playerRemap: number[], whoOnly: boolean,
  ): number {
    let hash = 0;
    if (vertexRemap && vertexRemap.length > 0) {
      if (this.whoEdge_) hash ^= this.whoEdge_.calculateHashAfterRemap(vertexRemap, playerRemap);
      if (!whoOnly) {
        if (this.whatEdge_) hash ^= this.whatEdge_.calculateHashAfterRemap(vertexRemap, null);
        if (this.countEdge_) hash ^= this.countEdge_.calculateHashAfterRemap(vertexRemap, null);
        if (this.stateEdge_) hash ^= this.stateEdge_.calculateHashAfterRemap(vertexRemap, null);
        if (this.rotationEdge_) hash ^= this.rotationEdge_.calculateHashAfterRemap(vertexRemap, null);
      }
    }
    return hash;
  }

  override reset(trialState: StateRef, game: GameRef): void {
    super.reset(trialState, game);
    const numEdge = game.board().topology().cells().size();
    this.whoEdge_?.clear(trialState);
    this.whatEdge_?.clear(trialState);
    this.countEdge_?.clear(trialState);
    this.stateEdge_?.clear(trialState);
    this.rotationEdge_?.clear(trialState);
    this.valueEdge_?.clear(trialState);
    if (this.hiddenEdge_) for (let i = 1; i < this.hiddenEdge_.length; i++) this.hiddenEdge_[i]?.clear(trialState);
    if (this.hiddenWhatEdge_) for (let i = 1; i < this.hiddenWhatEdge_.length; i++) this.hiddenWhatEdge_[i]?.clear(trialState);
    if (this.hiddenWhoEdge_) for (let i = 1; i < this.hiddenWhoEdge_.length; i++) this.hiddenWhoEdge_[i]?.clear(trialState);
    if (this.hiddenCountEdge_) for (let i = 1; i < this.hiddenCountEdge_.length; i++) this.hiddenCountEdge_[i]?.clear(trialState);
    if (this.hiddenRotationEdge_) for (let i = 1; i < this.hiddenRotationEdge_.length; i++) this.hiddenRotationEdge_[i]?.clear(trialState);
    if (this.hiddenValueEdge_) for (let i = 1; i < this.hiddenValueEdge_.length; i++) this.hiddenValueEdge_[i]?.clear(trialState);
    if (this.hiddenStateEdge_) for (let i = 1; i < this.hiddenStateEdge_.length; i++) this.hiddenStateEdge_[i]?.clear(trialState);
    this.emptyEdge_.set(numEdge);
  }

  // Hidden
  isHidden(player: number, site: number, _level: number, _type: SiteType): boolean { return this.hiddenEdge_?.[player]?.get(site) ?? false; }
  isHiddenWhat(player: number, site: number, _level: number, _type: SiteType): boolean { return this.hiddenWhatEdge_?.[player]?.get(site) ?? false; }
  isHiddenWho(player: number, site: number, _level: number, _type: SiteType): boolean { return this.hiddenWhoEdge_?.[player]?.get(site) ?? false; }
  isHiddenState(player: number, site: number, _level: number, _type: SiteType): boolean { return this.hiddenStateEdge_?.[player]?.get(site) ?? false; }
  isHiddenRotation(player: number, site: number, _level: number, _type: SiteType): boolean { return this.hiddenRotationEdge_?.[player]?.get(site) ?? false; }
  isHiddenValue(player: number, site: number, _level: number, _type: SiteType): boolean { return this.hiddenValueEdge_?.[player]?.get(site) ?? false; }
  isHiddenCount(player: number, site: number, _level: number, _type: SiteType): boolean { return this.hiddenCountEdge_?.[player]?.get(site) ?? false; }
  setHidden(state: StateRef, p: number, site: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenEdge_?.[p]?.set(state, site, on); }
  setHiddenWhat(state: StateRef, p: number, site: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenWhatEdge_?.[p]?.set(state, site, on); }
  setHiddenWho(state: StateRef, p: number, site: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenWhoEdge_?.[p]?.set(state, site, on); }
  setHiddenState(state: StateRef, p: number, site: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenStateEdge_?.[p]?.set(state, site, on); }
  setHiddenRotation(state: StateRef, p: number, site: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenRotationEdge_?.[p]?.set(state, site, on); }
  setHiddenValue(state: StateRef, p: number, site: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenValueEdge_?.[p]?.set(state, site, on); }
  setHiddenCount(state: StateRef, p: number, site: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenCountEdge_?.[p]?.set(state, site, on); }

  isPlayable(_site: number): boolean { return true; }
  override setPlayable(_ts: StateRef, _site: number, _on: boolean): void {}
  isOccupied(site: number): boolean { return this.countEdge(site) !== 0; }

  setSite(trialState: StateRef, site: number, whoOrLevel: number, whatOrWho: number, countOrWhat: number, stateOrCount: number, rotationOrState: number, valueOrRotation: number, typeOrValue: SiteType | number): void {
    const whoVal = whoOrLevel, whatVal = whatOrWho, countVal = countOrWhat, stateVal = stateOrCount, rotationVal = rotationOrState, valueVal = valueOrRotation;
    const wasEmpty = !this.isOccupied(site);
    if (whoVal !== UNDEFINED) this.whoEdge_.setChunk(trialState, site, whoVal);
    if (whatVal !== UNDEFINED) this.defaultIfNull(this.whatEdge_).setChunk(trialState, site, whatVal);
    if (countVal !== UNDEFINED && this.countEdge_) this.countEdge_.setChunk(trialState, site, countVal < 0 ? 0 : countVal);
    if (stateVal !== UNDEFINED && this.stateEdge_) this.stateEdge_.setChunk(trialState, site, stateVal);
    if (rotationVal !== UNDEFINED && this.rotationEdge_) this.rotationEdge_.setChunk(trialState, site, rotationVal);
    if (valueVal !== UNDEFINED && this.valueEdge_) this.valueEdge_.setChunk(trialState, site, typeof valueVal === "number" ? valueVal : 0);
    const isEmpty = !this.isOccupied(site);
    if (wasEmpty === isEmpty) return;
    if (isEmpty) this.addToEmptyCell(site);
    else this.removeFromEmptyCell(site);
  }

  // Cell — all return 0
  whoCell(_s: number, _l?: number): number { return 0; }
  whatCell(_s: number, _l?: number): number { return 0; }
  countCell(_s: number): number { return 0; }
  stateCell(_s: number, _l?: number): number { return 0; }
  rotationCell(_s: number, _l?: number): number { return 0; }
  valueCell(_s: number, _l?: number): number { return 0; }
  sizeStackCell(_s: number): number { return this.whatCell(_s) !== 0 ? 1 : 0; }

  // Edge
  override whoEdge(site: number, _level?: number): number { return this.whoEdge_.getChunk(site); }
  override whatEdge(site: number, _level?: number): number { return this.whatEdge_?.getChunk(site) ?? 0; }
  override countEdge(site: number): number {
    if (this.countEdge_) return this.countEdge_.getChunk(site);
    if (this.whoEdge_.getChunk(site) !== 0 || (this.whatEdge_ && this.whatEdge_.getChunk(site) !== 0)) return 1;
    return 0;
  }
  override stateEdge(site: number, _level?: number): number { return this.stateEdge_?.getChunk(site) ?? 0; }
  override rotationEdge(site: number, _level?: number): number { return this.rotationEdge_?.getChunk(site) ?? 0; }
  override valueEdge(site: number, _level?: number): number { return this.valueEdge_?.getChunk(site) ?? 0; }
  sizeStackEdge(site: number): number { return this.whatEdge(site) !== 0 ? 1 : 0; }

  // Vertex — all return 0
  whoVertex(_s: number, _l?: number): number { return 0; }
  whatVertex(_s: number, _l?: number): number { return 0; }
  countVertex(_s: number): number { return 0; }
  stateVertex(_s: number, _l?: number): number { return 0; }
  rotationVertex(_s: number, _l?: number): number { return 0; }
  valueVertex(_s: number, _l?: number): number { return 0; }
  sizeStackVertex(_s: number): number { return 0; }

  remove(state: StateRef, site: number, levelOrType: number | SiteType, type?: SiteType): number {
    const t: SiteType = typeof levelOrType === "string" ? levelOrType : (type ?? "Edge");
    const whatIdx = this.what(site, t);
    this.setSite(state, site, 0, 0, 0, 0, 0, 0, t);
    return whatIdx;
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

  override emptySites(): number[] { return this.emptyEdge_.sites(); }
  override numEmpty(): number { return this.emptyEdge_.count(); }
  override isEmptyEdge(edge: number): boolean { return this.emptyEdge_.contains(edge); }
  override isEmptyCell(_site: number): boolean { return true; }
  override isEmptyVertex(_vertex: number): boolean { return true; }
  override emptyRegion(_type: SiteType): RegionLike { return this.emptyEdge_; }
  override addToEmpty(site: number, _type: SiteType): void { this.emptyEdge_.add(site); }
  override removeFromEmpty(site: number, _type: SiteType): void { this.emptyEdge_.remove(site); }
  override addToEmptyCell(site: number): void { this.emptyEdge_.add(site); }
  override removeFromEmptyCell(site: number): void { this.emptyEdge_.remove(site); }

  private defaultIfNull(preferred: HashedChunkSet | null): HashedChunkSet { return preferred ?? this.whoEdge_; }

  emptyChunkSetCell(): null { return null; }
  emptyChunkSetVertex(): null { return null; }
  emptyChunkSetEdge(): ChunkSetLike { return this.emptyEdge_.bitSet(); }

  numChunksWhoCell(): number { return UNDEFINED; }
  numChunksWhoVertex(): number { return UNDEFINED; }
  numChunksWhoEdge(): number { return this.whoEdge_.numChunks(); }
  chunkSizeWhoCell(): number { return UNDEFINED; }
  chunkSizeWhoVertex(): number { return UNDEFINED; }
  chunkSizeWhoEdge(): number { return this.whoEdge_.chunkSize(); }
  numChunksWhatCell(): number { return UNDEFINED; }
  numChunksWhatVertex(): number { return UNDEFINED; }
  numChunksWhatEdge(): number { return this.defaultIfNull(this.whatEdge_).numChunks(); }
  chunkSizeWhatCell(): number { return UNDEFINED; }
  chunkSizeWhatVertex(): number { return UNDEFINED; }
  chunkSizeWhatEdge(): number { return this.defaultIfNull(this.whatEdge_).chunkSize(); }

  matchesWhoEdge(maskOrW: ChunkSetLike | number, patternOrM: ChunkSetLike | number, mw?: number): boolean {
    if (typeof maskOrW === "number") return this.whoEdge_.matchesWord(maskOrW, patternOrM as number, mw!);
    return this.whoEdge_.matches(maskOrW as ChunkSetLike, patternOrM as ChunkSetLike);
  }
  matchesWhoCell(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhoVertex(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhatEdge(maskOrW: ChunkSetLike | number, patternOrM: ChunkSetLike | number, mw?: number): boolean {
    const s = this.defaultIfNull(this.whatEdge_);
    if (typeof maskOrW === "number") return s.matchesWord(maskOrW, patternOrM as number, mw!);
    return s.matches(maskOrW as ChunkSetLike, patternOrM as ChunkSetLike);
  }
  matchesWhatCell(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhatVertex(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }

  violatesNotWhoEdge(mask: ChunkSetLike, pattern: ChunkSetLike, sw?: number): boolean { return this.whoEdge_.violatesNot(mask, pattern, sw); }
  violatesNotWhoCell(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhoVertex(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhatEdge(mask: ChunkSetLike, pattern: ChunkSetLike, sw?: number): boolean { return this.defaultIfNull(this.whatEdge_).violatesNot(mask, pattern, sw); }
  violatesNotWhatCell(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhatVertex(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }

  cloneWhoEdge(): ChunkSetLike { return this.whoEdge_.internalStateCopy(); }
  cloneWhoCell(): null { return null; }
  cloneWhoVertex(): null { return null; }
  cloneWhatEdge(): ChunkSetLike { return this.defaultIfNull(this.whatEdge_).internalStateCopy(); }
  cloneWhatCell(): null { return null; }
  cloneWhatVertex(): null { return null; }
}
