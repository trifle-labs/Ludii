// @java Core/src/game/equipment/container/board/custom/SurakartaBoard.java

/**
 * Defines a Surakarta-style board.
 *
 * @java game/equipment/container/board/custom/SurakartaBoard.java
 * @author cambolbro
 *
 * @remarks Surakarta-style boards have loops that pieces must travel around
 *          in order to capture other pieces.
 */

import { Board } from "../Board.js";
import type { GraphFunction } from "../Board.js";
import { Track } from "../Track.js";

/** Java Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * A Surakarta board — a regular board augmented with capture-loop tracks.
 *
 * @java game/equipment/container/board/custom/SurakartaBoard.java — class SurakartaBoard extends Board
 */
export class SurakartaBoard extends Board {
  /** @java SurakartaBoard.numLoops */
  private numLoops: number;

  /** @java SurakartaBoard.startAtRow */
  private readonly startAtRow: number;

  /**
   * @java game/equipment/container/board/custom/SurakartaBoard.java constructor
   *
   * @param graphFn    The graph function used to build the board.
   * @param loops      Number of loops [(minDim - 1) / 2].
   * @param from       Which row to start loops from [1].
   * @param largeStack True if the game can involve stacks higher than 32.
   */
  public constructor(
    graphFn: GraphFunction,
    loops: number | null,
    from: number | null,
    largeStack: boolean | null,
  ) {
    // @java SurakartaBoard.java:58 — super(graphFn, null, null, null, null, SiteType.Vertex, largeStack)
    super(graphFn, null, null, null, null, "Vertex", largeStack);

    // @java SurakartaBoard.java:60–61
    this.numLoops   = (loops !== null) ? loops : UNDEFINED;
    this.startAtRow = (from  !== null) ? from  : 1;
  }

  /** @java SurakartaBoard.numLoops (getter) */
  public getNumLoops(): number { return this.numLoops; }

  /** @java SurakartaBoard.startAtRow (getter) */
  public getStartAtRow(): number { return this.startAtRow; }

  /**
   * Build Surakarta tracks for a square grid.
   *
   * @java SurakartaBoard.createTracksSquare(int, int, int)
   */
  public createTracksSquare(dim0: number, dim1: number, totalLoops: number): void {
    const rows = dim0 + 1;
    const cols = dim1 + 1;

    const track: number[] = [];

    for (let lid = 0; lid < totalLoops; lid++) {
      const loop = this.startAtRow + lid;
      track.length = 0;

      // @java SurakartaBoard.java:133–138 — Bottom row rightwards
      for (let col = 0; col < cols; col++) {
        let site = loop * cols + col;
        if (col === 0 || col === cols - 1) site = -site;
        track.push(site);
      }

      // @java SurakartaBoard.java:141–147 — Right column upwards
      for (let row = 0; row < rows; row++) {
        let site = cols - 1 - loop + row * cols;
        if (row === 0 || row === rows - 1) site = -site;
        track.push(site);
      }

      // @java SurakartaBoard.java:150–156 — Top row leftwards
      for (let col = 0; col < cols; col++) {
        let site = rows * cols - 1 - loop * cols - col;
        if (col === 0 || col === cols - 1) site = -site;
        track.push(site);
      }

      // @java SurakartaBoard.java:159–165 — Left column downwards
      for (let row = 0; row < rows; row++) {
        let site = rows * cols - cols + loop - row * cols;
        if (row === 0 || row === rows - 1) site = -site;
        track.push(site);
      }

      // @java SurakartaBoard.java:171–180 — Forward track with speed bumps
      const forward: number[] = [];
      for (let n = 0; n < track.length; n++) {
        const a = track[n]!;
        const b = track[(n + 1) % track.length]!;
        forward.push(Math.abs(a));
        if (a < 0 && b < 0) forward.push(Math.abs(a)); // double speed bump
      }

      // @java SurakartaBoard.java:182–190 — Backward track with speed bumps
      const trackReversed = [...track].reverse();
      const backward: number[] = [];
      for (let n = 0; n < trackReversed.length; n++) {
        const a = trackReversed[n]!;
        const b = trackReversed[(n + 1) % trackReversed.length]!;
        backward.push(Math.abs(a));
        if (a < 0 && b < 0) backward.push(Math.abs(a)); // double speed bump
      }

      // @java SurakartaBoard.java:193–203 — create forward/backward Track objects
      const nameForward  = "Track" + loop + "F";
      const nameBackward = "Track" + loop + "B";

      const trackForward  = new Track(nameForward,  forward,  null, null, true, null, null, true);
      const trackBackward = new Track(nameBackward, backward, null, null, true, null, null, true);

      this.tracks.push(trackForward);
      this.tracks.push(trackBackward);
    }
  }

  /**
   * Build Surakarta tracks for a triangular grid.
   *
   * @java SurakartaBoard.createTracksTriangular(int, int)
   */
  public createTracksTriangular(dim: number, totalLoops: number): void {
    const rows = dim + 1;
    const cols = dim + 1;

    const track: number[] = [];

    for (let lid = 0; lid < totalLoops; lid++) {
      const loop = this.startAtRow + lid;
      track.length = 0;

      // @java SurakartaBoard.java:228–233 — compute starting vertex
      let v = 0;
      let dec = cols;
      for (let step = 0; step < loop; step++) {
        v += dec--;
      }

      // @java SurakartaBoard.java:236–243 — Bottom row rightwards
      for (let step = 0; step < rows - loop; step++) {
        let site = v;
        if (step === 0 || step >= rows - loop - 1) site = -site;
        track.push(site);
        v++;
      }

      // @java SurakartaBoard.java:246–254 — Right column upwards
      v = cols - 1 - loop;
      dec = rows - 1;
      for (let step = 0; step < rows - loop; step++) {
        let site = v;
        if (step === 0 || step >= rows - loop - 1) site = -site;
        track.push(site);
        v += dec--;
      }

      // @java SurakartaBoard.java:257–265 — Left column downwards
      dec += 3;
      for (let step = 0; step < rows - loop; step++) {
        let site = v;
        if (step === 0 || step >= rows - loop - 1) site = -site;
        track.push(site);
        v -= dec++;
      }

      // @java SurakartaBoard.java:271–280 — Forward track with speed bumps
      const forward: number[] = [];
      for (let n = 0; n < track.length; n++) {
        const a = track[n]!;
        const b = track[(n + 1) % track.length]!;
        forward.push(Math.abs(a));
        if (a < 0 && b < 0) forward.push(Math.abs(a));
      }

      // @java SurakartaBoard.java:282–291 — Backward track with speed bumps
      const trackReversed = [...track].reverse();
      const backward: number[] = [];
      for (let n = 0; n < trackReversed.length; n++) {
        const a = trackReversed[n]!;
        const b = trackReversed[(n + 1) % trackReversed.length]!;
        backward.push(Math.abs(a));
        if (a < 0 && b < 0) backward.push(Math.abs(a));
      }

      // @java SurakartaBoard.java:293–303
      const nameForward  = "Track" + loop + "F";
      const nameBackward = "Track" + loop + "B";

      const trackForward  = new Track(nameForward,  forward,  null, null, true, null, null, true);
      const trackBackward = new Track(nameBackward, backward, null, null, true, null, null, true);

      this.tracks.push(trackForward);
      this.tracks.push(trackBackward);
    }
  }

  /** @java SurakartaBoard.toEnglish(Game) */
  public toEnglish(_game: unknown): string {
    return `Surakarta board with ${this.numLoops} loops starting at row ${this.startAtRow}`;
  }
}
