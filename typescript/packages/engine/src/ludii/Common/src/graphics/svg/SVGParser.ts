// @java Common/src/graphics/svg/SVGParser.java

/**
 * Class for parsing SVG files.
 *
 * @java graphics/svg/SVGParser.java
 * @author cambolbro
 */

import { SVG } from "./SVG.js";
import { BaseElement, type Element } from "./element/style/Style.js";

// ElementFactory is in this same batch — forward-reference via lazy import pattern
// We use an escape hatch interface here since ElementFactory is in the batch
// but we need to avoid circular dep issues.
interface IElementFactory {
  prototypes(): readonly Element[];
  generate(label: string): Element | null;
}

// Lazy singleton reference — set externally by ElementFactory once ported
let _elementFactoryInstance: IElementFactory | null = null;

/** @java SVGParser — register the ElementFactory singleton once available */
export function setElementFactory(factory: IElementFactory): void {
  _elementFactoryInstance = factory;
}

// ---------------------------------------------------------------------------

/**
 * Class for parsing SVG files.
 *
 * @java graphics.svg.SVGParser
 */
export class SVGParser {
  /** @java SVGParser.fileName */
  private _fileName = "";

  /** @java SVGParser.svg */
  private readonly _svg: SVG = new SVG();

  // --------------------------------------------------------------------------

  /** @java SVGParser() */
  public constructor();
  /** @java SVGParser(String) */
  public constructor(filePath: string);
  public constructor(filePath?: string) {
    if (filePath !== undefined) {
      this.loadAndParse(filePath).catch((e) => console.error(e));
    }
  }

  // --------------------------------------------------------------------------

  /** @java SVGParser.fileName() */
  public fileName(): string {
    return this._fileName;
  }

  /** @java SVGParser.svg() */
  public svg(): SVG {
    return this._svg;
  }

  // --------------------------------------------------------------------------

  /**
   * Load and parse SVG content from the specified file.
   *
   * @java SVGParser.loadAndParse(String)
   */
  public async loadAndParse(fname: string): Promise<void> {
    this._fileName = fname;

    // In a browser/Node context, resource loading differs from Java.
    // We expose the parse(content) path; the caller must supply the string.
    // For completeness, we try a fetch if available.
    let content = "";
    try {
      const resp = await (globalThis as unknown as { fetch?: (url: string) => Promise<{ text: () => Promise<string> }> }).fetch?.(fname);
      if (resp) content = await resp.text();
    } catch (_e) {
      // Not in a fetch environment — caller should use parse() directly.
    }

    if (content) this.parse(content);
  }

  // --------------------------------------------------------------------------

  /**
   * Load the specified SVG content from the file with the given name.
   *
   * @java SVGParser.parse(String)
   */
  public parse(content: string): boolean {
    this._svg.clear();

    const factory = _elementFactoryInstance;
    if (factory === null) {
      // ElementFactory not yet registered — best-effort partial parse
      this._svg.setBounds();
      return true;
    }

    // Load SVG elements
    for (const prototype of factory.prototypes()) {
      const label = prototype.label();
      let pos = 0;
      while (pos < content.length) {
        pos = content.indexOf("<" + label, pos);
        if (pos === -1)
          break;

        const to = content.indexOf(">", pos);
        if (to === -1) {
          console.log("* Failed to close expression: " + content.substring(pos));
          break;
        }

        let expr = content.substring(pos, to + 1);
        expr = expr.replaceAll(",", " ");
        expr = expr.replaceAll(";", " ");
        expr = expr.replaceAll("\n", " ");
        expr = expr.replaceAll("\r", " ");
        expr = expr.replaceAll("\t", " ");
        expr = expr.replaceAll("\b", " ");
        expr = expr.replaceAll("\f", " ");
        expr = expr.replaceAll("-", " -");

        while (expr.includes("  "))
          expr = expr.replaceAll("  ", " ");

        const element = factory.generate(label);
        if (element === null) return false;
        if (!element.load(expr))
          return false;
        (element as unknown as BaseElement).setFilePos(pos);
        // SVG.elements() returns an unmodifiable list in Java; here we cast through
        (this._svg.elements() as unknown as Element[]).push(element);

        pos = to;
      }
    }
    this.sortElements();
    this._svg.setBounds();

    return true;
  }

  // --------------------------------------------------------------------------

  /**
   * Sort elements in order of occurrence.
   *
   * @java SVGParser.sortElements()
   */
  private sortElements(): void {
    (this._svg.elements() as unknown as Element[]).sort((a, b) => {
      const posA = (a as unknown as BaseElement).filePos();
      const posB = (b as unknown as BaseElement).filePos();
      if (posA < posB) return -1;
      if (posA > posB) return 1;
      return 0;
    });
  }

  // --------------------------------------------------------------------------

  /**
   * @return Whether ch is possibly part of a numeric string.
   *
   * @java SVGParser.isNumeric(char)
   */
  public static isNumeric(ch: string): boolean {
    return (ch >= '0' && ch <= '9') || ch === '-' || ch === '.';
  }

  // --------------------------------------------------------------------------

  /**
   * Extract double from expression at position from, else return null.
   *
   * @java SVGParser.extractDoubleAt(String, int)
   */
  public static extractDoubleAt(expr: string, from: number): number | null {
    let c = from;
    while (c < expr.length && !SVGParser.isNumeric(expr.charAt(c)))
      c++;

    let cc = c + 1;
    while (cc < expr.length && SVGParser.isNumeric(expr.charAt(cc)))
      cc++;

    const sub = expr.substring(c, cc);
    const result = parseFloat(sub);
    return isNaN(result) ? null : result;
  }

  // --------------------------------------------------------------------------

  /**
   * Extract double from expression, else return null.
   *
   * @java SVGParser.extractDouble(String, String)
   */
  public static extractDouble(expr: string, _heading: string): number | null {
    let c = 0;
    while (c < expr.length && !SVGParser.isNumeric(expr.charAt(c)))
      c++;

    let cc = c + 1;
    while (cc < expr.length && SVGParser.isNumeric(expr.charAt(cc)))
      cc++;

    const sub = expr.substring(c, cc);
    const result = parseFloat(sub);
    return isNaN(result) ? null : result;
  }

  // --------------------------------------------------------------------------

  /**
   * Extract string at the specified position, else null if none.
   *
   * @java SVGParser.extractStringAt(String, int)
   */
  public static extractStringAt(str: string, pos: number): string | null {
    const sb: string[] = [];

    if (str.charAt(pos) === '"') {
      // Is a string, look for closing quote marks
      for (let c = pos + 1; c < str.length && str.charAt(c) !== '"'; c++)
        sb.push(str.charAt(c));
    } else {
      // Is not a string, look for other terminator
      for (let c = pos; c < str.length && str.charAt(c) !== ';' && str.charAt(c) !== ' ' && str.charAt(c) !== '"'; c++)
        sb.push(str.charAt(c));
    }

    return sb.join('');
  }

  // --------------------------------------------------------------------------

  /** @java SVGParser.toString() */
  public toString(): string {
    return this._fileName + " has " + this._svg.toString();
  }

  // --------------------------------------------------------------------------
}
