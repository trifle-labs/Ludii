import { IntConstant } from "../../../ludemes/game/functions/ints/IntConstant.js";
import { IsLine } from "../../../ludemes/game/functions/booleans/is/line/IsLine.js";
import { SitesEmpty } from "../../../ludemes/game/functions/region/sites/SitesEmpty.js";
import { Equipment1to1 } from "../../../ludemes/game/equipment/Equipment1to1.js";
import { Piece } from "../../../ludemes/game/equipment/component/Piece.js";
import { Board1to1 } from "../../../ludemes/game/equipment/container/board/Board1to1.js";
import { Result } from "../../../ludemes/game/rules/end/Result.js";
import { If } from "../../../ludemes/game/rules/end/If.js";
import { End } from "../../../ludemes/game/rules/end/End.js";
import { Play1to1 } from "../../../ludemes/game/rules/play/Play1to1.js";
import { Add } from "../../../ludemes/game/rules/play/moves/nonDecision/effect/Add.js";
import { To1to1 } from "../../../ludemes/game/util/moves/To1to1.js";
import { Rules1to1 } from "../../../ludemes/game/rules/Rules1to1.js";
import { Game1to1 } from "../../../ludemes/Game1to1.js";
import type {
  BooleanFunction,
  EndRuleFunction,
  MovesFunction,
  RegionFunction,
  ResultType,
  RoleType,
} from "../../../ludemes/base.js";
import type { ArgBundle } from "../ArgBundle.js";
import { LudemeRegistry } from "../LudemeRegistry.js";

export function createTicTacToeRegistry(): LudemeRegistry {
  const registry = new LudemeRegistry();

  registerAliases(registry, ["game", "game:game"], (b, env): Game1to1 => {
    const name = requireString(b, 0);
    const players = findFirst<number>(b, isNumberValue) ?? env.numPlayers;
    const equipment = findFirst<Equipment1to1>(b, isEquipment);
    const rules = findFirst<Rules1to1>(b, isRules);
    if (!equipment || !rules) throw new Error("TTT factory game: missing equipment or rules");
    return new Game1to1(name, players, equipment, rules, [], false, false);
  });

  registerAliases(registry, ["players", "players:players"], (b, env): number => {
    const players = requireNumber(b, 0);
    env.numPlayers = players;
    return players;
  });

  registerAliases(registry, ["equipment", "equipment:equipment"], (b): Equipment1to1 => {
    const items = flatten(b.positional);
    const board = items.find(isBoard);
    const pieces = items.filter(isPiece);
    if (!board) throw new Error("TTT factory equipment: missing board");
    return new Equipment1to1(board, pieces);
  });

  registerAliases(registry, ["board", "board:board"], (b): Board1to1 => {
    const board = findFirst<Board1to1>(b, isBoard);
    if (!board) throw new Error("TTT factory board: missing graph");
    return board;
  });

  registerAliases(registry, ["square", "square:square"], (b): Board1to1 => {
    const size = findFirst<number>(b, isNumberValue);
    if (size === undefined) throw new Error("TTT factory square: missing size");
    return new Board1to1(size, size);
  });

  registerAliases(registry, ["piece", "piece:piece"], (b, env): Piece | Piece[] => {
    const name = requireString(b, 0);
    const role = typeof b.positional[1] === "string" ? b.positional[1] : "Neutral";
    if (role === "Each") {
      return Array.from({ length: env.numPlayers }, (_, i) => new Piece(name, i + 1));
    }
    return new Piece(name, roleToOwner(role));
  });

  registerAliases(registry, ["rules", "rules.rules:rules"], (b): Rules1to1 => {
    const play = findFirst<Play1to1>(b, isPlay);
    const end = findFirst<End>(b, isEnd);
    if (!play || !end) throw new Error("TTT factory rules: missing play or end");
    return new Rules1to1(play, end);
  });

  registerAliases(registry, ["play", "play:play"], (b): Play1to1 => {
    const moves = findFirst<MovesFunction>(b, isMovesFunction);
    if (!moves) throw new Error("TTT factory play: missing moves");
    return new Play1to1(moves);
  });

  registry.registerLudeme("move:add", (b): Add => {
    const to = findFirst<To1to1>(b, isTo);
    const region = to?.regionFn();
    if (!region) throw new Error("TTT factory move:add: missing to-region");
    return new Add(region);
  });

  registerAliases(registry, ["to", "to:to"], (b): To1to1 => {
    const region = findFirst<RegionFunction>(b, isRegionFunction);
    return new To1to1({ region: region ?? null });
  });

  registry.registerLudeme("sites:empty", (): SitesEmpty => new SitesEmpty());

  registerAliases(registry, ["end", "end:end"], (b): End => {
    const rules = flatten(b.positional).filter(isEndRule);
    return new End(rules);
  });

  registry.registerLudeme("end.if:if", (b, env): If => makeEndIf(b, env.numPlayers));
  registry.registerLudeme("if", (b, env): If => makeEndIf(b, env.numPlayers));

  registerAliases(registry, ["result", "result:result"], (b): Result => {
    const role = requireString(b, 0) as RoleType;
    const result = requireString(b, 1) as ResultType;
    return new Result(role, result);
  });

  registry.registerLudeme("is:line", (b): IsLine => {
    const len = findFirst<number>(b, isNumberValue);
    if (len === undefined) throw new Error("TTT factory is:line: missing line length");
    const dirn = b.positional.find((v) => typeof v === "string" && v !== "Line");
    return new IsLine(new IntConstant(len), typeof dirn === "string" ? dirn : "Adjacent");
  });

  return registry;
}

function registerAliases<T>(
  registry: LudemeRegistry,
  keys: readonly string[],
  factory: (b: ArgBundle, env: { numPlayers: number }) => T,
): void {
  for (const key of keys) registry.registerLudeme(key, factory);
}

function makeEndIf(b: ArgBundle, numPlayers: number): If {
  const condition = findFirst<BooleanFunction>(b, isBooleanFunction);
  const result = findFirst<Result>(b, isResult);
  if (!condition || !result) throw new Error("TTT factory if: missing condition or result");
  return new If(condition, result, numPlayers);
}

function flatten(values: readonly unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value)) out.push(...flatten(value));
    else out.push(value);
  }
  return out;
}

function findFirst<T>(b: ArgBundle, guard: (value: unknown) => value is T): T | undefined {
  return flatten(b.positional).find(guard);
}

function requireString(b: ArgBundle, index: number): string {
  const value = b.positional[index];
  if (typeof value !== "string") throw new Error(`TTT factory ${b.constructKey}: expected string at ${index}`);
  return value;
}

function requireNumber(b: ArgBundle, index: number): number {
  const value = b.positional[index];
  if (typeof value !== "number") throw new Error(`TTT factory ${b.constructKey}: expected number at ${index}`);
  return value;
}

function roleToOwner(role: string): number {
  if (role === "Shared" || role === "Neutral") return 0;
  if (/^P\d+$/.test(role)) return Number(role.slice(1));
  return 0;
}

function isNumberValue(value: unknown): value is number {
  return typeof value === "number";
}

function isEquipment(value: unknown): value is Equipment1to1 {
  return value instanceof Equipment1to1;
}

function isBoard(value: unknown): value is Board1to1 {
  return value instanceof Board1to1;
}

function isPiece(value: unknown): value is Piece {
  return value instanceof Piece;
}

function isRules(value: unknown): value is Rules1to1 {
  return value instanceof Rules1to1;
}

function isPlay(value: unknown): value is Play1to1 {
  return value instanceof Play1to1;
}

function isEnd(value: unknown): value is End {
  return value instanceof End;
}

function isResult(value: unknown): value is Result {
  return value instanceof Result;
}

function isTo(value: unknown): value is To1to1 {
  return value instanceof To1to1;
}

function isMovesFunction(value: unknown): value is MovesFunction {
  return typeof (value as MovesFunction | null)?.eval === "function";
}

function isRegionFunction(value: unknown): value is RegionFunction {
  return value instanceof SitesEmpty;
}

function isBooleanFunction(value: unknown): value is BooleanFunction {
  return value instanceof IsLine;
}

function isEndRule(value: unknown): value is EndRuleFunction {
  return value instanceof If;
}
