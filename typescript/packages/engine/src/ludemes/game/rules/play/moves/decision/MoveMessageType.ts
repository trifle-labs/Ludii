// @java Core/src/game/rules/play/moves/decision/MoveMessageType.java

/**
 * Defines the types of decision move relative to a message.
 *
 * @java game/rules/play/moves/decision/MoveMessageType.java
 *
 * Java original:
 *   public enum MoveMessageType { Propose, Vote }
 */

/** @java game/rules/play/moves/decision/MoveMessageType.java */
export enum MoveMessageType {
  /** Makes a propose move. */
  Propose = "Propose",
  /** Makes a vote move. */
  Vote = "Vote",
}
