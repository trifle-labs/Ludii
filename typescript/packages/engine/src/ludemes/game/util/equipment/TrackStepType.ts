// @java Core/src/game/types/board/TrackStepType.java
//
// Defines special step types for describing tracks on the board.

/**
 * Special step types for board tracks.
 *
 * @java game.types.board.TrackStepType
 */
export enum TrackStepType {
  /** Off the track. */
  Off = 0,

  /** End of the track. */
  End = 1,

  /** Repeat stepping in the current direction. */
  Repeat = 2,
}
