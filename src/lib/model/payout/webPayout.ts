import { START } from "../calendar";

const DAYMS = 864e5;

// Web checkout pays on a rolling basis: each day's net lands `lag` days later,
// but a payout that would fall on a weekend rolls to the following Monday (banks
// don't settle Sat/Sun). Returns, for every earning day, the index it's collected.
export function buildWebPayMap(len: number, lag: number): Int32Array {
  const map = new Int32Array(len);
  const l = Math.round(lag);
  for (let d = 0; d < len; d++) {
    let t = d + l;
    const wd = new Date(START.getTime() + t * DAYMS).getDay(); // 0=Sun … 6=Sat
    if (wd === 6) t += 2;
    else if (wd === 0) t += 1;
    map[d] = t;
  }
  return map;
}
