// @java ViewController/src/view/container/aspects/placement/Board/BoardlessPlacement.java

/**
 * Placement aspect for boardless games. Dynamically zooms to show only the
 * occupied and playable cells.
 *
 * Faithful 1:1 port of view.container.aspects.placement.Board.BoardlessPlacement.
 *
 * Java hierarchy: BoardlessPlacement → BoardPlacement → ContainerPlacement.
 * BoardPlacement (batch 28) is not yet ported; we extend ContainerPlacement directly
 * and inline the relevant BoardPlacement members as an escape-hatch.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.placement.Board.BoardlessPlacement
 */

import { Bridge } from '../../../../../bridge/Bridge.js';
import { ContainerPlacement } from '../ContainerPlacement.js';

// ---------------------------------------------------------------------------
// Escape-hatched dependency types
// ---------------------------------------------------------------------------

/** @java view.container.styles.BoardStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BoardStyle = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java other.state.State */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type State = any;

/** @java other.topology.Cell */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cell = any;

/** @java other.topology.Edge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Edge = any;

/** @java other.topology.Vertex */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = any;

/** @java game.equipment.component.Component */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Component = any;

// ---------------------------------------------------------------------------

/**
 * Placement for boardless games.
 *
 * In Java:
 *   public class BoardlessPlacement extends BoardPlacement { ... }
 *
 * @java view.container.aspects.placement.Board.BoardlessPlacement
 */
export class BoardlessPlacement extends ContainerPlacement {

	/** @java BoardlessPlacement#currentState */
	private currentState: State | null = null;

	/** @java BoardlessPlacement#currentStateHash */
	private currentStateHash: number = -1;

	/** @java BoardlessPlacement#zoomedCells */
	private zoomedCells: Cell[] | null = null;

	/** @java BoardlessPlacement#zoomedEdges */
	private zoomedEdges: Edge[] | null = null;

	/** @java BoardlessPlacement#zoomedVertices */
	private zoomedVertices: Vertex[] | null = null;

	/** @java BoardlessPlacement#zoom */
	protected zoom: number = 1.0;

	/**
	 * Scale of the board relative to the original placement size.
	 * Mirrors BoardPlacement.defaultBoardScale.
	 * @java view.container.aspects.placement.BoardPlacement#defaultBoardScale
	 */
	protected defaultBoardScale: number = 0.8;

	/** @java view.container.aspects.placement.BoardPlacement#boardStyle */
	protected boardStyle: BoardStyle;

	// -------------------------------------------------------------------------

	/**
	 * @java BoardlessPlacement#BoardlessPlacement(Bridge, BoardStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BoardStyle) {
		super(bridge, containerStyle);
		this.boardStyle = containerStyle;
		this.containerScale = this.defaultBoardScale;
	}

	// -------------------------------------------------------------------------

	/**
	 * @java BoardlessPlacement#drawnCells()
	 */
	override drawnCells(): Cell[] {
		const drawnCells: Cell[] = [];
		for (const vOri of this.topology().cells() as Cell[]) {
			if (
				this.currentState?.containerStates()?.[0]?.isPlayable(vOri.index()) ||
				this.currentState?.containerStates()?.[0]?.isOccupied(vOri.index())
			) {
				const newCell: Cell = this.zoomedCells![vOri.index()];
				const newVertices: Vertex[] = [];
				for (const v of vOri.vertices() as Vertex[]) {
					newVertices.push(this.zoomedVertices![v.index()]);
				}
				newCell.setVertices(newVertices);
				drawnCells.push(newCell);
			} else {
				// Placeholder cell
				const UNDEFINED = -1;
				const newCell: Cell = { index: () => vOri.index(), centroid: () => ({ x: UNDEFINED, y: UNDEFINED }), vertices: () => [] } as unknown as Cell;
				drawnCells.push(newCell);
			}
		}
		return drawnCells;
	}

	// -------------------------------------------------------------------------

	/**
	 * @java BoardlessPlacement#drawnEdges()
	 */
	override drawnEdges(): Edge[] {
		const drawnEdges: Edge[] = [];
		for (const eOri of this.topology().edges() as Edge[]) {
			for (const c of eOri.cells() as Cell[]) {
				if (
					this.currentState?.containerStates()?.[0]?.isPlayable(c.index()) ||
					this.currentState?.containerStates()?.[0]?.isOccupied(c.index())
				) {
					const e: Edge = this.zoomedEdges![eOri.index()];
					drawnEdges.push(e);
					break;
				}
			}
		}
		return drawnEdges;
	}

	// -------------------------------------------------------------------------

	/**
	 * @java BoardlessPlacement#drawnVertices()
	 */
	override drawnVertices(): Vertex[] {
		const drawnVertices: Vertex[] = [];
		for (const fOri of this.topology().vertices() as Vertex[]) {
			for (const v of fOri.cells() as Cell[]) {
				if (
					this.currentState?.containerStates()?.[0]?.isPlayable(v.index()) ||
					this.currentState?.containerStates()?.[0]?.isOccupied(v.index())
				) {
					drawnVertices.push(this.zoomedVertices![fOri.index()]);
					break;
				}
			}
		}
		return drawnVertices;
	}

	// -------------------------------------------------------------------------

	/**
	 * Apply zoomAmount onto a specified point, based on the provided center point.
	 * @java BoardlessPlacement#applyZoomToPoint(Point2D, double, Point2D.Double)
	 */
	static applyZoomToPoint(
		point: { getX(): number; getY(): number },
		zoomAmount: number,
		centerPoint: { x: number; y: number }
	): { x: number; y: number } {
		return {
			x: 0.5 + (point.getX() - centerPoint.x) * zoomAmount,
			y: 0.5 + (point.getY() - centerPoint.y) * zoomAmount,
		};
	}

	// -------------------------------------------------------------------------

	/**
	 * Set the locations for the zoomedCells, zoomedEdges and zoomedVertices.
	 * @java BoardlessPlacement#setZoomedLocations(Context)
	 */
	setZoomedLocations(context: Context): number {
		let numberOccupiedCells = 0;

		let minX = 99999;
		let minY = 99999;
		let maxX = -99999;
		let maxY = -99999;

		if (this.currentState !== null) {
			for (const vertex of this.topology().cells() as Cell[]) {
				if (
					this.currentState.containerStates()[0].isPlayable(vertex.index()) ||
					this.currentState.containerStates()[0].isOccupied(vertex.index())
				) {
					numberOccupiedCells++;
					if (vertex.centroid().x < minX) minX = vertex.centroid().x;
					if (vertex.centroid().x > maxX) maxX = vertex.centroid().x;
					if (vertex.centroid().y < minY) minY = vertex.centroid().y;
					if (vertex.centroid().y > maxY) maxY = vertex.centroid().y;
				}
			}
		}

		// Used to make sure there is some padding on either side of the board.
		minX = minX - this._cellRadius;
		minY = minY - this._cellRadius;
		maxX = maxX + this._cellRadius;
		maxY = maxY + this._cellRadius;

		let newZoom = 1.0;
		let centerPointX = 0.5;
		let centerPointY = 0.5;

		if (numberOccupiedCells > 0) {
			const boardZoomX = 1.0 / (maxX - minX);
			const boardZoomY = 1.0 / (maxY - minY);

			newZoom = Math.min(boardZoomX, boardZoomY);

			centerPointX = (maxX + minX) / 2.0;
			centerPointY = (maxY + minY) / 2.0;
		}

		let largestPieceWalk = 1;
		for (const component of context.components() as (Component | null)[]) {
			if (component !== null && component !== undefined && component.isLargePiece()) {
				const stepsForward: number = component.maxStepsForward();
				if (largestPieceWalk < stepsForward) largestPieceWalk = stepsForward;
			}
		}

		const maxZoom: number = 10.0 / largestPieceWalk;
		if (newZoom > maxZoom) newZoom = maxZoom;

		const graphCells: Cell[] = this.topology().cells();
		const graphEdges: Edge[] = this.topology().edges();
		const graphVertices: Vertex[] = this.topology().vertices();

		if (this.zoomedVertices === null || this.zoomedEdges === null || this.zoomedCells === null) {
			this.zoomedCells = [];
			this.zoomedEdges = [];
			this.zoomedVertices = [];
		} else {
			this.zoomedCells.length = 0;
			this.zoomedEdges.length = 0;
			this.zoomedVertices.length = 0;
		}

		const centerPoint = { x: centerPointX, y: centerPointY };

		for (let i = 0; i < graphCells.length; i++) {
			const cell: Cell = graphCells[i]!;
			const zoomedPoint = BoardlessPlacement.applyZoomToPoint(
				{ getX: () => cell.centroid().x, getY: () => cell.centroid().y },
				newZoom, centerPoint
			);
			// Create zoomed cell as a simple object mirroring the Cell constructor(index, x, y, z)
			const zoomedCell = this.makeCellProxy(i, zoomedPoint.x, zoomedPoint.y, cell);
			this.zoomedCells.push(zoomedCell);
		}

		for (let i = 0; i < graphEdges.length; i++) {
			const edge: Edge = graphEdges[i]!;
			const zoomedPointA = BoardlessPlacement.applyZoomToPoint(
				{ getX: () => edge.vA().centroid().x, getY: () => edge.vA().centroid().y },
				newZoom, centerPoint
			);
			const zoomedPointB = BoardlessPlacement.applyZoomToPoint(
				{ getX: () => edge.vB().centroid().x, getY: () => edge.vB().centroid().y },
				newZoom, centerPoint
			);
			const zoomedEdge = this.makeEdgeProxy(i, edge.vA().index(), zoomedPointA, edge.vB().index(), zoomedPointB);
			this.zoomedEdges.push(zoomedEdge);
		}

		for (let i = 0; i < graphVertices.length; i++) {
			const vertex: Vertex = graphVertices[i]!;
			const zoomedPoint = BoardlessPlacement.applyZoomToPoint(
				{ getX: () => vertex.centroid().x, getY: () => vertex.centroid().y },
				newZoom, centerPoint
			);
			const zoomedVertex = this.makeVertexProxy(i, zoomedPoint.x, zoomedPoint.y);
			this.zoomedVertices.push(zoomedVertex);
		}

		return newZoom;
	}

	// -------------------------------------------------------------------------

	/**
	 * Calculate the zoom amount for the container.
	 * @java BoardlessPlacement#calculateZoom(Context)
	 */
	calculateZoom(context: Context): void {
		this.currentState = context.state();
		if (this.currentStateHash !== this.currentState!.stateHash()) {
			this.currentStateHash = this.currentState!.stateHash();
			this.zoom = this.setZoomedLocations(context);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Update the zoomed image of the game board.
	 * @java BoardlessPlacement#updateZoomImage(Context)
	 */
	updateZoomImage(context: Context): void {
		this.calculateZoom(context);
		this.setCellRadiusPixels(Math.trunc(this._cellRadius * this.placement.width * this.containerZoom()));
	}

	// -------------------------------------------------------------------------

	/**
	 * @java BoardlessPlacement#containerZoom()
	 */
	override containerZoom(): number {
		return this.zoom;
	}

	// -------------------------------------------------------------------------

	// Proxy factory helpers — match the Cell/Edge/Vertex constructor signatures from Java.

	private makeCellProxy(index: number, x: number, y: number, orig: Cell): Cell {
		return {
			index: () => index,
			centroid: () => ({ x, y }),
			vertices: () => [],
			setVertices: function(vs: Vertex[]) { (this as unknown as { _verts: Vertex[] })._verts = vs; },
			orthogonal: () => orig.orthogonal(),
			diagonal: () => orig.diagonal(),
			off: () => orig.off(),
			setOrthogonal: () => { /* no-op */ },
			setDiagonal: () => { /* no-op */ },
			setOff: () => { /* no-op */ },
		} as unknown as Cell;
	}

	private makeEdgeProxy(
		index: number,
		vAIndex: number, vAPoint: { x: number; y: number },
		vBIndex: number, vBPoint: { x: number; y: number }
	): Edge {
		return {
			index: () => index,
			vA: () => ({ index: () => vAIndex, centroid: () => vAPoint }),
			vB: () => ({ index: () => vBIndex, centroid: () => vBPoint }),
		} as unknown as Edge;
	}

	private makeVertexProxy(index: number, x: number, y: number): Vertex {
		return {
			index: () => index,
			centroid: () => ({ x, y }),
		} as unknown as Vertex;
	}

	// -------------------------------------------------------------------------
}
