# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-30T22:54:35.811Z
**Trials processed:** 213  
**Wall time:** 330.3s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 56 | 26.3% |
| WINNER_MISMATCH | 14 | 6.6% |
| OUTCOME_OK | 111 | 52.1% |
| REPLAY_OK_NO_OUTCOME | 32 | 15.0% |

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
- **Ply:** 13
- **Recorded move:** `mover=2,from=12,to=8`
- **TS moves available:** 7
- **Sample TS moves:** mover=2,from=7,to=18,isPass=false, mover=2,from=7,to=8,isPass=false, mover=2,from=7,to=17,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/race/escape/Asi Keliya`
- **Ply:** 4
- **Recorded move:** `mover=4,from=21,to=29`
- **TS moves available:** 1
- **Sample TS moves:** mover=4,from=21,to=27,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Garanguet`
- **Ply:** 138
- **Recorded move:** `mover=2,from=25,to=22`
- **TS moves available:** 5
- **Sample TS moves:** mover=2,from=2,to=2,isPass=false, mover=2,from=15,to=15,isPass=false, mover=2,from=21,to=21,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Knossos Game`
- **Ply:** 40
- **Recorded move:** `mover=2,from=15,to=8`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Myles`
- **Ply:** 9
- **Recorded move:** `mover=2,from=21,to=17`
- **TS moves available:** 10
- **Sample TS moves:** mover=2,from=14,to=14,isPass=false, mover=2,from=19,to=2,isPass=false, mover=2,from=22,to=18,isPass=false
- **Detail:** No matching TS move
