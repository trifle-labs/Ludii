// @java Mining/src/utils/concepts/CommonConcepts.java

/**
 * Method to get the common concepts (and avg for the numerical ones) between a
 * set of games and avg of same value/diff value for each boolean concept.
 *
 * @java utils/concepts/CommonConcepts.java
 * @author Eric.Piette
 */

// Not-yet-ported dependency escape-hatch interfaces
type FileLike = { listFiles: () => FileLike[]; isDirectory: () => boolean; getPath: () => string; getName: () => string };
type FileHandlingLike = { loadTextContentsFromFile: (path: string) => string };
type CompilerLike = { compileTest: (desc: DescriptionLike, b: boolean) => GameLike | null };
type DescriptionLike = object;
type GameLike = {
  booleanConcepts: () => BitSetLike;
  nonBooleanConcepts: () => Map<number, string>;
};
type BitSetLike = { get: (id: number) => boolean };
type ConceptLike = {
  id: () => number;
  name: () => string;
  dataType: () => ConceptDataTypeLike;
  type: () => ConceptTypeLike;
};
type ConceptDataTypeLike = { equals: (other: ConceptDataTypeLike) => boolean; name: () => string };
type ConceptTypeLike = { equals: (other: ConceptTypeLike) => boolean };
type TIntArrayListLike = { add: (v: number) => void; get: (i: number) => number; size: () => number; removeAt: (i: number) => void };

/** @java CommonConcepts.gamesToCompare */
const gamesToCompare: string[] = ["Go", "Oware"];

/** @java CommonConcepts.games */
const games: GameLike[] = [];

/** @java CommonConcepts.type — put a value here to get only one single concept type */
const type: ConceptTypeLike | null = null;

/** @java CommonConcepts */
export class CommonConcepts {

  /**
   * Main method.
   * @java CommonConcepts.main(String[])
   */
  public static main(_args: string[]): void {
    const Concept = (globalThis as unknown as { Concept: { values: () => ConceptLike[] } }).Concept;
    const ConceptDataType = (globalThis as unknown as { ConceptDataType: { BooleanData: ConceptDataTypeLike; StringData: ConceptDataTypeLike } }).ConceptDataType;

    const booleanConceptsID: number[] = [];
    const booleanConceptsName: string[] = [];
    const nonBooleanConceptsID: number[] = [];
    const nonBooleanConceptsName: string[] = [];

    // We get the concepts.
    for (const concept of Concept.values()) {
      if (concept.dataType().equals(ConceptDataType.BooleanData)) {
        if (type === null || concept.type().equals(type)) {
          booleanConceptsID.push(concept.id());
          booleanConceptsName.push(concept.name());
        }
      } else if (!concept.dataType().equals(ConceptDataType.StringData)) {
        nonBooleanConceptsID.push(concept.id());
        nonBooleanConceptsName.push(concept.name());
      }
    }

    CommonConcepts.getGames();

    const totalBooleanConcept: number = booleanConceptsID.length;

    // Check the number of times all the games have the same value for the concepts and the number of times they have a different value (only for boolean).
    let sameValue: number = 0;
    let differentValue: number = 0;
    for (let i = booleanConceptsID.length - 1; i >= 0; i--) {
      const idConcept: number = booleanConceptsID[i]!;
      const hasConcept: boolean = games[0]!.booleanConcepts().get(idConcept);
      let allSameValue: boolean = true;
      for (let j = 1; j < games.length; j++) {
        const game: GameLike = games[j]!;
        if (
          (game.booleanConcepts().get(idConcept) && !hasConcept) ||
          (!game.booleanConcepts().get(idConcept) && hasConcept)
        ) {
          differentValue++;
          allSameValue = false;
          break;
        }
        if (allSameValue)
          sameValue++;
      }
    }

    // Keep Only the common boolean concepts.
    for (let i = booleanConceptsID.length - 1; i >= 0; i--) {
      const idConcept: number = booleanConceptsID[i]!;
      for (const game of games) {
        if (!game.booleanConcepts().get(idConcept)) {
          booleanConceptsID.splice(i, 1);
          booleanConceptsName.splice(i, 1);
          break;
        }
      }
    }

    console.log("Common Boolean Concepts: \n");

    for (let i = 0; i < booleanConceptsName.length; i++)
      console.log(booleanConceptsName[i]);

    console.log("\nAVG Boolean Concepts with same value and AVG Boolean with different values: \n");
    const fmtNum = (v: number): string => {
      return (Math.round(v * 100) / 100).toFixed(2).replace(/\.?0+$/, "");
    };
    console.log("Same Value = " + fmtNum((sameValue / totalBooleanConcept) * 100) + " %");
    console.log("different Value = " + fmtNum((differentValue / totalBooleanConcept) * 100) + " %");

    console.log("\nAvg Numerical Concepts:\n");

    // We export the non boolean concepts.
    for (let i = 0; i < nonBooleanConceptsID.length; i++) {
      const idConcept: number = nonBooleanConceptsID[i]!;
      const conceptName: string = nonBooleanConceptsName[i]!;
      let sum: number = 0.0;

      for (const game of games)
        sum += parseFloat(game.nonBooleanConcepts().get(idConcept) ?? "0");

      console.log(conceptName + ": " + (sum / games.length));
    }
  }

  /**
   * Get the compiled games.
   * @java CommonConcepts.getGames()
   */
  public static getGames(): void {
    const fileHandling = (globalThis as unknown as { FileHandling: FileHandlingLike }).FileHandling;
    const Compiler = (globalThis as unknown as { Compiler: CompilerLike }).Compiler;
    const Description = (globalThis as unknown as { Description: new (desc: string) => DescriptionLike }).Description;
    const FileCls = (globalThis as unknown as { File: new (path: string) => FileLike }).File;

    const startFolder: FileLike = new FileCls("../Common/res/lud");
    const gameDirs: FileLike[] = [];
    gameDirs.push(startFolder);
    const entries: FileLike[] = [];
    const moreSpecificFolder: string = "";

    for (let i = 0; i < gameDirs.length; ++i) {
      const gameDir: FileLike = gameDirs[i]!;

      for (const fileEntry of gameDir.listFiles()) {
        if (fileEntry.isDirectory()) {
          const fileEntryPath: string = fileEntry.getPath().replace(/\\/g, "/");

          if (fileEntryPath === "../Common/res/lud/plex")
            continue;

          if (fileEntryPath === "../Common/res/lud/wip")
            continue;

          if (fileEntryPath === "../Common/res/lud/wishlist")
            continue;

          if (fileEntryPath === "../Common/res/lud/WishlistDLP")
            continue;

          if (fileEntryPath === "../Common/res/lud/test")
            continue;

          if (fileEntryPath === "../Common/res/lud/puzzle/deduction")
            continue; // skip deduction puzzles

          if (fileEntryPath === "../Common/res/lud/bad")
            continue;

          if (fileEntryPath === "../Common/res/lud/bad_playout")
            continue;

          // We exclude that game from the tests because the legal
          // moves are too slow to test.
          if (fileEntryPath.includes("Residuel"))
            continue;

          gameDirs.push(fileEntry);
        } else {
          const fileEntryPath: string = fileEntry.getPath().replace(/\\/g, "/");
          if (moreSpecificFolder === "" || fileEntryPath.includes(moreSpecificFolder))
            entries.push(fileEntry);
        }
      }
    }

    for (const fileEntry of entries) {
      const gameName: string = fileEntry.getName();
      let found: boolean = false;
      for (const name of gamesToCompare) {
        if (gameName === name + ".lud") {
          found = true;
          break;
        }
      }
      if (!found)
        continue;

      const ludPath: string = fileEntry.getPath().replace(/\\/g, "/");
      let desc: string = "";
      try {
        desc = fileHandling.loadTextContentsFromFile(ludPath);
      } catch (ex) {
        throw new Error("Unable to open or read file '" + ludPath + "': " + ex);
      }

      // Parse and compile the game
      const game: GameLike | null = Compiler.compileTest(new Description(desc), false);
      if (game === null)
        throw new Error("COMPILATION FAILED for the file : " + ludPath);
      else
        games.push(game);
    }
  }
}
