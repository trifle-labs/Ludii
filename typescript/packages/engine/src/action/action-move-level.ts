// @java Core/src/other/action/move/move/ActionMoveLevelFrom.java ActionMoveLevelFrom
// @java Core/src/other/action/move/move/ActionMoveLevelTo.java ActionMoveLevelTo
// @java Core/src/other/action/move/move/ActionMoveLevelFromLevelTo.java ActionMoveLevelFromLevelTo
/**
 * Java parity:
 * - Core/src/other/action/move/move/ActionMoveLevelFrom.java
 * - Core/src/other/action/move/move/ActionMoveLevelTo.java
 * - Core/src/other/action/move/move/ActionMoveLevelFromLevelTo.java
 *
 * In Java these are three concrete subclasses of the Move family, each
 * recording one or both of the from/to stack levels. The MVE's stack
 * model is push/pop-only so it can't slice mid-stack faithfully — the
 * action records the level metadata (preserved for Move shape) and
 * applies the surface effect of relocating the top piece.
 */

import type { State } from "../state.js";
import { BaseAction } from "./action.js";
import type { ActionType } from "./action-type.js";
import { maintainOnTrackIndicesForMove } from "../on-track-indices.js";

abstract class ActionMoveLevelBase extends BaseAction {
  protected readonly fromIndex: number;
  protected readonly toIndex: number;
  protected readonly fromLevelIndex?: number;

  protected constructor(from: number, to: number, fromLevel?: number) {
    super();
    this.fromIndex = from;
    this.toIndex = to;
    this.fromLevelIndex = fromLevel;
  }

  public override apply(state: State): State {
    // @java ActionMoveTopPiece.java:487-488 — stacking-game branch: a move
    // that deposits back at its own origin is a NO-OP (picked up and put
    // straight back). Without the guard the countBacked path overcounts the
    // origin (countAt=toBase+1) and then withCell(from,0) -> syncStacks pops
    // the stack to length 0: O An Quan's 12-seed wrap-around sow corrupted
    // site 8 to {countAt:2, stackSize:0} and the next sow's
    // (size Stack at:(last From)) direction choice picked the wrong branch.
    if (this.fromIndex === this.toIndex) return state;
    const stackSize = state.stackSize(this.fromIndex);
    const requestedLevel = this.fromLevelIndex;
    const sourceLevel =
      requestedLevel !== undefined && requestedLevel >= 0 && requestedLevel < stackSize
        ? requestedLevel
        : stackSize - 1;
    const stackLen = state.stacks[this.fromIndex]?.length ?? 0;
    const movingOwner =
      stackSize > 0
        ? state.whoAtSiteLevel(this.fromIndex, sourceLevel)
        : state.who(this.fromIndex);
    const movingWhat =
      stackSize > 0
        ? state.whatAtSiteLevel(this.fromIndex, sourceLevel)
        : state.whatAtSite(this.fromIndex);
    // @java ActionMoveLevelFrom.java:436-475 — the stacking-game apply()
    // branch has NO owner-based guard at all: it unconditionally does
    // `containerFrom.remove(...)` then `containerTo.addItemGeneric(...)`
    // for whatever piece sits at `levelFrom`, regardless of who() (owner
    // id) — including Neutral-owned pieces (owner=0). The only early-return
    // in that branch is `if (from == to) return this;` (line 438-439,
    // already mirrored above). A prior TS-only guard here instead checked
    // `movingOwner === 0`, wrongly conflating "owner=0 (Neutral piece,
    // e.g. Ghoula0 in Es-Sig / Sig wa Duqqan (Houmt Taourit))" with
    // "nothing here." That silently no-op'd the relocation of the Neutral
    // level during a multi-level ForEachLevel drag-along (MoveGhoula's
    // ForEachLevel FromTop fromTo — Sig-wa-Duqqan.lud), leaving that level
    // behind at the source while the owner>0 levels correctly relocated,
    // corrupting stack height/order and producing a board desync several
    // plies later (observed divergence at ply≈480). A genuinely-empty
    // source (no component present at all) is identified by
    // `movingWhat === 0` (the Java `what` channel), not owner === 0.
    if (movingWhat === 0) return state;
    const countedLevels = state.countAtSite(this.fromIndex);
    // @java Core/src/other/state/container/ContainerStateFactory.java:80-138
    // — Java picks the container's state representation ONCE per game,
    // exclusively based on `game.isStacking()`: a stacking container
    // becomes ContainerStateStacks (per-level chunks, no separate count
    // field — see the fix below), a non-stacking one becomes
    // ContainerFlatState/ContainerFlatVertexState/etc (flat, with an
    // optional maxCountVal chunk when `game.requiresCount()`). A single
    // game's container is never both. TS's hybrid countAt[] channel is
    // seeded to 1 for every `place Stack` placement (see Game.ts "First
    // stacking call at this site"), so a genuinely per-level site (one
    // with a real stateStacks/valueStacks column — per-level state that
    // only a genuinely-stacking site would carry) can ALSO have
    // countedLevels>0/stackLen<=1 at setup, wrongly routing it into the
    // countBacked branch below. That branch's `withCountAt` bookkeeping
    // has no concept of per-level state and drops it. Sahkku's Marker
    // carries per-level state (its activation flag) from ply 1, so
    // countBacked incorrectly fired for its very first move (ply 10:
    // recorded 28->25 pip=3 had no matching TS candidate — the
    // countBacked branch's early return before reaching the per-level
    // carry code below silently produced a different, non-matching
    // action). A real per-level column is definitive evidence this
    // site's container is a stacking one, so it must never be treated
    // as count-backed.
    const hasRealPerLevelState =
      (state.stateStacks?.[this.fromIndex]?.length ?? 0) > 0 ||
      (state.valueStacks?.[this.fromIndex]?.length ?? 0) > 0;
    const countBacked = countedLevels > 0 && stackLen <= 1 && !hasRealPerLevelState;
    if (countBacked) {
      const fromCount = countedLevels;
      // @java ActionMoveLevelFrom.java:462-471 — owned().add(to) / owned().
      // remove(from) run UNCONDITIONALLY in Java's stacking apply(); Java has
      // no "count-backed" special case at all (ContainerStateStacks has no
      // separate count channel — every relocation, including one TS
      // represents as a countAt pile for a hand of identical pieces, is a
      // genuine per-level push/pop in Java). This branch (a TS-only
      // representation optimization for homogeneous count piles — see the
      // countedLevels>0/stackLen<=1 gate above) returned early on both exit
      // paths WITHOUT ever touching state.ownedEntries, unlike the sibling
      // non-count-backed branch below (lines 182-186, itself a prior fix for
      // Monkey Queen/King And Courtesan). The moment ownedEntries
      // materializes (any earlier ForEachPiece query), every relocation
      // through THIS branch silently desynced the registry: the source
      // site's entry was never removed (stale ghost) and the destination
      // never got one (invisible to ForEachPiece) — exactly the Maya
      // family's `(place Stack "StickN" (handSite PN) count:5)` hand piles
      // collapsing to Pass-only late in the game (Aj Sakakil MOVE_MISMATCH
      // @71: TS offered only Pass despite occupied hand pieces still on the
      // board) once enough hand-pile relocations had run. Materialize once
      // (no-op if already live) and mirror the FROM/TO merge-vs-replace
      // distinction used by action-move.ts's stacking-merge fix so a
      // same-owner/same-component pile landing (genuine height increment,
      // preserved registrations) is never confused with a replace/empty
      // landing (fresh single level-0 registration).
      let base = state.withOwnedMaterialized();
      if (base.ownedEntries !== undefined) {
        if (fromCount > 1) {
          base = base.withOwnedRemoveLevel(movingOwner, movingWhat, this.fromIndex, fromCount - 1);
        } else {
          base = base.withOwnedSiteCleared(this.fromIndex);
        }
      }
      const destStackLen = state.stacks[this.toIndex]?.length ?? 0;
      const stackIntoDestination =
        state.stackSize(this.toIndex) > 0 &&
        (destStackLen > 1 || state.whatAtSite(this.toIndex) !== movingWhat);
      if (stackIntoDestination) {
        let next = base.withCountAt(this.fromIndex, Math.max(0, fromCount - 1));
        if (fromCount === 1) {
          next = next.withCell(this.fromIndex, 0).withWhatAt(this.fromIndex, 0);
        }
        next = next.withStackPush(this.toIndex, movingOwner, movingWhat);
        if (next.ownedEntries !== undefined) {
          next = next.withOwnedAdd(movingOwner, movingWhat, this.toIndex, next.stackSize(this.toIndex) - 1);
        }
        return next;
      }
      // @java ContainerStateStacks.addItem always appends one item, so the
      // destination height grows by exactly 1. A count-backed pile keeps its
      // true height in countAt alongside a single representative stacks[] entry.
      // But a seed previously deposited via withStackPush (a seed landing on a
      // ball-hole, or inherited from the genuine-stack representation that Ball
      // placements seed the board with) lives in stacks[] with countAt still 0.
      // Reading the increment base from countAtSite alone then UNDER-counts:
      // countAt 0→1 while stackLen is already 1, so stackSize = max(1,1) = 1
      // swallows the new seed (the Yucebao hole-6 sow divergence — one seed per
      // affected hole silently vanishes, drifting every downstream size/moveAgain
      // read). Base the new height on the true pre-add count: stackSize when the
      // site holds real content (cells set), else 0 for a drained/empty site
      // (whose lone stacks[] entry is a stale representative, not a live seed).
      const toBase = (state.cells[this.toIndex] ?? 0) === 0 ? 0 : state.stackSize(this.toIndex);
      let next = base
        .withCountAt(this.fromIndex, Math.max(0, fromCount - 1))
        .withCountAt(this.toIndex, toBase + 1);
      if ((next.cells[this.toIndex] ?? 0) === 0) {
        next = next.withCell(this.toIndex, movingOwner);
        // Also restore the component channel: a seed arriving at a previously
        // DRAINED count-backed site (cells/whats both zeroed when it emptied)
        // must repopulate whats[to], else the next read of that site falls back
        // to cells[to] (the OWNER, e.g. Shared=3) as the "what", flipping a Seed
        // into a phantom stack and zeroing countAt (Ceelkoqyuqkoqiji corruption).
        if (movingWhat !== 0) next = next.withWhatAt(this.toIndex, movingWhat);
      }
      if (fromCount === 1 && (stackLen <= 1 || stackLen === fromCount)) {
        next = next.withCell(this.fromIndex, 0).withWhatAt(this.fromIndex, 0);
      }
      // @java ActionMoveLevelFrom.java:462-471 (see comment above) — this is
      // the count-backed pile's "merge into an existing pile of the same
      // owner/component, or start fresh on an empty/different destination"
      // exit. Mirror action-move.ts's isStackingMerge test: a pre-occupied
      // same-owner/same-component destination (toBase>0, matching owner+what
      // — guaranteed here since stackIntoDestination's `whatAtSite(to) !==
      // movingWhat` case already routed to the OTHER branch above) survives
      // with its existing registrations and gets one more entry at the new
      // top level; an empty destination gets a fresh single level-0 entry.
      if (next.ownedEntries !== undefined) {
        if (toBase > 0) {
          next = next.withOwnedAdd(movingOwner, movingWhat, this.toIndex, toBase);
        } else {
          next = next.withOwnedSiteCleared(this.toIndex).withOwnedAdd(movingOwner, movingWhat, this.toIndex, 0);
        }
      }
      return next;
    }
    // @java ActionMoveLevelFrom.java:341-364 — the relocated piece CARRIES its
    // local state, rotation and piece-VALUE to the destination when the move
    // records no explicit override (currentStateFrom/currentRotationFrom/
    // currentValueFrom -> csTo). The flat state/value/rotation channels
    // approximate the top level, so a single relocating piece takes them along
    // (the plain ActionMove path already does this — action-move.ts:413-453,
    // Owasokotz on the same FortyStonesWithFourGapsBoard). Kawasukuts stores each
    // Marker's start gate as its piece value ((set Value at:(last To) (last To)))
    // and ("MadeACompleteCircuit") reads (value Piece at:(where "Marker" Mover))
    // to test whether that start gate lies in the track segment just traversed;
    // without the carry the value read 0 and a region that happened to include 0
    // fired a false win (WINNER_MISMATCH exposed by the FromTo Stacking fix).
    // Read the source channels BEFORE the pop clears them.
    const carryValue = state.valueAtSite(this.fromIndex);
    // @java ActionMoveLevelFrom.java:445 — newStateTo = containerFrom.state(
    // from, levelFrom, typeFrom): a PER-LEVEL read at the level being
    // vacated, not the flat/level-less scalar. A buried piece (Sik: a Stick
    // under another player's Stick) moving via ActionMoveLevelFrom carried
    // the flat stateAt[from] (permanently 0 for sites whose activation flag
    // only exists in the per-level stateStacks[] column), losing its own
    // activation.
    const carryState = state.stateAtLevel(this.fromIndex, sourceLevel);
    const carryRotation = state.rotationAtSite(this.fromIndex);
    // @java ActionMoveLevelFrom.java:462-471 — owned().remove(...) then
    // owned().add(...): the per-level relocation updates the FullOwned
    // registry alongside the container arrays. The TS port only patched
    // stacks[]/whatStacks[] here and never touched state.ownedEntries, so
    // once the registry materializes (any earlier ForEachPiece / stacking
    // action) a piece relocated through this per-level path silently
    // vanishes from `owned()` at its new site while the stale entry at
    // the old (site, level) — after the compaction below — points at
    // whatever level shifted into its slot, corrupting subsequent
    // ForEachPiece move generation (Monkey Queen queen-move split, King
    // And Courtesan king/courtesan exchange).
    let s2 = state.withOwnedMaterialized();
    s2 = s2.withOwnedRemoveLevel(movingOwner, movingWhat, this.fromIndex, sourceLevel);
    const popped = s2.withStackPop(this.fromIndex, sourceLevel);
    let pushed = popped.withStackPush(this.toIndex, movingOwner, movingWhat);
    pushed = pushed.withOwnedAdd(movingOwner, movingWhat, this.toIndex, pushed.stackSize(this.toIndex) - 1);
    if (carryValue !== 0) pushed = pushed.withValueAt(this.toIndex, carryValue);
    // @java ContainerStateStacks.addItem(state,site,what,who,stateVal,
    // rotationVal,value,game) (Core/src/other/state/stacking/
    // ContainerStateStacks.java:332-360) — chunkStacks[...].setState(trialState,
    // stateVal) runs UNCONDITIONALLY on every per-level push, even when
    // stateVal is the default 0. Gating this write on `carryState !== 0` left
    // a destination site's STALE flat stateAt[] scalar (from a PREVIOUS
    // occupant with nonzero state, e.g. a CapturedPiece state=2 that later
    // vacated the site — Java's own per-level remove(state,site,level,
    // graphElement) at ContainerStateStacks.java:715-737 doesn't zero the
    // vacated slot's state either, but that's harmless in Java because the
    // slot is bounds-checked out of existence by the shrunk `size()` and the
    // NEXT push always overwrites it via setState() before any read can see
    // it) leak into a freshly-arrived piece whose true state is 0, via
    // `stateAtLevel`'s empty-per-level-row fallback to the flat scalar
    // (state.ts:1607-1611). Aj Sakakil/A K'aak'il/Aj Sayil/Aj Sina'anil/Bul's
    // shared piece-move rule gates FreePiece(state 0) vs CapturingPiece
    // (state 1) on `(state at:(from) level:(level))`; a hand piece entering a
    // previously-vacated board site inherited the departed occupant's stale
    // state 2 (CapturedPiece) and matched neither branch, producing zero
    // legal moves for it forever after.
    pushed = pushed.withStateAt(this.toIndex, carryState);
    // @java addItemGeneric's stateVal overload — the state rides on the
    // NEW top level of the destination's per-level column too.
    {
      const newLevel = pushed.stackSize(this.toIndex) - 1;
      if (newLevel >= 0) pushed = pushed.withStateAtLevel(this.toIndex, newLevel, carryState);
    }
    if (carryRotation !== 0) pushed = pushed.withRotationAt(this.toIndex, carryRotation);
    // Clear the vacated source's flat channels only when the pop emptied it — a
    // shared site (two Markers entering the same gate before one races off) must
    // keep the remaining piece's value/state, which the flat channel still holds.
    if (pushed.stackSize(this.fromIndex) === 0) {
      if (carryValue !== 0) pushed = pushed.withValueAt(this.fromIndex, 0);
      if (carryState !== 0) pushed = pushed.withStateAt(this.fromIndex, 0);
      if (carryRotation !== 0) pushed = pushed.withRotationAt(this.fromIndex, 0);
      // @java Java's per-level stacking container has no separate "count"
      // channel — a stacking site's occupancy is derived directly from
      // its stack size: ContainerStateStacks.java addItem() recomputes
      // `isEmpty = (chunkStacks[site-offset].size() == 0)` after every
      // push/pop and toggles the `empty` bit set accordingly (Core/src/
      // other/state/stacking/ContainerStateStacks.java:440-448), and
      // isEmptyCell() (BaseContainerStateStacking.java:225) just reads
      // that bit. TS's hybrid countAt[] field (added to unify flat count-backed
      // piles like mancala with per-level stacks — see Game.ts "First
      // stacking call at this site", which seeds countAt[site]=1 for
      // EVERY `place Stack` placement) is only kept in sync by the
      // countBacked branch above; this per-level pop path never touches
      // it. A residual countAt surviving the pop makes
      // isOccupiedSite()/isEmptySite() misreport a fully-vacated site as
      // occupied forever (they treat any nonzero countAt as occupancy
      // regardless of whats/stacks — state.ts isOccupiedSite()). Sahkku:
      // the pioneer Marker starts at site 14 (countAt seeded 1 at setup)
      // and moves away; with countAt[14] stuck at 1, `(to (...)
      // if:(is Empty (to)))` rejected site 14 forever after, so no other
      // home-row Marker could ever step onto it — every remaining Marker
      // was permanently trapped (ply 17/31 MOVE_MISMATCH: recorded
      // 13->14 had zero matching TS candidates). Clear it in lockstep
      // with the other per-site channels cleared above.
      if (pushed.countAtSite(this.fromIndex) !== 0) {
        pushed = pushed.withCountAt(this.fromIndex, 0);
      }
    }
    // @java ActionMoveLevelFrom.java:474 updateOnTrackIndices — after relocating the
    // piece (remove level / addItemGeneric) Java keeps the onTrackIndices structure in
    // sync. The TS port mapped remove->withStackPop and addItemGeneric->withStackPush
    // but omitted this, so a Pachisi capture-return ((fromTo (from (last To) level:…)
    // (to (mapEntry "Start" …)))) moved the piece physically but left onTrackIndices
    // registered at the old site — (trackSite Move) then returned OFF and the returned
    // piece could never move again, diverging the whole replay (race/escape cluster).
    const oti = pushed.onTrackIndices;
    const loc = pushed.trackLocToIndex;
    if (oti !== undefined && loc !== undefined && movingWhat !== 0) {
      const updated = maintainOnTrackIndicesForMove(oti, loc, movingWhat, 1, this.fromIndex, this.toIndex);
      return pushed.withOnTrackIndices(updated);
    }
    return pushed;
  }
  public override actionType(): ActionType {
    return "Move";
  }
  public override from(): number {
    return this.fromIndex;
  }
  public override to(): number {
    return this.toIndex;
  }
  public override isStacking(): boolean {
    return true;
  }
}

export class ActionMoveLevelFrom extends ActionMoveLevelBase {
  private readonly fromLevelValue: number;
  public constructor(from: number, fromLevel: number, to: number) {
    super(from, to, fromLevel);
    this.fromLevelValue = fromLevel;
    this.levelFromValue = fromLevel;
  }
  public override levelFrom(): number {
    return this.fromLevelValue;
  }
}

export class ActionMoveLevelTo extends ActionMoveLevelBase {
  private readonly toLevelValue: number;
  public constructor(from: number, to: number, toLevel: number) {
    super(from, to);
    this.toLevelValue = toLevel;
    this.levelToValue = toLevel;
  }
  public override levelTo(): number {
    return this.toLevelValue;
  }
}

export class ActionMoveLevelFromLevelTo extends ActionMoveLevelBase {
  private readonly fromLevelValue: number;
  private readonly toLevelValue: number;
  public constructor(
    from: number,
    fromLevel: number,
    to: number,
    toLevel: number,
  ) {
    super(from, to, fromLevel);
    this.fromLevelValue = fromLevel;
    this.toLevelValue = toLevel;
    this.levelFromValue = fromLevel;
    this.levelToValue = toLevel;
  }
  public override levelFrom(): number {
    return this.fromLevelValue;
  }
  public override levelTo(): number {
    return this.toLevelValue;
  }
}
