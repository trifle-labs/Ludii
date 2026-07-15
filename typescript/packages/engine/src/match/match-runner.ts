// @java Core/src/game/match/Match.java — apply()/moves()/start();
// @java Core/src/other/context/Context.java — advanceInstance().
/**
 * Game facade for `(match ...)` sources. Implements the standard `Game`
 * interface so it is a drop-in replacement anywhere a `play1to1`-produced
 * Game is consumed (replay harness, browser player). Delegates play to the
 * current subgame instance; at each instance end it emits the synthetic
 * NextInstance move, accumulates match scores, evaluates the match end
 * rules, and (if the match continues) starts the next instance per the
 * subgame's `next:` index.
 */

import { ActionNextInstance } from "../action/action-next-instance.js";
import type { Context } from "../context.js";
import { setParentContext } from "../context.js";
import type { Game } from "../game.js";
import { Move } from "../move.js";
import type { SeededRng } from "../rng.js";
import { SeededRng as SeededRngImpl } from "../rng.js";
import { State } from "../state.js";
import { Trial } from "../trial.js";
import type { Match as MatchDef } from "../ludemes/game/match/Match.js";
import { MatchContext } from "./match-context.js";

/** True when the move carries an ActionNextInstance. */
function isNextInstanceMove(move: Move): boolean {
  return move.actions.some(
    (a) => (a as { containsNextInstance?: () => boolean }).containsNextInstance?.() === true,
  );
}

/**
 * @java Match.moves() — the only legal move once the instance trial is over
 * (and the match is not): a decision ActionNextInstance whose mover is the
 * finished instance's mover (never rotated past game-over, i.e. the winner).
 */
function makeNextInstanceMove(mover: number): Move {
  const action = new ActionNextInstance();
  (action as { setDecision?: (d: boolean) => void }).setDecision?.(true);
  return new Move({
    id: "next-instance",
    label: "Next Instance",
    siteIndices: [],
    mover,
    placedOwner: mover,
    actions: [action],
  });
}

export class MatchRunner implements Game {
  public readonly id: string;
  public readonly name: string;
  public readonly numPlayers: number;
  public readonly width = 0;
  public readonly height = 0;
  public readonly numSites = 0;

  private readonly matchDef: MatchDef;
  private readonly compileSubgame: (name: string) => Game;
  private readonly gameCache = new Map<number, Game>();

  public constructor(matchDef: MatchDef, compileSubgame: (name: string) => Game) {
    this.matchDef = matchDef;
    this.compileSubgame = compileSubgame;
    this.name = matchDef.name ?? "Match";
    this.id = this.name;
    this.numPlayers = matchDef.numPlayers;
  }

  /** @java Match.create() — instances()[0] compiles eagerly, others lazily. */
  private instanceGame(idx: number): Game {
    const cached = this.gameCache.get(idx);
    if (cached) return cached;
    const sub = this.matchDef.instances()[idx];
    if (!sub) throw new Error(`MatchRunner: no subgame instance at index ${idx}`);
    const game = this.compileSubgame(sub.gameName);
    this.gameCache.set(idx, game);
    return game;
  }

  /** @java Match.start(Context) — starts instances()[0] on the subcontext. */
  public start(rng?: SeededRng): Context {
    const sharedRng = rng ?? new SeededRngImpl(0x9e3779b1);
    const firstGame = this.instanceGame(0);
    const subctx = firstGame.start(sharedRng);
    const matchState = new State(1, [], [], { numPlayers: this.numPlayers });
    const matchTrial = new Trial([], false, -1);
    return new MatchContext(this, matchState, matchTrial, subctx.rng, subctx, 0, []);
  }

  /**
   * @java Match.moves(Context) — if the instance trial is over and the match
   * is not, the sole legal move is the synthetic NextInstance; if the match
   * trial is over, none; otherwise delegate to the instance game.
   */
  public moves(context: Context): readonly Move[] {
    const mctx = context as MatchContext;
    const subctx = mctx.subcontext();
    if (mctx.trial.over) return [];
    if (subctx.trial.over) {
      return [makeNextInstanceMove(subctx.state.mover)];
    }
    return this.instanceGame(mctx.currentSubgameIdx).moves(subctx);
  }

  /** @java Match.apply(Context, Move) + Context.advanceInstance(). */
  public apply(context: Context, move: Move): Context {
    const mctx = context as MatchContext;
    if (isNextInstanceMove(move)) return this.advanceInstance(mctx, move);
    const subGame = this.instanceGame(mctx.currentSubgameIdx);
    const subctxAfter = subGame.apply(mctx.subcontext(), move);
    setParentContext(subctxAfter, mctx);
    return new MatchContext(
      this,
      mctx.state,
      mctx.trial,
      subctxAfter.rng,
      subctxAfter,
      mctx.currentSubgameIdx,
      mctx.completedTrials(),
    );
  }

  /**
   * @java Context.advanceInstance() (Context.java:1482-1556) — exact order:
   * accumulate scores → append the finished trial to completedTrials →
   * evaluate the MATCH end rules → only if not over, resolve `next:` (on the
   * match context) and start the new instance with the SAME rng object.
   */
  private advanceInstance(mctx: MatchContext, nextInstanceMove: Move): Context {
    const subctx = mctx.subcontext();
    const numPlayers = this.numPlayers;
    const currentInstance = this.matchDef.instances()[mctx.currentSubgameIdx]!;
    const resultFn = currentInstance.result;
    const winner = subctx.trial.winner;
    const ranking = subctx.trial.ranking;

    let matchState = mctx.state;
    for (let p = 1; p <= numPlayers; p++) {
      const current = matchState.score(p);
      let toAdd: number;
      if (resultFn != null && p === winner) {
        // @java result().eval(subcontext) — the just-finished instance's own
        // context, so (score Mover) reads the subgame's internal score.
        toAdd = resultFn.eval(subctx as never);
      } else if (numPlayers > 2) {
        toAdd = p === winner ? 1 : 0;
      } else if (numPlayers === 2) {
        // @java scoreToAdd = numPlayers - (int) ranking[p]; guard a missing
        // ranking (some TS instance games never set it) with winner parity.
        const rk = ranking[p];
        toAdd = rk !== undefined && rk > 0 ? numPlayers - rk : (p === winner ? 1 : 0);
      } else {
        toAdd = ranking[p] === 1 ? 1 : 0;
      }
      if (toAdd !== 0) matchState = matchState.withScore(p, current + toAdd);
    }

    const completedTrials = [...mctx.completedTrials(), subctx.trial];
    let matchTrial = mctx.trial.withMove(nextInstanceMove, false, -1);

    // @java end.eval(this) — match end rules evaluated at MATCH scope
    // ((matchScore P1) reads this context's own scores via isAMatch()).
    const endProbe = new MatchContext(
      this,
      matchState,
      matchTrial,
      subctx.rng,
      subctx,
      mctx.currentSubgameIdx,
      completedTrials,
    );
    const endResult = this.matchDef.endRules().eval(endProbe as never);
    if (endResult?.over) {
      matchTrial = new Trial([...matchTrial.moves], true, endResult.winner, {
        ranking: endResult.ranking ?? matchTrial.ranking,
      });
      return new MatchContext(
        this,
        matchState,
        matchTrial,
        subctx.rng,
        subctx,
        mctx.currentSubgameIdx,
        completedTrials,
      );
    }

    // @java advanceInstance(): next: resolves on the MATCH context; default
    // wraps to 0 past the last instance.
    const nextFn = currentInstance.nextInstance;
    const nextIdx = nextFn != null
      ? nextFn.eval(endProbe as never)
      : (mctx.currentSubgameIdx + 1 >= this.matchDef.instances().length
        ? 0
        : mctx.currentSubgameIdx + 1);

    const nextGame = this.instanceGame(nextIdx);
    // SAME rng object → continuous RNG stream across instances (@java
    // `subcontext = new Context(nextGame, nextTrial, rng, this)`).
    const nextSubctx = nextGame.start(subctx.rng);
    return new MatchContext(
      this,
      matchState,
      matchTrial,
      nextSubctx.rng,
      nextSubctx,
      nextIdx,
      completedTrials,
    );
  }

  /** @java Match — the match trial's own over flag. */
  public over(context: Context): boolean {
    return context.trial.over;
  }
}
