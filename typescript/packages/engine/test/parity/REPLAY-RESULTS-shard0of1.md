# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-07-15T15:12:13.402Z
**Trials processed:** 135  
**Wall time:** 185.6s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 3 | 2.2% |
| WINNER_MISMATCH | 3 | 2.2% |
| OUTCOME_OK | 122 | 90.4% |
| REPLAY_OK_NO_OUTCOME | 0 | 0.0% |
| TIMEOUT | 7 | 5.2% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/race/escape/Tsun K'i`: **1** mismatches
- `board/race/reach/Chonpa`: **1** mismatches
- `board/war/custodial/AlmaTafl`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/race/escape/Tsun K'i`
- **Ply:** 27
- **Recorded move:** `mover=1,from=8,to=4`
- **TS moves available:** 34
- **Sample TS moves:** fromTo|mover=1,from=1,to=11,isPass=false, fromTo|mover=1,from=1,to=5,isPass=false, fromTo|mover=1,from=1,to=11,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/race/reach/Chonpa`
- **Ply:** 28
- **Recorded move:** `mover=3,from=78,to=51`
- **TS moves available:** 2
- **Sample TS moves:** fromTo|mover=2,from=6,to=7,isPass=false, fromTo|mover=2,from=54,to=55,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/war/custodial/AlmaTafl`
- **Ply:** 90
- **Recorded move:** `mover=1,from=46,to=43`
- **TS moves available:** 13
- **Sample TS moves:** fromTo|mover=2,from=18,to=2,isPass=false, fromTo|mover=2,from=33,to=42,isPass=false, fromTo|mover=2,from=33,to=25,isPass=false
- **Detail:** No matching TS move
