/**
 * registry1to1-directions.ts — barrel: imports all 1:1 directions ludeme classes so they
 * self-register at load. Each ported package adds its sub-barrel/class imports here.
 */

import "./game/functions/directions/Directions1to1.js";
import "./game/functions/directions/Union1to1.js";
import "./game/functions/directions/Difference1to1.js";
import "./game/functions/directions/If1to1.js";

export {};
