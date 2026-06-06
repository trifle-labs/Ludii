// @java Player/src/app/move/MoveUtil.java

import { MoveFormat } from "./MoveFormat.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported deps
// ---------------------------------------------------------------------------

/** @java app.PlayerApp */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayerApp = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java other.move.Move */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Move = any;

/** @java other.action.Action */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Action = any;

// ---------------------------------------------------------------------------

/**
 * Utility functions for dealing with move formatting.
 *
 * @java app.move.MoveUtil
 */
export class MoveUtil {

	// -------------------------------------------------------------------------

	/**
	 * Gets the action string for a specified Action object.
	 * @java MoveUtil#getActionFormat(Action, Context, boolean, boolean)
	 */
	static getActionFormat(
		action: Action,
		context: Context,
		shortMoveFormat: boolean,
		useCoords: boolean,
	): string {
		if (shortMoveFormat) {
			return action.toTurnFormat(context.currentInstanceContext(), useCoords);
		} else {
			return action.toMoveFormat(context.currentInstanceContext(), useCoords);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Get the formatted string for a move.
	 * @java MoveUtil#getMoveFormat(PlayerApp, Move, Context)
	 */
	static getMoveFormat(app: PlayerApp, move: Move, context: Context): string {
		const settingMoveFormat: MoveFormat = app.settingsPlayer().moveFormat();
		const useCoords: boolean = app.settingsPlayer().isMoveCoord();

		// Full move format
		if (settingMoveFormat === MoveFormat.Full) {
			const actionsToPrint: Action[] = [...move.getActionsWithConsequences(context)];
			const completeActionLastMove: string[] = [];

			for (const a of actionsToPrint) {
				completeActionLastMove.push(a.toMoveFormat(context.currentInstanceContext(), useCoords));
			}

			let result = completeActionLastMove.join(", ");
			if (actionsToPrint.length > 1) {
				result = "[" + result + "]";
			}

			return result;
		}

		// Default/Short move format
		else {
			const shortMoveFormat = settingMoveFormat === MoveFormat.Short;

			const modeMode: string = context.game.mode().mode();

			if (modeMode === "Simultaneous") {
				const parts: string[] = [];
				for (const action of move.actions()) {
					if (action.isDecision()) {
						parts.push(MoveUtil.getActionFormat(action, context, shortMoveFormat, useCoords));
					}
				}
				if (parts.length > 0) return parts.join(", ");
				return ".\n";
			} else if (modeMode === "Simulation") {
				const parts: string[] = [];
				for (const action of move.actions()) {
					parts.push(MoveUtil.getActionFormat(action, context, shortMoveFormat, useCoords));
				}
				if (parts.length > 0) return parts.join(", ");
				return ".\n";
			} else {
				for (const action of move.actions()) {
					if (action.isDecision()) {
						return MoveUtil.getActionFormat(action, context, shortMoveFormat, useCoords);
					}
				}
			}

			return ".\n";
		}
	}

	// -------------------------------------------------------------------------
}
