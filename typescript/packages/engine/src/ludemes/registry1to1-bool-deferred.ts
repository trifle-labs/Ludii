/**
 * registry1to1-bool-deferred.ts
 *
 * Barrel that imports all 1:1 boolean ludeme class files from the
 * "previously-deferred" wave so they self-register via registerBool1to1()
 * side effects at module load time.
 *
 * Keys registered by this barrel:
 *   is:tree, is:spanningtree, is:caterpillartree, is:treecentre, is:treecenter
 *   is:regulargraph
 *   is:loop
 *   is:path
 *   is:pattern
 *   is:acute, is:obtuse, is:reflex, is:right
 *   is:freedom
 *   is:pyramidcorners
 *
 * Import this from registry1to1-boolean.ts to wire the registry.
 */

// tree family (graph theory on Edge-play boards)
import "./game/functions/booleans/is/tree1to1/IsTree1to1.js";
import "./game/functions/booleans/is/tree1to1/IsSpanningTree1to1.js";
import "./game/functions/booleans/is/tree1to1/IsTreeCentre1to1.js";
import "./game/functions/booleans/is/tree1to1/IsCaterpillarTree1to1.js";

// regular graph
import "./game/functions/booleans/is/regularGraph1to1/IsRegularGraph1to1.js";

// loop detection (connection games)
import "./game/functions/booleans/is/loop1to1/IsLoop1to1.js";

// path detection (graph/GT games)
import "./game/functions/booleans/is/path1to1/IsPath1to1.js";

// pattern walk
import "./game/functions/booleans/is/pattern1to1/IsPattern1to1.js";

// angle predicates (use Trajectories.xOf/yOf)
import "./game/functions/booleans/is/angle1to1/IsAngle1to1.js";

// freedom check (Go-like liberty detection)
import "./game/functions/booleans/is/component1to1/IsFreedom1to1.js";

// pyramid corners (Shibumi 3D boards)
import "./game/functions/booleans/is/pyramidCorners1to1/IsPyramidCorners1to1.js";

export {};
