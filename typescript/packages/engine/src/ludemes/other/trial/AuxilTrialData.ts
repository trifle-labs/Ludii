// @java Core/src/other/trial/AuxilTrialData.java AuxilTrialData
/**
 * Faithful 1:1 transliteration of other.trial.AuxilTrialData.
 *
 * Wrapper for optional auxiliary data that Trials can be asked to collect
 * (state history, legal-move history, legal-move list sizes).
 *
 * Java parity: other/trial/AuxilTrialData.java
 */

import type { IMove, ITrial } from "../context/Context.js";

/** Minimal IMoves surface needed here */
export interface IAuxMoves {
  moves(): { size(): number; get(i: number): IMove; };
}

export class AuxilTrialData {

  // @java protected transient boolean storeStates = false;
  protected _storeStates: boolean = false;

  // @java protected transient boolean storeLegalMovesHistory = false;
  protected _storeLegalMovesHistory: boolean = false;

  // @java protected transient boolean storeLegalMovesHistorySizes = false;
  protected _storeLegalMovesHistorySizes: boolean = false;

  // @java protected List<State> states = null;
  // (State type is opaque here)
  protected _states: unknown[] | null = null;

  // @java protected List<List<Move>> legalMovesHistory = null;
  protected _legalMovesHistory: IMove[][] | null = null;

  // @java protected TIntArrayList legalMovesHistorySizes = null;
  protected _legalMovesHistorySizes: number[] | null = null;

  // -------------------------------------------------------------------------

  /** @java public List<State> stateHistory() */
  stateHistory(): unknown[] | null { return this._states; }

  /**
   * @java public void saveState(final State state)
   */
  saveState(state: unknown): void {
    if (this._storeStates) {
      // Deep copy deferred; store reference (matches intent for most uses)
      this._states!.push(state);
    }
  }

  /** @java public void storeStates() */
  storeStates(): void {
    if (!this._storeStates) {
      this._storeStates = true;
      this._states = [];
    }
  }

  /** @java public void storeLegalMovesHistory() */
  storeLegalMovesHistory(): void {
    if (!this._storeLegalMovesHistory) {
      this._storeLegalMovesHistory = true;
      this._legalMovesHistory = [];
    }
  }

  /** @java public void storeLegalMovesHistorySizes() */
  storeLegalMovesHistorySizes(): void {
    if (!this._storeLegalMovesHistorySizes) {
      this._storeLegalMovesHistorySizes = true;
      this._legalMovesHistorySizes = [];
    }
  }

  /** @java public void setLegalMovesHistory(final List<List<Move>> legalMovesHistory) */
  setLegalMovesHistory(legalMovesHistory: IMove[][]): void {
    this._legalMovesHistory = legalMovesHistory;
  }

  /** @java public void setLegalMovesHistorySizes(final TIntArrayList legalMovesHistorySizes) */
  setLegalMovesHistorySizes(sizes: number[]): void {
    this._legalMovesHistorySizes = sizes;
  }

  /** @java public List<List<Move>> legalMovesHistory() */
  legalMovesHistory(): IMove[][] | null { return this._legalMovesHistory; }

  /** @java public TIntArrayList legalMovesHistorySizes() */
  legalMovesHistorySizes(): number[] | null { return this._legalMovesHistorySizes; }

  // -------------------------------------------------------------------------

  /** @java public void clear() */
  clear(): void {
    if (this._states            !== null) this._states.length = 0;
    if (this._legalMovesHistory !== null) this._legalMovesHistory.length = 0;
    if (this._legalMovesHistorySizes !== null) this._legalMovesHistorySizes.length = 0;
  }

  /**
   * @java public void updateNewLegalMoves(final Moves legalMoves, final Context context)
   *
   * Captures legal-move lists / sizes as they are computed, for unit-test
   * purposes.  Requires the ITrial interface to query move counts.
   */
  updateNewLegalMoves(legalMoves: IAuxMoves, trial: ITrial): void {
    const realMoveCount = trial.numMoves() - trial.numInitialPlacementMoves();

    if (this._storeLegalMovesHistory && this._legalMovesHistory !== null) {
      // Correct for a double-call from (stalemated Next) End rule
      if (this._legalMovesHistory.length === realMoveCount + 1) {
        this._legalMovesHistory.pop();
      }
      if (this._legalMovesHistory.length === realMoveCount) {
        const historyList: IMove[] = [];
        for (let i = 0; i < legalMoves.moves().size(); i++) {
          historyList.push(legalMoves.moves().get(i));
        }
        this._legalMovesHistory.push(historyList);
      }
    }

    if (this._storeLegalMovesHistorySizes && this._legalMovesHistorySizes !== null) {
      if (this._legalMovesHistorySizes.length === realMoveCount + 1) {
        this._legalMovesHistorySizes.pop();
      }
      if (this._legalMovesHistorySizes.length === realMoveCount) {
        this._legalMovesHistorySizes.push(legalMoves.moves().size());
      }
    }
  }

  /**
   * @java public void updateFromSubtrial(final Trial subtrial)
   */
  updateFromSubtrial(subtrial: ITrial): void {
    const subAux = (subtrial as unknown as { auxilTrialData(): AuxilTrialData | null }).auxilTrialData();
    if (subAux === null) return;

    if (this._storeLegalMovesHistory && this._legalMovesHistory !== null) {
      const subHistory = subAux.legalMovesHistory();
      if (subHistory !== null) {
        for (const movesList of subHistory) {
          this._legalMovesHistory.push([...movesList]);
        }
      }
    }

    if (this._storeLegalMovesHistorySizes && this._legalMovesHistorySizes !== null) {
      const subSizes = subAux.legalMovesHistorySizes();
      if (subSizes !== null) {
        for (const s of subSizes) this._legalMovesHistorySizes.push(s);
      }
    }
  }
}
