/**
 * ContainerStyleType.ts
 *
 * @java metadata/graphics/util/ContainerStyleType.java
 *
 * Supported style types for rendering particular boards.
 */

/** @java metadata.graphics.util.ContainerStyleType */
export const CONTAINER_STYLE_TYPES = [
  // General styles for containers
  /** General style for boards. */
  "Board",

  /** General style for player hands. */
  "Hand",

  /** General style for player Decks. */
  "Deck",

  /** General style for player Dice. */
  "Dice",

  // General styles for types of games
  /** General style for boardless games, e.g. Andantino. */
  "Boardless",

  /** General board style for games with connective goals. */
  "ConnectiveGoal",

  /** General style for Mancala boards. */
  "Mancala",

  /** General style for pen & paper style games, such as graph games. */
  "PenAndPaper",

  /** Style for square pyramidal games played on the Shibumi board, e.g. Spline. */
  "Shibumi",

  /** General style for games played on a spiral board, e.g. Mehen. */
  "Spiral",

  /** General style for games played on an isometric board. */
  "Isometric",

  // General styles for puzzles
  /** General style for deduction puzzle boards. */
  "Puzzle",

  // Custom styles for specific games
  /** Custom style for the Backgammon board. */
  "Backgammon",

  /** Custom style for the Chess board. */
  "Chess",

  /** Custom style for the Connect4 board. */
  "Connect4",

  /** Custom style for the Go board. */
  "Go",

  /** General style for graph game boards. */
  "Graph",

  /** Custom style for the Hounds and Jackals (58 Holes) board. */
  "HoundsAndJackals",

  /** Custom style for the Janggi board. */
  "Janggi",

  /** Custom style for the Lasca board. */
  "Lasca",

  /** Custom style for the Shogi board. */
  "Shogi",

  /** Custom style for the Snakes and Ladders board. */
  "SnakesAndLadders",

  /** Custom style for the Surakarta board. */
  "Surakarta",

  /** Custom style for the Table board. */
  "Table",

  /** Custom style for Tafl boards. */
  "Tafl",

  /** Custom style for the Xiangqi board. */
  "Xiangqi",

  /** Custom style for the Ultimate Tic-Tac-Toe board. */
  "UltimateTicTacToe",

  // Custom styles for specific puzzles
  /** Custom style for the Futoshiki puzzle board. */
  "Futoshiki",

  /** Custom style for the Hashi puzzle board. */
  "Hashi",

  /** Custom style for the Kakuro puzzle board. */
  "Kakuro",

  /** Custom style for the Sudoku board. */
  "Sudoku",
] as const;

/** @java metadata.graphics.util.ContainerStyleType */
export type ContainerStyleType = (typeof CONTAINER_STYLE_TYPES)[number];

/** True iff the given string is a valid ContainerStyleType value. */
export function isContainerStyleType(value: string): value is ContainerStyleType {
  return (CONTAINER_STYLE_TYPES as readonly string[]).includes(value);
}

/**
 * Returns the ContainerStyleType for a name, defaulting to "Board".
 * @java ContainerStyleType.fromName(String)
 */
export function containerStyleTypeFromName(name: string): ContainerStyleType {
  return isContainerStyleType(name) ? name : "Board";
}
