# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-06-01T01:26:51.943Z
**Trials processed:** 214  
**Wall time:** 422.7s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 44 | 20.6% |
| WINNER_MISMATCH | 8 | 3.7% |
| OUTCOME_OK | 129 | 60.3% |
| REPLAY_OK_NO_OUTCOME | 33 | 15.4% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/race/escape/Ashta-kashte`: **1** mismatches
- `board/race/escape/Ofanfelling`: **1** mismatches
- `board/race/escape/Pancha Keliya`: **1** mismatches
- `board/race/escape/Plakoto`: **1** mismatches
- `board/race/escape/Tokkadille`: **1** mismatches
- `board/race/escape/Yahoudieh`: **1** mismatches
- `board/race/fill/Camelot`: **1** mismatches
- `board/race/reach/Arimaa`: **1** mismatches
- `board/race/reach/Celticator`: **1** mismatches
- `board/race/reach/Gyan Chaupar`: **1** mismatches
- `board/race/reach/Set Dilth'`: **1** mismatches
- `board/race/reach/Stairs`: **1** mismatches
- `board/sow/four_rows/Makonn`: **1** mismatches
- `board/sow/four_rows/Nsumbi`: **1** mismatches
- `board/sow/two_rows/J'erin`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/race/escape/Ashta-kashte`
- **Ply:** 177
- **Recorded move:** `mover=1,from=21,to=7`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 2: `board/race/escape/Ofanfelling`
- **Ply:** 2
- **Recorded move:** `mover=2,from=13,to=13`
- **TS moves available:** 2
- **Sample TS moves:** mover=1,from=8,to=8,isPass=false, mover=1,from=12,to=12,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Pancha Keliya`
- **Ply:** 3
- **Recorded move:** `mover=1,from=26,to=32`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=26,to=28,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Plakoto`
- **Ply:** 42
- **Recorded move:** `mover=1,from=17,to=23`
- **TS moves available:** 6
- **Sample TS moves:** mover=1,from=5,to=0,isPass=false, mover=1,from=5,to=13,isPass=false, mover=1,from=9,to=3,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Tokkadille`
- **Ply:** 53
- **Recorded move:** `mover=1,from=3,to=0`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=8,to=2,isPass=false, mover=1,from=9,to=3,isPass=false, mover=1,from=10,to=4,isPass=false
- **Detail:** No matching TS move
