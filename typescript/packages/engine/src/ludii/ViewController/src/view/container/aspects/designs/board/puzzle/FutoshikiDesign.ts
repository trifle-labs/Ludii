// @java ViewController/src/view/container/aspects/designs/board/puzzle/FutoshikiDesign.java

/**
 * Design for Futoshiki inequality puzzle boards.
 *
 * Extends GraphDesign with:
 *  - hint location type set to BetweenVertices
 *  - inequality symbols (<, >, ^, v) drawn between constrained cell pairs
 *  - cell vertices drawn as squares rather than dots
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.puzzle.FutoshikiDesign.
 *
 * @author matthew.stephenson (Java original)
 * @java view.container.aspects.designs.board.puzzle.FutoshikiDesign
 */

// GraphDesign         -> batch 24 (this batch): GraphDesign.ts
// BoardStyle          -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement      -> batch 28
// Bridge              -> src/ludii/ViewController/src/bridge/Bridge.ts
// awt shims           -> src/ludii/awt/index.ts
// SiteType            -> src/ludemes/other/action/SiteType.ts
// CompassDirection    -> src/ludemes/game/util/directions/CompassDirection.ts
// PuzzleHintLocationType -> src/ludemes/metadata/graphics/util/PuzzleHintLocationType.ts

import {
	BasicStroke, CAP_ROUND, JOIN_MITER,
	Color,
	Font, BOLD,
	SVGGraphics2D,
	Point,
} from '../../../../../../../../awt/index.js';
import { Bridge } from '../../../../../../bridge/Bridge.js';
import { GraphDesign } from '../graph/GraphDesign.js';

// ---------------------------------------------------------------------------
// Helper: approximate java.awt.Font.getStringBounds() via size heuristics.
// @java java.awt.Font#getStringBounds(String, FontRenderContext)
// ---------------------------------------------------------------------------
function stringBounds(font: Font, str: string): { getWidth(): number; getHeight(): number } {
	const width  = str.length * font.getSize() * 0.6;
	const height = font.getSize() * 1.0;
	return {
		getWidth():  number { return width; },
		getHeight(): number { return height; },
	};
}

/** Rectangle2D-like bound result type. */
type Rect2D = ReturnType<typeof stringBounds>;

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

/** @java game.util.directions.CompassDirection */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CompassDirection = any;

/** @java metadata.graphics.util.PuzzleHintLocationType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PuzzleHintLocationType = any;

/** @java other.topology.TopologyElement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyElement = any;

/** @java other.topology.Vertex */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = any;

/** @java java.awt.geom.Point2D */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Point2D = any;

/**
 * FutoshikiDesign — inequality puzzle board rendering.
 *
 * Java source:
 *   public class FutoshikiDesign extends GraphDesign {
 *     public FutoshikiDesign(BoardStyle boardStyle, BoardPlacement boardPlacement) {
 *       super(boardStyle, boardPlacement, false, false);
 *       hintLocationType = PuzzleHintLocationType.BetweenVertices;
 *     }
 *
 *     @Override
 *     public void drawPuzzleHints(Graphics2D g2d, Context context) { ... }
 *
 *     @Override
 *     protected void drawVertices(Bridge bridge, Graphics2D g2d, Context context, double radius) { ... }
 *   }
 *
 * @java view.container.aspects.designs.board.puzzle.FutoshikiDesign
 */
export class FutoshikiDesign extends GraphDesign {

	/**
	 * @java FutoshikiDesign#FutoshikiDesign(view.container.styles.BoardStyle, view.container.aspects.placement.BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		super(boardStyle, boardPlacement, false, false);
		this.hintLocationType = 'BetweenVertices' as PuzzleHintLocationType;
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws inequality (<, >, ^, v) symbols between constrained cell pairs.
	 * @java FutoshikiDesign#drawPuzzleHints(java.awt.Graphics2D, other.context.Context)
	 */
	override drawPuzzleHints(g2d: SVGGraphics2D, context: Context): void {
		if (this.hintValues === null)
			this.detectHints(context);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const allElements: TopologyElement[] = (this as any).topology().getAllGraphElements();
		for (const graphElement of allElements) {
			const type: SiteType = graphElement.elementType();
			const site: number = graphElement.index();

			const posn: Point2D = graphElement.centroid();
			const drawnPosn: Point = this.screenPosn(posn);

			if (this.hintValues === null) continue;

			for (let i = 0; i < this.hintValues.length; i++) {
				if (
					this.locationValues[i]?.site() === site &&
					this.locationValues[i]?.siteType() === type
				) {
					// compute maxHintvalue (used for potential font sizing, kept for fidelity)
					let maxHintvalue = 0;
					for (let j = 0; j < this.hintValues.length; j++) {
						const hv = this.hintValues[i];
						if (hv != null && hv > maxHintvalue)
							maxHintvalue = hv;
					}
					void maxHintvalue; // kept for fidelity; not used in Futoshiki drawing

					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const valueFont = new Font('Arial', BOLD, (this.boardStyle as any).cellRadiusPixels());
					g2d.setColor(new Color(0, 0, 0));
					g2d.setFont(valueFont);

					const direction: CompassDirection = this.hintDirections[i];

					if (direction === 'W' || direction === 3 /* CompassDirection.W */) {
						const rect: Rect2D = stringBounds(g2d.getFont(), '<');
						g2d.drawString('<',
							Math.trunc(drawnPosn.x - rect.getWidth() / 2),
							Math.trunc(drawnPosn.y + rect.getHeight() / 3));
					} else if (direction === 'N' || direction === 0 /* CompassDirection.N */) {
						const rect: Rect2D = stringBounds(g2d.getFont(), '^');
						g2d.drawString('^',
							Math.trunc(drawnPosn.x - rect.getWidth() / 2),
							Math.trunc(drawnPosn.y + rect.getHeight() / 2));
					} else if (direction === 'E' || direction === 1 /* CompassDirection.E */) {
						const rect: Rect2D = stringBounds(g2d.getFont(), '>');
						g2d.drawString('>',
							Math.trunc(drawnPosn.x - rect.getWidth() / 2),
							Math.trunc(drawnPosn.y + rect.getHeight() / 3));
					} else if (direction === 'S' || direction === 2 /* CompassDirection.S */) {
						const rect: Rect2D = stringBounds(g2d.getFont(), '^');
						// negative font size flips the glyph (Java idiom for upside-down caret)
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const flippedFont = new Font('Arial', BOLD, -(this.boardStyle as any).cellRadiusPixels());
						g2d.setFont(flippedFont);
						g2d.drawString('^',
							Math.trunc(drawnPosn.x + rect.getWidth() / 2),
							Math.trunc(drawnPosn.y - rect.getHeight() / 2));
					}
				}
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws each vertex as a hollow square rather than a filled circle.
	 * @java FutoshikiDesign#drawVertices(bridge.Bridge, java.awt.Graphics2D, other.context.Context, double)
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	override drawVertices(bridge: Bridge, g2d: SVGGraphics2D, context: Context, radius: any, _radius2?: number, _offsetY?: number): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const vertices: Vertex[] = (this as any).topology().vertices();
		for (const vertex of vertices) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const squareSize: number = Math.trunc((this.boardStyle as any).cellRadiusPixels() * 1.2);
			if (this.colorEdgesOuter !== null)
				g2d.setColor(this.colorEdgesOuter);
			g2d.setStroke(new BasicStroke(this._strokeThickField.getLineWidth(), CAP_ROUND, JOIN_MITER));
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const pt: Point = (this.boardStyle as any).screenPosn(vertex.centroid());
			g2d.drawRect(
				pt.x - Math.trunc(squareSize / 2),
				pt.y - Math.trunc(squareSize / 2),
				squareSize,
				squareSize,
			);
		}
		void bridge; void context; void radius;
	}

	// -------------------------------------------------------------------------
}
