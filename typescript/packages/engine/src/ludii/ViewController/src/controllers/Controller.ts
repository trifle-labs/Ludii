// @java ViewController/src/controllers/Controller.java

import { Point } from '../../../awt/index.js';
import type { Context } from '../../../../context.js';
import type { Location } from '../../../../ludemes/other/location/Location.js';

/**
 * Controller interface for controlling piece movement.
 *
 * @java controllers.Controller
 * @author Matthew.Stephenson
 */
export interface Controller {
  /**
   * Calculates the nearest location to a given screen point from a list of legal locations.
   *
   * @java Controller#calculateNearestLocation(Context, Point, List)
   */
  calculateNearestLocation(
    context: Context,
    pt: Point,
    legalLocations: Location[],
  ): Location;
}
