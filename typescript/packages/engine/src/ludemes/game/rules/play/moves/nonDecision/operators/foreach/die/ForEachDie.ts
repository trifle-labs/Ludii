// @java Core/src/game/rules/play/moves/nonDecision/operators/foreach/die/ForEachDie.java

/**
 * Generates moves according to the values of the dice.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/die/ForEachDie.java
 * @author Eric.Piette
 *
 * @remarks This ludeme is used in dice games, and works for any combination of dice.
 */

import type { Context } from "../../../../../../../../../context.js";
import { Move } from "../../../../../../../../../move.js";
import { ActionUseDie } from "../../../../../../../../../action/action-use-die.js";
import { ActionUpdateDice } from "../../../../../../../../../action/action-update-dice.js";
import { ActionSetTemp } from "../../../../../../../../../action/action-set-temp.js";
import type { BooleanFunction, IntFunction, MovesFunction } from "../../../../../../../../base.js";
import { NonDecision } from "../../../NonDecision.js";
import type { ThenLike } from "../../../../Moves.js";
import { applyPostStateThen } from "../../../effect/Then.js";
import type { Action } from "../../../../../../../../../action/index.js";

/** Java parity: Constants.UNDEFINED = -1 */
const UNDEFINED = -1;

/**
 * Generates moves according to the values of the dice.
 *
 * @java game/rules/play/moves/nonDecision/operators/foreach/die/ForEachDie.java
 */
export class ForEachDie extends NonDecision {
  /** @java ForEachDie.handDiceIndexFn — the index of the hand of dice. */
  private readonly handDiceIndexFn: IntFunction;

  /** @java ForEachDie.combined — to combine dice. */
  private readonly combined: BooleanFunction;

  /** @java ForEachDie.replayDoubleFn — if double rules (e.g. Backgammon). */
  private readonly replayDoubleFn: BooleanFunction;

  /** @java ForEachDie.rule — the rule to respect. */
  private readonly rule: BooleanFunction;

  /** @java ForEachDie.moves — the moves to apply. */
  private readonly subMoves: MovesFunction;

  // -------------------------------------------------------------------------

  /**
   * @java ForEachDie constructor
   * @param handDiceIndex The index of the dice container [0].
   * @param combined      True if the combination is allowed [False].
   * @param replayDouble  True if double allows a second move [False].
   * @param If            The condition to satisfy to move [True].
   * @param moves         The moves to apply.
   * @param then          The moves applied after that move is applied.
   */
  public constructor(
    handDiceIndex: IntFunction | null,
    combined: BooleanFunction | null,
    replayDouble: BooleanFunction | null,
    If: BooleanFunction | null,
    moves: MovesFunction,
    then: ThenLike | null = null,
  ) {
    super(then);
    // @java handDiceIndexFn = (handDiceIndex == null) ? new IntConstant(0) : handDiceIndex;
    this.handDiceIndexFn = handDiceIndex ?? constIntFn(0);
    // @java rule = (If == null) ? new BooleanConstant(true) : If;
    this.rule = If ?? constBoolFn(true);
    // @java this.combined = (combined == null) ? new BooleanConstant(false) : combined;
    // combined:True arrives RAW from the lud (typeof guard — XII Scripta's
    // (forEach Die combined:True ...) threw `this.combined.eval is not a
    // function` at ply 0).
    this.combined = typeof (combined as unknown) === "boolean"
      ? constBoolFn(combined as unknown as boolean)
      : (combined ?? constBoolFn(false));
    // @java replayDoubleFn = (replayDouble == null) ? new BooleanConstant(false) : replayDouble;
    this.replayDoubleFn = typeof (replayDouble as unknown) === "boolean"
      ? { eval: () => replayDouble as unknown as boolean }
      : (replayDouble ?? constBoolFn(false));
    this.subMoves = moves;
  }

  // -------------------------------------------------------------------------

  /**
   * @java ForEachDie.eval(Context)
   *
   * Generates moves for each die value, appending ActionUseDie and optionally
   * ActionSetTemp / ActionUpdateDice for double-replay logic.
   *
   * Tries Java-style Context methods first (escape hatch); falls back to the
   * working Context's diceValues field (used by the 1:1 compiler path).
   */
  public override eval(context: Context): Move[] {
    // @java final Moves returnMoves = new BaseMoves(super.then());
    const returnMoves: Move[] = [];

    // Escape hatch for full Java-style Ludii Context
    const ctxJava = context as unknown as {
      state?(): {
        currentDice(): number[][] | null;
        currentDice(idx: number): number[];
        temp(): number;
      } | null;
      game?(): {
        getHandDice(idx: number): { index(): number };
        handDice(): Array<{ index(): number; getNumFaces(): number; numLocs(): number }>;
      };
      pipCount?(): number;
      setPipCount?(v: number): void;
      sitesFrom?(): number[];
    };

    // Working context fallback (compiler1to1 path)
    const ctxWorking = context as unknown as {
      state?: { diceValues?: number[]; mover?: number };
      _evalPips?: number;
    };

    const handDiceIndex = this.handDiceIndexFn.eval(context);

    // Get the mover from working context
    const mover = ctxWorking.state?.mover ?? context.state?.mover ?? 1;

    // ------------------------------------------------------------------
    // Java-style path — adapted to the engine context shapes (@java
    // ForEachDie.eval): state is a property carrying diceValues/temp; pip
    // get/set ride the _evalPips scratch; game.handDice()/sitesFrom() are real.
    // ------------------------------------------------------------------
    const engineState = context.state as unknown as {
      diceValues?: readonly number[];
      temp?: (() => number) | number;
    };
    const hasEngineDice = Array.isArray(engineState.diceValues)
      && typeof (context.game as { handDice?: unknown }).handDice === "function";
    if ((typeof ctxJava.state === "function" && typeof ctxJava.setPipCount === "function") || hasEngineDice) {
      const javaState = typeof ctxJava.state === "function" ? ctxJava.state() : {
        currentDice: ((idx?: number) => idx === undefined
          ? [ [...(engineState.diceValues ?? [])] ]
          : [...(engineState.diceValues ?? [])]) as { (): number[][] | null; (idx: number): number[] },
        temp: () => {
          // @java State.temp() — a single GLOBAL value (State.java:83),
          // default Constants.UNDEFINED; the engine State mirrors this.
          const t = engineState.temp as unknown;
          const v = typeof t === "function"
            ? (t as () => number).call(context.state)
            : ((t as number | undefined) ?? UNDEFINED);
          return v ?? UNDEFINED;
        },
      };
      if (javaState === null) return returnMoves;
      // pip get/set: prefer the Java methods, else the _evalPips scratch.
      const getPip = typeof ctxJava.pipCount === "function"
        ? () => ctxJava.pipCount!()
        : () => (context as unknown as { _evalPips?: number })._evalPips ?? 0;
      const setPip = typeof ctxJava.setPipCount === "function"
        ? (v: number) => ctxJava.setPipCount!(v)
        : (v: number) => { (context as unknown as { _evalPips?: number })._evalPips = v; };
      const gameFns = typeof ctxJava.game === "function" ? ctxJava.game() : (context.game as unknown as {
        getHandDice(idx: number): { index(): number };
        handDice(): Array<{ index(): number; getNumFaces(): number; numLocs(): number }>;
      });
      const sitesFromFn = typeof ctxJava.sitesFrom === "function"
        ? () => ctxJava.sitesFrom!()
        : () => ((context as unknown as { sitesFrom?: () => number[] }).sitesFrom?.() ?? []);

      // @java if (context.state().currentDice() == null) return returnMoves;
      if (javaState.currentDice() === null) return returnMoves;

      // @java final int[] dieValues = context.state().currentDice(handDiceIndex);
      const dieValues = javaState.currentDice(handDiceIndex);

      // @java final int containerIndex = context.game().getHandDice(handDiceIndex).index();
      const containerIndex = gameFns.getHandDice(handDiceIndex).index();

      // @java boolean replayDouble = replayDoubleFn.eval(context);
      let replayDouble = this.replayDoubleFn.eval(context);
      if (replayDouble) {
        const firstDieValue = dieValues[0] ?? 0;
        for (let i = 0; i < dieValues.length; i++) {
          if (dieValues[i] !== firstDieValue) { replayDouble = false; break; }
        }
      }

      // @java final int origDieValue = context.pipCount();
      if (process.env.TRACE_DICE) {
        console.error(`[forEachDie] ply=${(globalThis as Record<string, unknown>).__PLY} mover=${mover} dice=${JSON.stringify(dieValues)} replayDouble=${replayDouble} temp=${javaState.temp()}`);
      }
      const origDieValue = getPip();

      for (let i = 0; i < dieValues.length; i++) {
        const pipCount = dieValues[i] ?? 0;
        setPip(pipCount);

        if (this.rule.eval(context)) {
          const computedMoves = this.subMoves.eval(context);
          // @java final int site = context.sitesFrom()[containerIndex] + i;
          const site = (sitesFromFn()[containerIndex] ?? 0) + i;
          // @java new ActionUseDie(handDiceIndex, i, site)
          const action = new ActionUseDie(i, site);
          const temp = javaState.temp();

          for (const m of computedMoves) {
            const newActions: Action[] = [...m.actions, action];
            // @java replayDouble double-logic
            if (replayDouble && temp === UNDEFINED) {
              // @java new ActionSetTemp(pipCount) — global temp, no player
              newActions.push(new ActionSetTemp(pipCount));
            } else if (replayDouble) {
              // @java new ActionSetTemp(Constants.UNDEFINED)
              newActions.push(new ActionSetTemp(UNDEFINED));
            } else if (temp !== UNDEFINED) {
              // @java ActionUpdateDice for each die in handDice
              for (const dice of gameFns.handDice()) {
                if ((temp - 1) < dice.getNumFaces()) {
                  const siteFrom = sitesFromFn()[dice.index()] ?? 0;
                  for (let loc = siteFrom; loc < siteFrom + dice.numLocs(); loc++) {
                    // @java ActionUpdateDice(loc, temp-1): global site + face
                    // INDEX, currentDice = faces[temp-1] = the pip `temp`.
                    // Engine dice-value mode: (dieIndex, faceIndex, value).
                    if (process.env.TRACE_DICE) console.error(`[rearm] ply=${(globalThis as Record<string, unknown>).__PLY} temp=${temp} dice=${JSON.stringify((context.state as unknown as { diceValues?: readonly number[] }).diceValues)} stack=${new Error().stack?.split("\n")[3]?.trim().slice(0,80)}`);
                    newActions.push(new ActionUpdateDice(loc - siteFrom, temp - 1, temp));
                  }
                }
              }
            }
            returnMoves.push(new Move({
              id: m.id + `:forEachDie${i}`,
              label: m.label,
              siteIndices: m.siteIndices,
              mover: m.mover,
              placedOwner: m.placedOwner,
              actions: newActions,
              fromSite: m.fromSite,
              toSite: m.toSite,
              // @java the inner moves keep their then() list — ForEachDie only
              // appends actions; the consequence evaluates at apply time.
              deferredThens: m.deferredThens,
              moveAgain: m.moveAgain,
              decisionIndex: m.decisionIndex,
            }));
          }
        }
      }

      // @java if (combined.eval(context))
      if (this.combined.eval(context)) {
        this._evalCombined(context, dieValues, handDiceIndex, containerIndex, sitesFromFn(), returnMoves);
      }

      // @java context.setPipCount(origDieValue);
      setPip(origDieValue);

      // @java ForEachDie.java:239-241 — the ludeme's own (then …) is added to
      // every generated move's then() list (Baralie: each die move carries
      // (then (moveAgain)) so the mover continues until all dice are used).
      const ownThen = this.then();
      if (ownThen !== null) {
        return returnMoves.map((m) => applyPostStateThen(ownThen, context, m));
      }
      return returnMoves;
    }

    // ------------------------------------------------------------------
    // Fallback: working context path (compiler1to1)
    // ------------------------------------------------------------------
    const dice = ctxWorking.state?.diceValues;
    if (!dice || dice.length === 0) return returnMoves;

    const origPips = ctxWorking._evalPips;

    for (let dieIdx = 0; dieIdx < dice.length; dieIdx++) {
      const pipCount = dice[dieIdx] ?? 0;
      if (pipCount === 0) continue; // die already used
      ctxWorking._evalPips = pipCount;

      if (this.rule.eval(context)) {
        const computedMoves = this.subMoves.eval(context);
        const useDieAction = new ActionUseDie(dieIdx, dieIdx);
        for (const m of computedMoves) {
          returnMoves.push(new Move({
            id: m.id + `:forEachDie${dieIdx}`,
            label: m.label,
            siteIndices: m.siteIndices,
            mover: m.mover,
            placedOwner: m.placedOwner,
            actions: [...m.actions, useDieAction],
            deferredThens: m.deferredThens,
            moveAgain: m.moveAgain,
            decisionIndex: m.decisionIndex,
            fromSite: m.fromSite,
            toSite: m.toSite,
          }));
        }
      }
    }

    ctxWorking._evalPips = origPips;

    // @java ForEachDie.java:239-241 — own (then …) added to every move.
    const ownThenFallback = this.then();
    if (ownThenFallback !== null) {
      return returnMoves.map((m) => applyPostStateThen(ownThenFallback, context, m));
    }
    return returnMoves;
  }

  // -------------------------------------------------------------------------

  /**
   * @java ForEachDie — combined dice evaluation (len==2 and len==3 cases).
   */
  private _evalCombined(
    context: Context,
    dieValues: number[],
    handDiceIndex: number,
    containerIndex: number,
    sitesFrom: number[],
    returnMoves: Move[],
  ): void {
    if (dieValues.length === 2) {
      const dieValue1 = dieValues[0] ?? 0;
      const dieValue2 = dieValues[1] ?? 0;
      if (dieValue1 !== 0 && dieValue2 !== 0) {
        (context as unknown as { setPipCount?(v: number): void }).setPipCount?.(dieValue1 + dieValue2);
        if (this.rule.eval(context)) {
          const computedMoves = this.subMoves.eval(context);
          const siteFrom = sitesFrom[containerIndex] ?? 0;
          const actionDie1 = new ActionUseDie(0, siteFrom);
          const actionDie2 = new ActionUseDie(1, siteFrom + 1);
          for (const m of computedMoves) {
            returnMoves.push(new Move({
              id: m.id + `:forEachDieCombined`,
              label: m.label,
              siteIndices: m.siteIndices,
              mover: m.mover,
              placedOwner: m.placedOwner,
              actions: [...m.actions, actionDie1, actionDie2],
              deferredThens: m.deferredThens,
              moveAgain: m.moveAgain,
              decisionIndex: m.decisionIndex,
              fromSite: m.fromSite,
              toSite: m.toSite,
            }));
          }
        }
      }
    } else if (dieValues.length === 3) {
      // @java Sum of the three dice
      const dieValue1 = dieValues[0] ?? 0;
      const dieValue2 = dieValues[1] ?? 0;
      const dieValue3 = dieValues[2] ?? 0;
      if (dieValue1 !== 0 && dieValue2 !== 0 && dieValue3 !== 0) {
        (context as unknown as { setPipCount?(v: number): void }).setPipCount?.(dieValue1 + dieValue2 + dieValue3);
        if (this.rule.eval(context)) {
          const computedMoves = this.subMoves.eval(context);
          const siteFrom = sitesFrom[containerIndex] ?? 0;
          const actionDie1 = new ActionUseDie(0, siteFrom);
          const actionDie2 = new ActionUseDie(1, siteFrom + 1);
          const actionDie3 = new ActionUseDie(2, siteFrom + 2);
          for (const m of computedMoves) {
            returnMoves.push(new Move({
              id: m.id + `:forEachDieCombined3`,
              label: m.label,
              siteIndices: m.siteIndices,
              mover: m.mover,
              placedOwner: m.placedOwner,
              actions: [...m.actions, actionDie1, actionDie2, actionDie3],
              deferredThens: m.deferredThens,
              moveAgain: m.moveAgain,
              decisionIndex: m.decisionIndex,
              fromSite: m.fromSite,
              toSite: m.toSite,
            }));
          }
        }
      }
      // @java Each combination of two dices
      for (let i = 0; i < 2; i++) {
        for (let j = i + 1; j < 3; j++) {
          const d1 = dieValues[i] ?? 0;
          const d2 = dieValues[j] ?? 0;
          if (d1 !== 0 && d2 !== 0) {
            (context as unknown as { setPipCount?(v: number): void }).setPipCount?.(d1 + d2);
            if (this.rule.eval(context)) {
              const computedMoves = this.subMoves.eval(context);
              const siteFrom = sitesFrom[containerIndex] ?? 0;
              const actionDie1 = new ActionUseDie(i, siteFrom + i);
              const actionDie2 = new ActionUseDie(j, siteFrom + j);
              for (const m of computedMoves) {
                returnMoves.push(new Move({
                  id: m.id + `:forEachDieComb2_${i}_${j}`,
                  label: m.label,
                  siteIndices: m.siteIndices,
                  mover: m.mover,
                  placedOwner: m.placedOwner,
                  actions: [...m.actions, actionDie1, actionDie2],
                  deferredThens: m.deferredThens,
                  moveAgain: m.moveAgain,
                  decisionIndex: m.decisionIndex,
                  fromSite: m.fromSite,
                  toSite: m.toSite,
                }));
              }
            }
          }
        }
      }
      // TO DO more than two dices
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java ForEachDie.isStatic()
   */
  public override isStatic(): boolean {
    const fi = (this.handDiceIndexFn as unknown as { isStatic?(): boolean }).isStatic;
    const fr = (this.rule as unknown as { isStatic?(): boolean }).isStatic;
    const fm = (this.subMoves as unknown as { isStatic?(): boolean }).isStatic;
    const frd = (this.replayDoubleFn as unknown as { isStatic?(): boolean }).isStatic;
    const fc = (this.combined as unknown as { isStatic?(): boolean }).isStatic;
    return (fi === undefined || fi.call(this.handDiceIndexFn) !== false)
      && (fr === undefined || fr.call(this.rule) !== false)
      && (fm === undefined || fm.call(this.subMoves) !== false)
      && (frd === undefined || frd.call(this.replayDoubleFn) !== false)
      && (fc === undefined || fc.call(this.combined) !== false);
  }
}

// ---------------------------------------------------------------------------
// Minimal constant-function helpers (stand-ins for IntConstant / BooleanConstant)
// ---------------------------------------------------------------------------

function constIntFn(v: number): IntFunction {
  return { eval(_ctx: Context): number { return v; } };
}

function constBoolFn(v: boolean): BooleanFunction {
  return { eval(_ctx: Context): boolean { return v; } };
}
