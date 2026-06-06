// @java ViewController/src/bridge/ViewControllerFactory.java

import type { ContainerStyleType } from '../../../../ludemes/metadata/graphics/util/ContainerStyleType.js';
import type { ComponentStyleType } from '../../../../ludemes/metadata/graphics/util/ComponentStyleType.js';
import type { ControllerType } from '../../../../ludemes/metadata/graphics/util/ControllerType.js';
import type { Container } from '../../../../ludemes/game/equipment/container/Container.js';
import type { Component } from '../../../../ludemes/game/equipment/component/Component.js';
import type { Context } from '../../../../context.js';

// ---------------------------------------------------------------------------
// Escape-hatch interfaces for deps not yet ported (other batches).
// These are minimal structural types; the real implementations live in
// the corresponding style / controller files.
// ---------------------------------------------------------------------------

/** @java view.container.ContainerStyle */
export interface ContainerStyle {
  readonly container: Container;
}

/** @java view.component.ComponentStyle */
export interface ComponentStyle {
  readonly component: Component;
}

/** @java controllers.BaseController */
export interface BaseController {
  readonly container: Container;
}

/** @java bridge.Bridge */
export interface Bridge {
  // Intentionally opaque — forward-declared for Factory signatures.
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Lazy-import helpers.
//
// All style / controller classes live in other batches.  We import them
// lazily inside each factory method so the module compiles even when those
// files do not exist yet.  Each helper casts the dynamic import result to
// the appropriate escape-hatch interface.
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
async function loadContainerStyle<T extends ContainerStyle>(
  modulePath: string,
  className: string,
  ...args: unknown[]
): Promise<T> {
  const mod = await import(modulePath) as Record<string, new (...a: unknown[]) => T>;
  const Cls = mod[className];
  if (!Cls) throw new Error(`Class ${className} not found in ${modulePath}`);
  return new Cls(...args);
}

async function loadComponentStyle<T extends ComponentStyle>(
  modulePath: string,
  className: string,
  ...args: unknown[]
): Promise<T> {
  const mod = await import(modulePath) as Record<string, new (...a: unknown[]) => T>;
  const Cls = mod[className];
  if (!Cls) throw new Error(`Class ${className} not found in ${modulePath}`);
  return new Cls(...args);
}

async function loadController<T extends BaseController>(
  modulePath: string,
  className: string,
  ...args: unknown[]
): Promise<T> {
  const mod = await import(modulePath) as Record<string, new (...a: unknown[]) => T>;
  const Cls = mod[className];
  if (!Cls) throw new Error(`Class ${className} not found in ${modulePath}`);
  return new Cls(...args);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------

/**
 * Factory for creating specified graphics Style for an Item.
 *
 * @author matthew.stephenson and cambolbro
 * @java bridge.ViewControllerFactory
 */
export class ViewControllerFactory {

  // -------------------------------------------------------------------------

  /**
   * Creates the appropriate {@link ContainerStyle} for the given container
   * and style type.
   *
   * @java bridge.ViewControllerFactory#createStyle(Bridge, Container, ContainerStyleType, Context)
   */
  static async createContainerStyle(
    bridge: Bridge,
    container: Container,
    type: ContainerStyleType | null,
    context: Context,
  ): Promise<ContainerStyle> {
    if (type === null) {
      return loadContainerStyle(
        '../view/container/styles/BoardStyle.js',
        'BoardStyle',
        bridge, container,
      );
    }

    switch (type) {

      // core types
      case 'Board':
        return loadContainerStyle('../view/container/styles/BoardStyle.js',   'BoardStyle',   bridge, container);
      case 'Hand':
        return loadContainerStyle('../view/container/styles/HandStyle.js',    'HandStyle',    bridge, container);
      case 'Deck':
        return loadContainerStyle('../view/container/styles/hand/DeckStyle.js', 'DeckStyle', bridge, container);
      case 'Dice':
        return loadContainerStyle('../view/container/styles/hand/DiceStyle.js', 'DiceStyle', bridge, container);

      // puzzle types
      case 'Puzzle':
        return loadContainerStyle('../view/container/styles/board/puzzle/PuzzleStyle.js',    'PuzzleStyle',    bridge, container, context);
      case 'Sudoku':
        return loadContainerStyle('../view/container/styles/board/puzzle/SudokuStyle.js',    'SudokuStyle',    bridge, container, context);
      case 'Kakuro':
        return loadContainerStyle('../view/container/styles/board/puzzle/KakuroStyle.js',    'KakuroStyle',    bridge, container, context);
      case 'Futoshiki':
        return loadContainerStyle('../view/container/styles/board/puzzle/FutoshikiStyle.js', 'FutoshikiStyle', bridge, container, context);
      case 'Hashi':
        return loadContainerStyle('../view/container/styles/board/puzzle/HashiStyle.js',     'HashiStyle',     bridge, container, context);

      // graph types
      case 'Graph':
        return loadContainerStyle('../view/container/styles/board/graph/GraphStyle.js',      'GraphStyle',      bridge, container, context);
      case 'PenAndPaper':
        return loadContainerStyle('../view/container/styles/board/graph/PenAndPaperStyle.js','PenAndPaperStyle',bridge, container, context);

      // custom types
      case 'Backgammon':
        return loadContainerStyle('../view/container/styles/board/BackgammonStyle.js',       'BackgammonStyle',       bridge, container);
      case 'Boardless':
        return loadContainerStyle('../view/container/styles/board/BoardlessStyle.js',        'BoardlessStyle',        bridge, container);
      case 'Chess':
        return loadContainerStyle('../view/container/styles/board/ChessStyle.js',            'ChessStyle',            bridge, container, context);
      case 'ConnectiveGoal':
        return loadContainerStyle('../view/container/styles/board/ConnectiveGoalStyle.js',   'ConnectiveGoalStyle',   bridge, container);
      case 'Go':
        return loadContainerStyle('../view/container/styles/board/GoStyle.js',               'GoStyle',               bridge, container);
      case 'HoundsAndJackals':
        return loadContainerStyle('../view/container/styles/board/HoundsAndJackalsStyle.js', 'HoundsAndJackalsStyle', bridge, container);
      case 'Janggi':
        return loadContainerStyle('../view/container/styles/board/JanggiStyle.js',           'JanggiStyle',           bridge, container);
      case 'Lasca':
        return loadContainerStyle('../view/container/styles/board/LascaStyle.js',            'LascaStyle',            bridge, container);
      case 'Mancala':
        return loadContainerStyle('../view/container/styles/board/MancalaStyle.js',          'MancalaStyle',          bridge, container);
      case 'Shibumi':
        return loadContainerStyle('../view/container/styles/board/ShibumiStyle.js',          'ShibumiStyle',          bridge, container);
      case 'Shogi':
        return loadContainerStyle('../view/container/styles/board/ShogiStyle.js',            'ShogiStyle',            bridge, container);
      case 'SnakesAndLadders':
        return loadContainerStyle('../view/container/styles/board/SnakesAndLaddersStyle.js', 'SnakesAndLaddersStyle', bridge, container);
      case 'Tafl':
        return loadContainerStyle('../view/container/styles/board/TaflStyle.js',             'TaflStyle',             bridge, container);
      case 'Xiangqi':
        return loadContainerStyle('../view/container/styles/board/XiangqiStyle.js',          'XiangqiStyle',          bridge, container);
      case 'Connect4':
        return loadContainerStyle('../view/container/styles/board/Connect4Style.js',         'Connect4Style',         bridge, container);
      case 'Spiral':
        return loadContainerStyle('../view/container/styles/board/SpiralStyle.js',           'SpiralStyle',           bridge, container);
      case 'Surakarta':
        return loadContainerStyle('../view/container/styles/board/SurakartaStyle.js',        'SurakartaStyle',        bridge, container);
      case 'UltimateTicTacToe':
        return loadContainerStyle('../view/container/styles/board/UltimateTicTacToeStyle.js','UltimateTicTacToeStyle',bridge, container);
      case 'Isometric':
        return loadContainerStyle('../view/container/styles/board/IsometricStyle.js',        'IsometricStyle',        bridge, container);
      case 'Table':
        return loadContainerStyle('../view/container/styles/board/TableStyle.js',            'TableStyle',            bridge, container);

      default:
        return loadContainerStyle('../view/container/styles/BoardStyle.js', 'BoardStyle', bridge, container);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Creates the appropriate {@link ComponentStyle} for the given component
   * and style type.
   *
   * @java bridge.ViewControllerFactory#createStyle(Bridge, Component, ComponentStyleType)
   */
  static async createComponentStyle(
    bridge: Bridge,
    component: Component,
    type: ComponentStyleType | null,
  ): Promise<ComponentStyle> {
    if (type === null) {
      return loadComponentStyle('../view/component/custom/PieceStyle.js', 'PieceStyle', bridge, component);
    }

    switch (type) {
      case 'Piece':
        return loadComponentStyle('../view/component/custom/PieceStyle.js',             'PieceStyle',             bridge, component, false);
      case 'Text':
        return loadComponentStyle('../view/component/custom/PieceStyle.js',             'PieceStyle',             bridge, component, true);
      case 'Card':
        return loadComponentStyle('../view/component/custom/CardStyle.js',              'CardStyle',              bridge, component);
      case 'Die':
        return loadComponentStyle('../view/component/custom/DieStyle.js',               'DieStyle',               bridge, component);
      case 'Domino':
        return loadComponentStyle('../view/component/custom/large/DominoStyle.js',     'DominoStyle',            bridge, component);
      case 'Tile':
        return loadComponentStyle('../view/component/custom/large/TileStyle.js',       'TileStyle',              bridge, component);
      case 'LargePiece':
        return loadComponentStyle('../view/component/custom/large/LargePieceStyle.js', 'LargePieceStyle',        bridge, component);
      case 'ExtendedShogi':
        return loadComponentStyle('../view/component/custom/ExtendedShogiStyle.js',    'ExtendedShogiStyle',     bridge, component);
      case 'ExtendedXiangqi':
        return loadComponentStyle('../view/component/custom/ExtendedXiangqiStyle.js',  'ExtendedXiangqiStyle',   bridge, component);
      case 'NativeAmericanDice':
        return loadComponentStyle('../view/component/custom/NativeAmericanDiceStyle.js','NativeAmericanDiceStyle',bridge, component);

      default:
        return loadComponentStyle('../view/component/custom/PieceStyle.js', 'PieceStyle', bridge, component);
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Creates the appropriate {@link BaseController} for the given container
   * and controller type.
   *
   * @java bridge.ViewControllerFactory#createController(Bridge, Container, ControllerType)
   */
  static async createController(
    bridge: Bridge,
    container: Container,
    type: ControllerType | null,
  ): Promise<BaseController> {
    if (type === null) {
      return loadController('../controllers/container/BasicController.js', 'BasicController', bridge, container);
    }

    switch (type) {
      case 'BasicController':
        return loadController('../controllers/container/BasicController.js',    'BasicController',    bridge, container);
      case 'PyramidalController':
        return loadController('../controllers/container/PyramidalController.js','PyramidalController',bridge, container);
      default:
        return loadController('../controllers/container/BasicController.js', 'BasicController', bridge, container);
    }
  }

  // -------------------------------------------------------------------------
}
