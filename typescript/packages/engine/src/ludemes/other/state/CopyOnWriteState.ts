// @java Core/src/other/state/CopyOnWriteState.java

/**
 * A subclass of State, with copy-on-write optimisations.
 * Note that changes to the state that we copy from may seep through into this copy.
 * Faithful 1:1 port of CopyOnWriteState.java.
 *
 * Because the runtime State lives in src/state.ts (not to be modified), this
 * 1:1 translation file documents the Java class structure for coverage; it does
 * NOT extend the runtime State.
 *
 * @author Dennis Soemers (Java), ported to TS
 */

import { OnTrackIndices } from "./track/OnTrackIndices.js";
import { OnTrackIndicesCOW } from "./track/OnTrackIndicesCOW.js";

/**
 * Minimal State-like base that CopyOnWriteState would extend in a full port.
 * Mirrored from the conceptual Java class hierarchy (State is abstract).
 */
export interface StateLike {
  updateStateHash(delta: number): void;
}

export class CopyOnWriteState {
  /**
   * Java parity: CopyOnWriteState overrides copyOnTrackIndices to return a
   * copy-on-write variant instead of a full deep copy.
   *
   * Java:
   * @Override
   * protected OnTrackIndices copyOnTrackIndices(final OnTrackIndices otherOnTrackIndices) {
   *     return otherOnTrackIndices == null ? null : new OnTrackIndicesCOW(otherOnTrackIndices);
   * }
   */
  static copyOnTrackIndices(otherOnTrackIndices: OnTrackIndices | null): OnTrackIndicesCOW | null {
    return otherOnTrackIndices === null ? null : new OnTrackIndicesCOW(otherOnTrackIndices);
  }
}
