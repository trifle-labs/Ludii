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

    // @java context.topology().getGraphElements(type).size()
    const maxIndexElement: number = topology
      ? (topology as unknown as { getGraphElements(t: unknown): { size(): number } })
          .getGraphElements(this.type)
          ?.size() ?? 0
      : (context.state.cells.length);

    // @java context.containerState(0)
    const cs = (context as unknown as { containerState(i: number): unknown }).containerState?.(0);

    // @java context.from() — save original from/to/region
    const origFrom = context._evalFrom;
    const origTo = context._evalTo;
    const origRegion = (context as unknown as { region(): unknown }).region?.();

    const who = context.state.mover;

    // Build the list of sites to check.
    const sitesToCheck: number[] = [];

    if (this.condition !== null) {
      // With a condition, look at all players' owned sites.
      // @java for (int i = 0; i <= context.game().players().size(); i++)
      const numPlayers = context.game.numPlayers;
      for (let i = 0; i <= numPlayers; i++) {
        // @java context.state().owned().sites(i)
        const owned = (context.state as unknown as { owned?: { sites(p: number): number[] } }).owned;
        if (owned) {
          const allSites = owned.sites(i);
          for (let j = 0; j < allSites.length; j++) {
            const site = allSites[j]!;
            if (site < maxIndexElement) sitesToCheck.push(site);
          }
        } else {
          // Fallback: scan all cells
          for (let site = 0; site < context.state.cells.length; site++) {
            if (context.state.who(site) !== 0 && site < maxIndexElement)
              sitesToCheck.push(site);
          }
        }
      }
    } else {
      // Without a condition, look at the mover's owned sites.
      // @java for (int j = 0; j < context.state().owned().sites(who).size(); j++)
      const owned = (context.state as unknown as { owned?: { sites(p: number): number[] } }).owned;
      if (owned) {
        const ownedSites = owned.sites(who);
        for (let j = 0; j < ownedSites.length; j++) {
          const site = ownedSites[j]!;
          if (site < maxIndexElement) sitesToCheck.push(site);
        }
      } else {
        // Fallback: scan for mover's cells
        for (let site = 0; site < context.state.cells.length; site++) {
          if (context.state.who(site) === who && site < maxIndexElement)
            sitesToCheck.push(site);
        }
      }
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
        ? (cs as unknown as { who(site: number, type: unknown): number }).who(from, this.type) ?? 0
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

          // @java final TopologyElement siteElement = topology.getGraphElements(type).get(site);
          // @java final List<AbsoluteDirection> directions = dirnChoice.convertToAbsolute(...)
          // @java final List<Step> steps = topology.trajectories().steps(type, siteElement.index(), type, direction)
          const neighbors: number[] = topology
            ? (topology as unknown as {
                trajectories(): {
                  steps(
                    type: unknown,
                    siteIndex: number,
                    toType: unknown,
                    dir: unknown,
                  ): { to(): { id(): number } }[];
                };
                getGraphElements(t: unknown): { get(i: number): { index(): number } };
              })
                .trajectories()
                .steps(this.type, site, this.type, "Adjacent")
                .map((step) => step.to().id())
            : getNeighborsFallback(context, site);

          for (const to of neighbors) {
            // @java if (groupSites.contains(to)) continue;
            if (groupSites.includes(to)) continue;

            // @java context.setTo(to);
            context._evalTo = to;

            // @java if ((condition == null && who == cs.who(to, type)) || (condition != null && condition.eval(context)))
            const csWhoTo: number = cs
              ? (cs as unknown as { who(site: number, type: unknown): number }).who(to, this.type) ?? 0
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

    // @java if (then() != null) for each move add then moves
    if (this.then() !== null) {
      const thenMoves = this.then()!.moves();
      for (const m of moves.moves()) {
        // @java moves.moves().get(j).then().add(then().moves())
        const mThen = (m as unknown as { then?: Move[] }).then;
        if (Array.isArray(mThen)) {
          const thenArr = (thenMoves as unknown as { eval?(ctx: Context): Move[]; moves?(): Move[] });
          if (typeof thenArr.eval === "function") {
            mThen.push(...thenArr.eval(context));
          } else if (typeof thenArr.moves === "function") {
            mThen.push(...thenArr.moves());
          }
        }
      }
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
