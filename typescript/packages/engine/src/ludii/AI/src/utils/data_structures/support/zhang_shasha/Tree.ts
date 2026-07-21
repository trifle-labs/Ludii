// @java AI/src/utils/data_structures/support/zhang_shasha/Tree.java

/**
 * Code originally from: https://github.com/ijkilchenko/ZhangShasha
 *
 * Afterwards modified for style / various improvements
 *
 * @java utils.data_structures.support.zhang_shasha.Tree
 * @author Dennis Soemers
 */

import { Node } from "./Node.js";

// ---------------------------------------------------------------------------
// TIntArrayList shim (mirrors gnu.trove.list.array.TIntArrayList)
// ---------------------------------------------------------------------------

class TIntArrayList {
  private _data: number[] = [];

  add(val: number): void {
    this._data.push(val);
  }

  getQuick(index: number): number {
    return this._data[index]!;
  }

  get(index: number): number {
    return this._data[index]!;
  }

  size(): number {
    return this._data.length;
  }

  clear(): void {
    this._data = [];
  }
}

// ---------------------------------------------------------------------------

export class Tree {

  //---------------------------------------------------------------------

  /** @java Tree.root */
  root: Node = new Node();

  /** function l() which gives the leftmost child. @java Tree.l */
  l: TIntArrayList = new TIntArrayList();

  /** List of keyroots, i.e., nodes with a left child and the tree root. @java Tree.keyroots */
  keyroots: TIntArrayList = new TIntArrayList();

  /** List of the labels of the nodes used for node comparison. @java Tree.labels */
  labels: string[] = [];

  //---------------------------------------------------------------------

  /**
   * Constructor for tree described in preorder notation, e.g. f(a b(c))
   * @param sOrRoot
   * @java Tree(String) / Tree(Node)
   */
  constructor(sOrRoot: string | Node) {
    if (typeof sOrRoot === "string") {
      try {
        const tokens = Tree._tokenise(sOrRoot);
        let pos = 0;
        const [node, nextPos] = Tree._parseTokens(new Node(), tokens, pos);
        this.root = node;
        pos = nextPos;
        if (pos !== tokens.length) {
          throw new Error("Leftover token at position " + pos + ": " + tokens[pos]);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      this.root = sOrRoot;
    }
  }

  //---------------------------------------------------------------------

  /**
   * Tokenises a preorder string representation.
   * Mirrors Java's StreamTokenizer behaviour: words and single-char tokens.
   * @java StreamTokenizer
   */
  private static _tokenise(s: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === "(" || ch === ")" || ch === "{" || ch === "}") {
        tokens.push(ch);
        i++;
      } else if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        i++;
      } else if (ch === "\"") {
        // quoted string
        let str = "\"";
        i++;
        while (i < s.length && s[i] !== "\"") {
          str += s[i];
          i++;
        }
        str += "\"";
        i++;
        tokens.push(str);
      } else {
        // word token
        let word = "";
        while (i < s.length && s[i] !== "(" && s[i] !== ")" && s[i] !== " " && s[i] !== "\t" && s[i] !== "\n" && s[i] !== "\r" && s[i] !== "{" && s[i] !== "}") {
          word += s[i];
          i++;
        }
        if (word.length > 0) tokens.push(word);
      }
    }
    return tokens;
  }

  /**
   * Recursively parses tokens into a Node tree.
   * Mirrors Java's StreamTokenizer-based parseString.
   * @java Tree.parseString(Node, StreamTokenizer)
   */
  private static _parseTokens(node: Node, tokens: string[], pos: number): [Node, number] {
    // current token is the label (a word token)
    node.label = tokens[pos]!;
    pos++;

    if (pos < tokens.length && tokens[pos] === "(") {
      pos++; // consume '('
      do {
        const child = new Node();
        const [childNode, nextPos] = Tree._parseTokens(child, tokens, pos);
        node.children.push(childNode);
        pos = nextPos;
      } while (pos < tokens.length && tokens[pos] !== ")");
      pos++; // consume ')'
    }

    return [node, pos];
  }

  //---------------------------------------------------------------------

  /**
   * @java Tree.traverse()
   */
  traverse(): void {
    // put together an ordered list of node labels of the tree
    Tree._traverseStatic(this.root, this.labels);
  }

  private static _traverseStatic(node: Node, labels: string[]): void {
    for (let i = 0; i < node.children.length; i++) {
      Tree._traverseStatic(node.children[i]!, labels);
    }
    labels.push(node.label);
  }

  /**
   * @java Tree.index()
   */
  index(): void {
    Tree._indexStatic(this.root, 0);
  }

  private static _indexStatic(node: Node, indexIn: number): number {
    let index = indexIn;
    for (let i = 0; i < node.children.length; i++) {
      index = Tree._indexStatic(node.children[i]!, index);
    }
    index++;
    node.index = index;
    return index;
  }

  /**
   * @java Tree.l()
   */
  lCompute(): void {
    // put together a function which gives l()
    this._leftmost();
    this.l = new TIntArrayList();
    this._lNode(this.root, this.l);
  }

  private _lNode(node: Node, ll: TIntArrayList): void {
    for (let i = 0; i < node.children.length; i++) {
      this._lNode(node.children[i]!, ll);
    }
    ll.add(node.leftmost !== null ? node.leftmost.index : 0);
  }

  private _leftmost(): void {
    Tree._leftmostStatic(this.root);
  }

  private static _leftmostStatic(node: Node | null): void {
    if (node === null) return;

    for (let i = 0; i < node.children.length; i++) {
      Tree._leftmostStatic(node.children[i]!);
    }
    if (node.children.length === 0) {
      node.leftmost = node;
    } else {
      node.leftmost = node.children[0]!.leftmost;
    }
  }

  /**
   * @java Tree.keyroots()
   */
  keyRootsCompute(): void {
    // calculate the keyroots
    for (let i = 0; i < this.l.size(); i++) {
      let flag = 0;
      for (let j = i + 1; j < this.l.size(); j++) {
        if (this.l.getQuick(j) === this.l.getQuick(i)) {
          flag = 1;
        }
      }
      if (flag === 0) {
        this.keyroots.add(i + 1);
      }
    }
  }

  /**
   * @java Tree.size()
   */
  size(): number {
    let treeSize = 1;
    for (const n of this.root.children) {
      treeSize += 1;
      treeSize += this._sizeNode(n);
    }
    return treeSize;
  }

  private _sizeNode(parent: Node): number {
    let treeSize = 1;
    for (const child of parent.children) {
      treeSize += 1;
      treeSize += this._sizeNode(child);
    }
    return treeSize;
  }

  //---------------------------------------------------------------------

  /**
   * @java Tree.ZhangShasha(Tree, Tree)
   */
  static ZhangShasha(tree1: Tree, tree2: Tree): number {
    tree1.index();
    tree1.lCompute();
    tree1.keyRootsCompute();
    tree1.traverse();
    tree2.index();
    tree2.lCompute();
    tree2.keyRootsCompute();
    tree2.traverse();

    const l1 = tree1.l;
    const keyroots1 = tree1.keyroots;
    const l2 = tree2.l;
    const keyroots2 = tree2.keyroots;

    // space complexity of the algorithm
    const TD: number[][] = Array.from({ length: l1.size() + 1 }, () => new Array(l2.size() + 1).fill(0));

    // solve subproblems
    for (let i1 = 1; i1 < keyroots1.size() + 1; i1++) {
      for (let j1 = 1; j1 < keyroots2.size() + 1; j1++) {
        const i = keyroots1.getQuick(i1 - 1);
        const j = keyroots2.getQuick(j1 - 1);
        TD[i]![j] = Tree._treedist(l1, l2, i, j, tree1, tree2, TD);
      }
    }

    return TD[l1.size()]![l2.size()]!;
  }

  private static _treedist(
    l1: TIntArrayList,
    l2: TIntArrayList,
    i: number,
    j: number,
    tree1: Tree,
    tree2: Tree,
    TD: number[][]
  ): number {
    const forestdist: number[][] = Array.from({ length: i + 1 }, () => new Array(j + 1).fill(0));

    // costs of the three atomic operations
    const Delete = 1;
    const Insert = 1;
    const Relabel = 1;

    forestdist[0]![0] = 0;
    for (let i1 = l1.getQuick(i - 1); i1 <= i; i1++) {
      forestdist[i1]![0] = forestdist[i1 - 1]![0]! + Delete;
    }
    for (let j1 = l2.getQuick(j - 1); j1 <= j; j1++) {
      forestdist[0]![j1] = forestdist[0]![j1 - 1]! + Insert;
    }
    for (let i1 = l1.getQuick(i - 1); i1 <= i; i1++) {
      for (let j1 = l2.getQuick(j - 1); j1 <= j; j1++) {
        const i_temp = (l1.getQuick(i - 1) > i1 - 1) ? 0 : i1 - 1;
        const j_temp = (l2.getQuick(j - 1) > j1 - 1) ? 0 : j1 - 1;
        if ((l1.getQuick(i1 - 1) === l1.getQuick(i - 1)) && (l2.getQuick(j1 - 1) === l2.get(j - 1))) {
          const Cost = (tree1.labels[i1 - 1]! === tree2.labels[j1 - 1]!) ? 0 : Relabel;
          forestdist[i1]![j1] = Math.min(
            Math.min(forestdist[i_temp]![j1]! + Delete, forestdist[i1]![j_temp]! + Insert),
            forestdist[i_temp]![j_temp]! + Cost
          );
          TD[i1]![j1] = forestdist[i1]![j1]!;
        } else {
          const i1_temp = l1.getQuick(i1 - 1) - 1;
          const j1_temp = l2.getQuick(j1 - 1) - 1;

          const i_temp2 = (l1.getQuick(i - 1) > i1_temp) ? 0 : i1_temp;
          const j_temp2 = (l2.getQuick(j - 1) > j1_temp) ? 0 : j1_temp;

          forestdist[i1]![j1] = Math.min(
            Math.min(forestdist[i_temp]![j1]! + Delete, forestdist[i1]![j_temp]! + Insert),
            forestdist[i_temp2]![j_temp2]! + TD[i1]![j1]!
          );
        }
      }
    }
    return forestdist[i]![j]!;
  }

  //---------------------------------------------------------------------

  /**
   * @java Tree.toString()
   */
  toString(): string {
    const sb: string[] = [];
    Tree._toStringStatic(this.root, sb, 0);
    return sb.join("");
  }

  private static _toStringStatic(node: Node, sb: string[], indent: number): void {
    for (let i = 0; i < indent; i++) {
      sb.push(" ");
    }
    sb.push(node.label + "\n");
    for (const child of node.children) {
      Tree._toStringStatic(child, sb, indent + 2);
    }
  }

  //---------------------------------------------------------------------

  /**
   * @java Tree.bracketNotation()
   */
  bracketNotation(): string {
    const sb: string[] = [];
    Tree._bracketNotationStatic(this.root, sb);
    return sb.join("");
  }

  private static _bracketNotationStatic(node: Node, sb: string[]): void {
    sb.push("{" + node.label);
    for (const child of node.children) {
      Tree._bracketNotationStatic(child, sb);
    }
    sb.push("}");
  }

  //---------------------------------------------------------------------
}
