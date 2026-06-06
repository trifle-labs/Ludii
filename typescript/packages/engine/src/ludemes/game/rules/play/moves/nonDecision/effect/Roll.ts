// @java Core/src/game/rules/play/moves/nonDecision/effect/Roll.java
/**
 * Rolls the dice.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/Roll.java
 *
 * @remarks Iterates all hand-dice containers, rolls each die, then appends
 *          an ActionSetDiceAllEqual to record whether all results are equal.
 *          The single resulting Move carries all those actions together.
 */

import type { Context } from "../../../../../../../context.js";
import type { MovesFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import type { Then } from "./Then.js";
import { ActionUpdateDice } from "../../../../../../../action/action-update-dice.js";
import { ActionSetDiceAllEqual } from "../../../../../../../action/action-set-dice-all-equal.js";
import { Move as LudiiMove } from "../../../../../../../move.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * A Dice container — the minimal shape Roll.eval() touches.
 * @java game.equipment.container.other.Dice
 */
interface DiceContainer {
  /** Container index (maps to context.sitesFrom()[index]). */
  index(): number;
  /** Number of die locations in this container. */
  numLocs(): number;
}

/**
 * A component (die face) — only the roll() method.
 * @java game.equipment.component.Component
 */
interface DieComponent {
  /** Returns a newly rolled face value using the context's RNG. */
  roll(ctx: Context): number;
}

/**
 * Escape-hatch for Roll-specific Java Context APIs.
 */
type RollContext = Context & {
  // @java Context.game().handDice() — List<Dice>
  game: {
    handDice(): DiceContainer[];
  };
  // @java Context.sitesFrom() — int[] container-start site indices
  sitesFrom(): number[];
  // @java Context.containerState(cid).what(loc, SiteType.Cell)
  containerState(cid: number): {
    what(loc: number, type: string): number;
  };
  // @java Context.components() — Component[] indexed by what-value
  components(): DieComponent[];
};

export class Roll implements MovesFunction {
  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/Roll.java — constructor
   *
   * @param thenClause  Subsequent moves [null]
   */
  public constructor(thenClause: Then | null = null) {
    this.thenClause = thenClause;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/Roll.java — eval(Context)
   *
   * Rolls every die across all hand-dice containers.  All ActionUpdateDice
   * entries plus a single ActionSetDiceAllEqual are bundled into one Move.
   */
  public eval(ctx: Context): Move[] {
    const rc = ctx as unknown as RollContext;
    const mover = ctx.state.mover;

    let allEqual = true;
    let valueToCompare: number = UNDEFINED;

    const actions: (ActionUpdateDice | ActionSetDiceAllEqual)[] = [];

    // @java Roll.java:57-70 — iterate hand dice
    const handDice = rc.game.handDice();
    const sitesFrom = rc.sitesFrom();

    for (const dice of handDice) {
      const startLoc = sitesFrom[dice.index()] ?? 0;
      for (let loc = startLoc; loc < startLoc + dice.numLocs(); loc++) {
        const what = rc.containerState(dice.index()).what(loc, "Cell");
        const components = rc.components();
        const component = components[what];
        const newValue = component ? component.roll(ctx) : 0;

        if (valueToCompare === UNDEFINED) {
          valueToCompare = newValue;
        } else if (valueToCompare !== newValue) {
          allEqual = false;
        }

        // @java Roll.java:68 — actions.add(new ActionUpdateDice(loc, newValue))
        actions.push(new ActionUpdateDice(loc, newValue));
      }
    }

    // @java Roll.java:72 — actions.add(new ActionSetDiceAllEqual(allEqual))
    actions.push(new ActionSetDiceAllEqual(allEqual));

    const move = new LudiiMove({
      id: `roll:${mover}`,
      label: "Roll",
      siteIndices: [],
      mover,
      placedOwner: mover,
      actions,
    });

    // @java Roll.java:75-78 — then clause
    if (this.thenClause !== null) {
      const thenMoves = this.thenClause.eval(ctx);
      const thenActions = thenMoves.flatMap(tm => [...tm.actions]);
      return [move.withConsequence(thenActions, false)];
    }

    return [move];
  }

  /** @java Roll.isStatic() — always false (stochastic) */
  public isStatic(): boolean {
    return false;
  }

  /** @java Roll.canMoveTo() — always false */
  public canMoveTo(_ctx: Context, _target: number): boolean {
    return false;
  }
}
