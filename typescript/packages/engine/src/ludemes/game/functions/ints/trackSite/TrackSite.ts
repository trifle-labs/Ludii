// @java Core/src/game/functions/ints/trackSite/TrackSite.java

/**
 * Returns a site on a track.
 *
 * @java game/functions/ints/trackSite/TrackSite.java
 * @author Eric Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import { TrackSiteFirstType } from "./TrackSiteFirstType.js";
import { TrackSiteType } from "./TrackSiteType.js";
import { TrackSiteMoveType } from "./TrackSiteMoveType.js";
import { TrackSiteFirstTrack } from "./first/TrackSiteFirstTrack.js";
import { TrackSiteEndTrack } from "./position/TrackSiteEndTrack.js";
import { TrackSiteMove } from "./move/TrackSiteMove.js";
import type { BaseBooleanFunction } from "../../booleans/BaseBooleanFunction.js";

/**
 * Factory dispatcher for track-site ludemes.
 * Java's TrackSite.construct() overloads are mirrored as static factory methods.
 *
 * @java game/functions/ints/trackSite/TrackSite.java
 */
export class TrackSite extends BaseIntFunction {

  /**
   * For the first site in a track.
   *
   * @java TrackSite.construct(TrackSiteFirstType, Player, RoleType, String, IntFunction, BooleanFunction)
   */
  public static constructFirst(
    _trackSiteType: TrackSiteFirstType,
    player: JavaIntFunction | null,
    role: string | null,
    name: string | null,
    from: JavaIntFunction | null,
    If: BaseBooleanFunction | null,
  ): JavaIntFunction {
    switch (_trackSiteType) {
      case TrackSiteFirstType.FirstSite:
        return new TrackSiteFirstTrack(player, role, name, from, If);
      default:
        break;
    }
    throw new Error("TrackSite(): A TrackSiteFirstType is not implemented.");
  }

  /**
   * For the last site in a track.
   *
   * @java TrackSite.construct(TrackSiteType, Player, RoleType, String)
   */
  public static constructEnd(
    _trackSiteType: TrackSiteType,
    player: JavaIntFunction | null,
    role: string | null,
    name: string | null,
  ): JavaIntFunction {
    switch (_trackSiteType) {
      case TrackSiteType.EndSite:
        return new TrackSiteEndTrack(player, role, name);
      default:
        break;
    }
    throw new Error("TrackSite(): A TrackSiteType is not implemented.");
  }

  /**
   * For getting the site in a track from a site after some steps.
   *
   * @java TrackSite.construct(TrackSiteMoveType, IntFunction, RoleType, Player, String, IntFunction)
   */
  public static constructMove(
    _trackSiteType: TrackSiteMoveType,
    from: JavaIntFunction | null,
    role: null,
    player: JavaIntFunction | null,
    name: string | null,
    steps: JavaIntFunction,
  ): JavaIntFunction {
    switch (_trackSiteType) {
      case TrackSiteMoveType.Move:
        return new TrackSiteMove(from, role, player, name, steps);
      default:
        break;
    }
    throw new Error("TrackSite(): A TrackSiteMoveType is not implemented.");
  }

  //-------------------------------------------------------------------------

  private constructor() {
    super();
  }

  //-------------------------------------------------------------------------

  /**
   * @java TrackSite.eval(Context) — should never be called directly
   */
  public override eval(_context: Context): number {
    throw new Error("TrackSite.eval(): Should never be called directly.");
  }

  /** @java TrackSite.isStatic() */
  public isStatic(): boolean {
    return false;
  }

  /** @java TrackSite.gameFlags(Game) */
  public override concepts(_game: unknown): Set<number> {
    return new Set();
  }
}
