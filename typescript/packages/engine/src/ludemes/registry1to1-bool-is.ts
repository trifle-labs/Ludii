/**
 * registry1to1-bool-is.ts
 *
 * Barrel that imports all 1:1 boolean `(is ...)` ludeme class files
 * so they self-register via registerBool1to1() side effects at module load time.
 *
 * Import this from compiler1to1.ts (or registry1to1-boolean.ts) to wire the registry.
 *
 * Keys added by this barrel (NOT in the exclusion list):
 *   is:cycle, is:triggered, is:repeat, is:anydie,
 *   is:lastfrom, is:lastto,
 *   is:hidden, is:hiddencount, is:hiddenrotation, is:hiddenstate,
 *   is:hiddenvalue, is:hiddenwhat, is:hiddenwho,
 *   is:target
 */
import "./game/functions/booleans/is/is1to1/IsCycle1to1.js";
import "./game/functions/booleans/is/is1to1/IsTriggered1to1.js";
import "./game/functions/booleans/is/is1to1/IsRepeat1to1.js";
import "./game/functions/booleans/is/is1to1/IsAnyDie1to1.js";
import "./game/functions/booleans/is/is1to1/IsLastFrom1to1.js";
import "./game/functions/booleans/is/is1to1/IsLastTo1to1.js";
import "./game/functions/booleans/is/is1to1/IsHidden1to1.js";
import "./game/functions/booleans/is/is1to1/IsTarget1to1.js";
export {};
