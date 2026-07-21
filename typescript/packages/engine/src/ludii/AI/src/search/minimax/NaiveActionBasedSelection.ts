// @java AI/src/search/minimax/NaiveActionBasedSelection.java

/**
 * Naive AI that just picks the most promising action according to its learned
 * selection policy based on actions, with no exploration.
 *
 * @java search/minimax/NaiveActionBasedSelection.java
 * @author cyprien
 */

//-------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** @java other.move.Move */
export interface Move {
  toString(): string;
}

/** @java main.collections.FastArrayList */
export interface FastArrayList<T> {
  size(): number;
  get(i: number): T;
  add(item: T): void;
  [Symbol.iterator](): Iterator<T>;
}

/** @java game.Game */
export interface Game {
  players(): { count(): number };
  moves(ctx: unknown): { moves(): FastArrayList<Move> };
  isStochasticGame(): boolean;
  hiddenInformation(): boolean;
  isAlternatingMoveGame(): boolean;
  metadata(): {
    ai(): {
      features(): unknown | null;
      trainedFeatureTrees(): unknown | null;
    };
  };
}

/** @java other.context.Context */
export interface Context {
  state(): { mover(): number };
  game(): Game;
}

/** @java policies.softmax.SoftmaxPolicy */
export interface SoftmaxPolicy {
  computeLogit(context: Context, move: Move): number;
  initAI(game: Game, playerID: number): void;
}

/** @java utils.data_structures.ScoredMove */
export interface ScoredMove {
  move: Move;
  score: number;
  nbVisits: number;
}

function makeScoredMove(move: Move, score: number, nbVisits: number): ScoredMove {
  return { move, score, nbVisits };
}

// SoftmaxFromMetadataSelection escape hatch — not yet ported
type SoftmaxFromMetadataSelectionCtor = new (epsilon: number) => SoftmaxPolicy;
const SoftmaxFromMetadataSelectionStub: SoftmaxFromMetadataSelectionCtor =
  class implements SoftmaxPolicy {
    constructor(_eps: number) { /* */ }
    computeLogit(_ctx: Context, _m: Move): number { return 0; }
    initAI(_g: Game, _p: number): void { /* */ }
  };

//-------------------------------------------------------------------------

/** @java other.AI base */
abstract class AIBase {
  public friendlyName: string = "";

  public initAI(_game: unknown, _playerID: number): void { /* base */ }
  public closeAI(): void { /* base */ }
  public supportsGame(_game: unknown): boolean { return true; }

  public abstract selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null;
}

//-------------------------------------------------------------------------

/**
 * Naive AI that just picks the most promising action according to its learned
 * selection policy based on actions, with no exploration.
 *
 * @java search.minimax.NaiveActionBasedSelection
 */
export class NaiveActionBasedSelection extends AIBase {

  //-------------------------------------------------------------------------

  /** A learned policy to use in Selection phase
   * @java NaiveActionBasedSelection.learnedSelectionPolicy */
  protected learnedSelectionPolicy: SoftmaxPolicy | null = null;

  /** Current list of moves available in root
   * @java NaiveActionBasedSelection.currentRootMoves */
  protected currentRootMoves: FastArrayList<Move> | null = null;

  /** @java NaiveActionBasedSelection.selectionEpsilon */
  protected selectionEpsilon: number = 0.0;

  /** @java NaiveActionBasedSelection.selectActionNbCalls */
  protected selectActionNbCalls: number = 0;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java NaiveActionBasedSelection()
   */
  public constructor() {
    super();
    this.friendlyName = "Naive Action Based Selection";
  }

  //-------------------------------------------------------------------------

  /**
   * @java NaiveActionBasedSelection.selectAction(Game, Context, double, int, int)
   */
  public override selectAction(
    game: Game,
    context: Context,
    _maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): Move | null {
    this.currentRootMoves = game.moves(context).moves();

    let selectedMove: Move;

    if (
      this.learnedSelectionPolicy !== null &&
      Math.random() < this.selectionEpsilon
    ) {
      const numRootMoves = this.currentRootMoves.size();
      const consideredMoveIndices: ScoredMove[] = new Array(numRootMoves);

      for (let i = 0; i < numRootMoves; ++i) {
        const m = this.currentRootMoves.get(i);
        const actionValue = this.learnedSelectionPolicy.computeLogit(context, m);
        consideredMoveIndices[i] = makeScoredMove(m, actionValue, 1);
      }

      // Sort descending by score
      consideredMoveIndices.sort((a, b) => b.score - a.score);

      selectedMove = (consideredMoveIndices[0] as ScoredMove).move;
    } else {
      const r = Math.trunc(Math.random() * this.currentRootMoves.size());
      selectedMove = this.currentRootMoves.get(r);
    }

    this.selectActionNbCalls += 1;

    return selectedMove;
  }

  //-------------------------------------------------------------------------

  /**
   * Initialising the AI
   * @java NaiveActionBasedSelection.initAI(Game, int)
   */
  public override initAI(game: Game, playerID: number): void {
    this.currentRootMoves = null;

    // Instantiate feature sets for selection policy
    if (
      game.metadata().ai().features() !== null ||
      game.metadata().ai().trainedFeatureTrees() !== null
    ) {
      this.setLearnedSelectionPolicy(new SoftmaxFromMetadataSelectionStub(0.0));
      this.learnedSelectionPolicy!.initAI(game, playerID);
    }

    this.selectActionNbCalls = 0;
  }

  /** @java NaiveActionBasedSelection.supportsGame(Game) */
  public override supportsGame(game: Game): boolean {
    if (game.isStochasticGame())
      return false;

    if (game.hiddenInformation())
      return false;

    return (
      game.metadata().ai().features() !== null ||
      game.metadata().ai().trainedFeatureTrees() !== null
    );
  }

  //-------------------------------------------------------------------------

  /**
   * Sets the learned policy to use in Selection phase
   * @param policy The policy.
   * @java NaiveActionBasedSelection.setLearnedSelectionPolicy(SoftmaxPolicy)
   */
  public setLearnedSelectionPolicy(policy: SoftmaxPolicy): void {
    this.learnedSelectionPolicy = policy;
  }

  /** @java NaiveActionBasedSelection.setSelectionEpsilon(float) */
  public setSelectionEpsilon(eps: number): void {
    this.selectionEpsilon = eps;
  }

  /** @java NaiveActionBasedSelection.getSelectActionNbCalls() */
  public getSelectActionNbCalls(): number {
    return this.selectActionNbCalls;
  }

  //-------------------------------------------------------------------------
}
