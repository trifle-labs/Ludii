// @java ViewController/src/controllers/container/PyramidalController.java

import type { Point } from "../../../../awt/index.js";
import type { Bridge } from "../../bridge/Bridge.js";
import type { Container } from "../../../../../ludemes/game/equipment/container/Container.js";
import type { Location } from "../../../../../ludemes/other/location/Location.js";
import { FullLocation } from "../../../../../ludemes/other/location/FullLocation.js";
import type { WorldLocation } from "../../util/WorldLocation.js";
import type { Context } from "../../../../../ludemes/other/context/Context.js";
import type { ContainerStyle } from "../../view/container/ContainerStyle.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/**
 * Escape-hatch for Action (subset used here).
 * @java other.action.Action
 */
interface ActionLike {
	isDecision(): boolean;
	actionType(): string | null;
	from(): number;
	to(): number;
}

/**
 * Escape-hatch for Move (subset used here).
 * @java other.move.Move
 */
interface MoveLike {
	actions(): unknown[];
}

/**
 * Escape-hatch for Moves (the move-list container, subset used here).
 * @java game.rules.play.moves.Moves
 */
interface MovesLike {
	moves(): { size(): number; get(i: number): MoveLike };
}

// BaseController is in batch 31 — use escape-hatch until that port lands.
/** @java controllers.BaseController — escape-hatch until batch 31 is ported */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BaseControllerPlaceholder: any = class {
	protected container: Container;
	protected bridge: Bridge;
	constructor(bridge: Bridge, container: Container) {
		this.bridge = bridge;
		this.container = container;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	translateClicktoSite(_pt: Point, _context: Context, _allLocations: any[]): Location {
		return new FullLocation(-1);
	}
};

/**
 * Controller for pyramidal boards/games (e.g. Shibumi).
 *
 * Faithful 1:1 port of controllers.container.PyramidalController.
 *
 * @author Matthew.Stephenson (Java original)
 * @java controllers.container.PyramidalController
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class PyramidalController extends (BaseControllerPlaceholder as any) {

	// -------------------------------------------------------------------------

	/**
	 * @java PyramidalController(bridge.Bridge, game.equipment.container.Container)
	 */
	constructor(bridge: Bridge, container: Container) {
		super(bridge, container);
	}

	// -------------------------------------------------------------------------

	/**
	 * Returns the Location for the site closest to pt, for pyramidal boards.
	 * If using a Shibumi board and a piece is selected, checks that there are
	 * no add moves on the sites above it.
	 *
	 * @java PyramidalController#translateClicktoSite(Point, Context, ArrayList)
	 */
	protected translateClicktoSite(
		pt: Point,
		context: Context,
		allLocations: WorldLocation[]
	): Location {
		let location: Location = super.translateClicktoSite(pt, context, allLocations);

		const legal: MovesLike = (context as unknown as { moves(ctx: Context): MovesLike }).moves(context);

		if (location.site() !== -1) {
			const containerStyle: ContainerStyle = (this as unknown as { bridge: Bridge }).bridge.getContainerStyle(
				(this as unknown as { container: Container }).container.index()
			) as ContainerStyle;

			// If using a Shibumi board and have selected a piece, check that there
			// are no add moves on the sites above it.
			let newCid = -1;
			// drawnCells() returns Cell[] — access by index via array bracket notation
			const drawnCells = containerStyle.drawnCells();
			const selectedVertex = drawnCells[location.site()]!;
			// centroid() in TS returns { x, y } (not Java's Point2D with getX/getY)
			const selCx = selectedVertex.centroid().x;
			const selCy = selectedVertex.centroid().y;
			const possibleCid: number[] = [];

			for (const vertex of drawnCells) {
				if (
					Math.abs(vertex.centroid().x - selCx) < 0.001 &&
					Math.abs(vertex.centroid().y - selCy) < 0.001
				) {
					possibleCid.push(vertex.index());
				}
			}

			for (let m = 0; m < legal.moves().size(); m++) {
				let decisionAction: ActionLike | null = null;
				const move: MoveLike = legal.moves().get(m);
				for (let a = 0; a < move.actions().length; a++) {
					const action = move.actions()[a] as ActionLike;
					if (action.isDecision()) {
						decisionAction = action;
						break;
					}
				}
				if (decisionAction !== null && decisionAction.actionType() === "Add") {
					for (let i = 0; i < possibleCid.length; i++) {
						const moveIndex = possibleCid[i];

						if (decisionAction.from() === moveIndex && decisionAction.to() === moveIndex) {
							newCid = moveIndex;
							break;
						}
					}
					if (newCid !== -1) {
						location = new FullLocation(newCid, location.level(), location.siteType());
						break;
					}
				}
			}
		}

		return location;
	}

	// -------------------------------------------------------------------------
}
