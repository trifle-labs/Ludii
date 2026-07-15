// @java Core/src/other/context/Context.java — the "match" branch of Context.
/**
 * A Context at MATCH scope. Its own `state`/`trial` carry match-level
 * bookkeeping: per-player matchScore lives in `state.scores` exactly like an
 * ordinary game's score array; `trial` records the NextInstance moves plus
 * the match-level over/winner/ranking. `subcontext()` returns the currently
 * active instance's own Context.
 *
 * @java other/context/Context.java — the match-context constructor branch
 * (`subcontext = new Context(subgame, new Trial(subgame), rng, this)`),
 * `currentSubgameIdx`, `completedTrials`.
 */

import { Context, setParentContext } from "../context.js";
import type { Game } from "../game.js";
import type { SeededRng } from "../rng.js";
import type { State } from "../state.js";
import type { Trial } from "../trial.js";

export class MatchContext extends Context {
  private readonly _subcontext: Context;
  /** @java Context.currentSubgameIdx() */
  public readonly currentSubgameIdx: number;
  private readonly _completedTrials: readonly Trial[];

  public constructor(
    game: Game,
    state: State,
    trial: Trial,
    rng: SeededRng,
    subcontext: Context,
    currentSubgameIdx: number,
    completedTrials: readonly Trial[],
  ) {
    super(game, state, trial, rng);
    this._subcontext = subcontext;
    this.currentSubgameIdx = currentSubgameIdx;
    this._completedTrials = completedTrials;
    setParentContext(subcontext, this);
  }

  public override subcontext(): Context {
    return this._subcontext;
  }

  public override isAMatch(): boolean {
    return true;
  }

  public override completedTrials(): readonly Trial[] {
    return this._completedTrials;
  }

  /**
   * @java Context.currentInstanceContext() — walks nested matches down to
   * the innermost live instance context. No known .lud nests matches, but
   * the walk matches Java's loop.
   */
  public currentInstanceContext(): Context {
    let c: Context = this._subcontext;
    while (c.isAMatch()) {
      const sub = c.subcontext();
      if (sub === null) break;
      c = sub;
    }
    return c;
  }

  /**
   * The replay harness re-seeds via `ctx.withRng(...)` right after start;
   * the base implementation would demote this to a plain Context and drop
   * the match wiring. Rebuild the MatchContext and thread the rng into the
   * live instance subcontext too (Java shares ONE rng object between the
   * match context and every instance context).
   */
  public override withRng(rng: SeededRng): Context {
    return new MatchContext(
      this.game,
      this.state,
      this.trial,
      rng,
      this._subcontext.withRng(rng),
      this.currentSubgameIdx,
      this._completedTrials,
    );
  }
}
