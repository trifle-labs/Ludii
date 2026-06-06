// @java Common/src/main/Status.java

/**
 * Final status of a trial (will be null if game is still in progress).
 *
 * @java main/Status.java
 * @author cambolbro
 */

/**
 * Ways in which a trial can end.
 *
 * @java main/Status.EndType
 * @author Dennis Soemers
 */
export enum EndType {
  /** Trial didn't end yet (Status should be null, so this should never happen) */
  NoEnd = "NoEnd",
  /** Don't know how the Trial ended (likely old trial where we didn't record this) */
  Unknown = "Unknown",

  /** A normal end to a game */
  NaturalEnd = "NaturalEnd",
  /** Reached artificial move limit */
  MoveLimit = "MoveLimit",
  /** Reached artificial turn limit */
  TurnLimit = "TurnLimit",
}

export class Status {
  /** The winner of the game. @java Status.winner */
  private readonly _winner: number;

  /** Way in which a trial ended. @java Status.endType */
  private readonly _endType: EndType;

  // -------------------------------------------------------------------------

  /**
   * Constructor. NOTE: assumes trial ended naturally.
   *
   * @java Status(int)
   */
  public constructor(winner: number);

  /**
   * Constructor.
   *
   * @java Status(int, EndType)
   */
  public constructor(winner: number, endType: EndType);

  /**
   * Copy constructor.
   *
   * @java Status(Status)
   */
  public constructor(status: Status);

  public constructor(winnerOrStatus: number | Status, endType?: EndType) {
    if (winnerOrStatus instanceof Status) {
      this._winner = winnerOrStatus._winner;
      this._endType = winnerOrStatus._endType;
    } else {
      this._winner = winnerOrStatus;
      this._endType = endType ?? EndType.NaturalEnd;
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return Index of winner, else 0 if none (draw, tie, abandoned).
   *
   * @java Status.winner()
   */
  public winner(): number {
    return this._winner;
  }

  /**
   * @return Type describing how this game ended.
   *
   * @java Status.endType()
   */
  public endType(): EndType {
    return this._endType;
  }

  // -------------------------------------------------------------------------

  /** @java Status.hashCode() */
  public hashCode(): number {
    const prime = 31;
    let result = 1;
    result = prime * result + this._winner;
    return result;
  }

  /** @java Status.equals(Object) */
  public equals(other: unknown): boolean {
    if (!(other instanceof Status)) {
      return false;
    }
    return this._winner === other._winner;
  }

  /** @java Status.toString() */
  public toString(): string {
    if (this._winner === 0) {
      return "Nobody wins.";
    }
    return "Player " + this._winner + " wins.";
  }

  // -------------------------------------------------------------------------
}
