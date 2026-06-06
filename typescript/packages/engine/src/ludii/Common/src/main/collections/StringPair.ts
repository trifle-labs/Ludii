// @java Common/src/main/collections/StringPair.java

import { StringRoutines } from "../StringRoutines.js";

/**
 * String pair (key, value) for metadata.
 *
 * @java main.collections.StringPair
 * @author cambolbro, Dennis Soemers
 */
export class StringPair {
  private readonly _key: string;
  private readonly _value: string;

  /**
   * Constructor
   * @java StringPair(String, String)
   */
  public constructor(key: string, value: string) {
    this._key = key;
    this._value = value;
  }

  /**
   * @return Pair's first element (the key)
   * @java StringPair.key()
   */
  public key(): string {
    return this._key;
  }

  /**
   * @return Pair's second element (the value)
   * @java StringPair.value()
   */
  public value(): string {
    return this._value;
  }

  /** @java StringPair.toString() */
  public toString(): string {
    return "{ " + StringRoutines.quote(this._key) + " " + StringRoutines.quote(this._value) + " }";
  }

  /**
   * @param str
   * @return StringPair generated from given string (in { "key" "value" } format)
   * @java StringPair.fromString(String)
   */
  public static fromString(str: string): StringPair {
    let s = str.replace(/\{/g, "");
    s = s.replace(/\}/g, "");
    s = s.replace(/"/g, "");
    s = s.trim();

    const split = s.split(" ");
    return new StringPair(split[0]!, split[1]!);
  }
}
