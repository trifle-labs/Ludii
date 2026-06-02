/**
 * @java metadata/info/Info.java Info
 *
 * General information about the game.
 * Holds a list of InfoItem entries (description, source, version,
 * classification, origin, etc.).
 *
 * @author Matthew.Stephenson and cambolbro
 *
 * @example (info { (description "Description of The game") (source "Source of
 *          the game") (version "1.0.0") (classification
 *          "board/space/territory") (origin "Origin of the game.") })
 */

import type { MetadataItem } from "../MetadataItem.js";
import type { InfoItem } from "./InfoItem.js";
import { Aliases } from "./database/Aliases.js";
import { Author } from "./database/Author.js";
import { Classification } from "./database/Classification.js";
import { Credit } from "./database/Credit.js";
import { InfoDate } from "./database/Date.js";
import { Description } from "./database/Description.js";
import { InfoId } from "./database/Id.js";
import { Origin } from "./database/Origin.js";
import { Publisher } from "./database/Publisher.js";
import { InfoRules } from "./database/Rules.js";
import { Source } from "./database/Source.js";
import { Version } from "./database/Version.js";

export class Info implements MetadataItem {
  /**
   * @java metadata/info/Info.java — items field
   * The list of info items.
   */
  readonly items: InfoItem[] = [];

  /**
   * @java metadata/info/Info.java — constructor
   *
   * Java uses @Or: exactly one of `item` or `items` must be non-null.
   * In the TypeScript port both are optional (null maps to undefined),
   * mirroring the empty-constructor path used internally.
   *
   * @param item  A single info item.
   * @param items An array of info items.
   */
  public constructor(
    item?: InfoItem | null,
    items?: readonly InfoItem[] | null,
  ) {
    if (items != null) {
      for (const i of items) {
        this.items.push(i);
      }
    } else if (item != null) {
      this.items.push(item);
    }
    // If both are null/undefined, items stays empty (used by default constructor path).
  }

  // -------------------------------------------------------------------------

  /**
   * @java metadata/info/Info.java — addToMap(Map)
   * Add each item to a string-keyed map by class simple name.
   */
  public addToMap(map: Map<string, MetadataItem>): void {
    for (const item of this.items) {
      map.set(item.constructor.name, item);
    }
  }

  /**
   * @java metadata/info/Info.java — getItem()
   * @returns All the items (unmodifiable view).
   */
  public getItem(): readonly InfoItem[] {
    return this.items;
  }

  // -------------------------------------------------------------------------

  /**
   * @java metadata/info/Info.java — getSource()
   * @returns The source(s) of the game's rules.
   */
  public getSource(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof Source) result.push(item.source());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getId()
   * @returns The ruleset database table Id(s).
   */
  public getId(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof InfoId) result.push(item.id());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getRules()
   * @returns English description(s) of the rules.
   */
  public getRules(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof InfoRules) result.push(item.rules());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getAuthor()
   * @returns The author(s) of the game.
   */
  public getAuthor(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof Author) result.push(item.author());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getDate()
   * @returns The date(s) the game was created.
   */
  public getDate(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof InfoDate) result.push(item.date());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getPublisher()
   * @returns The publisher(s) of the game.
   */
  public getPublisher(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof Publisher) result.push(item.publisher());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getCredit()
   * @returns The credit(s) of the game.
   */
  public getCredit(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof Credit) result.push(item.credit());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getDescription()
   * @returns English description(s) of the game.
   */
  public getDescription(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof Description) result.push(item.description());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getOrigin()
   * @returns The origin(s) of the game.
   */
  public getOrigin(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof Origin) result.push(item.origin());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getClassification()
   * @returns The classification(s) of the game.
   */
  public getClassification(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof Classification) result.push(item.classification());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getVersion()
   * @returns The version(s) of the game.
   */
  public getVersion(): string[] {
    const result: string[] = [];
    for (const item of this.items) {
      if (item instanceof Version) result.push(item.version());
    }
    return result;
  }

  /**
   * @java metadata/info/Info.java — getAliases()
   * @returns The aliases of the game, or an empty array.
   */
  public getAliases(): readonly string[] {
    for (const item of this.items) {
      if (item instanceof Aliases) return item.aliases();
    }
    return [];
  }

  // -------------------------------------------------------------------------

  /** @java metadata/info/Info.java — toString() */
  public toString(): string {
    const open  = this.items.length <= 1 ? "" : "{";
    const close = this.items.length <= 1 ? "" : "}";
    let sb = `    (info ${open}\n`;
    for (const item of this.items) {
      if (item != null) sb += `        ${item.toString()}`;
    }
    sb += `    ${close})\n`;
    return sb;
  }
}
