// @java Core/src/other/state/zhash/HashedChunkStackLarge.java

import type { StateHashUpdater } from "./HashedBitSet.js";
import type { SiteType } from "./HashedChunkStack.js";
import { ChunkStackLike } from "./HashedChunkStack.js";

/**
 * Wrapper around ListStack (large stacks), still with hash stub.
 * Faithful 1:1 port of HashedChunkStackLarge.java.
 *
 * In the Java source almost all hash operations are commented out
 * ("still to do..."), so we faithfully replicate that: the hash is never
 * updated — zhash stays 0.
 *
 * @author mrraow (Java), ported to TS
 */
export class HashedChunkStackLarge {
  /** Java: private final ListStack internalState */
  private readonly internalState: ChunkStackLike;
  /** Java: private long zhash = 0L; */
  private zhash = 0;

  constructor(
    numComponents: number,
    numPlayers: number,
    numStates: number,
    numRotations: number,
    numValues: number,
    type: number,
    hidden: boolean,
  );
  constructor(other: HashedChunkStackLarge);
  constructor(
    numComponentsOrOther: number | HashedChunkStackLarge,
    numPlayers?: number,
    numStates?: number,
    numRotations?: number,
    numValues?: number,
    type?: number,
    hidden?: boolean,
  ) {
    if (numComponentsOrOther instanceof HashedChunkStackLarge) {
      const other = numComponentsOrOther;
      this.internalState = ChunkStackLike.copyOf(other.internalState);
      this.zhash = other.zhash;
    } else {
      this.internalState = new ChunkStackLike(
        numComponentsOrOther, numPlayers!, numStates!, numRotations!, numValues!, type!, hidden!,
      );
    }
  }

  /** Java: public long calcHash() */
  calcHash(): number { return this.zhash; }

  /**
   * Java: public long remapHashTo(...) — hash arrays are commented out in Java
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

  // Hash updates are commented out in Java — only state mutations happen

  setState(_trialState: StateHashUpdater, val: number, level?: number): void {
    const sz = this.internalState.size();
    const lv = level ?? (sz - 1);
    if (lv >= sz) return;
    this.internalState.setState(val, lv);
  }

  setRotation(_trialState: StateHashUpdater, val: number, level?: number): void {
    const sz = this.internalState.size();
    const lv = level ?? (sz - 1);
    if (lv >= sz) return;
    this.internalState.setRotation(val, lv);
  }

  setValue(_trialState: StateHashUpdater, val: number, level?: number): void {
    const sz = this.internalState.size();
    const lv = level ?? (sz - 1);
    if (lv >= sz) return;
    this.internalState.setValue(val, lv);
  }

  setWho(_trialState: StateHashUpdater, val: number, level?: number): void {
    const sz = this.internalState.size();
    const lv = level ?? (sz - 1);
    if (lv >= sz) return;
    this.internalState.setWho(val, lv);
  }

  setWhat(_trialState: StateHashUpdater, val: number, level?: number): void {
    const sz = this.internalState.size();
    const lv = level ?? (sz - 1);
    if (lv >= sz) return;
    this.internalState.setWhat(val, lv);
  }

  decrementSize(_trialState: StateHashUpdater): void {
    this.internalState.decrementSize();
  }

  incrementSize(_trialState: StateHashUpdater): void {
    this.internalState.incrementSize();
  }

  // Hidden info passthrough
  isHidden(_player: number, _site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHidden(_player, level);
  }
  isHiddenWhat(_player: number, _site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenWhat(_player, level);
  }
  isHiddenWho(_player: number, _site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenWho(_player, level);
  }
  isHiddenState(_player: number, _site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenState(_player, level);
  }
  isHiddenRotation(_player: number, _site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenRotation(_player, level);
  }
  isHiddenValue(_player: number, _site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenValue(_player, level);
  }
  isHiddenCount(_player: number, _site: number, level: number, _type: SiteType): boolean {
    return this.internalState.isHiddenCount(_player, level);
  }
  setHidden(_s: StateHashUpdater, p: number, _si: number, level: number, _t: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHidden(p, level, on);
  }
  setHiddenWhat(_s: StateHashUpdater, p: number, _si: number, level: number, _t: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenWhat(p, level, on);
  }
  setHiddenWho(_s: StateHashUpdater, p: number, _si: number, level: number, _t: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenWho(p, level, on);
  }
  setHiddenState(_s: StateHashUpdater, p: number, _si: number, level: number, _t: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenState(p, level, on);
  }
  setHiddenRotation(_s: StateHashUpdater, p: number, _si: number, level: number, _t: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenRotation(p, level, on);
  }
  setHiddenValue(_s: StateHashUpdater, p: number, _si: number, level: number, _t: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenValue(p, level, on);
  }
  setHiddenCount(_s: StateHashUpdater, p: number, _si: number, level: number, _t: SiteType, on: boolean): void {
    if (level >= this.internalState.size()) return;
    this.internalState.setHiddenCount(p, level, on);
  }

  // ---------------------------------------------------------------------------
  // Read-only

  clone(): HashedChunkStackLarge { return new HashedChunkStackLarge(this); }

  size(): number { return this.internalState.size(); }
  who(level?: number): number { return this.internalState.who(level); }
  what(level?: number): number { return this.internalState.what(level); }
  state(level?: number): number { return this.internalState.state(level); }
  rotation(level?: number): number { return this.internalState.rotation(level); }
  value(level?: number): number { return this.internalState.value(level); }
}
