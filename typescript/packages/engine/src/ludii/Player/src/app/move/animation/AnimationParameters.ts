// @java Player/src/app/move/animation/AnimationParameters.java

import { Point } from "../../../../../awt/index.js";
import { AnimationType } from "./AnimationType.js";

/**
 * BufferedImage escape-hatch — for the animation pipeline we just need
 * a drawable image-like object; using `object` to avoid DOM type deps.
 *
 * @java java.awt.image.BufferedImage
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BufferedImage = object | null;

/**
 * Parameters needed for animating a move.
 *
 * @author Matthew.Stephenson
 * @java app.move.animation.AnimationParameters
 */
export class AnimationParameters {

	/** @java AnimationParameters#animationType */
	public readonly animationType: AnimationType;

	/** @java AnimationParameters#pieceImages */
	public readonly pieceImages: BufferedImage[];

	/** @java AnimationParameters#fromLocations */
	public readonly fromLocations: Point[];

	/** @java AnimationParameters#toLocations */
	public readonly toLocations: Point[];

	/** @java AnimationParameters#animationTimeMs */
	public readonly animationTimeMs: number;

	// -------------------------------------------------------------------------

	/**
	 * Default (empty) constructor.
	 * @java AnimationParameters()
	 */
	constructor();

	/**
	 * Full constructor.
	 * @java AnimationParameters(AnimationType, List<BufferedImage>, List<Point>, List<Point>, long)
	 */
	constructor(
		animationType: AnimationType,
		pieceImages: BufferedImage[],
		fromLocations: Point[],
		toLocations: Point[],
		animationWaitTime: number,
	);

	constructor(
		animationType?: AnimationType,
		pieceImages?: BufferedImage[],
		fromLocations?: Point[],
		toLocations?: Point[],
		animationWaitTime?: number,
	) {
		this.animationType = animationType ?? AnimationType.NONE;
		this.pieceImages = pieceImages ?? [];
		this.fromLocations = fromLocations ?? [];
		this.toLocations = toLocations ?? [];
		this.animationTimeMs = animationWaitTime ?? 0;
	}

	// -------------------------------------------------------------------------
}
