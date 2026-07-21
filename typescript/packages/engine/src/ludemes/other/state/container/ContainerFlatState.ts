// @java Core/src/other/state/container/ContainerFlatState.java

import { BaseContainerState } from "./BaseContainerState.js";
import type { SiteType, StateRef, GameRef, ContainerRef, RegionLike } from "./ContainerState.js";
import type { ContainerState } from "./ContainerState.js";
import { HashedBitSet } from "../zhash/HashedBitSet.js";
import { HashedChunkSet, ChunkSetLike } from "../zhash/HashedChunkSet.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";

// Java: Constants.UNDEFINED = -1, Constants.OFF = -2
const UNDEFINED = -1;
const OFF = -2;

// Java: GameType.HiddenInfo flag
const HIDDEN_INFO_FLAG = 0x20000n;

/**
 * Global State for a flat (non-stacking) container item.
 * Faithful 1:1 port of ContainerFlatState.java.
 *
 * @author cambolbro and Eric.Piette and mrraow (Java), ported to TS
 */
export class ContainerFlatState extends BaseContainerState {
  /** Java: protected final HashedBitSet playable */
  protected readonly playable: HashedBitSet | null;
  /** Java: protected final HashedChunkSet who */
  protected readonly who_: HashedChunkSet;
  /** Java: protected final HashedChunkSet what */
  protected readonly what_: HashedChunkSet | null;
  /** Java: protected final HashedChunkSet count */
  protected readonly count_: HashedChunkSet | null;
  /** Java: protected final HashedChunkSet state_ */
  protected readonly state__: HashedChunkSet | null;
  /** Java: protected final HashedChunkSet rotation */
  protected readonly rotation_: HashedChunkSet | null;
  /** Java: protected final HashedChunkSet value */
  protected readonly value_: HashedChunkSet | null;

  protected readonly hidden_: (HashedBitSet | null)[] | null;
  protected readonly hiddenWhat_: (HashedBitSet | null)[] | null;
  protected readonly hiddenWho_: (HashedBitSet | null)[] | null;
  protected readonly hiddenCount_: (HashedBitSet | null)[] | null;
  protected readonly hiddenState_: (HashedBitSet | null)[] | null;
  protected readonly hiddenRotation_: (HashedBitSet | null)[] | null;
  protected readonly hiddenValue_: (HashedBitSet | null)[] | null;

  constructor(
    generator: ZobristHashGenerator,
    game: GameRef,
    container: ContainerRef,
    numSites: number,
    maxWhatVal: number,
    maxStateVal: number,
    maxCountVal: number,
    maxRotationVal: number,
    maxPieceValue: number,
  );
  constructor(other: ContainerFlatState);
  constructor(
    generatorOrOther: ZobristHashGenerator | ContainerFlatState,
    game?: GameRef,
    container?: ContainerRef,
    numSites?: number,
    maxWhatVal?: number,
    maxStateVal?: number,
    maxCountVal?: number,
    maxRotationVal?: number,
    maxPieceValue?: number,
  ) {
    if (generatorOrOther instanceof ContainerFlatState) {
      const other = generatorOrOther;
      super(other);
      this.who_ = other.who_.clone();
      this.what_ = other.what_?.clone() ?? null;
      this.count_ = other.count_?.clone() ?? null;
      this.state__ = other.state__?.clone() ?? null;
      this.rotation_ = other.rotation_?.clone() ?? null;
      this.value_ = other.value_?.clone() ?? null;
      this.playable = other.playable?.clone() ?? null;

      if (other.hidden_ !== null) {
        this.hidden_ = other.hidden_.map((h) => h?.clone() ?? null);
        this.hiddenWhat_ = other.hiddenWhat_!.map((h) => h?.clone() ?? null);
        this.hiddenWho_ = other.hiddenWho_!.map((h) => h?.clone() ?? null);
        this.hiddenCount_ = other.hiddenCount_!.map((h) => h?.clone() ?? null);
        this.hiddenState_ = other.hiddenState_!.map((h) => h?.clone() ?? null);
        this.hiddenRotation_ = other.hiddenRotation_!.map((h) => h?.clone() ?? null);
        this.hiddenValue_ = other.hiddenValue_!.map((h) => h?.clone() ?? null);
      } else {
        this.hidden_ = this.hiddenWhat_ = this.hiddenWho_ = this.hiddenCount_ =
          this.hiddenState_ = this.hiddenRotation_ = this.hiddenValue_ = null;
      }
    } else {
      const generator = generatorOrOther as ZobristHashGenerator;
      super(game!, container!, numSites!);
      const numPlayers = game!.players().count();

      if ((game!.gameFlags() & HIDDEN_INFO_FLAG) === 0n) {
        this.hidden_ = this.hiddenWhat_ = this.hiddenWho_ = this.hiddenCount_ =
          this.hiddenState_ = this.hiddenRotation_ = this.hiddenValue_ = null;
      } else {
        const mk = (n: number) => {
          const arr: (HashedBitSet | null)[] = new Array(numPlayers + 1).fill(null);
          for (let i = 1; i <= numPlayers; i++) arr[i] = new HashedBitSet(generator, n);
          return arr;
        };
        this.hidden_ = mk(numSites!);
        this.hiddenWhat_ = mk(numSites!);
        this.hiddenWho_ = mk(numSites!);
        this.hiddenCount_ = mk(numSites!);
        this.hiddenState_ = mk(numSites!);
        this.hiddenRotation_ = mk(numSites!);
        this.hiddenValue_ = mk(numSites!);
      }

      this.playable = game!.isBoardless() ? new HashedBitSet(generator, numSites!) : null;
      this.who_ = new HashedChunkSet(generator, numPlayers + 1, numSites!);
      this.what_ = maxWhatVal! > 0 ? new HashedChunkSet(generator, maxWhatVal!, numSites!) : null;
      this.count_ = maxCountVal! > 0 ? new HashedChunkSet(generator, maxCountVal!, numSites!) : null;
      this.state__ = maxStateVal! > 0 ? new HashedChunkSet(generator, maxStateVal!, numSites!) : null;
      this.rotation_ = maxRotationVal! > 0 ? new HashedChunkSet(generator, maxRotationVal!, numSites!) : null;
      this.value_ = maxPieceValue! > 0 ? new HashedChunkSet(generator, maxPieceValue!, numSites!) : null;
    }
  }

  override deepClone(): ContainerState { return new ContainerFlatState(this); }

  // ---------------------------------------------------------------------------
  // calcCanonicalHash

  protected calcCanonicalHash(
    siteRemap: number[], _edgeRemap: number[], _vertexRemap: number[],
    playerRemap: number[], whoOnly: boolean,
  ): number {
    let hash = 0;
    if (this.who_) hash ^= this.who_.calculateHashAfterRemap(siteRemap, playerRemap);
    if (!whoOnly) {
      if (this.what_) hash ^= this.what_.calculateHashAfterRemap(siteRemap, null);
      if (this.playable) hash ^= this.playable.calculateHashAfterRemap(siteRemap, false);
      if (this.count_) hash ^= this.count_.calculateHashAfterRemap(siteRemap, null);
      if (this.state__) hash ^= this.state__.calculateHashAfterRemap(siteRemap, null);
      if (this.rotation_) hash ^= this.rotation_.calculateHashAfterRemap(siteRemap, null);
      if (this.value_) hash ^= this.value_.calculateHashAfterRemap(siteRemap, null);
      if (this.hidden_) for (let i = 1; i < this.hidden_.length; i++) hash ^= this.hidden_[i]!.calculateHashAfterRemap(siteRemap, false);
      if (this.hiddenWhat_) for (let i = 1; i < this.hiddenWhat_.length; i++) hash ^= this.hiddenWhat_[i]!.calculateHashAfterRemap(siteRemap, false);
      if (this.hiddenWho_) for (let i = 1; i < this.hiddenWho_.length; i++) hash ^= this.hiddenWho_[i]!.calculateHashAfterRemap(siteRemap, false);
      if (this.hiddenCount_) for (let i = 1; i < this.hiddenCount_.length; i++) hash ^= this.hiddenCount_[i]!.calculateHashAfterRemap(siteRemap, false);
      if (this.hiddenRotation_) for (let i = 1; i < this.hiddenRotation_.length; i++) hash ^= this.hiddenRotation_[i]!.calculateHashAfterRemap(siteRemap, false);
      if (this.hiddenValue_) for (let i = 1; i < this.hiddenValue_.length; i++) hash ^= this.hiddenValue_[i]!.calculateHashAfterRemap(siteRemap, false);
      if (this.hiddenState_) for (let i = 1; i < this.hiddenState_.length; i++) hash ^= this.hiddenState_[i]!.calculateHashAfterRemap(siteRemap, false);
    }
    return hash;
  }

  // ---------------------------------------------------------------------------
  // reset

  override reset(trialState: StateRef, game: GameRef): void {
    super.reset(trialState, game);
    this.who_?.clear(trialState);
    this.what_?.clear(trialState);
    this.count_?.clear(trialState);
    this.state__?.clear(trialState);
    this.rotation_?.clear(trialState);
    this.value_?.clear(trialState);
    if (this.hidden_) for (let i = 1; i < this.hidden_.length; i++) this.hidden_[i]?.clear(trialState);
    if (this.hiddenWhat_) for (let i = 1; i < this.hiddenWhat_.length; i++) this.hiddenWhat_[i]?.clear(trialState);
    if (this.hiddenWho_) for (let i = 1; i < this.hiddenWho_.length; i++) this.hiddenWho_[i]?.clear(trialState);
    if (this.hiddenCount_) for (let i = 1; i < this.hiddenCount_.length; i++) this.hiddenCount_[i]?.clear(trialState);
    if (this.hiddenRotation_) for (let i = 1; i < this.hiddenRotation_.length; i++) this.hiddenRotation_[i]?.clear(trialState);
    if (this.hiddenValue_) for (let i = 1; i < this.hiddenValue_.length; i++) this.hiddenValue_[i]?.clear(trialState);
    if (this.hiddenState_) for (let i = 1; i < this.hiddenState_.length; i++) this.hiddenState_[i]?.clear(trialState);
  }

  // ---------------------------------------------------------------------------
  // Hidden info

  isHidden(player: number, site: number, _level: number, _type: SiteType): boolean {
    if (!this.hidden_) return false;
    return this.hidden_[player]?.get(site - this.offset) ?? false;
  }
  isHiddenWhat(player: number, site: number, _level: number, _type: SiteType): boolean {
    if (!this.hiddenWhat_) return false;
    return this.hiddenWhat_[player]?.get(site - this.offset) ?? false;
  }
  isHiddenWho(player: number, site: number, _level: number, _type: SiteType): boolean {
    if (!this.hiddenWho_) return false;
    return this.hiddenWho_[player]?.get(site - this.offset) ?? false;
  }
  isHiddenState(player: number, site: number, _level: number, _type: SiteType): boolean {
    if (!this.hiddenState_) return false;
    return this.hiddenState_[player]?.get(site - this.offset) ?? false;
  }
  isHiddenRotation(player: number, site: number, _level: number, _type: SiteType): boolean {
    if (!this.hiddenRotation_) return false;
    return this.hiddenRotation_[player]?.get(site - this.offset) ?? false;
  }
  isHiddenValue(player: number, site: number, _level: number, _type: SiteType): boolean {
    if (!this.hiddenValue_) return false;
    return this.hiddenValue_[player]?.get(site - this.offset) ?? false;
  }
  isHiddenCount(player: number, site: number, _level: number, _type: SiteType): boolean {
    if (!this.hiddenCount_) return false;
    return this.hiddenCount_[player]?.get(site - this.offset) ?? false;
  }

  setHidden(state: StateRef, player: number, site: number, _level: number, _type: SiteType, on: boolean): void {
    if (!this.hidden_) throw new Error("No Hidden information, but setHidden was called");
    this.hidden_[player]?.set(state, site - this.offset, on);
  }
  setHiddenWhat(state: StateRef, player: number, site: number, _level: number, _type: SiteType, on: boolean): void {
    if (!this.hiddenWhat_) throw new Error("No Hidden information, but setHiddenWhat was called");
    this.hiddenWhat_[player]?.set(state, site - this.offset, on);
  }
  setHiddenWho(state: StateRef, player: number, site: number, _level: number, _type: SiteType, on: boolean): void {
    if (!this.hiddenWho_) throw new Error("No Hidden information, but setHiddenWho was called");
    this.hiddenWho_[player]?.set(state, site - this.offset, on);
  }
  setHiddenState(state: StateRef, player: number, site: number, _level: number, _type: SiteType, on: boolean): void {
    if (!this.hiddenState_) throw new Error("No Hidden information, but setHiddenState was called");
    this.hiddenState_[player]?.set(state, site - this.offset, on);
  }
  setHiddenRotation(state: StateRef, player: number, site: number, _level: number, _type: SiteType, on: boolean): void {
    if (!this.hiddenRotation_) throw new Error("No Hidden information, but setHiddenRotation was called");
    this.hiddenRotation_[player]?.set(state, site - this.offset, on);
  }
  setHiddenValue(state: StateRef, player: number, site: number, _level: number, _type: SiteType, on: boolean): void {
    if (!this.hiddenValue_) throw new Error("No Hidden information, but setHiddenValue was called");
    this.hiddenValue_[player]?.set(state, site - this.offset, on);
  }
  setHiddenCount(state: StateRef, player: number, site: number, _level: number, _type: SiteType, on: boolean): void {
    if (!this.hiddenCount_) throw new Error("No Hidden information, but setHiddenCount was called");
    this.hiddenCount_[player]?.set(state, site - this.offset, on);
  }

  // ---------------------------------------------------------------------------
  // Playable

  isPlayable(site: number): boolean {
    if (!this.playable) return true;
    return this.playable.get(site - this.offset);
  }

  override setPlayable(trialState: StateRef, site: number, on: boolean): void {
    this.playable?.set(trialState, site, on);
  }

  // ---------------------------------------------------------------------------
  // isOccupied

  isOccupied(site: number): boolean { return this.countCell(site) !== 0; }

  // ---------------------------------------------------------------------------
  // setSite

  setSite(trialState: StateRef, site: number, whoOrLevel: number, whatOrWho: number, countOrWhat: number, stateOrCount: number, rotationOrState: number, valueOrRotation: number, typeOrValue: SiteType | number): void {
    // Dispatch based on 9th arg type
    if (typeof typeOrValue === "string") {
      this._setSiteWithType(trialState, site, whoOrLevel, whatOrWho, countOrWhat, stateOrCount, rotationOrState, valueOrRotation, typeOrValue as SiteType);
    } else {
      this._setSiteWithLevel(trialState, site, whoOrLevel, whatOrWho, countOrWhat, stateOrCount, rotationOrState, valueOrRotation, typeOrValue as number);
    }
  }

  private _setSiteWithType(
    trialState: StateRef, site: number, whoVal: number, whatVal: number, countVal: number,
    stateVal: number, rotationVal: number, valueVal: number, _type: SiteType,
  ): void {
    const wasEmpty = !this.isOccupied(site);

    if (whoVal !== UNDEFINED) this.who_.setChunk(trialState, site - this.offset, whoVal);
    if (whatVal !== UNDEFINED) this.defaultIfNull(this.what_).setChunk(trialState, site - this.offset, whatVal);
    if (countVal !== UNDEFINED) {
      if (this.count_) this.count_.setChunk(trialState, site - this.offset, countVal < 0 ? 0 : countVal);
      else if (countVal > 1) throw new Error("This game does not support counts. countVal=" + countVal);
    }
    if (stateVal !== UNDEFINED) {
      if (this.state__) this.state__.setChunk(trialState, site - this.offset, stateVal);
      else if (stateVal !== 0) throw new Error("This game does not support states. stateVal=" + stateVal);
    }
    if (rotationVal !== UNDEFINED) {
      if (this.rotation_) this.rotation_.setChunk(trialState, site - this.offset, rotationVal);
      else if (rotationVal !== 0) throw new Error("This game does not support rotations. rotationVal=" + rotationVal);
    }
    if (valueVal !== UNDEFINED) {
      if (this.value_) this.value_.setChunk(trialState, site - this.offset, valueVal);
      else if (valueVal !== 0) throw new Error("This game does not support piece values. valueVal=" + valueVal);
    }

    const isEmpty = !this.isOccupied(site);
    if (wasEmpty === isEmpty) return;

    if (isEmpty) {
      this.addToEmptyCell(site);
      if (this.playable && valueVal === OFF) {
        this._checkPlayable(trialState, site);
        const cells = this.container().topology().cells();
        const cellIdx = site - this.offset;
        if (cellIdx < cells.length) {
          for (const nbor of cells[cellIdx]!.adjacent()) {
            this._checkPlayable(trialState, nbor.index());
          }
        }
      }
    } else {
      this.removeFromEmptyCell(site);
      if (this.playable && valueVal === OFF) {
        this.playable.set(trialState, site - this.offset, false);
        const cells = this.container().topology().cells();
        const cellIdx = site - this.offset;
        if (cellIdx < cells.length) {
          for (const nbor of cells[cellIdx]!.adjacent()) {
            if (!this.isOccupied(nbor.index())) this.playable!.set(trialState, nbor.index(), true);
          }
        }
      }
    }
  }

  private _setSiteWithLevel(
    trialState: StateRef, site: number, _level: number, whoVal: number, whatVal: number,
    countVal: number, stateVal: number, rotationVal: number, valueVal: number,
  ): void {
    this._setSiteWithType(trialState, site, whoVal, whatVal, countVal, stateVal, rotationVal, valueVal, "Cell");
  }

  private _checkPlayable(trialState: StateRef, site: number): void {
    if (this.isOccupied(site)) {
      this.playable!.set(trialState, site - this.offset, false);
      return;
    }
    const cells = this.container().topology().cells();
    const cellIdx = site - this.offset;
    if (cellIdx < 0 || cellIdx >= cells.length) return;
    for (const nbor of cells[cellIdx]!.adjacent()) {
      if (this.isOccupied(nbor.index())) {
        this.playable!.set(trialState, site - this.offset, true);
        return;
      }
    }
    this.playable!.set(trialState, site - this.offset, false);
  }

  // ---------------------------------------------------------------------------
  // Cell accessors

  whoCell(site: number, _level?: number): number {
    return this.who_.getChunk(site - this.offset);
  }

  whatCell(site: number, _level?: number): number {
    if (!this.what_) return this.whoCell(site);
    return this.what_.getChunk(site - this.offset);
  }

  stateCell(site: number, _level?: number): number {
    return this.state__?.getChunk(site - this.offset) ?? 0;
  }

  rotationCell(site: number, _level?: number): number {
    return this.rotation_?.getChunk(site - this.offset) ?? 0;
  }

  valueCell(site: number, _level?: number): number {
    return this.value_?.getChunk(site - this.offset) ?? 0;
  }

  countCell(site: number): number {
    if (this.count_) return this.count_.getChunk(site - this.offset);
    if (this.who_.getChunk(site - this.offset) !== 0 || (this.what_ && this.what_.getChunk(site - this.offset) !== 0)) return 1;
    return 0;
  }

  // ---------------------------------------------------------------------------
  // remove

  remove(state: StateRef, site: number, levelOrType: number | SiteType, type?: SiteType): number {
    const t: SiteType = typeof levelOrType === "string" ? levelOrType : (type ?? "Cell");
    const whatIdx = this.what(site, t);
    this.setSite(state, site, 0, 0, 0, 0, 0, 0, t);
    return whatIdx;
  }

  // ---------------------------------------------------------------------------
  // sizeStack accessors

  sizeStackCell(site: number): number { return !this.isEmptyCell(site) ? 1 : 0; }
  sizeStackEdge(_site: number): number { return !this.isEmptyEdge(_site) ? 1 : 0; }
  sizeStackVertex(_site: number): number { return !this.isEmptyVertex(_site) ? 1 : 0; }

  // ---------------------------------------------------------------------------
  // Edge / Vertex — all return 0 (flat cells only)

  whoEdge(_site: number, _level?: number): number { return 0; }
  whatEdge(_site: number, _level?: number): number { return 0; }
  countEdge(_site: number): number { return 0; }
  stateEdge(_site: number, _level?: number): number { return 0; }
  rotationEdge(_site: number, _level?: number): number { return 0; }
  valueEdge(_site: number, _level?: number): number { return 0; }

  whoVertex(_site: number, _level?: number): number { return 0; }
  whatVertex(_site: number, _level?: number): number { return 0; }
  countVertex(_site: number): number { return 0; }
  stateVertex(_site: number, _level?: number): number { return 0; }
  rotationVertex(_site: number, _level?: number): number { return 0; }
  valueVertex(_site: number, _level?: number): number { return 0; }

  // ---------------------------------------------------------------------------
  // setValueCell / setCount

  setValueCell(trialState: StateRef, site: number, valueVal: number): void {
    if (valueVal !== UNDEFINED) {
      if (this.value_) this.value_.setChunk(trialState, site - this.offset, valueVal);
      else if (valueVal !== 0) throw new Error("This game does not support piece values. valueVal=" + valueVal);
    }
  }

  setCount(trialState: StateRef, site: number, countVal: number): void {
    if (countVal !== UNDEFINED) {
      if (this.count_) this.count_.setChunk(trialState, site - this.offset, countVal < 0 ? 0 : countVal);
      else if (countVal > 1) throw new Error("This game does not support counts. countVal=" + countVal);
    }
  }

  // ---------------------------------------------------------------------------
  // No-op stack/item methods (flat containers don't support stacking)

  addItem(_ts: StateRef, _s: number, _w: number, _wh: number, ..._args: unknown[]): void {}
  insert(_ts: StateRef, ..._args: unknown[]): void {}
  insertCell(_ts: StateRef, ..._args: unknown[]): void {}
  removeStack(_ts: StateRef, _s: number): void {}
  addItemVertex(_ts: StateRef, ..._args: unknown[]): void {}
  insertVertex(_ts: StateRef, ..._args: unknown[]): void {}
  removeStackVertex(_ts: StateRef, _s: number): void {}
  addItemEdge(_ts: StateRef, ..._args: unknown[]): void {}
  insertEdge(_ts: StateRef, ..._args: unknown[]): void {}
  removeStackEdge(_ts: StateRef, _s: number): void {}
  addItemGeneric(_ts: StateRef, ..._args: unknown[]): void {}
  removeStackGeneric(_ts: StateRef, _s: number, ..._args: unknown[]): void {}

  // ---------------------------------------------------------------------------
  // addToEmpty / removeFromEmpty (overrides cell-only version)

  override addToEmpty(site: number, _graphType: SiteType): void { this.addToEmptyCell(site); }
  override removeFromEmpty(site: number, _graphType: SiteType): void { this.removeFromEmptyCell(site); }

  // ---------------------------------------------------------------------------
  // defaultIfNull helper

  protected defaultIfNull(preferred: HashedChunkSet | null): HashedChunkSet {
    return preferred ?? this.who_;
  }

  // ---------------------------------------------------------------------------
  // ChunkSet accessors

  emptyChunkSetCell(): ChunkSetLike { return this.empty.bitSet(); }
  emptyChunkSetVertex(): null { return null; }
  emptyChunkSetEdge(): null { return null; }

  numChunksWhoCell(): number { return this.who_.numChunks(); }
  numChunksWhoVertex(): number { return UNDEFINED; }
  numChunksWhoEdge(): number { return UNDEFINED; }
  chunkSizeWhoCell(): number { return this.who_.chunkSize(); }
  chunkSizeWhoVertex(): number { return UNDEFINED; }
  chunkSizeWhoEdge(): number { return UNDEFINED; }
  numChunksWhatCell(): number { return this.defaultIfNull(this.what_).numChunks(); }
  numChunksWhatVertex(): number { return UNDEFINED; }
  numChunksWhatEdge(): number { return UNDEFINED; }
  chunkSizeWhatCell(): number { return this.defaultIfNull(this.what_).chunkSize(); }
  chunkSizeWhatVertex(): number { return UNDEFINED; }
  chunkSizeWhatEdge(): number { return UNDEFINED; }

  matchesWhoCell(maskOrWordIdx: ChunkSetLike | number, patternOrMask: ChunkSetLike | number, matchingWord?: number): boolean {
    if (typeof maskOrWordIdx === "number") return this.who_.matchesWord(maskOrWordIdx, patternOrMask as number, matchingWord!);
    return this.who_.matches(maskOrWordIdx as ChunkSetLike, patternOrMask as ChunkSetLike);
  }
  matchesWhoVertex(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhoEdge(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }

  matchesWhatCell(maskOrWordIdx: ChunkSetLike | number, patternOrMask: ChunkSetLike | number, matchingWord?: number): boolean {
    const set = this.defaultIfNull(this.what_);
    if (typeof maskOrWordIdx === "number") return set.matchesWord(maskOrWordIdx, patternOrMask as number, matchingWord!);
    return set.matches(maskOrWordIdx as ChunkSetLike, patternOrMask as ChunkSetLike);
  }
  matchesWhatVertex(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }
  matchesWhatEdge(_m: ChunkSetLike | number, _p: ChunkSetLike | number, _mw?: number): boolean { return false; }

  violatesNotWhoCell(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean {
    return this.who_.violatesNot(mask, pattern, startWord);
  }
  violatesNotWhoVertex(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhoEdge(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhatCell(mask: ChunkSetLike, pattern: ChunkSetLike, startWord?: number): boolean {
    return this.defaultIfNull(this.what_).violatesNot(mask, pattern, startWord);
  }
  violatesNotWhatVertex(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }
  violatesNotWhatEdge(_m: ChunkSetLike, _p: ChunkSetLike, _sw?: number): boolean { return false; }

  cloneWhoCell(): ChunkSetLike { return this.who_.internalStateCopy(); }
  cloneWhoVertex(): ChunkSetLike | null { return null; }
  cloneWhoEdge(): ChunkSetLike | null { return null; }
  cloneWhatCell(): ChunkSetLike { return this.defaultIfNull(this.what_).internalStateCopy(); }
  cloneWhatVertex(): ChunkSetLike | null { return null; }
  cloneWhatEdge(): ChunkSetLike | null { return null; }
}
