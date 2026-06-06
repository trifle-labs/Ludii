// @java ViewController/src/util/StackVisuals.java

/**
 * Functions relating to the visuals of pieces in a stack.
 *
 * Faithful 1:1 port of util.StackVisuals.
 *
 * @author Matthew.Stephenson (Java original)
 */

import { Point2D } from "../../../awt/geom/Point2D.js";
import type { Container } from "../../../../ludemes/game/equipment/container/Container.js";
import type { PieceStackType } from "../../../../ludemes/metadata/graphics/util/PieceStackType.js";
import type { StackPropertyType } from "../../../../ludemes/metadata/graphics/util/StackPropertyType.js";
import type { Context } from "../../../../context.js";
import type { Location } from "../../../../ludemes/other/location/Location.js";

// ---------------------------------------------------------------------------
// Local escape-hatch types for not-yet-ported dependencies
// ---------------------------------------------------------------------------

/**
 * Escape-hatch interface for Bridge.
 * @java ViewController/src/bridge/Bridge.java
 */
type BridgeLike = {
  getContainerStyle(index: number): {
    placement(): { getWidth(): number };
  };
};

/**
 * Escape-hatch interface for the subset of Move used here.
 * @java Core/src/other/move/Move.java
 */
type MoveLike = {
  /** @java Move#getFromLocation() — via from() + fromType() */
  getFromLocation(): { site(): number; siteType(): string };
  /** @java Move#levelMinNonDecision() */
  levelMinNonDecision(): number;
  /** @java Move#levelMaxNonDecision() */
  levelMaxNonDecision(): number;
};

/**
 * Escape-hatch interface for the subset of Moves (the move-list container).
 * @java game.rules.play.moves.Moves
 */
type MovesLike = {
  moves(): MoveLike[];
};

/**
 * Escape-hatch for the game metadata graphics interface.
 * @java metadata.graphics.Graphics#stackMetadata(...)
 */
type GameWithMetadata = {
  metadata(): {
    graphics(): {
      stackMetadata(
        context: Context,
        container: Container,
        site: number,
        siteType: string,
        state: number,
        value: number,
        stackPropertyType: StackPropertyType,
      ): number;
    };
  };
};

// ---------------------------------------------------------------------------
// ContainerUtil.getContainerSite (escape-hatch inline helper)
// Not yet ported; mirrored faithfully from ContainerUtil.java.
// @java ViewController/src/util/ContainerUtil.java#getContainerSite
// ---------------------------------------------------------------------------

/** @java util.ContainerUtil#getContainerSite(Context, int, SiteType) */
function getContainerSite(context: Context, site: number, siteType: string): number {
  const UNDEFINED = -1;
  if (site === UNDEFINED) return UNDEFINED;
  if (siteType === "Cell") {
    const ctx = context as unknown as {
      sitesFrom(): number[];
      containerId(): number[];
    };
    const containerId = ctx.containerId()[site]!;
    return site - ctx.sitesFrom()[containerId]!;
  }
  return site;
}

// ---------------------------------------------------------------------------
// GraphUtil.calculateCellRadius (escape-hatch inline helper)
// Not yet ported; mirrored faithfully from GraphUtil.java.
// @java ViewController/src/util/GraphUtil.java#calculateCellRadius
// ---------------------------------------------------------------------------

/** @java util.GraphUtil#calculateCellRadius(Cell) */
function calculateCellRadius(cell: {
  edges(): Array<{ centroid(): { getX(): number; getY(): number } }>;
  centroid(): { getX(): number; getY(): number };
}): number {
  let acc = 0;
  if (cell.edges().length > 0) {
    for (const edge of cell.edges()) {
      const midpoint = edge.centroid();
      const dx = midpoint.getX() - cell.centroid().getX();
      const dy = midpoint.getY() - cell.centroid().getY();
      const dist = Math.sqrt(dx * dx + dy * dy);
      acc += dist;
    }
    acc /= cell.edges().length;
  }
  return acc;
}

// ---------------------------------------------------------------------------

/**
 * @java util.StackVisuals
 */
export class StackVisuals {
  // -------------------------------------------------------------------------

  /**
   * Get the offset distance to draw the piece as determined by its stack type.
   *
   * @java StackVisuals#calculateStackOffset(Bridge, Context, Container, PieceStackType, int, int, int, SiteType, int, int, int)
   */
  public static calculateStackOffset(
    bridge: BridgeLike,
    context: Context,
    container: Container,
    componentStackType: PieceStackType,
    cellRadiusPixelsOriginal: number,
    level: number,
    site: number,
    siteType: string,
    stackSize: number,
    state: number,
    value: number,
  ): Point2D.Double {
    let stackOffsetX = 0.0;
    let stackOffsetY = 0.0;

    const gameWithMeta = (context.game as unknown) as GameWithMetadata;
    const cellRadiusPixels = Math.trunc(
      cellRadiusPixelsOriginal *
        gameWithMeta
          .metadata()
          .graphics()
          .stackMetadata(context, container, site, siteType, state, value, "Scale"),
    );
    const stackLimit = Math.trunc(
      gameWithMeta
        .metadata()
        .graphics()
        .stackMetadata(context, container, site, siteType, state, value, "Limit"),
    );

    const stackOffsetAmount = Math.trunc(0.4 * cellRadiusPixels);
    const fullPieceStackScale = 4.8;

    if (componentStackType === "GroundDynamic") {
      if (stackSize === 2) {
        // Stack the pieces side by side.
        if (level === 0) {
          stackOffsetX = cellRadiusPixels / 2;
        }
        if (level === 1) {
          stackOffsetX = -cellRadiusPixels / 2;
        }
      }
      if (stackSize > 2) {
        if (level === 0) {
          stackOffsetX = cellRadiusPixels / 2;
          stackOffsetY = cellRadiusPixels / 2;
        }
        if (level === 1) {
          stackOffsetX = -cellRadiusPixels / 2;
          stackOffsetY = cellRadiusPixels / 2;
        }
        if (level === 2) {
          stackOffsetX = cellRadiusPixels / 2;
          stackOffsetY = -cellRadiusPixels / 2;
        }
        if (level === 3) {
          stackOffsetX = -cellRadiusPixels / 2;
          stackOffsetY = -cellRadiusPixels / 2;
        }
      }
    } else if (componentStackType === "Ground") {
      // Stack the pieces in a square arrangement around the middle of the site.
      if (level === 0) {
        stackOffsetX = cellRadiusPixels / 2;
        stackOffsetY = cellRadiusPixels / 2;
      }
      if (level === 1) {
        stackOffsetX = -cellRadiusPixels / 2;
        stackOffsetY = cellRadiusPixels / 2;
      }
      if (level === 2) {
        stackOffsetX = cellRadiusPixels / 2;
        stackOffsetY = -cellRadiusPixels / 2;
      }
      if (level === 3) {
        stackOffsetX = -cellRadiusPixels / 2;
        stackOffsetY = -cellRadiusPixels / 2;
      }
    } else if (
      componentStackType === "None" ||
      componentStackType === "Count" ||
      componentStackType === "CountColoured"
    ) {
      // do nothing
    } else if (componentStackType === "Fan") {
      // Stack the piece horizontally
      stackOffsetX = level * stackOffsetAmount;
    } else if (componentStackType === "TowardsCenter") {
      // Stack the piece towards the center of the board
      const topology = (container as unknown as { topology(): {
        getGraphElement(siteType: string, index: number): {
          centroid(): { getX(): number; getY(): number };
        } | null;
        centrePoint(): { getX(): number; getY(): number };
      } }).topology();

      const containerSite = getContainerSite(context, site, siteType);
      const currentElem = topology.getGraphElement(siteType, containerSite);
      const currentPoint = currentElem ? currentElem.centroid() : { getX: () => 0, getY: () => 0 };
      const centre = topology.centrePoint();
      const xDistanceToCenter = centre.getX() - currentPoint.getX();
      const yDistanceToCenter = centre.getY() - currentPoint.getY();
      const currentPointAngle = Math.atan(
        Math.abs(xDistanceToCenter) / Math.abs(yDistanceToCenter),
      );
      stackOffsetX = Math.sin(currentPointAngle) * stackOffsetAmount * fullPieceStackScale * level;
      stackOffsetY = Math.cos(currentPointAngle) * stackOffsetAmount * fullPieceStackScale * level;
      if (xDistanceToCenter < 0) stackOffsetX *= -1;
      if (yDistanceToCenter > 0) stackOffsetY *= -1;
    } else if (componentStackType === "FanAlternating") {
      // Stack the piece horizontally
      if (level % 2 === 0) {
        stackOffsetX = level * (stackOffsetAmount / 2) + stackOffsetAmount / 2;
      } else {
        stackOffsetX = (level + 1) * -(stackOffsetAmount / 2) + stackOffsetAmount / 2;
      }
    } else if (componentStackType === "Ring") {
      let cellRadiusStack = cellRadiusPixels;

      // If on a cell, recompute cell radius specifically for this cell.
      if (siteType === "Cell") {
        const topology = (container as unknown as { topology(): {
          cells(): Array<{
            edges(): Array<{ centroid(): { getX(): number; getY(): number } }>;
            centroid(): { getX(): number; getY(): number };
          }>;
        } }).topology();

        const cell = topology.cells()[site];
        if (cell !== undefined) {
          cellRadiusStack = Math.trunc(
            calculateCellRadius(cell) *
              bridge.getContainerStyle(container.index()).placement().getWidth(),
          );
        }
      }

      let stackSizeNew = stackSize;
      if (stackSizeNew === 0) stackSizeNew = 1;

      stackOffsetX = 0.7 * cellRadiusStack * Math.cos((Math.PI * 2 * level) / stackSizeNew);
      stackOffsetY = 0.7 * cellRadiusStack * Math.sin((Math.PI * 2 * level) / stackSizeNew);
    } else if (componentStackType === "Backgammon") {
      // Stack the pieces in columns of 5, repeated on top of each other.
      const lineNumber = level % stackLimit;
      const repeatNumber = Math.trunc(level / stackLimit);
      if (site < container.getNumSites() / 2) {
        stackOffsetY =
          -lineNumber * stackOffsetAmount * fullPieceStackScale -
          repeatNumber * stackOffsetAmount;
      } else {
        stackOffsetY =
          lineNumber * stackOffsetAmount * fullPieceStackScale -
          repeatNumber * stackOffsetAmount;
      }
    } else if (container.isHand()) {
      // Stack the pieces in a deck like fashion
      stackOffsetX = (level * stackOffsetAmount) / 30;
      stackOffsetY = (level * stackOffsetAmount) / 30;
    } else {
      // Stack the piece normally
      stackOffsetY = -level * stackOffsetAmount;
    }

    return new Point2D.Double(stackOffsetX, stackOffsetY);
  }

  // -------------------------------------------------------------------------

  /**
   * Returns the min and max level for a selected location, to be used when
   * drawing stacked pieces.
   *
   * @java StackVisuals#getLevelMinAndMax(Moves, Location)
   */
  public static getLevelMinAndMax(legal: MovesLike, selectedLocation: Location): [number, number] {
    const allMovesFromThisSite: MoveLike[] = [];
    for (const m of legal.moves()) {
      const fromLoc = m.getFromLocation();
      if (
        fromLoc.site() === selectedLocation.site() &&
        fromLoc.siteType() === selectedLocation.siteType() &&
        m.levelMinNonDecision() === selectedLocation.level() &&
        m.levelMaxNonDecision() >= selectedLocation.level()
      ) {
        allMovesFromThisSite.push(m);
      }
    }

    let levelMax = selectedLocation.level();
    if (allMovesFromThisSite.length > 0) {
      levelMax = allMovesFromThisSite[0]!.levelMaxNonDecision();
      for (const m of allMovesFromThisSite) {
        if (m.levelMaxNonDecision() !== levelMax) {
          levelMax = selectedLocation.level();
          break;
        }
      }
    }

    return [selectedLocation.level(), levelMax];
  }

  // -------------------------------------------------------------------------
}
