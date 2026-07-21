// @java ViewController/src/view/container/aspects/components/board/PuzzleComponents.java

import { Color, Font, BOLD } from '../../../../../../../awt/index.js';
import type { Graphics2D, Point } from '../../../../../../../awt/index.js';
import { ContainerComponents } from '../ContainerComponents.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/** @java bridge.Bridge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Bridge = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.board.puzzle.PuzzleStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PuzzleStyle = any;

/** @java view.container.aspects.designs.board.puzzle.PuzzleDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PuzzleDesign = any;

/** @java other.topology.TopologyElement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyElement = any;

/** @java other.state.container.ContainerState */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContainerState = any;

/** @java game.equipment.component.Piece */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Piece = any;

/** @java view.component.BaseComponentStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseComponentStyle = any;

/** @java util.ImageInfo */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ImageInfo = any;

// ---------------------------------------------------------------------------

/**
 * Puzzle components properties.
 *
 * Faithful 1:1 port of view.container.aspects.components.board.PuzzleComponents.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.components.board.PuzzleComponents
 */
export class PuzzleComponents extends ContainerComponents {

	/** @java PuzzleComponents#initialValues */
	protected initialValues: number[] = [];

	/** @java PuzzleComponents#puzzleStyle */
	protected readonly puzzleStyle: PuzzleStyle;

	/** @java PuzzleComponents#puzzleDesign (private) */
	private readonly _puzzleDesign: PuzzleDesign;

	// -------------------------------------------------------------------------

	/**
	 * @java PuzzleComponents#PuzzleComponents(bridge.Bridge, view.container.styles.board.puzzle.PuzzleStyle, view.container.aspects.designs.board.puzzle.PuzzleDesign)
	 */
	constructor(bridge: Bridge, containerStyle: PuzzleStyle, containerDesign: PuzzleDesign) {
		super(bridge, containerStyle);
		this.puzzleStyle  = containerStyle;
		this._puzzleDesign = containerDesign;
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw all components for a deduction puzzle.
	 * @java PuzzleComponents#drawComponents(java.awt.Graphics2D, other.context.Context)
	 */
	override drawComponents(g2d: Graphics2D, context: Context): void {
		// Populate initialValues from start rules if not yet set.
		if (this.initialValues.length === 0 && context.game().rules().start() != null) {
			const startRules = context.game().rules().start().rules();
			for (const startRule of startRules) {
				if (startRule.isSet()) {
					const setRule = startRule;
					for (const site of setRule.vars() as number[]) {
						this.initialValues.push(site);
					}
				}
			}
		}

		const state = context.state();
		const cs: ContainerState = state.containerStates()[0];

		for (let site = 0; site < this.puzzleStyle.topology().getGraphElements(context.board().defaultSite()).length; site++) {
			const element: TopologyElement = this.puzzleStyle.topology().getGraphElements(context.board().defaultSite())[site];
			const posn = element.centroid();
			const drawPosn: Point = this.puzzleStyle.screenPosn(posn);

			const values: unknown = cs.values(context.board().defaultSite(), site);

			if (cs.isResolved(site, context.board().defaultSite())) {
				const value: number = (values as { nextSetBit(from: number): number }).nextSetBit(0);

				const dim: number = this.puzzleStyle.topology().rows(context.board().defaultSite()).length;
				const bigFontSize: number = Math.trunc(0.75 * this.puzzleStyle.placement().getHeight() / dim + 0.5);
				const bigFont = new Font('Arial', BOLD, bigFontSize);

				g2d.setFont(bigFont);
				if (this.initialValues.includes(site))
					g2d.setColor(new Color(0, 0, 0));
				else
					g2d.setColor(new Color(139, 0, 0));

				const pieceSize: number = Math.trunc(
					this.puzzleStyle.cellRadiusPixels() * 2 * this.pieceScale() * this.puzzleStyle.containerScale()
				);
				this.drawPuzzleValue(value, site, context, g2d, drawPosn, pieceSize);
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * @java PuzzleComponents#drawPuzzleValue(int, int, other.context.Context, java.awt.Graphics2D, java.awt.Point, int)
	 */
	override drawPuzzleValue(
		value: number,
		site: number,
		context: Context,
		g2d: Graphics2D,
		drawPosn: Point,
		imageSize: number
	): void {
		const metadataGraphics = context.game().metadata().graphics();
		const name: string | null = metadataGraphics.pieceNameReplacement(context, 1, String(value), 0, 0, 0);
		if (name != null) {
			// Draw a specific image here instead of the value
			// Escape-hatched: Piece, PieceStyle, BaseComponentStyle are not yet ported
			// We fall through to string rendering as a safe fallback.
			void site; // suppress unused warning
			void imageSize;
			const str = '' + value;
			const fm = g2d.getFontMetrics();
			const strW = fm.stringWidth(str);
			const strH = fm.getHeight();
			(g2d as unknown as { drawString(s: string, x: number, y: number): void })
				.drawString(str, Math.trunc(drawPosn.x - strW / 2), Math.trunc(drawPosn.y + strH / 3));
		} else {
			// Draw the single resolved value
			const str = '' + value;
			const fm = g2d.getFontMetrics();
			const strW = fm.stringWidth(str);
			const strH = fm.getHeight();
			(g2d as unknown as { drawString(s: string, x: number, y: number): void })
				.drawString(str, Math.trunc(drawPosn.x - strW / 2), Math.trunc(drawPosn.y + strH / 3));
		}
	}

	// -------------------------------------------------------------------------

	/** @java PuzzleComponents#getPuzzleDesign() */
	getPuzzleDesign(): PuzzleDesign {
		return this._puzzleDesign;
	}

	// -------------------------------------------------------------------------

	// -------------------------------------------------------------------------
}
