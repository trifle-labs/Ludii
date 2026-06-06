// @java Evaluation/src/metrics/multiple/metrics/MoveDistance.java

/**
 * The distance traveled by pieces when they move around the board.
 * Note. Only for moves between same site type.
 *
 * @java metrics/multiple/metrics/MoveDistance.java
 * @author matthew.stephenson
 */

import { MultiMetricFramework, MultiMetricValue } from "../MultiMetricFramework.js";

/** Minimal escape-hatch types */
type Evaluation = unknown;
type Trial = unknown;
type Context = unknown;
type Game = unknown;

/** Java: Constants.INFINITY */
const INFINITY = Number.POSITIVE_INFINITY;

//-----------------------------------------------------------------------------
// Escape-hatch interfaces
//-----------------------------------------------------------------------------

/** @java other/topology/Topology.java */
interface TopologyLike {
  preGenerateDistanceToEachElementToEachOther(siteType: unknown, relationType: unknown): void;
  numSites(siteType: unknown): number;
  distancesToOtherSite(siteType: unknown): number[][];
}

/** @java other/context/Context.java */
interface ContextLike {
  board(): { topology(): TopologyLike; defaultSite(): unknown };
  game(): GameLike;
  trial(): { over(): boolean; lastMove(): MoveLike };
}

interface GameLike {
  apply(ctx: ContextLike, move: unknown): void;
  booleanConcepts(): { get(id: number): boolean };
}

/** @java other/move/Move.java */
interface MoveLike {
  fromType(): unknown;
  toType(): unknown;
  from(): number;
  to(): number;
}

interface TrialLike {
  generateRealMovesList(): MoveLike[];
}

//-----------------------------------------------------------------------------
// Concept id stubs — not-yet-ported; use numeric escape hatches
//-----------------------------------------------------------------------------

/** @java other/concept/Concept.Cell.id() — escape hatch */
const CONCEPT_CELL_ID = 0;
/** @java other/concept/Concept.Edge.id() — escape hatch */
const CONCEPT_EDGE_ID = 1;
/** @java other/concept/Concept.Vertex.id() — escape hatch */
const CONCEPT_VERTEX_ID = 2;

// Not-yet-ported SiteType and RelationType constants — use opaque escape hatch
type SiteType = unknown;
type RelationType = unknown;

/** @java game/types/board/SiteType.Cell — escape hatch */
const SITE_TYPE_CELL: SiteType = "Cell";
/** @java game/types/board/SiteType.Edge — escape hatch */
const SITE_TYPE_EDGE: SiteType = "Edge";
/** @java game/types/board/SiteType.Vertex — escape hatch */
const SITE_TYPE_VERTEX: SiteType = "Vertex";

/** @java game/types/board/RelationType.Adjacent — escape hatch */
const RELATION_ADJACENT: RelationType = "Adjacent";

//-----------------------------------------------------------------------------

/**
 * The distance traveled by pieces when they move around the board.
 *
 * @java metrics/multiple/metrics/MoveDistance.java
 */
export class MoveDistance extends MultiMetricFramework {

  //-------------------------------------------------------------------------

  /** @java MoveDistance.boardTopology — For incremental computation */
  protected boardTopology: TopologyLike | null = null;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   * @java MoveDistance(MultiMetricValue, Concept)
   */
  public constructor(multiMetricValue: MultiMetricValue, concept: unknown) {
    super(
      "Move Distance " + multiMetricValue,
      "The distance traveled by pieces when they move around the board.",
      0.0,
      INFINITY,
      concept,
      multiMetricValue,
    );
  }

  //-------------------------------------------------------------------------

  /**
   * @java MoveDistance.getMetricValueList(Evaluation, Trial, Context)
   */
  public override getMetricValueList(
    _evaluation: Evaluation,
    trial: Trial,
    context: Context,
  ): Array<number | null> {
    const ctx = context as unknown as ContextLike;
    const t = trial as unknown as TrialLike;
    const topology = ctx.board().topology();
    const game = ctx.game();

    if (game.booleanConcepts().get(CONCEPT_CELL_ID))
      topology.preGenerateDistanceToEachElementToEachOther(SITE_TYPE_CELL, RELATION_ADJACENT);
    if (game.booleanConcepts().get(CONCEPT_EDGE_ID))
      topology.preGenerateDistanceToEachElementToEachOther(SITE_TYPE_EDGE, RELATION_ADJACENT);
    if (game.booleanConcepts().get(CONCEPT_VERTEX_ID))
      topology.preGenerateDistanceToEachElementToEachOther(SITE_TYPE_VERTEX, RELATION_ADJACENT);

    const valueList: Array<number | null> = [];

    for (const m of t.generateRealMovesList()) {
      const moveType = m.fromType();

      if (
        m.fromType() === m.toType() &&
        m.from() < topology.numSites(moveType) &&
        m.to() < topology.numSites(moveType) &&
        m.from() !== m.to()
      ) {
        const distances = topology.distancesToOtherSite(moveType);
        const row = distances[m.from()];
        if (row !== undefined) {
          const dist = row[m.to()];
          if (dist !== undefined) valueList.push(dist);
        }
      }

      ctx.game().apply(ctx, m);
    }

    return valueList;
  }

  //-------------------------------------------------------------------------

  /**
   * @java MoveDistance.startNewTrial(Context, Trial)
   */
  public override startNewTrial(context: Context, _fullTrial: Trial): void {
    const ctx = context as unknown as ContextLike;
    this.boardTopology = ctx.board().topology();
    const game = ctx.game();

    if (game.booleanConcepts().get(CONCEPT_CELL_ID))
      this.boardTopology.preGenerateDistanceToEachElementToEachOther(SITE_TYPE_CELL, RELATION_ADJACENT);
    if (game.booleanConcepts().get(CONCEPT_EDGE_ID))
      this.boardTopology.preGenerateDistanceToEachElementToEachOther(SITE_TYPE_EDGE, RELATION_ADJACENT);
    if (game.booleanConcepts().get(CONCEPT_VERTEX_ID))
      this.boardTopology.preGenerateDistanceToEachElementToEachOther(SITE_TYPE_VERTEX, RELATION_ADJACENT);

    this.currValueList = [];
  }

  /**
   * @java MoveDistance.observeNextState(Context)
   */
  public override observeNextState(context: Context): void {
    const ctx = context as unknown as ContextLike;
    const m = ctx.trial().lastMove();
    const topology = this.boardTopology;
    if (topology === null) return;

    const moveType = m.fromType();

    if (
      m.fromType() === m.toType() &&
      m.from() < topology.numSites(moveType) &&
      m.to() < topology.numSites(moveType) &&
      m.from() !== m.to()
    ) {
      const distances = topology.distancesToOtherSite(moveType);
      const row = distances[m.from()];
      if (row !== undefined) {
        const dist = row[m.to()];
        if (dist !== undefined) this.currValueList.push(dist);
      }
    }
  }

  //-------------------------------------------------------------------------
}
