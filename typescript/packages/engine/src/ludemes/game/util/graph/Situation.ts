// @java Core/src/game/util/graph/Situation.java
//
// Graph element positional situation, for coordinate labelling.
// Holds an RCL coordinate and a string label.

/**
 * [row, column, layer] coordinate.
 *
 * @java main.math.RCL
 */
export class RCL {
  /** @java RCL.row */
  private _row: number = -1;

  /** @java RCL.column */
  private _column: number = -1;

  /** @java RCL.layer */
  private _layer: number = -1;

  // -------------------------------------------------------------------------

  /** @java RCL() */
  public constructor();
  /** @java RCL(int r, int c) */
  public constructor(r: number, c: number);
  /** @java RCL(int r, int c, int l) */
  public constructor(r: number, c: number, l: number);
  public constructor(r?: number, c?: number, l?: number) {
    if (r !== undefined && c !== undefined) {
      this._row    = r;
      this._column = c;
      this._layer  = l !== undefined ? l : 0;
    }
  }

  // -------------------------------------------------------------------------

  /** @java RCL.row() */
  public row(): number { return this._row; }

  /** @java RCL.setRow(int r) */
  public setRow(r: number): void { this._row = r; }

  /** @java RCL.column() */
  public column(): number { return this._column; }

  /** @java RCL.setColumn(int c) */
  public setColumn(c: number): void { this._column = c; }

  /** @java RCL.layer() */
  public layer(): number { return this._layer; }

  /** @java RCL.setLayer(int l) */
  public setLayer(l: number): void { this._layer = l; }

  // -------------------------------------------------------------------------

  /** @java RCL.set(int r, int c, int l) */
  public set(r: number, c: number, l: number): void {
    this._row    = r;
    this._column = c;
    this._layer  = l;
  }

  /** @java RCL.set(RCL other) */
  public setFrom(other: RCL): void {
    this._row    = other._row;
    this._column = other._column;
    this._layer  = other._layer;
  }

  // -------------------------------------------------------------------------

  /** @java RCL.toString() */
  public toString(): string {
    return `row = ${this._row}, column = ${this._column}, layer = ${this._layer}`;
  }
}

// ---------------------------------------------------------------------------

/**
 * Graph element positional situation, for coordinate labelling.
 *
 * @java game.util.graph.Situation
 */
export class Situation {
  /** @java Situation.rcl */
  private readonly _rcl: RCL = new RCL();

  /** @java Situation.label */
  _label: string = "";

  // -------------------------------------------------------------------------

  /**
   * @java Situation.rcl()
   */
  public rcl(): RCL {
    return this._rcl;
  }

  /**
   * @java Situation.label()
   */
  public label(): string {
    return this._label;
  }

  /**
   * @java Situation.setLabel(String str)
   */
  public setLabel(str: string): void {
    this._label = str;
  }
}
