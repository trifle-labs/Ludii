// @java AI/src/utils/AIFactory.java

/**
 * Can create AI agents based on strings / files
 *
 * @java utils/AIFactory.java
 * @author Dennis Soemers
 */

// Escape-hatch interfaces for not-yet-ported dependencies

/** @java other.AI */
export interface AI {
  supportsGame(game: unknown): boolean;
  selectAction(game: unknown, context: unknown, maxSeconds: number, maxIterations: number, maxDepth: number): unknown;
  initAI(game: unknown, playerID: number): void;
  closeAI(): void;
  setFriendlyName?(name: string): void;
  setQInit?(qInit: unknown): void;
  setUseScoreBounds?(v: boolean): void;
  setWantsMetadataHeuristics?(v: boolean): void;
  setPlayoutValueWeight?(v: number): void;
}

/** @java game.Game */
interface Game {
  name(): string;
  players(): { count(): number };
  isAlternatingMoveGame(): boolean;
  metadata(): {
    ai(): {
      features(): unknown;
      trainedFeatureTrees(): unknown;
      agent(): AgentMetadata | null;
    }
  };
}

/** @java org.json.JSONObject */
export interface JSONObject {
  has(key: string): boolean;
  get(key: string): unknown;
  getString(key: string): string;
  getJSONObject(key: string): JSONObject | null;
  put(key: string, value: unknown): void;
  toString(indent?: number): string;
}

/** @java metadata.ai.agents.Agent */
interface AgentMetadata {
  __agent: true;
}

/** @java metadata.ai.agents.BestAgent */
interface BestAgentMetadata extends AgentMetadata {
  agent(): string;
}

/** @java metadata.ai.agents.minimax.AlphaBeta */
interface AlphaBetaMetadata extends AgentMetadata {
  heuristics(): unknown | null;
}

/** @java metadata.ai.agents.mcts.Mcts */
interface MctsMetadata extends AgentMetadata {
  __mcts: true;
}

//-------------------------------------------------------------------------

/**
 * Interface for a functor that constructs AIs
 * @java AIFactory.AIConstructor
 */
export interface AIConstructor {
  constructAI(): AI;
}

//-------------------------------------------------------------------------

/**
 * Can create AI agents based on strings / files
 *
 * @java utils.AIFactory
 */
export class AIFactory {

  //-------------------------------------------------------------------------

  /**
   * Map from absolute paths of JAR files to lists of loaded, third-party AI classes
   * @java AIFactory.thirdPartyAIClasses
   */
  private static thirdPartyAIClasses: Map<string, unknown[]> = new Map();

  //-------------------------------------------------------------------------

  private constructor() {
    // not intended to be used
  }

  //-------------------------------------------------------------------------

  /**
   * @param string String representation of agent, or filename from which to load agent
   * @return Created AI
   * @java AIFactory.createAI(String)
   */
  public static createAI(str: string): AI | null {
    if (str.toLowerCase() === "random")
      return AIFactory._makeRandomAI();

    if (str.toLowerCase() === "monte carlo (flat)" || str.toLowerCase() === "flat mc")
      return AIFactory._makeFlatMonteCarlo();

    if (str.toLowerCase() === "alpha-beta" || str.toLowerCase() === "alphabeta")
      return AIFactory._createAlphaBeta();

    if (str.toLowerCase() === "brs+" || str.toLowerCase() === "best-reply search+")
      return AIFactory._makeBRSPlus();

    if (str.toLowerCase() === "ubfm")
      return AIFactory._createUBFM();

    if (str.toLowerCase() === "hybrid ubfm")
      return AIFactory._makeHybridUBFM();

    if (str.toLowerCase() === "lazy ubfm")
      return AIFactory._makeLazyUBFM();

    if (str.toLowerCase() === "biased ubfm")
      return AIFactory._makeBiasedUBFM();

    if (str.toLowerCase() === "uct" || str.toLowerCase() === "mcts")
      return AIFactory._createUCT();

    if (str.toLowerCase() === "mc-grave") {
      const mcGRAVE = AIFactory._makeMCTS(
        AIFactory._makeMcGRAVE(),
        AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(mcGRAVE, AIFactory._getQInitINF());
      AIFactory._setFriendlyName(mcGRAVE, "MC-GRAVE");
      return mcGRAVE;
    }

    if (str.toLowerCase() === "mc-brave") {
      const mcBRAVE = AIFactory._makeMCTS(
        AIFactory._makeMcBRAVE(),
        AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(mcBRAVE, AIFactory._getQInitINF());
      AIFactory._setFriendlyName(mcBRAVE, "MC-BRAVE");
      return mcBRAVE;
    }

    if (str.toLowerCase() === "ucb1tuned") {
      const ucb1Tuned = AIFactory._makeMCTS(
        AIFactory._makeUCB1Tuned(),
        AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(ucb1Tuned, AIFactory._getQInitPARENT());
      AIFactory._setFriendlyName(ucb1Tuned, "UCB1Tuned");
      return ucb1Tuned;
    }

    if (str.toLowerCase() === "score bounded mcts" || str.toLowerCase() === "scoreboundedmcts") {
      const sbMCTS = AIFactory._makeMCTS(
        AIFactory._makeUCB1(),
        AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(sbMCTS, AIFactory._getQInitPARENT());
      AIFactory._setUseScoreBounds(sbMCTS, true);
      AIFactory._setFriendlyName(sbMCTS, "Score Bounded MCTS");
      return sbMCTS;
    }

    if (str.toLowerCase() === "progressive history" || str.toLowerCase() === "progressivehistory") {
      const progressiveHistory = AIFactory._makeMCTS(
        AIFactory._makeProgressiveHistory(),
        AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(progressiveHistory, AIFactory._getQInitPARENT());
      AIFactory._setFriendlyName(progressiveHistory, "Progressive History");
      return progressiveHistory;
    }

    if (str.toLowerCase() === "progressive bias" || str.toLowerCase() === "progressivebias") {
      const progressiveBias = AIFactory._makeMCTS(
        AIFactory._makeProgressiveBias(),
        AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(progressiveBias, AIFactory._getQInitINF());
      AIFactory._setWantsMetadataHeuristics(progressiveBias, true);
      AIFactory._setFriendlyName(progressiveBias, "Progressive Bias");
      return progressiveBias;
    }

    if (str.toLowerCase() === "mast") {
      const mast = AIFactory._makeMCTS(
        AIFactory._makeUCB1(),
        AIFactory._makeMASTPlayout(200, 0.1),
        AIFactory._makeMonteCarloBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(mast, AIFactory._getQInitPARENT());
      AIFactory._setFriendlyName(mast, "MAST");
      return mast;
    }

    if (str.toLowerCase() === "nst") {
      const nst = AIFactory._makeMCTS(
        AIFactory._makeUCB1(),
        AIFactory._makeNSTPlayout(200, 0.1),
        AIFactory._makeMonteCarloBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(nst, AIFactory._getQInitPARENT());
      AIFactory._setFriendlyName(nst, "NST");
      return nst;
    }

    if (str.toLowerCase() === "ucb1-grave") {
      const ucb1GRAVE = AIFactory._makeMCTS(
        AIFactory._makeUCB1GRAVE(),
        AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setFriendlyName(ucb1GRAVE, "UCB1-GRAVE");
      return ucb1GRAVE;
    }

    if (str.toLowerCase() === "ludii ai")
      return AIFactory._makeLudiiAI();

    if (str.toLowerCase() === "biased mcts")
      return AIFactory._createBiasedMCTS(0.0);

    if (str.toLowerCase() === "biased mcts (uniform playouts)" || str.toLowerCase() === "mcts (biased selection)")
      return AIFactory._createBiasedMCTS(1.0);

    if (str.toLowerCase() === "mcts (hybrid selection)")
      return AIFactory._createHybridMCTS();

    if (str.toLowerCase() === "bandit tree search")
      return AIFactory._createBanditTreeSearch();

    if (str.toLowerCase() === "ept") {
      const ept = AIFactory._makeMCTS(
        AIFactory._makeUCB1(Math.sqrt(2.0)),
        AIFactory._makeRandomPlayout(4),
        AIFactory._makeAlphaGoBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setWantsMetadataHeuristics(ept, true);
      AIFactory._setPlayoutValueWeight(ept, 1.0);
      AIFactory._setFriendlyName(ept, "EPT");
      return ept;
    }

    if (str.toLowerCase() === "ept-qb") {
      const eptQB = AIFactory._makeMCTS(
        AIFactory._makeUCB1(Math.sqrt(2.0)),
        AIFactory._makeRandomPlayout(4),
        AIFactory._makeQualitativeBonus(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setWantsMetadataHeuristics(eptQB, true);
      AIFactory._setFriendlyName(eptQB, "EPT-QB");
      return eptQB;
    }

    if (str.toLowerCase() === "heuristic sampling")
      return AIFactory._makeHeuristicSampling();

    if (str.toLowerCase() === "heuristic sampling (1)")
      return AIFactory._makeHeuristicSampling(1);

    if (str.toLowerCase() === "one-ply (no heuristic)")
      return AIFactory._makeOnePlyNoHeuristic();

    // See if this AI was registered
    const { AIRegistry } = require("./AIRegistry.js") as typeof import("./AIRegistry.js");
    const registeredAI = AIRegistry.fromRegistry(str);
    if (registeredAI !== null)
      return registeredAI;

    // Try to interpret the given string as a resource or some other kind of file
    let lines: string[] = [];

    if (AIFactory._fileExists(str)) {
      try {
        const content = AIFactory._readFile(str);
        lines = content.split(/\r?\n/);
      } catch (_e) {
        console.error("AIFactory: error reading file " + str);
      }
    } else {
      // assume semicolon-separated lines directly passed as command line arg
      lines = str.split(";");
    }

    const firstLine = lines[0] ?? "";
    if (firstLine.startsWith("algorithm=")) {
      const algName = firstLine.substring("algorithm=".length);

      if (algName.toLowerCase() === "mcts" || algName.toLowerCase() === "uct")
        return AIFactory._mctsFromLines(lines);
      else if (algName.toLowerCase() === "alphabeta" || algName.toLowerCase() === "alpha-beta")
        return AIFactory._alphaBetaFromLines(lines);
      else if (algName.toLowerCase() === "brs+")
        return AIFactory._brsPlusFromLines(lines);
      else if (algName.toLowerCase() === "heuristicsampling")
        return AIFactory._heuristicSamplingFromLines(lines);
      else if (algName.toLowerCase() === "softmax" || algName.toLowerCase() === "softmaxpolicy") {
        const { SoftmaxPolicyLinear } = require("../policies/softmax/SoftmaxPolicyLinear.js") as typeof import("../policies/softmax/SoftmaxPolicyLinear.js");
        return SoftmaxPolicyLinear.fromLines(lines) as unknown as AI;
      } else if (algName.toLowerCase() === "greedy" || algName.toLowerCase() === "greedypolicy") {
        const { GreedyPolicy } = require("../policies/GreedyPolicy.js") as typeof import("../policies/GreedyPolicy.js");
        return GreedyPolicy.fromLines(lines) as unknown as AI;
      } else if (algName.toLowerCase() === "proportionalpolicyclassificationtree") {
        const { ProportionalPolicyClassificationTree } = require("../policies/ProportionalPolicyClassificationTree.js") as typeof import("../policies/ProportionalPolicyClassificationTree.js");
        return ProportionalPolicyClassificationTree.fromLines(lines) as unknown as AI;
      } else if (algName.toLowerCase() === "softmaxpolicylogittree") {
        const { SoftmaxPolicyLogitTree } = require("../policies/softmax/SoftmaxPolicyLogitTree.js") as typeof import("../policies/softmax/SoftmaxPolicyLogitTree.js");
        return SoftmaxPolicyLogitTree.fromLines(lines) as unknown as AI;
      } else if (algName.toLowerCase() === "random") {
        return AIFactory._makeRandomAI();
      } else {
        console.error("Unknown algorithm name: " + algName);
      }
    } else {
      console.error(
        "Expecting AI file to start with \"algorithm=\", but it starts with " + firstLine
      );
    }

    console.error(
      `Warning: cannot convert string "${str}" to AI; defaulting to random.`
    );
    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * @param file
   * @return AI created based on configuration in given JSON file
   * @java AIFactory.fromJsonFile(File)
   */
  public static fromJsonFile(filePath: string): AI | null {
    try {
      const content = AIFactory._readFile(filePath);
      const raw = JSON.parse(content) as Record<string, unknown>;
      return AIFactory.fromJson(AIFactory._wrapJson(raw));
    } catch (e) {
      console.error(e);
    }

    console.error("WARNING: Failed to construct AI from JSON file: " + filePath);
    return null;
  }

  /**
   * @param json
   * @return AI created based on configuration in given JSON object
   * @java AIFactory.fromJson(JSONObject)
   */
  public static fromJson(json: JSONObject): AI | null {
    if (json.has("constructor")) {
      const ctor = json.get("constructor") as AIConstructor | null;
      if (ctor !== null && ctor !== undefined)
        return ctor.constructAI();
    }

    const aiObj = json.getJSONObject("AI");
    if (aiObj === null) {
      console.error("WARNING: Failed to construct AI from JSON: " + json.toString(4));
      return null;
    }

    const algName = aiObj.getString("algorithm");

    if (
      algName.toLowerCase() === "ludii" ||
      algName.toLowerCase() === "ludii ai" ||
      algName.toLowerCase() === "default"
    ) {
      return AIFactory._makeLudiiAI();
    } else if (algName.toLowerCase() === "random") {
      return AIFactory._makeRandomAI();
    } else if (algName.toLowerCase() === "lazy ubfm") {
      return AIFactory._makeLazyUBFM();
    } else if (algName.toLowerCase() === "hybrid ubfm") {
      return AIFactory._makeHybridUBFM();
    } else if (algName.toLowerCase() === "biased ubfm") {
      return AIFactory._makeBiasedUBFM();
    } else if (algName.toLowerCase() === "ubfm") {
      return AIFactory._createUBFM();
    } else if (algName.toLowerCase() === "monte carlo (flat)" || algName.toLowerCase() === "flat mc") {
      return AIFactory._makeFlatMonteCarlo();
    } else if (algName.toLowerCase() === "uct") {
      return AIFactory._createUCT();
    } else if (algName.toLowerCase() === "uct (uncapped)") {
      const uct = AIFactory._makeMCTS(
        AIFactory._makeUCB1(Math.sqrt(2.0)),
        AIFactory._makeRandomPlayout(),
        AIFactory._makeMonteCarloBackprop(),
        AIFactory._makeRobustChild()
      );
      AIFactory._setFriendlyName(uct, "UCT (Uncapped)");
      return uct;
    } else if (algName.toLowerCase() === "mcts") {
      return AIFactory._mctsFromJson(aiObj);
    } else if (algName.toLowerCase() === "mc-grave") {
      const mcGRAVE = AIFactory._makeMCTS(
        AIFactory._makeMcGRAVE(), AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(), AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(mcGRAVE, AIFactory._getQInitINF());
      AIFactory._setFriendlyName(mcGRAVE, "MC-GRAVE");
      return mcGRAVE;
    } else if (algName.toLowerCase() === "mc-brave") {
      const mcBRAVE = AIFactory._makeMCTS(
        AIFactory._makeMcBRAVE(), AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(), AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(mcBRAVE, AIFactory._getQInitINF());
      AIFactory._setFriendlyName(mcBRAVE, "MC-BRAVE");
      return mcBRAVE;
    } else if (algName.toLowerCase() === "ucb1tuned") {
      return AIFactory.createAI("UCB1Tuned");
    } else if (algName.toLowerCase() === "score bounded mcts" || algName.toLowerCase() === "scoreboundedmcts") {
      return AIFactory.createAI("Score Bounded MCTS");
    } else if (algName.toLowerCase() === "progressive history" || algName.toLowerCase() === "progressivehistory") {
      const progressiveHistory = AIFactory._makeMCTS(
        AIFactory._makeProgressiveHistory(), AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(), AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(progressiveHistory, AIFactory._getQInitPARENT());
      AIFactory._setFriendlyName(progressiveHistory, "Progressive History");
      return progressiveHistory;
    } else if (algName.toLowerCase() === "progressive bias" || algName.toLowerCase() === "progressivebias") {
      return AIFactory.createAI("Progressive Bias");
    } else if (algName.toLowerCase() === "mast") {
      const mast = AIFactory._makeMCTS(
        AIFactory._makeUCB1(), AIFactory._makeMASTPlayout(200, 0.1),
        AIFactory._makeMonteCarloBackprop(), AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(mast, AIFactory._getQInitPARENT());
      AIFactory._setFriendlyName(mast, "MAST");
      return mast;
    } else if (algName.toLowerCase() === "nst") {
      const nst = AIFactory._makeMCTS(
        AIFactory._makeUCB1(), AIFactory._makeNSTPlayout(200, 0.1),
        AIFactory._makeMonteCarloBackprop(), AIFactory._makeRobustChild()
      );
      AIFactory._setQInit(nst, AIFactory._getQInitPARENT());
      AIFactory._setFriendlyName(nst, "NST");
      return nst;
    } else if (algName.toLowerCase() === "ucb1-grave") {
      const ucb1GRAVE = AIFactory._makeMCTS(
        AIFactory._makeUCB1GRAVE(), AIFactory._makeRandomPlayout(200),
        AIFactory._makeMonteCarloBackprop(), AIFactory._makeRobustChild()
      );
      AIFactory._setFriendlyName(ucb1GRAVE, "UCB1-GRAVE");
      return ucb1GRAVE;
    } else if (algName.toLowerCase() === "biased mcts") {
      return AIFactory._createBiasedMCTS(0.0);
    } else if (algName.toLowerCase() === "biased mcts (uniform playouts)" || algName.toLowerCase() === "mcts (biased selection)") {
      return AIFactory._createBiasedMCTS(1.0);
    } else if (algName.toLowerCase() === "mcts (hybrid selection)") {
      return AIFactory._createHybridMCTS();
    } else if (algName.toLowerCase() === "bandit tree search") {
      return AIFactory._createBanditTreeSearch();
    } else if (algName.toLowerCase() === "ept") {
      return AIFactory.createAI("EPT");
    } else if (algName.toLowerCase() === "ept-qb") {
      return AIFactory.createAI("EPT-QB");
    } else if (algName.toLowerCase() === "alpha-beta" || algName.toLowerCase() === "alphabeta") {
      return AIFactory._createAlphaBeta();
    } else if (algName.toLowerCase() === "brs+" || algName.toLowerCase() === "best-reply search+") {
      return AIFactory._makeBRSPlus();
    } else if (algName.toLowerCase() === "heuristic sampling") {
      return AIFactory._makeHeuristicSampling();
    } else if (algName.toLowerCase() === "heuristic sampling (1)") {
      return AIFactory._makeHeuristicSampling(1);
    } else if (algName.toLowerCase() === "one-ply (no heuristic)") {
      return AIFactory._makeOnePlyNoHeuristic();
    } else if (algName.toLowerCase() === "from jar") {
      // JAR loading not supported in TypeScript
      console.error("AIFactory: 'From JAR' AI loading not supported in TypeScript");
      return null;
    } else if (algName.toLowerCase() === "from ai.def") {
      // Compiler-based loading not supported in TypeScript
      console.error("AIFactory: 'From AI.DEF' loading not supported in TypeScript");
      return null;
    }

    console.error("WARNING: Failed to construct AI from JSON: " + json.toString(4));
    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * @param game
   * @return AI constructed from given game's metadata
   * @java AIFactory.fromMetadata(Game)
   */
  public static fromMetadata(game: unknown): AI | null {
    const g = game as Game;
    let bestAgent: string;

    if (!g.isAlternatingMoveGame())
      bestAgent = "Flat MC";
    else
      bestAgent = "UCT";

    if (g.metadata().ai().agent() !== null) {
      return AIFactory.fromDefAgent(g.metadata().ai().agent()!);
    }

    return AIFactory.createAI(bestAgent);
  }

  //-------------------------------------------------------------------------

  /**
   * @param agent
   * @return AI constructed from agent metadata in some .def file
   * @java AIFactory.fromDefAgent(Agent)
   */
  public static fromDefAgent(agent: AgentMetadata): AI | null {
    // Duck-type to detect BestAgent vs AlphaBeta vs Mcts
    const bestAgent = agent as unknown as BestAgentMetadata;
    if (typeof bestAgent.agent === "function") {
      return AIFactory.fromDefBestAgent(bestAgent);
    }

    const alphaBeta = agent as unknown as AlphaBetaMetadata;
    if ("heuristics" in alphaBeta) {
      return AIFactory.fromDefAlphaBetaAgent(alphaBeta);
    }

    const mcts = agent as unknown as MctsMetadata;
    if (mcts.__mcts) {
      return AIFactory.fromDefMctsAgent(mcts);
    }

    console.error("AIFactory failed to load from def agent: " + agent);
    return null;
  }

  /**
   * @param agent
   * @return AI built from a best-agent string
   * @java AIFactory.fromDefBestAgent(BestAgent)
   */
  public static fromDefBestAgent(agent: BestAgentMetadata): AI | null {
    return AIFactory.createAI(agent.agent());
  }

  /**
   * @param agent
   * @return AlphaBeta AI built from AlphaBeta metadata
   * @java AIFactory.fromDefAlphaBetaAgent(AlphaBeta)
   */
  public static fromDefAlphaBetaAgent(agent: AlphaBetaMetadata): AI {
    if (agent.heuristics() === null)
      return AIFactory._makeAlphaBetaSearch() as AI;
    else
      return AIFactory._makeAlphaBetaSearchWithHeuristics(agent.heuristics()) as AI;
  }

  /**
   * @param agent
   * @return MCTS AI built from Mcts metadata
   * @java AIFactory.fromDefMctsAgent(Mcts)
   */
  public static fromDefMctsAgent(_agent: MctsMetadata): AI | null {
    console.error("Loading MCTS from def not yet implemented!");
    return null;
  }

  //-------------------------------------------------------------------------

  /**
   * @param jarFile
   * @return List of all AI classes in the given JAR file (not supported in TypeScript)
   * @java AIFactory.loadThirdPartyAIClasses(File)
   */
  public static loadThirdPartyAIClasses(_jarFilePath: string): unknown[] {
    console.error("AIFactory.loadThirdPartyAIClasses(): JAR loading not supported in TypeScript");
    return [];
  }

  //-------------------------------------------------------------------------
  // Escape-hatch factory stubs for not-yet-ported AI classes

  /** @java new RandomAI() */
  private static _makeRandomAI(): AI {
    const { RandomAI } = require("./RandomAI.js") as typeof import("./RandomAI.js");
    return new RandomAI() as unknown as AI;
  }

  /** @java new FlatMonteCarlo() */
  private static _makeFlatMonteCarlo(): AI {
    return {} as unknown as AI;
  }

  /** @java AlphaBetaSearch.createAlphaBeta() */
  private static _createAlphaBeta(): AI {
    return {} as unknown as AI;
  }

  /** @java new AlphaBetaSearch() */
  private static _makeAlphaBetaSearch(): unknown {
    return {} as unknown;
  }

  /** @java new AlphaBetaSearch(heuristics) */
  private static _makeAlphaBetaSearchWithHeuristics(_h: unknown): unknown {
    return {} as unknown;
  }

  /** @java AlphaBetaSearch.fromLines(String[]) */
  private static _alphaBetaFromLines(_lines: string[]): AI {
    return {} as unknown as AI;
  }

  /** @java new BRSPlus() */
  private static _makeBRSPlus(): AI {
    return {} as unknown as AI;
  }

  /** @java BRSPlus.fromLines(String[]) */
  private static _brsPlusFromLines(_lines: string[]): AI {
    return {} as unknown as AI;
  }

  /** @java new UBFM() / UBFM.createUBFM() */
  private static _createUBFM(): AI {
    return {} as unknown as AI;
  }

  /** @java new HybridUBFM() */
  private static _makeHybridUBFM(): AI {
    return {} as unknown as AI;
  }

  /** @java new LazyUBFM() */
  private static _makeLazyUBFM(): AI {
    return {} as unknown as AI;
  }

  /** @java new BiasedUBFM() */
  private static _makeBiasedUBFM(): AI {
    return {} as unknown as AI;
  }

  /** @java MCTS.createUCT() */
  private static _createUCT(): AI {
    return {} as unknown as AI;
  }

  /** @java MCTS.createBiasedMCTS(double) */
  private static _createBiasedMCTS(_uniformWeight: number): AI {
    return {} as unknown as AI;
  }

  /** @java MCTS.createHybridMCTS() */
  private static _createHybridMCTS(): AI {
    return {} as unknown as AI;
  }

  /** @java MCTS.createBanditTreeSearch() */
  private static _createBanditTreeSearch(): AI {
    return {} as unknown as AI;
  }

  /** @java new MCTS(Selection, Playout, Backprop, FinalMove) */
  private static _makeMCTS(
    _selection: unknown,
    _playout: unknown,
    _backprop: unknown,
    _finalMove: unknown
  ): AI {
    return {} as unknown as AI;
  }

  /** @java MCTS.fromLines(String[]) */
  private static _mctsFromLines(_lines: string[]): AI {
    return {} as unknown as AI;
  }

  /** @java MCTS.fromJson(JSONObject) */
  private static _mctsFromJson(_json: JSONObject): AI {
    return {} as unknown as AI;
  }

  /** @java new LudiiAI() */
  private static _makeLudiiAI(): AI {
    try {
      const { LudiiAI } = require("./LudiiAI.js") as typeof import("./LudiiAI.js");
      return new LudiiAI() as unknown as AI;
    } catch (_e) {
      return {} as unknown as AI;
    }
  }

  /** @java new McGRAVE() */
  private static _makeMcGRAVE(): unknown { return {}; }
  /** @java new McBRAVE() */
  private static _makeMcBRAVE(): unknown { return {}; }
  /** @java new UCB1(double) */
  private static _makeUCB1(explorationConst?: number): unknown { void explorationConst; return {}; }
  /** @java new UCB1Tuned() */
  private static _makeUCB1Tuned(): unknown { return {}; }
  /** @java new UCB1GRAVE() */
  private static _makeUCB1GRAVE(): unknown { return {}; }
  /** @java new ProgressiveHistory() */
  private static _makeProgressiveHistory(): unknown { return {}; }
  /** @java new ProgressiveBias() */
  private static _makeProgressiveBias(): unknown { return {}; }
  /** @java new RandomPlayout(int?) */
  private static _makeRandomPlayout(cap?: number): unknown { void cap; return {}; }
  /** @java new MAST(int, double) */
  private static _makeMASTPlayout(_cap: number, _tau: number): unknown { return {}; }
  /** @java new NST(int, double) */
  private static _makeNSTPlayout(_cap: number, _tau: number): unknown { return {}; }
  /** @java new MonteCarloBackprop() */
  private static _makeMonteCarloBackprop(): unknown { return {}; }
  /** @java new AlphaGoBackprop() */
  private static _makeAlphaGoBackprop(): unknown { return {}; }
  /** @java new QualitativeBonus() */
  private static _makeQualitativeBonus(): unknown { return {}; }
  /** @java new RobustChild() */
  private static _makeRobustChild(): unknown { return {}; }
  /** @java QInit.INF */
  private static _getQInitINF(): unknown { return "INF"; }
  /** @java QInit.PARENT */
  private static _getQInitPARENT(): unknown { return "PARENT"; }
  /** @java new HeuristicSampling(int?) */
  private static _makeHeuristicSampling(n?: number): AI { void n; return {} as unknown as AI; }
  /** @java HeuristicSampling.fromLines(String[]) */
  private static _heuristicSamplingFromLines(_lines: string[]): AI { return {} as unknown as AI; }
  /** @java new OnePlyNoHeuristic() */
  private static _makeOnePlyNoHeuristic(): AI { return {} as unknown as AI; }

  /** @java ai.setQInit(QInit) */
  private static _setQInit(ai: AI, qInit: unknown): void {
    if (typeof (ai as unknown as { setQInit: unknown }).setQInit === "function")
      (ai as unknown as { setQInit: (q: unknown) => void }).setQInit(qInit);
  }

  /** @java ai.setFriendlyName(String) */
  private static _setFriendlyName(ai: AI, name: string): void {
    if (typeof (ai as unknown as { setFriendlyName: unknown }).setFriendlyName === "function")
      (ai as unknown as { setFriendlyName: (n: string) => void }).setFriendlyName(name);
  }

  /** @java ai.setUseScoreBounds(boolean) */
  private static _setUseScoreBounds(ai: AI, v: boolean): void {
    if (typeof (ai as unknown as { setUseScoreBounds: unknown }).setUseScoreBounds === "function")
      (ai as unknown as { setUseScoreBounds: (v: boolean) => void }).setUseScoreBounds(v);
  }

  /** @java ai.setWantsMetadataHeuristics(boolean) */
  private static _setWantsMetadataHeuristics(ai: AI, v: boolean): void {
    if (typeof (ai as unknown as { setWantsMetadataHeuristics: unknown }).setWantsMetadataHeuristics === "function")
      (ai as unknown as { setWantsMetadataHeuristics: (v: boolean) => void }).setWantsMetadataHeuristics(v);
  }

  /** @java ai.setPlayoutValueWeight(double) */
  private static _setPlayoutValueWeight(ai: AI, v: number): void {
    if (typeof (ai as unknown as { setPlayoutValueWeight: unknown }).setPlayoutValueWeight === "function")
      (ai as unknown as { setPlayoutValueWeight: (v: number) => void }).setPlayoutValueWeight(v);
  }

  /** @java new File(path).exists() */
  private static _fileExists(path: string): boolean {
    try {
      const fs = require("fs") as typeof import("fs");
      return fs.existsSync(path);
    } catch (_e) {
      return false;
    }
  }

  /** @java Files.readString(...) */
  private static _readFile(path: string): string {
    const fs = require("fs") as typeof import("fs");
    return fs.readFileSync(path, "utf8");
  }

  /** Wrap a plain object as JSONObject */
  public static _wrapJson(rec: Record<string, unknown>): JSONObject {
    const makeJsonObj = (r: Record<string, unknown>): JSONObject => ({
      has: (k: string) => k in r,
      get: (k: string) => r[k],
      getString: (k: string) => String(r[k] ?? ""),
      getJSONObject: (k: string) => {
        if (k in r && r[k] !== null && typeof r[k] === "object")
          return makeJsonObj(r[k] as Record<string, unknown>);
        return null;
      },
      put: (k: string, v: unknown) => { r[k] = v; },
      toString: (_indent?: number) => JSON.stringify(r),
    });
    return makeJsonObj(rec);
  }

  //-------------------------------------------------------------------------
}
