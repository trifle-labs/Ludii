// @java Core/src/other/action/others/ActionVote.java ActionVote
/**
 * Votes on a proposition done previously.
 *
 * Faithful 1:1 transliteration of other.action.others.ActionVote.
 *
 * @author Eric.Piette  (Java original)
 */

import { Action, BaseAction, LudiiContext, extractData } from "../Action.js";
import { ActionType } from "../ActionType.js";

export class ActionVote extends BaseAction {
  // -------------------------------------------------------------------------
  private readonly voteText: string;
  private readonly voteInt: number;

  private alreadyApplied = false;
  private previousVotes: number[] = [];
  private previousPropositions: number[] = [];
  private previousIsDecided = 0;
  // -------------------------------------------------------------------------

  constructor(voteOrDetailed: string, voteIntArg?: number) {
    super();
    if (voteIntArg === undefined) {
      const ds = voteOrDetailed;
      this.voteText = extractData(ds, "vote");
      this.voteInt = parseInt(extractData(ds, "voteInt"), 10);
      const strDecision = extractData(ds, "decision");
      this.decision = strDecision === "" ? false : strDecision === "true";
    } else {
      this.voteText = voteOrDetailed;
      this.voteInt = voteIntArg;
    }
  }

  apply(context: LudiiContext, _store: boolean): Action {
    context.state().votes().add(this.voteInt);

    const votes: number[] = context.state().votes();
    const nbPlayers: number = context.game().players().count();

    if (votes.length === nbPlayers) {
      if (!this.alreadyApplied) {
        this.previousIsDecided = context.state().isDecided();
        this.previousVotes = [...context.state().votes()].slice(0, votes.length - 1);
        this.previousPropositions = [...context.state().propositions()];
        this.alreadyApplied = true;
      }

      // Majority vote: find the most-voted value
      const counted = new Map<number, number>();
      for (const v of votes) {
        counted.set(v, (counted.get(v) ?? 0) + 1);
      }
      let best = -1;
      let bestCount = 0;
      let bestIdx = 0;
      votes.forEach((v, i) => {
        const c = counted.get(v) ?? 0;
        if (c > bestCount) { bestCount = c; best = v; bestIdx = i; }
      });
      void best; void bestIdx;

      context.state().setIsDecided(bestCount);
      context.state().votes().length = 0; // clear
      context.state().propositions().length = 0;
    }
    return this;
  }

  undo(context: LudiiContext, _discard: boolean): Action {
    if (this.alreadyApplied) {
      context.state().setIsDecided(this.previousIsDecided);
      const votes: number[] = context.state().votes();
      votes.length = 0;
      for (const v of this.previousVotes) votes.push(v);
      const props: number[] = context.state().propositions();
      props.length = 0;
      for (const p of this.previousPropositions) props.push(p);
    } else {
      context.state().votes().pop();
    }
    return this;
  }

  toTrialFormat(_context: LudiiContext | null): string {
    let sb = "[Vote:";
    sb += "vote=" + this.voteText;
    sb += ",voteInt=" + this.voteInt;
    if (this.decision) sb += ",decision=" + this.decision;
    sb += "]";
    return sb;
  }

  getDescription(): string { return "Vote"; }

  override toTurnFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "Vote " + this.voteText;
  }

  override toMoveFormat(_ctx: LudiiContext | null, _useCoords: boolean): string {
    return "(Vote " + this.voteText + ")";
  }

  override isVote(): boolean { return true; }
  override vote(): string { return this.voteText; }

  override actionType(): ActionType { return "Vote"; }
}
