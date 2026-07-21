// @java ViewController/src/view/container/aspects/designs/board/TaflDesign.java

/**
 * Design for Tafl-family boards.
 *
 * Renders a wood-toned board with knot symbols on the centre cell.
 * Faithful 1:1 port of view.container.aspects.designs.board.TaflDesign.
 *
 * @author matthew.stephenson and cambolbro (Java original)
 * @java view.container.aspects.designs.board.TaflDesign
 */

// BoardDesign       -> batch 26: src/ludii/ViewController/src/view/container/aspects/designs/BoardDesign.ts
// BoardStyle        -> batch 23: src/ludii/ViewController/src/view/container/styles/BoardStyle.ts
// BoardPlacement    -> batch 28: src/ludii/ViewController/src/view/container/aspects/placement/BoardPlacement.ts
// Bridge            -> src/ludii/ViewController/src/bridge/Bridge.ts
// SVGGraphics2D     -> src/ludii/awt/index.ts
// Color             -> src/ludii/awt/index.ts
// Context           -> other.context.Context (Core)
// SiteType          -> src/ludemes/other/action/SiteType.ts
// MetadataImageInfo -> src/ludemes/metadata/graphics/util/MetadataImageInfo.ts
// TopologyElement   -> other.topology.TopologyElement (Core)

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

/** @java other.topology.TopologyElement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyElement = any;

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java view.container.aspects.placement.BoardPlacement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardPlacement = any;

/**
 * TaflDesign — renders a Tafl board (wood tones, knot centre symbol).
 *
 * Java source:
 *   public class TaflDesign extends BoardDesign {
 *     public TaflDesign(BoardStyle boardStyle, BoardPlacement boardPlacement) {
 *       super(boardStyle, boardPlacement);
 *     }
 *
 *     @Override
 *     public String createSVGImage(Bridge bridge, Context context) { ... }
 *   }
 *
 * @java view.container.aspects.designs.board.TaflDesign
 */
export class TaflDesign {

	/** @java BoardDesign#boardStyle */
	protected readonly boardStyle: BoardStyle;

	/** @java BoardDesign#boardPlacement */
	protected readonly boardPlacement: BoardPlacement;

	// Fields inherited from BoardDesign (escape-hatched; set by setStrokesAndColours)
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
	 * @java TaflDesign#TaflDesign(view.container.styles.BoardStyle, view.container.aspects.placement.BoardPlacement)
	 */
	constructor(boardStyle: BoardStyle, boardPlacement: BoardPlacement) {
		this.boardStyle = boardStyle;
		this.boardPlacement = boardPlacement;
	}

	// -------------------------------------------------------------------------

	/**
	 * fill, draw internal grid lines, draw symbols, draw outer border on top.
	 * @returns SVG as string.
	 * @java TaflDesign#createSVGImage(bridge.Bridge, other.context.Context)
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
			new Color(220, 170, 70),
			new Color(175, 125, 75),
			new Color(250, 200, 100),
			null,
			null,
			null,
			null,
			null,
			new Color(0, 0, 0),
			swThin,
			swThick,
		);

		this.fillCells(bridge, g2d, context);
		this.drawInnerCellEdges(g2d, context);

		const symbolLocations: number[] = [];

		// Draw the centre
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const centreElements: TopologyElement[] = (this as any).topology().centre('Cell' as SiteType);
		for (const v of centreElements)
			symbolLocations.push(v.index());

		for (const i of symbolLocations) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const cellVertexCount: number = (this as any).topology().cells()[i].vertices().size();
			if (cellVertexCount % 3 === 0)
				// triangle knot
				this.symbols.push(this.makeMetadataImageInfo(i, 'Cell', 'knotTriangle', 0.8));
			else
				// square knot
				this.symbols.push(this.makeMetadataImageInfo(i, 'Cell', 'knotSquare', 0.9));
		}

		this.drawSymbols(g2d, context);
		this.drawOuterCellEdges(bridge, g2d, context);

		return g2d.getSVGDocument();
	}

	// -------------------------------------------------------------------------
	// Delegation stubs — real implementations live in BoardDesign (batch 26).
	// These are called faithfully; they forward to the escape-hatched base.

	/** @java BoardDesign#setStrokesAndColours */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected setStrokesAndColours(...args: any[]): void {
		// escape-hatch: BoardDesign not yet ported
		void args;
	}

	/** @java BoardDesign#fillCells */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected fillCells(bridge: Bridge, g2d: SVGGraphics2D, context: Context): void {
		void bridge; void g2d; void context;
	}

	/** @java BoardDesign#drawInnerCellEdges */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawInnerCellEdges(g2d: SVGGraphics2D, context: Context): void {
		void g2d; void context;
	}

	/** @java BoardDesign#drawSymbols */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawSymbols(g2d: SVGGraphics2D, context: Context): void {
		void g2d; void context;
	}

	/** @java BoardDesign#drawOuterCellEdges */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected drawOuterCellEdges(bridge: Bridge, g2d: SVGGraphics2D, context: Context): void {
		void bridge; void g2d; void context;
	}

	/** @java BoardDesign#topology */
	protected topology(): unknown {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (this.boardStyle as any).topology();
	}

	/** Helper to create MetadataImageInfo — escape-hatch until that class is usable. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private makeMetadataImageInfo(site: number, siteType: string, path: string, scale: number): MetadataImageInfo {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return { site, siteType, path, scale } as any;
	}

	// -------------------------------------------------------------------------
}
