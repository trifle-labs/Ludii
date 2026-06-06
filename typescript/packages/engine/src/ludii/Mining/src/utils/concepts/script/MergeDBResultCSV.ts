// @java Mining/src/utils/concepts/script/MergeDBResultCSV.java

/**
 * Script to merge all the CSV results of many jobs in the cluster for the db
 * and compute the ids of each line in the resulting csv.
 * Because PhPMyAdmin accepts only files up to 2048 Ko, It is necessary to
 * generate multiple files.
 *
 * @java utils/concepts/script/MergeDBResultCSV.java
 * @author Eric.Piette
 */

// Not-yet-ported dependency escape-hatch interfaces
type FileLike = {
  listFiles: () => FileLike[];
  getAbsolutePath: () => string;
  getName: () => string;
};
type UnixPrintWriterLike = { println: (s: string) => void; close: () => void };

/** @java MergeDBResultCSV.FolderCSV */
const FolderCSV: string = "C:\\Users\\ericp\\Ludii\\Ludii\\Mining\\res\\concepts\\input\\ToMerge";

/** @java MergeDBResultCSV */
export class MergeDBResultCSV {

  /** @java MergeDBResultCSV.main(String[]) */
  public static main(_args: string[]): void {
    const FileCls = (globalThis as unknown as { File: new (path: string) => FileLike }).File;
    const UnixPrintWriterCls = (globalThis as unknown as {
      UnixPrintWriter: new (file: FileLike, encoding: string) => UnixPrintWriterLike;
    }).UnixPrintWriter;
    const fsReadFile = (globalThis as unknown as {
      fsReadFileSync: (path: string, encoding: string) => string;
    }).fsReadFileSync;

    const folder: FileLike = new FileCls(FolderCSV.replace(/\\/g, "/"));
    // const linelimit = 50000;

    const csvFiles: FileLike[] = [];
    for (const file of folder.listFiles())
      csvFiles.push(file);

    const fileName: string = "RulesetConcepts";
    let fileNumber: number = 0;
    const extensionName: string = ".csv";
    let id: number = 1;

    const linesToWrite: string[] = [];
    try {
      const mainWriter: UnixPrintWriterLike = new UnixPrintWriterCls(
        new FileCls(fileName + fileNumber + extensionName),
        "UTF-8"
      );
      for (const csv of csvFiles) {
        try {
          const content: string = fsReadFile(csv.getAbsolutePath().replace(/\\/g, "/"), "utf-8");
          const lines: string[] = content.split("\n");
          for (const line of lines) {
            if (line.trim().length === 0) continue;
            const lineFromComa: string = line.substring(line.indexOf(","));
            const idRuleset: string = lineFromComa.substring(1, 3);
            if (idRuleset !== "-1") {
              linesToWrite.push(id + lineFromComa);
              id++;
              //							if(id % linelimit == 1)
              //							{
              //								fileNumber++;
              //								mainWriter = new UnixPrintWriter(new File(fileName + fileNumber + extensionName), "UTF-8");
              //							}
            }
          }
        } catch (e) {
          console.error(e);
        }
      }

      for (const conceptLine of linesToWrite)
        mainWriter.println(conceptLine);
      mainWriter.close();
    } catch (e) {
      console.error(e);
    }
  }
}
