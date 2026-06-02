/**
 * Barrel: re-exports all type files from game/types/.
 * Import this once to make all type definitions available.
 *
 * @slice types/** — Java game/types board/component/play/state enums → TS
 */

// board
export * from "./board/BasisType.js";
export * from "./board/HiddenData.js";
export * from "./board/LandmarkType.js";
export * from "./board/PuzzleElementType.js";
export * from "./board/RegionTypeDynamic.js";
export * from "./board/RegionTypeStatic.js";
export * from "./board/RelationType.js";
export * from "./board/ShapeType.js";
export * from "./board/StepType.js";
export * from "./board/StoreType.js";
export * from "./board/TilingBoardlessType.js";
export * from "./board/TrackStepType.js";
export * from "./board/TrackType.js";

// component
export * from "./component/CardType.js";
export * from "./component/DealableType.js";
export * from "./component/SuitType.js";

// play
export * from "./play/GravityType.js";
export * from "./play/ModeType.js";
export * from "./play/NoStackOnType.js";
export * from "./play/PassEndType.js";
export * from "./play/PinType.js";
export * from "./play/PrevType.js";
export * from "./play/RepetitionType.js";
export * from "./play/ResultType.js";
export * from "./play/RoleType.js";
export * from "./play/WhenType.js";

// state
export * from "./state/GameType.js";
