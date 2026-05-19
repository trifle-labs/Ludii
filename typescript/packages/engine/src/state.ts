/**
 * Java parity:
 * - Core/src/other/state/State.java — the conceptual ancestor.
 * - Core/src/other/state/container/ContainerState.java — the per-piece
 *   slice. In the TS port the Board container's data lives directly in
 *   `cells`; the conceptual ContainerState surface is exposed via the
 *   `containerState()` view object below.
 *
 * Mover indices are 1-based to match Java. `owner === 0` means empty.
 * Score / value / count arrays are indexed by 0-based player slot, with
 * index 0 corresponding to the shared/neutral slot Java uses.
 */

export interface CellView {
  readonly owner: number;
  readonly componentLabel?: string;
}

/**
 * Java parity: the subset of `ContainerState` the engine actually
 * exercises for a flat board. Exposed as a frozen view from
 * `state.containerState()`.
 */
export interface ContainerStateView {
  who(siteIndex: number): number;
  what(siteIndex: number): number;
  count(siteIndex: number): number;
  isEmpty(siteIndex: number): boolean;
  readonly size: number;
}

export class State {
  public readonly mover: number;
  public readonly cells: readonly number[];
  public readonly componentLabels: readonly string[];
  public readonly scores: readonly number[];
  public readonly valuesPlayer: readonly number[];

  public constructor(
    mover: number,
    cells: readonly number[],
    componentLabels: readonly string[],
    options: {
      readonly scores?: readonly number[];
      readonly valuesPlayer?: readonly number[];
      readonly numPlayers?: number;
    } = {},
  ) {
    if (!Number.isInteger(mover) || mover < 1) {
      throw new Error(`mover must be a 1-based integer; got ${mover}.`);
    }
    const numPlayers = options.numPlayers ?? componentLabels.length;
    if (!Number.isInteger(numPlayers) || numPlayers < 1) {
      throw new Error(
        `numPlayers must be a positive integer; got ${numPlayers}.`,
      );
    }
    this.mover = mover;
    this.cells = Object.freeze([...cells]);
    this.componentLabels = Object.freeze([...componentLabels]);
    this.scores = Object.freeze(fillSlot(options.scores, numPlayers + 1, 0));
    this.valuesPlayer = Object.freeze(
      fillSlot(options.valuesPlayer, numPlayers + 1, 0),
    );
  }

  public withCell(siteIndex: number, owner: number): State {
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      throw new RangeError(
        `siteIndex ${siteIndex} out of range [0, ${this.cells.length}).`,
      );
    }
    const next = [...this.cells];
    next[siteIndex] = owner;
    return this.with({ cells: next });
  }

  public withMover(mover: number): State {
    return this.with({ mover });
  }

  /** Java parity: `State.setScore(pid, value)` (1-based pid). */
  public withScore(pid: number, value: number): State {
    if (!Number.isInteger(pid) || pid < 0 || pid >= this.scores.length) {
      throw new RangeError(
        `pid ${pid} out of range [0, ${this.scores.length}).`,
      );
    }
    const next = [...this.scores];
    next[pid] = value;
    return this.with({ scores: next });
  }

  /** Java parity: `State.setValuePlayer(pid, value)` (1-based pid). */
  public withValuePlayer(pid: number, value: number): State {
    if (!Number.isInteger(pid) || pid < 0 || pid >= this.valuesPlayer.length) {
      throw new RangeError(
        `pid ${pid} out of range [0, ${this.valuesPlayer.length}).`,
      );
    }
    const next = [...this.valuesPlayer];
    next[pid] = value;
    return this.with({ valuesPlayer: next });
  }

  public score(pid: number): number {
    return this.scores[pid] ?? 0;
  }

  public valuePlayer(pid: number): number {
    return this.valuesPlayer[pid] ?? 0;
  }

  public cellAt(siteIndex: number): CellView {
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      throw new RangeError(
        `siteIndex ${siteIndex} out of range [0, ${this.cells.length}).`,
      );
    }
    const owner = this.cells[siteIndex] ?? 0;
    if (owner === 0) {
      return { owner: 0 };
    }
    const label = this.componentLabels[owner - 1];
    return label === undefined ? { owner } : { owner, componentLabel: label };
  }

  public get siteCount(): number {
    return this.cells.length;
  }

  /** Returns the conceptual ContainerState slice for the board. */
  public containerState(): ContainerStateView {
    const cells = this.cells;
    return Object.freeze({
      size: cells.length,
      who: (i: number) => cells[i] ?? 0,
      what: (i: number) => cells[i] ?? 0,
      count: (i: number) => ((cells[i] ?? 0) === 0 ? 0 : 1),
      isEmpty: (i: number) => (cells[i] ?? 0) === 0,
    });
  }

  private with(patch: {
    mover?: number;
    cells?: readonly number[];
    scores?: readonly number[];
    valuesPlayer?: readonly number[];
  }): State {
    return new State(
      patch.mover ?? this.mover,
      patch.cells ?? this.cells,
      this.componentLabels,
      {
        scores: patch.scores ?? this.scores,
        valuesPlayer: patch.valuesPlayer ?? this.valuesPlayer,
        numPlayers: this.scores.length - 1,
      },
    );
  }
}

function fillSlot(
  source: readonly number[] | undefined,
  length: number,
  fill: number,
): number[] {
  if (source === undefined) return new Array<number>(length).fill(fill);
  if (source.length === length) return [...source];
  const out = new Array<number>(length).fill(fill);
  for (let i = 0; i < Math.min(length, source.length); i += 1) {
    out[i] = source[i] ?? fill;
  }
  return out;
}
