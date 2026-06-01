// @java Core/src/game/functions/booleans/is/Hidden/IsHidden.java

import type { Context } from "../../../../../../context.js";
import type { BooleanFunction, IntFunction } from "../../../../../base.js";
import type { LudNode } from "@ludii/typescript-language";
import { isIdent, type LudList } from "@ludii/typescript-language";
import { compileInt1to1, parseArgs1to1 } from "../../../../../../compiler1to1.js";
import { registerBool1to1, type Compile1to1Env } from "../../../../../registry1to1.js";

/**
 * (is Hidden [<SiteType>] at:<site> [level:<int>] to:<player>)
 * Checks if a site is hidden (invisible) to a player.
 * @java game/functions/booleans/is/Hidden/IsHidden.java
 */
export class IsHidden1to1 implements BooleanFunction {
  /** @java IsHidden.siteFn */
  private readonly siteFn: IntFunction;
  /** @java IsHidden.whoFn */
  private readonly whoFn: IntFunction;

  public constructor(siteFn: IntFunction, whoFn: IntFunction) {
    this.siteFn = siteFn;
    this.whoFn = whoFn;
  }

  /**
   * @java IsHidden.eval(Context):
   *   site = siteFn.eval; if (site<0) false;
   *   who = whoFn.eval; return cs.isHidden(who, site, level, type)
   * TS: state.isHidden(who, site)
   */
  public eval(ctx: Context): boolean {
    const site = this.siteFn.eval(ctx);
    if (site < 0) return false;
    const who = this.whoFn.eval(ctx);
    return ctx.state.isHidden(who, site);
  }
}

function resolvePlayerFn(positional: LudNode[]): IntFunction {
  // Find the "to:" named arg or last positional role
  for (const p of positional) {
    if (isIdent(p)) {
      const name = p.name.toLowerCase();
      if (name === "mover") return { eval(ctx: Context): number { return ctx.state.mover; } };
      if (name === "next") return { eval(ctx: Context): number { return (ctx.state.mover % ctx.game.numPlayers) + 1; } };
      if (name.startsWith("p") && !isNaN(parseInt(name.slice(1), 10))) {
        const pid = parseInt(name.slice(1), 10);
        return { eval(_ctx: Context): number { return pid; } };
      }
    }
  }
  return { eval(ctx: Context): number { return ctx.state.mover; } };
}

registerBool1to1("is:hidden", (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
  // (is Hidden [SiteType] at:<site> [level:<int>] to:<player|role>)
  const { positional, named } = parseArgs1to1((node as LudList).items);
  // named.at = site, named.to = player
  const atNode = named.get("at");
  const toNode = named.get("to");
  const siteFn = atNode ? compileInt1to1(atNode) : { eval(ctx: Context): number { return ctx._evalTo; } };
  let whoFn: IntFunction;
  if (toNode) {
    if (isIdent(toNode)) {
      const name = toNode.name.toLowerCase();
      if (name === "mover") whoFn = { eval(ctx: Context): number { return ctx.state.mover; } };
      else if (name === "next") whoFn = { eval(ctx: Context): number { return (ctx.state.mover % ctx.game.numPlayers) + 1; } };
      else if (name.startsWith("p") && !isNaN(parseInt(name.slice(1), 10))) {
        const pid = parseInt(name.slice(1), 10);
        whoFn = { eval(_ctx: Context): number { return pid; } };
      } else {
        whoFn = compileInt1to1(toNode);
      }
    } else {
      whoFn = compileInt1to1(toNode);
    }
  } else {
    whoFn = resolvePlayerFn(positional.slice(1));
  }
  return new IsHidden1to1(siteFn, whoFn);
});

// Variant keys for the hidden sub-types: all check the same isHidden(who, site) on the TS side
// because TS State only exposes one hidden array (per player per site, no sub-fields).
// Java tracks hidden sub-fields (count, rotation, state, value, what, who) but TS collapses them.
// Registering the sub-keys so they don't silently fail.

function makeHiddenSubtype(key: string): void {
  registerBool1to1(key, (node: LudNode, _env: Compile1to1Env): BooleanFunction => {
    const { named } = parseArgs1to1((node as LudList).items);
    const atNode = named.get("at");
    const toNode = named.get("to");
    const siteFn = atNode ? compileInt1to1(atNode) : { eval(ctx: Context): number { return ctx._evalTo; } };
    let whoFn: IntFunction;
    if (toNode) {
      if (isIdent(toNode)) {
        const name = toNode.name.toLowerCase();
        if (name === "mover") whoFn = { eval(ctx: Context): number { return ctx.state.mover; } };
        else if (name === "next") whoFn = { eval(ctx: Context): number { return (ctx.state.mover % ctx.game.numPlayers) + 1; } };
        else if (name.startsWith("p") && !isNaN(parseInt(name.slice(1), 10))) {
          const pid = parseInt(name.slice(1), 10);
          whoFn = { eval(_ctx: Context): number { return pid; } };
        } else {
          whoFn = compileInt1to1(toNode);
        }
      } else {
        whoFn = compileInt1to1(toNode);
      }
    } else {
      whoFn = { eval(ctx: Context): number { return ctx.state.mover; } };
    }
    return new IsHidden1to1(siteFn, whoFn);
  });
}

makeHiddenSubtype("is:hiddencount");
makeHiddenSubtype("is:hiddenrotation");
makeHiddenSubtype("is:hiddenstate");
makeHiddenSubtype("is:hiddenvalue");
makeHiddenSubtype("is:hiddenwhat");
makeHiddenSubtype("is:hiddenwho");
