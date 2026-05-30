// @java Core/src/game/rules/play/moves/nonDecision/effect/Claim.java

import {
  isList,
  isString,
  type LudList,
  listHead,
} from "@ludii/typescript-language";
import { ActionAdd } from "../../../../../../../action/action-add.js";
import {
  compileBool,
  compileInt,
  compileRegion,
  dropSiteType,
  LudemeCompileError,
  parseArgs,
  resolveAddedPiece,
  type CompileEnv,
} from "../../../../../../../eval/compile.js";
import type {
  IntFn,
  MovesFn,
  RegionFn,
} from "../../../../../../../eval/eval-context.js";
import { Move } from "../../../../../../../move.js";
import { register } from "../../../../../../registry.js";

export function compileClaim(node: LudList, env: CompileEnv): MovesFn {
  const toNode = node.items.find((n) => isList(n) && listHead(n) === "to") as
    | LudList
    | undefined;
  if (!toNode)
    throw new LudemeCompileError("(move Claim …) needs a (to …) clause.");
  const { positional: toPos, named: toNamed } = parseArgs(
    toNode.items.slice(1),
  );
  const regionArg = dropSiteType(toPos)[0];
  if (!regionArg)
    throw new LudemeCompileError("(move Claim …) (to …) needs a target.");
  const baseRegion = compileRegion(regionArg, env);
  // `(to … if:<cond>)` reads each candidate as `(to)`, matching Java's
  // `context.setTo(site); if (test == null || test.eval(context))`.
  const toIfNode = toNamed.get("if") ?? toNamed.get("If");
  let region: RegionFn = baseRegion;
  if (toIfNode) {
    try {
      const cond = compileBool(toIfNode, env);
      region = {
        eval: (ctx) =>
          baseRegion
            .eval(ctx)
            .filter((s) => s >= 0 && cond.eval(ctx.withFrame({ to: s }))),
      };
    } catch {
      region = baseRegion;
    }
  }
  // Optional `(piece "Label")` — its owner digit must be honoured so a
  // neutral marker keeps who == 0; otherwise the component defaults to Mover.
  const pieceNode = node.items.find(
    (n) => isList(n) && listHead(n) === "piece",
  ) as LudList | undefined;
  let whatFn: IntFn = { eval: (ctx) => ctx.mover };
  let staticPiece: { what: number; owner: number } | undefined;
  const labelNode = pieceNode?.items[1];
  if (labelNode && isString(labelNode)) {
    staticPiece = resolveAddedPiece(labelNode.value, env);
  } else if (labelNode) {
    try {
      whatFn = compileInt(labelNode, env);
    } catch {
      /* leave as mover */
    }
  }
  const stateSpec = pieceNode
    ? parseArgs(pieceNode.items.slice(2)).named.get("state")
    : undefined;
  let stateFn: IntFn | undefined;
  if (stateSpec) {
    try {
      stateFn = compileInt(stateSpec, env);
    } catch {
      stateFn = undefined;
    }
  }
  return {
    generate: (ctx) => {
      const out: Move[] = [];
      const mover = ctx.mover;
      const what = staticPiece ? staticPiece.what : whatFn.eval(ctx);
      const effectiveWhat = what > 0 ? what : mover;
      const owner = staticPiece ? staticPiece.owner : mover;
      const state = stateFn ? stateFn.eval(ctx) : undefined;
      for (const site of region.eval(ctx)) {
        if (site < 0) continue;
        out.push(
          new Move({
            id: `claim:${site}:${mover}`,
            label: `Claim at ${site}`,
            siteIndices: [site],
            mover,
            placedOwner: mover,
            actions: [
              new ActionAdd({
                to: site,
                what: effectiveWhat,
                owner,
                count: 1,
                onStack: false,
                ...(state !== undefined ? { state } : {}),
              }),
            ],
          }),
        );
      }
      return out;
    },
  };
}

register("moves", "claim", compileClaim as any);
