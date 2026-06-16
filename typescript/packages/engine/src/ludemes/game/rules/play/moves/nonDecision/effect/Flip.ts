// @java Core/src/game/rules/play/moves/nonDecision/effect/Flip.java
/**
 * Is used to flip a piece.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Flip.java
 *
 * @remarks For a stacked site, removes every level in order then re-adds them
 *          in reverse order, applying the flip-state mapping from the component's
 *          Flips table to each level.  For a single piece, emits an
 *          ActionSetState carrying the new flipped state.
 */

import type { Context } from "../../../../../../../context.js";
import type { IntFunction, MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import type { Then } from "./Then.js";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import { ActionSetState } from "../../../../../../../action/action-set-state.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

/** Java parity: Constants.OFF = -1 */
const OFF = -1;

/**
 * Minimal interface for a component's Flips table.
 * @java game.util.moves.Flips
 */
interface Flips {
  flipState(state: number): number;
}

/**
 * Minimal component interface — only the subset Flip.eval() touches.
 * @java game.equipment.component.Component
 */
interface Component {
  getFlips(): Flips | null;
}

/**
 * Minimal game context extension for Flip, using an escape hatch so we do
 * not have to modify the TS Context/Game interfaces.
 */
type FlipContext = Context & {
  // @java Context.containerId()  — int[] mapping site → container id
  containerId(): number[];
  // @java Context.containerState(cid) → ContainerState
  containerState(cid: number): {
    sizeStack(loc: number, type: string): number;
    what(loc: number, level: number, type: string): number;
    state(loc: number, level: number, type: string): number;
    rotation(loc: number, level: number, type: string): number;
    value(loc: number, level: number, type: string): number;
    state(loc: number, type: string): number;
    what(loc: number, type: string): number;
  };
  // @java Context.components() — Component[] indexed by what-value
  components(): Component[];
  // @java Context.board().defaultSite()
  board(): { defaultSite(): string };
};

export class Flip implements MovesFunction {
  /** @java Flip.locFn — location to flip [(to)] */
  private readonly locFn: IntFunction;

  /** @java Flip.type — Cell/Edge/Vertex */
  private readonly type: string | null;

  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Flip.java — constructor
   *
   * @param type        Graph element type [default board default]
   * @param loc         Location to flip [(to)]
   * @param thenClause  Subsequent moves
   */
  public constructor(
    type: string | null = null,
    loc: IntFunction | null = null,
    thenClause: Then | null = null,
  ) {
    // @java Flip.java:62-63 — locFn = (loc == null) ? To.instance() : loc
    this.locFn = loc ?? { eval: (ctx: Context) => ctx._evalTo };
    this.type = type;
    this.thenClause = thenClause;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Flip.java — eval(Context)
   */
  public eval(ctx: Context): Move[] {
    const fc = ctx as unknown as FlipContext;
    const moves: LudiiMove[] = [];

    const loc = this.locFn.eval(ctx);

    // @java Flip.java:73-76 — return empty if loc == OFF
    if (loc === OFF) return moves;

    // @java Flip.java:78-83 — resolve container id and site type. The nested
    // Custodial->Apply->AllCombinations context (and even the main context in
    // some paths) lacks the containerId()/containerState() escape hatches;
    // a thrown TypeError there aborts the ENTIRE move list (Reversi/Rolit
    // generated NO moves at ply 0). Fall back to the single board container
    // (cid 0) read straight off ctx.state — correct for board-only flip games.
    const containerIds = typeof fc.containerId === "function" ? fc.containerId() : null;
    const cid = containerIds ? (loc >= containerIds.length ? 0 : (containerIds[loc] ?? 0)) : 0;
    let realType: string;
    if (cid > 0) {
      realType = "Cell";
    } else if (this.type !== null) {
      realType = this.type;
    } else {
      realType = typeof fc.board === "function" ? fc.board().defaultSite() : "Cell";
    }

    const stateAny = ctx.state as unknown as {
      stacks: readonly (readonly number[])[]; whatStacks: readonly (readonly number[])[];
      what(s: number): number; stateValue(s: number): number;
    };
    const cs = typeof fc.containerState === "function" ? fc.containerState(cid) : {
      sizeStack: (s: number) => (stateAny.stacks[s]?.length || (stateAny.what(s) > 0 ? 1 : 0)),
      what: (s: number, lvl: number) => (typeof lvl === "number" ? (stateAny.whatStacks[s]?.[lvl] ?? stateAny.what(s)) : stateAny.what(s)),
      state: (s: number) => stateAny.stateValue(s),
      rotation: () => 0,
      value: () => 0,
    } as never;
    const stackSize = cs.sizeStack(loc, realType);
    const mover = ctx.state.mover;

    if (stackSize > 1) {
      // @java Flip.java:88-115 — stacked flip: remove all levels then re-add
      // in reverse order with flipped states
      const move = new LudiiMove({
        id: `flip:stack:${mover}:${loc}`,
        label: `Flip(stack@${loc})`,
        siteIndices: [loc],
        mover,
        placedOwner: mover,
        actions: [],
      });

      const whats: number[] = [];
      const states: number[] = [];
      const rotations: number[] = [];
      const values: number[] = [];

      for (let level = 0; level < stackSize; level++) {
        whats.push(cs.what(loc, level, realType));
        states.push(cs.state(loc, level, realType));
        rotations.push(cs.rotation(loc, level, realType));
        values.push(cs.value(loc, level, realType));
      }

      // Build remove actions for each level (from level 0 up)
      const removeActions = [];
      for (let level = 0; level < stackSize; level++) {
        removeActions.push(new ActionRemove({ to: loc }));
      }

      // Build add actions in reverse order, applying flip mapping
      const addActions = [];
      const components = typeof fc.components === "function" ? fc.components() : [];
      for (let level = 0; level < stackSize; level++) {
        const what = whats[whats.length - level - 1] ?? 0;
        const value = values[values.length - level - 1] ?? 0;
        const rotation = rotations[rotations.length - level - 1] ?? 0;
        let state = states[states.length - level - 1] ?? 0;

        const component = components[what];
        if (component) {
          const flips = component.getFlips();
          if (flips !== null) {
            state = flips.flipState(state);
          }
        }

        addActions.push(new ActionAdd({
          to: loc,
          what: what > 0 ? what : 1,
          state,
          rotation,
          value,
          onStack: true,
        }));
      }

      const allActions = [...removeActions, ...addActions];
      const builtMove = new LudiiMove({
        id: `flip:stack:${mover}:${loc}`,
        label: `Flip(stack@${loc})`,
        siteIndices: [loc],
        mover,
        placedOwner: mover,
        actions: allActions,
      });
      moves.push(builtMove);
    } else if (stackSize === 1) {
      // @java Flip.java:117-135 — single piece flip: ActionSetState with new flipped state
      const currentState = ctx.state.stateValue(loc);
      const whatValue = ctx.state.what(loc);

      if (whatValue === 0) return moves;

      const components = typeof fc.components === "function" ? fc.components() : [];
      const component = components[whatValue];
      const flips = component && typeof component.getFlips === "function" ? component.getFlips() : null;
      if (flips == null) return moves;

      const newState = flips.flipState(currentState);

      const action = new ActionSetState({ to: loc, state: newState });
      const m = new LudiiMove({
        id: `flip:${mover}:${loc}`,
        label: `Flip(${loc})`,
        siteIndices: [loc],
        mover,
        placedOwner: mover,
        actions: [action],
      });
      moves.push(m);
    }

    // @java Flip.java:137-139 — then clause
    if (this.thenClause !== null) {
      const thenMoves = this.thenClause.eval(ctx);
      const thenActions = thenMoves.flatMap(tm => [...tm.actions]);
      return moves.map(m => m.withConsequence(thenActions, false));
    }

    return moves;
  }

  /** @java Flip.isStatic() — delegates to locFn */
  public isStatic(): boolean {
    return (this.locFn as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
  }
}
