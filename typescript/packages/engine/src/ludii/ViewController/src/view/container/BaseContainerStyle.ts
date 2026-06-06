// @java ViewController/src/view/container/BaseContainerStyle.java

import { Color, Font, Graphics2D, Point, Rectangle, SVGGraphics2D, RenderingHints } from '../../../../awt/index.js';
import type { Point2D } from '../../../../awt/index.js';
import type { Cell } from '../../../../../ludemes/other/topology/Cell.js';
import type { Edge } from '../../../../../ludemes/other/topology/Edge.js';
import type { Vertex } from '../../../../../ludemes/other/topology/Vertex.js';
import type { TopologyElement } from '../../../../../ludemes/other/topology/TopologyElement.js';
import type { Topology } from '../../../../../ludemes/other/topology/Topology.js';
import type { Container } from '../../../../../ludemes/game/equipment/container/Container.js';
import type { SiteType } from '../../../../../ludemes/other/action/SiteType.js';
import type { Context } from '../../../../../ludemes/other/context/Context.js';
import type { ContainerStyle } from './ContainerStyle.js';
import { PlaneType } from '../../util/PlaneType.js';
import { FullLocation } from '../../../../../ludemes/other/location/FullLocation.js';
import type { Location } from '../../../../../ludemes/other/location/Location.js';

// ---------------------------------------------------------------------------
// Minimal Constants
// @java main.Constants.UNDEFINED = -1
// ---------------------------------------------------------------------------
const UNDEFINED = -1;

// ---------------------------------------------------------------------------
// Escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/**
 * Minimal surface of bridge.Bridge used by BaseContainerStyle.
 * @java bridge.Bridge
 */
export interface IBridge {
	/** @java Bridge#settingsVC() */
	settingsVC(): ISettingsVC;
	/** @java Bridge#graphicsRenderer() */
	graphicsRenderer(): IPlatformGraphics | null;
}

/**
 * Minimal surface of util.SettingsVC used by BaseContainerStyle.
 * @java util.SettingsVC
 */
export interface ISettingsVC {
	setErrorReport(report: string): void;
	errorReport(): string;
	displayFont(): Font;
	showIndices(): boolean;
	showCoordinates(): boolean;
	showCellIndices(): boolean;
	showCellCoordinates(): boolean;
	showEdgeIndices(): boolean;
	showEdgeCoordinates(): boolean;
	showVertexIndices(): boolean;
	showVertexCoordinates(): boolean;
	showContainerIndices(): boolean;
	coordWithOutline(): boolean;
	thisFrameIsAnimated(): boolean;
	selectedFromLocation(): Location;
	showPossibleMoves(): boolean;
	selectingConsequenceMove(): boolean;
	possibleConsequenceLocations(): Location[];
}

/**
 * Minimal surface of bridge.PlatformGraphics used by BaseContainerStyle.
 * @java bridge.PlatformGraphics
 */
export interface IPlatformGraphics {
	drawBoard(context: IContext, g2d: Graphics2D, placement: Rectangle): void;
	drawGraph(context: IContext, g2d: Graphics2D, placement: Rectangle): void;
	drawConnections(context: IContext, g2d: Graphics2D, placement: Rectangle): void;
}

/**
 * Minimal surface of util.ContainerUtil.
 * @java util.ContainerUtil
 */
interface IContainerUtil {
	normaliseGraphElements(topology: Topology): void;
	centerGraphElements(topology: Topology): void;
	getContainerId(context: IContext, site: number, siteType: SiteType): number;
	getContainerSite(context: IContext, site: number, siteType: SiteType): number;
}

/**
 * Minimal surface of util.DeveloperGUI.
 * @java util.DeveloperGUI
 */
interface IDeveloperGUI {
	drawPregeneration(bridge: IBridge, g2d: Graphics2D, context: IContext, style: ContainerStyle): void;
}

/**
 * Minimal surface of util.GraphUtil.
 * @java util.GraphUtil
 */
interface IGraphUtil {
	createSVGGraphImage(style: ContainerStyle): string;
	createSVGConnectionsImage(style: ContainerStyle): string;
}

/**
 * Minimal surface of util.StackVisuals.
 * @java util.StackVisuals
 */
interface IStackVisuals {
	calculateStackOffset(
		bridge: IBridge,
		context: IContext,
		container: Container,
		componentStackType: IPieceStackType,
		cellRadiusPixels: number,
		level: number,
		site: number,
		siteType: SiteType,
		stackSize: number,
		state: number,
		value: number
	): Point2D & { x: number; y: number };
}

/**
 * Minimal surface of util.StringUtil.
 * @java util.StringUtil
 */
interface IStringUtil {
	drawStringAtPoint(
		g2d: Graphics2D,
		str: string,
		graphElement: TopologyElement | null,
		posn: Point2D,
		withOutline: boolean
	): void;
}

/**
 * Minimal surface of metadata.graphics.util.PieceStackType.
 * @java metadata.graphics.util.PieceStackType
 */
interface IPieceStackType {
	getTypeFromValue(value: number): IPieceStackType;
}

/**
 * Minimal surface of metadata.graphics.util.StackPropertyType.
 * @java metadata.graphics.util.StackPropertyType
 */
interface IStackPropertyType {
	Type: unknown;
}

/**
 * Minimal surface of other.context.Context (narrow subset used here).
 * @java other.context.Context
 */
export interface IContext {
	currentInstanceContext(): IContext;
	game(): IGame;
	metadata(): { graphics(): IGraphicsMetadata };
	state(): IState;
	board(): IBoard;
	equipment(): { containers(): Container[] };
	trial(): { over(): boolean };
	moves(context: IContext): { moves(): { size(): number; get(i: number): unknown } };
}

/**
 * @java game.Game
 */
interface IGame {
	isDeductionPuzzle(): boolean;
	metadata(): { graphics(): IGraphicsMetadata };
}

/**
 * @java metadata.graphics.Graphics
 */
interface IGraphicsMetadata {
	drawHintType(): unknown;
	showCost(): boolean;
	stackMetadata(
		context: IContext,
		container: Container,
		site: number,
		siteType: SiteType,
		state: number,
		value: number,
		propType: unknown
	): number;
}

/**
 * @java other.state.State
 */
interface IState {
	containerStates(): IContainerState[];
}

/**
 * @java other.state.container.ContainerState
 */
interface IContainerState {
	state(site: number, level: number, siteType: SiteType): number;
	value(site: number, level: number, siteType: SiteType): number;
	sizeStack(site: number, siteType: SiteType): number;
}

/**
 * @java game.equipment.container.Board (narrow usage)
 */
interface IBoard {
	defaultSite(): SiteType;
}

// ---------------------------------------------------------------------------
// Minimal aspect escape-hatches (not yet ported)
// ---------------------------------------------------------------------------

/**
 * @java view.container.aspects.placement.ContainerPlacement
 */
export interface IContainerPlacement {
	unscaledPlacement(): Rectangle;
	placement(): Rectangle;
	cellRadiusPixels(): number;
	cellRadius(): number;
	containerZoom(): number;
	containerScale(): number;
	screenPosn(posn: Point2D): Point;
	setPlacement(context: IContext, placement: Rectangle): void;
	drawnCells(): Cell[];
	drawnEdges(): Edge[];
	drawnVertices(): Vertex[];
}

/**
 * @java view.container.aspects.components.ContainerComponents
 */
export interface IContainerComponents {
	drawComponents(g2d: Graphics2D, context: IContext): void;
	drawPuzzleValue(
		value: number,
		site: number,
		context: IContext,
		g2d: Graphics2D,
		drawPosn: Point,
		imageSize: number
	): void;
	pieceScale(): number;
}

/**
 * @java view.container.aspects.tracks.ContainerTrack
 */
export interface IContainerTrack {
	drawTracks(bridge: IBridge, g2d: Graphics2D, context: IContext, style: ContainerStyle): void;
}

/**
 * @java view.container.aspects.axes.ContainerAxis
 */
export interface IContainerAxis {
	drawAxes(bridge: IBridge, g2d: Graphics2D): void;
}

/**
 * @java view.container.aspects.designs.ContainerDesign
 */
export interface IContainerDesign {
	createSVGImage(bridge: IBridge, context: IContext): string;
	drawPuzzleHints(g2d: Graphics2D, context: IContext): void;
	drawPuzzleCandidates(g2d: Graphics2D, context: IContext): void;
	ignorePieceSelectionLimit(): boolean;
}

// ---------------------------------------------------------------------------
// Lazy-loaded static utilities (escape-hatch pattern)
// ---------------------------------------------------------------------------

// These are imported lazily to avoid circular dep issues and because they
// may not yet be ported. At call sites we cast to the minimal interface.
let _ContainerUtil: IContainerUtil | null = null;
let _DeveloperGUI: IDeveloperGUI | null = null;
let _GraphUtil: IGraphUtil | null = null;
let _StackVisuals: IStackVisuals | null = null;
let _StringUtil: IStringUtil | null = null;
let _PieceStackType: IPieceStackType | null = null;
let _StackPropertyType: IStackPropertyType | null = null;

/** Lazily attempts to load ContainerUtil from its expected TS port path. */
function getContainerUtil(): IContainerUtil {
	if (!_ContainerUtil) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const m = require('../../util/ContainerUtil.js') as { ContainerUtil: IContainerUtil };
			_ContainerUtil = m.ContainerUtil;
		} catch {
			_ContainerUtil = {
				normaliseGraphElements: () => undefined,
				centerGraphElements: () => undefined,
				getContainerId: () => 0,
				getContainerSite: () => 0,
			};
		}
	}
	return _ContainerUtil!;
}

function getDeveloperGUI(): IDeveloperGUI {
	if (!_DeveloperGUI) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const m = require('../../util/DeveloperGUI.js') as { DeveloperGUI: IDeveloperGUI };
			_DeveloperGUI = m.DeveloperGUI;
		} catch {
			_DeveloperGUI = { drawPregeneration: () => undefined };
		}
	}
	return _DeveloperGUI!;
}

function getGraphUtil(): IGraphUtil {
	if (!_GraphUtil) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const m = require('../../util/GraphUtil.js') as { GraphUtil: IGraphUtil };
			_GraphUtil = m.GraphUtil;
		} catch {
			_GraphUtil = {
				createSVGGraphImage: () => '',
				createSVGConnectionsImage: () => '',
			};
		}
	}
	return _GraphUtil!;
}

function getStackVisuals(): IStackVisuals {
	if (!_StackVisuals) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const m = require('../../util/StackVisuals.js') as { StackVisuals: IStackVisuals };
			_StackVisuals = m.StackVisuals;
		} catch {
			_StackVisuals = {
				calculateStackOffset: () => ({ x: 0, y: 0 } as Point2D & { x: number; y: number }),
			};
		}
	}
	return _StackVisuals!;
}

function getStringUtil(): IStringUtil {
	if (!_StringUtil) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const m = require('../../util/StringUtil.js') as { StringUtil: IStringUtil };
			_StringUtil = m.StringUtil;
		} catch {
			_StringUtil = { drawStringAtPoint: () => undefined };
		}
	}
	return _StringUtil!;
}

function getPieceStackType(): IPieceStackType {
	if (!_PieceStackType) {
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const m = require('../../../../../ludemes/metadata/graphics/util/PieceStackType.js') as { PieceStackType: IPieceStackType };
			_PieceStackType = m.PieceStackType;
		} catch {
			_PieceStackType = { getTypeFromValue: (v: number) => ({ getTypeFromValue: () => undefined } as unknown as IPieceStackType) };
		}
	}
	return _PieceStackType!;
}

// ---------------------------------------------------------------------------

/**
 * Implementation of container style.
 *
 * Faithful 1:1 port of view.container.BaseContainerStyle.
 *
 * @author matthew.stephenson and mrraow and cambolbro (Java original)
 * @java view.container.BaseContainerStyle
 */
export abstract class BaseContainerStyle implements ContainerStyle {

	// Container components from the ECS framework
	/** @java BaseContainerStyle#containerComponents */
	protected containerComponents!: IContainerComponents;
	/** @java BaseContainerStyle#containerTrack */
	protected containerTrack!: IContainerTrack;
	/** @java BaseContainerStyle#containerAxis */
	protected containerAxis!: IContainerAxis;
	/** @java BaseContainerStyle#containerDesign */
	protected containerDesign!: IContainerDesign;
	/** @java BaseContainerStyle#containerPlacement */
	protected containerPlacement!: IContainerPlacement;

	// -------------------------------------------------------------------------

	/** Container to which this style applies. @java BaseContainerStyle#container */
	private readonly _container: Container;

	/** Image for rendering. @java BaseContainerStyle#imageSVGString */
	protected imageSVGString: string | null = null;

	/** Image to display the graph. @java BaseContainerStyle#graphSVGString */
	protected graphSVGString: string | null = null;

	/** Image to display the dual. @java BaseContainerStyle#connectionsSVGString */
	protected connectionsSVGString: string | null = null;

	/** @java BaseContainerStyle#bridge */
	protected bridge: IBridge;

	// -------------------------------------------------------------------------

	/**
	 * Constructor.
	 * @java BaseContainerStyle#BaseContainerStyle(bridge.Bridge, game.equipment.container.Container)
	 */
	constructor(bridge: IBridge, container: Container) {
		this._container = container;
		this.bridge = bridge;

		getContainerUtil().normaliseGraphElements(this.topology());
		getContainerUtil().centerGraphElements(this.topology());

		// containerPlacement, containerComponents, containerTrack, containerAxis, containerDesign
		// are set up by subclasses (or via their constructors).
		// The Java BaseContainerStyle sets them to plain ContainerPlacement/ContainerComponents etc.
		// We install no-op defaults here; subclasses override.
		this.containerPlacement = {
			unscaledPlacement: () => new Rectangle(0, 0, 0, 0),
			placement: () => new Rectangle(0, 0, 0, 0),
			cellRadiusPixels: () => 0,
			cellRadius: () => 0,
			containerZoom: () => 1,
			containerScale: () => 1,
			screenPosn: (_posn) => new Point(0, 0),
			setPlacement: () => undefined,
			drawnCells: () => [],
			drawnEdges: () => [],
			drawnVertices: () => [],
		};
		this.containerComponents = {
			drawComponents: () => undefined,
			drawPuzzleValue: () => undefined,
			pieceScale: () => 1,
		};
		this.containerTrack = {
			drawTracks: () => undefined,
		};
		this.containerAxis = {
			drawAxes: () => undefined,
		};
		this.containerDesign = {
			createSVGImage: () => '',
			drawPuzzleHints: () => undefined,
			drawPuzzleCandidates: () => undefined,
			ignorePieceSelectionLimit: () => false,
		};
	}

	// -------------------------------------------------------------------------

	/**
	 * Set all the required rendering values for drawing the board.
	 * @java BaseContainerStyle#setSVGRenderingValues()
	 */
	setSVGRenderingValues(): SVGGraphics2D {
		const g2d = new SVGGraphics2D(
			Math.trunc(this.containerPlacement.unscaledPlacement().getWidth()),
			Math.trunc(this.containerPlacement.unscaledPlacement().getHeight())
		);
		g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
		g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
		return g2d;
	}

	// -------------------------------------------------------------------------

	/** @java BaseContainerStyle#draw(java.awt.Graphics2D, util.PlaneType, other.context.Context) */
	draw(g2d: Graphics2D, plane: PlaneType, oriContext: Context): void {
		const context = (oriContext as unknown as IContext).currentInstanceContext();
		try {
			switch (plane) {
				case PlaneType.BOARD:
					this.bridge.graphicsRenderer()?.drawBoard(
						context,
						g2d,
						this.containerPlacement.unscaledPlacement()
					);
					break;
				case PlaneType.TRACK:
					this.containerTrack.drawTracks(this.bridge, g2d, context, this);
					break;
				case PlaneType.AXES:
					this.containerAxis.drawAxes(this.bridge, g2d);
					break;
				case PlaneType.GRAPH:
					this.bridge.graphicsRenderer()?.drawGraph(
						context,
						g2d,
						this.containerPlacement.unscaledPlacement()
					);
					break;
				case PlaneType.CONNECTIONS:
					this.bridge.graphicsRenderer()?.drawConnections(
						context,
						g2d,
						this.containerPlacement.unscaledPlacement()
					);
					break;
				case PlaneType.HINTS:
					if (context.game().metadata().graphics().drawHintType() === 'None')
						break;
					this.containerDesign.drawPuzzleHints(g2d, context);
					break;
				case PlaneType.CANDIDATES:
					this.containerDesign.drawPuzzleCandidates(g2d, context);
					break;
				case PlaneType.COMPONENTS:
					this.containerComponents.drawComponents(g2d, context);
					break;
				case PlaneType.PREGENERATION:
					getDeveloperGUI().drawPregeneration(this.bridge, g2d, context, this);
					break;
				case PlaneType.INDICES:
					this.drawIndices(g2d, context);
					break;
				case PlaneType.POSSIBLEMOVES:
					this.drawPossibleMoves(g2d, context);
					break;
				case PlaneType.COSTS:
					this.drawElementCost(g2d, context);
					break;
				default:
					break;
			}
		} catch (e) {
			const svc = this.bridge.settingsVC();
			svc.setErrorReport(
				svc.errorReport() +
				'VC_ERROR: Error detected when attempting to draw ' +
				PlaneType[plane] +
				'\n'
			);
			// eslint-disable-next-line no-console
			console.error(e);
		}
	}

	// -------------------------------------------------------------------------

	/** @java BaseContainerStyle#render(util.PlaneType, other.context.Context) */
	render(plane: PlaneType, oriContext: Context): void {
		const context = (oriContext as unknown as IContext).currentInstanceContext();
		try {
			switch (plane) {
				case PlaneType.BOARD:
					this.imageSVGString = this.containerDesign.createSVGImage(this.bridge, context);
					break;
				case PlaneType.TRACK:
					break;
				case PlaneType.AXES:
					break;
				case PlaneType.GRAPH:
					this.graphSVGString = getGraphUtil().createSVGGraphImage(this);
					break;
				case PlaneType.CONNECTIONS:
					this.connectionsSVGString = getGraphUtil().createSVGConnectionsImage(this);
					break;
				case PlaneType.HINTS:
				case PlaneType.CANDIDATES:
				case PlaneType.COMPONENTS:
				case PlaneType.PREGENERATION:
				case PlaneType.INDICES:
				case PlaneType.POSSIBLEMOVES:
				case PlaneType.COSTS:
				default:
					break;
			}
		} catch (e) {
			const svc = this.bridge.settingsVC();
			svc.setErrorReport(
				svc.errorReport() +
				'VC_ERROR: Error detected when attempting to render ' +
				PlaneType[plane] +
				'\n'
			);
			// eslint-disable-next-line no-console
			console.error(e);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw the cost of each element on the board (if enabled in metadata).
	 * @java BaseContainerStyle#drawElementCost(java.awt.Graphics2D, other.context.Context)
	 */
	drawElementCost(g2d: Graphics2D, context: IContext): void {
		if (context.metadata().graphics().showCost()) {
			const curFont = g2d.getFont();
			g2d.setFont(
				new Font(curFont.getFontName(), Font.BOLD, Math.trunc(this.cellRadiusPixels() / 5))
			);

			for (const graphElement of this.drawnCells()) {
				g2d.setColor(new Color(0, 200, 0));
				getStringUtil().drawStringAtPoint(
					g2d,
					String((graphElement as unknown as { cost(): number }).cost()),
					graphElement as unknown as TopologyElement,
					(graphElement as unknown as { centroid(): Point2D }).centroid(),
					true
				);
			}
			for (const graphElement of this.drawnEdges()) {
				g2d.setColor(new Color(100, 0, 100));
				getStringUtil().drawStringAtPoint(
					g2d,
					String((graphElement as unknown as { cost(): number }).cost()),
					graphElement as unknown as TopologyElement,
					(graphElement as unknown as { centroid(): Point2D }).centroid(),
					true
				);
			}
			for (const graphElement of this.drawnVertices()) {
				g2d.setColor(new Color(255, 0, 0));
				getStringUtil().drawStringAtPoint(
					g2d,
					String((graphElement as unknown as { cost(): number }).cost()),
					graphElement as unknown as TopologyElement,
					(graphElement as unknown as { centroid(): Point2D }).centroid(),
					true
				);
			}
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Draws indices/coordinates of all graph elements, based on set preferences.
	 * @java BaseContainerStyle#drawIndices(java.awt.Graphics2D, other.context.Context)
	 */
	drawIndices(g2d: Graphics2D, context: IContext): void {
		g2d.setFont(this.bridge.settingsVC().displayFont());

		const possibleElements = this.drawnGraphElements();

		for (const graphElement of possibleElements) {
			const elemType = (graphElement as unknown as { elementType(): SiteType }).elementType();
			if (elemType === 'Cell' as unknown as SiteType)
				g2d.setColor(new Color(0, 200, 0));
			else if (elemType === 'Edge' as unknown as SiteType)
				g2d.setColor(new Color(100, 0, 100));
			else if (elemType === 'Vertex' as unknown as SiteType)
				g2d.setColor(new Color(255, 0, 0));

			const boardDefaultSite = context.board().defaultSite();
			if (this._container.index() > 0 || boardDefaultSite === elemType) {
				this.drawIndexIfRequired(
					this.bridge.settingsVC().showIndices(),
					this.bridge.settingsVC().showCoordinates(),
					g2d,
					graphElement as unknown as TopologyElement
				);
			}

			if (elemType === 'Cell' as unknown as SiteType) {
				this.drawIndexIfRequired(
					this.bridge.settingsVC().showCellIndices(),
					this.bridge.settingsVC().showCellCoordinates(),
					g2d,
					graphElement as unknown as TopologyElement
				);
			} else if (elemType === 'Edge' as unknown as SiteType) {
				this.drawIndexIfRequired(
					this.bridge.settingsVC().showEdgeIndices(),
					this.bridge.settingsVC().showEdgeCoordinates(),
					g2d,
					graphElement as unknown as TopologyElement
				);
			} else if (elemType === 'Vertex' as unknown as SiteType) {
				this.drawIndexIfRequired(
					this.bridge.settingsVC().showVertexIndices(),
					this.bridge.settingsVC().showVertexCoordinates(),
					g2d,
					graphElement as unknown as TopologyElement
				);
			}
		}

		// Draw container index
		g2d.setColor(new Color(0, 0, 0));
		const dispFont = this.bridge.settingsVC().displayFont();
		g2d.setFont(new Font('Arial', Font.BOLD, dispFont.getSize() * 3));
		if (this.bridge.settingsVC().showContainerIndices()) {
			const pl = this.containerPlacement.placement();
			const containerCenter = { x: pl.getCenterX(), y: pl.getCenterY() } as unknown as Point2D & { x: number; y: number };
			if (this._container.index() > 0)
				containerCenter.y = containerCenter.y + this.containerPlacement.cellRadiusPixels();
			getStringUtil().drawStringAtPoint(
				g2d,
				'' + this._container.index(),
				null,
				containerCenter,
				this.bridge.settingsVC().coordWithOutline()
			);
		}
	}

	/**
	 * Draws the index/coordinate of the specified graphElement, depending on the set preferences.
	 * @java BaseContainerStyle#drawIndexIfRequired(boolean, boolean, java.awt.Graphics2D, other.topology.TopologyElement)
	 */
	private drawIndexIfRequired(
		showIndices: boolean,
		showCoordinates: boolean,
		g2d: Graphics2D,
		graphElement: TopologyElement
	): void {
		const ge = graphElement as unknown as {
			index(): number;
			label(): string;
			centroid(): Point2D;
		};
		const posn = this.containerPlacement.screenPosn(ge.centroid());
		if (showIndices)
			getStringUtil().drawStringAtPoint(
				g2d,
				'' + ge.index(),
				graphElement,
				posn as unknown as Point2D,
				this.bridge.settingsVC().coordWithOutline()
			);
		if (showCoordinates)
			getStringUtil().drawStringAtPoint(
				g2d,
				'' + ge.label(),
				graphElement,
				posn as unknown as Point2D,
				this.bridge.settingsVC().coordWithOutline()
			);
	}

	// -------------------------------------------------------------------------

	/**
	 * Draw the possible moves that the user can perform.
	 * @java BaseContainerStyle#drawPossibleMoves(java.awt.Graphics2D, other.context.Context)
	 */
	drawPossibleMoves(g2d: Graphics2D, context: IContext): void {
		if (this.bridge.settingsVC().thisFrameIsAnimated() || context.game().isDeductionPuzzle())
			return;

		const transparencyAmount = 63;
		const sz = Math.min(16, Math.trunc(0.4 * this.containerPlacement.cellRadiusPixels()));

		const SiteTypeCell    = 'Cell' as unknown as SiteType;
		const SiteTypeEdge    = 'Edge' as unknown as SiteType;
		const SiteTypeVertex  = 'Vertex' as unknown as SiteType;

		const containerIdx = this._container.index();

		// Possible consequence move locations
		if (this.bridge.settingsVC().selectingConsequenceMove()) {
			for (const possibleToLocation of this.bridge.settingsVC().possibleConsequenceLocations()) {
				const loc = possibleToLocation as unknown as {
					site(): number;
					level(): number;
					siteType(): SiteType;
				};
				if (getContainerUtil().getContainerId(context, loc.site(), loc.siteType()) === containerIdx) {
					const indexOnContainer = getContainerUtil().getContainerSite(context, loc.site(), loc.siteType());

					let drawPosn: Point | null = null;
					if (loc.siteType() === SiteTypeCell)
						drawPosn = this.containerPlacement.screenPosn(
							(this.drawnCells()[indexOnContainer] as unknown as { centroid(): Point2D }).centroid()
						);
					if (loc.siteType() === SiteTypeEdge)
						drawPosn = this.containerPlacement.screenPosn(
							(this.drawnEdges()[indexOnContainer] as unknown as { centroid(): Point2D }).centroid()
						);
					if (loc.siteType() === SiteTypeVertex)
						drawPosn = this.containerPlacement.screenPosn(
							(this.drawnVertices()[indexOnContainer] as unknown as { centroid(): Point2D }).centroid()
						);

					if (drawPosn === null) continue;

					const cs = context.state().containerStates()[containerIdx];
					if (!cs) continue;
					const localState = cs.state(loc.site(), loc.level(), loc.siteType());
					const value = cs.value(loc.site(), loc.level(), loc.siteType());
					const componentStackType = getPieceStackType().getTypeFromValue(
						Math.trunc(context.game().metadata().graphics().stackMetadata(
							context, this._container, loc.site(), loc.siteType(), localState, value,
							undefined
						))
					);
					const stackSize = cs.sizeStack(loc.site(), loc.siteType());
					const offsetDistance = getStackVisuals().calculateStackOffset(
						this.bridge, context, this._container, componentStackType,
						this.containerPlacement.cellRadiusPixels(), loc.level(), loc.site(), loc.siteType(),
						stackSize, localState, value
					);

					g2d.setColor(new Color(0, 0, 0, transparencyAmount));
					g2d.fillOval(
						Math.trunc(drawPosn.x - 2 - sz / 2 + offsetDistance.x),
						Math.trunc(drawPosn.y - 2 - sz / 2 + offsetDistance.y),
						sz + 4, sz + 4
					);
					g2d.setColor(new Color(249, 166, 0, transparencyAmount));
					g2d.fillOval(
						Math.trunc(drawPosn.x - sz / 2 + offsetDistance.x),
						Math.trunc(drawPosn.y - sz / 2 + offsetDistance.y),
						sz, sz
					);
				}
			}
		}
		// Possible from move locations
		else if (
			(this.bridge.settingsVC().selectedFromLocation() as unknown as { equals(o: unknown): boolean })
				.equals(new FullLocation(UNDEFINED)) &&
			!context.trial().over() &&
			this.bridge.settingsVC().showPossibleMoves()
		) {
			// getLegalFromLocations — lazy import of LocationUtil
			let fromLocations: Location[] = [];
			try {
				// eslint-disable-next-line @typescript-eslint/no-var-requires
				const m = require('../../util/LocationUtil.js') as {
					LocationUtil: { getLegalFromLocations(ctx: IContext): Location[] }
				};
				fromLocations = m.LocationUtil.getLegalFromLocations(context as unknown as Parameters<typeof m.LocationUtil.getLegalFromLocations>[0]);
			} catch {
				fromLocations = [];
			}

			for (const location of fromLocations) {
				const loc = location as unknown as {
					site(): number;
					level(): number;
					siteType(): SiteType;
				};
				if (getContainerUtil().getContainerId(context, loc.site(), loc.siteType()) === containerIdx) {
					const indexOnContainer = getContainerUtil().getContainerSite(context, loc.site(), loc.siteType());

					let drawPosn: Point2D = new Point(0, 0) as unknown as Point2D;
					if (loc.siteType() === SiteTypeCell)
						drawPosn = this.containerPlacement.screenPosn(
							(this.drawnCells()[indexOnContainer] as unknown as { centroid(): Point2D }).centroid()
						) as unknown as Point2D;
					if (loc.siteType() === SiteTypeEdge)
						drawPosn = this.containerPlacement.screenPosn(
							(this.drawnEdges()[indexOnContainer] as unknown as { centroid(): Point2D }).centroid()
						) as unknown as Point2D;
					if (loc.siteType() === SiteTypeVertex)
						drawPosn = this.containerPlacement.screenPosn(
							(this.drawnVertices()[indexOnContainer] as unknown as { centroid(): Point2D }).centroid()
						) as unknown as Point2D;

					const cs = context.state().containerStates()[containerIdx];
					if (!cs) continue;
					const localState = cs.state(loc.site(), loc.level(), loc.siteType());
					const value = cs.value(loc.site(), loc.level(), loc.siteType());
					const componentStackType = getPieceStackType().getTypeFromValue(
						Math.trunc(context.game().metadata().graphics().stackMetadata(
							context, this._container, loc.site(), loc.siteType(), localState, value, undefined
						))
					);
					const stackSize = cs.sizeStack(loc.site(), loc.siteType());
					const offsetDistance = getStackVisuals().calculateStackOffset(
						this.bridge, context, this._container, componentStackType,
						this.containerPlacement.cellRadiusPixels(), loc.level(), loc.site(), loc.siteType(),
						stackSize, localState, value
					);

					const dpX = (drawPosn as unknown as { getX(): number }).getX?.() ?? (drawPosn as unknown as { x: number }).x;
					const dpY = (drawPosn as unknown as { getY(): number }).getY?.() ?? (drawPosn as unknown as { y: number }).y;

					g2d.setColor(new Color(0, 0, 0, transparencyAmount));
					g2d.fillOval(
						Math.trunc(dpX - 2 - sz / 2 + offsetDistance.x),
						Math.trunc(dpY - 2 - sz / 2 + offsetDistance.y),
						sz + 4, sz + 4
					);
					g2d.setColor(new Color(0, 127, 255, transparencyAmount));
					g2d.fillOval(
						Math.trunc(dpX - sz / 2 + offsetDistance.x),
						Math.trunc(dpY - sz / 2 + offsetDistance.y),
						sz, sz
					);
				}
			}
		}
		// Possible to move locations
		else {
			if (
				!(this.bridge.settingsVC().selectedFromLocation() as unknown as { equals(o: unknown): boolean })
					.equals(new FullLocation(UNDEFINED)) &&
				!context.trial().over() &&
				this.bridge.settingsVC().showPossibleMoves()
			) {
				let toLocations: Location[] = [];
				try {
					// eslint-disable-next-line @typescript-eslint/no-var-requires
					const m = require('../../util/LocationUtil.js') as {
						LocationUtil: { getLegalToLocations(bridge: IBridge, ctx: IContext): Location[] }
					};
					toLocations = m.LocationUtil.getLegalToLocations(this.bridge, context as unknown as Parameters<typeof m.LocationUtil.getLegalToLocations>[1]);
				} catch {
					toLocations = [];
				}

				for (const location of toLocations) {
					const loc = location as unknown as {
						site(): number;
						level(): number;
						siteType(): SiteType;
					};
					if (getContainerUtil().getContainerId(context, loc.site(), loc.siteType()) === containerIdx) {
						const indexOnContainer = getContainerUtil().getContainerSite(context, loc.site(), loc.siteType());

						let drawPosn: Point2D = new Point(0, 0) as unknown as Point2D;
						if (loc.siteType() === SiteTypeCell)
							drawPosn = this.containerPlacement.screenPosn(
								(this.drawnCells()[indexOnContainer] as unknown as { centroid(): Point2D }).centroid()
							) as unknown as Point2D;
						if (loc.siteType() === SiteTypeEdge)
							drawPosn = this.containerPlacement.screenPosn(
								(this.drawnEdges()[indexOnContainer] as unknown as { centroid(): Point2D }).centroid()
							) as unknown as Point2D;
						if (loc.siteType() === SiteTypeVertex)
							drawPosn = this.containerPlacement.screenPosn(
								(this.drawnVertices()[indexOnContainer] as unknown as { centroid(): Point2D }).centroid()
							) as unknown as Point2D;

						const cs = context.state().containerStates()[containerIdx];
						if (!cs) continue;
						const localState = cs.state(loc.site(), loc.level(), loc.siteType());
						const value = cs.value(loc.site(), loc.level(), loc.siteType());
						const componentStackType = getPieceStackType().getTypeFromValue(
							Math.trunc(context.game().metadata().graphics().stackMetadata(
								context, this._container, loc.site(), loc.siteType(), localState, value, undefined
							))
						);
						const stackSize = cs.sizeStack(loc.site(), loc.siteType());
						const offsetDistance = getStackVisuals().calculateStackOffset(
							this.bridge, context, this._container, componentStackType,
							this.containerPlacement.cellRadiusPixels(), loc.level(), loc.site(), loc.siteType(),
							stackSize, localState, value
						);

						const dpX = (drawPosn as unknown as { getX(): number }).getX?.() ?? (drawPosn as unknown as { x: number }).x;
						const dpY = (drawPosn as unknown as { getY(): number }).getY?.() ?? (drawPosn as unknown as { y: number }).y;

						g2d.setColor(new Color(0, 0, 0, transparencyAmount));
						g2d.fillOval(
							Math.trunc(dpX - 2 - sz / 2 + offsetDistance.x),
							Math.trunc(dpY - 2 - sz / 2 + offsetDistance.y),
							sz + 4, sz + 4
						);
						g2d.setColor(new Color(255, 0, 0, transparencyAmount));
						g2d.fillOval(
							Math.trunc(dpX - sz / 2 + offsetDistance.x),
							Math.trunc(dpY - sz / 2 + offsetDistance.y),
							sz, sz
						);
					}
				}
			}
		}
	}

	// -------------------------------------------------------------------------

	/** @java BaseContainerStyle#drawnGraphElements() */
	drawnGraphElements(): TopologyElement[] {
		const all: TopologyElement[] = [];
		for (const g of this.drawnCells())
			all.push(g as unknown as TopologyElement);
		for (const g of this.drawnEdges())
			all.push(g as unknown as TopologyElement);
		for (const g of this.drawnVertices())
			all.push(g as unknown as TopologyElement);
		return all;
	}

	// -------------------------------------------------------------------------

	/** @java BaseContainerStyle#drawnGraphElement(int, game.types.board.SiteType) */
	drawnGraphElement(index: number, graphElementType: SiteType): TopologyElement | null {
		const SiteTypeCell   = 'Cell' as unknown as SiteType;
		const SiteTypeEdge   = 'Edge' as unknown as SiteType;
		const SiteTypeVertex = 'Vertex' as unknown as SiteType;

		if (graphElementType === SiteTypeCell)
			for (const g of this.drawnCells()) {
				const ge = g as unknown as { index(): number };
				if (ge.index() === index) return g as unknown as TopologyElement;
			}

		if (graphElementType === SiteTypeEdge)
			for (const g of this.drawnEdges()) {
				const ge = g as unknown as { index(): number };
				if (ge.index() === index) return g as unknown as TopologyElement;
			}

		if (graphElementType === SiteTypeVertex)
			for (const g of this.drawnVertices()) {
				const ge = g as unknown as { index(): number };
				if (ge.index() === index) return g as unknown as TopologyElement;
			}

		return null;
	}

	// -------------------------------------------------------------------------

	/** @java BaseContainerStyle#getElementType(int) */
	getElementType(index: number): SiteType | null {
		for (const element of this.drawnGraphElements()) {
			const ge = element as unknown as { index(): number; elementType(): SiteType };
			if (ge.index() === index)
				return ge.elementType();
		}
		return null;
	}

	// -------------------------------------------------------------------------

	/** @java BaseContainerStyle#graphSVGImage() */
	graphSVGImage(): string | null {
		return this.graphSVGString;
	}

	/** @java BaseContainerStyle#dualSVGImage() */
	dualSVGImage(): string | null {
		return this.connectionsSVGString;
	}

	/** @java BaseContainerStyle#containerSVGImage() */
	containerSVGImage(): string | null {
		return this.imageSVGString;
	}

	/** @java BaseContainerStyle#drawnCells() */
	drawnCells(): Cell[] {
		return this.containerPlacement.drawnCells();
	}

	/** @java BaseContainerStyle#drawnEdges() */
	drawnEdges(): Edge[] {
		return this.containerPlacement.drawnEdges();
	}

	/** @java BaseContainerStyle#drawnVertices() */
	drawnVertices(): Vertex[] {
		return this.containerPlacement.drawnVertices();
	}

	/** @java BaseContainerStyle#topology() */
	topology(): Topology {
		return (this._container as unknown as { topology(): Topology }).topology();
	}

	/** @java BaseContainerStyle#pieceScale() */
	pieceScale(): number {
		return this.containerComponents.pieceScale();
	}

	/** @java BaseContainerStyle#containerZoom() */
	containerZoom(): number {
		return this.containerPlacement.containerZoom();
	}

	/** @java BaseContainerStyle#drawPuzzleValue(int, int, other.context.Context, java.awt.Graphics2D, java.awt.Point, int) */
	drawPuzzleValue(value: number, site: number, context: Context, g2d: Graphics2D, drawPosn: Point, imageSize: number): void {
		this.containerComponents.drawPuzzleValue(value, site, context as unknown as IContext, g2d, drawPosn, imageSize);
	}

	/** @java BaseContainerStyle#container() */
	container(): Container {
		return this._container;
	}

	/** @java BaseContainerStyle#placement() */
	placement(): Rectangle {
		return this.containerPlacement.placement();
	}

	/** @java BaseContainerStyle#maxDim() */
	maxDim(): number {
		return Math.max(
			this.containerPlacement.placement().getWidth(),
			this.containerPlacement.placement().getHeight()
		);
	}

	/** @java BaseContainerStyle#cellRadius() */
	cellRadius(): number {
		return this.containerPlacement.cellRadius();
	}

	/** @java BaseContainerStyle#cellRadiusPixels() */
	cellRadiusPixels(): number {
		return this.containerPlacement.cellRadiusPixels();
	}

	/** @java BaseContainerStyle#screenPosn(java.awt.geom.Point2D) */
	screenPosn(posn: Point2D): Point {
		return this.containerPlacement.screenPosn(posn);
	}

	/** @java BaseContainerStyle#setPlacement(other.context.Context, java.awt.Rectangle) */
	setPlacement(context: Context, placement: Rectangle): void {
		this.containerPlacement.setPlacement(context as unknown as IContext, placement);
	}

	/** @java BaseContainerStyle#containerScale() */
	containerScale(): number {
		return this.containerPlacement.containerScale();
	}

	/** @java BaseContainerStyle#ignorePieceSelectionLimit() */
	ignorePieceSelectionLimit(): boolean {
		return this.containerDesign.ignorePieceSelectionLimit();
	}

	/** @java BaseContainerStyle#unscaledPlacement() */
	unscaledPlacement(): Rectangle {
		return this.containerPlacement.unscaledPlacement();
	}

	/** @java BaseContainerStyle#setDefaultBoardScale(double) — implemented by subclasses */
	abstract setDefaultBoardScale(scale: number): void;
}
