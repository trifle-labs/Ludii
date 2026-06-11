// @java Core/src/other/move/Move.java Move
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
import type { SeededRng } from "./rng.js";
import type { State } from "./state.js";

/**
 * A deferred `(then …)` consequence carried on a move and evaluated at APPLY
 * time against the post-move context.
 * @java Core/src/other/move/Move.java — `private final List<Moves> then` and
 *       Move.apply(): actions apply first, then each entry of then() is
 *       evaluated in the post-move context and its moves applied. Baking the
 *       consequence at generation time diverges whenever an outer wrapper
 *       appends actions afterwards (ForEachDie appends ActionUseDie AFTER the
 *       inner ForEachSite's then was attached — `(not (all DiceUsed))` must
 *       see the die consumed).
 */
export interface DeferredThen {
  eval(ctx: unknown): Move[];
}

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
  /** Java parity: `(then …)` clauses evaluated at apply time. @java Move.then() */
  readonly deferredThens?: readonly DeferredThen[];
  /**
   * Turn-model flag: when set, the mover keeps the turn after this move
   * instead of passing to the next player. This is the MVE realisation of
   * `(then (moveAgain))`, which in Java schedules a same-player re-move.
   */
  readonly moveAgain?: boolean;
  /**
   * Index of the decision action within `actions` (default 0 — the first
   * action). Java's `Move.from()/to()` read off the action flagged
   * `isDecision()`; prologue actions prepended by `(do …)` (e.g. a `(roll)`)
   * are not decisions and must be skipped. Since the MVE does not flag every
   * primary action, we instead track where the decision baseline sits: it is
   * `length(prepended-prologue)`. See {@link Move.withPrependedActions}.
   */
  readonly decisionIndex?: number;
  /**
   * Optional explicit from/to sites used by {@link Move.from}/{@link Move.to}
   * when the move carries no `isDecision()` action to read them off. A `(sow …)`
   * move's actions are all `ActionAddCount` (site-only, `from = -1`), so without
   * this its `from()` would report OFF — breaking `(last From)` for a do's
   * `(then …)` capture that walks `(sites Track from:(last From) …)` (two-row
   * mancala reach-N captures). Java's Sow restores `origFrom/origTo` (the
   * selected hole) so the consequence resolves `(last From)` to the sow origin;
   * setting these mirrors that.
   */
  readonly fromSite?: number;
  readonly toSite?: number;
  /**
   * Java parity: endpoints of the non-decision move effect. These can differ
   * from from()/to() when a move is wrapped in a decision Select.
   */
  readonly fromNonDecisionSite?: number;
  readonly toNonDecisionSite?: number;
  /** @java Move.betweenNonDecision() — hurdle sites of a hop (LastBetween). */
  readonly betweenSites?: readonly number[];
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
  /** @java Move.then() — consequence clauses, evaluated post-apply. */
  public readonly deferredThens: readonly DeferredThen[];
  public readonly moveAgain: boolean;
  /** Index of the decision action; see {@link MoveInit.decisionIndex}. */
  public readonly decisionIndex: number;
  /** Explicit from/to fallback; see {@link MoveInit.fromSite}/{@link MoveInit.toSite}. */
  public readonly fromSite?: number;
  public readonly toSite?: number;
  public readonly fromNonDecisionSite?: number;
  public readonly toNonDecisionSite?: number;
  /** @java Move.betweenNonDecision(). */
  public readonly betweenSites: readonly number[];

  public constructor(init: MoveInit) {
    // A move must touch a site OR carry an action. State-setting moves
    // (set Var / set Pending / set Counter) are siteless in Java — they carry
    // only a state action (ActionSetTemp etc.) and from/to = Constants.OFF.
    if (init.siteIndices.length === 0 && (!init.actions || init.actions.length === 0)) {
      throw new Error("Move must touch at least one site or carry an action.");
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
    this.deferredThens = Object.freeze(init.deferredThens ? [...init.deferredThens] : []);
    this.moveAgain = init.moveAgain ?? false;
    this.decisionIndex = init.decisionIndex ?? 0;
    this.fromSite = init.fromSite;
    this.toSite = init.toSite;
    this.fromNonDecisionSite = init.fromNonDecisionSite;
    this.toNonDecisionSite = init.toNonDecisionSite;
    this.betweenSites = Object.freeze(init.betweenSites ? [...init.betweenSites] : []);
  }

  /** @java Move.betweenNonDecision() — read by (last Between). */
  public betweenNonDecision(): readonly number[] {
    return this.betweenSites;
  }

  public applyTo(state: State, rng?: SeededRng): State {
    let next = state;
    if (this.actions.length > 0) {
      for (const action of this.actions) {
        next = action.apply(next, rng);
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
      next = subsequent.applyTo(next, rng);
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
      this.then.length !== other.then.length ||
      this.moveAgain !== other.moveAgain
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

  /**
   * Java parity: the move's decision action — the one `Move.from()/to()` etc.
   * read off. Java flags it with `isDecision()`; we honour that flag when set,
   * otherwise fall back to the decision baseline at {@link decisionIndex}
   * (0 for a plain move, shifted past any prologue actions prepended by a
   * `(do …)`), then to the very first action.
   */
  public decisionAction(): Action | undefined {
    for (const a of this.actions) if (a.isDecision()) return a;
    return this.actions[this.decisionIndex] ?? this.actions[0];
  }

  /**
   * Return a copy of this move carrying a `(then …)` consequence: extra
   * actions appended after the move's own actions, and/or the `moveAgain`
   * turn flag.
   */
  public withConsequence(extraActions: readonly Action[], moveAgain: boolean): Move {
    return new Move({
      id: this.id,
      label: this.label,
      siteIndices: this.siteIndices,
      mover: this.mover,
      placedOwner: this.placedOwner,
      actions: [...this.actions, ...extraActions],
      // biome-ignore lint/suspicious/noThenProperty: Java-parity field name.
      then: this.then,
      deferredThens: this.deferredThens,
      moveAgain: moveAgain || this.moveAgain,
      // `(then …)` actions are appended after the move's own, so the decision
      // baseline is unchanged.
      decisionIndex: this.decisionIndex,
      fromSite: this.fromSite,
      toSite: this.toSite,
      fromNonDecisionSite: this.fromNonDecisionSite,
      toNonDecisionSite: this.toNonDecisionSite,
      betweenSites: this.betweenSites,
    });
  }

  /**
   * Return a copy of this move with a `(then …)` clause attached for
   * apply-time evaluation.
   * @java Core/src/other/move/Move.java — `move.then().add(consequence)`;
   *       every Moves wrapper with a then adds it to its generated moves and
   *       Move.apply evaluates the list after the actions.
   */
  public withDeferredThen(gen: DeferredThen): Move {
    return new Move({
      id: this.id,
      label: this.label,
      siteIndices: this.siteIndices,
      mover: this.mover,
      placedOwner: this.placedOwner,
      actions: this.actions,
      // biome-ignore lint/suspicious/noThenProperty: Java-parity field name.
      then: this.then,
      deferredThens: [...this.deferredThens, gen],
      moveAgain: this.moveAgain,
      decisionIndex: this.decisionIndex,
      fromSite: this.fromSite,
      toSite: this.toSite,
      fromNonDecisionSite: this.fromNonDecisionSite,
      toNonDecisionSite: this.toNonDecisionSite,
      betweenSites: this.betweenSites,
    });
  }

  /**
   * Return a copy of this move with `extraActions` inserted *before* its own
   * actions. Java parity: `Do.prependPreMoves` prepends the prologue move's
   * actions to each follow-up (`next:`) move so applying the chosen move first
   * re-runs the prologue side effects (e.g. a `(remember …)`), then the move.
   */
  public withPrependedActions(extraActions: readonly Action[]): Move {
    if (extraActions.length === 0) return this;
    return new Move({
      id: this.id,
      label: this.label,
      siteIndices: this.siteIndices,
      mover: this.mover,
      placedOwner: this.placedOwner,
      actions: [...extraActions, ...this.actions],
      // biome-ignore lint/suspicious/noThenProperty: Java-parity field name.
      then: this.then,
      deferredThens: this.deferredThens,
      moveAgain: this.moveAgain,
      // Prologue actions are prepended, so the decision action shifts right by
      // their count — keeping `from()/to()` reading off the real move action,
      // not the prologue (e.g. a `(roll)`), matching Java's `isDecision()` skip.
      decisionIndex: this.decisionIndex + extraActions.length,
      fromSite: this.fromSite,
      toSite: this.toSite,
      fromNonDecisionSite: this.fromNonDecisionSite,
      toNonDecisionSite: this.toNonDecisionSite,
      betweenSites: this.betweenSites,
    });
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
    // A real `isDecision()` action's from wins. Otherwise prefer the explicit
    // `fromSite` (set on sow moves) over the fallback action's from — a sow's
    // pickup ActionAddCount reports `from = -1` (site-only), which would
    // otherwise shadow the origin and break `(last From)`.
    const decided = this.actions.find((a) => a.isDecision());
    if (decided) return decided.from();
    if (this.fromSite !== undefined) return this.fromSite;
    return (this.actions[this.decisionIndex] ?? this.actions[0])?.from() ?? ACTION_OFF;
  }

  public to(): number {
    const decided = this.actions.find((a) => a.isDecision());
    if (decided) return decided.to();
    if (this.toSite !== undefined) return this.toSite;
    return (
      (this.actions[this.decisionIndex] ?? this.actions[0])?.to() ??
      this.siteIndices[0] ??
      ACTION_OFF
    );
  }

  public fromNonDecision(): number {
    // @java Core/src/other/move/Move.java:1221
    return this.fromNonDecisionSite ?? this.from();
  }

  public toNonDecision(): number {
    // @java Core/src/other/move/Move.java:1239
    return this.toNonDecisionSite ?? this.to();
  }

  public fromAfterSubsequents(): number {
    // @java Core/src/other/move/Move.java — after-subsequent accessors scan
    // the realised action list, so a decision wrapped around a consequence can
    // expose the consequence endpoint to `(last From afterConsequence:True)`.
    for (let i = this.actions.length - 1; i >= 0; i -= 1) {
      const from = this.actions[i]!.from();
      if (from >= 0) return from;
    }
    return this.fromNonDecision();
  }

  public toAfterSubsequents(): number {
    // Used by mancala `LastHoleSowed`: a `(move Select ... (then (sow ...)))`
    // has decision to=selected hole, but after-consequence to=final sown hole.
    for (let i = this.actions.length - 1; i >= 0; i -= 1) {
      const to = this.actions[i]!.to();
      if (to >= 0) return to;
    }
    return this.toNonDecision();
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
