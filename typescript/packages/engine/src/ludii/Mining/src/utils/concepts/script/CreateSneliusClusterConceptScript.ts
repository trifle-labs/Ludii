// @java Mining/src/utils/concepts/script/CreateSneliusClusterConceptScript.java

/**
 * Script to run the state concepts computation on the cluster.
 *
 * @java utils/concepts/script/CreateSneliusClusterConceptScript.java
 * @author Eric.Piette
 */

// Not-yet-ported dependency escape-hatch interfaces
type FileHandlingLike = { listGames: () => string[] };
type RulesetLike = { optionSettings: () => string[]; heading: () => string };
type GameDescriptionLike = { rulesets: () => RulesetLike[] | null };
type GameLike = { description: () => GameDescriptionLike };
type GameLoaderLike = { loadGameFromName: (name: string) => GameLike };
type FileLike = object;
type UnixPrintWriterLike = { println: (s: string) => void; close: () => void };

/** @java CreateSneliusClusterConceptScript */
export class CreateSneliusClusterConceptScript {

  /** @java CreateSneliusClusterConceptScript.main(String[]) */
  public static main(_args: string[]): void {
    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const FileCls = (globalThis as unknown as { File: new (path: string) => FileLike }).File;
    const UnixPrintWriterCls = (globalThis as unknown as {
      UnixPrintWriter: new (file: FileLike, encoding: string) => UnixPrintWriterLike;
    }).UnixPrintWriter;

    const numPlayout: number = 100;
    const maxTime: number = 175000;
    const maxMove: number = 5000; //250; //5000; // Constants.DEFAULT_MOVES_LIMIT;
    const thinkingTime: number = 1;
    const agentName: string = "UCT"; //"Alpha-Beta"; // Can be "UCT",  "Alpha-Beta", "Alpha-Beta-UCT", "AB-Odd-Even", "ABONEPLY", "UCTONEPLY", or "Random"
    const folder: string = "/../Trials/Trials" + agentName; //""; //"/../Trials/TrialsAll";
    const mainScriptName: string = "Concepts.sh";
    const folderName: string = "Concepts" + agentName;
    const jobName: string = agentName + "Concept";
    const clusterLogin: string = "cbrowne";

    const rulesetNames: string[] = [];

    try {
      const mainWriter: UnixPrintWriterLike = new UnixPrintWriterCls(new FileCls(mainScriptName), "UTF-8");
      try {
        const gameNames: string[] = fileHandling.listGames();

        for (let index = 0; index < gameNames.length; index++) {
          const gameName: string = gameNames[index]!;
          const normalizedGameName: string = gameName.replace(/\\/g, "/");
          if (normalizedGameName.includes("/lud/bad/"))
            continue;

          if (normalizedGameName.includes("/lud/wip/"))
            continue;

          if (normalizedGameName.includes("/lud/WishlistDLP/"))
            continue;

          if (normalizedGameName.includes("/lud/test/"))
            continue;

          if (normalizedGameName.includes("subgame"))
            continue;

          if (normalizedGameName.includes("reconstruction/pending/"))
            continue;

          if (normalizedGameName.includes("reconstruction/validation/"))
            continue;

          // For the museum game.
          //				if(!gameName.contains("Ludus Coriovalli"))
          //					continue;

          const game: GameLike = gameLoader.loadGameFromName(gameName);

          //				const fileName = gameName.isEmpty() ? ""
          //						: StringRoutines.cleanGameName(gameName.substring(gameName.lastIndexOf('/') + 1, gameName.length()));

          const gameRulesetNames: string[] = [];
          const rulesetsInGame: RulesetLike[] | null = game.description().rulesets();

          // Get all the rulesets of the game if it has some.
          if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
            for (let rs = 0; rs < rulesetsInGame.length; rs++) {
              const ruleset: RulesetLike = rulesetsInGame[rs]!;
              if (
                ruleset.optionSettings().length > 0 &&
                !ruleset.heading().includes("Incomplete")
              ) // We check if the ruleset is implemented.
                gameRulesetNames.push(ruleset.heading());
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
        let scriptId: number = 0;

        for (let i = 0; i < (Math.floor(rulesetNames.length / 42) + 1); i++) {
          const scriptName: string = "Concepts" + scriptId + ".sh";
          console.log(scriptName + " " + "created.");
          mainWriter.println("sbatch " + scriptName);

          try {
            const writer: UnixPrintWriterLike = new UnixPrintWriterCls(new FileCls(scriptName), "UTF-8");
            try {
              writer.println("#!/bin/bash");
              writer.println("#SBATCH -J GenConcepts" + jobName + "Script" + scriptId);
              writer.println("#SBATCH -p thin");
              writer.println("#SBATCH -o /home/" + clusterLogin + "/Out/Out_%J.out");
              writer.println("#SBATCH -e /home/" + clusterLogin + "/Out/Err_%J.err");
              writer.println("#SBATCH -t 6000");
              writer.println("#SBATCH -N 1");
              writer.println("#SBATCH --cpus-per-task=128");
              writer.println("#SBATCH --mem=224G");
              writer.println("#SBATCH --exclusive");
              writer.println("module load 2021");
              writer.println("module load Java/11.0.2");

              for (let j = 0; j < 42; j++) {
                if ((i * 42 + j) < rulesetNames.length) {
                  let jobLine: string = "taskset -c ";
                  jobLine += (3 * j) + "," + (3 * j + 1) + "," + (3 * j + 2) + " ";
                  jobLine +=
                    "java -Xms5120M -Xmx5120M -XX:+HeapDumpOnOutOfMemoryError -da -dsa -XX:+UseStringDeduplication -jar \"/home/" +
                    clusterLogin +
                    "/ludii/" +
                    folderName +
                    "/Ludii.jar\" --export-moveconcept-db ";
                  jobLine +=
                    numPlayout +
                    " " +
                    maxTime +
                    " " +
                    thinkingTime +
                    " " +
                    maxMove +
                    " " +
                    "\"" +
                    agentName +
                    "\"" +
                    " " +
                    "\"" +
                    folder +
                    "\"" +
                    " " +
                    "\"";
                  jobLine += rulesetNames[i * 42 + j];
                  jobLine += " " + "> /home/" + clusterLogin + "/Out/Out_${SLURM_JOB_ID}_" + j + ".out &";
                  writer.println(jobLine);
                }
              }
              writer.println("wait");
            } finally {
              writer.close();
            }
          } catch (e) {
            console.error(e);
          }
          scriptId++;
        }
      } finally {
        mainWriter.close();
      }
    } catch (e) {
      console.error(e);
    }
  }
}
