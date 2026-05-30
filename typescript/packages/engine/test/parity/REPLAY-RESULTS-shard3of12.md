# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-30T15:01:45.167Z
**Trials processed:** 213  
**Wall time:** 341.1s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 70 | 32.9% |
| WINNER_MISMATCH | 12 | 5.6% |
| OUTCOME_OK | 106 | 49.8% |
| REPLAY_OK_NO_OUTCOME | 25 | 11.7% |

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
- `board/race/reach/Pylos`: **1** mismatches
- `board/race/reach/Setichch`: **1** mismatches
- `board/race/reach/Tamman`: **1** mismatches
- `board/race/reach/Tri EinStein Wurfelt Nicht`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Ludus Coriovalli`
- **Ply:** 0
- **Recorded move:** `mover=1,from=10,to=2`
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
- **Ply:** 79
- **Recorded move:** `mover=2,from=65,to=60`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=11,to=10,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Kiz Tavlasi`
- **Ply:** 40
- **Recorded move:** `mover=1,from=9,to=9`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=7,to=10,isPass=false, mover=1,from=9,to=12,isPass=false, mover=1,from=11,to=11,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Mughrabieh`
- **Ply:** 0
- **Recorded move:** `mover=1,from=12,to=10`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=0,to=0,isPass=false, mover=1,from=1,to=1,isPass=false, mover=1,from=2,to=2,isPass=false
- **Detail:** No matching TS move
