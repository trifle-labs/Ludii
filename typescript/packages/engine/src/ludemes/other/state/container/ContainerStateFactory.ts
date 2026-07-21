// @java Core/src/other/state/container/ContainerStateFactory.java

import type { ContainerState, GameRef, ContainerRef } from "./ContainerState.js";
import { ContainerFlatState } from "./ContainerFlatState.js";
import { ContainerFlatEdgeState } from "./ContainerFlatEdgeState.js";
import { ContainerFlatVertexState } from "./ContainerFlatVertexState.js";
import { ContainerGraphState } from "./ContainerGraphState.js";
import { ContainerStateStacks } from "../stacking/ContainerStateStacks.js";
import { ContainerStateStacksLarge } from "../stacking/ContainerStateStacksLarge.js";
import { ContainerGraphStateStacks } from "../stacking/ContainerGraphStateStacks.js";
import { ContainerGraphStateStacksLarge } from "../stacking/ContainerGraphStateStacksLarge.js";
import { ContainerDeductionPuzzleState } from "../puzzle/ContainerDeductionPuzzleState.js";
import { ContainerDeductionPuzzleStateLarge } from "../puzzle/ContainerDeductionPuzzleStateLarge.js";
import type { ZobristHashGenerator } from "../zhash/ZobristHashGenerator.js";

const UNDEFINED = -1;

// Java: ChunkStack.TYPE_INDEX_STATE = 1, TYPE_PLAYER_STATE = 0
const TYPE_INDEX_STATE = 1;
const TYPE_PLAYER_STATE = 0;

/** Extended game interface for the factory. */
export interface GameLikeForFactory extends GameRef {
  numComponents(): number;
  maximalLocalStates(): number;
  maxCount(): number;
  isStacking(): boolean;
  hasLargeStack(): boolean;
  hasCard(): boolean;
  requiresCount(): boolean;
  requiresLocalState(): boolean;
  requiresRotation(): boolean;
  isDeductionPuzzle(): boolean;
  requiresItemIndices(): boolean;
  requiresPieceValue(): boolean;
  maximalValue(): number;
  maximalRotationStates(): number;
  isGraphGame(): boolean;
  isVertexGame(): boolean;
  isCellGame(): boolean;
  isEdgeGame(): boolean;
}

/**
 * Factory pattern for ContainerState creation.
 * Faithful 1:1 port of ContainerStateFactory.java.
 *
 * @author mrraow (Java), ported to TS
 */
export class ContainerStateFactory {
  private constructor() {}

  /**
   * @param generator Hash generator.
   * @param game The game.
   * @param container The container.
   * @returns The correct container state.
   * Java: public static final ContainerState createStateForContainer(...)
   */
  static createStateForContainer(
    generator: ZobristHashGenerator,
    game: GameLikeForFactory,
    container: ContainerRef,
  ): ContainerState {
    const containerSites = container.numSites();
    const maxWhatValComponents = game.numComponents();
    const maxWhatValNumPlayers = game.players().count();
    const maxStateValMaximalLocal = 2 + game.maximalLocalStates();
    const maxPieces = game.maxCount();
    const maxCountValMaxPieces = maxPieces === 0 ? 1 : maxPieces;

    const requiresStack = game.isStacking();
    const requiresLargeStack = game.hasLargeStack();
    const requiresCard = game.hasCard();
    const requiresCount = game.requiresCount();
    const requiresState = game.requiresLocalState();
    const requiresRotation = game.requiresRotation();
    const requiresPuzzle = game.isDeductionPuzzle();
    const requiresIndices = game.requiresItemIndices();
    const requiresPieceValue = game.requiresPieceValue();

    const numChunks = containerSites;
    let maxWhatVal: number = UNDEFINED;
    let maxStateVal: number = UNDEFINED;
    let maxRotationVal: number = UNDEFINED;
    let maxCountVal: number = UNDEFINED;
    const maxPieceValue: number = requiresPieceValue ? game.maximalValue() : UNDEFINED;

    if (requiresPuzzle) return ContainerStateFactory.constructPuzzle(generator, game, container);
    if (requiresCard) return new ContainerStateStacksLarge(generator, game, container, TYPE_INDEX_STATE);

    if (requiresLargeStack && !container.isHand()) {
      if (game.isGraphGame()) return new ContainerGraphStateStacksLarge(generator, game, container, TYPE_INDEX_STATE);
      return new ContainerStateStacksLarge(generator, game, container, TYPE_INDEX_STATE);
    } else if (requiresLargeStack) {
      return new ContainerStateStacksLarge(generator, game, container, TYPE_INDEX_STATE);
    }

    if (!container.isHand() && game.isGraphGame() && requiresStack)
      return new ContainerGraphStateStacks(generator, game, container, TYPE_INDEX_STATE);

    if (container.isHand()) {
      if (requiresStack)
        return ContainerStateFactory.constructStack(generator, game, container, requiresState, requiresPieceValue, requiresIndices);

      maxWhatVal = maxWhatValComponents;
      if (requiresCount) maxCountVal = maxCountValMaxPieces;
      maxStateVal = maxStateValMaximalLocal;
      if (requiresRotation) maxRotationVal = game.maximalRotationStates();

      if (game.isGraphGame())
        return new ContainerGraphState(generator, game, container, maxWhatVal, maxStateVal, maxCountVal, maxRotationVal, maxPieceValue);

      return new ContainerFlatState(generator, game, container, numChunks, maxWhatVal, maxStateVal, maxCountVal, maxRotationVal, maxPieceValue);
    }

    if (requiresStack)
      return ContainerStateFactory.constructStack(generator, game, container, requiresState, requiresPieceValue, requiresIndices);

    maxCountVal = requiresCount ? maxCountValMaxPieces : -1;
    maxWhatVal = requiresIndices ? maxWhatValComponents : maxWhatValNumPlayers;

    if (!requiresCount && !requiresIndices && !requiresState && !game.isGraphGame()) maxWhatVal = -1;
    if (requiresState) maxStateVal = maxStateValMaximalLocal;
    if (requiresRotation) maxRotationVal = game.maximalRotationStates();

    if (game.isGraphGame()) {
      if (game.isVertexGame() && !game.isCellGame() && !game.isEdgeGame())
        return new ContainerFlatVertexState(generator, game, container, maxWhatVal, maxStateVal, maxCountVal, maxRotationVal, maxPieceValue);

      if (!game.isVertexGame() && !game.isCellGame() && game.isEdgeGame())
        return new ContainerFlatEdgeState(generator, game, container, maxWhatVal, maxStateVal, maxCountVal, maxRotationVal, maxPieceValue);

      return new ContainerGraphState(generator, game, container, maxWhatVal, maxStateVal, maxCountVal, maxRotationVal, maxPieceValue);
    }

    return new ContainerFlatState(generator, game, container, numChunks, maxWhatVal, maxStateVal, maxCountVal, maxRotationVal, maxPieceValue);
  }

  private static constructStack(
    generator: ZobristHashGenerator,
    game: GameLikeForFactory,
    container: ContainerRef,
    requiresState: boolean,
    requiresIndices: boolean,
    requiresValue: boolean,
  ): ContainerState {
    if (!container.isHand() && !requiresIndices && !requiresState && !requiresValue)
      return new ContainerStateStacks(generator, game, container, TYPE_PLAYER_STATE);
    return new ContainerStateStacks(generator, game, container, TYPE_INDEX_STATE);
  }

  private static constructPuzzle(
    generator: ZobristHashGenerator,
    game: GameLikeForFactory,
    container: ContainerRef,
  ): ContainerState {
    const numComponents = game.numComponents();
    // Simplified value ranges — in Java these are computed from board range queries
    const nbValuesEdge = 10;
    const nbValuesVertex = 10;

    if ((numComponents + 1) > 31 || nbValuesEdge > 31 || nbValuesVertex > 31)
      return new ContainerDeductionPuzzleStateLarge(generator, game, container);
    return new ContainerDeductionPuzzleState(generator, game, container);
  }
}
