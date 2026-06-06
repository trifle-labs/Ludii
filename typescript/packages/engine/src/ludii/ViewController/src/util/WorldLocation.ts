// @java ViewController/src/util/WorldLocation.java

import { Point2D } from "../../../awt/geom/Point2D.js";
import { Location } from "../../../../ludemes/other/location/Location.js";

/**
 * World Location of a component.
 *
 * Faithful 1:1 port of util.WorldLocation.
 *
 * @author Matthew.Stephenson and Eric.Piette (Java original)
 */
export class WorldLocation {
  /** Internal location of the component. */
  private readonly _location: Location;

  /** World position of the component. */
  private readonly _position: Point2D;

  // -------------------------------------------------------------------------

  constructor(location: Location, position: Point2D) {
    this._location = location;
    this._position = position;
  }

  // -------------------------------------------------------------------------

  /** @java WorldLocation#location() */
  location(): Location {
    return this._location;
  }

  /** @java WorldLocation#position() */
  position(): Point2D {
    return this._position;
  }

  // --------------------------------------------------------------------------
}
