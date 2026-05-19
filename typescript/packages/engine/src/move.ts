/**
 * Java parity:
 * - Core/src/other/move/Move.java — the conceptual ancestor. A Java Move
 *   owns a sequence of Actions whose composition realises the move's
 *   effect; the first action is the "decision" action. The TS port now
 *   mirrors that: when `actions` is provided, `applyTo` folds them in
 *   order; otherwise it falls back to the legacy `siteIndices` /
 *   `placedOwner` shortcut so existing call-sites keep working.
 */

import type { Action } from "./action/index.js";
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
}
