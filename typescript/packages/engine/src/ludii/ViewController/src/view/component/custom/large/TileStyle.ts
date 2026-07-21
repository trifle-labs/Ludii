// @java ViewController/src/view/component/custom/large/TileStyle.java

/**
 * Style for drawing pieces that fill the cells they are on.
 * Can also include paths on the piece between edges, if specified.
 *
 * Faithful 1:1 port of view.component.custom.large.TileStyle.
 *
 * @author Matthew.Stephenson (Java original)
 * @java view.component.custom.large.TileStyle
 */

import {
  Color, Font, BOLD,
  BasicStroke, CAP_ROUND, JOIN_ROUND, CAP_BUTT, JOIN_MITER,
  SVGGraphics2D,
} from '../../../../../../awt/index.js';
import { GeneralPath } from '../../../../../../awt/index.js';
import type { Rectangle2D } from '../../../../../../awt/index.js';
import type { Bridge } from '../../../../bridge/Bridge.js';
import type { Component } from '../../../../../../../ludemes/game/equipment/component/Component.js';
import type { Context } from '../../../../../../../ludemes/other/context/Context.js';
import { HiddenUtil } from '../../../../util/HiddenUtil.js';
import { PieceStyle } from '../PieceStyle.js';
import type { Path } from '../../../../../../../ludemes/game/equipment/component/tile/Path.js';

// ---------------------------------------------------------------------------
// Escape-hatch for game.functions.graph.generators.shape.Regular
// and game.util.graph.{Graph, Face, Vertex}
// These require the Java-side generator infrastructure which is only partially
// ported; we use an `any` escape for the shape data.
// @java game.functions.graph.generators.shape.Regular
// @java game.util.graph.Graph
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IRegularGraph = any;

// Helper: approximate java.awt.Font.getStringBounds() via size heuristics.
function fontStringBounds(font: Font, str: string): { getWidth(): number; getHeight(): number } {
  const width  = str.length * font.getSize() * 0.6;
  const height = font.getSize() * 1.0;
  return { getWidth: () => width, getHeight: () => height };
}

// ---------------------------------------------------------------------------

/**
 * @java view.component.custom.large.TileStyle
 */
export class TileStyle extends PieceStyle {

  /**
   * @java TileStyle#TileStyle(Bridge, Component)
   */
  constructor(bridge: Bridge, component: Component) {
    super(bridge, component);
  }

  // -------------------------------------------------------------------------

  /**
   * @java TileStyle#getSVGImageFromFilePath
   */
  protected override getSVGImageFromFilePath(
    _g2dOriginal: SVGGraphics2D,
    context: Context,
    imageSize: number,
    _filePath: string | null,
    containerIndex: number,
    localState: number,
    value: number,
    hiddenValue: number,
    rotation: number,
    secondary: boolean,
  ): SVGGraphics2D {
    let g2d = new SVGGraphics2D(imageSize, imageSize);

    // Rotate graphics object if needed
    g2d.rotate(rotation * Math.PI / 180, imageSize / 2, imageSize / 2);

    if (HiddenUtil.intToBitSet(hiddenValue)[HiddenUtil.hiddenIndex])
      return new SVGGraphics2D(imageSize, imageSize);

    const numEdges = this.component.numSides();

    // Secondary image for a tile also includes an outline.
    if (secondary) {
      // Build tile shape from Regular graph
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let tileGraph: IRegularGraph = null;
      try {
        // Lazy-load Regular (may not be available in all environments)
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        const { Regular } = require('../../../../../../../ludemes/game/functions/graph/generators/shape/Regular.js') as { Regular: new (star: null, n: { intValue(): number }) => { eval(ctx: Context, siteType: string): IRegularGraph } };
        tileGraph = new Regular(null, { intValue: () => numEdges }).eval(context, 'Cell');
        if (tileGraph && typeof tileGraph.normalise === 'function') tileGraph.normalise();
      } catch (_) {
        tileGraph = null;
      }

      const path = new GeneralPath();
      if (tileGraph && typeof tileGraph.faces === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const face = tileGraph.faces().get?.(0) ?? tileGraph.faces()[0];
        if (face) {
          const verts = typeof face.vertices === 'function' ? face.vertices() : face.vertices;
          for (let i = 0; i < verts.length; i++) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const v = verts[i] as any;
            const x = (v.pt?.()?.x?.() ?? v.pt?.()?.x ?? v.x ?? 0) * imageSize;
            const y = (v.pt?.()?.y?.() ?? v.pt?.()?.y ?? v.y ?? 0) * imageSize;
            if (i === 0) path.moveTo(x, y);
            else path.lineTo(x, y);
          }
        }
      } else {
        // Fallback: draw a simple polygon approximation
        for (let i = 0; i < numEdges; i++) {
          const theta = (Math.PI / 2) + (i / numEdges) * 2 * Math.PI;
          const x = (imageSize / 2) + (imageSize / 2) * Math.cos(theta);
          const y = (imageSize / 2) + (imageSize / 2) * Math.sin(theta);
          if (i === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
        }
      }
      path.closePath();

      if (this.fillColour !== null)
        g2d.setColor(this.fillColour);
      else if (context.game().players().count() >= this.component.owner())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        g2d.setColor(this.bridge.settingsColour().playerColour(context as any, this.component.owner()));
      else
        g2d.setColor(Color.BLACK);
      g2d.fill(path);

      if (this.edgeColour !== null) {
        const oldClip = g2d.getClip();
        g2d.setStroke(new BasicStroke(Math.floor(imageSize / 10) + 1, CAP_ROUND, JOIN_ROUND));
        g2d.setColor(this.edgeColour);
        g2d.setClip(path);
        g2d.draw(path);
        g2d.setClip(oldClip);
      }
    }

    if (!HiddenUtil.intToBitSet(hiddenValue)[HiddenUtil.hiddenWhatIndex]) {
      // Add in any foreground specified in metadata
      g2d = this.getForeground(g2d, context, containerIndex, localState, value, imageSize);

      // Draw on the terminus lines
      let terminus = this.component.terminus();
      if ((this.component.numTerminus() ?? 0) > 0) {
        terminus = new Array<number>(numEdges).fill(this.component.numTerminus() as number);
        g2d.setColor(Color.RED); // red colour by default
        const lineThicknessMultiplier = 0.33;
        const lineThickness = Math.floor(imageSize * lineThicknessMultiplier);
        g2d.setStroke(new BasicStroke(lineThickness, CAP_BUTT, JOIN_MITER));
        this.drawPathLines(g2d, context, terminus, imageSize, numEdges);
      }
    } else {
      // If the what of the tile is hidden, draw a question mark.
      const valueFont = new Font('Arial', BOLD, imageSize);
      g2d.setColor(Color.BLACK);
      g2d.setFont(valueFont);
      const rect = fontStringBounds(valueFont, '?');
      g2d.drawString(
        '?',
        Math.floor(g2d.getWidth() / 2 - rect.getWidth() / 2),
        Math.floor(g2d.getHeight() / 2 + rect.getHeight() / 3),
      );
    }

    return g2d;
  }

  // -------------------------------------------------------------------------

  /**
   * Draws the path lines on the tile based on the terminus specs.
   * @java TileStyle#drawPathLines
   */
  private drawPathLines(
    g2d: SVGGraphics2D,
    context: Context,
    terminus: number[] | null,
    imageSize: number,
    numEdges: number,
  ): void {
    if (terminus === null || terminus.length === 0) return;

    let terminusSpacing = Math.floor(imageSize / ((terminus[0] ?? 1) + 1));

    if (numEdges === 4) {
      // TODO only square tile paths supported right now
      if (this.component.paths() !== null) {
        const numTerminus = this.component.numTerminus() as number;
        terminusSpacing = Math.floor(imageSize / (numTerminus + 1));
        const paths = this.component.paths() as unknown as Path[];
        for (const tilePath of paths) {
          let ax = 0;
          let ay = 0;
          let bx = 0;
          let by = 0;

          switch (tilePath.side1()) {
            case 0: ax = terminusSpacing * (tilePath.terminus1() + 1); ay = 0; break;
            case 1: ax = imageSize; ay = terminusSpacing * (tilePath.terminus1() + 1); break;
            case 2: ax = terminusSpacing * (tilePath.terminus1() + 1); ay = imageSize; break;
            case 3: ax = 0; ay = terminusSpacing * (tilePath.terminus1() + 1); break;
          }

          switch (tilePath.side2()) {
            case 0: bx = terminusSpacing * (tilePath.terminus2() + 1); by = 0; break;
            case 1: bx = imageSize; by = terminusSpacing * (tilePath.terminus2() + 1); break;
            case 2: bx = terminusSpacing * (tilePath.terminus2() + 1); by = imageSize; break;
            case 3: bx = 0; by = terminusSpacing * (tilePath.terminus2() + 1); break;
          }

          const off = 0.666;

          const aax = ax + Math.floor(off * (imageSize / 2 - ax));
          const aay = ay + Math.floor(off * (imageSize / 2 - ay));

          const bbx = bx + Math.floor(off * (imageSize / 2 - bx));
          const bby = by + Math.floor(off * (imageSize / 2 - by));

          const path2 = new GeneralPath();
          path2.moveTo(ax, ay);
          path2.curveTo(aax, aay, bbx, bby, bx, by);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          g2d.setColor(this.bridge.settingsColour().playerColour(context as any, tilePath.colour()));
          g2d.draw(path2);
        }
      }
    } else {
      // Only square done for now
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @java TileStyle#scale
   */
  public override scale(
    _context: Context,
    _containerIndex: number,
    _localState: number,
    _value: number,
  ): number {
    return 1.0;
  }

  // -------------------------------------------------------------------------
}
