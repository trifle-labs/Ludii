// @java Evaluation/src/experiments/strategicDimension/FutureTrialMC.java

/**
 * Thread for running MC version of SD trial.
 *
 * @java experiments/strategicDimension/FutureTrialMC.java
 * @author cambolbro
 */

// ---------------------------------------------------------------------------
// Minimal opaque interfaces for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java game.Game — opaque surface used by FutureTrialMC */
type Game = unknown;

/** @java other.context.Context — opaque surface used by FutureTrialMC */
type Context = unknown;

/** @java other.trial.Trial — opaque surface used by FutureTrialMC */
type Trial = unknown;

/** @java other.move.Move — opaque */
type Move = unknown;

/** @java other.AI — opaque surface used by FutureTrialMC */
type AI = unknown;

// ---------------------------------------------------------------------------
// Typed accessor interfaces for duck-typed usage of opaque types
// ---------------------------------------------------------------------------

/** Typed view of Game used inside runTrial */
interface IGame {
  players(): { count(): number };
  start(context: IContext): void;
  apply(context: IContext, move: Move): void;
}

/** Typed view of Context used inside runTrial */
interface IContext {
  trial(): ITrial;
  state(): { mover(): number };
}

/** Typed view of Trial used inside runTrial */
interface ITrial {
  over(): boolean;
  status(): IStatus | null;
}

/** @java main.Status — typed surface for winner() */
interface IStatus {
  winner(): number;
}

/** @java other.AI — typed surface for AI agents */
interface IAI {
  initAI(game: IGame, playerID: number): void;
  selectAction(
    game: IGame,
    context: IContext,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number,
  ): Move;
}

// ---------------------------------------------------------------------------
// FutureTrial interface (sibling in same package — not separately ported)
// ---------------------------------------------------------------------------

/**
 * Future trial for concurrent SD trials.
 *
 * @java experiments/strategicDimension/FutureTrial.java
 */
export interface FutureTrial {
  /**
   * @param game    The single game object, shared across threads.
   * @param trialId The index of this trial within its epoch.
   * @param lower   Lower iteration count for the inferior agent.
   * @param upper   Upper iteration count for the superior agent.
   * @return Result of trial relative to superior agent (0=loss, 0.5=draw, 1=win).
   *
   * @java FutureTrial.runTrial(Game, int, int, int)
   */
  runTrial(game: Game, trialId: number, lower: number, upper: number): Promise<number>;
}

// ---------------------------------------------------------------------------
// Injectable factories for not-yet-ported constructors and MCTS factory
// ---------------------------------------------------------------------------

/**
 * Injectable factory for creating Trial instances.
 * DEFERRED: Trial(Game) constructor — inject before calling runTrial().
 *
 * @java new Trial(game)
 */
export type TrialFactory = (game: IGame) => ITrial;

/**
 * Injectable factory for creating Context instances.
 * DEFERRED: Context(Game, Trial) constructor — inject before calling runTrial().
 *
 * @java new Context(game, trial)
 */
export type ContextFactory = (game: IGame, trial: ITrial) => IContext;

/**
 * Injectable factory for copying Context instances.
 * DEFERRED: new Context(context) copy-constructor — inject before calling runTrial().
 *
 * @java new Context(context)
 */
export type ContextCopyFactory = (context: IContext) => IContext;

/**
 * Injectable factory for creating MCTS UCT agents.
 * DEFERRED: MCTS.createUCT() — inject before calling runTrial().
 *
 * @java search.mcts.MCTS.createUCT()
 */
export type MCTSFactory = () => IAI;

// ---------------------------------------------------------------------------
// FutureTrialMC
// ---------------------------------------------------------------------------

/**
 * Thread for running MC version of SD trial.
 *
 * Java parity: implements FutureTrial.
 *
 * Note: Java uses ExecutorService / Future<Double>; in TypeScript we use
 * Promise<number> (the closest structural equivalent for an async future
 * returning a Double).
 *
 * Deferred constructors / factories must be injected via static fields before
 * calling runTrial(). See TrialFactory, ContextFactory, ContextCopyFactory,
 * and MCTSFactory.
 *
 * @java experiments/strategicDimension/FutureTrialMC.java
 */
export class FutureTrialMC implements FutureTrial {

  // -------------------------------------------------------------------------
  // Injectable static factories for deferred dependencies
  // -------------------------------------------------------------------------

  /**
   * Injectable factory for MCTS UCT agents.
   * DEFERRED: replace once AI/src/search/mcts/MCTS.ts is ported.
   *
   * @java MCTS.createUCT()
   */
  public static mctsFactory: MCTSFactory = (): IAI => {
    throw new Error(
      "FutureTrialMC: MCTS.createUCT() is not yet ported. " +
      "Inject FutureTrialMC.mctsFactory before calling runTrial()."
    );
  };

  /**
   * Injectable factory for Trial instances.
   * DEFERRED: replace with real Trial constructor once available.
   *
   * @java new Trial(game)
   */
  public static trialFactory: TrialFactory = (_game: IGame): ITrial => {
    throw new Error(
      "FutureTrialMC: Trial(Game) constructor not injected. " +
      "Inject FutureTrialMC.trialFactory before calling runTrial()."
    );
  };

  /**
   * Injectable factory for Context instances.
   * DEFERRED: replace with real Context constructor once available.
   *
   * @java new Context(game, trial)
   */
  public static contextFactory: ContextFactory = (_game: IGame, _trial: ITrial): IContext => {
    throw new Error(
      "FutureTrialMC: Context(Game, Trial) constructor not injected. " +
      "Inject FutureTrialMC.contextFactory before calling runTrial()."
    );
  };

  /**
   * Injectable factory for Context copy constructor.
   * DEFERRED: replace with real Context copy constructor once available.
   *
   * @java new Context(context)
   */
  public static contextCopyFactory: ContextCopyFactory = (_context: IContext): IContext => {
    throw new Error(
      "FutureTrialMC: Context(Context) copy constructor not injected. " +
      "Inject FutureTrialMC.contextCopyFactory before calling runTrial()."
    );
  };

  // -------------------------------------------------------------------------

  /**
   * Java uses an ExecutorService to submit tasks asynchronously.
   * In TypeScript we have no thread pool, so runTrial() returns a Promise
   * that resolves as a microtask (faithful to the Future<Double> contract).
   *
   * @java private ExecutorService executor = Executors.newSingleThreadExecutor()
   */
  // No executor field needed in TS — Promise<number> is the equivalent.

  // -------------------------------------------------------------------------

  /**
   * Run a single MC trial of the Strategic-Dimension experiment.
   *
   * @param game    The single game object, shared across threads.
   * @param trialId The index of this trial within its epoch.
   * @param lower   Lower iteration count for the inferior agent.
   * @param upper   Upper iteration count for the superior agent.
   * @return Promise resolving to: 0=loss, 0.5=draw, 1=win (relative to superior agent).
   *
   * @java FutureTrialMC.runTrial(Game, int, int, int)
   */
  public runTrial(
    game: Game,
    trialId: number,
    lower: number,
    upper: number,
  ): Promise<number> {
    // Java: return executor.submit(() -> { ... });
    // TypeScript: return a Promise equivalent.
    return new Promise<number>((resolve) => {
      // Begin: lambda body submitted to the Java executor.

      //System.out.println("Submitted id=" + id + ", lower=" + lower + ", upper=" + upper + ".");

      const g = game as unknown as IGame;

      const numPlayers: number = g.players().count();

      // alternate between P1 and P2
      const pidHigher: number = 1 + trialId % 2;

      // @java final Trial trial = new Trial(game);
      const trial: ITrial = FutureTrialMC.trialFactory(g);

      // @java final Context context = new Context(game, trial);
      const context: IContext = FutureTrialMC.contextFactory(g, trial);

      g.start(context);

      // Set up AIs
      // @java final List<AI> agents = new ArrayList<AI>();
      // @java agents.add(null);  // null player 0
      const agents: Array<IAI | null> = [null];

      for (let pid = 1; pid < numPlayers + 1; pid++) {
        const ai: IAI = FutureTrialMC.mctsFactory();
        ai.initAI(g, pid);
        agents.push(ai);
      }

      while (!context.trial().over()) {
        const mover: number = context.state().mover();
        const agent: IAI | null = agents[mover] ?? null;

        if (agent === null) break; // safety guard

        const move: Move = agent.selectAction(
          g,
          // @java new Context(context) — copy constructor
          FutureTrialMC.contextCopyFactory(context),
          -1,
          mover === pidHigher ? upper : lower,
          -1,
        );
        g.apply(context, move);

        //if (trial.numberOfTurns() % 10 == 0)
        //  System.out.print(".");
      }
      //System.out.println(trialId + ": " + context.trial().status() + " (P" + pidHigher + " is superior).");

      const status: IStatus | null = context.trial().status();

      // @java System.out.print(status.winner());
      if (status !== null) {
        process.stdout.write(String(status.winner()));
      }

      if (status === null || status.winner() === 0) {
        // is a draw
        resolve(0.5);
      } else if (status.winner() === pidHigher) {
        // higher iteration count wins
        resolve(1.0);
      } else {
        resolve(0.0);
      }
      // End: lambda body.
    });
  }
}
