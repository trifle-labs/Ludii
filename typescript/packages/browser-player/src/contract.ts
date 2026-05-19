/**
 * The DOM-layer contract pinned in
 * `typescript/docs/BROWSER_PLAYER_ROADMAP.md`.
 *
 * Engine adapters (e.g. the one wrapping `@ludii/typescript-engine`)
 * implement these interfaces; the DOM surface in `embed.ts` only
 * depends on them.
 */

export interface BrowserGame {
  /** Stable identifier (e.g. "tic-tac-toe"). */
  readonly id: string;
  /** Human-readable name for the UI. */
  readonly name: string;
  /** Number of players (>= 1). */
  readonly numPlayers: number;
  /** Board dimensions for the renderer (1-cell-per-site grid). */
  readonly width: number;
  readonly height: number;
}

export interface CellView {
  /** Owning player (1..N) or 0 if empty. */
  readonly owner: number;
  /** Optional component label (e.g. piece name) for UI rendering. */
  readonly componentLabel?: string;
}

export interface BrowserState {
  cellAt(siteIndex: number): CellView;
  readonly siteCount: number;
}

export interface BrowserMove {
  readonly id: string;
  readonly label: string;
  readonly siteIndices: readonly number[];
  readonly mover: number;
}

export interface BrowserTrialEntry {
  readonly move: BrowserMove;
  readonly index: number;
}

export interface BrowserTrial {
  readonly entries: readonly BrowserTrialEntry[];
}

export interface BrowserGameSession {
  readonly game: BrowserGame;
  readonly state: BrowserState;
  readonly trial: BrowserTrial;

  readonly mover: number;
  readonly over: boolean;
  /** Winner mover index, 0 for a draw, -1 if not over. */
  readonly winner: number;

  legalMoves(): readonly BrowserMove[];
  legalMovesAtSite(siteIndex: number): readonly BrowserMove[];

  /** Returns a NEW session with the move applied. */
  apply(moveId: string): BrowserGameSession;

  /** Returns a fresh session at the game's initial state. */
  reset(): BrowserGameSession;

  /**
   * Returns a session truncated to the first `n` moves of the current
   * trial. Used for read-only history scrubbing.
   */
  truncate(numMoves: number): BrowserGameSession;
}
