// @java Core/src/game/functions/ints/count/CountSimpleType.java

/**
 * Defines the types of properties that can be counted without a parameter
 * (apart from the graph element type, where relevant).
 *
 * @java game/functions/ints/count/CountSimpleType.java
 * @author Eric.Piette and cambolbro
 */
export enum CountSimpleType {
  /** Number of rows on the board. */
  Rows = "Rows",

  /** Number of columns on the board. */
  Columns = "Columns",

  /** Number of turns played so far in this trial. */
  Turns = "Turns",

  /** Number of moves made so far in this trial. */
  Moves = "Moves",

  /** Number of completed games within a match. */
  Trials = "Trials",

  /** Number of moves made so far this turn. */
  MovesThisTurn = "MovesThisTurn",

  /** Number of phase changes during this trial. */
  Phases = "Phases",

  /** Number of adjacent (connected) elements. */
  Vertices = "Vertices",

  /** Number of edges on the board. */
  Edges = "Edges",

  /** Number of cells on the board. */
  Cells = "Cells",

  /** Number of players. */
  Players = "Players",

  /** Number of active players. */
  Active = "Active",

  /** Number of legal moves. */
  LegalMoves = "LegalMoves",
}
