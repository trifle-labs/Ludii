# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-21T00:07:45.686Z
**Trials processed:** 426  
**Wall time:** 25.3s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 9 | 2.1% |
| START_FAIL | 1 | 0.2% |
| MOVE_MISMATCH | 318 | 74.6% |
| WINNER_MISMATCH | 46 | 10.8% |
| OUTCOME_OK | 47 | 11.0% |
| REPLAY_OK_NO_OUTCOME | 5 | 1.2% |

## Top 15 COMPILE_FAIL Reasons

- `ENOENT: no such file or directory, open '/Users/billy/GitHub`: **6**
- `Unsupported region ludeme: (value …).`: **1**
- `Unsupported int ludeme: (array …).`: **1**
- `Unsupported (sites Crossing).`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/hunt/Bam Blang Beh Khla`: **1** mismatches
- `board/hunt/Coyote`: **1** mismatches
- `board/hunt/Gasetavl`: **1** mismatches
- `board/hunt/Go with the Floe`: **1** mismatches
- `board/hunt/Hyvn aetter Hare`: **1** mismatches
- `board/hunt/Komikan`: **1** mismatches
- `board/hunt/La Liebre Perseguida`: **1** mismatches
- `board/hunt/Ludus Coriovalli`: **1** mismatches
- `board/hunt/Mao Naga Tiger Game`: **1** mismatches
- `board/hunt/Rimau-Rimau (One Tiger)`: **1** mismatches
- `board/hunt/Sher Bakar`: **1** mismatches
- `board/hunt/To Kinegi tou Lagou`: **1** mismatches
- `board/race/escape/20 Squares`: **1** mismatches
- `board/race/escape/Ashtapada`: **1** mismatches
- `board/race/escape/Backgammon`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Bam Blang Beh Khla`
- **Ply:** 0
- **Recorded move:** `mover=1,from=3,to=6`
- **TS moves available:** 2
- **Sample TS moves:** mover=1,from=3,to=7,isPass=false, mover=1,from=3,to=9,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/hunt/Coyote`
- **Ply:** 10
- **Recorded move:** `mover=1,from=6,to=12`
- **TS moves available:** 11
- **Sample TS moves:** mover=1,from=2,to=7,isPass=false, mover=1,from=3,to=8,isPass=false, mover=1,from=5,to=10,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/hunt/Gasetavl`
- **Ply:** 0
- **Recorded move:** `mover=1,from=50,to=51`
- **TS moves available:** 0
- **Sample TS moves:** (none)
- **Detail:** No matching TS move

### Example 4: `board/hunt/Go with the Floe`
- **Ply:** 0
- **Recorded move:** `mover=1,from=42,to=44`
- **TS moves available:** 0
- **Sample TS moves:** (none)
- **Detail:** No matching TS move

### Example 5: `board/hunt/Hyvn aetter Hare`
- **Ply:** 0
- **Recorded move:** `mover=1,from=16,to=3`
- **TS moves available:** 12
- **Sample TS moves:** mover=1,from=12,to=0,isPass=false, mover=1,from=12,to=1,isPass=false, mover=1,from=12,to=2,isPass=false
- **Detail:** No matching TS move
