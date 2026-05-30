# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-30T17:19:55.852Z
**Trials processed:** 214  
**Wall time:** 268.6s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 1 | 0.5% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 53 | 24.8% |
| WINNER_MISMATCH | 14 | 6.5% |
| OUTCOME_OK | 113 | 52.8% |
| REPLAY_OK_NO_OUTCOME | 33 | 15.4% |

## Top 15 COMPILE_FAIL Reasons

- `Unsupported int ludeme: (edge …).`: **1**

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
- `board/sow/four_rows/Hus (Nama)`: **1** mismatches
- `board/sow/four_rows/Makonn`: **1** mismatches
- `board/sow/four_rows/Nsumbi`: **1** mismatches

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
- **Ply:** 39
- **Recorded move:** `mover=2,from=17,to=13`
- **TS moves available:** 13
- **Sample TS moves:** mover=1,from=4,to=2,isPass=false, mover=1,from=5,to=3,isPass=false, mover=1,from=5,to=1,isPass=false
- **Detail:** No matching TS move
