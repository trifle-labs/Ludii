// @java Core/src/other/topology/AxisLabel.java AxisLabel
/**
 * Board axis label with a 2-D position.
 *
 * Faithful 1:1 transliteration of other.topology.AxisLabel.
 *
 * @author cambolbro  (Java original)
 */

/**
 * Axis label on the board (letter/number label + display position).
 * @java other.topology.AxisLabel
 */
export class AxisLabel {
  private _label: string;
  private readonly _x: number;
  private readonly _y: number;

  /**
   * @java AxisLabel(String label, double x, double y)
   */
  constructor(label: string, x: number, y: number) {
    this._label = label;
    this._x     = x;
    this._y     = y;
  }

  /** @java AxisLabel#label() */
  label(): string { return this._label; }

  /**
   * Position as a simple {x, y} object.
   * @java AxisLabel#posn() — returns Point2D.Double
   */
  posn(): { x: number; y: number } {
    return { x: this._x, y: this._y };
  }
}
