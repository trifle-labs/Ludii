// @java Core/src/other/action/move/move/ActionMoveTopPiece.java — apply()
/**
 * Moves a SINGLE mancala seed from an origin hole to a target hole, keeping the
 * per-site count in sync.
 *
 * A `(sow)` picks up the seeds from an origin and drops them one-by-one around
 * a track. Java models each drop as its own `ActionMoveTopPiece(from=origin,
 * to=hole)` — a single-seed move that decrements the origin's count and
 * increments the target's. The crucial property (ActionMoveTopPiece.java:374-376):
 *
 *     // If the origin is empty we do not apply this action.
 *     if (csFrom.what(from) == 0 && csFrom.count(from) == 0)
 *         return this;
 *
 * i.e. a per-seed move whose origin has already been drained is a **no-op**.
 *
 * This matters because Java routinely applies a sow's action list MORE THAN ONCE:
 * `Do.eval` (Do.java prependPreMoves) prepends the sow (its `prior`) to EVERY
 * move produced by its `next:`, and `Move.apply` (Move.java:519-541) applies ALL
 * of a consequent's moves. So a `(do (sow …) next:(and { (pass) (forEach …) }))`
 * applies the sow once per `next:` result move. Java stays correct because the
 * second (and later) applications find the origin already emptied and no-op via
 * the guard above.
 *
 * TS previously modelled a sow as a bulk `ActionAddCount(origin, -count)` drain
 * plus one unconditional `ActionAddCount(hole, +1)` deposit per drop. On a second
 * application the drain clamps to 0 (no-op) but the deposits fire again,
 * fabricating phantom seeds (Duene et al.). Mirroring Java's per-seed transfer —
 * with the empty-origin no-op — makes re-application idempotent exactly as Java's.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";
import { ActionAddCount } from "./action-add-count.js";

export class ActionSowSeed extends BaseAction {
  public static readonly TYPE: ActionType = "Move";

  private readonly fromIndex: number;
  private readonly toIndex: number;
  private readonly seedOwner: number;
  private readonly seedWhat: number;

  public constructor(fromIndex: number, toIndex: number, seedOwner: number, seedWhat = 0) {
    super();
    this.fromIndex = fromIndex;
    this.toIndex = toIndex;
    this.seedOwner = seedOwner;
    this.seedWhat = seedWhat;
  }

  public override apply(state: State): State {
    if (this.fromIndex < 0 || this.toIndex < 0) return state;
    // @java ActionMoveTopPiece.apply lines 374-376 — an origin with no seed to
    // give is a no-op. This is what makes a re-applied sow idempotent (Java
    // relies on the same guard when Do/Move re-applies the sow per next-move).
    if (state.countAtSite(this.fromIndex) <= 0) return state;
    // @java per-seed transfer: origin -1 (removed at count 0), target +1. Reuse
    // ActionAddCount's count/owner/what/state bookkeeping for each half so the
    // "count → 0 clears what/state" and "seed component stamping" semantics stay
    // identical to a normal sow deposit.
    let s = new ActionAddCount(this.fromIndex, -1, this.seedOwner, this.seedWhat).apply(state);
    s = new ActionAddCount(this.toIndex, 1, this.seedOwner, this.seedWhat).apply(s);
    return s;
  }

  public override actionType(): ActionType {
    return ActionSowSeed.TYPE;
  }
  public override from(): number {
    return this.fromIndex;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override count(): number {
    return 1;
  }
}
