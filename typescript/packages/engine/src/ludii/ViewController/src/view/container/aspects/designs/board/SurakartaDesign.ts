// @java ViewController/src/view/container/aspects/designs/board/SurakartaDesign.java

/**
 * Custom board rendering for Surakarta-type boards.
 *
 * Draws a filled board, grid lines, and curved track loops around the
 * corners using the board's track data.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.SurakartaDesign.
 *
 * @author cambolbro and matthew.stephenson (Java original)
 * @java view.container.aspects.designs.board.SurakartaDesign
 */

// BoardDesign    -> batch 26
// BoardStyle     -> batch 23
// BoardPlacement -> batch 28
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// awt shims      -> src/ludii/awt/index.ts
// Track / TrackElem -> src/ludemes/game/equipment/container/board/Track.ts
// SiteType       -> src/ludemes/other/action/SiteType.ts

import {
	Color,
	GeneralPath,
	SVGGraphics2D,
	Point,
} from '../../../../../../../awt/index.js';
import { Bridge } from '../../../../../bridge/Bridge.js';

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/** @java game.types.board.SiteType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteType = any;

/** @java other.topology.Edge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyEdge = any;

/** @java game.equipment.container.board.Track */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Track = any;

/** @java game.equipment.container.board.Track.Elem */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TrackElem = any;

/** @java java.awt.geom.Point2D */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Point2D = any;

/**
 * SurakartaDesign — renders Surakarta-type boards with coloured track loops.
 *
 * @java view.container.aspects.designs.board.SurakartaDesign
 */
export class SurakartaDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// ---- Inherited fields (escape-hatched) ----
	/** @java BoardDesign#colorEdgesInner */
	protected colorEdgesInner: Color | null = null;
	/** @java BoardDesign#colorEdgesOuter */
	protected colorEdgesOuter: Color | null = null;
	/** @java BoardDesign#colorFillPhase0 */
	protected colorFillPhase0: Color | null = null;
	/** @java BoardDesign#strokeThin */
	protected strokeThin: unknown = null;
	/** @java BoardDesign#strokeThick */
	protected strokeThick: unknown = null;
	/** @java BoardDesign#colorSymbol */
	protected colorSymbol: Color | null = null;

	// -------------------------------------------------------------------------

	/** The colour of the board loops — one per loop pair. */
	private readonly loopColours: Color[] = [
		new Color(  0, 175,   0),
		new Color(230,  50,  20),
		new Color(  0, 100, 200),
		new Color(150, 150,   0),
		new Color(150,   0, 150),
		new Color(  0, 150, 150),
	];

	// -------------------------------------------------------------------------

	/**
	 * @java SurakartaDesign#SurakartaDesign(view.container.styles.BoardStyle,
	 *   view.container.aspects.placement.BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -------------------------------------------------------------------------

	/**
	 * @returns SVG as string.
	 * @java SurakartaDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const width: number = (this.boardStyle as any).placement().width;
		const swThin  = Math.max(1, 0.005 * width + 0.5);
		const swThick = 2 * swThin;

		this.setStrokesAndColours(
			bridge,
			context,
			new Color(50, 150, 255),
			null,
			new Color(180, 230, 255),
			new Color(0, 175, 0),
			new Color(230, 50, 20),
			new Color(0, 100, 200),
			null,
			null,
			null,
			swThin,
			swThick,
		);

		this.drawBoard(g2d);

		return g2d.getSVGDocument();
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws the board design, dispatching on basis type.
	 * @java SurakartaDesign#drawBoard(java.awt.Graphics2D)
	 */
	protected drawBoard(g2d: SVGGraphics2D): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const basis: string = (this as any).topology().graph().basis().toString();
		switch (basis) {
		case 'Square':
			this.drawBoardSquare(g2d);
			break;
		case 'Triangular':
			this.drawBoardTriangular(g2d);
			break;
		default:
			console.warn('** Board type ' + basis + ' not supported for Surakarta.');
			break;
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws the board design for a square basis.
	 * @java SurakartaDesign#drawBoardSquare(java.awt.Graphics2D)
	 */
	protected drawBoardSquare(g2d: SVGGraphics2D): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const topology: any = (this as any).topology();
		const rows: number = this.boardStyle.container().topology().rows('Vertex' as SiteType).size();
		const cols: number = this.boardStyle.container().topology().columns('Vertex' as SiteType).size();

		// Get four corner points
		const ptSW: Point = this.screenPosn(topology.vertices().get(0).centroid());
		const ptNW: Point = this.screenPosn(topology.vertices().get(rows * cols - cols).centroid());
		const ptNE: Point = this.screenPosn(topology.vertices().get(rows * cols - 1).centroid());
		const ptSE: Point = this.screenPosn(topology.vertices().get(cols - 1).centroid());

		// Fill the board area
		if (this.colorFillPhase0 !== null) g2d.setColor(this.colorFillPhase0);
		const border = new GeneralPath();
		border.moveTo(ptSW.x, ptSW.y);
		border.lineTo(ptNW.x, ptNW.y);
		border.lineTo(ptNE.x, ptNE.y);
		border.lineTo(ptSE.x, ptSE.y);
		border.closePath();
		g2d.fill(border);

		// Draw the grid lines
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.setThinStroke(g2d);
		if (this.colorEdgesInner !== null) g2d.setColor(this.colorEdgesInner);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const edges: TopologyEdge[] = topology.edges();
		for (const edge of edges) {
			const ptA: Point = this.screenPosn(edge.vA().centroid());
			const ptB: Point = this.screenPosn(edge.vB().centroid());
			g2d.drawLine(ptA.x, ptA.y, ptB.x, ptB.y);
		}
		g2d.draw(border);

		// Draw the tracks
		this.setThickStroke(g2d);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const tracks: Track[] = this.boardStyle.container().tracks();
		for (let t = 0; t < tracks.length; t += 2) {
			g2d.setColor(this.loopColours[(Math.trunc(t / 2)) % tracks.length % this.loopColours.length]!);
			const track: Track = tracks[t]!;
			const elems: TrackElem[] = track.elems();

			for (let e = 0; e < elems.length; e++) {
				const elemM: TrackElem = elems[e]!;
				const elemN: TrackElem = elems[(e + 1) % elems.length]!;

				const ptM: Point = this.screenPosn(topology.vertices().get(elemM.site).centroid());
				const ptN: Point = this.screenPosn(topology.vertices().get(elemN.site).centroid());

				if (elemM.bump > 0) {
					// Previous pair is speed bump: draw loop
					const rowM = Math.trunc(elemM.site / cols);
					const colM = elemM.site % cols;
					const rowN = Math.trunc(elemN.site / cols);
					const colN = elemN.site % cols;

					if ((rowM === 0 || rowN === 0) && (colM === 0 || colN === 0)) {
						// SW corner
						const r = Math.trunc(SurakartaDesign.ptDistance(ptM, ptSW) + 0.5);
						g2d.drawArc(ptSW.x - r, ptSW.y - r, 2 * r, 2 * r, 90, 270);
					} else if ((rowM === rows - 1 || rowN === rows - 1) && (colM === 0 || colN === 0)) {
						// NW corner
						const r = Math.trunc(SurakartaDesign.ptDistance(ptM, ptNW) + 0.5);
						g2d.drawArc(ptNW.x - r, ptNW.y - r, 2 * r, 2 * r, 0, 270);
					} else if ((rowM === rows - 1 || rowN === rows - 1) && (colM === cols - 1 || colN === cols - 1)) {
						// NE corner
						const r = Math.trunc(SurakartaDesign.ptDistance(ptM, ptNE) + 0.5);
						g2d.drawArc(ptNE.x - r, ptNE.y - r, 2 * r, 2 * r, 270, 270);
					} else if ((rowM === 0 || rowN === 0) && (colM === cols - 1 || colN === cols - 1)) {
						// SE corner
						const r = Math.trunc(SurakartaDesign.ptDistance(ptM, ptSE) + 0.5);
						g2d.drawArc(ptSE.x - r, ptSE.y - r, 2 * r, 2 * r, 180, 270);
					}
				} else {
					// Draw line
					g2d.drawLine(ptM.x, ptM.y, ptN.x, ptN.y);
				}
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws the board design for a triangular basis.
	 * @java SurakartaDesign#drawBoardTriangular(java.awt.Graphics2D)
	 */
	protected drawBoardTriangular(g2d: SVGGraphics2D): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const topology: any = (this as any).topology();
		const rows: number = this.boardStyle.container().topology().rows('Vertex' as SiteType).size();

		const ptSW:  Point = this.screenPosn(topology.vertices().get(0).centroid());
		const ptTop: Point = this.screenPosn(topology.vertices().get(topology.vertices().size() - 1).centroid());
		const ptSE:  Point = this.screenPosn(topology.vertices().get(rows - 1).centroid());

		// Fill the board area
		if (this.colorFillPhase0 !== null) g2d.setColor(this.colorFillPhase0);
		const border = new GeneralPath();
		border.moveTo(ptSW.x,  ptSW.y);
		border.lineTo(ptTop.x, ptTop.y);
		border.lineTo(ptSE.x,  ptSE.y);
		border.closePath();
		g2d.fill(border);

		// Draw the grid lines
		this.setThinStroke(g2d);
		if (this.colorEdgesInner !== null) g2d.setColor(this.colorEdgesInner);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const edges: TopologyEdge[] = topology.edges();
		for (const edge of edges) {
			const ptA: Point = this.screenPosn(edge.vA().centroid());
			const ptB: Point = this.screenPosn(edge.vB().centroid());
			g2d.drawLine(ptA.x, ptA.y, ptB.x, ptB.y);
		}
		g2d.draw(border);

		// Draw the tracks
		this.setThickStroke(g2d);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const tracks: Track[] = this.boardStyle.container().tracks();
		for (let t = 0; t < tracks.length; t += 2) {
			g2d.setColor(this.loopColours[(Math.trunc(t / 2)) % tracks.length % this.loopColours.length]!);
			const track: Track = tracks[t]!;
			const elems: TrackElem[] = track.elems();

			for (let e = 0; e < elems.length; e++) {
				const elemM: TrackElem = elems[e]!;
				const elemN: TrackElem = elems[(e + 1) % elems.length]!;

				const ptM: Point = this.screenPosn(topology.vertices().get(elemM.site).centroid());
				const ptN: Point = this.screenPosn(topology.vertices().get(elemN.site).centroid());

				if (elemM.bump > 0) {
					const diff = elemN.site - elemM.site;

					if (diff > 0 && diff <= Math.trunc(rows / 2)) {
						// Top corner loop
						const ptRef = ptTop;
						const r = Math.trunc(SurakartaDesign.ptDistance(ptM, ptRef) * Math.sqrt(3) / 2 + 0.5);

						const ax = ptRef.x + Math.trunc(r * Math.cos(Math.toRadians(210)) - 0.5);
						const ay = ptRef.y - Math.trunc(r * Math.sin(Math.toRadians(210)) + 0.5);
						g2d.drawLine(ptM.x, ptM.y, ax, ay);
						g2d.drawArc(ptRef.x - r, ptRef.y - r, 2 * r, 2 * r, 330, 240);

						const r2 = Math.trunc(SurakartaDesign.ptDistance(ptM, ptRef) + 0.5);
						const bx = ptRef.x + Math.trunc(r * Math.cos(Math.toRadians(330)) + 0.5);
						const by = ptRef.y - Math.trunc(r * Math.sin(Math.toRadians(330)) + 0.5);
						const cx = ptRef.x + Math.trunc(r2 * Math.cos(Math.toRadians(300)) + 0.5);
						const cy = ptRef.y - Math.trunc(r2 * Math.sin(Math.toRadians(300)) + 0.5);
						g2d.drawLine(bx, by, cx, cy);
					} else if (diff >= Math.trunc(rows / 2)) {
						// Bottom left corner loop
						const ptRef = ptSW;
						const r = Math.trunc(SurakartaDesign.ptDistance(ptM, ptRef) * Math.sqrt(3) / 2 + 0.5);

						const ax = ptRef.x + Math.trunc(r * Math.cos(Math.toRadians(330)) + 0.5);
						const ay = ptRef.y - Math.trunc(r * Math.sin(Math.toRadians(330)) - 0.5);
						g2d.drawLine(ptM.x, ptM.y, ax, ay);
						g2d.drawArc(ptRef.x - r, ptRef.y - r, 2 * r, 2 * r, 90, 240);

						const r2 = Math.trunc(SurakartaDesign.ptDistance(ptM, ptRef) + 0.5);
						const bx = ptRef.x + Math.trunc(r * Math.cos(Math.toRadians(90)) + 0.5);
						const by = ptRef.y - Math.trunc(r * Math.sin(Math.toRadians(90)) + 0.5);
						const cx = ptRef.x + Math.trunc(r2 * Math.cos(Math.toRadians(60)) + 0.5);
						const cy = ptRef.y - Math.trunc(r2 * Math.sin(Math.toRadians(60)) + 0.5);
						g2d.drawLine(bx, by, cx, cy);
					} else if (diff < -(Math.trunc(rows / 2))) {
						// Bottom right corner loop
						const ptRef = ptSE;
						const r = Math.trunc(SurakartaDesign.ptDistance(ptM, ptRef) * Math.sqrt(3) / 2 + 0.5);

						const ax = ptRef.x + Math.trunc(r * Math.cos(Math.toRadians(90)) + 0.5);
						const ay = ptRef.y - Math.trunc(r * Math.sin(Math.toRadians(90)) + 0.5);
						g2d.drawLine(ptM.x, ptM.y, ax, ay);
						g2d.drawArc(ptRef.x - r, ptRef.y - r, 2 * r, 2 * r, 210, 240);

						const r2 = Math.trunc(SurakartaDesign.ptDistance(ptM, ptRef) + 0.5);
						const bx = ptRef.x + Math.trunc(r * Math.cos(Math.toRadians(210)) + 0.5);
						const by = ptRef.y - Math.trunc(r * Math.sin(Math.toRadians(210)) + 0.5);
						const cx = ptRef.x + Math.trunc(r2 * Math.cos(Math.toRadians(180)) + 0.5);
						const cy = ptRef.y - Math.trunc(r2 * Math.sin(Math.toRadians(180)) + 0.5);
						g2d.drawLine(bx, by, cx, cy);
					}
				} else {
					// Draw line
					g2d.drawLine(ptM.x, ptM.y, ptN.x, ptN.y);
				}
			}
		}
	}

	// -------------------------------------------------------------------------
	// Helper: Euclidean distance between two Points (replaces MathRoutines.distance)

	/** @java main.math.MathRoutines#distance(java.awt.Point, java.awt.Point) */
	private static ptDistance(a: Point, b: Point): number {
		const dx = a.x - b.x;
		const dy = a.y - b.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	// -------------------------------------------------------------------------
	// Delegation stubs — real implementations live in BoardDesign (batch 26).

	/** @java BoardDesign#setStrokesAndColours */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected setStrokesAndColours(...args: any[]): void {
		void args;
	}

	/** @java BoardDesign#screenPosn */
	protected screenPosn(posn: Point2D): Point {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).screenPosn(posn);
	}

	/** @java BoardDesign#topology */
	protected topology(): unknown {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).topology();
	}

	/** Sets the thin stroke on the graphics context. */
	private setThinStroke(g2d: SVGGraphics2D): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (this.strokeThin !== null) g2d.setStroke(this.strokeThin as any);
	}

	/** Sets the thick stroke on the graphics context. */
	private setThickStroke(g2d: SVGGraphics2D): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (this.strokeThick !== null) g2d.setStroke(this.strokeThick as any);
	}

	// -------------------------------------------------------------------------
}

// Utility: Math.toRadians is not standard JS — inline it
declare global {
	interface Math {
		toRadians(deg: number): number;
	}
}
Math.toRadians = (deg: number): number => (deg * Math.PI) / 180;
