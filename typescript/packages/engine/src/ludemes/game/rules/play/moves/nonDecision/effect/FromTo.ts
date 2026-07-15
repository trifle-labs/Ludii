// @java Core/src/game/rules/play/moves/nonDecision/effect/FromTo.java
/**
 * Moves a piece from one site to another, possibly in another container, with
 * no direction link between the ``from'' and ``to'' sites.
 *
 * Java parity: game/rules/play/moves/nonDecision/effect/FromTo.java
 *
 * @remarks Coverage-only transliteration. NOT registered in the 1:1 moves registry.
 *          The live path is handled by FromTo1to1.ts.
 */

import type { Context } from "../../../../../../../context.js";
import type { BooleanFunction, IntFunction, MovesFunction, RegionFunction } from "../../../../../../base.js";
import type { Move } from "../../../../../../../move.js";
import { applyPostStateThen, type Then } from "./Then.js";
import { compileFlags } from "../../../../../../../ludii/compiler/compile-flags.js";
import { ActionMove } from "../../../../../../../action/action-move.js";
import { ActionMoveLevelFrom } from "../../../../../../../action/action-move-level.js";
import { ActionCopy } from "../../../../../../../action/action-copy.js";
import { ActionRemove } from "../../../../../../../action/action-remove.js";
import { ActionSetRotation } from "../../../../../../../action/action-set-rotation.js";
import { Move as LudiiMove, type DeferredThen } from "../../../../../../../move.js";
import { Add as AddEffect } from "./Add.js";
import { isNonDefaultTyped } from "../../../../../functions/region/sites/index/SitesEmpty.js";
import type { RotationsLike } from "../../../../../util/moves/To.js";

/** OFF constant matching Java's Constants.OFF = -1 */
const OFF = -1;
const UNDEFINED_LEVEL = -2;

export class FromTo implements MovesFunction {
  /** @java FromTo.locFrom */
  private readonly locFrom: IntFunction | null;
  /** @java FromTo.levelFrom */
  private readonly levelFrom: IntFunction | null;
  /** @java FromTo.countFn */
  private readonly countFn: IntFunction | null;

  /** @java From.type() — explicit (from Cell ...) declaration. */
  private readonly declaredFromType: string | null;
  /** @java To.type() — explicit (to Edge/Vertex ...) declaration (typeTo). */
  private readonly declaredToType: string | null;
  /** @java FromTo.locTo */
  private readonly locTo: IntFunction;
  /** @java FromTo.levelTo */
  private readonly levelTo: IntFunction | null;
  /** @java FromTo.rotationTo — To.rotations(), consumed only when non-null
   *  (FromTo.java:396-406): fans one candidate move out per (site, rotation). */
  private readonly rotationsTo: RotationsLike | null;
  /** @java FromTo.regionFrom */
  private readonly regionFrom: RegionFunction | null;
  /** @java FromTo.regionTo */
  private readonly regionTo: RegionFunction | null;
  /** @java FromTo.fromCondition */
  private readonly fromCondition: BooleanFunction | null;
  /** @java FromTo.moveRule */
  private readonly moveRule: BooleanFunction | null;
  /** @java FromTo.captureRule */
  private readonly captureRule: BooleanFunction | null;
  /** @java FromTo.captureEffect */
  private readonly captureEffect: MovesFunction | null;
  /** @java FromTo.stack */
  private readonly stack: boolean;
  /** @java FromTo.copy */
  private readonly copy: BooleanFunction;
  /** @java Effect.then */
  private readonly thenClause: Then | null;

  /**
   * @java game/rules/play/moves/nonDecision/effect/FromTo.java — constructor
   */
  public constructor(opts: {
    locFrom?: IntFunction | null;
    levelFrom?: IntFunction | null;
    countFn?: IntFunction | null;
    declaredFromType?: string | null;
    declaredToType?: string | null;
    locTo: IntFunction;
    levelTo?: IntFunction | null;
    rotations?: RotationsLike | null;
    regionFrom?: RegionFunction | null;
    regionTo?: RegionFunction | null;
    fromCondition?: BooleanFunction | null;
    moveRule?: BooleanFunction | null;
    captureRule?: BooleanFunction | null;
    captureEffect?: MovesFunction | null;
    stack?: boolean;
    copy?: BooleanFunction;
    then?: Then | null;
  }) {
    this.locFrom = opts.locFrom ?? null;
    this.levelFrom = opts.levelFrom ?? null;
    this.countFn = opts.countFn ?? null;
    this.declaredFromType = opts.declaredFromType ?? null;
    this.declaredToType = opts.declaredToType ?? null;
    this.locTo = opts.locTo;
    this.levelTo = opts.levelTo ?? null;
    this.rotationsTo = opts.rotations ?? null;
    this.regionFrom = opts.regionFrom ?? null;
    this.regionTo = opts.regionTo ?? null;
    // Raw-literal trap: lud True/False reach these BooleanFunction slots raw
    // (Pachih's (fromTo ... if:True) threw `this.moveRule.eval is not a
    // function` at ply 0). Wrap with the standard typeof guard.
    const wrapBoolFn = (b: unknown): BooleanFunction | null =>
      typeof b === "boolean" ? ({ eval: () => b } as BooleanFunction) : ((b as BooleanFunction | null) ?? null);
    this.fromCondition = wrapBoolFn(opts.fromCondition);
    this.moveRule = wrapBoolFn(opts.moveRule);
    this.captureRule = wrapBoolFn(opts.captureRule);
    this.captureEffect = opts.captureEffect ?? null;
    this.stack = opts.stack ?? false;
    // @java FromTo.java:567-568 — `if (levelFrom != null || stack) gameFlags |=
    // GameType.Stacking`. A level-addressable from-clause (or an explicit
    // stack:True) makes the whole game stacking, so a plain single-piece move
    // landing on an occupied site PUSHES a level rather than overwriting the
    // occupant (ActionMove's state.stackingGame branch). Kawasukuts' Marker move
    // `(move (from (from) level:(level)) (to …))` is the flag's only trigger;
    // without it two markers entering the same gate overwrote (the lower one was
    // lost) and that player then had no piece to race, forcing a spurious Pass.
    if (this.levelFrom !== null || this.stack) compileFlags.usesStacking = true;
    this.copy = opts.copy ?? { eval: () => false };
    this.thenClause = opts.then ?? null;
  }

  /**
   * @java game/rules/play/moves/nonDecision/effect/FromTo.java — eval(Context)
   *
   * Generates moves from each site in the from-region to each site in the to-region,
   * checking conditions and applying capture effects.
   */
  public eval(ctx: Context): Move[] {
    // @java FromTo.java:163 — sitesFrom
    const sitesFrom: number[] = (this.regionFrom != null)
      ? this.regionFrom.eval(ctx)
      : [this.locFrom != null ? this.locFrom.eval(ctx) : ctx._evalFrom];

    const origFrom = ctx._evalFrom;
    const origTo = ctx._evalTo;

    const mover = ctx.state.mover;
    const moves: LudiiMove[] = [];

    for (const from of sitesFrom) {
      if (from <= OFF) continue;

      // @java FromTo.java:186-187 — check source occupancy. Mancala captures
      // use count:N on seed pits, which have counts but no component `what`.
      let hasSource = this.countFn !== null && !this.stack
        ? ctx.state.count(from) > 0
        : ctx.state.what(from) > 0;
      // Dual-SiteType (@java cs.what(from, type)): a piece on a typed channel
      // (Guerrilla's Cell counters) is a valid source too.
      if (!hasSource) {
        const typed = (ctx.state as unknown as { typedSites?: ReadonlyMap<string, { what: readonly number[]; count: readonly number[] }> }).typedSites;
        if (typed) for (const ch of typed.values()) {
          if ((ch.what[from] ?? 0) > 0 || (ch.count[from] ?? 0) > 0) { hasSource = true; break; }
        }
      }
      if (!hasSource) continue;

      ctx._evalFrom = from;

      if (this.fromCondition != null && !this.fromCondition.eval(ctx)) continue;

      const sitesTo: number[] = (this.regionTo != null)
        ? this.regionTo.eval(ctx)
        : [this.locTo.eval(ctx)];

      // @java FromTo.evalLargePiece: when `from` holds a LARGE tile piece (walks),
      // a board→board move must lay the tile's whole footprint at `to` for each
      // valid (anchor, rotation), not just transfer the anchor cell. Mirrors
      // Add.ts's large-piece path. Without this a pentomino move filled only the
      // anchor (Pentomino's (no Moves) end never fired; the L-tile in L Game).
      const lpWhat = ctx.state.whatAtSite(from);
      const largePiece = (ctx.game as unknown as { equipment?: { pieces?: Array<{ index: number; walks?: readonly (readonly string[])[]; isDomino?: () => boolean }> } })
        .equipment?.pieces?.find((p) => p.index === lpWhat && p.walks && p.walks.length > 0);
      if (largePiece?.walks) {
        const walks = largePiece.walks;
        const nbPossibleStates = walks.length * 4;
        // @java FromTo.java:449-486 — a board→board tile move is NOT gated on the
        // footprint being empty. Java (a) computes the piece's CURRENT footprint
        // currentLocs = piece.locs(from, localState) and appends currentLocs[1..]
        // to the candidate to-anchors (newSitesTo), and (b) validates a candidate
        // placement by requiring every footprint cell to land on a to-region site
        // OR on one of the piece's own current cells (or the from-anchor). The old
        // `isEmptySite(loc)` test rejected any orientation whose footprint overlapped
        // the moving L-piece's own cells, dropping valid moves (L Game to=15/to=11).
        const localState = ctx.state.stateAtSite(from);
        const currentLocs = AddEffect.locsLargePiece(ctx, from, localState, walks);
        const newSitesTo = new Set<number>(sitesTo);
        for (let i = 1; i < currentLocs.length; i++) {
          const c = currentLocs[i];
          if (c !== undefined) newSitesTo.add(c);
        }
        // @java largePiece.isDomino() — equipment pieces resolve to plain objects
        // (no isDomino method) for tiles, so this is false and the non-domino test
        // applies; a true Domino would need csTo.isPlayable + trial().moveNumber(),
        // which no board→board domino-move game in scope uses.
        const isDomino = typeof largePiece.isDomino === "function" && largePiece.isDomino();
        for (const to of newSitesTo) {
          if (to <= OFF) continue;
          for (let st = 0; st < nbPossibleStates; st++) {
            const locs = AddEffect.locsLargePiece(ctx, to, st, walks);
            if (locs.length === 0) continue;
            // @java valid iff every footprint cell is a to-site / own-cell / from-anchor.
            let valid = true;
            if (!isDomino) {
              for (const loc of locs) {
                if (!newSitesTo.has(loc) && loc !== from) { valid = false; break; }
              }
            }
            // @java (from != to || localState != state) — skip the identity no-op.
            if (!valid || (from === to && localState === st)) continue;
            // @java ActionMove.applyLargePiece vacates the piece's WHOLE current
            // footprint (currentLocs), not just the anchor, before laying the new
            // footprint — self-overlap is fine (clearing precedes laying). Omitting
            // clearFootprint left the old body cells count=1 (phantom occupancy),
            // which corrupted (sites Empty) on later plies (the earlier regression).
            const action = new ActionMove({ from, to, state: st, footprint: locs, clearFootprint: currentLocs });
            const move = new LudiiMove({
              id: `move:${mover}:${from}:${to}:${st}`,
              label: `Move(${from}->${to},r${st})`,
              siteIndices: [from, to],
              mover,
              placedOwner: mover,
              actions: [action],
              fromSite: from,
              toSite: to,
            });
            // @java FromTo.java:427 — the then clause is applied ONCE for all
            // moves at the end of eval (line ~433 below); applying it here too
            // double-tagged the deferredThens (Morra's copy/large-piece moves
            // scored 2 per hit and (= (score P1) 3) never fired).
            moves.push(move);
          }
        }
        ctx._evalFrom = origFrom;
        continue;
      }

      ctx._evalFrom = origFrom;

      for (const to of sitesTo) {
        if (to <= OFF) continue;

        ctx._evalFrom = from;
        ctx._evalTo = to;

        // @java FromTo.java:365 — check move rule
        if (this.moveRule != null && !this.moveRule.eval(ctx)) {
          ctx._evalFrom = origFrom;
          continue;
        }
        ctx._evalFrom = origFrom;

        // Build the primary move action
        const actions: import("../../../../../../../action/index.js").Action[] = [];
        let moveAction: import("../../../../../../../action/index.js").Action;
        // @java FromTo copy:True -> ActionCopy: place a copy of the source at
        // `to` and leave `from` intact (Odd's (move (from (sites Hand Shared))
        // (to (sites Empty)) copy:True) — a regular ActionMove vacated the
        // shared hand, so the second placement found an empty source).
        const copyOn = (() => { try { return this.copy.eval(ctx); } catch { return false; } })();
        if (copyOn) {
          // @java FromTo.java:396-406 — when the `(to … (rotations …))` clause
          // is present, generation fans out to ONE candidate move PER (site,
          // rotation) pair: the base ActionCopy plus an ActionSetRotation(to,
          // rotation) appended to the SAME move (apply order: copy the tile in,
          // THEN stamp its rotation — matches `moveWithRotation.actions().add(
          // actionRotation)` after the base `move` already carries the copy).
          // Trax is the only ported game exercising this (`(rotations {N E})`
          // / `(rotations Orthogonal)` on its two tile placements, both
          // copy:True); the downstream `(do … ifAfterwards:(is SidesMatch))`
          // wrapper then prunes candidates whose rotation doesn't line up
          // colours with already-placed neighbours (IsSidesMatch.ts reads the
          // same rotationAt channel ActionSetRotation writes via
          // Context.containerState().rotation()). Before this fix, `to.rotations()`
          // was stored on To.ts but never consumed here, so only one
          // un-rotated candidate was ever emitted per site — SidesMatch had no
          // orientation to accept/reject and Trax's move generation diverged
          // from ply 0 of the recorded trial (MOVE_MISMATCH @4, once the
          // un-rotated candidate ran out of legal continuations).
          if (this.rotationsTo != null) {
            const rotations = (this.rotationsTo.eval(ctx) as number[] | undefined) ?? [];
            for (const rotation of rotations) {
              const rotMove = new LudiiMove({
                id: `copy:${mover}:${from}:${to}:r${rotation}`,
                label: `Copy(${from}->${to})+SetRotation(${to}=${rotation})`,
                siteIndices: [from, to],
                mover,
                placedOwner: mover,
                actions: [new ActionCopy(from, to), new ActionSetRotation({ to, rotation })],
                fromSite: from,
                toSite: to,
                fromNonDecisionSite: from,
                toNonDecisionSite: to,
              });
              moves.push(rotMove);
            }
            ctx._evalFrom = origFrom;
            ctx._evalTo = origTo;
            continue;
          }
          actions.push(new ActionCopy(from, to));
          const move = new LudiiMove({
            id: `copy:${mover}:${from}:${to}`,
            label: `Copy(${from}->${to})`,
            siteIndices: [from, to],
            mover,
            placedOwner: mover,
            actions,
            fromSite: from,
            toSite: to,
            fromNonDecisionSite: from,
            toNonDecisionSite: to,
          });
          // @java FromTo.java:427 — then applied once at the end of eval; the
          // inline apply here duplicated Morra's ShowHand deferredThen.
          moves.push(move);
          ctx._evalFrom = origFrom;
          ctx._evalTo = origTo;
          continue;
        }
        // @java MoveUtilities.chainRuleWithAction (MoveUtilities.java:80-121)
        // prepends the capture effect's actions ahead of the mover's own
        // ActionMove, so at APPLY time the capture executes FIRST. If the
        // capture sends the victim BACK ONTO the mover's own `from` site
        // (HittingCapture -> victim's StartingPoint == the mover's current
        // site: Gavalata ply 18, Main Pacheh), a plain top-popping ActionMove
        // chosen below (because `lv` looked like the stack top AT GENERATION
        // TIME) grabs the just-arrived victim instead of the mover's own
        // piece — a silent identity swap surfacing plies later. Precompute
        // the capture (single eval, just moved earlier) so the level-branch
        // decision can see the hazard.
        const captureThens: DeferredThen[] = [];
        let captureActions: import("../../../../../../../action/index.js").Action[] = [];
        if (this.captureEffect != null &&
            (this.captureRule == null || this.captureRule.eval(ctx))) {
          ctx._evalFrom = from;
          ctx._evalTo = to;
          const captureMoves = this.captureEffect.eval(ctx);
          captureActions = captureMoves.flatMap(m => [...m.actions]);
          // @java chainRuleWithAction(..., decision=false)
          for (const a of captureActions) (a as { setDecision?: (d: boolean) => void }).setDecision?.(false);
          // @java chainRuleWithAction also chains the capture effect's then()
          // onto the move's then() list.
          for (const m of captureMoves) for (const dt of m.deferredThens) captureThens.push(dt);
          ctx._evalFrom = origFrom;
          ctx._evalTo = origTo;
        }
        const captureReturnsToFrom = captureActions.some(a => {
          try { return a.to() === from; } catch { return false; }
        });
        if (this.stack && this.levelFrom !== null) {
          // @java FromTo.java:328-340 — when levelFrom is given, Java creates a
          // SINGLE-LEVEL ActionMove(from, levelFrom, to, …, stack=false) even
          // with stack:True; the stack flag only governs whole-stack moves when
          // levelFrom is ABSENT. largeStack mancala sows with
          //   (forEach Value … (fromTo (from site level:(- stackSize value))
          //                              (to …) stack:True))
          // — one seed per value. Treating it as a whole-stack move piled ALL
          // seeds into the first hole (Ceelkoqyuqkoqiji/O An Quan/Laomuzhu/
          // Yucebao diverged from ply 0). Route through ActionMoveLevelFrom,
          // whose count-backed branch moves exactly one seed per call.
          const lv = this.levelFrom.eval(ctx);
          moveAction = new ActionMoveLevelFrom(from, lv, to);
        } else if (this.stack) {
          // @java FromTo.java:346-360 — stackingGame||stack with a count is an
          // ActionSubStackMove(numLevel=count): only the TOP `count` levels
          // relocate (Seesaw's (move ... count:("StackSize" (from)) stack:True)
          // records "StackMove numLevel=1"). Without a count the WHOLE stack
          // moves. The countFn must NOT fall into the mancala transferCount
          // path (state.count(from)=0 on plain pieces killed every capture).
          let numLevel: number | undefined;
          if (this.countFn !== null) {
            const savedFrom = ctx._evalFrom;
            const savedTo = ctx._evalTo;
            ctx._evalFrom = from;
            ctx._evalTo = origTo;
            numLevel = this.countFn.eval(ctx);
            ctx._evalFrom = savedFrom;
            ctx._evalTo = savedTo;
          }
          moveAction = new ActionMove({ from, to, stack: true, numLevel });
        } else if (this.countFn !== null) {
          // @java FromTo.java:189-196 — count evaluates with FROM bound
          // (context.setFrom(from) before countFn.eval): Chisolo's
          // count:(count at:(from)) hand-collection read count 0 with the
          // outer (-1) binding and the capture became a silent no-op.
          const savedFrom = ctx._evalFrom;
          const savedTo = ctx._evalTo;
          ctx._evalFrom = from;
          ctx._evalTo = origTo;
          const count = this.countFn.eval(ctx);
          ctx._evalFrom = savedFrom;
          ctx._evalTo = savedTo;
          // @java the count-move places OWNED pieces (cs.setSite who =
          // component owner). A HAND-sourced placement (T'oki's (move (from
          // (handSite Mover)) (to (sites Empty)) count:2)) must stamp the
          // mover's ownership on the pile or (forEach Piece) never iterates
          // it; pit-to-pit sows/transfers keep the neutral-pit model (Hus).
          const boardSites = (ctx.game as unknown as { equipment?: { board?: { numSites?: number } } }).equipment?.board?.numSites ?? Number.MAX_SAFE_INTEGER;
          let seedOwner = 0;
          if (from >= boardSites) {
            const movedWhat = ctx.state.whats[from] ?? 0;
            const label = (ctx.state.componentLabels[movedWhat] ?? "");
            seedOwner = Number(label.match(/(\d+)$/)?.[1] ?? 0) || 0;
          }
          moveAction = seedOwner > 0
            ? new ActionMove({ from, to, count, transferCount: true, seedOwner })
            : new ActionMove({ from, to, count, transferCount: true });
        } else {
          // @java FromTo with `(from … level:(level))` removes the piece at THAT
          // level (ActionMoveLevelFrom → csFrom.remove(state, from, levelFrom)),
          // not the stack top. The plain ActionMove always pops the top, so a
          // non-top piece (Gyan Chaupar: P2 at level 0 under P3 at level 1 on a
          // shared site) relocated the WRONG piece. Route an explicit, in-range
          // levelFrom through ActionMoveLevelFrom; otherwise (no level / -1) keep
          // the top-pop ActionMove unchanged.
          // Only route through ActionMoveLevelFrom when the level is genuinely
          // NON-TOP (a piece buried under others on a shared site — Gyan
          // Chaupar's P2 at level 0 under P3). When the level IS the stack top
          // (or the site is a single piece), the plain top-popping ActionMove is
          // equivalent and must be kept: it routes through ActionMove's full
          // count-pile/ownedEntries handling that ActionMoveLevelFrom does not
          // replicate (narrowing here avoids regressing Ashta-kashte's top-level
          // level: moves while still fixing Gyan's buried-piece move).
          const lv = this.levelFrom !== null ? this.levelFrom.eval(ctx) : -1;
          const fromStackLen = ctx.state.stacks[from]?.length ?? 0;
          // Require a genuine multi-ENTRY stack (distinct pieces per level), not a
          // count-backed pile (stacks.length<=1 with countAt>1): ActionMoveLevelFrom's
          // count-pile branch differs from plain ActionMove's, which Ashta-kashte's
          // count-backed level: moves rely on. Gyan's buried piece is a true stack.
          // @java FromTo.java:328-343 bakes levelFrom unconditionally when
          // present — Java never falls back to a top-pop. Force the explicit-
          // level path whenever the capture-return hazard is live, even if
          // `lv` looks like the top at generation time: the prepended capture
          // will have re-occupied the top by apply time.
          if (lv >= 0 && (captureReturnsToFrom || (lv < fromStackLen - 1 && fromStackLen > 1))) {
            moveAction = new ActionMoveLevelFrom(from, lv, to);
          } else {
            // Dual-SiteType: stamp the declared types so application routes
            // through the typed channel (gated downstream on channel existence).
            // @java FromTo typeFrom=from.type(), typeTo=to.type() are SEPARATE:
            // Quoridor's wall `(move (from (handSite Mover)) (to Edge …))` has no
            // from-type (Cell hand) but an explicit to-type Edge — the destination
            // must land in the Edge channel, not cells[]. When no to-type is
            // declared, fall back to the from-type so same-type graph moves
            // (Guerrilla Vertex board) are unchanged.
            const dft = this.declaredFromType;
            const dtt = this.declaredToType;
            // @java csTo is the Edge/Vertex ContainerState ONLY when the to-type is
            // a genuinely NON-DEFAULT graph element on this board. On a `use:Vertex`
            // board a `(to Vertex …)` names the DEFAULT element (written to cells[]),
            // so a Cell→Vertex relocation (Guerrilla's hand→Vertex marker) must NOT
            // route to a typed channel. Compute the decision here (apply() has no
            // Context) and pass it as a flag.
            const toNonDefault = isNonDefaultTyped(ctx, dtt);
            // @java hand containers have no addressable per-site level — the
            // signal ActionMoveTopPiece vs ActionMoveLevelFrom dispatch on.
            // See ActionMoveOptions.fromHandSite (Thaayam value identity).
            const boardSites = (ctx.game as unknown as { equipment?: { board?: { numSites?: number } } }).equipment?.board?.numSites ?? Number.MAX_SAFE_INTEGER;
            const fromHandSite = from >= boardSites;
            moveAction = (dft || dtt)
              ? new ActionMove({ from, to, fromType: (dft ?? "Cell") as never, toType: (dtt ?? dft ?? "Cell") as never, toTypedNonDefault: toNonDefault, fromHandSite })
              : new ActionMove({ from, to, fromHandSite });
          }
        }
        actions.push(moveAction);

        // @java FromTo.java:406-414 — capture effect prepended ahead of the
        // mover's own action so it executes FIRST at apply time (Backgammon
        // dec9: the victim's relocation precedes the attacker's move). The
        // eval itself moved above the level-branch decision (see precompute).
        actions.unshift(...captureActions);

        const move = new LudiiMove({
          id: `fromTo:${mover}:${from}:${to}`,
          label: `FromTo(${from}→${to})`,
          siteIndices: [from, to],
          mover,
          placedOwner: mover,
          actions,
          deferredThens: captureThens,
          // Pin the DECISION from/to — a prepended capture action would
          // otherwise shift what from()/to() report (the recorded move keeps
          // the movement's sites: Move:mover=1,from=20,to=25,[victim,attacker]).
          fromSite: from,
          toSite: to,
          fromNonDecisionSite: from,
          toNonDecisionSite: to,
        });
        moves.push(move);
      }
    }

    ctx._evalTo = origTo;
    ctx._evalFrom = origFrom;

    // @java FromTo.java:427 — then clause.
    // Java's Then consequence is evaluated in the POST-MOVE context (Game.applyInternal
    // applies the move's actions, records it on the trial, THEN evaluates `then`), so
    // conditions like (is Line 3) see the just-placed piece. Evaluate per move against
    // a simulated post-state, mirroring Then.java semantics.
    // @java game/rules/play/moves/nonDecision/effect/Then.java — eval in post-move context
    if (this.thenClause != null) {
      return moves.map(m => applyPostStateThen(this.thenClause, ctx, m));
    }

    return moves;
  }

  /** @java FromTo.locFrom() */
  public getLocFrom(): IntFunction | null { return this.locFrom; }
  /** @java FromTo.locTo() */
  public getLocTo(): IntFunction { return this.locTo; }
  /** @java FromTo.regionFrom() */
  public getRegionFrom(): RegionFunction | null { return this.regionFrom; }
  /** @java FromTo.regionTo() */
  public getRegionTo(): RegionFunction | null { return this.regionTo; }
  /** @java FromTo.moveRule() */
  public getMoveRule(): BooleanFunction | null { return this.moveRule; }
}
