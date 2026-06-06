// @java Common/src/main/collections/ChunkStack.java

import { ChunkSet } from "./ChunkSet.js";
import { BitTwiddling } from "../math/BitTwiddling.js";

/**
 * The three possible ChunkSets for each level of each site (for stacking games).
 *
 * @java main.collections.ChunkStack
 * @author Eric.Piette
 */
export class ChunkStack {
  // -------------------------------------------------------------------------

  /** 'what' */
  public static readonly TYPE_DEFAULT_STATE = 0;
  /** 'what' + 'who' */
  public static readonly TYPE_PLAYER_STATE = 1;
  /** 'what' + 'who' + 'state' + 'rotation' + 'value' */
  public static readonly TYPE_INDEX_STATE = 2;

  /**
   * if
   *   type == 1 --> Player State
   *   type == 2 --> Index State
   *   type == 3 --> index local state, rotation, value.
   */
  protected readonly type: number;

  /** What ChunkSet. */
  private readonly _what: ChunkSet;

  /** Who ChunkSet. */
  private readonly _who: ChunkSet | null;

  /** State ChunkSet. */
  private readonly _state: ChunkSet | null;

  /** Rotation ChunkSet. */
  private readonly _rotation: ChunkSet | null;

  /** Value ChunkSet. */
  private readonly _value: ChunkSet | null;

  /** Hidden Array ChunkSet. */
  private readonly _hidden: (ChunkSet | null)[] | null;

  /** Hidden What Array ChunkSet. */
  private readonly _hiddenWhat: (ChunkSet | null)[] | null;

  /** Hidden Who Array ChunkSet. */
  private readonly _hiddenWho: (ChunkSet | null)[] | null;

  /** Hidden Count Array ChunkSet. */
  private readonly _hiddenCount: (ChunkSet | null)[] | null;

  /** Hidden State Array ChunkSet. */
  private readonly _hiddenState: (ChunkSet | null)[] | null;

  /** Hidden Rotation Array ChunkSet. */
  private readonly _hiddenRotation: (ChunkSet | null)[] | null;

  /** Hidden Value Array ChunkSet. */
  private readonly _hiddenValue: (ChunkSet | null)[] | null;

  /** The number of components on the stack. */
  private _size: number;

  /**
   * Constructor.
   *
   * @param numComponents The number of components.
   * @param numPlayers The number of players.
   * @param numStates The number of states.
   * @param numRotation The number of rotations.
   * @param numValues The number of values.
   * @param type The type of the chunkStack.
   * @param hidden True if the game involves hidden info.
   * @java ChunkStack(int, int, int, int, int, int, boolean)
   */
  public constructor(
    numComponents: number,
    numPlayers: number,
    numStates: number,
    numRotation: number,
    numValues: number,
    type: number,
    hiddenInfo: boolean
  );
  /**
   * Copy constructor
   * @java ChunkStack(ChunkStack)
   */
  public constructor(other: ChunkStack);
  public constructor(
    arg1: number | ChunkStack,
    numPlayers?: number,
    numStates?: number,
    numRotation?: number,
    numValues?: number,
    type?: number,
    hiddenInfo?: boolean
  ) {
    if (arg1 instanceof ChunkStack) {
      const other = arg1;
      this.type = other.type;
      this._size = other._size;

      this._what = other._what.clone();
      this._who = other._who === null ? null : other._who.clone();
      this._state = other._state === null ? null : other._state.clone();
      this._rotation = other._rotation === null ? null : other._rotation.clone();
      this._value = other._value === null ? null : other._value.clone();

      if (other._hidden === null) {
        this._hidden = null;
        this._hiddenWhat = null;
        this._hiddenWho = null;
        this._hiddenState = null;
        this._hiddenRotation = null;
        this._hiddenCount = null;
        this._hiddenValue = null;
      } else {
        this._hidden = new Array(other._hidden.length).fill(null);
        this._hiddenWhat = new Array(other._hiddenWhat!.length).fill(null);
        for (let i = 1; i < this._hidden.length; ++i) {
          this._hidden[i] = other._hidden[i]!.clone();
          this._hiddenWhat![i] = other._hiddenWhat![i]!.clone();
        }

        if (this.type > 0) {
          this._hiddenWho = new Array(other._hiddenWho!.length).fill(null);
          for (let i = 1; i < this._hiddenWho.length; ++i) {
            this._hiddenWho[i] = other._hiddenWho![i]!.clone();
          }

          if (this.type > 1) {
            this._hiddenState = new Array(other._hiddenState!.length).fill(null);
            for (let i = 1; i < this._hiddenState.length; ++i) {
              this._hiddenState[i] = other._hiddenState![i]!.clone();
            }

            if (this.type >= 2) {
              this._hiddenRotation = new Array(other._hiddenRotation!.length).fill(null);
              this._hiddenCount = new Array(other._hiddenCount!.length).fill(null);
              this._hiddenValue = new Array(other._hiddenValue!.length).fill(null);

              for (let i = 1; i < this._hiddenRotation.length; ++i) {
                this._hiddenRotation[i] = other._hiddenRotation![i]!.clone();
                this._hiddenCount[i] = other._hiddenCount![i]!.clone();
                this._hiddenValue[i] = other._hiddenValue![i]!.clone();
              }
            } else {
              this._hiddenRotation = null;
              this._hiddenCount = null;
              this._hiddenValue = null;
            }
          } else {
            this._hiddenState = null;
            this._hiddenRotation = null;
            this._hiddenCount = null;
            this._hiddenValue = null;
          }
        } else {
          this._hiddenWho = null;
          this._hiddenState = null;
          this._hiddenRotation = null;
          this._hiddenCount = null;
          this._hiddenValue = null;
        }
      }
    } else {
      // Full constructor
      const numComponents = arg1;
      this.type = type!;
      this._size = 0;

      const chunkSizeWhat = BitTwiddling.nextPowerOf2(BitTwiddling.bitsRequired(numComponents));
      this._what = new ChunkSet(chunkSizeWhat, 1);

      const chunkSizeWho = BitTwiddling.nextPowerOf2(BitTwiddling.bitsRequired(numPlayers! + 1));
      if (type! > 0)
        this._who = new ChunkSet(chunkSizeWho, 1);
      else
        this._who = null;

      const chunkSizeState = BitTwiddling.nextPowerOf2(BitTwiddling.bitsRequired(numStates!));
      if (type! > 1)
        this._state = new ChunkSet(chunkSizeState, 1);
      else
        this._state = null;

      const chunkSizeRotation = BitTwiddling.nextPowerOf2(BitTwiddling.bitsRequired(numRotation!));
      if (type! >= 2)
        this._rotation = new ChunkSet(chunkSizeRotation, 1);
      else
        this._rotation = null;

      const chunkSizeValue = BitTwiddling.nextPowerOf2(BitTwiddling.bitsRequired(numValues!));
      if (type! >= 2)
        this._value = new ChunkSet(chunkSizeValue, 1);
      else
        this._value = null;

      // Hidden info
      if (hiddenInfo) {
        const chunkSizeHidden = BitTwiddling.nextPowerOf2(BitTwiddling.bitsRequired(2));

        this._hidden = new Array(numPlayers! + 1).fill(null);
        this._hiddenWhat = new Array(numPlayers! + 1).fill(null);
        for (let i = 1; i < numPlayers! + 1; i++) {
          this._hidden[i] = new ChunkSet(chunkSizeHidden, 1);
          this._hiddenWhat[i] = new ChunkSet(chunkSizeHidden, 1);
        }

        if (type! > 0) {
          this._hiddenWho = new Array(numPlayers! + 1).fill(null);
          for (let i = 1; i < numPlayers! + 1; i++)
            this._hiddenWho[i] = new ChunkSet(chunkSizeHidden, 1);

          if (type! > 1) {
            this._hiddenState = new Array(numPlayers! + 1).fill(null);
            for (let i = 1; i < numPlayers! + 1; i++)
              this._hiddenState[i] = new ChunkSet(chunkSizeHidden, 1);

            if (type! >= 2) {
              this._hiddenRotation = new Array(numPlayers! + 1).fill(null);
              this._hiddenCount = new Array(numPlayers! + 1).fill(null);
              this._hiddenValue = new Array(numPlayers! + 1).fill(null);
              for (let i = 1; i < numPlayers! + 1; i++) {
                this._hiddenRotation[i] = new ChunkSet(chunkSizeHidden, 1);
                this._hiddenCount[i] = new ChunkSet(chunkSizeHidden, 1);
                this._hiddenValue[i] = new ChunkSet(chunkSizeHidden, 1);
              }
            } else {
              this._hiddenRotation = null;
              this._hiddenCount = null;
              this._hiddenValue = null;
            }
          } else {
            this._hiddenState = null;
            this._hiddenRotation = null;
            this._hiddenCount = null;
            this._hiddenValue = null;
          }
        } else {
          this._hiddenWho = null;
          this._hiddenState = null;
          this._hiddenRotation = null;
          this._hiddenCount = null;
          this._hiddenValue = null;
        }
      } else {
        this._hidden = null;
        this._hiddenWhat = null;
        this._hiddenWho = null;
        this._hiddenState = null;
        this._hiddenRotation = null;
        this._hiddenCount = null;
        this._hiddenValue = null;
      }
    }
  }

  // -------------------------------------------------------------------------

  /** @java ChunkStack.whatChunkSet() */
  public whatChunkSet(): ChunkSet {
    return this._what;
  }

  /** @java ChunkStack.whoChunkSet() */
  public whoChunkSet(): ChunkSet | null {
    return this._who;
  }

  /** @java ChunkStack.stateChunkSet() */
  public stateChunkSet(): ChunkSet | null {
    return this._state;
  }

  /** @java ChunkStack.rotationChunkSet() */
  public rotationChunkSet(): ChunkSet | null {
    return this._rotation;
  }

  /** @java ChunkStack.valueChunkSet() */
  public valueChunkSet(): ChunkSet | null {
    return this._value;
  }

  /** @java ChunkStack.hidden() */
  public hidden(): (ChunkSet | null)[] | null {
    return this._hidden;
  }

  /** @java ChunkStack.hiddenWhat() */
  public hiddenWhat(): (ChunkSet | null)[] | null {
    return this._hiddenWhat;
  }

  /** @java ChunkStack.hiddenWho() */
  public hiddenWho(): (ChunkSet | null)[] | null {
    return this._hiddenWho;
  }

  /** @java ChunkStack.hiddenState() */
  public hiddenState(): (ChunkSet | null)[] | null {
    return this._hiddenState;
  }

  /** @java ChunkStack.hiddenRotation() */
  public hiddenRotation(): (ChunkSet | null)[] | null {
    return this._hiddenRotation;
  }

  /** @java ChunkStack.hiddenCount() */
  public hiddenCount(): (ChunkSet | null)[] | null {
    return this._hiddenCount;
  }

  /** @java ChunkStack.hiddenValue() */
  public hiddenValue(): (ChunkSet | null)[] | null {
    return this._hiddenValue;
  }

  /** @java ChunkStack.size() */
  public size(): number {
    return this._size;
  }

  /** @java ChunkStack.incrementSize() */
  public incrementSize(): void {
    this._size++;
  }

  /** @java ChunkStack.decrementSize() */
  public decrementSize(): void {
    if (this._size > 0)
      this._size--;
  }

  //--------------------- State -------------------------

  /** @java ChunkStack.state() */
  public getState(): number;
  /** @java ChunkStack.state(int) */
  public getState(level: number): number;
  public getState(level?: number): number {
    if (level === undefined) {
      if (this.type >= 2 && this._size > 0)
        return this._state!.getChunk(this._size - 1);
      return 0;
    }
    if (this.type >= 2 && level < this._size)
      return this._state!.getChunk(level);
    return 0;
  }

  /** @java ChunkStack.setState(int) */
  public setState(val: number): void;
  /** @java ChunkStack.setState(int, int) */
  public setState(val: number, level: number): void;
  public setState(val: number, level?: number): void {
    if (level === undefined) {
      if (this.type >= 2 && this._size > 0)
        this._state!.setChunk(this._size - 1, val);
    } else {
      if (this.type >= 2 && level < this._size)
        this._state!.setChunk(level, val);
    }
  }

  //----------------------- Rotation ----------------------------

  /** @java ChunkStack.rotation() */
  public getRotation(): number;
  /** @java ChunkStack.rotation(int) */
  public getRotation(level: number): number;
  public getRotation(level?: number): number {
    if (level === undefined) {
      if (this.type >= 2 && this._size > 0)
        return this._rotation!.getChunk(this._size - 1);
      return 0;
    }
    if (this.type >= 2 && level < this._size)
      return this._rotation!.getChunk(level);
    return 0;
  }

  /** @java ChunkStack.setRotation(int) */
  public setRotation(val: number): void;
  /** @java ChunkStack.setRotation(int, int) */
  public setRotation(val: number, level: number): void;
  public setRotation(val: number, level?: number): void {
    if (level === undefined) {
      if (this.type >= 2 && this._size > 0)
        this._rotation!.setChunk(this._size - 1, val);
    } else {
      if (this.type >= 2 && level < this._size)
        this._rotation!.setChunk(level, val);
    }
  }

  //--------------------------- Value ---------------------------------

  /** @java ChunkStack.value() */
  public getValue(): number;
  /** @java ChunkStack.value(int) */
  public getValue(level: number): number;
  public getValue(level?: number): number {
    if (level === undefined) {
      if (this.type >= 2 && this._size > 0)
        return this._value!.getChunk(this._size - 1);
      return 0;
    }
    if (this.type >= 2 && level < this._size)
      return this._value!.getChunk(level);
    return 0;
  }

  /** @java ChunkStack.setValue(int) */
  public setValue(val: number): void;
  /** @java ChunkStack.setValue(int, int) */
  public setValue(val: number, level: number): void;
  public setValue(val: number, level?: number): void {
    if (level === undefined) {
      if (this.type >= 2 && this._size > 0)
        this._value!.setChunk(this._size - 1, val);
    } else {
      if (this.type >= 2 && level < this._size)
        this._value!.setChunk(level, val);
    }
  }

  //--------------------------- What ------------------------------

  /** @java ChunkStack.what() */
  public what(): number;
  /** @java ChunkStack.what(int) */
  public what(level: number): number;
  public what(level?: number): number {
    if (level === undefined) {
      if (this._size > 0)
        return this._what.getChunk(this._size - 1);
      return 0;
    }
    if (level < this._size)
      return this._what.getChunk(level);
    return 0;
  }

  /** @java ChunkStack.setWhat(int) */
  public setWhat(val: number): void;
  /** @java ChunkStack.setWhat(int, int) */
  public setWhat(val: number, level: number): void;
  public setWhat(val: number, level?: number): void {
    if (level === undefined) {
      if (this._size > 0)
        this._what.setChunk(this._size - 1, val);
    } else {
      if (level < this._size)
        this._what.setChunk(level, val);
    }
  }

  //--------------------------- Who -----------------------------

  /** @java ChunkStack.who() */
  public who(): number;
  /** @java ChunkStack.who(int) */
  public who(level: number): number;
  public who(level?: number): number {
    if (level === undefined) {
      if (this._size > 0) {
        if (this.type > 0)
          return this._who!.getChunk(this._size - 1);
        return this._what.getChunk(this._size - 1);
      }
      return 0;
    }
    if (level < this._size) {
      if (this.type > 0)
        return this._who!.getChunk(level);
      return this._what.getChunk(level);
    }
    return 0;
  }

  /** @java ChunkStack.setWho(int) */
  public setWho(val: number): void;
  /** @java ChunkStack.setWho(int, int) */
  public setWho(val: number, level: number): void;
  public setWho(val: number, level?: number): void {
    if (level === undefined) {
      if (this._size > 0) {
        if (this.type > 0)
          this._who!.setChunk(this._size - 1, val);
      }
    } else {
      if (level < this._size) {
        if (this.type > 0)
          this._who!.setChunk(level, val);
      }
    }
  }

  //--------------------------- Hidden Info All -----------------------------

  /** @java ChunkStack.isHidden(int) */
  public isHidden(pid: number): boolean;
  /** @java ChunkStack.isHidden(int, int) */
  public isHidden(pid: number, level: number): boolean;
  public isHidden(pid: number, level?: number): boolean {
    if (level === undefined) {
      if (this._hidden !== null && this._size > 0)
        return this._hidden[pid]!.getChunk(this._size - 1) === 1;
      return false;
    }
    if (this._hidden !== null && level < this._size)
      return this._hidden[pid]!.getChunk(level) === 1;
    return false;
  }

  /** @java ChunkStack.setHidden(int, boolean) */
  public setHidden(pid: number, on: boolean): void;
  /** @java ChunkStack.setHidden(int, int, boolean) */
  public setHidden(pid: number, level: number, on: boolean): void;
  public setHidden(pid: number, levelOrOn: number | boolean, on?: boolean): void {
    if (on === undefined) {
      const onBool = levelOrOn as boolean;
      if (this._hidden !== null && this._size > 0)
        this._hidden[pid]!.setChunk(this._size - 1, onBool ? 1 : 0);
    } else {
      const level = levelOrOn as number;
      if (this._hidden !== null && level < this._size)
        this._hidden[pid]!.setChunk(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info What -----------------------------

  /** @java ChunkStack.isHiddenWhat(int) */
  public isHiddenWhat(pid: number): boolean;
  /** @java ChunkStack.isHiddenWhat(int, int) */
  public isHiddenWhat(pid: number, level: number): boolean;
  public isHiddenWhat(pid: number, level?: number): boolean {
    if (level === undefined) {
      if (this._hiddenWhat !== null && this._size > 0)
        return this._hiddenWhat[pid]!.getChunk(this._size - 1) === 1;
      return false;
    }
    if (this._hiddenWhat !== null && level < this._size)
      return this._hiddenWhat[pid]!.getChunk(level) === 1;
    return false;
  }

  /** @java ChunkStack.setHiddenWhat(int, boolean) */
  public setHiddenWhat(pid: number, on: boolean): void;
  /** @java ChunkStack.setHiddenWhat(int, int, boolean) */
  public setHiddenWhat(pid: number, level: number, on: boolean): void;
  public setHiddenWhat(pid: number, levelOrOn: number | boolean, on?: boolean): void {
    if (on === undefined) {
      const onBool = levelOrOn as boolean;
      if (this._hiddenWhat !== null && this._size > 0)
        this._hidden![pid]!.setChunk(this._size - 1, onBool ? 1 : 0);  // Java bug: uses hidden not hiddenWhat
    } else {
      const level = levelOrOn as number;
      if (this._hiddenWhat !== null && level < this._size)
        this._hiddenWhat[pid]!.setChunk(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info Who -----------------------------

  /** @java ChunkStack.isHiddenWho(int) */
  public isHiddenWho(pid: number): boolean;
  /** @java ChunkStack.isHiddenWho(int, int) */
  public isHiddenWho(pid: number, level: number): boolean;
  public isHiddenWho(pid: number, level?: number): boolean {
    if (level === undefined) {
      if (this._hiddenWho !== null && this._size > 0)
        return this._hiddenWho[pid]!.getChunk(this._size - 1) === 1;
      return false;
    }
    if (this._hiddenWho !== null && level < this._size)
      return this._hiddenWho[pid]!.getChunk(level) === 1;
    return false;
  }

  /** @java ChunkStack.setHiddenWho(int, boolean) */
  public setHiddenWho(pid: number, on: boolean): void;
  /** @java ChunkStack.setHiddenWho(int, int, boolean) */
  public setHiddenWho(pid: number, level: number, on: boolean): void;
  public setHiddenWho(pid: number, levelOrOn: number | boolean, on?: boolean): void {
    if (on === undefined) {
      const onBool = levelOrOn as boolean;
      if (this._hiddenWho !== null && this._size > 0)
        this._hiddenWho[pid]!.setChunk(this._size - 1, onBool ? 1 : 0);
    } else {
      const level = levelOrOn as number;
      if (this._hiddenWho !== null && level < this._size)
        this._hiddenWho[pid]!.setChunk(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info State -----------------------------

  /** @java ChunkStack.isHiddenState(int) */
  public isHiddenState(pid: number): boolean;
  /** @java ChunkStack.isHiddenState(int, int) */
  public isHiddenState(pid: number, level: number): boolean;
  public isHiddenState(pid: number, level?: number): boolean {
    if (level === undefined) {
      if (this._hiddenState !== null && this._size > 0)
        return this._hiddenState[pid]!.getChunk(this._size - 1) === 1;
      return false;
    }
    if (this._hiddenState !== null && level < this._size)
      return this._hiddenState[pid]!.getChunk(level) === 1;
    return false;
  }

  /** @java ChunkStack.setHiddenState(int, boolean) */
  public setHiddenState(pid: number, on: boolean): void;
  /** @java ChunkStack.setHiddenState(int, int, boolean) */
  public setHiddenState(pid: number, level: number, on: boolean): void;
  public setHiddenState(pid: number, levelOrOn: number | boolean, on?: boolean): void {
    if (on === undefined) {
      const onBool = levelOrOn as boolean;
      if (this._hiddenState !== null && this._size > 0)
        this._hiddenState[pid]!.setChunk(this._size - 1, onBool ? 1 : 0);
    } else {
      const level = levelOrOn as number;
      if (this._hiddenState !== null && level < this._size)
        this._hiddenState[pid]!.setChunk(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info Rotation -----------------------------

  /** @java ChunkStack.isHiddenRotation(int) */
  public isHiddenRotation(pid: number): boolean;
  /** @java ChunkStack.isHiddenRotation(int, int) */
  public isHiddenRotation(pid: number, level: number): boolean;
  public isHiddenRotation(pid: number, level?: number): boolean {
    if (level === undefined) {
      if (this._hiddenRotation !== null && this._size > 0)
        return this._hiddenRotation[pid]!.getChunk(this._size - 1) === 1;
      return false;
    }
    if (this._hiddenRotation !== null && level < this._size)
      return this._hiddenRotation[pid]!.getChunk(level) === 1;
    return false;
  }

  /** @java ChunkStack.setHiddenRotation(int, boolean) */
  public setHiddenRotation(pid: number, on: boolean): void;
  /** @java ChunkStack.setHiddenRotation(int, int, boolean) */
  public setHiddenRotation(pid: number, level: number, on: boolean): void;
  public setHiddenRotation(pid: number, levelOrOn: number | boolean, on?: boolean): void {
    if (on === undefined) {
      const onBool = levelOrOn as boolean;
      if (this._hiddenRotation !== null && this._size > 0)
        this._hiddenRotation[pid]!.setChunk(this._size - 1, onBool ? 1 : 0);
    } else {
      const level = levelOrOn as number;
      if (this._hiddenRotation !== null && level < this._size)
        this._hiddenRotation[pid]!.setChunk(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info Count -----------------------------

  /** @java ChunkStack.isHiddenCount(int) */
  public isHiddenCount(pid: number): boolean;
  /** @java ChunkStack.isHiddenCount(int, int) */
  public isHiddenCount(pid: number, level: number): boolean;
  public isHiddenCount(pid: number, level?: number): boolean {
    if (level === undefined) {
      if (this._hiddenCount !== null && this._size > 0)
        return this._hiddenCount[pid]!.getChunk(this._size - 1) === 1;
      return false;
    }
    if (this._hiddenCount !== null && level < this._size)
      return this._hiddenCount[pid]!.getChunk(level) === 1;
    return false;
  }

  /** @java ChunkStack.setHiddenCount(int, boolean) */
  public setHiddenCount(pid: number, on: boolean): void;
  /** @java ChunkStack.setHiddenCount(int, int, boolean) */
  public setHiddenCount(pid: number, level: number, on: boolean): void;
  public setHiddenCount(pid: number, levelOrOn: number | boolean, on?: boolean): void {
    if (on === undefined) {
      const onBool = levelOrOn as boolean;
      if (this._hiddenCount !== null && this._size > 0)
        this._hiddenCount[pid]!.setChunk(this._size - 1, onBool ? 1 : 0);
    } else {
      const level = levelOrOn as number;
      if (this._hiddenCount !== null && level < this._size)
        this._hiddenCount[pid]!.setChunk(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info Value -----------------------------

  /** @java ChunkStack.isHiddenValue(int) */
  public isHiddenValue(pid: number): boolean;
  /** @java ChunkStack.isHiddenValue(int, int) */
  public isHiddenValue(pid: number, level: number): boolean;
  public isHiddenValue(pid: number, level?: number): boolean {
    if (level === undefined) {
      if (this._hiddenValue !== null && this._size > 0)
        return this._hiddenValue[pid]!.getChunk(this._size - 1) === 1;
      return false;
    }
    if (this._hiddenValue !== null && level < this._size)
      return this._hiddenValue[pid]!.getChunk(level) === 1;
    return false;
  }

  /** @java ChunkStack.setHiddenValue(int, boolean) */
  public setHiddenValue(pid: number, on: boolean): void;
  /** @java ChunkStack.setHiddenValue(int, int, boolean) */
  public setHiddenValue(pid: number, level: number, on: boolean): void;
  public setHiddenValue(pid: number, levelOrOn: number | boolean, on?: boolean): void {
    if (on === undefined) {
      const onBool = levelOrOn as boolean;
      if (this._hiddenValue !== null && this._size > 0)
        this._hiddenValue[pid]!.setChunk(this._size - 1, onBool ? 1 : 0);
    } else {
      const level = levelOrOn as number;
      if (this._hiddenValue !== null && level < this._size)
        this._hiddenValue[pid]!.setChunk(level, on ? 1 : 0);
    }
  }
}
