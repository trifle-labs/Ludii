# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-25T23:08:27.494Z
**Trials processed:** 852  
**Wall time:** 886.5s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 311 | 36.5% |
| WINNER_MISMATCH | 65 | 7.6% |
| OUTCOME_OK | 388 | 45.5% |
| REPLAY_OK_NO_OUTCOME | 88 | 10.3% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/hunt/Go with the Floe`: **1** mismatches
- `board/hunt/Hund efter Hare (Thy)`: **1** mismatches
- `board/hunt/Hyvn aetter Hare`: **1** mismatches
- `board/hunt/Ludus Coriovalli`: **1** mismatches
- `board/hunt/Shui Yen Ho-Shang`: **1** mismatches
- `board/race/escape/Ashtapada`: **1** mismatches
- `board/race/escape/Asi Keliya`: **1** mismatches
- `board/race/escape/Chaupar`: **1** mismatches
- `board/race/escape/Contrare Puff`: **1** mismatches
- `board/race/escape/Dubblets`: **1** mismatches
- `board/race/escape/Garanguet`: **1** mismatches
- `board/race/escape/Grand Trictrac`: **1** mismatches
- `board/race/escape/Kawade Kelia`: **1** mismatches
- `board/race/escape/Kiz Tavlasi`: **1** mismatches
- `board/race/escape/Knossos Game`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Go with the Floe`
- **Ply:** 31
- **Recorded move:** `mover=2,from=-1,to=-1[Pass]`
- **TS moves available:** 13
- **Sample TS moves:** mover=2,from=32,to=24,isPass=false, mover=2,from=32,to=16,isPass=false, mover=2,from=32,to=33,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/hunt/Hund efter Hare (Thy)`
- **Ply:** 7
- **Recorded move:** `mover=2,from=2,to=8`
- **TS moves available:** 7
- **Sample TS moves:** mover=2,from=2,to=17,isPass=false, mover=2,from=2,to=3,isPass=false, mover=2,from=10,to=11,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/hunt/Hyvn aetter Hare`
- **Ply:** 0
- **Recorded move:** `mover=1,from=16,to=11`
- **TS moves available:** 12
- **Sample TS moves:** mover=1,from=12,to=0,isPass=false, mover=1,from=12,to=1,isPass=false, mover=1,from=12,to=2,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/hunt/Ludus Coriovalli`
- **Ply:** 0
- **Recorded move:** `mover=1,from=10,to=1`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 5: `board/hunt/Shui Yen Ho-Shang`
- **Ply:** 1
- **Recorded move:** `mover=2,from=0,to=3`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move
