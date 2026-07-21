// @java Core/src/other/state/track/OnTrackIndicesCOW.java

import { OnTrackIndices } from "./OnTrackIndices.js";

/**
 * A subclass of OnTrackIndices with copy-on-write (COW) optimisations.
 * Faithful 1:1 port of OnTrackIndicesCOW.java.
 *
 * @author Dennis Soemers (Java), ported to TS
 */
export class OnTrackIndicesCOW extends OnTrackIndices {
  /** Did we make a deep copy for given onTrackIndices at given trackIdx? */
  private readonly copiedOnTrackIndices: boolean[];

  /**
   * Copy constructor (with copy-on-write behaviour).
   * Java: public OnTrackIndicesCOW(final OnTrackIndices other)
   */
  constructor(other: OnTrackIndices) {
    // We just copy the reference arrays (shallow copy of outer array)
    // Java: super(Arrays.copyOf(other.onTrackIndices, other.onTrackIndices.length), other.locToIndex)
    const oti = other.onTrackIndicesAll();
    const shallowCopy = [...oti];
    const locToIdx = (other as unknown as { locToIndex: Map<number, number[]>[] }).locToIndex;
    super(shallowCopy, locToIdx);

    this.copiedOnTrackIndices = new Array(shallowCopy.length).fill(false);
  }

  // ---------------------------------------------------------------------------

  /** Java: public void add(int trackIdx, int what, int count, int index) */
  override add(trackIdx: number, what: number, count: number, index: number): void {
    this.ensureDeepCopy(trackIdx);
    super.add(trackIdx, what, count, index);
  }

  /** Java: public void remove(int trackIdx, int what, int count, int index) */
  override remove(trackIdx: number, what: number, count: number, index: number): void {
    this.ensureDeepCopy(trackIdx);
    super.remove(trackIdx, what, count, index);
  }

  /**
   * Ensures that we have a deep copy for the given track index before modifying.
   * Java: public void ensureDeepCopy(final int trackIdx)
   */
  ensureDeepCopy(trackIdx: number): void {
    if (!this.copiedOnTrackIndices[trackIdx]) {
      const otherOnTracks = this.onTrackIndices[trackIdx]!;
      this.onTrackIndices[trackIdx] = otherOnTracks.map((arr) => [...arr]);
      this.copiedOnTrackIndices[trackIdx] = true;
    }
  }
}
