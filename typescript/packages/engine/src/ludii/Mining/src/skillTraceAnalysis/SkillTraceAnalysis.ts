// @java Mining/src/skillTraceAnalysis/SkillTraceAnalysis.java

import * as fs from "fs";
import { FileHandling } from "../../../Common/src/main/FileHandling.js";
import { GameLoader } from "../../../../ludemes/other/GameLoader.js";
import { SkillTrace } from "../../../Evaluation/src/metrics/designer/SkillTrace.js";

/**
 * Calculates the Skill Trace statistics for all games in Ludii.
 *
 * @java skillTraceAnalysis.SkillTraceAnalysis
 * @author Matthew.Stephenson
 */

// Not-yet-ported escape-hatch game interface that includes name()
type GameLike = {
  name: () => string;
  moves: (ctx: unknown) => { count: () => number };
  start: (ctx: unknown) => void;
};

/** @java SkillTraceAnalysis */
export class SkillTraceAnalysis {

  /**
   * Main entry point.
   * @java SkillTraceAnalysis.main(String[])
   */
  public static main(_args: string[]): void {
    const skillTraceMetric = new SkillTrace();
    skillTraceMetric.setAddToDatabaseFile(true);

    // Order all games by their branching factor estimate.
    const choicesBranchingFactors = new Map<string, number>();
    for (const s of FileHandling.listGames()) {
      if (FileHandling.shouldIgnoreLudRelease(s))
        continue;

      // Load the game and estimate branching factor as the number of legal moves at the start of the game.
      const game = GameLoader.loadGameFromName(s) as unknown as GameLike;
      // Create context via escape hatch (mirrors: new Trial(game); new Context(game, trial); game.start(context))
      const contextFactory = (globalThis as unknown as {
        createContext?: (game: GameLike) => unknown
      }).createContext;
      const context = contextFactory ? contextFactory(game) : {};
      game.start(context);
      const bf = game.moves(context).count();
      console.log(game.name() + " BF: " + bf);
      choicesBranchingFactors.set(s, bf);
    }

    // Sort by branching factor ascending
    const choicesSortedBranchingFactors = new Map<string, number>(
      [...choicesBranchingFactors.entries()].sort((a, b) => a[1] - b[1])
    );
    const choicesSorted: string[] = Array.from(choicesSortedBranchingFactors.keys());

    // Record games that have already been done, and should not be redone.
    const gameNamesAlreadyDone: string[] = [];
    try {
      const content = fs.readFileSync(skillTraceMetric.combinedResultsOutputPath(), "utf-8");
      for (const line of content.split("\n")) {
        if (line.trim().length === 0) continue;
        const gameName = line.split(",")[0] ?? "";
        gameNamesAlreadyDone.push(gameName);
      }
    } catch (e) {
      console.error(e);
    }

    // Calculate skill trace metrics for all games (in order of branching factor) that haven't already been done.
    for (const s of choicesSorted) {
      const game = GameLoader.loadGameFromName(s) as unknown as GameLike;
      if (gameNamesAlreadyDone.includes(game.name())) {
        console.log("\n------------");
        console.log(game.name() + " skipped");
        continue;
      }

      console.log("\n------------");
      console.log(game.name());

      skillTraceMetric.apply(
        game as unknown as Parameters<SkillTrace["apply"]>[0],
        null as unknown as Parameters<SkillTrace["apply"]>[1],
        null as unknown as Parameters<SkillTrace["apply"]>[2],
        null as unknown as Parameters<SkillTrace["apply"]>[3]
      );
    }
  }

}
