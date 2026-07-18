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
  /** Pile size when > 1 (mancala pits, tables points). */
  readonly count?: number;
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

/** @java other/location/FullLocation — one owned-piece record. */
export interface OwnedEntry {
  readonly pid: number;
  readonly comp: number;
  readonly site: number;
  readonly level: number;
}

/**
 * Per-SiteType occupancy channel for NON-DEFAULT graph elements (Edge/Vertex on
 * a Cell-default board, etc.) — @java the distinct ContainerState Ludii keeps for
 * each SiteType. `who`/`what`/`count` are always present; `state`/`rotation`/
 * `value` are lazily materialised only when a `(set State/Rotation/Value <Type>
 * …)` writes them (the flat cells-indexed stateAt/rotationAt/valueAt arrays
 * cannot hold an Edge index that exceeds the Cell count — N-Mesh's
 * `(set State Edge at:(var "ToEdge") …)` overflowed them).
 */
export interface TypedChannel {
  who: readonly number[];
  what: readonly number[];
  count: readonly number[];
  state?: readonly number[];
  rotation?: readonly number[];
  value?: readonly number[];
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
  /**
   * Shadow copy of a site's `state` value at the instant a level-based board
   * vacate (ActionMoveLevelFrom's per-level `remove`) clears the VISIBLE
   * `stateAt` slot to 0. @java ContainerGraphStateStacks.java:1003-1044 — the
   * Edge/Vertex level-based `remove` only clears the chunk's who/what; the
   * `state` int of that reused, fixed-size chunk is left exactly as it was,
   * but Java's own `state()` accessor is bounds-checked against `sizeStack`
   * so nothing can observe it while the slot sits outside the stack's current
   * bounds — only a LATER piece landing on that exact physical slot (which
   * brings the level back in bounds) inherits it, and only if that landing
   * goes through the state-less `addItemGeneric` used for hand/off-board
   * entries (ContainerStateStacks.java:278-301, ActionMoveTopPiece.java:485-
   * 498). This array exists purely so that one specific consumer — the
   * hand-entry write path in ActionMove's flat branch — can recover that
   * otherwise-unobservable value; ordinary reads (`stateAtSite`,
   * `stateAtLevel`, `stateTop`) never consult it, so it cannot leak into any
   * other game's move generation the way directly leaving `stateAt` dirty
   * would (A K'aak'il / Aj Sakakil / Aj Sayil / Aj Sina'anil / Bul all share
   * Boolik's own captured/capturing per-piece `state` semantics and read
   * `state at:… level:…` at sites that had just been vacated).
   */
  readonly residualStateAt?: readonly number[];
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
  /** Java parity: `State.prev` — the previous mover (setPrev in Game.apply). */
  readonly prev?: number;
  /**
   * @java other/state/owned/FullOwned — the maintained per-piece position
   * registry (pid, component, site, level). `undefined` until the game grows
   * its first per-level stack (Java's OwnedFactory only picks the level-aware
   * FullOwned for stacking games); the lazy `owned` scan serves flat games.
   * Once materialized, actions maintain it Java-faithfully INCLUDING the
   * stale-ghost semantics (FullOwned.java:220-256 decrement loop) that
   * Fenix's recorded trials depend on.
   */
  readonly ownedEntries?: readonly OwnedEntry[];
  /**
   * @java Core/src/other/state/owned/FlatCellOnlyOwned.java — the per-
   * (player,component) position list Java's OwnedFactory selects for
   * Cell-only, NON-stacking board games. Keyed by `${pid}:${comp}`.
   * Unlike `ownedEntries` (FullOwned: order-preserving remove, used for
   * stacking games), FlatCellOnlyOwned.remove is a REMOVE-SWAP (swap the
   * removed entry with the list's last entry, then truncate) — "Since
   * order doesn't matter" per Java's own comment, EXCEPT when a
   * move-generation ludeme draws from the RNG once per candidate in
   * (forEach Piece) iteration order (Shogun's per-move piece-value
   * reroll), where the resulting draw order is externally observable.
   * `undefined` until the first flat board-to-board move materializes it
   * (see State.withFlatOwnedMaterialized); the lazy `owned` ascending scan
   * serves games that never touch this path.
   */
  readonly flatOwned?: ReadonlyMap<string, readonly number[]>;
  /** @java GameType.Stacking — compiled-tree flag; plain moves PUSH levels. */
  readonly stackingGame?: boolean;
  /** stack:True MOVE ludemes compiled (per-level plain-move pushes). */
  readonly stackMovesGame?: boolean;
  /**
   * @java Game.requiresCount() (Game.java:893) — !isStacking() && (any hand
   * container || GameType.Count in the ludeme tree). ActionAdd's occupied-site
   * branch accumulates counts when true, forces 1 when false (ActionAdd.java:310).
   */
  readonly requiresCountGame?: boolean;
  /**
   * @java State.propositions (State.java:125, TIntArrayList) — propositions
   * made via ActionPropose; read by (is Proposed …). Java stores registered
   * vote-string ints; the TS port stores the strings themselves (no preprocess
   * pass, and equality is all that is consumed). Cleared only by ActionVote's
   * clearPropositions (vote resolved) or a fresh game state.
   */
  readonly propositions?: readonly string[];
  /** @java State.votes — votes cast via ActionVote this voting round. */
  readonly votes?: readonly string[];
  /**
   * @java State.isDecided (Constants.UNDEFINED until a vote resolves) — the
   * winning vote string once a majority decides; read by (is Decided …).
   */
  readonly decided?: string | null;
  /**
   * Per-level piece values, parallel to {@link stacks}. Java's plain stacking
   * push (addItemGeneric) does NOT carry the moving piece's value — the new
   * top level gets 0 (oracle: Fenix general s28=[1,0]) — while whole-stack
   * moves DO carry each level's value. MaxMoves' two valuation reads
   * (per-level in eval, top-of-stack in getReplayCount) consume this.
   */
  readonly valueStacks?: readonly (readonly number[])[];
  /**
   * Per-level piece STATE values, sparse like {@link valueStacks}.
   * @java ContainerStateStacks — state(site, level, type) reads the state
   * channel of the per-site HashedChunkStack, distinct from the top-level
   * scalar state. Only materialised when a level-targeted SetState is applied
   * (Aj Sakakil family: a capture stacks the captor and marks the buried
   * level state=2 "CapturedPiece" / top level state=1 "CapturingPiece" via
   * [SetState:...,level=N,state=V] actions; (state at:s level:L) reads them).
   */
  readonly stateStacks?: readonly (readonly number[])[];
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
   * Dual-SiteType channels (@java per-type ContainerStates): pieces living on
   * a NON-play element type (Guerrilla Checkers: vertex play, Cell pieces).
   * Keyed by SiteType name; arrays indexed by that type's element id.
   */
  readonly typedSites?: ReadonlyMap<string, TypedChannel>;
  /**
   * @java game/equipment/container/board/Board.java — the board's declared
   * `use:` default graph-element type, threaded from Board.defaultSite via
   * Game.ts. Defaults to "Cell" for boards that don't declare `use:`. The
   * `owned` registry labels positions with it (@java FullLocation.siteType).
   */
  readonly defaultSiteType?: string;
  /** @java State.sitesToRemove() — EndOfTurn-queued capture sites (Frisian). */
  readonly toClear?: ReadonlySet<number>;
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
  /** See {@link StateOptions.residualStateAt}. */
  public readonly residualStateAt: readonly number[];
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
  /** Java parity: `State.prev` (init 0; @java State.java:737 setPrev). */
  public readonly prev: number;
  /** @java FullOwned registry; see {@link StateOptions.ownedEntries}. */
  public readonly ownedEntries?: readonly OwnedEntry[];
  /** @java FlatCellOnlyOwned registry; see {@link StateOptions.flatOwned}. */
  public readonly flatOwned?: ReadonlyMap<string, readonly number[]>;
  /** @java GameType.Stacking; see {@link StateOptions.stackingGame}. */
  public readonly stackingGame: boolean;
  /** See {@link StateOptions.stackMovesGame}. */
  public readonly stackMovesGame: boolean;
  /** @java Game.requiresCount(); see {@link StateOptions.requiresCountGame}. */
  public readonly requiresCountGame: boolean;
  /** @java State.propositions; see {@link StateOptions.propositions}. */
  public readonly propositions: readonly string[];
  /** @java State.votes; see {@link StateOptions.votes}. */
  public readonly votes: readonly string[];
  /** @java State.isDecided; see {@link StateOptions.decided}. */
  public readonly decided: string | null;
  /** Per-level values; see {@link StateOptions.valueStacks}. */
  public readonly valueStacks?: readonly (readonly number[])[];
  /** Per-level piece states; see {@link StateOptions.stateStacks}. */
  public readonly stateStacks?: readonly (readonly number[])[];
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

  /** Dual-SiteType channels. See {@link StateOptions.typedSites}. */
  public readonly typedSites: ReadonlyMap<string, TypedChannel>;
  /** @see StateOptions.defaultSiteType */
  public readonly defaultSiteType: string;

  /** @java State.sitesToRemove(). See {@link StateOptions.toClear}. */
  public readonly toClear: ReadonlySet<number>;
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
    // @java FlatCellOnlyOwned — once the flat (non-stacking) registry is
    // live, positions come from it VERBATIM, remove-swap perturbation
    // included: this is the exact traversal order (forEach Piece) sees in
    // Java, which matters whenever a per-candidate RNG-consuming move
    // template (Shogun's `(apply (set Value ... (value Random ...)))`
    // reroll) is baked into move generation — a different traversal order
    // draws the SAME logical candidate from a DIFFERENT RNG offset.
    const flat = this.flatOwned;
    if (flat !== undefined) {
      return {
        positions: (pid: number) => {
          const byComp: Array<Array<{ site(): number; level(): number; siteType(): string }>> = [];
          for (const [key, sites] of flat) {
            const sep = key.indexOf(":");
            const ePid = Number(key.slice(0, sep));
            if (ePid !== pid) continue;
            const comp = Number(key.slice(sep + 1));
            byComp[comp] = sites.map((s) => ({
              site: () => s,
              level: () => 0,
              siteType: () => this.defaultSiteType,
            }));
          }
          return byComp;
        },
        mapCompIndex: (_pid: number, compId: number) => compId,
      };
    }
    // @java FullOwned — once the registry is live (stacking game), positions
    // come from it VERBATIM, stale ghosts included (Fenix's recorded moves
    // are generated from one).
    const entries = this.ownedEntries;
    if (entries !== undefined) {
      return {
        positions: (pid: number) => {
          const byComp: Array<Array<{ site(): number; level(): number; siteType(): string }>> = [];
          for (const e of entries) {
            if (e.pid !== pid) continue;
            (byComp[e.comp] ??= []).push({
              site: () => e.site,
              level: () => e.level,
              // @java FullLocation.siteType — positions carry the board's
              // real default type, not a hardcoded Cell (Triple Tangle's
              // use:Vertex board made every on:Vertex forEach see nothing).
              siteType: () => this.defaultSiteType,
            });
          }
          return byComp;
        },
        mapCompIndex: (_pid: number, compId: number) => compId,
      };
    }
    const cells = this.cells;
    const whats = this.whats;
    const stacks = this.stacks;
    const typedSites = this.typedSites;
    const defaultSiteType = this.defaultSiteType;
    return {
      positions: (pid: number) => {
        const byComp: Array<Array<{ site(): number; level(): number; siteType(): string }>> = [];
        for (let s = 0; s < cells.length; s++) {
          const st = stacks[s];
          // @java FullOwned — Java's per-level Owned registry lists EVERY level a
          // player owns at a site, not just the top. A mixed stack formed by a
          // flat move (Main Pacheh: a HittingCapture that sends p4 back to its own
          // start square, which is also an enemy's landing square, buries p4's
          // pieces under the enemy) must still expose the buried levels, or
          // ForEachPiece never generates a move from those pieces. Enumerate the
          // per-level owner array; fall back to the flat top owner when a site has
          // no stack row (fillStacks gives [c] for an occupied flat cell, so
          // single-level/count-pile sites report exactly one level-0 entry as
          // before). The per-level component is read via whatAtSiteLevel, which
          // returns the real flat `what` at level 0 and the stacked `what` above.
          if (st !== undefined && st.length > 0) {
            for (let level = 0; level < st.length; level++) {
              if ((st[level] ?? 0) === pid) {
                const comp = this.whatAtSiteLevel(s, level);
                (byComp[comp] ??= []).push({ site: () => s, level: () => level, siteType: () => defaultSiteType });
              }
            }
          } else if (cells[s] === pid) {
            const comp = whats[s] ?? 0;
            (byComp[comp] ??= []).push({ site: () => s, level: () => 0, siteType: () => defaultSiteType });
          }
        }
        // @java FullOwned.add(playerId, componentId, pieceLoc, type) — the
        // default-channel scan above never covers typedSites (secondary
        // Edge/Vertex occupancy on a non-default board), so on:Edge/on:Vertex
        // forEach branches always saw zero candidates (Triple Tangle).
        for (const [type, ch] of typedSites) {
          for (let s = 0; s < ch.who.length; s++) {
            if ((ch.who[s] ?? 0) === pid) {
              const comp = ch.what[s] ?? 0;
              (byComp[comp] ??= []).push({ site: () => s, level: () => 0, siteType: () => type });
            }
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
    this.residualStateAt = Object.freeze(fillSlot(options.residualStateAt, n, 0));
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
    this.prev = options.prev ?? 0;
    this.ownedEntries = options.ownedEntries;
    this.flatOwned = options.flatOwned;
    this.stackingGame = options.stackingGame ?? false;
    this.stackMovesGame = options.stackMovesGame ?? false;
    this.requiresCountGame = options.requiresCountGame ?? false;
    this.propositions = options.propositions ?? [];
    this.votes = options.votes ?? [];
    this.decided = options.decided ?? null;
    this.valueStacks = options.valueStacks;
    this.stateStacks = options.stateStacks;
    this.numTurn = options.numTurn ?? 1;
    this.numTurnSamePlayer = options.numTurnSamePlayer ?? 0;
    this.diceAllEqual = options.diceAllEqual ?? false;
    this.diceValues = Object.freeze([...(options.diceValues ?? [])]);
    this.diceRolledFaces = Object.freeze([...(options.diceRolledFaces ?? [])]);
    this.typedSites = options.typedSites ?? new Map();
    this.defaultSiteType = options.defaultSiteType ?? "Cell";
    this.toClear = options.toClear ?? new Set();
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
  /** @java ContainerState.who(site, type) — non-play-type channel reader. */
  public whoTyped(type: string, site: number): number {
    return this.typedSites.get(type)?.who[site] ?? 0;
  }
  /** @java ContainerState.what(site, type). */
  public whatTyped(type: string, site: number): number {
    return this.typedSites.get(type)?.what[site] ?? 0;
  }
  /** @java ContainerState.count(site, type). */
  public countTyped(type: string, site: number): number {
    return this.typedSites.get(type)?.count[site] ?? 0;
  }
  /** Write a non-play-type site (@java cs.setSite on the typed container). */
  public withTypedSite(type: string, site: number, who: number, what: number, count: number): State {
    const cur = this.typedSites.get(type);
    const size = Math.max(site + 1, cur?.who.length ?? 0);
    const grow = (arr: readonly number[] | undefined): number[] => {
      const out = new Array<number>(size).fill(0);
      if (arr) for (let i = 0; i < arr.length; i += 1) out[i] = arr[i]!;
      return out;
    };
    const who2 = grow(cur?.who); const what2 = grow(cur?.what); const count2 = grow(cur?.count);
    who2[site] = who; what2[site] = what; count2[site] = count;
    const next = new Map(this.typedSites);
    // Preserve any lazily-materialised state/rotation/value sub-channels (only
    // grow their arrays if this write extends the channel past their length).
    const ch: TypedChannel = { who: who2, what: what2, count: count2 };
    if (cur?.state) ch.state = grow(cur.state);
    if (cur?.rotation) ch.rotation = grow(cur.rotation);
    if (cur?.value) ch.value = grow(cur.value);
    next.set(type, ch);
    return this.with({ typedSites: next });
  }

  /** @java ContainerState.state(site, type) for a non-default graph element. */
  public stateTyped(type: string, site: number): number {
    return this.typedSites.get(type)?.state?.[site] ?? 0;
  }
  /** @java ContainerState.rotation(site, type) for a non-default graph element. */
  public rotationTyped(type: string, site: number): number {
    return this.typedSites.get(type)?.rotation?.[site] ?? 0;
  }
  /** @java ContainerState.value(site, type) for a non-default graph element. */
  public valueTyped(type: string, site: number): number {
    return this.typedSites.get(type)?.value?.[site] ?? 0;
  }

  /**
   * Write the `state`/`rotation`/`value` sub-channel of a non-default graph
   * element's typed container (@java cs.setState/setRotation/setValue on the
   * Edge/Vertex ContainerState). Materialises the sub-channel and the base
   * who/what/count arrays lazily; safe to call before any occupancy write.
   */
  public withTypedAttr(type: string, site: number, attr: "state" | "rotation" | "value", val: number): State {
    const cur = this.typedSites.get(type);
    const size = Math.max(site + 1, cur?.who.length ?? 0, cur?.[attr]?.length ?? 0);
    const grow = (arr: readonly number[] | undefined): number[] => {
      const out = new Array<number>(size).fill(0);
      if (arr) for (let i = 0; i < arr.length; i += 1) out[i] = arr[i]!;
      return out;
    };
    const ch: TypedChannel = {
      who: grow(cur?.who),
      what: grow(cur?.what),
      count: grow(cur?.count),
    };
    if (cur?.state) ch.state = grow(cur.state);
    if (cur?.rotation) ch.rotation = grow(cur.rotation);
    if (cur?.value) ch.value = grow(cur.value);
    const arr = grow(cur?.[attr]);
    arr[site] = val;
    ch[attr] = arr;
    const next = new Map(this.typedSites);
    next.set(type, ch);
    return this.with({ typedSites: next });
  }

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
      const s = this.stackAt(siteIndex, level);
      if (s !== 0) return s;
      // Count-backed pile: a uniform component whose true height lives in
      // countAt alongside a single representative entry in stacks/whatStacks
      // (the mancala largeStack model). A level below the count but beyond that
      // lone stored entry is the SAME component — mirror whoAtSiteLevel, which
      // already falls back to the uniform cell owner for out-of-range levels.
      // Without this, sowing a seed off level>0 of a count-backed hole read
      // what=0 and deposited a phantom what-0 seed at the destination (the
      // Yucebao/two-row `w0` corruption: seeds sown from any level but the
      // bottom lost their Seed component channel, diverging later size/what
      // reads and the round-end sweep).
      const count = this.countAt[siteIndex] ?? 0;
      const stackLen = this.stacks[siteIndex]?.length ?? 0;
      if (count > stackLen && level >= 0 && level < count) return this.whatAtSite(siteIndex);
      return 0;
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
    if ((this.stacks[siteIndex]?.length ?? 0) > 0) return true;
    // NOTE: an owner (`cells`) with no what/stack/count is NOT occupancy —
    // @java ContainerFlatState.isOccupied = countCell != 0; a drained stack
    // (fromTo stack:True) leaves a STALE owner (Shared=3) behind, and reading
    // it as occupied made (is Empty)/LeftMostEmpty pick the wrong sow site
    // (~57 two-row sow games). whats covers piece placement, stacks covers
    // stacking, countAt covers mancala/large-piece bodies — the owner channel
    // alone is never the authority.
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
    const count = this.countAt[siteIndex] ?? 0;
    if (owner === 0 && count === 0) {
      return { owner: 0 };
    }
    // @java the label comes from the COMPONENT at the site
    // (components()[what].name()), not from the owner index. componentLabels
    // is 1-indexed by component id (Game.componentLabels).
    const what = this.whats[siteIndex] ?? 0;
    const label = what > 0 ? this.componentLabels[what] : this.componentLabels[owner];
    // Mancala pits / piles: surface the pile size so the interface can render
    // seed counts (tables points likewise stack same-owner pieces).
    const view: { owner: number; componentLabel?: string; count?: number } = { owner };
    if (label !== undefined) view.componentLabel = label;
    if (count > 1 || (count === 1 && what === 0 && owner === 0)) view.count = count;
    return view;
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
    // @java State.fullHash also fingerprints non-default graph-element
    // container states. Edge/Vertex occupancy lives in the typedSites channel;
    // without it an Edge-only game (cells.length === 0, e.g. a pure line game)
    // would have a constant hash and break repetition detection. Iterated in a
    // stable key order; the map is EMPTY for every Cell-only game, so this
    // contributes nothing and leaves their hashes byte-identical.
    if (this.typedSites.size > 0) {
      for (const type of [...this.typedSites.keys()].sort()) {
        const ch = this.typedSites.get(type)!;
        for (const w of ch.who) mix(w);
        for (const w of ch.what) mix(w);
        for (const c of ch.count) mix(c);
      }
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
    // @java ContainerStateStacks.sizeStack — a site occupied SOLELY by a
    // Neutral (owner-0) component (Es-Sig/Sig-family "Ghoula0") is still
    // occupied: Java's chunk-stack size counter is independent of `who`
    // (FullOwned.add/addItem never gate on owner>0). The old `cells===0`
    // gate treated owner-0-occupied indistinguishably from genuinely empty
    // (both have cells[site]=0), reporting height 0 for a real 1-high Ghoula
    // pile and breaking every `(is Singleton (Stack) ...)` /
    // `(where "Ghoula" Neutral)` query built on it. `whats[site]` still
    // carries the component id when only a Neutral piece sits there — use it
    // as the second occupancy signal.
    const occupied = (this.cells[siteIndex] ?? 0) !== 0 || (this.whats[siteIndex] ?? 0) !== 0;
    if (!occupied) return stackLen;
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
    // @java ContainerStateStacks.addItemGeneric(state, site, what, who, …) accepts
    // who=0 (a Neutral component level): Santorini/Kos build towers of Neutral
    // building pieces (owner 0) that workers then climb onto, so a stack legitimately
    // carries owner-0 levels. The old `owner < 1` guard (a TS invention) silently
    // dropped every building add → towers never formed and the level-3 win never
    // fired (Santorini WINNER_MISMATCH ts=-1). Still reject negatives (UNDEFINED=-1).
    if (!Number.isInteger(owner) || owner < 0) {
      throw new Error(`owner must be a non-negative integer; got ${owner}.`);
    }
    const existingCount = this.countAt[siteIndex] ?? 0;
    const nextStacks = this.stacks.map((s) => [...s]);
    const target = nextStacks[siteIndex] ?? [];
    const baseOwner = this.cells[siteIndex] ?? 0;
    const baseWhat = this.whatAtSite(siteIndex);
    // @java ActionAdd.applyStack → ContainerStateStacks.addItem: the base
    // (first-placed) level of a custom stack is backfilled here from the
    // flat `cells`/`whats` channel before the new level is pushed on top.
    // The old `baseOwner > 0` guard assumed a real base level always has a
    // positive owner, but a Neutral (owner-0) piece is a legitimate base
    // level too (Es-Sig `(place Stack items:{"Ghoula0" "Stick4" ...})`
    // stacks the Neutral "Ghoula0" token as level 0, under the players'
    // sticks). `existingCount` (countAt) is only ever nonzero when
    // `placePieces` genuinely wrote a piece there, so gating on it alone —
    // not also on baseOwner>0 — is sufficient and matches Java, where
    // addItem never conditions on `who`.
    if (existingCount > target.length) {
      while (target.length < existingCount) target.push(baseOwner);
    }
    target.push(owner);
    nextStacks[siteIndex] = target;
    // @java ContainerStateStacks.addItem — a newly pushed level carries state
    // 0. When this site already has a materialised per-level state row, keep
    // it in sync with the stack so the level-less TOP read (stateTop) stays
    // aligned with Java's chunk top (sparse default: no row, nothing to do).
    let nextStateStacksPush: (readonly number[])[] | undefined;
    {
      const ss = this.stateStacks?.[siteIndex];
      if (ss !== undefined && ss.length > 0) {
        const copy = (this.stateStacks ?? []).map((r) => [...r]);
        copy[siteIndex] = [...(copy[siteIndex] ?? []), 0];
        nextStateStacksPush = copy;
      }
    }
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
      // Back-fill the lower whatStacks levels from the EXISTING whatStacks
      // column (component ids), NOT from `stacks` (owner/player ids): a flat
      // piece placed via a plain ActionMove leaves whatStacks empty while
      // `stacks` holds the owner, so reading `stacks` wrote the OWNER number into
      // the component column. Once the upper piece popped, `whats` derived the
      // owner as the component and (forEach Piece) could no longer identify the
      // piece (Pachisi-family Ashta-kashte: a piece stacked onto a protected
      // square then left behind became invisible). prevWhats[idx] is undefined
      // for an un-materialized flat level → fall back to baseWhat (real component).
      const prevWhats = this.whatStacks[siteIndex] ?? [];
      const wsTarget = nextWhatStacks[siteIndex] ?? [];
      while (wsTarget.length < target.length - 1) {
        const idx = wsTarget.length;
        wsTarget.push(prevWhats[idx] ?? (idx < existingCount ? baseWhat : baseOwner));
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
        ...(nextStateStacksPush !== undefined ? { stateStacks: nextStateStacksPush } : {}),
      });
    }
    const nextWhats = [...this.whats];
    nextWhats[siteIndex] = what ?? owner;
    return this.with({
      cells: nextCells,
      stacks: nextStacks,
      whats: nextWhats,
      ...(nextStateStacksPush !== undefined ? { stateStacks: nextStateStacksPush } : {}),
    });
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
    // Per-level VALUES shift with the pop (Java cs.remove splices the value
    // column too) — leaving them desyncs MaxMoves' top-of-stack reads.
    let nextValueStacks: (readonly number[])[] | undefined;
    {
      const vs = this.valueStacks?.[siteIndex];
      if (vs !== undefined && vs.length > 0 && removeAt >= 0) {
        const copy = (this.valueStacks ?? []).map((r) => [...r]);
        if (removeAt < (copy[siteIndex]?.length ?? 0)) copy[siteIndex]!.splice(removeAt, 1);
        else copy[siteIndex] = copy[siteIndex]!.slice(0, -1);
        nextValueStacks = copy;
      }
    }
    // Per-level STATES shift with the pop too (@java ContainerStateStacks
    // .remove splices every per-level channel, state included) — leaving them
    // desyncs (state at:s level:L) reads after a capture stack unwinds.
    let nextStateStacks: (readonly number[])[] | undefined;
    {
      const ss = this.stateStacks?.[siteIndex];
      if (ss !== undefined && ss.length > 0 && removeAt >= 0) {
        const copy = (this.stateStacks ?? []).map((r) => [...r]);
        if (removeAt < (copy[siteIndex]?.length ?? 0)) copy[siteIndex]!.splice(removeAt, 1);
        else copy[siteIndex] = copy[siteIndex]!.slice(0, -1);
        nextStateStacks = copy;
      }
    }
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
        ...(nextValueStacks !== undefined ? { valueStacks: nextValueStacks } : {}),
        ...(nextStateStacks !== undefined ? { stateStacks: nextStateStacks } : {}),
      });
    }
    const nextWhats = [...this.whats];
    nextWhats[siteIndex] = target.length > 0 ? (target[target.length - 1] ?? 0) : 0;
    return this.with({
      cells: nextCells,
      stacks: nextStacks,
      whats: nextWhats,
      ...(nextValueStacks !== undefined ? { valueStacks: nextValueStacks } : {}),
      ...(nextStateStacks !== undefined ? { stateStacks: nextStateStacks } : {}),
    });
  }

  /**
   * Materialize the FullOwned registry from the live board (level-aware).
   * @java OwnedFactory.createOwned — called once when stacking begins.
   */
  public withOwnedMaterialized(): State {
    if (this.ownedEntries !== undefined) return this;
    const entries: OwnedEntry[] = [];
    for (let site = 0; site < this.cells.length; site++) {
      const ownerStack = this.stacks[site] ?? [];
      const whatStack = this.whatStacks[site] ?? [];
      if (ownerStack.length > 0) {
        for (let lvl = 0; lvl < ownerStack.length; lvl++) {
          const pid = ownerStack[lvl] ?? 0;
          // When the level has no explicit whatStack entry (e.g. a hand piece
          // initialised as stacks[s]=[owner], whatStack[]=[]), fall back to the
          // site's component index whats[site] — NOT the owner pid. Using pid as
          // comp made owned.positions(comp) key on the player index, so
          // ForEachPiece never found hand pieces whose global comp != pid
          // (Nama's marker entering from hand). Mirrors the flat branch below.
          // @java FullOwned.add(playerId, componentId, pieceLoc, level, type)
          // — never gates on playerId>0; a Neutral (owner-0) level is a
          // perfectly valid registry entry (Sik/Es-Sig/Sig-family's
          // "Bankor0"/"Ghoula0" tokens, Santorini's building pieces). The
          // old `pid > 0` guard here was a SEPARATE TS-invented instance of
          // the same mistake already fixed at the stacked-start replay loop
          // (Game.ts) and withStackPush's backfill guard: dropping a
          // Neutral level from the registry makes `(where "Ghoula" Neutral)`
          // / `(where "Bankor" Neutral)` unable to find it FOREVER once this
          // registry materializes (no fallback to the raw cells/whats scan
          // after that point) — surfacing as the piece "racing ahead" with
          // no drag-back ever happening (Es-Sig) or `WhereGhoula` falling
          // back to a bogus hand site (Sig wa Duqqan). `ownerStack[lvl]` is
          // only ever populated by genuine pushes (withStackPush never
          // stores a placeholder/gap level), so `pid >= 0` is safe.
          if (pid >= 0) {
            const rawComp = whatStack[lvl];
            const comp = (rawComp !== undefined && rawComp !== 0) ? rawComp : (this.whats[site] || pid);
            entries.push({ pid, comp, site, level: lvl });
          }
        }
      } else if ((this.cells[site] ?? 0) > 0 || (this.whats[site] ?? 0) > 0) {
        // A site occupied SOLELY by a Neutral (owner-0) component (no
        // stacks[] row materialized — e.g. Sig wa Duqqan's single-item
        // `(place Stack "Ghoula0" (ExternalSite))`, entirely represented in
        // the flat `cells`/`whats` channel) still needs a registry entry;
        // `cells[site]===0` alone is ambiguous between "genuinely empty" and
        // "Neutral piece here" — `whats[site]` disambiguates, matching the
        // `stackSize()` occupancy fix above.
        entries.push({ pid: this.cells[site] ?? 0, comp: this.whats[site] || (this.cells[site] ?? 0), site, level: 0 });
      }
    }
    return this.with({ ownedEntries: entries });
  }

  /** @java FullOwned.add(pid, comp, site, level, type). */
  public withOwnedAdd(pid: number, comp: number, site: number, level: number): State {
    if (this.ownedEntries === undefined) return this;
    return this.with({ ownedEntries: [...this.ownedEntries, { pid, comp, site, level }] });
  }

  /**
   * @java FullOwned.remove(pid, comp, site, LEVEL, type) — FullOwned.java:
   * 220-256: delete entries of (pid, comp) matching (site, level), then
   * DECREMENT the level of EVERY entry (all players/components) at the same
   * site with level > removed. The decrement-after-clamp interplay is what
   * leaves Java's stale ghosts; port verbatim.
   */
  public withOwnedRemoveLevel(pid: number, comp: number, site: number, level: number): State {
    if (this.ownedEntries === undefined) return this;
    const next: OwnedEntry[] = [];
    for (const e of this.ownedEntries) {
      if (e.pid === pid && e.comp === comp && e.site === site && e.level === level) continue;
      next.push(e);
    }
    for (let i = 0; i < next.length; i++) {
      const e = next[i]!;
      if (e.site === site && e.level > level) next[i] = { ...e, level: e.level - 1 };
    }
    return this.with({ ownedEntries: next });
  }

  /**
   * @java Core/src/other/state/owned/FlatCellOnlyOwned.java constructor +
   * OwnedFactory — materialize the flat (non-stacking) per-(player,
   * component) position registry from the CURRENT board, in ascending site
   * order. Java always materializes FlatCellOnlyOwned at game start (order
   * then determined by the `(place ...)` evaluation order); scanning
   * ascending here is the faithful equivalent for the common case where a
   * game's start placements enumerate sites in ascending order (verified
   * for Shogun: Pawn1's initial registry is exactly [0,1,2,3,5,6,7]).
   * Lazily triggered on the first flat board-to-board move/removal instead
   * of eagerly at start, so games that never exercise those actions keep
   * paying zero cost and never risk a partially-hooked, stale registry.
   */
  public withFlatOwnedMaterialized(): State {
    if (this.flatOwned !== undefined) return this;
    const map = new Map<string, number[]>();
    for (let s = 0; s < this.cells.length; s++) {
      const pid = this.cells[s] ?? 0;
      if (pid <= 0) continue;
      const comp = this.whats[s] || pid;
      const key = `${pid}:${comp}`;
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return this.with({ flatOwned: map });
  }

  /**
   * @java FlatCellOnlyOwned.java:185-197 `remove(playerId, componentId,
   * pieceLoc, type)` — "Since order doesn't matter, we'll do a remove-swap":
   * find `site` in the (pid, comp) list, overwrite it with the list's LAST
   * element, then drop the last slot. No-ops (including a missing site)
   * exactly as Java's `indexOf(...) >= 0` guard does.
   */
  public withFlatOwnedRemove(pid: number, comp: number, site: number): State {
    if (this.flatOwned === undefined) return this;
    const key = `${pid}:${comp}`;
    const arr = this.flatOwned.get(key);
    if (arr === undefined) return this;
    const idx = arr.indexOf(site);
    if (idx < 0) return this;
    const next = arr.slice();
    const lastIdx = next.length - 1;
    next[idx] = next[lastIdx]!;
    next.pop();
    const nextMap = new Map(this.flatOwned);
    if (next.length > 0) nextMap.set(key, next);
    else nextMap.delete(key);
    return this.with({ flatOwned: nextMap });
  }

  /** @java FlatCellOnlyOwned.java `add(playerId, componentId, pieceLoc, type)` — plain append. */
  public withFlatOwnedAdd(pid: number, comp: number, site: number): State {
    if (this.flatOwned === undefined) return this;
    const key = `${pid}:${comp}`;
    const nextMap = new Map(this.flatOwned);
    const arr = nextMap.get(key);
    nextMap.set(key, arr ? [...arr, site] : [site]);
    return this.with({ flatOwned: nextMap });
  }

  /**
   * @java ContainerState.value(site, level, type) — per-level piece value.
   * Unmaterialized sites: level 0 carries the flat valueAt; higher levels 0.
   */
  public valueAtLevel(site: number, level: number): number {
    const vs = this.valueStacks?.[site];
    if (vs !== undefined && vs.length > 0) return vs[level] ?? 0;
    return level === 0 ? this.valueAtSite(site) : 0;
  }

  /** @java ContainerState.value(site, type) — TOP-of-stack value. */
  public valueTop(site: number): number {
    const vs = this.valueStacks?.[site];
    if (vs !== undefined && vs.length > 0) return vs[vs.length - 1] ?? 0;
    return this.valueAtSite(site);
  }

  /** Replace one site's per-level value column (maintenance helper). */
  public withValueStackRow(site: number, row: readonly number[]): State {
    const next = (this.valueStacks ?? this.stacks.map(() => [] as number[])).map((r) => [...r]);
    next[site] = [...row];
    return this.with({ valueStacks: next });
  }

  /**
   * @java ContainerStateStacks.state(site, level, type) — per-level piece
   * state. Unmaterialized sites: level 0 carries the flat stateAt; higher
   * levels 0 (mirrors valueAtLevel above).
   */
  public stateAtLevel(site: number, level: number): number {
    const ss = this.stateStacks?.[site];
    if (ss !== undefined && ss.length > 0) return ss[level] ?? 0;
    return level === 0 ? (this.stateAt[site] ?? 0) : 0;
  }

  /**
   * @java ContainerStateStacks.state(site, type) — the LEVEL-LESS state read
   * on a stacking container returns the TOP level's state (mirrors valueTop).
   * Dubblets writes (set State at:(last To) level:(level) 2) then reads
   * (state at:#1) with no level: Java's top read sees the written value; the
   * flat-only read returned stale 0. Sites without a materialised per-level
   * row keep the flat scalar.
   */
  public stateTop(site: number): number {
    const ss = this.stateStacks?.[site];
    if (ss !== undefined && ss.length > 0) return ss[ss.length - 1] ?? 0;
    return this.stateAt[site] ?? 0;
  }

  /**
   * @java ActionSetState.apply (ActionSetState.java:107-121) — stacking game
   * with level != UNDEFINED: cs.remove(...level) + cs.insert(...level, state)
   * re-writes the state channel at that exact level. Materialises the sparse
   * stateStacks column on first write, backfilling lower levels with 0
   * (unset chunk slots read as 0 in Java).
   */
  public withStateAtLevel(site: number, level: number, value: number): State {
    this.requireSite(site);
    const next = (this.stateStacks ?? this.stacks.map(() => [] as number[])).map((r) => [...r]);
    const row = next[site] ?? [];
    while (row.length <= level) row.push(0);
    row[level] = value;
    next[site] = row;
    return this.with({ stateStacks: next });
  }

  /** Level-less site wipe of the registry (flat ActionRemove). */
  public withOwnedSiteCleared(site: number): State {
    if (this.ownedEntries === undefined) return this;
    return this.with({ ownedEntries: this.ownedEntries.filter((e) => e.site !== site) });
  }

  /** @java FullOwned.remove(pid, comp, site, type) — level-less: all entries of (pid,comp) at site. */
  public withOwnedRemoveAll(pid: number, comp: number, site: number): State {
    if (this.ownedEntries === undefined) return this;
    return this.with({
      ownedEntries: this.ownedEntries.filter(
        (e) => !(e.pid === pid && e.comp === comp && e.site === site),
      ),
    });
  }

  /**
   * Java parity: `ContainerStateStacks.removeStackGeneric` + `addToEmpty` —
   * clears every level at the site (owner stack, what stack, visible top).
   * Used by the whole-stack ActionMove (@java ActionMoveStacking.java:346).
   */
  public withStackRemoveAll(siteIndex: number): State {
    if (siteIndex < 0 || siteIndex >= this.cells.length) {
      throw new RangeError(
        `siteIndex ${siteIndex} out of range [0, ${this.cells.length}).`,
      );
    }
    const nextStacks = this.stacks.map((s) => [...s]);
    nextStacks[siteIndex] = [];
    const nextWhatStacks = this.whatStacks.map((s) => [...s]);
    nextWhatStacks[siteIndex] = [];
    const nextCells = [...this.cells];
    nextCells[siteIndex] = 0;
    const nextWhats = [...this.whats];
    nextWhats[siteIndex] = 0;
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
  /**
   * Read-only accessor for {@link StateOptions.residualStateAt}. Deliberately
   * NOT consulted by `stateAtSite`/`stateAtLevel`/`stateTop` — only the
   * hand-entry write path in ActionMove's flat branch reads it.
   */
  public residualStateAtSite(siteIndex: number): number {
    return this.residualStateAt[siteIndex] ?? 0;
  }
  /** Writer for {@link StateOptions.residualStateAt}. */
  public withResidualStateAt(siteIndex: number, value: number): State {
    this.requireSite(siteIndex);
    const next = [...this.residualStateAt];
    next[siteIndex] = value;
    return this.with({ residualStateAt: next });
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

  /** @java State.setPrev(who) — stamped by Game.apply before mover advances. */
  public withPrev(value: number): State {
    return this.with({ prev: value });
  }

  /** @java ActionPropose.apply — state.propositions().add(propositionInt). */
  public withPropositionAdded(proposition: string): State {
    return this.with({ propositions: [...this.propositions, proposition] });
  }

  /** @java State.clearPropositions() (State.java:1507) — ActionVote resolution. */
  public withPropositionsCleared(): State {
    return this.with({ propositions: [] });
  }

  /** @java ActionVote.apply — replace the votes list (and optionally resolve). */
  public withVotesState(votes: readonly string[], decided?: string | null): State {
    return decided !== undefined
      ? this.with({ votes, decided, propositions: [] })
      : this.with({ votes });
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

  /** @java sitesToRemove().add — queue an EndOfTurn capture. */
  public withToClear(site: number): State {
    if (this.toClear.has(site)) return this;
    const next = new Set(this.toClear); next.add(site);
    return this.with({ toClear: next });
  }
  /** @java sitesToRemove().clear(). */
  public withToClearEmptied(): State {
    return this.toClear.size === 0 ? this : this.with({ toClear: new Set() });
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
    const cellsDrivenSync = patch.cells !== undefined && patch.stacks === undefined;
    const nextStacks =
      patch.stacks ??
      (cellsDrivenSync ? syncStacks(this.stacks, nextCells) : this.stacks);
    // @java ContainerStateStacks keeps the who[] and what[] columns strictly
    // parallel — remove(site, level) splices BOTH. A cells-driven syncStacks that
    // drops a top OWNER level (cell → 0) must drop the parallel whatStacks level
    // too, else the component column outlives its owner and a later withStackPop
    // strands a phantom whats[]. (Yucebao count-backed hole-6 sow: the lone
    // representative stack collapses when the hole drains via ActionAddCount →
    // withCell(6,0), but whatStacks[6] kept its stale [1]; the next sow re-pushed
    // to [1,1], and popping one level left whats[6]=1 — a phantom that falsely
    // occupied the hole and blocked the round-end sweep / BetweenRounds phase.)
    const nextWhatStacks =
      patch.whatStacks ??
      (cellsDrivenSync ? syncWhatStacks(this.whatStacks, this.stacks, nextCells) : this.whatStacks);
    // @java ContainerStateStacks.java:707 (level-less remove) / :731,757-759
    // (level-aware remove's shift loop) — Java's chunk-based stack keeps
    // who/what/state/rotation/value together in ONE object, so removing a
    // piece clears `state` in the very same atomic write as `who`/`what`.
    // This TS port instead splits them into parallel arrays (`stacks`,
    // `whatStacks`, `stateStacks`), so a cells-driven resync must slice the
    // parallel stateStacks column exactly the way syncWhatStacks slices
    // whatStacks above — otherwise a captured piece's per-level state (e.g.
    // Aj Sakakil's CapturedPiece/CapturingPiece bookkeeping) survives a
    // single-level ActionRemove (which only calls withCell/withWhatAt) and
    // resurfaces when a later piece is pushed onto the same site, corrupting
    // that piece's own (state at:… level:…) read and silently zeroing its
    // move list.
    const nextStateStacks =
      patch.stateStacks ??
      (cellsDrivenSync ? syncStateStacks(this.stateStacks, this.stacks, nextCells) : this.stateStacks);
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
        // whatStacks is kept in lockstep with `stacks`: withStackPush/Pop patch
        // both explicitly, and a cells-driven syncStacks now resyncs whatStacks
        // via syncWhatStacks (see above) so a collapsed owner level never leaves
        // an orphaned component column behind.
        whatStacks: nextWhatStacks,
        stateAt: patch.stateAt ?? this.stateAt,
        residualStateAt: patch.residualStateAt ?? this.residualStateAt,
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
        prev: patch.prev ?? this.prev,
        ownedEntries: patch.ownedEntries ?? this.ownedEntries,
        flatOwned: patch.flatOwned ?? this.flatOwned,
        stackingGame: patch.stackingGame ?? this.stackingGame,
        stackMovesGame: patch.stackMovesGame ?? this.stackMovesGame,
        requiresCountGame: patch.requiresCountGame ?? this.requiresCountGame,
        propositions: patch.propositions ?? this.propositions,
        votes: patch.votes ?? this.votes,
        decided: patch.decided !== undefined ? patch.decided : this.decided,
        valueStacks: patch.valueStacks ?? this.valueStacks,
        stateStacks: nextStateStacks,
        numTurn: patch.numTurn ?? this.numTurn,
        numTurnSamePlayer:
          patch.numTurnSamePlayer ?? this.numTurnSamePlayer,
        diceAllEqual: patch.diceAllEqual ?? this.diceAllEqual,
        diceValues: patch.diceValues ?? this.diceValues,
        diceRolledFaces: patch.diceRolledFaces ?? this.diceRolledFaces,
        typedSites: patch.typedSites ?? this.typedSites,
        defaultSiteType: patch.defaultSiteType ?? this.defaultSiteType,
        toClear: patch.toClear ?? this.toClear,
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
    const prev = previous[i] ?? [];
    const prevTop = prev.length > 0 ? (prev[prev.length - 1] ?? 0) : 0;
    if (top === prevTop) {
      // The visible top owner is UNCHANGED at this site — ride the existing
      // stack through untouched. This is the key parity fix: the old code
      // force-cleared every site whose owner channel was 0, which wiped Neutral
      // pieces (owner 0 with a non-zero component — Santorini/Kos building
      // towers) whenever an UNRELATED move patched `cells` and triggered this
      // global resync. A Neutral piece's prevTop is already 0, so top===prevTop
      // and it survives.
      out.push(prev);
    } else if (top === 0) {
      // The top owner went to 0 → the top piece was removed. Drop ONLY the top
      // level (a buried piece beneath is exposed), not the whole column.
      out.push(prev.slice(0, -1));
    } else if (prev.length === 0) {
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

// @java ContainerStateStacks — the component (`what`) column runs strictly
// parallel to the owner (`who`) column. This mirrors syncStacks' per-site
// structural decision onto whatStacks: when a cells patch drops the top OWNER
// level (owner top → 0), splice the parallel whatStacks top level too. The
// ride-through / owner-replace / new-from-empty branches leave the whatStacks
// length untouched (owner-only degenerate stacks legitimately carry an empty
// whatStacks column, resolved by whatAtSiteLevel's flat fallback).
function syncWhatStacks(
  previousWhat: readonly (readonly number[])[],
  previousOwner: readonly (readonly number[])[],
  cells: readonly number[],
): (readonly number[])[] {
  const out: (readonly number[])[] = [];
  for (let i = 0; i < cells.length; i += 1) {
    const top = cells[i] ?? 0;
    const prevOwner = previousOwner[i] ?? [];
    const prevTop = prevOwner.length > 0 ? (prevOwner[prevOwner.length - 1] ?? 0) : 0;
    const prevWhat = previousWhat[i] ?? [];
    if (top !== prevTop && top === 0 && prevWhat.length > 0) {
      // Owner top removed → drop the parallel component level in lockstep.
      out.push(prevWhat.slice(0, -1));
    } else {
      out.push(prevWhat);
    }
  }
  return out;
}

// Mirrors syncWhatStacks (above) for the per-level STATE column (@java
// ContainerStateStacks.java:707,731,757-759 — `state` travels in the same
// chunk as `who`/`what`, so it must collapse in lockstep here too). Stays
// `undefined` when the site's stateStacks row was never materialised — most
// games never touch `(state at:… level:…)`, so there is nothing to resync.
function syncStateStacks(
  previousState: readonly (readonly number[])[] | undefined,
  previousOwner: readonly (readonly number[])[],
  cells: readonly number[],
): (readonly number[])[] | undefined {
  if (previousState === undefined) return undefined;
  const out: (readonly number[])[] = [];
  for (let i = 0; i < cells.length; i += 1) {
    const top = cells[i] ?? 0;
    const prevOwner = previousOwner[i] ?? [];
    const prevTop = prevOwner.length > 0 ? (prevOwner[prevOwner.length - 1] ?? 0) : 0;
    const prevState = previousState[i] ?? [];
    if (top !== prevTop && top === 0 && prevState.length > 0) {
      // Owner top removed → drop the parallel per-level state too.
      out.push(prevState.slice(0, -1));
    } else {
      out.push(prevState);
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
