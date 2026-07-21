// @java Mining/src/utils/trials/CreateSneliusClusterTrialsScript.java

/**
 * Script to generate all the .sh to generate the different trials for the Snellius cluster on thin nodes.
 *
 * @java utils/trials/CreateSneliusClusterTrialsScript.java
 * @author Eric.Piette
 */

// Not-yet-ported dependencies — escape-hatch interfaces
type FileHandlingLike = { listGames: () => string[] };
type RulesetLike = { optionSettings: () => string[]; heading: () => string };
type GameDescriptionLike = { rulesets: () => RulesetLike[] | null };
type GameLike = { description: () => GameDescriptionLike };
type GameLoaderLike = { loadGameFromName: (name: string, ...opts: unknown[]) => GameLike };

/** @java CreateSneliusClusterTrialsScript */
export class CreateSneliusClusterTrialsScript {
  /**
   * @java CreateSneliusClusterTrialsScript.main(String[])
   */
  public static main(_args: string[]): void {
    const numPlayout = 100;
    const maxMove = 5000; // Constants.DEFAULT_MOVES_LIMIT
    const thinkingTime = 1;
    const agentName = "Alpha-Beta"; // Can be "UCT", "Alpha-Beta", "Alpha-Beta-UCT", "AB-Odd-Even", or "Random"
    const clusterLogin = "cbrowne";
    const mainScriptName = "GenTrials.sh";

    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const FS = (globalThis as unknown as { FS: { writeFileSync: (p: string, d: string) => void } }).FS;

    const rulesetNames: string[] = [];
    const mainLines: string[] = [];

    const gameNames: string[] = fileHandling.listGames();

    for (let index = 0; index < gameNames.length; index++) {
      const gameName = gameNames[index]!;
      const normalizedGameName = gameName.replace(/\\/g, "/");
      if (normalizedGameName.includes("/lud/bad/")) continue;
      if (normalizedGameName.includes("/lud/wip/")) continue;
      if (normalizedGameName.includes("/lud/WishlistDLP/")) continue;
      if (normalizedGameName.includes("/lud/test/")) continue;
      if (normalizedGameName.includes("subgame")) continue;
      if (normalizedGameName.includes("reconstruction/pending/")) continue;
      if (normalizedGameName.includes("reconstruction/validation/")) continue;

      const game: GameLike = gameLoader.loadGameFromName(gameName);

      const gameRulesetNames: string[] = [];
      const rulesetsInGame: RulesetLike[] | null = game.description().rulesets();

      // Get all the rulesets of the game if it has some.
      if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
        for (let rs = 0; rs < rulesetsInGame.length; rs++) {
          const ruleset = rulesetsInGame[rs]!;
          if (
            ruleset.optionSettings().length > 0 &&
            !ruleset.heading().includes("Incomplete")
          ) { // We check if the ruleset is implemented.
            gameRulesetNames.push(ruleset.heading());
          }
        }
      }

      // We get the name of all the rulesets
      if (gameRulesetNames.length === 0) {
        rulesetNames.push(gameName.substring(1) + "\"");
        console.log(gameName.substring(1));
      } else {
        for (const rulesetName of gameRulesetNames) {
          rulesetNames.push(gameName.substring(1) + "\"" + " " + "\"" + rulesetName + "\"");
          console.log(gameName.substring(1) + "/" + rulesetName);
        }
      }
    }

    console.log("***************************" + rulesetNames.length + " rulesets ***************************");
    let scriptId = 0;

    for (let i = 0; i < (Math.trunc(rulesetNames.length / 42) + 1); i++) {
      const scriptName = "GenTrial_" + scriptId + ".sh";
      mainLines.push("sbatch " + scriptName);

      const lines: string[] = [];
      lines.push("#!/bin/bash");
      lines.push("#SBATCH -J GenTrials" + agentName + "Script" + scriptId);
      lines.push("#SBATCH -p thin");
      lines.push("#SBATCH -o /home/" + clusterLogin + "/Out/Out_%J.out");
      lines.push("#SBATCH -e /home/" + clusterLogin + "/Out/Err_%J.err");
      lines.push("#SBATCH -t 6000");
      lines.push("#SBATCH -N 1");
      lines.push("#SBATCH --cpus-per-task=128");
      lines.push("#SBATCH --mem=224G");
      lines.push("#SBATCH --exclusive");
      lines.push("module load 2021");
      lines.push("module load Java/11.0.2");

      for (let j = 0; j < 42; j++) {
        if ((i * 42 + j) < rulesetNames.length) {
          let jobLine = "taskset -c ";
          jobLine += (3 * j) + "," + (3 * j + 1) + "," + (3 * j + 2) + " ";
          jobLine += "java -Xms5120M -Xmx5120M -XX:+HeapDumpOnOutOfMemoryError -da -dsa -XX:+UseStringDeduplication -jar \"/home/" + clusterLogin + "/ludii/Trials/Ludii.jar\" --generate-trials-parallel ";
          jobLine += maxMove + " " + thinkingTime + " " + numPlayout + " " + "\"" + agentName + "\"" + " " + "\"";
          jobLine += rulesetNames[i * 42 + j];
          jobLine += " " + "> /home/" + clusterLogin + "/Out/Out_${SLURM_JOB_ID}_" + j + ".out &";
          lines.push(jobLine);
        }
      }
      lines.push("wait");

      FS?.writeFileSync(scriptName, lines.join("\n") + "\n");
      scriptId++;
    }

    FS?.writeFileSync(mainScriptName, mainLines.join("\n") + "\n");
  }
}
