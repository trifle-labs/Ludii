// @java AI/src/utils/DoNothingAI.java

/**
 * AI player doing nothing.
 *
 * @java utils/DoNothingAI.java
 * @author Eric.Piette
 */

// Escape-hatch types for not-yet-ported dependencies

/** @java other.AI (base class) */
type AI = {
  friendlyName: string;
  initAI(game: unknown, playerID: number): void;
  selectAction(
    game: unknown,
    context: unknown,
    maxSeconds: number,
    maxIterations: number,
    maxDepth: number
  ): Move | null;
};

/** @java other.move.Move */
type Move = object;

//-------------------------------------------------------------------------

/**
 * AI player doing nothing.
 *
 * @java utils.DoNothingAI
 */
export class DoNothingAI implements AI {

  //-------------------------------------------------------------------------

  /** @java DoNothingAI.player */
  protected player: number = -1;

  /** @java DoNothingAI.lastReturnedMove */
  protected lastReturnedMove: Move | null = null;

  /** @java AI.friendlyName */
  public friendlyName: string;

  //-------------------------------------------------------------------------

  /**
   * Constructor
   * @java DoNothingAI()
   */
  public constructor() {
    this.friendlyName = "Do Nothing";
  }

  //-------------------------------------------------------------------------

  /**
   * @java DoNothingAI.selectAction(Game, Context, double, int, int)
   */
  public selectAction(
    _game: unknown,
    _context: unknown,
    _maxSeconds: number,
    _maxIterations: number,
    _maxDepth: number
  ): Move | null {
    return null;
  }

  /**
   * @return The last move we returned
   * @java DoNothingAI.lastReturnedMove()
   */
  public lastReturnedMove_get(): Move | null {
    return this.lastReturnedMove;
  }

  /**
   * @java DoNothingAI.initAI(Game, int)
   */
  public initAI(_game: unknown, playerID: number): void {
    this.player = playerID;
    this.lastReturnedMove = null;
  }

  //-------------------------------------------------------------------------
}
