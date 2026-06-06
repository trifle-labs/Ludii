// @java Mining/src/utils/trials/CreateAachenClusterTrialsScript.java

/**
 * Script to generate all the .sh to generate the different trials
 *
 * @java utils/trials/CreateAachenClusterTrialsScript.java
 * @author Eric.Piette
 */

// Not-yet-ported dependencies — escape-hatch interfaces
type FileHandlingLike = { listGames: () => string[] };
type StringRoutinesLike = { cleanGameName: (s: string) => string };
type RulesetLike = { optionSettings: () => string[]; heading: () => string };
type GameDescriptionLike = { rulesets: () => RulesetLike[] | null };
type GameLike = { description: () => GameDescriptionLike };
type GameLoaderLike = { loadGameFromName: (name: string, ...opts: unknown[]) => GameLike };

/** @java CreateAachenClusterTrialsScript */
export class CreateAachenClusterTrialsScript {
  /**
   * @java CreateAachenClusterTrialsScript.main(String[])
   */
  public static main(_args: string[]): void {
    const numPlayout = 100;
    const maxMove = 5000; // Constants.DEFAULT_MOVES_LIMIT
    const allocatedMemoryJava = 4096;
    const thinkingTime = 1;
    const agentName = "UCT"; // Can be "UCT", "Alpha-Beta", "Alpha-Beta-UCT", "AB-Odd-Even", or "Random"
    const clusterLogin = "ls670643";
    const mainScriptName = "GenTrials.sh";

    // Access runtime services through escape-hatch globals
    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const stringRoutines = (globalThis as unknown as { StringRoutines: StringRoutinesLike }).StringRoutines;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;

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
      const lastSlash = gameName.lastIndexOf("/");
      const baseName = gameName.length === 0 ? "" : gameName.substring(lastSlash + 1, gameName.length);
      const fileName: string = gameName.length === 0 ? "" : stringRoutines.cleanGameName(baseName);

      const rulesetNames: string[] = [];
      const rulesetsInGame: RulesetLike[] | null = game.description().rulesets();

      // Get all the rulesets of the game if it has some.
      if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
        for (let rs = 0; rs < rulesetsInGame.length; rs++) {
          const ruleset = rulesetsInGame[rs]!;
          if (ruleset.optionSettings().length > 0) { // We check if the ruleset is implemented.
            rulesetNames.push(ruleset.heading());
          }
        }
      }

      if (rulesetNames.length === 0) {
        const scriptName = "GenTrials" + fileName + ".sh";
        console.log(scriptName + " " + "created.");

        const lines: string[] = [];
        lines.push("#!/usr/local_rwth/bin/zsh");
        lines.push("#SBATCH -J GenTrials" + agentName + fileName);
        lines.push("#!/usr/local_rwth/bin/zsh");
        lines.push("#SBATCH -o /work/" + clusterLogin + "/result/Out" + agentName + fileName + "Gentrials_%J.out");
        lines.push("#SBATCH -e /work/" + clusterLogin + "/result/Err" + agentName + fileName + "Gentrials_%J.err");
        lines.push("#SBATCH -t 6000");
        lines.push("#SBATCH --mem-per-cpu=" + Math.trunc(allocatedMemoryJava * 1.25));
        lines.push("#SBATCH -A um_dke");
        lines.push("unset JAVA_TOOL_OPTIONS");
        lines.push(
          "java -Xms" + allocatedMemoryJava + "M -Xmx" + allocatedMemoryJava + "M " +
          "-XX:+HeapDumpOnOutOfMemoryError -da -dsa -XX:+UseStringDeduplication " +
          "-jar \"/home/" + clusterLogin + "/ludii/Trials/Trials" + agentName + "/ludii.jar\" " +
          "--generate-trials " +
          maxMove + " " + thinkingTime + " " + numPlayout + " " +
          "\"" + agentName + "\"" + " " + "\"" + gameName.substring(1) + "\""
        );

        (globalThis as unknown as { FS: { writeFileSync: (p: string, d: string) => void } })
          .FS?.writeFileSync(scriptName, lines.join("\n") + "\n");

        mainLines.push("sbatch " + scriptName);
      } else {
        for (const rulesetName of rulesetNames) {
          const scriptName =
            "GenTrials" + fileName + "-" +
            stringRoutines.cleanGameName(rulesetName.substring(8)) + ".sh";

          console.log(scriptName + " " + "created.");

          const lines: string[] = [];
          lines.push("#!/usr/local_rwth/bin/zsh");
          lines.push("#SBATCH -J GenTrials" + agentName + fileName);
          lines.push("#!/usr/local_rwth/bin/zsh");
          lines.push("#SBATCH -o /work/" + clusterLogin + "/result/Out" + agentName + fileName + "Gentrials_%J.out");
          lines.push("#SBATCH -e /work/" + clusterLogin + "/result/Err" + agentName + fileName + "Gentrials_%J.err");
          lines.push("#SBATCH -t 6000");
          lines.push("#SBATCH --mem-per-cpu=" + Math.trunc(allocatedMemoryJava * 1.25));
          lines.push("#SBATCH -A um_dke");
          lines.push("unset JAVA_TOOL_OPTIONS");
          lines.push(
            "java -Xms" + allocatedMemoryJava + "M -Xmx" + allocatedMemoryJava + "M " +
            "-XX:+HeapDumpOnOutOfMemoryError -da -dsa -XX:+UseStringDeduplication " +
            "-jar \"/home/" + clusterLogin + "/ludii/Trials//Trials" + agentName + "/ludii.jar\" " +
            "--generate-trials " +
            maxMove + " " + thinkingTime + " " + numPlayout + " " +
            "\"" + agentName + "\"" + " " + "\"" + gameName.substring(1) + "\"" +
            " " + "\"" + rulesetName + "\""
          );

          (globalThis as unknown as { FS: { writeFileSync: (p: string, d: string) => void } })
            .FS?.writeFileSync(scriptName, lines.join("\n") + "\n");

          mainLines.push("sbatch " + scriptName);
        }
      }
    }

    (globalThis as unknown as { FS: { writeFileSync: (p: string, d: string) => void } })
      .FS?.writeFileSync(mainScriptName, mainLines.join("\n") + "\n");
  }
}
