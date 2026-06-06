// @java Mining/src/utils/ExportGameType.java

/**
 * Method to create a csv file listing all the GameTypes used by each game.
 *
 * @java utils/ExportGameType.java
 * @author Eric Piette
 */

// Not-yet-ported dependency escape-hatch interfaces
type FileHandlingLike = { listGames: () => string[] };
type StringRoutinesLike = { join: (sep: string, parts: string[]) => string };
type GameLoaderLike = { loadGameFromName: (name: string) => GameLike };
type GameLike = { name: () => string; gameFlags: () => bigint };
type GameTypeClassLike = { getFields: () => FieldLike[] };
type FieldLike = { getName: () => string; getLong: (cls: unknown) => bigint; toString: () => string };

/** @java ExportGameType */
export class ExportGameType {

  /**
   * Main method
   * @java ExportGameType.main(String[])
   */
  public static main(_args: string[]): void {
    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const stringRoutines = (globalThis as unknown as { StringRoutines: StringRoutinesLike }).StringRoutines;
    const gameLoader = (globalThis as unknown as { GameLoader: GameLoaderLike }).GameLoader;
    const GameTypeClass = (globalThis as unknown as { GameType: GameTypeClassLike }).GameType;

    const outputLines: string[] = [];

    try {
      const fields: FieldLike[] = GameTypeClass.getFields();
      const flags: string[] = new Array(fields.length);
      const flagsValues: bigint[] = new Array(fields.length);

      for (let i = 0; i < fields.length; i++) {
        let fieldStr: string = fields[i]!.toString();
        fieldStr = fieldStr.substring(fieldStr.lastIndexOf(".") + 1);
        flags[i] = fieldStr;
        flagsValues[i] = fields[i]!.getLong(GameTypeClass);
      }

      const headers: string[] = new Array(flags.length + 1);
      headers[0] = "Game Name";
      for (let i = 0; i < flags.length; i++)
        headers[i + 1] = flags[i]!;

      // Write header line
      outputLines.push(stringRoutines.join(",", headers));

      const gameNames: string[] = fileHandling.listGames();

      for (const gameName of gameNames) {
        const normalizedName: string = gameName.replace(/\\/g, "/");
        if (normalizedName.includes("/lud/bad/"))
          continue;

        if (normalizedName.includes("/lud/wip/"))
          continue;

        if (normalizedName.includes("/lud/WishlistDLP/"))
          continue;

        if (normalizedName.includes("/lud/test/"))
          continue;

        console.log("Loading game: " + gameName);
        const game: GameLike = gameLoader.loadGameFromName(gameName);
        const flagsOn: string[] = new Array(flags.length + 1);
        flagsOn[0] = game.name();
        for (let i = 0; i < flagsValues.length; i++) {
          if ((game.gameFlags() & flagsValues[i]!) !== 0n)
            flagsOn[i + 1] = "Yes";
          else
            flagsOn[i + 1] = "";
        }

        // Write row for this game
        outputLines.push(stringRoutines.join(",", flagsOn));
      }

      // Write output file
      (globalThis as unknown as { writeFile: (path: string, lines: string[]) => void }).writeFile(
        "./res/concepts/output/LudiiGameFlags.csv",
        outputLines
      );
    } catch (e) {
      console.error(e);
    }
  }
}
