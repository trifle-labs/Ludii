// @java AI/src/training/expert_iteration/menageries/TournamentMenagerie.java

/**
 * Menagerie for Elo-based tournament mode (like in Polygames).
 *
 * @java training/expert_iteration/menageries/TournamentMenagerie.java
 * @author Dennis Soemers
 */

import { AgentCheckpoint } from "./AgentCheckpoint.js";
import { DrawnAgentsData } from "./Menagerie.js";
import type { Menagerie, Context } from "./Menagerie.js";
import { AgentsParams } from "../params/AgentsParams.js";
import type { Game, Features, Heuristics } from "./AgentCheckpoint.js";
import type { ExpertPolicy } from "../ExpertPolicy.js";

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for not-yet-ported types

/** @java other.RankUtils — agentUtilities(Context) */
interface RankUtils {
  agentUtilities(context: Context): number[];
}
const RankUtils = {} as unknown as { agentUtilities(context: Context): number[] };

// ---------------------------------------------------------------------------

/**
 * Subclass of DrawnAgentsData; additionally remembers indexes of agents
 * that were drawn, such that we can correctly update Elo ratings when
 * trial is done.
 *
 * @java training.expert_iteration.menageries.TournamentMenagerie.TournamentDrawnAgentsData
 */
export class TournamentDrawnAgentsData extends DrawnAgentsData {

  /** Player index for which we picked the dev checkpoint */
  private readonly devIdx_: number;

  /** For every player ID (except devIdx), the index of the checkpoint we used there */
  private readonly agentIndices_: number[];

  /**
   * Constructor
   * @param agents
   * @param devIdx
   * @param agentIndices
   * @java TournamentDrawnAgentsData(List<ExpertPolicy>, int, int[])
   */
  public constructor(agents: (ExpertPolicy | null)[], devIdx: number, agentIndices: number[]) {
    super(agents);
    this.devIdx_ = devIdx;
    this.agentIndices_ = agentIndices;
  }

  /**
   * @return For every player ID (except devIdx), the index of the checkpoint we used there
   * @java TournamentDrawnAgentsData.agentIndices()
   */
  public agentIndices(): number[] {
    return this.agentIndices_;
  }

  /**
   * @return Player index for which we picked the dev checkpoint
   * @java TournamentDrawnAgentsData.devIdx()
   */
  public devIdx(): number {
    return this.devIdx_;
  }
}

// ---------------------------------------------------------------------------

/**
 * Menagerie for Elo-based tournament mode (like in Polygames).
 *
 * @java training.expert_iteration.menageries.TournamentMenagerie
 */
export class TournamentMenagerie implements Menagerie {

  //-------------------------------------------------------------------------

  /** Our dev checkpoint */
  private dev!: AgentCheckpoint;

  /** Population of checkpoints */
  private readonly population: AgentCheckpoint[] = [];

  /** Elo rating for every checkpoint in population */
  private populationElosTable: number[] = [];

  /** Elo rating for dev */
  private devElo: number = 0;

  /** First indexed by Player ID (in game), secondly indexed by population index; pick counts */
  private agentPickCounts: number[][] = [];

  /** How many checkpoints do we have? */
  private checkpointCounter: number = 0;

  /** Do we have to add our new dev to the population? */
  private shouldAddDev: boolean = false;

  //-------------------------------------------------------------------------

  /** @java TournamentMenagerie.drawAgents(Game, AgentsParams) */
  public drawAgents(game: Game, agentsParams: AgentsParams): TournamentDrawnAgentsData {
    if (this.shouldAddDev) {
      this.population.push(this.dev);
      this.shouldAddDev = false;

      // Initialise Elo rating for new checkpoint
      if (this.checkpointCounter > 0)
        this.populationElosTable.push(this.devElo);
      else
        this.populationElosTable.push(0);

      for (let p = 1; p < this.agentPickCounts.length; ++p) {
        this.agentPickCounts[p]!.push(0);
      }

      ++this.checkpointCounter;
    }

    const numPlayers = game.players().count();
    const agentIndices: number[] = new Array(this.agentPickCounts.length).fill(-1);
    const agents: (ExpertPolicy | null)[] = [null];

    // We will always use dev for at least one of the players
    const devIndex = 1 + Math.floor(Math.random() * numPlayers);

    for (let p = 1; p < this.agentPickCounts.length; ++p) {
      if (p === devIndex) {
        agents.push(this.dev.generateAgent(game, agentsParams));
        agentIndices[p] = -1;
      } else {
        // Compute vector of probabilities based on Elo ratings
        const probs = [...this.populationElosTable];
        const max = Math.max(...probs);

        for (let i = 0; i < probs.length; ++i) {
          probs[i] = Math.exp((probs[i]! - max) / 400);
        }

        // sampleProportionally
        const total = probs.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let sampledAgentIdx = 0;
        for (let i = 0; i < probs.length; ++i) {
          r -= probs[i]!;
          if (r <= 0) { sampledAgentIdx = i; break; }
        }

        agents.push(this.population[sampledAgentIdx]!.generateAgent(game, agentsParams));
        agentIndices[p] = sampledAgentIdx;
        this.agentPickCounts[p]![sampledAgentIdx]! += 1;
      }
    }

    return new TournamentDrawnAgentsData(agents, devIndex, agentIndices);
  }

  //-------------------------------------------------------------------------

  /** @java TournamentMenagerie.initialisePopulation(Game, AgentsParams, Features, Heuristics) */
  public initialisePopulation(
    game: Game,
    agentsParams: AgentsParams,
    features: Features,
    heuristics: Heuristics
  ): void {
    this.dev = new AgentCheckpoint(
      agentsParams.expertAI, "Checkpoint " + this.checkpointCounter, features, heuristics
    );
    this.devElo = 0;
    this.population.length = 0;
    this.shouldAddDev = true;

    const numPlayers = game.players().count();
    this.populationElosTable = [];
    this.agentPickCounts = new Array(numPlayers + 1).fill(null).map(() => []);

    // Start out with plain UCT and MC-GRAVE agents
    for (const startingAgent of ["UCT", "MC-GRAVE"]) {
      this.population.push(new AgentCheckpoint(startingAgent, startingAgent, null, null));
      this.populationElosTable.push(0);

      for (let p = 1; p <= numPlayers; ++p) {
        this.agentPickCounts[p]!.push(0);
      }
    }
  }

  /** @java TournamentMenagerie.updateDevFeatures(Features) */
  public updateDevFeatures(features: Features): void {
    this.dev = new AgentCheckpoint(
      this.dev.agentName,
      "Checkpoint " + this.checkpointCounter,
      features,
      (this.dev as unknown as { heuristicsMetadata: Heuristics | null }).heuristicsMetadata
    );
    this.shouldAddDev = true;
  }

  /** @java TournamentMenagerie.updateDevHeuristics(Heuristics) */
  public updateDevHeuristics(heuristics: Heuristics): void {
    this.dev = new AgentCheckpoint(
      this.dev.agentName,
      "Checkpoint " + this.checkpointCounter,
      (this.dev as unknown as { featuresMetadata: Features | null }).featuresMetadata,
      heuristics
    );
    this.shouldAddDev = true;
  }

  /** @java TournamentMenagerie.updateOutcome(Context, DrawnAgentsData) */
  public updateOutcome(context: Context, drawnAgentsData: DrawnAgentsData): void {
    const d = drawnAgentsData as TournamentDrawnAgentsData;
    const utilities = RankUtils.agentUtilities(context);

    let sumElos = 0;
    for (let p = 1; p < this.agentPickCounts.length; ++p) {
      if (p === d.devIdx())
        sumElos += this.devElo;
      else
        sumElos += this.populationElosTable[d.agentIndices()[p]!]!;
    }

    // Compute by how much to adjust all the Elo ratings
    const elosToAdd: number[] = new Array(this.agentPickCounts.length).fill(0);

    for (let p = 1; p < this.agentPickCounts.length; ++p) {
      const pUtility = utilities[p]!;
      const pElo = p === d.devIdx()
        ? this.devElo
        : this.populationElosTable[d.agentIndices()[p]!]!;

      const avgOpponentsElo = (sumElos - pElo) / (this.agentPickCounts.length - 1);
      const expectedWinProb = 1.0 / (1.0 + Math.pow(10.0, (pElo - avgOpponentsElo) / 400.0));
      const expectedUtil = 2.0 * expectedWinProb - 1.0;
      elosToAdd[p]! += 15 * (pUtility - expectedUtil);
    }

    // Do the actual Elo updates
    for (let p = 1; p < this.agentPickCounts.length; ++p) {
      if (p === d.devIdx())
        this.devElo += elosToAdd[p]!;
      else
        this.populationElosTable[d.agentIndices()[p]!]! += elosToAdd[p]!;
    }
  }

  //-------------------------------------------------------------------------

  /** @java TournamentMenagerie.generateLog() */
  public generateLog(): string {
    const sb: string[] = [];

    sb.push("\nDev Elo: " + this.devElo + "\n");
    sb.push("Checkpoint Elos:\n");
    for (let i = 0; i < this.population.length; ++i) {
      sb.push(this.population[i]!.checkpointName() + ": " + this.populationElosTable[i]! + "\n");
    }
    sb.push("\n");

    sb.push("Checkpoint Pick Counts:\n");
    for (let i = 0; i < this.population.length; ++i) {
      sb.push(this.population[i]!.checkpointName() + ": ");
      for (let p = 1; p < this.agentPickCounts.length; ++p) {
        sb.push(String(this.agentPickCounts[p]![i]!));
        if (p + 1 < this.agentPickCounts.length)
          sb.push(", ");
      }
      sb.push("\n");
    }
    sb.push("\n");

    return sb.join("");
  }

  //-------------------------------------------------------------------------
}
