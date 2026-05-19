/**
 * Java parity:
 * - Core/src/other/action/move/ActionAdd.java — the "add one or more
 *   pieces to a site" action.
 *
 * Subset ported: deterministic data members (to / what / state /
 * rotation / value / count / onStack / level) plus the core
 * `apply(state) → state` semantics. The hidden-information bookkeeping
 * (`previousHidden*` fields and the per-player visibility arrays) is
 * deferred because no game in the MVE corpus uses it; once Trial
 * undo lands, those fields can be filled in.
 */

import type { State } from "../state.js";
import { ACTION_OFF, ACTION_UNDEFINED, BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";
import type { SiteType } from "./site-type.js";

export interface ActionAddOptions {
  /** Target site index. */
  readonly to: number;
  /** Piece/component index to place (i.e. the owner index in our MVE). */
  readonly what: number;
  /** Repeat count. Defaults to 1. */
  readonly count?: number;
  readonly state?: number;
  readonly rotation?: number;
  readonly value?: number;
  readonly onStack?: boolean;
  readonly type?: SiteType;
}

export class ActionAdd extends BaseAction {
  public static readonly TYPE: ActionType = "Add";

  private readonly toIndex: number;
  private readonly whatIndex: number;
  private readonly countValue: number;
  private readonly stateValue: number;
  private readonly rotationValue: number;
  private readonly valueValue: number;
  private readonly onStack: boolean;
  private readonly siteType: SiteType;
  /** Defaults to Constants.UNDEFINED on the Java side. */
  private level: number = ACTION_UNDEFINED;

  public constructor(options: ActionAddOptions) {
    super();
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError(`ActionAdd.to must be a non-negative integer.`);
    }
    if (!Number.isInteger(options.what) || options.what < 1) {
      throw new RangeError(
        `ActionAdd.what must be a positive integer (1-based owner).`,
      );
    }
    this.toIndex = options.to;
    this.whatIndex = options.what;
    this.countValue = options.count ?? 1;
    this.stateValue = options.state ?? ACTION_OFF;
    this.rotationValue = options.rotation ?? ACTION_OFF;
    this.valueValue = options.value ?? ACTION_OFF;
    this.onStack = options.onStack ?? false;
    this.siteType = options.type ?? "Cell";
  }

  public override apply(state: State): State {
    return state.withCell(this.toIndex, this.whatIndex);
  }

  public override actionType(): ActionType {
    return ActionAdd.TYPE;
  }

  public override to(): number {
    return this.toIndex;
  }

  public override what(): number {
    return this.whatIndex;
  }

  public override who(): number {
    // For an Add action, the placing player is the piece owner: the
    // MVE engine uses 1-based owner indices and that's identical to
    // `what`. The Java implementation tracks `who` separately so it
    // can support neutral pieces; the MVE doesn't yet.
    return this.whatIndex;
  }

  public override count(): number {
    return this.countValue;
  }

  public override state(): number {
    return this.stateValue;
  }

  public override rotation(): number {
    return this.rotationValue;
  }

  public override value(): number {
    return this.valueValue;
  }

  public override isStacking(): boolean {
    return this.onStack;
  }

  public override fromType(): SiteType {
    return this.siteType;
  }

  public override toType(): SiteType {
    return this.siteType;
  }

  /** Java parity: `getLevel()`. Returns `-1` until set. */
  public getLevel(): number {
    return this.level;
  }

  public setLevel(level: number): void {
    this.level = level;
  }
}
