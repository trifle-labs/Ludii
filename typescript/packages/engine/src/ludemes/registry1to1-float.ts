/**
 * registry1to1-float.ts — barrel: imports all 1:1 float ludeme classes so they
 * self-register at load. Each ported package adds its sub-barrel/class imports here.
 */

// floats root
import "./game/functions/floats1to1/FloatConstant1to1.js";
import "./game/functions/floats1to1/ToFloat1to1.js";

// floats/math
import "./game/functions/floats1to1/math/FloatMath1to1.js";

export {};
