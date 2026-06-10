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
import { Between as IteratorBetween, From as IteratorFrom, To as IteratorTo } from "../../../../../functions/ints1to1/iterator/Iterator1to1.js";
import { IsEnemy } from "../../../../../functions/booleans/is/player1to1/IsEnemy.js";
import { IsFriend } from "../../../../../functions/booleans/is/player1to1/IsFriend.js";
import { relationToAbsoluteDirection, type RelationType } from "../../../../../types/board/RelationType.js";
import type { From } from "../../../../../util/moves/From1to1.js";
import type { Between } from "../../../../../util/moves/Between1to1.js";
import type { To } from "../../../../../util/moves/To1to1.js";
import type { Piece1to1 } from "../../../../../util/moves/Piece1to1.js";
import { Remove } from "./Remove.js";
import { normaliseFriendAtPlaceholder } from "./EffectCtorAdapters.js";

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
    withPiece?: Piece1to1 | null,
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
      _radials?: Array<Record<string, Array<{ ray: number[]; opposite: number[] }>>>;
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

    const cellRadials = radials[from];
    if (!cellRadials) return [];

    const dirsForFrom = cellRadials[this.dirnChoice] ?? [];
    const result: Move[] = [];

    for (const { ray } of dirsForFrom) {
      if (ray.length < 2) continue;

      const locationUnderThreat = ray[1]!;

      // @java Surround.java:149 — isTarget check
      (ctx as unknown as { _evalBetween?: number })._evalBetween = locationUnderThreat;
      if (!this.targetRule.eval(ctx)) continue;

      // @java Surround.java:152 — check neighbours of threatened piece
      let except = 0;
      let withPieceOk = withPiece === -1; // already ok if no piece required

      const threatRadials = radials[locationUnderThreat];
      if (threatRadials) {
        const threatDirs = threatRadials[this.dirnChoice] ?? [];
        outer: for (const { ray: tRay } of threatDirs) {
          if (tRay.length < 2) { withPieceOk = true; continue; }
          const friendSite = tRay[1]!;
          if (friendSite === from) {
            withPieceOk = true;
            continue;
          }
          // @java: isFriend check
          (ctx as unknown as { _evalTo?: number })._evalTo = friendSite;
          const isFriend = this.friendRule.eval(ctx);

          if (!isFriend) {
            except++;
          }

          // @java: withPiece check
          if (!withPieceOk) {
            const whatFriend = state.whatAtSite(friendSite);
            if (withPiece === -1 || withPiece === whatFriend) withPieceOk = true;
          }

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
