// @java ViewController/src/view/container/aspects/axes/BoardAxis.java

import { Color, Font, Point } from '../../../../../../awt/index.js';
import type { Graphics2D } from '../../../../../../awt/index.js';
import { ContainerAxis } from './ContainerAxis.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java bridge.Bridge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bridge = any;

/** @java other.topology.AxisLabel */
interface AxisLabel {
	label(): string;
	posn(): { getX(): number; getY(): number };
}

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

// ---------------------------------------------------------------------------

/**
 * Board axis properties.
 *
 * Faithful 1:1 port of view.container.aspects.axes.BoardAxis.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.axes.BoardAxis
 */
export class BoardAxis extends ContainerAxis {

	/** @java BoardAxis#boardStyle */
	protected boardStyle: BoardStyle;

	// -------------------------------------------------------------------------

	/**
	 * @java BoardAxis#BoardAxis(view.container.styles.BoardStyle)
	 */
	constructor(boardStyle: BoardStyle) {
		super();
		this.boardStyle = boardStyle;
	}

	// -------------------------------------------------------------------------

	/**
	 * @java BoardAxis#drawAxes(bridge.Bridge, java.awt.Graphics2D)
	 */
	override drawAxes(bridge: Bridge, g2d: Graphics2D): void {
		const fontBufferSize: number =
			(bridge.settingsVC().displayFont() as Font).getSize() /
			(this.boardStyle.placement() as { getHeight(): number }).getHeight();
		const axisLabels: AxisLabel[] = this.getAxisLabels(fontBufferSize);

		const oldFont: Font = g2d.getFont();

		g2d.setFont(bridge.settingsVC().displayFont());
		g2d.setColor(new Color(0, 0, 0));

		for (const al of axisLabels) {
			const label: string = al.label();
			const drawPosn: Point = (this.boardStyle as { screenPosn(p: unknown): Point }).screenPosn(al.posn());
			// StringUtil.drawStringAtPoint — escape-hatched, draw directly
			this._drawStringAtPoint(g2d, label, drawPosn);
		}

		g2d.setFont(oldFont);
	}

	// -------------------------------------------------------------------------

	/**
	 * Determine the axis labels for the board.
	 * @java BoardAxis#getAxisLabels(double)
	 */
	protected getAxisLabels(fontSize: number): AxisLabel[] {
		const numCols: number = (this.boardStyle.container().topology() as {
			columns(siteType: unknown): unknown[];
		}).columns(this.boardStyle.container().defaultSite()).length;

		const numRows: number = (this.boardStyle.container().topology() as {
			rows(siteType: unknown): unknown[];
		}).rows(this.boardStyle.container().defaultSite()).length;

		const cellRadius: number = this.boardStyle.cellRadius();

		const axisLabels: AxisLabel[] = [];

		let minX = 9999.9;
		let minY = 9999.9;
		let maxX = -9999.9;
		let maxY = -9999.9;

		const graphElements = (this.boardStyle.topology() as {
			getGraphElements(siteType: unknown): Array<{ centroid(): { getX(): number; getY(): number } }>;
		}).getGraphElements(this.boardStyle.container().defaultSite());

		for (const v of graphElements) {
			const c = v.centroid();
			if (c.getX() < minX) minX = c.getX();
			if (c.getY() < minY) minY = c.getY();
			if (c.getX() > maxX) maxX = c.getX();
			if (c.getY() > maxY) maxY = c.getY();
		}

		if ((this.boardStyle.container().topology() as { numEdges(): number }).numEdges() === 4) {
			const dimRows = numRows;
			const dimCols = numCols;

			axisLabels.length = 0;

			for (let row = 0; row < dimRows; row++) {
				const label = String(row + 1);
				const x = minX - cellRadius - fontSize;
				const y = minY + cellRadius * 2 * row;
				axisLabels.push(this._makeAxisLabel(label, x, y));
			}

			for (let col = 0; col < dimCols; col++) {
				const label = String.fromCharCode('A'.charCodeAt(0) + col);
				const x = minX + cellRadius * 2 * col;
				const y = minY - cellRadius - fontSize;
				axisLabels.push(this._makeAxisLabel(label, x, y));
			}
		}

		return axisLabels;
	}

	// -------------------------------------------------------------------------

	/** Helper: build a minimal AxisLabel from a world-space position. */
	private _makeAxisLabel(label: string, x: number, y: number): AxisLabel {
		return {
			label: () => label,
			posn: () => ({ getX: () => x, getY: () => y }),
		};
	}

	/**
	 * Draw a string centred at the given screen point.
	 * (Escape-hatches StringUtil.drawStringAtPoint — replicates its core behaviour.)
	 */
	private _drawStringAtPoint(g2d: Graphics2D, str: string, posn: Point): void {
		const fm = g2d.getFontMetrics();
		const w = fm.stringWidth(str);
		const h = fm.getHeight();
		const tx = Math.trunc(posn.x - w / 2);
		const ty = Math.trunc(posn.y + h / 4);
		g2d.drawString(str, tx, ty);
	}

	// -------------------------------------------------------------------------
}
