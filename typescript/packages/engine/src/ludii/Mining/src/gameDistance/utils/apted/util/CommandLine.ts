// @java Mining/src/gameDistance/utils/apted/util/CommandLine.java

/* MIT License
 * Copyright (c) 2017 Mateusz Pawlik
 */

import type { CostModel } from "../costmodel/CostModel.js";
import type { InputParser } from "../parser/InputParser.js";
import { StringUnitCostModel } from "../costmodel/StringUnitCostModel.js";
import { BracketStringInputParser } from "../parser/BracketStringInputParser.js";
import { APTED } from "../distance/APTED.js";

// Not-yet-ported dependency escape-hatch: Node (batch 45)
type NodeLike = { getNodeData(): unknown };
type StringNodeData = { getLabel(): string };

/**
 * This is the command line interface for executing APTED algorithm.
 *
 * @param C type of cost model.
 * @param P type of input parser.
 * @java gameDistance.utils.apted.util.CommandLine
 */
export class CommandLine<C extends CostModel<unknown>, P extends InputParser<unknown>> {

  /** @java CommandLine.helpMessage */
  private readonly helpMessage: string =
    "\n" +
    "Compute the edit distance between two trees.\n" +
    "\n" +
    "SYNTAX\n" +
    "\n" +
    "    java -jar APTED.jar {-t TREE1 TREE2 | -f FILE1 FILE2} [-m] [-v]\n" +
    "\n" +
    "    java -jar APTED.jar -h\n" +
    "\n" +
    "DESCRIPTION\n" +
    "\n" +
    "    Compute the edit distance between two trees with APTED algorithm [1,2].\n" +
    "    APTED supersedes our RTED algorithm [3].\n" +
    "    By default unit cost model is supported where each edit operation\n" +
    "    has cost 1 (in case of equal labels the cost is 0).\n" +
    "\n" +
    "    For implementing other cost models see the details on github website\n" +
    "    (https://github.com/DatabaseGroup/apted).\n" +
    "\n" +
    "LICENCE\n" +
    "\n" +
    "    The source code of this program is published under the MIT licence and\n" +
    "    can be found on github (https://github.com/DatabaseGroup/apted).\n" +
    "\n" +
    "OPTIONS\n" +
    "\n" +
    "    -h, --help \n" +
    "        print this help message.\n" +
    "\n" +
    "    -t TREE1 TREE2,\n" +
    "    --trees TREE1 TREE2\n" +
    "        compute the tree edit distance between TREE1 and TREE2. The\n" +
    "        trees are encoded in the bracket notation, for example, in tree\n" +
    "        {A{B{X}{Y}{F}}{C}} the root node has label A and two children\n" +
    "        with labels B and C. B has three children with labels X, Y, F.\n" +
    "\n" +
    "    -f FILE1 FILE2, \n" +
    "    --files FILE1 FILE2\n" +
    "        compute the tree edit distance between the two trees stored in\n" +
    "        the files FILE1 and FILE2. The trees are encoded in bracket\n" +
    "        notation.\n" +
    "\n" +
    "    -v, --verbose\n" +
    "        print verbose output, including tree edit distance, runtime,\n" +
    "        number of relevant subproblems and strategy statistics.\n" +
    "\n" +
    "    -m, --mapping\n" +
    "        compute the minimal edit mapping between two trees. There might\n" +
    "        be multiple minimal edit mappings. This option computes only one\n" +
    "        of them. The first line of the output is the cost of the mapping.\n" +
    "        The following lines represent the edit operations. n and m are\n" +
    "        postorder IDs (beginning with 1) of nodes in the left-hand and\n" +
    "        the right-hand trees respectively.\n" +
    "            n->m - rename node n to m\n" +
    "            n->0 - delete node n\n" +
    "            0->m - insert node m\n" +
    "EXAMPLES\n" +
    "\n" +
    "    java -jar APTED.jar -t {a{b}{c}} {a{b{d}}}\n" +
    "    java -jar APTED.jar -f 1.tree 2.tree\n" +
    "    java -jar APTED.jar -t {a{b}{c}} {a{b{d}}} -m -v\n" +
    "\n" +
    "REFERENCES\n" +
    "\n" +
    "    [1] M. Pawlik and N. Augsten. Efficient Computation of the Tree Edit\n" +
    "        Distance. ACM Transactions on Database Systems (TODS) 40(1). 2015.\n" +
    "    [2] M. Pawlik and N. Augsten. Tree edit distance: Robust and memory-\n" +
    "        efficient. Information Systems 56. 2016.\n" +
    "    [3] M. Pawlik and N. Augsten. RTED: A Robust Algorithm for the Tree Edit\n" +
    "        Distance. PVLDB 5(4). 2011.\n" +
    "\n" +
    "AUTHORS\n" +
    "\n" +
    "    Mateusz Pawlik, Nikolaus Augsten";

  // TODO: Review if all fields are necessary.
  /** @java CommandLine.wrongArgumentsMessage */
  private readonly wrongArgumentsMessage: string = "Wrong arguments. Try \"java -jar RTED.jar --help\" for help.";

  /** @java CommandLine.run */
  private run: boolean = false;
  /** @java CommandLine.custom */
  private custom: boolean = false;
  /** @java CommandLine.array */
  private array: boolean = false;
  /** @java CommandLine.strategy */
  private strategy: boolean = false;
  /** @java CommandLine.ifSwitch */
  private ifSwitch: boolean = false;
  /** @java CommandLine.sota */
  private sota: boolean = false;
  /** @java CommandLine.verbose */
  private verbose: boolean = false;
  /** @java CommandLine.demaine */
  private demaine: boolean = false;
  /** @java CommandLine.mapping */
  private mapping: boolean = false;
  /** @java CommandLine.sotaStrategy */
  private sotaStrategy: number = 0;
  /** @java CommandLine.customStrategy */
  private customStrategy: string = "";
  /** @java CommandLine.customStrategyArrayFile */
  private customStrategyArrayFile: string = "";
  /** @java CommandLine.rted */
  private rted: APTED<C, unknown> = null as unknown as APTED<C, unknown>;
  /** @java CommandLine.ted */
  private ted: number = 0;

  /** @java CommandLine.costModel */
  private readonly costModel: C;
  /** @java CommandLine.inputParser */
  private readonly inputParser: P;
  /** @java CommandLine.t1 */
  private t1: NodeLike = null as unknown as NodeLike;
  /** @java CommandLine.t2 */
  private t2: NodeLike = null as unknown as NodeLike;

  /**
   * Constructs the command line. Initialises the cost model and input parser
   * of specific types.
   *
   * @param costModel instance of a specific cost model.
   * @param inputParser instance of a specific inputParser.
   * @java CommandLine(C, P)
   */
  public constructor(costModel: C, inputParser: P) {
    this.costModel = costModel;
    this.inputParser = inputParser;
  }

  /**
   * Main method, invoked when executing the jar file.
   *
   * @param args array of command line arguments passed when executing jar file.
   * @java CommandLine.main(String[])
   */
  public static main(args: string[]): void {
    const rtedCL = new CommandLine<StringUnitCostModel, BracketStringInputParser>(
      new StringUnitCostModel(),
      new BracketStringInputParser()
    );
    rtedCL.runCommandLine(args);
  }

  /**
   * Run the command line with given arguments.
   *
   * @param args array of command line arguments passed when executing jar file.
   * @java CommandLine.runCommandLine(String[])
   */
  public runCommandLine(args: string[]): void {
    this.rted = new APTED<C, unknown>(this.costModel);
    try {
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "--help" || args[i] === "-h") {
          console.log(this.helpMessage);
          process.exit(0);
        } else if (args[i] === "-t" || args[i] === "--trees") {
          this.parseTreesFromCommandLine(args[i + 1]!, args[i + 2]!);
          i = i + 2;
          this.run = true;
        } else if (args[i] === "-f" || args[i] === "--files") {
          this.parseTreesFromFiles(args[i + 1]!, args[i + 2]!);
          i = i + 2;
          this.run = true;
        } else if (args[i] === "-v" || args[i] === "--verbose") {
          this.verbose = true;
        } else if (args[i] === "-m" || args[i] === "--mapping") {
          this.mapping = true;
        } else {
          console.log(this.wrongArgumentsMessage);
          process.exit(0);
        }
      }
    } catch (_e) {
      console.log("Too few arguments.");
      process.exit(0);
    }

    if (!this.run) {
      console.log(this.wrongArgumentsMessage);
      process.exit(0);
    }

    const time1 = Date.now();
    this.ted = this.rted.computeEditDistance(
      this.t1 as unknown as Parameters<APTED<C, unknown>["computeEditDistance"]>[0],
      this.t2 as unknown as Parameters<APTED<C, unknown>["computeEditDistance"]>[1]
    );
    const time2 = Date.now();

    if (this.verbose) {
      console.log("distance:             " + this.ted);
      console.log("runtime:              " + ((time2 - time1) / 1000.0));
    } else {
      console.log(this.ted);
    }

    if (this.mapping) {
      const editMapping = this.rted.computeEditMapping();
      for (const nodeAlignment of editMapping) {
        console.log(nodeAlignment[0] + "->" + nodeAlignment[1]);
      }
    }
  }

  /**
   * Parse two input trees from the command line and convert them to tree
   * representation using Node class.
   *
   * @param ts1 source input tree as string.
   * @param ts2 destination input tree as string.
   * @java CommandLine.parseTreesFromCommandLine(String, String)
   */
  private parseTreesFromCommandLine(ts1: string, ts2: string): void {
    try {
      this.t1 = this.inputParser.fromString(ts1) as NodeLike;
    } catch (_e) {
      console.log("TREE1 argument has wrong format");
      process.exit(0);
    }
    try {
      this.t2 = this.inputParser.fromString(ts2) as NodeLike;
    } catch (_e) {
      console.log("TREE2 argument has wrong format");
      process.exit(0);
    }
  }

  /**
   * Parses two input trees from given files and convert them to tree
   * representation using Node class.
   *
   * @param fs1 path to file with source tree.
   * @param fs2 path to file with destination tree.
   * @java CommandLine.parseTreesFromFiles(String, String)
   */
  private parseTreesFromFiles(fs1: string, fs2: string): void {
    // Node.js file reading (replaces Java BufferedReader)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    try {
      const line1 = fs.readFileSync(fs1, "utf-8").split("\n")[0]!;
      this.t1 = this.inputParser.fromString(line1) as NodeLike;
    } catch (_e) {
      console.log("TREE1 argument has wrong format");
      process.exit(0);
    }
    try {
      const line2 = fs.readFileSync(fs2, "utf-8").split("\n")[0]!;
      this.t2 = this.inputParser.fromString(line2) as NodeLike;
    } catch (_e) {
      console.log("TREE2 argument has wrong format");
      process.exit(0);
    }
  }

  // TODO: Bring the functionalities below back to life.
  // (setCosts method commented out in Java, same here)
}
