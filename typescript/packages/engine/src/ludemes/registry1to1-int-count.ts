/**
 * registry1to1-int-count.ts
 *
 * Barrel for the count/** IntFunction 1:1 port slice.
 * Import this file to self-register all count:<subtype> keys that were
 * NOT in the original exclusion list.
 *
 * Keys registered by this barrel:
 *   count:groups        — CountGroups1to1
 *   count:liberties     — CountLiberties1to1
 *   count:steps         — CountSteps1to1
 *   count:cells         — CountCells1to1
 *   count:phases        — CountPhases1to1
 *   count:number        — CountNumber1to1
 *   count:sizebiggestgroup — CountSizeBiggestGroup1to1
 *   count:sizebiggestline  — CountSizeBiggestLine1to1
 */

import "./game/functions/ints1to1/count/CountGroups1to1.js";
import "./game/functions/ints1to1/count/CountLiberties1to1.js";
import "./game/functions/ints1to1/count/CountSteps1to1.js";
import "./game/functions/ints1to1/count/CountSimpleExtra1to1.js";
import "./game/functions/ints1to1/count/CountSizeBiggestGroup1to1.js";
import "./game/functions/ints1to1/count/CountSizeBiggestLine1to1.js";

export {};
