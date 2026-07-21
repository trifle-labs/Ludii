// @java Core/src/other/model/AlternatingMove.java AlternatingMove
/**
 * Faithful 1:1 transliteration of other.model.AlternatingMove.
 *
 * Model for alternating-move games.
 *
 * Deferrals (depend on absent subsystems):
 *  - ThinkingThread: all threaded AI execution paths are deferred. The
 *    blocking single-thread path is fully transliterated.
 *  - AI.copyContext(): relied upon in startNewStep; called as-is on the
 *    IAI opaque interface.
 *
 * Java parity: other/model/AlternatingMove.java
 */

import { Model, type AgentMoveCallback, type IContext, type IPlayoutMoveSelector, type MoveMessageCallback } from "./Model.js";
import type { IMove, IAI, ITrial } from "../context/Context.js";

export class AlternatingMove extends Model {

  // @java protected transient volatile boolean ready = true;
  protected _ready: boolean = true;

  // @java protected transient volatile boolean running = false;
  protected _running: boolean = false;

  // @java protected transient AI lastStepAI = null;
  protected _lastStepAI: IAI | null = null;

  // @java protected transient Move lastStepMove = null;
  protected _lastStepMove: IMove | null = null;

  // ThinkingThread deferred — represented as null placeholder
  protected _currentThinkingThread: null = null;

  // -------------------------------------------------------------------------

  override applyHumanMove(context: IContext, move: IMove, _player: number): IMove | null {
    if (this._currentThinkingThread !== null) return null; // Don't interrupt AI

    if (!this._ready) {
      const appliedMove = context.game().apply(context, move);
      context.trial().setNumSubmovesPlayed(context.trial().numSubmovesPlayed() + 1);
      this._lastStepMove = move;
      this._ready = true;
      this._running = false;
      return appliedMove;
    }
    return null;
  }

  override copy(): Model { return new AlternatingMove(); }

  override expectsHumanInput(): boolean {
    return !this._ready && this._running && this._currentThinkingThread === null;
  }

  override getLastStepAIs(): (IAI | null)[] | null {
    if (!this._ready) return null;
    return [this._lastStepAI];
  }

  override getLastStepMoves(): (IMove | null)[] | null {
    if (!this._ready) return null;
    return [this._lastStepMove];
  }

  override interruptAIs(): void {
    if (!this._ready) {
      // ThinkingThread deferred
      this._lastStepAI = null;
      this._ready = true;
      this._running = false;
    }
  }

  override isReady():   boolean { return this._ready;   }
  override isRunning(): boolean { return this._running; }

  override randomStep(
    context: IContext,
    preCallback:  AgentMoveCallback | null,
    postCallback: AgentMoveCallback | null
  ): void {
    if (!this._ready && this._currentThinkingThread === null) {
      const legalMoves = context.game().moves(context).moves();
      const r = Math.floor(Math.random() * legalMoves.size());
      const move = legalMoves.get(r);

      if (preCallback !== null) preCallback.call(move);

      const applied = this.applyHumanMove(context, move, context.state().mover());
      this._ready = true;

      if (postCallback !== null && applied !== null) postCallback.call(applied);

      this._running = false;
    }
  }

  // -------------------------------------------------------------------------
  // startNewStep overloads
  // -------------------------------------------------------------------------

  override startNewStep(
    context: IContext,
    ais: (IAI | null)[],
    maxSeconds: number[],
    maxIterations: number,
    maxSearchDepth: number,
    minSeconds: number,
    block: boolean,
    forceThreaded: boolean,
    forceNotThreaded: boolean,
    preCallback:  AgentMoveCallback | null,
    postCallback: AgentMoveCallback | null,
    checkMoveValid?: boolean,
    moveMessageCallback?: MoveMessageCallback | null
  ): void {
    const checkValid = checkMoveValid ?? false;
    const msgCb      = moveMessageCallback ?? null;

    if (!this._ready) return; // already running step

    this._ready = false;

    const mover = context.state().mover();
    const agent: IAI | null = (ais == null || mover >= ais.length) ? null : (ais[context.state().playerToAgent(mover)] ?? null);
    this._lastStepAI = agent;

    if (block) {
      if (agent === null) {
        this.randomStep(context, preCallback, postCallback);
        return;
      }

      if (!forceThreaded) {
        // Run AI in calling thread (blocking)
        let move = agent.selectAction(
          context.game(),
          agent.copyContext(context),
          maxSeconds[context.state().playerToAgent(mover)] ?? 1.0,
          maxIterations,
          maxSearchDepth
        );

        move = AlternatingMove.checkMoveValid(checkValid, context, move, msgCb);

        if (preCallback !== null) preCallback.call(move);

        const applied = context.game().apply(context, move);
        context.trial().setNumSubmovesPlayed(context.trial().numSubmovesPlayed() + 1);
        this._lastStepMove = move;
        this._ready = true;

        if (postCallback !== null) postCallback.call(applied);

        this._running = false;
      } else {
        // DEFERRED: forceThreaded — ThinkingThread not ported
        throw new Error("AlternatingMove.startNewStep: forceThreaded path deferred (no ThinkingThread)");
      }
    } else {
      // Non-blocking path — DEFERRED: requires background thread
      if (agent !== null) {
        throw new Error("AlternatingMove.startNewStep: non-blocking AI path deferred (no ThinkingThread)");
      } else {
        this._running = true;
      }
    }
  }

  override unpauseAgents(
    _context: IContext,
    _ais: (IAI | null)[],
    _maxSeconds: number[],
    _maxIterations: number,
    _maxSearchDepth: number,
    _minSeconds: number,
    _preCallback:  AgentMoveCallback | null,
    _postCallback: AgentMoveCallback | null,
    _checkMoveValid: boolean,
    _moveMessageCallback: MoveMessageCallback | null
  ): void {
    // DEFERRED: ThinkingThread not ported
    throw new Error("AlternatingMove.unpauseAgents: deferred – requires ThinkingThread");
  }

  override getLiveAIs(): IAI[] { return []; /* ThinkingThread deferred */ }

  override verifyMoveLegal(context: IContext, move: IMove): boolean {
    const legal = context.game().moves(context).moves();
    const moveActions = (move as unknown as { getActionsWithConsequences?(ctx: IContext): unknown[] })
      .getActionsWithConsequences?.(context) ?? move.actions();

    for (let i = 0; i < legal.size(); i++) {
      if (Model.movesEqualWithActions(move, moveActions as unknown[], legal.get(i), context)) return true;
    }
    if (legal.size() === 0 && (move as unknown as { isPass?(): boolean }).isPass?.()) return true;
    return false;
  }

  // -------------------------------------------------------------------------
  // playout
  // -------------------------------------------------------------------------

  override playout(
    context: IContext,
    ais: (IAI | null)[] | null,
    thinkingTime: number,
    playoutMoveSelector: IPlayoutMoveSelector | null,
    maxNumBiasedActions: number,
    maxNumPlayoutActions: number,
    random: { nextInt(bound: number): number }
  ): ITrial {
    const game = context.game();
    const startPhase = game.rules().phases()[context.state().currentPhase(context.state().mover())];

    let numActionsApplied = 0;
    const trial: ITrial = context.trial();

    while (!trial.over() && (maxNumPlayoutActions < 0 || maxNumPlayoutActions > numActionsApplied)) {
      const mover = context.state().mover();
      const currPhase = game.rules().phases()[context.state().currentPhase(mover)];

      if (currPhase !== startPhase && currPhase.playout() !== null) {
        // Phase switch — hand off
        return trial;
      }

      let move: IMove | null = null;
      let ai: IAI | null = null;

      if (ais !== null) ai = ais[context.state().playerToAgent(mover)] ?? null;

      if (ai !== null) {
        move = ai.selectAction(game, ai.copyContext(context), thinkingTime, -1, -1);
      } else {
        const legalObj = game.moves(context);
        const legalList = legalObj.moves();
        if (
          playoutMoveSelector === null ||
          (maxNumBiasedActions >= 0 && maxNumBiasedActions < numActionsApplied) ||
          playoutMoveSelector.wantsPlayUniformRandomMove()
        ) {
          move = legalList.get(random.nextInt(legalList.size()));
        } else {
          const movesArr: IMove[] = [];
          for (let i = 0; i < legalList.size(); i++) movesArr.push(legalList.get(i));
          move = playoutMoveSelector.selectMove(context, movesArr, mover, () => true);
        }
      }

      if (move === null) { console.warn("AlternatingMove.playout: no move"); break; }

      game.apply(context, move);
      numActionsApplied++;
    }

    return trial;
  }

  override callsGameMoves(): boolean { return true; }

  // -------------------------------------------------------------------------
  // Static helper
  // -------------------------------------------------------------------------

  static checkMoveValid(
    check: boolean,
    context: IContext,
    move: IMove,
    callback: MoveMessageCallback | null
  ): IMove {
    if (check && !context.model().verifyMoveLegal(context, move)) {
      const legal = context.game().moves(context).moves();
      const randomMove = legal.get(Math.floor(Math.random() * legal.size()));
      const msg = `illegal move detected: ${JSON.stringify(move.actions())}, instead applying: ${JSON.stringify(randomMove.actions())}`;
      callback?.call(msg);
      console.warn(msg);
      return randomMove;
    }
    return move;
  }
}
