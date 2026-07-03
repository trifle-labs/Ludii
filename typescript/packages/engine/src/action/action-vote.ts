// @java Core/src/other/action/others/ActionVote.java ActionVote
/** Java parity: Core/src/other/action/others/ActionVote.java. */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";

export class ActionVote extends BaseAction {
  public static readonly TYPE: ActionType = "Vote";

  private readonly voteText: string;
  /** Player count for the majority test; 0 = unknown (vote recorded, never resolves). */
  private readonly numPlayers: number;

  public constructor(vote: string, numPlayers = 0) {
    super();
    this.voteText = vote;
    this.numPlayers = numPlayers;
  }

  /**
   * @java ActionVote.apply (ActionVote.java:100-155) — votes().add(voteInt);
   * once EVERY player has voted, the first-reaching plurality vote wins IF it
   * holds a strict majority (count > nbPlayers/2): setIsDecided(vote); then
   * clearPropositions() and clearVotes() regardless. The TS state stores vote
   * STRINGS (State.votes / State.decided), matching the propositions channel.
   */
  public override apply(state: State): State {
    const votes = [...state.votes, this.voteText];
    if (this.numPlayers > 0 && votes.length === this.numPlayers) {
      let countForDecision = 0;
      let decision: string | null = null;
      const checked = new Set<string>();
      for (let i = 0; i < votes.length; i += 1) {
        const v = votes[i]!;
        if (checked.has(v)) continue;
        checked.add(v);
        let current = 0;
        for (let j = i; j < votes.length; j += 1) if (votes[j] === v) current += 1;
        if (current > countForDecision) {
          countForDecision = current;
          decision = v;
        }
      }
      // @java "Decision takes only by a majority of player."
      const resolved = countForDecision > Math.floor(this.numPlayers / 2) ? decision : state.decided;
      return state.withVotesState([], resolved ?? null);
    }
    return state.withVotesState(votes);
  }
  public override actionType(): ActionType {
    return ActionVote.TYPE;
  }
  public override isVote(): boolean {
    return true;
  }
  public override vote(): string {
    return this.voteText;
  }
}
