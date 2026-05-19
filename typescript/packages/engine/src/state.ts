/**
 * Java parity:
 * - Core/src/other/state/State.java — the conceptual ancestor.
 *
 * The TS port keeps only the surface the BrowserGameSession contract
 * pins. Mover indices are 1-based to match Java. `owner === 0` means
 * empty.
 */

export interface CellView {
  readonly owner: number;
  readonly componentLabel?: string;
}

export class State {
  public readonly mover: number;
  public readonly cells: readonly number[];
  public readonly componentLabels: readonly string[];

  public constructor(
    mover: number,
    cells: readonly number[],
    componentLabels: readonly string[],
  ) {
    if (!Number.isInteger(mover) || mover < 1) {
      throw new Error(`mover must be a 1-based integer; got ${mover}.`);
    }
    this.mover = mover;
    this.cells = Object.freeze([...cells]);
    this.componentLabels = Object.freeze([...componentLabels]);
  }

  public withCell(siteIndex: number, owner: number): State {
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      throw new RangeError(
        `siteIndex ${siteIndex} out of range [0, ${this.cells.length}).`,
      );
    }
    const next = [...this.cells];
    next[siteIndex] = owner;
    return new State(this.mover, next, this.componentLabels);
  }

  public withMover(mover: number): State {
    return new State(mover, this.cells, this.componentLabels);
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
}
