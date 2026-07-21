// @java Player/src/app/move/animation/AnimationType.java

/**
 * Different types of animation.
 *
 * @author Matthew.Stephenson
 * @java app.move.animation.AnimationType
 */
export enum AnimationType {
	/** No animation. */
	NONE = "NONE",

	/** Move between two locations. */
	DRAG = "DRAG",

	/** Pulse at a specified location. */
	PULSE = "PULSE",
}
