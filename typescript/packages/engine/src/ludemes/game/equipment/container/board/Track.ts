// @java Core/src/game/equipment/container/board/Track.java

/**
 * Defines a named track for a container, which is typically the board.
 *
 * @java game/equipment/container/board/Track.java
 * @author Eric.Piette
 *
 * @remarks Tracks are typically used for race games, or any game in which
 *          pieces move around a track.
 */

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/** Java Constants.END */
const END = -2;

/**
 * An element of a track.
 * @java Track.Elem
 */
export interface TrackElem {
  /** The site of the element. @java Elem.site */
  readonly site: number;
  /** The previous site. @java Elem.prev */
  readonly prev: number;
  /** The index of the previous element on the track. @java Elem.prevIndex */
  readonly prevIndex: number;
  /** The next site. @java Elem.next */
  readonly next: number;
  /** The index of the next element on the track. @java Elem.nextIndex */
  readonly nextIndex: number;
  /** Number of bumps on that element. @java Elem.bump */
  readonly bump: number;
}

/**
 * Creates a TrackElem.
 * @java Track.Elem constructor
 */
function makeTrackElem(
  site: number | null,
  prev: number | null,
  prevIndex: number | null,
  next: number | null,
  nextIndex: number | null,
  bump: number,
): TrackElem {
  return {
    site:      (site      === null) ? -1 : site,
    prev:      (prev      === null) ? -1 : prev,
    prevIndex: (prevIndex === null) ? -1 : prevIndex,
    next:      (next      === null) ? -1 : next,
    nextIndex: (nextIndex === null) ? -1 : nextIndex,
    bump,
  };
}

/**
 * Defines a named track for a container.
 *
 * @java game/equipment/container/board/Track.java — class Track extends BaseLudeme
 */
export class Track {
  /** @java Track.name */
  private readonly _name: string;

  /** @java Track.elems */
  private _elems: TrackElem[] | null = null;

  /** @java Track.track */
  private _track: number[] | null;

  /** @java Track.trackDirection */
  private readonly trackDirection: string | null;

  /** @java Track.owner */
  private readonly _owner: number;

  /** @java Track.looped */
  private readonly looped: boolean;

  /** @java Track.direct */
  private readonly direct: boolean;

  /** @java Track.internalLoop */
  private internalLoop: boolean = false;

  /** @java Track.trackIdx */
  private _trackIdx: number = UNDEFINED;

  /**
   * @java game/equipment/container/board/Track.java constructor
   *
   * @param name           The name of the track.
   * @param track          List of integers describing board site indices.
   * @param trackDirection Description including site indices and cardinal directions.
   * @param loop           True if the track is a loop [False].
   * @param owner          The numeric owner of the track [0].
   * @param directed       True if the track is directed [False].
   */
  public constructor(
    name: string | null,
    track: number[] | null,
    trackDirection: string | null,
    _trackSteps: unknown[] | null,
    loop: boolean | null,
    owner: number | null,
    role: string | null,
    directed: boolean | null,
  ) {
    // @java Track.java:160–178 — validate exactly one Or param
    let numNonNull = 0;
    if (track         !== null) numNonNull++;
    if (trackDirection !== null) numNonNull++;
    if (_trackSteps    !== null) numNonNull++;
    if (numNonNull !== 1)
      throw new Error("Track: Exactly one Or parameter must be non-null.");

    let numNonNull2 = 0;
    if (owner !== null) numNonNull2++;
    if (role  !== null) numNonNull2++;
    if (numNonNull2 > 1)
      throw new Error("Track: Zero or one Or parameter must be non-null.");

    // @java Track.java:180–187
    this._name         = (name === null) ? "Track" : name;
    this._owner        = (owner !== null) ? owner : (role !== null) ? roleOwner(role) : 0;
    this.looped        = (loop     === null) ? false : loop;
    this.direct        = (directed === null) ? false : directed;
    this._track        = track;
    this.trackDirection = trackDirection;
    this._elems        = null;
  }

  /** @java Track.name() */
  public name(): string { return this._name; }

  /** @java Track.elems() */
  public elems(): TrackElem[] | null { return this._elems; }

  /** @java Track.owner() */
  public owner(): number { return this._owner; }

  /** @java Track.islooped() */
  public islooped(): boolean { return this.looped; }

  /** @java Track.hasInternalLoop() */
  public hasInternalLoop(): boolean { return this.internalLoop; }

  /** @java Track.trackIdx() */
  public trackIdx(): number { return this._trackIdx; }

  /** @java Track.setTrackIdx(int) */
  public setTrackIdx(idx: number): void { this._trackIdx = idx; }

  /**
   * @java Track.siteIndex(int)
   * Note: works only for simple track with no loop.
   */
  public siteIndex(site: number): number {
    if (this._elems === null) return UNDEFINED;
    for (let i = 0; i < this._elems.length; i++)
      if (this._elems[i]!.site === site) return i;
    return UNDEFINED;
  }

  /**
   * Build the track elements from the raw integer array.
   * This is the simplified version of Track.buildTrack(Game) that operates
   * on an already-resolved integer array (the trackDirection path requires
   * a full topology and is deferred).
   *
   * @java game/equipment/container/board/Track.java — buildTrack(Game)
   */
  public buildFromIntArray(trackArr: number[]): void {
    // @java Track.java:422–440 — separate bumps
    const trackWithoutBump: number[] = [];
    const nbBumpByElem:     number[] = [];
    let countBump = 0;

    for (let i = 0; i < trackArr.length; i++) {
      if (i === trackArr.length - 1 || trackArr[i] !== trackArr[i + 1]) {
        trackWithoutBump.push(trackArr[i]!);
        nbBumpByElem.push(countBump);
        countBump = 0;
      } else {
        countBump++;
      }
    }

    const newTrack = trackWithoutBump;
    this._elems = new Array(newTrack.length);

    // @java Track.java:444–461 — build Elem array
    for (let i = 0; i < newTrack.length; i++) {
      let e: TrackElem;
      const bump = nbBumpByElem[i]!;
      if (i === 0 && this.looped) {
        e = makeTrackElem(newTrack[i]!, newTrack[newTrack.length - 1]!, newTrack.length - 1, newTrack[i + 1]!, i + 1, bump);
      } else if (i === 0 && !this.looped) {
        e = makeTrackElem(newTrack[i]!, null, null, newTrack[i + 1]!, i + 1, bump);
      } else if (i === newTrack.length - 1 && this.looped) {
        e = makeTrackElem(newTrack[i]!, newTrack[i - 1]!, i - 1, newTrack[0]!, 0, bump);
      } else if (i === newTrack.length - 1 && !this.looped) {
        e = makeTrackElem(newTrack[i]!, newTrack[i - 1]!, i - 1, null, null, bump);
      } else if (this.direct) {
        e = makeTrackElem(newTrack[i]!, null, null, newTrack[i + 1]!, i + 1, bump);
      } else {
        e = makeTrackElem(newTrack[i]!, newTrack[i - 1]!, i - 1, newTrack[i + 1]!, i + 1, bump);
      }
      this._elems[i] = e;
    }

    // @java Track.java:465–478 — check internal loop (only if no bumps)
    const hasBump = nbBumpByElem.some(b => b > 0);
    if (!hasBump) {
      const listSites = new Set<number>();
      for (const elem of this._elems) {
        if (listSites.has(elem.site)) {
          this.internalLoop = true;
          break;
        }
        listSites.add(elem.site);
      }
    }
  }

  /**
   * If the track was constructed with a raw integer array, build from it.
   * Called during board initialization.
   */
  public buildTrackFromRaw(): void {
    if (this._track !== null) {
      this.buildFromIntArray(this._track);
    }
    // trackDirection path requires topology; deferred in TS port.
  }

  public buildTrack(width: number, height: number, traj?: { numSites: number; step(site: number, dir: string): number } | null): void {
    if (this._track !== null) {
      this.buildFromIntArray(this._track);
      return;
    }
    if (this.trackDirection === null) return;
    const sites = parseTrackDirection(this.trackDirection, width, height, traj);
    if (sites.length > 0) this.buildFromIntArray(sites);
  }
}

function parseTrackDirection(
  spec: string,
  width: number,
  height: number,
  traj?: { numSites: number; step(site: number, dir: string): number } | null,
): number[] {
  const toks = spec.split(",").map((t) => t.trim()).filter(Boolean);
  if (toks.length === 0 || width <= 0 || height <= 0) return [];
  const start = Number.parseInt(toks[0]!, 10);
  if (!Number.isInteger(start) || start < 0) return [];
  const boardSize = width * height;
  const stepOf = (site: number, dir: string): number => {
    if (traj && site >= 0 && site < traj.numSites) return traj.step(site, dir.toUpperCase());
    if (site >= boardSize) return -1;
    const col = site % width;
    const row = Math.floor(site / width);
    switch (dir.toUpperCase()) {
      case "E": return col + 1 < width ? site + 1 : -1;
      case "W": return col - 1 >= 0 ? site - 1 : -1;
      case "N": return row + 1 < height ? site + width : -1;
      case "S": return row - 1 >= 0 ? site - width : -1;
      default: return -1;
    }
  };
  const out: number[] = [start];
  let cur = start;
  for (let i = 1; i < toks.length; i += 1) {
    const tok = toks[i]!;
    if (tok.toLowerCase() === "end") {
      out.push(END);
      break;
    }
    const asInt = Number.parseInt(tok, 10);
    if (!Number.isNaN(asInt) && String(asInt) === tok) {
      if (!out.includes(asInt)) out.push(asInt);
      cur = asInt;
      continue;
    }
    const match = tok.match(/^([A-Za-z]+)(\d+)?$/);
    const dir = match?.[1] ?? tok;
    const limit = match?.[2] ? Number.parseInt(match[2], 10) : Infinity;
    let steps = 0;
    let next = stepOf(cur, dir);
    while (next >= 0 && steps < limit && !out.includes(next)) {
      out.push(next);
      cur = next;
      steps += 1;
      next = stepOf(cur, dir);
    }
  }
  return out;
}

/** Minimal role-owner lookup for Track constructor. */
function roleOwner(role: string): number {
  if (role === "Neutral") return 0;
  const m = /^P(\d+)$/.exec(role);
  if (m) return parseInt(m[1]!, 10);
  return 0;
}

/** Re-export END constant for consumers that need it (e.g. SurakartaBoard). */
export { END, UNDEFINED };
