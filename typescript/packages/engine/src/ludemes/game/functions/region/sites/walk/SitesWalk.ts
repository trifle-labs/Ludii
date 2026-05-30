// @java Core/src/game/functions/region/sites/walk/SitesWalk.java

import {
  isIdent,
  isList,
  isString,
  type LudList,
  type LudNode,
} from "@ludii/typescript-language";
import {
  compileBool,
  compileInt,
  dropSiteType,
  parseArgs,
  type CompileEnv,
} from "../../../../../../eval/compile.js";
import type {
  BoolFn,
  EvalContext,
  IntFn,
  RegionFn,
} from "../../../../../../eval/eval-context.js";
import { OFF } from "../../../../../../eval/eval-context.js";
import { register } from "../../../../../registry.js";

const COMPASS_CW: readonly string[] = [
  "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
];

const NAMED_WALKS: ReadonlyMap<string, readonly (readonly string[])[]> =
  new Map([
    ["DominoWalk", [["F", "R", "F", "R", "F", "L", "F", "L", "F", "R", "F", "R", "F"]]],
    ["GiraffeWalk", [["F", "F", "F", "R", "F", "F"], ["F", "F", "F", "L", "F", "F"]]],
    ["KnightWalk", [["F", "F", "R", "F"], ["F", "F", "L", "F"]]],
    ["LWalk", [["L", "F", "R", "F", "F"], ["R", "F", "L", "F", "F"]]],
    ["TWalk", [["F", "F", "F", "L", "F", "R", "R", "F", "F"]]],
  ]);

function parseWalks(node: LudNode | undefined): readonly (readonly string[])[] {
  if (!node) return [];
  if (isString(node)) return NAMED_WALKS.get(node.value) ?? [];
  if (!isList(node)) return [];
  const nested =
    node.items.length > 0 && node.items.every((item) => isList(item));
  if (nested) return node.items.filter(isList).map(walkSteps);
  return [walkSteps(node)];
}

function walkSteps(node: LudList): string[] {
  const out: string[] = [];
  for (const item of node.items) {
    if (isIdent(item)) out.push(item.name);
  }
  return out;
}

function supportedOrthogonalDirNames(ctx: EvalContext): readonly string[] {
  if (ctx.board.traj) return ctx.board.traj.supportedOrthogonalDirNames();
  const absolute = ctx.board.tiling.absolute;
  const orthogonal = ctx.board.tiling.groups.Orthogonal ?? [];
  return COMPASS_CW.filter((name) => {
    const d = absolute[name];
    return !!d && orthogonal.some((o) => o.dx === d.dx && o.dy === d.dy);
  });
}

function rotateToSupported(
  dir: string,
  delta: number,
  supported: ReadonlySet<string>,
): string {
  let idx = COMPASS_CW.indexOf(dir);
  if (idx < 0) return dir;
  for (let guard = 0; guard < COMPASS_CW.length; guard += 1) {
    idx = (idx + delta + COMPASS_CW.length) % COMPASS_CW.length;
    const next = COMPASS_CW[idx] as string;
    if (supported.has(next)) return next;
  }
  return dir;
}

function forward(ctx: EvalContext, from: number, dir: string): number {
  const traj = ctx.board.traj;
  if (traj) {
    const tos = traj.steps(from, dir);
    return tos.length > 0 ? (tos[tos.length - 1] as number) : OFF;
  }
  const d = ctx.board.tiling.absolute[dir];
  if (!d) return OFF;
  return ctx.board.siteAt(ctx.board.xOf(from) + d.dx, ctx.board.yOf(from) + d.dy);
}

export function compileSitesWalk(node: LudList, env: CompileEnv): RegionFn {
  const { positional, named } = parseArgs(node.items.slice(2));
  const args = dropSiteType(positional);
  const walkIndex = args.findIndex(
    (item) => isString(item) || (isList(item) && item.delimiter === "curly"),
  );
  const walkNode = walkIndex >= 0 ? args[walkIndex] : undefined;
  const startNode = walkIndex > 0 ? args[0] : undefined;
  const startLocationFn: IntFn = startNode
    ? compileInt(startNode, env)
    : { eval: (ctx) => ctx.frame.from ?? OFF };
  const walks = parseWalks(walkNode);
  const rotationsNode = named.get("rotations");
  const rotations: BoolFn = rotationsNode
    ? compileBool(rotationsNode, env)
    : { eval: () => true };

  return {
    eval: (ctx) => {
      // Java starts from From by default, returns empty from OFF, then executes
      // each F/R/L turtle walk from all supported orthogonal headings unless
      // rotations is false (SitesWalk.java:74-149).
      const from = startLocationFn.eval(ctx);
      if (from === OFF) return [];
      const allRotations = rotations.eval(ctx);
      if (ctx.board.traj) return ctx.board.traj.walkSites(from, walks, allRotations);

      const orthogonalSupported = supportedOrthogonalDirNames(ctx);
      if (orthogonalSupported.length === 0) return [];
      const supported = new Set(orthogonalSupported);
      const walkDirections = allRotations
        ? orthogonalSupported
        : [orthogonalSupported[0] as string];
      const sitesAfterWalk: number[] = [];
      for (const startDirection of walkDirections) {
        for (const steps of walks) {
          let currentLoc = from;
          let currentDirection = startDirection;
          let valid = true;
          for (const step of steps) {
            if (step === "F") {
              currentLoc = forward(ctx, currentLoc, currentDirection);
              if (currentLoc === OFF) {
                valid = false;
                break;
              }
            } else if (step === "R") {
              currentDirection = rotateToSupported(currentDirection, +1, supported);
            } else if (step === "L") {
              currentDirection = rotateToSupported(currentDirection, -1, supported);
            }
          }
          if (valid && currentLoc !== OFF) sitesAfterWalk.push(currentLoc);
        }
      }
      return sitesAfterWalk;
    },
  };
}

register("region", "sites:Walk", compileSitesWalk as any);
