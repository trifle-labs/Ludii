# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-29T18:53:06.200Z
**Trials processed:** 853  
**Wall time:** 984.0s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 1 | 0.1% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 247 | 29.0% |
| WINNER_MISMATCH | 57 | 6.7% |
| OUTCOME_OK | 428 | 50.2% |
| REPLAY_OK_NO_OUTCOME | 120 | 14.1% |

## Top 15 COMPILE_FAIL Reasons

- `Unsupported int ludeme: (edge …).`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/hunt/Hund efter Hare (Thy)`: **1** mismatches
- `board/race/escape/Ashta-kashte`: **1** mismatches
- `board/race/escape/Asi Keliya`: **1** mismatches
- `board/race/escape/Atom`: **1** mismatches
- `board/race/escape/Contrare Puff`: **1** mismatches
- `board/race/escape/Garanguet`: **1** mismatches
- `board/race/escape/Julbahar`: **1** mismatches
- `board/race/escape/Knossos Game`: **1** mismatches
- `board/race/escape/Kolica Atarakua`: **1** mismatches
- `board/race/escape/Lange Puff`: **1** mismatches
- `board/race/escape/Mahbouseh`: **1** mismatches
- `board/race/escape/Myles`: **1** mismatches
- `board/race/escape/Ofanfelling`: **1** mismatches
- `board/race/escape/Pachih`: **1** mismatches
- `board/race/escape/Pachisi`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Hund efter Hare (Thy)`
- **Ply:** 13
- **Recorded move:** `mover=2,from=12,to=8`
- **TS moves available:** 7
- **Sample TS moves:** mover=2,from=7,to=18,isPass=false, mover=2,from=7,to=8,isPass=false, mover=2,from=7,to=17,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/race/escape/Ashta-kashte`
- **Ply:** 158
- **Recorded move:** `mover=2,from=42,to=36`
- **TS moves available:** 2
- **Sample TS moves:** mover=2,from=44,to=35,isPass=false, mover=2,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Asi Keliya`
- **Ply:** 4
- **Recorded move:** `mover=4,from=21,to=29`
- **TS moves available:** 1
- **Sample TS moves:** mover=4,from=21,to=27,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Atom`
- **Ply:** 30
- **Recorded move:** `mover=1,from=24,to=23`
- **TS moves available:** 12
- **Sample TS moves:** mover=1,from=49,to=0,isPass=false, mover=1,from=49,to=1,isPass=false, mover=1,from=49,to=4,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Contrare Puff`
- **Ply:** 6
- **Recorded move:** `mover=2,from=27,to=22`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move
