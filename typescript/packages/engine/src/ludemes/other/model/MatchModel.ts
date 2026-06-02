// @java Core/src/other/model/MatchModel.java MatchModel
/**
 * Faithful 1:1 transliteration of other.model.MatchModel.
 *
 * Model for multi-game Matches. Delegates to the model of the current
 * subgame instance.
 *
 * Deferrals:
 *  - playout(): match playout loop references Subgame.getGame() and
 *    context.advanceInstance(); structurally transliterated; the
 *    inner per-instance playout works, but advanceInstance() is deferred.
 *
 * Java parity: other/model/MatchModel.java
 */

import { Model, type AgentMoveCallback, type IContext, type IPlayoutMoveSelector, type MoveMessageCallback } from "./Model.js";
import type { IMove, IAI, ITrial } from "../context/Context.js";

export class MatchModel extends Model {

  // @java protected transient Model currentInstanceModel = null;
  protected _currentInstanceModel: Model | null = null;

  // -------------------------------------------------------------------------

  override applyHumanMove(context: IContext, move: IMove, player: number): IMove | null {
    return this._currentInstanceModel!.applyHumanMove(context, move, player);
  }

  override copy(): Model { return new MatchModel(); }

  override expectsHumanInput(): boolean {
    return this._currentInstanceModel !== null && this._currentInstanceModel.expectsHumanInput();
  }

  override getLastStepAIs(): (IAI | null)[] | null {
    return this._currentInstanceModel!.getLastStepAIs();
  }

  override getLastStepMoves(): (IMove | null)[] | null {
    return this._currentInstanceModel!.getLastStepMoves();
  }

  override interruptAIs(): void {
    if (this._currentInstanceModel !== null) this._currentInstanceModel.interruptAIs();
  }

  override isReady():   boolean { return this._currentInstanceModel === null || this._currentInstanceModel.isReady(); }
  override isRunning(): boolean { return this._currentInstanceModel !== null && this._currentInstanceModel.isRunning(); }

  override randomStep(
    context: IContext,
    preCallback:  AgentMoveCallback | null,
    postCallback: AgentMoveCallback | null
  ): void {
    this._currentInstanceModel!.randomStep(context, preCallback, postCallback);
  }

  /** @java public void resetCurrentInstanceModel() */
  resetCurrentInstanceModel(): void {
    this._currentInstanceModel = null;
  }

  override verifyMoveLegal(context: IContext, move: IMove): boolean {
    return context.subcontext().model().verifyMoveLegal(context, move);
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
    this._currentInstanceModel = context.subcontext()!.model();

    this._currentInstanceModel!.startNewStep(
      context, ais, maxSeconds, maxIterations, maxSearchDepth, minSeconds,
      block, forceThreaded, forceNotThreaded,
      preCallback, postCallback,
      checkMoveValid ?? false, moveMessageCallback ?? null
    );
  }

  override unpauseAgents(
    context: IContext,
    ais: (IAI | null)[],
    maxSeconds: number[],
    maxIterations: number,
    maxSearchDepth: number,
    minSeconds: number,
    preCallback:  AgentMoveCallback | null,
    postCallback: AgentMoveCallback | null,
    checkMoveValid: boolean,
    moveMessageCallback: MoveMessageCallback | null
  ): void {
    this._currentInstanceModel!.unpauseAgents(
      context, ais, maxSeconds, maxIterations, maxSearchDepth, minSeconds,
      preCallback, postCallback, checkMoveValid, moveMessageCallback
    );
  }

  override getLiveAIs(): IAI[] {
    return this._currentInstanceModel?.getLiveAIs() ?? ([] as IAI[]);
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
    const match = context.game();
    const matchTrial: ITrial = context.trial();

    let numActionsApplied = 0;

    while (!matchTrial.over() && (maxNumPlayoutActions < 0 || maxNumPlayoutActions > numActionsApplied)) {
      const instance   = match.instances()[context.currentSubgameIdx()];
      const instanceGame = instance.getGame();
      if (instanceGame === null) break;

      const subcontext = context.subcontext();
      const subtrial: ITrial = subcontext.trial();
      const numStartMoves = subtrial.numMoves();

      // May have to tell subtrial to store auxiliary data
      if (context.trial().auxilTrialData() !== null) {
        if (context.trial().auxilTrialData()!.legalMovesHistory() !== null)
          subtrial.storeLegalMovesHistory();
        if (context.trial().auxilTrialData()!.legalMovesHistorySizes() !== null)
          subtrial.storeLegalMovesHistorySizes();
      }

      const instanceEndTrial = instanceGame.playout(
        subcontext, ais, thinkingTime, playoutMoveSelector,
        maxNumBiasedActions, maxNumPlayoutActions - numActionsApplied, random
      ) as ITrial;

      // Append sub-trial moves to match-wide trial
      const subtrialMoves = (subtrial as unknown as { generateCompleteMovesList(): IMove[] }).generateCompleteMovesList();
      const numMovesAfter   = subtrialMoves.length;
      const numToAppend     = numMovesAfter - numStartMoves;
      for (let i = 0; i < numToAppend; i++) {
        context.trial().addMove(subtrialMoves[subtrialMoves.length - numToAppend + i]);
      }

      // If the instance is over, advance the match
      if (subcontext.trial().over()) {
        const legalMatchMoves = context.game().moves(context);
        const legalList = legalMatchMoves.moves();
        if (legalList.size() === 1 && (legalList.get(0) as unknown as { containsNextInstance?(): boolean }).containsNextInstance?.()) {
          context.game().apply(context, legalList.get(0));
        }
      }

      // May have to update match-wide auxiliary data
      if (context.trial().auxilTrialData() !== null) {
        (context.trial().auxilTrialData() as unknown as { updateFromSubtrial(t: ITrial): void })
          .updateFromSubtrial?.(subtrial);
        if (context.trial().auxilTrialData()!.legalMovesHistorySizes() !== null) {
          (context.trial().auxilTrialData()!.legalMovesHistorySizes() as number[]).push(1);
        }
      }

      numActionsApplied += (instanceEndTrial.numMoves() - numStartMoves);
    }

    return matchTrial;
  }

  override callsGameMoves(): boolean { return true; }
}
