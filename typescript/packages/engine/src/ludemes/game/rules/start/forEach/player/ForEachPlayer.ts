// @java Core/src/game/rules/start/forEach/player/ForEachPlayer.java

/**
 * Applies a start rule for each player (1..N), optionally limited to a
 * supplied player-index array.
 *
 * @java game/rules/start/forEach/player/ForEachPlayer.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../../context.js";
import type { IntArrayFunction } from "../../../../../base.js";

/**
 * Minimal interface for a start rule that can be eval'd with a Context.
 * @java game/rules/start/StartRule.java — eval(Context)
 */
interface JavaStartRule {
  eval(context: Context): void;
}

/**
 * Applies a start rule once per player. Sets context.player before each
 * invocation and restores it afterwards.
 *
 * @java game/rules/start/forEach/player/ForEachPlayer.java
 */
export class ForEachPlayer {
  /** @java ForEachPlayer.startRule */
  private readonly startRule: JavaStartRule;

  /** @java ForEachPlayer.playersFn — null means iterate all players 1..N */
  private readonly playersFn: IntArrayFunction | null;

  /**
   * @param startRule  The starting rule to apply per player.
   * @java ForEachPlayer(StartRule) — iterate all players
   */
  public constructor(startRule: JavaStartRule);
  /**
   * @param players   The list of players.
   * @param startRule The starting rule to apply.
   * @java ForEachPlayer(IntArrayFunction, StartRule)
   */
  public constructor(players: IntArrayFunction, startRule: JavaStartRule);
  public constructor(
    startRuleOrPlayers: JavaStartRule | IntArrayFunction,
    startRuleArg?: JavaStartRule,
  ) {
    if (startRuleArg !== undefined) {
      // Two-argument form: (IntArrayFunction, StartRule)
      this.playersFn = startRuleOrPlayers as IntArrayFunction;
      this.startRule = startRuleArg;
    } else {
      // One-argument form: (StartRule)
      this.playersFn = null;
      this.startRule = startRuleOrPlayers as JavaStartRule;
    }
  }

  /**
   * @java ForEachPlayer.eval(Context)
   *
   * Iterates players 1..N (or from playersFn), setting context.player before
   * each call to startRule.eval(context). Saves and restores context.player.
   */
  public eval(context: Context): void {
    // Java: final int savedPlayer = context.player();
    const savedPlayer = (context as unknown as { _evalPlayer?: number })._evalPlayer;

    if (this.playersFn === null) {
      // Java: for (int pid = 1; pid < context.game().players().size(); pid++)
      const numPlayers = context.game.numPlayers;
      for (let pid = 1; pid <= numPlayers; pid++) {
        // Java: context.setPlayer(pid); startRule.eval(context);
        (context as unknown as { _evalPlayer: number })._evalPlayer = pid;
        this.startRule.eval(context);
      }
    } else {
      // Java: final int[] players = playersFn.eval(context);
      const players = this.playersFn.eval(context as never);
      const numPlayers = context.game.numPlayers;
      for (const pid of players) {
        // Java: if (pid < 0 || pid > context.game().players().size()) continue;
        if (pid < 0 || pid > numPlayers) continue;
        // Java: context.setPlayer(pid); startRule.eval(context);
        (context as unknown as { _evalPlayer: number })._evalPlayer = pid;
        this.startRule.eval(context);
      }
    }

    // Java: context.setPlayer(savedPlayer);
    (context as unknown as { _evalPlayer?: number })._evalPlayer = savedPlayer;
  }

  /** @java ForEachPlayer.isStatic() — always false (player iteration is dynamic) */
  public isStatic(): boolean {
    return false;
  }

  /** @java ForEachPlayer.missingRequirement(Game) */
  public missingRequirement(game: unknown): boolean {
    let missing = false;
    missing = missing || ((this.playersFn as unknown as { missingRequirement?(g: unknown): boolean } | null)?.missingRequirement?.(game) ?? false);
    missing = missing || ((this.startRule as unknown as { missingRequirement?(g: unknown): boolean }).missingRequirement?.(game) ?? false);
    return missing;
  }

  /** @java ForEachPlayer.willCrash(Game) */
  public willCrash(game: unknown): boolean {
    let crash = false;
    crash = crash || ((this.playersFn as unknown as { willCrash?(g: unknown): boolean } | null)?.willCrash?.(game) ?? false);
    crash = crash || ((this.startRule as unknown as { willCrash?(g: unknown): boolean }).willCrash?.(game) ?? false);
    return crash;
  }

  /** @java ForEachPlayer.preprocess(Game) */
  public preprocess(game: unknown): void {
    (this.startRule as unknown as { preprocess?(g: unknown): void }).preprocess?.(game);
    (this.playersFn as unknown as { preprocess?(g: unknown): void } | null)?.preprocess?.(game);
  }

  /** @java ForEachPlayer.toEnglish(Game) */
  public toEnglish(game: unknown): string {
    const playersPart = this.playersFn
      ? (this.playersFn as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "players"
      : "all players";
    const rulePart = (this.startRule as unknown as { toEnglish?(g: unknown): string }).toEnglish?.(game) ?? "";
    return `for each player in ${playersPart} ${rulePart}`;
  }
}
