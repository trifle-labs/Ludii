// @java Player/src/app/move/animation/MoveAnimation.java

import { Point, Point2D } from "../../../../../awt/index.js";
import type { Graphics2D } from "../../../../../awt/index.js";
import { AnimationType } from "./AnimationType.js";
import { AnimationParameters, type BufferedImage } from "./AnimationParameters.js";
import { ImageInfo } from "../../../../../ViewController/src/util/ImageInfo.js";

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported deps
// ---------------------------------------------------------------------------

/** @java app.PlayerApp */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PlayerApp = any;

/** @java other.move.Move */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Move = any;

/** @java app.utils.DrawnImageInfo */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrawnImageInfo = any;

// ---------------------------------------------------------------------------

/**
 * Functions that deal with animating moves.
 *
 * @author Matthew.Stephenson
 * @java app.move.animation.MoveAnimation
 */
export class MoveAnimation {

	/** Number of frames that a movement animation lasts for. @java MoveAnimation#SLOW_IN_SLOW_OUT */
	public static readonly SLOW_IN_SLOW_OUT: boolean = true;

	/** Number of frames that a movement animation lasts for. @java MoveAnimation#MOVE_PIECE_FRAMES */
	public static MOVE_PIECE_FRAMES: number = 30;

	/** Number of frames that an add/remove animation lasts for. @java MoveAnimation#FLASH_LENGTH */
	public static readonly FLASH_LENGTH: number = 10;

	/** Length of an animation frame in milliseconds. @java MoveAnimation#ANIMATION_FRAME_LENGTH */
	public static readonly ANIMATION_FRAME_LENGTH: number = 15;

	/** Length of time that an animation will last in milliseconds. @java MoveAnimation#ANIMATION_WAIT_TIME */
	public static readonly ANIMATION_WAIT_TIME: number =
		MoveAnimation.ANIMATION_FRAME_LENGTH * (MoveAnimation.MOVE_PIECE_FRAMES - 1);

	// -------------------------------------------------------------------------

	/**
	 * Store the required animation information about a move to be animated.
	 * @java MoveAnimation#saveMoveAnimationDetails(PlayerApp, Move)
	 */
	static saveMoveAnimationDetails(app: PlayerApp, move: Move): void {
		const animationType = MoveAnimation.getMoveAnimationType(app, move);

		if (!animationType) return; // guard (AnimationType check below)
		if (animationType === AnimationType.NONE) return;

		try {
			app.settingsPlayer().setDrawingMovingPieceTime(0);
			app.bridge().settingsVC().setAnimationMove(move);
			app.bridge().settingsVC().setThisFrameIsAnimated(true);

			app.settingsPlayer().setAnimationParameters(
				MoveAnimation.getMoveAnimationParameters(app, move),
			);

			app.settingsPlayer().getAnimationTimer().cancel();
			// Use browser setInterval equivalent via a plain object wrapper
			const timerObj = MoveAnimation._makeIntervalTimer(
				() => {
					app.settingsPlayer().setDrawingMovingPieceTime(
						app.settingsPlayer().getDrawingMovingPieceTime() + 1,
					);
				},
				MoveAnimation.ANIMATION_FRAME_LENGTH,
			);
			app.settingsPlayer().setAnimationTimer(timerObj);
		} catch (e) {
			console.error(e);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw the move animated, based on the previously stored animation details.
	 * @java MoveAnimation#moveAnimation(PlayerApp, Graphics2D)
	 */
	static moveAnimation(app: PlayerApp, g2d: Graphics2D): void {
		const animationParameters: AnimationParameters = app.settingsPlayer().animationParameters();

		for (let i = 0; i < animationParameters.pieceImages.length; i++) {
			let pieceImage: BufferedImage = animationParameters.pieceImages[i] ?? null;
			const time: number = app.settingsPlayer().getDrawingMovingPieceTime();
			const transparency = MoveAnimation._getMoveAnimationTransparency(
				app, time, animationParameters.animationType,
			);

			if (transparency > 0 && pieceImage != null) {
				// Escape-hatch: BufferedImageUtil.makeImageTranslucent
				const biu = app.constructor?.BufferedImageUtil ?? (globalThis as any).BufferedImageUtil;
				if (biu?.makeImageTranslucent) {
					pieceImage = biu.makeImageTranslucent(pieceImage, transparency);
				}
			}

			const drawPoint = MoveAnimation._getMoveAnimationPoint(
				app,
				animationParameters.fromLocations[i]!,
				animationParameters.toLocations[i]!,
				time,
				animationParameters.animationType,
			);

			if (drawPoint != null && pieceImage != null) {
				// Width/height unknown at this level; use 0,0 as placeholders (escape-hatch).
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				g2d.drawImage(pieceImage as any, drawPoint.x, drawPoint.y, 0, 0);
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Get AnimationParameters of a provided move.
	 * @java MoveAnimation#getMoveAnimationParameters(PlayerApp, Move)
	 */
	static getMoveAnimationParameters(app: PlayerApp, move: Move): AnimationParameters {
		const context = app.contextSnapshot().getContext(app);

		const moveFrom = move.getFromLocation();
		const moveTo = move.getToLocation();

		// Use inline container-id lookup via bridge
		const fromIdx: number = MoveAnimation._getContainerId(context, moveFrom.site(), moveFrom.siteType());
		const toIdx: number = MoveAnimation._getContainerId(context, moveTo.site(), moveTo.siteType());

		const graphPointStart: { x: number; y: number } = app.bridge().getContainerStyle(fromIdx)
			.drawnGraphElement(moveFrom.site(), moveFrom.siteType()).centroid();
		const graphPointEnd: { x: number; y: number } = app.bridge().getContainerStyle(toIdx)
			.drawnGraphElement(moveTo.site(), moveTo.siteType()).centroid();

		const startPoint: Point = app.bridge().getContainerStyle(fromIdx).screenPosn(graphPointStart);
		const endPoint: Point = app.bridge().getContainerStyle(toIdx).screenPosn(graphPointEnd);

		const startDrawnInfo: DrawnImageInfo[] = MoveAnimation.getMovingPieceImages(
			app, move, moveFrom, startPoint.x, startPoint.y, true,
		);
		const endDrawnInfo: DrawnImageInfo[] = MoveAnimation.getMovingPieceImages(
			app, move, moveFrom, endPoint.x, endPoint.y, true,
		);

		const pieceImages: BufferedImage[] = [];
		const startPoints: Point[] = [];
		const endPoints: Point[] = [];

		for (const d of startDrawnInfo) {
			startPoints.push(d.imageInfo().drawPosn());
			pieceImages.push(d.pieceImage());
		}
		for (const d of endDrawnInfo) {
			endPoints.push(d.imageInfo().drawPosn());
		}

		// Placeholders in case no images/points found
		if (startPoints.length === 0) startPoints.push(new Point(0, 0));
		if (endPoints.length === 0) endPoints.push(new Point(0, 0));
		if (pieceImages.length === 0) pieceImages.push(null);

		return new AnimationParameters(
			MoveAnimation.getMoveAnimationType(app, move),
			pieceImages,
			startPoints,
			endPoints,
			MoveAnimation.ANIMATION_WAIT_TIME,
		);
	}

	// -------------------------------------------------------------------------

	/**
	 * Get transparency value for a given animationType and time through the animation.
	 * @java MoveAnimation#getMoveAnimationTransparency(PlayerApp, int, AnimationType)
	 */
	private static _getMoveAnimationTransparency(
		_app: PlayerApp,
		time: number,
		animationType: AnimationType,
	): number {
		if (animationType === AnimationType.PULSE) {
			// How transparent the animated piece should be.
			let currentflashValue = 0.0;

			const flashCycleValue = time % (MoveAnimation.FLASH_LENGTH * 2);

			if (flashCycleValue >= MoveAnimation.FLASH_LENGTH) {
				currentflashValue = 1.0 - (time % MoveAnimation.FLASH_LENGTH) / MoveAnimation.FLASH_LENGTH;
			} else {
				currentflashValue = (time % MoveAnimation.FLASH_LENGTH) / MoveAnimation.FLASH_LENGTH;
			}

			return 1.0 - currentflashValue;
		}

		return 0.0;
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw an animation for a move between two locations, at a given time frame.
	 * @java MoveAnimation#getMoveAnimationPoint(PlayerApp, Point, Point, int, AnimationType)
	 */
	private static _getMoveAnimationPoint(
		app: PlayerApp,
		startPoint: Point,
		endPoint: Point,
		time: number,
		animationType: AnimationType,
	): Point | null {
		try {
			const moveFrom = app.bridge().settingsVC().getAnimationMove().getFromLocation();

			// Piece is moving from one location to another.
			if (animationType === AnimationType.DRAG) {
				const pointOnTimeLine = new Point2D.Double(0, 0);

				if (MoveAnimation.SLOW_IN_SLOW_OUT) {
					let multiplyFactor = time / MoveAnimation.MOVE_PIECE_FRAMES;
					multiplyFactor = (Math.cos(multiplyFactor * Math.PI + Math.PI) + 1) / 2;
					pointOnTimeLine.x = startPoint.x + (endPoint.x - startPoint.x) * multiplyFactor;
					pointOnTimeLine.y = startPoint.y + (endPoint.y - startPoint.y) * multiplyFactor;
				} else {
					const multiplyFactor = time / MoveAnimation.MOVE_PIECE_FRAMES;
					pointOnTimeLine.x = startPoint.x + (endPoint.x - startPoint.x) * multiplyFactor;
					pointOnTimeLine.y = startPoint.y + (endPoint.y - startPoint.y) * multiplyFactor;
				}

				app.repaintComponentBetweenPoints(
					app.contextSnapshot().getContext(app),
					moveFrom,
					startPoint,
					endPoint,
				);
				return new Point(Math.trunc(pointOnTimeLine.x), Math.trunc(pointOnTimeLine.y));
			}
			// Piece is being added/removed/changed at a single site.
			else if (animationType === AnimationType.PULSE) {
				app.repaintComponentBetweenPoints(
					app.contextSnapshot().getContext(app),
					moveFrom,
					startPoint,
					endPoint,
				);
				return new Point(startPoint.x, startPoint.y);
			}
		} catch (e) {
			// If something goes wrong, cancel the animation.
			app.settingsPlayer().setDrawingMovingPieceTime(MoveAnimation.MOVE_PIECE_FRAMES);
		}

		return null;
	}

	// -------------------------------------------------------------------------

	/**
	 * Get the type of animation for the move.
	 * @java MoveAnimation#getMoveAnimationType(PlayerApp, Move)
	 */
	static getMoveAnimationType(app: PlayerApp, move: Move): AnimationType {
		const context = app.contextSnapshot().getContext(app);
		const game = context.game;

		if (move == null) return AnimationType.NONE;

		if (app.bridge().settingsVC().noAnimation()) return AnimationType.NONE;

		if (game.isDeductionPuzzle?.()) return AnimationType.NONE;

		if (game.hasLargePiece?.()) return AnimationType.NONE;

		if (move.from() === -1) return AnimationType.NONE;

		if (move.to() === -1) return AnimationType.NONE;

		if (!move.getFromLocation().equals(move.getToLocation())) return AnimationType.DRAG;

		if (move.getFromLocation().equals(move.getToLocation())) return AnimationType.PULSE;

		return AnimationType.NONE;
	}

	// -------------------------------------------------------------------------

	/**
	 * Reset all necessary animation variables to their defaults.
	 * @java MoveAnimation#resetAnimationValues(PlayerApp)
	 */
	static resetAnimationValues(app: PlayerApp): void {
		app.settingsPlayer().setDrawingMovingPieceTime(MoveAnimation.MOVE_PIECE_FRAMES);
		app.bridge().settingsVC().setAnimationMove(null);
		app.bridge().settingsVC().setThisFrameIsAnimated(false);
		app.settingsPlayer().getAnimationTimer().cancel();
		app.settingsPlayer().setAnimationParameters(new AnimationParameters());
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw the piece being moved.
	 * @java MoveAnimation#getMovingPieceImages(PlayerApp, Move, Location, int, int, boolean)
	 */
	static getMovingPieceImages(
		app: PlayerApp,
		move: Move,
		selectedLocation: any,
		x: number,
		y: number,
		drawingAnimation: boolean,
	): DrawnImageInfo[] {
		const allMovingPieceImages: DrawnImageInfo[] = [];

		const context = app.contextSnapshot().getContext(app);
		const legal = context.game.moves(context);

		if (move != null) {
			// Replace legal moves with the specific move being done (Java: for parity; no effect in TS)
			// const moves = new BaseMoves(null);
			// moves.moves().add(move);
		}

		// If all moves from this location involve the same level range, then use that level range.
		const levelMinMax: number[] = MoveAnimation._getLevelMinAndMax(legal, selectedLocation);

		for (let i = 0; i < context.numContainers(); i++) {
			const container = context.equipment().containers()[i];
			const containerIndex: number = container.index();
			const graphElements: any[] = app.bridge().getContainerStyle(containerIndex).drawnGraphElements();
			const state = app.contextSnapshot().getContext(app).state();
			const cs = state.containerStates()[i];

			for (const graphElement of graphElements) {
				if (
					graphElement.index() === selectedLocation.site()
					&&
					graphElement.elementType() === selectedLocation.siteType()
				) {
					let lowestSelectedLevel = -1;

					for (let level = levelMinMax[0]!; level <= levelMinMax[1]!; level++) {
						const localState: number = cs.state(selectedLocation.site(), level, selectedLocation.siteType());
						const value: number = cs.value(selectedLocation.site(), level, selectedLocation.siteType());
						const componentStackType: any = MoveAnimation._getStackType(context, container, selectedLocation, localState, value);

						// get the what of the component at the selected location
						let what: number = cs.what(graphElement.index(), level, graphElement.elementType());

						// If adding a piece at the site, get the what of the move instead.
						if (what === 0) {
							if (move != null) what = move.what();

							for (const m of legal.moves()) {
								if (m.getFromLocation().equals(selectedLocation)) {
									for (const a of m.actions()) {
										const actionLocationA = { site: () => a.from(), level: () => a.levelFrom(), siteType: () => a.fromType() };
										const actionLocationB = { site: () => a.to(), level: () => a.levelTo(), siteType: () => a.toType() };
										const testingLocation = { site: () => selectedLocation.site(), level: () => level, siteType: () => selectedLocation.siteType() };

										if (
											a.from() === selectedLocation.site()
											&& a.levelFrom() === level
											&& a.fromType() === selectedLocation.siteType()
											&& a.to() === selectedLocation.site()
											&& a.levelTo() === level
											&& a.toType() === selectedLocation.siteType()
										) {
											what = a.what();
											break;
										}
									}
								}
								if (what !== 0) break;
							}
						}

						// If a piece was found
						if (what > 0) {
							app.settingsPlayer().setDragComponent(
								app.contextSnapshot().getContext(app).equipment().components()[what],
							);

							try {
								if (lowestSelectedLevel === -1) lowestSelectedLevel = level;
								if (drawingAnimation) lowestSelectedLevel = 0;

								let pieceImage: BufferedImage = null;

								const cellSize: number = app.bridge().getContainerStyle(0).cellRadiusPixels();

								const hiddenValue: number = MoveAnimation._getHiddenValue(context, cs, graphElement, level, context.state().mover());

								let imageSize = cellSize * 2;
								try {
									imageSize = app.graphicsCache().getComponentImageSize(
										containerIndex,
										app.settingsPlayer().dragComponent().index(),
										cs.who(graphElement.index(), graphElement.elementType()),
										localState,
										cs.value(graphElement.index(), graphElement.elementType()),
										hiddenValue,
										cs.rotation(graphElement.index(), graphElement.elementType()),
									);
								} catch (e) {
									// Component image doesn't exist yet.
								}

								if (app.settingsPlayer().dragComponent().isLargePiece()) {
									// If the local state of the from is different from that of the move, the piece can be rotated.
									for (const m of legal.moves()) {
										if (cs.state(graphElement.index(), graphElement.elementType()) !== m.state()) {
											app.setVolatileMessage("You can rotate this piece by pressing 'r'");
										}
									}

									// If we have rotated the piece all the way around to its starting walk.
									const currentRotation = cs.state(graphElement.index(), graphElement.elementType())
										+ app.settingsPlayer().currentWalkExtra();
									const maxRotation = app.settingsPlayer().dragComponent().walk().length
										* (app.contextSnapshot().getContext(app).board().topology().supportedDirections('Cell').size() / 2);
									if (currentRotation >= maxRotation) {
										app.settingsPlayer().setCurrentWalkExtra(
											-cs.state(graphElement.index(), graphElement.elementType()),
										);
									}

									pieceImage = app.graphicsCache().getComponentImage(
										app.bridge(), 0,
										app.settingsPlayer().dragComponent(),
										cs.who(graphElement.index(), graphElement.elementType()),
										cs.state(graphElement.index(), graphElement.elementType()) + app.settingsPlayer().currentWalkExtra(),
										cs.value(graphElement.index(), graphElement.elementType()),
										graphElement.index(), 0, graphElement.elementType(),
										cellSize * 2,
										app.contextSnapshot().getContext(app),
										hiddenValue,
										cs.rotation(graphElement.index(), graphElement.elementType()),
										true,
									);
									app.settingsPlayer().setDragComponentState(
										cs.state(graphElement.index(), graphElement.elementType()) + app.settingsPlayer().currentWalkExtra(),
									);
								} else {
									pieceImage = app.graphicsCache().getComponentImage(
										app.bridge(), i,
										app.settingsPlayer().dragComponent(),
										cs.who(graphElement.index(), graphElement.elementType()),
										cs.state(graphElement.index(), graphElement.elementType()),
										cs.value(graphElement.index(), graphElement.elementType()),
										graphElement.index(), 0, graphElement.elementType(),
										imageSize,
										app.contextSnapshot().getContext(app),
										hiddenValue,
										cs.rotation(graphElement.index(), graphElement.elementType()),
										true,
									);
								}

								if (pieceImage != null) {
									// Escape-hatch: access width/height via any (BufferedImage is opaque).
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									const imgAny = pieceImage as any;
									const pw: number = imgAny.width ?? imgAny.naturalWidth ?? 0;
									const ph: number = imgAny.height ?? imgAny.naturalHeight ?? 0;
									const dragPosition = new Point2D.Double(x - pw / 2, y - ph / 2);

									const stackSize: number = cs.sizeStack(selectedLocation.site(), selectedLocation.siteType());
									const offsetDistance = MoveAnimation._calculateStackOffset(
										app.bridge(), context, container, componentStackType,
										cellSize, level - lowestSelectedLevel,
										selectedLocation.site(), selectedLocation.siteType(),
										stackSize, localState, value,
									);

									allMovingPieceImages.push({
										pieceImage: () => pieceImage,
										imageInfo: () => new ImageInfo(
											new Point(
												Math.trunc(dragPosition.x + offsetDistance.x),
												Math.trunc(dragPosition.y + offsetDistance.y),
											),
											graphElement.index(),
											level,
											graphElement.elementType(),
										),
									} as DrawnImageInfo);
								}

								if (!context.currentInstanceContext?.()?.game?.isStacking?.()) {
									return allMovingPieceImages;
								}
							} catch (e) {
								if (e instanceof Error && e.message.includes("null")) {
									console.error(e);
								}
							}
						} else {
							break;
						}
					}
					return allMovingPieceImages;
				}
			}
		}

		return allMovingPieceImages;
	}

	// -------------------------------------------------------------------------
	// Internal helpers (escape-hatched calls)
	// -------------------------------------------------------------------------

	/**
	 * Inline container-id lookup (mirrors ContainerUtil.getContainerId).
	 * @java util.ContainerUtil#getContainerId(Context, int, SiteType)
	 */
	private static _getContainerId(context: any, site: number, type: string): number {
		if (site === -1) return -1;
		if (type !== "Cell") return context.board().index();
		return context.containerId()[site] ?? 0;
	}

	/**
	 * Get the stack type for a site.
	 * @java metadata.graphics.util.PieceStackType
	 */
	private static _getStackType(_context: any, _container: any, _location: any, _localState: number, _value: number): any {
		// Escape-hatch: PieceStackType.getTypeFromValue(...)
		return null;
	}

	/**
	 * Get the hidden bit-set integer for a site.
	 * @java util.HiddenUtil#siteHiddenBitsetInteger
	 */
	private static _getHiddenValue(context: any, cs: any, graphElement: any, level: number, mover: number): number {
		// Escape-hatch: HiddenUtil.siteHiddenBitsetInteger
		return 0;
	}

	/**
	 * Calculate stack offset for a piece.
	 * @java util.StackVisuals#calculateStackOffset
	 */
	private static _calculateStackOffset(
		_bridge: any, _context: any, _container: any, _componentStackType: any,
		_cellSize: number, _levelOffset: number, _site: number, _siteType: any,
		_stackSize: number, _localState: number, _value: number,
	): { x: number; y: number } {
		// Escape-hatch: StackVisuals.calculateStackOffset
		return { x: 0, y: 0 };
	}

	/**
	 * Get level min/max for a location's legal moves.
	 * @java util.StackVisuals#getLevelMinAndMax(Moves, Location)
	 */
	private static _getLevelMinAndMax(_legal: any, _location: any): number[] {
		// Escape-hatch: StackVisuals.getLevelMinAndMax
		return [0, 0];
	}

	// -------------------------------------------------------------------------

	/**
	 * Browser-compatible interval timer that mimics Java's Timer/TimerTask with
	 * a cancel() method.
	 */
	private static _makeIntervalTimer(fn: () => void, intervalMs: number): { cancel(): void } {
		const id = setInterval(fn, intervalMs);
		return {
			cancel() {
				clearInterval(id);
			},
		};
	}

	// -------------------------------------------------------------------------
}
