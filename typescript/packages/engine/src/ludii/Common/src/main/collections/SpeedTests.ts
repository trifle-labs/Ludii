// @java Common/src/main/collections/SpeedTests.java

/**
 * Speed tests for custom collection types.
 *
 * @java main/collections/SpeedTests.java
 * @author cambolbro
 */
export class SpeedTests {

  /** @java SpeedTests.test() */
  test(): void {
    const N = 1000000;
    let startAt: number;
    let stopAt: number;
    let secs: number;

    const ints: number[] = [];
    const strings: string[] = [];

    // ----- Warm them up -----

    for (let n = 0; n < N; n++) ints.push(n);
    for (let n = 0; n < N; n++) strings.push("" + n);

    // ----- Adding integers to list -----

    console.log("Adding integers to list:");

    startAt = performance.now();
    ints.length = 0;
    for (let n = 0; n < N; n++) ints.push(n);
    stopAt = performance.now();
    secs = (stopAt - startAt) / 1000.0;
    console.log(N + " Integers added to Array in " + secs + "s.");

    // ----- Adding strings to list -----

    console.log("\nAdding strings to list:");

    startAt = performance.now();
    strings.length = 0;
    for (let n = 0; n < N; n++) strings.push("" + n);
    stopAt = performance.now();
    secs = (stopAt - startAt) / 1000.0;
    console.log(N + " Strings added to Array in " + secs + "s.");

    // ----- Adding ints to list and retrieving them as ints -----

    console.log("\nAdding ints to list and retrieving then as ints:");

    startAt = performance.now();
    ints.length = 0;
    for (let n = 0; n < N; n++) ints.push(n);
    for (const i of ints) {
      const _x = i | 0;
    }
    stopAt = performance.now();
    secs = (stopAt - startAt) / 1000.0;
    console.log(N + " Integers added to Array and retrieved in " + secs + "s.");

    // ----- Adding and sorting integers -----

    console.log("\nAdding and sorting integers:");

    startAt = performance.now();
    ints.length = 0;
    for (let n = 0; n < N; n++) ints.push(N - n);
    ints.sort((a, b) => a - b);
    stopAt = performance.now();
    secs = (stopAt - startAt) / 1000.0;
    console.log(N + " Integers added to Array and sorted in " + secs + "s.");

    // ----- Adding and sorting strings -----

    console.log("\nAdding and sorting strings:");

    startAt = performance.now();
    strings.length = 0;
    for (let n = 0; n < N; n++) strings.push("" + (N - n));
    strings.sort();
    stopAt = performance.now();
    secs = (stopAt - startAt) / 1000.0;
    console.log(N + " Strings added to Array and sorted in " + secs + "s.");
  }

  //-------------------------------------------------------------------------

  /** @java SpeedTests.main(String[]) */
  public static main(_args: string[]): void {
    const app = new SpeedTests();
    app.test();
  }
}
