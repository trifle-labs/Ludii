// @java Mining/src/reconstruction/preprocessing/ComputeCommonExpectedConcepts.java

import * as fs from "fs";
import { Concept } from "../../../../../ludemes/other/concept/Concept.js";
import { FileHandling } from "../../../../Common/src/main/FileHandling.js";
import { StringRoutines } from "../../../../Common/src/main/StringRoutines.js";
import { UnixPrintWriter } from "../../../../Common/src/main/UnixPrintWriter.js";
import { CompleterWithPrepro } from "../completer/CompleterWithPrepro.js";

// Escape-hatch: Compiler, Grammar, GameLoader not yet ported
type DescriptionLike = {
  raw(): string;
  expanded(): string;
  setExpanded(s: string): void;
  defineInstances(): unknown;
};

type GameLike = {
  name(): string;
  booleanConcepts(): BitSetLike;
  description(): { rulesets(): RulesetLike[] | null };
  metadata(): { info(): { getId(): string[] } };
};

type BitSetLike = {
  get(index: number): boolean;
};

type RulesetLike = {
  heading(): string;
  optionSettings(): string[];
};

type SymbolLike = {
  cls(): { getName(): string };
};

/**
 * Compute the average of common expected concepts between each reconstruction
 * and each complete ruleset.
 *
 * @java reconstruction.preprocessing.ComputeCommonExpectedConcepts
 * @author Eric.Piette
 */
export class ComputeCommonExpectedConcepts {

  /**
   * Generate the CSVs with the common expected concepts between each reconstruction
   * and the complete rulesets.
   *
   * @java ComputeCommonExpectedConcepts.generateCSVs()
   */
  public static generateCSVs(): void {
    console.log("Compute average common expected concepts between reconstruction and rulesets.");

    // Escape-hatch: FileHandling, GameLoader, Compiler
    const GameLoader = (globalThis as unknown as { GameLoader?: {
      loadGameFromName(name: string, opts?: string[]): GameLike;
      class: { getResourceAsStream(path: string): unknown };
    } }).GameLoader;
    const Compiler = (globalThis as unknown as { Compiler?: {
      compileTest(description: DescriptionLike, verbose: boolean): GameLike | null
    } }).Compiler;

    // Compute % Common Expected Concepts in each complete description for each ruleset.
    const gameNames = FileHandling.listGames();
    const conceptsNonBoolean = new Map<number, BitSetLike>();

    // Get the concepts of all complete description for each ruleset.
    for (let index = 0; index < gameNames.length; index++) {
      const nameGame = gameNames[index]!;
      if (nameGame.replace(/\\/g, "/").includes("/lud/bad/")) continue;
      if (nameGame.replace(/\\/g, "/").includes("/lud/wip/")) continue;
      if (nameGame.replace(/\\/g, "/").includes("/lud/WishlistDLP/")) continue;
      if (nameGame.replace(/\\/g, "/").includes("/lud/test/")) continue;
      if (nameGame.replace(/\\/g, "/").includes("subgame")) continue;
      if (nameGame.replace(/\\/g, "/").includes("reconstruction")) continue;

      if (!GameLoader) continue;
      const game = GameLoader.loadGameFromName(nameGame);
      const rulesetsInGame = game.description().rulesets();

      // Code for games with many rulesets
      if (rulesetsInGame !== null && rulesetsInGame.length > 0) {
        for (let rs = 0; rs < rulesetsInGame.length; rs++) {
          const ruleset = rulesetsInGame[rs]!;
          if (ruleset.optionSettings().length > 0) {
            // We check if the ruleset is implemented.
            const rulesetGame = GameLoader.loadGameFromName(nameGame, ruleset.optionSettings());
            const ids = rulesetGame.metadata().info().getId();
            if (ids === null || ids.length === 0) continue;
            const id = parseInt(ids[0]!);
            const concepts = rulesetGame.booleanConcepts();
            conceptsNonBoolean.set(id, concepts);
            console.log("id = " + id + " Done.");
          }
        }
      } else {
        // Code for games with a single ruleset.
        const ids = game.metadata().info().getId();
        if (ids === null || ids.length === 0) continue;
        const id = parseInt(ids[0]!);
        const concepts = game.booleanConcepts();
        conceptsNonBoolean.set(id, concepts);
        console.log("id = " + id + " Done.");
      }
    }

    console.log("Start compute Common Expected concepts for recons description.");
    // Check each recons description.
    const choices = FileHandling.listGames();
    for (const fileName of choices) {
      if (!fileName.replace(/\\/g, "/").includes("/lud/reconstruction/"))
        continue;

      const gameName = fileName.substring(fileName.lastIndexOf("/") + 1, fileName.length - 4);

      let filePath = fileName.replace(/\\/g, "/");
      filePath = filePath.substring(filePath.indexOf("/lud/"));

      let desc = "";
      // In Java this uses getResourceAsStream; in TS/Node we use GameLoader's resource stream.
      // Escape-hatch: load desc from file system.
      try {
        desc = FileHandling.loadTextContentsFromFile(fileName);
      } catch (e1) {
        console.error(e1);
      }

      const metadata = desc.includes("(metadata") ? desc.substring(desc.indexOf("(metadata")) : "";
      let idStr = metadata.includes("(id") ? metadata.substring(metadata.indexOf("(id") + 5) : "";
      idStr = idStr.substring(0, idStr.indexOf(')') - 1);
      const idRulesetToRecons = parseInt(idStr);

      // Get game description from resource
      console.log("Game: " + gameName + " id = " + idRulesetToRecons);
      const commonExpectedConcepts = ComputeCommonExpectedConcepts.computeCommonExpectedConcepts(desc);

      const beginOutput = "CommonExpectedConcept_";
      const endOutput = ".csv";

      try {
        const writer = new UnixPrintWriter(beginOutput + idRulesetToRecons + endOutput);
        for (const [rulesetId, conceptsRuleset] of conceptsNonBoolean.entries()) {
          let countCommonConcepts = 0;
          for (const concept of commonExpectedConcepts)
            if (conceptsRuleset.get(Concept[concept as keyof typeof Concept] as unknown as number))
              countCommonConcepts++;

          const avgCommonConcepts = commonExpectedConcepts.length === 0
            ? 0.0
            : (countCommonConcepts / commonExpectedConcepts.length);

          const lineToWrite: string[] = [];
          lineToWrite.push(rulesetId + "");
          lineToWrite.push(avgCommonConcepts + "");
          writer.printlnStr(StringRoutines.join(",", lineToWrite));
        }
        const content = writer.flush();
        fs.writeFileSync(beginOutput + idRulesetToRecons + endOutput, content, "utf8");
      } catch (e) {
        console.error(e);
      }
    }

    console.log("CommonExpectedConcepts CSVs Generated");
  }

  //-----------------------------------------------------------------------------

  /**
   * @param desc The reconstruction description of the game.
   * @return The list of concepts which are sure to be true for a reconstruction description.
   * @java ComputeCommonExpectedConcepts.computeCommonExpectedConcepts(String)
   */
  public static computeCommonExpectedConcepts(desc: string): string[] {
    const commonExpectedConcepts: string[] = [];

    // Keep only the game description.
    let descNoMetadata = desc.substring(0, desc.lastIndexOf("(metadata"));
    descNoMetadata = descNoMetadata.substring(0, descNoMetadata.lastIndexOf(')') + 1);

    const description: DescriptionLike = {
      raw: () => descNoMetadata,
      expanded: () => descNoMetadata,
      setExpanded(s: string) { descNoMetadata = s; },
      defineInstances: () => null,
    };
    CompleterWithPrepro.expandRecons(description, "");
    descNoMetadata = description.expanded();

    // Get all the ludemeplexes between parenthesis.
    const ludemeplexes: string[] = [];
    for (let i = 0; i < descNoMetadata.length; i++) {
      const c = descNoMetadata.charAt(i);
      if (c === '(') {
        let countParenthesis = 1;
        let indexCorrespondingParenthesis = i + 1;
        for (; indexCorrespondingParenthesis < descNoMetadata.length; indexCorrespondingParenthesis++) {
          if (descNoMetadata.charAt(indexCorrespondingParenthesis) === '(')
            countParenthesis++;
          else if (descNoMetadata.charAt(indexCorrespondingParenthesis) === ')')
            countParenthesis--;
          if (countParenthesis === 0) {
            indexCorrespondingParenthesis++;
            break;
          }
        }
        const ludemeplex = descNoMetadata.substring(i, indexCorrespondingParenthesis);

        // We keep the ludemeplexes with no completion point.
        if (!ludemeplex.includes("#") && !ludemeplex.includes("[") && !ludemeplex.includes("]"))
          ludemeplexes.push(ludemeplex);
      }
    }

    // Get the common concepts.
    for (const ludemeplex of ludemeplexes) {
      for (const concept of ComputeCommonExpectedConcepts.getCommonExpectedConcepts(ludemeplex)) {
        if (!commonExpectedConcepts.includes(concept))
          commonExpectedConcepts.push(concept);
      }
    }

    return commonExpectedConcepts;
  }

  //----------------------CODE TO GET THE CONCEPTS OF A STRING------------------------------------

  /**
   * @param str The description of the ludemeplex.
   * @return The common expected concepts of the ludemeplex.
   * @java ComputeCommonExpectedConcepts.getCommonExpectedConcepts(String)
   */
  static getCommonExpectedConcepts(str: string): string[] {
    const commonConcepts: string[] = [];

    if (str === null || str === "")
      return commonConcepts;

    try {
      const compiledObject = ComputeCommonExpectedConcepts.compileString(str);
      if (compiledObject !== null)
        commonConcepts.push(...ComputeCommonExpectedConcepts.evalConceptCompiledObject(compiledObject));
    } catch (_ex) {
      // Nothing to do.
    }

    return commonConcepts;
  }

  /**
   * Attempts to get the concepts from a ludemeplex.
   *
   * @java ComputeCommonExpectedConcepts.evalConceptCompiledObject(Object)
   */
  static evalConceptCompiledObject(obj: unknown): string[] {
    const commonConcepts: string[] = [];

    // Escape-hatch: Compiler, Game, Concept reflection not yet ported
    const Compiler = (globalThis as unknown as { Compiler?: {
      compileTest(description: DescriptionLike, verbose: boolean): GameLike | null
    } }).Compiler;

    if (!Compiler) return commonConcepts;

    // Default Game description to make the compiler happy, but not used except for this.
    const tempGameDesc: DescriptionLike = {
      raw: () => '(game "Test" (players 2) (equipment { (board (square 3)) (piece "Disc" Each) }) (rules (play (move Add (to (sites Empty)))) (end (if (is Line 3) (result Mover Win)))))',
      expanded: () => '(game "Test" (players 2) (equipment { (board (square 3)) (piece "Disc" Each) }) (rules (play (move Add (to (sites Empty)))) (end (if (is Line 3) (result Mover Win)))))',
      setExpanded(_s: string) { /* noop */ },
      defineInstances: () => null,
    };
    const tempGame = Compiler.compileTest(tempGameDesc, false);
    if (!tempGame) return commonConcepts;

    // Need to preprocess the ludemes before calling the eval method (via reflection).
    // In TS, we use escape-hatch interface for the compiled object.
    const objAsAny = obj as unknown as {
      preprocess?(game: GameLike): void;
      concepts?(game: GameLike): BitSetLike;
    };

    try {
      if (objAsAny.preprocess)
        objAsAny.preprocess(tempGame);
    } catch (_e) {
      // Nothing to do.
    }

    let concepts: BitSetLike | null = null;
    try {
      if (objAsAny.concepts)
        concepts = objAsAny.concepts(tempGame);
    } catch (_e) {
      // Nothing to do.
    }

    if (concepts !== null) {
      const conceptValues = Object.keys(Concept).filter(k => isNaN(Number(k)));
      for (let i = 0; i < conceptValues.length; i++) {
        const conceptName = conceptValues[i]!;
        if (concepts.get(i))
          commonConcepts.push(conceptName);
      }
    }

    return commonConcepts;
  }

  /**
   * Attempts to compile a given string for every possible symbol class.
   *
   * @return Compiled object if possible, else null.
   * @java ComputeCommonExpectedConcepts.compileString(String)
   */
  static compileString(str: string): unknown {
    // Escape-hatch: Grammar, Compiler.compileObject not yet ported
    const Grammar = (globalThis as unknown as { Grammar?: {
      grammar(): { symbolsWithPartialKeyword(token: string): SymbolLike[] }
    } }).Grammar;
    const Compiler = (globalThis as unknown as { Compiler?: {
      compileObject(str: string, className: string, report: unknown): unknown | null
    } }).Compiler;

    if (!Grammar || !Compiler) return null;

    let obj: unknown = null;

    const token = StringRoutines.getFirstToken(str);
    const symbols = Grammar.grammar().symbolsWithPartialKeyword(token);

    // Try each possible symbol for this token
    for (const symbol of symbols) {
      const className = symbol.cls().getName();
      const report = { isError: () => false, errors: () => [] };

      try {
        obj = Compiler.compileObject(str, className, report);
      } catch (_ex) {
        // Couldn't compile.
      }

      if (obj !== null)
        break;
    }

    return obj;
  }
}
