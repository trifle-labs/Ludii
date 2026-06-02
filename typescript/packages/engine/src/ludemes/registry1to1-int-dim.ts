/**
 * registry1to1-int-dim.ts
 *
 * Barrel for the 1:1 dim/range/trackStep port classes.
 *
 * NOTE: All dim/math keys ("abs", "+", "-", "*", "/", "max", "min", "pow", "^",
 * "add", "sub", "mul", "div") are already registered by
 * ints1to1/math/Math1to1.ts and ints1to1/math/PowCaret1to1.ts.
 * The dim classes are therefore NOT registered here (would clobber existing
 * working classes — HARD RULE 3 of the port spec).
 *
 * range/* and trackStep/* classes are also NOT registered per spec (no Range
 * or TrackStep registry kind exists yet).
 *
 * This file imports the class files purely so TypeScript includes them in the
 * compilation output; no self-registration side-effects occur.
 */

// dim classes (faithful ports, not registered — all keys already taken)
import "./game/functions/dim/DimConstant1to1.js";
import "./game/functions/dim/math/Abs1to1.js";
import "./game/functions/dim/math/Add1to1.js";
import "./game/functions/dim/math/Div1to1.js";
import "./game/functions/dim/math/Max1to1.js";
import "./game/functions/dim/math/Min1to1.js";
import "./game/functions/dim/math/Mul1to1.js";
import "./game/functions/dim/math/Pow1to1.js";
import "./game/functions/dim/math/Sub1to1.js";

// range classes (faithful ports, not registered — no Range registry kind)
import "./game/functions/range/Range1to1.js";
import "./game/functions/range/math/Exact1to1.js";
import "./game/functions/range/math/RangeMax1to1.js";
import "./game/functions/range/math/RangeMin1to1.js";

// trackStep classes (faithful ports, not registered — no TrackStep registry kind)
import "./game/functions/trackStep/TrackStep1to1.js";

export {};
