// @java Common/src/exception/LimitPlayerException.java

/**
 * No way to recover. Runtime exception. An exception to prevent to create an
 * instance with more players than the max number of players or with less than 0
 * player.
 *
 * @java exception/LimitPlayerException.java
 * @author Eric.Piette and cambolbro
 */
export class LimitPlayerException extends Error {

  /**
   * @param numPlayers
   * @java LimitPlayerException(int)
   */
  public constructor(numPlayers: number) {
    super("Instantiation of a play with " + numPlayers);
    this.name = "LimitPlayerException";
    console.error("Instantiation of a play with " + numPlayers);
  }
}
