// @java Common/src/main/math/RCL.java

/**
 * [row, column, layer] coordinate.
 *
 * @java main/math/RCL.java
 * @author cambolbro and Eric.Piette
 */
export class RCL {

  //-------------------------------------------------------------------------

  /** Row. @java RCL.row */
  private row: number = -1;

  /** Column. @java RCL.column */
  private column: number = -1;

  /** Layer. @java RCL.layer */
  private layer: number = -1;

  //-------------------------------------------------------------------------

  /**
   * Default constructor.
   * @java RCL()
   */
  public constructor();
  /**
   * Constructor 2D.
   * @java RCL(int, int)
   */
  public constructor(r: number, c: number);
  /**
   * Constructor 3D.
   * @java RCL(int, int, int)
   */
  public constructor(r: number, c: number, l: number);
  public constructor(r?: number, c?: number, l?: number) {
    if (r !== undefined && c !== undefined) {
      this.row = r;
      this.column = c;
      this.layer = l ?? 0;
    }
  }

  //-------------------------------------------------------------------------

  /** @java RCL.row() */
  public getRow(): number {
    return this.row;
  }

  /** @java RCL.setRow(int) */
  public setRow(r: number): void {
    this.row = r;
  }

  /** @java RCL.column() */
  public getColumn(): number {
    return this.column;
  }

  /** @java RCL.setColumn(int) */
  public setColumn(c: number): void {
    this.column = c;
  }

  /** @java RCL.layer() */
  public getLayer(): number {
    return this.layer;
  }

  /** @java RCL.setLayer(int) */
  public setLayer(l: number): void {
    this.layer = l;
  }

  //-------------------------------------------------------------------------

  /**
   * @param r Row.
   * @param c Column.
   * @param l Layer.
   * @java RCL.set(int, int, int)
   */
  public set(r: number, c: number, l: number): void;
  /**
   * @param other
   * @java RCL.set(RCL)
   */
  public set(other: RCL): void;
  public set(rOrOther: number | RCL, c?: number, l?: number): void {
    if (rOrOther instanceof RCL) {
      this.row = rOrOther.row;
      this.column = rOrOther.column;
      this.layer = rOrOther.layer;
    } else {
      this.row = rOrOther;
      this.column = c ?? 0;
      this.layer = l ?? 0;
    }
  }

  //-------------------------------------------------------------------------

  /** @java RCL.toString() */
  public toString(): string {
    return "row = " + this.row + ", column = " + this.column + ", layer = " + this.layer;
  }

  //-------------------------------------------------------------------------
}
