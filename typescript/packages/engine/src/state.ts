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

export interface StateOptions {
  readonly scores?: readonly number[];
  readonly valuesPlayer?: readonly number[];
  readonly numPlayers?: number;
  readonly hiddenForPlayer?: readonly (readonly boolean[])[];
  readonly stacks?: readonly (readonly number[])[];
  /** Per-site state value (Java: ContainerState.state[i]). */
  readonly stateAt?: readonly number[];
  /** Per-site value (Java: ContainerState.value[i]). */
  readonly valueAt?: readonly number[];
  /** Per-site rotation (Java: ContainerState.rotation[i]). */
  readonly rotationAt?: readonly number[];
  /** Per-site count for non-stacking games (Java: ContainerState.count[i]). */
  readonly countAt?: readonly number[];
  /** 1-based player phase indices (Java: State.phases[pid]). */
  readonly phases?: readonly number[];
  /** Per-player temporary value (Java: State.temp[pid]). */
  readonly temps?: readonly number[];
  /** Per-player amount (Java: State.amount[pid]). */
  readonly amounts?: readonly number[];
  /** Game-level counter (Java: State.counter). */
  readonly counter?: number;
  /** Game-level pot (Java: State.pot). */
  readonly pot?: number;
  /** Game-level pending sites (Java: State.pendingValues / pendingStates). */
  readonly pending?: ReadonlySet<number>;
  /** Named variables (Java: State.variables HashMap). */
  readonly vars?: ReadonlyMap<string, number>;
  /**
   * Remembered values keyed by name (Java: State.rememberValues
   * HashMap<String, FastTIntArrayList>).
   */
  readonly remembered?: ReadonlyMap<string, readonly number[]>;
  /** Trump suit (Java: State.trumpSuit). */
  readonly trumpSuit?: number;
  /** Next-mover override (Java: State.next). */
  readonly next?: number;
  /**
   * Java parity: State.diceAllEqual flag (true if last dice roll were
   * all identical, used for win conditions in dice games).
   */
  readonly diceAllEqual?: boolean;
}

export class State {
  public readonly mover: number;
  public readonly cells: readonly number[];
  public readonly componentLabels: readonly string[];
  public readonly scores: readonly number[];
  public readonly valuesPlayer: readonly number[];
  public readonly hiddenForPlayer: readonly (readonly boolean[])[];
  public readonly stacks: readonly (readonly number[])[];
  public readonly stateAt: readonly number[];
  public readonly valueAt: readonly number[];
  public readonly rotationAt: readonly number[];
  public readonly countAt: readonly number[];
  public readonly phases: readonly number[];
  public readonly temps: readonly number[];
  public readonly amounts: readonly number[];
  public readonly counter: number;
  public readonly pot: number;
  public readonly pending: ReadonlySet<number>;
  public readonly vars: ReadonlyMap<string, number>;
  public readonly remembered: ReadonlyMap<string, readonly number[]>;
  public readonly trumpSuit: number;
  public readonly next: number;
  public readonly diceAllEqual: boolean;

  public constructor(
    mover: number,
    cells: readonly number[],
    componentLabels: readonly string[],
    options: StateOptions = {},
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
    const n = cells.length;
    this.mover = mover;
    this.cells = Object.freeze([...cells]);
    this.componentLabels = Object.freeze([...componentLabels]);
    this.scores = Object.freeze(fillSlot(options.scores, numPlayers + 1, 0));
    this.valuesPlayer = Object.freeze(
      fillSlot(options.valuesPlayer, numPlayers + 1, 0),
    );
    this.hiddenForPlayer = Object.freeze(
      fillHidden(options.hiddenForPlayer, numPlayers + 1, n),
    );
    this.stacks = Object.freeze(fillStacks(options.stacks, this.cells));
    this.stateAt = Object.freeze(fillSlot(options.stateAt, n, 0));
    this.valueAt = Object.freeze(fillSlot(options.valueAt, n, 0));
    this.rotationAt = Object.freeze(fillSlot(options.rotationAt, n, 0));
    this.countAt = Object.freeze(
      options.countAt
        ? fillSlot(options.countAt, n, 0)
        : this.cells.map((c) => (c === 0 ? 0 : 1)),
    );
    this.phases = Object.freeze(fillSlot(options.phases, numPlayers + 1, 0));
    this.temps = Object.freeze(fillSlot(options.temps, numPlayers + 1, 0));
    this.amounts = Object.freeze(fillSlot(options.amounts, numPlayers + 1, 0));
    this.counter = options.counter ?? 0;
    this.pot = options.pot ?? 0;
    this.pending = options.pending
      ? Object.freeze(new Set(options.pending))
      : Object.freeze(new Set<number>());
    this.vars = options.vars
      ? Object.freeze(new Map(options.vars))
      : Object.freeze(new Map<string, number>());
    this.remembered = options.remembered
      ? Object.freeze(
          new Map(
            Array.from(options.remembered, ([k, v]) => [
              k,
              Object.freeze([...v]),
            ]),
          ),
        )
      : Object.freeze(new Map<string, readonly number[]>());
    this.trumpSuit = options.trumpSuit ?? 0;
    this.next = options.next ?? 0;
    this.diceAllEqual = options.diceAllEqual ?? false;
  }

  /** Java parity: `State.isHidden(pid, siteIndex)`. */
  public isHidden(pid: number, siteIndex: number): boolean {
    const row = this.hiddenForPlayer[pid];
    if (!row) return false;
    return row[siteIndex] ?? false;
  }

  /** Java parity: `State.setHidden(pid, siteIndex, hidden)`. */
  public withHidden(pid: number, siteIndex: number, hidden: boolean): State {
    if (
      !Number.isInteger(pid) ||
      pid < 0 ||
      pid >= this.hiddenForPlayer.length
    ) {
      throw new RangeError(
        `pid ${pid} out of range [0, ${this.hiddenForPlayer.length}).`,
      );
    }
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      throw new RangeError(
        `siteIndex ${siteIndex} out of range [0, ${this.cells.length}).`,
      );
    }
    const grid: boolean[][] = this.hiddenForPlayer.map((row) => [...row]);
    const target = grid[pid];
    if (!target) {
      throw new RangeError(`pid ${pid} row missing.`);
    }
    target[siteIndex] = hidden;
    return this.with({ hiddenForPlayer: grid });
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

  /**
   * Java parity: `State.fullHash()` — a deterministic 32-bit fingerprint
   * of the visible state used as the keys in `Trial.previousStates`.
   * The TS port uses FNV-1a over the public data members so two states
   * with identical observable shape collide.
   */
  public hash(): number {
    let h = 0x811c9dc5;
    const mix = (n: number): void => {
      h ^= n & 0xff;
      h = Math.imul(h, 0x01000193);
      h ^= (n >>> 8) & 0xff;
      h = Math.imul(h, 0x01000193);
      h ^= (n >>> 16) & 0xff;
      h = Math.imul(h, 0x01000193);
      h ^= (n >>> 24) & 0xff;
      h = Math.imul(h, 0x01000193);
    };
    mix(this.mover);
    for (const c of this.cells) mix(c);
    for (const s of this.scores) mix(s);
    for (const v of this.valuesPlayer) mix(v);
    return h >>> 0;
  }

  /** Returns the conceptual ContainerState slice for the board. */
  public containerState(): ContainerStateView {
    const cells = this.cells;
    const stacks = this.stacks;
    return Object.freeze({
      size: cells.length,
      who: (i: number) => cells[i] ?? 0,
      what: (i: number) => cells[i] ?? 0,
      count: (i: number) => stacks[i]?.length ?? 0,
      isEmpty: (i: number) => (stacks[i]?.length ?? 0) === 0,
    });
  }

  /** Java parity: `ContainerState.sizeStack(siteIndex)`. */
  public stackSize(siteIndex: number): number {
    return this.stacks[siteIndex]?.length ?? 0;
  }

  /**
   * Java parity: `ContainerState.who(siteIndex, level)`. Returns the
   * owner at the given stack level, or 0 if empty.
   */
  public stackAt(siteIndex: number, level: number): number {
    const stack = this.stacks[siteIndex];
    if (!stack) return 0;
    return stack[level] ?? 0;
  }

  /** Java parity: `ContainerState.push(siteIndex, what)`. */
  public withStackPush(siteIndex: number, owner: number): State {
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      throw new RangeError(
        `siteIndex ${siteIndex} out of range [0, ${this.cells.length}).`,
      );
    }
    if (!Number.isInteger(owner) || owner < 1) {
      throw new Error(`owner must be a 1-based integer; got ${owner}.`);
    }
    const nextStacks = this.stacks.map((s) => [...s]);
    const target = nextStacks[siteIndex] ?? [];
    target.push(owner);
    nextStacks[siteIndex] = target;
    const nextCells = [...this.cells];
    nextCells[siteIndex] = owner;
    return this.with({ cells: nextCells, stacks: nextStacks });
  }

  /** Java parity: `ContainerState.pop(siteIndex)`. */
  public withStackPop(siteIndex: number): State {
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      throw new RangeError(
        `siteIndex ${siteIndex} out of range [0, ${this.cells.length}).`,
      );
    }
    const nextStacks = this.stacks.map((s) => [...s]);
    const target = nextStacks[siteIndex] ?? [];
    target.pop();
    nextStacks[siteIndex] = target;
    const nextCells = [...this.cells];
    nextCells[siteIndex] = target[target.length - 1] ?? 0;
    return this.with({ cells: nextCells, stacks: nextStacks });
  }

  // ---- Per-site value / state / rotation / count -----------------------

  public stateAtSite(siteIndex: number): number {
    return this.stateAt[siteIndex] ?? 0;
  }
  public valueAtSite(siteIndex: number): number {
    return this.valueAt[siteIndex] ?? 0;
  }
  public rotationAtSite(siteIndex: number): number {
    return this.rotationAt[siteIndex] ?? 0;
  }
  public countAtSite(siteIndex: number): number {
    return this.countAt[siteIndex] ?? 0;
  }

  public withStateAt(siteIndex: number, value: number): State {
    this.requireSite(siteIndex);
    const next = [...this.stateAt];
    next[siteIndex] = value;
    return this.with({ stateAt: next });
  }
  public withValueAt(siteIndex: number, value: number): State {
    this.requireSite(siteIndex);
    const next = [...this.valueAt];
    next[siteIndex] = value;
    return this.with({ valueAt: next });
  }
  public withRotationAt(siteIndex: number, value: number): State {
    this.requireSite(siteIndex);
    const next = [...this.rotationAt];
    next[siteIndex] = value;
    return this.with({ rotationAt: next });
  }
  public withCountAt(siteIndex: number, value: number): State {
    this.requireSite(siteIndex);
    const next = [...this.countAt];
    next[siteIndex] = value;
    return this.with({ countAt: next });
  }

  // ---- Per-player phase / temp / amount --------------------------------

  public phase(pid: number): number {
    return this.phases[pid] ?? 0;
  }
  public temp(pid: number): number {
    return this.temps[pid] ?? 0;
  }
  public amount(pid: number): number {
    return this.amounts[pid] ?? 0;
  }

  public withPhase(pid: number, value: number): State {
    this.requirePid(pid);
    const next = [...this.phases];
    next[pid] = value;
    return this.with({ phases: next });
  }
  public withTemp(pid: number, value: number): State {
    this.requirePid(pid);
    const next = [...this.temps];
    next[pid] = value;
    return this.with({ temps: next });
  }
  public withAmount(pid: number, value: number): State {
    this.requirePid(pid);
    const next = [...this.amounts];
    next[pid] = value;
    return this.with({ amounts: next });
  }

  // ---- Game-level scalars ----------------------------------------------

  public withCounter(value: number): State {
    return this.with({ counter: value });
  }
  public withPot(value: number): State {
    return this.with({ pot: value });
  }
  public withTrumpSuit(value: number): State {
    return this.with({ trumpSuit: value });
  }
  public withNext(value: number): State {
    return this.with({ next: value });
  }
  public withDiceAllEqual(value: boolean): State {
    return this.with({ diceAllEqual: value });
  }

  // ---- Pending sites ---------------------------------------------------

  public isPending(siteIndex: number): boolean {
    return this.pending.has(siteIndex);
  }
  public withPendingAdd(siteIndex: number): State {
    const next = new Set(this.pending);
    next.add(siteIndex);
    return this.with({ pending: next });
  }
  public withPendingClear(): State {
    return this.with({ pending: new Set<number>() });
  }

  // ---- Named variables -------------------------------------------------

  public getVar(name: string): number {
    return this.vars.get(name) ?? 0;
  }
  public withVar(name: string, value: number): State {
    const next = new Map(this.vars);
    next.set(name, value);
    return this.with({ vars: next });
  }

  // ---- Remembered values -----------------------------------------------

  public rememberedFor(name: string): readonly number[] {
    return this.remembered.get(name) ?? [];
  }
  public withRemember(name: string, value: number): State {
    const next = new Map(this.remembered);
    const cur = next.get(name) ?? [];
    next.set(name, Object.freeze([...cur, value]));
    return this.with({ remembered: next });
  }
  public withForget(name: string, value: number): State {
    const next = new Map(this.remembered);
    const cur = next.get(name);
    if (cur) {
      const filtered = cur.filter((v) => v !== value);
      if (filtered.length === 0) next.delete(name);
      else next.set(name, Object.freeze(filtered));
    }
    return this.with({ remembered: next });
  }

  private requireSite(siteIndex: number): void {
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      throw new RangeError(
        `siteIndex ${siteIndex} out of range [0, ${this.cells.length}).`,
      );
    }
  }

  private requirePid(pid: number): void {
    if (!Number.isInteger(pid) || pid < 0 || pid >= this.scores.length) {
      throw new RangeError(
        `pid ${pid} out of range [0, ${this.scores.length}).`,
      );
    }
  }

  private with(
    patch: Partial<StateOptions> & {
      mover?: number;
      cells?: readonly number[];
    },
  ): State {
    const nextCells = patch.cells ?? this.cells;
    const nextStacks =
      patch.stacks ??
      (patch.cells ? syncStacks(this.stacks, nextCells) : this.stacks);
    return new State(
      patch.mover ?? this.mover,
      nextCells,
      this.componentLabels,
      {
        scores: patch.scores ?? this.scores,
        valuesPlayer: patch.valuesPlayer ?? this.valuesPlayer,
        hiddenForPlayer: patch.hiddenForPlayer ?? this.hiddenForPlayer,
        stacks: nextStacks,
        stateAt: patch.stateAt ?? this.stateAt,
        valueAt: patch.valueAt ?? this.valueAt,
        rotationAt: patch.rotationAt ?? this.rotationAt,
        countAt: patch.countAt ?? this.countAt,
        phases: patch.phases ?? this.phases,
        temps: patch.temps ?? this.temps,
        amounts: patch.amounts ?? this.amounts,
        counter: patch.counter ?? this.counter,
        pot: patch.pot ?? this.pot,
        pending: patch.pending ?? this.pending,
        vars: patch.vars ?? this.vars,
        remembered: patch.remembered ?? this.remembered,
        trumpSuit: patch.trumpSuit ?? this.trumpSuit,
        next: patch.next ?? this.next,
        diceAllEqual: patch.diceAllEqual ?? this.diceAllEqual,
        numPlayers: this.scores.length - 1,
      },
    );
  }
}

function syncStacks(
  previous: readonly (readonly number[])[],
  cells: readonly number[],
): (readonly number[])[] {
  const out: (readonly number[])[] = [];
  for (let i = 0; i < cells.length; i += 1) {
    const top = cells[i] ?? 0;
    const prev = previous[i];
    if (top === 0) {
      out.push([]);
    } else if (!prev || prev.length === 0) {
      out.push([top]);
    } else {
      // Replace the visible top while keeping any buried pieces.
      const copy = [...prev];
      copy[copy.length - 1] = top;
      out.push(copy);
    }
  }
  return out;
}

function fillStacks(
  source: readonly (readonly number[])[] | undefined,
  cells: readonly number[],
): (readonly number[])[] {
  if (source !== undefined) {
    return source.map((s) => Object.freeze([...s]));
  }
  return cells.map((c) => Object.freeze(c === 0 ? [] : [c]));
}

function fillHidden(
  source: readonly (readonly boolean[])[] | undefined,
  rows: number,
  cols: number,
): boolean[][] {
  const out: boolean[][] = [];
  for (let r = 0; r < rows; r += 1) {
    const src = source?.[r];
    const row = new Array<boolean>(cols).fill(false);
    if (src) {
      for (let c = 0; c < Math.min(cols, src.length); c += 1) {
        row[c] = src[c] ?? false;
      }
    }
    out.push(row);
  }
  return out;
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
