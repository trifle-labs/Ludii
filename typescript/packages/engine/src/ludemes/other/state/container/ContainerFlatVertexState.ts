// @java Core/src/other/state/container/ContainerFlatVertexState.java

import { BaseContainerState, Region } from "./BaseContainerState.js";
import type { SiteType, StateRef, GameRef, ContainerRef, RegionLike } from "./ContainerState.js";
import type { ContainerState } from "./ContainerState.js";
import { HashedBitSet } from "../zhash/HashedBitSet.js";
import { HashedChunkSet, ChunkSetLike } from "../zhash/HashedChunkSet.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";

const UNDEFINED = -1;
const HIDDEN_INFO_FLAG = 0x20000n;

/**
 * Global State for a container item using only vertices.
 * Faithful 1:1 port of ContainerFlatVertexState.java.
 *
 * @author Eric.Piette (Java), ported to TS
 */
export class ContainerFlatVertexState extends BaseContainerState {
  private readonly whoVertex_: HashedChunkSet;
  private readonly whatVertex_: HashedChunkSet | null;
  private readonly countVertex_: HashedChunkSet | null;
  private readonly stateVertex_: HashedChunkSet | null;
  private readonly rotationVertex_: HashedChunkSet | null;
  private readonly valueVertex_: HashedChunkSet | null;
  private readonly hiddenVertex_: (HashedBitSet | null)[] | null;
  private readonly hiddenWhatVertex_: (HashedBitSet | null)[] | null;
  private readonly hiddenWhoVertex_: (HashedBitSet | null)[] | null;
  private readonly hiddenCountVertex_: (HashedBitSet | null)[] | null;
  private readonly hiddenStateVertex_: (HashedBitSet | null)[] | null;
  private readonly hiddenRotationVertex_: (HashedBitSet | null)[] | null;
  private readonly hiddenValueVertex_: (HashedBitSet | null)[] | null;
  protected readonly emptyVertex_: Region;

  constructor(
    generator: ZobristHashGenerator, game: GameRef, container: ContainerRef,
    maxWhatVal: number, maxStateVal: number, maxCountVal: number, maxRotationVal: number, maxPieceValue: number,
  );
  constructor(other: ContainerFlatVertexState);
  constructor(
    generatorOrOther: ZobristHashGenerator | ContainerFlatVertexState,
    game?: GameRef, container?: ContainerRef,
    maxWhatVal?: number, maxStateVal?: number, maxCountVal?: number, maxRotationVal?: number, maxPieceValue?: number,
  ) {
    if (generatorOrOther instanceof ContainerFlatVertexState) {
      const o = generatorOrOther;
      super(o);
      this.whoVertex_ = o.whoVertex_.clone();
      this.whatVertex_ = o.whatVertex_?.clone() ?? null;
      this.countVertex_ = o.countVertex_?.clone() ?? null;
      this.stateVertex_ = o.stateVertex_?.clone() ?? null;
      this.rotationVertex_ = o.rotationVertex_?.clone() ?? null;
      this.valueVertex_ = o.valueVertex_?.clone() ?? null;
      this.emptyVertex_ = new Region(o.emptyVertex_);
      if (o.hiddenVertex_) {
        this.hiddenVertex_ = o.hiddenVertex_.map((h) => h?.clone() ?? null);
        this.hiddenWhatVertex_ = o.hiddenWhatVertex_!.map((h) => h?.clone() ?? null);
        this.hiddenWhoVertex_ = o.hiddenWhoVertex_!.map((h) => h?.clone() ?? null);
        this.hiddenCountVertex_ = o.hiddenCountVertex_!.map((h) => h?.clone() ?? null);
        this.hiddenStateVertex_ = o.hiddenStateVertex_!.map((h) => h?.clone() ?? null);
        this.hiddenRotationVertex_ = o.hiddenRotationVertex_!.map((h) => h?.clone() ?? null);
        this.hiddenValueVertex_ = o.hiddenValueVertex_!.map((h) => h?.clone() ?? null);
      } else {
        this.hiddenVertex_ = this.hiddenWhatVertex_ = this.hiddenWhoVertex_ = this.hiddenCountVertex_ =
          this.hiddenStateVertex_ = this.hiddenRotationVertex_ = this.hiddenValueVertex_ = null;
      }
    } else {
      const gen = generatorOrOther as ZobristHashGenerator;
      super(game!, container!, container!.numSites());
      const numPlayers = game!.players().count();
      const numVertices = game!.board().topology().cells().size(); // simplified
      this.emptyVertex_ = new Region(numVertices);
      if ((game!.gameFlags() & HIDDEN_INFO_FLAG) === 0n) {
        this.hiddenVertex_ = this.hiddenWhatVertex_ = this.hiddenWhoVertex_ = this.hiddenCountVertex_ =
          this.hiddenStateVertex_ = this.hiddenRotationVertex_ = this.hiddenValueVertex_ = null;
      } else {
        const mk = (n: number) => {
          const arr: (HashedBitSet | null)[] = new Array(numPlayers + 1).fill(null);
          for (let i = 1; i <= numPlayers; i++) arr[i] = new HashedBitSet(gen, n);
          return arr;
        };
        this.hiddenVertex_ = mk(numVertices);
        this.hiddenWhatVertex_ = mk(numVertices);
        this.hiddenWhoVertex_ = mk(numVertices);
        this.hiddenCountVertex_ = mk(numVertices);
        this.hiddenStateVertex_ = mk(numVertices);
        this.hiddenRotationVertex_ = mk(numVertices);
        this.hiddenValueVertex_ = mk(numVertices);
      }
      this.whoVertex_ = new HashedChunkSet(gen, numPlayers + 1, numVertices);
      this.whatVertex_ = maxWhatVal! > 0 ? new HashedChunkSet(gen, maxWhatVal!, numVertices) : null;
      this.countVertex_ = maxCountVal! > 0 ? new HashedChunkSet(gen, maxCountVal!, numVertices) : null;
      this.stateVertex_ = maxStateVal! > 0 ? new HashedChunkSet(gen, maxStateVal!, numVertices) : null;
      this.rotationVertex_ = maxRotationVal! > 0 ? new HashedChunkSet(gen, maxRotationVal!, numVertices) : null;
      this.valueVertex_ = maxPieceValue! > 0 ? new HashedChunkSet(gen, maxPieceValue!, numVertices) : null;
    }
  }

  deepClone(): ContainerFlatVertexState { return new ContainerFlatVertexState(this); }

  protected calcCanonicalHash(
    _siteRemap: number[], _edgeRemap: number[], vertexRemap: number[],
    playerRemap: number[], whoOnly: boolean,
  ): number {
    let hash = 0;
    if (vertexRemap && vertexRemap.length > 0) {
      if (this.whoVertex_) hash ^= this.whoVertex_.calculateHashAfterRemap(vertexRemap, playerRemap);
      if (!whoOnly) {
        if (this.whatVertex_) hash ^= this.whatVertex_.calculateHashAfterRemap(vertexRemap, null);
        if (this.countVertex_) hash ^= this.countVertex_.calculateHashAfterRemap(vertexRemap, null);
        if (this.stateVertex_) hash ^= this.stateVertex_.calculateHashAfterRemap(vertexRemap, null);
        if (this.rotationVertex_) hash ^= this.rotationVertex_.calculateHashAfterRemap(vertexRemap, null);
      }
    }
    return hash;
  }

  override reset(trialState: StateRef, game: GameRef): void {
    super.reset(trialState, game);
    const numVert = game.board().topology().cells().size();
    this.whoVertex_?.clear(trialState);
    this.whatVertex_?.clear(trialState);
    this.countVertex_?.clear(trialState);
    this.stateVertex_?.clear(trialState);
    this.rotationVertex_?.clear(trialState);
    this.valueVertex_?.clear(trialState);
    this.emptyVertex_.set(numVert);
  }

  // Hidden
  isHidden(p: number, s: number, _l: number, _t: SiteType): boolean { return this.hiddenVertex_?.[p]?.get(s) ?? false; }
  isHiddenWhat(p: number, s: number, _l: number, _t: SiteType): boolean { return this.hiddenWhatVertex_?.[p]?.get(s) ?? false; }
  isHiddenWho(p: number, s: number, _l: number, _t: SiteType): boolean { return this.hiddenWhoVertex_?.[p]?.get(s) ?? false; }
  isHiddenState(p: number, s: number, _l: number, _t: SiteType): boolean { return this.hiddenStateVertex_?.[p]?.get(s) ?? false; }
  isHiddenRotation(p: number, s: number, _l: number, _t: SiteType): boolean { return this.hiddenRotationVertex_?.[p]?.get(s) ?? false; }
  isHiddenValue(p: number, s: number, _l: number, _t: SiteType): boolean { return this.hiddenValueVertex_?.[p]?.get(s) ?? false; }
  isHiddenCount(p: number, s: number, _l: number, _t: SiteType): boolean { return this.hiddenCountVertex_?.[p]?.get(s) ?? false; }
  setHidden(st: StateRef, p: number, s: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenVertex_?.[p]?.set(st, s, on); }
  setHiddenWhat(st: StateRef, p: number, s: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenWhatVertex_?.[p]?.set(st, s, on); }
  setHiddenWho(st: StateRef, p: number, s: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenWhoVertex_?.[p]?.set(st, s, on); }
  setHiddenState(st: StateRef, p: number, s: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenStateVertex_?.[p]?.set(st, s, on); }
  setHiddenRotation(st: StateRef, p: number, s: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenRotationVertex_?.[p]?.set(st, s, on); }
  setHiddenValue(st: StateRef, p: number, s: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenValueVertex_?.[p]?.set(st, s, on); }
  setHiddenCount(st: StateRef, p: number, s: number, _l: number, _t: SiteType, on: boolean): void { this.hiddenCountVertex_?.[p]?.set(st, s, on); }

  isPlayable(_site: number): boolean { return true; }
  isOccupied(site: number): boolean { return this.countVertex(site) !== 0; }

  setSite(ts: StateRef, site: number, whoV: number, whatV: number, countV: number, stateV: number, rotV: number, valV: number, _t: SiteType | number): void {
    const wasEmpty = !this.isOccupied(site);
    if (whoV !== UNDEFINED) this.whoVertex_.setChunk(ts, site, whoV);
    if (whatV !== UNDEFINED) this.defaultIfNull(this.whatVertex_).setChunk(ts, site, whatV);
    if (countV !== UNDEFINED && this.countVertex_) this.countVertex_.setChunk(ts, site, countV < 0 ? 0 : countV);
    if (stateV !== UNDEFINED && this.stateVertex_) this.stateVertex_.setChunk(ts, site, stateV);
    if (rotV !== UNDEFINED && this.rotationVertex_) this.rotationVertex_.setChunk(ts, site, rotV);
    if (valV !== UNDEFINED && this.valueVertex_) this.valueVertex_.setChunk(ts, site, valV);
    const isEmpty = !this.isOccupied(site);
    if (wasEmpty === isEmpty) return;
    if (isEmpty) this.addToEmptyVertex(site); else this.removeFromEmptyVertex(site);
  }

  // Cell — 0
  whoCell(_s: number, _l?: number): number { return 0; }
  whatCell(_s: number, _l?: number): number { return 0; }
  countCell(_s: number): number { return 0; }
  stateCell(_s: number, _l?: number): number { return 0; }
  rotationCell(_s: number, _l?: number): number { return 0; }
  valueCell(_s: number, _l?: number): number { return 0; }
  sizeStackCell(_s: number): number { return 0; }

  // Vertex
  override whoVertex(site: number, _level?: number): number { return this.whoVertex_.getChunk(site); }
  override whatVertex(site: number, _level?: number): number { return this.whatVertex_?.getChunk(site) ?? 0; }
  override countVertex(site: number): number {
    if (this.countVertex_) return this.countVertex_.getChunk(site);
    return (this.whoVertex_.getChunk(site) !== 0 || (this.whatVertex_ && this.whatVertex_.getChunk(site) !== 0)) ? 1 : 0;
  }
  override stateVertex(site: number, _level?: number): number { return this.stateVertex_?.getChunk(site) ?? 0; }
  override rotationVertex(site: number, _level?: number): number { return this.rotationVertex_?.getChunk(site) ?? 0; }
  override valueVertex(site: number, _level?: number): number { return this.valueVertex_?.getChunk(site) ?? 0; }
  sizeStackVertex(site: number): number { return this.whatVertex(site) !== 0 ? 1 : 0; }

  // Edge — 0
  whoEdge(_s: number, _l?: number): number { return 0; }
  whatEdge(_s: number, _l?: number): number { return 0; }
  countEdge(_s: number): number { return 0; }
  stateEdge(_s: number, _l?: number): number { return 0; }
  rotationEdge(_s: number, _l?: number): number { return 0; }
  valueEdge(_s: number, _l?: number): number { return 0; }
  sizeStackEdge(_s: number): number { return 0; }

  remove(state: StateRef, site: number, levelOrType: number | SiteType, type?: SiteType): number {
    const t: SiteType = typeof levelOrType === "string" ? levelOrType : (type ?? "Vertex");
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

  override isEmptyVertex(vertex: number): boolean { return this.emptyVertex_.contains(vertex); }
  override isEmptyCell(_site: number): boolean { return true; }
  override isEmptyEdge(_edge: number): boolean { return true; }
  override addToEmptyVertex(site: number): void { this.emptyVertex_.add(site); }
  override removeFromEmptyVertex(site: number): void { this.emptyVertex_.remove(site); }
  override emptyRegion(_type: SiteType): RegionLike { return this.emptyVertex_; }

  private defaultIfNull(p: HashedChunkSet | null): HashedChunkSet { return p ?? this.whoVertex_; }

  emptyChunkSetCell(): null { return null; }
  emptyChunkSetEdge(): null { return null; }
  emptyChunkSetVertex(): ChunkSetLike { return this.emptyVertex_.bitSet(); }
  numChunksWhoCell(): number { return UNDEFINED; }
  numChunksWhoEdge(): number { return UNDEFINED; }
  numChunksWhoVertex(): number { return this.whoVertex_.numChunks(); }
  chunkSizeWhoCell(): number { return UNDEFINED; }
  chunkSizeWhoEdge(): number { return UNDEFINED; }
  chunkSizeWhoVertex(): number { return this.whoVertex_.chunkSize(); }
  numChunksWhatCell(): number { return UNDEFINED; }
  numChunksWhatEdge(): number { return UNDEFINED; }
  numChunksWhatVertex(): number { return this.defaultIfNull(this.whatVertex_).numChunks(); }
  chunkSizeWhatCell(): number { return UNDEFINED; }
  chunkSizeWhatEdge(): number { return UNDEFINED; }
  chunkSizeWhatVertex(): number { return this.defaultIfNull(this.whatVertex_).chunkSize(); }

  matchesWhoVertex(maskOrW: ChunkSetLike | number, patternOrM: ChunkSetLike | number, mw?: number): boolean {
    if (typeof maskOrW === "number") return this.whoVertex_.matchesWord(maskOrW, patternOrM as number, mw!);
    return this.whoVertex_.matches(maskOrW as ChunkSetLike, patternOrM as ChunkSetLike);
  }
  matchesWhoCell(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhoEdge(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhatVertex(maskOrW: ChunkSetLike | number, patternOrM: ChunkSetLike | number, mw?: number): boolean {
    const s = this.defaultIfNull(this.whatVertex_);
    if (typeof maskOrW === "number") return s.matchesWord(maskOrW, patternOrM as number, mw!);
    return s.matches(maskOrW as ChunkSetLike, patternOrM as ChunkSetLike);
  }
  matchesWhatCell(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhatEdge(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }

  violatesNotWhoVertex(mask: ChunkSetLike, pattern: ChunkSetLike, sw?: number): boolean { return this.whoVertex_.violatesNot(mask, pattern, sw); }
  violatesNotWhoCell(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhoEdge(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhatVertex(mask: ChunkSetLike, pattern: ChunkSetLike, sw?: number): boolean { return this.defaultIfNull(this.whatVertex_).violatesNot(mask, pattern, sw); }
  violatesNotWhatCell(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhatEdge(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }

  cloneWhoVertex(): ChunkSetLike { return this.whoVertex_.internalStateCopy(); }
  cloneWhoCell(): null { return null; }
  cloneWhoEdge(): null { return null; }
  cloneWhatVertex(): ChunkSetLike { return this.defaultIfNull(this.whatVertex_).internalStateCopy(); }
  cloneWhatCell(): null { return null; }
  cloneWhatEdge(): null { return null; }
}
