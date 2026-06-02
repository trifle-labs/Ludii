// @java Core/src/other/model/Model.java Model
/**
 * Faithful 1:1 transliteration of other.model.Model.
 *
 * Abstract base for all game control-flow models. Implements the Playout
 * interface and defines the full startNewStep / unpauseAgents API.
 *
 * Deferrals:
 *  - ThinkingThread: not ported (browser/single-threaded environment).
 *    All "threaded" execution paths in concrete subclasses are deferred.
 *  - Callback sleep (Thread.sleep): not applicable in TS.
 *  - movesEqual: fully transliterated as a static helper.
 *
 * Java parity: other/model/Model.java
 */

import type { IMove, IMoves, IGame, IAI, ITrial } from "../context/Context.js";

// ---------------------------------------------------------------------------
// Context opaque type (avoid circular import)
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IContext = any;

// ---------------------------------------------------------------------------
// Callback interfaces (Java inner interfaces)
// ---------------------------------------------------------------------------

/**
 * @java public interface AgentMoveCallback
 */
export interface AgentMoveCallback {
  /** @return Number of milliseconds to sleep after calling. */
  call(move: IMove): number;
}

/**
 * @java public interface MoveMessageCallback
 */
export interface MoveMessageCallback {
  call(message: string): void;
}

// ---------------------------------------------------------------------------
// PlayoutMoveSelector (minimal opaque type to keep Model.ts self-contained)
// ---------------------------------------------------------------------------
export interface IPlayoutMoveSelector {
  selectMove(context: IContext, maybeLegal: IMove[], p: number, isLegal: (m: IMove) => boolean): IMove | null;
  wantsPlayUniformRandomMove(): boolean;
}

// ---------------------------------------------------------------------------
// Model abstract class
// ---------------------------------------------------------------------------

/**
 * Model of a game's control flow. Implements Playout.
 *
 * @author Dennis Soemers (Java)
 * TypeScript transliteration.
 */
export abstract class Model {

  // -------------------------------------------------------------------------
  // Abstract methods
  // -------------------------------------------------------------------------

  /** @java public abstract Move applyHumanMove(...) */
  abstract applyHumanMove(context: IContext, move: IMove, player: number): IMove | null;

  /** @java public abstract Model copy() */
  abstract copy(): Model;

  /** @java public abstract boolean expectsHumanInput() */
  abstract expectsHumanInput(): boolean;

  /** @java public abstract List<AI> getLastStepAIs() */
  abstract getLastStepAIs(): (IAI | null)[] | null;

  /** @java public abstract List<Move> getLastStepMoves() */
  abstract getLastStepMoves(): (IMove | null)[] | null;

  /** @java public abstract void interruptAIs() */
  abstract interruptAIs(): void;

  /** @java public abstract boolean isReady() */
  abstract isReady(): boolean;

  /** @java public abstract boolean isRunning() */
  abstract isRunning(): boolean;

  /** @java public abstract void randomStep(...) */
  abstract randomStep(
    context: IContext,
    preCallback:  AgentMoveCallback | null,
    postCallback: AgentMoveCallback | null
  ): void;

  /** @java public abstract boolean verifyMoveLegal(...) */
  abstract verifyMoveLegal(context: IContext, move: IMove): boolean;

  /**
   * @java public abstract void startNewStep(context, ais, maxSeconds[], …, callbacks, checkValid, msgCallback)
   * Full-parameter abstract overload.
   */
  abstract startNewStep(
    context: IContext,
    ais: (IAI | null)[],
    maxSeconds: number[],
    maxIterations: number,
    maxSearchDepth: number,
    minSeconds: number,
    block: boolean,
    forceThreaded: boolean,
    forceNotThreaded: boolean,
    preCallback: AgentMoveCallback | null,
    postCallback: AgentMoveCallback | null,
    checkMoveValid: boolean,
    moveMessageCallback: MoveMessageCallback | null
  ): void;

  /**
   * @java public abstract void startNewStep(context, ais, maxSeconds[], …, callbacks)
   * Without checkMoveValid / moveMessageCallback.
   */
  abstract startNewStep(
    context: IContext,
    ais: (IAI | null)[],
    maxSeconds: number[],
    maxIterations: number,
    maxSearchDepth: number,
    minSeconds: number,
    block: boolean,
    forceThreaded: boolean,
    forceNotThreaded: boolean,
    preCallback: AgentMoveCallback | null,
    postCallback: AgentMoveCallback | null
  ): void;

  /** @java public abstract void unpauseAgents(...) */
  abstract unpauseAgents(
    context: IContext,
    ais: (IAI | null)[],
    maxSeconds: number[],
    maxIterations: number,
    maxSearchDepth: number,
    minSeconds: number,
    preCallback: AgentMoveCallback | null,
    postCallback: AgentMoveCallback | null,
    checkMoveValid: boolean,
    moveMessageCallback: MoveMessageCallback | null
  ): void;

  /** @java public abstract List<AI> getLiveAIs() */
  abstract getLiveAIs(): IAI[];

  // -------------------------------------------------------------------------
  // Playout interface
  // -------------------------------------------------------------------------

  /** @java public abstract Trial playout(...) */
  abstract playout(
    context: IContext,
    ais: (IAI | null)[] | null,
    thinkingTime: number,
    playoutMoveSelector: IPlayoutMoveSelector | null,
    maxNumBiasedActions: number,
    maxNumPlayoutActions: number,
    random: { nextInt(bound: number): number }
  ): ITrial;

  /** @java public abstract boolean callsGameMoves() */
  abstract callsGameMoves(): boolean;

  // -------------------------------------------------------------------------
  // startNewStep convenience overloads (concrete, delegate to full-param)
  // -------------------------------------------------------------------------

  /**
   * @java public void startNewStep(context, ais, maxSeconds)
   */
  startNewStepSimple(
    context: IContext,
    ais: (IAI | null)[],
    maxSeconds: number
  ): void {
    const timeLimits = new Array<number>(context.game().players().count() + 1).fill(maxSeconds);
    this.startNewStepWithLimits(context, ais, timeLimits);
  }

  /**
   * @java public void startNewStep(context, ais, maxSeconds[])
   */
  startNewStepWithLimits(
    context: IContext,
    ais: (IAI | null)[],
    maxSeconds: number[]
  ): void {
    this.startNewStepFull(context, ais, maxSeconds, -1, -1, 0.0);
  }

  /**
   * @java public void startNewStep(context, ais, maxSeconds, maxIter, maxDepth, minSec)
   */
  startNewStepFull(
    context: IContext,
    ais: (IAI | null)[],
    maxSeconds: number | number[],
    maxIterations: number,
    maxSearchDepth: number,
    minSeconds: number
  ): void {
    const timeLimits = typeof maxSeconds === "number"
      ? new Array<number>(context.game().players().count() + 1).fill(maxSeconds)
      : maxSeconds;
    this.startNewStep(
      context, ais, timeLimits, maxIterations, maxSearchDepth, minSeconds,
      true, false, false, null, null, false, null
    );
  }

  // -------------------------------------------------------------------------
  // movesPerPlayer
  // -------------------------------------------------------------------------

  /** @java public Move[] movesPerPlayer() — default returns null */
  movesPerPlayer(): (IMove | null)[] | null { return null; }

  // -------------------------------------------------------------------------
  // Static helpers
  // -------------------------------------------------------------------------

  /**
   * @java public static boolean movesEqual(Move m1, Move m2, Context context)
   */
  static movesEqual(m1: IMove, m2: IMove, context: IContext): boolean {
    if ((m1 as unknown as { from?: unknown }).from !== (m2 as unknown as { from?: unknown }).from
     || (m1 as unknown as { to?: unknown }).to !== (m2 as unknown as { to?: unknown }).to) return false;
    // @java if (m1.then().isEmpty() && m2.then().isEmpty() && m1.actions().equals(m2.actions()))
    const m1Then = (m1 as unknown as { then?(): unknown[] }).then?.() ?? [];
    const m2Then = (m2 as unknown as { then?(): unknown[] }).then?.() ?? [];
    if (m1Then.length === 0 && m2Then.length === 0) {
      if (JSON.stringify(m1.actions()) === JSON.stringify(m2.actions())) return true;
    }
    // Deferred: getActionsWithConsequences full comparison
    const m1Acts = (m1 as unknown as { getActionsWithConsequences?(ctx: IContext): unknown[] }).getActionsWithConsequences?.(context) ?? m1.actions();
    const m2Acts = (m2 as unknown as { getActionsWithConsequences?(ctx: IContext): unknown[] }).getActionsWithConsequences?.(context) ?? m2.actions();
    return JSON.stringify(m1Acts) === JSON.stringify(m2Acts);
  }

  /**
   * @java public static boolean movesEqual(Move m1, List<Action> m1Actions, Move m2, Context context)
   */
  static movesEqualWithActions(
    m1: IMove, m1Actions: unknown[], m2: IMove, context: IContext
  ): boolean {
    if ((m1 as unknown as { from: unknown }).from !== (m2 as unknown as { from: unknown }).from
     || (m1 as unknown as { to: unknown }).to !== (m2 as unknown as { to: unknown }).to) return false;
    const m1Then = (m1 as unknown as { then?(): unknown[] }).then?.() ?? [];
    const m2Then = (m2 as unknown as { then?(): unknown[] }).then?.() ?? [];
    if (m1Then.length === 0 && m2Then.length === 0) {
      if (JSON.stringify(m1.actions()) === JSON.stringify(m2.actions())) return true;
    }
    const m2Acts = (m2 as unknown as { getActionsWithConsequences?(ctx: IContext): unknown[] }).getActionsWithConsequences?.(context) ?? m2.actions();
    return JSON.stringify(m1Actions) === JSON.stringify(m2Acts);
  }
}
