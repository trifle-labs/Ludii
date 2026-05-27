// @java Core/src/other/state/track/OnTrackIndices.java OnTrackIndices
// @java Core/src/other/action/move/ActionMoveN.java ActionMoveN (apply 297-340)
// @java Core/src/other/action/move/ActionAdd.java ActionAdd (onTrackIndices block)
/**
 * Per-state "where is each kind of piece on each track" structure, used to
 * disambiguate a repeated site on an internal-loop track (Pachisi/Ludo/Barjis
 * family). Java keeps this as a mutable `OnTrackIndices` on the `State`,
 * allocated only when the game has an internal-loop track (State.java:496).
 * Here it is an immutable nested array `onTrackIndices[trackIdx][what][ringIndex]
 * = count`, paired with the static `trackLocToIndex[trackIdx]: site → ringIndices`
 * map carried alongside it on the {@link State}.
 *
 * The two operations Java performs on it that affect replay are:
 *  - initial population (start placements, via `ActionAdd`-style "add at the
 *    first ring index for the site"), and
 *  - per-move maintenance (`ActionMoveN.apply`, lines 297-340), which advances a
 *    moved piece's recorded ring index.
 * Both are reproduced below. Everything is keyed by `what != 0`; a `what == 0`
 * move is a no-op, exactly as Java's `if (what != 0 && onTrackIndices != null)`.
 */

import type { MancalaTrack } from "./eval/eval-context.js";
import type { OnTrackIndices, TrackLocToIndex } from "./state.js";

/**
 * Static `trackLocToIndex` companion for a set of tracks: each track's
 * `locToIndex` (site → ring indices), indexed by `trackIdx`. Shared by
 * reference across all state copies (Java OnTrackIndices.locToIndex, line 92).
 * Returns `undefined` when no track is an internal loop (the structure is then
 * never allocated, matching Java's `hasInternalLoopInTrack` gate).
 */
export function buildTrackLocToIndex(
  tracks: readonly MancalaTrack[],
): TrackLocToIndex | undefined {
  if (!tracks.some((t) => t.internalLoop)) return undefined;
  const out: ReadonlyMap<number, readonly number[]>[] = [];
  for (let trackIdx = 0; trackIdx < tracks.length; trackIdx += 1) {
    const track = tracks[trackIdx];
    // Prefer the precomputed map (parseTracks); fall back to deriving it from
    // the ring so a track missing the field still resolves correctly.
    const loc =
      track?.locToIndex ?? deriveLocToIndex(track ? track.sites : []);
    out[trackIdx] = loc;
  }
  return out;
}

/** site → every ring index whose elem sits on that site (Java OnTrackIndices ctor 55-64). */
function deriveLocToIndex(
  sites: readonly number[],
): ReadonlyMap<number, readonly number[]> {
  const map = new Map<number, number[]>();
  for (let j = 0; j < sites.length; j += 1) {
    const site = sites[j] as number;
    const cur = map.get(site);
    if (cur) cur.push(j);
    else map.set(site, [j]);
  }
  return map;
}

/**
 * Build the initial `onTrackIndices` counts by scanning the starting board, the
 * way the start placements would have via `ActionAdd` (add `count` at the first
 * ring index for the site, on every track that contains it — ActionAdd.java
 * onTrackIndices block). Pieces sitting in hand are not on any track and so add
 * nothing (their site has no ring index), matching Java: they only enter the
 * structure when a move places them on the board.
 *
 * `numWhat` is the component count (`componentLabels.length`) — the second
 * dimension is dense, exactly like Java's `numWhat`-sized lists.
 */
export function buildInitialOnTrackIndices(
  tracks: readonly MancalaTrack[],
  trackLocToIndex: TrackLocToIndex,
  numWhat: number,
  whatAt: (site: number) => number,
  countAt: (site: number) => number,
  numCells: number,
): OnTrackIndices {
  // Dense allocation: onTrackIndices[trackIdx][what][ringIndex] = 0.
  const oti: number[][][] = [];
  for (let trackIdx = 0; trackIdx < tracks.length; trackIdx += 1) {
    const len = tracks[trackIdx]?.sites.length ?? 0;
    const perWhat: number[][] = [];
    for (let what = 0; what < numWhat; what += 1) {
      perWhat.push(new Array<number>(len).fill(0));
    }
    oti[trackIdx] = perWhat;
  }
  // Scan every cell; a piece (what != 0) adds its count at the first ring index
  // for its site on each track that contains the site.
  for (let site = 0; site < numCells; site += 1) {
    const what = whatAt(site);
    if (what <= 0 || what >= numWhat) continue;
    const count = countAt(site);
    const addCount = count > 0 ? count : 1;
    for (let trackIdx = 0; trackIdx < trackLocToIndex.length; trackIdx += 1) {
      const indices = trackLocToIndex[trackIdx]?.get(site);
      if (indices && indices.length > 0) {
        const firstIdx = indices[0] as number;
        const lane = oti[trackIdx]?.[what];
        if (lane) lane[firstIdx] = (lane[firstIdx] ?? 0) + addCount;
      }
    }
  }
  return oti;
}

/**
 * Per-move maintenance — faithful port of `ActionMoveN.apply` lines 297-340.
 * Returns a NEW `onTrackIndices` (the input is treated as immutable). Called
 * with the moved piece's `what` (already known to be != 0), the move `count`,
 * and the `from`/`to` sites. Loops over EVERY track (Java does too), so a
 * piece's recorded index advances on whichever track(s) carry it.
 *
 *  - For a track that already records the piece at `from`: remove `count` there,
 *    then re-add it at the first ring index of `to` strictly after the old index
 *    (`locToIndexFrom`); if none, at the first ring index of `to`.
 *  - For a track that did NOT record the piece at `from` (the piece is entering
 *    the track, e.g. from hand): add 1 at the first ring index of `to`.
 */
export function maintainOnTrackIndicesForMove(
  prev: OnTrackIndices,
  trackLocToIndex: TrackLocToIndex,
  what: number,
  count: number,
  from: number,
  to: number,
): OnTrackIndices {
  // Copy-on-write: only the lanes we touch need new arrays, but the structure
  // is small (tracks × components × ring) and moves are infrequent in these
  // games, so a straightforward deep copy of the touched track lanes is fine.
  const next: number[][][] = prev.map((track) =>
    track.map((lane) => lane.slice()),
  );
  for (let trackIdx = 0; trackIdx < trackLocToIndex.length; trackIdx += 1) {
    const loc = trackLocToIndex[trackIdx];
    const lane = next[trackIdx]?.[what];
    if (!loc || !lane) continue;
    const indicesLocFrom = loc.get(from) ?? [];

    for (let k = 0; k < indicesLocFrom.length; k += 1) {
      const indexA = indicesLocFrom[k] as number;
      const countAtIndex = lane[indexA] ?? 0;
      if (countAtIndex > 0) {
        lane[indexA] = countAtIndex - count;
        const indicesLocTo = loc.get(to) ?? [];
        const after = indicesLocTo.find((i) => i > indexA);
        if (after !== undefined) {
          lane[after] = (lane[after] ?? 0) + count;
        } else if (indicesLocTo.length > 0) {
          const first = indicesLocTo[0] as number;
          lane[first] = (lane[first] ?? 0) + count;
        }
        break;
      }
    }

    // Entering the track (the piece was not recorded at `from`).
    if (indicesLocFrom.length === 0) {
      const indicesLocTo = loc.get(to) ?? [];
      if (indicesLocTo.length > 0) {
        const first = indicesLocTo[0] as number;
        lane[first] = (lane[first] ?? 0) + 1;
      }
    }
  }
  return next;
}

/**
 * Per-removal maintenance — faithful port of `ActionRemoveTopPiece.apply`'s
 * onTrackIndices block: decrement the removed piece (`what`) by 1 at EVERY ring
 * index of the removal `site`, on every track. This is what drops a borne-off or
 * captured piece out of the structure so a later `(trackSite Move …)` no longer
 * resolves to its stale index. Java's factory `ActionRemove.construct` returns
 * `ActionRemoveTopPiece` for the ordinary (non-stacking) case, so every
 * `(move Remove …)` runs this. Returns a NEW `onTrackIndices`.
 */
export function maintainOnTrackIndicesForRemove(
  prev: OnTrackIndices,
  trackLocToIndex: TrackLocToIndex,
  what: number,
  site: number,
): OnTrackIndices {
  const next: number[][][] = prev.map((track) =>
    track.map((lane) => lane.slice()),
  );
  for (let trackIdx = 0; trackIdx < trackLocToIndex.length; trackIdx += 1) {
    const loc = trackLocToIndex[trackIdx];
    const lane = next[trackIdx]?.[what];
    if (!loc || !lane) continue;
    const indices = loc.get(site) ?? [];
    for (const index of indices) {
      lane[index] = (lane[index] ?? 0) - 1;
    }
  }
  return next;
}
