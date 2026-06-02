/**
 * Barrel file for the equipment 1:1 faithful port.
 *
 * These are DATA/STRUCTURE classes — they do NOT self-register in the 1:1
 * ludeme registry (they are not eval-ludemes). Import this barrel to make
 * the classes available for use by the compiler and other ludeme modules.
 *
 * Files touched (all NEW, no existing files modified):
 *   Item1to1.ts
 *   component/Component1to1.ts
 *   component/Card1to1.ts
 *   component/Die1to1.ts
 *   component/tile/Path1to1.ts
 *   component/tile/Domino1to1.ts
 *   component/tile/Tile1to1.ts
 *   container/other/Hand1to1.ts
 *   container/other/Dice1to1.ts
 *   container/other/Deck1to1.ts
 *   other/Dominoes1to1.ts
 *   other/Hints1to1.ts
 *   other/Map1to1.ts
 *   other/Regions1to1.ts
 */

export * from "./Item1to1.js";
export * from "./component/Component1to1.js";
export * from "./component/Card1to1.js";
export * from "./component/Die1to1.js";
export * from "./component/tile/Path1to1.js";
export * from "./component/tile/Domino1to1.js";
export * from "./component/tile/Tile1to1.js";
export * from "./container/other/Hand1to1.js";
export * from "./container/other/Dice1to1.js";
export * from "./container/other/Deck1to1.js";
export * from "./other/Dominoes1to1.js";
export * from "./other/Hints1to1.js";
export * from "./other/Map1to1.js";
export * from "./other/Regions1to1.js";
