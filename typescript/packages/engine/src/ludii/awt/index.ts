// Barrel export for the java.awt / java.awt.geom / JFreeSVG shim
// @java java.awt, java.awt.geom, org.jfree.graphics2d.svg

// ---- java.awt.geom ----
export { Point2D } from './geom/Point2D.js';
export { Rectangle2D } from './geom/Rectangle2D.js';
export { AffineTransform } from './geom/AffineTransform.js';
export {
  PathIterator,
  SEG_MOVETO, SEG_LINETO, SEG_QUADTO, SEG_CUBICTO, SEG_CLOSE,
  WIND_EVEN_ODD, WIND_NON_ZERO,
} from './geom/PathIterator.js';
export type { Shape } from './geom/Shape.js';
export { GeneralPath, Path2D } from './geom/GeneralPath.js';
export { Ellipse2D } from './geom/Ellipse2D.js';
export { Line2D } from './geom/Line2D.js';
export { Arc2D } from './geom/Arc2D.js';
export { RoundRectangle2D } from './geom/RoundRectangle2D.js';

// ---- java.awt ----
export { Color } from './Color.js';
export { Font, FontMetrics, FontRenderContext, PLAIN, BOLD, ITALIC } from './Font.js';
export { BasicStroke, CAP_BUTT, CAP_ROUND, CAP_SQUARE, JOIN_MITER, JOIN_ROUND, JOIN_BEVEL } from './Stroke.js';
export type { Stroke } from './Stroke.js';
export { RenderingHints } from './RenderingHints.js';
export { Point, Rectangle, Polygon } from './Point.js';
export { Graphics2D } from './Graphics2D.js';

// ---- JFreeChart SVGGraphics2D ----
export { SVGGraphics2D } from './SVGGraphics2D.js';
