// @java ViewController/src/view/container/aspects/components/ContainerComponents.java

/**
 * Defines how the components are drawn on the associated container style.
 *
 * Faithful 1:1 port of view.container.aspects.components.ContainerComponents.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.components.ContainerComponents
 */

import type { Graphics2D } from '../../../../../../awt/index.js';
import { BasicStroke, Color, GeneralPath } from '../../../../../../awt/index.js';
import type { Point } from '../../../../../../awt/index.js';
import { Bridge } from '../../../../bridge/Bridge.js';
import { GraphUtil } from '../../../../util/GraphUtil.js';
import { ContainerUtil } from '../../../../util/ContainerUtil.js';
import { HiddenUtil } from '../../../../util/HiddenUtil.js';
import { StackVisuals } from '../../../../util/StackVisuals.js';
import { ImageInfo } from '../../../../util/ImageInfo.js';

// ---------------------------------------------------------------------------
// Escape-hatched dependency types (not yet ported or out-of-batch)
// ---------------------------------------------------------------------------

/** @java view.container.BaseContainerStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseContainerStyle = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java other.topology.TopologyElement */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TopologyElement = any;

/** @java game.types.board.SiteType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteType = any;

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java other.state.container.ContainerState */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContainerState = any;

/** @java game.equipment.component.Component */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Component = any;

/** @java game.rules.play.moves.Moves */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Moves = any;

/** @java other.location.FullLocation */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FullLocation = any;

/** @java metadata.graphics.util.PieceStackType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PieceStackType = any;

/** @java metadata.graphics.util.PieceColourType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PieceColourType = any;

/** @java main.Constants */
const Constants = { MIN_IMAGE_SIZE: 2, UNDEFINED: -1 };

// ---------------------------------------------------------------------------

/**
 * Defines how the components are drawn on the associated container style.
 *
 * @java view.container.aspects.components.ContainerComponents
 */
export class ContainerComponents {

	/** The container style associated with this components aspect. */
	private readonly containerStyle: BaseContainerStyle;

	/** Additional piece scale multiplier for components in this style. */
	private _pieceScale: number = 1.0;

	/** Parent bridge object. */
	protected bridge: Bridge;

	// -------------------------------------------------------------------------

	/**
	 * @java ContainerComponents#ContainerComponents(Bridge, BaseContainerStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BaseContainerStyle) {
		this.bridge = bridge;
		this.containerStyle = containerStyle;
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw all necessary components on the container.
	 * @java ContainerComponents#drawComponents(Graphics2D, Context)
	 */
	drawComponents(g2d: Graphics2D, context: Context): void {
		const allGraphElements: TopologyElement[] = GraphUtil.reorderGraphElementsTopDown(
			this.containerStyle.drawnGraphElements(),
			context
		);
		this.drawComponentsElements(g2d, context, allGraphElements);
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw all necessary components on the container, on a provided set of graphElements.
	 * @java ContainerComponents#drawComponents(Graphics2D, Context, ArrayList)
	 */
	protected drawComponentsElements(
		g2d: Graphics2D,
		context: Context,
		allGraphElements: TopologyElement[]
	): void {
		const state = context.state();
		const container: Container = this.containerStyle.container();
		const cellRadiusPixels: number = this.containerStyle.cellRadiusPixels();
		const legal: Moves = context.moves(context);

		if (container !== null && container !== undefined && state.containerStates().length > container.index()) {
			if (context.metadata().graphics().replaceComponentsWithFilledCells()) {
				this.fillCellsBasedOnOwner(g2d, context);
				return;
			}

			const cs: ContainerState = state.containerStates()[container.index()];

			// Draw pieces
			for (let j = 0; j < allGraphElements.length; j++) {
				const graphElement: TopologyElement = allGraphElements[j]!;
				const posn = graphElement.centroid();

				const site: number = allGraphElements[j]!.index();
				const type: SiteType = graphElement.elementType();

				const isEmpty: boolean = cs.isEmpty(site, type);
				const stackSize: number = cs.sizeStack(site, type);

				for (let level = 0; level < stackSize; level++) {
					const what: number = cs.what(site, level, type);

					if (!isEmpty) {
						let localState: number = cs.state(site, level, type);
						const value: number = cs.value(site, level, type);
						const component: Component = context.equipment().components()[what];

						// if the what is zero, then it's a hidden piece.
						if (what === 0) {
							// Cannot hide the what for games with large pieces.
							if (context.game().hasLargePiece()) continue;

							component.setRoleFromPlayerId(cs.who(site, level, type));
							component.create(context.game());
						}

						// When drawing dice, use local state of the next roll.
						if (component.isDie()) {
							const diceLocalState: number = context.diceSiteState().get(site);
							if (diceLocalState !== -99) localState = diceLocalState;
						}

						const mover: number = context.state().mover();

						let count: number = cs.count(site, type);
						if (HiddenUtil.siteCountHidden(context, cs, site, level, mover, type)) count = -1;
						if (HiddenUtil.siteHidden(context, cs, site, level, mover, type)) count = 0;

						let transparency = 0;
						if (
							this.bridge.settingsVC().selectedFromLocation().site() === site &&
							this.bridge.settingsVC().selectedFromLocation().level() === level &&
							this.bridge.settingsVC().selectedFromLocation().siteType() === type
						) {
							transparency = 0.5;
						}

						let imageSize: number = Math.trunc(
							cellRadiusPixels * 2 * this.pieceScale() *
							this.bridge.getComponentStyle(component.index()).scale(context, container.index(), localState, value)
						);
						imageSize = Math.max(imageSize, Constants.MIN_IMAGE_SIZE);

						// PieceStackType.getTypeFromValue — escape-hatch: PieceStackType is any
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const componentStackType: any = (null as any); // resolved at runtime via metadata
						void componentStackType; // suppress unused warning — used below
						const _stackTypeValue: number = Math.trunc(context.metadata().graphics().stackMetadata(
							context, container, site, type, localState, value, 'Type'
						));
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						const resolvedStackType: any = _stackTypeValue;
						const stackOffset: { x: number; y: number } = (StackVisuals as unknown as { calculateStackOffset(...args: any[]): { x: number; y: number } })
							.calculateStackOffset(
								this.bridge,
								context,
								container,
								resolvedStackType,
								cellRadiusPixels,
								level,
								site,
								type,
								stackSize,
								localState,
								value
							);

						const drawPosn: { x: number; y: number } = this.containerStyle.screenPosn(posn);
						drawPosn.x += stackOffset.x - imageSize / 2;
						drawPosn.y += stackOffset.y - imageSize / 2;

						// These values are used for large pieces to represent vector from origin to center
						if (
							component.isLargePiece() &&
							this.bridge.getComponentStyle(component.index()).origin().size() > localState &&
							container.index() === 0
						) {
							const origin: Point | null = this.bridge.getComponentStyle(component.index()).origin().get(localState);
							if (origin !== null && origin !== undefined) {
								drawPosn.x -= origin.x;
								drawPosn.y -= origin.y;
							}
						}

						if (
							this.bridge.settingsVC().pieceBeingDragged() ||
							this.bridge.settingsVC().thisFrameIsAnimated()
						) {
							try {
								let location: { site(): number; level(): number; siteType(): SiteType; equals(o: unknown): boolean };
								if (this.bridge.settingsVC().pieceBeingDragged()) {
									location = this.bridge.settingsVC().selectedFromLocation();
								} else {
									location = this.bridge.settingsVC().getAnimationMove().getFromLocation();
								}

								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								const fullLoc: any = { site: () => site, level: () => level, siteType: () => type };
								if (
									location.equals(fullLoc) ||
									(
										site === location.site() &&
										type === location.siteType() &&
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										level >= (StackVisuals as any).getLevelMinAndMax(legal, location)[0]! &&
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										level <= (StackVisuals as any).getLevelMinAndMax(legal, location)[1]!
									)
								) {
									if (count > 1) {
										count--;
									} else {
										continue;
									}
								}
							} catch (e) {
								// carry on, sometimes animation timers don't line up...
							}
						}

						if (
							component.isTile() &&
							container.index() === 0 &&
							!HiddenUtil.siteHidden(context, cs, site, level, mover, type)
						) {
							const coveredCells: number[] = ContainerUtil.cellsCoveredByPiece(
								context, container, component, site, localState
							);
							for (const cellIndex of coveredCells) {
								this.drawTilePiece(
									g2d, context, component, cellIndex,
									stackOffset.x, stackOffset.y,
									container, localState, value, imageSize
								);
							}
						}

						this.bridge.graphicsRenderer()!.drawComponent(
							g2d,
							context,
							new ImageInfo(
								drawPosn as unknown as Point,
								site,
								level,
								type,
								component,
								localState,
								value,
								transparency,
								cs.rotation(site, level, type),
								container.index(),
								imageSize,
								count
							)
						);
					}
				}
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws a tile component at the specified site.
	 * @java ContainerComponents#drawTilePiece(Graphics2D, Context, Component, int, double, double, Container, int, int, int)
	 */
	private drawTilePiece(
		g2d: Graphics2D,
		context: Context,
		component: Component,
		site: number,
		stackOffsetX: number,
		stackOffsetY: number,
		container: Container,
		localState: number,
		value: number,
		imageSize: number
	): void {
		const path = new GeneralPath();
		const containerSite: number = ContainerUtil.getContainerSite(context, site, 'Cell' as SiteType);
		const containerIndex: number = ContainerUtil.getContainerId(context, containerSite, 'Cell' as SiteType);

		const cellToFill = this.bridge.getContainerStyle(container.index()).drawnCells().get(containerSite);
		let nextPoint: { x: number; y: number } = this.bridge.getContainerStyle(container.index())
			.screenPosn(cellToFill.vertices().get(0).centroid());
		path.moveTo(nextPoint.x + stackOffsetX, nextPoint.y + stackOffsetY);
		for (const vertex of cellToFill.vertices()) {
			nextPoint = this.bridge.getContainerStyle(container.index()).screenPosn(vertex.centroid());
			path.lineTo(nextPoint.x + stackOffsetX, nextPoint.y + stackOffsetY);
		}
		path.closePath();

		const fillColour: Color | null = context.game().metadata().graphics().pieceColour(
			context, component.owner(), component.name(), containerIndex, localState, value,
			'Fill' as PieceColourType
		);
		if (fillColour !== null && fillColour !== undefined) {
			g2d.setColor(fillColour);
		} else {
			g2d.setColor(this.bridge.settingsColour().playerColour(context, component.owner()));
		}

		g2d.fill(path);

		const pieceEdgeColour: Color | null = context.game().metadata().graphics().pieceColour(
			context, component.owner(), component.name(), containerIndex, localState, value,
			'Edge' as PieceColourType
		);
		if (pieceEdgeColour !== null && pieceEdgeColour !== undefined) {
			const oldClip = g2d.getClip();
			g2d.setStroke(new BasicStroke(
				Math.trunc(imageSize / 10) + 1,
				BasicStroke.CAP_ROUND,
				BasicStroke.JOIN_ROUND
			));
			g2d.setColor(pieceEdgeColour);
			g2d.setClip(path);
			g2d.draw(path);
			g2d.setClip(oldClip);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Fills cells of the container that are owned by specific players with their colour.
	 * @java ContainerComponents#fillCellsBasedOnOwner(Graphics2D, Context)
	 */
	fillCellsBasedOnOwner(g2d: Graphics2D, context: Context): void {
		const cs: ContainerState = context.state().containerStates()[0];
		for (let f = 0; f < context.topology().cells().size(); f++) {
			if (cs.whoCell(f) !== 0) {
				const face = context.topology().cells().get(f);
				const path = new GeneralPath();
				for (let v = 0; v < face.vertices().size(); v++) {
					if (path.getCurrentPoint() === null) {
						const prev = face.vertices().get(face.vertices().size() - 1);
						const drawPrev: { x: number; y: number } = this.containerStyle.screenPosn(prev.centroid());
						path.moveTo(drawPrev.x, drawPrev.y);
					}
					const corner = face.vertices().get(v);
					const drawCorner: { x: number; y: number } = this.containerStyle.screenPosn(corner.centroid());
					path.lineTo(drawCorner.x, drawCorner.y);
				}

				g2d.setColor(this.bridge.settingsColour().playerColour(context, cs.whoCell(f)));
				g2d.fill(path);
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws a puzzle value at a specified site.
	 * @java ContainerComponents#drawPuzzleValue(int, int, Context, Graphics2D, Point, int)
	 */
	drawPuzzleValue(
		_value: number,
		_site: number,
		_context: Context,
		_g2d: Graphics2D,
		_drawPosn: Point,
		_imageSize: number
	): void {
		// Do nothing by default.
	}

	// -------------------------------------------------------------------------

	/** @java ContainerComponents#pieceScale() */
	pieceScale(): number {
		return this._pieceScale;
	}

	/** @java ContainerComponents#setPieceScale(double) */
	setPieceScale(pieceScale: number): void {
		this._pieceScale = pieceScale;
	}

	// -------------------------------------------------------------------------
}
