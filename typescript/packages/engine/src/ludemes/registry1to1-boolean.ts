/**
 * registry1to1-boolean.ts
 *
 * Barrel that imports all 1:1 boolean ludeme class files so they
 * self-register via registerBool1to1() side effects at module load time.
 *
 * Import this from compiler1to1.ts (already done) to wire the registry.
 * Add new boolean class files here as they are ported.
 */

// math booleans
import "./game/functions/booleans/math1to1/And1to1.js";
import "./game/functions/booleans/math1to1/Or1to1.js";
import "./game/functions/booleans/math1to1/Not1to1.js";
import "./game/functions/booleans/math1to1/Xor1to1.js";
import "./game/functions/booleans/math1to1/Equals1to1.js";
import "./game/functions/booleans/math1to1/NotEqual1to1.js";
import "./game/functions/booleans/math1to1/Lt1to1.js";
import "./game/functions/booleans/math1to1/Gt1to1.js";
import "./game/functions/booleans/math1to1/Le1to1.js";
import "./game/functions/booleans/math1to1/Ge1to1.js";
// Note: (if ...) in boolean context is handled by the inline branch in compiler1to1.ts
// to support fallback to bare-condition form; do not register here.
// import "./game/functions/booleans/math1to1/IfBool1to1.js";

// is: site
import "./game/functions/booleans/is/site1to1/IsEmpty1to1.js";
import "./game/functions/booleans/is/site1to1/IsOccupied1to1.js";

// is: player
import "./game/functions/booleans/is/player1to1/IsMover1to1.js";
import "./game/functions/booleans/is/player1to1/IsNext1to1.js";
import "./game/functions/booleans/is/player1to1/IsPrev1to1.js";
import "./game/functions/booleans/is/player1to1/IsFriend1to1.js";
import "./game/functions/booleans/is/player1to1/IsEnemy1to1.js";
import "./game/functions/booleans/is/player1to1/IsActive1to1.js";

// is: integer
import "./game/functions/booleans/is/integer1to1/IsEven1to1.js";
import "./game/functions/booleans/is/integer1to1/IsOdd1to1.js";
import "./game/functions/booleans/is/integer1to1/IsVisited1to1.js";
import "./game/functions/booleans/is/integer1to1/IsFlat1to1.js";

// is: simple
import "./game/functions/booleans/is/simple1to1/IsFull1to1.js";
import "./game/functions/booleans/is/simple1to1/IsPending1to1.js";
import "./game/functions/booleans/is/simple1to1/IsBlocked1to1.js";

// is: in
import "./game/functions/booleans/is/in1to1/IsIn1to1.js";

// is: component
import "./game/functions/booleans/is/component/IsWithin.js";

// is: line (already a class — register it)
import "./game/functions/booleans/is/line1to1/IsLine1to1.js";

// all
import "./game/functions/booleans/all1to1/AllSites1to1.js";
import "./game/functions/booleans/all1to1/AllPassed1to1.js";
import "./game/functions/booleans/all1to1/AllDiceEqual1to1.js";
import "./game/functions/booleans/all1to1/AllDiceUsed1to1.js";

// no
import "./game/functions/booleans/no1to1/NoMoves1to1.js";
import "./game/functions/booleans/no1to1/NoPieces1to1.js";

// can
import "./game/functions/booleans/can1to1/CanMove1to1.js";

// was
import "./game/functions/booleans/was1to1/Was1to1.js";

// ---- Wave-1 parallel-port sub-barrels (gap-fill classes) ----
import "./registry1to1-bool-is.js";
import "./registry1to1-bool-rest.js";

// ---- Wave-2 deferred predicates (topology API now available) ----
import "./registry1to1-bool-deferred.js";
