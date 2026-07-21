// @java Core/src/other/state/track/OnTrackIndices.java

/**
 * Structure used to know where each kind of piece is on each track.
 * Note: TrackIndex --> IndexComponent --> IndexOnTrack --> Count.
 * Faithful 1:1 port of OnTrackIndices.java.
 *
 * Java uses gnu.trove.list.array.TIntArrayList and FastTIntArrayList;
 * we use number[] equivalents.
 *
 * @author Eric.Piette (Java), ported to TS
 */

/** Simplified track element mirroring game.equipment.container.board.Track */
export interface TrackLike {
  elems(): Array<{ site: number }>;
}

export class OnTrackIndices {
  /** The map for each track: trackIdx -> componentIdx -> counts per track position */
  protected readonly onTrackIndices: number[][][];

  /**
   * The map between the index of the tracks and the corresponding sites.
   * trackIdx -> site -> list of track indices
   */
  protected readonly locToIndex: Map<number, number[]>[];

  /**
   * Constructor.
   * @param tracks The list of tracks.
   * @param numWhat The number of components.
   */
  constructor(tracks: TrackLike[], numWhat: number);
  /** Deep copy constructor. */
  constructor(other: OnTrackIndices);
  /**
   * Protected constructor using direct references.
   */
  constructor(
    onTrackIndices: number[][][],
    locToIndex: Map<number, number[]>[],
  );
  constructor(
    tracksOrOther: TrackLike[] | OnTrackIndices | number[][][],
    numWhatOrLocToIndex?: number | Map<number, number[]>[],
  ) {
    if (tracksOrOther instanceof OnTrackIndices) {
      // Deep copy constructor
      const other = tracksOrOther;
      this.onTrackIndices = other.onTrackIndices.map(
        (tracksForIdx) => tracksForIdx.map((arr) => [...arr]),
      );
      // locToIndex can be shared by reference (Java: this.locToIndex = other.locToIndex)
      this.locToIndex = other.locToIndex;
    } else if (Array.isArray(tracksOrOther) && tracksOrOther.length > 0 && Array.isArray(tracksOrOther[0]) && Array.isArray((tracksOrOther[0] as unknown[])[0])) {
      // Direct reference constructor (protected)
      this.onTrackIndices = tracksOrOther as number[][][];
      this.locToIndex = numWhatOrLocToIndex as Map<number, number[]>[];
    } else {
      // Standard constructor
      const tracks = tracksOrOther as TrackLike[];
      const numWhat = numWhatOrLocToIndex as number;
      this.onTrackIndices = [];
      this.locToIndex = [];

      for (let trackIdx = 0; trackIdx < tracks.length; ++trackIdx) {
        const track = tracks[trackIdx]!;
        const elems = track.elems();
        const size = elems.length;

        const onTracks: number[][] = [];
        for (let i = 0; i < numWhat; i++) {
          const arr = new Array(size).fill(0);
          onTracks.push(arr);
        }
        this.onTrackIndices.push(onTracks);

        const locToIndexTrack = new Map<number, number[]>();
        for (let j = 0; j < size; j++) {
          const site = elems[j]!.site;
          if (!locToIndexTrack.has(site)) locToIndexTrack.set(site, []);
          locToIndexTrack.get(site)!.push(j);
        }
        this.locToIndex.push(locToIndexTrack);
      }
    }
  }

  // ---------------------------------------------------------------------------

  /** Java: public List<FastTIntArrayList> whats(final int trackIdx) */
  whats(trackIdx: number): number[][];
  /** Java: public FastTIntArrayList whats(final int trackIdx, final int what) */
  whats(trackIdx: number, what: number): number[];
  /** Java: public int whats(final int trackIdx, final int what, final int index) */
  whats(trackIdx: number, what: number, index: number): number;
  whats(trackIdx: number, what?: number, index?: number): number[][] | number[] | number {
    if (what === undefined) return this.onTrackIndices[trackIdx]!;
    if (index === undefined) return this.onTrackIndices[trackIdx]![what]!;
    return this.onTrackIndices[trackIdx]![what]![index]!;
  }

  /** Java: public List<FastTIntArrayList>[] onTrackIndices() */
  onTrackIndicesAll(): number[][][] {
    return this.onTrackIndices;
  }

  /**
   * Adds count to a specific index on a track.
   * Java: public void add(int trackIdx, int what, int count, int index)
   */
  add(trackIdx: number, what: number, count: number, index: number): void {
    const cur = this.onTrackIndices[trackIdx]![what]![index]!;
    this.onTrackIndices[trackIdx]![what]![index] = cur + count;
  }

  /**
   * Removes count from a specific index on a track.
   * Java: public void remove(int trackIdx, int what, int count, int index)
   */
  remove(trackIdx: number, what: number, count: number, index: number): void {
    const cur = this.onTrackIndices[trackIdx]![what]![index]!;
    this.onTrackIndices[trackIdx]![what]![index] = cur - count;
  }

  /**
   * Returns all track indices with at least one component of type `what`.
   * Java: public FastTIntArrayList indicesWithWhat(int trackIdx, int what)
   */
  indicesWithWhat(trackIdx: number, what: number): number[] {
    const result: number[] = [];
    const arr = this.onTrackIndices[trackIdx]![what]!;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]! !== 0) result.push(i);
    }
    return result;
  }

  /**
   * Java: public TIntObjectMap<FastTIntArrayList> locToIndex(int trackIdx)
   */
  locToIndexMap(trackIdx: number): Map<number, number[]> {
    return this.locToIndex[trackIdx]!;
  }

  /**
   * Java: public FastTIntArrayList locToIndex(int trackIdx, int site)
   */
  locToIndexAt(trackIdx: number, site: number): number[] {
    return this.locToIndex[trackIdx]!.get(site) ?? [];
  }

  /**
   * Java: public FastTIntArrayList locToIndexFrom(int trackIdx, int site, int from)
   */
  locToIndexFrom(trackIdx: number, site: number, from: number): number[] {
    const indices = this.locToIndex[trackIdx]!.get(site);
    if (!indices) return [];
    return indices.filter((i) => i > from);
  }

  equals(obj: unknown): boolean {
    if (!(obj instanceof OnTrackIndices)) return false;
    const other = obj;
    if (this.locToIndex.length !== other.locToIndex.length) return false;
    if (this.onTrackIndices.length !== other.onTrackIndices.length) return false;
    // Structural equality (simplified)
    return JSON.stringify(this.onTrackIndices) === JSON.stringify(other.onTrackIndices);
  }

  toString(): string {
    let str = "OnTrackIndices:\n";
    for (let i = 0; i < this.onTrackIndices.length; ++i) {
      str += "Track: " + i + "\n";
      const whatOnTracks = this.onTrackIndices[i]!;
      for (let what = 0; what < whatOnTracks.length; what++) {
        const onTracks = whatOnTracks[what]!;
        for (let j = 0; j < onTracks.length; j++) {
          if (onTracks[j]! > 0)
            str += "Component " + what + " at index " + i + " count = " + onTracks[j] + "\n";
        }
      }
      str += "\n";
    }
    return str;
  }
}
