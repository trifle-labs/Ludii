/**
 * Ludeme interpreter — evaluation foundation.
 *
 * Java parity:
 * - Core/src/other/context/Context.java + EvalContext.java — the rolling
 *   evaluation frame (`to`/`from`/`between`/`site`/`value`/`player`) that
 *   ludeme functions read while a move is being generated or a condition
 *   tested.
 *
 * Unlike the template games (FlatBoardGame etc.) that pattern-match an AST
 * onto a hand-rolled rule, the interpreter *evaluates* the ludeme tree.
 * Every `.lud` function compiles to one of the small evaluable interfaces
 * below; a function reads board + state through `EvalContext` and the
 * current `EvalFrame`.
 */

import type { Context } from "../context.js";
import type { Move } from "../move.js";
import type { State } from "../state.js";
import { FlatTopology } from "../topology.js";
import type { Trajectories } from "./graph/trajectories.js";
import { type Tiling, SQUARE_TILING } from "./tilings.js";

/** Sentinel for "no site" (Java: Constants.OFF = -1). */
export const OFF = -1;

/**
 * Sentinel for the end-of-track marker (Java: Constants.END = -2). Distinct
 * from OFF: a track that finishes with an `End` step appends an elem whose
 * `site == END`, so `(trackSite Move …)` returns END only when a piece lands
 * *exactly* on it (the bear-off condition `("IsEndTrack" …)` = `(= … End)`),
 * and OFF when the step overshoots past it. Conflating the two would let a
 * piece bear off with any over-large die. @java main.Constants.END
 */
export const END = -2;

/**
 * The rolling evaluation frame. Each field is the site/value/player the
 * surrounding ludeme has bound for its children to read — e.g. a move's
 * `if:(is Empty (to))` reads `frame.to`, a `(forEach Site … )` binds
 * `frame.site`, and `(forEach Player … )` binds `frame.player`.
 */
export interface EvalFrame {
  /** Candidate destination site (Java: `to()`). */
  readonly to?: number;
  /** Origin site of the move under construction (Java: `from()`). */
  readonly from?: number;
  /** Site hopped over (Java: `between()`). */
  readonly between?: number;
  /** Stack level (Java: `level()`). */
  readonly level?: number;
  /** Generic iteration site (Java: `site()`), bound by `(forEach Site …)`. */
  readonly site?: number;
  /** Iteration value (Java: `value()`), bound by `(forEach Value …)`. */
  readonly value?: number;
  /** Iterated player (Java: `player()`), bound by `(forEach Player …)`. */
  readonly player?: number;
  /**
   * Java parity: `state.prev()` — the mover of the move committed *before* the
   * one being folded as a `(then …)` consequence. `applyHypothetical` records
   * the candidate move as the trial's last move (so `(last To)` resolves to its
   * destination), which would otherwise make `(is Prev Mover)` see the current
   * move as its own predecessor and read `NewTurn` (= `(not (is Prev Mover))`)
   * as false on the first move of a turn. Capturing the pre-apply previous
   * mover here keeps `(is Prev …)` reading Java's `state.prev()` semantics:
   * the *previous ply's* mover, regardless of the hypothetical apply on top.
   */
  readonly prevMover?: number;
  /**
   * End-rule role resolution needs Java's stored `state.next()` value. Java
   * evaluates `(end ...)` before Game.applyInternal rotates mover/next, so a
   * just-applied `(moveAgain)` is still visible to `RoleType.Next`.
   */
  readonly roleNextFromState?: boolean;
  /** Piece type currently being moved (Java: `piece()`). */
  readonly piece?: number;
  /**
   * The current region set on the context (Java: `Context.region()`), bound by
   * `(forEach Group …)` / `(forEach Site of:…)` to the iteration's site set and
   * read by the no-argument `(sites)` ludeme (Java: `SitesContext`).
   */
  readonly region?: readonly number[];
  /**
   * Java parity: the per-turn visited-site set as seen during this evaluation.
   * `(can Move …)` sets it (state's `visited` plus the move-in-progress's own
   * from/to — Java CanMove.eval's temporary `visit(lastFrom); visit(lastTo)`)
   * so a continuation cannot re-use a site already touched this turn. When
   * present it overrides `state.visited` for `(is Visited …)`.
   */
  readonly visited?: ReadonlySet<number>;
}

/**
 * A mancala sowing track: an ordered ring (or line) of site indices that
 * `(sow)` walks and `(sites Track)` / `(trackSite)` read. `owner` is the
 * player the track belongs to (0 = shared / unowned).
 */
export interface MancalaTrack {
  readonly name: string;
  readonly sites: readonly number[];
  readonly loop: boolean;
  readonly owner: number;
  /**
   * Index of this track in the board's declaration order (Java `Track.trackIdx`).
   * Used to key the per-state `OnTrackIndices` count structure. Assigned by
   * `parseTracks`; absent on tracks built before this field existed (treated 0).
   */
  readonly trackIdx?: number;
  /**
   * Java `Track.internalLoop` (Track.java:464-478): true iff the track has no
   * "bump" (no two *consecutive* elems are the same site) AND some site recurs
   * at a non-consecutive position. When ANY track is an internal loop the game
   * sets `GameType.InternalLoopInTrack`, which switches `(trackSite Move …)` /
   * `(count StepsOnTrack …)` from a first-occurrence site scan to a piece-index
   * lookup via `OnTrackIndices`. Plain straight/looped tracks leave this false
   * and keep the simple scan (zero behaviour change).
   */
  readonly internalLoop?: boolean;
  /**
   * Java `OnTrackIndices.locToIndex[trackIdx]`: site → every ring index whose
   * elem sits on that site (a repeated site maps to multiple indices). Precomputed
   * and static (shared by reference across state copies). Only populated when the
   * game has an internal-loop track; otherwise undefined.
   */
  readonly locToIndex?: ReadonlyMap<number, readonly number[]>;
}

/**
 * Flat rectangular board view the interpreter evaluates against. Wraps
 * `FlatTopology` and adds the x/y ⇄ site conversions ludeme functions need
 * for direction stepping.
 */
export class InterpBoard {
  public readonly topo: FlatTopology;
  public readonly width: number;
  public readonly height: number;
  /** Tiling (square / hex) — supplies the direction offset tables. */
  public readonly tiling: Tiling;
  /**
   * On-board mask for non-rectangular shapes (e.g. a hexagonal outline laid
   * on a square bounding box). `width*height` flags; undefined ⇒ every cell
   * in the bounding box is on-board.
   */
  public readonly onBoard?: readonly boolean[];
  /** Global cell index where player p's hand begins (1-based; [0] unused). */
  public readonly handStart: readonly number[];
  /** Number of sites in player p's hand (1-based; [0] unused). */
  public readonly handSizes: readonly number[];
  /** Mancala sowing tracks declared on the board (empty for non-sow games). */
  public readonly tracks: readonly MancalaTrack[];
  /**
   * Global cell indices of a mancala board's store cells (the captured-seed
   * holes), in declaration order. `FirstSite` / `LastSite` and a player-store
   * `(map …)` resolve through these. Empty for `store:None` and non-sow games.
   */
  public readonly stores: readonly number[];
  /**
   * When the board was built from the graph algebra (merge / dual / concentric
   * / …), this carries the geometric adjacency. Site geometry and direction
   * stepping delegate here instead of to the rectangular lattice.
   */
  public readonly traj?: Trajectories;
  /**
   * Memo for the graph-board `siteAt` scan. The board geometry is immutable
   * after construction, so a coordinate lookup is a pure function; region and
   * move ludemes (e.g. `(sites Outer)`, slide/hop offset walks) probe the same
   * points repeatedly, and without this each probe is an O(numSites) scan.
   */
  private siteAtCache?: Map<string, number>;
  /**
   * Per-player facing direction token (1-based; `[0]` unused), e.g.
   * `[, "N", "S"]`. Empty / `undefined` entries mean the player declared no
   * `(player <Dir>)` facing, so its pieces face North — matching Java's
   * `CompassDirection.N` default. Set by the game compiler after construction
   * because facings come from `(players …)`, not the equipment.
   */
  public playerFacing: readonly (string | undefined)[] = [];
  /**
   * Per-component facing token (indexed by `what` id), e.g. Toads & Frogs'
   * `[, "E", "W"]`. Set by the game compiler from each `(piece … <dirn> …)`
   * declaration (Java `Component.getDirn()`). A piece's own facing overrides
   * its owning player's `(player <Dir>)` facing when resolving relative
   * directions; `undefined` entries fall back to the player facing.
   */
  public componentFacing?: readonly (string | undefined)[];
  /**
   * Compass board sides (Java `Topology.sides`) for graph boards — direction
   * name (`N`/`NE`/…) → play-site ids on that side. Populated by the game
   * compiler from the board graph's `measureSides`. `(sites Side <compass>)`
   * prefers these (the real perimeter edges) over the bounding-box row/column
   * heuristic, so slanted boards (rhombus Hex, triangle Y, …) get the correct
   * diagonal goal regions; `undefined` on lattice boards keeps the old path.
   */
  public sideRegions?: Partial<Record<string, readonly number[]>>;

  public constructor(
    width: number,
    height: number,
    handStart: readonly number[] = [],
    handSizes: readonly number[] = [],
    tiling: Tiling = SQUARE_TILING,
    onBoard?: readonly boolean[],
    tracks: readonly MancalaTrack[] = [],
    stores: readonly number[] = [],
    traj?: Trajectories,
  ) {
    this.topo = new FlatTopology(width, height);
    this.width = width;
    this.height = height;
    this.tiling = tiling;
    this.onBoard = onBoard;
    this.handStart = handStart;
    this.handSizes = handSizes;
    this.tracks = tracks;
    this.stores = stores;
    this.traj = traj;
  }

  /** Board sites only (used for topology queries). Hand sites are appended
   * to `State.cells` beyond this index. Holes in the bounding box are still
   * counted here (state stays rectangular); use `isOnBoard` to skip them. */
  public get numSites(): number {
    return this.traj ? this.traj.numSites : this.width * this.height;
  }

  /**
   * Global cell index of the first dice face site. Java orders containers
   * [board, hand(s), dice], so the dice container's sites begin after the
   * board sites *and* every hand's sites. `(face <site>)` and `ActionUseDie`
   * map a global dice site to a `State.diceValues` index by subtracting this.
   * Falls back to `numSites` when the game declares no hands.
   */
  public get diceSiteStart(): number {
    let start = this.numSites;
    for (let p = 1; p < this.handStart.length; p += 1) {
      const end = (this.handStart[p] ?? 0) + (this.handSizes[p] ?? 0);
      if (end > start) start = end;
    }
    return start;
  }

  /** True if `site` is a real board cell (false for bounding-box holes). */
  public isOnBoard(site: number): boolean {
    if (site < 0 || site >= this.numSites) return false;
    if (this.traj) return true;
    return this.onBoard ? this.onBoard[site] === true : true;
  }

  /** Single step in a named compass direction (graph boards only). */
  public stepDir(site: number, dir: string): number {
    return this.traj ? this.traj.step(site, dir) : OFF;
  }

  /** Ray of sites in a named compass direction (graph boards only). */
  public rayDir(site: number, dir: string): number[] {
    return this.traj ? this.traj.ray(site, dir) : [];
  }

  /** Global cell index for player p's hand slot k, or OFF if absent. */
  public handSite(player: number, idx: number): number {
    const start = this.handStart[player];
    if (start === undefined) return OFF;
    const size = this.handSizes[player] ?? 0;
    if (idx < 0 || idx >= size) return OFF;
    return start + idx;
  }

  /** All global cell indices in player p's hand. */
  public handSites(player: number): number[] {
    const start = this.handStart[player];
    if (start === undefined) return [];
    const size = this.handSizes[player] ?? 0;
    const out: number[] = [];
    for (let i = 0; i < size; i += 1) out.push(start + i);
    return out;
  }

  public xOf(site: number): number {
    return this.traj ? this.traj.xOf(site) : site % this.width;
  }

  public yOf(site: number): number {
    return this.traj ? this.traj.yOf(site) : Math.floor(site / this.width);
  }

  /** Elevation of a site (Shibumi pyramidal boards); 0 on planar/rectangular boards. */
  public zOf(site: number): number {
    return this.traj ? this.traj.zOf(site) : 0;
  }

  /**
   * Perimeter play-sites of a graph board (outer boundary ring), or `undefined`
   * for a plain rectangular lattice (which has no `traj`). Used by the
   * geometric-centre and `(sites Outer/Perimeter)` ludemes, which on irregular
   * graph boards cannot be derived from the rectangular bounding box.
   */
  public perimeterSites(): number[] | undefined {
    return this.traj ? this.traj.perimeterSites() : undefined;
  }

  /**
   * Corner play-sites of a graph board (Java MeasureGraph.measureCorners), or
   * `undefined` for a plain rectangular lattice (no `traj`) or a play type whose
   * corner geometry is not modelled. Used by `(sites Corners)` on irregular
   * graph boards, which cannot be derived from the rectangular bounding box.
   */
  public cornerSites(): number[] | undefined {
    return this.traj ? this.traj.cornerSites() : undefined;
  }

  /**
   * Per-site row / column *bucket* indices, computed lazily (graph boards only).
   *
   * Java parity: `MeasureGraph.measureSituation` assigns each play-site a
   * (row, column) bucket via a best-fit-angle clustering, then
   * `Topology.computeRows/computeColumns` honours those buckets — UNLESS two
   * sites collide on the same coordinate label, in which case the graph is
   * flagged `duplicateCoordinates` and Topology falls back to distinct-centroid
   * binning (sorted distinct x/y, tolerance 0.001). We reproduce both branches:
   *   - `clusterRow`/`clusterCol`: the clustered indices (the common case);
   *   - `labelDuplicate`: a (col,row) collision was found → centroid fallback,
   *     using `labelRows`/`labelCols` (the distinct sorted centroids).
   *
   * Axis-aligned grids pick theta=0 and cluster one site-line per bucket, so
   * they reproduce the centroid ranking exactly; only diagonal-dominant boards
   * (e.g. a `diagonals:Solid` cross board, where the geese labels run along
   * anti-diagonals) pick a rotated axis and diverge — matching Java.
   */
  private clusterRow?: number[];
  private clusterCol?: number[];
  private labelDuplicate = false;
  private labelRows?: number[];
  private labelCols?: number[];

  private distinctSorted(of: (s: number) => number): number[] {
    const vals: number[] = [];
    for (let s = 0; s < this.numSites; s += 1) {
      const v = of(s);
      if (!vals.some((u) => Math.abs(u - v) < 0.001)) vals.push(v);
    }
    vals.sort((a, b) => a - b);
    return vals;
  }

  /**
   * Unsigned perpendicular distance from a point to the line through A→B.
   * Java `MathRoutines.distanceToLine` (always non-negative); when A and B
   * coincide it degrades to the radial distance from A.
   */
  private static distanceToLine(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ): number {
    const dx = bx - ax;
    const dy = by - ay;
    if (Math.abs(dx) + Math.abs(dy) < 0.0000001) {
      const ex = px - ax;
      const ey = py - ay;
      return Math.sqrt(ex * ex + ey * ey);
    }
    const a2 = (py - ay) * dx - (px - ax) * dy;
    return Math.sqrt((a2 * a2) / (dx * dx + dy * dy));
  }

  /**
   * Java `MeasureGraph.clusterByDimension`: rank every site by its perpendicular
   * distance to a reference line offset outside the bounding box (so all sites
   * fall on one side and the distance is monotonic), then greedily bucket sites
   * whose score is within `0.6·unit` of the running bucket mean. Returns the
   * per-site bucket assignment and the clustering error (lower = tighter rows).
   */
  private clusterByDimension(
    kind: "row" | "col",
    minX: number,
    minY: number,
    w: number,
    h: number,
    margin: number,
    theta: number,
  ): { buckets: number[]; error: number } {
    const ax = kind === "row" ? minX + w / 2 : minX - w;
    const ay = kind === "row" ? minY - h : minY + h / 2;
    const bx = ax + w * Math.cos(theta);
    const by = ay + w * Math.sin(theta);

    const n = this.numSites;
    const scored: { id: number; score: number }[] = [];
    for (let s = 0; s < n; s += 1) {
      scored.push({
        id: s,
        score: InterpBoard.distanceToLine(this.xOf(s), this.yOf(s), ax, ay, bx, by),
      });
    }
    // Stable ascending sort by score — equal scores keep site-index order,
    // matching Java's stable Collections.sort over insertion-ordered ItemScores.
    scored.sort((p, q) => p.score - q.score);

    const buckets = new Array<number>(n).fill(0);
    const bucketScores: number[][] = [];
    let total = 0;
    let count = 0;
    let idx = -1;
    for (const item of scored) {
      const mean = count === 0 ? 0 : total / count;
      if (idx < 0 || Math.abs(item.score - mean) > margin) {
        idx += 1;
        total = 0;
        count = 0;
        bucketScores.push([]);
      }
      total += item.score;
      count += 1;
      buckets[item.id] = idx;
      (bucketScores[idx] as number[]).push(item.score);
    }

    // Error — faithfully replicating Java's quirk: `acc =` (not `+=`) leaves only
    // the LAST item's squared deviation per bucket, plus a per-bucket penalty.
    let error = 0;
    for (const scores of bucketScores) {
      let sum = 0;
      for (const sc of scores) sum += sc;
      const mean = sum / scores.length;
      let acc = 0;
      for (const sc of scores) acc = (mean - sc) * (mean - sc);
      error += acc / scores.length;
    }
    error += 0.01 * bucketScores.length;
    return { buckets, error };
  }

  /** Run the row/column theta-search clustering once and cache the buckets. */
  private ensureLabels(): void {
    if (this.clusterRow !== undefined) return;
    const n = this.numSites;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let s = 0; s < n; s += 1) {
      const x = this.xOf(s);
      const y = this.yOf(s);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const w = maxX - minX;
    const h = maxY - minY;
    const unit = (w + h) / 2 / Math.sqrt(n);
    const margin = 0.6 * unit;

    // Best row angle over {0,15,30,45,60}°.
    let rowTheta = 0;
    let bestRow = { buckets: new Array<number>(n).fill(0), error: Infinity };
    for (let angle = 0; angle <= 60; angle += 15) {
      const theta = (angle / 180) * Math.PI;
      const r = this.clusterByDimension("row", minX, minY, w, h, margin, theta);
      if (r.error < bestRow.error) {
        bestRow = r;
        rowTheta = theta;
        if (r.error < 0.01) break;
      }
    }

    // Best column angle over rowTheta + {90,105,120}°.
    let bestCol = { buckets: new Array<number>(n).fill(0), error: Infinity };
    for (let angle = 90; angle <= 120; angle += 15) {
      const theta = rowTheta + (angle / 180) * Math.PI;
      const c = this.clusterByDimension("col", minX, minY, w, h, margin, theta);
      if (c.error < bestCol.error) {
        bestCol = c;
        if (c.error < 0.01) break;
      }
    }

    this.clusterRow = bestRow.buckets;
    this.clusterCol = bestCol.buckets;

    // Detect a coordinate-label collision (Java `setCoordinateLabels` →
    // `setDuplicateCoordinates`). Two sites collide iff they share a (col,row)
    // bucket pair (the label is a pure function of those). On collision Java's
    // Topology abandons the buckets for distinct-centroid binning.
    const seen = new Set<string>();
    this.labelDuplicate = false;
    for (let s = 0; s < n; s += 1) {
      const key = `${this.clusterCol[s]},${this.clusterRow[s]}`;
      if (seen.has(key)) {
        this.labelDuplicate = true;
        break;
      }
      seen.add(key);
    }
    if (this.labelDuplicate) {
      this.labelRows = this.distinctSorted((s) => this.yOf(s));
      this.labelCols = this.distinctSorted((s) => this.xOf(s));
    }
  }

  /**
   * Play-sites whose row label is `rowIndex`. Java's `Topology` numbers rows
   * from the lowest cluster up, so a board extended below y=0 (e.g. an Alquerque
   * board with a triangle hanging off the bottom) still has row 0 at its bottom
   * edge. Graph boards only.
   */
  public sitesInRow(rowIndex: number): number[] {
    this.ensureLabels();
    const out: number[] = [];
    if (this.labelDuplicate) {
      const y = (this.labelRows as number[])[rowIndex];
      if (y === undefined) return [];
      for (let s = 0; s < this.numSites; s += 1) {
        if (Math.abs(this.yOf(s) - y) < 0.001) out.push(s);
      }
    } else {
      const rows = this.clusterRow as number[];
      for (let s = 0; s < this.numSites; s += 1) {
        if (rows[s] === rowIndex) out.push(s);
      }
    }
    out.sort((a, b) => this.xOf(a) - this.xOf(b));
    return out;
  }

  /** Column analogue of {@link sitesInRow} — sites whose column label is `colIndex`. */
  public sitesInColumn(colIndex: number): number[] {
    this.ensureLabels();
    const out: number[] = [];
    if (this.labelDuplicate) {
      const x = (this.labelCols as number[])[colIndex];
      if (x === undefined) return [];
      for (let s = 0; s < this.numSites; s += 1) {
        if (Math.abs(this.xOf(s) - x) < 0.001) out.push(s);
      }
    } else {
      const cols = this.clusterCol as number[];
      for (let s = 0; s < this.numSites; s += 1) {
        if (cols[s] === colIndex) out.push(s);
      }
    }
    out.sort((a, b) => this.yOf(a) - this.yOf(b));
    return out;
  }

  /** Row label (0-based, lowest cluster first) of a site — Java `Topology` row. */
  public rowRankOf(site: number): number {
    this.ensureLabels();
    if (!this.labelDuplicate) return (this.clusterRow as number[])[site] ?? -1;
    const rows = this.labelRows as number[];
    const y = this.yOf(site);
    for (let i = 0; i < rows.length; i += 1) {
      if (Math.abs((rows[i] as number) - y) < 0.001) return i;
    }
    return -1;
  }

  /** Column label (0-based, lowest cluster first) of a site — Java `Topology` column. */
  public colRankOf(site: number): number {
    this.ensureLabels();
    if (!this.labelDuplicate) return (this.clusterCol as number[])[site] ?? -1;
    const cols = this.labelCols as number[];
    const x = this.xOf(site);
    for (let i = 0; i < cols.length; i += 1) {
      if (Math.abs((cols[i] as number) - x) < 0.001) return i;
    }
    return -1;
  }

  /**
   * Site addressed by a chess-style coordinate's *label* indices (0-based
   * column, 0-based row), or OFF. On a plain lattice the label index equals the
   * planar coordinate (unit spacing), so this is just `siteAt`. On a graph board
   * the indices are resolved through the clustered row/column buckets (or the
   * distinct-centroid fallback), faithfully matching Java's `Topology` labelling.
   */
  public siteAtLabel(col: number, row: number): number {
    if (!this.traj) return this.siteAt(col, row);
    this.ensureLabels();
    if (this.labelDuplicate) {
      const cols = this.labelCols as number[];
      const rows = this.labelRows as number[];
      if (col < 0 || col >= cols.length || row < 0 || row >= rows.length) {
        return OFF;
      }
      return this.siteAt(cols[col] as number, rows[row] as number);
    }
    const clusterCol = this.clusterCol as number[];
    const clusterRow = this.clusterRow as number[];
    for (let s = 0; s < this.numSites; s += 1) {
      if (clusterCol[s] === col && clusterRow[s] === row) return s;
    }
    return OFF;
  }

  /** Site index at (x, y), or OFF if off the bounding box or a masked hole.
   * For graph boards this returns the nearest site within half a unit. */
  public siteAt(x: number, y: number): number {
    if (this.traj) {
      const cache = (this.siteAtCache ??= new Map());
      const key = `${x}|${y}`;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      let best = OFF;
      let bestD = 0.25; // within half a unit
      for (let s = 0; s < this.traj.numSites; s += 1) {
        const dx = this.traj.xOf(s) - x;
        const dy = this.traj.yOf(s) - y;
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      cache.set(key, best);
      return best;
    }
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return OFF;
    }
    const idx = y * this.width + x;
    if (this.onBoard && this.onBoard[idx] !== true) return OFF;
    return idx;
  }
}

/**
 * The interpreter's evaluation context: a game `Context` (state + trial)
 * plus the board and the current rolling frame. Immutable — `withFrame`
 * returns a child sharing the same context/board with a patched frame.
 */
export class EvalContext {
  public readonly context: Context;
  public readonly board: InterpBoard;
  public readonly frame: EvalFrame;

  public constructor(
    context: Context,
    board: InterpBoard,
    frame: EvalFrame = {},
  ) {
    this.context = context;
    this.board = board;
    this.frame = frame;
  }

  public get state(): State {
    return this.context.state;
  }

  /** The side to move (Java: `Context.state().mover()`). */
  public get mover(): number {
    return this.context.state.mover;
  }

  /** The player the surrounding ludeme is iterating, else the mover. */
  public get player(): number {
    return this.frame.player ?? this.context.state.mover;
  }

  public withFrame(patch: EvalFrame): EvalContext {
    return new EvalContext(this.context, this.board, {
      ...this.frame,
      ...patch,
    });
  }

  public withContext(context: Context): EvalContext {
    return new EvalContext(context, this.board, this.frame);
  }

  /**
   * The evaluation context that would result from applying `move` to the
   * current state, *without* advancing the mover. The move is recorded in a
   * throwaway trial so `(last …)` resolves. Used by `(do … ifAfterwards:)`
   * and `(satisfy …)` to test a board predicate on the post-move position.
   */
  public applyHypothetical(move: Move): EvalContext {
    // Roll any dice on a *clone* of the RNG so move generation stays pure: the
    // real generator is not advanced, yet a stochastic prologue (e.g. the
    // `(roll)` of `(do (if (NewTurn) (roll)) next:…)`) draws the same faces that
    // `game.apply` will draw when it advances the real RNG. Mirrors Java's
    // `Do.eval`, which generates pre-moves into a `TempContext` (an RNG copy)
    // before enumerating the `next:` arm. Non-dice moves ignore the RNG, so this
    // is a no-op for them.
    // Capture the previous ply's mover *before* recording the candidate move,
    // so `(is Prev …)` reads Java's `state.prev()` (the predecessor ply's
    // mover) rather than the hypothetically-applied move itself. With no prior
    // move Java's `state.prev` is its initial 0 ("nobody"), so `(is Prev …)`
    // is false on the very first move — e.g. `("NewTurn") = (not (is Prev
    // Mover))` is true at game start (Shantarad's first-placement moveAgain).
    const last = this.context.trial.lastMove();
    const prevMover = last ? last.mover : 0;
    const state = move.applyTo(this.context.state, this.context.rng.clone());
    const trial = this.context.trial.withMove(move, false, -1);
    return new EvalContext(
      this.context.withState(state).withTrial(trial),
      this.board,
      { ...this.frame, prevMover },
    );
  }
}

// ---- Evaluable interfaces -------------------------------------------------

/** A boolean-valued ludeme (Java: `game.functions.booleans.BooleanFunction`). */
export interface BoolFn {
  eval(ctx: EvalContext): boolean;
}

/** An integer-valued ludeme (Java: `game.functions.ints.IntFunction`). */
export interface IntFn {
  eval(ctx: EvalContext): number;
}

/** A region-valued ludeme — a set of sites (Java: `RegionFunction`). */
export interface RegionFn {
  eval(ctx: EvalContext): readonly number[];
}

/** A move generator (Java: `game.rules.play.moves.Moves`). */
export interface MovesFn {
  generate(ctx: EvalContext): Move[];
}

/** A single board direction as an (x, y) step offset. */
export interface Dir {
  readonly dx: number;
  readonly dy: number;
}

/** A direction-set ludeme (Java: `game.functions.directions.Directions`). */
export interface DirectionsFn {
  eval(ctx: EvalContext): readonly Dir[];
}

/** The resolved outcome of an end condition. `winner === 0` is a draw. */
export interface EndOutcome {
  readonly winner: number;
}

/** An ending rule (Java: `game.rules.end.End` clause). */
export interface EndRule {
  eval(ctx: EvalContext): EndOutcome | undefined;
}
