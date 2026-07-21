# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-21T00:07:49.713Z
**Trials processed:** 426  
**Wall time:** 30.6s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 9 | 2.1% |
| START_FAIL | 1 | 0.2% |
| MOVE_MISMATCH | 324 | 76.1% |
| WINNER_MISMATCH | 35 | 8.2% |
| OUTCOME_OK | 50 | 11.7% |
| REPLAY_OK_NO_OUTCOME | 7 | 1.6% |

## Top 15 COMPILE_FAIL Reasons

- `ENOENT: no such file or directory, open '/Users/billy/GitHub`: **6**
- `Unsupported region ludeme: (value …).`: **1**
- `Unsupported int ludeme: (array …).`: **1**
- `Unsupported (sites Crossing).`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/hunt/Asalto`: **1** mismatches
- `board/hunt/Bam Blang Beh Khla`: **1** mismatches
- `board/hunt/Coyote`: **1** mismatches
- `board/hunt/Gasetavl`: **1** mismatches
- `board/hunt/Go with the Floe`: **1** mismatches
- `board/hunt/Hyvn aetter Hare`: **1** mismatches
- `board/hunt/Juroku Musashi`: **1** mismatches
- `board/hunt/Komikan`: **1** mismatches
- `board/hunt/La Liebre Perseguida`: **1** mismatches
- `board/hunt/Ludus Coriovalli`: **1** mismatches
- `board/hunt/Mao Naga Tiger Game`: **1** mismatches
- `board/hunt/Rimau-Rimau (One Tiger)`: **1** mismatches
- `board/hunt/Sher Bakar`: **1** mismatches
- `board/hunt/To Kinegi tou Lagou`: **1** mismatches
- `board/race/escape/20 Squares`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Asalto`
- **Ply:** 20
- **Recorded move:** `mover=1,from=28,to=29`
- **TS moves available:** 5
- **Sample TS moves:** mover=1,from=28,to=27,isPass=false, mover=1,from=28,to=31,isPass=false, mover=1,from=28,to=30,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/hunt/Bam Blang Beh Khla`
- **Ply:** 0
- **Recorded move:** `mover=1,from=3,to=4`
- **TS moves available:** 2
- **Sample TS moves:** mover=1,from=3,to=7,isPass=false, mover=1,from=3,to=9,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/hunt/Coyote`
- **Ply:** 1
- **Recorded move:** `mover=2,from=12,to=18`
- **TS moves available:** 3
- **Sample TS moves:** mover=2,from=12,to=11,isPass=false, mover=2,from=12,to=13,isPass=false, mover=2,from=12,to=17,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/hunt/Gasetavl`
- **Ply:** 0
- **Recorded move:** `mover=1,from=52,to=49`
- **TS moves available:** 0
- **Sample TS moves:** (none)
- **Detail:** No matching TS move

### Example 5: `board/hunt/Go with the Floe`
- **Ply:** 0
- **Recorded move:** `mover=1,from=42,to=34`
- **TS moves available:** 0
- **Sample TS moves:** (none)
- **Detail:** No matching TS move
