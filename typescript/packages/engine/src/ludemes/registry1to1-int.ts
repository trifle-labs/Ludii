/**
 * registry1to1-int.ts
 *
 * Barrel that imports all 1:1 integer ludeme class files so they
 * self-register via registerInt1to1() side effects at module load time.
 *
 * Import this from compiler1to1.ts (alongside registry1to1-boolean.ts)
 * to wire the int registry.
 *
 * Add new int class files here as they are ported.
 */

// count
import "./game/functions/ints1to1/count/CountMoves1to1.js";
import "./game/functions/ints1to1/count/CountSimple1to1.js";
import "./game/functions/ints1to1/count/CountPieces1to1.js";
import "./game/functions/ints1to1/count/CountSites1to1.js";
import "./game/functions/ints1to1/count/CountSiteNeighbours1to1.js";
import "./game/functions/ints1to1/count/CountStack1to1.js";

// math
import "./game/functions/ints1to1/math/Math1to1.js";

// state
import "./game/functions/ints1to1/state/State1to1.js";

// board
import "./game/functions/ints1to1/board/Board1to1.js";

// iterator
import "./game/functions/ints1to1/iterator/Iterator1to1.js";

// size
import "./game/functions/ints1to1/size/Size1to1.js";

// value
import "./game/functions/ints1to1/value/Value1to1.js";

// miscellaneous (HandSite, RegionSite, TrackSite, TopLevel, stubs, etc.)
import "./game/functions/ints1to1/misc/Misc1to1.js";

// ---- Wave-1 parallel-port sub-barrels (gap-fill classes) ----
import "./registry1to1-int-count.js";
import "./registry1to1-int-bvs.js";
import "./registry1to1-int-msil.js";
import "./registry1to1-int-cardrest.js";
import "./registry1to1-int-deferred.js";
