// @java Core/src/other/ThinkingThread.java ThinkingThread
/**
 * Faithful 1:1 transliteration of other.ThinkingThread.
 *
 * THREADING NOTE: Java's ThinkingThread extends java.lang.Thread and runs AI
 * move selection in a background thread.  TypeScript is single-threaded; there
 * is no true thread abstraction here.  The class structure, all fields, and all
 * method names are preserved faithfully.  The `run()` method is retained as a
 * synchronous function that executes the same control-flow as the Java body
 * (call ai.selectAction, enforce minSeconds via a busy-wait/sleep stub, then
 * invoke postThinking).  Callers that need true background execution should wrap
 * `run()` in a Worker or equivalent; this file does not do so in order to avoid
 * inventing behaviour not present in the Java source.
 *
 * Deferrals:
 *  - Thread.sleep(): replaced by a no-op comment; real async sleep would require
 *    the caller to await `runAsync()` — see runAsync() below.
 *  - InterruptedException: not applicable; interrupt is handled via the
 *    `wantsInterrupt` flag on AI.
 *
 * @author Dennis Soemers (Java original)
 * @java other.ThinkingThread
 */

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for types that live in other engine modules.
// ---------------------------------------------------------------------------

/** Minimal surface of game.Game */
export type IGame = unknown;

/** Minimal surface of other.context.Context */
export type IContext = unknown;

/** Minimal surface of other.move.Move */
export type IMove = unknown;

/** Minimal surface of other.AI */
export interface IAI {
  setWantsInterrupt(wants: boolean): void;
  selectAction(
    game: IGame,
    context: IContext,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): IMove;
  copyContext(context: IContext): IContext;
}

// ---------------------------------------------------------------------------
// ThinkingThreadRunnable (private inner class in Java)
// ---------------------------------------------------------------------------

/**
 * Runnable class for ThinkingThread.
 *
 * @java other.ThinkingThread.ThinkingThreadRunnable
 */
class ThinkingThreadRunnable {
  // ------------------------------------------------------------------

  /** AI @java ThinkingThreadRunnable#ai */
  readonly ai: IAI;

  /** Game @java ThinkingThreadRunnable#game */
  readonly game: IGame;

  /** Context/state in which to think @java ThinkingThreadRunnable#context */
  readonly context: IContext;

  /** Max seconds @java ThinkingThreadRunnable#maxSeconds */
  readonly maxSeconds: number;

  /** Max iterations @java ThinkingThreadRunnable#maxIterations */
  readonly maxIterations: number;

  /** Max search depth @java ThinkingThreadRunnable#maxDepth */
  readonly maxDepth: number;

  /** Minimum number of seconds we should spend thinking @java ThinkingThreadRunnable#minSeconds */
  readonly minSeconds: number;

  /** Runnable to run when we've finished thinking @java ThinkingThreadRunnable#postThinking */
  postThinking: (() => void) | null;

  /** The move chosen by AI @java ThinkingThreadRunnable#chosenMove */
  chosenMove: IMove | null = null;

  // ------------------------------------------------------------------

  /**
   * @param ai
   * @param game
   * @param context
   * @param maxSeconds
   * @param maxIterations
   * @param maxDepth
   * @param minSeconds
   * @param postThinking
   * @java ThinkingThreadRunnable constructor
   */
  constructor(
    ai: IAI,
    game: IGame,
    context: IContext,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number,
    minSeconds: number,
    postThinking: (() => void) | null
  ) {
    this.ai = ai;
    this.game = game;
    this.context = context;
    this.maxSeconds = maxSeconds;
    this.maxIterations = maxIterations;
    this.maxDepth = maxDepth;
    this.minSeconds = minSeconds;
    this.postThinking = postThinking;
  }

  // ------------------------------------------------------------------

  /**
   * Synchronous port of Runnable.run().
   *
   * NOTE: The Java body calls Thread.sleep() when the AI returns faster than
   * minSeconds.  In this synchronous TS port that sleep is a no-op comment.
   * Use runAsync() if you need the async variant.
   *
   * @java ThinkingThreadRunnable#run
   */
  run(): void {
    const startTime = Date.now(); // mirrors System.currentTimeMillis()

    this.chosenMove = this.ai.selectAction(
      this.game,
      this.ai.copyContext(this.context),
      this.maxSeconds,
      this.maxIterations,
      this.maxDepth
    );

    // Make sure we don't play too fast.
    // Java: Thread.sleep((long)(startTime + 1000L * minSeconds) - System.currentTimeMillis())
    // In synchronous TS we cannot sleep without blocking the event loop;
    // real sleep is only available in runAsync() below.
    const targetTime = startTime + 1000 * this.minSeconds;
    if (Date.now() < targetTime) {
      // NOTE: synchronous busy-wait intentionally omitted (no Thread.sleep in TS).
      // Callers that require the minimum-think-time guarantee should use runAsync().
    }

    if (this.postThinking !== null) {
      this.postThinking();
    }
  }

  /**
   * Async variant of run() that honours minSeconds via a real Promise-based
   * sleep.  Not present in the Java source but needed for TS single-threaded use.
   */
  async runAsync(): Promise<void> {
    const startTime = Date.now();

    this.chosenMove = this.ai.selectAction(
      this.game,
      this.ai.copyContext(this.context),
      this.maxSeconds,
      this.maxIterations,
      this.maxDepth
    );

    const targetTime = startTime + 1000 * this.minSeconds;
    const remaining = targetTime - Date.now();
    if (remaining > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, remaining));
    }

    if (this.postThinking !== null) {
      this.postThinking();
    }
  }
}

// ---------------------------------------------------------------------------
// ThinkingThread
// ---------------------------------------------------------------------------

/**
 * Faithful 1:1 transliteration of other.ThinkingThread.
 *
 * In Java this extends Thread.  In TS the thread is represented as a stored
 * ThinkingThreadRunnable whose run() / runAsync() the caller invokes.
 *
 * @java other.ThinkingThread
 */
export class ThinkingThread {
  // -------------------------------------------------------------------------

  /** Our runnable @java ThinkingThread#runnable */
  protected readonly runnable: ThinkingThreadRunnable;

  // -------------------------------------------------------------------------

  /**
   * @param ai
   * @param game
   * @param context
   * @param maxSeconds
   * @param maxIterations
   * @param maxDepth
   * @param minSeconds
   * @param postThinking
   * @returns Constructs a thread for AI to think in
   * @java ThinkingThread#construct
   */
  static construct(
    ai: IAI,
    game: IGame,
    context: IContext,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number,
    minSeconds: number,
    postThinking: (() => void) | null
  ): ThinkingThread {
    const runnable = new ThinkingThreadRunnable(
      ai,
      game,
      context,
      maxSeconds,
      maxIterations,
      maxDepth,
      minSeconds,
      postThinking
    );
    return new ThinkingThread(runnable);
  }

  /**
   * Constructor
   * @param runnable
   * @java ThinkingThread(ThinkingThreadRunnable)
   */
  protected constructor(runnable: ThinkingThreadRunnable) {
    // Java: super(runnable) — passes runnable to Thread; no equivalent in TS.
    this.runnable = runnable;
  }

  // -------------------------------------------------------------------------

  /**
   * @returns Our AI object
   * @java ThinkingThread#ai
   */
  ai(): IAI {
    return this.runnable.ai;
  }

  /**
   * @returns The chosen move (or null if not chosen a move yet)
   * @java ThinkingThread#move
   */
  move(): IMove | null {
    return this.runnable.chosenMove;
  }

  /**
   * Tells the AI to interrupt its thinking process.
   * @returns Reference to our AI
   * @java ThinkingThread#interruptAI
   */
  interruptAI(): IAI {
    this.runnable.postThinking = null; // should not call the callback if we're interrupting
    this.runnable.ai.setWantsInterrupt(true);
    return this.runnable.ai;
  }

  // -------------------------------------------------------------------------
}
