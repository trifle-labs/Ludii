// @java Core/src/other/action/state/ActionSetState.java ActionSetState
/**
 * Java parity: Core/src/other/action/state/ActionSetState.java.
 * Sets the local "state" property of a site (e.g. orientation).
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export interface ActionSetStateOptions {
  readonly to: number;
  readonly state: number;
  /** Graph element type of `to` (Cell/Edge/Vertex). @java ActionSetState.type */
  readonly toType?: string | null;
  /**
   * True when `to` is a NON-default graph element (e.g. Edge on a Cell-default
   * board), so the state belongs in the typed channel, not the flat cell-sized
   * stateAt[]. Computed at move-construction time (needs Context/board).
   */
  readonly toTypedNonDefault?: boolean;
  /**
   * @java ActionSetState.level — the stack level whose state to set;
   * undefined/UNDEFINED(-1) = flat/top (the scalar stateAt write). When >= 0
   * the per-level stateStacks[to][level] channel is written instead
   * (ActionSetState.java:107-121 — the stacking + level path re-inserts the
   * level with the new state; Aj Sakakil's CapturedPiece marking).
   */
  readonly level?: number;
}

export class ActionSetState extends BaseAction {
  public static readonly TYPE: ActionType = "SetState";

  private readonly toIndex: number;
  private readonly stateValue: number;
  private readonly toSiteType: string | null;
  private readonly toTypedNonDefault: boolean;
  /** @java ActionSetState.level; -1 (UNDEFINED) = flat/no level. */
  private readonly levelIndex: number;

  public constructor(options: ActionSetStateOptions) {
    super();
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError("ActionSetState.to must be non-negative.");
    }
    this.toIndex = options.to;
    this.stateValue = options.state;
    this.toSiteType = options.toType ?? null;
    this.toTypedNonDefault = options.toTypedNonDefault ?? false;
    this.levelIndex = options.level ?? -1;
  }

  public override apply(state: State): State {
    if (this.toTypedNonDefault && this.toSiteType) {
      return state.withTypedAttr(this.toSiteType, this.toIndex, "state", this.stateValue);
    }
    // @java ActionSetState.java:107-121 — stacking + level != UNDEFINED writes
    // the state channel AT that level (per-level stateStacks), not the scalar.
    if (this.levelIndex >= 0) {
      // @java ActionSetState.java:107-108 — `if (level < cs.sizeStack(...))`:
      // an out-of-range level is a silent NO-OP. TS's withStateAtLevel padded
      // the stateStacks row with zeros to REACH the stale level (a sequential
      // then-pair: CapturedPiecesFollowCapturingPiece pops the stack, then
      // UnsetCapturingPieces' SetState targets the now-vanished level),
      // materializing a phantom entry that desynced stacks vs stateStacks
      // and surfaced ~1000 plies later (Aj family + Bul).
      if (this.levelIndex >= state.stackSize(this.toIndex)) return state;
      // @java ActionSetState.java:107-121 — a successful level write means the
      // real Java chunk at this site now holds fresh, authoritative content;
      // any shadow residual stashed by a PRIOR levelFrom vacate at this exact
      // physical depth (see the per-level-stack branch of ActionMove) is now
      // stale/moot and must not resurface for a LATER hand-entry landing here
      // (Aj family + Bul run their own explicit `(set State …)` cleanup —
      // see UnsetCapturingPiece — after a capture, exactly to prevent this).
      // Scoped to the exact level written: other levels of the same site may
      // carry their OWN, independent stashed residual (Boolik's site2: level
      // 0 and level 1 go dirty at different plies and must not clobber each
      // other's shadow entry).
      return state.withStateAtLevel(this.toIndex, this.levelIndex, this.stateValue).withResidualStateAtLevel(this.toIndex, this.levelIndex, 0);
    }
    // @java ActionSetState.java:107-121 — stacking game, level == UNDEFINED:
    // Java still calls `cs.setSite(...)`, which bottoms out in
    // HashedChunkStack.setState(trialState, val) (no level) →
    // ChunkStack.setState(val): `if (type >= 2 && size > 0)
    // state.setChunk(size - 1, val)`. A level-less SetState in a stacking
    // game writes the TOP of the site's chunk stack (index stackSize-1) — it
    // is NOT a separate flat channel, and it is NOT level 0. Routing it
    // through the flat-only `withStateAt` left `stateStacks[site]`
    // unmaterialized; a LATER per-level read at level 0 (`stateAtLevel`) then
    // fell back to that flat scalar and incorrectly saw the just-arrived TOP
    // piece's flag as if it were the untouched BOTTOM piece's own state
    // (Pahada Keliya ply240: P1 pushes onto P3's occupied site87, `(set
    // State at:87 1)` with no level must tag P1's own new top level, leaving
    // P3's level-0 state at its true untouched 0 — the corrupted read later
    // propagated through a long chain of plain carries and produced a false
    // ally-value decrement, which cascaded into a false move-legality
    // rejection). size <= 0 (nothing on the site yet) mirrors Java's
    // `size > 0` guard: the write silently no-ops.
    if (state.stackingGame) {
      const size = state.stackSize(this.toIndex);
      // @java ChunkStack.setState(val): `if (type >= 2 && size > 0)` — an
      // empty site's level-less SetState is a true Java no-op (no chunk
      // write at all), so no residual is invalidated here either; any
      // previously-stashed shadow entry stays exactly as it was.
      if (size <= 0) return state;
      return state.withStateAtLevel(this.toIndex, size - 1, this.stateValue).withResidualStateAtLevel(this.toIndex, size - 1, 0);
    }
    return state.withStateAt(this.toIndex, this.stateValue).withResidualStateAtLevel(this.toIndex, 0, 0);
  }

  public override actionType(): ActionType {
    return ActionSetState.TYPE;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override state(): number {
    return this.stateValue;
  }
}
