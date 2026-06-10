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
   * Java parity: Context.player() / setPlayer(int).
   * Set by (forEach Player/NonMover/Mover ...) end rules to pass the current
   * iterated player index to predicates like (is Blocked Player).
   * Undefined when not inside a forEach iteration.
   * @java other/context/Context.java — player()/setPlayer(int)
   */
  public _evalPlayer?: number;

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
    return out;
  }

  /** @java Context.board(). */
  public board(): {
    defaultSite(): string;
    numSites(): number;
    topology(): unknown;
  } {
    const b = this.boardObject();
    return {
      defaultSite: () => boardDefaultSite(b),
      numSites: () => boardNumSites(b, this.state.cells.length),
      topology: () => boardTopology(b, this.state.cells.length),
    };
  }

  /** @java Context.topology(). */
  public topology(): unknown {
    return this.board().topology();
  }

  /** @java Context.containers(). */
  public containers(): Array<{ numSites(): number }> {
    const n = (this.game as { equipment?: { board?: { numSites?: number } } }).equipment?.board?.numSites ?? this.state.cells.length;
    return [{ numSites: () => n }];
  }

  /** @java Context.containerState(cont) — per-site accessors delegating to State arrays. */
  public containerState(_cont: number): Record<string, any> {
    const st = this.state as unknown as {
      cells: readonly number[]; whats?: readonly number[]; stateAt?: readonly number[];
      rotationAt?: readonly number[]; valueAt?: readonly number[]; stacks?: readonly (readonly number[])[];
    };
    return {
      sizeStack: (site: number) => st.stacks?.[site]?.length ?? ((st.cells[site] ?? 0) ? 1 : 0),
      what: (site: number) => st.whats?.[site] ?? 0,
      who: (site: number) => st.cells[site] ?? 0,
      isEmpty: (site: number) => (st.cells[site] ?? 0) === 0,
      state: (site: number) => st.stateAt?.[site] ?? 0,
      rotation: (site: number) => st.rotationAt?.[site] ?? 0,
      value: (site: number) => st.valueAt?.[site] ?? 0,
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
    return new Context(this.game, state, this.trial, this.rng);
  }

  public withTrial(trial: Trial): Context {
    return new Context(this.game, this.state, trial, this.rng);
  }

  public withRng(rng: SeededRng): Context {
    return new Context(this.game, this.state, this.trial, rng);
  }

  /** Java parity: `Context.rng()`. */
  public getRng(): SeededRng {
    return this.rng;
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
