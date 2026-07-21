// @java Core/src/other/Sites.java
/**
 * Faithful 1:1 transliteration of other.Sites.
 *
 * A collection of sites within a container.
 *
 * Java parity: other/Sites.java
 *
 * @author cambolbro (Java), ported to TS
 */

// ---------------------------------------------------------------------------

/**
 * A collection of sites within a container.
 *
 * @java other/Sites.java — class Sites
 */
export class Sites {
  // -------------------------------------------------------------------------

  /**
   * @java Sites#count
   */
  private _count: number = 0;

  /**
   * @java Sites#sites
   */
  private readonly _sites: number[];

  // -------------------------------------------------------------------------

  /**
   * Constructor from count.
   *
   * @param countOrSitesOrOther Number of sites, an int[], or another Sites.
   * @java Sites(int count)
   * @java Sites(int[] sites)
   * @java Sites(Sites other)
   */
  constructor(countOrSitesOrOther: number | number[] | Sites) {
    if (typeof countOrSitesOrOther === 'number') {
      // @java Sites(int count)
      this._count = countOrSitesOrOther;
      this._sites = new Array<number>(this._count);
      for (let n = 0; n < this._count; n++) {
        this._sites[n] = n;
      }
    } else if (countOrSitesOrOther instanceof Sites) {
      // @java Sites(Sites other)
      const other = countOrSitesOrOther;
      this._count = other._count;
      this._sites = new Array<number>(other._sites.length);
      // System.arraycopy(other.sites, 0, this.sites, 0, this.sites.length)
      for (let n = 0; n < this._sites.length; n++) {
        this._sites[n] = other._sites[n]!;
      }
    } else {
      // @java Sites(int[] sites)
      const sites = countOrSitesOrOther;
      this._count = sites.length;
      this._sites = new Array<number>(this._count);
      // System.arraycopy(sites, 0, this.sites, 0, this.count)
      for (let n = 0; n < this._count; n++) {
        this._sites[n] = sites[n]!;
      }
    }
  }

  // -------------------------------------------------------------------------

  /**
   * @return Number of sites.
   * @java Sites#count()
   */
  count(): number {
    return this._count;
  }

  /**
   * @return Collection of site values.
   * @java Sites#sites()
   */
  sites(): number[] {
    return this._sites;
  }

  // -------------------------------------------------------------------------

  /**
   * Note: May be sparse!
   *
   * @param newCount
   * @java Sites#set(int newCount)
   */
  setCount(newCount: number): void {
    if (newCount > this._sites.length) {
      console.log(
        `** Sites.set() A: Bad count ${newCount} for ${this._sites.length} entries.`
      );
      try {
        throw new Error('Exception.');
      } catch (e) {
        console.error(e);
      }
      return;
    }

    this._count = newCount;
    for (let n = 0; n < this._count; n++) {
      this._sites[n] = n;
    }

    for (let n = this._count; n < this._sites.length; ++n) {
      this._sites[n] = -1;
    }
  }

  /**
   * Note: May be sparse!
   *
   * @param other
   * @java Sites#set(Sites other)
   */
  set(other: Sites): void {
    if (other._count > this._sites.length) {
      console.log(
        `** Sites.set() B: Bad count ${other._count} for ${this._sites.length} entries.`
      );
      return;
    }

    this._count = other._count;
    // System.arraycopy(other.sites, 0, sites, 0, count)
    for (let n = 0; n < this._count; n++) {
      this._sites[n] = other._sites[n]!;
    }

    for (let n = this._count; n < this._sites.length; ++n) {
      this._sites[n] = -1;
    }
  }

  /**
   * @param n
   * @return Nth value.
   * @java Sites#nthValue(int n)
   */
  nthValue(n: number): number {
    return this._sites[n]!;
  }

  /**
   * @param val
   * @java Sites#add(int val)
   */
  add(val: number): void {
    if (this._count >= this._sites.length) {
      console.log(`** Sites.add(): Trying to add ${val} to full array.`);
      return;
    }

    this._sites[this._count] = val;
    this._count++;
  }

  /**
   * Remove the specified value.
   *
   * @param val
   * @java Sites#remove(int val)
   */
  remove(val: number): void {
    if (this._count < 1) {
      console.log(
        `** Sites.remove(): Trying to remove ${val} from ${this._count} entries.`
      );
      return;
    }

    // At start, sites[n]==n.
    // Once we use an entry, we swap always to a lower index,
    // So start at cell and work down...
    for (let n = Math.min(val, this._count - 1); n >= 0; n--) {
      if (this._sites[n] === val) {
        // Move tail into slot n
        this._sites[n] = this._sites[this._count - 1]!;
        this._sites[this._count - 1] = -1;
        this._count--;
        return; // n;
      }
    }

    // ...unless we added a cell back in!
    for (let n = this._count - 1; n > Math.min(val, this._count - 1); n--) {
      if (this._sites[n] === val) {
        // Move tail into slot n
        this._sites[n] = this._sites[this._count - 1]!;
        this._sites[this._count - 1] = -1;
        this._count--;
        return; // n;
      }
    }

    // Should be impossible
    // return -1;

    console.log(`** Sites.remove(): Failed to find value ${val}.`);
  }

  /**
   * Remove the Nth entry.
   *
   * @param n
   * @return Value of Nth entry.
   * @java Sites#removeNth(int n)
   */
  removeNth(n: number): number {
    if (this._count < 1) {
      console.log(
        `** Sites.remove(): Trying to remove ${n}th entry from ${this._count} entries.`
      );
      return -1;
    }

    // Move tail into slot n
    const val = this._sites[n]!;
    this._sites[n] = this._sites[this._count - 1]!;
    this._sites[this._count - 1] = -1;
    this._count--;
    return val;
  }

  // -------------------------------------------------------------------------

  /**
   * @java Sites#toString()
   */
  toString(): string {
    return `Sites{${JSON.stringify(this._sites)} (count at:= ${this._count})}`;
  }

  // -------------------------------------------------------------------------
}
