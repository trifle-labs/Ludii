// @java Language/src/parser/Expander.java — expandRanges / expandSiteRanges
//
// Java expands number ranges (`18..21` → `18 19 20 21`) and coordinate site ranges
// (`"A1".."A5"` → `"A1" "A2" "A3" "A4" "A5"`) as a TEXT pre-pass on the .lud source
// before parsing (Expander.expand). The lexer otherwise tokenizes `18..21` as a
// single ident, which can never bind a ludeme parameter.

/** @java Expander.MAX_RANGE */
const MAX_RANGE = 1000;

/**
 * Expand number ranges `m..n` to the intermediate values (endpoints stay in place,
 * exactly like Java which only inserts the strictly-between numbers over the `..`).
 * @java Language/src/parser/Expander.java:1282 — expandRanges(String, Report)
 */
export function expandRanges(strIn: string): string {
  if (!strIn.includes("..")) return strIn;
  let str = strIn;
  let ref = 1;
  while (ref < str.length - 2) {
    if (
      str[ref] === "." && str[ref + 1] === "." &&
      isDigit(str[ref - 1]!) && isDigit(str[ref + 2]!)
    ) {
      // Is a range: expand it. @java Expander.java:1305-1349
      let c = ref - 1;
      while (c >= 0 && isDigit(str[c]!)) c--;
      c++;
      const m = parseInt(str.slice(c, ref), 10);

      c = ref + 2;
      while (c < str.length && isDigit(str[c]!)) c++;
      const n = parseInt(str.slice(ref + 2, c), 10);

      if (Math.abs(n - m) > MAX_RANGE) {
        throw new Error(`Range exceeded maximum of ${MAX_RANGE}.`);
      }

      // Insert the strictly-between values over the ".." (endpoints kept).
      let sub = " ";
      const inc = m <= n ? 1 : -1;
      for (let step = m; step !== n; step += inc) {
        if (step === m || step === n) continue;
        sub += `${step} `;
      }
      str = str.slice(0, ref) + sub + str.slice(ref + 2);
      ref += sub.length;
    }
    ref++;
  }
  return str;
}

/**
 * Expand coordinate site ranges `"A1".."C3"` to the full rectangle of coordinates
 * (`"A1" "A2" "A3" "B1" … "C3"`), replacing the whole quoted pair.
 * @java Language/src/parser/Expander.java:1360 — expandSiteRanges(String, Report)
 */
export function expandSiteRanges(strIn: string): string {
  if (!strIn.includes("..")) return strIn;
  let str = strIn;
  let ref = 1;
  while (ref < str.length - 2) {
    if (
      str[ref] === "." && str[ref + 1] === "." &&
      str[ref - 1] === '"' && str[ref + 2] === '"'
    ) {
      // Must be a site range. @java Expander.java:1390-1437
      let c = ref - 2;
      while (c >= 0 && str[c] !== '"') c--;
      const strC = str.slice(c + 1, ref - 1);

      let d = ref + 3;
      while (d < str.length && str[d] !== '"') d++;
      d++;
      const strD = str.slice(ref + 3, d - 1);

      if (strC.length < 2 || !isLetter(strC[0]!) || strD.length < 2 || !isLetter(strD[0]!)) {
        throw new Error(`Bad coordinate in site range: ${str.slice(c, d)}`);
      }
      const fromChar = strC[0]!.toUpperCase().charCodeAt(0) - 65;
      const toChar = strD[0]!.toUpperCase().charCodeAt(0) - 65;
      const fromNum = parseInt(strC.slice(1), 10);
      const toNum = parseInt(strD.slice(1), 10);

      let sub = "";
      for (let m = fromChar; m < toChar + 1; m++)
        for (let n = fromNum; n < toNum + 1; n++)
          sub += `"${String.fromCharCode(65 + m)}${n}" `;

      str = str.slice(0, c) + sub.trim() + str.slice(d);
      ref += sub.length;
    }
    ref++;
  }
  return str;
}

function isDigit(ch: string): boolean { return ch >= "0" && ch <= "9"; }
function isLetter(ch: string): boolean { return /[A-Za-z]/.test(ch); }
