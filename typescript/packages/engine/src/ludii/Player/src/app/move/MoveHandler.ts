// @java Player/src/app/move/MoveHandler.java

import { FullLocation } from "../../../../../ludemes/other/location/FullLocation.js";
import { ActionSet } from "../../../../../ludemes/other/action/puzzle/ActionSet.js";
import { ActionReset } from "../../../../../ludemes/other/action/puzzle/ActionReset.js";
import { ActionToggle } from "../../../../../ludemes/other/action/puzzle/ActionToggle.js";
import type { SiteType } from "../../../../../ludemes/other/action/SiteType.js";

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

/** @java other.location.Location */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Location = any;

/** @java other.action.Action */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Action = any;

/** @java game.equipment.component.Component */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Component = any;

/** @java game.util.directions.AbsoluteDirection */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AbsoluteDirection = any;

/** @java main.collections.FastArrayList<Move> */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FastArrayListMove = any[];

/** Constants.UNDEFINED = -1. @java main.Constants#UNDEFINED */
const UNDEFINED = -1;

/** Constants.NO_PIECE. @java main.Constants#NO_PIECE */
const NO_PIECE = 0;

// ---------------------------------------------------------------------------

/**
 * Functions for handling moves made by humans.
 *
 * @author Matthew.Stephenson
 * @java app.move.MoveHandler
 */
export class MoveHandler {

	// -------------------------------------------------------------------------

	/**
	 * Try to make a move for the specified From and To locations.
	 * If more than one possible move is found, the user is asked which they want.
	 * If one possible move is found, that move is applied.
	 * @return True if a matching legal move found, false otherwise.
	 * @java MoveHandler#tryGameMove(PlayerApp, Location, Location, boolean, int)
	 */
	static tryGameMove(
		app: PlayerApp,
		locnFromInfo: Location,
		locnToInfo: Location,
		passMove: boolean,
		selectPlayerMove: number,
	): boolean {
		const context: Context = app.manager().ref().context();
		const legal = context.game.moves(context);
		const possibleMoves: FastArrayListMove = [];

		// only used in web app, to force multiple possible moves in some cases.
		let forceMultiplePossibleMoves = false;

		// Check if de-selecting a previously selected piece
		if (
			app.settingsPlayer().componentIsSelected()
			&& app.bridge().settingsVC().lastClickedSite().equals(locnFromInfo)
		) {
			return false;
		}

		if (app.bridge().settingsVC().selectingConsequenceMove()) {
			MoveHandler._applyConsequenceChosen(app, locnToInfo);
			return true;
		}

		if (passMove) {
			for (const m of legal.moves()) {
				if (m.isPass?.()) possibleMoves.push(m);
				if (m.containsNextInstance?.()) possibleMoves.push(m);
			}
		} else if (selectPlayerMove !== -1) {
			for (const m of legal.moves()) {
				if (m.playerSelected?.() === selectPlayerMove) possibleMoves.push(m);
			}
		} else {
			for (const move of legal.moves()) {
				if (locnFromInfo.site() === -1) return false;

				// Check if any other legal moves have fromInfo as their from location.
				if (
					locnFromInfo.equals(locnToInfo)
					&& move.getFromLocation?.().equals(locnFromInfo)
					&& !move.getToLocation?.().equals(locnToInfo)
					&& !app.settingsPlayer().componentIsSelected()
				) {
					forceMultiplePossibleMoves = true;
				}

				// If move matches clickInfo, then store it as a possible move.
				if (MoveHandler._moveMatchesLocation(app, move, locnFromInfo, locnToInfo, context)) {
					let moveAlreadyAvailable = false;
					for (const m of possibleMoves) {
						if (
							JSON.stringify(m.getActionsWithConsequences?.(context))
							=== JSON.stringify(move.getActionsWithConsequences?.(context))
						) {
							moveAlreadyAvailable = true;
						}
					}

					if (!moveAlreadyAvailable) possibleMoves.push(move);
				}
			}
		}

		if (app.settingsPlayer().printMoveFeatures?.() || app.settingsPlayer().printMoveFeatureInstances?.()) {
			MoveHandler._printMoveFeatures(app, context, possibleMoves);
			return false;
		}

		if (
			possibleMoves.length > 1
			|| (possibleMoves.length > 0 && forceMultiplePossibleMoves && !app.settingsPlayer().usingMYOGApp())
		) {
			// If several different moves are possible.
			return MoveHandler._handleMultiplePossibleMoves(app, possibleMoves, context);
		} else if (possibleMoves.length === 1) {
			if (MoveHandler.moveChecks(app, possibleMoves[0]!)) {
				app.manager().ref().applyHumanMoveToGame(app.manager(), possibleMoves[0]!);
				return true; // move found
			}
		}

		return false; // move not found
	}

	// -------------------------------------------------------------------------

	/**
	 * Not supported — prints error.
	 * @java MoveHandler#printMoveFeatures(PlayerApp, Context, FastArrayList<Move>)
	 */
	private static _printMoveFeatures(
		_app: PlayerApp,
		_context: Context,
		_possibleMoves: FastArrayListMove,
	): void {
		// Not supported anymore because decision trees in metadata mess up the implementation
		console.error("Printing move features is not currently supported.");
	}

	// -------------------------------------------------------------------------

	/**
	 * Try to carry out a move for the puzzle.
	 * @java MoveHandler#tryPuzzleMove(PlayerApp, Location, Location)
	 */
	static tryPuzzleMove(
		app: PlayerApp,
		locnFromInfo: Location,
		locnToInfo: Location,
	): void {
		const context: Context = app.contextSnapshot().getContext(app);
		const legal = context.game.moves(context);

		for (const move of legal.moves()) {
			if (MoveHandler._moveMatchesLocation(app, move, locnFromInfo, locnToInfo, context)) {
				const cs = context.state().containerStates()[0];

				const site: number = move.from();
				let setType: SiteType = move.fromType() as SiteType;

				let maxValue = 0;
				let puzzleValue = 0;
				let valueResolved = false;
				let valueFound = false;

				maxValue = context.board().getRange(setType).max(context);
				puzzleValue = cs.what(site, setType);
				valueResolved = cs.isResolved(site, setType);
				valueFound = false;

				if (!valueResolved) puzzleValue = -1;

				for (let i = puzzleValue + 1; i < maxValue + 1; i++) {
					const a = new ActionSet(setType, site, i);
					a.setDecision(true);

					// Build move escape-hatch (Java: new Move(a))
					const m: any = MoveHandler._buildPuzzleMove(a, move.from(), move.to(), site);

					if (
						context.game.moves(context).moves().some((lm: any) => MoveHandler._movesEqual(lm, m))
						|| (app.settingsPlayer().illegalMovesValid?.() && i > 0)
					) {
						valueFound = true;
						puzzleValue = i;
						break;
					}
				}

				const dialogOption: any = app.settingsPlayer().puzzleDialogOption();

				// PuzzleSelectionType.Dialog = "Dialog", PuzzleSelectionType.Automatic = "Automatic"
				if (
					dialogOption === "Dialog"
					|| (dialogOption === "Automatic" && maxValue > 3)
				) {
					app.showPuzzleDialog(site);
				} else {
					if (!valueFound) {
						const resetMove: any = MoveHandler._buildResetMove(
							new ActionReset(context.board().defaultSite(), site, maxValue + 1),
						);
						if (MoveHandler.moveChecks(app, resetMove)) {
							app.manager().ref().applyHumanMoveToGame(app.manager(), resetMove);
						}
					} else {
						MoveHandler.puzzleMove(app, site, puzzleValue, true, setType);

						// Set all unresolved edges, faces and vertices to the first value.
						if (context.trial().over()) {
							setType = "Edge" as SiteType;
							for (let i = 0; i < context.board().topology().edges().length; i++) {
								if (!cs.isResolvedEdges(i)) {
									MoveHandler.puzzleMove(app, i, 0, true, setType);
								}
							}

							setType = "Cell" as SiteType;
							for (let i = 0; i < context.board().topology().cells().length; i++) {
								if (!cs.isResolvedVerts(i)) {
									MoveHandler.puzzleMove(app, i, 0, true, setType);
								}
							}

							setType = "Vertex" as SiteType;
							for (let i = 0; i < context.board().topology().vertices().length; i++) {
								if (!cs.isResolvedCell(i)) {
									MoveHandler.puzzleMove(app, i, 0, true, setType);
								}
							}
						}
					}
				}

				break;
			}
		}
	}

	/**
	 * Move made specifically for a puzzle game.
	 * Involves either selecting a value or toggling a value for a site.
	 * @java MoveHandler#puzzleMove(PlayerApp, int, int, boolean, SiteType)
	 */
	static puzzleMove(
		app: PlayerApp,
		site: number,
		puzzleValue: number,
		leftClick: boolean,
		type: SiteType,
	): void {
		let a: ActionSet | ActionToggle;

		if (leftClick) {
			a = new ActionSet(type, site, puzzleValue); // Set value
		} else {
			a = new ActionToggle(type, site, puzzleValue); // Toggle value
		}

		const m: any = MoveHandler._buildPuzzleMove(a, site, site, site);

		if (MoveHandler.moveChecks(app, m)) {
			app.manager().ref().applyHumanMoveToGame(app.manager(), m);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Handle the cases where several moves are possible for the same from/to ClickInfo.
	 * @java MoveHandler#handleMultiplePossibleMoves(PlayerApp, FastArrayList<Move>, Context)
	 */
	private static _handleMultiplePossibleMoves(
		app: PlayerApp,
		possibleMoves: FastArrayListMove,
		context: Context,
	): boolean {
		app.bridge().settingsVC().possibleConsequenceLocations().length = 0;
		app.manager().settingsManager().possibleConsequenceMoves().length = 0;
		app.bridge().settingsVC().setSelectingConsequenceMove(false);

		let minMoveLength = 9999;
		for (const m of possibleMoves) {
			const len = m.getActionsWithConsequences?.(context)?.length ?? 0;
			if (len < minMoveLength) minMoveLength = len;
		}

		let differentAction = -1;
		for (let i = 0; i < minMoveLength; i++) {
			let sameAction: Action | null = null;
			let allSame = true;
			for (const m of possibleMoves) {
				const actions = m.getActionsWithConsequences?.(context) ?? [];
				if (sameAction == null) {
					sameAction = actions[i];
				} else if (JSON.stringify(sameAction) !== JSON.stringify(actions[i])) {
					allSame = false;
				}
			}

			if (!allSame) {
				differentAction = i;
				break;
			}
		}

		if (differentAction === -1) {
			app.showPossibleMovesDialog(context, possibleMoves);
			return false;
		} else {
			for (const m of possibleMoves) {
				const actions = m.getActionsWithConsequences?.(context) ?? [];
				const diffAct = actions[differentAction];

				app.bridge().settingsVC().possibleConsequenceLocations().push(
					new FullLocation(
						diffAct.to(),
						diffAct.levelTo(),
						diffAct.toType(),
					),
				);

				app.manager().settingsManager().possibleConsequenceMoves().push(m);

				if (diffAct.to() < 0) {
					app.showPossibleMovesDialog(context, possibleMoves);
					return false;
				}
			}

			// If any of the possibleToLocations are duplicates then need the dialog.
			const checkForDuplicates: Location[] = [];
			let duplicateFound = false;
			const consequenceLocations: Location[] = app.bridge().settingsVC().possibleConsequenceLocations();

			for (let i = 0; i < consequenceLocations.length; i++) {
				for (const location of checkForDuplicates) {
					if (location.equals(consequenceLocations[i])) {
						duplicateFound = true;
						break;
					}
				}
				if (duplicateFound) {
					app.showPossibleMovesDialog(context, possibleMoves);
					return false;
				}
				checkForDuplicates.push(consequenceLocations[i]!);
			}

			app.bridge().settingsVC().setSelectingConsequenceMove(true);

			// Need to set this message so that it overrides the "invalid move" message.
			app.setTemporaryMessage("Please select a consequence.");

			return true;
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Applies the chosen consequence, corresponding with the selected location.
	 * @java MoveHandler#applyConsequenceChosen(PlayerApp, Location)
	 */
	private static _applyConsequenceChosen(app: PlayerApp, location: Location): void {
		let moveMade = false;
		const consequenceLocations: Location[] = app.bridge().settingsVC().possibleConsequenceLocations();

		for (let i = 0; i < consequenceLocations.length; i++) {
			if (consequenceLocations[i]!.site() === location.site()) {
				const consequenceMove = app.manager().settingsManager().possibleConsequenceMoves()[i];
				if (MoveHandler.moveChecks(app, consequenceMove)) {
					app.manager().ref().applyHumanMoveToGame(app.manager(), consequenceMove);
					moveMade = true;
					break;
				}
			}
		}

		if (!moveMade) {
			app.setVolatileMessage("That is not a valid move.");
		}

		app.bridge().settingsVC().setSelectingConsequenceMove(false);
		app.bridge().settingsVC().possibleConsequenceLocations().length = 0;

		app.manager().settingsManager().possibleConsequenceMoves().length = 0;
	}

	// -------------------------------------------------------------------------

	/**
	 * Checks if Move matches the From and To location information.
	 * @java MoveHandler#moveMatchesLocation(PlayerApp, Move, Location, Location, Context)
	 */
	private static _moveMatchesLocation(
		app: PlayerApp,
		move: Move,
		fromInfo: Location,
		toInfo: Location,
		context: Context,
	): boolean {
		if (MoveHandler._checkVertexMoveForEdge(move, fromInfo, toInfo, context)) return true;

		if (
			move.matchesUserMove?.(
				fromInfo.site(), fromInfo.level(), fromInfo.siteType(),
				toInfo.site(), toInfo.level(), toInfo.siteType(),
			)
		) {
			return MoveHandler._moveMatchesDraggedPieceRotation(app, move, fromInfo);
		}

		return false;
	}

	// -------------------------------------------------------------------------

	/**
	 * @return Whether the player dragged between two vertices to indicate an edge move.
	 * @java MoveHandler#checkVertexMoveForEdge(Move, Location, Location, Context)
	 */
	private static _checkVertexMoveForEdge(
		move: Move,
		fromInfo: Location,
		toInfo: Location,
		context: Context,
	): boolean {
		// player can perform an edge move by dragging between its two vertices.
		if (
			move.fromType() === "Edge"
			&& move.toType() === "Edge"
			&& move.getFromLocation?.().equals(move.getToLocation?.())
		) {
			// only works if dragging between vertices, and not dragging to the same vertex.
			if (
				fromInfo.siteType() === "Vertex"
				&& fromInfo.siteType() === "Vertex"  // Java: fromInfo checked twice (likely a bug kept faithfully)
				&& fromInfo.site() !== toInfo.site()
			) {
				if (move.from() === move.to()) {
					const edgeIndex: number = move.from();
					const edges: any[] = context.board().topology().edges();
					const edge = edges[edgeIndex];
					const va = edge?.vA?.();
					const vb = edge?.vB?.();

					if (va?.index() === fromInfo.site() && vb?.index() === toInfo.site()) {
						return true;
					}

					if (
						!move.isOrientedMove?.()
						&& vb?.index() === fromInfo.site()
						&& va?.index() === toInfo.site()
					) {
						return true;
					}
				}
			} else {
				return false;
			}
		}

		return false;
	}

	// -------------------------------------------------------------------------

	/**
	 * Returns true if the rotation of the dragged component matches the move specified.
	 * @java MoveHandler#moveMatchesDraggedPieceRotation(PlayerApp, Move, Location)
	 */
	private static _moveMatchesDraggedPieceRotation(
		app: PlayerApp,
		move: Move,
		fromInfo: Location,
	): boolean {
		const context: Context = app.contextSnapshot().getContext(app);

		if (context.game.hasLargePiece?.() && app.bridge().settingsVC().pieceBeingDragged()) {
			const containerId: number = MoveHandler._getContainerId(context, fromInfo.site(), fromInfo.siteType());
			const componentIndex: number = context.containerState(containerId)?.whatCell(fromInfo.site());

			if (
				componentIndex > 0
				&& move.what() === NO_PIECE
				&& context.components()[componentIndex]?.isLargePiece?.()
				&& move.state?.() !== app.settingsPlayer().dragComponentState()
			) {
				return false;
			}
		}

		return true;
	}

	// -------------------------------------------------------------------------

	/**
	 * Applies the legal move that matches the direction (if only one match).
	 * @java MoveHandler#applyDirectionMove(PlayerApp, AbsoluteDirection)
	 */
	static applyDirectionMove(app: PlayerApp, direction: AbsoluteDirection): void {
		const context: Context = app.manager().ref().context();
		const legal = context.game.moves(context);

		// Find all valid moves for the specified direction.
		const validMovesfound: Move[] = [];
		for (const m of legal.moves()) {
			if (direction === m.direction?.(context.topology())) {
				validMovesfound.push(m);
			}
		}

		// If only one valid move found, apply it to the game.
		if (validMovesfound.length === 1) {
			if (MoveHandler.moveChecks(app, validMovesfound[0]!)) {
				app.manager().ref().applyHumanMoveToGame(app.manager(), validMovesfound[0]!);
			}
		} else {
			if (validMovesfound.length === 0) {
				app.setVolatileMessage("No valid moves found for Direction " + direction?.name?.());
			} else {
				app.setVolatileMessage("Too many valid moves found for Direction " + direction?.name?.());
			}

			// EventQueue.invokeLater — escape-hatch; use queueMicrotask
			queueMicrotask(() => {
				app.manager().getPlayerInterface().repaint();
			});
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Checks if any of the legal moves are duplicates or not decisions.
	 * @java MoveHandler#checkMoveWarnings(PlayerApp)
	 */
	static checkMoveWarnings(app: PlayerApp): void {
		const context: Context = app.contextSnapshot().getContext(app);
		const legal = context.moves(context);

		for (let i = 0; i < legal.moves().length; i++) {
			const m1: Move = legal.moves()[i];

			if (!context.game.isSimulationMoveGame?.()) {
				// Check if any moves are not decisions.
				if (!m1.isDecision?.()) {
					app.manager().getPlayerInterface().addTextToStatusPanel(
						"WARNING: Move " + m1.getActionsWithConsequences?.(context)
						+ " was not a decision move. If you see this in an official Ludii game, please report it to us.\n",
					);
				}

				// Check if any moves have more than one decision.
				let decisionCounter = 0;
				for (const a of m1.actions()) {
					if (a.isDecision()) decisionCounter++;
				}
				if (decisionCounter > 1) {
					app.manager().getPlayerInterface().addTextToStatusPanel(
						"WARNING: Move " + m1.getActionsWithConsequences?.(context)
						+ " has multiple decision actions. If you see this in an official Ludii game, please report it to us.\n",
					);
				}

				// Check if any moves have an illegal mover.
				if (m1.mover <= 0 || m1.mover > context.game.players().count()) {
					app.manager().getPlayerInterface().addTextToStatusPanel(
						"WARNING: Move " + m1.getActionsWithConsequences?.(context)
						+ " has an illegal mover (" + m1.mover + "). If you see this in an official Ludii game, please report it to us.\n",
					);
				}

				// Check if more than one pass move.
				let passMoveCounter = 0;
				if (m1.isPass?.()) passMoveCounter++;
				if (passMoveCounter > 1) {
					app.manager().getPlayerInterface().addTextToStatusPanel(
						"WARNING: Multiple Pass moves detected in the legal moves.\n",
					);
				}

				// Check if more than one swap move.
				let swapMoveCounter = 0;
				if (m1.isSwap?.()) swapMoveCounter++;
				if (swapMoveCounter > 1) {
					app.manager().getPlayerInterface().addTextToStatusPanel(
						"WARNING: Multiple Swap moves detected in the legal moves.\n",
					);
				}
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Checks that need to be made before any code specific to moves is performed.
	 * @java MoveHandler#moveChecks(PlayerApp, Move)
	 */
	static moveChecks(app: PlayerApp, move: Move): boolean {
		const context: Context = app.manager().ref().context();

		if (!move.isAlwaysGUILegal?.() && !context.model().verifyMoveLegal(context, move)) {
			console.error("Selected illegal move: " + move.getActionsWithConsequences?.(context));
			app.addTextToStatusPanel(
				"Selected illegal move: " + move.getActionsWithConsequences?.(context) + "\n",
			);
			return false;
		}

		return true;
	}

	// -------------------------------------------------------------------------

	/**
	 * Returns the component associated with the to position of the last move.
	 * @java MoveHandler#getLastMovedPiece(PlayerApp)
	 */
	static getLastMovedPiece(app: PlayerApp): Component | null {
		const context: Context = app.manager().ref().context();
		const lastMove: Move = context.trial().lastMove();

		if (lastMove != null) {
			try {
				const containerId: number = MoveHandler._getContainerId(
					context,
					lastMove.getToLocation?.()?.site(),
					lastMove.getToLocation?.()?.siteType(),
				);
				const what: number = context.containerState(containerId)?.what(
					lastMove.getToLocation?.()?.site(),
					lastMove.getToLocation?.()?.siteType(),
				);

				// TODO update exhib rules so that you can only drag to correct site on shared hand.
				if (containerId === 3) return null;

				if ((context.trial().numberRealMoves?.() ?? 0) <= 0 || what === 0) return null;

				const lastMoveComponent: Component = context.game.equipment().components()[what];
				return lastMoveComponent;
			} catch (e) {
				return null;
			}
		}

		return null;
	}

	// -------------------------------------------------------------------------
	// Internal helpers
	// -------------------------------------------------------------------------

	/**
	 * Inline container-id lookup.
	 * @java util.ContainerUtil#getContainerId(Context, int, SiteType)
	 */
	private static _getContainerId(context: any, site: number, type: string): number {
		if (site === UNDEFINED) return UNDEFINED;
		if (type !== "Cell") return context.board().index();
		return context.containerId()[site] ?? 0;
	}

	/**
	 * Build a move object for a puzzle action (escape-hatch for Java's new Move(a)).
	 * @java other.move.Move#Move(Action)
	 */
	private static _buildPuzzleMove(action: any, from: number, to: number, edge: number): any {
		// Escape-hatch: create a minimal move-like object with setDecision, etc.
		action.setDecision(true);
		return {
			actions: () => [action],
			from: () => from,
			to: () => to,
			mover: 0,
			isAlwaysGUILegal: () => false,
			isDecision: () => true,
			setDecision: (v: boolean) => { action.setDecision(v); },
			getActionsWithConsequences: () => [action],
		};
	}

	/**
	 * Build a reset move object (escape-hatch for Java's new Move(ActionReset)).
	 * @java other.move.Move#Move(ActionReset)
	 */
	private static _buildResetMove(action: ActionReset): any {
		action.setDecision(true);
		return {
			actions: () => [action],
			from: () => -1,
			to: () => -1,
			mover: 0,
			isAlwaysGUILegal: () => false,
			isDecision: () => true,
			getActionsWithConsequences: () => [action],
		};
	}

	/**
	 * Shallow move equality check (escape-hatch for Move.equals in puzzle context).
	 */
	private static _movesEqual(m1: any, m2: any): boolean {
		// Compare decision action fields
		const a1 = m1.actions?.()[0];
		const a2 = m2.actions?.()[0];
		if (a1 == null || a2 == null) return false;
		return (
			a1.from?.() === a2.from?.()
			&& a1.to?.() === a2.to?.()
			&& a1.what?.() === a2.what?.()
			&& a1.isDecision?.() === a2.isDecision?.()
		);
	}

	// -------------------------------------------------------------------------
}
