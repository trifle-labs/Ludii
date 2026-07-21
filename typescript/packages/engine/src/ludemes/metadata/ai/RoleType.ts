// @java Core/src/game/types/play/RoleType.java
// Local copy for metadata/ai use — covers only the values needed by
// FeatureSet, DecisionTree, LogitTree, and Intercept.

/**
 * Role-type enum for AI metadata use.
 * Mirrors the Java game.types.play.RoleType enum values.
 *
 * @author cambolbro / Dennis Soemers
 */
export type RoleType =
  | "Neutral"
  | "P1" | "P2" | "P3" | "P4" | "P5" | "P6" | "P7" | "P8"
  | "P9" | "P10" | "P11" | "P12" | "P13" | "P14" | "P15" | "P16"
  | "Team1" | "Team2" | "Team3" | "Team4" | "Team5" | "Team6"
  | "Team7" | "Team8" | "Team9" | "Team10" | "Team11" | "Team12"
  | "Team13" | "Team14" | "Team15" | "Team16"
  | "TeamMover"
  | "Each"
  | "Shared"
  | "All"
  | "Mover"
  | "Next"
  | "Prev"
  | "NonMover"
  | "Enemy"
  | "Friend"
  | "Ally"
  | "Player";
