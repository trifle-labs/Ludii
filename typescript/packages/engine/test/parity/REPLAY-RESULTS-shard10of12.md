# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-31T02:49:14.700Z
**Trials processed:** 213  
**Wall time:** 756.7s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 71 | 33.3% |
| WINNER_MISMATCH | 8 | 3.8% |
| OUTCOME_OK | 110 | 51.6% |
| REPLAY_OK_NO_OUTCOME | 24 | 11.3% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/race/escape/Contrare Puff`: **1** mismatches
- `board/race/escape/Lange Puff`: **1** mismatches
- `board/race/escape/Mahbouseh`: **1** mismatches
- `board/race/escape/Pahada Keliya`: **1** mismatches
- `board/race/escape/XII Scripta`: **1** mismatches
- `board/race/fill/Barca`: **1** mismatches
- `board/race/fill/Gadis`: **1** mismatches
- `board/race/reach/Archimedes`: **1** mismatches
- `board/race/reach/EinStein Wurfelt Nicht`: **1** mismatches
- `board/race/reach/Geister`: **1** mismatches
- `board/race/reach/Kawasukuts`: **1** mismatches
- `board/race/reach/Saturankam`: **1** mismatches
- `board/race/reach/Sig wa Duqqan (Houmt al-Arbah)`: **1** mismatches
- `board/race/reach/There and Back`: **1** mismatches
- `board/sow/four_rows/Bao`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/race/escape/Contrare Puff`
- **Ply:** 6
- **Recorded move:** `mover=2,from=27,to=22`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 2: `board/race/escape/Lange Puff`
- **Ply:** 6
- **Recorded move:** `mover=2,from=27,to=25`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Mahbouseh`
- **Ply:** 0
- **Recorded move:** `mover=1,from=12,to=11`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=0,to=0,isPass=false, mover=1,from=1,to=1,isPass=false, mover=1,from=2,to=2,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Pahada Keliya`
- **Ply:** 56
- **Recorded move:** `mover=1,from=96,to=9`
- **TS moves available:** 6
- **Sample TS moves:** mover=1,from=10,to=11,isPass=false, mover=1,from=10,to=16,isPass=false, mover=1,from=34,to=50,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/race/escape/XII Scripta`
- **Ply:** 5
- **Recorded move:** `mover=1,from=37,to=27`
- **TS moves available:** 14
- **Sample TS moves:** mover=1,from=8,to=25,isPass=false, mover=1,from=8,to=25,isPass=false, mover=1,from=8,to=9,isPass=false
- **Detail:** No matching TS move
