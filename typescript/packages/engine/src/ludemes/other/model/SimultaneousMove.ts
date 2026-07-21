// @java Core/src/other/model/SimultaneousMove.java SimultaneousMove
/**
 * Faithful 1:1 transliteration of other.model.SimultaneousMove.
 *
 * Model for simultaneous-move games: all active players choose a move,
 * then a combined move is applied.
 *
 * Deferrals:
 *  - ThinkingThread: all threaded AI paths deferred (browser single-thread).
 *    The non-threaded blocking path (block && forceNotThreaded) is fully
 *    transliterated.
 *  - ActionPass: referenced as an opaque action constructed from the IMove
 *    factory. The pass-creation logic is structurally transliterated.
 *
 * Java parity: other/model/SimultaneousMove.java
 */

import { Model, type AgentMoveCallback, type IContext, type IPlayoutMoveSelector, type MoveMessageCallback } from "./Model.js";
import type { IMove, IAI, ITrial } from "../context/Context.js";

/** Minimal pass-move factory — mirrors Game.createPassMove semantics */
function createPassMove(mover: number): IMove {
  return {
    mover: () => mover,
    isPass: () => true,
    fromNonDecision: () => -1,
    actions: () => [],
  } as IMove;
}

export class SimultaneousMove extends Model {

  // @java protected transient boolean ready = true;
  protected _ready: boolean = true;

  // @java protected transient boolean running = false;
  protected _running: boolean = false;

  // @java protected transient Move[] movesPerPlayer = null;
  protected _movesPerPlayer: (IMove | null)[] | null = null;

  // ThinkingThread[] deferred
  protected _currentThinkingThreads: null[] | null = null;

  // @java protected transient AI[] lastStepAIs;
  protected _lastStepAIs: (IAI | null)[] = [];

  // @java protected transient Move[] lastStepMoves;
  protected _lastStepMoves: (IMove | null)[] = [];

  // @java protected transient AgentMoveCallback preAgentMoveCallback;
  protected _preAgentMoveCallback: AgentMoveCallback | null = null;

  // @java protected transient AgentMoveCallback postAgentMoveCallback;
  protected _postAgentMoveCallback: AgentMoveCallback | null = null;

  // -------------------------------------------------------------------------

  override applyHumanMove(context: IContext, move: IMove, player: number): IMove | null {
    if (this._currentThinkingThreads !== null && this._currentThinkingThreads[player] !== null) return null;
    if (this._movesPerPlayer !== null && this._movesPerPlayer[player] === null) {
      this._addMoveForPlayer(context, move, player);
      return move;
    }
    return null;
  }

  override copy(): Model { return new SimultaneousMove(); }

  override expectsHumanInput(): boolean {
    if (!this._ready && this._running && this._currentThinkingThreads !== null) {
      for (let p = 1; p < this._currentThinkingThreads.length; p++) {
        if (this._currentThinkingThreads[p] === null && this._movesPerPlayer![p] === null) return true;
      }
      return false;
    }
    return false;
  }

  override interruptAIs(): void {
    if (!this._ready) {
      // ThinkingThread deferred
      this._lastStepAIs  = new Array(this._lastStepAIs.length).fill(null);
      this._lastStepMoves = new Array(this._lastStepMoves.length).fill(null);
      this._ready = true;
      this._running = false;
    }
  }

  override getLastStepAIs():   (IAI | null)[] | null  { return this._ready ? this._lastStepAIs   : null; }
  override getLastStepMoves(): (IMove | null)[] | null { return this._ready ? this._lastStepMoves : null; }
  override isReady():   boolean { return this._ready;   }
  override isRunning(): boolean { return this._running; }

  override randomStep(
    context: IContext,
    preCallback:  AgentMoveCallback | null,
    postCallback: AgentMoveCallback | null
  ): void {
    if (!this._ready && this._currentThinkingThreads !== null) {
      const legalMoves = context.game().moves(context).moves();

      for (let p = 1; p < this._currentThinkingThreads.length; p++) {
        if (this._currentThinkingThreads[p] === null && this._movesPerPlayer![p] === null) {
          // Collect moves for player p
          const playerMoves: IMove[] = [];
          for (let i = 0; i < legalMoves.size(); i++) {
            const m = legalMoves.get(i);
            if (m.mover() === p) playerMoves.push(m);
          }

          const passMove = createPassMove(p);
          if (playerMoves.length === 0) {
            preCallback?.call(passMove);
            this.applyHumanMove(context, passMove, p);
            postCallback?.call(passMove);
            return;
          }

          const move = playerMoves[Math.floor(Math.random() * playerMoves.length)]!;
          preCallback?.call(move);
          this.applyHumanMove(context, move, p);
          postCallback?.call(move);
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // startNewStep
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
    if (!this._ready) return;

    this._ready = false;
    this._preAgentMoveCallback  = preCallback;
    this._postAgentMoveCallback = postCallback;

    const checkValid = checkMoveValid ?? false;
    const msgCb      = moveMessageCallback ?? null;
    const numPlayers = context.game().players().count();

    this._movesPerPlayer = new Array<IMove | null>(numPlayers + 1).fill(null);
    this._lastStepAIs    = new Array<IAI | null>(numPlayers + 1).fill(null);
    this._lastStepMoves  = new Array<IMove | null>(numPlayers + 1).fill(null);
    this._currentThinkingThreads = new Array<null>(numPlayers + 1).fill(null);

    const legalMoves = context.game().moves(context).moves();

    if (block && forceNotThreaded) {
      // Non-threaded blocking path — fully transliterated
      for (let p = 1; p <= numPlayers; p++) {
        if (context.active(p)) {
          const agent: IAI = (ais[p] ?? null) as IAI;
          this._lastStepAIs[p] = agent;

          let move = agent.selectAction(
            context.game(),
            agent.copyContext(context),
            maxSeconds[p] ?? 1.0,
            maxIterations,
            maxSearchDepth
          );

          move = SimultaneousMove.checkMoveValidForPlayer(checkValid, context, move, p, msgCb);

          this._movesPerPlayer[p] = move;
          this._lastStepMoves[p]  = move;
        }
      }
      this._applyCombinedMove(context);

    } else if (block) {
      // Threaded blocking — deferred
      // Auto-pass any human players with no legal moves, then throw for AI
      for (let p = 1; p <= numPlayers; p++) {
        const agent: IAI | null = (ais == null || p >= ais.length) ? null : (ais[p] ?? null);
        this._lastStepAIs[p] = agent;

        if (context.active(p) && agent !== null) {
          throw new Error("SimultaneousMove.startNewStep: threaded AI path deferred (no ThinkingThread)");
        } else if (context.active(p)) {
          // Human — auto-pass if no legal moves
          let humanHasMoves = false;
          for (let i = 0; i < legalMoves.size(); i++) {
            if (legalMoves.get(i).mover() === p) { humanHasMoves = true; break; }
          }
          if (!humanHasMoves) {
            const passMove = createPassMove(p);
            preCallback?.call(passMove);
            this._addMoveForPlayer(context, passMove, p);
            postCallback?.call(passMove);
          }
        }
      }
    } else {
      this._running = true;
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
    throw new Error("SimultaneousMove.unpauseAgents: deferred – requires ThinkingThread");
  }

  override getLiveAIs(): IAI[] { return []; /* ThinkingThread deferred */ }

  override verifyMoveLegal(context: IContext, move: IMove): boolean {
    const legal = context.game().moves(context).moves();
    const moveActions = (move as unknown as { getActionsWithConsequences?(ctx: IContext): unknown[] })
      .getActionsWithConsequences?.(context) ?? move.actions();

    const mover = move.mover();
    let noLegalForMover = true;

    for (let i = 0; i < legal.size(); i++) {
      const m = legal.get(i);
      if (Model.movesEqualWithActions(move, moveActions as unknown[], m, context)) return true;
      if (m.mover() === mover) noLegalForMover = false;
    }

    if (noLegalForMover && (move as unknown as { isPass?(): boolean }).isPass?.()) return true;
    return false;
  }

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  _addMoveForPlayer(context: IContext, move: IMove, p: number): void {
    this._movesPerPlayer![p] = move;
    this._lastStepMoves[p]  = move;
    this._maybeApplyCombinedMove(context);
  }

  private _maybeApplyCombinedMove(context: IContext): void {
    if (!this._ready) {
      const numPlayers = context.game().players().count();
      for (let i = 1; i <= numPlayers; i++) {
        if (context.active(i) && this._movesPerPlayer![i] === null) return;
      }
      this._applyCombinedMove(context);
    }
  }

  private _applyCombinedMove(context: IContext): void {
    // Gather all actions
    const actions: unknown[] = [];
    const topLevelCons: unknown[] = [];
    let numSubmoves = 0;

    for (let p = 1; p < this._movesPerPlayer!.length; p++) {
      const mv = this._movesPerPlayer![p] ?? null;
      if (mv !== null) {
        const mvToAdd = wrapActionsAsMove(mv.actions());
        actions.push(mvToAdd);
        numSubmoves++;

        const thenList = (mv as unknown as { then?(): unknown[] }).then?.() ?? [];
        for (const cons of thenList) {
          if ((cons as unknown as { applyAfterAllMoves?(): boolean }).applyAfterAllMoves?.()) {
            topLevelCons.push(cons);
          } else {
            (mvToAdd as unknown as { then(): unknown[] }).then().push(cons);
          }
        }
      }
    }

    const combinedMove = wrapActionsAsMove(actions);
    combinedMove.setMover?.(this._movesPerPlayer!.length);
    (combinedMove as unknown as { then(): unknown[] }).then().push(...topLevelCons);

    context.game().apply(context, combinedMove as IMove);
    context.trial().setNumSubmovesPlayed(context.trial().numSubmovesPlayed() + numSubmoves);

    this._movesPerPlayer!.fill(null);
    this._ready = true;
    this._running = false;
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
    const numPlayers = game.players().count();
    let numActionsApplied = 0;

    while (!context.trial().over() && (maxNumPlayoutActions < 0 || maxNumPlayoutActions > numActionsApplied)) {
      const movesPerPlayerPlayout = new Array<IMove | null>(numPlayers + 1).fill(null);
      const legalObj = game.moves(context);
      const legalList = legalObj.moves();

      // Partition by player
      const legalPerPlayer: IMove[][] = [[]];
      for (let p = 1; p <= numPlayers; p++) legalPerPlayer.push([]);
      for (let i = 0; i < legalList.size(); i++) {
        const m = legalList.get(i);
        legalPerPlayer[m.mover()]!.push(m);
      }

      for (let p = 1; p <= numPlayers; p++) {
        if (context.active(p)) {
          const ai: IAI | null = (ais !== null ? ais[p] : null) ?? null;

          if (ai !== null) {
            movesPerPlayerPlayout[p] = ai.selectAction(game, ai.copyContext(context), thinkingTime, -1, -1);
          } else {
            const playerMoves: IMove[] = legalPerPlayer[p] ?? [];
            if (playerMoves.length === 0) playerMoves.push(createPassMove(p));

            if (
              playoutMoveSelector === null ||
              (maxNumBiasedActions >= 0 && maxNumBiasedActions < numActionsApplied) ||
              playoutMoveSelector.wantsPlayUniformRandomMove()
            ) {
              movesPerPlayerPlayout[p] = playerMoves[random.nextInt(playerMoves.length)] ?? null;
            } else {
              movesPerPlayerPlayout[p] = playoutMoveSelector.selectMove(context, playerMoves, p, () => true);
            }
          }
        }
      }

      // Combine
      const actions: unknown[] = [];
      const topLevelCons: unknown[] = [];
      for (let p = 1; p < movesPerPlayerPlayout.length; p++) {
        const mv: IMove | null = movesPerPlayerPlayout[p] ?? null;
        if (mv !== null) {
          const mvToAdd = wrapActionsAsMove(mv.actions());
          actions.push(mvToAdd);
          const thenList = (mv as unknown as { then?(): unknown[] }).then?.() ?? [];
          for (const cons of thenList) {
            if ((cons as unknown as { applyAfterAllMoves?(): boolean }).applyAfterAllMoves?.()) topLevelCons.push(cons);
            else (mvToAdd as unknown as { then(): unknown[] }).then().push(cons);
          }
        }
      }

      const combined = wrapActionsAsMove(actions);
      combined.setMover?.(movesPerPlayerPlayout.length);
      (combined as unknown as { then(): unknown[] }).then().push(...topLevelCons);

      game.apply(context, combined as IMove);
      numActionsApplied++;
    }

    return context.trial();
  }

  override callsGameMoves(): boolean { return true; }
  override movesPerPlayer(): (IMove | null)[] | null { return this._movesPerPlayer; }

  // -------------------------------------------------------------------------
  // Static helper
  // -------------------------------------------------------------------------

  static checkMoveValidForPlayer(
    check: boolean,
    context: IContext,
    move: IMove,
    player: number,
    callback: MoveMessageCallback | null
  ): IMove {
    if (check && !context.model().verifyMoveLegal(context, move)) {
      const all = context.game().moves(context).moves();
      const playerMoves: IMove[] = [];
      for (let i = 0; i < all.size(); i++) {
        if (all.get(i).mover() === player) playerMoves.push(all.get(i));
      }
      const randomMove = playerMoves[Math.floor(Math.random() * playerMoves.length)]!;
      const msg = `illegal move detected: ${JSON.stringify(move.actions())}, instead applying: ${JSON.stringify(randomMove.actions())}`;
      callback?.call(msg);
      console.warn(msg);
      return randomMove;
    }
    return move;
  }

  /** @java public static FastArrayList<Move> extractMovesForMover */
  static extractMovesForMover(allMoves: IMove[], mover: number): IMove[] {
    return allMoves.filter(m => m.mover() === mover);
  }
}

// ---------------------------------------------------------------------------
// Helper: wraps a list of actions as a minimal IMove-like object
// ---------------------------------------------------------------------------
function wrapActionsAsMove(actions: unknown[]): IMove & { setMover?(v: number): void; then(): unknown[] } {
  let _mover = -1;
  const _then: unknown[] = [];
  return {
    mover:             () => _mover,
    setMover:          (v: number) => { _mover = v; },
    isPass:            () => false,
    fromNonDecision:   () => -1,
    actions:           () => actions,
    then:              () => _then,
  };
}
