/**
 * Barrel file for Graph function ludeme classes — Wave 2 slice.
 *
 * Imports the ported class files so they are compiled as part of the engine
 * package. These are coverage transliterations and are NOT yet wired into the
 * compiler1to1 registry; they exist to prove 1:1 fidelity to the Java sources.
 *
 * Slice covers:
 *   - generators/shape/**  (concentric, spiral, regular, wedge, repeat, rectangle)
 *   - operators/**         (all 21 operators)
 *   - Root GraphFunction / BaseGraphFunction (already ported in-place)
 */

// ── shape type enums ─────────────────────────────────────────────────────────
import "./game/functions/graph/generators/shape/ShapeStarType.js";
import "./game/functions/graph/generators/shape/concentric/ConcentricShapeType.js";

// ── concentric shape generators ───────────────────────────────────────────────
import "./game/functions/graph/generators/shape/concentric/ConcentricTarget.js";
import "./game/functions/graph/generators/shape/concentric/ConcentricRegular.js";
import "./game/functions/graph/generators/shape/concentric/ConcentricCircle.js";
import "./game/functions/graph/generators/shape/concentric/Concentric.js";

// ── other shape generators ────────────────────────────────────────────────────
import "./game/functions/graph/generators/shape/Regular.js";
import "./game/functions/graph/generators/shape/Wedge.js";
import "./game/functions/graph/generators/shape/Spiral.js";
import "./game/functions/graph/generators/shape/Repeat.js";
import "./game/functions/graph/generators/shape/Rectangle.js";

// ── graph operators ───────────────────────────────────────────────────────────
import "./game/functions/graph/operators/Merge.js";
import "./game/functions/graph/operators/Union.js";
import "./game/functions/graph/operators/Intersect.js";
import "./game/functions/graph/operators/Dual.js";
import "./game/functions/graph/operators/Rotate.js";
import "./game/functions/graph/operators/Scale.js";
import "./game/functions/graph/operators/Shift.js";
import "./game/functions/graph/operators/Skew.js";
import "./game/functions/graph/operators/Trim.js";
import "./game/functions/graph/operators/Renumber.js";
import "./game/functions/graph/operators/MakeFaces.js";
import "./game/functions/graph/operators/Subdivide.js";
import "./game/functions/graph/operators/SplitCrossings.js";
import "./game/functions/graph/operators/Complete.js";
import "./game/functions/graph/operators/Add.js";
import "./game/functions/graph/operators/Remove.js";
import "./game/functions/graph/operators/Hole.js";
import "./game/functions/graph/operators/Keep.js";
import "./game/functions/graph/operators/Clip.js";
import "./game/functions/graph/operators/Layers.js";
import "./game/functions/graph/operators/Recoordinate.js";

export {};
