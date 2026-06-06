// @java AI/src/search/mcts/playout/HeuristicSampingPlayout.java

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

/** @java other.playout.HeuristicSamplingMoveSelector */
interface HeuristicSamplingMoveSelector {
  heuristicValueFunction(): Heuristics | null;
  setHeuristics(h: Heuristics): void;
}

/** @java other.move.Move */
interface Move {
  mover(): number;
}

/** @java other.move.MoveScore */
interface MoveScore {
  move(): Move | null;
  score(): number;
}

/** @java main.collections.FastArrayList */
interface FastArrayList<T> {
  size(): number;
  get(i: number): T;
  remove(i: number): void;
}

//-------------------------------------------------------------------------

/** Score we give to winning opponents in paranoid searches in states where game is still going (> 2 players) */
const PARANOID_OPP_WIN_SCORE = 10000.0;

/** @java HeuristicSampingPlayout.WIN_SCORE */
const WIN_SCORE = 10000.0;

/** We skip computing heuristics with absolute weight value lower than this */
const ABS_HEURISTIC_WEIGHT_THRESHOLD = 0.01;

//-------------------------------------------------------------------------

/**
 * Playout strategy that selects actions that lead to successor states that
 * maximise a heuristic score from the mover's perspective.
 *
 * We extend the AI abstract class because this means that the outer MCTS
 * will also let us init, which allows us to load heuristics from metadata
 * if desired. Also means this thing can play games as a standalone AI.
 *
 * @java search.mcts.playout.HeuristicSampingPlayout
 * @author Eric.Piette (based on code of Dennis Soemers and Cameron Browne)
 */
export class HeuristicSampingPlayout implements PlayoutStrategy {

  //-------------------------------------------------------------------------

  /**
   * Auto-end playouts in a draw if they take more turns than this, Negative value means
   * no limit.
   *
   * @java HeuristicSampingPlayout.playoutTurnLimit
   */
  protected playoutTurnLimit: number = -1;

  /**
   * Filepath from which we want to load heuristics. Null if we want to load automatically from game's metadata
   *
   * @java HeuristicSampingPlayout.heuristicsFilepath
   */
  protected readonly heuristicsFilepath: string | null;

  /**
   * Heuristic-based PlayoutMoveSelector
   *
   * @java HeuristicSampingPlayout.moveSelector
   */
  protected moveSelector: HeuristicSamplingMoveSelector = {
    heuristicValueFunction: () => null,
    setHeuristics: (_h: Heuristics) => { /* stub */ },
  } as unknown as HeuristicSamplingMoveSelector;

  /** Denominator of heuristic threshold fraction, i.e. 1/2, 1/4, 1/8, etc. */
  private fraction: number = 2;

  /** Whether to apply same-turn continuation. */
  private continuation: boolean = true;

  /** Our heuristic value function estimator */
  private heuristicValueFunction: Heuristics | null = null;

  //-------------------------------------------------------------------------

  /**
   * Default constructor: no cap on actions in playout, heuristics from metadata
   * @java HeuristicSampingPlayout()
   */
  public constructor();

  /**
   * Constructor
   * @param heuristicsFilepath Filepath for file specifying heuristics to use
   * @java HeuristicSampingPlayout(String)
   */
  public constructor(heuristicsFilepath: string);

  public constructor(heuristicsFilepath?: string) {
    this.playoutTurnLimit = -1; // No limit
    this.heuristicsFilepath = heuristicsFilepath ?? null;
  }

  //-------------------------------------------------------------------------

  /** @java HeuristicSampingPlayout.runPlayout(MCTS, Context) */
  public runPlayout(mcts: MCTS, context: Context): Trial {
    void mcts;
    return (context as unknown as {
      game(): {
        playout(
          context: Context,
          agents: null,
          thinkTime: number,
          moveSelector: HeuristicSamplingMoveSelector,
          maxNumBiasedActions: number,
          maxNumPlayoutActions: number,
          rng: unknown
        ): Trial;
      };
    }).game().playout(context, null, 1.0, this.moveSelector, -1, this.playoutTurnLimit, Math.random);
  }

  //-------------------------------------------------------------------------

  /** @java HeuristicSampingPlayout.playoutSupportsGame(Game) */
  public playoutSupportsGame(game: Game): boolean {
    if (game.isDeductionPuzzle()) {
      return this.playoutTurnLimit > 0;
    } else {
      return true;
    }
  }

  /** @java HeuristicSampingPlayout.customise(String[]) */
  public customise(_inputs: string[]): void {
    // Nothing to do here.
  }

  /**
   * @return The turn limit we use in playouts
   * @java HeuristicSampingPlayout.playoutTurnLimit()
   */
  public getPlayoutTurnLimit(): number {
    return this.playoutTurnLimit;
  }

  /** @java HeuristicSampingPlayout.backpropFlags() */
  public backpropFlags(): number {
    return 0;
  }

  /** @java HeuristicSampingPlayout.initAI(Game, int) */
  public initAI(game: unknown, _playerID: number): void {
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
        this.heuristicValueFunction = Heuristics.copy(aiMetadata.heuristics()!);
      } else {
        // construct default heuristic — escape hatch
        this.heuristicValueFunction = {
          init: (_g: unknown) => { /* stub */ },
          computeValue: (_ctx: unknown, _player: number, _threshold: number) => 0,
        } as unknown as Heuristics;
      }
    } else {
      this.heuristicValueFunction = this.moveSelector.heuristicValueFunction();
    }

    if (this.heuristicValueFunction !== null) {
      this.heuristicValueFunction.init(game);
      this.moveSelector.setHeuristics(this.heuristicValueFunction);
    }
  }

  /** @java HeuristicSampingPlayout.selectAction(Game, Context, double, int, int) */
  public selectAction(
    game: unknown,
    context: Context,
    _maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): Move | null {
    const moveScore = this.evaluateMoves(game, context);
    const move = moveScore.move();
    if (move === null) {
      console.log("** No best move.");
    }
    return move;
  }

  //-------------------------------------------------------------------------

  /**
   * @param player The player.
   * @param context The context.
   * @return Opponents of given player
   * @java HeuristicSampingPlayout.opponents(int, Context)
   */
  public opponents(player: number, context: Context): number[] {
    const typedCtx = context as unknown as {
      game(): {
        players(): { count(): number };
        requiresTeams(): boolean;
      };
      state(): {
        getTeam(p: number): number;
      };
    };
    const numPlayersInGame = typedCtx.game().players().count();
    const opponents: number[] = [];

    if (typedCtx.game().requiresTeams()) {
      const tid = typedCtx.state().getTeam(player);
      for (let p = 1; p <= numPlayersInGame; p++) {
        if (typedCtx.state().getTeam(p) !== tid) {
          opponents.push(p);
        }
      }
    } else {
      for (let p = 1; p <= numPlayersInGame; ++p) {
        if (p !== player) {
          opponents.push(p);
        }
      }
    }

    return opponents;
  }

  //-------------------------------------------------------------------------

  /**
   * @param game    Current game.
   * @param context Current context.
   * @param fraction  Number of moves to select.
   * @return Randomly chosen subset of moves.
   * @java HeuristicSampingPlayout.selectMoves(Game, Context, int)
   */
  public static selectMoves(game: unknown, context: Context, fraction: number): FastArrayList<Move> {
    const typedGame = game as unknown as {
      moves(ctx: Context): { moves(): FastArrayList<Move> };
    };
    const playerMoves: Move[] = [];
    const sourceMoves = typedGame.moves(context).moves();
    for (let i = 0; i < sourceMoves.size(); i++) {
      playerMoves.push(sourceMoves.get(i));
    }

    const selectedMoves: Move[] = [];
    const target = Math.max(2, Math.floor((playerMoves.length + 1) / fraction));

    if (target >= playerMoves.length) {
      return sourceMoves;
    }

    while (selectedMoves.length < target) {
      const r = Math.floor(Math.random() * playerMoves.length);
      selectedMoves.push(playerMoves[r]!);
      playerMoves.splice(r, 1);
    }

    const result: FastArrayList<Move> = {
      size: () => selectedMoves.length,
      get: (i: number) => selectedMoves[i],
      remove: (i: number) => { selectedMoves.splice(i, 1); },
    } as unknown as FastArrayList<Move>;

    return result;
  }

  //-------------------------------------------------------------------------

  /** @java HeuristicSampingPlayout.evaluateMoves(Game, Context) */
  public evaluateMoves(game: unknown, context: Context): MoveScore {
    const moves = HeuristicSampingPlayout.selectMoves(game, context, this.fraction);

    let bestScore = -Infinity;
    let bestMove: Move = moves.get(0);

    const typedCtx = context as unknown as {
      state(): {
        mover(): number;
        playerToAgent(p: number): number;
      };
      trial(): {
        status(): { winner(): number } | null;
      };
      active(p: number): boolean;
      winners(): { contains(p: number): boolean };
    };

    const mover = typedCtx.state().mover();
    const typedGame = game as unknown as {
      apply(ctx: Context, move: Move): void;
    };

    for (let mi = 0; mi < moves.size(); mi++) {
      const move = moves.get(mi);
      const contextCopy = new (context as unknown as new (ctx: Context) => typeof context)(context as unknown as Context);
      typedGame.apply(contextCopy as unknown as Context, move);

      const copiedCtx = contextCopy as unknown as typeof typedCtx;
      const status = copiedCtx.trial().status();
      if (status !== null) {
        // Check if move is a winner
        const winner = copiedCtx.state().playerToAgent(status.winner());

        if (winner === mover) {
          return { move: () => move, score: () => WIN_SCORE } as unknown as MoveScore; // return winning move immediately
        }

        if (winner !== 0) {
          continue; // skip losing move
        }
      }

      let score = 0;
      if (this.continuation && copiedCtx.state().mover() === mover) {
        return { move: () => move, score: () => this.evaluateMoves(game, contextCopy as unknown as Context).score() } as unknown as MoveScore;
      } else {
        score = this.heuristicValueFunction!.computeValue(
          contextCopy,
          mover,
          ABS_HEURISTIC_WEIGHT_THRESHOLD
        );

        for (const opp of this.opponents(mover, context)) {
          if (typedCtx.active(opp)) {
            score -= this.heuristicValueFunction!.computeValue(contextCopy, opp, ABS_HEURISTIC_WEIGHT_THRESHOLD);
          } else if (typedCtx.winners().contains(opp)) {
            score -= PARANOID_OPP_WIN_SCORE;
          }
        }
        score += Math.floor(Math.random() * 1000) / 1000000.0;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    const finalScore = bestScore;
    const finalMove = bestMove;
    return { move: () => finalMove, score: () => finalScore } as unknown as MoveScore;
  }
}
