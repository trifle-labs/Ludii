// @java Common/src/exception/IndexPlayerException.java

/**
 * Changed to RuntimeException because no way to recover, I think.
 * An exception to prevent to create an instance of a player with an index <= 0 or > maxPlayer.
 *
 * @java exception/IndexPlayerException.java
 * @author Eric.Piette and cambolbro
 */
export class IndexPlayerException extends Error {

  /**
   * @param index
   * @java IndexPlayerException(int)
   */
  public constructor(index: number) {
    super("Instantiation of a player with the index " + index);
    this.name = "IndexPlayerException";
    console.error("Instantiation of a player with the index " + index);
  }
}
