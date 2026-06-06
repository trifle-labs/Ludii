// @java ViewController/src/view/container/aspects/placement/ContainerPlacement.java

/**
 * Placement aspect for a container style: manages cell-radius and screen-position
 * mapping for the associated container.
 *
 * Faithful 1:1 port of view.container.aspects.placement.ContainerPlacement.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.placement.ContainerPlacement
 */

import { Point, Rectangle } from '../../../../../../awt/index.js';
import type { Point2D } from '../../../../../../awt/index.js';
import { Bridge } from '../../../../bridge/Bridge.js';
import { GraphUtil } from '../../../../util/GraphUtil.js';

// ---------------------------------------------------------------------------
// Escape-hatched dependency types
// ---------------------------------------------------------------------------

/** @java view.container.BaseContainerStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseContainerStyle = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java game.equipment.container.Container */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Container = any;

/** @java other.topology.Topology */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Topology = any;

/** @java other.topology.Cell */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cell = any;

/** @java other.topology.Edge */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Edge = any;

/** @java other.topology.Vertex */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = any;

/** @java game.types.board.SiteType */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteType = any;

// ---------------------------------------------------------------------------

/**
 * Placement aspect for a container style.
 *
 * @java view.container.aspects.placement.ContainerPlacement
 */
export class ContainerPlacement {

	protected containerStyle: BaseContainerStyle;

	// -------------------------------------------------------------------------

	/** The scale of the container, relative to the size of the view it is placed on. */
	protected containerScale: number = 1.0;

	/** Average distance from cell centroid to edge midpoints, in range 0..1. */
	protected _cellRadius: number = 0;

	/** Cell size in pixels. */
	private _cellRadiusPixels: number = 0;

	/** Location and dimensions of this container (in pixels). */
	protected placement!: Rectangle;

	/** Size of the placement before board scaling (i.e. the size of the view placement). */
	private _unscaledPlacement!: Rectangle;

	protected bridge: Bridge;

	// -------------------------------------------------------------------------

	/**
	 * @java ContainerPlacement#ContainerPlacement(Bridge, BaseContainerStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BaseContainerStyle) {
		this.containerStyle = containerStyle;
		this.bridge = bridge;
		this.calculateCellRadius();
	}

	// -------------------------------------------------------------------------

	/**
	 * @java ContainerPlacement#setPlacement(Context, Rectangle)
	 */
	setPlacement(_context: Context, placement: Rectangle): void {
		this.setUnscaledPlacement(placement);
	}

	// -------------------------------------------------------------------------

	/**
	 * Calculates average distance from cell centroid to edge midpoints, in range 0..1.
	 * @java ContainerPlacement#calculateCellRadius()
	 */
	calculateCellRadius(): void {
		let min = 1.0;

		if (this.container().defaultSite() === 'Cell') {
			const cells: Cell[] = this.topology().cells();
			if (cells.length > 0) {
				for (const cell of cells) {
					const acc: number = GraphUtil.calculateCellRadius(cell);
					if (acc < min) min = acc;
				}
			}
		} else {
			const vertices: Vertex[] = this.topology().vertices();
			if (vertices.length > 0) {
				for (const vertex of vertices) {
					for (const v of vertex.neighbours() as Vertex[]) {
						const dist: number = this.distance(v.centroid(), vertex.centroid()) * 0.5;
						if (dist > 0 && dist < min) min = dist;
					}
				}
			}
		}

		if (min > 0.0 && min < 1.0) {
			this.setCellRadius(min);
		} else {
			// In this case the graph does not have any edges (e.g. Hounds and Jackals)
			min = 1.0;
			const verts: Vertex[] = this.topology().vertices();
			for (let i = 0; i < verts.length; i++) {
				const vi = verts[i]!.centroid();
				for (let j = i + 1; j < verts.length; j++) {
					const vj = verts[j]!.centroid();
					const dx: number = vi.x - vj.x;
					const dy: number = vi.y - vj.y;
					const dist: number = Math.sqrt(dx * dx + dy * dy);
					if (min > dist) min = dist;
				}
			}
			this.setCellRadius(min / 2);
		}
	}

	// -------------------------------------------------------------------------

	/**
	 * Convert a normalised position into the corresponding position (pixel) in the app view.
	 * @java ContainerPlacement#screenPosn(Point2D)
	 */
	screenPosn(posn: Point2D | { getX(): number; getY(): number }): Point {
		try {
			const x: number = 'getX' in posn ? posn.getX() : (posn as unknown as { x: number }).x;
			const y: number = 'getY' in posn ? posn.getY() : (posn as unknown as { y: number }).y;
			const screenPosn = new Point();
			screenPosn.x = Math.trunc(this.placement.x + x * this.placement.width);
			screenPosn.y = Math.trunc((this.placement.getY() * 2 + this.placement.height) - (this.placement.y + y * this.placement.height));
			return screenPosn;
		} catch (e) {
			const px: number = 'getX' in posn ? posn.getX() : (posn as unknown as { x: number }).x;
			const py: number = 'getY' in posn ? posn.getY() : (posn as unknown as { y: number }).y;
			return new Point(Math.trunc(px), Math.trunc(py));
		}
	}

	// -------------------------------------------------------------------------

	/** @java ContainerPlacement#cellRadius() */
	cellRadius(): number {
		return this._cellRadius;
	}

	/** @java ContainerPlacement#cellRadiusPixels() */
	cellRadiusPixels(): number {
		return this._cellRadiusPixels;
	}

	/** @java ContainerPlacement#placement() */
	placement_(): Rectangle {
		return this.placement;
	}

	/** @java ContainerPlacement#setCellRadius(double) */
	setCellRadius(cellRadius: number): void {
		this._cellRadius = cellRadius;
	}

	/** @java ContainerPlacement#unscaledPlacement() */
	unscaledPlacement(): Rectangle {
		return this._unscaledPlacement;
	}

	/** @java ContainerPlacement#setUnscaledPlacement(Rectangle) */
	setUnscaledPlacement(unscaledPlacement: Rectangle): void {
		this._unscaledPlacement = unscaledPlacement;
	}

	/** @java ContainerPlacement#containerScale() */
	containerScale_(): number {
		return this.containerScale;
	}

	/** @java ContainerPlacement#topology() */
	topology(): Topology {
		return this.containerStyle.topology();
	}

	/** @java ContainerPlacement#container() */
	container(): Container {
		return this.containerStyle.container();
	}

	/** @java ContainerPlacement#setCellRadiusPixels(int) */
	setCellRadiusPixels(cellRadiusPixels: number): void {
		this._cellRadiusPixels = cellRadiusPixels;
	}

	/** @java ContainerPlacement#containerZoom() */
	containerZoom(): number {
		return 1.0;
	}

	/** @java ContainerPlacement#drawnCells() */
	drawnCells(): Cell[] {
		return this.topology().cells();
	}

	/** @java ContainerPlacement#drawnEdges() */
	drawnEdges(): Edge[] {
		return this.topology().edges();
	}

	/** @java ContainerPlacement#drawnVertices() */
	drawnVertices(): Vertex[] {
		return this.topology().vertices();
	}

	// -------------------------------------------------------------------------

	/**
	 * Euclidean distance between two centroids.
	 * Mirrors main.math.MathRoutines.distance(Point2D, Point2D).
	 * @java main.math.MathRoutines#distance(Point2D, Point2D)
	 */
	private distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
		const dx = a.x - b.x;
		const dy = a.y - b.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	// -------------------------------------------------------------------------
}
