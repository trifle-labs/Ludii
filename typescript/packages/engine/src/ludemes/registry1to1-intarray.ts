/**
 * registry1to1-intarray.ts — barrel: imports all 1:1 intarray ludeme classes so they
 * self-register at load. Each ported package adds its sub-barrel/class imports here.
 */

// array
import "./game/functions/intArray/array/Array1to1.js";

// math
import "./game/functions/intArray/math/If1to1.js";
import "./game/functions/intArray/math/Difference1to1.js";
import "./game/functions/intArray/math/Union1to1.js";
import "./game/functions/intArray/math/Intersection1to1.js";
import "./game/functions/intArray/math/Results1to1.js";

// values
import "./game/functions/intArray/values/Values1to1.js";

// players
import "./game/functions/intArray/players/Players1to1.js";

// sizes
import "./game/functions/intArray/sizes/SizesGroup1to1.js";

export {};
