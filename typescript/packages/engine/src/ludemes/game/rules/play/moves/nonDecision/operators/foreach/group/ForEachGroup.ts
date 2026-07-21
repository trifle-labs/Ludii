// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/group/ForEachGroup.java

/**
 * Applies a move for each group.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/group/ForEachGroup.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { BooleanFunction, MovesFunction } from "../../../../../../../../base.js";
import { BaseMoves } from "../../../../BaseMoves.js";
import { Effect } from "../../../effect/Effect.js";
import type { ThenLike } from "../../../../Moves.js";
import { applyPostStateThen } from "../../../effect/Then.js";

/** OFF constant matching Java's Constants.OFF = -1 */
const OFF = -1;

/**
 * Applies a move for each group of connected pieces on the board.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/group/ForEachGroup.java
 */
export class ForEachGroup extends Effect {
  /** @java ForEachGroup.condition */
  private readonly condition: BooleanFunction | null;

  /** @java ForEachGroup.dirnChoice — directions function */
  private readonly dirnChoice: unknown;

  /**
   * @java ForEachGroup.dirnChoice — resolved to a category name; default
   * Adjacent. The Direction token arrives RAW (string "Orthogonal" or {name}).
   */
  private readonly directionName: string;

  /** @java ForEachGroup.movesToApply */
  private readonly movesToApply: MovesFunction;

  /** @java ForEachGroup.type — SiteType (Cell/Edge/Vertex) */
  private readonly type: string | null;

  /**
   * @java ForEachGroup(SiteType, Direction, BooleanFunction, Moves, Then)
   *
   * @param type       The type of the graph elements of the group.
   * @param directions The directions of the connection between elements in the group [Adjacent].
   * @param condition  The condition on the pieces to include in the group.
   * @param moves      The moves to apply.
   * @param then       The moves applied after that move is applied.
   */
  public constructor(
    type: string | null,
    directions: unknown,
    condition: BooleanFunction | null,
    moves: MovesFunction,
    then: ThenLike | null = null,
  ) {
    super(then);
    this.movesToApply = moves;
    this.type = type;
    this.condition = condition;
    // dirnChoice = (directions != null) ? directions.directionsFunctions()
    //              : new Directions(AbsoluteDirection.Adjacent, null)
    this.dirnChoice = directions;
    this.directionName =
      typeof directions === "string"
        ? directions
        : (directions as { name?: string } | null)?.name ?? "Adjacent";
  }

  /**
   * @java ForEachGroup.eval(Context)
   *
   * Evaluates the move generator for each group of connected same-owner pieces.
   * Faithfully mirrors the Java implementation, using escape hatches to access
   * topology/containerState APIs that are not strongly typed in TS.
   */
  public override eval(context: Context): Move[] {
    const moves = new BaseMoves(super.then());

    // @java context.topology()
    const topology = (context as unknown as { topology(): unknown }).topology?.();

    // @java the SiteType — null means the board's default site (Java resolves
    // this in preprocess). getGraphElements(null) returns an empty collection
    // here, so maxIndexElement became 0 and the `site < maxIndexElement` filter
    // dropped EVERY owned site (sitesToCheck stayed empty → no groups → no
    // scores). Resolve the default like Difference/Sites do.
    const resolvedType: string =
      this.type ?? (context.board() as unknown as { defaultSite?: () => string }).defaultSite?.() ?? "Cell";

    // @java context.topology().getGraphElements(type).size()
    const maxIndexElement: number = topology
      ? (topology as unknown as { getGraphElements(t: unknown): { size(): number } })
          .getGraphElements(resolvedType)
          ?.size() ?? 0
      : (context.state.cells.length);

    // @java context.containerState(0)
    const cs = (context as unknown as { containerState(i: number): unknown }).containerState?.(0);

    // @java context.from() — save original from/to/region
    const origFrom = context._evalFrom;
    const origTo = context._evalTo;
    const origRegion = (context as unknown as { region(): unknown }).region?.();

    const who = context.state.mover;

    // @java context.state().owned().sites(playerId) — all sites with ≥1
    // component owned by the player. The TS Owned surface exposes positions(pid)
    // (a Location[][] by component); the union of its site()s IS sites(pid).
    // (The old code called owned.sites(i), which does not exist on this surface
    // — it threw, the exception was swallowed upstream, and every then-clause
    // group scan produced no moves, so group-scoring games never scored.)
    const owned = (context.state as unknown as {
      owned?: { positions(pid: number): Array<Array<{ site(): number }>> };
    }).owned;
    const ownedSitesOf = (pid: number): number[] => {
      if (!owned) {
        const out: number[] = [];
        for (let site = 0; site < context.state.cells.length; site++) {
          if (context.state.who(site) === pid && site < maxIndexElement) out.push(site);
        }
        return out;
      }
      const out: number[] = [];
      for (const byComp of owned.positions(pid)) {
        if (!byComp) continue;
        for (const loc of byComp) {
          const site = loc.site();
          if (site < maxIndexElement) out.push(site);
        }
      }
      return out;
    };

    // Build the list of sites to check.
    const sitesToCheck: number[] = [];

    if (this.condition !== null) {
      // With a condition, look at all players' owned sites.
      // @java for (int i = 0; i <= context.game().players().size(); i++)
      const numPlayers = context.game.numPlayers;
      for (let i = 0; i <= numPlayers; i++) {
        sitesToCheck.push(...ownedSitesOf(i));
      }
    } else {
      // Without a condition, look at the mover's owned sites.
      // @java for (int j = 0; j < context.state().owned().sites(who).size(); j++)
      sitesToCheck.push(...ownedSitesOf(who));
    }

    // @java final TIntArrayList sitesChecked = new TIntArrayList();
    const sitesChecked: number[] = [];

    for (let k = 0; k < sitesToCheck.length; k++) {
      const from = sitesToCheck[k]!;

      if (sitesChecked.includes(from)) continue;

      const groupSites: number[] = [];

      // @java context.setFrom(from); context.setTo(from);
      context._evalFrom = from;
      context._evalTo = from;

      // @java if ((who == cs.who(from, type) && condition == null) || (condition != null && condition.eval(context)))
      const csWhoFrom: number = cs
        ? (cs as unknown as { who(site: number, type: unknown): number }).who(from, resolvedType) ?? 0
        : context.state.who(from);

      if ((who === csWhoFrom && this.condition === null) ||
          (this.condition !== null && this.condition.eval(context))) {
        groupSites.push(from);
      }

      if (groupSites.length > 0) {
        context._evalFrom = from;
        const sitesExplored: number[] = [];
        let i = 0;

        // @java while (sitesExplored.size() != groupSites.size())
        while (sitesExplored.length !== groupSites.length) {
          const site = groupSites[i]!;

          // @java final List<AbsoluteDirection> directions = dirnChoice.convertToAbsolute(...)
          // @java final List<Step> steps = topology.trajectories().steps(type, siteElement.index(), type, direction)
          //
          // The TS topology.trajectories() is the 2-arg Trajectories (group/steps
          // take (site, dirName)). The previous 4-arg call shifted args so
          // directionByName saw a number, returned [], and EVERY group collapsed
          // to a singleton — and dirnChoice was ignored (hardcoded "Adjacent").
          // Honour the connection direction like CountGroups (default Adjacent).
          const traj = topology
            ? (topology as unknown as { trajectories(): { group?(s: number, d: string): number[] } | null }).trajectories()
            : null;
          const neighbors: number[] = traj && typeof traj.group === "function"
            ? traj.group(site, this.directionName)
            : getNeighborsFallback(context, site);

          for (const to of neighbors) {
            // @java if (groupSites.contains(to)) continue;
            if (groupSites.includes(to)) continue;

            // @java context.setTo(to);
            context._evalTo = to;

            // @java if ((condition == null && who == cs.who(to, type)) || (condition != null && condition.eval(context)))
            const csWhoTo: number = cs
              ? (cs as unknown as { who(site: number, type: unknown): number }).who(to, resolvedType) ?? 0
              : context.state.who(to);

            if ((this.condition === null && who === csWhoTo) ||
                (this.condition !== null && this.condition.eval(context))) {
              groupSites.push(to);
            }
          }

          sitesExplored.push(site);
          i++;
        }

        // @java context.setRegion(new Region(groupSites.toArray()));
        (context as unknown as { setRegion(r: unknown): void }).setRegion?.({ sites: groupSites });

        // @java final Moves movesApplied = movesToApply.eval(context);
        const movesApplied = this.movesToApply.eval(context);

        for (const m of movesApplied) {
          const saveFrom = context._evalFrom;
          const saveTo = context._evalTo;
          context._evalFrom = OFF;
          context._evalTo = OFF;
          // @java MoveUtilities.chainRuleCrossProduct(context, moves, null, m, false)
          moves.moves().push(m);
          context._evalTo = saveTo;
          context._evalFrom = saveFrom;
        }

        sitesChecked.push(...groupSites);
      }
    }

    context._evalTo = origTo;
    context._evalFrom = origFrom;

    // @java context.setRegion(origRegion)
    if (origRegion !== undefined) {
      (context as unknown as { setRegion(r: unknown): void }).setRegion?.(origRegion);
    }

    // @java if (then() != null) for each move add then moves.
    // Java evaluates the then AFTER the move applies — applyPostStateThen bakes
    // the post-state consequence actions in. The old code pushed into the FROZEN
    // Move.then array, which throws ("object is not extensible") the instant a
    // forEach-Group carries a then; evalDeferredThens silently swallows the
    // error, so the consequence (e.g. Manifold's per-group shape scoring:
    // (forEach Group … (then (… (set Score …))))) was DROPPED — every piece's
    // state stayed 0 and the game tied instead of producing the real winner.
    // Same recipe as the ForEachPiece fix.
    const thenClause = this.then();
    if (thenClause !== null) {
      return moves.moves().map((m) => applyPostStateThen(thenClause, context, m));
    }

    return moves.moves();
  }

  /**
   * @java ForEachGroup.isStatic()
   */
  public override isStatic(): boolean {
    return false;
  }

  /**
   * @java ForEachGroup.preprocess(Game)
   */
  public override preprocess(): void {
    super.preprocess();
    (this.movesToApply as unknown as { preprocess?(): void }).preprocess?.();
    if (this.condition !== null)
      (this.condition as unknown as { preprocess?(): void }).preprocess?.();
  }
}

/**
 * Fallback neighbour computation when the topology API is not available.
 * Uses a simple grid-based approach for square boards.
 */
function getNeighborsFallback(context: Context, site: number): number[] {
  const width: number = (context.game as unknown as { width?: number }).width ?? 0;
  const numSites = context.state.cells.length;
  if (width <= 0) return [];

  const neighbors: number[] = [];
  // 4-connected neighbors (orthogonal)
  const candidates = [site - width, site + width, site - 1, site + 1];
  for (const n of candidates) {
    if (n >= 0 && n < numSites) {
      // Avoid wrapping on left/right edges
      if (n === site - 1 && site % width === 0) continue;
      if (n === site + 1 && (site + 1) % width === 0) continue;
      neighbors.push(n);
    }
  }
  return neighbors;
}
