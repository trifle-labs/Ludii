# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-06-06T12:48:22.529Z
**Trials processed:** 14  
**Wall time:** 0.6s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 12 | 85.7% |
| WINNER_MISMATCH | 0 | 0.0% |
| OUTCOME_OK | 2 | 14.3% |
| REPLAY_OK_NO_OUTCOME | 0 | 0.0% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/sow/three_rows/Gabata (Adowa)`: **2** mismatches
- `board/sow/three_rows/Gabata (Aksum)`: **2** mismatches
- `board/sow/three_rows/Rab'e`: **2** mismatches
- `board/sow/three_rows/Selus`: **2** mismatches
- `board/sow/three_rows/Selus (Massawa)`: **2** mismatches
- `board/sow/three_rows/The Concentration Game`: **2** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/sow/three_rows/Gabata (Adowa)`
- **Ply:** 102
- **Recorded move:** `mover=1,from=17,to=17`
- **TS moves available:** 5
- **Sample TS moves:** mover=2,from=15,to=15,isPass=false, mover=2,from=13,to=13,isPass=false, mover=2,from=6,to=6,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/sow/three_rows/Gabata (Adowa)`
- **Ply:** 132
- **Recorded move:** `mover=1,from=2,to=2`
- **TS moves available:** 5
- **Sample TS moves:** mover=1,from=1,to=1,isPass=false, mover=1,from=4,to=4,isPass=false, mover=1,from=11,to=11,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/sow/three_rows/Gabata (Aksum)`
- **Ply:** 113
- **Recorded move:** `mover=2,from=14,to=14`
- **TS moves available:** 2
- **Sample TS moves:** mover=2,from=16,to=16,isPass=false, mover=2,from=15,to=15,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/sow/three_rows/Gabata (Aksum)`
- **Ply:** 46
- **Recorded move:** `mover=1,from=0,to=0`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 5: `board/sow/three_rows/Rab'e`
- **Ply:** 17
- **Recorded move:** `mover=1,from=-1,to=-1[Pass]`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=15,to=15,isPass=false
- **Detail:** No matching TS move
