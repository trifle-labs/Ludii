// @java Mining/src/utils/concepts/script/MergeEdgesResultCSV.java

/**
 * Script to merge all the csv results of the edges results generated for all
 * the rulesets of the museum game.
 *
 * @java utils/concepts/script/MergeEdgesResultCSV.java
 * @author Eric.Piette
 */

// Not-yet-ported dependency escape-hatch interfaces
type FileLike = {
  listFiles: () => FileLike[];
  getAbsolutePath: () => string;
  getName: () => string;
};
type UnixPrintWriterLike = {
  print: (s: string) => void;
  println: (s: string) => void;
  close: () => void;
};

/** @java MergeEdgesResultCSV.FolderCSV */
const FolderCSV: string =
  "C:\\Users\\eric.piette\\Ludii\\Ludii\\Mining\\res\\concepts\\input\\ToMerge";

/** @java MergeEdgesResultCSV.boardOne */
const boardOne: string = "Both Extension Joined Diagonal";
/** @java MergeEdgesResultCSV.boardTwo */
const boardTwo: string = "Both Extension No Joined Diagonal";
/** @java MergeEdgesResultCSV.boardThree */
const boardThree: string = "No Extension Joined Diagonal";
/** @java MergeEdgesResultCSV.boardFour */
const boardFour: string = "No Extension No Joined Diagonal";
/** @java MergeEdgesResultCSV.boardFive */
const boardFive: string = "Top Extension Joined Diagonal ";
/** @java MergeEdgesResultCSV.boardSix */
const boardSix: string = "Top Extension No Joined Diagonal";

/** @java MergeEdgesResultCSV */
export class MergeEdgesResultCSV {

  /** @java MergeEdgesResultCSV.main(String[]) */
  public static main(_args: string[]): void {
    MergeEdgesResultCSV.createMergeFile(boardOne);
    MergeEdgesResultCSV.createMergeFile(boardTwo);
    MergeEdgesResultCSV.createMergeFile(boardThree);
    MergeEdgesResultCSV.createMergeFile(boardFour);
    MergeEdgesResultCSV.createMergeFile(boardFive);
    MergeEdgesResultCSV.createMergeFile(boardSix);
  }

  /**
   * To create a merged csv for the edges results.
   * @java MergeEdgesResultCSV.createMergeFile(String)
   */
  public static createMergeFile(boardName: string): void {
    const FileCls = (globalThis as unknown as { File: new (path: string) => FileLike }).File;
    const UnixPrintWriterCls = (globalThis as unknown as {
      UnixPrintWriter: new (file: FileLike, encoding: string) => UnixPrintWriterLike;
    }).UnixPrintWriter;
    const fsReadFile = (globalThis as unknown as {
      fsReadFileSync: (path: string, encoding: string) => string;
    }).fsReadFileSync;

    const folder: FileLike = new FileCls(FolderCSV.replace(/\\/g, "/"));

    const edgeResults: string = "EdgesResults" + boardName + ".csv";

    try {
      const mainWriter: UnixPrintWriterLike = new UnixPrintWriterCls(new FileCls(edgeResults), "UTF-8");
      try {
        for (const agentFolder of folder.listFiles()) {
          const agentName: string = agentFolder.getName();
          for (const file of agentFolder.listFiles()) {
            if (file.getName().includes(boardName)) {
              let rulesetName: string = file.getName().substring(file.getName().indexOf("-") + 1);
              rulesetName = rulesetName.substring(0, rulesetName.length - 4);
              try {
                const content: string = fsReadFile(file.getAbsolutePath().replace(/\\/g, "/"), "utf-8");
                mainWriter.print(agentName + ",");
                mainWriter.print(rulesetName + ",");
                const lines: string[] = content.split("\n");
                for (const line of lines) {
                  if (line.trim().length === 0) continue;
                  const frequency: number = parseFloat(line.substring(line.lastIndexOf(",") + 1));
                  mainWriter.print(frequency + "");
                  mainWriter.print(",");
                }
                mainWriter.println("");
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
      } finally {
        mainWriter.close();
      }
    } catch (e) {
      console.error(e);
    }
  }
}
