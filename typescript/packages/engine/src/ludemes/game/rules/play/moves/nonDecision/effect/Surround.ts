// @java Core/src/game/rules/play/moves/nonDecision/effect/Surround.java

/**
 * Is used to apply an effect to all the sites surrounded in a specific direction.
 *
 * @java game/rules/play/moves/nonDecision/effect/Surround.java
 *
 * Java: public final class Surround extends Effect
 *   - startLocationFn: IntFunction — pivot/from location
 *   - dirnChoice: AbsoluteDirection — direction (default: Adjacent)
 *   - targetRule: BooleanFunction — identifies pieces to surround
 *   - friendRule: BooleanFunction — identifies surrounding friends
 *   - exception: IntFunction — number of exceptions allowed (default: 0)
 *   - withAtLeastPiece: IntFunction | null — required piece type present
 *   - effect: Moves — effect to apply on surrounded pieces
 *
 * eval(): for each radial from the pivot, checks if the adjacent piece is a
 * valid target, then verifies it is fully surrounded by friends (or with
 * `exception` non-friends allowed), then applies the effect.
 */

import type { Context } from "../../../../../../../context.js";
import { Move } from "../../../../../../../move.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../base.js";
import { Effect } from "./Effect.js";
import type { ThenLike } from "../../Moves.js";
import type { Action } from "../../../../../../../action/index.js";
import type { Then } from "./Then.js";
import { IntConstant } from "../../../../../functions/ints/IntConstant.js";
import { Between as IteratorBetween } from "../../../../../functions/ints/iterator/Between.js";
import { From as IteratorFrom } from "../../../../../functions/ints/iterator/From.js";
import { To as IteratorTo } from "../../../../../functions/ints/iterator/To.js";
import { IsEnemy } from "../../../../../functions/booleans/is/player/IsEnemy.js";
import { IsFriend } from "../../../../../functions/booleans/is/player/IsFriend.js";
import { relationToAbsoluteDirection, type RelationType } from "../../../../../types/board/RelationType.js";
import type { From } from "../../../../../util/moves/From.js";
import type { Between } from "../../../../../util/moves/Between.js";
import type { To } from "../../../../../util/moves/To.js";
import type { Piece } from "../../../../../util/moves/Piece.js";
import { Remove } from "./Remove.js";
import { normaliseFriendAtPlaceholder } from "./EffectCtorAdapters.js";
import type { CellFlatRadials } from "../../../../../../topology-radials.js";
import { radialsForDirection } from "../../../../../../topology-radials.js";

/**
 * Resolve all directed radials (as bare step-arrays) at `site` in `dirnChoice`,
 * mirroring Custodial: prefer the graph trajectories (hex/tri/graph boards), then
 * fall back to the index-based CellFlatRadials. @java Surround.java uses
 * graph.trajectories().radials(type, from, dirnChoice). The previous code indexed
 * the CellFlatRadials object with the direction STRING (cellRadials[dirnChoice]),
 * which is always undefined ({axes:[…]} has no such key) — so Surround returned []
 * unconditionally and no surround capture ever fired (Bizingo/Castello).
 */
function flattenAxes(
  axes: readonly { ray: readonly number[]; opposite: readonly number[] }[],
): readonly (readonly number[])[] {
  return axes.flatMap(({ ray, opposite }) => [ray, opposite]);
}

function dirsAt(
  ctxAny: { _trajectories?: { radialsByName(site: number, dir: string): number[][] } | null },
  radials: readonly CellFlatRadials[],
  site: number,
  dirnChoice: string,
): readonly (readonly number[])[] {
  const traj = ctxAny._trajectories ?? null;
  if (traj) {
    const directed = traj.radialsByName(site, dirnChoice);
    if (directed.length > 0) return directed;
  }
  const cellRadials = radials[site];
  if (!cellRadials) return [];
  return flattenAxes(radialsForDirection(cellRadials, dirnChoice));
}

/**
 * Surround effect — applies an effect to surrounded pieces.
 *
 * @java game/rules/play/moves/nonDecision/effect/Surround.java
 */
export class Surround extends Effect {
  /** @java Surround.startLocationFn */
  private readonly startLocationFn: IntFunction;

  /** @java Surround.dirnChoice */
  private readonly dirnChoice: string;

  /** @java Surround.targetRule */
  private readonly targetRule: BooleanFunction;

  /** @java Surround.friendRule */
  private readonly friendRule: BooleanFunction;

  /** @java Surround.exception */
  private readonly exception: IntFunction;

  /** @java Surround.withAtLeastPiece */
  private readonly withAtLeastPiece: IntFunction | null;

  /** @java Surround.effect */
  private readonly effect: MovesFunction;

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Surround.java — constructor
   */
  public constructor(
    from?: From | null,
    relation?: RelationType | null,
    between?: Between | null,
    to?: To | null,
    except?: IntFunction | null,
    withPiece?: Piece | null,
    then?: Then | null,
  ) {
    super((then ?? null) as unknown as ThenLike | null);
    this.startLocationFn = from?.loc() ?? new IteratorFrom();
    this.dirnChoice = relation == null ? "Adjacent" : relationToAbsoluteDirection(relation);
    this.targetRule = between?.condition() ?? new IsEnemy(new IteratorBetween(), null);
    this.friendRule = normaliseFriendAtPlaceholder(to?.cond() ?? new IsFriend(new IteratorTo(), null));
    this.effect = between?.effect() ?? new Remove({ locationFn: new IteratorBetween() });
    this.exception = except ?? new IntConstant(0);
    this.withAtLeastPiece = withPiece?.component() ?? null;
  }

  // -------------------------------------------------------------------------

  /**
   * @java game/rules/play/moves/nonDecision/effect/Surround.java — eval(Context)
   *
   * Java lines 119-198:
   *   1. Resolve from = startLocationFn.eval(context).
   *   2. For each radial from `from` in `dirnChoice`:
   *      a. Check if the adjacent site (steps[1]) satisfies targetRule.
   *      b. For each radial from that target site, check that each neighbour
   *         is a friend (or count exceptions).
   *      c. If exceptions ≤ nbExcept and withPieceOk: apply effect.
   */
  public override eval(ctx: Context): Move[] {
    const from = this.startLocationFn.eval(ctx);
    if (from < 0) return [];

    const ctxAny = ctx as unknown as {
      _radials?: readonly CellFlatRadials[];
      _trajectories?: { radialsByName(site: number, dir: string): number[][] } | null;
    };
    const radials = ctxAny._radials;
    if (!radials) {
      throw new Error("not yet wired: Surround.eval requires _radials topology");
    }

    const state = ctx.state;
    const mover = state.mover;
    const nbExcept = this.exception.eval(ctx);
    const withPiece = this.withAtLeastPiece !== null
      ? this.withAtLeastPiece.eval(ctx)
      : -1;

    // Save context scratch
    const evalBetweenOrig = (ctx as unknown as { _evalBetween?: number })._evalBetween ?? -1;
    const evalFromOrig = (ctx as unknown as { _evalFrom?: number })._evalFrom ?? -1;
    const evalToOrig = (ctx as unknown as { _evalTo?: number })._evalTo ?? -1;

    const dirsForFrom = dirsAt(ctxAny, radials, from, this.dirnChoice);
    const result: Move[] = [];

    for (const ray of dirsForFrom) {
      if (ray.length < 2) continue;

      const locationUnderThreat = ray[1]!;

      // @java Surround.java:149 — isTarget check
      (ctx as unknown as { _evalBetween?: number })._evalBetween = locationUnderThreat;
      if (!this.targetRule.eval(ctx)) continue;

      // @java Surround.java:153-155 — check neighbours of threatened piece.
      // withPieceOk starts false (Java line 155): it becomes true only when SOME
      // surrounding site (the pivot included) actually holds the required piece.
      let except = 0;
      let withPieceOk = false;

      {
        const threatDirs = dirsAt(ctxAny, radials, locationUnderThreat, this.dirnChoice);
        outer: for (const tRay of threatDirs) {
          // Java accesses steps()[1] directly; a direction with no neighbour yields
          // no radial, so steps().length is always >= 2 here. Skip defensively.
          if (tRay.length < 2) continue;
          const friendSite = tRay[1]!;
          // @java Surround.java:162-164 — isThreat = (steps<2) || friendPieceSite==from
          // || isFriend(friendPieceSite). A non-threat (a real non-friend that isn't
          // the pivot) counts as an exception.
          let isThreat: boolean;
          if (friendSite === from) {
            isThreat = true;
          } else {
            (ctx as unknown as { _evalTo?: number })._evalTo = friendSite;
            isThreat = this.friendRule.eval(ctx);
          }
          if (!isThreat) except++;

          // @java Surround.java:167-170 — the withPiece test runs for EVERY
          // surrounding site, the pivot included. The prior code set withPieceOk
          // unconditionally when friendSite===from, so a surround led by a piece
          // that ISN'T the required `with:` piece wrongly qualified (Bizingo's
          // (surround … with:(piece (id "Jarl" Mover))) fired off a Thrall).
          const whatFriend = state.whatAtSite(friendSite);
          if (withPiece === -1 || withPiece === whatFriend) withPieceOk = true;

          if (except > nbExcept) break outer;
        }
      }

      if (except <= nbExcept && withPieceOk) {
        // @java: context.setBetween(locationUnderThreat); chainRuleCrossProduct(...)
        (ctx as unknown as { _evalBetween?: number })._evalBetween = locationUnderThreat;
        const effectMoves = this.effect.eval(ctx);
        for (const em of effectMoves) {
          const allActions: Action[] = [...em.actions];
          result.push(new Move({
            id: `surround:${mover}:${from}:${locationUnderThreat}`,
            label: `Surround(from=${from},between=${locationUnderThreat})`,
            siteIndices: [from, locationUnderThreat],
            mover,
            placedOwner: mover,
            actions: allActions,
            deferredThens: this.then() != null
              ? [{ eval: (c: Context): Move[] => {
                  const r = (this.then()!.moves() as unknown as { eval(c: Context): Move[] | { moves(): Move[] } }).eval(c);
                  return Array.isArray(r) ? r : r.moves();
                } }]
              : [],
          }));
        }
      }
    }

    // Restore context scratch
    (ctx as unknown as { _evalBetween?: number })._evalBetween = evalBetweenOrig;
    (ctx as unknown as { _evalFrom?: number })._evalFrom = evalFromOrig;
    (ctx as unknown as { _evalTo?: number })._evalTo = evalToOrig;

    return result;
  }

  // -------------------------------------------------------------------------

  /** @java Surround.isStatic() */
  public override isStatic(): boolean {
    return false;
  }
}
