// @java Player/src/app/move/MouseHandler.java

import { Point } from "../../../../awt/index.js";
import { FullLocation } from "../../../../../ludemes/other/location/FullLocation.js";
import { LocationUtil } from "../../../../ViewController/src/util/LocationUtil.js";
import { MoveHandler } from "./MoveHandler.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported deps
// ---------------------------------------------------------------------------

/** @java app.PlayerApp */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayerApp = any;

/** @java other.location.Location */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Location = any;

/** Constants.UNDEFINED = -1. @java main.Constants#UNDEFINED */
const UNDEFINED = -1;

// ---------------------------------------------------------------------------

/**
 * Functions that handle any "mouse" actions.
 *
 * @author Matthew.Stephenson
 * @java app.move.MouseHandler
 */
export class MouseHandler {

	// -------------------------------------------------------------------------

	/**
	 * Code that is applied when a mouse is pressed.
	 * @java MouseHandler#mousePressedCode(PlayerApp, Point)
	 */
	static mousePressedCode(app: PlayerApp, pressedPoint: Point): void {
		if (!MouseHandler._mouseChecks(app)) return;

		const context = app.contextSnapshot().getContext(app);

		if (app.bridge().settingsVC().selectedFromLocation().equals(new FullLocation(UNDEFINED))) {
			app.settingsPlayer().setComponentIsSelected(false);
		}

		// Can't select pieces if the AI is moving
		if (
			app.manager().aiSelected()[app.manager().moverToAgent()]?.ai() != null
			&& !app.manager().settingsManager().agentsPaused()
		) {
			return;
		}

		// Get the nearest valid from location to the pressed point.
		if (app.settingsPlayer().sandboxMode()) {
			app.bridge().settingsVC().setSelectedFromLocation(
				LocationUtil.calculateNearestLocation(
					context, app.bridge(), pressedPoint,
					LocationUtil.getAllLocations(context, app.bridge()),
				),
			);
		} else if (!app.settingsPlayer().componentIsSelected()) {
			app.bridge().settingsVC().setSelectedFromLocation(
				LocationUtil.calculateNearestLocation(
					context, app.bridge(), pressedPoint,
					LocationUtil.getLegalFromLocations(context),
				),
			);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Code that is applied when a mouse is released.
	 * @java MouseHandler#mouseReleasedCode(PlayerApp, Point)
	 */
	static mouseReleasedCode(app: PlayerApp, releasedPoint: Point): void {
		if (!MouseHandler._mouseChecks(app)) return;

		const context = app.contextSnapshot().getContext(app);
		const selectedFromLocation: Location = app.bridge().settingsVC().selectedFromLocation();
		let selectedToLocation: Location;

		if (app.bridge().settingsVC().selectingConsequenceMove() || app.settingsPlayer().sandboxMode()) {
			selectedToLocation = LocationUtil.calculateNearestLocation(
				context, app.bridge(), releasedPoint,
				LocationUtil.getAllLocations(context, app.bridge()),
			);
		} else {
			selectedToLocation = LocationUtil.calculateNearestLocation(
				context, app.bridge(), releasedPoint,
				LocationUtil.getLegalToLocations(app.bridge(), context),
			);
		}

		// Account for any large component offsets
		if (
			app.bridge().settingsVC().pieceBeingDragged()
			&& app.settingsPlayer().dragComponent() != null
			&& app.bridge().getComponentStyle(app.settingsPlayer().dragComponent().index())
				?.getLargeOffsets()?.size() > app.settingsPlayer().dragComponentState()
		) {
			const newPoint = new Point(releasedPoint.x, releasedPoint.y);
			const largeOffset = app.bridge()
				.getComponentStyle(app.settingsPlayer().dragComponent().index())
				.getLargeOffsets()
				.get(app.settingsPlayer().dragComponentState());
			newPoint.x = Math.trunc(newPoint.x - largeOffset.getX());
			newPoint.y = Math.trunc(newPoint.y + largeOffset.getY());
			selectedToLocation = LocationUtil.calculateNearestLocation(
				context, app.bridge(), newPoint,
				LocationUtil.getLegalToLocations(app.bridge(), context),
			);
		}

		if (context.game.isDeductionPuzzle?.()) {
			MoveHandler.tryPuzzleMove(app, selectedFromLocation, selectedToLocation);
		} else {
			if (app.settingsPlayer().sandboxMode()) {
				// SandboxUtil.makeSandboxDragMove — escape-hatch
				const SandboxUtil: any = (globalThis as any).SandboxUtil;
				if (SandboxUtil?.makeSandboxDragMove) {
					SandboxUtil.makeSandboxDragMove(app, selectedFromLocation, selectedToLocation);
				}
			} else if (!MoveHandler.tryGameMove(app, selectedFromLocation, selectedToLocation, false, -1)) {
				// Remember the selected From location for next time.
				if (
					!app.settingsPlayer().componentIsSelected()
					&& !app.settingsPlayer().usingMYOGApp()
					&& app.bridge().settingsVC().lastClickedSite().equals(selectedFromLocation)
				) {
					app.settingsPlayer().setComponentIsSelected(true);
				} else {
					// Special exhibition code for making move piece to hands move / removing pieces.
					if (app.settingsPlayer().usingMYOGApp()) {
						// Escape-hatch: GUIUtil.pointOverlapsRectangle
						const GUIUtil: any = (globalThis as any).GUIUtil;
						if (GUIUtil?.pointOverlapsRectangle?.(releasedPoint, app.settingsPlayer().boardMarginPlacement())) {
							for (const m of context.game.moves(context).moves()) {
								if (selectedToLocation.site() === -1 || selectedToLocation.site() >= context.board().numSites()) {
									if (m.from() === selectedFromLocation.site() && m.to() >= context.board().numSites()) {
										app.manager().ref().applyHumanMoveToGame(app.manager(), m);
										break;
									}
								}
							}
						} else {
							for (const m of context.game.moves(context).moves()) {
								const firstAction = m.actions()[0];
								// ActionSelect check: escape-hatch (firstAction instanceof ActionSelect)
								if (
									m.from() === selectedFromLocation.site()
									&& firstAction?.isSelect?.()
									&& m.from() !== m.to()
								) {
									app.manager().ref().applyHumanMoveToGame(app.manager(), m);
									break;
								}
							}
						}
					} else {
						app.setVolatileMessage("That is not a valid move.");
					}
					app.settingsPlayer().setComponentIsSelected(false);
				}
			}
		}

		if (!app.settingsPlayer().componentIsSelected()) {
			app.bridge().settingsVC().setSelectedFromLocation(new FullLocation(UNDEFINED));
		}

		app.bridge().settingsVC().setPieceBeingDragged(false);
		app.settingsPlayer().setCurrentWalkExtra(0);
		app.repaint();
	}

	// -------------------------------------------------------------------------

	/**
	 * Code that is applied when a mouse is clicked.
	 * @java MouseHandler#mouseClickedCode(PlayerApp, Point)
	 */
	static mouseClickedCode(app: PlayerApp, point: Point): void {
		if (!MouseHandler._mouseChecks(app)) return;

		// Store the last clicked location, used for dev display and selecting pieces.
		const context = app.contextSnapshot().getContext(app);

		let clickedLocation: Location;
		if (app.settingsPlayer().componentIsSelected()) {
			clickedLocation = LocationUtil.calculateNearestLocation(
				context, app.bridge(), point,
				LocationUtil.getLegalToLocations(app.bridge(), context),
			);
		} else {
			clickedLocation = LocationUtil.calculateNearestLocation(
				context, app.bridge(), point,
				LocationUtil.getLegalFromLocations(context),
			);
		}

		// If no valid legal location was found, just use the closest site to what they clicked.
		if (clickedLocation.equals(new FullLocation(UNDEFINED))) {
			clickedLocation = LocationUtil.calculateNearestLocation(
				context, app.bridge(), point,
				LocationUtil.getAllLocations(context, app.bridge()),
			);
		}

		app.bridge().settingsVC().setLastClickedSite(clickedLocation);
		app.repaint();
	}

	// -------------------------------------------------------------------------

	/**
	 * Code that is applied when a mouse is dragged.
	 * @java MouseHandler#mouseDraggedCode(PlayerApp, Point)
	 */
	static mouseDraggedCode(app: PlayerApp, point: Point): void {
		if (!MouseHandler._mouseChecks(app)) return;

		const context = app.contextSnapshot().getContext(app);
		app.bridge().settingsVC().setSelectedFromLocation(app.bridge().settingsVC().selectedFromLocation());

		// Can't drag pieces in a deduction puzzle.
		if (context.game.isDeductionPuzzle?.()) return;

		if (app.settingsPlayer().usingMYOGApp()) {
			// repaint the whole view for exhibition mode.
			app.repaint();
		} else if (!app.bridge().settingsVC().pieceBeingDragged()) {
			// repaint the whole view when a piece starts to be dragged.
			app.repaint();
		} else {
			// Repaint between the dragged points and update location of dragged piece.
			app.repaintComponentBetweenPoints(
				context,
				app.bridge().settingsVC().selectedFromLocation(),
				app.settingsPlayer().oldMousePoint(),
				point,
			);
		}

		app.bridge().settingsVC().setPieceBeingDragged(true);
		app.settingsPlayer().setOldMousePoint(point);
	}

	// -------------------------------------------------------------------------

	/**
	 * Checks that need to be made before any code specific to mouse actions is performed.
	 * @java MouseHandler#mouseChecks(PlayerApp)
	 */
	private static _mouseChecks(app: PlayerApp): boolean {
		if (app.manager().settingsNetwork().getActiveGameId() !== 0) {
			if (
				app.contextSnapshot().getContext(app).state().mover()
				!== app.manager().settingsNetwork().getNetworkPlayerNumber()
			) {
				app.setVolatileMessage("Wait your turn!");
				return false;
			}
			for (let i = 1; i <= app.contextSnapshot().getContext(app).game.players().count(); i++) {
				if (app.manager().aiSelected()[i]?.name()?.trim() === "") {
					app.setVolatileMessage("Not all players have joined yet.");
					return false;
				}
			}
		}

		return true;
	}

	// -------------------------------------------------------------------------
}
