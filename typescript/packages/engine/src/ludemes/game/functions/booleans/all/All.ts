// @java Core/src/game/functions/booleans/all/All.java

/**
 * Returns whether all aspects of the specified query are true.
 *
 * @java game/functions/booleans/all/All.java
 * @author Eric.Piette
 */

import type { Context } from "../../../../../context.js";
import { BaseBooleanFunction } from "../BaseBooleanFunction.js";
import type { BooleanFunction, IntArrayFunction, RegionFunction } from "../../../../base.js";
import { AllGroupsType } from "./AllGroupsType.js";
import { AllValuesType } from "./AllValuesType.js";
import { AllSitesType } from "./AllSitesType.js";
import { AllSimpleType } from "./AllSimpleType.js";
import { compileFlags } from "../../../../../ludii/compiler/compile-flags.js";

// ---------------------------------------------------------------------------
// AllGroups — sub-implementation
// @java game/functions/booleans/all/groups/AllGroups.java
// ---------------------------------------------------------------------------

class AllGroups extends BaseBooleanFunction {
  /** @java AllGroups.groupElementConditionFn */
  private readonly groupElementConditionFn: BooleanFunction | null;
  /** @java AllGroups.groupCondition */
  private readonly groupCondition: BooleanFunction;
  /** @java AllGroups.dirnChoice — direction choice (ignored in abstract eval) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly dirnChoice: any;
  /** @java AllGroups.type */
  private type: string | null;

  public constructor(
    type: string | null,
    directions: unknown | null,
    of: BooleanFunction | null,
    If: BooleanFunction,
  ) {
    super();
    this.type = type;
    this.groupCondition = If;
    this.groupElementConditionFn = of ?? null;
    this.dirnChoice = directions;
  }

  /**
   * @java AllGroups.eval(Context)
   *
   * Returns true if all groups of connected pieces satisfy groupCondition.
   */
  public override eval(context: Context): boolean {
    // Escape-hatch typed context
    const ctx = context as unknown as {
      topology?: () => {
        getGraphElements?: (type: string) => Array<{ index?: () => number }>;
        trajectories?: () => {
          steps?: (
            type: string,
            fromIdx: number,
            toType: string,
            dir: string,
          ) => Array<{ to?: () => { id?: () => number } }>;
        };
      };
      containerState?: (cid: number) => {
        who?: (idx: number, type: string) => number;
      };
      setFrom?: (v: number) => void;
      setTo?: (v: number) => void;
      setRegion?: (region: unknown) => void;
      from?: () => number;
      to?: () => number;
      region?: () => unknown;
      game?: () => { players?: () => { size?: () => number } };
      state?: () => {
        mover?: number;
        owned?: () => { sites?: (pid: number) => number[] };
      };
    };

    const topology = typeof ctx.topology === "function" ? ctx.topology() : null;
    const typeName = this.type ?? "Cell";
    const maxIndexElement = topology && typeof topology.getGraphElements === "function"
      ? topology.getGraphElements(typeName).length
      : 0;

    const cs = typeof ctx.containerState === "function" ? ctx.containerState(0) : null;
    const origFrom = typeof ctx.from === "function" ? ctx.from() : -1;
    const origTo = typeof ctx.to === "function" ? ctx.to() : -1;
    const origRegion = typeof ctx.region === "function" ? ctx.region() : null;

    const stateCtx = typeof ctx.state === "function" ? ctx.state() : null;
    const who = stateCtx?.mover ?? 0;
    const owned = stateCtx && typeof stateCtx.owned === "function" ? stateCtx.owned() : null;

    // Java: We get the minimum set of sites to look.
    const sitesToCheck: number[] = [];
    if (this.groupElementConditionFn !== null) {
      const gameCtx = typeof ctx.game === "function" ? ctx.game() : null;
      const playerCount = gameCtx && typeof gameCtx.players === "function"
        ? (typeof gameCtx.players().size === "function" ? gameCtx.players().size!() : 0)
        : 0;
      for (let i = 0; i <= playerCount; i++) {
        const allSites = owned && typeof owned.sites === "function" ? owned.sites(i) : [];
        for (let j = 0; j < allSites.length; j++) {
          const site = allSites[j]!;
          if (site < maxIndexElement) sitesToCheck.push(site);
        }
      }
    } else {
      const moverSites = owned && typeof owned.sites === "function" ? owned.sites(who) : [];
      for (let j = 0; j < moverSites.length; j++) {
        const site = moverSites[j]!;
        if (site < maxIndexElement) sitesToCheck.push(site);
      }
    }

    const sitesChecked: number[] = [];

    for (let k = 0; k < sitesToCheck.length; k++) {
      const from = sitesToCheck[k]!;
      if (sitesChecked.includes(from)) continue;

      const groupSites: number[] = [];

      if (typeof ctx.setFrom === "function") ctx.setFrom(from);
      if (typeof ctx.setTo === "function") ctx.setTo(from);

      const whoAtFrom = cs && typeof cs.who === "function" ? cs.who(from, typeName) : -1;
      const groupConditionCheck = this.groupElementConditionFn !== null
        ? this.groupElementConditionFn.eval(context)
        : who === whoAtFrom;

      if (groupConditionCheck) {
        groupSites.push(from);
      }

      if (groupSites.length > 0) {
        if (typeof ctx.setFrom === "function") ctx.setFrom(from);
        const sitesExplored: number[] = [];
        let i = 0;

        const trajectories = topology && typeof topology.trajectories === "function"
          ? topology.trajectories()
          : null;
        const allElements = topology && typeof topology.getGraphElements === "function"
          ? topology.getGraphElements(typeName)
          : [];

        while (sitesExplored.length !== groupSites.length) {
          const site = groupSites[i]!;
          const siteElement = allElements[site];
          const siteIdx = siteElement && typeof siteElement.index === "function"
            ? siteElement.index()
            : site;

          // Use Adjacent direction for group connectivity
          const steps = trajectories && typeof trajectories.steps === "function"
            ? trajectories.steps(typeName, siteIdx, typeName, "Adjacent")
            : [];

          for (const step of steps) {
            const stepToObj = typeof step.to === "function" ? step.to() : null;
            const toId = stepToObj !== null
              ? (typeof (stepToObj as unknown as { id?: () => number }).id === "function"
                ? (stepToObj as unknown as { id: () => number }).id()
                : -1)
              : -1;
            if (toId < 0) continue;
            if (groupSites.includes(toId)) continue;

            if (typeof ctx.setTo === "function") ctx.setTo(toId);
            const whoAtTo = cs && typeof cs.who === "function" ? cs.who(toId, typeName) : -1;
            const includeInGroup = this.groupElementConditionFn !== null
              ? this.groupElementConditionFn.eval(context)
              : who === whoAtTo;

            if (includeInGroup) {
              groupSites.push(toId);
            }
          }

          sitesExplored.push(site);
          i++;
        }

        // Java: context.setRegion(new Region(groupSites.toArray()));
        if (typeof ctx.setRegion === "function") {
          ctx.setRegion({ sites: () => groupSites });
        }
        if (!this.groupCondition.eval(context)) {
          if (typeof ctx.setTo === "function") ctx.setTo(origTo);
          if (typeof ctx.setFrom === "function") ctx.setFrom(origFrom);
          if (typeof ctx.setRegion === "function") ctx.setRegion(origRegion);
          return false;
        }

        for (const s of groupSites) sitesChecked.push(s);
      }
    }

    if (typeof ctx.setTo === "function") ctx.setTo(origTo);
    if (typeof ctx.setFrom === "function") ctx.setFrom(origFrom);
    if (typeof ctx.setRegion === "function") ctx.setRegion(origRegion);
    return true;
  }

  public override isStatic(): boolean { return false; }

  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    if (this.groupElementConditionFn) {
      const c = (this.groupElementConditionFn as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
      if (c) for (const v of c) concepts.add(v);
    }
    if (this.groupCondition) {
      const c = (this.groupCondition as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
      if (c) for (const v of c) concepts.add(v);
    }
    return concepts;
  }

  public override writesEvalContextRecursive(): Set<number> {
    const ws = new Set<number>();
    ws.add(1); ws.add(0); ws.add(3); // To, From, Region
    if (this.groupElementConditionFn) {
      const w = (this.groupElementConditionFn as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
      if (w) for (const v of w) ws.add(v);
    }
    if (this.groupCondition) {
      const w = (this.groupCondition as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
      if (w) for (const v of w) ws.add(v);
    }
    return ws;
  }

  public override readsEvalContextRecursive(): Set<number> {
    const rs = new Set<number>();
    if (this.groupElementConditionFn) {
      const r = (this.groupElementConditionFn as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
      if (r) for (const v of r) rs.add(v);
    }
    if (this.groupCondition) {
      const r = (this.groupCondition as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
      if (r) for (const v of r) rs.add(v);
    }
    return rs;
  }

  public override preprocess(game: unknown): void {
    // type = SiteType.use(type, game)
    if (this.groupElementConditionFn) (this.groupElementConditionFn as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    if (this.groupCondition) (this.groupCondition as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
  }

  public override missingRequirement(game: unknown): boolean {
    let m = false;
    if (this.groupElementConditionFn) m = m || ((this.groupElementConditionFn as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    if (this.groupCondition) m = m || ((this.groupCondition as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    return m;
  }

  public override willCrash(game: unknown): boolean {
    let wc = false;
    if (this.groupElementConditionFn) wc = wc || ((this.groupElementConditionFn as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    if (this.groupCondition) wc = wc || ((this.groupCondition as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    return wc;
  }

  public override toString(): string { return "AllGroups()"; }

  public override toEnglish(game: unknown): string {
    const en = (this.groupCondition as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.groupCondition);
    return "all groups satisfy the condition " + en;
  }
}

// ---------------------------------------------------------------------------
// AllValues — sub-implementation
// @java game/functions/booleans/all/values/AllValues.java
// ---------------------------------------------------------------------------

class AllValues extends BaseBooleanFunction {
  /** @java AllValues.array */
  private readonly array: IntArrayFunction;
  /** @java AllValues.condition */
  private readonly condition: BooleanFunction;

  public constructor(array: IntArrayFunction, If: BooleanFunction) {
    super();
    this.array = array;
    this.condition = If;
  }

  /**
   * @java AllValues.eval(Context)
   *
   * Returns true if all values in the array satisfy the condition.
   */
  public override eval(context: Context): boolean {
    const values = this.array.eval(context);
    const originValue = context._evalValue;
    for (const v of values) {
      context._evalValue = v;
      if (!this.condition.eval(context)) {
        context._evalValue = originValue;
        return false;
      }
    }
    context._evalValue = originValue;
    return true;
  }

  public override isStatic(): boolean {
    const ci = (this.condition as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    const ai = (this.array as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    return ci && ai;
  }

  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    const cc = (this.condition as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
    if (cc) for (const v of cc) concepts.add(v);
    const ac = (this.array as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
    if (ac) for (const v of ac) concepts.add(v);
    return concepts;
  }

  public override writesEvalContextRecursive(): Set<number> {
    const ws = new Set<number>();
    ws.add(6); // EvalContextData.Value
    const cw = (this.condition as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
    if (cw) for (const v of cw) ws.add(v);
    const aw = (this.array as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
    if (aw) for (const v of aw) ws.add(v);
    return ws;
  }

  public override readsEvalContextRecursive(): Set<number> {
    const rs = new Set<number>();
    const cr = (this.condition as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
    if (cr) for (const v of cr) rs.add(v);
    const ar = (this.array as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
    if (ar) for (const v of ar) rs.add(v);
    return rs;
  }

  public override preprocess(game: unknown): void {
    (this.condition as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    (this.array as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
  }

  public override missingRequirement(game: unknown): boolean {
    let m = false;
    m = m || ((this.array as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    m = m || ((this.condition as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    return m;
  }

  public override willCrash(game: unknown): boolean {
    let wc = false;
    wc = wc || ((this.array as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    wc = wc || ((this.condition as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    return wc;
  }

  public override toEnglish(game: unknown): string {
    const aEn = (this.array as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.array);
    const cEn = (this.condition as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.condition);
    return "all values in " + aEn + " satisfy the condition " + cEn;
  }
}

// ---------------------------------------------------------------------------
// AllSites — sub-implementation
// @java game/functions/booleans/all/sites/AllSites.java
// ---------------------------------------------------------------------------

class AllSites extends BaseBooleanFunction {
  /** @java AllSites.region */
  private readonly region: RegionFunction;
  /** @java AllSites.condition */
  private readonly condition: BooleanFunction;

  public constructor(region: RegionFunction, If: BooleanFunction) {
    super();
    this.region = region;
    this.condition = If;
  }

  /**
   * @java AllSites.eval(Context)
   *
   * Returns true if all sites in the region satisfy the condition.
   */
  public override eval(context: Context): boolean {
    const sites = this.region.eval(context);
    const originSiteValue = context._evalSite;
    for (const site of sites) {
      context._evalSite = site;
      if (!this.condition.eval(context)) {
        context._evalSite = originSiteValue;
        return false;
      }
    }
    context._evalSite = originSiteValue;
    return true;
  }

  public override isStatic(): boolean {
    const ci = (this.condition as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    const ri = (this.region as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    return ci && ri;
  }

  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    const cc = (this.condition as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
    if (cc) for (const v of cc) concepts.add(v);
    const rc = (this.region as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
    if (rc) for (const v of rc) concepts.add(v);
    return concepts;
  }

  public override writesEvalContextRecursive(): Set<number> {
    const ws = new Set<number>();
    ws.add(7); // EvalContextData.Site
    const cw = (this.condition as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
    if (cw) for (const v of cw) ws.add(v);
    const rw = (this.region as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
    if (rw) for (const v of rw) ws.add(v);
    return ws;
  }

  public override readsEvalContextRecursive(): Set<number> {
    const rs = new Set<number>();
    const cr = (this.condition as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
    if (cr) for (const v of cr) rs.add(v);
    const rr = (this.region as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
    if (rr) for (const v of rr) rs.add(v);
    return rs;
  }

  public override preprocess(game: unknown): void {
    (this.condition as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    (this.region as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
  }

  public override missingRequirement(game: unknown): boolean {
    let m = false;
    m = m || ((this.region as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    m = m || ((this.condition as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    return m;
  }

  public override willCrash(game: unknown): boolean {
    let wc = false;
    wc = wc || ((this.region as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    wc = wc || ((this.condition as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    return wc;
  }

  public override toEnglish(game: unknown): string {
    const rEn = (this.region as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.region);
    const cEn = (this.condition as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.condition);
    return "all sites in " + rEn + " satisfy the condition " + cEn;
  }
}

// ---------------------------------------------------------------------------
// AllDifferent — sub-implementation
// @java game/functions/booleans/all/sites/AllDifferent.java
// ---------------------------------------------------------------------------

class AllDifferent extends BaseBooleanFunction {
  /** @java AllDifferent.region */
  private readonly region: RegionFunction;
  /** @java AllDifferent.condition */
  private readonly condition: BooleanFunction;

  public constructor(region: RegionFunction, If: BooleanFunction) {
    super();
    this.region = region;
    this.condition = If;
  }

  /**
   * @java AllDifferent.eval(Context)
   *
   * Returns true if all sites are different AND each satisfies the condition.
   */
  public override eval(context: Context): boolean {
    const sites = this.region.eval(context);
    const originSiteValue = context._evalSite;

    const ctx = context as unknown as {
      containerState?: (cid: number) => {
        what?: (idx: number, type: string) => number;
      };
      board?: () => { defaultSite?: () => string };
    };

    const boardCtx = typeof ctx.board === "function" ? ctx.board() : null;
    const type = boardCtx && typeof boardCtx.defaultSite === "function"
      ? boardCtx.defaultSite()
      : "Cell";
    const cs = typeof ctx.containerState === "function" ? ctx.containerState(0) : null;

    const whats: number[] = [];

    for (const site of sites) {
      context._evalSite = site;
      if (!this.condition.eval(context)) {
        context._evalSite = originSiteValue;
        return false;
      } else {
        const what = cs && typeof cs.what === "function" ? cs.what(site, type as string) : 0;
        if (whats.includes(what)) {
          context._evalSite = originSiteValue;
          return false;
        } else {
          whats.push(what);
        }
      }
    }

    context._evalSite = originSiteValue;
    return true;
  }

  public override isStatic(): boolean {
    const ci = (this.condition as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    const ri = (this.region as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
    return ci && ri;
  }

  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    const cc = (this.condition as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
    if (cc) for (const v of cc) concepts.add(v);
    const rc = (this.region as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
    if (rc) for (const v of rc) concepts.add(v);
    return concepts;
  }

  public override writesEvalContextRecursive(): Set<number> {
    const ws = new Set<number>();
    ws.add(7); // EvalContextData.Site
    const cw = (this.condition as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
    if (cw) for (const v of cw) ws.add(v);
    const rw = (this.region as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
    if (rw) for (const v of rw) ws.add(v);
    return ws;
  }

  public override readsEvalContextRecursive(): Set<number> {
    const rs = new Set<number>();
    const cr = (this.condition as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
    if (cr) for (const v of cr) rs.add(v);
    const rr = (this.region as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
    if (rr) for (const v of rr) rs.add(v);
    return rs;
  }

  public override preprocess(game: unknown): void {
    (this.condition as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    (this.region as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
  }

  public override missingRequirement(game: unknown): boolean {
    let m = false;
    m = m || ((this.region as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    m = m || ((this.condition as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    return m;
  }

  public override willCrash(game: unknown): boolean {
    let wc = false;
    wc = wc || ((this.region as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    wc = wc || ((this.condition as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    return wc;
  }

  public override toEnglish(game: unknown): string {
    const rEn = (this.region as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.region);
    const cEn = (this.condition as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.condition);
    return "all sites in " + rEn + " have different results for the condition " + cEn;
  }
}

// ---------------------------------------------------------------------------
// AllDiceUsed — sub-implementation
// @java game/functions/booleans/all/simple/AllDiceUsed.java
// ---------------------------------------------------------------------------

class AllDiceUsed extends BaseBooleanFunction {
  public constructor() { super(); }

  /**
   * @java AllDiceUsed.eval(Context)
   *
   * Returns true if all dice values are 0 (all used).
   */
  public override eval(context: Context): boolean {
    // Java: final int[][] diceValues = context.state().currentDice();
    const state = context.state as unknown as {
      currentDice?: () => number[][];
      diceValues?: readonly number[];
    };
    // Engine state carries a flat diceValues array (@java currentDice() is the
    // per-hand nested form) — read whichever is present.
    const diceValues = typeof state.currentDice === "function"
      ? state.currentDice()
      : Array.isArray(state.diceValues) ? [ [...state.diceValues] ] : [];
    for (let indexHand = 0; indexHand < diceValues.length; indexHand++) {
      const hand = diceValues[indexHand] ?? [];
      for (let indexDie = 0; indexDie < hand.length; indexDie++) {
        if ((hand[indexDie] ?? 0) !== 0) return false;
      }
    }
    return true;
  }

  public override isStatic(): boolean { return false; }
  public override toString(): string { return "AllDiceUsed()"; }
  public override toEnglish(_game: unknown): string { return "all dice have been used"; }

  public override missingRequirement(game: unknown): boolean {
    const g = game as unknown as {
      hasHandDice?: () => boolean;
      addRequirementToReport?: (s: string) => void;
    };
    if (typeof g.hasHandDice === "function" && !g.hasHandDice()) {
      if (typeof g.addRequirementToReport === "function") {
        g.addRequirementToReport("The ludeme (all DiceUsed) is used but the equipment has no dice.");
      }
      return true;
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// AllPassed — sub-implementation
// @java game/functions/booleans/all/simple/AllPassed.java
// ---------------------------------------------------------------------------

class AllPassed extends BaseBooleanFunction {
  public constructor() {
    super();
    // @java AllPassed.java:71 — gameFlags() = GameType.NotAllPass, UNCONDITIONAL.
    // The game tests all-passed itself, so the engine's all-pass-draw fallback
    // must never fire (Bechi's between-rounds all-pass drew instead of playing
    // round 2). The standalone AllPassed.ts already sets this; this inner class
    // is the one All.constructSimple actually builds for (all Passed).
    compileFlags.usesUnconditionalNotAllPass = true;
  }

  /**
   * @java AllPassed.eval(Context)
   *
   * Returns true if all players have passed and enough moves have been played.
   */
  public override eval(context: Context): boolean {
    // Java: if (context.trial().moveNumber() < context.game().players().count()) return false;
    const trial = context.trial as unknown as { moveNumber?: () => number; moves?: readonly unknown[] };
    const moveNumber = typeof trial.moveNumber === "function" ? trial.moveNumber() : (trial.moves?.length ?? 0);
    const ctxAny = context as unknown as {
      getGame?: () => { players?: () => { count?: () => number }; numPlayers?: number };
      game?: { players?: () => { count?: () => number }; numPlayers?: number };
    };
    const game = ctxAny.getGame?.() ?? ctxAny.game;
    const playerCount = game?.players?.()?.count?.() ?? game?.numPlayers ?? context.game.numPlayers;
    if (moveNumber < playerCount) return false;
    // Java: return context.allPass();
    const ctx = context as unknown as { allPass?: () => boolean };
    return typeof ctx.allPass === "function" ? ctx.allPass() : false;
  }

  public override isStatic(): boolean { return false; }
  public override toString(): string { return "AllPass()"; }
  public override toEnglish(_game: unknown): string { return "all players have passed"; }
}

// ---------------------------------------------------------------------------
// AllDiceEqual — sub-implementation
// @java game/functions/booleans/all/simple/AllDiceEqual.java
// ---------------------------------------------------------------------------

class AllDiceEqual extends BaseBooleanFunction {
  public constructor() { super(); }

  /**
   * @java AllDiceEqual.eval(Context)
   *
   * Returns true if all dice are equal.
   */
  public override eval(context: Context): boolean {
    // @java AllDiceEqual.java — return context.state().isDiceAllEqual();
    // The engine State carries the flag as the `diceAllEqual` property,
    // written by ActionSetDiceAllEqual (recorded as SetDiceAllEqual).
    const state = context.state as unknown as { isDiceAllEqual?: () => boolean; diceAllEqual?: boolean };
    if (typeof state.isDiceAllEqual === "function") return state.isDiceAllEqual();
    return state.diceAllEqual ?? false;
  }

  public override isStatic(): boolean { return false; }
  public override toString(): string { return "AllDiceEqual()"; }
  public override toEnglish(_game: unknown): string { return "all dice show equal values"; }

  public override missingRequirement(game: unknown): boolean {
    const g = game as unknown as {
      hasHandDice?: () => boolean;
      addRequirementToReport?: (s: string) => void;
    };
    if (typeof g.hasHandDice === "function" && !g.hasHandDice()) {
      if (typeof g.addRequirementToReport === "function") {
        g.addRequirementToReport("The ludeme (all DiceEqual) is used but the equipment has no dice.");
      }
      return true;
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// All — top-level dispatcher
// @java game/functions/booleans/all/All.java
// ---------------------------------------------------------------------------

/**
 * Returns whether all aspects of the specified query are true.
 * Acts as a factory (static construct() methods) dispatching to sub-classes.
 *
 * @java game/functions/booleans/all/All.java
 */
export class All extends BaseBooleanFunction {
  /**
   * @java All.construct(AllGroupsType, SiteType, Direction, BooleanFunction, BooleanFunction)
   *
   * For checking a condition in each group of the board.
   */
  public static constructGroups(
    allType: AllGroupsType,
    type: string | null,
    directions: unknown | null,
    of: BooleanFunction | null,
    If: BooleanFunction,
  ): BooleanFunction {
    switch (allType) {
      case AllGroupsType.Groups:
        return new AllGroups(type, directions, of, If);
      default:
        throw new Error("All(): A AllGroupsType is not implemented.");
    }
  }

  /**
   * @java All.construct(AllValuesType, IntArrayFunction, BooleanFunction)
   *
   * For checking a condition in each value of an integer array.
   */
  public static constructValues(
    allType: AllValuesType,
    array: IntArrayFunction,
    If: BooleanFunction,
  ): BooleanFunction {
    switch (allType) {
      case AllValuesType.Values:
        return new AllValues(array, If);
      default:
        throw new Error("All(): A AllValuesType is not implemented.");
    }
  }

  /**
   * @java All.construct(AllSitesType, RegionFunction, BooleanFunction)
   *
   * For checking a condition in each site of a region.
   */
  public static constructSites(
    allType: AllSitesType,
    region: RegionFunction,
    If: BooleanFunction,
  ): BooleanFunction {
    switch (allType) {
      case AllSitesType.Sites:
        return new AllSites(region, If);
      case AllSitesType.Different:
        return new AllDifferent(region, If);
      default:
        throw new Error("All(): A AllSitesType is not implemented.");
    }
  }

  /**
   * @java All.construct(AllSimpleType)
   *
   * For a test with no parameter.
   */
  public static constructSimple(allType: AllSimpleType): BooleanFunction {
    switch (allType) {
      case AllSimpleType.DiceUsed:
        return new AllDiceUsed();
      case AllSimpleType.Passed:
        return new AllPassed();
      case AllSimpleType.DiceEqual:
        return new AllDiceEqual();
      default:
        throw new Error("All(): A AllSimpleType is not implemented.");
    }
  }

  // ---- instance (should never be called directly) --------------------------

  private constructor() {
    super();
  }

  /** @java All.eval(Context) — Should never be called directly. */
  public override eval(_context: Context): boolean {
    throw new Error("All.eval(): Should never be called directly.");
  }

  /** @java All.isStatic() */
  public override isStatic(): boolean { return false; }

  /** @java All.gameFlags(Game) */
  public override gameFlags(_game: unknown): number { return 0; }

  /** @java All.preprocess(Game) */
  public override preprocess(_game: unknown): void { /* nothing */ }

  /** @java All.toEnglish(Game) */
  public override toEnglish(_game: unknown): string {
    return "all of the following is true:";
  }
}
