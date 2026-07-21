/**
 * Defines known characteristics of games as bit-flag constants.
 *
 * @java game/types/state/GameType.java
 *
 * @remarks In Java this is an interface (not an enum) whose sole purpose is to
 * expose named long-bit-flag constants. We mirror them as a plain const object
 * using JavaScript's BigInt so all 49 flag bits fit without overflow.
 * Each flag value matches the Java expression `(0x1L << N)` exactly.
 */

/** @java game/types/state/GameType.java — interface GameType (static long constants) */
export const GameType = {
  /** On if this game may generate moves that use from-positions. */
  UsesFromPositions:        BigInt(0x1),
  /** On if the game involves a state value for a site. */
  SiteState:                BigInt(0x1) << BigInt(1),
  /** On if the game involves a count for a site. */
  Count:                    BigInt(0x1) << BigInt(2),
  /** On if the game has hidden info. */
  HiddenInfo:               BigInt(0x1) << BigInt(3),
  /** On if the game is a stacking game. */
  Stacking:                 BigInt(0x1) << BigInt(4),
  /** On if the game is a boardless game. */
  Boardless:                BigInt(0x1) << BigInt(5),
  /** On if the game involves some stochastic values. */
  Stochastic:               BigInt(0x1) << BigInt(6),
  /** On if the game is a deduction puzzle. */
  DeductionPuzzle:          BigInt(0x1) << BigInt(7),
  /** On if the game involves score. */
  Score:                    BigInt(0x1) << BigInt(8),
  /** On if we store the visited sites in the same turn. */
  Visited:                  BigInt(0x1) << BigInt(9),
  /** On if the game has simultaneous actions. */
  Simultaneous:             BigInt(0x1) << BigInt(10),
  /** On if this game is 3D. */
  ThreeDimensions:          BigInt(0x1) << BigInt(11),
  /** On if the game does not end if all the players pass. */
  NotAllPass:               BigInt(0x1) << BigInt(12),
  /** On if the game involves card. */
  Card:                     BigInt(0x1) << BigInt(13),
  /** On if the game involves large piece. */
  LargePiece:               BigInt(0x1) << BigInt(14),
  /** On if the game involves some capture in sequence. */
  SequenceCapture:          BigInt(0x1) << BigInt(15),
  /** On if the games has some tracks defined. */
  Track:                    BigInt(0x1) << BigInt(16),
  /** On if the game has some rotation values. */
  Rotation:                 BigInt(0x1) << BigInt(17),
  /** On if the game has team. */
  Team:                     BigInt(0x1) << BigInt(18),
  /** On if the game has some betting actions. */
  Bet:                      BigInt(0x1) << BigInt(19),
  /** On if the game has some hash scores. */
  HashScores:               BigInt(0x1) << BigInt(20),
  /** On if the game has some hash amounts. */
  HashAmounts:              BigInt(0x1) << BigInt(21),
  /** On if the game has some hash phases. */
  HashPhases:               BigInt(0x1) << BigInt(22),
  /** On if the game is a graph game. */
  Graph:                    BigInt(0x1) << BigInt(23),
  /** On if the game can be played on the vertices. */
  Vertex:                   BigInt(0x1) << BigInt(24),
  /** On if the game can be played on the cells. */
  Cell:                     BigInt(0x1) << BigInt(25),
  /** On if the game can played on the edges. */
  Edge:                     BigInt(0x1) << BigInt(26),
  /** On if the game has dominoes. */
  Dominoes:                 BigInt(0x1) << BigInt(27),
  /** On if the game has a line of play used. */
  LineOfPlay:               BigInt(0x1) << BigInt(28),
  /** On if the game has some replay actions. */
  MoveAgain:                BigInt(0x1) << BigInt(29),
  /** On if the game uses some piece values. */
  Value:                    BigInt(0x1) << BigInt(30),
  /** On if the game has some vote actions. */
  Vote:                     BigInt(0x1) << BigInt(31),
  /** On if the game has some Note actions. */
  Note:                     BigInt(0x1) << BigInt(32),
  /** On if the game involves loop. */
  Loops:                    BigInt(0x1) << BigInt(33),
  /** On if the game needs some adjacent step distance between sites. */
  StepAdjacentDistance:     BigInt(0x1) << BigInt(34),
  /** On if the game needs some orthogonal step distance between sites. */
  StepOrthogonalDistance:   BigInt(0x1) << BigInt(35),
  /** On if the game needs some diagonal step distance between sites. */
  StepDiagonalDistance:     BigInt(0x1) << BigInt(36),
  /** On if the game needs some off step distance between sites. */
  StepOffDistance:          BigInt(0x1) << BigInt(37),
  /** On if the game needs some neighbours step distance between sites. */
  StepAllDistance:          BigInt(0x1) << BigInt(38),
  /** On if the tracks on the game have an internal loop. */
  InternalLoopInTrack:      BigInt(0x1) << BigInt(39),
  /** On if the game uses a swap rule. */
  UsesSwapRule:             BigInt(0x1) << BigInt(40),
  /** On if the game checks the positional repetition in the game. */
  RepeatPositionalInGame:   BigInt(0x1) << BigInt(41),
  /** On if the game checks the positional repetition in the turn. */
  RepeatPositionalInTurn:   BigInt(0x1) << BigInt(42),
  /** On if the game uses some pending states/values. */
  PendingValues:            BigInt(0x1) << BigInt(43),
  /** On if the game uses some maps to values. */
  MapValue:                 BigInt(0x1) << BigInt(44),
  /** On if the game uses some values to remember. */
  RememberingValues:        BigInt(0x1) << BigInt(45),
  /** On if the game involves payoff. */
  Payoff:                   BigInt(0x1) << BigInt(46),
  /** On if the game checks the situational repetition in the game. */
  RepeatSituationalInGame:  BigInt(0x1) << BigInt(47),
  /** On if the game checks the situational repetition in the turn. */
  RepeatSituationalInTurn:  BigInt(0x1) << BigInt(48),
  /** On if the game checks the repetition of cycles. */
  CycleDetection:           BigInt(0x1) << BigInt(49),
} as const;

/** Name of a GameType flag. */
export type GameTypeFlagName = keyof typeof GameType;

/**
 * Returns true if the given flags bigint has the named GameType flag set.
 * @java game/types/state/GameType.java — flag test idiom: (flags & flag) != 0
 */
export function hasGameTypeFlag(flags: bigint, flag: bigint): boolean {
  return (flags & flag) !== BigInt(0);
}
