/**
 * Java parity:
 * - Core/src/other/move/Move.java — the conceptual ancestor. A Java Move
 *   owns a sequence of Actions whose composition realises the move's
 *   effect; the first action is the "decision" action. The TS port now
 *   mirrors that: when `actions` is provided, `applyTo` folds them in
 *   order; otherwise it falls back to the legacy `siteIndices` /
 *   `placedOwner` shortcut so existing call-sites keep working.
 */

import {
  ACTION_OFF,
  type Action,
  type ActionType,
  type SiteType,
} from "./action/index.js";
import type { State } from "./state.js";

export interface MoveInit {
  readonly id: string;
  readonly label: string;
  readonly siteIndices: readonly number[];
  readonly mover: number;
  readonly placedOwner: number;
  /** Optional Java-parity action sequence. */
  readonly actions?: readonly Action[];
}

export class Move {
  public readonly id: string;
  public readonly label: string;
  public readonly siteIndices: readonly number[];
  public readonly mover: number;
  public readonly placedOwner: number;
  public readonly actions: readonly Action[];

  public constructor(init: MoveInit) {
    if (init.siteIndices.length === 0) {
      throw new Error("Move must touch at least one site.");
    }
    if (!Number.isInteger(init.mover) || init.mover < 1) {
      throw new Error(`Mover must be a 1-based integer; got ${init.mover}.`);
    }
    if (!Number.isInteger(init.placedOwner) || init.placedOwner < 1) {
      throw new Error(
        `placedOwner must be a 1-based integer; got ${init.placedOwner}.`,
      );
    }
    this.id = init.id;
    this.label = init.label;
    this.siteIndices = Object.freeze([...init.siteIndices]);
    this.mover = init.mover;
    this.placedOwner = init.placedOwner;
    this.actions = Object.freeze(init.actions ? [...init.actions] : []);
  }

  public applyTo(state: State): State {
    if (this.actions.length > 0) {
      let next = state;
      for (const action of this.actions) {
        next = action.apply(next);
      }
      return next;
    }
    const site = this.siteIndices[0];
    if (site === undefined) {
      throw new Error("Move missing target site.");
    }
    return state.withCell(site, this.placedOwner);
  }

  /** Java parity: `Move.decisionAction()` — the first action, if any. */
  public decisionAction(): Action | undefined {
    return this.actions[0];
  }

  /**
   * Java-parity accessors that delegate to the decision action when one
   * is present. The Java `Move` reads these straight off its first
   * Action; we mirror that, falling back to MVE defaults so callers
   * built from the legacy `siteIndices` path still see sensible values.
   */
  public actionType(): ActionType | undefined {
    return this.decisionAction()?.actionType();
  }

  public from(): number {
    return this.decisionAction()?.from() ?? ACTION_OFF;
  }

  public to(): number {
    return this.decisionAction()?.to() ?? this.siteIndices[0] ?? ACTION_OFF;
  }

  public what(): number {
    return this.decisionAction()?.what() ?? this.placedOwner;
  }

  public who(): number {
    return this.decisionAction()?.who() ?? this.mover;
  }

  public count(): number {
    return this.decisionAction()?.count() ?? 1;
  }

  public state(): number {
    return this.decisionAction()?.state() ?? ACTION_OFF;
  }

  public value(): number {
    return this.decisionAction()?.value() ?? ACTION_OFF;
  }

  public rotation(): number {
    return this.decisionAction()?.rotation() ?? ACTION_OFF;
  }

  public fromType(): SiteType {
    return this.decisionAction()?.fromType() ?? "Cell";
  }

  public toType(): SiteType {
    return this.decisionAction()?.toType() ?? "Cell";
  }

  public isPass(): boolean {
    return this.decisionAction()?.isPass() ?? false;
  }

  public isForfeit(): boolean {
    return this.decisionAction()?.isForfeit() ?? false;
  }

  public isSwap(): boolean {
    return this.decisionAction()?.isSwap() ?? false;
  }

  public isVote(): boolean {
    return this.decisionAction()?.isVote() ?? false;
  }

  public isPropose(): boolean {
    return this.decisionAction()?.isPropose() ?? false;
  }

  public isOtherMove(): boolean {
    return this.decisionAction()?.isOtherMove() ?? false;
  }
}
