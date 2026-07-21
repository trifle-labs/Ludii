// @java ViewController/src/view/container/aspects/components/board/Connect4Components.java

import type { Graphics2D, Point2D, Rectangle } from '../../../../../../../awt/index.js';
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

/** @java view.container.styles.board.Connect4Style */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Connect4Style = any;

/** @java view.container.aspects.placement.Board.Connect4Placement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Connect4Placement = any;

/** @java other.topology.Cell */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cell = any;

/** @java other.state.container.ContainerState */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContainerState = any;

// ---------------------------------------------------------------------------

/**
 * Connect4 components properties.
 *
 * Faithful 1:1 port of view.container.aspects.components.board.Connect4Components.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.components.board.Connect4Components
 */
export class Connect4Components extends ContainerComponents {

	/** @java Connect4Components#boardStyle */
	private readonly boardStyle: Connect4Style;

	/** @java Connect4Components#boardPlacement */
	private readonly boardPlacement: Connect4Placement;

	// -------------------------------------------------------------------------

	/**
	 * @java Connect4Components#Connect4Components(bridge.Bridge, view.container.styles.board.Connect4Style, view.container.aspects.placement.Board.Connect4Placement)
	 */
	constructor(bridge: Bridge, containerStyle: Connect4Style, containerPlacement: Connect4Placement) {
		super(bridge, containerStyle);
		this.boardStyle     = containerStyle;
		this.boardPlacement = containerPlacement;
	}

	// -------------------------------------------------------------------------

	/**
	 * @java Connect4Components#drawComponents(java.awt.Graphics2D, other.context.Context)
	 */
	override drawComponents(g2d: Graphics2D, context: Context): void {
		// Set rendering hints — no-op in SVG renderer

		const cells: Cell[] = this.boardStyle.topology().cells() as Cell[];
		const placement: Rectangle = this.boardStyle.placement();

		if (cells.length === 0) {
			console.log('** Connect4Style.drawStyle(): Board has no cells.');
			return;
		}

		const cell0Centroid = cells[0].centroid() as Point2D;
		const cell1Centroid = cells[1].centroid() as Point2D;
		const u: number = Math.trunc(
			(cell1Centroid.getX() - cell0Centroid.getX()) * placement.width
		);
		const r: number = Math.trunc(0.425 * u + 0.5);

		const state = context.state();
		const cs: ContainerState = state.containerStates()[0];

		for (let site = 0; site < this.boardStyle.topology().cells().length; site++) {
			const pixel: Point2D = cells[site].centroid();
			const levelNumber: number = cs.sizeStackCell(site);

			for (let level = 0; level < levelNumber; level++) {
				const who: number = cs.whoCell(site, level);
				if (who === 0) break;

				// Draw this piece
				const cx: number = Math.trunc(pixel.getX() * placement.width);
				const cy: number = Math.trunc(
					pixel.getY() * placement.width +
					(this.boardPlacement.connect4Rows() - 1) * u - level * u +
					placement.y
				);

				g2d.setColor(this.bridge.settingsColour().playerColour(context, who));
				(g2d as unknown as { fillArc(x: number, y: number, w: number, h: number, start: number, arc: number): void })
					.fillArc(cx - r, cy - r, 2 * r, 2 * r, 0, 360);
			}
		}
	}

	// -------------------------------------------------------------------------
}
