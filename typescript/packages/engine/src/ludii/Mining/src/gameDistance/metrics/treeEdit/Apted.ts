// @java Mining/src/gameDistance/metrics/treeEdit/Apted.java

import { Tree } from "../../../../../AI/src/utils/data_structures/support/zhang_shasha/Tree.js";
import type { DistanceMetric, DatasetLike, GameLike } from "../DistanceMetric.js";

//-----------------------------------------------------------------------------

/**
 * Returns Apted tree edit distance.
 * https://github.com/DatabaseGroup/apted
 * http://tree-edit-distance.dbresearch.uni-salzburg.at
 *
 * M. Pawlik and N. Augsten. Tree edit distance: Robust and memory-efficient. Information Systems 56. 2016.
 * M. Pawlik and N. Augsten. Efficient Computation of the Tree Edit Distance. ACM Transactions on Database Systems (TODS) 40(1). 2015.
 *
 * @java gameDistance.metrics.treeEdit.Apted
 * @author matthew.stephenson
 */

// Escape-hatch interfaces for not-yet-ported APTED utility classes
type StringNodeData = unknown;
type NodeLike = unknown;

interface BracketStringInputParserLike {
  fromString(s: string): NodeLike;
}

interface APTEDLike {
  computeEditDistance(t1: NodeLike, t2: NodeLike): number;
  computeEditMapping(): number[][];
  mappingCost(mapping: number[][]): number;
}

// Not-yet-ported APTED utils — these do not exist as TS ports yet
const BracketStringInputParser = (class {
  fromString(_s: string): NodeLike { return {} as NodeLike; }
} as unknown as { new(): BracketStringInputParserLike });

const APTEDImpl = (class {
  constructor(_costModel: unknown) {}
  computeEditDistance(_t1: NodeLike, _t2: NodeLike): number { return 0; }
  computeEditMapping(): number[][] { return []; }
  mappingCost(_mapping: number[][]): number { return 0; }
} as unknown as { new(costModel: unknown): APTEDLike });

const StringUnitCostModel = (class {} as unknown as { new(): unknown });

//-----------------------------------------------------------------------------

/** @java Apted */
export class Apted implements DistanceMetric {

  //---------------------------------------------------------------------

  /**
   * @java Apted.distance(Dataset, Map, Game, Game)
   */
  public distance(
    dataset: DatasetLike,
    _vocabulary: Map<string, number>,
    gameA: GameLike,
    gameB: GameLike
  ): number {
    const treeA = dataset.getTree(gameA) as unknown as Tree;
    const treeB = dataset.getTree(gameB) as unknown as Tree;

    const treeABracketNotation = treeA.bracketNotation();
    const treeBBracketNotation = treeB.bracketNotation();

    const parser = new BracketStringInputParser();
    const t1: NodeLike = parser.fromString(treeABracketNotation);
    const t2: NodeLike = parser.fromString(treeBBracketNotation);

    const apted: APTEDLike = new APTEDImpl(new StringUnitCostModel());
    apted.computeEditDistance(t1, t2);
    const mapping: number[][] = apted.computeEditMapping();

    const maxTreeSize = Math.max(treeA.size(), treeB.size());

    return apted.mappingCost(mapping) / maxTreeSize;
  }

  //---------------------------------------------------------------------

}
