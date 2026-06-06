// @java Generation/src/approaches/random/Generator.java

/**
 * Random ludeme generator.
 *
 * @java approaches/random/Generator.java
 * @author cambolbro
 */

import { Grammar } from "../../../../Language/src/grammar/Grammar.js";
import { EBNF } from "../../../../Common/src/main/grammar/ebnf/EBNF.js";
import { EBNFRule } from "../../../../Common/src/main/grammar/ebnf/EBNFRule.js";
import { EBNFClause } from "../../../../Common/src/main/grammar/ebnf/EBNFClause.js";
import { EBNFClauseArg } from "../../../../Common/src/main/grammar/ebnf/EBNFClauseArg.js";
import { StringRoutines } from "../../../../Common/src/main/StringRoutines.js";
import { FileHandling } from "../../../../Common/src/main/FileHandling.js";
import { Baptist } from "../../../../Common/src/main/grammar/Baptist.js";
import { Description } from "../../../../Common/src/main/grammar/Description.js";
import { Report } from "../../../../Common/src/main/grammar/Report.js";
import { UserSelections } from "../../../../Common/src/main/options/UserSelections.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported dependencies

/** Minimal interface for compiler.Compiler. @java compiler.Compiler */
interface Compiler_ {
  compileTest(description: Description_, verbose: boolean): Game_ | null;
}

/** Minimal interface for game.Game. @java game.Game */
interface Game_ {
  name(): string;
  players(): { count(): number };
  hasMissingRequirement(): boolean;
  willCrash(): boolean;
  isBoardless(): boolean;
  hasSubgames(): boolean;
  isDeductionPuzzle(): boolean;
  hasCard(): boolean;
  hasDominoes(): boolean;
  hasLargePiece(): boolean;
  isAlternatingMoveGame(): boolean;
  hiddenInformation(): boolean;
  start(context: Context_): void;
  playout(
    context: Context_,
    ais: unknown[] | null,
    timeLimit: number,
    playoutMoveSelector: unknown | null,
    maxSeconds: number,
    maxMoves: number,
    rng: unknown
  ): Trial_ | null;
  moves(context: Context_): { moves(): Move_[] };
}

/** Minimal interface for other.context.Context. @java other.context.Context */
interface Context_ {
  [key: string]: unknown;
}

/** Minimal interface for other.trial.Trial. @java other.trial.Trial */
interface Trial_ {
  generateCompleteMovesList(): Move_[];
  numMoves(): number;
  over(): boolean;
}

/** Minimal interface for other.move.Move. @java other.move.Move */
interface Move_ {
  isDecision(): boolean;
}

/** Minimal interface for main.grammar.Description. @java main.grammar.Description */
interface Description_ {
  expanded(): string | null;
  [key: string]: unknown;
}

// Stub for Expander (not yet ported in this batch)
const Expander = {
  expand(
    _description: Description_,
    _userSelections: UserSelections,
    _report: Report,
    _verbose: boolean
  ): void {},
};

// Stub for Compiler (not yet ported in this batch)
const CompilerStub: Compiler_ = {
  compileTest(_description: Description_, _verbose: boolean): Game_ | null {
    return null;
  },
};

// Stub for Context/Trial construction (not yet ported in this batch)
function newContext(_game: Game_): Context_ {
  return {} as Context_;
}

function newTrial(_game: Game_): Trial_ {
  return {
    generateCompleteMovesList(): Move_[] { return []; },
    numMoves(): number { return 0; },
    over(): boolean { return true; },
  };
}

// ---------------------------------------------------------------------------

/**
 * First item in each entry is the relevant ludeme name, the second item
 * is the list of strings that can be used in it wherever a <string>
 * parameter is expected. Repeat strings that you want to occur more often.
 *
 * @java Generator.stringPool
 */
const stringPool: string[][][] = [
  // Player
  [
    [ // Ludemes:
      "player",
    ],
    [ // Strings:
      "A", "A", "A", "A", "B", "B", "B", "B", "C", "C", "D",
    ],
  ],

  // Piece
  [
    [ // Ludemes:
      "piece", "hop", "slide", "fromTo", "place", "leap", "step",
      "shoot", "promotion", "count",
    ],
    [ // Strings:
      "Disc", "Disc", "Disc", "Disc", "Disc0", "Disc0", "Disc1", "Disc1",
      "Disc2", "Disc2", "Disc3", "Disc3", "Disc4", "Disc4", "Disc5", "Disc6",
      "DiscA", "DiscB", "DiscA1", "DiscB1", "DiscA2", "DiscB2",
      "Pawn", "Pawn", "Pawn0", "Pawn1", "Pawn2", "Pawn3", "Pawn4",
      "King", "King0", "King1", "King2", "King3",
    ],
  ],

  // Region
  [
    [ // Ludemes:
      "regions", "region", "sites",
    ],
    [ // Strings:
      "Region", "Region0", "Region1", "Region2", "Region3", "Region4",
    ],
  ],

  // Track
  [
    [ // Ludemes:
      "track",
    ],
    [ // Strings:
      "Track", "Track0", "Track1", "Track2", "Track3", "Track4",
    ],
  ],

  // Vote
  [
    [ // Ludemes:
      "vote",
    ],
    [ // Strings:
      "Yes", "No", "Maybe",
    ],
  ],

  // Propose
  [
    [ // Ludemes:
      "propose",
    ],
    [ // Strings:
      "Win", "Draw", "Loss", "Tie", "Pass",
    ],
  ],

  // Hints
  [
    [ // Ludemes:
      "hints",
    ],
    [ // Strings:
      "Hints", "Hints0", "Hints1", "Hints2", "Hints3",
    ],
  ],
];

/** Maximum search depth. @java Generator.MAX_DEPTH */
const MAX_DEPTH = 100;

/** Point at which to stop random playouts. @java Generator.MAX_MOVES */
const MAX_MOVES_CONST = 2000;

/** Maximum length for generated arrays. @java Generator.MAX_ARRAY_LENGTH */
const MAX_ARRAY_LENGTH = 10;

// ---------------------------------------------------------------------------

/**
 * A seeded pseudo-random number generator mirroring java.util.Random.
 *
 * Java uses a 48-bit linear congruential generator. We approximate it
 * faithfully using BigInt arithmetic so the numeric sequences match.
 */
class JavaRandom {
  private seed: bigint;

  private static readonly multiplier = 0x5DEECE66Dn;
  private static readonly addend     = 0xBn;
  private static readonly mask       = (1n << 48n) - 1n;

  public constructor(seed: number | bigint) {
    this.seed = (BigInt(seed) ^ JavaRandom.multiplier) & JavaRandom.mask;
  }

  private next(bits: number): number {
    this.seed = (this.seed * JavaRandom.multiplier + JavaRandom.addend) & JavaRandom.mask;
    // Arithmetic right-shift by (48-bits), then convert to signed 32-bit int
    const shifted = this.seed >> BigInt(48 - bits);
    // Bring into signed 32-bit range
    const n = Number(BigInt.asIntN(32, shifted));
    return n;
  }

  /** @java Random.nextInt(int) */
  public nextInt(bound?: number): number {
    if (bound === undefined) {
      return this.next(32);
    }
    if (bound <= 0) throw new Error("bound must be positive");
    if ((bound & (bound - 1)) === 0) {
      // power of 2
      return Math.floor((bound * this.next(31)) / (1 << 31));
    }
    let bits: number;
    let val: number;
    do {
      bits = this.next(31);
      val  = bits % bound;
    } while (bits - val + (bound - 1) < 0);
    return val;
  }

  /** @java Random.nextLong() */
  public nextLong(): bigint {
    return (BigInt(this.next(32)) << 32n) + BigInt(this.next(32));
  }
}

// ---------------------------------------------------------------------------

export class Generator {

  // -------------------------------------------------------------------------

  /**
   * @param ruleName Rule name.
   * @param seed     RNG seed.
   * @return Ludemeplex description generated by completing this rule.
   *
   * @java Generator.generate(String, long)
   */
  public static generate(ruleName: string, seed: number | bigint): string {
    const rng = new JavaRandom(seed);

    rng.nextInt();  // Burn first value

    const rules = Generator.findRules(ruleName);
    if (rules.length === 0) {
      console.log("** Rule " + ruleName + " could not be found.");
      return "";
    }

    let ludeme = Generator.complete(rules[rng.nextInt(rules.length)]!, rng, 0);

    ludeme = Generator.instantiatePrimitives(ludeme, rng);

    // Format nicely
    const report   = new Report();
    const description: Description_ = new (Description as unknown as new (s: string) => Description_)(ludeme);
    const userSels = new UserSelections([]);

    Expander.expand(description, userSels, report, false);

    if (report.isError())
      return ludeme;

    return (description.expanded() ?? ludeme);
  }

  // -------------------------------------------------------------------------

  /**
   * @return Returns list of rules that match a given name.
   *
   * @java Generator.findRules(String)
   */
  static findRules(ruleName: string): EBNFRule[] {
    const list: EBNFRule[] = [];

    const ebnf: EBNF = (Grammar.grammar() as unknown as { ebnfObj(): EBNF }).ebnfObj();

    let str = StringRoutines.toDromedaryCase(ruleName);

    // Try exact match
    let rule = ebnf.rules().get(str) ?? null;
    if (rule !== null) {
      list.push(rule);
      return list;
    }

    // Try match with rule delimiters '<...>'
    rule = ebnf.rules().get("<" + str + ">") ?? null;
    if (rule !== null) {
      list.push(rule);
      return list;
    }

    // Find any match
    if (str.charAt(0) === "<")
      str = str.substring(1);
    if (str.charAt(str.length - 1) === ">")
      str = str.substring(0, str.length - 1);

    for (const ruleN of ebnf.rules().values()) {
      let strN = ruleN.lhs();
      if (strN.charAt(0) === "<")
        strN = strN.substring(1);
      if (strN.charAt(strN.length - 1) === ">")
        strN = strN.substring(0, strN.length - 1);

      while (strN.includes(".")) {
        const c = strN.indexOf(".");
        strN = strN.substring(c + 1);
      }

      if (strN.toLowerCase() === str.toLowerCase())
        list.push(ruleN);
    }

    return list;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Complete ludemeplex string from a given rule.
   *
   * @java Generator.complete(EBNFRule, Random, int)
   */
  private static complete(rule: EBNFRule, rng: JavaRandom, depth: number): string {
    if (depth > MAX_DEPTH) {
      console.log("** Maximum depth " + MAX_DEPTH + " exceeded in complete() A.");
      return "";
    }

    // Check for quick exit to limit recursion depth
    if (rule.lhs() === "<int>") {
      if (rng.nextInt(2 + depth) !== 0) {
        return "%int%";
      }
    } else if (rule.lhs() === "<boolean>") {
      if (rng.nextInt(2 + depth) !== 0) {
        return (rng.nextInt(2) !== 0) ? "True" : "False";
      }
    } else if (rule.lhs() === "<float>") {
      if (rng.nextInt(2 + depth) !== 0) {
        return "%float%";
      }
    } else if (rule.lhs() === "<dim>") {
      // Note: Limit dim recursion or (board ...) ludemes are never completed!
      if (rng.nextInt(2 + depth) !== 0) {
        return "%dim%";
      }
    }

    if (rule.rhs() === null || rule.rhs().length === 0) {
      console.log("** Rule has no clauses: " + rule);
      return "";
    }

    // Sort clauses to ensure reproducibility with the same rng seed
    const clauses: EBNFClause[] = [...rule.rhs()].sort((a, b) =>
      a.toString() < b.toString() ? -1 : a.toString() > b.toString() ? 1 : 0
    );
    const clause = clauses[rng.nextInt(rule.rhs().length)]!;

    if (clause.isTerminal()) {
      const clauseString = clause.toString();
      if (clauseString === "string") {
        return "%string%";
      }
      // Check for primitive arrays.
      else if (clauseString === "{<int>}") {
        let sb = "{";
        for (let i = 0; i < rng.nextInt(MAX_ARRAY_LENGTH - 1) + 1; i++) {
          sb += "%int% ";
        }
        sb += "}";
        return sb;
      } else if (clauseString === "{<float>}") {
        let sb = "{";
        for (let i = 0; i < rng.nextInt(MAX_ARRAY_LENGTH - 1) + 1; i++) {
          sb += "%float% ";
        }
        sb += "}";
        return sb;
      } else if (clauseString === "{<boolean>}") {
        let sb = "{";
        for (let i = 0; i < rng.nextInt(MAX_ARRAY_LENGTH - 1) + 1; i++) {
          sb += (rng.nextInt(2) !== 0) ? "True " : "False ";
        }
        sb += "}";
        return sb;
      } else if (clauseString === "{<dim>}") {
        let sb = "{";
        for (let i = 0; i < rng.nextInt(MAX_ARRAY_LENGTH - 1) + 1; i++) {
          sb += "%dim% ";
        }
        sb += "}";
        return sb;
      }

      // Return complete clause immediately
      return clauseString;
    }

    if (clause.isRule()) {
      const clauseRule = Generator.findRules(clause.getToken());
      if (clauseRule.length === 0) {
        console.log("** Clause has no rule match: " + clause.getToken());
        return "?";
      } else if (clauseRule.length > 1) {
        console.log("** Clause has more than one rule match: " + clause.getToken());
        return "?";
      }

      if (depth + 1 >= MAX_DEPTH) {
        return "";
      }

      return Generator.complete(clauseRule[rng.nextInt(clauseRule.length)]!, rng, depth + 1);
    }

    // Clause must be a constructor at this point
    return Generator.handleConstructor(clause, rng, depth);
  }

  // -------------------------------------------------------------------------

  /**
   * @java Generator.handleConstructor(EBNFClause, Random, int)
   */
  static handleConstructor(clause: EBNFClause, rng: JavaRandom, depth: number): string {
    if (depth > MAX_DEPTH) {
      console.log("** Maximum depth " + MAX_DEPTH + " exceeded in handleConstructor(). A");
      return "";
    }

    let str = "(" + clause.getToken();

    // Determine 'or' groups
    const MAX_OR_GROUPS = 10;
    // BitSet represented as arrays of numbers (bit indices)
    const orGroups: Set<number>[] = Array.from({ length: MAX_OR_GROUPS }, () => new Set<number>());

    const args = clause.args();
    const argList: EBNFClauseArg[] = args !== null ? [...args] : [];

    for (let a = 0; a < argList.length; a++) {
      const arg = argList[a]!;
      orGroups[arg.orGroup()]!.add(a);
    }

    for (let n = 1; n < MAX_OR_GROUPS; n++) {
      while (orGroups[n]!.size > 1) {
        // Remove a random set member (mirrors BitSet.set(rng.nextInt(...), false))
        const randIdx = rng.nextInt(argList.length);
        // Only clear bits that are actually set in this group
        orGroups[n]!.delete(randIdx);
      }
    }

    // Determine which args to use (union of all orGroups)
    const use = new Set<number>();
    for (let a = 0; a < argList.length; a++) {
      for (let n = 0; n < MAX_OR_GROUPS; n++) {
        if (orGroups[n]!.has(a)) {
          use.add(a);
        }
      }
    }

    // Turn off some optional arguments (the deeper, the more likely)
    for (let a = 0; a < argList.length; a++) {
      if (argList[a]!.isOptional() && rng.nextInt(2 + depth) !== 0) {
        use.delete(a);
      }
    }

    for (let a = 0; a < argList.length; a++) {
      const arg = argList[a]!;

      if (!use.has(a))
        continue;  // skip this arg

      if (arg.parameterName() === null)
        str += " ";
      else
        str += " " + arg.parameterName() + ":";

      if (arg.nesting() === 0) {
        // Not an array
        const argStr = Generator.handleArg(arg, rng, depth);
        if (argStr === "")
          return "";  // maximum depth reached

        str += argStr;
      } else {
        // Handle array (might have nested sub-arrays)
        str += "{";
        const numItems = 1 + Generator.lowBiasedRandomInteger(rng, false) % 4;
        for (let i = 0; i < numItems; i++) {
          if (arg.nesting() === 1) {
            // Single array
            const argStr = Generator.handleArg(arg, rng, depth);
            if (argStr === "")
              return "";  // maximum depth reached

            str += " " + argStr;
          } else if (arg.nesting() === 2) {
            // Nested sub-arrays
            str += " {";
            const numSubItems = 1 + Generator.lowBiasedRandomInteger(rng, false) % 4;
            for (let j = 0; j < numSubItems; j++) {
              const argStr = Generator.handleArg(arg, rng, depth);
              if (argStr === "")
                return "";  // maximum depth reached

              str += " " + argStr;
            }
            str += " }";
          } else {
            // Three dimensional arrays not supported yet
          }
        }
        str += " }";
      }
    }
    str += ")";
    return str;
  }

  /**
   * @java Generator.handleArg(EBNFClauseArg, Random, int)
   */
  static handleArg(arg: EBNFClauseArg, rng: JavaRandom, depth: number): string {
    if (depth > MAX_DEPTH) {
      console.log("** Maximum depth " + MAX_DEPTH + " exceeded in handleArg() A.");
      return "";
    }

    if (EBNF.isTerminal(arg.getToken())) {
      // Simply instantiate here rather than recursing, to catch 'string'
      // (also catches 'int', 'boolean' and 'float').
      return arg.getToken();
    }

    const argRule = Generator.findRules(arg.getToken());
    if (argRule.length === 0) {
      console.log("** Clause arg has no rule match: " + arg.getToken());
      return "?";
    } else if (argRule.length > 1) {
      console.log("** Clause arg has more than one rule match: " + arg.getToken());
      return "?";
    }

    if (depth + 1 >= 1000) {
      console.log("** Safe generation depth " + depth + " exceeded in handleArg() B.");
      return "";
    }

    return Generator.complete(argRule[0]!, rng, depth + 1);
  }

  // -------------------------------------------------------------------------

  /**
   * @java Generator.instantiatePrimitives(String, Random)
   */
  static instantiatePrimitives(input: string, rng: JavaRandom): string {
    let str = Generator.instantiateStrings(input.trim(), rng);
    str = Generator.instantiateIntegers(str, rng);
    str = Generator.instantiateFloats(str, rng);
    str = Generator.instantiateDims(str, rng);
    return str;
  }

  /**
   * @java Generator.instantiateStrings(String, Random)
   */
  static instantiateStrings(input: string, rng: JavaRandom): string {
    let str = input.trim();

    // Instantiate 'string' placeholders
    let c = 0;
    while (true) {
      c = str.indexOf("%string%", c + 1);
      if (c < 0)
        break;

      const owner = Generator.enclosingLudemeName(str, c);

      let replacement: string | null = null;
      if (
        owner.toLowerCase() === "game"
        || owner.toLowerCase() === "match"
        || owner.toLowerCase() === "subgame"
      ) {
        // Create a name for this game
        replacement = Baptist.baptist().name(
          Generator.javaHashCode(str),
          4
        );
      }

      if (replacement === null) {
        // Look for a ludeme from the stringPool
        outer:
        for (let group = 0; group < stringPool.length; group++) {
          for (let n = 0; n < stringPool[group]![0]!.length; n++) {
            if (owner.toLowerCase() === stringPool[group]![0]![n]!.toLowerCase()) {
              replacement = stringPool[group]![1]![rng.nextInt(stringPool[group]![1]!.length)]!;
              break outer;
            }
          }
        }
      }

      if (replacement === null) {
        // Create random coordinate
        const letter = String.fromCharCode(
          "A".charCodeAt(0) + rng.nextInt(26)
        );
        replacement = letter + rng.nextInt(26);
      }

      str = str.substring(0, c) + '"' + replacement + '"' + str.substring(c + "%string%".length);
    }

    return str;
  }

  /**
   * @java Generator.instantiateIntegers(String, Random)
   */
  static instantiateIntegers(input: string, rng: JavaRandom): string {
    let str = input.trim();

    let c = 0;
    while (true) {
      c = str.indexOf("%int%", c + 1);
      if (c < 0)
        break;

      let num = Generator.lowBiasedRandomInteger(rng, true);

      const owner = Generator.enclosingLudemeName(str, c);
      if (owner.toLowerCase() === "players" && rng.nextInt(4) !== 0) {
        // Restrict number of players
        num = num % 4 + 1;
      }

      str = str.substring(0, c) + num + str.substring(c + "%int%".length);
    }

    return str;
  }

  /**
   * @java Generator.instantiateDims(String, Random)
   */
  static instantiateDims(input: string, rng: JavaRandom): string {
    let str = input.trim();

    let c = 0;
    while (true) {
      c = str.indexOf("%dim%", c + 1);
      if (c < 0)
        break;

      // Positive number within reasonable bounds
      let num = Math.abs(Generator.lowBiasedRandomInteger(rng, true)) % 20;

      const owner = Generator.enclosingLudemeName(str, c);
      if (owner.toLowerCase() === "players" && rng.nextInt(4) !== 0) {
        // Restrict number of players
        num = num % 4 + 1;
      }

      str = str.substring(0, c) + num + str.substring(c + "%dim%".length);
    }

    return str;
  }

  /**
   * @java Generator.instantiateFloats(String, Random)
   */
  static instantiateFloats(input: string, rng: JavaRandom): string {
    let str = input.trim();

    let c = 0;
    while (true) {
      c = str.indexOf("%float%", c + 1);
      if (c < 0)
        break;

      const num = Generator.lowBiasedRandomInteger(rng, true) / 4.0;

      // Format like Java's DecimalFormat("#.##"), replacing ',' with '.'
      const formatted = Generator.decimalFormat2(num).replace(",", ".");

      str = str.substring(0, c) + formatted + str.substring(c + "%float%".length);
    }

    return str;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Name of enclosing ludeme (if any).
   *
   * @java Generator.enclosingLudemeName(String, int)
   */
  static enclosingLudemeName(str: string, fromIndex: number): string {
    let c = fromIndex;
    while (c >= 0 && str.charAt(c) !== "(")
      c--;

    if (c < 0)
      return str.split(" ")[0] ?? "";

    let cc = c + 1;
    while (cc < str.length && str.charAt(cc) !== " ")
      cc++;

    return str.substring(c + 1, cc);
  }

  // -------------------------------------------------------------------------

  /**
   * @return Random number (biased towards lower values) that is sometimes negative.
   *
   * @java Generator.lowBiasedRandomInteger(Random, boolean)
   */
  private static lowBiasedRandomInteger(rng: JavaRandom, negate: boolean): number {
    let r = 0;
    switch (rng.nextInt(10)) {
    case  0: r = rng.nextInt(2) + 1;  break;
    case  1: r = rng.nextInt(4);      break;
    case  2: r = rng.nextInt(3) + 1;  break;
    case  3: r = rng.nextInt(4) + 1;  break;
    case  4: r = rng.nextInt(5) + 1;  break;
    case  5: r = rng.nextInt(6) + 1;  break;
    case  6: r = rng.nextInt(8);      break;
    case  7: r = rng.nextInt(16);     break;
    case  8: r = rng.nextInt(100);    break;
    case  9: r = rng.nextInt(1000);   break;
    default: r = 0;
    }

    if (negate && rng.nextInt(20) === 0)
      r = -r;

    return r;
  }

  // -------------------------------------------------------------------------

  /**
   * @param numGames            The number of games to generate.
   * @param randomSeed          If the seed should be randomised.
   * @param isValid             Only the games with all the requirement and not satisfying the WillCrash test.
   * @param boardlessIncluded   If we try to generate some boardless games.
   * @param doSave              Whether to save generated games.
   * @return                    The last valid game description.
   *
   * @java Generator.testGames(int, boolean, boolean, boolean, boolean)
   */
  public static testGames(
    numGames: number,
    randomSeed: boolean,
    isValid: boolean,
    boardlessIncluded: boolean,
    doSave: boolean
  ): string | null {
    // trigger grammar and EBNF structure to be created
    (Grammar.grammar() as unknown as { ebnfObj(): EBNF }).ebnfObj();

    const startAt = Date.now();

    let numValid      = 0;
    let numParse      = 0;
    let numCompile    = 0;
    let numFunctional = 0;
    let numPlayable   = 0;

    // Keep a record of the last valid, playable, generated game
    let lastGeneratedGame: string | null = null;

    const rng = new JavaRandom(Date.now());

    // Generate games
    for (let n = 0; n < numGames; n++) {
      console.log("\n---------------------------------\nGame " + n + ":");

      const seed = randomSeed ? rng.nextLong() : BigInt(n);
      const str = Generator.generate("game", seed);
      console.log(str);

      if (str === "")
        continue;  // generation failed

      numValid++;

      let gameName = StringRoutines.gameName(str);
      if (gameName === null)
        gameName = "Anon";
      const fileName = gameName + ".lud";  // just in case...

      // Check whether game parses
      const description: Description_ = new (Description as unknown as new (s: string) => Description_)(str);
      const userSelections = new UserSelections([]);
      const report = new Report();

      // Parser.expandAndParse - use escape-hatch stub
      const parser = {
        expandAndParse(
          _desc: Description_,
          _sel: UserSelections,
          _rep: Report,
          _allowExamples: boolean,
          _verbose: boolean
        ): boolean { return false; },
      };
      parser.expandAndParse(description, userSelections, report, true, false);
      if (report.isError()) {
        // Game does not parse
        if (doSave)
          FileHandling.saveStringToFile(str, "../Common/res/lud/test/buggy/unparsable/", fileName);
        continue;
      }
      numParse++;

      if (!boardlessIncluded) {
        if ((description.expanded() ?? "").includes("boardless"))
          continue;
      }

      for (const warning of report.warnings())
        if (!warning.includes("No version info."))
          console.log("- Warning: " + warning);

      // Check whether game compiles
      let game: Game_ | null = null;
      try {
        const desc2: Description_ = new (Description as unknown as new (s: string) => Description_)(str);
        game = CompilerStub.compileTest(desc2, false);
      } catch (e) {
        for (const error of report.errors())
          console.log("- Error: " + error);
        for (const warning of report.warnings())
          if (!warning.includes("No version info."))
            console.log("- Warning: " + warning);
        console.error(e);
      }

      if (game === null) {
        // Game does not compile
        if (doSave)
          FileHandling.saveStringToFile(str, "../Common/res/lud/test/buggy/uncompilable/", fileName);
        continue;
      }
      numCompile++;

      if (isValid) {
        if (game.hasMissingRequirement() || game.willCrash())
          continue;
        console.log("Not known to crash...");
      }

      // Check whether game is functional
      try {
        if (!Generator.isFunctional(game)) {
          // Game is not functional
          if (doSave)
            FileHandling.saveStringToFile(str, "../Common/res/lud/test/buggy/nonfunctional/", fileName);
          continue;
        }
      } catch (e) {
        console.log("Handling exception during playability test.");
        console.error(e);
      }

      numFunctional++;

      // Check whether game is playable
      if (!Generator.isPlayable(game)) {
        // Game is not playable
        if (doSave)
          FileHandling.saveStringToFile(str, "../Common/res/lud/test/buggy/unplayable/", fileName);
        continue;
      }
      console.log("Is playable.");
      numPlayable++;

      FileHandling.saveStringToFile(str, "../Common/res/lud/test/playable/", fileName);

      lastGeneratedGame = str;
    }

    const secs = (Date.now() - startAt) / 1000.0;

    console.log(
      "\n===========================================\n"
      + numGames + " random games generated in " + secs + "s:\n"
      + numValid + " valid (" + (numValid * 100.0 / numGames) + "%).\n"
      + numParse + " parse (" + (numParse * 100.0 / numGames) + "%).\n"
      + numCompile + " compile (" + (numCompile * 100.0 / numGames) + "%).\n"
      + numFunctional + " functional (" + (numFunctional * 100.0 / numGames) + "%).\n"
      + numPlayable + " playable (" + (numPlayable * 100.0 / numGames) + "%).\n"
    );

    return lastGeneratedGame;
  }

  // -------------------------------------------------------------------------

  /**
   * Method from Eric to improve some generations did with Ludii.
   *
   * @param numGames          The number of games to generate.
   * @param dlpRestriction    If we apply some DLP restrictions.
   * @param withDecision      If we keep the games with only decision moves.
   * @return The last valid game description.
   *
   * @java Generator.testGamesEric(int, boolean, boolean)
   */
  public static testGamesEric(
    numGames: number,
    dlpRestriction: boolean,
    withDecision: boolean
  ): string | null {
    // trigger grammar and EBNF structure to be created
    (Grammar.grammar() as unknown as { ebnfObj(): EBNF }).ebnfObj();

    const startAt = Date.now();

    const report = new Report();

    let lastGeneratedGame: string | null = null;

    const rng = new JavaRandom(Date.now());

    // Generate games
    let n = 0;
    let numTry = 0;
    while (n < numGames) {
      const str = Generator.generate("game", rng.nextLong());

      if (str === "") {
        numTry++;
        continue;  // generation failed
      }

      const containsPlayRules = str.includes("(play");
      const containsEndRules  = str.includes("(end");
      const containsMatch     = str.includes("(match");

      if (!containsPlayRules || !containsEndRules || containsMatch) {
        numTry++;
        continue;
      }

      // Check whether game parses
      const description: Description_ = new (Description as unknown as new (s: string) => Description_)(str);
      const userSelections = new UserSelections([]);

      // Parser stub - always fail parse in TS context
      const parseSucceeded = false; // Parser.expandAndParse would go here
      void parseSucceeded;
      void report;
      void description;
      void userSelections;
      if (true) {
        numTry++;
        continue;
      }

      // NOTE: The code below mirrors the Java logic but cannot execute in TS
      // without a working Compiler port. It is preserved faithfully.
      /* eslint-disable no-unreachable */
      let gameN: Game_ | null = null;
      try {
        const desc2: Description_ = new (Description as unknown as new (s: string) => Description_)(str);
        gameN = CompilerStub.compileTest(desc2, false);
      } catch (_e) {
        // Nothing to do.
      }

      if (gameN === null) {
        numTry++;
        continue;
      }

      const gameNN: Game_ = gameN!;

      if (gameNN.hasMissingRequirement() || gameNN.willCrash()) {
        numTry++;
        continue;
      }

      if (dlpRestriction) {
        if (
          gameNN.hasSubgames() || gameNN.isBoardless() || gameNN.isDeductionPuzzle()
          || gameNN.hasCard() || gameNN.hasDominoes() || gameNN.hasLargePiece()
          || !gameNN.isAlternatingMoveGame() || gameNN.hiddenInformation()
        ) {
          numTry++;
          continue;
        }
      }

      const fileName = gameNN.name() + ".lud";

      if (withDecision) {
        if (!Generator.isFunctionalAndWithOnlyDecision(gameNN)) {
          numTry++;
          continue;
        }
      } else if (!Generator.isFunctional(gameNN)) {
        numTry++;
        FileHandling.saveStringToFile(str, "../Common/res/lud/test/buggy/nonfunctional/", fileName);
        continue;
      }

      if (!Generator.isPlayable(gameNN)) {
        numTry++;
        FileHandling.saveStringToFile(str, "../Common/res/lud/test/buggy/unplayable/", fileName);
        continue;
      } else {
        FileHandling.saveStringToFile(str, "../Common/res/lud/test/buggy/toTest/", fileName);
        console.log("GAME " + n + " GENERATED");
        numTry++;
        n++;
      }

      lastGeneratedGame = str;
      /* eslint-enable no-unreachable */
    }

    const secs = (Date.now() - startAt) / 1000.0;

    console.log("Generation done in " + secs + " seconds");
    console.log(numTry + " tries were necessary.");

    return lastGeneratedGame;
  }

  /**
   * @return Whether a trial of the game can be played without crashing.
   *
   * @java Generator.isFunctionalAndWithOnlyDecision(Game)
   */
  public static isFunctionalAndWithOnlyDecision(game: Game_): boolean {
    const trial = newTrial(game);
    const context = newContext(game);
    game.start(context);
    let resultTrial: Trial_ | null = null;
    try {
      resultTrial = game.playout(
        context, null, 1.0, null, 0, MAX_MOVES_CONST,
        null // ThreadLocalRandom.current() equivalent
      );
    } catch (e) {
      console.error(e);
    }
    void trial;

    if (resultTrial === null)
      return false;

    for (const m of resultTrial.generateCompleteMovesList()) {
      if (!m.isDecision())
        return false;
    }

    return true;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Whether a trial of the game can be played without crashing.
   *
   * @java Generator.isFunctional(Game)
   */
  public static isFunctional(game: Game_): boolean {
    const trial = newTrial(game);
    const context = newContext(game);
    game.start(context);
    let resultTrial: Trial_ | null = null;
    try {
      resultTrial = game.playout(
        context, null, 1.0, null, 0, MAX_MOVES_CONST,
        null // ThreadLocalRandom.current() equivalent
      );
    } catch (e) {
      console.error(e);
    }
    void trial;
    return resultTrial !== null;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Whether the game is basically playable, i.e. more trials are of
   *         reasonable length than not. A trial is of reasonable length if it
   *         lasts at least 2 * num_players moves and ends before 90% of MAX_MOVES are reached.
   *
   * @java Generator.isPlayable(Game)
   */
  public static isPlayable(game: Game_): boolean {
    const context = newContext(game);

    const NUM_TRIALS = 10;

    let numResults = 0;

    for (let t = 0; t < NUM_TRIALS; t++) {
      game.start(context);
      let trial: Trial_ | null = null;
      try {
        trial = game.playout(
          context, null, 1.0, null, 0, MAX_MOVES_CONST,
          null // ThreadLocalRandom.current() equivalent
        );
      } catch (e) {
        console.error(e);
      }

      if (trial === null)
        return false;

      const minMoves = 2 * game.players().count();
      const maxMoves = Math.floor(MAX_MOVES_CONST * 9 / 10);

      if (trial.numMoves() >= minMoves && trial.numMoves() <= maxMoves)
        numResults++;
    }

    return numResults >= Math.floor(NUM_TRIALS / 2);
  }

  // -------------------------------------------------------------------------

  /**
   * @java Generator.test()
   */
  test(): void {
    // trigger grammar and EBNF structure to be created
    (Grammar.grammar() as unknown as { ebnfObj(): EBNF }).ebnfObj();

    // Check rules
    let numClauses = 0;
    const ebnf: EBNF = (Grammar.grammar() as unknown as { ebnfObj(): EBNF }).ebnfObj();
    for (const rule of ebnf.rules().values()) {
      numClauses += rule.rhs().length;
      for (const clause of rule.rhs()) {
        if (clause !== null && clause.args() !== null) {
          for (const arg of clause.args()!) {
            const list = Generator.findRules(arg.getToken());
            if (
              list.length === 0
              && !arg.getToken().toLowerCase().includes("string")
              && arg.getToken().length > 0
              && arg.getToken().charAt(0) !== arg.getToken().charAt(0).toUpperCase()
            ) {
              console.log("** No rule for: " + arg);
            }
          }
        }
      }
    }
    console.log(ebnf.rules().size + " EBNF rules with " + numClauses + " clauses generated.");

    console.log("===========================================================\n");

    const startAt = Date.now();

    // Generate games
    const NUM_GAMES = 1000;
    for (let n = 0; n < NUM_GAMES; n++) {
      const str = Generator.generate("game", n);

      if (n % 100 === 0) {
        console.log(n + ":");
        console.log(str === "" ? "** Generation failed.\n" : str);
      }
    }

    const secs = (Date.now() - startAt) / 1000.0;
    console.log(NUM_GAMES + " games generated in " + secs + "s.");

    console.log("===========================================================\n");

    // Generate sub-ludeme
    let str = Generator.generate("or", 0);
    console.log(str);

    str = Generator.generate("or", 1);
    console.log(str);

    console.log("===========================================================\n");

    // Generate sub-ludeme
    str = Generator.generate("board", Date.now());
    console.log(str);

    console.log("===========================================================\n");

    // Generate enum
    str = Generator.generate("ShapeType", 0);
    console.log(str);

    str = Generator.generate("ShapeType", 1);
    console.log(str);
  }

  // -------------------------------------------------------------------------

  /**
   * The main method of the generator.
   *
   * @java Generator.main(String[])
   */
  public static main(_arg: string[]): void {
    const generator = new Generator();
    generator.test();
  }

  // -------------------------------------------------------------------------

  /**
   * Format a number like Java's DecimalFormat("#.##") — at most 2 decimal places,
   * no trailing zeros, no leading zeros after decimal point suppressed.
   */
  private static decimalFormat2(num: number): string {
    const rounded = Math.round(num * 100) / 100;
    const str = rounded.toString();
    // Remove trailing zeros after decimal point
    if (str.includes(".")) {
      return str.replace(/\.?0+$/, "");
    }
    return str;
  }

  /**
   * Java-compatible String.hashCode() implementation.
   */
  private static javaHashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return hash;
  }
}
