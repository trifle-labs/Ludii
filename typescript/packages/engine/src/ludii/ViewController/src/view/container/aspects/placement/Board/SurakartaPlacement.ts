// @java ViewController/src/view/container/aspects/placement/Board/SurakartaPlacement.java

/**
 * Placement aspect for the Surakarta board. Adjusts the scale to account for
 * the circular tracks that surround the inner grid.
 *
 * Faithful 1:1 port of view.container.aspects.placement.Board.SurakartaPlacement.
 *
 * Java hierarchy: SurakartaPlacement → BoardPlacement → ContainerPlacement.
 * BoardPlacement (batch 28) is not yet ported; we extend ContainerPlacement directly
 * and inline the relevant BoardPlacement members as an escape-hatch.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.placement.Board.SurakartaPlacement
 */

import { Rectangle } from '../../../../../../../awt/index.js';
import { Bridge } from '../../../../../bridge/Bridge.js';
import { ContainerPlacement } from '../ContainerPlacement.js';

// ---------------------------------------------------------------------------
// Escape-hatched dependency types
// ---------------------------------------------------------------------------

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

// ---------------------------------------------------------------------------

/**
 * Placement for Surakarta — enlarges scale to reduce outer margin for the loops.
 *
 * In Java:
 *   public class SurakartaPlacement extends BoardPlacement { ... }
 *
 * @java view.container.aspects.placement.Board.SurakartaPlacement
 */
export class SurakartaPlacement extends ContainerPlacement {

	/**
	 * Scale of the board relative to the original placement size.
	 * Mirrors BoardPlacement.defaultBoardScale.
	 * @java view.container.aspects.placement.BoardPlacement#defaultBoardScale
	 */
	protected defaultBoardScale: number = 0.8;

	/** @java view.container.aspects.placement.BoardPlacement#boardStyle */
	protected boardStyle: BoardStyle;

	// -------------------------------------------------------------------------

	/**
	 * @java SurakartaPlacement#SurakartaPlacement(Bridge, BoardStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BoardStyle) {
		super(bridge, containerStyle);
		this.boardStyle = containerStyle;
		this.containerScale = this.defaultBoardScale;
	}

	// -------------------------------------------------------------------------

	/**
	 * @java SurakartaPlacement#setPlacement(Context, Rectangle)
	 */
	override setPlacement(context: Context, placement: Rectangle): void {
		const rows: number = this.boardStyle.container().topology().rows('Vertex' as string).length - 1;
		const cols: number = this.boardStyle.container().topology().columns('Vertex' as string).length - 1;

		const maxDim: number = Math.max(rows, cols);
		let extra: number = Math.trunc(Math.min(rows, cols) / 2);
		const numLoops: number = Math.trunc(this.container().tracks().length / 2);
		if (numLoops >= extra) extra += 1;
		const fullDim: number = maxDim + extra * 2;

		// Enlarge scale to reduce outer margin
		const basis: string = this.topology().graph().basis();
		switch (basis) {
			case 'Square':
				this.containerScale = 1.1 * (maxDim) / fullDim;
				break;
			case 'Triangular':
				this.containerScale = 0.9 * (maxDim) / fullDim;
				break;
			default:
				console.warn(`** Board type ${basis} not supported for Surkarta.`);
				break;
		}

		this.setUnscaledPlacement(placement);
		this.placement = new Rectangle(
			Math.trunc(placement.getX() + placement.getWidth() * (1.0 - this.containerScale) / 2),
			Math.trunc(placement.getY() + placement.getHeight() * (1.0 - this.containerScale) / 2),
			Math.trunc(placement.getWidth() * this.containerScale),
			Math.trunc(placement.getHeight() * this.containerScale)
		);

		this.setCellRadiusPixels(Math.trunc(this._cellRadius * this.placement.width * this.containerScale));
		void context;
	}

	// -------------------------------------------------------------------------
}
