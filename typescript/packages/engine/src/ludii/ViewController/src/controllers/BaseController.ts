// @java ViewController/src/controllers/BaseController.java

import { Point, Point2D } from '../../../awt/index.js';
import type { Bridge } from '../bridge/Bridge.js';
import type { Container } from '../../../../ludemes/game/equipment/container/Container.js';
import type { Location } from '../../../../ludemes/other/location/Location.js';
import { FullLocation } from '../../../../ludemes/other/location/FullLocation.js';
import type { Controller } from './Controller.js';
import { WorldLocation } from '../util/WorldLocation.js';
import { StackVisuals } from '../util/StackVisuals.js';
import { pieceStackTypeFromValue } from '../../../../ludemes/metadata/graphics/util/PieceStackType.js';
import type { PieceStackType } from '../../../../ludemes/metadata/graphics/util/PieceStackType.js';
import type { SiteType } from '../../../../ludemes/other/action/SiteType.js';
import type { Topology } from '../../../../ludemes/other/topology/Topology.js';

// ---------------------------------------------------------------------------
// Escape-hatch types for dependencies that aren't yet fully ported or need
// a narrower surface for this class.
// ---------------------------------------------------------------------------

/**
 * Narrow slice of other.context.Context used by BaseController.
 * @java other.context.Context
 */
interface IContext {
  state(): {
    containerStates(): IContainerState[];
  };
  board(): {
    topology(): Topology;
  };
  metadata(): {
    graphics(): {
      stackMetadata(
        context: IContext,
        container: Container,
        site: number,
        siteType: SiteType,
        state: number,
        value: number,
        propType: unknown,
      ): number;
    };
  };
}

/**
 * Narrow slice of other.state.container.ContainerState used by BaseController.
 * @java other.state.container.ContainerState
 */
interface IContainerState {
  sizeStack(site: number, siteType: SiteType): number;
  state(site: number, level: number, siteType: SiteType): number;
  value(site: number, level: number, siteType: SiteType): number;
}

/**
 * Narrow slice of view.container.ContainerStyle used by BaseController.
 * @java view.container.ContainerStyle
 */
interface IContainerStyle {
  drawnGraphElement(index: number, siteType: SiteType): { centroid(): Point2D } | null;
  cellRadiusPixels(): number;
  placement(): { getWidth(): number; getHeight(): number } | null;
  ignorePieceSelectionLimit(): boolean;
  drawnVertices(): Array<{ centroid(): Point2D; index(): number }>;
  screenPosn(posn: Point2D): Point;
}

// ---------------------------------------------------------------------------
// Minimal MathRoutines helpers (inlined from main.math.MathRoutines)
// @java main.math.MathRoutines
// ---------------------------------------------------------------------------

/** @java main.math.MathRoutines.EPSILON */
const MATH_EPSILON = 0.0000001;

/**
 * Euclidean distance between two Point2D values.
 * @java main.math.MathRoutines#distance(Point2D, Point2D)
 */
function distance2D(a: Point2D, b: Point2D): number {
  const dx = a.getX() - b.getX();
  const dy = a.getY() - b.getY();
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Distance from point pt to line segment [a, b] (squared).
 * From Bowyer & Woodwark "A Programmer's Geometry" p47.
 * @java main.math.MathRoutines#distanceToLineSegmentSquared(Point2D, Point2D, Point2D)
 */
function distanceToLineSegmentSquared(pt: Point2D, a: Point2D, b: Point2D): number {
  const xkj = a.getX() - pt.getX();
  const ykj = a.getY() - pt.getY();
  const xlk = b.getX() - a.getX();
  const ylk = b.getY() - a.getY();

  const denom = xlk * xlk + ylk * ylk;

  if (Math.abs(denom) < MATH_EPSILON) {
    // Coincident ends
    return xkj * xkj + ykj * ykj;
  }

  const t = -(xkj * xlk + ykj * ylk) / denom;

  if (t <= 0.0) {
    // Beyond A
    return xkj * xkj + ykj * ykj;
  } else if (t >= 1.0) {
    // Beyond B
    const xlj = b.getX() - pt.getX();
    const ylj = b.getY() - pt.getY();
    return xlj * xlj + ylj * ylj;
  } else {
    const xfac = xkj + t * xlk;
    const yfac = ykj + t * ylk;
    return xfac * xfac + yfac * yfac;
  }
}

/**
 * Distance from point pt to line segment [a, b].
 * @java main.math.MathRoutines#distanceToLineSegment(Point2D, Point2D, Point2D)
 */
function distanceToLineSegment(pt: Point2D, a: Point2D, b: Point2D): number {
  if (Math.abs(a.getX() - b.getX()) + Math.abs(a.getY() - b.getY()) < MATH_EPSILON) {
    return distance2D(pt, a); // endpoints a and b are coincident
  }
  return Math.sqrt(distanceToLineSegmentSquared(pt, a, b));
}

// ---------------------------------------------------------------------------
// Constants
// @java main.Constants
// ---------------------------------------------------------------------------

/** @java main.Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

// ---------------------------------------------------------------------------

/**
 * Abstract base class for container controllers.
 *
 * Faithful 1:1 port of controllers.BaseController.
 *
 * @author matthew.stephenson and mrraow and cambolbro (Java original)
 * @java controllers.BaseController
 */
export abstract class BaseController implements Controller {

  /** @java BaseController#container */
  protected readonly container: Container;

  /** @java BaseController#bridge */
  protected bridge: Bridge;

  // -------------------------------------------------------------------------

  /**
   * @java BaseController(bridge.Bridge, game.equipment.container.Container)
   */
  constructor(bridge: Bridge, container: Container) {
    this.container = container;
    this.bridge = bridge;
  }

  // -------------------------------------------------------------------------

  /**
   * @return The nearest Location for a given point, based on all possible locations.
   * @java BaseController#calculateNearestLocation(Context, Point, List)
   */
  calculateNearestLocation(
    context: Location extends never ? never : unknown,
    pt: Point,
    legalLocations: Location[],
  ): Location {
    const ctx = context as IContext;

    // Calculate information for all moves that could be made
    const allLocations: WorldLocation[] = [];

    const containerStyle = this.bridge.getContainerStyle(this.container.index()) as unknown as IContainerStyle | null;
    const cs = ctx.state().containerStates()[this.container.index()] as IContainerState | undefined;

    if (containerStyle !== null && cs !== undefined) {
      for (const location of legalLocations) {
        try {
          const st = location.siteType() as SiteType;
          const stackSize = cs.sizeStack(location.site(), st);
          const graphElement = (this.bridge.getContainerStyle(this.container.index()) as unknown as IContainerStyle)
            .drawnGraphElement(location.site(), st);
          // PieceStackType.getTypeFromValue((int) context.metadata().graphics().stackMetadata(..., StackPropertyType.Type))
          const stackTypeOrdinal = Math.trunc(
            ctx.metadata().graphics().stackMetadata(
              ctx,
              this.container,
              location.site(),
              st,
              cs.state(location.site(), location.level(), st),
              cs.value(location.site(), location.level(), st),
              'Type',
            ),
          );
          const componentStackType: PieceStackType =
            pieceStackTypeFromValue(stackTypeOrdinal) ?? 'Default';

          const offsetDistance = StackVisuals.calculateStackOffset(
            this.bridge as unknown as Parameters<typeof StackVisuals.calculateStackOffset>[0],
            context as unknown as Parameters<typeof StackVisuals.calculateStackOffset>[1],
            this.container,
            componentStackType,
            containerStyle.cellRadiusPixels(),
            location.level(),
            location.site(),
            location.siteType(),
            stackSize,
            cs.state(location.site(), location.level(), st),
            cs.value(location.site(), location.level(), st),
          );

          if (graphElement !== null) {
            const placement = containerStyle.placement();
            const pw = placement !== null ? placement.getWidth() : 1;
            const ph = placement !== null ? placement.getHeight() : 1;
            const clickablePosition = new Point2D.Double(
              graphElement.centroid().getX() + offsetDistance.getX() / pw,
              graphElement.centroid().getY() - offsetDistance.getY() / ph,
            );

            if (legalLocations === null || legalLocations.some(
              (l) =>
                l.site() === location.site() &&
                l.level() === location.level() &&
                l.siteType() === location.siteType(),
            )) {
              allLocations.push(
                new WorldLocation(
                  new FullLocation(location.site(), location.level(), st),
                  clickablePosition,
                ),
              );
            }
          }
        } catch (_E) {
          // Probably just an invalid location for this container.
        }
      }
    }

    return this.translateClicktoSite(pt, context as unknown as IContext, allLocations);
  }

  // -------------------------------------------------------------------------

  /**
   * Return the maximum distance that a click can be from a graph element.
   * @java BaseController#calculateFurthestDistance(Context)
   */
  private calculateFurthestDistance(context: IContext): number {
    let furthestPossibleDistance = 0;
    const containerStyle = this.bridge.getContainerStyle(this.container.index()) as unknown as IContainerStyle | null;

    if (containerStyle !== null) {
      if (containerStyle.ignorePieceSelectionLimit()) {
        const placement = containerStyle.placement();
        if (placement !== null) {
          furthestPossibleDistance = Math.max(
            placement.getWidth(),
            placement.getHeight(),
          );
        }
      } else {
        // bridge.settingsVC() carries furthestDistanceMultiplier
        const furthestDistanceMultiplier = (this.bridge.settingsVC() as unknown as { furthestDistanceMultiplier(): number }).furthestDistanceMultiplier();
        const cs2 = this.bridge.getContainerStyle(this.container.index()) as unknown as IContainerStyle | null;
        if (cs2 !== null) {
          const cellDistance = cs2.cellRadiusPixels() * furthestDistanceMultiplier;
          furthestPossibleDistance = Math.max(furthestPossibleDistance, cellDistance);
        }
      }
    }

    // suppress unused parameter warning — context is present to match Java signature
    void context;
    return furthestPossibleDistance;
  }

  // -------------------------------------------------------------------------

  /**
   * Returns the Location for the site closest to pt, which was also in the legal Moves.
   * @java BaseController#translateClicktoSite(Point, Context, ArrayList)
   */
  protected translateClicktoSite(
    pt: Point,
    context: IContext,
    validLocations: WorldLocation[],
  ): Location {
    // First check if the user clicked directly on an image
    const graphicsRenderer = this.bridge.graphicsRenderer();
    let location: Location | null = graphicsRenderer !== null
      ? graphicsRenderer.locationOfClickedImage(pt)
      : null;

    if (location !== null) {
      for (const w of validLocations) {
        if (w.location().equals(location)) {
          return location;
        }
      }
    }

    location = new FullLocation(UNDEFINED);
    const containerStyle = this.bridge.getContainerStyle(this.container.index()) as unknown as IContainerStyle | null;
    const furthestPossibleDistance = this.calculateFurthestDistance(context);

    // if image not selected, then determine the closest site
    let minDist = 1000.0;
    for (let i = 0; i < validLocations.length; i++) {
      let dist = 99999;
      const validLoc = validLocations[i]!;
      const site = validLoc.location().site();

      if (validLoc.location().siteType() === 'Edge') {
        const topology = context.board().topology();
        if (site < topology.edges().length) {
          const va = topology.edges()[site]!.vA();
          const vb = topology.edges()[site]!.vB();

          if (containerStyle !== null) {
            const vaPoint = containerStyle.screenPosn(
              containerStyle.drawnVertices()[va.index()]!.centroid(),
            );
            const vbPoint = containerStyle.screenPosn(
              containerStyle.drawnVertices()[vb.index()]!.centroid(),
            );
            const vaPointDouble = new Point2D.Double(vaPoint.getX(), vaPoint.getY());
            const vbPointDouble = new Point2D.Double(vbPoint.getX(), vbPoint.getY());
            const clickedPoint = new Point2D.Double(pt.getX(), pt.getY());
            dist = distanceToLineSegment(clickedPoint, vaPointDouble, vbPointDouble);
            dist += (this.bridge.getContainerStyle(this.container.index()) as unknown as IContainerStyle).cellRadiusPixels() / 4;
          }
        }
      } else {
        if (containerStyle !== null) {
          const sitePosn = containerStyle.screenPosn(validLoc.position());
          const dx = pt.x - sitePosn.x;
          const dy = pt.y - sitePosn.y;
          dist = Math.sqrt(dx * dx + dy * dy);
        }
      }

      if (dist < minDist && dist < furthestPossibleDistance) {
        location = new FullLocation(
          site,
          validLoc.location().level(),
          validLoc.location().siteType() as SiteType,
        );
        minDist = dist;
      }
    }

    return location;
  }

  // -------------------------------------------------------------------------

  /**
   * Returns whether the move involves a single edge.
   * @java BaseController#isEdgeMove(other.move.Move)
   */
  public static isEdgeMove(m: {
    fromType(): SiteType;
    toType(): SiteType;
    from(): number;
    to(): number;
  }): boolean {
    return m.fromType() === 'Edge' && m.toType() === 'Edge' && m.from() === m.to();
  }

  // -------------------------------------------------------------------------
}
