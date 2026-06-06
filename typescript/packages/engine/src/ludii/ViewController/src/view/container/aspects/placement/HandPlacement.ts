// @java ViewController/src/view/container/aspects/placement/HandPlacement.java

/**
 * Placement aspect for hand containers. Positions the cells of the hand
 * container along its length (horizontal or vertical).
 *
 * Faithful 1:1 port of view.container.aspects.placement.HandPlacement.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.container.aspects.placement.HandPlacement
 */

import { Rectangle } from '../../../../../../awt/index.js';
import { Bridge } from '../../../../bridge/Bridge.js';
import { ContainerPlacement } from './ContainerPlacement.js';

// ---------------------------------------------------------------------------
// Escape-hatched dependency types
// ---------------------------------------------------------------------------

/** @java view.container.BaseContainerStyle */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseContainerStyle = any;

/** @java other.context.Context */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Context = any;

/** @java other.topology.Cell */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Cell = any;

/** @java other.topology.Vertex */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Vertex = any;

// ---------------------------------------------------------------------------

/**
 * Placement for hand containers.
 *
 * @java view.container.aspects.placement.HandPlacement
 */
export class HandPlacement extends ContainerPlacement {

	// -------------------------------------------------------------------------

	/**
	 * @java HandPlacement#HandPlacement(Bridge, BaseContainerStyle)
	 */
	constructor(bridge: Bridge, containerStyle: BaseContainerStyle) {
		super(bridge, containerStyle);
	}

	// -------------------------------------------------------------------------

	/**
	 * @java HandPlacement#setPlacement(Context, Rectangle)
	 */
	override setPlacement(context: Context, placement: Rectangle): void {
		let newPlacement: Rectangle = placement;

		// Metadata can override the placement of the hands.
		const customPlacement: { getX(): number; getY(): number; getWidth(): number; getHeight(): number } | null =
			context.game().metadata().graphics().handPlacement(context, this.container().owner());
		const handVertical: boolean =
			context.game().metadata().graphics().handVertical(context, this.container().owner());

		if (customPlacement !== null && customPlacement !== undefined) {
			const boardViewWidth: number = Math.trunc(this.bridge.getContainerStyle(0)!.unscaledPlacement().getWidth());
			const boardViewHeight: number = Math.trunc(this.bridge.getContainerStyle(0)!.unscaledPlacement().getHeight());

			const x: number = customPlacement.getX();
			const y: number = customPlacement.getY() * (handVertical ? 1 : -1);
			let width: number = customPlacement.getWidth();
			let height: number = 1.0;

			if (handVertical) {
				width = 1.0;
				height = customPlacement.getHeight();
			}

			newPlacement = new Rectangle(
				Math.trunc(boardViewWidth * x),
				Math.trunc(boardViewHeight * y),
				Math.trunc(boardViewWidth * width),
				Math.trunc(boardViewHeight * height)
			);
		}

		this.placement = newPlacement;

		// Longest and shortest sides are based on the orientation of the hand.
		let longestSide: number = Math.trunc(newPlacement.getWidth());
		let shortestSide: number = Math.trunc(newPlacement.getHeight());
		if (handVertical) {
			longestSide = Math.trunc(newPlacement.getHeight());
			shortestSide = Math.trunc(newPlacement.getWidth());
		}

		// Determine the cell radius of the hand.
		this.setCellRadiusPixels(Math.trunc((0.6 * shortestSide) / 2));
		this.setCellRadius(this.cellRadiusPixels() / longestSide);
		if (this.cellRadiusPixels() > longestSide / this.container().numSites() / 2) {
			this.setCellRadiusPixels(Math.trunc(longestSide / this.container().numSites() / 2));
			this.setCellRadius(1.0 / this.container().numSites() / 2);
		}

		this.setHandLocations(context, customPlacement !== null && customPlacement !== undefined, handVertical);
	}

	// -------------------------------------------------------------------------

	/**
	 * Sets the sites for the hand container associated with this placement aspect.
	 * @java HandPlacement#setHandLocations(Context, boolean, boolean)
	 */
	protected setHandLocations(
		context: Context,
		customPlacement: boolean,
		verticalPlacement: boolean
	): void {
		let persistentSiteCount = 0;
		const sites: Cell[] = this.container().topology().cells() as Cell[];

		let xBuffer = 0;
		const yBuffer = 0;

		// if this is a shared hand, center the components in the container width
		if (this.container().owner() > context.game().players().count() && !customPlacement) {
			const totalContainerCellWidth: number = this.cellRadiusPixels() * 2.0 * sites.length;
			const difference: number = this.placement.getWidth() - totalContainerCellWidth;
			xBuffer = (difference / 2.0) / this.placement.getWidth();
		}

		// Check each site
		for (let site = 0; site < sites.length; site++) {
			let xPosn: number = this.cellRadius() * 2 * (persistentSiteCount + 0.5) + xBuffer;
			let yPosn: number = 0;

			// If the hand is vertically oriented.
			if (verticalPlacement) {
				xPosn = 0;
				yPosn = this.cellRadius() * 2 * (persistentSiteCount + 0.5) + yBuffer;
			}

			this.topology().cells()[site].setCentroid(xPosn, yPosn, 0);

			// Normalise all cell vertex positions.
			let minX = 99999;
			let minY = 99999;
			let maxX = -99999;
			let maxY = -99999;
			for (const vertex of this.topology().cells()[site].vertices() as Vertex[]) {
				if (vertex.centroid().x < minX) minX = vertex.centroid().x;
				if (vertex.centroid().x > maxX) maxX = vertex.centroid().x;
				if (vertex.centroid().y < minY) minY = vertex.centroid().y;
				if (vertex.centroid().y > maxY) maxY = vertex.centroid().y;
			}
			for (const vertex of this.topology().cells()[site].vertices() as Vertex[]) {
				const normalisedVx: number = (vertex.centroid().x - minX) / (maxX - minX);
				const normalisedVy: number = (vertex.centroid().y - minY) / (maxY - minY);
				vertex.setCentroid(normalisedVx, normalisedVy, 0);
			}

			const widthToHeightRatio: number = this.cellRadius() * (this.placement.getWidth() / this.placement.getHeight());

			for (const vertex of this.topology().cells()[site].vertices() as Vertex[]) {
				const vx: number = vertex.centroid().x;
				const vy: number = vertex.centroid().y;
				vertex.setCentroid(
					xPosn - this.cellRadius() + vx * this.cellRadius() * 2,
					yPosn + widthToHeightRatio - vy * widthToHeightRatio * 2,
					0
				);
			}

			persistentSiteCount++;
		}
	}

	// -------------------------------------------------------------------------
}
