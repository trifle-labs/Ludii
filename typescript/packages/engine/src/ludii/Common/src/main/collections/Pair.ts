// @java Common/src/main/collections/Pair.java

/**
 * String pair (key, value) for metadata.
 *
 * @java main.collections.Pair
 * @author Michel--Deletie Cyprien
 */
export class Pair<A, B> {
  private readonly _key: A;
  private readonly _value: B;

  /**
   * Constructor
   * @java Pair(A, B)
   */
  public constructor(key: A, value: B) {
    this._key = key;
    this._value = value;
  }

  /**
   * @return Pair's first element (the key)
   * @java Pair.key()
   */
  public key(): A {
    return this._key;
  }

  /**
   * @return Pair's second element (the value)
   * @java Pair.value()
   */
  public value(): B {
    return this._value;
  }
}
