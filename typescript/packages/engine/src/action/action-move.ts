// @java Core/src/other/action/move/move/ActionMove.java ActionMove
// @java Core/src/other/action/move/ActionMoveN.java ActionMoveN
/**
 * Java parity:
 * - Core/src/other/action/move/ActionMoveN.java — the "move N pieces
 *   from one site to another" action. (The Java class hierarchy splits
 *   single-piece vs N-piece moves; for the MVE one class handles both
 *   with count=1 as the common case.)
 *
 * Subset ported: deterministic data members (from / to / count /
 * state / rotation / value / level{From,To}) plus the core
 * `apply(state) → state` semantics: the piece at `from` is cleared
 * and re-placed at `to`. Hidden info follows the moving piece on the flat
 * top-piece path; the long tail of stacking/per-die dispatch is deferred.
 */

import { maintainOnTrackIndicesForMove } from "../on-track-indices.js";
import type { State } from "../state.js";
import { ACTION_OFF, BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";
import type { SiteType } from "./site-type.js";

export interface ActionMoveOptions {
  readonly from: number;
  readonly to: number;
  readonly count?: number;
  readonly state?: number;
  readonly rotation?: number;
  readonly value?: number;
  readonly fromType?: SiteType;
  readonly toType?: SiteType;
  /**
   * True when `toType` is a genuinely NON-DEFAULT graph element on this board
   * (Java: csTo is the Edge/Vertex ContainerState, not the flat Cell layer).
   * Computed by the caller via `isNonDefaultTyped(context, toType)` because
   * `apply(state)` has no Context. Gates the cross-type typed-channel write:
   * a Cell→Vertex move on a `use:Vertex` board names the DEFAULT element and
   * must stay in cells[] (Guerrilla marker), whereas a Cell→Edge move on a
   * Cell board is genuinely typed (Quoridor wall).
   */
  readonly toTypedNonDefault?: boolean;
  /**
   * Non-stacking N-seed transfer (Java `ActionMoveN`, FromTo.java 348). When
   * set, `apply` moves `count` seeds from→to by adjusting the per-site counts
   * (mancala model) instead of relocating a single piece. The resulting state
   * is identical to applying two `ActionAddCount`s (−count at `from`, +count at
   * `to`), but a single action keeps `from()`/`to()`/`count()` reporting intact
   * so the move's decision action is matched correctly.
   */
  readonly transferCount?: boolean;
  /** Owner stamped on occupied sites in `transferCount` mode (the seed owner). */
  readonly seedOwner?: number;
  /**
   * Extra cells the relocated large piece covers at `to` beyond the anchor
   * (Java: `ActionMove` + `applyLargePiece`). When set, `apply` clears the
   * single-cell source (a hand site) and lays the piece's whole footprint at
   * `to`, writing the rotation `state` on the anchor — used by from-hand
   * large-piece placement (Pentomino) and board-to-board relocation (L Game).
   */
  readonly footprint?: readonly number[];
  /**
   * Cells the relocated large piece currently covers at `from` and must vacate
   * (Java: the old `Component.locs` cleared before `applyLargePiece` re-lays the
   * new footprint). Used for board-to-board relocation where the piece spans
   * several cells; absent ⇒ only the single `from` cell is cleared (from-hand).
   * The new footprint may legitimately re-cover some of these (self-overlap),
   * so clearing happens before the new footprint is laid.
   */
  readonly clearFootprint?: readonly number[];
  /**
   * Whole-stack relocation (@java other/action/move/move/ActionMoveStacking,
   * dispatched by ActionMove.construct when `stack=true`): every level of the
   * from-stack lands on top of the to-stack in order; `from` is cleared.
   */
  readonly stack?: boolean;
  /**
   * @java ActionSubStackMove.numLevel — move only the TOP numLevel levels of
   * the from-stack (Seesaw's (move ... count:N stack:True) records
   * "StackMove numLevel=N"). Undefined = whole stack.
   */
  readonly numLevel?: number;
  /**
   * True when `from` is a level-less source site (Java: hand/off-board
   * containers have no addressable per-site level, so Game.isStacking()
   * dispatches the level-less ActionMoveTopPiece stacking branch —
   * ActionMoveTopPiece.java:485-498 calls the bare 5-arg addItemGeneric,
   * which never writes a value — ContainerStateStacks.java:278-301).
   * Board-to-board moves carry an explicit level and dispatch through
   * ActionMoveLevelFrom's 8-arg addItemGeneric, which DOES preserve the
   * source value (ActionMoveLevelFrom.java:435-457). In a stacking game
   * this flag replicates the asymmetry: a value set while a piece sits in
   * hand (Thaayam's Counter value=1 identity encoding) is dropped the
   * instant it enters the board, then preserved on every board hop.
   */
  readonly fromHandSite?: boolean;
}

export class ActionMove extends BaseAction {
  public static readonly TYPE: ActionType = "Move";

  private readonly fromIndex: number;
  private readonly toIndex: number;
  private readonly countValue: number;
  private readonly stateValue: number;
  private readonly rotationValue: number;
  private readonly valueValue: number;
  private readonly siteTypeFrom: SiteType;
  private readonly siteTypeTo: SiteType;
  /** True when the constructor received an explicit site type. */
  private readonly explicitTyped: boolean = false;
  private readonly transferCount: boolean;
  private readonly seedOwnerValue: number;
  private readonly footprint: readonly number[];
  private readonly clearFootprint: readonly number[];
  private readonly stackMove: boolean;
  private readonly numLevel: number | undefined;
  /** @see ActionMoveOptions.toTypedNonDefault */
  private readonly toTypedNonDefault: boolean;
  /** @see ActionMoveOptions.fromHandSite */
  private readonly fromHandSite: boolean;

  public constructor(options: ActionMoveOptions) {
    super();
    if (!Number.isInteger(options.from) || options.from < 0) {
      throw new RangeError("ActionMove.from must be a non-negative integer.");
    }
    if (!Number.isInteger(options.to) || options.to < 0) {
      throw new RangeError("ActionMove.to must be a non-negative integer.");
    }
    this.fromIndex = options.from;
    this.toIndex = options.to;
    this.countValue = options.count ?? 1;
    this.stateValue = options.state ?? ACTION_OFF;
    this.rotationValue = options.rotation ?? ACTION_OFF;
    this.valueValue = options.value ?? ACTION_OFF;
    this.siteTypeFrom = options.fromType ?? "Cell";
    this.siteTypeTo = options.toType ?? options.fromType ?? "Cell";
    this.explicitTyped = options.fromType !== undefined;
    this.transferCount = options.transferCount ?? false;
    this.seedOwnerValue = options.seedOwner ?? 0;
    this.footprint = options.footprint ?? [];
    this.clearFootprint = options.clearFootprint ?? [];
    this.stackMove = options.stack ?? false;
    this.numLevel = options.numLevel;
    this.toTypedNonDefault = options.toTypedNonDefault ?? false;
    this.fromHandSite = options.fromHandSite ?? false;
  }

  public override apply(state: State): State {
    // Dual-SiteType (@java per-type ContainerStates): an explicitly typed
    // move whose type has a typed channel operates there (Guerrilla COIN
    // counters stepping on Cells of a Vertex-play board).
    if (this.explicitTyped && state.typedSites.has(this.siteTypeFrom) && this.siteTypeFrom === this.siteTypeTo) {
      const t = this.siteTypeFrom;
      const who = state.whoTyped(t, this.fromIndex);
      const what = state.whatTyped(t, this.fromIndex);
      const count = state.countTyped(t, this.fromIndex);
      if (who === 0 && what === 0) return state;
      let s2 = state.withTypedSite(t, this.fromIndex, 0, 0, 0);
      s2 = s2.withTypedSite(t, this.toIndex, who, what, Math.max(count, 1));
      // @java ActionMoveLevelFrom.java:343-347 — the move carries the source site's
      // STATE to the destination (newStateTo = source.state when no explicit state).
      // (state at:s) reads the flat stateAt[] (shared index space), so this typed-channel
      // path must move it too: Owasokotz stores each Stick's CW/CCW direction as the Edge
      // site state, and dropping it on the move made MadeACompleteCircuit read CCW (0)
      // and fire a false win. Transfer source state to the destination, clear the source.
      const srcState = state.stateAtSite(this.fromIndex);
      if (srcState !== 0) s2 = s2.withStateAt(this.toIndex, srcState);
      if (s2.stateAtSite(this.fromIndex) !== 0) s2 = s2.withStateAt(this.fromIndex, 0);
      // @java ActionMove — Java's setSite carries EVERY piece attribute to the
      // destination (who/what/count/state/rotation/VALUE). The flat valueAt[]
      // shares the typed index space just like stateAt[] above; dropping it
      // left the piece's value at the OLD site (Kawasukuts' Marker carries its
      // starting gate as its value — the stale value at the destination made
      // the circuit-completion check fire a false win at ply 3).
      const srcValue = state.valueAtSite(this.fromIndex);
      if (srcValue !== 0) s2 = s2.withValueAt(this.toIndex, srcValue);
      if (s2.valueAtSite(this.fromIndex) !== 0) s2 = s2.withValueAt(this.fromIndex, 0);
      return s2;
    }
    // @java ActionMoveStacking.java:316-347 — stack=true: append every level
    // of the from-stack (bottom -> top) onto the to-stack, then clear from
    // (removeStackGeneric + addToEmpty). A flat single piece counts as a
    // one-level stack (its owner/what read from the flat channels).
    if (this.stackMove && this.fromIndex !== this.toIndex) {
      const size = state.stackSize(this.fromIndex);
      if (size === 0) return state;
      // @java ActionSubStackMove.apply — a partial move pops the TOP
      // numLevel levels (owned removed per popped top), then pushes them
      // onto `to` preserving their relative order; `sizeStackA < numLevel`
      // is a no-op. Values ride along per level.
      if (this.numLevel !== undefined && this.numLevel < size) {
        if (this.numLevel <= 0 || size < this.numLevel) return state;
        const n = this.numLevel;
        let s2 = state.withOwnedMaterialized();
        const movedOwners: number[] = [];
        const movedWhats: number[] = [];
        const movedValues: number[] = [];
        for (let i = 0; i < n; i++) {
          const topLevel = s2.stackSize(this.fromIndex) - 1;
          const owners = s2.stacks[this.fromIndex] ?? [];
          const whatsRow = s2.whatStacks[this.fromIndex] ?? [];
          const owner = owners[topLevel] ?? s2.cellAt(this.fromIndex).owner;
          const what = whatsRow[topLevel] ?? s2.whatAtSite(this.fromIndex);
          movedOwners.push(owner);
          movedWhats.push(what);
          movedValues.push(s2.valueAtLevel(this.fromIndex, topLevel));
          s2 = s2.withOwnedRemoveLevel(owner, what, this.fromIndex, topLevel);
          s2 = s2.withStackPop(this.fromIndex, topLevel);
        }
        const baseLevelTo = s2.stackSize(this.toIndex);
        const toRowBase: number[] = [];
        for (let l = 0; l < baseLevelTo; l++) toRowBase.push(s2.valueAtLevel(this.toIndex, l));
        // @java push collected-top-first levels in REVERSE — original order.
        for (let i = movedOwners.length - 1; i >= 0; i--) {
          if (movedOwners[i]! <= 0) continue;
          s2 = s2.withStackPush(this.toIndex, movedOwners[i]!, movedWhats[i]!);
          s2 = s2.withOwnedAdd(movedOwners[i]!, movedWhats[i]!, this.toIndex, s2.stackSize(this.toIndex) - 1);
        }
        s2 = s2.withValueStackRow(this.toIndex, [...toRowBase, ...[...movedValues].reverse()]);
        return s2;
      }
      const fromOwners: number[] = [];
      const fromWhats: number[] = [];
      const ownerStack = state.stacks[this.fromIndex] ?? [];
      const whatStack = state.whatStacks[this.fromIndex] ?? [];
      for (let lvl = 0; lvl < size; lvl++) {
        const owner = ownerStack[lvl] ?? state.cellAt(this.fromIndex).owner;
        if (owner <= 0) continue;
        fromOwners.push(owner);
        // Fall back to the site's component index (whatAtSite), NEVER the owner
        // pid: a piece entering from hand has stacks=[owner]/whatStack=[] with
        // whats[site] holding its real component. Pushing the owner as the
        // "what" stored owner numbers in whatStacks[dest], so ForEachPiece's
        // component match later failed and only a pass was generated (Nama,
        // Pachisi, Panchi, Uturu Uturu Kaida). Homogeneous stacks have
        // whatAtSite == owner==comp, so this is unchanged for them; mixed
        // stacks carry an explicit whatStack[lvl] and never hit the fallback.
        fromWhats.push(whatStack[lvl] ?? state.whatAtSite(this.fromIndex));
      }
      // @java OwnedFactory — the level-aware FullOwned registry exists for
      // stacking games; materialize it the moment the game starts stacking.
      let s2 = state.withOwnedMaterialized();
      // @java ActionMoveStacking.java:333-344 — owned: level-less remove of
      // every moved (owner, what) at from...
      for (let i = 0; i < fromOwners.length; i++) {
        s2 = s2.withOwnedRemoveAll(fromOwners[i]!, fromWhats[i]!, this.fromIndex);
      }
      const baseLevelTo = s2.stackSize(this.toIndex);
      // @java ActionMoveStacking carries each level's VALUE to the landing
      // levels (previousValueFrom round-trip); plain pushes do not.
      const fromValues: number[] = [];
      for (let i = 0; i < fromOwners.length; i++) fromValues.push(state.valueAtLevel(this.fromIndex, i));
      const toRowBase: number[] = [];
      for (let l = 0; l < baseLevelTo; l++) toRowBase.push(s2.valueAtLevel(this.toIndex, l));
      for (let i = 0; i < fromOwners.length; i++) {
        s2 = s2.withStackPush(this.toIndex, fromOwners[i]!, fromWhats[i]!);
      }
      s2 = s2.withValueStackRow(this.toIndex, [...toRowBase, ...fromValues]);
      s2 = s2.withValueStackRow(this.fromIndex, []);
      // @java ActionMoveStacking.java:349-360 — ...then add at the landing
      // levels [sizeTo - moved, sizeTo).
      for (let i = 0; i < fromOwners.length; i++) {
        s2 = s2.withOwnedAdd(fromOwners[i]!, fromWhats[i]!, this.toIndex, baseLevelTo + i);
      }
      s2 = s2.withStackRemoveAll(this.fromIndex);
      return s2;
    }
    if (this.footprint.length > 0 || this.clearFootprint.length > 0) {
      // Large-piece relocation (Java: ActionMove → applyLargePiece). Read the
      // piece off its anchor, vacate every cell it currently covers, then lay
      // the whole new footprint at `to`: the anchor carries what/who/state and
      // the remaining covered cells are marked occupied so they leave
      // (sites Empty). A from-hand placement (Pentomino) has no old footprint —
      // only the single `from` source is cleared; a board-to-board move
      // (L Game) clears the piece's full current footprint, which the new one
      // may legitimately re-cover (self-overlap), so clearing precedes laying.
      const movingWhat = state.whatAtSite(this.fromIndex);
      const movingOwner = state.cellAt(this.fromIndex).owner || movingWhat;
      if (movingWhat === 0 && movingOwner === 0) return state;
      let next = state;
      const toClear =
        this.clearFootprint.length > 0 ? this.clearFootprint : [this.fromIndex];
      for (const loc of toClear) {
        if (loc < 0) continue;
        next = next.withCell(loc, 0).withWhatAt(loc, 0);
        if (next.countAtSite(loc) > 0) next = next.withCountAt(loc, 0);
      }
      // The anchor carries who/what/state; every covered cell (anchor included)
      // gets count=1 with no owner — Java applyLargePiece (removeFromEmpty +
      // setCount), matching the from-hand ActionAdd footprint exactly.
      next = next.withCell(this.toIndex, movingOwner).withWhatAt(this.toIndex, movingWhat);
      if (this.stateValue !== ACTION_OFF) {
        next = next.withStateAt(this.toIndex, this.stateValue);
      }
      for (const loc of this.footprint) {
        if (loc >= 0) next = next.withCountAt(loc, 1);
      }
      return next;
    }
    if (this.transferCount) {
      // Non-stacking N-seed transfer (Java ActionMoveN). Mirrors exactly the
      // pair of ActionAddCounts (−count at from, +count at to): adjust each
      // site's seed count and keep `cells` occupancy in sync with the seed
      // owner, leaving `whatAt` untouched (the mancala model never sets it).
      const n = this.countValue;
      let s = state;
      // The receiving pit/site holds the moved component while seeded.
      const movedWhat = state.whats[this.fromIndex] ?? 0;
      // @java ActionMoveN.apply:202-203 — who = components[what].owner(), i.e.
      // the OWNER OF THE MOVED COMPONENT, not a per-move seed owner. The prior
      // port stamped ownership only for hand-sourced sows (seedOwnerValue, left
      // 0 for board-sourced moves), so a board→hand capture — Len Doat sends an
      // enemy Marker to its owner's hand via `(fromTo (from (to)) (to (handSite
      // Next)) count:(count at:(to)))` — dropped the piece's owner and it could
      // never re-enter. Deriving the owner from the component label matches Java
      // and is identical to seedOwnerValue for hand-sourced sows (same parse),
      // so mancala's neutral "Seed" (no owner digit → 0) is unchanged.
      const movedOwner = movedWhat > 0
        ? Number((state.componentLabels[movedWhat] ?? "").match(/(\d+)$/)?.[1] ?? 0) || 0
        : 0;
      const fromNew = Math.max(0, s.countAtSite(this.fromIndex) - n);
      s = s.withCountAt(this.fromIndex, fromNew);
      const fromOwner = fromNew > 0 ? movedOwner : 0;
      if ((s.cells[this.fromIndex] ?? 0) !== fromOwner) {
        s = s.withCell(this.fromIndex, fromOwner);
      }
      // A drained pit loses its Seed component (@java csFrom.remove on count 0)
      // — pits now carry what while seeded; a ghost what would keep
      // (is Occupied …) true on an empty pit (Bao EA relay).
      if (fromNew === 0 && (s.whats[this.fromIndex] ?? 0) !== 0) {
        s = s.withWhatAt(this.fromIndex, 0);
      }
      // @java ActionMoveN.apply line 277 — on count→0 Java calls csFrom.remove,
      // which is setSite(…, 0/*state*/, …): a drained pit also loses its local
      // state marker. Tuz marks owned "tuz" pits via (set State at:(to) Mover);
      // when the end-of-round drain empties such a pit its marker must clear so
      // the next round can sow from it again ((= 0 (state at:site))).
      if (fromNew === 0 && (s.stateAt[this.fromIndex] ?? 0) !== 0) {
        s = s.withStateAt(this.fromIndex, 0);
      }
      const toNew = Math.max(0, s.countAtSite(this.toIndex) + n);
      s = s.withCountAt(this.toIndex, toNew);
      const toOwner = toNew > 0 ? movedOwner : 0;
      if ((s.cells[this.toIndex] ?? 0) !== toOwner) {
        s = s.withCell(this.toIndex, toOwner);
      }
      if (toNew > 0 && movedWhat > 0 && (s.whats[this.toIndex] ?? 0) === 0) {
        s = s.withWhatAt(this.toIndex, movedWhat);
      }
      // @java ActionMoveN.apply lines 297-340 — an N-seed move ALSO maintains
      // onTrackIndices (identically to the single-piece ActionMove). For an
      // internal-loop track game (Len Doat: 3 Markers enter from hand via a
      // `count:(count Cell at:(handSite))` move) the entering pieces must be
      // recorded on the track, else TrackSiteMove's internal-loop lookup reads
      // oti=0 and NextSiteOnTrack returns OFF, forcing a spurious Pass. A no-op
      // for mancala (full-loop tracks allocate no onTrackIndices — the guard in
      // maintainTracks short-circuits when oti is undefined).
      // @java ActionMoveN.java:289-295 — a count-move maintains owned() with
      // ITS OWN rules, distinct from ActionMoveTopPiece: remove(from) only
      // when the source pile fully drains (count → 0), and add(to)
      // UNCONDITIONALLY — Java appends even when the site is already listed,
      // so repeated merges accumulate duplicate entries; reproduce that
      // verbatim (it is the traversal order (forEach Piece) observes). No
      // capture-remove exists on this path (ActionMoveN never displaces a
      // different piece). No-ops until the registry is materialized.
      if (movedWhat > 0 && movedOwner > 0 && s.flatOwned !== undefined) {
        if (fromNew === 0) {
          s = s.withFlatOwnedRemove(movedOwner, movedWhat, this.fromIndex);
        }
        s = s.withFlatOwnedAdd(movedOwner, movedWhat, this.toIndex);
      }
      return this.maintainTracks(s, movedWhat);
    }
    // Genuine per-level stack at the source — a distinct-piece stack (Tower of
    // Hanoi disks, snakes-and-ladders pawn piles) seeded by `(place Stack
    // items:{…})` or built up by stacking pushes, recognised by a non-empty
    // per-level `what` column. Java's stacking ActionMove relocates the TOP
    // piece: pop it off `from` (exposing the piece beneath) and push it onto
    // `to`, carrying its component so a buried disk keeps its own `what`. The
    // flat branch below would instead wipe the whole source cell, losing the
    // pieces underneath. Only distinct-piece-stack games ever populate
    // `whatStacks`, so every other game falls straight through.
    // Either endpoint carrying a per-level `what` column marks this as a
    // distinct-piece-stack move. Gating on the destination too is essential: the
    // single piece whose component id equals its owner (Tower of Hanoi's
    // smallest disk) leaves `whatStacks` unmaterialised at its own site, but
    // landing it onto a real stack must still push a level rather than fall into
    // the flat same-owner `countAt` merge below (which would absorb it into a
    // pile count and erase the buried pieces' identities).
    const fromWhatStack = state.whatStacks[this.fromIndex];
    const toWhatStack = state.whatStacks[this.toIndex];
    // A HOMOGENEOUS per-level stack (Bashni [P2,P2]: owner == what at every
    // level) never materialises whatStacks, but a plain Move off it must
    // still pop the TOP piece only — the flat branch below wipes the site.
    const fromOwnerStackLen = state.stacks[this.fromIndex]?.length ?? 0;
    if (
      this.fromIndex !== this.toIndex &&
      ((fromWhatStack !== undefined && fromWhatStack.length > 0) ||
        (toWhatStack !== undefined && toWhatStack.length > 0) ||
        fromOwnerStackLen > 1)
    ) {
      // Identify the moving TOP piece and how to remove it from the source.
      // The source falls into three shapes and the ORIGINAL code (topLevel =
      // stackSize()-1) only handled the first:
      //   (A) genuine multi-level per-level stack (Bashni [P2,P2]): pop the top
      //       level;
      //   (B) count-pile — a hand seeded with `(place Stack "disc" (handSite)
      //       count:N)` stores its pieces as a SINGLE stack marker plus a
      //       countAt=N pile (stacks=[owner], countAt=N). stackSize() returns
      //       max(1,N)=N, so the original topLevel=N-1 read stacks[N-1]=∅ →
      //       owner 0 → the whole move silently no-op'd. This branch is reached
      //       for such a source whenever the DESTINATION is a mixed-component
      //       stack (toWhatStack materialised): Agilidade stacking from hand
      //       onto a vertex already holding both players' discs. Remove one from
      //       the pile, keeping the marker so the rest stay placeable;
      //   (C) a single piece (stacks=[owner], countAt≤1): clear the flat
      //       channels and pop the lone marker.
      const srcArr = state.stacks[this.fromIndex] ?? [];
      const srcCount = state.countAtSite(this.fromIndex);
      const multiStack = srcArr.length > 1;
      const topLevel = srcArr.length > 0 ? srcArr.length - 1 : 0;
      const topOwner =
        srcArr.length > 0 ? state.stackAt(this.fromIndex, topLevel) : state.cellAt(this.fromIndex).owner;
      const topWhat =
        srcArr.length > 0 ? state.whatAtSiteLevel(this.fromIndex, topLevel) : state.whatAtSite(this.fromIndex);
      // @java ActionMoveTopPiece (stacking) has no owner-based bail-out — it
      // relocates whatever occupies the top level, `who` included, and Java
      // legitimately stacks Neutral (owner 0) components (Santorini building
      // levels; Sik/Es-Sig/Sig-family's Neutral "Bankor" piece riding atop —
      // and eventually alone atop — the 5-piece start stack). The old
      // `topOwner === 0` guard treated every Neutral-owned top level as "no
      // piece here" and no-op'd the ENTIRE move: once Sik's Bankor became the
      // sole occupant of its site, every one of its own relocations (mover
      // takes control after reaching Center) silently did nothing — the
      // piece stayed put while (where "Bankor" Neutral) kept resolving to
      // the stale site, corrupting move generation for the rest of the trial
      // (MOVE_MISMATCH ~4 plies after the first Bankor move). A site that is
      // truly empty has BOTH topOwner and topWhat at 0 (Constants.NO_PIECE);
      // gate on that pair instead so a real Neutral piece (topWhat > 0) is
      // never mistaken for an empty site.
      if (topOwner === 0 && topWhat === 0) return state;
      // @java ActionMoveTopPiece (stacking): owned remove at the from-top
      // level, add at the to-top level after the push.
      let popped = state.withOwnedRemoveLevel(topOwner, topWhat, this.fromIndex, topLevel);
      if (multiStack) {
        popped = popped.withStackPop(this.fromIndex);
        // @java cs maintains the count channel; clear residue when the pop
        // empties the site (same fix as the flush/ActionRemove paths).
        if (popped.stackSize(this.fromIndex) === 0 && popped.countAtSite(this.fromIndex) > 0) {
          popped = popped.withCountAt(this.fromIndex, 0);
        }
      } else if (srcCount > 1) {
        // (B) count-pile: remove exactly one piece, keeping the marker & flat
        // channels so the remaining N-1 pieces stay placeable.
        popped = popped.withCountAt(this.fromIndex, srcCount - 1);
      } else {
        // (C) single piece: pop the lone marker, then vacate any residual flat
        // channels (@java csFrom.remove). Conditional writes keep a normal
        // stack-pop byte-identical when withStackPop already zeroed the site.
        if (srcArr.length > 0) popped = popped.withStackPop(this.fromIndex);
        if (popped.cellAt(this.fromIndex).owner !== 0) popped = popped.withCell(this.fromIndex, 0);
        if (popped.whatAtSite(this.fromIndex) !== 0) popped = popped.withWhatAt(this.fromIndex, 0);
        if (srcCount === 1 && popped.countAtSite(this.fromIndex) !== 0) popped = popped.withCountAt(this.fromIndex, 0);
        // @java ContainerGraphStateStacks.java:1003-1044 — the Edge/Vertex
        // LEVEL-BASED remove (used by ActionMoveLevelFrom.java:449 for every
        // board-to-board per-level relocation; `fromHandSite` is false exactly
        // then) only clears the vacated chunk's who/what — its `state` int is
        // left exactly as it was, invisible to ordinary reads only because
        // Java's `state()` accessor is bounds-checked against `sizeStack`.
        // Stash the about-to-be-cleared value in the shadow
        // `residualStateAt` channel (never read by `stateAtSite`/
        // `stateAtLevel`/`stateTop`) before clearing the VISIBLE `stateAt` —
        // this keeps every normal read byte-identical to before (no
        // regression risk for A K'aak'il/Aj Sakakil/Aj Sayil/Aj Sina'anil/Bul,
        // whose own captured/capturing per-piece `state` semantics query
        // `state at:… level:…` at freshly-vacated sites and must see 0
        // there). Only ActionMoveTopPiece's state-less hand-entry write path
        // (the flat branch below) ever consults the stash, mirroring the one
        // Java call site that can actually resurface it
        // (ContainerStateStacks.java:278-301, ActionMoveTopPiece.java:485-498).
        const preClearState = popped.stateAtSite(this.fromIndex);
        if (state.stackingGame && !this.fromHandSite && preClearState !== 0) {
          popped = popped.withResidualStateAt(this.fromIndex, preClearState);
        }
        if (preClearState !== 0) popped = popped.withStateAt(this.fromIndex, 0);
        if (popped.valueAtSite(this.fromIndex) !== 0) popped = popped.withValueAt(this.fromIndex, 0);
      }
      // @java ActionMoveLevelFrom.java:343-347 — the relocated piece CARRIES
      // its local state (newStateTo = source state when no explicit state).
      // The flat stateAt[] approximates the top level's state, so a single
      // relocating piece takes it along: Owasokotz marks each Stick's chosen
      // CW/CCW direction as site state on the Edge it stands on; dropping it
      // here made ("MadeACompleteCircuit") read direction 0 (CCW) after every
      // later hop and fire a false win at ply 5. Multi-level pops (A)/(B)
      // leave the flat channel untouched (the flat model cannot represent
      // per-level state for the piece left behind).
      // @java ContainerState.state(site, type) (BaseContainerStateStacking
      // .java:87-95 -> ContainerStateStacks.stateCell:644-650 ->
      // ChunkStack.state():435-440) — the level-less read on a stacking
      // container returns the TOP of the per-level state column, not the
      // flat scalar. stateAtSite here dropped the mover's "activated" flag
      // whenever a Stick pushed onto an occupied site (Sik ply 86: P3 landed
      // at level 1 with state 0; the lud's level-0 self-repair couldn't fire
      // because P1's level 0 was already 1 — so ply 90 offered only Pass).
      // Same fix as the sibling branch below (line ~549 stateTop).
      // @java ActionMoveLevelFrom.java:445 — the state read is PER-LEVEL and
      // UNCONDITIONAL: Java never special-cases a departure from the top of
      // an already-multi-occupant source pile. Excluding `multiStack` zeroed
      // a Sik Stick's activation flag whenever it left the top of a 2+
      // occupant pile (ply 166: mover 3's Stick 17->13 lost its "1"; the
      // corruption surfaced two moves later as a spurious Pass-only ply 174).
      // topLevel is computed from the pre-pop state, so it is exactly the
      // vacated level; count-piles (srcCount>1) keep the 0 (no per-instance
      // state).
      const srcSiteState = srcCount <= 1 ? state.stateAtLevel(this.fromIndex, topLevel) : 0;
      // @java ActionMoveTopPiece.java:485-498 (5-arg addItemGeneric — no value
      // write, ContainerStateStacks.java:278-301's addItem() sets what/who
      // only, leaving the new level's value at its zero default) applies to
      // EVERY relocation dispatched through this stacking branch, hand-exit
      // or not — Constants and this method carry no `levelFrom`. This branch
      // (a genuine per-level stack source: multi-level, count-pile, or a
      // materialised destination stack) popped a hand's count-pile top via
      // `state.valueAtSite(this.fromIndex)` unconditionally, resurfacing the
      // hand's persisted value-1 "Counter" identity marker on the board the
      // instant it entered a stack (Thaayam: a Counter exiting hand while
      // landing on an occupied enemy site pushed a value-1 level here — the
      // sibling flat branch below already drops hand-exit value via
      // `fromHandSite`, but this stack branch was untouched, so the same
      // false "twin" capture-eligibility read `(value Piece at:(to)) = 1`
      // still fired two branches downstream, corrupting the turn order by
      // ply 93 in RandomTrial_0).
      const topValue = state.stackingGame && this.fromHandSite
        ? 0
        : srcArr.length > 0
          ? state.valueAtLevel(this.fromIndex, topLevel)
          : state.valueAtSite(this.fromIndex);
      const fromRow: number[] = [];
      for (let l = 0; l < topLevel; l++) fromRow.push(state.valueAtLevel(this.fromIndex, l));
      // @java ActionMoveTopPiece non-stacking apply — in a game without stack
      // moves, landing on an occupied FLAT destination REPLACES the piece
      // there (csTo.setStuff), it does not add a level. Wellisch Chess: a
      // grabbed knight re-enters from hand onto the promoting pawn's square;
      // the push made a ghost height-2 stack whose residue resurfaced when
      // the knight later moved off. Genuine distinct-piece stacks (Tower of
      // Hanoi) land on destinations with a materialised whatStacks column or
      // a real multi-level stack and still push.
      const destFlatOccupied =
        !state.stackMovesGame &&
        !state.stackingGame &&
        popped.cellAt(this.toIndex).owner > 0 &&
        (toWhatStack === undefined || toWhatStack.length === 0) &&
        popped.stackSize(this.toIndex) <= 1;
      if (destFlatOccupied) {
        const prevOwner = popped.cellAt(this.toIndex).owner;
        const prevWhat = popped.whatAtSite(this.toIndex);
        let s3 = popped;
        if (prevOwner > 0 && prevWhat > 0) s3 = s3.withOwnedRemoveAll(prevOwner, prevWhat, this.toIndex);
        s3 = s3.withStackRemoveAll(this.toIndex);
        s3 = s3.withCell(this.toIndex, topOwner);
        s3 = s3.withWhatAt(this.toIndex, topWhat);
        s3 = s3.withValueAt(this.toIndex, topValue !== 0 ? topValue : 0);
        s3 = s3.withValueStackRow(this.fromIndex, fromRow);
        s3 = s3.withValueStackRow(this.toIndex, []);
        s3 = s3.withOwnedAdd(topOwner, topWhat, this.toIndex, 0);
        if (srcSiteState !== 0) s3 = s3.withStateAt(this.toIndex, srcSiteState);
        return this.maintainTracks(s3, topWhat);
      }
      const toBase: number[] = [];
      for (let l = 0; l < popped.stackSize(this.toIndex); l++) toBase.push(popped.valueAtLevel(this.toIndex, l));
      let pushed = popped.withStackPush(this.toIndex, topOwner, topWhat);
      pushed = pushed.withValueStackRow(this.fromIndex, fromRow);
      pushed = pushed.withValueStackRow(this.toIndex, [...toBase, topValue]);
      // @java ContainerState.value(site, type) returns the TOP level's value; the
      // flat valueAt channel (which ValuePiece's level-less read consults) must
      // track the new stack top after this relocation. The destFlatOccupied
      // branch above already writes it via withValueAt; the push-to-stack branch
      // omitted it, so a single relocating piece's value landed only in the
      // per-level valueStacks column and the flat read returned a stale 0
      // (Kawasukuts Marker's start-gate value travelling up the track → the
      // level-less (value Piece at:(where "Marker" Mover)) read 0 and
      // (is In 0 <track segment containing 0>) fired a false MadeACompleteCircuit
      // win). Keep both the source and destination flat values consistent with
      // their remaining stack tops (0 when the source drained empty).
      if (pushed.valueAtSite(this.toIndex) !== topValue) pushed = pushed.withValueAt(this.toIndex, topValue);
      const fromTopValue = fromRow.length > 0 ? (fromRow[fromRow.length - 1] ?? 0) : 0;
      if (pushed.valueAtSite(this.fromIndex) !== fromTopValue) pushed = pushed.withValueAt(this.fromIndex, fromTopValue);
      pushed = pushed.withOwnedAdd(topOwner, topWhat, this.toIndex, pushed.stackSize(this.toIndex) - 1);
      // Carry the single relocating piece's site state (see (C) above).
      // @java ActionMoveLevelFrom.java:444-457 — the carried state rides the
      // NEW TOP LEVEL via the stateVal addItemGeneric overload, so a
      // per-level read (state at:to level:newTop) must see it too: Sik's
      // activation check reads (state at:55 level:1) after P3 pushes onto
      // P1's occupied gate — the flat-only write left stateStacks[55][1]=0
      // and ply 90 offered only Pass.
      if (srcSiteState !== 0) {
        pushed = pushed.withStateAt(this.toIndex, srcSiteState);
        const newTopLevel = pushed.stackSize(this.toIndex) - 1;
        if (newTopLevel >= 0) pushed = pushed.withStateAtLevel(this.toIndex, newTopLevel, srcSiteState);
      }
      return this.maintainTracks(pushed, topWhat);
    }
    // @java ActionMoveTopPiece (non-stacking): owned remove at from, add at
    // to — only live once the registry is materialized (stacking game);
    // fromTo victim relocations between flat sites must keep it in sync.
    if (state.ownedEntries !== undefined && this.fromIndex !== this.toIndex) {
      const mOwner = state.cellAt(this.fromIndex).owner;
      const mWhat = state.whatAtSite(this.fromIndex);
      if (mOwner > 0) {
        state = state.withOwnedSiteCleared(this.fromIndex);
        state = state.withOwnedSiteCleared(this.toIndex);
        state = state.withOwnedAdd(mOwner, mWhat || mOwner, this.toIndex, 0);
      }
    }
    // @java Core/src/other/action/move/move/ActionMoveTopPiece.java:382-447
    // (non-stacking Cell-only branch) — FlatCellOnlyOwned bookkeeping: the
    // mover is remove-swapped out of its own registry list, any captured
    // piece at `to` is remove-swapped out of ITS owner's list, then the
    // mover is appended to its list at `to` (FlatCellOnlyOwned.add is a
    // plain append; remove is a remove-swap — see
    // FlatCellOnlyOwned.java:185-197). Order matters: (forEach Piece)
    // iterates this exact list order, and a per-candidate RNG-consuming move
    // template (Shogun's `(apply (set Value ... (value Random ...)))`
    // reroll) observes it on the next move-generation pass. Gated off
    // stacking games (ownedEntries/FullOwned above already covers them) and
    // typedSites boards (Edge/Vertex secondary occupancy this registry does
    // not model — those keep the ascending lazy scan).
    if (!state.stackingGame && state.typedSites.size === 0 && this.fromIndex !== this.toIndex) {
      const mOwner = state.cellAt(this.fromIndex).owner;
      const mWhat = state.whatAtSite(this.fromIndex);
      if (mOwner > 0) {
        let fo = state.withFlatOwnedMaterialized();
        const capturedOwner = fo.cellAt(this.toIndex).owner;
        const capturedWhat = fo.whatAtSite(this.toIndex);
        // @java ActionMoveTopPiece.java:378-390 — the mover leaves its
        // registry list ONLY when the source pile is a single piece
        // (count == 1); a count-pile move (At-Tab's `(count at:(from))`
        // king piles) just decrements count and owned() is untouched.
        const fromCount = fo.countAtSite(this.fromIndex);
        if (fromCount <= 1) {
          fo = fo.withFlatOwnedRemove(mOwner, mWhat || mOwner, this.fromIndex);
        }
        if (capturedOwner > 0 && (!fo.requiresCountGame || capturedWhat !== mWhat)) {
          fo = fo.withFlatOwnedRemove(capturedOwner, capturedWhat || capturedOwner, this.toIndex);
        }
        // @java ActionMoveTopPiece.java:433-447 — the mover is appended at
        // `to` only when the DESTINATION count becomes 1 after the write
        // (merging onto an existing same-piece pile increments count and
        // leaves the registry alone: the site was appended when the pile
        // first formed).
        const toCountPre = fo.countAtSite(this.toIndex);
        const postCount = capturedWhat === mWhat && toCountPre > 0
          ? (fo.requiresCountGame ? toCountPre + 1 : 1)
          : 1;
        if (postCount === 1) {
          fo = fo.withFlatOwnedAdd(mOwner, mWhat || mOwner, this.toIndex);
        }
        state = fo;
      }
    }
    // @java GameType.Stacking — in a stacking game a plain move landing on an
    // OCCUPIED site pushes a level (ActionMoveTopPiece on a stacking
    // container); the count-merge below is flat-game semantics and built
    // Fenix's setup "generals" as count-piles (stacks=[2], countAt=2),
    // poisoning (size Stack), the Owned registry and capture valuations.
    if (
      state.stackMovesGame &&
      this.fromIndex !== this.toIndex &&
      !this.transferCount &&
      state.cellAt(this.toIndex).owner > 0 &&
      state.cellAt(this.fromIndex).owner > 0
    ) {
      const mOwner = state.cellAt(this.fromIndex).owner;
      const mWhat = state.whatAtSite(this.fromIndex) || mOwner;
      // @java ActionMoveTopPiece.java:490 csFrom.remove(...) pops only ONE
      // piece off the source; it does NOT wipe the whole pile. Two source
      // shapes share this branch (mirrors the sibling per-level-stack
      // branch's (A)/(B)/(C) split above):
      //   - a genuine multi-level stack (stacks[from].length > 1) — pop the
      //     top LEVEL only;
      //   - a flat count-pile (stacks=[owner], countAt=N>1 — Murus
      //     Gallicus's 2-high towers, Fenix's "generals") — decrement the
      //     count by one, keeping the marker so the remaining N-1 pieces
      //     stay in place.
      // Unconditionally wiping the whole source here (old code,
      // withStackRemoveAll unconditional) destroyed the remaining piece(s):
      // MoveTower's recorded move dispatches TWO sibling actions sharing the
      // same `from` (one per tower half) — the first (this branch) wiped the
      // ENTIRE 2-high tower via withStackRemoveAll, so the second (a
      // stack:true whole-relocate action) then found an already-empty
      // source and silently no-op'd, losing one of the mover's 16 pieces
      // (Murus Gallicus RandomTrial_0 ply 6, surfacing as a MOVE_MISMATCH at
      // ply 12).
      const srcArr = state.stacks[this.fromIndex] ?? [];
      const srcCount = state.countAtSite(this.fromIndex);
      const topLevel = srcArr.length > 0 ? srcArr.length - 1 : 0;
      let s2 = state.withOwnedMaterialized();
      s2 = s2.withOwnedRemoveLevel(mOwner, mWhat, this.fromIndex, topLevel);
      const toBaseV: number[] = [];
      for (let l = 0; l < s2.stackSize(this.toIndex); l++) toBaseV.push(s2.valueAtLevel(this.toIndex, l));
      if (srcArr.length > 1) {
        s2 = s2.withStackPop(this.fromIndex);
        if (s2.stackSize(this.fromIndex) === 0 && s2.countAtSite(this.fromIndex) > 0) {
          s2 = s2.withCountAt(this.fromIndex, 0);
        }
      } else if (srcCount > 1) {
        s2 = s2.withCountAt(this.fromIndex, srcCount - 1);
      } else {
        // Vacate from COMPLETELY (stacks/whatStacks/cells/whats/count) — a
        // manual cell clear leaves a ghost stacks[] level at the old site.
        s2 = s2.withStackRemoveAll(this.fromIndex);
      }
      s2 = s2.withStackPush(this.toIndex, mOwner, mWhat);
      // @java addItemGeneric — the plain push does NOT carry the mover's
      // value; the new top level reads 0 (oracle: Fenix s28=[1,0]).
      s2 = s2.withValueStackRow(this.toIndex, [...toBaseV, 0]);
      if (srcArr.length <= 1 && srcCount <= 1) {
        s2 = s2.withValueStackRow(this.fromIndex, []);
      }
      s2 = s2.withOwnedAdd(mOwner, mWhat, this.toIndex, s2.stackSize(this.toIndex) - 1);
      return this.maintainTracks(s2, mWhat);
    }
    const movingOwner = state.cellAt(this.fromIndex).owner;
    // Preserve the moving piece's component identity (Java: ContainerState
    // carries `what` with the piece, not just its owner). Read it before the
    // source site is cleared.
    const movingWhat = state.whatAtSite(this.fromIndex);
    // The piece's stored state, rotation and value all travel with it (Java
    // ActionMoveTopPiece lines 399-419): for each, an explicit value on the
    // move wins, otherwise the source site's current value is carried to the
    // destination. (Quarto encodes a piece's 3rd attribute as the local site
    // state and its 4th as the value; its win rules read `(state at:(to))` and
    // `(value Piece at:(to))`.) Read all three before the source is cleared.
    // @java ContainerState.state(site, type) (ChunkStack.java:435-440) — the
    // level-less read on a stacking container returns stateStacks' TOP entry,
    // not a separate flat scalar. TS keeps two channels (stateAt[] flat,
    // stateStacks[][] per-level) that a bare ActionMove never resynced:
    // (set State at: level:) writes only stateStacks[], so the flat read here
    // returned a permanently-stale 0 for any site with a materialized
    // per-level row, dropping the mover's "activated" flag every time it
    // moved again (Sik/Es-Sig/Sig wa Duqqan stick-dice family).
    const currentStateFrom = state.stateTop(this.fromIndex);
    const currentRotationFrom = state.rotationAtSite(this.fromIndex);
    const currentValueFrom = state.valueAtSite(this.fromIndex);
    const destState =
      this.stateValue !== ACTION_OFF ? this.stateValue : currentStateFrom;
    const destRotation =
      this.rotationValue !== ACTION_OFF ? this.rotationValue : currentRotationFrom;
    // @java ActionMoveTopPiece.java:485-498 (5-arg addItemGeneric — no
    // value write) vs ActionMoveLevelFrom.java:435-457 (8-arg, value
    // carried): hand-exit moves in a stacking game DROP the piece's value.
    const destValue =
      this.valueValue !== ACTION_OFF
        ? this.valueValue
        : state.stackingGame && this.fromHandSite
          ? 0
          : currentValueFrom;
    // Java parity (ActionMoveTopPiece.apply, non-stacking branch): "If the
    // origin is empty we do not apply this action" → `return this;`. An empty
    // source is a silent no-op, not an error. This arises when a hypothetical
    // move (e.g. a `(then …)`/constraint filter's applyHypothetical) references
    // a site already vacated by a prior action in the same sequence.
    if (movingOwner === 0 && movingWhat === 0) {
      return state;
    }
    // @java ActionMoveTopPiece.java:378-448 — a self-move (from == to) in the
    // non-stacking (requiresCount) branch REMOVES the piece and immediately
    // RE-ADDS it to the same site: csFrom.setSite writes count-1, then
    // csTo.setSite (line 432-435) reads that decremented count and writes
    // count+1, netting the ORIGINAL count; who/what are likewise restored. The
    // board is therefore unchanged — only explicit state/rotation/value writes
    // (lines 399-419) apply and onTrackIndices advances (line 451). The flat
    // count-decrement below has no matching re-increment for from == to (every
    // restore is gated `fromIndex !== toIndex`), so it would silently DROP one
    // marker off a stacked site. Internal-loop tracks (Len Doat, Pachisi) are
    // the only movers that legitimately emit a from == to hop: NextSiteOnTrack
    // can return the same board index at a later ring position.
    if (this.fromIndex === this.toIndex) {
      // @java ActionMoveLevelFrom.java:438 / ActionMoveTopPiece.java:487 —
      // the STACKING branch's `if (from == to) return this;` is a TOTAL
      // no-op (even onTrackIndices stays put). It IS reachable: a stacking
      // game (Kawade Kelia) emits a from==to "forced stay" decision on
      // SetDiceAllEqual whose action carries levelFrom → Java's total no-op
      // keeps the piece's ring index at its current occurrence. TS's
      // unconditional maintainTracks advanced site 17's index from ring 11
      // to the later duplicate at ring 55, corrupting the next TrackSiteMove
      // resolution (ply 48: to=42 instead of the recorded to=23). Confirmed
      // by replaying the recorded trial through the REAL Java engine with
      // instrumented onTrackIndices.
      if (state.stackingGame) {
        return state;
      }
      const self = this.applyDestAttrs(state, destState, destRotation, destValue);
      return this.maintainTracks(self, movingWhat);
    }
    // When the source carries a stacked count — e.g. a hand seeded with
    // `(place … "Hand" count:N)` from which pieces are placed one at a time —
    // move a single piece out and leave the rest, so the site stays occupied
    // until exhausted. A plain piece (count 0 or 1) is cleared as before.
    const fromCount = state.countAtSite(this.fromIndex);
    let next = state;
    if (fromCount > 1) {
      next = next.withCountAt(this.fromIndex, fromCount - 1);
    } else {
      next = next.withCell(this.fromIndex, 0);
      if (fromCount === 1) next = next.withCountAt(this.fromIndex, 0);
      next = next.withWhatAt(this.fromIndex, 0);
      // Java `csFrom.remove` resets the vacated site's state/rotation/value.
      if (currentStateFrom !== 0) next = next.withStateAt(this.fromIndex, 0);
      if (currentRotationFrom !== 0) next = next.withRotationAt(this.fromIndex, 0);
      if (currentValueFrom !== 0) next = next.withValueAt(this.fromIndex, 0);
    }
    // @java a cross-type move whose DESTINATION is a non-default graph element
    // (Edge/Vertex) writes the relocated piece into that element's typed channel
    // — csTo is the Edge/Vertex ContainerState, not the flat Cell layer. Quoridor's
    // wall `(move (from (handSite Mover)) (to Edge (difference (sites Empty Edge) …)))`
    // relocates a Rectangle from the Cell hand onto an Edge; the flat destination
    // path below does `withCell(edgeIndex)` and threw "siteIndex out of range"
    // because an edge index exceeds the cells range. The source (a Cell hand) was
    // already cleared above; write the destination in the typed channel and return.
    // Gated on the destination being Edge/Vertex AND differing from the source type
    // so same-type graph moves (handled by the typed path above) and ordinary
    // Cell→Cell moves are untouched.
    if (
      this.toTypedNonDefault &&
      this.siteTypeTo !== this.siteTypeFrom &&
      (this.siteTypeTo === "Edge" || this.siteTypeTo === "Vertex")
    ) {
      let s2 = next.withTypedSite(this.siteTypeTo, this.toIndex, movingOwner, movingWhat, 1);
      // Carry the moving piece's state/rotation/value to the destination element.
      // The destination is a NON-default graph element, so these live in the typed
      // channel — writing to the flat cell-sized stateAt[] would overflow when the
      // edge/vertex index exceeds the cell count.
      if (destState !== 0) s2 = s2.withTypedAttr(this.siteTypeTo, this.toIndex, "state", destState);
      if (destRotation !== 0) s2 = s2.withTypedAttr(this.siteTypeTo, this.toIndex, "rotation", destRotation);
      if (destValue !== 0) s2 = s2.withTypedAttr(this.siteTypeTo, this.toIndex, "value", destValue);
      s2 = this.transferHidden(s2, state, fromCount <= 1);
      return this.maintainTracks(s2, movingWhat);
    }
    // Stacking onto an occupied destination owned by the same player (Java:
    // ContainerStateStacks.addItem). Backgammon-family points hold a pile of
    // same-owner pieces tracked in `countAt`; a piece landing on a friendly
    // point raises the pile height by one. A non-stacking game never moves
    // onto its own piece, so this branch is inert there; landing on an enemy
    // (different owner) overwrites it, as before (capture-by-replacement).
    // The owner must be a real player: a *neutral* piece (owner 0) moving to an
    // empty cell (cells == 0) would otherwise spuriously match `0 === 0` and
    // "stack" onto the empty square (L Game's Dots), corrupting the count.
    // @java ActionMoveTopPiece.java:432-434 — the accumulation key is the
    // COMPONENT (csTo.what(to) == what && count > 0 → count+1), not the owner:
    // Shared mancala seeds (owner 0) landing on an occupied pit must raise the
    // pile (Kisolo's capture fromTo dropped the relocated seed otherwise).
    // @java ActionMoveTopPiece: in a STACKING game (game.isStacking()), moving
    // onto an occupied site PUSHES a level — it never overwrites. Plakoto's pin:
    // P2's checker lands on P1's lone checker → P1 stays pinned at level 0, P2
    // sits at level 1. The flat-replacement path below would WIPE P1. Java gates
    // this on isStacking(); we use state.stackingGame (set by (place Stack …)).
    // Backgammon/Portes-family hits are NOT affected: they run an explicit
    // ("HittingCapture") ActionRemove first, so the destination is already empty
    // (who==0) and this branch is skipped — only a true land-on-enemy (no prior
    // removal) pins. Neutral movers (owner 0) and same-owner piles fall through.
    if (
      state.stackingGame &&
      this.fromIndex !== this.toIndex &&
      movingOwner !== 0 &&
      state.who(this.toIndex) > 0 &&
      // @java ActionMoveTopPiece.java:484-516 — the push-a-level branch fires
      // for ANY occupied destination whose top differs (owner OR component);
      // a same-owner different-piece landing stacks too (AlmaTafl's tower).
      (state.who(this.toIndex) !== movingOwner ||
        state.whatAtSite(this.toIndex) !== movingWhat)
    ) {
      next = next.withStackPush(
        this.toIndex,
        movingOwner,
        movingWhat !== 0 ? movingWhat : undefined,
      );
      // @java ActionMove.construct() dispatches to ActionMoveLevelFrom when
      // the recorded move carries an explicit levelFrom (Kawasukuts' Marker
      // moves always do); ActionMoveLevelFrom's stacking-push branch reads
      // newValueTo = containerFrom.value(from, levelFrom, typeFrom) and
      // carries it via the 7-arg addItemGeneric — the MOVER's own value rides
      // along even onto an occupied/enemy destination (ActionMoveLevelFrom
      // .java ~444-475). ActionMoveTopPiece.java:490-498's 3-arg addItem
      // (value unset = 0) is a DIFFERENT dispatch branch, used only when no
      // levelFrom is recorded; an earlier fix here conflated the two and
      // zeroed the pushed level (and flat valueAt) unconditionally, which
      // discarded Kawasukuts' gate value 38 at ply 3 — MadeACompleteCircuit
      // then read 0 (in-range) instead of 38 (out-of-range) at ply 5 and
      // declared a false win. carriedValue is 0 for value-less stacking-push
      // games (Plakoto etc.), so this is a no-op there. Preserve the pre-push
      // levels' values FIRST (the buried piece's value must resurface when
      // the pin later pops).
      // @java ActionMoveTopPiece.java:485-498's 5-arg addItemGeneric (no
      // value write) is what a hand-exit dispatches through when it has no
      // recorded levelFrom (Thaayam's Counter moves never carry one) — the
      // Kawasukuts carry-forward above is specifically the levelFrom-tagged
      // ActionMoveLevelFrom path (see the comment above), which this method
      // cannot yet distinguish from a plain top-piece push except via the
      // fromHandSite flag Java also keys the flat branch's drop on below.
      // Without this gate, a Thaayam Counter exiting hand onto an occupied
      // enemy site (pushing a level here, not landing on an empty site)
      // carried its hand value=1 identity marker onto the board — mirroring
      // the flat branch's already-fixed drop, this stack-push branch was the
      // remaining unguarded site (RandomTrial_0 ply 12: hand3->22 pushed
      // value=1 onto the existing stack, later popped at ply 13/85 and
      // misread as a capturable "twin", desyncing the turn order by ply 93).
      const carriedValue = state.stackingGame && this.fromHandSite ? 0 : state.valueTop(this.fromIndex);
      {
        const preLevels = Math.max(1, state.stackSize(this.toIndex));
        const row: number[] = [];
        for (let l = 0; l < preLevels; l++) row.push(state.valueAtLevel(this.toIndex, l));
        row.push(carriedValue); // the newly pushed level carries the mover's own value
        next = next.withValueStackRow(this.toIndex, row);
      }
      if (next.valueAtSite(this.toIndex) !== carriedValue) next = next.withValueAt(this.toIndex, carriedValue);
      // @java ActionMoveLevelFrom.java:444-457 — newStateTo = containerFrom
      // .state(from, levelFrom, typeFrom) is read before the pop and carried
      // into the pushed level via the stateVal-carrying addItemGeneric
      // overload (ContainerStateStacks.java:331-361). This branch carries
      // `value` (carriedValue above) but had no equivalent for `state`, so a
      // piece landing on an occupied site in a stacking game had its OWN
      // per-level "activated" flag reset to withStackPush's default 0 —
      // permanently losing the mover's activation (Sik family).
      if (destState !== 0) {
        const newLevel = next.stackSize(this.toIndex) - 1;
        if (newLevel >= 0) next = next.withStateAtLevel(this.toIndex, newLevel, destState);
        if (next.stateAtSite(this.toIndex) !== destState) next = next.withStateAt(this.toIndex, destState);
      }
      next = this.transferHidden(next, state, fromCount <= 1);
      return this.maintainTracks(next, movingWhat);
    }
    // @java ActionMoveTopPiece.java:423-439 — a pile merge happens ONLY when
    // the destination holds the SAME component (csTo.what(to) == what) and
    // the count bumps only in requiresCount() games (else it resets to 1).
    // A same-OWNER different-WHAT landing REPLACES the destination piece
    // (owned().remove + setSite(who, what, 1)). The old same-owner disjunct
    // merged Wellisch's promoted knight onto its own pawn as a count-2 pile,
    // and the ghost copy resurfaced when the knight later moved off.
    if (
      this.fromIndex !== this.toIndex &&
      // @java same-piece pile merge requires the SAME component too (see
      // push branch above; AlmaTafl same-owner different-piece stacks).
      ((state.stackingGame && movingOwner !== 0 && state.who(this.toIndex) === movingOwner &&
        state.whatAtSite(this.toIndex) === movingWhat) ||
        ((state.whatAtSite(this.toIndex) === movingWhat ||
          state.whatAtSite(this.toIndex) === 0) &&
          state.countAtSite(this.toIndex) > 0))
    ) {
      const destHeight = Math.max(state.countAtSite(this.toIndex), 1);
      next = next.withCell(this.toIndex, movingOwner);
      next = next.withWhatAt(this.toIndex, movingWhat);
      next = this.applyDestAttrs(next, destState, destRotation, destValue);
      // @java requiresCount() games bump the pile; stacking games route to
      // the stacking applies in Java but TS lands some same-owner stack
      // merges here (Agilidade), where the height must also grow. Flat
      // piece games reset to 1 (the replace).
      next = next.withCountAt(this.toIndex, state.requiresCountGame || state.stackingGame ? destHeight + 1 : 1);
      next = this.transferHidden(next, state, false);
      return this.maintainTracks(next, movingWhat);
    }
    next = next.withCell(this.toIndex, movingOwner);
    next = next.withWhatAt(this.toIndex, movingWhat);
    // Java parity: ActionMoveTopPiece always sets count=1 at the destination
    // (line 439: csTo.setSite(..., who, what, 1, ...)), even for board→board moves.
    // This is critical when a piece is knocked back to an empty hand site (cells=0,
    // countAt=0): without setting countAt=1, (forEach Piece container:mover) cannot
    // detect the returned piece. It is safe for board sites: the stateAt-cleared source
    // branch (fromCount==1 → withCountAt(fromIndex, 0)) mirrors Java's csFrom.remove()
    // and correctly clears countAt when the piece later leaves.
    // @java other/action/move/move/ActionMoveTopPiece.java — apply(), non-stacking branch
    //   csTo.setSite(context.state(), to, who, what, 1, ...)
    if (this.fromIndex !== this.toIndex && (state.countAt[this.toIndex] ?? 0) === 0) {
      next = next.withCountAt(this.toIndex, 1);
    } else if (this.fromIndex !== this.toIndex && (state.countAt[this.toIndex] ?? 0) > 1) {
      // @java ActionMoveTopPiece.java:439 csTo.setSite(..., 1, ...) — a
      // REPLACEMENT landing (different component: T'oki's outer-edge hop
      // capturing an enemy pile) resets the count to the single attacker;
      // keeping the victim's pile count left a phantom 2-pile.
      next = next.withCountAt(this.toIndex, 1);
    }
    // @java ActionMoveTopPiece.java:485-498 — a stacking-game hand exit with
    // no explicit state (Constants.UNDEFINED) dispatches through the 5-arg
    // addItemGeneric, which never writes the destination's state chunk at
    // all (ContainerStateStacks.java:278-301). If a PRIOR occupant's
    // levelFrom vacate stashed a residual for this exact site (see the
    // shadow-channel citation in the per-level-stack branch above), that
    // residual is what this new occupant silently inherits in Java; consume
    // it here instead of writing the freshly-computed (usually 0) destState.
    // The channel is scoped to this exact dispatch (stackingGame &&
    // fromHandSite && no explicit state), so every other caller/game is
    // unaffected — the residual simply stays unused and gets overwritten by
    // Java's own defaults on any other write path.
    const residual = state.stackingGame && this.fromHandSite && this.stateValue === ACTION_OFF
      ? state.residualStateAtSite(this.toIndex)
      : 0;
    next = this.applyDestAttrs(next, residual !== 0 ? residual : destState, destRotation, destValue);
    if (residual !== 0) next = next.withResidualStateAt(this.toIndex, 0);
    next = this.transferHidden(next, state, fromCount <= 1);
    return this.maintainTracks(next, movingWhat);
  }

  /**
   * Java parity: ActionMoveTopPiece.java keeps hidden info with the piece:
   * `csTo.setHidden*(..., csFrom.isHidden*(...))`, then clears the source
   * hidden bits if the source site became empty (lines 1462-1482).
   */
  private transferHidden(next: State, before: State, clearFrom: boolean): State {
    if (this.fromIndex === this.toIndex) return next;
    let out = next;
    for (let pid = 1; pid < before.hiddenForPlayer.length; pid += 1) {
      const movingHidden = before.isHidden(pid, this.fromIndex);
      if (out.isHidden(pid, this.toIndex) !== movingHidden) {
        out = out.withHidden(pid, this.toIndex, movingHidden);
      }
      if (clearFrom && out.isHidden(pid, this.fromIndex)) {
        out = out.withHidden(pid, this.fromIndex, false);
      }
    }
    return out;
  }

  /**
   * Advance the moved piece's recorded track index (Java ActionMoveN.apply
   * 297-340). A no-op unless the game allocated `onTrackIndices` (internal-loop
   * track family) and a real piece (`what != 0`) moved — exactly Java's
   * `if (what != 0 && onTrackIndices != null)` guard. The large-piece and
   * `transferCount` (mancala N-seed) branches never reach here: large-piece
   * games have no tracks, and mancala tracks are full loops (not internal
   * loops) so `onTrackIndices` is absent there.
   */
  private maintainTracks(next: State, movingWhat: number): State {
    const oti = next.onTrackIndices;
    const loc = next.trackLocToIndex;
    if (oti === undefined || loc === undefined || movingWhat === 0) return next;
    const updated = maintainOnTrackIndicesForMove(
      oti,
      loc,
      movingWhat,
      this.countValue,
      this.fromIndex,
      this.toIndex,
    );
    return next.withOnTrackIndices(updated);
  }

  /** Write the destination site's state/rotation/value, skipping no-op writes
   * (Java ActionMoveTopPiece sets each via `csTo.setSite`). */
  private applyDestAttrs(
    next: State,
    destState: number,
    destRotation: number,
    destValue: number,
  ): State {
    if (destState !== next.stateAtSite(this.toIndex)) {
      next = next.withStateAt(this.toIndex, destState);
    }
    if (destRotation !== next.rotationAtSite(this.toIndex)) {
      next = next.withRotationAt(this.toIndex, destRotation);
    }
    if (destValue !== next.valueAtSite(this.toIndex)) {
      next = next.withValueAt(this.toIndex, destValue);
    }
    return next;
  }

  public override actionType(): ActionType {
    return ActionMove.TYPE;
  }

  public override from(): number {
    return this.fromIndex;
  }

  public override to(): number {
    return this.toIndex;
  }

  public override count(): number {
    return this.countValue;
  }

  public override state(): number {
    return this.stateValue;
  }

  public override rotation(): number {
    return this.rotationValue;
  }

  public override value(): number {
    return this.valueValue;
  }

  public override fromType(): SiteType {
    return this.siteTypeFrom;
  }

  public override toType(): SiteType {
    return this.siteTypeTo;
  }
}
