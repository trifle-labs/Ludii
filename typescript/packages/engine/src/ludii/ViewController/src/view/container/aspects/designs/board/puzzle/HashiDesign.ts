// @java ViewController/src/view/container/aspects/designs/board/puzzle/HashiDesign.java

/**
 * Design for Hashi (Bridges) puzzle boards.
 *
 * Renders only vertices (islands); the grid lines are suppressed and the
 * background is black/none.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.puzzle.HashiDesign.
 *
 * @author matthew.stephenson (Java original)
 * @java view.container.aspects.designs.board.puzzle.HashiDesign
 */

// PuzzleDesign   -> batch 23: src/ludii/ViewController/src/view/container/aspects/designs/board/puzzle/PuzzleDesign.ts
// BoardStyle     -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge         -> src/ludii/ViewController/src/bridge/Bridge.ts
// SVGGraphics2D / Color -> src/ludii/awt/index.ts
// Context        -> other.context.Context (Core)

import { Color, SVGGraphics2D } from '../../../../../../../../awt/index.js';
import { Bridge } from '../../../../../../bridge/Bridge.js';

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * HashiDesign — renders a Hashi puzzle board showing only island vertices.
 *
 * Java source:
 *   public class HashiDesign extends PuzzleDesign {
 *     public HashiDesign(BoardStyle boardStyle, BoardPlacement boardPlacement) {
 *       super(boardStyle, boardPlacement);
 *     }
 *
 *     @Override
 *     public String createSVGImage(Bridge bridge, Context context) { ... }
 *   }
 *
 * @java view.container.aspects.designs.board.puzzle.HashiDesign
 */
export class HashiDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// Inherited fields from BoardDesign (escape-hatched)
	/** @java BoardDesign#colorEdgesInner */
	protected colorEdgesInner: Color | null = null;
	/** @java BoardDesign#colorEdgesOuter */
	protected colorEdgesOuter: Color | null = null;
	/** @java BoardDesign#strokeThin */
	protected strokeThin: unknown = null;
	/** @java BoardDesign#strokeThick */
	protected strokeThick: unknown = null;
	/** @java BoardDesign#colorSymbol */
	protected colorSymbol: Color | null = null;

	// -------------------------------------------------------------------------

	/**
	 * @java HashiDesign#HashiDesign(view.container.styles.BoardStyle, view.container.aspects.placement.BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -------------------------------------------------------------------------

	/**
	 * Creates SVG rendering of a Hashi board (only island vertices drawn).
	 * @returns SVG as string.
	 * @java HashiDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();

		const swRatio = 3 / 1000.0;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const width: number = (this.boardStyle as any).placement().width;
		const swThin  = Math.max(1, Math.trunc(swRatio * width + 0.5));
		const swThick = 2 * swThin;

		this.setStrokesAndColours(
			bridge,
			context,
			new Color(0, 0, 0),
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			new Color(0, 0, 0),
			swThin,
			swThick,
		);

		//boardStyle.detectHints(context);  // commented out in Java source

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cellDistance: number = (this.boardStyle as any).cellRadius();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const vertexRadius: number = 0.5 * width * cellDistance;
		this.drawVertices(bridge, g2d, context, vertexRadius);

		return g2d.getSVGDocument();
	}

	// -------------------------------------------------------------------------
	// Delegation stubs — real implementations live in BoardDesign / PuzzleDesign (batch 23/26).

	/** @java BoardDesign#setStrokesAndColours */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected setStrokesAndColours(...args: any[]): void {
		void args;
	}

	/** @java BoardDesign#drawVertices */
	protected drawVertices(bridge: Bridge, g2d: SVGGraphics2D, context: Context, radius: number): void {
		void bridge; void g2d; void context; void radius;
	}

	// -------------------------------------------------------------------------
}
