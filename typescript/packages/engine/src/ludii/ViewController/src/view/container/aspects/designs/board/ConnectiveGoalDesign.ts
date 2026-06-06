// @java ViewController/src/view/container/aspects/designs/board/ConnectiveGoalDesign.java

/**
 * Board design for Connective Goal boards.
 * Draws coloured region borders per player, clipped to each region's sector.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.ConnectiveGoalDesign.
 *
 * @author (Java original)
 * @java view.container.aspects.designs.board.ConnectiveGoalDesign
 */

// BoardDesign    -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/BoardDesign.ts
// BoardStyle     -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// awt            -> src/ludii/awt/index.ts

import {
	Color,
	BasicStroke,
	SVGGraphics2D,
	Graphics2D,
	GeneralPath,
	Point,
	Point2D,
	CAP_ROUND,
	JOIN_MITER,
} from '../../../../../../../awt/index.js';
import type { Stroke } from '../../../../../../../awt/index.js';
import { Bridge } from '../../../../../bridge/Bridge.js';
import { Properties } from '../../../../../../../../ludemes/game/util/graph/Properties.js';

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/** @java game.equipment.other.Regions */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Regions = any;

/** @java main.math.MathRoutines */
// Inlined helper for shade()
function shade(color: Color, factor: number): Color {
	const r = Math.min(255, Math.round(color.getRed() * factor));
	const g = Math.min(255, Math.round(color.getGreen() * factor));
	const b = Math.min(255, Math.round(color.getBlue() * factor));
	return new Color(r, g, b);
}

/** @java main.math.MathRoutines#distance(Point, Point) */
function distancePoints(a: Point, b: Point): number {
	return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * ConnectiveGoalDesign — renders coloured region borders for Connective Goal.
 *
 * @java view.container.aspects.designs.board.ConnectiveGoalDesign
 */
export class ConnectiveGoalDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// Fields inherited from BoardDesign (escape-hatch — set by setStrokesAndColours)

	/** @java BoardDesign#colorEdgesInner */
	protected colorEdgesInner: Color | null = null;
	/** @java BoardDesign#colorEdgesOuter */
	protected colorEdgesOuter: Color | null = null;
	/** @java BoardDesign#colorFillPhase0 */
	protected colorFillPhase0: Color | null = null;
	/** @java BoardDesign#colorFillPhase1 */
	protected colorFillPhase1: Color | null = null;
	/** @java BoardDesign#colorFillPhase2 */
	protected colorFillPhase2: Color | null = null;
	/** @java BoardDesign#colorFillPhase3 */
	protected colorFillPhase3: Color | null = null;
	/** @java BoardDesign#strokeThin */
	protected strokeThin: BasicStroke | null = null;
	/** @java BoardDesign#strokeThick */
	protected strokeThick: BasicStroke | null = null;
	/** @java BoardDesign#checkeredBoard */
	protected checkeredBoard = false;
	/** @java BoardDesign#straightLines */
	protected straightLines = false;

	// -----------------------------------------------------------------------

	/**
	 * @java ConnectiveGoalDesign#ConnectiveGoalDesign(BoardStyle, BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -----------------------------------------------------------------------

	/**
	 * fill, draw internal grid lines, draw symbols, draw outer border on top.
	 * @returns SVG as string.
	 * @java ConnectiveGoalDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		// Set all values
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const boardLineThickness: number = (this.boardStyle as any).cellRadiusPixels() / 15.0;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.checkeredBoard = context.game().metadata().graphics().checkeredBoard();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.straightLines  = context.game().metadata().graphics().straightRingLines();

		const swThin  = Math.max(1, boardLineThickness) as number;
		const swThick = swThin;

		this.setStrokesAndColours(
			bridge,
			context,
			new Color(120, 190, 240),
			new Color(120, 190, 240),
			new Color(210, 230, 255),
			new Color(210, 0, 0),
			new Color(0, 230, 0),
			new Color(0, 0, 255),
			null,
			null,
			new Color(0, 0, 0),
			swThin,
			swThick,
		);

		// Background
		this.drawGround(g2d, context, true);

		// Cells
		this.fillCells(bridge, g2d, context);

		// Edges
		this.drawOuterCellEdges(bridge, g2d, context);

		// Symbols
		this.drawSymbols(g2d, context);

		// Foreground
		this.drawGround(g2d, context, false);

		return g2d.getSVGDocument();
	}

	// -----------------------------------------------------------------------

	/**
	 * Draws coloured outer cell edges per region/player, clipped appropriately.
	 * @java ConnectiveGoalDesign#drawOuterCellEdges(Bridge, Graphics2D, Context)
	 */
	protected drawOuterCellEdges(bridge: Bridge, g2d: Graphics2D, context: Context): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const regionsList: Regions[] = context.game().equipment().regions() as Regions[];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const numPlayers: number = context.game().players().count() as number;

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const centre: Point2D = this.topology().centrePoint() as Point2D;
		const ptCentre: Point = this.screenPosn(centre);

		// Create a path for each player
		const paths: GeneralPath[] = [];
		for (let pid = 0; pid <= context.game().players().count(); pid++)
			paths.push(new GeneralPath());

		// Locate sites shared by more than one player
		const shared: Set<number>[] = [];
		for (let pid = 0; pid < numPlayers + 2; pid++)
			shared.push(new Set<number>());

		for (const regionsO of regionsList) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pid: number = regionsO.owner() as number;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const sites: number[] = regionsO.eval(context) as number[];
			for (const cid of sites)
				shared[pid]!.add(cid);
		}

		// Sites shared between any pair of players go into shared[0]
		for (let pidA = 1; pidA < shared.length; pidA++) {
			for (let pidB = 2; pidB < shared.length; pidB++) {
				if (pidA === pidB) continue;
				for (const v of shared[pidA]!) {
					if (shared[pidB]!.has(v))
						shared[0]!.add(v);
				}
			}
		}

		for (let pid = 1; pid < shared.length; pid++) {
			const intersection = new Set<number>();
			for (const v of shared[pid]!) {
				if (shared[0]!.has(v))
					intersection.add(v);
			}
			shared[pid] = intersection;
		}

		// Generate the paths (outer edges)
		for (const regionsO of regionsList) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pid: number = regionsO.owner() as number;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const sites: number[] = regionsO.eval(context) as number[];

			for (const site of sites) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const cell = this.topology().cells().get(site);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				for (const edge of (cell.edges() as any[])) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					if ((edge.properties() as any).get(Properties.OUTER)) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const va: Point2D = edge.vA().centroid() as Point2D;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const vb: Point2D = edge.vB().centroid() as Point2D;
						const ptA = this.screenPosn(va);
						const ptB = this.screenPosn(vb);
						paths[pid]!.moveTo(ptA.x, ptA.y);
						paths[pid]!.lineTo(ptB.x, ptB.y);
					}
				}
			}
		}

		// Draw the border and player colour in thick strokes
		const strokeThickWidth = this.strokeThick ? this.strokeThick.getLineWidth() : 1;
		const thickness = Math.trunc(4 * strokeThickWidth);
		const borderStroke = new BasicStroke(thickness + 2, CAP_ROUND, JOIN_MITER);
		const playerStroke: Stroke = new BasicStroke(thickness, CAP_ROUND, JOIN_MITER);

		// Draw each region, clipped as necessary
		const oldClip = g2d.getClip();

		for (const regionsO of regionsList) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((regionsO as any).region() == null) continue;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pid: number = regionsO.owner() as number;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const playerColour: Color = bridge.settingsColour().playerColour(context, pid) as Color;
			const borderColour: Color = shade(playerColour, 0.75);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			for (const region of ((regionsO as any).region() as any[])) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const sites: number[] = (region.eval(context) as any).sites() as number[];

				const path = new GeneralPath();

				let ptSharedA: Point | null = null;
				let ptSharedB: Point | null = null;

				for (const site of sites) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const cell = this.topology().cells().get(site);
					if (shared[0]!.has(site)) {
						// Shared cell: store pixel location
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const pt = this.screenPosn(cell.centroid() as Point2D);
						if (ptSharedA === null)
							ptSharedA = pt;
						else
							ptSharedB = pt;
					}

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					for (const edge of (cell.edges() as any[])) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						if ((edge.properties() as any).get(Properties.OUTER)) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const va: Point2D = edge.vA().centroid() as Point2D;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const vb: Point2D = edge.vB().centroid() as Point2D;
							const ptA = this.screenPosn(va);
							const ptB = this.screenPosn(vb);
							path.moveTo(ptA.x, ptA.y);
							path.lineTo(ptB.x, ptB.y);
						}
					}
				}

				g2d.setClip(oldClip);

				if (ptSharedA !== null && ptSharedB !== null) {
					// Clip triangle from centre to lines projected through shared cells
					const ax = ptCentre.x + 2 * (ptSharedA.x - ptCentre.x);
					const ay = ptCentre.y + 2 * (ptSharedA.y - ptCentre.y);
					const ptA = new Point(ax, ay);

					const bx = ptCentre.x + 2 * (ptSharedB.x - ptCentre.x);
					const by = ptCentre.y + 2 * (ptSharedB.y - ptCentre.y);
					const ptB = new Point(bx, by);

					const pathClip = new GeneralPath();
					pathClip.moveTo(ptCentre.x, ptCentre.y);
					pathClip.lineTo(ptA.x, ptA.y);
					pathClip.lineTo(ptB.x, ptB.y);
					pathClip.closePath();
					g2d.setClip(pathClip);
				} else if (ptSharedA !== null) {
					// Clip triangle from centre through the one shared cell
					const ax = ptCentre.x + 2 * (ptSharedA.x - ptCentre.x);
					const ay = ptCentre.y + 2 * (ptSharedA.y - ptCentre.y);
					const ptA = new Point(ax, ay);

					// Find furthest cell in region
					let ptBestB: Point | null = null;
					let maxDist = 0;

					for (const site of sites) {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const cell = this.topology().cells().get(site);
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const pt = this.screenPosn(cell.centroid() as Point2D);
						const dist = distancePoints(pt, ptA);
						if (dist > maxDist) {
							ptBestB = new Point(pt.x, pt.y);
							maxDist = dist;
						}
					}

					if (ptBestB === null) {
						console.log('** Failed to find furthest point.');
						return;
					}

					// Extend beyond further point
					const bestBx = ptA.x + Math.trunc(1.25 * (ptBestB.x - ptA.x));
					const bestBy = ptA.y + Math.trunc(1.25 * (ptBestB.y - ptA.y));
					ptBestB = new Point(bestBx, bestBy);

					const bx = ptCentre.x + 2 * (ptBestB.x - ptCentre.x);
					const by = ptCentre.y + 2 * (ptBestB.y - ptCentre.y);
					const ptB = new Point(bx, by);

					const pathClip = new GeneralPath();
					pathClip.moveTo(ptCentre.x, ptCentre.y);
					pathClip.lineTo(ptA.x, ptA.y);
					pathClip.lineTo(ptB.x, ptB.y);
					pathClip.closePath();
					g2d.setClip(pathClip);
				}

				// Draw extra thick line in dark border colour
				g2d.setColor(borderColour);
				g2d.setStroke(borderStroke);
				g2d.draw(path);

				// Draw thick line in player colour
				g2d.setColor(playerColour);
				g2d.setStroke(playerStroke);
				g2d.draw(path);
			}
		}

		g2d.setClip(oldClip);
	}

	// -----------------------------------------------------------------------
	// Delegation stubs — real implementations live in BoardDesign (batch 26).

	/** @java BoardDesign#setStrokesAndColours */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected setStrokesAndColours(...args: any[]): void {
		void args;
	}

	/** @java BoardDesign#drawGround */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected drawGround(_g2d: SVGGraphics2D, _context: Context, _background: boolean): void {
		// escape-hatch: BoardDesign not yet ported
	}

	/** @java BoardDesign#fillCells */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected fillCells(_bridge: Bridge, _g2d: SVGGraphics2D, _context: Context): void {
		// escape-hatch: BoardDesign not yet ported
	}

	/** @java BoardDesign#drawSymbols */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected drawSymbols(_g2d: SVGGraphics2D, _context: Context): void {
		// escape-hatch: BoardDesign not yet ported
	}

	/** @java BoardDesign#topology */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected topology(): any {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).topology() as any;
	}

	/** @java BoardDesign#screenPosn */
	protected screenPosn(posn: Point2D): Point {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).screenPosn(posn) as Point;
	}

	// -----------------------------------------------------------------------
}
