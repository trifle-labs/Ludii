/**
 * registry1to1-int-msil.ts
 *
 * Barrel for the MSIL slice of 1:1 Int ludeme ports:
 *   math/** (11 Java files), size/** (12), iterator/** (11), last/** (7)
 *
 * Only NEW keys (not in the exclusion list) are imported here.
 * Everything else from these packages is already handled by:
 *   - Math1to1.ts   (+, -, *, /, %, abs, add, sub, mul, div, mod, pow, max, min, if)
 *   - Size1to1.ts   (size — handles group/stack/array subtypes)
 *   - Iterator1to1.ts (from, to, site, between, level, pips, track, edge, hint)
 *   - Board1to1.ts  (last, mover, next, player, row, column, ahead, coord, where, mapentry, id, ...)
 *   - compiler1to1.ts inline (many remaining keys)
 *
 * Deferred (absent Context API):
 *   size:territory  — needs full topology BFS on empty-region (size:<x> excluded per spec)
 *   size:largepiece — needs Component.isLargePiece() absent in TS engine
 *   last:levelfrom  — excluded per spec (last:<x>)
 *   last:levelto    — excluded per spec (last:<x>)
 *   iterator/Track  — track already registered in Iterator1to1.ts
 *   iterator/Edge   — edge already registered in Iterator1to1.ts
 *   iterator/Hint   — hint already registered in Iterator1to1.ts
 *   iterator/Player — player already registered in Board1to1.ts / compiler1to1.ts
 */

// math: Pow ^ alias (the only genuinely new key from these 4 packages)
import "./game/functions/ints1to1/math/PowCaret1to1.js";

export {};
