// @java Core/src/other/state/zhash/HashedChunkStack.java

import type { StateHashUpdater } from "./HashedBitSet.js";

/** Site type enum mirroring Java's game.types.board.SiteType. */
export type SiteType = "Cell" | "Edge" | "Vertex";

/**
 * Minimal ChunkStack-like structure.
 * Java: main.collections.ChunkStack — stores per-level what/who/state/rotation/value
 * plus optional hidden flags per player.
 */
export class ChunkStackLike {
  private size_ = 0;
  private readonly what_: number[] = [];
  private readonly who_: number[] = [];
  private readonly state_: number[] = [];
  private readonly rotation_: number[] = [];
  private readonly value_: number[] = [];

  constructor(
    _numComponents: number,
    _numPlayers: number,
    _numStates: number,
    _numRotations: number,
    _numValues: number,
    _type: number,
    _hidden: boolean,
  ) {}

  /** Copy constructor. Java: new ChunkStack(that.internalState) */
  static copyOf(src: ChunkStackLike): ChunkStackLike {
    const c = new ChunkStackLike(0, 0, 0, 0, 0, 0, false);
    c.size_ = src.size_;
    c.what_.push(...src.what_);
    c.who_.push(...src.who_);
    c.state_.push(...src.state_);
    c.rotation_.push(...src.rotation_);
    c.value_.push(...src.value_);
    return c;
  }

  size(): number { return this.size_; }

  what(level?: number): number { return this.what_[(level ?? this.size_ - 1)] ?? 0; }
  who(level?: number): number { return this.who_[(level ?? this.size_ - 1)] ?? 0; }
  state(level?: number): number { return this.state_[(level ?? this.size_ - 1)] ?? 0; }
  rotation(level?: number): number { return this.rotation_[(level ?? this.size_ - 1)] ?? 0; }
  value(level?: number): number { return this.value_[(level ?? this.size_ - 1)] ?? 0; }

  whoChunkSet(): { getAndSetChunk: (level: number, val: number) => number } {
    const self = this;
    return {
      getAndSetChunk(level: number, val: number): number {
        const old = self.who_[level] ?? 0;
        self.who_[level] = val;
        return old;
      },
    };
  }

  whatChunkSet(): { getAndSetChunk: (level: number, val: number) => number } {
    const self = this;
    return {
      getAndSetChunk(level: number, val: number): number {
        const old = self.what_[level] ?? 0;
        self.what_[level] = val;
        return old;
      },
    };
  }

  setWhat(val: number, level: number): void { this.what_[level] = val; }
  setWho(val: number, level: number): void { this.who_[level] = val; }
  setState(val: number, level: number): void { this.state_[level] = val; }
  setRotation(val: number, level: number): void { this.rotation_[level] = val; }
  setValue(val: number, level: number): void { this.value_[level] = val; }

  incrementSize(): void { this.size_++; }
  decrementSize(): void { if (this.size_ > 0) this.size_--; }

  // Hidden info (simplified — all false) ——— Java stores bitmasks per player
  isHidden(_player: number, _level: number): boolean { return false; }
  isHiddenWhat(_player: number, _level: number): boolean { return false; }
  isHiddenWho(_player: number, _level: number): boolean { return false; }
  isHiddenState(_player: number, _level: number): boolean { return false; }
  isHiddenRotation(_player: number, _level: number): boolean { return false; }
  isHiddenValue(_player: number, _level: number): boolean { return false; }
  isHiddenCount(_player: number, _level: number): boolean { return false; }
  setHidden(_player: number, _level: number, _on: boolean): void {}
  setHiddenWhat(_player: number, _level: number, _on: boolean): void {}
  setHiddenWho(_player: number, _level: number, _on: boolean): void {}
  setHiddenState(_player: number, _level: number, _on: boolean): void {}
  setHiddenRotation(_player: number, _level: number, _on: boolean): void {}
  setHiddenValue(_player: number, _level: number, _on: boolean): void {}
  setHiddenCount(_player: number, _level: number, _on: boolean): void {}
}

/**
 * Wrapper around ChunkStack that keeps a Zobrist hash in sync.
 * Faithful 1:1 port of HashedChunkStack.java.
 *
 * @author mrraow (Java), ported to TS
 */
export class HashedChunkStack {
  private readonly internalState: ChunkStackLike;
  private readonly whatHash: number[][];
  private readonly whoHash: number[][];
  private readonly stateHash: number[][];
  private readonly rotationHash: number[][];
  private readonly valueHash: number[][];
  private readonly sizeHash: number[];
  private zhash = 0;

  constructor(
    numComponents: number,
    numPlayers: number,
    numStates: number,
    numRotations: number,
    numValues: number,
    type: number,
    hidden: boolean,
    whatHash: number[][],
    whoHash: number[][],
    stateHash: number[][],
    rotationHash: number[][],
    valueHash: number[][],
    sizeHash: number[],
  );
  constructor(other: HashedChunkStack);
  constructor(
    numComponentsOrOther: number | HashedChunkStack,
    numPlayers?: number,
    numStates?: number,
    numRotations?: number,
    numValues?: number,
    type?: number,
    hidden?: boolean,
    whatHash?: number[][],
    whoHash?: number[][],
    stateHash?: number[][],
    rotationHash?: number[][],
    valueHash?: number[][],
    sizeHash?: number[],
  ) {
    if (numComponentsOrOther instanceof HashedChunkStack) {
      const other = numComponentsOrOther;
      this.internalState = ChunkStackLike.copyOf(other.internalState);
      this.whatHash = other.whatHash;
      this.whoHash = other.whoHash;
      this.stateHash = other.stateHash;
      this.rotationHash = other.rotationHash;
      this.valueHash = other.valueHash;
      this.sizeHash = other.sizeHash;
      this.zhash = other.zhash;
    } else {
      this.internalState = new ChunkStackLike(
        numComponentsOrOther, numPlayers!, numStates!, numRotations!, numValues!, type!, hidden!,
      );
      this.whatHash = whatHash!;
      this.whoHash = whoHash!;
      this.stateHash = stateHash!;
      this.rotationHash = rotationHash!;
      this.valueHash = valueHash!;
      this.sizeHash = sizeHash!;
    }
  }

  /** Java: public long calcHash() */
  calcHash(): number { return this.zhash; }

  /**
   * Java: public long remapHashTo(...)
   */
  remapHashTo(
    newWhatHash: number[][],
    newWhoHash: number[][],
    newStateHash: number[][],
    newRotationHash: number[][],
    newValueHash: number[][],
    newSizeHash: number[],
    whoOnly: boolean,
  ): number {
    let hash = newSizeHash[this.internalState.size()]!;
    for (let level = 0; level < this.internalState.size(); level++) {
      if (whoOnly) {
        hash ^= newWhoHash[level]![this.internalState.who(level)]!;
      } else {
        hash ^= newStateHash[level]![this.internalState.state(level)]!;
        hash ^= newRotationHash[level]![this.internalState.rotation(level)]!;
        hash ^= newValueHash[level]![this.internalState.value(level)]!;
        hash ^= newWhoHash[level]![this.internalState.who(level)]!;
        hash ^= newWhatHash[level]![this.internalState.what(level)]!;
      }
    }
    return hash;
  }

  // ---------------------------------------------------------------------------
  // Mutating methods

  setState(trialState: StateHashUpdater, val: number, level?: number): void {
    const sz = this.internalState.size();
    const lv = level ?? (sz - 1);
    if (lv >= sz) return;
    const delta1 = this.stateHash[lv]![this.internalState.state(lv)]!;
    this.internalState.setState(val, lv);
    const delta2 = this.stateHash[lv]![this.internalState.state(lv)]!;
    const d = delta1 ^ delta2;
    trialState.updateStateHash(d);
    this.zhash ^= d;
  }

  setRotation(trialState: StateHashUpdater, val: number, level?: number): void {
    const sz = this.internalState.size();
    const lv = level ?? (sz - 1);
    if (lv >= sz) return;
    const delta1 = this.rotationHash[lv]![this.internalState.rotation(lv)]!;
    this.internalState.setRotation(val, lv);
    const delta2 = this.rotationHash[lv]![this.internalState.rotation(lv)]!;
    const d = delta1 ^ delta2;
    trialState.updateStateHash(d);
    this.zhash ^= d;
  }

  setValue(trialState: StateHashUpdater, val: number, level?: number): void {
    const sz = this.internalState.size();
    const lv = level ?? (sz - 1);
    if (lv >= sz) return;
    const delta1 = this.valueHash[lv]![this.internalState.value(lv)]!;
    this.internalState.setValue(val, lv);
    const delta2 = this.valueHash[lv]![this.internalState.value(lv)]!;
    const d = delta1 ^ delta2;
    trialState.updateStateHash(d);
    this.zhash ^= d;
  }

  setWho(trialState: StateHashUpdater, val: number, level?: number): void {
    const sz = this.internalState.size();
    const lv = level ?? (sz - 1);
    if (lv >= sz) return;
    const delta1 = this.whoHash[lv]![this.internalState.whoChunkSet().getAndSetChunk(lv, val)]!;
    const delta2 = this.whoHash[lv]![this.internalState.who(lv)]!;
    const d = delta1 ^ delta2;
    trialState.updateStateHash(d);
    this.zhash ^= d;
  }

  setWhat(trialState: StateHashUpdater, val: number, level?: number): void {
    const sz = this.internalState.size();
    const lv = level ?? (sz - 1);
    if (lv >= sz) return;
    const delta1 = this.whatHash[lv]![this.internalState.whatChunkSet().getAndSetChunk(lv, val)]!;
    const delta2 = this.whatHash[lv]![this.internalState.what(lv)]!;
    const d = delta1 ^ delta2;
    trialState.updateStateHash(d);
    this.zhash ^= d;
  }

  decrementSize(trialState: StateHashUpdater): void {
    const d = this.sizeHash[this.internalState.size()]! ^ this.sizeHash[this.internalState.size() - 1]!;
    // Java: delta = sizeHash[size]; decrementSize(); delta ^= sizeHash[size]
    const before = this.sizeHash[this.internalState.size()]!;
    this.internalState.decrementSize();
    const after = this.sizeHash[this.internalState.size()]!;
    const delta = before ^ after;
    trialState.updateStateHash(delta);
    this.zhash ^= delta;
  }

  incrementSize(trialState: StateHashUpdater): void {
    const before = this.sizeHash[this.internalState.size()]!;
    this.internalState.incrementSize();
    const after = this.sizeHash[this.internalState.size()]!;
    const delta = before ^ after;
    trialState.updateStateHash(delta);
    this.zhash ^= delta;
  }

  // Hidden setters/getters
  isHidden(player: number, site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHidden(player, level);
  }
  isHiddenWhat(player: number, site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenWhat(player, level);
  }
  isHiddenWho(player: number, site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenWho(player, level);
  }
  isHiddenState(player: number, site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenState(player, level);
  }
  isHiddenRotation(player: number, site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenRotation(player, level);
  }
  isHiddenValue(player: number, site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenValue(player, level);
  }
  isHiddenCount(player: number, site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenCount(player, level);
  }
  setHidden(state: StateHashUpdater, player: number, site: number, level: number, type: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHidden(player, level, on);
  }
  setHiddenWhat(state: StateHashUpdater, player: number, site: number, level: number, type: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenWhat(player, level, on);
  }
  setHiddenWho(state: StateHashUpdater, player: number, site: number, level: number, type: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenWho(player, level, on);
  }
  setHiddenState(state: StateHashUpdater, player: number, site: number, level: number, type: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenState(player, level, on);
  }
  setHiddenRotation(state: StateHashUpdater, player: number, site: number, level: number, type: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenRotation(player, level, on);
  }
  setHiddenValue(state: StateHashUpdater, player: number, site: number, level: number, type: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenValue(player, level, on);
  }
  setHiddenCount(state: StateHashUpdater, player: number, site: number, level: number, type: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenCount(player, level, on);
  }

  // ---------------------------------------------------------------------------
  // Read-only

  clone(): HashedChunkStack { return new HashedChunkStack(this); }

  size(): number { return this.internalState.size(); }
  who(level?: number): number { return this.internalState.who(level); }
  what(level?: number): number { return this.internalState.what(level); }
  state(level?: number): number { return this.internalState.state(level); }
  rotation(level?: number): number { return this.internalState.rotation(level); }
  value(level?: number): number { return this.internalState.value(level); }
}
