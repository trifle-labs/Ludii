// @java Core/src/other/state/State.java State
// @java Core/src/other/state/container/ContainerState.java ContainerState
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
  /** Java parity: per-player active flags. Index 0 is unused. */
  readonly active?: readonly boolean[];
  readonly numPlayers?: number;
  readonly hiddenForPlayer?: readonly (readonly boolean[])[];
  readonly stacks?: readonly (readonly number[])[];
  /**
   * Per-level component index, parallel to {@link stacks} which stores the
   * per-level owner (Java: ContainerStateStacks `what[site][level]` alongside
   * `who[site][level]`). Optional and sparse: most games never set it, in which
   * case {@link State.whatAtSiteLevel} falls back to the per-level owner exactly
   * as `whatAtSite` falls back to the cell owner. Only distinct-piece stacks
   * (Tower of Hanoi's Counter9/Counter4, the snakes-and-ladders pawn piles) seed
   * it so a buried piece keeps a different `what` from the piece above it.
   */
  readonly whatStacks?: readonly (readonly number[])[];
  /** Per-site component index (Java: ContainerState.what[i]). */
  readonly whats?: readonly number[];
  /** Per-site state value (Java: ContainerState.state[i]). */
  readonly stateAt?: readonly number[];
  /** Per-site value (Java: ContainerState.value[i]). */
  readonly valueAt?: readonly number[];
  /**
   * Per-site cost / graph weight (Java: Topology element `cost`). Set once by
   * the `(set Cost …)` start rule on weighted-graph games (Onek Rong, Radran,
   * OddEvenTree) and read by `(cost …)`; it never changes during play, so it
   * rides the immutable state copies like the other per-site layers.
   */
  readonly costAt?: readonly number[];
  /** Per-site rotation (Java: ContainerState.rotation[i]). */
  readonly rotationAt?: readonly number[];
  /** Per-site count for non-stacking games (Java: ContainerState.count[i]). */
  readonly countAt?: readonly number[];
  /** 1-based player phase indices (Java: State.phases[pid]). */
  readonly phases?: readonly number[];
  /**
   * Global temporary value (Java: State.tempValue, default Constants.UNDEFINED).
   * @java Core/src/other/state/State.java:83 — `private int tempValue = Constants.UNDEFINED;`
   * Java's temp is a SINGLE value shared across players (State.temp() takes no
   * player); ForEachDie's doubles-replay chain depends on one player's arm
   * being visible to the other (Backgammon rec 131 arms temp=6 for P2, rec 132
   * disarms it during P1's turn).
   */
  readonly tempValue?: number;
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
   * Java parity: `State.numTurn` (the field, returned by `state.numTurn()` and
   * read by `(count Turns)`). It is initialised to **1** (not 0) and is bumped
   * by `reinitNumTurnSamePlayer()` whenever a *new* turn begins — i.e. when the
   * player to move differs from the player who just moved (or the move was a
   * swap). Consecutive same-player moves (`(moveAgain)`) keep the same turn.
   * Defaults to 1 when omitted.
   */
  readonly numTurn?: number;
  /**
   * Java parity: `State.numTurnSamePlayer` (the field returned by
   * `(count MovesThisTurn)`). Counts same-player continuations in the current
   * turn; reset to 0 when a new turn starts.
   */
  readonly numTurnSamePlayer?: number;
  /**
   * Java parity: State.diceAllEqual flag (true if last dice roll were
   * all identical, used for win conditions in dice games).
   */
  readonly diceAllEqual?: boolean;
  /**
   * Java parity: per-die face values from the most recent roll.
   * `Container.dice[i]` in Java; size = number of dice in the equipment.
   */
  readonly diceValues?: readonly number[];
  /** @java ContainerState.stateCell(die site) — rolled faces; UseDie does NOT clear these. */
  readonly diceRolledFaces?: readonly number[];
  /**
   * Java parity: per-player stalemated flag (State.stalemated). Set true when a
   * player's play rules yield no legal move (so a forced pass is played). Read
   * by `(no Moves <player>)` / `(no Moves Mover)` end conditions — these read
   * this *cached* flag rather than recomputing, matching Java NoMoves.eval.
   * Index 0 unused; 1..numPlayers per player. Defaults all false.
   */
  readonly stalemated?: readonly boolean[];
  /**
   * Java parity: `State.storedState` (a single long slot). Set by
   * `(remember State)` / `(storeState)` via `storeCurrentState`, read by
   * `(avoidStoredState …)` to reject moves that would reproduce it. Defaults
   * to 0 (Java's `private long storedState = 0L`).
   */
  readonly storedState?: number;
  /**
   * Java parity: `State.sitesToRemove` (a `TIntArrayList`). The deferred
   * capture queue for sequence-capture games (flying-king draughts): a
   * `(remove … at:EndOfTurn)` marks a site here instead of clearing it now;
   * the marked pieces stay on the board (as blockers, and so the king cannot
   * land where a still-marked enemy sits) until the turn actually ends, when
   * the move-apply store-path flushes them. Read by `(sites ToClear)`.
   */
  readonly sitesToRemove?: readonly number[];
  /**
   * Java parity: `State.visited` (a `BitSet`). Per-turn scratch recording the
   * sites already touched (both `from` and `to`) by moves in the current
   * same-player sequence. Read by `(is Visited …)` to forbid landing on a site
   * already used during a multi-step capture (Fanorona/Vela). Cleared on turn
   * change and accumulated when the mover repeats (LudemeGame.apply), mirroring
   * Game.java's `reInitVisited()` / `visit(from); visit(to)`. Excluded from the
   * position hash — it is turn-local and must not affect repetition detection.
   */
  readonly visited?: ReadonlySet<number>;
  /**
   * Java parity: `State.triggered` (an int bitmask, one bit per player). Set by
   * `ActionTrigger` (`(trigger "<event>" <player>)`) and read by
   * `(is Triggered …)`. Java's `isTriggered(event, who)` ignores the event name
   * and only tests the player's bit, so the event string is cosmetic here too.
   * Used by Tafl-family king-surround wins (`(is Triggered "Surrounded" P2)`).
   */
  readonly triggered?: number;
  /**
   * Java parity: `State.onTrackIndices` (only allocated when the game has an
   * internal-loop track — State.java:496). `onTrackIndices[trackIdx][what][ring
   * index]` = count of `what` pieces sitting at that index along the track. Lets
   * `(trackSite Move …)` disambiguate a site that recurs on a cross-and-circle
   * track (which pass the piece is on). Undefined for the 99% of games with no
   * internal-loop track → every track-index code path is a no-op.
   */
  readonly onTrackIndices?: OnTrackIndices;
  /**
   * Static (shared-by-reference) companion to {@link onTrackIndices}: per-track
   * site → ring-index map, in track declaration order. Passed unchanged through
   * `with()`. Undefined exactly when `onTrackIndices` is — the two travel together.
   */
  readonly trackLocToIndex?: TrackLocToIndex;
}

/** `onTrackIndices[trackIdx][what][ringIndex]` = piece count. */
export type OnTrackIndices = readonly (readonly (readonly number[])[])[];
/** `trackLocToIndex[trackIdx].get(site)` = every ring index that site occupies. */
export type TrackLocToIndex = readonly ReadonlyMap<number, readonly number[]>[];

export class State {
  public readonly mover: number;
  public readonly cells: readonly number[];
  /**
   * Per-site component index (Java: ContainerState.what(site)), parallel to
   * `cells` which stores the owner (who). 0 = no specific component recorded;
   * `whatAtSite`/`containerState().what` then fall back to the owner so
   * single-component-per-player games are unchanged. Heterogeneous-piece games
   * (chess family, shogi, …) populate this so a pawn keeps a different `what`
   * from a rook even when both belong to the same player.
   */
  public readonly whats: readonly number[];
  public readonly componentLabels: readonly string[];
  public readonly scores: readonly number[];
  public readonly valuesPlayer: readonly number[];
  /** Java parity: `Context.active(pid)` state, indexed by player id. */
  public readonly active: readonly boolean[];
  public readonly hiddenForPlayer: readonly (readonly boolean[])[];
  public readonly stacks: readonly (readonly number[])[];
  /**
   * Per-level component `what`, parallel to {@link stacks} (per-level owner).
   * Sparse: empty arrays for non-distinct-piece-stack games, in which case
   * {@link whatAtSiteLevel} falls back to the per-level owner. See
   * {@link StateOptions.whatStacks}.
   */
  public readonly whatStacks: readonly (readonly number[])[];
  public readonly stateAt: readonly number[];
  public readonly valueAt: readonly number[];
  public readonly costAt: readonly number[];
  public readonly rotationAt: readonly number[];
  public readonly countAt: readonly number[];
  public readonly phases: readonly number[];
  /** @java State.tempValue — single global temp, default UNDEFINED (-1). */
  public readonly tempValue: number;
  public readonly amounts: readonly number[];
  public readonly counter: number;
  public readonly pot: number;
  public readonly pending: ReadonlySet<number>;
  public readonly vars: ReadonlyMap<string, number>;
  public readonly remembered: ReadonlyMap<string, readonly number[]>;
  public readonly trumpSuit: number;
  public readonly next: number;
  /** Java parity: `State.numTurn` (init 1). See {@link StateOptions.numTurn}. */
  public readonly numTurn: number;
  /** Java parity: `State.numTurnSamePlayer`. */
  public readonly numTurnSamePlayer: number;
  public readonly diceAllEqual: boolean;
  public readonly diceValues: readonly number[];

  /**
   * The faces showing on each die from the LAST ROLL. @java (face site) reads
   * the die site's container state (set by SetStateAndUpdateDice), which
   * persists after ActionUseDie zeroes State.currentDice.
   */
  public readonly diceRolledFaces: readonly number[];
  public readonly stalemated: readonly boolean[];
  /** Java parity: `State.storedState`. See {@link StateOptions.storedState}. */
  public readonly storedState: number;
  /** Java parity: `State.sitesToRemove`. See {@link StateOptions.sitesToRemove}. */
  public readonly sitesToRemove: readonly number[];
  /** Java parity: `State.visited`. See {@link StateOptions.visited}. */
  public readonly visited: ReadonlySet<number>;
  public readonly triggered: number;
  /** Java parity: `State.onTrackIndices`. See {@link StateOptions.onTrackIndices}. */
  public readonly onTrackIndices?: OnTrackIndices;
  /** Static track site→index maps. See {@link StateOptions.trackLocToIndex}. */
  public readonly trackLocToIndex?: TrackLocToIndex;

  /**
   * On-demand Owned index (piece positions grouped by component), computed by scanning
   * cells (owner/who) + whats (component index). Mirrors Java other/state/owned/Owned:
   * `positions(playerId)` returns an array indexed by component id, each entry the list of
   * Locations that player owns of that component; `mapCompIndex` is identity (we key by the
   * global component id directly). Faithful in result; computed lazily rather than maintained
   * incrementally. Needed by ForEachPiece and other piece-iterating ludeme evals.
   */
  public get owned(): {
    positions(pid: number): Array<Array<{ site(): number; level(): number; siteType(): string }>>;
    mapCompIndex(pid: number, compId: number): number;
  } {
    const cells = this.cells;
    const whats = this.whats;
    return {
      positions: (pid: number) => {
        const byComp: Array<Array<{ site(): number; level(): number; siteType(): string }>> = [];
        for (let s = 0; s < cells.length; s++) {
          if (cells[s] === pid) {
            const comp = whats[s] ?? 0;
            (byComp[comp] ??= []).push({ site: () => s, level: () => 0, siteType: () => "Cell" });
          }
        }
        return byComp;
      },
      mapCompIndex: (_pid: number, compId: number) => compId,
    };
  }

  public constructor(
    mover: number,
    cells: readonly number[],
    componentLabels: readonly string[],
    options: StateOptions = {},
  ) {
    // mover == 0 is reserved for 0-player simulation games (no side to move).
    if (!Number.isInteger(mover) || mover < 0) {
      throw new Error(
        `mover must be a non-negative integer (0 = no mover); got ${mover}.`,
      );
    }
    const numPlayers = options.numPlayers ?? componentLabels.length;
    if (!Number.isInteger(numPlayers) || numPlayers < 0) {
      throw new Error(
        `numPlayers must be a non-negative integer; got ${numPlayers}.`,
      );
    }
    const n = cells.length;
    this.mover = mover;
    this.cells = Object.freeze([...cells]);
    this.whats = Object.freeze(fillSlot(options.whats, n, 0));
    this.componentLabels = Object.freeze([...componentLabels]);
    this.scores = Object.freeze(fillSlot(options.scores, numPlayers + 1, 0));
    // Java State.java:491 fills the per-player value array with UNDEFINED (-1),
    // not 0, so an unset `(value Player …)` reads -1 (see valuePlayer()).
    this.valuesPlayer = Object.freeze(
      fillSlot(options.valuesPlayer, numPlayers + 1, -1),
    );
    this.active = Object.freeze(fillActiveSlot(options.active, numPlayers + 1));
    this.hiddenForPlayer = Object.freeze(
      fillHidden(options.hiddenForPlayer, numPlayers + 1, n),
    );
    this.stacks = Object.freeze(fillStacks(options.stacks, this.cells));
    // Sparse per-level what. Default: a length-n array of empty arrays, so
    // `whatAtSiteLevel` falls through to the per-level owner everywhere until a
    // distinct-piece stack explicitly seeds it. Frozen levels mirror `stacks`.
    this.whatStacks = Object.freeze(fillWhatStacks(options.whatStacks, n));
    this.stateAt = Object.freeze(fillSlot(options.stateAt, n, 0));
    this.valueAt = Object.freeze(fillSlot(options.valueAt, n, 0));
    this.costAt = Object.freeze(fillSlot(options.costAt, n, 0));
    this.rotationAt = Object.freeze(fillSlot(options.rotationAt, n, 0));
    this.countAt = Object.freeze(
      options.countAt
        ? fillSlot(options.countAt, n, 0)
        : this.cells.map((c) => (c === 0 ? 0 : 1)),
    );
    this.phases = Object.freeze(fillSlot(options.phases, numPlayers + 1, 0));
    // @java State.java:83 — tempValue starts at Constants.UNDEFINED (-1).
    this.tempValue = options.tempValue ?? -1;
    this.amounts = Object.freeze(fillSlot(options.amounts, numPlayers + 1, 0));
    // Java parity (State.java:80): the automatic game counter starts at
    // Constants.UNDEFINED (-1), not 0. It is incremented once per applied
    // play move (LudemeGame.apply, mirroring Game.java:3142 `incrCounter`),
    // so the first move's end rules observe -1 and the saved state reads 0.
    this.counter = options.counter ?? -1;
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
    this.numTurn = options.numTurn ?? 1;
    this.numTurnSamePlayer = options.numTurnSamePlayer ?? 0;
    this.diceAllEqual = options.diceAllEqual ?? false;
    this.diceValues = Object.freeze([...(options.diceValues ?? [])]);
    this.diceRolledFaces = Object.freeze([...(options.diceRolledFaces ?? [])]);
    // NOT frozen: the stalemated flags are a CACHE mutated in place by real
    // move generation (@java Game.java:2948 setStalemated), like Java's
    // mutable State field. Value identity of the State excludes them.
    this.stalemated = fillBoolSlot(options.stalemated, numPlayers + 1);
    this.storedState = options.storedState ?? 0;
    this.sitesToRemove = Object.freeze([...(options.sitesToRemove ?? [])]);
    this.visited = options.visited
      ? Object.freeze(new Set(options.visited))
      : Object.freeze(new Set<number>());
    this.triggered = options.triggered ?? 0;
    // Track-index structure (and its static site→index maps) are passed by
    // reference; they are only present for internal-loop-track games and are
    // frozen at construction by their producers, so no copy is taken here.
    this.onTrackIndices = options.onTrackIndices;
    this.trackLocToIndex = options.trackLocToIndex;
  }

  /** Java parity: `State.isTriggered(event, who)` — the event name is ignored. */
  public isTriggered(who: number): boolean {
    if (who < 1) return false;
    return (this.triggered & (1 << (who - 1))) !== 0;
  }

  /** Java parity: `State.triggers(who, value)` — set/clear a player's trigger bit. */
  public withTriggered(who: number, value: boolean): State {
    if (who < 1) return this;
    const bit = 1 << (who - 1);
    const next = value ? this.triggered | bit : this.triggered & ~bit;
    if (next === this.triggered) return this;
    return this.with({ triggered: next });
  }

  /** Java parity: `State.isVisited(site)`. */
  public isVisited(site: number): boolean {
    return this.visited.has(site);
  }

  /**
   * Java parity: `State.visit(from); visit(to)` — add sites to the per-turn
   * visited set. Negative ids are ignored (matching Java's BitSet bounds
   * guard). Returns `this` unchanged when nothing new is added.
   */
  public withVisited(...sites: readonly number[]): State {
    const next = new Set(this.visited);
    for (const s of sites) if (s >= 0) next.add(s);
    if (next.size === this.visited.size) return this;
    return this.with({ visited: next });
  }

  /** Java parity: `State.reInitVisited()` — clear the per-turn visited set. */
  public withVisitedCleared(): State {
    if (this.visited.size === 0) return this;
    return this.with({ visited: new Set<number>() });
  }

  /**
   * Java parity: `State.storeCurrentState(state)` — record this state's hash in
   * the stored-state slot. Used by `(remember State)`; `(avoidStoredState …)`
   * later rejects any move whose result hashes to this value.
   */
  public storeCurrentState(): State {
    return this.with({ storedState: this.hash() });
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

  /**
   * Component index recorded at a site (Java: ContainerState.what(site)).
   *
   * Java parity: emptiness is *what*-based — a site is occupied iff its
   * component index is non-zero, independent of `who`. Neutral pieces
   * (`(piece … Neutral)`, owner 0) carry `who == 0` but a positive `what`, so
   * they MUST report their component here rather than reading as empty. We
   * therefore read `whats` first and only fall back to `who` for the
   * single-component-per-player case where placement set the owner but not an
   * explicit component. Removal actions clear `whats`, so no stale value leaks.
   */
  public whatAtSite(siteIndex: number): number {
    if (siteIndex < 0 || siteIndex >= this.cells.length) return 0;
    const w = this.whats[siteIndex] ?? 0;
    if (w !== 0) return w;
    return this.cells[siteIndex] ?? 0;
  }

  /**
   * Java parity: `ContainerStateStacks.what(site, level)`. The per-level
   * component index. When this site carries a genuine per-level `what` stack
   * (a distinct-piece stack seeded via `(place Stack items:{…})` or built up by
   * the stacking move/add actions), return the recorded `what` at that level,
   * falling back to the per-level owner if a level was pushed without a distinct
   * component. Otherwise the site uses flat (ContainerFlatState) semantics where
   * `what(site, level)` ignores the level and reports the single top `what` —
   * so heterogeneous-piece games with no real stack (chess: a rook keeps a
   * `what` ≠ its owner) still read correctly at level 0.
   */
  public whatAtSiteLevel(siteIndex: number, level: number): number {
    if (siteIndex < 0 || siteIndex >= this.cells.length) return 0;
    const ws = this.whatStacks[siteIndex];
    if (ws !== undefined && ws.length > 0) {
      const w = ws[level] ?? 0;
      if (w !== 0) return w;
      return this.stackAt(siteIndex, level);
    }
    const st = this.stacks[siteIndex];
    if (st !== undefined && st.length > 1) return this.stackAt(siteIndex, level);
    return this.whatAtSite(siteIndex);
  }

  /**
   * Java parity: `ContainerState.isOccupied(site)` — what-based occupancy. A
   * site is occupied when a component sits on it (`what != 0`), when an owner
   * was recorded (`who != 0`, the single-component placement case), or when a
   * stack/count records pieces. Used by `(is Empty)`/`(is Occupied)` and the
   * `(sites Empty)`/`(sites Occupied)` regions so neutral pieces register.
   */
  public isOccupiedSite(siteIndex: number): boolean {
    if (siteIndex < 0 || siteIndex >= this.cells.length) return false;
    if ((this.whats[siteIndex] ?? 0) !== 0) return true;
    if ((this.cells[siteIndex] ?? 0) !== 0) return true;
    if ((this.stacks[siteIndex]?.length ?? 0) > 0) return true;
    // Count-only occupancy (Java: a site removed from the empty chunkset). A
    // large piece's body cells carry only `setCount(loc, 1)` with no who/what
    // (ActionAdd/ActionMove.applyLargePiece); they must read as occupied so
    // `(sites Empty)` excludes them and no other piece lands on the tile. Seed
    // counts (mancala) likewise mean the hole is not empty.
    if ((this.countAt[siteIndex] ?? 0) > 0) return true;
    return false;
  }

  /** Convenience inverse of {@link isOccupiedSite}. */
  public isEmptySite(siteIndex: number): boolean {
    return !this.isOccupiedSite(siteIndex);
  }

  /** Set the component index at a site (Java: ContainerState.setWhat). */
  public withWhatAt(siteIndex: number, what: number): State {
    this.requireSite(siteIndex);
    const next = [...this.whats];
    next[siteIndex] = what;
    return this.with({ whats: next });
  }

  public withMover(mover: number): State {
    return this.with({ mover });
  }

  /** Java parity: `Context.active(pid)`. */
  public activePlayer(pid: number): boolean {
    return pid >= 1 && pid < this.active.length && this.active[pid] === true;
  }

  /** Java parity: `Context.setActive(pid, value)`. */
  public withActivePlayer(pid: number, value: boolean): State {
    if (!Number.isInteger(pid) || pid < 1 || pid >= this.active.length) {
      return this;
    }
    if (this.active[pid] === value) return this;
    const next = [...this.active];
    next[pid] = value;
    return this.with({ active: next });
  }

  /**
   * Java parity: `State.setStalemated(player, value)`. Returns a copy with the
   * given player's stalemated flag updated. Read by `(no Moves <player>)`.
   */
  public withStalemated(player: number, value: boolean): State {
    if (!Number.isInteger(player) || player < 0 || player >= this.stalemated.length) {
      return this;
    }
    const next = [...this.stalemated];
    next[player] = value;
    return this.with({ stalemated: next });
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
    // Java parity (State.java:491 `Arrays.fill(valuesPlayer, Constants.UNDEFINED)`):
    // a player's stored value defaults to UNDEFINED (-1), not 0, until `(set Value
    // <player> …)` / `(set Team …)` assigns it. Games test the unset state with
    // `(= (value Player Mover) Undefined)` (e.g. Cab e Quinal's turn-retention),
    // which only matches when the default is -1. Team ids assigned by `(set Team)`
    // are positive, so "no team" reads as -1 (or 0 in legacy seeds) — callers that
    // distinguish teammates must test `> 0`, not `!== 0`.
    return this.valuesPlayer[pid] ?? -1;
  }

  public cellAt(siteIndex: number): CellView {
    // Java parity: ContainerFlatState.whoCell reads from a ChunkSet, which
    // returns 0 for unset / out-of-range chunks rather than throwing. Off-board
    // (or as-yet-unsized) sites therefore read as empty. This mirrors
    // whatAtSite/countAtSite, which already return 0 off-board, and lets
    // ludemes that probe off-board sites (e.g. direction/leap targets that run
    // off the edge) evaluate as "empty" instead of crashing the replay.
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      return { owner: 0 };
    }
    const owner = this.cells[siteIndex] ?? 0;
    if (owner === 0) {
      return { owner: 0 };
    }
    // @java the label comes from the COMPONENT at the site
    // (components()[what].name()), not from the owner index. componentLabels
    // is 1-indexed by component id (Game.componentLabels).
    const what = this.whats[siteIndex] ?? 0;
    const label = what > 0 ? this.componentLabels[what] : this.componentLabels[owner];
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
    if (this.active.some((v, i) => i > 0 && !v)) {
      for (const a of this.active) mix(a ? 1 : 0);
    }
    return h >>> 0;
  }

  // -------------------------------------------------------------------------
  // @java other/state/container/ContainerState.java — the canonical accessor
  // names. STATE CONVERGENCE chunk 1 (PROJECT_COMPLETION Update 62): consumers
  // migrate from raw arrays (state.cells[s]) to these; the internal arrays then
  // become free to converge on Java's chunked representation.
  // -------------------------------------------------------------------------

  /** @java ContainerState.who(site, type) — owner recorded at a site. */
  public who(siteIndex: number, _type?: string | null): number {
    if (siteIndex < 0 || siteIndex >= this.cells.length) return 0;
    return this.cells[siteIndex] ?? 0;
  }

  /** @java ContainerState.what(site, type) — component index at a site. */
  public what(siteIndex: number, _type?: string | null): number {
    return this.whatAtSite(siteIndex);
  }

  /** @java ContainerState.count(site, type) — piece count at a site. */
  public count(siteIndex: number, _type?: string | null): number {
    if (siteIndex < 0 || siteIndex >= this.cells.length) return 0;
    return this.countAt[siteIndex] ?? 0;
  }

  /** @java ContainerState.state(site, type) — per-site state value. */
  public stateValue(siteIndex: number, _type?: string | null): number {
    if (siteIndex < 0 || siteIndex >= this.stateAt.length) return 0;
    return this.stateAt[siteIndex] ?? 0;
  }

  /** @java ContainerState.isEmpty(site, type) — what-based occupancy inverse. */
  public isEmpty(siteIndex: number, _type?: string | null): boolean {
    return this.isEmptySite(siteIndex);
  }

  /** Returns the conceptual ContainerState slice for the board. */
  public containerState(): ContainerStateView {
    const cells = this.cells;
    const stacks = this.stacks;
    return Object.freeze({
      size: cells.length,
      who: (i: number) => cells[i] ?? 0,
      what: (i: number) => this.whatAtSite(i),
      count: (i: number) => stacks[i]?.length ?? 0,
      isEmpty: (i: number) => (stacks[i]?.length ?? 0) === 0,
    });
  }

  /**
   * Java parity: `ContainerState.sizeStack(siteIndex)`.
   *
   * Count-aware: backgammon-family and seed-stacking games (Nard, Plakoto,
   * Sowing, …) place multiple pieces on a point/hole via `(place Stack …
   * count:N)`, which stores the pile height in `countAt[i]` while the derived
   * `stacks[i]` array carries a single owner-level. A real per-level stack
   * (Lasca, Focus) keeps `countAt` at its default 1 (≤ the stack length), so
   * `max(stackLen, count)` returns the true height in both models. An occupied
   * site is at least height 1 even when neither array recorded a count (a piece
   * relocated onto a previously empty cell leaves `countAt` at 0).
   */
  public stackSize(siteIndex: number): number {
    const stackLen = this.stacks[siteIndex]?.length ?? 0;
    if ((this.cells[siteIndex] ?? 0) === 0) return stackLen;
    return Math.max(stackLen, this.countAt[siteIndex] ?? 0, 1);
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

  /**
   * Java parity: `(who at:s level:L)` — the owner at a stack level. A genuine
   * per-level stack (the level addresses a recorded `stacks[s]` entry) reports
   * that level's owner. A flat or count-pile site (Java ContainerFlatState, or a
   * backgammon/gobblet pile whose height lives in `countAt` while `stacks[s]`
   * holds only the visible top) has no per-level owner array beyond the top, so
   * a level at or beyond the stored stack falls back to the cell's top owner —
   * matching the pre-level-aware behaviour these games relied on (the
   * `MoveToEmptyOrOccupiedByLargerPiece` define always queries `topLevel`).
   */
  public whoAtSiteLevel(siteIndex: number, level: number): number {
    if (siteIndex < 0 || siteIndex >= this.cells.length) return 0;
    const st = this.stacks[siteIndex];
    if (st !== undefined && level >= 0 && level < st.length) {
      return st[level] ?? 0;
    }
    return this.cells[siteIndex] ?? 0;
  }

  /**
   * Java parity: `ContainerStateStacks.addItem(site, what, who)`. Pushes one
   * level (owner) onto the stack at `site` and sets the cell's top owner.
   *
   * The optional `what` records the pushed level's component index in the
   * parallel {@link whatStacks} layer (Java pushes both `who` and `what`). When
   * `what` differs from `owner`, or this site already carries a per-level `what`
   * stack, the layer is materialised (back-filling lower levels from their
   * owners so it stays parallel) and the new component appended; the site's top
   * `whats[]` is refreshed so `whatAtSite`/`(what at:s)` see the new top piece.
   * Owner-only pushes (`what` omitted or equal to `owner`) on a site that never
   * had a `what` stack leave {@link whatStacks} empty — zero change for the
   * existing owner-stacking games.
   */
  public withStackPush(siteIndex: number, owner: number, what?: number): State {
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      throw new RangeError(
        `siteIndex ${siteIndex} out of range [0, ${this.cells.length}).`,
      );
    }
    if (!Number.isInteger(owner) || owner < 1) {
      throw new Error(`owner must be a 1-based integer; got ${owner}.`);
    }
    const existingCount = this.countAt[siteIndex] ?? 0;
    const nextStacks = this.stacks.map((s) => [...s]);
    const target = nextStacks[siteIndex] ?? [];
    const baseOwner = this.cells[siteIndex] ?? 0;
    const baseWhat = this.whatAtSite(siteIndex);
    if (existingCount > target.length && baseOwner > 0) {
      while (target.length < existingCount) target.push(baseOwner);
    }
    target.push(owner);
    nextStacks[siteIndex] = target;
    const nextCells = [...this.cells];
    nextCells[siteIndex] = owner;
    const existing = this.whatStacks[siteIndex];
    const hasWhatStack = existing !== undefined && existing.length > 0;
    const wantWhat = what !== undefined && what !== owner;
    const materializedCount = existingCount > 0 && target.length >= existingCount;
    const heteroOwnerStack =
      baseOwner > 0 && owner !== baseOwner && target.length > 1;
    if (hasWhatStack || wantWhat || materializedCount || heteroOwnerStack) {
      const nextWhatStacks = this.whatStacks.map((s) => [...s]);
      // Back-fill lower levels from their owners so the layer stays parallel
      // when materialised lazily mid-stack (Java seeds both arrays from level 0).
      const prevOwners = this.stacks[siteIndex] ?? [];
      const wsTarget = nextWhatStacks[siteIndex] ?? [];
      while (wsTarget.length < target.length - 1) {
        const idx = wsTarget.length;
        wsTarget.push(prevOwners[idx] ?? (idx < existingCount ? baseWhat : baseOwner));
      }
      wsTarget.push(what ?? owner);
      nextWhatStacks[siteIndex] = wsTarget;
      const nextWhats = [...this.whats];
      nextWhats[siteIndex] = what ?? owner;
      const nextCounts = [...this.countAt];
      nextCounts[siteIndex] = 0;
      return this.with({
        cells: nextCells,
        stacks: nextStacks,
        whatStacks: nextWhatStacks,
        whats: nextWhats,
        countAt: nextCounts,
      });
    }
    const nextWhats = [...this.whats];
    nextWhats[siteIndex] = what ?? owner;
    return this.with({ cells: nextCells, stacks: nextStacks, whats: nextWhats });
  }

  /**
   * Java parity: `ContainerStateStacks.remove(siteIndex, level)`. Pops one
   * level (top by default) and refreshes the visible top owner/component.
   */
  public withStackPop(siteIndex: number, level?: number): State {
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      throw new RangeError(
        `siteIndex ${siteIndex} out of range [0, ${this.cells.length}).`,
      );
    }
    const nextStacks = this.stacks.map((s) => [...s]);
    const target = nextStacks[siteIndex] ?? [];
    const removeAt =
      level !== undefined && level >= 0 && level < target.length
        ? level
        : target.length - 1;
    if (removeAt >= 0) target.splice(removeAt, 1);
    nextStacks[siteIndex] = target;
    const nextCells = [...this.cells];
    nextCells[siteIndex] = target[target.length - 1] ?? 0;
    const existing = this.whatStacks[siteIndex];
    if (existing !== undefined && existing.length > 0) {
      const nextWhatStacks = this.whatStacks.map((s) => [...s]);
      const wsTarget = nextWhatStacks[siteIndex] ?? [];
      if (removeAt >= 0 && removeAt < wsTarget.length) wsTarget.splice(removeAt, 1);
      nextWhatStacks[siteIndex] = wsTarget;
      const nextWhats = [...this.whats];
      nextWhats[siteIndex] = wsTarget[wsTarget.length - 1] ?? 0;
      return this.with({
        cells: nextCells,
        stacks: nextStacks,
        whatStacks: nextWhatStacks,
        whats: nextWhats,
      });
    }
    const nextWhats = [...this.whats];
    nextWhats[siteIndex] = target.length > 0 ? (target[target.length - 1] ?? 0) : 0;
    return this.with({ cells: nextCells, stacks: nextStacks, whats: nextWhats });
  }

  // ---- Per-site value / state / rotation / count -----------------------

  public stateAtSite(siteIndex: number): number {
    return this.stateAt[siteIndex] ?? 0;
  }
  public valueAtSite(siteIndex: number): number {
    return this.valueAt[siteIndex] ?? 0;
  }
  public costAtSite(siteIndex: number): number {
    return this.costAt[siteIndex] ?? 0;
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
  public withCostAt(siteIndex: number, value: number): State {
    this.requireSite(siteIndex);
    const next = [...this.costAt];
    next[siteIndex] = value;
    return this.with({ costAt: next });
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
  /** @java State.temp() — global, no player dimension. */
  public temp(): number {
    return this.tempValue;
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
  /** @java State.setTemp(tempValue) — global, no player dimension. */
  public withTemp(value: number): State {
    return this.with({ tempValue: value });
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
  /**
   * Java parity: `State.reinitNumTurnSamePlayer()` — begin a new turn, bumping
   * `numTurn` by one. Called when the player to move differs from the player
   * who just moved (or the move was a swap).
   */
  public withNewTurn(): State {
    return this.with({ numTurn: this.numTurn + 1 });
  }
  public withNumTurnSamePlayer(value: number): State {
    return this.with({ numTurnSamePlayer: value });
  }
  public withDiceAllEqual(value: boolean): State {
    return this.with({ diceAllEqual: value });
  }
  /** Java parity: replace per-die face values from a fresh roll. */
  public withDiceValues(values: readonly number[]): State {
    const allEqual = values.length >= 2 && values.every((v) => v === values[0]);
    return this.with({
      diceValues: [...values],
      diceAllEqual: values.length >= 2 ? allEqual : this.diceAllEqual,
    });
  }

  /**
   * A fresh roll: sets the consumable values AND the persistent rolled faces.
   * @java ActionUpdateDice — cs.setSite(state=faceIndex) + state.currentDice.
   */
  public withDiceRoll(values: readonly number[]): State {
    return this.withDiceValues(values).with({ diceRolledFaces: [...values] });
  }

  /** Replace the persistent rolled-faces channel only. */
  public withDiceRolledFaces(faces: readonly number[]): State {
    return this.with({ diceRolledFaces: [...faces] });
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
    // Java State.getValue(key): returns Constants.OFF (-1) when the key is
    // absent, NOT 0. Per-turn guards like `(if (= Undefined (var "NbrMoves"))
    // 2 (var "NbrMoves"))` rely on the unset read being -1 to pick the default.
    return this.vars.get(name) ?? -1;
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
      // Java ActionForgetValue → FastTIntArrayList.remove(value) drops only the
      // FIRST occurrence of the value, not every match. Stick-dice race games
      // (Aj Sakakil et al.) remember each throw as its own entry, so `[4,4]`
      // after one `(forget Value "Throws" 4)` must leave `[4]` — the residual
      // throw keeps the same player moving via `(then (if (< 0 (size … Throws))
      // (moveAgain)))`. Filtering out every match dropped both throws and handed
      // the turn over a ply early (desync from ply ~9).
      const idx = cur.indexOf(value);
      if (idx >= 0) {
        const filtered = [...cur.slice(0, idx), ...cur.slice(idx + 1)];
        if (filtered.length === 0) next.delete(name);
        else next.set(name, Object.freeze(filtered));
      }
    }
    return this.with({ remembered: next });
  }

  // ---- Deferred capture queue (sequence capture) -----------------------

  /**
   * Java parity: `State.addSitesToRemove(site)` (via `ActionRemoveNonApplied`).
   * Marks a site for deferred removal at the end of the turn. Duplicates are
   * kept (Java uses a plain `TIntArrayList`), matching the stacking-aware
   * count in `Move.apply`'s flush.
   */
  public withSiteToRemove(site: number): State {
    return this.with({ sitesToRemove: [...this.sitesToRemove, site] });
  }

  /** Java parity: `State.reInitCapturedPiece()` — clear the deferred queue. */
  public withClearedSitesToRemove(): State {
    if (this.sitesToRemove.length === 0) return this;
    return this.with({ sitesToRemove: [] });
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
        whats: patch.whats ?? this.whats,
        scores: patch.scores ?? this.scores,
        valuesPlayer: patch.valuesPlayer ?? this.valuesPlayer,
        active: patch.active ?? this.active,
        hiddenForPlayer: patch.hiddenForPlayer ?? this.hiddenForPlayer,
        stacks: nextStacks,
        // whatStacks rides through unchanged unless explicitly patched. It is
        // maintained in lockstep with `stacks` only by withStackPush/Pop (which
        // always patch both), so a plain `withCell`/`withWhatAt` never needs to
        // resync it — the visible top `what` lives in `whats[]`, which those
        // mutators keep current.
        whatStacks: patch.whatStacks ?? this.whatStacks,
        stateAt: patch.stateAt ?? this.stateAt,
        valueAt: patch.valueAt ?? this.valueAt,
        costAt: patch.costAt ?? this.costAt,
        rotationAt: patch.rotationAt ?? this.rotationAt,
        countAt: patch.countAt ?? this.countAt,
        phases: patch.phases ?? this.phases,
        tempValue: patch.tempValue ?? this.tempValue,
        amounts: patch.amounts ?? this.amounts,
        counter: patch.counter ?? this.counter,
        pot: patch.pot ?? this.pot,
        pending: patch.pending ?? this.pending,
        vars: patch.vars ?? this.vars,
        remembered: patch.remembered ?? this.remembered,
        trumpSuit: patch.trumpSuit ?? this.trumpSuit,
        next: patch.next ?? this.next,
        numTurn: patch.numTurn ?? this.numTurn,
        numTurnSamePlayer:
          patch.numTurnSamePlayer ?? this.numTurnSamePlayer,
        diceAllEqual: patch.diceAllEqual ?? this.diceAllEqual,
        diceValues: patch.diceValues ?? this.diceValues,
        diceRolledFaces: patch.diceRolledFaces ?? this.diceRolledFaces,
        stalemated: patch.stalemated ?? this.stalemated,
        storedState: patch.storedState ?? this.storedState,
        sitesToRemove: patch.sitesToRemove ?? this.sitesToRemove,
        visited: patch.visited ?? this.visited,
        triggered: patch.triggered ?? this.triggered,
        onTrackIndices: patch.onTrackIndices ?? this.onTrackIndices,
        trackLocToIndex: patch.trackLocToIndex ?? this.trackLocToIndex,
        numPlayers: this.scores.length - 1,
      },
    );
  }

  /** Replace the per-state track-index structure (Java OnTrackIndices update).
   * The static `trackLocToIndex` companion is preserved. */
  public withOnTrackIndices(next: OnTrackIndices): State {
    return this.with({ onTrackIndices: next });
  }

  /** Attach both the initial per-state counts and their static site→index
   * companion (start-state setup for an internal-loop track game). */
  public withTrackIndices(
    onTrackIndices: OnTrackIndices,
    trackLocToIndex: TrackLocToIndex,
  ): State {
    return this.with({ onTrackIndices, trackLocToIndex });
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

/**
 * Per-level `what` companion to {@link fillStacks}. Defaults to a length-n array
 * of (frozen) empty arrays — the sparse "no distinct-piece stack anywhere" state
 * where {@link State.whatAtSiteLevel} falls back to the per-level owner. A
 * provided source (start placement of a real stack, or a copied prior state) is
 * frozen level-by-level.
 */
function fillWhatStacks(
  source: readonly (readonly number[])[] | undefined,
  n: number,
): (readonly number[])[] {
  if (source !== undefined) {
    const out = source.map((s) => Object.freeze([...s]));
    while (out.length < n) out.push(Object.freeze([]));
    return out;
  }
  const out: (readonly number[])[] = [];
  for (let i = 0; i < n; i += 1) out.push(Object.freeze([]));
  return out;
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

function fillActiveSlot(
  source: readonly boolean[] | undefined,
  length: number,
): boolean[] {
  const out = new Array<boolean>(length).fill(true);
  out[0] = false;
  if (source === undefined) return out;
  for (let i = 0; i < Math.min(length, source.length); i += 1) {
    out[i] = i === 0 ? false : source[i] === true;
  }
  return out;
}

function fillBoolSlot(
  source: readonly boolean[] | undefined,
  length: number,
): boolean[] {
  if (source === undefined) return new Array<boolean>(length).fill(false);
  if (source.length === length) return [...source];
  const out = new Array<boolean>(length).fill(false);
  for (let i = 0; i < Math.min(length, source.length); i += 1) {
    out[i] = source[i] ?? false;
  }
  return out;
}
