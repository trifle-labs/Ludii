// @java Core/src/other/model/SimulationMove.java SimulationMove
/**
 * Faithful 1:1 transliteration of other.model.SimulationMove.
 *
 * Model for simulation games (e.g. physics-style: always applies the first
 * available move, no player decision required).
 *
 * Deferrals:
 *  - ThinkingThread in unpauseAgents: deferred.
 *
 * Java parity: other/model/SimulationMove.java
 */

import { Model, type AgentMoveCallback, type IContext, type IPlayoutMoveSelector, type MoveMessageCallback } from "./Model.js";
import type { IMove, IAI, ITrial } from "../context/Context.js";

/** Minimal Status – mirrors main.Status(0) */
interface IStatus { winner(): number; }
function makeStatus(winner: number): IStatus { return { winner: () => winner }; }

export class SimulationMove extends Model {

  // @java protected transient volatile boolean ready = true;
  protected _ready: boolean = true;

  // @java protected transient volatile boolean running = false;
  protected _running: boolean = false;

  // ThinkingThread deferred
  protected _currentThinkingThread: null = null;

  // @java protected transient AI lastStepAI = null;
  protected _lastStepAI: IAI | null = null;

  // @java protected transient Move lastStepMove = null;
  protected _lastStepMove: IMove | null = null;

  // -------------------------------------------------------------------------

  override applyHumanMove(context: IContext, move: IMove, _player: number): IMove | null {
    if (!this._ready) {
      const applied = context.game().apply(context, move);
      context.trial().setNumSubmovesPlayed(context.trial().numSubmovesPlayed() + 1);
      this._lastStepMove = move;
      this._ready = true;
      this._running = false;
      return applied;
    }
    return null;
  }

  override copy(): Model { return new SimulationMove(); }

  override expectsHumanInput(): boolean {
    return !this._ready && this._running && this._currentThinkingThread === null;
  }

  override getLastStepAIs():   (IAI | null)[] | null { return this._ready ? [this._lastStepAI]  : null; }
  override getLastStepMoves(): (IMove | null)[] | null { return this._ready ? [this._lastStepMove] : null; }

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
    _preCallback:  AgentMoveCallback | null,
    _postCallback: AgentMoveCallback | null
  ): void {
    if (!this._ready && this._currentThinkingThread === null) {
      const legalMoves = context.game().moves(context).moves();
      if (legalMoves.size() > 0) this.applyHumanMove(context, legalMoves.get(0), context.state().mover());
      this._ready = true;
      this._running = false;
    }
  }

  // -------------------------------------------------------------------------
  // startNewStep
  // -------------------------------------------------------------------------

  override startNewStep(
    context: IContext,
    _ais: (IAI | null)[],
    _maxSeconds: number[],
    _maxIterations: number,
    _maxSearchDepth: number,
    _minSeconds: number,
    _block: boolean,
    _forceThreaded: boolean,
    _forceNotThreaded: boolean,
    _preCallback:  AgentMoveCallback | null,
    _postCallback: AgentMoveCallback | null,
    _checkMoveValid?: boolean,
    _moveMessageCallback?: MoveMessageCallback | null
  ): void {
    if (!this._ready) return;

    this._ready   = false;
    this._running = true;

    const trial = context.trial();
    if (!trial.over()) {
      const legalMoves = context.game().moves(context).moves();
      context.game().apply(context, legalMoves.get(0));
    }

    const legalMovesAfter = context.game().moves(context).moves();
    if (legalMovesAfter.size() === 0) {
      context.trial().setStatus(makeStatus(0) as unknown as never);
    }

    this._running = false;
    this._ready   = true;
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
    throw new Error("SimulationMove.unpauseAgents: deferred – requires ThinkingThread");
  }

  override getLiveAIs(): IAI[] { return []; /* ThinkingThread deferred */ }

  override verifyMoveLegal(_context: IContext, _move: IMove): boolean { return true; }

  // -------------------------------------------------------------------------
  // playout
  // -------------------------------------------------------------------------

  override playout(
    context: IContext,
    _ais: (IAI | null)[] | null,
    _thinkingTime: number,
    _playoutMoveSelector: IPlayoutMoveSelector | null,
    _maxNumBiasedActions: number,
    maxNumPlayoutActions: number,
    _random: { nextInt(bound: number): number }
  ): ITrial {
    const game = context.game();
    let numActionsApplied = 0;
    const trial = context.trial();

    while (!trial.over() && (maxNumPlayoutActions < 0 || maxNumPlayoutActions > numActionsApplied)) {
      const legalMoves = game.moves(context).moves();
      if (legalMoves.size() > 0) {
        game.apply(context, legalMoves.get(0));
      } else {
        context.trial().setStatus(makeStatus(0) as unknown as never);
      }
      numActionsApplied++;
    }

    return trial;
  }

  override callsGameMoves(): boolean { return true; }

  // -------------------------------------------------------------------------
  // Static helper (mirrors AlternatingMove.checkMoveValid)
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
