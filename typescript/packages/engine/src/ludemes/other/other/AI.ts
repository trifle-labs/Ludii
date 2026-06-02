// @java Core/src/other/AI.java AI
/**
 * Faithful 1:1 transliteration of other.AI.
 *
 * Java parity: other/AI.java
 *
 * Base abstract class for AI agents. Subclasses must implement selectAction().
 * All other methods have concrete default implementations matching the Java source.
 *
 * Deferrals:
 *  - WeakReference<Game>: replaced by a nullable reference + a "start count"
 *    integer; weak-reference semantics are not needed in TS.
 *  - Heuristics: represented as an opaque interface.
 *  - FVector / FastArrayList<Move>: represented as number[] / Move[] arrays.
 *  - Context: represented as a minimal opaque interface matching the surface
 *    used here (game(), mover(), etc. are not called directly in AI.ts).
 *  - Game: represented as a minimal opaque interface.
 *  - Context.copyWithSeed(): deferred — throws if used.
 *
 * @author Dennis Soemers and cambolbro (Java)
 * TypeScript transliteration.
 */

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for absent subsystems
// ---------------------------------------------------------------------------

/** Minimal surface of game.Game used by AI. */
export interface IGame {
  /** @java game.Game#gameStartCount() */
  gameStartCount(): number;
  // Surface intentionally minimal for self-containedness.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/** Minimal surface of other.context.Context used by AI. */
export interface IContext {
  // Surface intentionally minimal.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/** Minimal surface of other.move.Move. */
export interface IMove {
  // Surface intentionally minimal.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/** @java metadata.ai.heuristics.Heuristics — opaque */
export type Heuristics = unknown;

// ---------------------------------------------------------------------------
// ContextCopyInterface (Java inner interface)
// ---------------------------------------------------------------------------

/**
 * Interface for a functor that can create copies of Context objects.
 *
 * @java public interface AI.ContextCopyInterface
 */
export interface ContextCopyInterface {
  /** @java public Context copy(final Context context) */
  copy(context: IContext): IContext;
}

// ---------------------------------------------------------------------------
// Static standard context-copy functors (mirrors Java statics)
// ---------------------------------------------------------------------------

/**
 * Functor that creates normal copies of context for normal use.
 * @java public static final ContextCopyInterface STANDARD_CONTEXT_COPY
 */
export const STANDARD_CONTEXT_COPY: ContextCopyInterface = {
  copy(context: IContext): IContext {
    // In Java: new Context(context) — copy constructor.
    // Deferred: Context copy constructor lives in the context module.
    // Structural behaviour: return a shallow clone.
    return Object.assign(Object.create(Object.getPrototypeOf(context) as object) as IContext, context);
  },
};

/**
 * Functor that creates copies of contexts including seed copying, for RNG cheats.
 * @java public static final ContextCopyInterface RNG_CHEAT_COPY
 */
export const RNG_CHEAT_COPY: ContextCopyInterface = {
  copy(context: IContext): IContext {
    // In Java: Context.copyWithSeed(context).
    // DEFERRED: requires Context.copyWithSeed() static method.
    throw new Error(
      "AI.RNG_CHEAT_COPY: Context.copyWithSeed is deferred – requires Context subsystem"
    );
    // eslint-disable-next-line no-unreachable
    return context;
  },
};

// ---------------------------------------------------------------------------
// AIVisualisationData (Java static inner class)
// ---------------------------------------------------------------------------

/**
 * Wrapper for data that AIs can return to facilitate visualisations of their
 * thinking processes in the Ludii app.
 *
 * @java public static class AI.AIVisualisationData
 */
export class AIVisualisationData {

  // @java private final FVector searchEffort;
  private readonly _searchEffort: number[];

  // @java private final FVector valueEstimates;
  private readonly _valueEstimates: number[];

  // @java private final FastArrayList<Move> moves;
  private readonly _moves: IMove[];

  /**
   * @java public AIVisualisationData(FVector searchEffort, FVector valueEstimates, FastArrayList<Move> moves)
   */
  constructor(searchEffort: number[], valueEstimates: number[], moves: IMove[]) {
    this._searchEffort   = searchEffort;
    this._valueEstimates = valueEstimates;
    this._moves          = moves;
  }

  /**
   * @return Vector of "search effort" values.
   * @java public FVector searchEffort()
   */
  searchEffort(): number[] { return this._searchEffort; }

  /**
   * @return Vector of value estimates for moves.
   * @java public FVector valueEstimates()
   */
  valueEstimates(): number[] { return this._valueEstimates; }

  /**
   * @return List of moves.
   * @java public FastArrayList<Move> moves()
   */
  moves(): IMove[] { return this._moves; }
}

// ---------------------------------------------------------------------------
// AI abstract class
// ---------------------------------------------------------------------------

/**
 * Base abstract class for AI agents.
 *
 * @author Dennis Soemers and cambolbro (Java)
 * TypeScript transliteration.
 */
export abstract class AI {

  // @java protected Heuristics heuristicFunction = null;
  protected heuristicFunction: Heuristics = null;

  // @java protected String friendlyName = "Unnamed";
  protected friendlyName: string = "Unnamed";

  // @java protected volatile boolean wantsInterrupt = false;
  protected wantsInterrupt: boolean = false;

  // @java private WeakReference<Game> lastInitGame = new WeakReference<>(null);
  private _lastInitGame: IGame | null = null;

  // @java private int lastInitGameStartCount = -1;
  private _lastInitGameStartCount: number = -1;

  // @java protected boolean wantsCheatRNG = false;
  protected wantsCheatRNG: boolean = false;

  // @java protected ContextCopyInterface contextCopyer = STANDARD_CONTEXT_COPY;
  protected contextCopyer: ContextCopyInterface = STANDARD_CONTEXT_COPY;

  // @java protected double maxSecondsPerMove = 1.0;
  protected maxSecondsPerMove: number = 1.0;

  // @java protected int maxIterationsPerMove = -1;
  protected maxIterationsPerMove: number = -1;

  // @java protected int maxSearchDepthPerMove = -1;
  protected maxSearchDepthPerMove: number = -1;

  // @java protected double leniency = 0;
  protected leniency: number = 0;

  // -------------------------------------------------------------------------
  // Getters and setters
  // -------------------------------------------------------------------------

  /**
   * @return Leniency factor in range 0..1.
   * @java public double leniency()
   */
  getLeniency(): number { return this.leniency; }

  /**
   * @java public void setLeniency(final double amount)
   */
  setLeniency(amount: number): void { this.leniency = amount; }

  /**
   * @return Thinking time limit per move.
   * @java public double maxSecondsPerMove()
   */
  getMaxSecondsPerMove(): number { return this.maxSecondsPerMove; }

  /**
   * @java public void setMaxSecondsPerMove(final double newLimit)
   */
  setMaxSecondsPerMove(newLimit: number): void { this.maxSecondsPerMove = newLimit; }

  /**
   * @return Iteration count limit per move.
   * @java protected int maxIterationsPerMove()
   */
  protected getMaxIterationsPerMove(): number { return this.maxIterationsPerMove; }

  /**
   * @java public void setMaxIterationsPerMove(final int newLimit)
   */
  setMaxIterationsPerMove(newLimit: number): void { this.maxIterationsPerMove = newLimit; }

  /**
   * @return Search depth limit per move.
   * @java protected int maxSearchDepthPerMove()
   */
  protected getMaxSearchDepthPerMove(): number { return this.maxSearchDepthPerMove; }

  /**
   * @java public void setMaxSearchDepthPerMove(final int newLimit)
   */
  setMaxSearchDepthPerMove(newLimit: number): void { this.maxSearchDepthPerMove = newLimit; }

  /**
   * @return The friendly name.
   * @java public String friendlyName()
   */
  getFriendlyName(): string { return this.friendlyName; }

  /**
   * @java public void setFriendlyName(final String fname)
   */
  setFriendlyName(fname: string): void { this.friendlyName = fname; }

  /**
   * Set heuristics used by MCTS.
   * @java public void setHeuristics(final Heuristics heuristics)
   */
  setHeuristics(heuristics: Heuristics): void { this.heuristicFunction = heuristics; }

  // -------------------------------------------------------------------------
  // Core abstract method
  // -------------------------------------------------------------------------

  /**
   * Select and return the preferred action to play.
   *
   * @param game         Reference to the game.
   * @param context      Copy of the context containing the current state.
   * @param maxSeconds   Max thinking seconds (negative = no limit).
   * @param maxIterations Max iterations (negative = no limit).
   * @param maxDepth     Max search depth (negative = no limit).
   * @return Preferred move.
   *
   * @java public abstract Move selectAction(Game game, Context context, double maxSeconds, int maxIterations, int maxDepth)
   */
  abstract selectAction(
    game: IGame,
    context: IContext,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number,
  ): IMove;

  // -------------------------------------------------------------------------
  // Concrete public methods
  // -------------------------------------------------------------------------

  /**
   * Select action using the AI's own stored limits.
   * @java public Move selectAction(final Game game, final Context context)
   */
  selectActionWithDefaults(game: IGame, context: IContext): IMove {
    return this.selectAction(
      game,
      context,
      this.maxSecondsPerMove,
      this.maxIterationsPerMove,
      this.maxSearchDepthPerMove,
    );
  }

  /**
   * Create a copy of the given context. Delegates to the contextCopyer functor.
   * IMPORTANT: marked final in Java to prevent more cheating.
   *
   * @java public final Context copyContext(final Context other)
   */
  copyContext(other: IContext): IContext {
    return this.contextCopyer.copy(other);
  }

  /**
   * @return Human-friendly name for this AI.
   * @java public String name()
   */
  name(): string { return this.friendlyName; }

  /**
   * Perform any desired initialisation before playing a game.
   * Default: do nothing.
   *
   * @java public void initAI(final Game game, final int playerID)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initAI(_game: IGame, _playerID: number): void {
    // Do nothing by default
  }

  /**
   * Called when Ludii is likely done with this AI. Free resources if desired.
   * Default: do nothing.
   *
   * @java public void closeAI()
   */
  closeAI(): void {
    // Do nothing by default
  }

  /**
   * Indicate whether this AI can support a given game. Default: supports any game.
   *
   * @java public boolean supportsGame(final Game game)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  supportsGame(_game: IGame): boolean {
    return true;
  }

  /**
   * General value estimate in [-1, 1] for visualisation purposes.
   * Default: 0.0.
   *
   * @java public double estimateValue()
   */
  estimateValue(): number {
    return 0.0;
  }

  /**
   * String to print in the Analysis tab after making a move.
   * Default: null (nothing printed).
   *
   * @java public String generateAnalysisReport()
   */
  generateAnalysisReport(): string | null {
    return null;
  }

  /**
   * Data for visualisation of the AI's thinking process.
   * Default: null (no visualisations).
   *
   * @java public AIVisualisationData aiVisualisationData()
   */
  aiVisualisationData(): AIVisualisationData | null {
    return null;
  }

  // -------------------------------------------------------------------------
  // Interrupt / cheat flags
  // -------------------------------------------------------------------------

  /**
   * @java public void setWantsInterrupt(final boolean val)
   */
  setWantsInterrupt(val: boolean): void { this.wantsInterrupt = val; }

  /**
   * Set whether this AI wants to cheat with perfect RNG knowledge.
   * Automatically switches contextCopyer.
   *
   * @java public void setWantsCheatRNG(final boolean wantsCheat)
   */
  setWantsCheatRNG(wantsCheat: boolean): void {
    this.wantsCheatRNG = wantsCheat;
    this.contextCopyer = wantsCheat ? RNG_CHEAT_COPY : STANDARD_CONTEXT_COPY;
  }

  /**
   * @return Does this AI want to cheat with perfect RNG knowledge?
   * @java public boolean wantsCheatRNG()
   */
  getWantsCheatRNG(): boolean { return this.wantsCheatRNG; }

  /**
   * @return Does this AI use spatial state-action features?
   * Default: false.
   *
   * @java public boolean usesFeatures(final Game game)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  usesFeatures(_game: IGame): boolean {
    return false;
  }

  // -------------------------------------------------------------------------
  // initIfNeeded
  // -------------------------------------------------------------------------

  /**
   * Calls initAI() only if needed (game or start-count has changed).
   * Marked final in Java.
   *
   * @java public final void initIfNeeded(final Game game, final int playerID)
   */
  initIfNeeded(game: IGame, playerID: number): void {
    if (
      this._lastInitGame !== null &&
      this._lastInitGame === game &&
      this._lastInitGame.gameStartCount() === this._lastInitGameStartCount
    ) {
      // No need to re-init
      return;
    }

    this.initAI(game, playerID);
    // @java lastInitGame = new WeakReference<>(game);
    this._lastInitGame = game;
    // @java lastInitGameStartCount = game.gameStartCount();
    this._lastInitGameStartCount = game.gameStartCount();
  }

  // -------------------------------------------------------------------------
}
