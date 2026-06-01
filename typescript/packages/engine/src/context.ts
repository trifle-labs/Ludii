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

  public constructor(game: Game, state: State, trial: Trial, rng?: SeededRng) {
    this.game = game;
    this.state = state;
    this.trial = trial;
    this.rng = rng ?? new SeededRng(0x9e3779b1);
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
