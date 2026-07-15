// @java Core/src/other/context/Context.java Context
/**
 * Java parity:
 * - Core/src/other/context/Context.java
 *
 * Holds a `Game` + `Trial` + `State`. Immutable in the TS port: every
 * `apply()` produces a new Context. The Java surface is broad
 * (RNG, completed trials, owned components, ranking); the methods
 * pinned here are the ones the engine + browser-player actually call.
 *
 * Eval-scratch (1:1 path addition):
 * Java's Context carries mutable `from/to/value` scratch fields used by
 * ludeme eval() calls (e.g. IsLine reads the pivot via context.to()).
 * Added here as plain mutable properties that do NOT affect the immutable
 * State/Trial. They are initialised to Java's defaults (-1/-1/0).
 * @java other/context/Context.java — setTo/setFrom/setValue, to()/from()/value()
 */

import type { Game } from "./game.js";
import { SeededRng } from "./rng.js";
import type { State } from "./state.js";
import type { Trial } from "./trial.js";

/**
 * @java Core/src/other/context/Context.java — parentContext field, set by the
 * match-context constructor branch (`new Context(nextGame, nextTrial, rng,
 * this)`). Instance (subgame) contexts are plain Contexts minted by each
 * compiled subgame's own Game.start()/apply(), so the enclosing MatchContext
 * registers the back-pointer here. Non-match contexts are never registered.
 */
const PARENT_CONTEXT = new WeakMap<Context, Context>();

/** Register `parent` as the enclosing match context of `child`. */
export function setParentContext(child: Context, parent: Context): void {
  PARENT_CONTEXT.set(child, parent);
}

export class Context {
  public readonly game: Game;
  public readonly state: State;
  public readonly trial: Trial;
  public readonly rng: SeededRng;

  // ---- Mutable eval-scratch (1:1 path) ------------------------------------
  // Java parity: Context.java — to/from/value scratch for ludeme eval passes.
  // These are NOT part of the immutable state; they are set/read only within
  // a single eval() invocation and reset between calls.
  /** Java parity: Context.to() / setTo(). Default -1 (Constants.OFF). */
  public _evalTo: number = -1;
  /** Java parity: Context.from() / setFrom(). Default -1 (Constants.OFF). */
  public _evalFrom: number = -1;
  /** Java parity: Context.value() / setValue(). Default 0. */
  public _evalValue: number = 0;
  /**
   * Java parity: Context.site() / setSite(int).
   * Used by forEach iteration to pass the current site to conditions.
   * Default -1 (Constants.OFF).
   */
  public _evalSite: number = -1;
  /**
   * Java parity: Context.between() / setBetween(int).
   * The "between" site set during hop iteration (the hurdle being jumped).
   * Read by the `(between)` IntFunction. Default -1 (Constants.OFF).
   */
  public _evalBetween: number = -1;
  /**
   * Java parity: Context.track() / setTrack(int).
   * Used by track-iteration end rules and (sites Track ...). Default
   * Constants.UNDEFINED (-1).
   */
  public _evalTrack: number = -1;
  /**
   * Java parity: Context.player() / setPlayer(int).
   * Set by (forEach Player/NonMover/Mover ...) end rules to pass the current
   * iterated player index to predicates like (is Blocked Player).
   * Undefined when not inside a forEach iteration.
   * @java other/context/Context.java — player()/setPlayer(int)
   */
  public _evalPlayer?: number;
  /** See EvalScratch._sitesDirectionOrigin (ludemes/base.ts). */
  public _sitesDirectionOrigin?: number;

  /**
   * Java parity: Context.region() / setRegion(Region).
   * Carries the "current group" set by (all Groups ...) / (forEach Group ...) so
   * that (sites) with no args (SitesContext) can return the group's site list.
   * Mutable eval-scratch; not part of the immutable State.
   * @java other/context/Context.java — region()/setRegion(Region)
   */
  public _evalRegion: { sites(): number[] } | null = null;

  /** Java parity: Context.region(). */
  public region(): { sites(): number[] } | null { return this._evalRegion; }
  /** Java parity: Context.setRegion(Region). */
  public setRegion(r: { sites(): number[] } | null): void { this._evalRegion = r; }

  /** Java parity: Context.to(). */
  public getEvalTo(): number { return this._evalTo; }
  /** Java parity: Context.setTo(int). */
  public setEvalTo(v: number): void { this._evalTo = v; }
  /** Java parity: Context.from(). */
  public getEvalFrom(): number { return this._evalFrom; }
  /** Java parity: Context.setFrom(int). */
  public setEvalFrom(v: number): void { this._evalFrom = v; }
  /** Java parity: Context.value(). */
  public getEvalValue(): number { return this._evalValue; }
  /** Java parity: Context.setValue(int). */
  public setEvalValue(v: number): void { this._evalValue = v; }

  // Java-named accessors — faithful ludeme evals call ctx.to()/from()/between()/site()
  // exactly as Java Context exposes them. Same scratch fields as the getEval* pairs.
  /** @java Context.to(). */
  public to(): number { return this._evalTo; }
  /** @java Context.setTo(int). */
  public setTo(v: number): void { this._evalTo = v; }
  /** @java Context.from(). */
  public from(): number { return this._evalFrom; }
  /** @java Context.setFrom(int). */
  public setFrom(v: number): void { this._evalFrom = v; }
  /** @java Context.between(). */
  public between(): number { return this._evalBetween; }
  /** @java Context.setBetween(int). */
  public setBetween(v: number): void { this._evalBetween = v; }
  /** @java Context.track(). */
  public track(): number { return this._evalTrack; }
  /** @java Context.setTrack(int). */
  public setTrack(v: number): void { this._evalTrack = v; }
  /** @java Context.site(). */
  public site(): number { return this._evalSite; }
  /** @java Context.setSite(int). */
  public setSite(v: number): void { this._evalSite = v; }
  /** @java Context.value(). */
  public value(): number { return this._evalValue; }
  /** @java Context.setValue(int). */
  public setValue(v: number): void { this._evalValue = v; }
  /** @java Context.player(). */
  public player(): number { return this._evalPlayer ?? 0; }
  /** @java Context.setPlayer(int). */
  public setPlayer(v: number): void { this._evalPlayer = v; }

  // ---- Java Context API (faithful ludeme evals delegate here) -------------
  // Mirror Java's Context accessors, delegating to the Game's equipment/board/
  // state. Typed loosely because callers (e.g. ForEachPiece) read runtime shapes.
  /** @java other/context/Context.java — components(): 1-based component array (index 0 placeholder). */
  public components(): Array<Record<string, any>> {
    const eq = (this.game as { equipment?: { pieces?: readonly (Record<string, any> & { owner: number; index: number; generator: { eval(c: Context): unknown[] } | null })[] } }).equipment;
    const out: Array<Record<string, any>> = [
      { owner: 0, index: 0, generator: null, generate: () => ({ moves: () => [] }) },
    ];
    for (const p of eq?.pieces ?? []) {
      const gen = p.generator;
      // Pass through the real component (so component-specific accessors like
      // getFlips()/roll() survive) and add the generate() adapter ForEachPiece uses.
      out[p.index] = Object.assign(Object.create(Object.getPrototypeOf(p) as object), p, {
        generate: (ctx: Context) => ({ moves: () => (gen ? gen.eval(ctx) : []) }),
      });
    }
    // The Die components are real pieces; adapt their roll signature for Roll's
    // Java-shaped call (@java Die.roll(context) -> rng.nextInt(numFaces); the
    // faithful TS Die.roll takes a nextInt FUNCTION; Roll stores the resolved
    // face VALUE in the engine dice model).
    let dieOrdinal = 0;
    for (const p of (eq?.pieces ?? []) as ReadonlyArray<{ index: number; name?: string; faces?: readonly number[] }>) {
      const real = out[p.index] as { roll?: unknown; getFaces?: unknown } | undefined;
      // Faces from the component, else from the dice container spec by ordinal
      // (@java Dice creates its Die components; setFaces may run later).
      let faces = p.faces;
      const isDieName = typeof p.name === "string" && /^Die\d*$/.test(p.name);
      if ((!faces || faces.length === 0) && isDieName) {
        const spec = (eq as { diceSpecs?: readonly { faces: readonly number[] }[] } | undefined)?.diceSpecs?.[dieOrdinal];
        if (spec) faces = spec.faces;
      }
      if (isDieName) dieOrdinal++;
      if (real && faces && faces.length > 0) {
        (real as { getFaces: () => number[] }).getFaces = () => [...faces];
        (real as { roll: (ctx: Context) => number }).roll = (ctx: Context) => {
          const rng = (ctx as { rng?: { nextInt?: (n: number) => number } }).rng;
          const k = rng && typeof rng.nextInt === "function" ? rng.nextInt(faces.length) : 0;
          return faces[k] ?? 0;
        };
      }
    }
    return out;
  }

  /** @java Context.sitesFrom() — delegates to the game's container bases. */
  public sitesFrom(): number[] {
    const g = this.game as { sitesFrom?: () => number[] };
    return typeof g.sitesFrom === "function" ? g.sitesFrom() : [0];
  }

  /** @java Context.board(). */
  public board(): {
    defaultSite(): string;
    numSites(): number;
    topology(): unknown;
    ownedTracks(owner: number): unknown[];
    tracks(): unknown[];
  } {
    const b = this.boardObject();
    return {
      defaultSite: () => boardDefaultSite(b),
      numSites: () => boardNumSites(b, this.state.cells.length),
      topology: () => boardTopology(b, this.state.cells.length),
      // @java Board.ownedTracks(owner) / Topology tracks — race-game track lookups.
      ownedTracks: (owner: number) => {
        const bb = b as { ownedTracks?: ((o: number) => unknown[]) | Record<number, unknown[]> };
        if (typeof bb.ownedTracks === "function") return bb.ownedTracks(owner);
        if (bb.ownedTracks && typeof bb.ownedTracks === "object") return (bb.ownedTracks as Record<number, unknown[]>)[owner] ?? [];
        return [];
      },
      tracks: () => {
        const bb = b as { tracks?: (() => unknown[]) | readonly unknown[] };
        if (typeof bb.tracks === "function") return bb.tracks();
        if (Array.isArray(bb.tracks)) return [...bb.tracks];
        return [];
      },
    };
  }

  /** @java Context.topology(). */
  public topology(): unknown {
    return this.board().topology();
  }

  /** @java Context.containers() — board + hands + dice, the Java container list
   * (consistent with sitesFrom(): index i here owns base sitesFrom()[i]). */
  public containers(): Array<{ numSites(): number; isHand(): boolean; isDice(): boolean; owner(): number; index(): number; name(): string }> {
    const eq = (this.game as {
      equipment?: {
        board?: { numSites?: number };
        hands?: readonly { owner: number; size: number }[];
        diceSpecs?: readonly { faces: readonly number[] }[];
      };
    }).equipment;
    const n = eq?.board?.numSites ?? this.state.cells.length;
    // @java Board.java:92 super("Board", …) — the main board container is named "Board";
    // Hand containers are "Hand"+owner. mapContainer().get(name) (ContainerId.eval) relies
    // on these names, e.g. (count Sites "Board") = board.numSites().
    const out: Array<{ numSites(): number; isHand(): boolean; isDice(): boolean; owner(): number; index(): number; name(): string }> = [
      { numSites: () => n, isHand: () => false, isDice: () => false, owner: () => 0, index: () => 0, name: () => "Board" },
    ];
    let idx = 1;
    for (const hand of eq?.hands ?? []) {
      const i = idx++;
      out.push({ numSites: () => hand.size, isHand: () => true, isDice: () => false, owner: () => hand.owner, index: () => i, name: () => "Hand" + hand.owner });
    }
    if ((eq?.diceSpecs?.length ?? 0) > 0) {
      const i = idx++;
      const locs = eq!.diceSpecs!.length;
      out.push({ numSites: () => locs, isHand: () => true, isDice: () => true, owner: () => 0, index: () => i, name: () => "Dice" });
    }
    return out;
  }

  /**
   * @java Context.containerState(cont) — per-site accessors delegating to State arrays.
   *
   * BUG FIX (Sik/Es-Sig/Sig family, ply-215-class divergence): Java's
   * ContainerState overloads `what/who/state`(site, type) with a THREE-ARG
   * form `what/who/state`(site, level, type) that reads the given LEVEL of
   * a genuine per-level stack (ContainerStateStacks.java ~L200-260), not
   * just the top/flat value. Callers that need level-aware reads — e.g.
   * WhereSite.eval()'s `isStacking` branch (game/functions/ints/board/
   * where/WhereSite.java) and WhereLevel.eval() — always pass the level
   * as the 2nd argument and rely on it being honoured. This TS shim used
   * to ignore any extra arguments and always return the flat/top value
   * (`st.whats?.[site]`), so once a second piece stacked on TOP of a
   * buried piece the buried piece became permanently unfindable by any
   * `(where "X" P level:...)`-style / isStacking per-level scan — even
   * though the underlying State already carries fully correct per-level
   * data via `whatAtSiteLevel`/`whoAtSiteLevel`/`stateAtLevel`.
   *
   * Concretely: Sik's `(where "Stick" Mover)` stopped finding mover 4's
   * own Stick sitting at level 0 of the Center stack the moment another
   * player's Stick stacked on top of it (level 1), because the shim's
   * `what(site, level, type)` call collapsed to `st.whats[site]` (the
   * flat/top value = the OTHER player's Stick) regardless of the level
   * argument. That made the `(= (Center) (where "Stick" Mover))` guard
   * evaluate false, routing Sik's Bankor-move branch to a dead end and
   * forcing a spurious Pass despite every other piece of state (owner/
   * what/state channels, both flat and per-level) being fully correct.
   *
   * Fix: detect the 3-arg (site, level, type) call form and delegate to
   * State's existing, already-correct per-level accessors instead of the
   * flat arrays. The 2-arg (site, type) / 1-arg (site) forms are
   * unchanged (still flat/top, matching Java's own two-arg overloads).
   */
  public containerState(_cont: number): Record<string, any> {
    const state = this.state;
    const st = this.state as unknown as {
      cells: readonly number[]; whats?: readonly number[]; stateAt?: readonly number[];
      rotationAt?: readonly number[]; valueAt?: readonly number[]; stacks?: readonly (readonly number[])[];
      countAt?: readonly number[];
    };
    /** True when `arg` is the numeric level argument of a 3-arg call (site, level, type). */
    const isLevelArg = (arg: unknown): arg is number => typeof arg === "number";
    return {
      // @java ContainerState.sizeStack(site) — a true per-level `stacks[]` array
      // reports its length; otherwise a flat cell counts as one level if owned.
      // This preserves the flat-count families (backgammon/hunt) EXACTLY: their
      // `(size Stack at:)` must be occupied?1:0, NOT the pile `countAt` — routing
      // them through State.stackSize (count-aware, returns the full pile) broke
      // their `top:True` move-gen. The ONLY added case is a flat-placed NEUTRAL
      // piece (owner 0 but `what` and `count` both set — Ex Nihilo's opening
      // Disc0): the old `cells ? 1 : 0` test read it as empty, so `top:True`
      // rejected every neutral piece. A genuinely-empty cell (no component, no
      // count) still reports 0, so cleared cells are unaffected.
      sizeStack: (site: number) => {
        const old = st.stacks?.[site]?.length ?? ((st.cells[site] ?? 0) ? 1 : 0);
        if (old !== 0) return old;
        if ((st.stacks?.[site]?.length ?? 0) === 0
          && (st.whats?.[site] ?? 0) !== 0
          && (st.countAt?.[site] ?? 0) > 0) return 1;
        return 0;
      },
      // @java ContainerState.what(site, type) / what(site, level, type).
      what: (site: number, levelOrType?: unknown) =>
        isLevelArg(levelOrType) ? state.whatAtSiteLevel(site, levelOrType) : (st.whats?.[site] ?? 0),
      // @java ContainerState.who(site, type) / who(site, level, type).
      who: (site: number, levelOrType?: unknown) =>
        isLevelArg(levelOrType) ? state.whoAtSiteLevel(site, levelOrType) : (st.cells[site] ?? 0),
      isEmpty: (site: number) => (st.cells[site] ?? 0) === 0,
      // @java ContainerState.state(site, type) / state(site, level, type).
      state: (site: number, levelOrType?: unknown) =>
        isLevelArg(levelOrType) ? state.stateAtLevel(site, levelOrType) : (st.stateAt?.[site] ?? 0),
      rotation: (site: number) => st.rotationAt?.[site] ?? 0,
      // @java ContainerState.value(site, type) / value(site, level, type).
      value: (site: number, levelOrType?: unknown) =>
        isLevelArg(levelOrType) ? state.valueAtLevel(site, levelOrType) : (st.valueAt?.[site] ?? 0),
    };
  }

  public constructor(game: Game, state: State, trial: Trial, rng?: SeededRng) {
    this.game = game;
    this.state = state;
    this.trial = trial;
    this.rng = rng ?? new SeededRng(0x9e3779b1);
  }

  private boardObject(): unknown {
    const gameAny = this.game as unknown as {
      board?: (() => unknown) | unknown;
      equipment?: { board?: unknown };
    };
    if (typeof gameAny.board === "function") return gameAny.board();
    if (gameAny.board !== undefined) return gameAny.board;
    return gameAny.equipment?.board ?? null;
  }

  public withState(state: State): Context {
    return this.copyEvalScratchTo(new Context(this.game, state, this.trial, this.rng));
  }

  public withTrial(trial: Trial): Context {
    return this.copyEvalScratchTo(new Context(this.game, this.state, trial, this.rng));
  }

  public withRng(rng: SeededRng): Context {
    return this.copyEvalScratchTo(new Context(this.game, this.state, this.trial, rng));
  }

  private copyEvalScratchTo(ctx: Context): Context {
    ctx._evalTo = this._evalTo;
    ctx._evalFrom = this._evalFrom;
    ctx._evalValue = this._evalValue;
    ctx._evalSite = this._evalSite;
    ctx._evalBetween = this._evalBetween;
    ctx._evalTrack = this._evalTrack;
    ctx._evalPlayer = this._evalPlayer;
    ctx._sitesDirectionOrigin = this._sitesDirectionOrigin;
    ctx._evalRegion = this._evalRegion;
    return ctx;
  }

  /** Java parity: `Context.rng()`. */
  public getRng(): SeededRng {
    return this.rng;
  }

  /**
   * @java Context.subcontext() — the active instance context of a Match.
   * Base contexts have none; MatchContext overrides.
   */
  public subcontext(): Context | null {
    return null;
  }

  /**
   * @java Context.parentContext() — the enclosing Match context for an
   * instance subcontext. Instance contexts are plain Contexts minted by the
   * compiled subgame's own start/apply, so the back-pointer lives in a
   * WeakMap registered by MatchContext rather than a subclass field.
   */
  public parentContext(): Context | null {
    return PARENT_CONTEXT.get(this) ?? null;
  }

  /** @java Context.isAMatch(). MatchContext overrides to true. */
  public isAMatch(): boolean {
    return false;
  }

  /** @java Context.completedTrials(). MatchContext overrides. */
  public completedTrials(): readonly Trial[] {
    return [];
  }

  /** Java parity: `Context.trial().ranking()`. */
  public ranking(): readonly number[] {
    return this.trial.ranking;
  }

  public get mover(): number {
    return this.state.mover;
  }

  public get over(): boolean {
    return this.trial.over;
  }

  public get winner(): number {
    return this.trial.winner;
  }

  /** Java parity: `Context.game()`. Kept as a method for shape parity. */
  public getGame(): Game {
    return this.game;
  }

  /** Java parity: `Context.state()`. */
  public getState(): State {
    return this.state;
  }

  /** Java parity: `Context.trial()`. */
  public getTrial(): Trial {
    return this.trial;
  }

  /** Java parity: `Context.numPlayers()`. */
  public numPlayers(): number {
    return this.game.numPlayers;
  }

  /** @java Context.tracks(). */
  public tracks(): unknown[] {
    const board = this.boardObject() as {
      tracks?: (() => unknown[]) | readonly unknown[];
      getTracks?: () => unknown[];
    } | null;
    if (board === null) return [];
    if (typeof board.tracks === "function") return board.tracks();
    if (Array.isArray(board.tracks)) return [...board.tracks];
    if (typeof board.getTracks === "function") return board.getTracks();
    return [];
  }

  /** Java parity: preprocessed track list used by track-based slide/sow. */
  public get preComputedTracks(): unknown[] {
    return this.tracks();
  }

  /**
   * @java Context.allPass().
   * Returns true if the last N moves, where N is the number of players, are
   * passes.
   */
  public allPass(): boolean {
    // @java Context.allPass — true iff the LAST TURN of each of the numPlayers
    // players was a single pass move. A "turn" is a maximal run of consecutive
    // same-mover moves. The old flat "last N moves are passes" check was wrong for
    // any game with multi-move turns (SameTurn / (then (moveAgain))): Cascades's
    // (place + voluntary pass) turn was miscounted as a pure pass, so the all-pass
    // draw fired one turn early and the named win never resolved.
    const numPlayers = this.game.numPlayers;
    const moves = this.trial.moves;
    if (numPlayers === 1) {
      const last = moves[moves.length - 1];
      return last ? last.isPass() : false;
    }
    // state.mover is the mover of the just-applied move (End is evaluated before the
    // mover advance), matching Java's `lastMover = state().mover()`.
    let lastMover = this.state.mover;
    let passMove = false;
    let countMovesTurn = 0;
    let idx = moves.length - 1;
    for (let i = 1; i <= numPlayers; i += 1) {
      for (;;) {
        if (idx < 0) {
          // Not enough moves: all-pass only if the run examined so far was a pass.
          return passMove;
        }
        if (countMovesTurn > 1) return false; // a turn with >1 move is not a pure pass
        const move = moves[idx]!;
        idx -= 1;
        if (lastMover !== move.mover) {
          // new-turn boundary: the just-finished turn must have been a single pass
          if (!passMove) return false;
          lastMover = move.mover;
          countMovesTurn = 0;
          passMove = move.isPass();
          break;
        }
        countMovesTurn += 1;
        passMove = move.isPass();
      }
    }
    return true;
  }

  /** Java parity: `Context.score(pid)`. */
  public score(pid: number): number {
    return this.state.score(pid);
  }
}

function boardDefaultSite(board: unknown): string {
  const b = board as {
    defaultSite?: (() => string) | string;
    getDefaultSite?: () => string;
  } | null;
  if (b === null) return "Cell";
  if (typeof b.defaultSite === "function") return b.defaultSite();
  if (typeof b.getDefaultSite === "function") return b.getDefaultSite();
  if (typeof b.defaultSite === "string") return b.defaultSite;
  return "Cell";
}

function boardNumSites(board: unknown, fallback: number): number {
  const b = board as {
    numSites?: (() => number) | number;
    getNumSites?: () => number;
    getNumSitesBuilt?: () => number;
  } | null;
  if (b === null) return fallback;
  if (typeof b.numSites === "function") return b.numSites();
  if (typeof b.getNumSitesBuilt === "function") return b.getNumSitesBuilt();
  if (typeof b.getNumSites === "function") return b.getNumSites();
  if (typeof b.numSites === "number") return b.numSites;
  return fallback;
}

function boardTopology(board: unknown, fallbackSites: number): unknown {
  const b = board as {
    topology?: () => unknown;
    width?: number;
    height?: number;
    numSites?: (() => number) | number;
  } | null;
  if (b !== null && typeof b.topology === "function") return b.topology();
  const width = typeof b?.width === "number" && b.width > 0 ? b.width : fallbackSites;
  const height = typeof b?.height === "number" && b.height > 0 ? b.height : 1;
  const siteCount = boardNumSites(board, fallbackSites);
  const twoRowMancala = height === 2 && siteCount === width * height + 2;
  const element = (site: number) => ({ index: () => site });
  const row = (r: number) => {
    if (r < 0 || r >= height) return [];
    if (twoRowMancala) {
      const start = r === 0 ? 1 : width + 1;
      return Array.from({ length: width }, (_, i) => start + i)
        .filter((site) => site >= 0 && site < siteCount)
        .map(element);
    }
    const start = r * width;
    return Array.from({ length: width }, (_, i) => start + i)
      .filter((site) => site >= 0 && site < siteCount)
      .map(element);
  };
  const column = (c: number) => {
    if (c < 0 || c >= width) return [];
    return Array.from({ length: height }, (_, r) => r * width + c)
      .filter((site) => site >= 0 && site < siteCount)
      .map(element);
  };
  return {
    getGraphElements: () => ({ size: () => siteCount, length: siteCount }),
    top: () => row(height - 1),
    bottom: () => row(0),
    left: () => column(0),
    right: () => column(width - 1),
    rows: () => Array.from({ length: height }, (_, r) => row(r)),
    columns: () => Array.from({ length: width }, (_, c) => column(c)),
  };
}
