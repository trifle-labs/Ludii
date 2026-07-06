// @java Core/src/game/rules/play/moves/nonDecision/effect/set/direction/SetRotation.java

/**
 * Changes the direction (rotation) of a piece.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/direction/SetRotation.java
 * @author Eric.Piette and cambolbro
 *
 * @remarks This ludeme applies to games with oriented pieces, e.g. Ploy.
 */

import type { Context } from "../../../../../../../../../context.js";
import type { Move } from "../../../../../../../../../move.js";
import type { IntFunction, BooleanFunction, MovesFunction } from "../../../../../../../../base.js";
import { ActionSetRotation } from "../../../../../../../../../action/action-set-rotation.js";
import { Move as LudiiMove } from "../../../../../../../../../move.js";
import type { SiteType } from "../../../../../../../../../action/site-type.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * SetRotation — changes the direction of a piece.
 *
 * Java parity (SetRotation.eval lines 100-167):
 *   1. site = siteFn.eval(context); if OFF return empty.
 *   2. For each directionFn in directionsFn: emit ActionSetRotation(type, site, direction).
 *   3. If previous != null || next != null: read currentRotation and maxRotation,
 *      optionally emit rotate-left and rotate-right actions.
 *   4. Attach then consequences; store MovesLudeme.
 *
 * @java game/rules/play/moves/nonDecision/effect/set/direction/SetRotation.java
 */
export class SetRotation implements MovesFunction {
  /** Which site. @java SetRotation.siteFn */
  private readonly siteFn: IntFunction;

  /** Which set of directions. @java SetRotation.directionsFn */
  private readonly directionsFn: IntFunction[] | null;

  /** Previous direction (rotate left). @java SetRotation.previous */
  private readonly previous: BooleanFunction;

  /** Next direction (rotate right). @java SetRotation.next */
  private readonly next: BooleanFunction;

  /** Cell/Edge/Vertex. @java SetRotation.type */
  private readonly type: SiteType | null;

  /** Optional subsequent moves. @java SetRotation.then() */
  private readonly thenMoves: MovesFunction | null;

  /**
   * @java SetRotation(To, IntFunction[], IntFunction, BooleanFunction, BooleanFunction, Then)
   *
   * @param siteFn       The site to rotate (extracted from `to` parameter).
   * @param type         Cell/Edge/Vertex type (from `to` parameter).
   * @param directionsFn The set of possible new rotations [null → use previous/next].
   * @param previous     Allow rotate left [true].
   * @param next         Allow rotate right [true].
   * @param thenMoves    Moves applied after this move.
   */
  public constructor(
    siteFn: IntFunction,
    type: SiteType | null,
    directionsFn: IntFunction[] | null,
    previous: BooleanFunction | null,
    next: BooleanFunction | null,
    thenMoves: MovesFunction | null = null,
  ) {
    this.siteFn = siteFn;
    this.type = type;
    this.directionsFn = directionsFn;
    // Java parity: (previous == null) ? new BooleanConstant(true) : previous
    this.previous = previous ?? { eval: () => true };
    // Java parity: (next == null) ? new BooleanConstant(true) : next
    this.next = next ?? { eval: () => true };
    this.thenMoves = thenMoves;
  }

  /**
   * @java SetRotation.eval(Context)
   *
   * Java parity (SetRotation.eval lines 100-167).
   */
  public eval(ctx: Context): Move[] {
    // @java SetRotation.java:105 — site = siteFn.eval(context)
    const site = this.siteFn.eval(ctx);

    // @java SetRotation.java:107-108 — if (site == Constants.OFF) return moves
    if (site === OFF) {
      return [];
    }

    const mover = ctx.state.mover;
    const moves: Move[] = [];

    // @java SetRotation.java:110-124 — directionsFn loop
    if (this.directionsFn != null) {
      for (const directionFn of this.directionsFn) {
        const direction = directionFn.eval(ctx);
        const actionRotation = new ActionSetRotation({ to: site, rotation: direction });
        // @java ActionSetRotation.setDecision(isDecision()) — isDecision() not tracked here
        const move = new LudiiMove({
          id: `setRotation:${site}:${direction}`,
          label: `SetRotation(site=${site}, rotation=${direction})`,
          siteIndices: [site],
          mover,
          placedOwner: mover,
          actions: [actionRotation],
          fromNonDecisionSite: site,
          toNonDecisionSite: site,
        });
        moves.push(move);
      }
    }

    // @java SetRotation.java:126-155 — previous/next branch
    if (this.directionsFn == null || this.directionsFn.length === 0) {
      // @java SetRotation.java:128 — currentRotation = context.containerState(...).rotation(site, type)
      const currentRotation = this._currentRotation(ctx, site);
      // @java SetRotation.java:129 — maxRotation = context.game().maximalRotationStates() - 1
      const maxRotation = this._maxRotation(ctx);

      // @java SetRotation.java:131-140 — previous
      if (this.previous.eval(ctx)) {
        const newRotation = currentRotation > 0 ? currentRotation - 1 : maxRotation;
        const actionRotation = new ActionSetRotation({ to: site, rotation: newRotation });
        const move = new LudiiMove({
          id: `setRotation:${site}:prev:${newRotation}`,
          label: `SetRotation(site=${site}, rotation=${newRotation})`,
          siteIndices: [site],
          mover,
          placedOwner: mover,
          actions: [actionRotation],
          fromNonDecisionSite: site,
          toNonDecisionSite: site,
        });
        moves.push(move);
      }

      // @java SetRotation.java:142-152 — next
      if (this.next.eval(ctx)) {
        const newRotation = currentRotation < maxRotation ? currentRotation + 1 : 0;
        const actionRotation = new ActionSetRotation({ to: site, rotation: newRotation });
        const move = new LudiiMove({
          id: `setRotation:${site}:next:${newRotation}`,
          label: `SetRotation(site=${site}, rotation=${newRotation})`,
          siteIndices: [site],
          mover,
          placedOwner: mover,
          actions: [actionRotation],
          fromNonDecisionSite: site,
          toNonDecisionSite: site,
        });
        moves.push(move);
      }
    }

    // @java SetRotation.java:158-165 — attach then consequences; store MovesLudeme
    if (this.thenMoves != null && moves.length > 0) {
      const thenList = this.thenMoves.eval(ctx);
      if (thenList.length > 0) {
        return moves.map(m => new LudiiMove({
          id: m.id,
          label: m.label,
          siteIndices: m.siteIndices,
          mover: m.mover,
          placedOwner: m.placedOwner,
          actions: m.actions,
          then: thenList,
          deferredThens: m.deferredThens,
          moveAgain: m.moveAgain,
          fromNonDecisionSite: m.fromNonDecisionSite,
          toNonDecisionSite: m.toNonDecisionSite,
        }));
      }
    }

    return moves;
  }

  // -------------------------------------------------------------------------

  /**
   * @java SetRotation.canMoveTo(Context, int) → false
   */
  public canMoveTo(_ctx: Context, _target: number): boolean {
    return false;
  }

  /**
   * @java SetRotation.isStatic()
   *
   * Java parity:
   *   boolean isStatic = siteFn.isStatic() | previous.isStatic() | next.isStatic();
   *   if (directionsFn != null) for each: isStatic |= direction.isStatic();
   *   return isStatic;
   */
  public isStatic(): boolean {
    let isStatic = (this.siteFn as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    isStatic = isStatic || ((this.previous as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false);
    isStatic = isStatic || ((this.next as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false);
    if (this.directionsFn != null) {
      for (const d of this.directionsFn) {
        isStatic = isStatic || ((d as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false);
      }
    }
    return isStatic;
  }

  /**
   * @java SetRotation.toEnglish(Game)
   */
  public toEnglish(): string {
    let directionsString = "all directions";
    if (this.directionsFn != null) {
      directionsString = "[" + this.directionsFn.map(d => String(d)).join(",") + "]";
    }
    const typeName = this.type ?? "cell";
    const thenString = this.thenMoves != null ? ` then ${this.thenMoves}` : "";
    return `set the rotation of ${String(typeName).toLowerCase()} ${this.siteFn} to ${directionsString}${thenString}`;
  }

  // -------------------------------------------------------------------------

  /**
   * Helper: read current rotation from containerState.
   * @java context.containerState(context.containerId()[site]).rotation(site, type)
   */
  private _currentRotation(ctx: Context, site: number): number {
    // @java context.containerState(cid).rotation(site, type) — the engine
    // state keeps rotations in the flat rotationAt channel. The container
    // path below is absent on engine contexts, so this always returned 0 and
    // the previous/next candidates were forever 0±1 — Ploy's recorded
    // rotations (current±1 of the REAL facing) never matched a candidate,
    // the harness fell back to an arbitrary pick, and every piece's facing
    // drifted within a few plies.
    const rotArr = (ctx.state as unknown as { rotationAt?: readonly number[] }).rotationAt;
    if (rotArr && rotArr[site] !== undefined) return rotArr[site] ?? 0;
    const rotFn = (ctx.state as unknown as { rotationAtSite?: (s: number) => number }).rotationAtSite;
    if (typeof rotFn === "function") return rotFn.call(ctx.state, site);
    const ctxAny = ctx as unknown as {
      containerId?: number[];
      containerState?: (id: number) => { rotation?: (site: number, type: SiteType | null) => number };
    };
    if (ctxAny.containerState && ctxAny.containerId) {
      const containerId = ctxAny.containerId[site] ?? 0;
      return ctxAny.containerState(containerId)?.rotation?.(site, this.type) ?? 0;
    }
    return 0;
  }

  /**
   * Helper: get maximal rotation states.
   * @java context.game().maximalRotationStates() - 1
   */
  private _maxRotation(ctx: Context): number {
    const gameAny = ctx.game as unknown as { maximalRotationStates?: () => number };
    return (gameAny.maximalRotationStates?.() ?? 1) - 1;
  }
}
