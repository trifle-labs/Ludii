// @java ViewController/src/util/LocationUtil.java

import { Point } from '../../../awt/Point.js';
import { FullLocation } from '../../../../ludemes/other/location/FullLocation.js';
import type { Location } from '../../../../ludemes/other/location/Location.js';
import type { ContainerState } from '../../../../ludemes/other/state/container/ContainerState.js';
import type { Vertex } from '../../../../ludemes/other/topology/Vertex.js';
import type { Edge } from '../../../../ludemes/other/topology/Edge.js';
import type { Cell } from '../../../../ludemes/other/topology/Cell.js';
import type { Container } from '../../../../ludemes/game/equipment/container/Container.js';
import type { Context } from '../../../../ludemes/other/context/Context.js';

/** Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

// ---------------------------------------------------------------------------
// Minimal interface escape-hatches for not-yet-ported deps
// ---------------------------------------------------------------------------

/**
 * Minimal interface for bridge.ContainerStyle (not yet ported).
 * @java ViewController/src/view/container/ContainerStyle.java
 */
export interface IContainerStyle {
  drawnVertices(): Vertex[];
  drawnEdges(): Edge[];
  drawnCells(): Cell[];
}

/**
 * Minimal interface for controllers.Controller (not yet ported).
 * @java ViewController/src/controllers/Controller.java
 */
export interface IController {
  calculateNearestLocation(context: Context, pt: Point, legalLocations: Location[]): Location;
}

/**
 * Minimal interface for util.SettingsVC (not yet ported).
 * @java ViewController/src/util/SettingsVC.java
 */
export interface ISettingsVC {
  selectedFromLocation(): Location;
}

/**
 * Minimal interface for bridge.Bridge (not yet ported).
 * @java ViewController/src/bridge/Bridge.java
 */
export interface IBridge {
  getContainerStyle(index: number): IContainerStyle;
  getContainerController(index: number): IController;
  settingsVC(): ISettingsVC;
}

// ---------------------------------------------------------------------------

/**
 * Functions relating to Locations.
 *
 * @java util.LocationUtil
 * @author Matthew.Stephenson
 */
export class LocationUtil {

  // -------------------------------------------------------------------------

  /**
   * Get all locations across all containers.
   *
   * @java util.LocationUtil#getAllLocations(other.context.Context, bridge.Bridge)
   */
  static getAllLocations(context: Context, bridge: IBridge): Location[] {
    const allLocations: Location[] = [];

    const containers = context.containers() as Container[];
    for (const container of containers) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const cs = (context.state()!.containerStates() as unknown as ContainerState[])[container.index()]!;
      const containerStyle: IContainerStyle = bridge.getContainerStyle(container.index());

      // if is an edge game, then vertices can also be selected
      if (container.index() === 0 && (context.isVertexGame() || context.isEdgeGame())) {
        for (const v of containerStyle.drawnVertices()) {
          for (let i = 0; i <= cs.sizeStack(v.index(), v.elementType()); i++) {
            allLocations.push(new FullLocation(v.index(), i, v.elementType()));
          }
        }
      }

      if (container.index() === 0 && context.isEdgeGame()) {
        for (const e of containerStyle.drawnEdges()) {
          for (let i = 0; i <= cs.sizeStack(e.index(), e.elementType()); i++) {
            allLocations.push(new FullLocation(e.index(), i, e.elementType()));
          }
        }
      }

      if (context.isCellGame()) {
        for (const c of containerStyle.drawnCells()) {
          for (let i = 0; i <= cs.sizeStack(c.index(), c.elementType()); i++) {
            allLocations.push(new FullLocation(c.index(), i, c.elementType()));
          }
        }
      }
    }

    return allLocations;
  }

  // -------------------------------------------------------------------------

  /**
   * Get all valid From locations in the set of legal moves.
   *
   * @java util.LocationUtil#getLegalFromLocations(other.context.Context)
   */
  static getLegalFromLocations(context: Context): Location[] {
    const allLocations: Set<Location> = new Set();
    const movesObj = context.moves(context).moves();
    const size = movesObj.size();
    for (let i = 0; i < size; i++) {
      const m = movesObj.get(i) as unknown as { getFromLocation(): Location };
      allLocations.add(m.getFromLocation());
    }
    return Array.from(allLocations);
  }

  // -------------------------------------------------------------------------

  /**
   * Get all valid To locations in the set of legal moves.
   *
   * @java util.LocationUtil#getLegalToLocations(bridge.Bridge, other.context.Context)
   */
  static getLegalToLocations(bridge: IBridge, context: Context): Location[] {
    const allLocations: Set<Location> = new Set();
    const selectedFrom: Location = bridge.settingsVC().selectedFromLocation();
    const movesObj = context.moves(context).moves();
    const size = movesObj.size();
    for (let i = 0; i < size; i++) {
      const m = movesObj.get(i) as unknown as { getFromLocation(): Location; getToLocation(): Location };
      if (m.getFromLocation().equals(selectedFrom)) {
        allLocations.add(m.getToLocation());
      }
    }
    return Array.from(allLocations);
  }

  // -------------------------------------------------------------------------

  /**
   * Get the nearest location to the released point.
   *
   * @java util.LocationUtil#calculateNearestLocation(other.context.Context, bridge.Bridge, java.awt.Point, java.util.List)
   */
  static calculateNearestLocation(
    context: Context,
    bridge: IBridge,
    pt: Point,
    legalLocations: Location[],
  ): Location {
    let location: Location = new FullLocation(UNDEFINED);

    const containers = context.equipment().containers() as Container[];
    for (const container of containers) {
      location = bridge
        .getContainerController(container.index())
        .calculateNearestLocation(context, pt, legalLocations);
      if (!location.equals(new FullLocation(UNDEFINED))) {
        return location;
      }
    }

    return location;
  }

  // -------------------------------------------------------------------------
}
