// @java Mining/src/utils/concepts/script/CreateLeMaitre4ClusterConceptScript.java

/**
 * Script to run the state concepts computation on the cluster.
 *
 * @java utils/concepts/script/CreateLeMaitre4ClusterConceptScript.java
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

/** @java CreateLeMaitre4ClusterConceptScript.JVM_MEM_MIN */
const JVM_MEM_MIN: string = "512g"; // 128g

/** @java CreateLeMaitre4ClusterConceptScript.JVM_MEM_MAX */
const JVM_MEM_MAX: string = "512g"; // 128g

/** @java CreateLeMaitre4ClusterConceptScript.MAX_WALL_TIME */
const MAX_WALL_TIME: number = 2880; // 2880 is the max on LeMaitre4

/** @java CreateLeMaitre4ClusterConceptScript.MAX_REQUEST_MEM */
const MAX_REQUEST_MEM: number = 600; // 600

/** @java CreateLeMaitre4ClusterConceptScript.CORES_PER_NODE */
const CORES_PER_NODE: number = 128; // 32

/** @java CreateLeMaitre4ClusterConceptScript.CORES_PER_PROCESS */
const CORES_PER_PROCESS: number = 128;

/** @java CreateLeMaitre4ClusterConceptScript.PROCESSES_PER_JOB */
const PROCESSES_PER_JOB: number = Math.floor(CORES_PER_NODE / CORES_PER_PROCESS);

/** @java CreateLeMaitre4ClusterConceptScript */
export class CreateLeMaitre4ClusterConceptScript {

  /** @java CreateLeMaitre4ClusterConceptScript.main(String[]) */
  public static main(_args: string[]): void {
    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const FileCls = (globalThis as unknown as { File: new (path: string) => FileLike }).File;
    const UnixPrintWriterCls = (globalThis as unknown as {
      UnixPrintWriter: new (file: FileLike, encoding: string) => UnixPrintWriterLike;
    }).UnixPrintWriter;

    const numPlayout: number = 100;
    const maxMove: number = 5000; //250; //5000; // Constants.DEFAULT_MOVES_LIMIT;
    const thinkingTime: number = 1;
    const agentName: string = "Random"; //"Alpha-Beta"; // Can be "UCT",  "Alpha-Beta", "Alpha-Beta-UCT", "AB-Odd-Even", "ABONEPLY", "UCTONEPLY", or "Random"
    const clusterLogin: string = "epiette";
    const folder: string = "/../../Trials/Trials" + agentName; //""; //"/../Trials/TrialsAll";
    const mainScriptName: string = "Concepts.sh";
    const folderName: string = "Concepts" + agentName;
    const jobName: string = agentName + "Concept";
    const numRulesetsPerBatch: number = 1; // 42

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

        for (let i = 0; i < (Math.floor(rulesetNames.length / numRulesetsPerBatch) + 1); i++) {
          const scriptName: string = "Concepts" + scriptId + ".sh";
          console.log(scriptName + " " + "created.");
          mainWriter.println("sbatch " + scriptName);

          try {
            const writer: UnixPrintWriterLike = new UnixPrintWriterCls(new FileCls(scriptName), "UTF-8");
            try {
              writer.println("#!/bin/bash");
              writer.println("#SBATCH -J GenConcepts" + jobName + "Script" + scriptId);
              writer.println("#SBATCH -p batch");
              writer.println("#SBATCH -o /globalscratch/ucl/ingi/" + clusterLogin + "/Out/Out_%J.out");
              writer.println("#SBATCH -e /globalscratch/ucl/ingi/" + clusterLogin + "/Err/Err_%J.err");
              writer.println("#SBATCH -t " + MAX_WALL_TIME);
              writer.println("#SBATCH -N 1");

              const numProcessesThisJob: number = PROCESSES_PER_JOB;

              writer.println("#SBATCH --cpus-per-task=" + (numProcessesThisJob * CORES_PER_PROCESS)); // 128s
              writer.println("#SBATCH --mem=" + MAX_REQUEST_MEM + "G");
              writer.println("#SBATCH --exclusive");
              writer.println("module load Java/11.0.20");

              for (let j = 0; j < numRulesetsPerBatch; j++) {
                if ((i * numRulesetsPerBatch + j) < rulesetNames.length) {
                  let jobLine: string = "";
                  //jobLine += "taskset -c ";
                  //jobLine += (3*j) + "," + (3*j + 1) + "," +  (3*j + 2) + " ";
                  jobLine +=
                    "java -Xms" +
                    JVM_MEM_MIN +
                    " -Xmx" +
                    JVM_MEM_MAX +
                    " -XX:+HeapDumpOnOutOfMemoryError -da -dsa -XX:+UseStringDeduplication -jar \"/globalscratch/ucl/ingi/" +
                    clusterLogin +
                    "/ludii/Concepts/" +
                    folderName +
                    "/Ludii.jar\" --export-moveconcept-db ";
                  jobLine +=
                    numPlayout +
                    " " +
                    MAX_WALL_TIME +
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
                  jobLine += rulesetNames[i * numRulesetsPerBatch + j];
                  jobLine += " " + "> /globalscratch/ucl/ingi/" + clusterLogin + "/Out/Out_${SLURM_JOB_ID}_" + j + ".out &";
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
