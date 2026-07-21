// @java Common/src/main/collections/ListStack.java

import { FastTIntArrayList } from "./FastTIntArrayList.js";

/**
 * The three possible lists for each level of each site (for card games).
 *
 * @java main/collections/ListStack.java
 * @author Eric.Piette
 */
export class ListStack {

  /** 'what' */
  public static readonly TYPE_DEFAULT_STATE  = 0;
  /** 'what' + 'who' */
  public static readonly TYPE_PLAYER_STATE   = 1;
  /** 'what' + 'who' + 'state' */
  public static readonly TYPE_INDEX_STATE    = 2;
  /** Just store 'who' */
  public static readonly TYPE_INDEX_LOCAL_STATE = 3;

  /**
   * type == 1 --> Player State
   * type == 2 --> Index State
   * type == 3 --> index local state, rotation, value.
   *
   * @java ListStack#type
   */
  private readonly type: number;

  /** What ChunkSet. @java ListStack#what */
  private readonly what: FastTIntArrayList;

  /** Who ChunkSet. @java ListStack#who */
  private readonly who: FastTIntArrayList | null;

  /** State ChunkSet. @java ListStack#state */
  private readonly state: FastTIntArrayList | null;

  /** Rotation ChunkSet. @java ListStack#rotation */
  private readonly rotation: FastTIntArrayList | null;

  /** Value ChunkSet. @java ListStack#value */
  private readonly value: FastTIntArrayList | null;

  /** Hidden Information. @java ListStack#hidden */
  private readonly hidden: Array<FastTIntArrayList | null> | null;

  /** Hidden What Information. @java ListStack#hiddenWhat */
  private readonly hiddenWhat: Array<FastTIntArrayList | null> | null;

  /** Hidden Who Information. @java ListStack#hiddenWho */
  private readonly hiddenWho: Array<FastTIntArrayList | null> | null;

  /** Hidden Count Information. @java ListStack#hiddenCount */
  private readonly hiddenCount: Array<FastTIntArrayList | null> | null;

  /** Hidden State Information. @java ListStack#hiddenState */
  private readonly hiddenState: Array<FastTIntArrayList | null> | null;

  /** Hidden Rotation Information. @java ListStack#hiddenRotation */
  private readonly hiddenRotation: Array<FastTIntArrayList | null> | null;

  /** Hidden Value Information. @java ListStack#hiddenValue */
  private readonly hiddenValue: Array<FastTIntArrayList | null> | null;

  /** The number of components on the stack. @java ListStack#size */
  private size: number;

  //-------------------------------------------------------------------------

  /**
   * Constructor.
   *
   * @param numComponents The number of components.
   * @param numPlayers    The number of players.
   * @param numStates     The number of states.
   * @param numRotation   The number of rotations.
   * @param numValues     The number of values.
   * @param type          The type of the chunkStack.
   * @param hidden        True if the game involves hidden info.
   * @java ListStack(int, int, int, int, int, int, boolean)
   */
  public constructor(
    numComponents: number,
    numPlayers: number,
    numStates: number,
    numRotation: number,
    numValues: number,
    type: number,
    hidden: boolean,
  );

  /**
   * Copy constructor.
   * @param other
   * @java ListStack(ListStack)
   */
  public constructor(other: ListStack);

  public constructor(
    arg0: number | ListStack,
    numPlayers?: number,
    numStates?: number,
    numRotation?: number,
    numValues?: number,
    type?: number,
    hidden?: boolean,
  ) {
    if (arg0 instanceof ListStack) {
      // Copy constructor
      const other = arg0;
      this.type = other.type;
      this.size = other.size;

      this.what = (other.what === null) ? new FastTIntArrayList() : new FastTIntArrayList(other.what);
      this.who = (other.who === null) ? null : new FastTIntArrayList(other.who);
      this.state = (other.state === null) ? null : new FastTIntArrayList(other.state);
      this.rotation = (other.rotation === null) ? null : new FastTIntArrayList(other.rotation);
      this.value = (other.value === null) ? null : new FastTIntArrayList(other.value);

      if (other.hidden === null) {
        this.hidden = null;
        this.hiddenWhat = null;
        this.hiddenWho = null;
        this.hiddenState = null;
        this.hiddenRotation = null;
        this.hiddenCount = null;
        this.hiddenValue = null;
      } else {
        this.hidden = other.hidden.slice();
        this.hiddenWhat = other.hiddenWhat!.slice();
        for (let i = 1; i < this.hidden.length; ++i) {
          this.hidden[i] = new FastTIntArrayList(other.hidden[i] as FastTIntArrayList);
          this.hiddenWhat![i] = new FastTIntArrayList(other.hiddenWhat![i] as FastTIntArrayList);
        }

        if (this.type > 0) {
          this.hiddenWho = other.hiddenWho!.slice();
          for (let i = 1; i < this.hiddenWho.length; ++i)
            this.hiddenWho[i] = new FastTIntArrayList(other.hiddenWho![i] as FastTIntArrayList);

          if (this.type > 1) {
            this.hiddenState = other.hiddenState!.slice();
            for (let i = 1; i < this.hiddenState.length; ++i)
              this.hiddenState[i] = new FastTIntArrayList(other.hiddenState![i] as FastTIntArrayList);

            if (this.type >= 2) {
              this.hiddenCount = other.hiddenCount!.slice();
              for (let i = 1; i < this.hiddenCount.length; ++i)
                this.hiddenCount[i] = new FastTIntArrayList(other.hiddenCount![i] as FastTIntArrayList);

              this.hiddenRotation = other.hiddenRotation!.slice();
              for (let i = 1; i < this.hiddenRotation.length; ++i)
                this.hiddenRotation[i] = new FastTIntArrayList(other.hiddenRotation![i] as FastTIntArrayList);

              this.hiddenValue = other.hiddenValue!.slice();
              for (let i = 1; i < this.hiddenValue.length; ++i)
                this.hiddenValue[i] = new FastTIntArrayList(other.hiddenValue![i] as FastTIntArrayList);
            } else {
              this.hiddenRotation = null;
              this.hiddenCount = null;
              this.hiddenValue = null;
            }
          } else {
            this.hiddenState = null;
            this.hiddenRotation = null;
            this.hiddenCount = null;
            this.hiddenValue = null;
          }
        } else {
          this.hiddenWho = null;
          this.hiddenState = null;
          this.hiddenRotation = null;
          this.hiddenCount = null;
          this.hiddenValue = null;
        }
      }
    } else {
      // Full constructor
      const t = type!;
      this.type = t;
      this.size = 0;

      // What
      this.what = new FastTIntArrayList();

      // Who
      this.who = (t > 0) ? new FastTIntArrayList() : null;

      // State
      this.state = (t > 1) ? new FastTIntArrayList() : null;

      // Rotation and Value
      if (t >= 2) {
        this.rotation = new FastTIntArrayList();
        this.value = new FastTIntArrayList();
      } else {
        this.rotation = null;
        this.value = null;
      }

      if (hidden!) {
        const np = numPlayers!;
        this.hidden = [null];
        for (let i = 1; i < np + 1; i++) this.hidden.push(new FastTIntArrayList());

        this.hiddenWhat = [null];
        for (let i = 1; i < np + 1; i++) this.hiddenWhat.push(new FastTIntArrayList());

        if (t > 0) {
          this.hiddenWho = [null];
          for (let i = 1; i < np + 1; i++) this.hiddenWho.push(new FastTIntArrayList());

          if (t > 1) {
            this.hiddenState = [null];
            for (let i = 1; i < np + 1; i++) this.hiddenState.push(new FastTIntArrayList());

            if (t >= 2) {
              this.hiddenCount = [null];
              for (let i = 1; i < np + 1; i++) this.hiddenCount.push(new FastTIntArrayList());

              this.hiddenRotation = [null];
              for (let i = 1; i < np + 1; i++) this.hiddenRotation.push(new FastTIntArrayList());

              this.hiddenValue = [null];
              for (let i = 1; i < np + 1; i++) this.hiddenValue.push(new FastTIntArrayList());
            } else {
              this.hiddenRotation = null;
              this.hiddenCount = null;
              this.hiddenValue = null;
            }
          } else {
            this.hiddenState = null;
            this.hiddenRotation = null;
            this.hiddenCount = null;
            this.hiddenValue = null;
          }
        } else {
          this.hiddenWho = null;
          this.hiddenState = null;
          this.hiddenRotation = null;
          this.hiddenCount = null;
          this.hiddenValue = null;
        }
      } else {
        this.hidden = null;
        this.hiddenWhat = null;
        this.hiddenWho = null;
        this.hiddenCount = null;
        this.hiddenState = null;
        this.hiddenRotation = null;
        this.hiddenValue = null;
      }
    }
  }

  //-------------------------------------------------------------------------

  /** @return what list. @java ListStack.whatChunkSet() */
  public whatChunkSet(): FastTIntArrayList {
    return this.what;
  }

  /** @return who list. @java ListStack.whoChunkSet() */
  public whoChunkSet(): FastTIntArrayList | null {
    return this.who;
  }

  /** @return local state list. @java ListStack.stateChunkSet() */
  public stateChunkSet(): FastTIntArrayList | null {
    return this.state;
  }

  /** @return rotation state list. @java ListStack.rotationChunkSet() */
  public rotationChunkSet(): FastTIntArrayList | null {
    return this.rotation;
  }

  /** @return value state list. @java ListStack.valueChunkSet() */
  public valueChunkSet(): FastTIntArrayList | null {
    return this.value;
  }

  /** @return hidden list for each player. @java ListStack.hiddenList() */
  public hiddenList(): Array<FastTIntArrayList | null> | null {
    return this.hidden;
  }

  /** @return hidden what list for each player. @java ListStack.hiddenWhatList() */
  public hiddenWhatList(): Array<FastTIntArrayList | null> | null {
    return this.hiddenWhat;
  }

  /** @return hidden who list for each player. @java ListStack.hiddenWhoList() */
  public hiddenWhoList(): Array<FastTIntArrayList | null> | null {
    return this.hiddenWho;
  }

  /** @return hidden Count list for each player. @java ListStack.hiddenCountList() */
  public hiddenCountList(): Array<FastTIntArrayList | null> | null {
    return this.hiddenCount;
  }

  /** @return hidden Rotation list for each player. @java ListStack.hiddenRotationList() */
  public hiddenRotationList(): Array<FastTIntArrayList | null> | null {
    return this.hiddenRotation;
  }

  /** @return hidden State list for each player. @java ListStack.hiddenStateList() */
  public hiddenStateList(): Array<FastTIntArrayList | null> | null {
    return this.hiddenState;
  }

  /** @return hidden Value list for each player. @java ListStack.hiddenValueList() */
  public hiddenValueList(): Array<FastTIntArrayList | null> | null {
    return this.hiddenValue;
  }

  /**
   * @return Current size of the stack.
   * @java ListStack.size()
   */
  public getSize(): number {
    return this.size;
  }

  /**
   * Size ++
   * @java ListStack.incrementSize()
   */
  public incrementSize(): void {
    this.size++;
  }

  /**
   * Size --
   * @java ListStack.decrementSize()
   */
  public decrementSize(): void {
    if (this.size > 0) this.size--;
  }

  /**
   * To remove the top site on the stack.
   * @java ListStack.remove()
   */
  public remove(): void {
    if (this.what !== null && this.what.size() > 0)
      this.what.removeAt(this.what.size() - 1);
    if (this.who !== null && this.who.size() > 0)
      this.who.removeAt(this.who.size() - 1);
    if (this.state !== null && this.state.size() > 0)
      this.state.removeAt(this.state.size() - 1);
    if (this.rotation !== null && this.rotation.size() > 0)
      this.rotation.removeAt(this.rotation.size() - 1);
    if (this.value !== null && this.value.size() > 0)
      this.value.removeAt(this.value.size() - 1);
  }

  /**
   * To remove a site at a specific level.
   * @param level The level.
   * @java ListStack.remove(int)
   */
  public removeAt(level: number): void {
    if (this.what !== null && this.what.size() > level && this.what.size() > 0)
      this.what.removeAt(level);
    if (this.who !== null && this.who.size() > level && this.who.size() > 0)
      this.who.removeAt(level);
    if (this.state !== null && this.state.size() > level && this.state.size() > 0)
      this.state.removeAt(level);
    if (this.rotation !== null && this.rotation.size() > level && this.rotation.size() > 0)
      this.rotation.removeAt(level);
    if (this.value !== null && this.value.size() > level && this.value.size() > 0)
      this.value.removeAt(level);
  }

  //--------------------- State -------------------------

  /**
   * @return state of the top.
   * @java ListStack.state()
   */
  public stateTop(): number {
    if (this.type >= 2 && this.size > 0 && this.state !== null && !this.state.isEmpty())
      return this.state.getQuick(this.state.size() - 1);
    return 0;
  }

  /**
   * @param level
   * @return state.
   * @java ListStack.state(int)
   */
  public stateAt(level: number): number {
    if (this.type >= 2 && this.state !== null && level < this.state.size() && level < this.size)
      return this.state.getQuick(level);
    return 0;
  }

  /**
   * Set state.
   * @param val
   * @java ListStack.setState(int)
   */
  public setState(val: number): void {
    if (this.type >= 2 && this.size > 0 && this.state !== null)
      this.state.add(val);
  }

  /**
   * Set state.
   * @param val
   * @param level
   * @java ListStack.setState(int, int)
   */
  public setStateAt(val: number, level: number): void {
    if (this.type >= 2 && this.state !== null && level < this.state.size() && level < this.size)
      this.state.set(level, val);
  }

  //----------------------- Rotation ----------------------------

  /**
   * @return rotation of the top.
   * @java ListStack.rotation()
   */
  public rotationTop(): number {
    if (this.type >= 2 && this.size > 0 && this.rotation !== null && !this.rotation.isEmpty())
      return this.rotation.getQuick(this.rotation.size() - 1);
    return 0;
  }

  /**
   * @param level
   * @return rotation.
   * @java ListStack.rotation(int)
   */
  public rotationAt(level: number): number {
    if (this.type >= 2 && this.rotation !== null && level < this.rotation.size() && level < this.size)
      return this.rotation.getQuick(level);
    return 0;
  }

  /**
   * Set rotation.
   * @param val
   * @java ListStack.setRotation(int)
   */
  public setRotation(val: number): void {
    if (this.type >= 2 && this.size > 0 && this.rotation !== null)
      this.rotation.add(val);
  }

  /**
   * Set rotation.
   * @param val
   * @param level
   * @java ListStack.setRotation(int, int)
   */
  public setRotationAt(val: number, level: number): void {
    if (this.type >= 2 && this.rotation !== null && level < this.rotation.size() && level < this.size)
      this.rotation.set(level, val);
  }

  //--------------------------- Value ---------------------------------

  /**
   * @return value of the top.
   * @java ListStack.value()
   */
  public valueTop(): number {
    if (this.type >= 2 && this.size > 0 && this.value !== null && !this.value.isEmpty())
      return this.value.getQuick(this.value.size() - 1);
    return 0;
  }

  /**
   * @param level
   * @return value.
   * @java ListStack.value(int)
   */
  public valueAt(level: number): number {
    if (this.type >= 2 && this.value !== null && level < this.value.size() && level < this.size)
      return this.value.getQuick(level);
    return 0;
  }

  /**
   * Set value.
   * @param val
   * @java ListStack.setValue(int)
   */
  public setValue(val: number): void {
    if (this.type >= 2 && this.size > 0 && this.value !== null)
      this.value.add(val);
  }

  /**
   * Set value.
   * @param val
   * @param level
   * @java ListStack.setValue(int, int)
   */
  public setValueAt(val: number, level: number): void {
    if (this.type >= 2 && this.value !== null && level < this.value.size() && level < this.size)
      this.value.set(level, val);
  }

  //--------------------------- What ------------------------------

  /**
   * @return what.
   * @java ListStack.what()
   */
  public whatTop(): number {
    if (this.size > 0 && !this.what.isEmpty())
      return this.what.getQuick(this.what.size() - 1);
    return 0;
  }

  /**
   * @param level
   * @return what.
   * @java ListStack.what(int)
   */
  public whatAt(level: number): number {
    if (level < this.size && level < this.what.size())
      return this.what.getQuick(level);
    return 0;
  }

  /**
   * Set what.
   * @param val
   * @java ListStack.setWhat(int)
   */
  public setWhat(val: number): void {
    this.what.add(val);
  }

  /**
   * Set what.
   * @param val
   * @param level
   * @java ListStack.setWhat(int, int)
   */
  public setWhatAt(val: number, level: number): void {
    if (level < this.size && level < this.what.size())
      this.what.set(level, val);
  }

  /**
   * Set what (insert at level).
   * @param val
   * @param level
   * @java ListStack.insertWhat(int, int)
   */
  public insertWhat(val: number, level: number): void {
    if (level < this.size && level < this.what.size())
      this.what.insert(level, val);
  }

  //--------------------------- Who -----------------------------

  /**
   * @return who.
   * @java ListStack.who()
   */
  public whoTop(): number {
    if (this.size > 0) {
      if (this.type > 0 && this.who !== null && !this.who.isEmpty())
        return this.who.getQuick(this.size - 1);
      return 0;
    }
    return 0;
  }

  /**
   * @param level
   * @return who.
   * @java ListStack.who(int)
   */
  public whoAt(level: number): number {
    if (level < this.size) {
      if (this.type > 0 && this.who !== null && level < this.who.size())
        return this.who.getQuick(level);
      return 0;
    }
    return 0;
  }

  /**
   * Set who.
   * @param val
   * @java ListStack.setWho(int)
   */
  public setWho(val: number): void {
    if (this.type > 0 && this.who !== null)
      this.who.add(val);
  }

  /**
   * Set who.
   * @param val
   * @param level
   * @java ListStack.setWho(int, int)
   */
  public setWhoAt(val: number, level: number): void {
    if (level < this.size && this.who !== null && level < this.who.size() && this.type > 0)
      this.who.set(level, val);
  }

  //--------------------------- Hidden Info All -----------------------------

  /**
   * @param pid The player id.
   * @return True if the site has some hidden information for the player.
   * @java ListStack.isHidden(int)
   */
  public isHidden(pid: number): boolean {
    if (this.hidden !== null && this.size > 0) {
      const h = this.hidden[pid] as FastTIntArrayList;
      return h.getQuick(this.size - 1) === 1;
    }
    return false;
  }

  /**
   * @param pid   The player id.
   * @param level The level.
   * @return True if the site has some hidden information for the player at that level.
   * @java ListStack.isHidden(int, int)
   */
  public isHiddenAt(pid: number, level: number): boolean {
    if (this.hidden !== null && level < this.size) {
      const h = this.hidden[pid] as FastTIntArrayList;
      return h.getQuick(level) === 1;
    }
    return false;
  }

  /**
   * Set Hidden for a player.
   * @param pid
   * @param on
   * @java ListStack.setHidden(int, boolean)
   */
  public setHidden(pid: number, on: boolean): void {
    if (this.hidden !== null && this.size > 0) {
      const h = this.hidden[pid] as FastTIntArrayList;
      h.set(this.size - 1, on ? 1 : 0);
    }
  }

  /**
   * Set Hidden for a player at a specific level.
   * @param pid   The player id.
   * @param level The level.
   * @param on
   * @java ListStack.setHidden(int, int, boolean)
   */
  public setHiddenAt(pid: number, level: number, on: boolean): void {
    if (this.hidden !== null && level < this.size) {
      const h = this.hidden[pid] as FastTIntArrayList;
      h.set(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info What -----------------------------

  /**
   * @param pid The player id.
   * @return True if for the site the what information is hidden for the player.
   * @java ListStack.isHiddenWhat(int)
   */
  public isHiddenWhat(pid: number): boolean {
    if (this.hiddenWhat !== null && this.size > 0) {
      const h = this.hiddenWhat[pid] as FastTIntArrayList;
      return h.getQuick(this.size - 1) === 1;
    }
    return false;
  }

  /**
   * @param pid   The player id.
   * @param level The level.
   * @return True if for the site the what information is hidden for the player at that level.
   * @java ListStack.isHiddenWhat(int, int)
   */
  public isHiddenWhatAt(pid: number, level: number): boolean {
    if (this.hiddenWhat !== null && level < this.size) {
      const h = this.hiddenWhat[pid] as FastTIntArrayList;
      return h.getQuick(level) === 1;
    }
    return false;
  }

  /**
   * Set what Hidden for a player.
   * @param pid
   * @param on
   * @java ListStack.setHiddenWhat(int, boolean)
   */
  public setHiddenWhat(pid: number, on: boolean): void {
    if (this.hiddenWhat !== null && this.size > 0) {
      const h = this.hidden![pid] as FastTIntArrayList;
      h.setQuick(this.size - 1, on ? 1 : 0);
    }
  }

  /**
   * Set What Hidden for a player at a specific level.
   * @param pid   The player id.
   * @param level The level.
   * @param on
   * @java ListStack.setHiddenWhat(int, int, boolean)
   */
  public setHiddenWhatAt(pid: number, level: number, on: boolean): void {
    if (this.hiddenWhat !== null && level < this.size) {
      const h = this.hiddenWhat[pid] as FastTIntArrayList;
      h.setQuick(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info Who -----------------------------

  /**
   * @param pid The player id.
   * @return True if for the site the who information is hidden for the player.
   * @java ListStack.isHiddenWho(int)
   */
  public isHiddenWho(pid: number): boolean {
    if (this.hiddenWho !== null && this.size > 0) {
      const h = this.hiddenWho[pid] as FastTIntArrayList;
      return h.getQuick(this.size - 1) === 1;
    }
    return false;
  }

  /**
   * @param pid   The player id.
   * @param level The level.
   * @return True if for the site the who information is hidden for the player at that level.
   * @java ListStack.isHiddenWho(int, int)
   */
  public isHiddenWhoAt(pid: number, level: number): boolean {
    if (this.hiddenWho !== null && level < this.size) {
      const h = this.hiddenWho[pid] as FastTIntArrayList;
      return h.getQuick(level) === 1;
    }
    return false;
  }

  /**
   * Set Who Hidden for a player.
   * @param pid
   * @param on
   * @java ListStack.setHiddenWho(int, boolean)
   */
  public setHiddenWho(pid: number, on: boolean): void {
    if (this.hiddenWho !== null && this.size > 0) {
      const h = this.hiddenWho[pid] as FastTIntArrayList;
      h.setQuick(this.size - 1, on ? 1 : 0);
    }
  }

  /**
   * Set Who Hidden for a player at a specific level.
   * @param pid   The player id.
   * @param level The level.
   * @param on
   * @java ListStack.setHiddenWho(int, int, boolean)
   */
  public setHiddenWhoAt(pid: number, level: number, on: boolean): void {
    if (this.hiddenWho !== null && level < this.size) {
      const h = this.hiddenWho[pid] as FastTIntArrayList;
      h.set(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info State -----------------------------

  /**
   * @param pid The player id.
   * @return True if for the site the state information is hidden for the player.
   * @java ListStack.isHiddenState(int)
   */
  public isHiddenState(pid: number): boolean {
    if (this.hiddenState !== null && this.size > 0) {
      const h = this.hiddenState[pid] as FastTIntArrayList;
      return h.getQuick(this.size - 1) === 1;
    }
    return false;
  }

  /**
   * @param pid   The player id.
   * @param level The level.
   * @return True if for the site the state information is hidden for the player at that level.
   * @java ListStack.isHiddenState(int, int)
   */
  public isHiddenStateAt(pid: number, level: number): boolean {
    if (this.hiddenState !== null && level < this.size) {
      const h = this.hiddenState[pid] as FastTIntArrayList;
      return h.getQuick(level) === 1;
    }
    return false;
  }

  /**
   * Set State Hidden for a player.
   * @param pid
   * @param on
   * @java ListStack.setHiddenState(int, boolean)
   */
  public setHiddenState(pid: number, on: boolean): void {
    if (this.hiddenState !== null && this.size > 0) {
      const h = this.hiddenState[pid] as FastTIntArrayList;
      h.setQuick(this.size - 1, on ? 1 : 0);
    }
  }

  /**
   * Set State Hidden for a player at a specific level.
   * @param pid   The player id.
   * @param level The level.
   * @param on
   * @java ListStack.setHiddenState(int, int, boolean)
   */
  public setHiddenStateAt(pid: number, level: number, on: boolean): void {
    if (this.hiddenState !== null && level < this.size) {
      const h = this.hiddenState[pid] as FastTIntArrayList;
      h.setQuick(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info Rotation -----------------------------

  /**
   * @param pid The player id.
   * @return True if for the site the rotation information is hidden for the player.
   * @java ListStack.isHiddenRotation(int)
   */
  public isHiddenRotation(pid: number): boolean {
    if (this.hiddenRotation !== null && this.size > 0) {
      const h = this.hiddenRotation[pid] as FastTIntArrayList;
      return h.getQuick(this.size - 1) === 1;
    }
    return false;
  }

  /**
   * @param pid   The player id.
   * @param level The level.
   * @return True if for the site the rotation information is hidden for the player at that level.
   * @java ListStack.isHiddenRotation(int, int)
   */
  public isHiddenRotationAt(pid: number, level: number): boolean {
    if (this.hiddenRotation !== null && level < this.size) {
      const h = this.hiddenRotation[pid] as FastTIntArrayList;
      return h.getQuick(level) === 1;
    }
    return false;
  }

  /**
   * Set Rotation Hidden for a player.
   * @param pid
   * @param on
   * @java ListStack.setHiddenRotation(int, boolean)
   */
  public setHiddenRotation(pid: number, on: boolean): void {
    if (this.hiddenRotation !== null && this.size > 0) {
      const h = this.hiddenRotation[pid] as FastTIntArrayList;
      h.setQuick(this.size - 1, on ? 1 : 0);
    }
  }

  /**
   * Set Rotation Hidden for a player at a specific level.
   * @param pid   The player id.
   * @param level The level.
   * @param on
   * @java ListStack.setHiddenRotation(int, int, boolean)
   */
  public setHiddenRotationAt(pid: number, level: number, on: boolean): void {
    if (this.hiddenRotation !== null && level < this.size) {
      const h = this.hiddenRotation[pid] as FastTIntArrayList;
      h.setQuick(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info Count -----------------------------

  /**
   * @param pid The player id.
   * @return True if for the site the count information is hidden for the player.
   * @java ListStack.isHiddenCount(int)
   */
  public isHiddenCount(pid: number): boolean {
    if (this.hiddenCount !== null && this.size > 0) {
      const h = this.hiddenCount[pid] as FastTIntArrayList;
      return h.getQuick(this.size - 1) === 1;
    }
    return false;
  }

  /**
   * @param pid   The player id.
   * @param level The level.
   * @return True if for the site the count information is hidden for the player at that level.
   * @java ListStack.isHiddenCount(int, int)
   */
  public isHiddenCountAt(pid: number, level: number): boolean {
    if (this.hiddenCount !== null && level < this.size) {
      const h = this.hiddenCount[pid] as FastTIntArrayList;
      return h.getQuick(level) === 1;
    }
    return false;
  }

  /**
   * Set Count Hidden for a player.
   * @param pid
   * @param on
   * @java ListStack.setHiddenCount(int, boolean)
   */
  public setHiddenCount(pid: number, on: boolean): void {
    if (this.hiddenCount !== null && this.size > 0) {
      const h = this.hiddenCount[pid] as FastTIntArrayList;
      h.setQuick(this.size - 1, on ? 1 : 0);
    }
  }

  /**
   * Set Count Hidden for a player at a specific level.
   * @param pid   The player id.
   * @param level The level.
   * @param on
   * @java ListStack.setHiddenCount(int, int, boolean)
   */
  public setHiddenCountAt(pid: number, level: number, on: boolean): void {
    if (this.hiddenCount !== null && level < this.size) {
      const h = this.hiddenCount[pid] as FastTIntArrayList;
      h.setQuick(level, on ? 1 : 0);
    }
  }

  //--------------------------- Hidden Info Value -----------------------------

  /**
   * @param pid The player id.
   * @return True if for the site the value information is hidden for the player.
   * @java ListStack.isHiddenValue(int)
   */
  public isHiddenValue(pid: number): boolean {
    if (this.hiddenValue !== null && this.size > 0) {
      const h = this.hiddenValue[pid] as FastTIntArrayList;
      return h.getQuick(this.size - 1) === 1;
    }
    return false;
  }

  /**
   * @param pid   The player id.
   * @param level The level.
   * @return True if for the site the value information is hidden for the player at that level.
   * @java ListStack.isHiddenValue(int, int)
   */
  public isHiddenValueAt(pid: number, level: number): boolean {
    if (this.hiddenValue !== null && level < this.size) {
      const h = this.hiddenValue[pid] as FastTIntArrayList;
      return h.getQuick(level) === 1;
    }
    return false;
  }

  /**
   * Set Value Hidden for a player.
   * @param pid
   * @param on
   * @java ListStack.setHiddenValue(int, boolean)
   */
  public setHiddenValue(pid: number, on: boolean): void {
    if (this.hiddenValue !== null && this.size > 0) {
      const h = this.hiddenValue[pid] as FastTIntArrayList;
      h.setQuick(this.size - 1, on ? 1 : 0);
    }
  }

  /**
   * Set Value Hidden for a player at a specific level.
   * @param pid   The player id.
   * @param level The level.
   * @param on
   * @java ListStack.setHiddenValue(int, int, boolean)
   */
  public setHiddenValueAt(pid: number, level: number, on: boolean): void {
    if (this.hiddenValue !== null && level < this.size) {
      const h = this.hiddenValue[pid] as FastTIntArrayList;
      h.set(level, on ? 1 : 0);
    }
  }
}
