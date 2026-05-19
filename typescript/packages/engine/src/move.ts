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
import { ConceptSet } from "./concept.js";
import type { State } from "./state.js";

export interface MoveInit {
  readonly id: string;
  readonly label: string;
  readonly siteIndices: readonly number[];
  readonly mover: number;
  readonly placedOwner: number;
  /** Optional Java-parity action sequence. */
  readonly actions?: readonly Action[];
  /** Java parity: subsequent moves to play after this one (the `then` field). */
  readonly then?: readonly Move[];
}

export class Move {
  public readonly id: string;
  public readonly label: string;
  public readonly siteIndices: readonly number[];
  public readonly mover: number;
  public readonly placedOwner: number;
  public readonly actions: readonly Action[];
  // biome-ignore lint/suspicious/noThenProperty: Java-parity field name from `other.move.Move.then`.
  public readonly then: readonly Move[];

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
    // biome-ignore lint/suspicious/noThenProperty: Java-parity field name.
    this.then = Object.freeze(init.then ? [...init.then] : []);
  }

  public applyTo(state: State): State {
    let next = state;
    if (this.actions.length > 0) {
      for (const action of this.actions) {
        next = action.apply(next);
      }
    } else {
      const site = this.siteIndices[0];
      if (site === undefined) {
        throw new Error("Move missing target site.");
      }
      next = state.withCell(site, this.placedOwner);
    }
    // Java parity: subsequent moves chained via `then` apply after the
    // main move's actions, in declaration order.
    for (const subsequent of this.then) {
      next = subsequent.applyTo(next);
    }
    return next;
  }

  /**
   * Java parity: `Move.equals(other)`. Two moves are equal when they
   * touch the same sites in the same order, are made by the same mover
   * with the same placed owner, and their action sequences are the
   * same length with byte-equal decision actions. Free-form `id` and
   * `label` are ignored so that UI-side labels don't break equality.
   */
  public equals(other: Move): boolean {
    if (this === other) return true;
    if (
      this.mover !== other.mover ||
      this.placedOwner !== other.placedOwner ||
      this.siteIndices.length !== other.siteIndices.length ||
      this.actions.length !== other.actions.length ||
      this.then.length !== other.then.length
    ) {
      return false;
    }
    for (let i = 0; i < this.siteIndices.length; i += 1) {
      if (this.siteIndices[i] !== other.siteIndices[i]) return false;
    }
    for (let i = 0; i < this.actions.length; i += 1) {
      const a = this.actions[i];
      const b = other.actions[i];
      if (!a || !b) return false;
      if (
        a.actionType() !== b.actionType() ||
        a.from() !== b.from() ||
        a.to() !== b.to() ||
        a.what() !== b.what() ||
        a.who() !== b.who() ||
        a.count() !== b.count() ||
        a.state() !== b.state()
      ) {
        return false;
      }
    }
    for (let i = 0; i < this.then.length; i += 1) {
      const a = this.then[i];
      const b = other.then[i];
      if (!a || !b || !a.equals(b)) return false;
    }
    return true;
  }

  /**
   * Java parity: `Move.hashCode()`. Mirrors `equals`: identical inputs
   * to `equals` produce identical hashes. Uses FNV-1a so it stays in
   * step with `State.hash()`.
   */
  public hash(): number {
    let h = 0x811c9dc5;
    const mix = (n: number): void => {
      h ^= n & 0xff;
      h = Math.imul(h, 0x01000193);
      h ^= (n >>> 8) & 0xff;
      h = Math.imul(h, 0x01000193);
      h ^= (n >>> 16) & 0xff;
      h = Math.imul(h, 0x01000193);
      h ^= (n >>> 24) & 0xff;
      h = Math.imul(h, 0x01000193);
    };
    mix(this.mover);
    mix(this.placedOwner);
    for (const s of this.siteIndices) mix(s);
    for (const a of this.actions) {
      mix(a.from());
      mix(a.to());
      mix(a.what());
      mix(a.who());
      mix(a.count());
    }
    for (const t of this.then) mix(t.hash());
    return h >>> 0;
  }

  /** Java parity: `Move.decisionAction()` — the first action, if any. */
  public decisionAction(): Action | undefined {
    return this.actions[0];
  }

  /**
   * Java parity: `Move.concepts()` — the gameplay concepts this move
   * exercises. Derived from the action sequence; `then`-chained moves
   * union their concepts in.
   */
  public concepts(): ConceptSet {
    let set = new ConceptSet();
    for (const a of this.actions) {
      switch (a.actionType()) {
        case "Add":
          set = set.add("Add");
          break;
        case "Move":
        case "MoveN":
          set = set.add("Move");
          break;
        case "Remove":
          set = set.add("Remove");
          break;
        case "Swap":
          set = set.add("Swap");
          break;
        case "Pass":
          set = set.add("Pass");
          break;
        case "Forfeit":
          set = set.add("Forfeit");
          break;
        case "Vote":
          set = set.add("Vote");
          break;
        default:
          break;
      }
      if (a.isStacking()) set = set.add("Stacking");
    }
    for (const t of this.then) set = set.union(t.concepts());
    return set;
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
