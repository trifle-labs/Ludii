// @java ViewController/src/view/container/styles/board/graph/GraphStyle.java

/**
 * Container style for generic graph-style boards (vertices, edges, cells).
 * Holds base rendering parameters (vertex radius, line width, graph colour)
 * and delegates to GraphDesign for drawing.
 *
 * Faithful 1:1 port of view.container.styles.board.graph.GraphStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.board.graph.GraphStyle
 */

// PuzzleStyle  -> batch 20: src/ludii/ViewController/src/view/container/styles/board/puzzle/PuzzleStyle.ts
// GraphDesign  -> batch 24: src/ludii/ViewController/src/view/container/aspects/designs/board/graph/GraphDesign.ts
// Bridge       -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container    -> game.equipment.container.Container (Core)
// Context      -> other.context.Context (Core)

import { Bridge } from '../../../../../bridge/Bridge.js';
import { Color } from '../../../../../../../awt/index.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.aspects.designs.board.graph.GraphDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GraphDesign = any;

/**
 * GraphStyle — minimal faithful shell.
 * Extends PuzzleStyle (escape-hatched until batch 20 is merged).
 *
 * In Java:
 *   public class GraphStyle extends PuzzleStyle {
 *     protected final Color baseGraphColour = new Color(200, 200, 200);
 *     protected double baseVertexRadius = 6;
 *     protected double baseLineWidth    = 0.5 * baseVertexRadius;
 *
 *     public GraphStyle(Bridge, Container, Context) {
 *       super(bridge, container, context);
 *       containerDesign = new GraphDesign(this, boardPlacement, true, true);
 *     }
 *
 *     public Color baseGraphColour() { return baseGraphColour; }
 *     public double baseVertexRadius() { return baseVertexRadius; }
 *     public void setBaseVertexRadius(double vr) { baseVertexRadius = vr; }
 *     public double baseLineWidth() { return baseLineWidth; }
 *     public void setBaseLineWidth(double lw) { baseLineWidth = lw; }
 *   }
 *
 * @java view.container.styles.board.graph.GraphStyle
 */
export class GraphStyle {

	/** @java GraphStyle#bridge (inherited via BaseContainerStyle) */
	protected readonly bridge: Bridge;

	/** @java GraphStyle#container (inherited via BaseContainerStyle) */
	protected readonly _container: Container;

	/** @java GraphStyle#boardPlacement (inherited via BoardStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected boardPlacement: any = null;

	/** @java GraphStyle#containerDesign (inherited via BaseContainerStyle) */
	protected containerDesign: GraphDesign | null = null;

	// -----------------------------------------------------------------------

	/** @java GraphStyle#baseGraphColour */
	protected readonly baseGraphColour: Color = new Color(200, 200, 200);

	/** @java GraphStyle#baseVertexRadius */
	protected baseVertexRadius: number = 6;

	/** @java GraphStyle#baseLineWidth */
	protected baseLineWidth: number = 0.5 * 6; // 0.5 * baseVertexRadius

	// -----------------------------------------------------------------------

	/**
	 * @java GraphStyle#GraphStyle(Bridge, Container, Context)
	 */
	constructor(bridge: Bridge, container: Container, _context: Context) {
		this.bridge = bridge;
		this._container = container;
		// NOTE: super(bridge, container, context) → PuzzleStyle → BoardStyle →
		// BaseContainerStyle.  When PuzzleStyle and GraphDesign are ported,
		// replace this class body with a proper `extends PuzzleStyle`.
		//
		// containerDesign = new GraphDesign(this, boardPlacement, true, true);
		// (GraphDesign is in batch 24 — escape-hatched here)
		this.containerDesign = null;
	}

	// -----------------------------------------------------------------------

	/** @java GraphStyle#baseGraphColour() */
	getBaseGraphColour(): Color {
		return this.baseGraphColour;
	}

	// -----------------------------------------------------------------------

	/** @java GraphStyle#baseVertexRadius() */
	getBaseVertexRadius(): number {
		return this.baseVertexRadius;
	}

	/** @java GraphStyle#setBaseVertexRadius(double) */
	setBaseVertexRadius(vr: number): void {
		this.baseVertexRadius = vr;
	}

	// -----------------------------------------------------------------------

	/** @java GraphStyle#baseLineWidth() */
	getBaseLineWidth(): number {
		return this.baseLineWidth;
	}

	/** @java GraphStyle#setBaseLineWidth(double) */
	setBaseLineWidth(lw: number): void {
		this.baseLineWidth = lw;
	}

	// -----------------------------------------------------------------------

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	// -----------------------------------------------------------------------
}
