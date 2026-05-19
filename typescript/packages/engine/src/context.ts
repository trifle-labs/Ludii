/**
 * Java parity:
 * - Core/src/other/context/Context.java
 *
 * Holds a `Game` + `Trial` + `State`. Immutable in the TS port: every
 * `apply()` produces a new Context.
 */

import type { Game } from "./game.js";
import type { State } from "./state.js";
import type { Trial } from "./trial.js";

export class Context {
  public readonly game: Game;
  public readonly state: State;
  public readonly trial: Trial;

  public constructor(game: Game, state: State, trial: Trial) {
    this.game = game;
    this.state = state;
    this.trial = trial;
  }

  public withState(state: State): Context {
    return new Context(this.game, state, this.trial);
  }

  public withTrial(trial: Trial): Context {
    return new Context(this.game, this.state, trial);
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
}
