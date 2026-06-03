// @java Core/src/game/rules/start/forEach/team/ForEachTeam.java

/**
 * Applies a start rule for each team in the game.
 *
 * @java game/rules/start/forEach/team/ForEachTeam.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";

/**
 * Minimal interface for a start rule that can be eval'd with a Context.
 * @java game/rules/start/StartRule.java — eval(Context)
 */
interface JavaStartRule {
  eval(context: Context): void;
}

/**
 * Applies a start rule once per team. For each team id (1..N) it collects the
 * player ids belonging to that team, sets context.team to that array, calls
 * startRule.eval, then restores context.team.
 *
 * @java game/rules/start/forEach/team/ForEachTeam.java
 */
export class ForEachTeam {
  /** @java ForEachTeam.startRule */
  private readonly startRule: JavaStartRule;

  /**
   * @param startingRule The starting rule to apply per team.
   * @java ForEachTeam(StartRule)
   */
  public constructor(startingRule: JavaStartRule) {
    this.startRule = startingRule;
  }

  /**
   * @java ForEachTeam.eval(Context)
   *
   * For each team id (1..numPlayers) builds the set of players in that team,
   * skips empty teams, sets context.team to that array and calls
   * startRule.eval(context). Saves and restores context.team.
   */
  public eval(context: Context): void {
    // Java: final int[] savedTeam = context.team();
    const ctxAny = context as unknown as {
      _evalTeam?: number[];
      state: {
        playerInTeam?(pid: number, tid: number): boolean;
      };
    };
    const savedTeam = ctxAny._evalTeam;
    const numPlayers = context.game.numPlayers;

    // Java: for (int tid = 1; tid < context.game().players().size(); tid++)
    for (let tid = 1; tid <= numPlayers; tid++) {
      const team: number[] = [];

      // Java: for (int pid = 1; pid < context.game().players().size(); pid++)
      for (let pid = 1; pid <= numPlayers; pid++) {
        // Java: if (context.state().playerInTeam(pid, tid)) team.add(pid);
        if (ctxAny.state.playerInTeam?.(pid, tid)) {
          team.push(pid);
        }
      }

      if (team.length > 0) {
        // Java: context.setTeam(team.toArray()); startRule.eval(context);
        ctxAny._evalTeam = team;
        this.startRule.eval(context);
      }
    }

    // Java: context.setTeam(savedTeam);
    ctxAny._evalTeam = savedTeam;
  }

  /** @java ForEachTeam.isStatic() */
  public isStatic(): boolean {
    return (this.startRule as unknown as { isStatic?(): boolean }).isStatic?.() ?? false;
  }

  /** @java ForEachTeam.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    return (this.startRule as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false;
  }

  /** @java ForEachTeam.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    return (this.startRule as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false;
  }

  /** @java ForEachTeam.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.startRule as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
  }
}
