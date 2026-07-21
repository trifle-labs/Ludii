// @java ViewController/src/util/ArrowUtil.java

import { Graphics2D, BasicStroke } from '../../../../ludii/awt/index.js';
import type { Stroke } from '../../../../ludii/awt/index.js';

/**
 * Function for drawing arrows on the view.
 *
 * @author Matthew.Stephenson
 * @java util.ArrowUtil
 */
export class ArrowUtil {

	/**
	 * Helper method to draw a straight arrow.
	 * https://stackoverflow.com/a/27461352/6735980
	 *
	 * @java util.ArrowUtil#drawArrow
	 */
	static drawArrow(
		g2d: Graphics2D,
		startX: number,
		startY: number,
		endX: number,
		endY: number,
		lineWidth: number,
		headWidth: number,
		headHeight: number,
	): void {
		const dx = endX - startX;
		const dy = endY - startY;
		const D = Math.sqrt(dx * dx + dy * dy);
		let xm = D - headHeight;
		let xn = xm;
		let ym = headWidth;
		let yn = -headWidth;

		const sin = dy / D;
		const cos = dx / D;

		let x = xm * cos - ym * sin + startX;
		ym = xm * sin + ym * cos + startY;
		xm = x;

		x = xn * cos - yn * sin + startX;
		yn = xn * sin + yn * cos + startY;
		xn = x;

		const xpoints: number[] = [endX, Math.trunc(xm), Math.trunc(xn)];
		const ypoints: number[] = [endY, Math.trunc(ym), Math.trunc(yn)];

		const oldStroke: Stroke = g2d.getStroke();
		g2d.setStroke(new BasicStroke(lineWidth, BasicStroke.CAP_ROUND, BasicStroke.JOIN_MITER));
		g2d.drawLine(startX, startY, Math.trunc((xm + xn) / 2), Math.trunc((ym + yn) / 2));
		g2d.setStroke(oldStroke);

		g2d.fillPolygon(xpoints, ypoints, 3);
	}

	// -------------------------------------------------------------------------

}
