/**
 * StrokeUtil.ts
 * @java ViewController/src/util/StrokeUtil.java
 *
 * Routines for getting strokes with specified properties.
 *
 * @author matthew.stephenson and cambolbro
 */

import { BasicStroke } from '../../../awt/index.js';
import type { LineStyle } from '../../../../ludemes/metadata/graphics/util/LineStyle.js';

/**
 * @java util.StrokeUtil
 */
export class StrokeUtil {

	/**
	 * Returns a BasicStroke corresponding to the given LineStyle.
	 *
	 * @java util.StrokeUtil#getStrokeFromStyle(metadata.graphics.util.LineStyle, java.awt.BasicStroke, java.awt.BasicStroke)
	 */
	public static getStrokeFromStyle(
		lineStyle: LineStyle,
		strokeThin: BasicStroke,
		strokeThick: BasicStroke,
	): BasicStroke | null {
		switch (lineStyle) {
			case 'Hidden':
				return new BasicStroke(0);
			case 'Thick':
				return strokeThick;
			case 'ThickDashed':
				return StrokeUtil.getDashedStroke(strokeThick.getLineWidth());
			case 'ThickDotted':
				return StrokeUtil.getDottedStroke(strokeThick.getLineWidth());
			case 'Thin':
				return strokeThin;
			case 'ThinDashed':
				return StrokeUtil.getDashedStroke(strokeThin.getLineWidth());
			case 'ThinDotted':
				return StrokeUtil.getDottedStroke(strokeThin.getLineWidth());
			default:
				return null;
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * @java util.StrokeUtil#getDashedStroke(float)
	 */
	public static getDashedStroke(strokeWidth: number): BasicStroke {
		const dash: number[] = [strokeWidth * 3, strokeWidth * 3];
		return new BasicStroke(
			strokeWidth,
			BasicStroke.CAP_BUTT,
			BasicStroke.JOIN_ROUND,
			0.0,
			dash,
			0.0,
		);
	}

	// -------------------------------------------------------------------------

	/**
	 * @java util.StrokeUtil#getDottedStroke(float)
	 */
	public static getDottedStroke(strokeWidth: number): BasicStroke {
		const dash: number[] = [0.0, strokeWidth * 2.5];
		return new BasicStroke(
			strokeWidth,
			BasicStroke.CAP_ROUND,
			BasicStroke.JOIN_ROUND,
			0.0,
			dash,
			0.0,
		);
	}

	// -------------------------------------------------------------------------
}
