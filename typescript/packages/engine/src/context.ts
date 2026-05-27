// @java Core/src/other/context/Context.java Context
/**
 * Java parity:
 * - Core/src/other/context/Context.java
 *
 * Holds a `Game` + `Trial` + `State`. Immutable in the TS port: every
 * `apply()` produces a new Context. The Java surface is broad
 * (RNG, completed trials, owned components, ranking); the methods
 * pinned here are the ones the engine + browser-player actually call.
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
