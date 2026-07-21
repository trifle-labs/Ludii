// @java ViewController/src/util/ShadedCells.java

import {
  Graphics2D,
  Color,
  GeneralPath,
  Point2D,
  SEG_CLOSE,
  SEG_CUBICTO,
  SEG_LINETO,
  SEG_MOVETO,
  SEG_QUADTO,
} from '../../../awt/index.js';
import type { Cell } from '../../../../ludemes/other/topology/Cell.js';
import type { Topology } from '../../../../ludemes/other/topology/Topology.js';

/** MAX_CELL_COLOURS = 6 (Java: main.Constants.MAX_CELL_COLOURS) */
const MAX_CELL_COLOURS = 6;

/**
 * Code for determining cell colours for "sunken" effect.
 *
 * @author cambolbro
 * @java util.ShadedCells
 */
export class ShadedCells {

  /**
   * Draw a shaded (sunken) cell using dark-fill / highlight-slice / inner-fill technique.
   *
   * @java util.ShadedCells#drawShadedCell
   */
  static drawShadedCell(
    g2d: Graphics2D,
    cell: Cell,
    path: GeneralPath,
    colours: Color[][],
    checkeredBoard: boolean,
    topology: Topology,
  ): void {
    const phase = !checkeredBoard
      ? 0
      : topology.phaseByElementIndex('Cell', cell.index());

    const centre = ShadedCells.pathCentre(path);

    const coords: number[] = [0, 0, 0, 0, 0, 0];

    // Fill full cell dark
    g2d.setColor(colours[phase]![0]!);
    g2d.fill(path);

    // Fill light half of cell
    const highlights = ShadedCells.determineHighlightedSides(path);

    const pathLight = new GeneralPath();
    let currX = 0;
    let currY = 0;
    let side = 0;

    const pi = path.getPathIterator(null);
    while (!pi.isDone()) {
      switch (pi.currentSegment(coords)) {
        case SEG_CLOSE:
          pathLight.closePath();
          break;
        case SEG_CUBICTO:
          if (highlights.has(side)) {
            pathLight.moveTo(centre.getX(), centre.getY());
            pathLight.lineTo(currX, currY);
            pathLight.curveTo(
              coords[0]!, coords[1]!,
              coords[2]!, coords[3]!,
              coords[4]!, coords[5]!,
            );
            pathLight.closePath();
          }
          currX = coords[4]!;
          currY = coords[5]!;
          break;
        case SEG_LINETO:
          if (highlights.has(side)) {
            pathLight.moveTo(centre.getX(), centre.getY());
            pathLight.lineTo(currX, currY);
            pathLight.lineTo(coords[0]!, coords[1]!);
            pathLight.closePath();
          }
          currX = coords[0]!;
          currY = coords[1]!;
          break;
        case SEG_MOVETO:
          currX = coords[0]!;
          currY = coords[1]!;
          break;
        case SEG_QUADTO:
          if (highlights.has(side)) {
            pathLight.moveTo(centre.getX(), centre.getY());
            pathLight.lineTo(currX, currY);
            pathLight.quadTo(coords[0]!, coords[1]!, coords[2]!, coords[3]!);
            pathLight.closePath();
          }
          currX = coords[2]!;
          currY = coords[3]!;
          break;
      }
      side++;
      pi.next();
    }

    g2d.setColor(colours[phase]![2]!);
    g2d.fill(pathLight);

    // Fill shrunken cell offset in base colour
    const pathInner = new GeneralPath();
    const amount = 1;

    const pi2 = path.getPathIterator(null);
    while (!pi2.isDone()) {
      switch (pi2.currentSegment(coords)) {
        case SEG_CLOSE:
          pathInner.closePath();
          break;
        case SEG_CUBICTO: {
          const distA = ShadedCells.distance(centre.getX(), centre.getY(), coords[0]!, coords[1]!);
          const distB = ShadedCells.distance(centre.getX(), centre.getY(), coords[2]!, coords[3]!);
          const distC = ShadedCells.distance(centre.getX(), centre.getY(), coords[4]!, coords[5]!);
          const offA = (distA - amount) / distA;
          const offB = (distB - amount) / distB;
          const offC = (distC - amount) / distC;
          coords[0] = centre.getX() + offA * (coords[0]! - centre.getX());
          coords[1] = centre.getY() + offA * (coords[1]! - centre.getY());
          coords[2] = centre.getX() + offB * (coords[2]! - centre.getX());
          coords[3] = centre.getY() + offB * (coords[3]! - centre.getY());
          coords[4] = centre.getX() + offC * (coords[4]! - centre.getX());
          coords[5] = centre.getY() + offC * (coords[5]! - centre.getY());
          pathInner.curveTo(coords[0], coords[1], coords[2], coords[3], coords[4], coords[5]);
          break;
        }
        case SEG_LINETO: {
          const dist = ShadedCells.distance(centre.getX(), centre.getY(), coords[0]!, coords[1]!);
          const off = (dist - amount) / dist;
          coords[0] = centre.getX() + off * (coords[0]! - centre.getX());
          coords[1] = centre.getY() + off * (coords[1]! - centre.getY());
          pathInner.lineTo(coords[0], coords[1]);
          break;
        }
        case SEG_MOVETO: {
          const dist = ShadedCells.distance(centre.getX(), centre.getY(), coords[0]!, coords[1]!);
          const off = (dist - amount) / dist;
          coords[0] = centre.getX() + off * (coords[0]! - centre.getX());
          coords[1] = centre.getY() + off * (coords[1]! - centre.getY());
          pathInner.moveTo(coords[0], coords[1]);
          break;
        }
        case SEG_QUADTO: {
          const distA = ShadedCells.distance(centre.getX(), centre.getY(), coords[0]!, coords[1]!);
          const distB = ShadedCells.distance(centre.getX(), centre.getY(), coords[2]!, coords[3]!);
          const offA = (distA - amount) / distA;
          const offB = (distB - amount) / distB;
          coords[0] = centre.getX() + offA * (coords[0]! - centre.getX());
          coords[1] = centre.getY() + offA * (coords[1]! - centre.getY());
          // Note: Java has a bug here — it writes to coords[3]/coords[4] but calls quadTo with
          // coords[0..3]. We faithfully reproduce: indices [2],[3] are the endpoint.
          coords[3] = centre.getX() + offB * (coords[3]! - centre.getX());
          coords[4] = centre.getY() + offB * (coords[4]! - centre.getY());
          pathInner.quadTo(coords[0], coords[1], coords[2]!, coords[3]);
          break;
        }
      }
      pi2.next();
    }

    g2d.setColor(colours[phase]![1]!);
    g2d.fill(pathInner);
  }

  // -------------------------------------------------------------------------

  /**
   * @return Bit set indicating which sides of the path should be highlighted.
   * @java util.ShadedCells#determineHighlightedSides
   */
  private static determineHighlightedSides(path: GeneralPath): Set<number> {
    const centre = ShadedCells.pathCentre(path);

    const coords: number[] = [0, 0, 0, 0, 0, 0];
    const highlights = new Set<number>();

    let side = 0;
    let currX = 0;
    let currY = 0;

    const pi = path.getPathIterator(null);
    while (!pi.isDone()) {
      switch (pi.currentSegment(coords)) {
        case SEG_CLOSE:
          break;
        case SEG_CUBICTO: {
          const mx = (currX + coords[4]!) / 2.0;
          const my = (currY + coords[5]!) / 2.0;
          const vec = ShadedCells.normalisedVector(centre.getX(), centre.getY(), mx, my);
          const theta = Math.atan2(vec.getY(), vec.getX());
          if (theta > 0.1 * Math.PI || theta < -0.9 * Math.PI)
            highlights.add(side);
          currX = coords[4]!;
          currY = coords[5]!;
          break;
        }
        case SEG_LINETO: {
          const mx = (currX + coords[0]!) / 2.0;
          const my = (currY + coords[1]!) / 2.0;
          const vec = ShadedCells.normalisedVector(centre.getX(), centre.getY(), mx, my);
          const theta = Math.atan2(vec.getY(), vec.getX());
          if (theta > 0.9 * Math.PI || theta < -0.1 * Math.PI)
            highlights.add(side);
          currX = coords[0]!;
          currY = coords[1]!;
          break;
        }
        case SEG_MOVETO:
          currX = coords[0]!;
          currY = coords[1]!;
          break;
        case SEG_QUADTO: {
          const mx = (currX + coords[2]!) / 2.0;
          const my = (currY + coords[3]!) / 2.0;
          const vec = ShadedCells.normalisedVector(centre.getX(), centre.getY(), mx, my);
          const theta = Math.atan2(vec.getY(), vec.getX());
          if (theta > 0.1 * Math.PI || theta < -0.9 * Math.PI)
            highlights.add(side);
          currX = coords[2]!;
          currY = coords[3]!;
          break;
        }
      }
      side++;
      pi.next();
    }

    return highlights;
  }

  // -------------------------------------------------------------------------

  /**
   * @return Approximately central point within path (if convex).
   * @java util.ShadedCells#pathCentre
   */
  private static pathCentre(path: GeneralPath): Point2D {
    const bounds = path.getBounds2D();
    return new Point2D.Double(bounds.getCenterX(), bounds.getCenterY());
  }

  // -------------------------------------------------------------------------

  /**
   * Set the graphics colour according to the phase (colouring) of a cell element.
   *
   * @java util.ShadedCells#setCellColourByPhase
   */
  static setCellColourByPhase(
    g2d: Graphics2D,
    index: number,
    topology: Topology,
    colorFillPhase0: Color,
    colorFillPhase1: Color,
    colorFillPhase2: Color,
    colorFillPhase3: Color,
    colorFillPhase4: Color,
    colorFillPhase5: Color,
  ): void {
    switch (topology.phaseByElementIndex('Cell', index)) {
      case 0: g2d.setColor(colorFillPhase0); break;
      case 1: g2d.setColor(colorFillPhase1); break;
      case 2: g2d.setColor(colorFillPhase2); break;
      case 3: g2d.setColor(colorFillPhase3); break;
      case 4: g2d.setColor(colorFillPhase4); break;
      case 5: g2d.setColor(colorFillPhase5); break;
      default:
        console.error('** Error: Bad phase for cell ' + index + '.');
    }
  }

  // -------------------------------------------------------------------------

  /**
   * Build a [MAX_CELL_COLOURS][3] colour table for the shaded-cell renderer:
   *   [c][0] = low (darkened),  [c][1] = fill (base),  [c][2] = high (lightened).
   *
   * @java util.ShadedCells#shadedPhaseColours
   */
  static shadedPhaseColours(
    colorFillPhase0: Color | null,
    colorFillPhase1: Color | null,
    colorFillPhase2: Color | null,
    colorFillPhase3: Color | null,
    colorFillPhase4: Color | null,
    colorFillPhase5: Color | null,
  ): Color[][] {
    // [c][0] = low, [c][1] = fill, [c][2] = high
    const colours: Array<[Color | null, Color | null, Color | null]> = [];
    for (let i = 0; i < MAX_CELL_COLOURS; i++) {
      colours.push([null, null, null]);
    }

    colours[0]![1] = colorFillPhase0;
    colours[1]![1] = colorFillPhase1;
    colours[2]![1] = colorFillPhase2;
    colours[3]![1] = colorFillPhase3;
    colours[4]![1] = colorFillPhase4;
    colours[5]![1] = colorFillPhase5;

    // Check that all phases have a base colour
    for (let c = 0; c < MAX_CELL_COLOURS; c++) {
      if (colours[c]![1] !== null) continue;  // everything's fine

      if (c === 0) {
        // Set default light colour for phase 0
        // Java: new Color(250, 221, 144, colours[0][1].getAlpha())
        // Since colours[0][1] is null here, fall back to alpha=255
        colours[0]![1] = new Color(250, 221, 144, 255);
        continue;
      }

      // Successively darken from previous phase
      const prev = colours[c - 1]![1]!;
      const r = prev.getRed();
      const g = prev.getGreen();
      const b = prev.getBlue();
      const a = prev.getAlpha();

      const darken = 0.8;
      colours[c]![1] = new Color(
        Math.trunc(darken * r),
        Math.trunc(darken * g),
        Math.trunc(darken * b),
        a,
      );
    }

    for (let c = 0; c < MAX_CELL_COLOURS; c++) {
      const base = colours[c]![1]!;
      const r = base.getRed();
      const g = base.getGreen();
      const b = base.getBlue();
      const a = base.getAlpha();

      // Calculate lowlight colour from base colour
      const darken = 0.75;
      colours[c]![0] = new Color(
        Math.trunc(darken * r),
        Math.trunc(darken * g),
        Math.trunc(darken * b),
        a,
      );

      // Calculate highlight colour from base colour
      colours[c]![2] = new Color(
        Math.min(255, 32 + Math.trunc(Math.sqrt(r / 255.0) * 255.0)),
        Math.min(255, 32 + Math.trunc(Math.sqrt(g / 255.0) * 255.0)),
        Math.min(255, 32 + Math.trunc(Math.sqrt(b / 255.0) * 255.0)),
        a,
      );
    }

    return colours as Color[][];
  }

  // -------------------------------------------------------------------------
  // Internal math helpers (inlined from main.math.MathRoutines)
  // -------------------------------------------------------------------------

  /**
   * Euclidean distance between two 2D points.
   * @java main.math.MathRoutines#distance(double,double,double,double)
   */
  private static distance(ax: number, ay: number, bx: number, by: number): number {
    const dx = bx - ax;
    const dy = by - ay;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Return a unit vector from (x0,y0) toward (x1,y1).
   * @java main.math.MathRoutines#normalisedVector(double,double,double,double)
   */
  private static normalisedVector(x0: number, y0: number, x1: number, y1: number): Point2D {
    const dx = x1 - x0;
    const dy = y1 - y0;
    let len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) len = 1;
    return new Point2D.Double(dx / len, dy / len);
  }

  // -------------------------------------------------------------------------

}
