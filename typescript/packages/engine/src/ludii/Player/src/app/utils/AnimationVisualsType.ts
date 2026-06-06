// @java Player/src/app/utils/AnimationVisualsType.java

/**
 * Different ways that moves can be animated.
 *
 * Faithful 1:1 port of app.utils.AnimationVisualsType.
 *
 * @author Matthew.Stephenson (Java original)
 * @java app.utils.AnimationVisualsType
 */
export enum AnimationVisualsType {
  /** No piece animation. */
  None = "None",

  /** Single action animation. */
  Single = "Single",

  /** All action animation. */
  All = "All",
}

// -------------------------------------------------------------------------

/**
 * Returns the AnimationVisualsType whose value matches the provided name.
 * @java AnimationVisualsType#getAnimationVisualsType(String)
 */
export function getAnimationVisualsType(name: string): AnimationVisualsType {
  for (const value of Object.values(AnimationVisualsType)) {
    if (value === name) return value;
  }
  return AnimationVisualsType.None;
}

// -------------------------------------------------------------------------
