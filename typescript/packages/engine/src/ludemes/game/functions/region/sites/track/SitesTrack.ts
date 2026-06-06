// @java Core/src/game/functions/region/sites/track/SitesTrack.java

/**
 * Returns all the sites of a track.
 *
 * @java game/functions/region/sites/track/SitesTrack.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Minimal track surface.
 * @java game/equipment/container/board/Track
 */
interface TrackLike {
  name(): string;
  owner(): number;
  elems(): Array<{ site: number }>;
}

/**
 * Minimal context track surface.
 */
interface ContextTrackLike {
  track(): number;
  tracks(): TrackLike[];
}

/**
 * Returns all the sites of a track (or the subset from→to).
 *
 * Java parity: eval(context) finds the matching track by player/name then
 * collects its site elements, optionally sliced by from/to.
 *
 * @java game.functions.region.sites.track.SitesTrack
 */
export class SitesTrack extends BaseRegionFunction {
  /** @java SitesTrack — private final IntFunction pid */
  private readonly pid: IntFunction | null;
  /** @java SitesTrack — private final String name */
  private readonly name: string;
  /** @java SitesTrack — private final IntFunction fromFn */
  private readonly fromFn: IntFunction | null;
  /** @java SitesTrack — private final IntFunction toFn */
  private readonly toFn: IntFunction | null;

  /** @java SitesTrack — precomputedRegion */
  private precomputedRegion: number[] | null = null;

  /**
   * @param pid   Player index function (or null).
   * @param name  Track name (empty string for any track).
   * @param from  Only sites from this site onwards (inclusive), or null.
   * @param to    Only sites up to and including this site, or null.
   * @java SitesTrack(game.util.moves.Player, RoleType, String, IntFunction, IntFunction)
   */
  public constructor(
    pid: IntFunction | null,
    name: string | null,
    from: IntFunction | null,
    to: IntFunction | null,
  ) {
    super();
    this.pid = pid;
    this.name = name ?? "";
    this.fromFn = from;
    this.toFn = to;
  }

  /**
   * @java SitesTrack.eval(Context)
   *
   * Finds the appropriate track and returns its site elements, optionally
   * filtered from→to.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesTrack.java:75 — precomputed cache
    if (this.precomputedRegion !== null) {
      return this.precomputedRegion;
    }

    const ctxAny = ctx as unknown as ContextTrackLike;

    let track: TrackLike | null = null;

    // @java SitesTrack.java:80-113 — resolve track
    if (ctxAny.track() !== UNDEFINED) {
      // @java SitesTrack.java:82-86 — use context track index
      const index = ctxAny.track();
      const tracks = ctxAny.tracks();
      if (index >= 0 && index < tracks.length) {
        track = tracks[index] ?? null;
      }
    } else {
      const playerId = this.pid !== null ? this.pid.eval(ctx) : 0;

      // @java SitesTrack.java:90-113 — search by name and owner
      for (const t of ctxAny.tracks()) {
        if (this.name !== "") {
          if (
            t.name() === this.name ||
            (t.name().includes(this.name) &&
              (t.owner() === playerId || t.owner() === 0))
          ) {
            track = t;
            break;
          }
        } else if (t.owner() === playerId || t.owner() === 0) {
          track = t;
          break;
        }
      }
    }

    // @java SitesTrack.java:115-116 — no track found
    if (track === null) {
      return [];
    }

    const sites: number[] = [];
    const elems = track.elems();

    // @java SitesTrack.java:120-176 — collect sites
    if (this.fromFn === null && this.toFn === null) {
      // @java SitesTrack.java:122-123 — full track
      for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        if (elem !== undefined) sites.push(elem.site);
      }
    } else {
      const from = this.fromFn !== null ? this.fromFn.eval(ctx) : UNDEFINED;
      const to = this.toFn !== null ? this.toFn.eval(ctx) : UNDEFINED;

      // @java SitesTrack.java:132 — get fromIndex
      let fromIndex = UNDEFINED;

      if (from === UNDEFINED) {
        // @java SitesTrack.java:135 — no from defined, start from beginning
        fromIndex = 0;
      } else {
        // @java SitesTrack.java:138-147 — find from site in track
        for (let i = 0; i < elems.length; i++) {
          const elem = elems[i];
          if (elem !== undefined && elem.site === from) {
            fromIndex = i;
            break;
          }
        }
        // @java SitesTrack.java:148-150 — from not found
        if (fromIndex === UNDEFINED) {
          return sites;
        }
      }

      // @java SitesTrack.java:153-165 — collect sites from fromIndex to to site
      let toFound = false;
      for (let i = fromIndex; i < elems.length; i++) {
        const elem = elems[i];
        if (elem === undefined) continue;
        const site = elem.site;
        sites.push(site);
        if (site === to) {
          toFound = true;
          break;
        }
      }

      // @java SitesTrack.java:167-176 — wrap around if to not found
      if (!toFound) {
        for (let i = 0; i < fromIndex; i++) {
          const elem = elems[i];
          if (elem === undefined) continue;
          const site = elem.site;
          sites.push(site);
          if (site === to) break;
        }
      }
    }

    return sites;
  }

  /** @java SitesTrack.isStatic() */
  public override isStatic(): boolean {
    // @java SitesTrack.java:184-195
    if (this.fromFn !== null && !(this.fromFn as unknown as { isStatic?: () => boolean }).isStatic?.()) {
      return false;
    }
    if (this.toFn !== null && !(this.toFn as unknown as { isStatic?: () => boolean }).isStatic?.()) {
      return false;
    }
    if (this.pid !== null) {
      return (this.pid as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    }
    return false;
  }

  /** @java SitesTrack.toString() */
  public override toString(): string {
    return "Track()";
  }

  /** @java SitesTrack.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    const gameAny = game as unknown as {
      hasTrack?: () => boolean;
      addRequirementToReport?: (s: string) => void;
    };
    // @java SitesTrack.java:263-267
    if (typeof gameAny.hasTrack === "function" && !gameAny.hasTrack()) {
      gameAny.addRequirementToReport?.(
        "The ludeme (sites Track ...) is used but the board has no tracks.",
      );
      missingRequirement = true;
    }
    if (this.pid !== null) {
      missingRequirement =
        missingRequirement ||
        ((this.pid as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    }
    if (this.fromFn !== null) {
      missingRequirement =
        missingRequirement ||
        ((this.fromFn as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    }
    if (this.toFn !== null) {
      missingRequirement =
        missingRequirement ||
        ((this.toFn as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    }
    return missingRequirement;
  }

  /** @java SitesTrack.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let willCrash = false;
    if (this.pid !== null) {
      willCrash = willCrash || ((this.pid as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    }
    if (this.fromFn !== null) {
      willCrash = willCrash || ((this.fromFn as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    }
    if (this.toFn !== null) {
      willCrash = willCrash || ((this.toFn as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    }
    return willCrash;
  }

  /** @java SitesTrack.preprocess(Game) */
  public preprocess(game: unknown): void {
    if (this.pid !== null) {
      (this.pid as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    }
    if (this.fromFn !== null) {
      (this.fromFn as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    }
    if (this.toFn !== null) {
      (this.toFn as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    }
    // @java SitesTrack.java:300 — if static precompute (skipped: no Context(game,null) equiv)
  }

  /** @java SitesTrack.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    const nameStr = this.name === "" ? "of board" : this.name;
    const pidStr =
      this.pid === null
        ? ""
        : ` for Player ${(this.pid as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? ""}`;
    const regionStr =
      this.precomputedRegion === null
        ? ""
        : ` covering [${this.precomputedRegion.join(",")}]`;
    return `track ${nameStr}${pidStr}${regionStr}`;
  }
}
