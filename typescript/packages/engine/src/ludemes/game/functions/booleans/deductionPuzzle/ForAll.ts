// @java Core/src/game/functions/booleans/deductionPuzzle/ForAll.java

/**
 * Returns true if the constraint is satisfied for each element.
 *
 * @java game/functions/booleans/deductionPuzzle/ForAll.java
 * @author Eric.Piette
 * @remarks This is used to test a constraint on each vertex, edge, face or site
 *          with a hint. This works only for deduction puzzles.
 */

import type { Context } from "../../../../../context.js";
import { BaseBooleanFunction } from "../BaseBooleanFunction.js";
import type { BooleanFunction, IntFunction } from "../../../../base.js";
import { IntConstant } from "../../ints/IntConstant.js";
import { SitesCustom } from "../../region/sites/custom/SitesCustom.js";
import type { PuzzleElementType } from "../../../types/board/PuzzleElementType.js";

/**
 * Returns true if the constraint is satisfied for each element.
 *
 * @java game/functions/booleans/deductionPuzzle/ForAll.java
 */
export class ForAll extends BaseBooleanFunction {
  /** @java ForAll.type — Which type. */
  private readonly type: PuzzleElementType;

  /** @java ForAll.constraint — Constraint to satisfy. */
  private readonly constraint: BooleanFunction;

  /**
   * @param type       The type of the graph element.
   * @param constraint The constraint to check.
   * @java ForAll(PuzzleElementType, BooleanFunction)
   */
  public constructor(type: PuzzleElementType, constraint: BooleanFunction) {
    super();
    this.type = type;
    this.constraint = constraint;
  }

  /**
   * @java ForAll.eval(Context)
   *
   * Returns true if the constraint is satisfied for each element of the given type.
   */
  public override eval(context: Context): boolean {
    // Escape-hatch typed context API
    const ctx = context as unknown as {
      to?: () => number;
      from?: () => number;
      hint?: () => number;
      edge?: () => number;
      setTo?: (v: number) => void;
      setFrom?: (v: number) => void;
      setHint?: (v: number) => void;
      setEdge?: (v: number) => void;
      setHintRegion?: (region: unknown) => void;
      topology?: () => {
        getGraphElements?: (type: string) => Array<{ index?: () => number }>;
      };
      game?: () => {
        equipment?: () => {
          withHints?: (site: number) => number[][];
          hints?: (site: number) => (number | null)[];
        };
        board?: () => { defaultSite?: () => number };
      };
      board?: () => { defaultSite?: () => number };
      state?: () => {
        containerStates?: () => Array<{
          isResolvedEdges?: (idx: number) => boolean;
          whatEdge?: (idx: number) => number;
        }>;
      };
    };

    const saveTo = typeof ctx.to === "function" ? ctx.to() : -1;
    const saveFrom = typeof ctx.from === "function" ? ctx.from() : -1;
    const saveHint = typeof ctx.hint === "function" ? ctx.hint() : -1;
    const saveEdge = typeof ctx.edge === "function" ? ctx.edge() : -1;

    const restoreContext = (): void => {
      if (typeof ctx.setHint === "function") ctx.setHint(saveHint);
      if (typeof ctx.setEdge === "function") ctx.setEdge(saveEdge);
      if (typeof ctx.setTo === "function") ctx.setTo(saveTo);
      if (typeof ctx.setFrom === "function") ctx.setFrom(saveFrom);
    };

    if (this.type !== "Hint") {
      // Java: final List<? extends TopologyElement> elements = context.topology().getGraphElements(PuzzleElementType.convert(type));
      const topology = typeof ctx.topology === "function" ? ctx.topology() : null;
      const elements = (topology && typeof topology.getGraphElements === "function")
        ? topology.getGraphElements(this.type)
        : [];

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!element) continue;
        const idx = typeof element.index === "function" ? element.index() : i;
        if (typeof ctx.setFrom === "function") ctx.setFrom(idx);
        if (!this.constraint.eval(context)) {
          restoreContext();
          return false;
        }
      }
    } else {
      // Hint type
      // Java: final Integer[][] regions = context.game().equipment().withHints(context.board().defaultSite());
      // Java: final Integer[] hints = context.game().equipment().hints(context.board().defaultSite());
      const gameCtx = typeof ctx.game === "function" ? ctx.game() : null;
      const equipment = gameCtx && typeof gameCtx.equipment === "function" ? gameCtx.equipment() : null;

      const boardCtx = typeof ctx.board === "function"
        ? ctx.board()
        : (gameCtx && typeof gameCtx.board === "function" ? gameCtx.board() : null);
      const defaultSite = boardCtx && typeof boardCtx.defaultSite === "function"
        ? boardCtx.defaultSite()
        : 0;

      const regions: number[][] = (equipment && typeof equipment.withHints === "function")
        ? equipment.withHints(defaultSite) as unknown as number[][]
        : [];
      const hints: (number | null)[] = (equipment && typeof equipment.hints === "function")
        ? equipment.hints(defaultSite)
        : [];

      const size = Math.min(regions.length, hints.length);

      const stateCtx = typeof ctx.state === "function" ? ctx.state() : null;
      const containerStates = stateCtx && typeof stateCtx.containerStates === "function"
        ? stateCtx.containerStates()
        : [];
      const ps = containerStates[0] ?? null;

      for (let i = 0; i < size; i++) {
        const regionI = regions[i] ?? [];
        const hintI = hints[i] ?? null;

        // Java: We compute the number of edges with hints
        let nbEdges = 0;
        let allEdgesSet = true;

        for (let j = 0; j < regionI.length; j++) {
          nbEdges = 0;
          const indexVertex = regionI[j]!;

          if (ps) {
            // Java: edges = context.game().board().topology().edges();
            // We use a simplified approach via topology
            const topology = typeof ctx.topology === "function" ? ctx.topology() : null;
            // We can't enumerate edges directly without the full topology API,
            // so use escape-hatch
            const edges = (topology as unknown as { edges?: () => Array<{
              containsVertex?: (v: number) => boolean;
            }> })?.edges?.() ?? [];

            for (let indexEdge = 0; indexEdge < edges.length; indexEdge++) {
              const edge = edges[indexEdge];
              if (!edge) continue;
              if (typeof edge.containsVertex === "function" && edge.containsVertex(indexVertex)) {
                if (ps.isResolvedEdges && ps.isResolvedEdges(indexEdge)) {
                  nbEdges += (ps.whatEdge ? ps.whatEdge(indexEdge) : 0);
                } else {
                  allEdgesSet = false;
                }
              }
            }
          }
        }

        // Java: if (!allEdgesSet && hints[i] != null && nbEdges < hints[i].intValue())
        //         context.setEdge(hints[i].intValue());
        //       else context.setEdge(nbEdges);
        if (!allEdgesSet && hintI !== null && nbEdges < hintI) {
          if (typeof ctx.setEdge === "function") ctx.setEdge(hintI);
        } else {
          if (typeof ctx.setEdge === "function") ctx.setEdge(nbEdges);
        }

        if (regionI.length > 0) {
          if (typeof ctx.setFrom === "function") ctx.setFrom(regionI[0]!);
        }
        if (regionI.length > 1) {
          if (typeof ctx.setTo === "function") ctx.setTo(regionI[1]!);
        }
        if (hintI !== null) {
          if (typeof ctx.setHint === "function") ctx.setHint(hintI);
        }

        // Java: final IntFunction[] setFn = new IntFunction[regions.length];
        //       for (int h = 0; h < regions[i].length; h++) setFn[h] = new IntConstant(regions[i][h]);
        //       context.setHintRegion(new SitesCustom(setFn));
        const setFn: IntFunction[] = [];
        for (let h = 0; h < regionI.length; h++) {
          setFn.push(new IntConstant(regionI[h]!));
        }

        // SitesCustom expects an IntArrayFunction — IntConstant[] needs to be
        // wrapped into an IntArrayFunction that evaluates each element.
        const intArrayFn = {
          eval(ctx2: Context): number[] {
            return setFn.map(fn => fn.eval(ctx2));
          },
        };
        if (typeof ctx.setHintRegion === "function") {
          ctx.setHintRegion(new SitesCustom(intArrayFn));
        }

        if (!this.constraint.eval(context)) {
          restoreContext();
          return false;
        }
      }
    }

    restoreContext();
    return true;
  }

  /** @java ForAll.isStatic() */
  public override isStatic(): boolean {
    return (this.constraint as unknown as { isStatic?: () => boolean }).isStatic?.() ?? false;
  }

  /** @java ForAll.preprocess(Game) */
  public override preprocess(game: unknown): void {
    if (this.constraint !== null) {
      (this.constraint as unknown as { preprocess?: (g: unknown) => void }).preprocess?.(game);
    }
  }

  /** @java ForAll.gameFlags(Game) */
  public override gameFlags(game: unknown): number {
    // Java: long gameFlags = GameType.DeductionPuzzle; if (constraint != null) gameFlags |= ...
    let gameFlags = 0;
    if (this.constraint !== null) {
      gameFlags |= (this.constraint as unknown as { gameFlags?: (g: unknown) => number }).gameFlags?.(game) ?? 0;
    }
    return gameFlags;
  }

  /** @java ForAll.concepts(Game) */
  public override concepts(game: unknown): Set<number> {
    const concepts = new Set<number>();
    // Java: concepts.set(Concept.DeductionPuzzle.id(), true);
    if (this.constraint !== null) {
      const cc = (this.constraint as unknown as { concepts?: (g: unknown) => Set<number> }).concepts?.(game);
      if (cc) for (const v of cc) concepts.add(v);
    }
    return concepts;
  }

  /** @java ForAll.writesEvalContextRecursive() */
  public override writesEvalContextRecursive(): Set<number> {
    const ws = new Set<number>();
    // Java: writeEvalContext.set(EvalContextData.Hint.id(), true); ... To, From, Edge, HintRegion
    // We use placeholder IDs for the write-context data
    ws.add(4); // EvalContextData.Hint
    ws.add(5); // EvalContextData.HintRegion
    ws.add(2); // EvalContextData.Edge
    ws.add(1); // EvalContextData.To
    ws.add(0); // EvalContextData.From
    if (this.constraint !== null) {
      const cw = (this.constraint as unknown as { writesEvalContextRecursive?: () => Set<number> }).writesEvalContextRecursive?.();
      if (cw) for (const v of cw) ws.add(v);
    }
    return ws;
  }

  /** @java ForAll.readsEvalContextRecursive() */
  public override readsEvalContextRecursive(): Set<number> {
    const rs = new Set<number>();
    const baseRs = super.readsEvalContextRecursive();
    for (const v of baseRs) rs.add(v);
    if (this.constraint !== null) {
      const cr = (this.constraint as unknown as { readsEvalContextRecursive?: () => Set<number> }).readsEvalContextRecursive?.();
      if (cr) for (const v of cr) rs.add(v);
    }
    return rs;
  }

  /** @java ForAll.missingRequirement(Game) */
  public override missingRequirement(game: unknown): boolean {
    let missingRequirement = false;
    missingRequirement = missingRequirement || super.missingRequirement(game);
    if (this.constraint !== null) {
      missingRequirement = missingRequirement || ((this.constraint as unknown as { missingRequirement?: (g: unknown) => boolean }).missingRequirement?.(game) ?? false);
    }
    return missingRequirement;
  }

  /** @java ForAll.willCrash(Game) */
  public override willCrash(game: unknown): boolean {
    let willCrash = false;
    // Java: if (game.players().count() != 1) { report; willCrash = true; }
    const g = game as unknown as {
      players?: () => { count?: () => number };
      addCrashToReport?: (s: string) => void;
    };
    if (typeof g.players === "function") {
      const playersObj = g.players();
      const count = typeof playersObj.count === "function" ? (playersObj as unknown as { count: () => number }).count() : 1;
      if (count !== 1) {
        if (typeof g.addCrashToReport === "function") {
          g.addCrashToReport("The ludeme (forAll ...) is used but the number of players is not 1.");
        }
        willCrash = true;
      }
    }
    willCrash = willCrash || super.willCrash(game);
    if (this.constraint !== null) {
      willCrash = willCrash || ((this.constraint as unknown as { willCrash?: (g: unknown) => boolean }).willCrash?.(game) ?? false);
    }
    return willCrash;
  }

  /** @java ForAll.type() */
  public getType(): PuzzleElementType {
    return this.type;
  }

  /** @java ForAll.constraint() */
  public getConstraint(): BooleanFunction {
    return this.constraint;
  }

  /** @java ForAll.toString() */
  public override toString(): string {
    return "AllTrue " + this.type + ": " + String(this.constraint);
  }

  /** @java ForAll.toEnglish(Game) */
  public override toEnglish(game: unknown): string {
    const constraintEn = (this.constraint as unknown as { toEnglish?: (g: unknown) => string }).toEnglish?.(game) ?? String(this.constraint);
    // Java: return constraint.toEnglish(game) + " is true for all " + type.name().toLowerCase() + StringRoutines.getPlural(type.name());
    const typeName = this.type.toLowerCase();
    return constraintEn + " is true for all " + typeName + "s";
  }
}
