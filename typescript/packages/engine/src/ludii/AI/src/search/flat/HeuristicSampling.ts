// @java AI/src/search/flat/HeuristicSampling.java

/**
 * Flat search that does heuristic sampling per turn, i.e. chooses T random moves
 * and selects the one with the highest heuristic evaluation when applied.
 *
 * @java search/flat/HeuristicSampling.java
 * @author cambolbro and Dennis Soemers
 */

// Escape-hatch interfaces for not-yet-ported external dependencies

/** @java game.Game */
export interface Game {
  players(): { count(): number };
  moves(ctx: unknown): { moves(): FastArrayList<Move> };
  apply(ctx: unknown, move: Move): void;
  playout(
    ctx: unknown,
    agents: unknown,
    maxTime: number,
    sel: unknown,
    nbPlayouts: number,
    maxMoves: number,
    rand: unknown
  ): unknown;
  isAlternatingMoveGame(): boolean;
  hiddenInformation(): boolean;
  metadata(): {
    ai(): {
      heuristics(): Heuristics | null;
      features(): unknown;
      trainedFeatureTrees(): unknown;
    };
  };
}

/** @java main.collections.FastArrayList */
export interface FastArrayList<T> {
  size(): number;
  get(i: number): T;
  add(item: T): void;
  removeSwap(i: number): void;
  [Symbol.iterator](): Iterator<T>;
  toArray(): T[];
}

/** @java other.move.Move */
export interface Move {
  toString(): string;
}

/** @java other.move.MoveScore */
export interface MoveScore {
  move(): Move;
  score(): number;
}

/** @java metadata.ai.heuristics.Heuristics */
export interface Heuristics {
  computeValue(context: unknown, player: number, threshold: number): number;
  heuristicTerms(): HeuristicTerm[];
  init(game: unknown): void;
}

/** @java metadata.ai.heuristics.terms.HeuristicTerm */
export interface HeuristicTerm {
  computeValue(context: unknown, player: number, threshold: number): number;
  weight(): number;
}

/** @java other.context.Context */
export interface Context {
  state(): { mover(): number };
  active(player: number): boolean;
  winners(): { contains(p: number): boolean };
  losers(): { contains(p: number): boolean };
  game(): Game;
  trial(): { over(): boolean };
}

// MoveScore helper
function makeMoveScore(move: Move, score: number): MoveScore {
  return {
    move: (): Move => move,
    score: (): number => score,
  };
}

/** @java other.AI */
export abstract class AI {
  /** @java AI.friendlyName */
  public friendlyName: string = "";

  /** @java AI.initAI(Game, int) */
  public initAI(_game: unknown, _playerID: number): void { /* base */ }

  /** @java AI.closeAI() */
  public closeAI(): void { /* base */ }

  /** @java AI.supportsGame(Game) */
  public supportsGame(_game: unknown): boolean { return true; }

  /** @java AI.selectAction(Game, Context, double, int, int) */
  public abstract selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null;
}

//-------------------------------------------------------------------------

/** @java HeuristicSampling.PARANOID_OPP_WIN_SCORE */
const PARANOID_OPP_WIN_SCORE: number = 10000.0;
/** @java HeuristicSampling.WIN_SCORE */
const WIN_SCORE: number = 10000.0;
/** @java HeuristicSampling.ABS_HEURISTIC_WEIGHT_THRESHOLD */
const ABS_HEURISTIC_WEIGHT_THRESHOLD: number = 0.01;

/**
 * Flat search that does heuristic sampling per turn.
 *
 * @java search.flat.HeuristicSampling
 */
export class HeuristicSampling extends AI {

  //-------------------------------------------------------------------------

  /** @java HeuristicSampling.PARANOID_OPP_WIN_SCORE */
  protected static readonly PARANOID_OPP_WIN_SCORE: number = PARANOID_OPP_WIN_SCORE;
  /** @java HeuristicSampling.WIN_SCORE */
  protected static readonly WIN_SCORE: number = WIN_SCORE;
  /** @java HeuristicSampling.ABS_HEURISTIC_WEIGHT_THRESHOLD */
  public static readonly ABS_HEURISTIC_WEIGHT_THRESHOLD: number = ABS_HEURISTIC_WEIGHT_THRESHOLD;

  /** Our heuristic value function estimator
   * @java HeuristicSampling.heuristicValueFunction */
  protected heuristicValueFunction: Heuristics | null = null;

  /** If true, we read our heuristic function to use from game's metadata
   * @java HeuristicSampling.heuristicsFromMetadata */
  private readonly heuristicsFromMetadata: boolean;

  /** The number of players in the game we're currently playing
   * @java HeuristicSampling.numPlayersInGame */
  protected numPlayersInGame: number = 0;

  /** Denominator of heuristic threshold fraction, i.e. 1/2, 1/4, 1/8, etc.
   * @java HeuristicSampling.fraction */
  private fraction: number = 2;

  /** Whether to apply same-turn continuation.
   * @java HeuristicSampling.continuation */
  private _continuation: boolean = true;

  //-------------------------------------------------------------------------

  /**
   * Overloaded constructor mirroring all 4 Java constructors.
   * @java HeuristicSampling()
   * @java HeuristicSampling(int)
   * @java HeuristicSampling(Heuristics)
   * @java HeuristicSampling(Heuristics, int)
   */
  public constructor(fractionOrHeuristics?: number | Heuristics, fraction?: number) {
    super();
    if (fractionOrHeuristics === undefined) {
      // HeuristicSampling()
      this.heuristicsFromMetadata = true;
    } else if (typeof fractionOrHeuristics === "number") {
      // HeuristicSampling(int fraction)
      this.heuristicsFromMetadata = true;
      this.fraction = fractionOrHeuristics;
    } else if (fraction === undefined) {
      // HeuristicSampling(Heuristics)
      this.heuristicValueFunction = fractionOrHeuristics as Heuristics;
      this.heuristicsFromMetadata = false;
    } else {
      // HeuristicSampling(Heuristics, int)
      this.heuristicValueFunction = fractionOrHeuristics as Heuristics;
      this.heuristicsFromMetadata = false;
      this.fraction = fraction;
    }
    this.setFriendlyName();
  }

  //-------------------------------------------------------------------------
  // Getters and Setters

  /** @java HeuristicSampling.heuristics() */
  public heuristics(): Heuristics | null {
    return this.heuristicValueFunction;
  }

  /** @java HeuristicSampling.setHeuristics(Heuristics) */
  public setHeuristics(heuristics: Heuristics): void {
    this.heuristicValueFunction = heuristics;
  }

  /** @java HeuristicSampling.threshold() */
  public threshold(): number {
    return this.fraction;
  }

  /** @java HeuristicSampling.setThreshold(int) */
  public setThreshold(value: number): void {
    this.fraction = value;
    this.setFriendlyName();
  }

  /** @java HeuristicSampling.continuation() */
  public continuation(): boolean {
    return this._continuation;
  }

  /** @java HeuristicSampling.setContinuation(boolean) */
  public setContinuation(value: boolean): void {
    this._continuation = value;
    this.setFriendlyName();
  }

  //-------------------------------------------------------------------------

  /** @java HeuristicSampling.setFriendlyName() */
  setFriendlyName(): void {
    this.friendlyName = "HS (1/" + this.fraction + ")" + (this._continuation ? "*" : "");
  }

  //-------------------------------------------------------------------------

  /**
   * @java HeuristicSampling.selectAction(Game, Context, double, int, int)
   */
  public override selectAction(
    game: Game,
    context: Context,
    _maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): Move | null {
    const moveScore = this.evaluateMoves(game, context, 1);
    const move = moveScore.move();
    if (move === null)
      console.log("** No best move.");
    return move;
  }

  //-------------------------------------------------------------------------

  /** @java HeuristicSampling.evaluateMoves(Game, Context, int) */
  evaluateMoves(game: Game, context: Context, depth: number): MoveScore {
    const moves = HeuristicSampling.selectMoves(game, context, this.fraction, depth);

    let bestScore: number = -Infinity;
    let bestMove: Move = moves.get(0);

    const mover: number = context.state().mover();

    for (const move of moves) {
      // Create a TempContext copy — escape hatch via duck typing
      const contextCopy = (
        context as unknown as { _cloneAsTemp(): Context }
      )._cloneAsTemp?.() ?? (context as unknown as Context);

      game.apply(contextCopy as unknown, move);

      if (!contextCopy.active(mover)) {
        if (contextCopy.winners().contains(mover))
          return makeMoveScore(move, WIN_SCORE); // Return winning move immediately
        else if (contextCopy.losers().contains(mover))
          continue; // Skip losing move
      }

      let score: number = 0;
      if (!contextCopy.active(mover)) {
        score = 0.0; // Must be a draw in this case
      } else if (this._continuation && contextCopy.state().mover() === mover && depth <= 10) {
        score = this.evaluateMoves(game, contextCopy, depth + 1).score();
      } else {
        score = this.heuristicValueFunction!.computeValue(
          contextCopy, mover, ABS_HEURISTIC_WEIGHT_THRESHOLD
        );
        for (const opp of this.opponents(mover)) {
          if (contextCopy.active(opp))
            score -= this.heuristicValueFunction!.computeValue(
              contextCopy, opp, ABS_HEURISTIC_WEIGHT_THRESHOLD
            );
          else if (contextCopy.winners().contains(opp))
            score -= PARANOID_OPP_WIN_SCORE;
        }
        score += Math.floor(Math.random() * 1000) / 1000000.0;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return makeMoveScore(bestMove, bestScore);
  }

  //-------------------------------------------------------------------------

  /**
   * @param game    Current game.
   * @param context Current context.
   * @param fraction  Number of moves to select.
   * @param depth   Current depth in our little search.
   * @return Randomly chosen subset of moves.
   * @java HeuristicSampling.selectMoves(Game, Context, int, int)
   */
  public static selectMoves(
    game: Game,
    context: Context,
    fraction: number,
    depth: number
  ): FastArrayList<Move> {
    const playerMoves: HsArrayList<Move> = new HsArrayList<Move>(
      Array.from(game.moves(context).moves() as unknown as Iterable<Move>)
    );
    const selectedMoves: HsArrayList<Move> = new HsArrayList<Move>([]);

    // Some special stuff here to ensure we don't get stack overflow
    let scalar = 1.0 / fraction;
    const minMoves = (depth < 3) ? 2 : 1;
    if (depth >= 3)
      scalar = 1.0 / (fraction * Math.pow(2.0, depth - 2));

    const target = Math.max(minMoves, Math.trunc((playerMoves.size() + 1) * scalar));

    if (target >= playerMoves.size())
      return playerMoves;

    while (selectedMoves.size() < target) {
      const r = Math.trunc(Math.random() * playerMoves.size());
      selectedMoves.add(playerMoves.get(r));
      playerMoves.removeSwap(r);
    }

    return selectedMoves;
  }

  //-------------------------------------------------------------------------

  /**
   * @param player
   * @return Opponents of given player
   * @java HeuristicSampling.opponents(int)
   */
  public opponents(player: number): number[] {
    const result: number[] = new Array(this.numPlayersInGame - 1);
    let idx = 0;

    for (let p = 1; p <= this.numPlayersInGame; ++p) {
      if (p !== player)
        result[idx++] = p;
    }

    return result;
  }

  //-------------------------------------------------------------------------

  /**
   * @java HeuristicSampling.initAI(Game, int)
   */
  public override initAI(game: Game, _playerID: number): void {
    if (this.heuristicsFromMetadata) {
      // Read heuristics from game metadata
      const aiMetadata = game.metadata().ai();
      if (aiMetadata !== null && aiMetadata.heuristics() !== null) {
        this.heuristicValueFunction = aiMetadata.heuristics();
      } else {
        // construct default heuristic — Heuristics/Material/MobilitySimple not yet ported; leave null
        this.heuristicValueFunction = null;
      }
    }

    if (this.heuristicValueFunction !== null)
      this.heuristicValueFunction.init(game);

    this.numPlayersInGame = game.players().count();
  }

  /** @java HeuristicSampling.supportsGame(Game) */
  public override supportsGame(game: Game): boolean {
    if (game.players().count() <= 1)
      return false;

    if (game.hiddenInformation())
      return false;

    return game.isAlternatingMoveGame();
  }

  //-------------------------------------------------------------------------

  /**
   * @param lines
   * @return Constructs a HeuristicSampling object from instructions in the given array of lines
   * @java HeuristicSampling.fromLines(String[])
   */
  public static fromLines(lines: string[]): HeuristicSampling {
    let friendlyName = "HeuristicSampling";
    let heuristicsFilepath: string | null = null;

    for (const line of lines) {
      const lineParts = line.split(",");
      const part0 = lineParts[0] ?? "";

      if (part0.toLowerCase().startsWith("heuristics=")) {
        heuristicsFilepath = part0.substring("heuristics=".length);
      } else if (part0.toLowerCase().startsWith("friendly_name=")) {
        friendlyName = part0.substring("friendly_name=".length);
      }
    }

    let heuristicSampling: HeuristicSampling | null = null;

    if (heuristicsFilepath !== null) {
      // File IO not applicable in TypeScript
      console.error(
        "HeuristicSampling.fromLines: file loading not supported in TypeScript: " +
        heuristicsFilepath
      );
    }

    if (heuristicSampling === null)
      heuristicSampling = new HeuristicSampling();

    heuristicSampling.friendlyName = friendlyName;

    return heuristicSampling;
  }

  //-------------------------------------------------------------------------
}

//-------------------------------------------------------------------------
// Internal minimal FastArrayList implementation used by selectMoves

class HsArrayList<T> implements FastArrayList<T> {
  private arr: T[];

  constructor(initial: T[] = []) {
    this.arr = initial;
  }

  public size(): number { return this.arr.length; }
  public get(i: number): T { return this.arr[i] as T; }
  public add(item: T): void { this.arr.push(item); }
  public removeSwap(i: number): void {
    this.arr[i] = this.arr[this.arr.length - 1] as T;
    this.arr.pop();
  }
  public [Symbol.iterator](): Iterator<T> {
    return this.arr[Symbol.iterator]();
  }
  public toArray(): T[] { return this.arr.slice(); }
}
