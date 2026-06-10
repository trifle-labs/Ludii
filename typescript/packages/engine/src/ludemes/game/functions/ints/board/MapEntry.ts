// @java Core/src/game/functions/ints/board/MapEntry.java

/**
 * MapEntry — map lookup int function.
 *
 * @java game/functions/ints/board/MapEntry.java
 */

import type { Context } from "../../../../../context.js";
import { IntConstant } from "../IntConstant.js";
import { BaseIntFunction } from "../BaseIntFunction.js";
import type { JavaIntFunction } from "../IntFunction.js";
import type { RoleTypeFull } from "../../../types/play/RoleType.js";

/**
 * Returns the value mapped from a key in an equipment map.
 *
 * @java game/functions/ints/board/MapEntry.java — class MapEntry extends BaseIntFunction
 */
export class MapEntry extends BaseIntFunction {
  /** @java MapEntry.name */
  private readonly mapName: string | null;

  /** @java MapEntry.key */
  private readonly keyFn: JavaIntFunction;

  /**
   * @java MapEntry(String, IntFunction, RoleType)
   */
  public constructor(
    name: string | null,
    key: JavaIntFunction | RoleTypeFull | null,
    keyRole: RoleTypeFull | null,
  ) {
    super();

    const keyAsRole = typeof key === "string" ? key : null;
    const keyFn = typeof key === "string" ? null : key;
    const role = keyRole ?? keyAsRole;

    let numNonNull = 0;
    if (keyFn !== null) numNonNull += 1;
    if (role !== null) numNonNull += 1;
    if (numNonNull !== 1)
      throw new Error("MapEntry: Exactly one key parameter must be non-null.");

    this.mapName = name;
    this.keyFn = keyFn ?? roleKeyFn(role);
  }

  /**
   * @java MapEntry.eval(Context)
   */
  public override eval(context: Context): number {
    const key = this.keyFn.eval(context);
    const maps = mapsFromContext(context);
    if (maps) {
      const map = maps.get(this.mapName ?? "__default__");
      const value = map?.get(key);
      if (value !== undefined) return value;
    }
    return key;
  }
}

function mapsFromContext(context: Context): globalThis.Map<string, globalThis.Map<number, number>> | null {
  const game = (context as unknown as { game?: unknown }).game;
  const direct = (game as { _maps?: globalThis.Map<string, globalThis.Map<number, number>> } | null)?._maps;
  if (direct) return direct;

  const equipment = (game as { equipment?: unknown } | null)?.equipment;
  const equipmentObj = typeof equipment === "function" ? equipment.call(game) : equipment;
  const board = (equipmentObj as { board?: unknown } | null)?.board;
  return (board as { _pendingMaps?: globalThis.Map<string, globalThis.Map<number, number>> } | null)?._pendingMaps ?? null;
}

function roleKeyFn(role: RoleTypeFull | null): JavaIntFunction {
  if (role !== null && /^P\d+$/.test(role)) return new IntConstant(Number(role.slice(1))) as unknown as JavaIntFunction;
  if (role === "Mover") return { ...new IntConstant(0), eval: (ctx: Context) => ctx.state.mover } as JavaIntFunction;
  if (role === "Next") {
    return {
      ...new IntConstant(0),
      eval: (ctx: Context) => (ctx.state.mover % (ctx.game?.numPlayers ?? 2)) + 1,
    } as JavaIntFunction;
  }
  if (role === "Prev") {
    return {
      ...new IntConstant(0),
      eval: (ctx: Context) => (ctx.state as unknown as { prev?: number }).prev ?? ctx.state.mover,
    } as JavaIntFunction;
  }
  return new IntConstant(0) as unknown as JavaIntFunction;
}
