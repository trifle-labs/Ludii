// @java ViewController/src/view/container/aspects/designs/board/GoDesign.java

/**
 * Design for Go boards — wood-toned cells with star-point dots.
 *
 * Faithful 1:1 port of view.container.aspects.designs.board.GoDesign.
 *
 * @author matthew.stephenson and cambolbro (Java original)
 * @java view.container.aspects.designs.board.GoDesign
 */

// BoardDesign       -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/BoardDesign.ts
// BoardStyle        -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement    -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge            -> src/ludii/ViewController/src/bridge/Bridge.ts
// SVGGraphics2D / Color -> src/ludii/awt/index.ts
// Context           -> other.context.Context (Core)
// SiteType          -> src/ludemes/other/action/SiteType.ts
// MetadataImageInfo -> src/ludemes/metadata/graphics/util/MetadataImageInfo.ts

import { Color, SVGGraphics2D } from '../../../../../../../awt/index.js';
import { Bridge } from '../../../../../bridge/Bridge.js';

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java game.types.board.SiteType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteType = any;

/** @java metadata.graphics.util.MetadataImageInfo */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MetadataImageInfo = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * GoDesign — renders a Go board with wood tone and star-point dot symbols.
 *
 * Java source:
 *   public class GoDesign extends BoardDesign {
 *     public GoDesign(BoardStyle boardStyle, BoardPlacement boardPlacement) {
 *       super(boardStyle, boardPlacement);
 *     }
 *
 *     @Override
 *     public String createSVGImage(Bridge bridge, Context context) { ... }
 *   }
 *
 * @java view.container.aspects.designs.board.GoDesign
 */
export class GoDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// Fields inherited from BoardDesign (escape-hatched)
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
	/** @java BoardDesign#symbols */
	protected symbols: MetadataImageInfo[] = [];
	/** @java BoardDesign#checkeredBoard */
	protected checkeredBoard = false;
	/** @java BoardDesign#straightLines */
	protected straightLines = false;

	// -------------------------------------------------------------------------

	/**
	 * @java GoDesign#GoDesign(view.container.styles.BoardStyle, view.container.aspects.placement.BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -------------------------------------------------------------------------

	/**
	 * fill, draw internal grid lines, draw outer border, add star-point dots.
	 * @returns SVG as string.
	 * @java GoDesign#createSVGImage(bridge.Bridge, other.context.Context)
	 */
	createSVGImage(bridge: Bridge, context: Context): string {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g2d: SVGGraphics2D = (this.boardStyle as any).setSVGRenderingValues();

		const swRatio = 0.002;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const width: number = (this.boardStyle as any).placement().width;
		const swThin  = Math.max(0.5, swRatio * width);
		const swThick = swThin;

		const colourInner = new Color(160, 140, 100);
		const colourOuter = new Color(  0,   0,   0);
		const colourFill  = new Color(255, 230, 150);
		const colourDot   = new Color(130, 120,  90);

		this.setStrokesAndColours(
			bridge,
			context,
			colourInner,
			colourOuter,
			colourFill,
			null,
			null,
			null,
			null,
			null,
			colourDot,
			swThin,
			swThick,
		);

		this.fillCells(bridge, g2d, context);
		this.drawInnerCellEdges(g2d, context);
		this.drawOuterCellEdges(bridge, g2d, context);

		const symbolLocations: number[] = [];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const defaultSite: SiteType = context.board().defaultSite();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const boardCellsWidth: number  = (this as any).topology().columns(defaultSite).size();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const boardCellsHeight: number = (this as any).topology().rows(defaultSite).size();

		if (boardCellsWidth > 13) {
			symbolLocations.push(boardCellsWidth * 3 + 3);
			symbolLocations.push(boardCellsWidth * 3 + Math.trunc(boardCellsWidth / 2));
			symbolLocations.push(boardCellsWidth * 3 + boardCellsWidth - 4);
			symbolLocations.push(boardCellsWidth * Math.trunc((boardCellsHeight - 1) / 2) + 3);
			symbolLocations.push(boardCellsWidth * Math.trunc((boardCellsHeight - 1) / 2) + Math.trunc(boardCellsWidth / 2));
			symbolLocations.push(boardCellsWidth * Math.trunc((boardCellsHeight - 1) / 2) + boardCellsWidth - 4);
			symbolLocations.push(boardCellsWidth * (boardCellsHeight - 4) + 3);
			symbolLocations.push(boardCellsWidth * (boardCellsHeight - 4) + Math.trunc(boardCellsWidth / 2));
			symbolLocations.push(boardCellsWidth * (boardCellsHeight - 4) + boardCellsWidth - 4);
		} else if (boardCellsWidth > 9) {
			symbolLocations.push(boardCellsWidth * 3 + 3);
			symbolLocations.push(boardCellsWidth * 3 + boardCellsWidth - 4);
			symbolLocations.push(boardCellsWidth * Math.trunc((boardCellsHeight - 1) / 2) + Math.trunc(boardCellsWidth / 2));
			symbolLocations.push(boardCellsWidth * (boardCellsHeight - 4) + 3);
			symbolLocations.push(boardCellsWidth * (boardCellsHeight - 4) + boardCellsWidth - 4);
		} else {
			symbolLocations.push(boardCellsWidth * 2 + 2);
			symbolLocations.push(boardCellsWidth * 2 + boardCellsWidth - 3);
			symbolLocations.push(boardCellsWidth * Math.trunc((boardCellsHeight - 1) / 2) + Math.trunc(boardCellsWidth / 2));
			symbolLocations.push(boardCellsWidth * (boardCellsHeight - 3) + 2);
			symbolLocations.push(boardCellsWidth * (boardCellsHeight - 3) + boardCellsWidth - 3);
		}

		for (const i of symbolLocations) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.symbols.push({ site: i, siteType: 'Vertex', path: 'dot', scale: 0.3 } as any);
		}

		this.drawSymbols(g2d, context);

		return g2d.getSVGDocument();
	}

	// -------------------------------------------------------------------------
	// Delegation stubs — real implementations live in BoardDesign (batch 26).

	/** @java BoardDesign#setStrokesAndColours */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected setStrokesAndColours(...args: any[]): void {
		void args;
	}

	/** @java BoardDesign#fillCells */
	protected fillCells(bridge: Bridge, g2d: SVGGraphics2D, context: Context): void {
		void bridge; void g2d; void context;
	}

	/** @java BoardDesign#drawInnerCellEdges */
	protected drawInnerCellEdges(g2d: SVGGraphics2D, context: Context): void {
		void g2d; void context;
	}

	/** @java BoardDesign#drawOuterCellEdges */
	protected drawOuterCellEdges(bridge: Bridge, g2d: SVGGraphics2D, context: Context): void {
		void bridge; void g2d; void context;
	}

	/** @java BoardDesign#drawSymbols */
	protected drawSymbols(g2d: SVGGraphics2D, context: Context): void {
		void g2d; void context;
	}

	/** @java BoardDesign#topology */
	protected topology(): unknown {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).topology();
	}

	// -------------------------------------------------------------------------
}
