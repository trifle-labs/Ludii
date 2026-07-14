// @java Core/src/game/functions/region/sites/largePiece/SitesLargePiece.java

/**
 * Returns all the sites occupied by a large piece.
 *
 * @java game/functions/region/sites/largePiece/SitesLargePiece.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { EvalScratch, IntFunction } from "../../../../../base.js";
import { BaseRegionFunction } from "../../BaseRegionFunction.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Minimal component surface needed from equipment.pieces[] entries.
 * @java game/equipment/component/Component
 *
 * NOTE: Java Component.locs() does NOT exist in the TS port. The equivalent
 * footprint computation is performed inline here via locsLargePiece(),
 * mirroring Core/src/game/equipment/component/Component.java:307-375.
 *
 * The TS equipment stores plain frozen objects with a `walks` property when
 * the component has a turtle-graphics walk (@java Component.isLargePiece()
 * returns true iff this.walk != null — mirrored here as walks !== undefined
 * and walks.length > 0).
 */
interface ComponentLike {
  walks?: readonly (readonly string[])[];
}

/**
 * Minimal container state surface needed.
 * @java other/state/container/ContainerState
 */
interface ContainerStateLike {
  what(site: number, type: string | null): number;
  state(site: number, type: string | null): number;
  sizeStack?(site: number, type: string | null): number;
}

/**
 * Minimal topology surface needed.
 * @java other/topology/Topology
 */
interface TopologyLike {
  getGraphElements(type: string | null): { size(): number } | unknown[];
}

/**
 * Compute the footprint cells of a large piece anchored at `from` with
 * rotation-encoded `state`, following the turtle-graphics walk.
 *
 * @java Core/src/game/equipment/component/Component.java:307-375
 *   Component.locs(context, startLoc, state, topology)
 *
 * The four cardinal directions [N, E, S, W] are the supported orthogonals on
 * a square board (@java Component.java:317-322:
 *   orthogonalSupported = topology.supportedOrthogonalDirections(Cell);
 *   startDirection = orthogonalSupported.get(realState % orthogonalSupported.size())).
 * For square boards orthogonalSupported.size() == 4 which makes ORTHO below
 * a faithful port.
 *
 * state encodes BOTH orientation (state % 4 → starting cardinal) AND walk
 * variant (state / 4 → which row of the walks[][] matrix). A returned []
 * means the walk stepped off the board (@java Component.java:352: "No
 * correct walk with that state — return new TIntArrayList()").
 *
 * @param ctx   The evaluation context (provides trajectories / board geometry)
 * @param from  Anchor site index
 * @param state Rotation-and-walk-variant encoding (the piece's local state)
 * @param walks The piece's turtle-graphics walk matrix (Component.walk())
 * @returns     All cells covered, including `from`; or [] if walk is invalid
 */
function locsLargePiece(
  ctx: Context & EvalScratch,
  from: number,
  state: number,
  walks: readonly (readonly string[])[],
): number[] {
  // @java Component.java:315 — realState = (state >= 0) ? state : 0
  const realState = state >= 0 ? state : 0;

  // @java Component.java:317-322 — the four supported orthogonal directions
  // on a square grid map to [N, E, S, W] (Java AbsoluteDirection ordinals).
  // This matches Add.locsLargePiece which also hardcodes ORTHO = ["N","E","S","W"].
  const ORTHO = ["N", "E", "S", "W"] as const;

  // @java Component.java:322 — startDirection = orthogonalSupported.get(realState % size)
  let dirIdx = realState % ORTHO.length;

  // @java Component.java:325 — indexWalk = realState / orthogonalSupported.size()
  const indexWalk = Math.floor(realState / ORTHO.length);

  // @java Component.java:327-328 — if indexWalk >= walk.length return [from]
  if (indexWalk >= walks.length) return [from];

  // @java Component.java:330 — steps = walk[indexWalk]
  const steps = walks[indexWalk]!;

  // @java Component.java:324 — sitesAfterWalk.add(from)
  const out: number[] = [from];

  // Step helper: advance one cell in direction dir from site.
  // @java Component.java:339 — topology.trajectories().steps(Cell, currentLoc, currentDirection.toAbsolute())
  const traj = (ctx as unknown as { _trajectories?: { step(site: number, dir: string): number } | null })._trajectories;
  const board = (ctx.game as unknown as {
    equipment?: { board?: { width: number; height: number; numSites: number } };
  }).equipment?.board;
  const W = board?.width ?? 0;
  const H = board?.height ?? 0;
  const stepTo = (site: number, dir: string): number => {
    if (traj && typeof traj.step === "function") return traj.step(site, dir);
    // Grid fallback: @java topology.trajectories().steps() on a rectangle
    const col = site % W;
    const row = Math.floor(site / W);
    switch (dir) {
      case "E": return col + 1 < W ? site + 1 : -1;
      case "W": return col - 1 >= 0 ? site - 1 : -1;
      case "N": return row + 1 < H ? site + W : -1;
      case "S": return row - 1 >= 0 ? site - W : -1;
      default: return -1;
    }
  };

  let cur = from;
  for (const step of steps) {
    if (step === "F") {
      // @java Component.java:338-357 — step forward; UNDEFINED means off-board
      const to = stepTo(cur, ORTHO[dirIdx]!);
      // @java Component.java:351-352 — "No correct walk with that state"
      if (to < 0) return [];
      if (!out.includes(to)) out.push(to);
      cur = to;
    } else if (step === "R") {
      // @java Component.java:359-363 — turn right, skipping unsupported directions
      dirIdx = (dirIdx + 1) % ORTHO.length;
    } else if (step === "L") {
      // @java Component.java:365-369 — turn left, skipping unsupported directions
      dirIdx = (dirIdx + ORTHO.length - 1) % ORTHO.length;
    }
  }

  return out;
}

/**
 * Returns all the sites occupied by a large piece.
 *
 * Java parity: eval(context) reads the piece at the given site; if it is a
 * large piece it collects all covered locations from Component.locs().
 *
 * @java game.functions.region.sites.largePiece.SitesLargePiece
 */
export class SitesLargePiece extends BaseRegionFunction {
  /** @java SitesLargePiece — private final IntFunction at */
  private readonly at: IntFunction;

  /**
   * @param siteType The graph element type or null for board default.
   * @param at       The site to look at.
   * @java SitesLargePiece(SiteType, IntFunction)
   */
  public constructor(siteType: string | null, at: IntFunction) {
    super();
    this.siteType = siteType;
    this.at = at;
  }

  /**
   * @java SitesLargePiece.eval(Context)
   *
   * Returns all sites covered by the large piece located at the given site,
   * or just [site] for regular pieces, or [] when no piece / out of bounds.
   */
  public override eval(ctx: Context & EvalScratch): number[] {
    // @java SitesLargePiece.java:52 — resolve site
    const site = this.at.eval(ctx);
    const ctxAny = ctx as unknown as {
      game?: { board?: () => { defaultSite?: () => string } };
      board?: () => {
        defaultSite?: () => string;
        topology?: () => TopologyLike;
      };
      topology?: () => TopologyLike;
      containerState?: (cid: number) => ContainerStateLike;
      components?: () => (ComponentLike | null)[];
    };

    // @java SitesLargePiece.java:53 — realType
    let realType: string | null = this.siteType;
    if (realType === null) {
      // context.game().board().defaultSite()
      realType =
        ctxAny.game?.board?.()?.defaultSite?.() ??
        ctxAny.board?.()?.defaultSite?.() ??
        "Cell";
    }

    const sitesOccupied: number[] = [];

    // @java SitesLargePiece.java:56-59 — if site is off the board return empty
    const topo: TopologyLike | undefined =
      ctxAny.board?.()?.topology?.() ?? ctxAny.topology?.();
    if (topo !== undefined) {
      const elems = topo.getGraphElements(realType);
      const size = Array.isArray(elems) ? elems.length : (elems as { size(): number }).size();
      if (site >= size) return sitesOccupied;
    }

    // @java SitesLargePiece.java:61 — container state for board (cid=0)
    const cs: ContainerStateLike | undefined = ctxAny.containerState?.(0);
    if (!cs) return sitesOccupied;

    // @java SitesLargePiece.java:62 — what piece is here
    const what = cs.what(site, realType);

    // @java SitesLargePiece.java:64-66 — if no piece return empty
    if (what === 0) return sitesOccupied;

    // @java SitesLargePiece.java:68 — resolve component
    const components = ctxAny.components?.();
    const piece: ComponentLike | null | undefined = components?.[what];
    if (!piece) {
      sitesOccupied.push(site);
      return sitesOccupied;
    }

    // @java SitesLargePiece.java:71-75 — if not large piece return [site]
    // Java: piece.isLargePiece() ↔ Component._walk != null
    // TS:   equipment pieces carry `walks` (non-empty) iff isLargePiece() is true
    const walks = piece.walks;
    if (!walks || walks.length === 0) {
      // Regular (non-large) piece — return just the anchor site.
      sitesOccupied.push(site);
      return sitesOccupied;
    }

    // @java SitesLargePiece.java:77-82 — large piece: collect all locs.
    // Java calls piece.locs(context, site, localState, topology)
    // (Component.java:307-375). The TS Component has no locs() method;
    // the equivalent footprint computation is locsLargePiece() above,
    // which mirrors Component.locs() exactly.
    const localState = cs.state(site, this.siteType);
    const locs = locsLargePiece(ctx, site, localState, walks);
    for (const loc of locs) {
      if (!sitesOccupied.includes(loc)) {
        sitesOccupied.push(loc);
      }
    }

    return sitesOccupied;
  }

  /** @java SitesLargePiece.isStatic() */
  public override isStatic(): boolean {
    return false;
  }

  /** @java SitesLargePiece.preprocess(Game) */
  public preprocess(game: unknown): void {
    // @java SitesLargePiece.java:133 — type = SiteType.use(type, game)
    if (this.siteType === null) {
      const gameAny = game as unknown as { board?: () => { defaultSite?: () => string } };
      this.siteType = gameAny.board?.()?.defaultSite?.() ?? "Cell";
    }
    (this.at as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
  }

  /** @java SitesLargePiece.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    // @java SitesLargePiece.java:140-145
    const gameAny = game as unknown as {
      hasLargePiece?: () => boolean;
      addRequirementToReport?: (s: string) => void;
    };
    if (typeof gameAny.hasLargePiece === "function" && !gameAny.hasLargePiece()) {
      gameAny.addRequirementToReport?.(
        "The ludeme (sites LargePiece ...) is used but the equipment has no large pieces.",
      );
      missingRequirement = true;
    }
    missingRequirement =
      missingRequirement ||
      ((this.at as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    return missingRequirement;
  }

  /** @java SitesLargePiece.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    return (this.at as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false;
  }

  /** @java SitesLargePiece.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    const atStr =
      (this.at as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ??
      String(UNDEFINED);
    return `the sites covered by the large piece located on site ${atStr}`;
  }
}
