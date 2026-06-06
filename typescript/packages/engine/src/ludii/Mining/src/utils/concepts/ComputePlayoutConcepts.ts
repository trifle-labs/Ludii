// @java Mining/src/utils/concepts/ComputePlayoutConcepts.java

/**
 * To update a game object with the estimated values of the playout concepts.
 *
 * @java utils/concepts/ComputePlayoutConcepts.java
 * @author Eric.Piette
 */

// Not-yet-ported dependency escape-hatch interfaces
type GameLike = {
  name: () => string;
  players: () => PlayerCountLike;
  hasSubgames: () => boolean;
  isDeductionPuzzle: () => boolean;
  isSimulationMoveGame: () => boolean;
  isStacking: () => boolean;
  booleanConcepts: () => BitSetLike;
  nonBooleanConcepts: () => Map<number, string>;
  rules: () => RulesLike;
  start: (ctx: ContextLike) => void;
  playout: (ctx: ContextLike, ais: unknown, secs: number, filter: unknown, n: number, limit: number, rng: unknown) => void;
  moves: (ctx: ContextLike) => MovesLike;
  endRules: () => EndLike | null;
  isAlternatingMoveGame: () => boolean;
  apply: (ctx: ContextLike, move: MoveLike) => void;
};
type PlayerCountLike = { count: () => number };
type BitSetLike = { get: (id: number) => boolean };
type ContainerLike = { topology: () => TopologyLike };
type TopologyLike = {
  cells: () => unknown[];
  vertices: () => unknown[];
  edges: () => unknown[];
};
type ContainerStateLike = {
  sizeStack: (site: number, siteType: unknown) => number;
  count: (site: number, siteType: unknown) => number;
};
type ContextLike = {
  containers: () => ContainerLike[];
  containerState: (cid: number) => ContainerStateLike;
  sitesFrom: () => number[];
  rng: () => { saveState: () => RandomProviderStateLike };
  trial: () => TrialLike;
  game: () => GameLike;
  model: () => ModelLike;
  active: () => boolean;
  state: () => StateLike;
};
type StateLike = { mover: () => number; currentPhase: (player: number) => number };
type TrialLike = {
  over: () => boolean;
  numInitialPlacementMoves: () => number;
  numMoves: () => number;
  getMove: (i: number) => MoveLike;
  lastMove: () => MoveLike;
};
type MoveLike = {
  moveConcepts: (ctx: ContextLike) => BitSetLike;
  apply: (ctx: ContextLike, b: boolean) => void;
};
type MovesLike = { moves: () => MoveLike[] };
type ModelLike = { startNewStep: (ctx: ContextLike, ais: unknown[], secs: number) => void };
type RulesLike = { phases: () => PhaseLike[] | null };
type PhaseLike = { end: () => EndLike | null };
type EndLike = { endRules: () => EndRuleLike[] };
type EndRuleLike = {
  eval: (ctx: ContextLike) => EndRuleLike | null;
  stateConcepts: (ctx: ContextLike) => BitSetLike;
};
type EvaluationLike = { conceptMetrics: () => MetricLike[] };
type MetricLike = {
  concept: () => ConceptLike | null;
  apply: (game: GameLike, eval_: EvaluationLike, trials: TrialLike[], rngs: RandomProviderStateLike[]) => { doubleValue: () => number };
  setMaxSecondsPerMove?: (secs: number) => void;
};
type ConceptLike = {
  id: () => number;
  name: () => string;
  dataType: () => ConceptDataTypeLike;
  type: () => ConceptTypeLike;
  equals: (other: ConceptLike) => boolean;
  portfolioConcepts?: () => ConceptLike[];
  values?: () => ConceptLike[];
};
type ConceptDataTypeLike = { equals: (other: ConceptDataTypeLike) => boolean };
type ConceptTypeLike = { equals: (other: ConceptTypeLike) => boolean };
type RandomProviderStateLike = object;
type AILike = {
  supportsGame: (game: GameLike) => boolean;
  initAI: (game: GameLike, p: number) => void;
  setMaxSecondsPerMove: (secs: number) => void;
};
type AIFactoryLike = { createAI: (name: string) => AILike };
type AlphaBetaSearchLike = AILike & { setAllowedSearchDepths: (d: unknown) => void };
type UtilsLike = { setupNewContext: (game: GameLike, rngState: RandomProviderStateLike) => ContextLike };

/** @java ComputePlayoutConcepts */
export class ComputePlayoutConcepts {

  /**
   * To create RulesetConcepts.csv (Id, RulesetId, ConceptId, Value)
   *
   * @param game             The game to update.
   * @param numPlayouts      The maximum number of playout.
   * @param timeLimit        The maximum time to compute the playouts concepts.
   * @param thinkingTime     The maximum time to take a decision per move.
   * @param agentName        The name of the agent to use for the playout concepts.
   * @param portfolioConcept To compute only the concepts for the portfolio.
   * @java ComputePlayoutConcepts.updateGame(Game, Evaluation, int, double, double, String, boolean)
   */
  public static updateGame(
    game: GameLike,
    evaluation: EvaluationLike,
    numPlayouts: number,
    timeLimit: number,
    thinkingTime: number,
    agentName: string,
    portfolioConcept: boolean
  ): void {
    const Concept = (globalThis as unknown as {
      Concept: {
        values: () => ConceptLike[];
        portfolioConcepts: () => ConceptLike[];
      };
    }).Concept;
    const ConceptDataType = (globalThis as unknown as {
      ConceptDataType: { BooleanData: ConceptDataTypeLike };
    }).ConceptDataType;
    const Constants = (globalThis as unknown as { Constants: { UNDEFINED: number } }).Constants;

    const nonBooleanConcepts: ConceptLike[] = [];
    const conceptValues: ConceptLike[] = portfolioConcept ? Concept.portfolioConcepts() : Concept.values();
    for (const concept of conceptValues) {
      if (!concept.dataType().equals(ConceptDataType.BooleanData))
        nonBooleanConcepts.push(concept);
    }

    const frequencyPlayouts: Map<string, number> =
      numPlayouts === 0
        ? new Map<string, number>()
        : ComputePlayoutConcepts.playoutsMetrics(game, evaluation, numPlayouts, timeLimit, thinkingTime, agentName, portfolioConcept);

    for (const concept of nonBooleanConcepts) {
      const value: number =
        frequencyPlayouts.get(concept.name()) === undefined
          ? Constants.UNDEFINED
          : frequencyPlayouts.get(concept.name())!;

      game.nonBooleanConcepts().set(concept.id(), value + "");
    }
  }

  /**
   * @param game         The game
   * @param playoutLimit The number of playouts to run.
   * @param timeLimit    The maximum time to use.
   * @param thinkingTime The maximum time to take a decision at each state.
   * @param portfolioConcept To compute only the concepts for the portfolio.
   * @return The frequency of all the boolean concepts in the number of playouts set in entry
   * @java ComputePlayoutConcepts.playoutsMetrics(Game, Evaluation, int, double, double, String, boolean)
   */
  private static playoutsMetrics(
    game: GameLike,
    evaluation: EvaluationLike,
    playoutLimit: number,
    timeLimit: number,
    thinkingTime: number,
    agentName: string,
    portfolioConcept: boolean
  ): Map<string, number> {
    const startTime: number = Date.now();

    // Used to return the frequency (of each playout concept).
    const mapFrequency: Map<string, number> = new Map<string, number>();

    // Used to return the value of each metric.
    const trials: TrialLike[] = [];
    const allStoredRNG: RandomProviderStateLike[] = [];

    const ContextCls = (globalThis as unknown as { Context: new (game: GameLike, trial: TrialLike) => ContextLike }).Context;
    const TrialCls = (globalThis as unknown as { Trial: new (game: GameLike) => TrialLike }).Trial;
    const EvaluationCls = (globalThis as unknown as { Evaluation: new () => EvaluationLike }).Evaluation;

    // For now I exclude the matches, but can be included too after. The deduc puzzle
    // will stay excluded.
    if (
      game.hasSubgames() ||
      game.isDeductionPuzzle() ||
      game.isSimulationMoveGame() ||
      game.name().includes("Trax") ||
      game.name().includes("Kriegsspiel")
    ) {
      // We add all the default metrics values corresponding to a concept to the returned map.
      const metrics: MetricLike[] = new EvaluationCls().conceptMetrics();
      for (const metric of metrics)
        if (metric.concept() !== null)
          mapFrequency.set(metric.concept()!.name(), null as unknown as number);
      return mapFrequency;
    }

    // We run the playouts needed for the computation.
    for (let indexPlayout = 0; indexPlayout < playoutLimit; indexPlayout++) {
      const ais: (AILike | null)[] = ComputePlayoutConcepts.chooseAI(game, agentName, indexPlayout);

      for (const ai of ais)
        if (ai !== null)
          ai.setMaxSecondsPerMove(thinkingTime);

      const context: ContextLike = new ContextCls(game, new TrialCls(game));
      allStoredRNG.push(context.rng().saveState());
      const trial: TrialLike = context.trial();
      game.start(context);

      // Init the ais (here random).
      for (let p = 1; p <= game.players().count(); ++p)
        ais[p]!.initAI(game, p);
      const model: ModelLike = context.model();

      while (!trial.over())
        model.startNewStep(context, ais as AILike[], thinkingTime);

      trials.push(trial);

      const currentTimeUsed: number = (Date.now() - startTime) / 1000.0;
      if (currentTimeUsed > timeLimit) // We stop if the limit of time is reached.
        break;
    }

    // We get the values of the starting concepts.
    for (const [k, v] of ComputePlayoutConcepts.startsConcepts(game, allStoredRNG))
      mapFrequency.set(k, v);

    const startTimeFrequency: number = Date.now();

    // We get the values of the frequencies.
    for (const [k, v] of ComputePlayoutConcepts.frequencyConcepts(game, trials, allStoredRNG))
      mapFrequency.set(k, v);

    const ms: number = Date.now() - startTimeFrequency;
    console.log("Playouts computation done in " + ms + " ms.");

    // We get the values of the metrics.
    if (!portfolioConcept) {
      for (const [k, v] of ComputePlayoutConcepts.metricsConcepts(game, evaluation, trials, allStoredRNG))
        mapFrequency.set(k, v);
    }

    // Computation of the p/s and m/s
    if (!portfolioConcept) {
      for (const [k, v] of ComputePlayoutConcepts.playoutsEstimationConcepts(game))
        mapFrequency.set(k, v);
    }

    return mapFrequency;
  }

  /**
   * @param game The game.
   * @param agentName The name of the agent.
   * @param indexPlayout The index of the playout.
   * @return The list of AIs to play that playout.
   * @java ComputePlayoutConcepts.chooseAI(Game, String, int)
   */
  private static chooseAI(game: GameLike, agentName: string, indexPlayout: number): (AILike | null)[] {
    const AIFactory = (globalThis as unknown as { AIFactory: AIFactoryLike }).AIFactory;
    const RandomAI = (globalThis as unknown as { RandomAI: new () => AILike }).RandomAI;
    const AlphaBetaSearchCls = (globalThis as unknown as { AlphaBetaSearch: new () => AlphaBetaSearchLike }).AlphaBetaSearch;
    const AllowedSearchDepths = (globalThis as unknown as { AllowedSearchDepths: { Odd: unknown; Even: unknown } }).AllowedSearchDepths;

    const ais: (AILike | null)[] = [];
    ais.push(null);

    for (let p = 1; p <= game.players().count(); ++p) {
      if (agentName === "UCT") {
        const ai: AILike = AIFactory.createAI("UCT");
        if (ai.supportsGame(game)) {
          ais.push(ai);
        } else {
          ais.push(new RandomAI());
        }
      } else if (agentName === "Alpha-Beta") {
        let ai: AILike = AIFactory.createAI("Alpha-Beta");
        if (ai.supportsGame(game)) {
          ais.push(ai);
        } else if (AIFactory.createAI("UCT").supportsGame(game)) {
          ai = AIFactory.createAI("UCT");
          ais.push(ai);
        } else {
          ais.push(new RandomAI());
        }
      } else if (agentName === "Alpha-Beta-UCT") { // AB/UCT/AB/UCT/...
        if (indexPlayout % 2 === 0) {
          if (p % 2 === 1) {
            let ai: AILike = AIFactory.createAI("Alpha-Beta");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("UCT").supportsGame(game)) {
              ai = AIFactory.createAI("UCT");
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          } else {
            const ai: AILike = AIFactory.createAI("UCT");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          }
        } else {
          if (p % 2 === 1) {
            const ai: AILike = AIFactory.createAI("UCT");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          } else {
            let ai: AILike = AIFactory.createAI("Alpha-Beta");
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("UCT").supportsGame(game)) {
              ai = AIFactory.createAI("UCT");
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          }
        }
      } else if (agentName === "AB-Odd-Even") { // Alternating between AB Odd and AB Even
        if (indexPlayout % 2 === 0) {
          if (p % 2 === 1) {
            let ai: AlphaBetaSearchLike = new AlphaBetaSearchCls();
            (ai as AlphaBetaSearchLike).setAllowedSearchDepths(AllowedSearchDepths.Odd);
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("UCT").supportsGame(game)) {
              ai = AIFactory.createAI("UCT") as unknown as AlphaBetaSearchLike;
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          } else {
            const ai: AlphaBetaSearchLike = new AlphaBetaSearchCls();
            ai.setAllowedSearchDepths(AllowedSearchDepths.Even);
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          }
        } else {
          if (p % 2 === 1) {
            const ai: AlphaBetaSearchLike = new AlphaBetaSearchCls();
            ai.setAllowedSearchDepths(AllowedSearchDepths.Even);
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          } else {
            let ai: AlphaBetaSearchLike = new AlphaBetaSearchCls();
            (ai as AlphaBetaSearchLike).setAllowedSearchDepths(AllowedSearchDepths.Odd);
            if (ai.supportsGame(game)) {
              ais.push(ai);
            } else if (AIFactory.createAI("UCT").supportsGame(game)) {
              ai = AIFactory.createAI("UCT") as unknown as AlphaBetaSearchLike;
              ais.push(ai);
            } else {
              ais.push(new RandomAI());
            }
          }
        }
      } else {
        ais.push(new RandomAI());
      }
    }
    return ais;
  }

  /**
   * @param game The game.
   * @param allStoredRNG The RNG for each trial.
   * @return The map of playout concepts to the their values for the starting ones.
   * @java ComputePlayoutConcepts.startsConcepts(Game, List)
   */
  private static startsConcepts(
    game: GameLike,
    allStoredRNG: RandomProviderStateLike[]
  ): Map<string, number> {
    const mapStarting: Map<string, number> = new Map<string, number>();

    const Concept = (globalThis as unknown as {
      Concept: {
        Cell: ConceptLike;
        Vertex: ConceptLike;
        Edge: ConceptLike;
        NumStartComponents: ConceptLike;
        NumStartComponentsHand: ConceptLike;
        NumStartComponentsBoard: ConceptLike;
        NumStartComponentsPerPlayer: ConceptLike;
        NumStartComponentsHandPerPlayer: ConceptLike;
        NumStartComponentsBoardPerPlayer: ConceptLike;
      };
    }).Concept;
    const SiteType = (globalThis as unknown as { SiteType: { Cell: unknown; Vertex: unknown; Edge: unknown } }).SiteType;
    const Utils = (globalThis as unknown as { Utils: UtilsLike }).Utils;

    const booleanConcepts: BitSetLike = game.booleanConcepts();
    let numStartComponents: number = 0.0;
    let numStartComponentsHands: number = 0.0;
    let numStartComponentsBoard: number = 0.0;

    for (let index = 0; index < allStoredRNG.length; index++) {
      const rngState: RandomProviderStateLike = allStoredRNG[index]!;

      // Setup a new instance of the game
      const context: ContextLike = Utils.setupNewContext(game, rngState);
      for (let cid = 0; cid < context.containers().length; cid++) {
        const cont: ContainerLike = context.containers()[cid]!;
        const cs: ContainerStateLike = context.containerState(cid);
        if (cid === 0) {
          if (booleanConcepts.get(Concept.Cell.id())) {
            for (let cell = 0; cell < cont.topology().cells().length; cell++) {
              const count: number = game.isStacking()
                ? cs.sizeStack(cell, SiteType.Cell)
                : cs.count(cell, SiteType.Cell);
              numStartComponents += count;
              numStartComponentsBoard += count;
            }
          }

          if (booleanConcepts.get(Concept.Vertex.id())) {
            for (let vertex = 0; vertex < cont.topology().vertices().length; vertex++) {
              const count: number = game.isStacking()
                ? cs.sizeStack(vertex, SiteType.Vertex)
                : cs.count(vertex, SiteType.Vertex);
              numStartComponents += count;
              numStartComponentsBoard += count;
            }
          }

          if (booleanConcepts.get(Concept.Edge.id())) {
            for (let edge = 0; edge < cont.topology().edges().length; edge++) {
              const count: number = game.isStacking()
                ? cs.sizeStack(edge, SiteType.Edge)
                : cs.count(edge, SiteType.Edge);
              numStartComponents += count;
              numStartComponentsBoard += count;
            }
          }
        } else {
          if (booleanConcepts.get(Concept.Cell.id())) {
            const sitesFrom: number[] = context.sitesFrom();
            for (
              let cell = sitesFrom[cid]!;
              cell < sitesFrom[cid]! + cont.topology().cells().length;
              cell++
            ) {
              const count: number = game.isStacking()
                ? cs.sizeStack(cell, SiteType.Cell)
                : cs.count(cell, SiteType.Cell);
              numStartComponents += count;
              numStartComponentsHands += count;
            }
          }
        }
      }
    }

    const n: number = allStoredRNG.length;
    const playerCount: number = game.players().count() === 0 ? 1 : game.players().count();

    mapStarting.set(Concept.NumStartComponents.name(), numStartComponents / n);
    mapStarting.set(Concept.NumStartComponentsHand.name(), numStartComponentsHands / n);
    mapStarting.set(Concept.NumStartComponentsBoard.name(), numStartComponentsBoard / n);

    mapStarting.set(Concept.NumStartComponentsPerPlayer.name(), (numStartComponents / n) / playerCount);
    mapStarting.set(Concept.NumStartComponentsHandPerPlayer.name(), (numStartComponentsHands / n) / playerCount);
    mapStarting.set(Concept.NumStartComponentsBoardPerPlayer.name(), (numStartComponentsBoard / n) / playerCount);

    return mapStarting;
  }

  /**
   * @param game The game.
   * @param trials The trials.
   * @param allStoredRNG The RNG for each trial.
   * @return The map of playout concepts to the their values for the frequency ones.
   * @java ComputePlayoutConcepts.frequencyConcepts(Game, List, List)
   */
  private static frequencyConcepts(
    game: GameLike,
    trials: TrialLike[],
    allStoredRNG: RandomProviderStateLike[]
  ): Map<string, number> {
    const mapFrequency: Map<string, number> = new Map<string, number>();

    const Concept = (globalThis as unknown as {
      Concept: {
        values: () => ConceptLike[];
        Draw: ConceptLike;
      };
    }).Concept;
    const ConceptType = (globalThis as unknown as {
      ConceptType: { End: ConceptTypeLike };
    }).ConceptType;
    const Utils = (globalThis as unknown as { Utils: UtilsLike }).Utils;
    const ContextCls = (globalThis as unknown as { Context: new (other: ContextLike) => ContextLike }).Context;

    // Frequencies of the moves.
    const frequencyMoveConcepts: number[] = [];

    // Frequencies returned by all the playouts.
    const frequencyPlayouts: number[] = [];
    for (let indexConcept = 0; indexConcept < Concept.values().length; indexConcept++)
      frequencyPlayouts.push(0.0);

    for (let trialIndex = 0; trialIndex < trials.length; trialIndex++) {
      const trial: TrialLike = trials[trialIndex]!;
      const rngState: RandomProviderStateLike = allStoredRNG[trialIndex]!;

      // Setup a new instance of the game
      const context: ContextLike = Utils.setupNewContext(game, rngState);

      // Frequencies returned by that playout.
      const frenquencyPlayout: number[] = [];
      for (let indexConcept = 0; indexConcept < Concept.values().length; indexConcept++)
        frenquencyPlayout.push(0);

      // Run the playout.
      let turnWithMoves: number = 0;
      let prevContext: ContextLike | null = null;
      for (let i = trial.numInitialPlacementMoves(); i < trial.numMoves(); i++) {
        const legalMoves: MovesLike = context.game().moves(context);

        const frenquencyTurn: number[] = [];
        for (let indexConcept = 0; indexConcept < Concept.values().length; indexConcept++)
          frenquencyTurn.push(0);

        const numLegalMoves: number = legalMoves.moves().length;
        if (numLegalMoves > 0)
          turnWithMoves++;

        for (const legalMove of legalMoves.moves()) {
          const moveConcepts: BitSetLike = legalMove.moveConcepts(context);
          for (let indexConcept = 0; indexConcept < Concept.values().length; indexConcept++) {
            const concept: ConceptLike = Concept.values()[indexConcept]!;
            if (moveConcepts.get(concept.id()))
              frenquencyTurn[indexConcept] = (frenquencyTurn[indexConcept] ?? 0) + 1;
          }
        }

        for (let j = 0; j < frenquencyTurn.length; j++)
          frenquencyPlayout[j] =
            (frenquencyPlayout[j] ?? 0) + (numLegalMoves === 0 ? 0 : (frenquencyTurn[j] ?? 0) / numLegalMoves);

        // We keep the context before the ending state for the frequencies of the end conditions.
        if (i === trial.numMoves() - 1)
          prevContext = new ContextCls(context);

        // We go to the next move.
        context.game().apply(context, trial.getMove(i));
      }

      // Compute avg for all the playouts.
      for (let j = 0; j < frenquencyPlayout.length; j++)
        frequencyPlayouts[j] = (frequencyPlayouts[j] ?? 0) + (frenquencyPlayout[j] ?? 0) / turnWithMoves;

      trial.lastMove().apply(prevContext!, true);

      let noEndFound: boolean = true;

      if (game.rules().phases() !== null) {
        const mover: number = context.state().mover();
        const endPhase: PhaseLike = game.rules().phases()![context.state().currentPhase(mover)]!;
        const EndPhaseRule: EndLike | null = endPhase.end();

        // Only check if action not part of setup
        if (context.active() && EndPhaseRule !== null) {
          const endRules: EndRuleLike[] = EndPhaseRule.endRules();
          for (const endingRule of endRules) {
            const endRuleResult: EndRuleLike | null = endingRule.eval(prevContext!);
            if (endRuleResult === null)
              continue;

            const endConcepts: BitSetLike = endingRule.stateConcepts(prevContext!);

            noEndFound = false;
            for (let indexConcept = 0; indexConcept < Concept.values().length; indexConcept++) {
              const concept: ConceptLike = Concept.values()[indexConcept]!;
              if (concept.type().equals(ConceptType.End) && endConcepts.get(concept.id())) {
                // System.out.println("end with " + concept.name());
                frequencyPlayouts[indexConcept] = (frequencyPlayouts[indexConcept] ?? 0) + 1;
              }
            }
            // System.out.println();
            break;
          }
        }
      }

      const endRule: EndLike | null = game.endRules();
      if (noEndFound && endRule !== null) {
        const endRules: EndRuleLike[] = endRule.endRules();
        for (const endingRule of endRules) {
          const endRuleResult: EndRuleLike | null = endingRule.eval(prevContext!);
          if (endRuleResult === null)
            continue;

          const endConcepts: BitSetLike = endingRule.stateConcepts(prevContext!);

          noEndFound = false;
          for (let indexConcept = 0; indexConcept < Concept.values().length; indexConcept++) {
            const concept: ConceptLike = Concept.values()[indexConcept]!;
            if (concept.type().equals(ConceptType.End) && endConcepts.get(concept.id())) {
              // System.out.println("end with " + concept.name());
              frequencyPlayouts[indexConcept] = (frequencyPlayouts[indexConcept] ?? 0) + 1;
            }
          }
          // System.out.println();
          break;
        }
      }

      if (noEndFound) {
        for (let indexConcept = 0; indexConcept < Concept.values().length; indexConcept++) {
          const concept: ConceptLike = Concept.values()[indexConcept]!;
          if (concept.equals(Concept.Draw)) {
            frequencyPlayouts[indexConcept] = (frequencyPlayouts[indexConcept] ?? 0) + 1;
            break;
          }
        }
      }
    }

    // Compute avg frequency for the game.
    for (let i = 0; i < frequencyPlayouts.length; i++)
      frequencyMoveConcepts.push((frequencyPlayouts[i] ?? 0) / trials.length);

    for (let indexConcept = 0; indexConcept < Concept.values().length; indexConcept++) {
      const concept: ConceptLike = Concept.values()[indexConcept]!;
      mapFrequency.set(concept.name(), frequencyMoveConcepts[indexConcept]!);
    }

    return mapFrequency;
  }

  /**
   * @param game The game.
   * @param trials The trials.
   * @param allStoredRNG The RNG for each trial.
   * @return The map of playout concepts to the their values for the metric ones.
   * @java ComputePlayoutConcepts.metricsConcepts(Game, Evaluation, List, List)
   */
  private static metricsConcepts(
    game: GameLike,
    evaluation: EvaluationLike,
    trials: TrialLike[],
    allStoredRNG: RandomProviderStateLike[]
  ): Map<string, number> {
    const playoutConceptValues: Map<string, number> = new Map<string, number>();

    const EvaluationCls = (globalThis as unknown as { Evaluation: new () => EvaluationLike }).Evaluation;
    const Constants = (globalThis as unknown as { Constants: { EPSILON: number } }).Constants;
    const TrialCls = (globalThis as unknown as { Trial: new (trial: TrialLike) => TrialLike }).Trial;

    // We get the values of the metrics.
    const trialsMetrics: TrialLike[] = [];
    const rngTrials: RandomProviderStateLike[] = [];
    for (let i = 0; i < trials.length; i++) {
      trialsMetrics.push(new TrialCls(trials[i]!));
      rngTrials.push(allStoredRNG[i]!);
    }

    // We add all the metrics corresponding to a concept to the returned map.
    const metrics: MetricLike[] = new EvaluationCls().conceptMetrics();
    for (const metric of metrics) {
      if (metric.concept() !== null) {
        let metricValue: number = metric.apply(game, evaluation, trialsMetrics, rngTrials).doubleValue();
        metricValue = (Math.abs(metricValue) < Constants.EPSILON) ? 0 : metricValue;
        playoutConceptValues.set(metric.concept()!.name(), metricValue);
      }
    }

    return playoutConceptValues;
  }

  /**
   * @param game The game.
   * @return The map of playout concepts to the their values for the p/s and m/s ones.
   * @java ComputePlayoutConcepts.playoutsEstimationConcepts(Game)
   */
  private static playoutsEstimationConcepts(game: GameLike): Map<string, number> {
    const playoutConceptValues: Map<string, number> = new Map<string, number>();

    const Concept = (globalThis as unknown as {
      Concept: {
        PlayoutsPerSecond: ConceptLike;
        MovesPerSecond: ConceptLike;
      };
    }).Concept;
    const Constants = (globalThis as unknown as { Constants: { UNDEFINED: number } }).Constants;
    const ContextCls = (globalThis as unknown as { Context: new (game: GameLike, trial: TrialLike) => ContextLike }).Context;
    const TrialCls = (globalThis as unknown as { Trial: new (game: GameLike) => TrialLike }).Trial;

    // Computation of the p/s and m/s
    const trial: TrialLike = new TrialCls(game);
    const context: ContextLike = new ContextCls(game, trial);

    // Warming up
    let stopAt: number = 0;
    let start: number = performance.now() * 1e6; // nanoseconds
    const warmingUpSecs: number = 1;
    const measureSecs: number = 3;
    let abortAt: number = start + warmingUpSecs * 1e9;
    while (stopAt < abortAt) {
      game.start(context);
      game.playout(context, null, 1.0, null, -1, Constants.UNDEFINED, null);
      stopAt = performance.now() * 1e6;
    }

    // Set up RNG for this game, Always with a rng of 2077.
    // Note: in TS we use a simple seed-based approach.
    const _rngSeed: number = (game.name().split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) * 2077;

    // The Test
    stopAt = 0;
    start = performance.now() * 1e6;
    abortAt = start + measureSecs * 1e9;
    let playouts: number = 0;
    let moveDone: number = 0;
    while (stopAt < abortAt) {
      game.start(context);
      game.playout(context, null, 1.0, null, -1, Constants.UNDEFINED, null);
      moveDone += context.trial().numMoves();
      stopAt = performance.now() * 1e6;
      ++playouts;
    }

    const secs: number = (stopAt - start) / 1e9;
    const rate: number = playouts / secs;
    const rateMove: number = moveDone / secs;
    playoutConceptValues.set(Concept.PlayoutsPerSecond.name(), rate);
    playoutConceptValues.set(Concept.MovesPerSecond.name(), rateMove);

    return playoutConceptValues;
  }
}
