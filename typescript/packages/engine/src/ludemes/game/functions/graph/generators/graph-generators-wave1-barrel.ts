/**
 * graph-generators-wave1-barrel.ts
 * Wave-1 barrel: first half of graph generator ludemes — faithful 1:1 ports
 * of Java generators/basis/** and generators/shape/**.
 * These classes build board topology (return a Graph). They are NOT registered
 * in the Int/Bool/Region 1:1 registry — they are standalone GraphFunction classes.
 */

// ── basis ──────────────────────────────────────────────────────────────────

// BaseGraphFunction + GraphFunction interfaces
export {} from "../GraphFunction.js";
export {} from "../BaseGraphFunction.js";
export {} from "./basis/Basis.js";

// square basis
export {} from "./basis/square/DiagonalsType.js";
export {} from "./basis/square/SquareShapeType.js";
export {} from "./basis/square/RectangleOnSquare.js";
export {} from "./basis/square/DiamondOnSquare.js";
export {} from "./basis/square/CustomOnSquare.js";
export {} from "./basis/square/Square.js";

// hex basis
export {} from "./basis/hex/HexShapeType.js";
export {} from "./basis/hex/HexagonOnHex.js";
export {} from "./basis/hex/RectangleOnHex.js";
export {} from "./basis/hex/DiamondOnHex.js";
export {} from "./basis/hex/TriangleOnHex.js";
export {} from "./basis/hex/StarOnHex.js";
export {} from "./basis/hex/CustomOnHex.js";
export {} from "./basis/hex/Hex.js";

// tri basis
export {} from "./basis/tri/TriShapeType.js";
export {} from "./basis/tri/TriangleOnTri.js";
export {} from "./basis/tri/HexagonOnTri.js";
export {} from "./basis/tri/RectangleOnTri.js";
export {} from "./basis/tri/DiamondOnTri.js";
export {} from "./basis/tri/StarOnTri.js";
export {} from "./basis/tri/CustomOnTri.js";
export {} from "./basis/tri/Tri.js";

// brick basis
export {} from "./basis/brick/BrickShapeType.js";
export {} from "./basis/brick/SquareOrRectangleOnBrick.js";
export {} from "./basis/brick/DiamondOrPrismOnBrick.js";
export {} from "./basis/brick/SpiralOnBrick.js";
export {} from "./basis/brick/Brick.js";

// celtic basis
export {} from "./basis/celtic/Celtic.js";

// mesh basis
export {} from "./basis/mesh/Mesh.js";
export {} from "./basis/mesh/CustomOnMesh.js";

// quadhex basis
export {} from "./basis/quadhex/Quadhex.js";

// tiling basis
export {} from "./basis/tiling/TilingType.js";
export {} from "./basis/tiling/Tiling.js";
export {} from "./basis/tiling/tiling3636/Tiling3636.js";
export {} from "./basis/tiling/tiling3636/CustomOn3636.js";
export {} from "./basis/tiling/tiling33344/Tiling33344.js";
export {} from "./basis/tiling/tiling33344/CustomOn33344.js";
export {} from "./basis/tiling/tiling3464/Tiling3464ShapeType.js";
export {} from "./basis/tiling/tiling3464/Tiling3464.js";
export {} from "./basis/tiling/tiling3464/HexagonOn3464.js";
export {} from "./basis/tiling/tiling3464/ParallelogramOn3464.js";
export {} from "./basis/tiling/tiling3464/RectangleOn3464.js";
export {} from "./basis/tiling/tiling3464/DiamondOn3464.js";
export {} from "./basis/tiling/tiling3464/TriangleOn3464.js";
export {} from "./basis/tiling/tiling3464/StarOn3464.js";
export {} from "./basis/tiling/tiling3464/CustomOn3464.js";
export {} from "./basis/tiling/tiling488/Tiling488.js";
export {} from "./basis/tiling/tiling488/SquareOrRectangleOn488.js";
export {} from "./basis/tiling/tiling488/CustomOn488.js";
export {} from "./basis/tiling/tiling31212/Tiling31212.js";
export {} from "./basis/tiling/tiling33336/Tiling33336.js";
export {} from "./basis/tiling/tiling33434/Tiling33434.js";
export {} from "./basis/tiling/tiling4612/Tiling4612.js";
export {} from "./basis/tiling/tiling333333_33434/Tiling333333_33434.js";

// ── shape ─────────────────────────────────────────────────────────────────

export {} from "./shape/concentric/ConcentricShapeType.js";
export {} from "./shape/concentric/ConcentricCircle.js";
export {} from "./shape/concentric/ConcentricRegular.js";
export {} from "./shape/concentric/ConcentricTarget.js";
export {} from "./shape/concentric/Concentric.js";
export {} from "./shape/Rectangle.js";
export {} from "./shape/ShapeStarType.js";
export {} from "./shape/Regular.js";
export {} from "./shape/Repeat.js";
export {} from "./shape/Spiral.js";
export {} from "./shape/Wedge.js";
