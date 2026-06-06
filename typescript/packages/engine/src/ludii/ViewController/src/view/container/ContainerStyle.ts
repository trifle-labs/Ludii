// @java ViewController/src/view/container/ContainerStyle.java

import type { Graphics2D } from '../../../../awt/index.js';
import type { Point, Rectangle } from '../../../../awt/index.js';
import type { Point2D } from '../../../../awt/index.js';
import type { Cell } from '../../../../../ludemes/other/topology/Cell.js';
import type { Edge } from '../../../../../ludemes/other/topology/Edge.js';
import type { Vertex } from '../../../../../ludemes/other/topology/Vertex.js';
import type { TopologyElement } from '../../../../../ludemes/other/topology/TopologyElement.js';
import type { Topology } from '../../../../../ludemes/other/topology/Topology.js';
import type { Container } from '../../../../../ludemes/game/equipment/container/Container.js';
import type { SiteType } from '../../../../../ludemes/other/action/SiteType.js';
import type { Context } from '../../../../../ludemes/other/context/Context.js';
import type { PlaneType } from '../../util/PlaneType.js';

/**
 * Something to be drawn.
 * View part of MVC for equipment.
 *
 * Faithful 1:1 port of view.container.ContainerStyle.
 *
 * @author Matthew.Stephenson and cambolbro (Java original)
 * @java view.container.ContainerStyle
 */
export interface ContainerStyle {
	/**
	 * Renders the string description of SVG graphic to a graphics plane.
	 * @java ContainerStyle#render(util.PlaneType, other.context.Context)
	 */
	render(plane: PlaneType, context: Context): void;

	/**
	 * Draws specified layer to the supplied graphics context.
	 * @java ContainerStyle#draw(java.awt.Graphics2D, util.PlaneType, other.context.Context)
	 */
	draw(g2d: Graphics2D, plane: PlaneType, context: Context): void;

	/**
	 * Sets the dimensions of the container, set by the view that it is to be placed in.
	 * @java ContainerStyle#setPlacement(other.context.Context, java.awt.Rectangle)
	 */
	setPlacement(context: Context, rectangle: Rectangle): void;

	/** @java ContainerStyle#setDefaultBoardScale(double) */
	setDefaultBoardScale(scale: number): void;

	// -------------------------------------------------------------------------

	/**
	 * Get the SVG image for the container (i.e. the board image).
	 * @java ContainerStyle#containerSVGImage()
	 */
	containerSVGImage(): string | null;

	/**
	 * Get the SVG image for the graph of the container.
	 * @java ContainerStyle#graphSVGImage()
	 */
	graphSVGImage(): string | null;

	/**
	 * Get the SVG image for the dual of the container.
	 * @java ContainerStyle#dualSVGImage()
	 */
	dualSVGImage(): string | null;

	/**
	 * Get the cells of the graph that should be visible.
	 * @java ContainerStyle#drawnCells()
	 */
	drawnCells(): Cell[];

	/**
	 * Get the edges of the graph that should be visible.
	 * @java ContainerStyle#drawnEdges()
	 */
	drawnEdges(): Edge[];

	/**
	 * Get the vertices of the graph that should be visible.
	 * @java ContainerStyle#drawnVertices()
	 */
	drawnVertices(): Vertex[];

	/**
	 * Get all graph elements that should be visible.
	 * @java ContainerStyle#drawnGraphElements()
	 */
	drawnGraphElements(): TopologyElement[];

	/**
	 * Return the visible graph element defined by the index and type specified.
	 * @java ContainerStyle#drawnGraphElement(int, game.types.board.SiteType)
	 */
	drawnGraphElement(index: number, graphElementType: SiteType): TopologyElement | null;

	/**
	 * Get the placement of the container.
	 * @java ContainerStyle#placement()
	 */
	placement(): Rectangle;

	/**
	 * Get the unscaled placement of the container.
	 * @java ContainerStyle#unscaledPlacement()
	 */
	unscaledPlacement(): Rectangle;

	/**
	 * Get the cell radius of the container (between 0 and 1).
	 * @java ContainerStyle#cellRadius()
	 */
	cellRadius(): number;

	/**
	 * Get the cell radius of the container (screen position).
	 * @java ContainerStyle#cellRadiusPixels()
	 */
	cellRadiusPixels(): number;

	/**
	 * Get the screen position for a specified world position.
	 * @java ContainerStyle#screenPosn(java.awt.geom.Point2D)
	 */
	screenPosn(posn: Point2D): Point;

	/**
	 * Get the scale of the container.
	 * @java ContainerStyle#containerScale()
	 */
	containerScale(): number;

	/**
	 * Get the zoom of the container.
	 * @java ContainerStyle#containerZoom()
	 */
	containerZoom(): number;

	/**
	 * Get the container style specific piece scale.
	 * @java ContainerStyle#pieceScale()
	 */
	pieceScale(): number;

	/**
	 * Get the graph of the container for this style.
	 * @java ContainerStyle#topology()
	 */
	topology(): Topology;

	/**
	 * Draw the puzzle value on the graphics object.
	 * @java ContainerStyle#drawPuzzleValue(int, int, other.context.Context, java.awt.Graphics2D, java.awt.Point, int)
	 */
	drawPuzzleValue(
		puzzleValue: number,
		site: number,
		context: Context,
		graphics: Graphics2D,
		point: Point,
		buttonSize: number
	): void;

	/**
	 * If there is no minimum selection distance for a piece.
	 * @java ContainerStyle#ignorePieceSelectionLimit()
	 */
	ignorePieceSelectionLimit(): boolean;

	/**
	 * The container associated with this style.
	 * @java ContainerStyle#container()
	 */
	container(): Container;

	/** @java ContainerStyle#maxDim() */
	maxDim(): number;
}
