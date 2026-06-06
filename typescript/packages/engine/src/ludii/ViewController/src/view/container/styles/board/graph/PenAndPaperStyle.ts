// @java ViewController/src/view/container/styles/board/graph/PenAndPaperStyle.java

/**
 * Container style for pen-and-paper graph boards (e.g. Slitherlink, Nurikabe).
 * Extends GraphStyle and adds PenAndPaperComponents and PenAndPaperDesign.
 *
 * Faithful 1:1 port of view.container.styles.board.graph.PenAndPaperStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.styles.board.graph.PenAndPaperStyle
 */

// GraphStyle               -> this batch: ./GraphStyle.ts
// PenAndPaperDesign        -> batch 24: src/ludii/ViewController/src/view/container/aspects/designs/board/graph/PenAndPaperDesign.ts
// PenAndPaperComponents    -> batch 26: src/ludii/ViewController/src/view/container/aspects/components/board/PenAndPaperComponents.ts
// Bridge                   -> src/ludii/ViewController/src/bridge/Bridge.ts
// Container                -> game.equipment.container.Container (Core)
// Context                  -> other.context.Context (Core)

import { Bridge } from '../../../../../bridge/Bridge.js';
import { GraphStyle } from './GraphStyle.js';

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java view.container.aspects.designs.board.graph.PenAndPaperDesign */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PenAndPaperDesign = any;

/** @java view.container.aspects.components.board.PenAndPaperComponents */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PenAndPaperComponents = any;

/**
 * PenAndPaperStyle — faithful 1:1 port.
 * Extends GraphStyle.
 *
 * In Java:
 *   public class PenAndPaperStyle extends GraphStyle {
 *     public PenAndPaperStyle(Bridge, Container, Context) {
 *       super(bridge, container, context);
 *       final PenAndPaperDesign boardDesign =
 *           new PenAndPaperDesign(bridge, this, boardPlacement);
 *       containerDesign = boardDesign;
 *       containerComponents = new PenAndPaperComponents(bridge, this, boardDesign);
 *     }
 *   }
 *
 * @java view.container.styles.board.graph.PenAndPaperStyle
 */
export class PenAndPaperStyle extends GraphStyle {

	/** @java PenAndPaperStyle#containerComponents (inherited via BaseContainerStyle) */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected containerComponents: PenAndPaperComponents | null = null;

	// -----------------------------------------------------------------------

	/**
	 * @java PenAndPaperStyle#PenAndPaperStyle(Bridge, Container, Context)
	 */
	constructor(bridge: Bridge, container: Container, context: Context) {
		super(bridge, container, context);
		// NOTE: When PenAndPaperDesign (batch 24) and PenAndPaperComponents (batch 26)
		// are ported, replace the body below:
		//
		// const boardDesign = new PenAndPaperDesign(bridge, this, boardPlacement);
		// containerDesign = boardDesign;
		// containerComponents = new PenAndPaperComponents(bridge, this, boardDesign);
		this.containerDesign = null;
		this.containerComponents = null;
	}

	// -----------------------------------------------------------------------
}
