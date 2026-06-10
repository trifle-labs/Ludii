// @java Core/src/game/functions/ints/board/Phase.java

/**
 * Returns the (colouring) phase of a site — e.g. 0/1 checkerboard parity on a
 * square board.
 *
 * @java game/functions/ints/board/Phase.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";

export class Phase extends BaseIntFunction {
  /** @java Phase.type */
  private readonly type: string | null;
  /** @java Phase.of */
  private readonly of: JavaIntFunction;

  /** @java Phase(@Opt SiteType type, @Name IntFunction of) */
  public constructor(type: string | null, of: JavaIntFunction) {
    super();
    this.type = type;
    this.of = of;
  }

  /** @java Phase.eval(Context) — element.phase(); checkerboard fallback on square grids. */
  public override eval(context: Context): number {
    const index = this.of.eval(context);
    if (index < 0) return -1;
    const topology = (context as unknown as { topology?: () => { getGraphElements(t: string): Array<{ phase(): number }> } }).topology?.();
    if (topology) {
      const elements = topology.getGraphElements(this.type ?? "Cell");
      const ph = elements[index]?.phase?.();
      if (ph !== undefined) return ph;
    }
    const width = (context.game as unknown as { equipment?: { board?: { width?: number } } }).equipment?.board?.width ?? 0;
    if (width > 0) {
      const col = index % width;
      const row = Math.floor(index / width);
      return (row + col) % 2;
    }
    return 0;
  }

  /** @java Phase.isStatic() */
  public isStatic(): boolean { return false; }
}
