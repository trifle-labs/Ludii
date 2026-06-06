// @java Mining/src/utils/concepts/script/CreateAachenClusterConceptScript.java

/**
 * Script to run the state concepts computation on the cluster.
 *
 * @java utils/concepts/script/CreateAachenClusterConceptScript.java
 * @author Eric.Piette
 */

// Not-yet-ported dependency escape-hatch interfaces
type FileHandlingLike = { listGames: () => string[] };
type StringRoutinesLike = { cleanGameName: (s: string) => string };
type RulesetLike = { optionSettings: () => string[]; heading: () => string };
type GameDescriptionLike = { rulesets: () => RulesetLike[] | null };
type GameLike = { description: () => GameDescriptionLike };
type GameLoaderLike = { loadGameFromName: (name: string) => GameLike };
type FileLike = object;
type UnixPrintWriterLike = { println: (s: string) => void; close: () => void };

/** @java CreateAachenClusterConceptScript */
export class CreateAachenClusterConceptScript {

  /** @java CreateAachenClusterConceptScript.main(String[]) */
  public static main(_args: string[]): void {
    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const stringRoutines = (globalThis as unknown as { StringRoutines: StringRoutinesLike }).StringRoutines;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const FileCls = (globalThis as unknown as { File: new (path: string) => FileLike }).File;
    const UnixPrintWriterCls = (globalThis as unknown as {
      UnixPrintWriter: new (file: FileLike, encoding: string) => UnixPrintWriterLike;
    }).UnixPrintWriter;

    const maxTimeMinutesCluster: number = 6000; // 6000
    const numPlayout: number = 100;
    const maxTime: number = 175000;
    const maxMove: number = 5000; //250; //5000; // Constants.DEFAULT_MOVES_LIMIT;
    const allocatedMemoryJava: number = 4096;
    const thinkingTime: number = 1;
    const agentName: string = "Alpha-Beta"; // Can be "UCT",  "Alpha-Beta", "Alpha-Beta-UCT", "AB-Odd-Even", "ABONEPLY", "UCTONEPLY", or "Random"
    const clusterLogin: string = "ls670643";
    const folder: string = "/../Trials/TrialsAlpha-Beta"; //""; //"/../Trials/TrialsAll";
    const mainScriptName: string = "StateConcepts.sh";
    const folderName: string = "ConceptsAB";
    const jobName: string = "ABConcept";

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

          const game: GameLike = gameLoader.loadGameFromName(gameName);

          const lastSlash: number = gameName.lastIndexOf("/");
          const baseName: string = gameName.length === 0 ? "" : gameName.substring(lastSlash + 1, gameName.length);
          const fileName: string = gameName.length === 0 ? "" : stringRoutines.cleanGameName(baseName);

          const rulesetNames: string[] = [];
          const rulesetsInGame: RulesetLike[] | null = game.description().rulesets();

          // Get all the rulesets of the game if it has some.
          if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
            for (let rs = 0; rs < rulesetsInGame.length; rs++) {
              const ruleset: RulesetLike = rulesetsInGame[rs]!;
              if (ruleset.optionSettings().length > 0) // We check if the ruleset is implemented.
                rulesetNames.push(ruleset.heading());
            }
          }

          if (rulesetNames.length === 0) {
            const scriptName: string = "StateConcepts" + fileName + ".sh";

            console.log(scriptName + " " + "created.");

            try {
              const writer: UnixPrintWriterLike = new UnixPrintWriterCls(new FileCls(scriptName), "UTF-8");
              try {
                writer.println("#!/usr/local_rwth/bin/zsh");
                writer.println("#SBATCH -J " + jobName + fileName);
                writer.println("#!/usr/local_rwth/bin/zsh");
                writer.println("#SBATCH -o /work/" + clusterLogin + "/result/Out" + fileName + "_%J.out");
                writer.println("#SBATCH -e /work/" + clusterLogin + "/result/Err" + fileName + "_%J.err");
                writer.println("#SBATCH -t " + maxTimeMinutesCluster);
                writer.println("#SBATCH --mem-per-cpu=" + Math.floor(allocatedMemoryJava * 1.25));
                writer.println("#SBATCH -A um_dke");
                writer.println("unset JAVA_TOOL_OPTIONS");
                writer.println(
                  "java -Xms" +
                    allocatedMemoryJava +
                    "M -Xmx" +
                    allocatedMemoryJava +
                    "M -XX:+HeapDumpOnOutOfMemoryError -da -dsa -XX:+UseStringDeduplication -jar \"/home/" +
                    clusterLogin +
                    "/ludii/" +
                    folderName +
                    "/ludii.jar\" --export-moveconcept-db " +
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
                    "\"" +
                    gameName.substring(1) +
                    "\""
                );
                mainWriter.println("sbatch " + scriptName);
              } finally {
                writer.close();
              }
            } catch (e) {
              console.error(e);
            }
          } else {
            for (const rulesetName of rulesetNames) {
              const scriptName: string =
                "StateConcepts" +
                fileName +
                "-" +
                stringRoutines.cleanGameName(rulesetName.substring(8)) +
                ".sh";

              console.log(scriptName + " " + "created.");

              try {
                const writer: UnixPrintWriterLike = new UnixPrintWriterCls(new FileCls(scriptName), "UTF-8");
                try {
                  writer.println("#!/usr/local_rwth/bin/zsh");
                  writer.println("#SBATCH -J " + jobName + fileName);
                  writer.println("#!/usr/local_rwth/bin/zsh");
                  writer.println("#SBATCH -o /work/" + clusterLogin + "/result/Out" + fileName + "_%J.out");
                  writer.println("#SBATCH -e /work/" + clusterLogin + "/result/Err" + fileName + "_%J.err");
                  writer.println("#SBATCH -t " + maxTimeMinutesCluster);
                  writer.println("#SBATCH --mem-per-cpu=" + Math.floor(allocatedMemoryJava * 1.25));
                  writer.println("#SBATCH -A um_dke");
                  writer.println("unset JAVA_TOOL_OPTIONS");
                  writer.println(
                    "java -Xms" +
                      allocatedMemoryJava +
                      "M -Xmx" +
                      allocatedMemoryJava +
                      "M -XX:+HeapDumpOnOutOfMemoryError -da -dsa -XX:+UseStringDeduplication -jar \"/home/" +
                      clusterLogin +
                      "/ludii/" +
                      folderName +
                      "/ludii.jar\" --export-moveconcept-db " +
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
                      "\"" +
                      gameName.substring(1) +
                      "\"" +
                      " " +
                      "\"" +
                      rulesetName +
                      "\""
                  );
                  mainWriter.println("sbatch " + scriptName);
                } finally {
                  writer.close();
                }
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
      } finally {
        mainWriter.close();
      }
    } catch (e) {
      console.error(e);
    }
  }
}
