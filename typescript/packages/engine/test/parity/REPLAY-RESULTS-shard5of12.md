# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-31T05:05:40.732Z
**Trials processed:** 213  
**Wall time:** 663.0s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 51 | 23.9% |
| WINNER_MISMATCH | 14 | 6.6% |
| OUTCOME_OK | 120 | 56.3% |
| REPLAY_OK_NO_OUTCOME | 28 | 13.1% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/hunt/Hund efter Hare (Thy)`: **1** mismatches
- `board/race/escape/Asi Keliya`: **1** mismatches
- `board/race/escape/Garanguet`: **1** mismatches
- `board/race/escape/Knossos Game`: **1** mismatches
- `board/race/escape/Myles`: **1** mismatches
- `board/race/escape/Pachih`: **1** mismatches
- `board/race/escape/Pareia de Entrada`: **1** mismatches
- `board/race/escape/Tugi-Epfe`: **1** mismatches
- `board/space/blocking/Lelac`: **1** mismatches
- `board/race/fill/Tandems`: **1** mismatches
- `board/race/reach/Chong (Sakhalin)`: **1** mismatches
- `board/race/reach/Football Chess`: **1** mismatches
- `board/race/reach/Ishighan`: **1** mismatches
- `board/race/reach/Kos`: **1** mismatches
- `board/race/reach/Quoridor`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Hund efter Hare (Thy)`
- **Ply:** 7
- **Recorded move:** `mover=2,from=2,to=8`
- **TS moves available:** 7
- **Sample TS moves:** mover=2,from=2,to=17,isPass=false, mover=2,from=2,to=3,isPass=false, mover=2,from=10,to=11,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/race/escape/Asi Keliya`
- **Ply:** 2
- **Recorded move:** `mover=2,from=7,to=9`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=7,to=6,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Garanguet`
- **Ply:** 11
- **Recorded move:** `mover=2,from=20,to=15`
- **TS moves available:** 3
- **Sample TS moves:** mover=1,from=4,to=1,isPass=false, mover=1,from=10,to=7,isPass=false, mover=1,from=12,to=9,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Knossos Game`
- **Ply:** 18
- **Recorded move:** `mover=2,from=15,to=9`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Myles`
- **Ply:** 16
- **Recorded move:** `mover=2,from=21,to=14`
- **TS moves available:** 4
- **Sample TS moves:** mover=2,from=16,to=16,isPass=false, mover=2,from=23,to=16,isPass=false, mover=2,from=24,to=17,isPass=false
- **Detail:** No matching TS move
