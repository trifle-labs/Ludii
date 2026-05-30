# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-30T17:56:30.556Z
**Trials processed:** 213  
**Wall time:** 283.5s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 74 | 34.7% |
| WINNER_MISMATCH | 9 | 4.2% |
| OUTCOME_OK | 109 | 51.2% |
| REPLAY_OK_NO_OUTCOME | 21 | 9.9% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/race/escape/Contrare Puff`: **1** mismatches
- `board/race/escape/Lange Puff`: **1** mismatches
- `board/race/escape/Mahbouseh`: **1** mismatches
- `board/race/escape/Nyout`: **1** mismatches
- `board/race/escape/Pahada Keliya`: **1** mismatches
- `board/race/escape/XII Scripta`: **1** mismatches
- `board/race/fill/Barca`: **1** mismatches
- `board/race/fill/Gadis`: **1** mismatches
- `board/race/reach/Archimedes`: **1** mismatches
- `board/race/reach/EinStein Wurfelt Nicht`: **1** mismatches
- `board/race/reach/Geister`: **1** mismatches
- `board/race/reach/Kawasukuts`: **1** mismatches
- `board/race/reach/Saturankam`: **1** mismatches
- `board/race/reach/Squadro`: **1** mismatches
- `board/race/reach/There and Back`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/race/escape/Contrare Puff`
- **Ply:** 6
- **Recorded move:** `mover=2,from=22,to=17`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 2: `board/race/escape/Lange Puff`
- **Ply:** 6
- **Recorded move:** `mover=2,from=18,to=15`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 3: `board/race/escape/Mahbouseh`
- **Ply:** 0
- **Recorded move:** `mover=1,from=12,to=11`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=0,to=0,isPass=false, mover=1,from=1,to=1,isPass=false, mover=1,from=2,to=2,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/race/escape/Nyout`
- **Ply:** 95
- **Recorded move:** `mover=2,from=27,to=27`
- **TS moves available:** 4
- **Sample TS moves:** mover=2,from=13,to=15,isPass=false, mover=2,from=13,to=1,isPass=false, mover=2,from=23,to=25,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/race/escape/Pahada Keliya`
- **Ply:** 42
- **Recorded move:** `mover=2,from=96,to=21`
- **TS moves available:** 6
- **Sample TS moves:** mover=2,from=0,to=3,isPass=false, mover=2,from=0,to=6,isPass=false, mover=2,from=54,to=59,isPass=false
- **Detail:** No matching TS move
