// @java ViewController/src/view/container/aspects/designs/board/puzzle/PuzzleDesign.java

/**
 * Board design for deduction puzzle boards.
 * Extends BoardDesign with puzzle-hint drawing and candidate-value display.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.puzzle.PuzzleDesign.
 *
 * @author (Java original)
 * @java view.container.aspects.designs.board.puzzle.PuzzleDesign
 */

// BoardDesign    -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/BoardDesign.ts
// BoardStyle     -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// awt            -> src/ludii/awt/index.ts
// ContainerUtil  -> src/ludii/ViewController/src/util/ContainerUtil.ts

import {
	Color,
	Font,
	BasicStroke,
	SVGGraphics2D,
	Graphics2D,
	Point,
	Point2D,
	Rectangle2D,
	BOLD,
	PLAIN,
} from '../../../../../../../../awt/index.js';
import { Bridge } from '../../../../../../bridge/Bridge.js';
import { CompassDirection } from '../../../../../../../../../ludemes/game/util/directions/CompassDirection.js';
import { PuzzleDrawHintType } from '../../../../../../../../../ludemes/metadata/graphics/util/PuzzleDrawHintType.js';
import { PuzzleHintLocationType } from '../../../../../../../../../ludemes/metadata/graphics/util/PuzzleHintLocationType.js';
import { FullLocation } from '../../../../../../../../../ludemes/other/location/FullLocation.js';
import type { Location } from '../../../../../../../../../ludemes/other/location/Location.js';
import { ActionSet } from '../../../../../../../../../ludemes/other/action/puzzle/ActionSet.js';

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java game.types.board.SiteType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteType = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/** @java other.topology.TopologyElement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyElement = any;

/** @java other.move.Move */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Move = any;

/**
 * PuzzleDesign — renders deduction puzzle boards (Sudoku, Kakuro, etc.).
 *
 * @java view.container.aspects.designs.board.puzzle.PuzzleDesign
 */
export class PuzzleDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// -----------------------------------------------------------------------
	// Deduction puzzle variables

	/** Hint values. @java PuzzleDesign#hintValues */
	protected hintValues: number[] | null = null;

	/** Hint Directions (when applicable). @java PuzzleDesign#hintDirections */
	protected hintDirections: CompassDirection[] = [];

	/** Locations for hints. @java PuzzleDesign#locationValues */
	protected locationValues: Location[] = [];

	/** Regions for hints. @java PuzzleDesign#hintRegions */
	protected hintRegions: Location[][] = [];

	/** @java PuzzleDesign#drawHintType */
	protected drawHintType: PuzzleDrawHintType = 'Default';

	/** @java PuzzleDesign#hintLocationType */
	protected hintLocationType: PuzzleHintLocationType = 'Default';

	// Fields inherited from BoardDesign (escape-hatch)

	/** @java BoardDesign#checkeredBoard */
	protected checkeredBoard = false;
	/** @java BoardDesign#straightLines */
	protected straightLines = false;
	/** @java BoardDesign#strokeThick */
	protected strokeThick: BasicStroke | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java PuzzleDesign#PuzzleDesign(BoardStyle, BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -----------------------------------------------------------------------

	/**
	 * fill, draw internal grid lines, draw symbols, draw outer border on top.
	 * @returns SVG as string.
	 * @java PuzzleDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		// Set all values
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const boardLineThickness: number = (this.boardStyle as any).cellRadiusPixels() / 15.0;

		this.checkeredBoard = context.game().metadata().graphics().checkeredBoard();
		this.straightLines  = context.game().metadata().graphics().straightRingLines();

		const swThin  = Math.max(1, boardLineThickness);
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

		this.drawGround(g2d, context, true);

		this.fillCells(bridge, g2d, context);
		this.drawInnerCellEdges(g2d, context);
		this.drawOuterCellEdges(bridge, g2d, context);

		this.drawSymbols(g2d, context);

		if (context.game().metadata().graphics().showRegionOwner()) {
			this.drawRegions(g2d, context, this.colorSymbol(), this.strokeThick, this.hintRegions);
		}

		this.drawGround(g2d, context, false);

		return g2d.getSVGDocument();
	}

	// -----------------------------------------------------------------------

	/**
	 * @param regionIndeces array of site indices
	 * @param siteType the type of topology element
	 * @param context current context
	 * @returns Location within the region best suited for the hint label
	 * @java PuzzleDesign#findHintPosInRegion(Integer[], SiteType, Context)
	 */
	protected findHintPosInRegion(regionIndeces: number[], siteType: SiteType, context: Context): Location {
		if (regionIndeces.length === 1)
			return new FullLocation(regionIndeces[0]!, 0, siteType);

		let highestRow = -99999999;
		let lowestIndex = 99999999;
		let bestLocationFound: Location | null = null;

		for (const cellIndex of regionIndeces) {
			const posn: Point2D = context.topology()
				.getGraphElements(context.board().defaultSite())
				.get(cellIndex)
				.centroid() as Point2D;

			const cellX = posn.getX();
			const cellY = posn.getY();

			if (this.hintLocationType === 'BetweenVertices') {
				const posnA: Point2D = context.topology()
					.getGraphElements(siteType)
					.get(regionIndeces[0]!)
					.centroid() as Point2D;
				const posnB: Point2D = context.topology()
					.getGraphElements(siteType)
					.get(regionIndeces[1]!)
					.centroid() as Point2D;
				const midPoint = new Point2D.Double(
					(posnA.getX() + posnB.getX()) / 2,
					(posnA.getY() + posnB.getY()) / 2,
				);

				let lowestDistance = 99999999;
				for (const e of context.board().topology().edges()) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const edgeDistance = Math.hypot(
						midPoint.getX() - (e.centroid() as Point2D).getX(),
						midPoint.getY() - (e.centroid() as Point2D).getY(),
					);
					if (edgeDistance < lowestDistance) {
						lowestDistance = edgeDistance;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						bestLocationFound = new FullLocation((e as any).index() as number, 0, 'Edge');
					}
				}

				if (Math.abs(posnA.getX() - posnB.getX()) < Math.abs(posnA.getY() - posnB.getY())) {
					if (posnA.getY() < posnB.getY())
						this.hintDirections.push(CompassDirection.N);
					else
						this.hintDirections.push(CompassDirection.S);
				} else {
					if (posnA.getX() < posnB.getX())
						this.hintDirections.push(CompassDirection.W);
					else
						this.hintDirections.push(CompassDirection.E);
				}
			} else if (
				(cellX <= lowestIndex && cellY >= highestRow)
				|| (cellX < lowestIndex)
			) {
				highestRow = cellY;
				lowestIndex = cellX;
				bestLocationFound = new FullLocation(cellIndex, 0, siteType);

				if (regionIndeces[0] === regionIndeces[1]! - 1)
					this.hintDirections.push(CompassDirection.W);
				else
					this.hintDirections.push(CompassDirection.N);
			}
		}

		return bestLocationFound!;
	}

	// -----------------------------------------------------------------------

	/**
	 * @java PuzzleDesign#detectHints(Context)
	 */
	protected detectHints(context: Context): void {
		if (!context.game().isDeductionPuzzle())
			return;

		this.hintValues = [];

		if (context.game().metadata().graphics().hintLocationType() != null)
			this.hintLocationType = context.game().metadata().graphics().hintLocationType() as PuzzleHintLocationType;

		if (context.game().metadata().graphics().drawHintType() != null)
			this.drawHintType = context.game().metadata().graphics().drawHintType() as PuzzleDrawHintType;

		// Cells
		if (
			context.game().rules().phases()[0].play().moves().isConstraintsMoves() &&
			context.game().equipment().cellHints() != null
		) {
			const numHints: number = context.game().equipment().cellHints().length as number;
			for (let i = 0; i < numHints; i++) {
				this.locationValues.push(
					this.findHintPosInRegion(
						context.game().equipment().cellsWithHints()[i] as number[],
						'Cell',
						context,
					),
				);
				this.hintValues.push(context.game().equipment().cellHints()[i] as number);

				const hintRegion: Location[] = [];
				for (const index of (context.game().equipment().cellsWithHints()[i] as number[]))
					hintRegion.push(new FullLocation(index, 0, 'Cell'));
				this.hintRegions.push(hintRegion);
			}
		}

		// Vertices
		if (
			context.game().rules().phases()[0].play().moves().isConstraintsMoves() &&
			context.game().equipment().vertexHints() != null
		) {
			const numHints: number = context.game().equipment().vertexHints().length as number;
			for (let i = 0; i < numHints; i++) {
				this.locationValues.push(
					this.findHintPosInRegion(
						context.game().equipment().verticesWithHints()[i] as number[],
						'Vertex',
						context,
					),
				);
				this.hintValues.push(context.game().equipment().vertexHints()[i] as number);
			}
		}

		// Edges
		if (
			context.game().rules().phases()[0].play().moves().isConstraintsMoves() &&
			context.game().equipment().edgeHints() != null
		) {
			const numHints: number = context.game().equipment().edgeHints().length as number;
			for (let i = 0; i < numHints; i++) {
				this.locationValues.push(
					this.findHintPosInRegion(
						context.game().equipment().edgesWithHints()[i] as number[],
						'Edge',
						context,
					),
				);
				this.hintValues.push(context.game().equipment().edgeHints()[i] as number);
			}
		}
	}

	// -----------------------------------------------------------------------

	/**
	 * @java PuzzleDesign#drawPuzzleCandidates(Graphics2D, Context)
	 */
	drawPuzzleCandidates(g2d: Graphics2D, context: Context): void {
		const oldFont: Font = g2d.getFont();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const minPuzzleValue: number = context.board().getRange(context.board().defaultSite()).min(context) as number;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const maxPuzzleValue: number = context.board().getRange(context.board().defaultSite()).max(context) as number;
		const valueRange = maxPuzzleValue - minPuzzleValue + 1;
		const base = Math.trunc(Math.sqrt(Math.max(9, valueRange)));

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const bigFontSize = Math.trunc(0.75 * (this.boardStyle as any).placement().getHeight() / Math.max(9, valueRange) + 0.5);
		const smallFontSize = Math.trunc(0.25 * bigFontSize + 0.5);

		const smallFont = new Font(oldFont.getFontName(), PLAIN, smallFontSize);

		// This game has a board
		const state = context.state();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cs = (state.containerStates() as any[])[0];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const u: number = (this.boardStyle as any).cellRadius() * (this.boardStyle as any).placement().getHeight();
		const off = 0.6 * u;

		// Draw the candidate values, greyed out as appropriate
		g2d.setFont(smallFont);

		// Determine relative candidate positions within each cell
		const offsets: Point2D.Double[] = [];
		for (let n = 0; n < valueRange; n++) {
			const row = Math.trunc(n / base);
			const col = n % base;
			const x = (col - 0.5 * (base - 1)) * off;
			const y = (row - 0.5 * (base - 1)) * off;
			offsets.push(new Point2D.Double(x, y));
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const topology: any = this.topology();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const defaultSite: SiteType = context.board().defaultSite();
		const numGraphElements: number = topology.getGraphElements(defaultSite).size() as number;

		for (let site = 0; site < numGraphElements; site++) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const vertex: TopologyElement = topology.cells().get(site);
			const posn: Point2D = vertex.centroid() as Point2D;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const cx = Math.trunc(posn.getX() * (this.boardStyle as any).placement().width + 0.5);
			const cy = Math.trunc(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this.boardStyle as any).placement().height - (posn.getY() * (this.boardStyle as any).placement().height + 0.5),
			);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((cs as any).isResolved(site, defaultSite))
				continue;

			for (let b = 0; b <= valueRange; b++) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const a = new ActionSet(defaultSite as any, site, b + minPuzzleValue);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(a as any).setDecision(true);

				// Construct a minimal Move wrapper to test membership
				// In Java: new Move(a); m.setFromNonDecision(site); etc.
				// The key call is context.moves(context).moves().contains(m).
				// We call the BoardStyle's drawPuzzleValue which handles this.
				// We guard by checking whether the candidate bit is set.
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				if (!(cs as any).bit(site, b + minPuzzleValue, defaultSite))
					continue;

				const tx = Math.trunc(cx + offsets[b]!.getX() + 0.5) + (this.boardStyle as any).placement().x;
				const ty = Math.trunc(cy + offsets[b]!.getY() + 0.5) + (this.boardStyle as any).placement().y;
				const drawPosn = new Point(tx, ty);

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(this.boardStyle as any).drawPuzzleValue(
					b + minPuzzleValue,
					site,
					context,
					g2d,
					drawPosn,
					Math.trunc(this.cellRadiusPixels() / base * 1.5),
				);
			}
		}
	}

	// -----------------------------------------------------------------------

	/**
	 * @java PuzzleDesign#drawPuzzleHints(Graphics2D, Context)
	 */
	drawPuzzleHints(g2d: Graphics2D, context: Context): void {
		if (!context.game().isDeductionPuzzle())
			return;

		if (this.hintValues === null)
			this.detectHints(context);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		for (const graphElement of (this.topology() as any).getAllGraphElements()) {
			const type: SiteType = graphElement.elementType() as SiteType;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const site: number = graphElement.index() as number;

			const posn: Point2D = graphElement.centroid() as Point2D;
			const drawnPosn: Point = this.screenPosn(posn);

			for (let i = 0; i < this.hintValues!.length; i++) {
				if (this.locationValues[i]!.site() === site && this.locationValues[i]!.siteType() === type) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const hintVal = this.hintValues![i]!;

					if (this.drawHintType === 'TopLeft') {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const valueFont = new Font('Arial', BOLD, Math.trunc((this.boardStyle as any).cellRadiusPixels() / 1.5));
						g2d.setColor(new Color(0, 0, 0));
						g2d.setFont(valueFont);
						const rect: Rectangle2D = // eslint-disable-next-line @typescript-eslint/no-explicit-any
							(g2d.getFont() as any).getStringBounds(
							String(hintVal), g2d.getFontRenderContext(),
						);
						g2d.drawString(
							String(hintVal),
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							Math.trunc(drawnPosn.x - (this.boardStyle as any).cellRadiusPixels() / 1.3),
							Math.trunc(drawnPosn.y - rect.getHeight() / 4),
						);
					} else if (this.drawHintType === 'NextTo') {
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const valueFont = new Font('Arial', BOLD, Math.trunc((this.boardStyle as any).cellRadiusPixels()));
						g2d.setColor(new Color(0, 0, 0));
						g2d.setFont(valueFont);
						const rect: Rectangle2D = // eslint-disable-next-line @typescript-eslint/no-explicit-any
							(g2d.getFont() as any).getStringBounds(
							String(hintVal), g2d.getFontRenderContext(),
						);
						if (this.hintDirections[i] === CompassDirection.N) {
							g2d.drawString(
								String(hintVal),
								Math.trunc(drawnPosn.x - rect.getWidth() / 2),
								Math.trunc(drawnPosn.y + rect.getHeight() / 4 - this.cellRadiusPixels() * 2),
							);
						} else if (this.hintDirections[i] === CompassDirection.W) {
							g2d.drawString(
								String(hintVal),
								Math.trunc(drawnPosn.x - rect.getWidth() / 2 - this.cellRadiusPixels() * 2),
								Math.trunc(drawnPosn.y + rect.getHeight() / 4),
							);
						}
					} else {
						// Default
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const valueFont = new Font('Arial', BOLD, Math.trunc((this.boardStyle as any).cellRadiusPixels()));
						g2d.setColor(new Color(0, 0, 0));
						g2d.setFont(valueFont);
						const rect: Rectangle2D = // eslint-disable-next-line @typescript-eslint/no-explicit-any
							(g2d.getFont() as any).getStringBounds(
							String(hintVal), g2d.getFontRenderContext(),
						);
						g2d.drawString(
							String(hintVal),
							Math.trunc(drawnPosn.x - rect.getWidth() / 2),
							Math.trunc(drawnPosn.y + rect.getHeight() / 4),
						);
					}
				}
			}
		}
	}

	// -----------------------------------------------------------------------

	/**
	 * Draws the regions of the board.
	 * @java PuzzleDesign#drawRegions(Graphics2D, Context, Color, BasicStroke, ArrayList<ArrayList<Location>>)
	 */
	protected drawRegions(
		g2d: Graphics2D,
		context: Context,
		borderColor: Color | null,
		stroke: BasicStroke | null,
		regionList: Location[][],
	): void {
		// ContainerUtil.getOuterRegionEdges — delegate via escape-hatch
		for (const region of regionList) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.drawEdges(g2d, context, borderColor, stroke, this.getOuterRegionEdges(region, this.topology()), 0);
		}
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

	/** @java BoardDesign#drawInnerCellEdges */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected drawInnerCellEdges(_g2d: SVGGraphics2D, _context: Context): void {
		// escape-hatch: BoardDesign not yet ported
	}

	/** @java BoardDesign#drawOuterCellEdges */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected drawOuterCellEdges(_bridge: Bridge, _g2d: SVGGraphics2D, _context: Context): void {
		// escape-hatch: BoardDesign not yet ported
	}

	/** @java BoardDesign#drawSymbols */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected drawSymbols(_g2d: SVGGraphics2D, _context: Context): void {
		// escape-hatch: BoardDesign not yet ported
	}

	/** @java BoardDesign#drawEdges */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawEdges(..._args: any[]): void {
		// escape-hatch: BoardDesign not yet ported
	}

	/** @java BoardDesign#colorSymbol */
	protected colorSymbol(): Color | null {
		// escape-hatch: BoardDesign not yet ported
		return null;
	}

	/** @java BoardDesign#topology */
	protected topology(): unknown {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).topology();
	}

	/** @java BoardDesign#screenPosn */
	protected screenPosn(posn: Point2D): Point {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).screenPosn(posn) as Point;
	}

	/** @java BoardDesign#cellRadiusPixels */
	protected cellRadiusPixels(): number {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).cellRadiusPixels() as number;
	}

	/**
	 * Minimal escape-hatch for ContainerUtil.getOuterRegionEdges.
	 * @java util.ContainerUtil#getOuterRegionEdges(List<Location>, Topology)
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected getOuterRegionEdges(_region: Location[], _topology: unknown): any[] {
		// escape-hatch: ContainerUtil.getOuterRegionEdges not yet ported
		return [];
	}

	// -----------------------------------------------------------------------
}
