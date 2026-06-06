// @java AI/src/search/flat/HeuristicSampleAdaptedUtils/HeuristicProportionViewInterface.java

/**
 * Used to allow classes of module "distance" to access.
 *
 * @java search/flat/HeuristicSampleAdaptedUtils/HeuristicProportionViewInterface.java
 * @author Markus
 */

import type { Game, Context } from "../HeuristicSampling.js";

// Forward reference — HeuristicSampleAdapted is in the sibling file
export interface HeuristicSampleAdapted {
  __heuristicSampleAdapted: true;
}

// Forward reference — MoveHeuristicEvaluation is a nested class of HeuristicSampleAdapted
export interface MoveHeuristicEvaluation {
  __moveHeuristicEvaluation: true;
}

/**
 * Interface used to allow classes of module "distance" to access HeuristicSampleAdapted.
 *
 * @java search.flat.HeuristicSampleAdaptedUtils.HeuristicProportionViewInterface
 */
export interface HeuristicProportionViewInterface {

  /** @java HeuristicProportionViewInterface.addObserver(HeuristicSampleAdapted) */
  addObserver(heuristicSampleAdapted: HeuristicSampleAdapted): void;

  /** @java HeuristicProportionViewInterface.update(MoveHeuristicEvaluation, Game, Context) */
  update(
    latestMoveHeuristicEvaluation: MoveHeuristicEvaluation,
    game: Game,
    context: Context
  ): void;
}
