// @java Mining/src/reconstruction/ReconstructionGenerator.java

import { fs } from "../../../node-shim/fs-lazy.js";
import { Completion } from "../../../Language/src/completer/Completion.js";
import { StringRoutines } from "../../../Common/src/main/StringRoutines.js";
import { UnixPrintWriter } from "../../../Common/src/main/UnixPrintWriter.js";
import { CompleterWithPrepro } from "./completer/CompleterWithPrepro.js";
import { FormatReconstructionOutputs } from "./utils/FormatReconstructionOutputs.js";

// Helper: Completion.idsUsed() is a public method but TypeScript sees the private
// field first due to same-name conflict in Completion.ts. Use a cast helper.
type CompletionPublicIds = { idsUsed(): number[]; otherIdsUsed(): number[][] };
function completionIds(c: Completion): number[] {
  return (c as unknown as CompletionPublicIds).idsUsed();
}
function completionOtherIds(c: Completion): number[][] {
  return (c as unknown as CompletionPublicIds).otherIdsUsed();
}

// Escape-hatch: Compiler not yet ported
type GameLike = {
  name(): string;
  hasMissingRequirement(): boolean;
  willCrash(): boolean;
  players(): { count(): number };
  moves(ctx: ContextLike): MovesLike;
  start(ctx: ContextLike): void;
  playout(ctx: ContextLike, ais: unknown[], maxSeconds: number, filter: unknown, depth: number, maxMoves: number, rng: unknown): void;
  getMaxTurnLimit(): number;
};

type ContextLike = {
  game(): GameLike;
  trial(): TrialLike;
};

type TrialLike = {
  over(): boolean;
  status(): { endType(): number };
  numTurns(): number;
  numberRealMoves(): number;
};

type MoveLike = {
  isPass(): boolean;
};

type MovesLike = {
  moves(): MoveLike[];
};

// Escape-hatch: Description not yet ported for this usage
type DescriptionLike = {
  raw(): string;
  expanded(): string;
  setExpanded(s: string): void;
  defineInstances(): unknown;
};

// Escape-hatch: Compiler not yet ported
type CompilerLike = {
  compileReconsTest(description: DescriptionLike, verbose: boolean): GameLike | null;
};

// Escape-hatch: Concept.isExpectedConcepts not yet ported
type ConceptLike = {
  isExpectedConcepts(desc: string): boolean;
};

// Escape-hatch: Trial constructor not yet ported
type TrialConstructorLike = {
  new(game: GameLike): TrialLike;
};

// Escape-hatch: Context constructor not yet ported
type ContextConstructorLike = {
  new(game: GameLike, trial: TrialLike): ContextLike;
};

// Escape-hatch: RandomAI not yet ported
type AILike = {
  initAI(game: GameLike, playerId: number): void;
};

/**
 * Reconstruction Generator.
 *
 * @java reconstruction.ReconstructionGenerator
 * @author Eric.Piette
 */
export class ReconstructionGenerator {

  /** @java ReconstructionGenerator.defaultOutputPath */
  static readonly defaultOutputPath: string        = "./res/recons/output/";
  /** @java ReconstructionGenerator.defaultNumReconsExpected */
  static readonly defaultNumReconsExpected: number = 10;
  /** @java ReconstructionGenerator.defaultNumAttempts */
  static readonly defaultNumAttempts: number       = 20000;
  /** @java ReconstructionGenerator.defaultDataPath */
  static readonly defaultDataPath: string          = "C:/Users/carni/Ludii/Ludii/Mining/res/recons/input/";
  /** @java ReconstructionGenerator.defaultReconsPath */
  static readonly defaultReconsPath: string        = "C:/Users/carni/Ludii/Ludii/Common/res/lud/reconstruction/pending/board/hunt/Rongmei Naga Hunt Game.lud";
  /** @java ReconstructionGenerator.defaultOptionName */
  static readonly defaultOptionName: string        = "Variant/Incomplete";

  /** @java ReconstructionGenerator.defaultConceptualWeight */
  static readonly defaultConceptualWeight: number    = 0.5;
  /** @java ReconstructionGenerator.defaultHistoricalWeight */
  static readonly defaultHistoricalWeight: number    = 0.5;
  /** @java ReconstructionGenerator.defaultGeographicalWeight */
  static readonly defaultGeographicalWeight: number  = 0.0;
  /** @java ReconstructionGenerator.defaultThreshold */
  static readonly defaultThreshold: number           = 0.99;
  /** @java ReconstructionGenerator.geographicalOrder */
  static readonly geographicalOrder: boolean         = true;

  /** @java ReconstructionGenerator.checkTimeoutRandomPlayout */
  static readonly checkTimeoutRandomPlayout: boolean = false;
  /** @java ReconstructionGenerator.defaultPlayoutsAttempts */
  static readonly defaultPlayoutsAttempts: number    = 100;

  /**
   * Main method to call the reconstruction with command lines.
   *
   * @java ReconstructionGenerator.main(String[])
   */
  public static main(args: string[]): void {
    const dataPath             = args.length === 0 ? ReconstructionGenerator.defaultDataPath          : args[0]!;
    const outputPath           = args.length < 1   ? ReconstructionGenerator.defaultOutputPath        : args[1]!;
    const numReconsNoWarningExpectedConcepts = args.length < 2 ? ReconstructionGenerator.defaultNumReconsExpected : parseInt(args[2]!);
    const maxNumberAttempts    = args.length < 3   ? ReconstructionGenerator.defaultNumAttempts       : parseInt(args[3]!);
    const conceptualWeight     = args.length < 4   ? ReconstructionGenerator.defaultConceptualWeight  : parseFloat(args[4]!);
    const historicalWeight     = args.length < 5   ? ReconstructionGenerator.defaultHistoricalWeight  : parseFloat(args[5]!);
    const geoWeight            = args.length < 6   ? ReconstructionGenerator.defaultGeographicalWeight: parseFloat(args[6]!);
    const reconsPath           = args.length < 8   ? ReconstructionGenerator.defaultReconsPath        : args[7]!;
    const optionName           = args.length < 8   ? ReconstructionGenerator.defaultOptionName        : args[8]!;

    ReconstructionGenerator.reconstruction(dataPath, outputPath, numReconsNoWarningExpectedConcepts, maxNumberAttempts, conceptualWeight, historicalWeight, geoWeight, reconsPath, optionName);
  }

  /**
   * @param dataPath           The path of the folder to place the reconstructions.
   * @param outputPath         The path of the folder to place the reconstructions.
   * @param numReconsExpected  The number of reconstruction expected to generate.
   * @param maxNumberAttempts  The number of attempts.
   * @param conceptualWeight   The weight of the expected concepts.
   * @param historicalWeight   The weight of the historical similarity.
   * @param reconsPath         The path of the file to recons.
   * @java ReconstructionGenerator.reconstruction(String, String, int, int, double, double, double, String, String)
   */
  public static reconstruction(
    dataPath: string,
    outputPath: string,
    numReconsExpected: number,
    maxNumberAttempts: number,
    conceptualWeight: number,
    historicalWeight: number,
    geographicalWeight: number,
    reconsPath: string,
    optionName: string,
  ): void {
    console.log("\n=========================================\nStart reconstruction:\n");
    console.log("Output Path = " + outputPath);
    console.log("Historical Weight = " + historicalWeight + " Conceptual Weight = " + conceptualWeight);
    const startAt = Date.now();

    // Load the game
    const completer = new CompleterWithPrepro(
      conceptualWeight, historicalWeight, geographicalWeight,
      ReconstructionGenerator.defaultThreshold,
      ReconstructionGenerator.geographicalOrder ? 0.99 : -1
    );
    const path = reconsPath.replace(/\\/g, "/");
    const gameName = path.substring(path.lastIndexOf("/") + 1, path.length - 4);

    // Get game description from resource
    console.log("Game: " + gameName);

    let desc = "";
    try {
      desc = fs.readFileSync(reconsPath.replace(/\\/g, "/"), "utf8");
    } catch (e1) {
      console.error(e1);
    }

    // Extract the metadata.
    const metadata = desc.includes("(metadata") ? desc.substring(desc.indexOf("(metadata")) : "";
    let reconsMetadata = "";
    if (metadata.includes("(recon")) {
      reconsMetadata = metadata.substring(metadata.indexOf("(recon"));
      let countParenthesis = 0;
      let charIndex = 0;
      for (; charIndex < reconsMetadata.length; charIndex++) {
        if (reconsMetadata.charAt(charIndex) === '(')
          countParenthesis++;
        else if (reconsMetadata.charAt(charIndex) === ')')
          countParenthesis--;
        if (countParenthesis === -1) {
          charIndex--;
          break;
        }
      }
      reconsMetadata = reconsMetadata.substring(0, charIndex);
      reconsMetadata = "(metadata " + reconsMetadata + ")";
    }

    // Extract the id of the reconstruction.
    let idStr = metadata.includes("(id") ? metadata.substring(metadata.indexOf("(id") + 5) : "";
    idStr = idStr.substring(0, idStr.indexOf(')') - 1);
    const idRulesetToRecons = parseInt(idStr);

    // Escape-hatch: Description and CompleterWithPrepro.expandRecons
    const description: DescriptionLike = {
      raw: () => desc,
      expanded: () => desc,
      setExpanded(s: string) { desc = s; },
      defineInstances: () => null,
    };
    CompleterWithPrepro.expandRecons(description, optionName);
    desc = StringRoutines.formatOneLineDesc(description.expanded());

    let numAttempts = 0;
    const correctCompletions: Completion[] = [];

    // Escape-hatch: Compiler, Concept, Context, Trial, RandomAI not yet ported
    const Compiler: CompilerLike = (globalThis as unknown as { Compiler?: CompilerLike }).Compiler ?? {
      compileReconsTest(_description: DescriptionLike, _verbose: boolean): GameLike | null { return null; }
    };
    const ConceptStatic: ConceptLike = (globalThis as unknown as { Concept?: ConceptLike }).Concept ?? {
      isExpectedConcepts(_desc: string): boolean { return true; }
    };
    const TrialConstructor: TrialConstructorLike = (globalThis as unknown as { Trial?: TrialConstructorLike }).Trial ?? (null as unknown as TrialConstructorLike);
    const ContextConstructor: ContextConstructorLike = (globalThis as unknown as { Context?: ContextConstructorLike }).Context ?? (null as unknown as ContextConstructorLike);
    const RandomAIClass: { new(): AILike } = (globalThis as unknown as { RandomAI?: { new(): AILike } }).RandomAI ?? (null as unknown as { new(): AILike });

    // End type constants
    const END_TYPE_MOVE_LIMIT = 2;
    const END_TYPE_TURN_LIMIT = 3;

    // Run the recons process until enough attempts are executed or all reconstructions are generated.
    while (numAttempts < maxNumberAttempts && correctCompletions.length < numReconsExpected) {
      console.log("numAttempts = " + numAttempts);
      let completion: Completion | null = null;

      // Run the completer.
      try {
        completion = completer.completeSampled(desc, idRulesetToRecons, dataPath);
      } catch (e) {
        console.error(e);
      }

      // Check the completions.
      if (completion !== null) {
        const completionRaw = FormatReconstructionOutputs.indentNicely(StringRoutines.unformatOneLineDesc(completion.getRaw()));
        // Test if the completion compiles.
        let game: GameLike | null = null;
        try {
          // Escape-hatch: Compiler.compileReconsTest
          const tempDesc: DescriptionLike = {
            raw: () => completionRaw,
            expanded: () => completionRaw,
            setExpanded(_s: string) { /* noop */ },
            defineInstances: () => null,
          };
          game = Compiler.compileReconsTest(tempDesc, false);
        } catch (_e) {
          // Not compilable
        }

        // It compiles.
        if (game !== null) {
          const rawDescMetadata = completionRaw + "\n" + reconsMetadata;
          completion.setRaw(rawDescMetadata);
          process.stdout.write("One Completion found");

          // Check if no warning and if no potential crash.
          if (!game.hasMissingRequirement() && !game.willCrash()) {
            process.stdout.write(" with no warning");

            // Check if the concepts expected are present.
            if (ConceptStatic.isExpectedConcepts(rawDescMetadata)) {
              process.stdout.write(" and with the expected concepts");

              let context: ContextLike | null = null;
              if (ContextConstructor && TrialConstructor) {
                context = new ContextConstructor(game, new TrialConstructor(game));
                game.start(context);
              }

              if (context !== null) {
                const legalMoves = context.game().moves(context);

                // Check if a non pass move is part of the first legal moves
                let aNonPassMove = false;
                for (const move of legalMoves.moves())
                  if (!move.isPass()) { aNonPassMove = true; break; }

                if (aNonPassMove) {
                  process.stdout.write(" and with legal moves");

                  let allGood = true;

                  if (ReconstructionGenerator.checkTimeoutRandomPlayout) {
                    // Run random playouts and check if at least one is not timeout.
                    allGood = false;
                    let playoutAttempts = 0;
                    while (!allGood && playoutAttempts <= ReconstructionGenerator.defaultPlayoutsAttempts) {
                      if (ContextConstructor && TrialConstructor && RandomAIClass) {
                        const contextRandomPlayout = new ContextConstructor(game, new TrialConstructor(game));
                        const ais: (AILike | null)[] = [];
                        ais.push(null);
                        // Init the ais.
                        for (let p = 1; p <= game.players().count(); ++p) {
                          ais.push(new RandomAIClass());
                          ais[p]!.initAI(game, p);
                        }
                        game.start(contextRandomPlayout);
                        game.playout(contextRandomPlayout, ais, 1.0, null, 0, -1, null);
                        const trial = contextRandomPlayout.trial();
                        const endType = trial.status().endType();
                        const trialTimedOut = endType === END_TYPE_MOVE_LIMIT || endType === END_TYPE_TURN_LIMIT;
                        if (!trialTimedOut)
                          allGood = true;
                      }
                      playoutAttempts++;
                    }
                  } else {
                    console.log(" and with at least a complete playout");
                  }

                  // All good, add to the list of correct completions.
                  if (allGood) {
                    let descAlreadyObtained = false;
                    for (const correctCompletion of correctCompletions) {
                      if (correctCompletion.getRaw() === completion!.getRaw()) {
                        correctCompletion.addOtherIds(completionIds(completion!));
                        console.log("FOUND ONE MORE COMBINATION OF A COMPLETION ALREADY REACHED");
                        console.log("Still " + correctCompletions.length + " COMPLETIONS GENERATED.");
                        descAlreadyObtained = true;
                        break;
                      }
                    }

                    if (!descAlreadyObtained) {
                      correctCompletions.push(completion);
                      console.log("Score = " + completion.getScore() + " Cultural Score = " + completion.getCulturalScore() + " Conceptual Score = " + completion.getConceptualScore() + " Geographical Score = " + completion.getGeographicalScore());
                      console.log("ids used = " + completionIds(completion));
                      console.log(completion.getRaw());
                      console.log(correctCompletions.length + " COMPLETIONS GENERATED.");
                    }
                  }
                }
              }
            }
          }
          console.log();
        }
      }
      numAttempts++;
      console.log("Current Num Attempts = " + numAttempts);
      console.log(correctCompletions.length + " recons generated for now");
    }

    // We rank the completions.
    correctCompletions.sort((c1, c2) => c1.getScore() < c2.getScore() ? 1 : c1.getScore() === c2.getScore() ? 0 : -1);

    for (let n = 1; n < correctCompletions.length + 1; n++) {
      const c = correctCompletions[n - 1]!;
      console.log("Completion " + n + " has a score of " + c.getScore() +
        " Cultural Score = " + c.getCulturalScore() +
        " conceptual score = " + c.getConceptualScore() +
        " geographical score = " + c.getGeographicalScore() +
        " IDS used = " + completionIds(c) +
        (completionOtherIds(c).length === 0 ? "" : " other possible IDS = " + completionOtherIds(c)));
      CompleterWithPrepro.saveCompletion(outputPath + gameName + "/", gameName + " (Ludii " + n + ")", c.getRaw());
    }

    console.log("Num Attempts = " + numAttempts);
    console.log(correctCompletions.length + " recons generated");

    const outputReconsData = outputPath + gameName + ".csv";
    try {
      const writer = new UnixPrintWriter(outputReconsData);
      for (let n = 1; n < correctCompletions.length + 1; n++) {
        const c = correctCompletions[n - 1]!;
        const lineToWrite: string[] = [];
        lineToWrite.push(gameName + " (Ludii " + n + ")");
        lineToWrite.push(idRulesetToRecons + "");
        lineToWrite.push(c.getScore() + "");
        lineToWrite.push(c.getCulturalScore() + "");
        lineToWrite.push(c.getConceptualScore() + "");
        lineToWrite.push(c.getGeographicalScore() + "");
        lineToWrite.push(completionIds(c) + "");
        lineToWrite.push(completionOtherIds(c) + "");
        writer.printlnStr(StringRoutines.join(",", lineToWrite));
      }
      // Write to disk (mirrors Java's PrintWriter close/flush)
      const content = writer.flush();
      fs.writeFileSync(outputReconsData, content, "utf8");
    } catch (e) {
      console.error(e);
    }

    const stopAt = Date.now();
    const secs = (stopAt - startAt) / 1000.0;
    console.log("\nDone in " + secs + "s.");
  }
}
