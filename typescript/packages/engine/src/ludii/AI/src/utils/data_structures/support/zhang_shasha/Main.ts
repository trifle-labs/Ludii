// @java AI/src/utils/data_structures/support/zhang_shasha/Main.java

/**
 * Code originally from: https://github.com/ijkilchenko/ZhangShasha
 *
 * Afterwards modified for style / various improvements
 *
 * @java utils.data_structures.support.zhang_shasha.Main
 * @author Dennis Soemers
 */

import { Tree } from "./Tree.js";

/**
 * @java utils.data_structures.support.zhang_shasha.Main
 */
export class Main {

  /**
   * @java Main.main(String[])
   */
  static main(_args: string[]): void {
    // Sample trees (in preorder).
    const tree1Str1 = "f(d(a c(b)) e)";
    const tree1Str2 = "f(c(d(a b)) e)";
    // Distance: 2 (main example used in the Zhang-Shasha paper)

    const tree1Str3 = "a(b(c d) e(f g(i)))";
    const tree1Str4 = "a(b(c d) e(f g(h)))";
    // Distance: 1

    const tree1Str5 = "d";
    const tree1Str6 = "g(h)";
    // Distance: 2

    const tree1 = new Tree(tree1Str1);
    const tree2 = new Tree(tree1Str2);

    const tree3 = new Tree(tree1Str3);
    const tree4 = new Tree(tree1Str4);

    const tree5 = new Tree(tree1Str5);
    const tree6 = new Tree(tree1Str6);

    const distance1 = Tree.ZhangShasha(tree1, tree2);
    console.log("Expected 2; got " + distance1);

    const distance2 = Tree.ZhangShasha(tree3, tree4);
    console.log("Expected 1; got " + distance2);

    const distance3 = Tree.ZhangShasha(tree5, tree6);
    console.log("Expected 2; got " + distance3);

    //----------------------------------------

    const a = "game(TicTacToe players(a))";
    const b = "game(TicTacToe players(b))";

    const ta = new Tree(a);
    const tb = new Tree(b);

    const dist = Tree.ZhangShasha(ta, tb);
    console.log("dist=" + dist + ".");

    const ttt1 =
      "game(\"Tic-Tac-Toe\" " +
      "    players(\"2\") " +
      "    equipment(   " +
      "        board(square(\"3\")) " +
      "        piece(\"Disc\" P1) " +
      "        piece(\"Cross\" P2) " +
      "    ) " +
      "    rules( " +
      "        play(add(empty)) " +
      "            end(if(isLine(\"3\") result(Mover Win))) " +
      "    )" +
      ")";
    const treeA = new Tree(ttt1);
    console.log("treeA: " + treeA);

    const ttt1a =
      "game(\"Tic-Tac-Toe\" " +
      "    players(\"2\") " +
      "    equipment(   " +
      "        board(hexagon(\"3\")) " +
      "        piece(\"Disc\" P1) " +
      "        piece(\"Cross\" P2) " +
      "    ) " +
      "    rules( " +
      "        play(add(empty)) " +
      "            end(if(isLine(\"4\") result(Mover Win))) " +
      "    )" +
      ")";
    const treeAa = new Tree(ttt1a);
    console.log("treeAa: " + treeAa);

    const distX = Tree.ZhangShasha(treeA, treeA);
    const distY = Tree.ZhangShasha(treeA, treeAa);
    console.log("distX=" + distX + ", distY=" + distY + ".");

    const ttt2 =
      "(game \"Tic-Tac-Toe\" " +
      "    (players 2) " +
      "    (equipment { " +
      "        (board (hexagon 3)) " +
      "        (piece \"Disc\" P1) " +
      "        (piece \"Cross\" P2) " +
      "    }) " +
      "    (rules " +
      "        (play (add (empty))) " +
      "            (end (if (isLine 3) (result Mover Win))) " +
      "    )" +
      ")";
    const treeB = new Tree(ttt2);
    console.log("treeB: " + treeB);

    const hex =
      "(game \"Hex\" " +
      "    (players 2) " +
      "    (equipment { " +
      "        (board (rhombus 11)) " +
      "        (piece \"Ball\" Each) " +
      "        (regions P1 { (sites Side NE) (sites Side SW) } ) " +
      "        (regions P2 { (sites Side NW) (sites Side SE) } ) " +
      "    }) " +
      "    (rules " +
      "        (meta (swap)) " +
      "        (play (add (empty))) " +
      "        (end (if (isConnected Mover) (result Mover Win))) " +
      "    ) " +
      ")";
    const treeC = new Tree(hex);
    console.log("treeC: " + treeC);

    const distAA = Tree.ZhangShasha(treeA, treeA);
    const distAB = Tree.ZhangShasha(treeA, treeB);
    const distAC = Tree.ZhangShasha(treeA, treeC);
    const distBC = Tree.ZhangShasha(treeB, treeC);
    const distBA = Tree.ZhangShasha(treeB, treeA);
    const distCA = Tree.ZhangShasha(treeC, treeA);
    const distCB = Tree.ZhangShasha(treeC, treeB);

    console.log("distAA=" + distAA + ".");
    console.log("distAB=" + distAB + ", distAC=" + distAC + ", distBC=" + distBC + ".");
    console.log("distBA=" + distBA + ", distCA=" + distCA + ", distCB=" + distCB + ".");
  }
}
