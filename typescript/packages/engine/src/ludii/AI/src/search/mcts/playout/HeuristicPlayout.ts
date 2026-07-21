// @java AI/src/search/mcts/playout/HeuristicPlayout.java

import type { Context, Game, MCTS, PlayoutStrategy, Trial } from "./PlayoutStrategy.js";

// Escape-hatch types for not-yet-ported dependencies

/** @java metadata.ai.heuristics.Heuristics */
interface Heuristics {
  init(game: unknown): void;
  computeValue(context: unknown, player: number, threshold: number): number;
}

/** @java metadata.ai.heuristics.Heuristics (static) */
interface HeuristicsStatic {
  copy(h: Heuristics): Heuristics;
}
const Heuristics = {} as HeuristicsStatic;

/** @java other.playout.HeuristicMoveSelector */
interface HeuristicMoveSelector {
  heuristicValueFunction(): Heuristics | null;
  setHeuristics(h: Heuristics): void;
}

/** @java other.move.Move */
interface Move {
  mover(): number;
}

//-------------------------------------------------------------------------

/**
 * Playout strategy that selects actions that lead to successor states that
 * maximise a heuristic score from the mover's perspective.
 *
 * We extend the AI abstract class because this means that the outer MCTS
 * will also let us init, which allows us to load heuristics from metadata
 * if desired. Also means this thing can play games as a standalone AI.
 *
 * @java search.mcts.playout.HeuristicPlayout
 * @author Dennis Soemers
 */
export class HeuristicPlayout implements PlayoutStrategy {

  //-------------------------------------------------------------------------

  /**
   * Auto-end playouts in a draw if they take more turns than this, Negative value means
   * no limit.
   *
   * @java HeuristicPlayout.playoutTurnLimit
   */
  protected playoutTurnLimit: number = -1;

  /**
   * Filepath from which we want to load heuristics. Null if we want to load automatically from game's metadata
   *
   * @java HeuristicPlayout.heuristicsFilepath
   */
  protected readonly heuristicsFilepath: string | null;

  /**
   * Heuristic-based PlayoutMoveSelector
   *
   * @java HeuristicPlayout.moveSelector
   */
  protected moveSelector: HeuristicMoveSelector = {
    heuristicValueFunction: () => null,
    setHeuristics: (_h: Heuristics) => { /* stub */ },
  } as unknown as HeuristicMoveSelector;

  //-------------------------------------------------------------------------

  /**
   * Default constructor: no cap on actions in playout, heuristics from metadata
   * @java HeuristicPlayout()
   */
  public constructor();

  /**
   * Constructor
   * @param heuristicsFilepath Filepath for file specifying heuristics to use
   * @java HeuristicPlayout(String)
   */
  public constructor(heuristicsFilepath: string);

  public constructor(heuristicsFilepath?: string) {
    this.playoutTurnLimit = -1; // No limit
    this.heuristicsFilepath = heuristicsFilepath ?? null;
  }

  //-------------------------------------------------------------------------

  /** @java HeuristicPlayout.runPlayout(MCTS, Context) */
  public runPlayout(mcts: MCTS, context: Context): Trial {
    void mcts;
    return (context as unknown as {
      game(): {
        playout(
          context: Context,
          agents: null,
          thinkTime: number,
          moveSelector: HeuristicMoveSelector,
          maxNumBiasedActions: number,
          maxNumPlayoutActions: number,
          rng: unknown
        ): Trial;
      };
    }).game().playout(context, null, 1.0, this.moveSelector, -1, this.playoutTurnLimit, Math.random);
  }

  //-------------------------------------------------------------------------

  /** @java HeuristicPlayout.playoutSupportsGame(Game) */
  public playoutSupportsGame(game: Game): boolean {
    if (game.isDeductionPuzzle()) {
      return this.playoutTurnLimit > 0;
    } else {
      return true;
    }
  }

  /** @java HeuristicPlayout.customise(String[]) */
  public customise(_inputs: string[]): void {
    // TODO
  }

  /**
   * @return The turn limit we use in playouts
   * @java HeuristicPlayout.playoutTurnLimit()
   */
  public getPlayoutTurnLimit(): number {
    return this.playoutTurnLimit;
  }

  /** @java HeuristicPlayout.backpropFlags() */
  public backpropFlags(): number {
    return 0;
  }

  /** @java HeuristicPlayout.initAI(Game, int) */
  public initAI(game: unknown, _playerID: number): void {
    let heuristicValueFunction: Heuristics | null = null;

    if (this.heuristicsFilepath === null) {
      // Read heuristics from game metadata
      const typedGame = game as unknown as {
        metadata(): {
          ai(): {
            heuristics(): Heuristics | null;
          } | null;
        };
      };
      const aiMetadata = typedGame.metadata().ai();
      if (aiMetadata !== null && aiMetadata.heuristics() !== null) {
        heuristicValueFunction = Heuristics.copy(aiMetadata.heuristics()!);
      } else {
        // construct default heuristic — escape hatch
        heuristicValueFunction = {
          init: (_g: unknown) => { /* stub */ },
          computeValue: (_ctx: unknown, _player: number, _threshold: number) => 0,
        } as unknown as Heuristics;
      }
    } else {
      heuristicValueFunction = this.moveSelector.heuristicValueFunction();
    }

    if (heuristicValueFunction !== null) {
      heuristicValueFunction.init(game);
      this.moveSelector.setHeuristics(heuristicValueFunction);
    }
  }

  /** @java HeuristicPlayout.selectAction(Game, Context, double, int, int) */
  public selectAction(
    _game: unknown,
    _context: Context,
    _maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): Move {
    // TODO Auto-generated method stub
    console.error("Need to implement HeuristicPlayout::selectAction() to let it play as standalone AI!");
    return null as unknown as Move;
  }

  //-------------------------------------------------------------------------
}
