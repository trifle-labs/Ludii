// @java Player/src/app/move/MoveVisuals.java

import { Color, Point, Rectangle } from "../../../../awt/index.js";
import type { Graphics2D } from "../../../../awt/index.js";
import type { Point2D as Point2DType } from "../../../../awt/index.js";
import { ArrowUtil } from "../../../../ViewController/src/util/ArrowUtil.js";

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

/** @java game.rules.play.moves.Moves */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Moves = any;

/** @java game.rules.end.EndRule */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EndRule = any;

/** Constants.UNDEFINED = -1. @java main.Constants#UNDEFINED */
const UNDEFINED = -1;

// ---------------------------------------------------------------------------

/**
 * Functions that deal with specific visualisations of moves.
 *
 * @author Matthew.Stephenson
 * @java app.move.MoveVisuals
 */
export class MoveVisuals {

	// -------------------------------------------------------------------------

	/**
	 * Draw the last move that was performed.
	 * @java MoveVisuals#drawLastMove(PlayerApp, Graphics2D, Context, Rectangle, Rectangle)
	 */
	static drawLastMove(
		app: PlayerApp,
		g2d: Graphics2D,
		context: Context,
		passLocation: Rectangle,
		otherLocation: Rectangle,
	): void {
		const lastMove: Move = context.currentInstanceContext().trial().lastMove();
		MoveVisuals._drawMove(
			app, g2d, context, passLocation, otherLocation, lastMove,
			new Color(1.0, 1.0, 0.0, 0.5),
		);
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw all possible moves as a set of arrows. Used for tutorial visualisation.
	 * @java MoveVisuals#drawTutorialVisualisatonArrows(PlayerApp, Graphics2D, Context, Rectangle, Rectangle)
	 */
	static drawTutorialVisualisatonArrows(
		app: PlayerApp,
		g2d: Graphics2D,
		context: Context,
		passLocation: Rectangle,
		otherLocation: Rectangle,
	): void {
		const game = context.game;
		for (const legalMove of game.moves(context).moves()) {
			for (const tutorialVisualisationMove of app.settingsPlayer().tutorialVisualisationMoves()) {
				if (
					tutorialVisualisationMove.getMoveWithConsequences(context)
						.equals(legalMove.getMoveWithConsequences(context))
				) {
					MoveVisuals._drawMove(
						app, g2d, context, passLocation, otherLocation, legalMove,
						new Color(1.0, 0.0, 0.0, 1.0),
					);
				}
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw the AI distribution.
	 * @java MoveVisuals#drawAIDistribution(PlayerApp, Graphics2D, Context, Rectangle, Rectangle)
	 */
	static drawAIDistribution(
		app: PlayerApp,
		g2d: Graphics2D,
		context: Context,
		passLocation: Rectangle,
		otherLocation: Rectangle,
	): void {
		if (context.trial().over()) return;

		if (app.manager().liveAIs() == null) return;

		for (const visualisationAI of app.manager().liveAIs()) {
			if (visualisationAI == null) continue;

			const visData = visualisationAI.aiVisualisationData();
			if (visData == null) continue;

			const aiDistribution: any = visData.searchEffort();
			const valueEstimates: any = visData.valueEstimates();
			const moves: Move[] = visData.moves();

			const maxVal: number = aiDistribution.max();

			for (let i = 0; i < aiDistribution.dim(); i++) {
				const val: number = aiDistribution.get(i);
				let probRatio = 0.05 + (0.95 * val) / maxVal;

				if (probRatio > 1) probRatio = 1;
				if (probRatio < -1) probRatio = -1;

				const move: Move = moves[i];
				const from: number = move.from();
				const to: number = move.to();

				const fromType: string = move.fromType();
				const toType: string = move.toType();

				const fromContainerIdx: number = MoveVisuals._getContainerId(context, from, fromType);
				const toContainerIdx: number = MoveVisuals._getContainerId(context, to, toType);

				if (from !== to) {
					const fromPosnWorld: Point2DType = app.bridge().getContainerStyle(fromContainerIdx)
						.drawnGraphElement(from, fromType).centroid();
					const toPosnWorld: Point2DType = app.bridge().getContainerStyle(toContainerIdx)
						.drawnGraphElement(to, toType).centroid();

					const fromPosnScreen: Point = app.bridge().getContainerStyle(fromContainerIdx)
						.screenPosn(fromPosnWorld);
					const toPosnScreen: Point = app.bridge().getContainerStyle(toContainerIdx)
						.screenPosn(toPosnWorld);

					const fromX = fromPosnScreen.x;
					const fromY = fromPosnScreen.y;
					const toX = toPosnScreen.x;
					const toY = toPosnScreen.y;

					const maxRadius = Math.max(
						app.bridge().getContainerStyle(fromContainerIdx).cellRadiusPixels(),
						app.bridge().getContainerStyle(toContainerIdx).cellRadiusPixels(),
					);
					const minRadius = maxRadius / 4;
					const arrowWidth = Math.max(
						Math.trunc((minRadius + probRatio * (maxRadius - minRadius)) / 2.5), 1,
					);

					if (valueEstimates != null) {
						// interpolate between red (losing) and blue (winning)
						g2d.setColor(new Color(
							0.5 - 0.5 * valueEstimates.get(i), 0.0,
							0.5 + 0.5 * valueEstimates.get(i), 0.5 + 0.2 * probRatio * probRatio,
						));
					} else {
						// just use red
						g2d.setColor(new Color(1.0, 0.0, 0.0, 0.5 + 0.2 * probRatio * probRatio));
					}

					if (move.isOrientedMove?.()) {
						// draw arrow with arrow head
						ArrowUtil.drawArrow(
							g2d, fromX, fromY, toX, toY, arrowWidth,
							Math.max(arrowWidth, 3),
							Math.trunc(1.75 * Math.max(arrowWidth, 5)),
						);
					} else {
						// draw arrow with no head
						ArrowUtil.drawArrow(g2d, fromX, fromY, toX, toY, arrowWidth, 0, 0);
					}
				} else if (to !== UNDEFINED) {
					const maxRadiusS = app.bridge().getContainerStyle(toContainerIdx).cellRadiusPixels();
					const minRadiusS = maxRadiusS / 4;

					const toPosnWorldS: Point2DType = app.bridge().getContainerStyle(toContainerIdx)
						.drawnGraphElement(to, toType).centroid();
					const toPosnScreenS: Point = app.bridge().getContainerStyle(toContainerIdx)
						.screenPosn(toPosnWorldS);

					const midX = toPosnScreenS.x;
					const midY = toPosnScreenS.y;

					const radius = Math.trunc(minRadiusS + probRatio * (maxRadiusS - minRadiusS));

					if (valueEstimates != null) {
						g2d.setColor(new Color(
							0.5 - 0.5 * valueEstimates.get(i), 0.0,
							0.5 + 0.5 * valueEstimates.get(i), 0.5 + 0.2 * probRatio,
						));
					} else {
						g2d.setColor(new Color(1.0, 0.0, 0.0, 0.5 + 0.2 * probRatio));
					}

					g2d.fillOval(midX - radius, midY - radius, 2 * radius, 2 * radius);
				} else {
					// no positions
					if (
						move.isPass?.() || move.isSwap?.() || move.isOtherMove?.()
						|| move.containsNextInstance?.()
					) {
						let position: Rectangle | null = null;
						if (move.isPass?.() || move.containsNextInstance?.())
							position = passLocation;
						else
							position = otherLocation;

						if (position != null) {
							const maxRadiusP = Math.trunc(
								Math.min(position.width, position.height) / 2,
							);
							const minRadiusP = maxRadiusP / 4;

							const midXP = Math.trunc(position.x + position.width / 2);
							const midYP = Math.trunc(position.y + position.height / 2);

							const radiusP = Math.trunc(minRadiusP + probRatio * (maxRadiusP - minRadiusP));

							if (valueEstimates != null) {
								// Interpolate between red (losing) and blue (winning)
								g2d.setColor(new Color(
									0.5 - 0.5 * valueEstimates.get(i), 0.0,
									0.5 + 0.5 * valueEstimates.get(i), 0.5 + 0.2 * probRatio,
								));
							} else {
								// Just use red
								g2d.setColor(new Color(1.0, 0.0, 0.0, 0.5 + 0.2 * probRatio));
							}

							g2d.fillOval(midXP - radiusP, midYP - radiusP, 2 * radiusP, 2 * radiusP);
						}
					}
				}
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws moves that would lead to a repeated state (Green = legal, Red = illegal).
	 * @java MoveVisuals#drawRepeatedStateMove(PlayerApp, Graphics2D, Context, Rectangle, Rectangle)
	 */
	static drawRepeatedStateMove(
		app: PlayerApp,
		g2d: Graphics2D,
		context: Context,
		passLocation: Rectangle,
		otherLocation: Rectangle,
	): void {
		const legal: Moves = context.moves(context);

		// Moves that can be done, but lead to a repeated state (Green)
		const movesThatLeadToRepeatedStates: Move[] = [];
		for (const m of legal.moves()) {
			const newContext = new context.constructor(context);
			newContext.game.apply(newContext, m);

			if (
				app.manager().settingsManager().storedGameStatesForVisuals()
					.contains(BigInt(newContext.state().stateHash()))
			) {
				movesThatLeadToRepeatedStates.push(m);
			}
		}

		for (const m of movesThatLeadToRepeatedStates) {
			MoveVisuals._drawMove(
				app, g2d, context, passLocation, otherLocation, m,
				new Color(0.0, 1.0, 0.0, 0.5),
			);
		}

		// Moves that cannot be done, because they lead to a repeated state (Red)
		for (const m of app.manager().settingsManager().movesAllowedWithRepetition()) {
			if (!legal.moves().includes(m)) {
				MoveVisuals._drawMove(
					app, g2d, context, passLocation, otherLocation, m,
					new Color(1.0, 0.0, 0.0, 0.5),
				);
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws ending move when one was just made.
	 * @java MoveVisuals#drawEndingMove(PlayerApp, Graphics2D, Context)
	 */
	static drawEndingMove(app: PlayerApp, g2d: Graphics2D, context: Context): void {
		const copyContext: Context = new context.constructor(context);
		copyContext.state().setMover(context.state().prev());
		copyContext.state().setNext(context.state().mover());

		for (const endRule of context.game.endRules().endRules()) {
			// if (endRule instanceof If) — escape-hatch: duck-type check
			if (endRule.result?.() != null && endRule.result?.()?.result?.() != null) {
				const endingLocations: any[] = endRule.endCondition?.()?.satisfyingSites?.(copyContext) ?? [];
				for (const location of endingLocations) {
					MoveVisuals._drawEndingMoveLocation(app, g2d, context, location);
				}
				if (endingLocations.length > 0) break;
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws a marker for representing an ending move at a given location, for a given result.
	 * @java MoveVisuals#drawEndingMoveLocation(PlayerApp, Graphics2D, Context, Location)
	 */
	private static _drawEndingMoveLocation(
		app: PlayerApp,
		g2d: Graphics2D,
		context: Context,
		location: any,
	): void {
		const lastMover: number = context.trial().getMove(context.trial().numMoves() - 1).mover();

		let colour: typeof Color.prototype | null = null;
		if (!context.trial().over()) {
			if (context.active(lastMover)) {
				colour = new Color(1.0, 0.7, 0.0, 0.7);
			} else if (context.computeNextDrawRank() > context.trial().ranking()[lastMover]) {
				colour = new Color(0.0, 1.0, 0.0, 0.7);
			} else if (context.computeNextDrawRank() < context.trial().ranking()[lastMover]) {
				colour = new Color(1.0, 0.0, 0.0, 0.7);
			}
		} else {
			if (context.winners().includes(lastMover)) {
				colour = new Color(0.0, 1.0, 0.0, 0.7);
			} else {
				colour = new Color(1.0, 0.0, 0.0, 0.7);
			}
		}

		const site: number = location.site();
		const type: string = location.siteType();
		const containerIdx: number = MoveVisuals._getContainerId(context, site, type);

		const toPosnWorld: Point2DType = app.bridge().getContainerStyle(containerIdx)
			.drawnGraphElement(site, type).centroid();
		const toPosnScreen: Point = app.bridge().getContainerStyle(containerIdx).screenPosn(toPosnWorld);

		const midX = toPosnScreen.x;
		const midY = toPosnScreen.y;

		g2d.setColor(Color.BLACK);
		let radius = Math.trunc(
			app.bridge().getContainerStyle(containerIdx).cellRadiusPixels() / 2 * 1.1,
		) + 2;
		g2d.fillOval(midX - radius, midY - radius, 2 * radius, 2 * radius);

		if (colour != null) {
			g2d.setColor(colour);
			radius = Math.trunc(app.bridge().getContainerStyle(containerIdx).cellRadiusPixels() / 2);
			g2d.fillOval(midX - radius, midY - radius, 2 * radius, 2 * radius);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw the specified move.
	 * Generic functionality, called by the other MoveVisuals functions.
	 * @java MoveVisuals#drawMove(PlayerApp, Graphics2D, Context, Rectangle, Rectangle, Move, Color)
	 */
	private static _drawMove(
		app: PlayerApp,
		g2d: Graphics2D,
		context: Context,
		passLocation: Rectangle,
		otherLocation: Rectangle,
		move: Move,
		colour: typeof Color.prototype,
	): void {
		const currentMover: number = context.state().mover();
		g2d.setColor(colour);

		if (move != null) {
			const from: number = move.from();
			const to: number = move.to();
			const fromLevel: number = move.levelFrom?.() ?? 0;
			const toLevel: number = move.levelTo?.() ?? 0;
			const fromType: string = move.fromType();
			const toType: string = move.toType();
			const fromContainerIdx: number = MoveVisuals._getContainerId(context, from, fromType);
			const toContainerIdx: number = MoveVisuals._getContainerId(context, to, toType);

			if (from !== to) {
				// Move with two locations.
				const fromPosnWorld: Point2DType = app.bridge().getContainerStyle(fromContainerIdx)
					.drawnGraphElement(from, fromType).centroid();
				const toPosnWorld: Point2DType = app.bridge().getContainerStyle(toContainerIdx)
					.drawnGraphElement(to, toType).centroid();

				const fromPosnScreen: Point = app.bridge().getContainerStyle(fromContainerIdx)
					.screenPosn(fromPosnWorld);
				const toPosnScreen: Point = app.bridge().getContainerStyle(toContainerIdx)
					.screenPosn(toPosnWorld);

				const fromX = fromPosnScreen.x;
				const fromY = fromPosnScreen.y;
				const toX = toPosnScreen.x;
				const toY = toPosnScreen.y;

				const maxRadius = Math.max(
					app.bridge().getContainerStyle(fromContainerIdx).cellRadiusPixels(),
					app.bridge().getContainerStyle(toContainerIdx).cellRadiusPixels(),
				);
				const arrowWidth = Math.max(Math.trunc(maxRadius / 3.5), 1);

				let arrowHidden = false;
				// HiddenUtil.siteHiddenBitsetInteger escape-hatch
				const HiddenUtilAny: any = (globalThis as any).HiddenUtilPort;
				if (
					HiddenUtilAny?.siteHiddenBitsetInteger?.(
						context,
						context.state().containerStates()[fromContainerIdx],
						from, fromLevel, currentMover, fromType,
					) > 0
					||
					HiddenUtilAny?.siteHiddenBitsetInteger?.(
						context,
						context.state().containerStates()[toContainerIdx],
						to, toLevel, currentMover, toType,
					) > 0
				) {
					arrowHidden = true;
				}

				if (!arrowHidden) {
					if (move.isOrientedMove?.()) {
						ArrowUtil.drawArrow(
							g2d, fromX, fromY, toX, toY, arrowWidth,
							Math.trunc(1.75 * Math.max(arrowWidth, 3)),
							Math.trunc(2.75 * Math.max(arrowWidth, 5)),
						);
					} else {
						ArrowUtil.drawArrow(g2d, fromX, fromY, toX, toY, arrowWidth, 0, 0);
					}
				}
			} else if (to !== UNDEFINED) {
				// Move with just one location.
				const toPosnWorldS: Point2DType = app.bridge().getContainerStyle(toContainerIdx)
					.drawnGraphElement(to, toType).centroid();
				const toPosnScreenS: Point = app.bridge().getContainerStyle(toContainerIdx)
					.screenPosn(toPosnWorldS);

				const midX = toPosnScreenS.x;
				const midY = toPosnScreenS.y;

				const radius = Math.trunc(
					app.bridge().getContainerStyle(toContainerIdx).cellRadiusPixels() / 2,
				);
				g2d.fillOval(midX - radius, midY - radius, 2 * radius, 2 * radius);
			} else {
				// Move with no location.
				let position: Rectangle | null = null;
				if (move.isPass?.() || move.containsNextInstance?.())
					position = passLocation;
				else if (move.isOtherMove?.())
					position = otherLocation;

				if (position != null) {
					g2d.fillOval(position.x, position.y, position.width, position.height);
				}
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Inline container-id lookup (mirrors ContainerUtil.getContainerId).
	 * @java util.ContainerUtil#getContainerId(Context, int, SiteType)
	 */
	private static _getContainerId(context: any, site: number, type: string): number {
		if (site === UNDEFINED) return UNDEFINED;
		if (type !== "Cell") return context.board().index();
		return context.containerId()[site] ?? 0;
	}

	// -------------------------------------------------------------------------
}
