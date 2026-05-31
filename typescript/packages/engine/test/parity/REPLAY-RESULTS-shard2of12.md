# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-31T07:36:17.826Z
**Trials processed:** 213  
**Wall time:** 681.2s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 63 | 29.6% |
| WINNER_MISMATCH | 7 | 3.3% |
| OUTCOME_OK | 115 | 54.0% |
| REPLAY_OK_NO_OUTCOME | 28 | 13.1% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/hunt/Ludus Coriovalli`: **1** mismatches
- `board/hunt/Shui Yen Ho-Shang`: **1** mismatches
- `board/race/escape/Ashtapada`: **1** mismatches
- `board/race/escape/Kiz Tavlasi`: **1** mismatches
- `board/race/escape/Mughrabieh`: **1** mismatches
- `board/race/escape/Pachesi`: **1** mismatches
- `board/race/escape/Panchi`: **1** mismatches
- `board/race/escape/Senet`: **1** mismatches
- `board/race/escape/Tavli`: **1** mismatches
- `board/race/escape/Tsun K'i`: **1** mismatches
- `board/race/reach/Ashere`: **1** mismatches
- `board/race/reach/India`: **1** mismatches
- `board/race/reach/Pylos`: **1** mismatches
- `board/race/reach/Setichch`: **1** mismatches
- `board/race/reach/Tamman`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Ludus Coriovalli`
- **Ply:** 0
- **Recorded move:** `mover=1,from=10,to=1`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 2: `board/hunt/Shui Yen Ho-Shang`
- **Ply:** 1
- **Recorded move:** `mover=2,from=0,to=3`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Ashtapada`
- **Ply:** 34
- **Recorded move:** `mover=1,from=64,to=3`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=25,to=33,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Kiz Tavlasi`
- **Ply:** 44
- **Recorded move:** `mover=1,from=7,to=8`
- **TS moves available:** 10
- **Sample TS moves:** mover=2,from=13,to=13,isPass=false, mover=2,from=13,to=13,isPass=false, mover=2,from=14,to=13,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Mughrabieh`
- **Ply:** 0
- **Recorded move:** `mover=1,from=12,to=9`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=0,to=0,isPass=false, mover=1,from=1,to=1,isPass=false, mover=1,from=2,to=2,isPass=false
- **Detail:** No matching TS move
