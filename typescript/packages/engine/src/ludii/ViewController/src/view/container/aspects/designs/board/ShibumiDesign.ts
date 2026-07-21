// @java ViewController/src/view/container/aspects/designs/board/ShibumiDesign.java

import {
	Color,
	GeneralPath,
	Ellipse2D,
	AffineTransform,
	WIND_EVEN_ODD,
} from '../../../../../../../awt/index.js';
import type { SVGGraphics2D, Point } from '../../../../../../../awt/index.js';
import { BoardDesign } from '../BoardDesign.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java bridge.Bridge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bridge = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

// ---------------------------------------------------------------------------

/**
 * Shibumi board design.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.ShibumiDesign.
 *
 * @author cambolbro (Java original)
 * @java view.container.aspects.designs.board.ShibumiDesign
 */
export class ShibumiDesign extends BoardDesign {

	// -------------------------------------------------------------------------

	/**
	 * @java ShibumiDesign#ShibumiDesign(view.container.styles.BoardStyle, view.container.aspects.placement.BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		super(boardStyle, boardPlacement);
	}

	// -------------------------------------------------------------------------

	/**
	 * @java ShibumiDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	override createSVGImage(bridge: Bridge, context: Context): string | null {
		const g2d: SVGGraphics2D = this.boardStyle.setSVGRenderingValues();

		const swRatio: number = 5 / 1000.0;
		const swThin: number  = Math.max(1, Math.trunc(swRatio * this.boardStyle.placement().width + 0.5));
		const swThick: number = 2 * swThin;

		this.setStrokesAndColours(
			bridge, context,
			null, null, null, null,
			new Color(66, 165, 245),
			new Color(255, 255, 255),
			null, null, null,
			swThin, swThick
		);

		this.drawBoardOutline(g2d);

		return (g2d as unknown as { getSVGDocument(): string }).getSVGDocument();
	}

	// -------------------------------------------------------------------------

	/**
	 * @java ShibumiDesign#drawBoardOutline(org.jfree.graphics2d.svg.SVGGraphics2D)
	 */
	override drawBoardOutline(g2d: SVGGraphics2D): void {
		const corners = (this.topology() as {
			corners(siteType: string): Array<{ centroid(): { getX(): number; getY(): number } }>;
		}).corners('Vertex');

		const rO: number = Math.trunc(this.boardStyle.cellRadiusPixels() * 1.1);
		const rI: number = Math.trunc(this.boardStyle.cellRadiusPixels() * 0.75);

		const pts: Point[] = [
			this.boardStyle.screenPosn(corners[0]!.centroid()),
			this.boardStyle.screenPosn(corners[2]!.centroid()),
			this.boardStyle.screenPosn(corners[3]!.centroid()),
			this.boardStyle.screenPosn(corners[1]!.centroid()),
		];

		// Destructure to avoid TS undefined-index errors
		const [p0, p1, p2, p3] = pts as [Point, Point, Point, Point];

		const path = new GeneralPath(WIND_EVEN_ODD);

		// Outer board shape with rounded corners
		path.moveTo(p3.x, p3.y + rO);
		path.quadTo(p3.x + rO, p3.y + rO, p3.x + rO, p3.y);
		path.lineTo(p2.x + rO, p2.y);
		path.quadTo(p2.x + rO, p2.y - rO, p2.x, p2.y - rO);
		path.lineTo(p1.x, p1.y - rO);
		path.quadTo(p1.x - rO, p1.y - rO, p1.x - rO, p1.y);
		path.lineTo(p0.x - rO, p0.y);
		path.quadTo(p0.x - rO, p0.y + rO, p0.x, p0.y + rO);
		path.closePath();

		// Cut out holes for playable sites
		for (const vertex of (this.topology() as {
			vertices(): Array<{ layer(): number; centroid(): { getX(): number; getY(): number } }>;
		}).vertices()) {
			if (vertex.layer() === 0) {
				const pt: Point = this.boardStyle.screenPosn(vertex.centroid());
				const shape = new Ellipse2D.Double(pt.x - rI, pt.y - rI, 2 * rI, 2 * rI);
				path.append(shape, false);
			}
		}

		// Dark base
		g2d.setColor(new Color(60, 120, 200));
		const atDown = new AffineTransform();
		atDown.translate(0, rI / 4);
		// path.transform is not in the shim — escape-hatch: apply via g2d transform
		g2d.setTransform(atDown);
		g2d.fill(path);
		g2d.setTransform(new AffineTransform());

		// Light surface
		g2d.setColor(new Color(80, 170, 255));
		const atUp = new AffineTransform();
		atUp.translate(0, -rI / 4);
		g2d.setTransform(atUp);
		g2d.fill(path);
		g2d.setTransform(new AffineTransform());
	}

	// -------------------------------------------------------------------------
}
