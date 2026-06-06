// @java Core/src/game/rules/start/place/Place.java

/**
 * Sets some aspect of the initial game state.
 *
 * This is the static factory dispatcher. Java's Place.construct() overloads
 * delegate to concrete subclasses (PlaceItem, PlaceCustomStack,
 * PlaceMonotonousStack, PlaceRandom). This TS port mirrors the same dispatch
 * pattern.
 *
 * @java game/rules/start/place/Place.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import type { RegionFunction } from "../../../../base.js";
import { PlaceItem } from "./item/PlaceItem.js";
import { PlaceCustomStack } from "./stack/PlaceCustomStack.js";
import { PlaceMonotonousStack } from "./stack/PlaceMonotonousStack.js";
import { PlaceRandom } from "./random/PlaceRandom.js";
import type { PlaceStackType } from "./PlaceStackType.js";
import type { PlaceRandomType } from "./PlaceRandomType.js";

/**
 * Minimal interface for an int-valued function.
 * @java game/functions/ints/IntFunction.java — eval(Context)
 */
interface JavaIntFunction {
  eval(context: Context): number;
}

/**
 * Minimal interface for a boolean constant.
 * @java game/functions/booleans/BooleanConstant.java — eval(Context)
 */
interface JavaBooleanConstant {
  eval(context: Context): boolean;
}

/**
 * Minimal interface for a Count object.
 * @java game/util/math/Count.java
 */
interface JavaCount {
  item(): string;
  count(): JavaIntFunction;
}

/**
 * Minimal site type enum entry.
 */
type SiteType = string | null;

/**
 * Sets some aspect of the initial game state — static factory mirroring
 * Java's Place.construct() overloads.
 *
 * @java game/rules/start/place/Place.java
 */
export class Place {
  /**
   * @java Place.eval(Context) — Should never be called directly.
   */
  public eval(_context: Context): void {
    // Java: Should not be called, should only be called on subclasses
    throw new Error("Place.eval(): Should never be called directly.");
  }

  /** @java Place.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java Place.gameFlags(Game) */
  public gameFlags(_game: unknown): number {
    return 0;
  }

  /** @java Place.preprocess(Game) */
  public preprocess(_game: unknown): void {
    // Nothing to do.
  }

  //-------------------------------------------------------------------------
  // Static factory methods mirroring Java construct() overloads
  //-------------------------------------------------------------------------

  /**
   * For placing an item to a site.
   *
   * @param item      The name of the item.
   * @param container The name of the container.
   * @param type      The graph element type.
   * @param loc       The location to place a piece.
   * @param coord     The coordinate of the location to place a piece.
   * @param count     The number of the same piece to place [1].
   * @param state     The local state value of the piece to place [Off].
   * @param rotation  The rotation value of the piece to place [Off].
   * @param value     The piece value to place [Undefined].
   *
   * @java Place.construct(String, String, SiteType, IntFunction, String, IntFunction, IntFunction, IntFunction, IntFunction)
   */
  public static constructItem(
    item: string,
    container: string | null,
    type: SiteType,
    loc: JavaIntFunction | null,
    coord: string | null,
    count: JavaIntFunction | null,
    state: JavaIntFunction | null,
    rotation: JavaIntFunction | null,
    value: JavaIntFunction | null,
  ): PlaceItem {
    return new PlaceItem(item, container, type, loc, coord, count, state, rotation, value);
  }

  /**
   * For placing item(s) to sites.
   *
   * @param item     The item to place.
   * @param type     The graph element type.
   * @param locs     The sites to fill.
   * @param region   The region to fill.
   * @param coords   The coordinates of the sites to fill.
   * @param counts   The number of pieces on the state.
   * @param state    The local state value to put on each site.
   * @param rotation The rotation value to put on each site.
   * @param value    The piece value to place [Undefined].
   *
   * @java Place.construct(String, SiteType, IntFunction[], RegionFunction, String[], IntFunction[], IntFunction, IntFunction, IntFunction)
   */
  public static constructFill(
    item: string,
    type: SiteType,
    locs: JavaIntFunction[] | null,
    region: RegionFunction | null,
    coords: string[] | null,
    counts: JavaIntFunction[] | null,
    state: JavaIntFunction | null,
    rotation: JavaIntFunction | null,
    value: JavaIntFunction | null,
  ): PlaceItem {
    return new PlaceItem(item, null, type, null, null, null, state, rotation, value, locs, region, coords, counts);
  }

  /**
   * For placing items into a stack.
   *
   * @java Place.construct(PlaceStackType, String, String[], String, SiteType, IntFunction, IntFunction[], RegionFunction, String, String[], IntFunction, IntFunction[], IntFunction, IntFunction, IntFunction)
   */
  public static constructStack(
    _placeType: PlaceStackType,
    item: string | null,
    items: string[] | null,
    container: string | null,
    type: SiteType,
    loc: JavaIntFunction | null,
    locs: JavaIntFunction[] | null,
    region: RegionFunction | null,
    coord: string | null,
    coords: string[] | null,
    count: JavaIntFunction | null,
    counts: JavaIntFunction[] | null,
    state: JavaIntFunction | null,
    rotation: JavaIntFunction | null,
    value: JavaIntFunction | null,
  ): PlaceMonotonousStack | PlaceCustomStack {
    // Java parity: numNonNull validation omitted (handled at higher level)
    // Java: if (items == null && (locs != null || region != null || coord != null || counts != null))
    if (items === null && (locs !== null || region !== null || coord !== null || counts !== null)) {
      return new PlaceMonotonousStack(item!, type, locs, region, coords, count, counts, state, rotation, value);
    } else {
      return new PlaceCustomStack(item, items, container, type, loc, coord, count, state, rotation, value);
    }
  }

  /**
   * For placing randomly pieces.
   *
   * @java Place.construct(PlaceRandomType, RegionFunction, String[], IntFunction, IntFunction, IntFunction, SiteType, BooleanConstant)
   */
  public static constructRandom(
    _placeType: PlaceRandomType,
    region: RegionFunction | null,
    item: string[],
    count: JavaIntFunction | null,
    state: JavaIntFunction | null,
    value: JavaIntFunction | null,
    type: SiteType,
    randPiecOrder: JavaBooleanConstant | null,
  ): PlaceRandom {
    return new PlaceRandom(region, item, count, value, state, type, randPiecOrder);
  }

  /**
   * For placing randomly a stack.
   *
   * @java Place.construct(PlaceRandomType, String[], IntFunction[], IntFunction, IntFunction, IntFunction, SiteType)
   */
  public static constructRandomStack(
    _placeType: PlaceRandomType,
    pieces: string[],
    count: JavaIntFunction[] | null,
    state: JavaIntFunction | null,
    value: JavaIntFunction | null,
    where: JavaIntFunction,
    type: SiteType,
  ): PlaceRandom {
    return new PlaceRandom(pieces, count, value, state, where, type);
  }

  /**
   * For placing randomly a stack with specific number of each type of pieces.
   *
   * @java Place.construct(PlaceRandomType, Count[], IntFunction, SiteType)
   */
  public static constructRandomCounts(
    _placeType: PlaceRandomType,
    items: JavaCount[],
    where: JavaIntFunction,
    type: SiteType,
  ): PlaceRandom {
    return new PlaceRandom(items, where, type);
  }
}
