# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-31T14:50:55.309Z
**Trials processed:** 214  
**Wall time:** 490.6s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 43 | 20.1% |
| WINNER_MISMATCH | 17 | 7.9% |
| OUTCOME_OK | 122 | 57.0% |
| REPLAY_OK_NO_OUTCOME | 32 | 15.0% |

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
- **Ply:** 158
- **Recorded move:** `mover=2,from=42,to=36`
- **TS moves available:** 2
- **Sample TS moves:** mover=2,from=44,to=35,isPass=false, mover=2,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 2: `board/race/escape/Ofanfelling`
- **Ply:** 2
- **Recorded move:** `mover=2,from=16,to=16`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=9,to=9,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Pancha Keliya`
- **Ply:** 4
- **Recorded move:** `mover=2,from=31,to=29`
- **TS moves available:** 1
- **Sample TS moves:** mover=2,from=31,to=33,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Plakoto`
- **Ply:** 45
- **Recorded move:** `mover=1,from=13,to=16`
- **TS moves available:** 5
- **Sample TS moves:** mover=1,from=4,to=1,isPass=false, mover=1,from=7,to=3,isPass=false, mover=1,from=8,to=4,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Tokkadille`
- **Ply:** 27
- **Recorded move:** `mover=2,from=15,to=13`
- **TS moves available:** 5
- **Sample TS moves:** mover=2,from=16,to=14,isPass=false, mover=2,from=18,to=16,isPass=false, mover=2,from=22,to=20,isPass=false
- **Detail:** No matching TS move
