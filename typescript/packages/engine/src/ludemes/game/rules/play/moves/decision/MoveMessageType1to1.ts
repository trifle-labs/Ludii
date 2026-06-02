/**
 * MoveMessageType1to1.ts
 *
 * @java game/rules/play/moves/decision/MoveMessageType.java
 *
 * Enum marker for decision move types relative to a message (propose / vote).
 *
 * Java original:
 *   public enum MoveMessageType { Propose, Vote }
 */

/** @java game/rules/play/moves/decision/MoveMessageType.java */
export enum MoveMessageType1to1 {
  /** Makes a propose move. @java MoveMessageType.Propose */
  Propose = "Propose",
  /** Makes a vote move. @java MoveMessageType.Vote */
  Vote = "Vote",
}
