# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-22T22:21:42.871Z
**Trials processed:** 62  
**Wall time:** 227.7s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 1 | 1.6% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 38 | 61.3% |
| WINNER_MISMATCH | 1 | 1.6% |
| OUTCOME_OK | 9 | 14.5% |
| REPLAY_OK_NO_OUTCOME | 13 | 21.0% |

## Top 15 COMPILE_FAIL Reasons

- `ENOENT: no such file or directory, open '/Users/billy/GitHub`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/war/replacement/checkmate/chaturanga/Main Chator`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Sarvatobhadra`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Shatranj (Iraq)`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Shatranj al-Kabir`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Shatranj ar-Rumiya`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Shatren`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Sittuyin`: **1** mismatches
- `board/war/replacement/checkmate/chess/Acedrex (Alfonso)`: **1** mismatches
- `board/war/replacement/checkmate/chess/Alice Chess`: **1** mismatches
- `board/war/replacement/checkmate/chess/Atomic Chess`: **1** mismatches
- `board/war/replacement/checkmate/chess/Brusky Chess`: **1** mismatches
- `board/war/replacement/checkmate/chess/De Vasa Chess`: **1** mismatches
- `board/war/replacement/checkmate/chess/Fischer Random Chess`: **1** mismatches
- `board/war/replacement/checkmate/chess/Four-Player Chess`: **1** mismatches
- `board/war/replacement/checkmate/chess/Grande Acedrex`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/war/replacement/checkmate/chaturanga/Main Chator`
- **Ply:** 77
- **Recorded move:** `mover=2,from=43,to=35`
- **TS moves available:** 29
- **Sample TS moves:** mover=2,from=2,to=19,isPass=false, mover=2,from=2,to=8,isPass=false, mover=2,from=2,to=17,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/war/replacement/checkmate/chaturanga/Sarvatobhadra`
- **Ply:** 4
- **Recorded move:** `mover=1,from=-1,to=-1`
- **TS moves available:** 15
- **Sample TS moves:** mover=1,from=1,to=0,isPass=false, mover=1,from=2,to=18,isPass=false, mover=1,from=2,to=0,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/war/replacement/checkmate/chaturanga/Shatranj (Iraq)`
- **Ply:** 165
- **Recorded move:** `mover=2,from=31,to=22`
- **TS moves available:** 21
- **Sample TS moves:** mover=2,from=12,to=20,isPass=false, mover=2,from=12,to=13,isPass=false, mover=2,from=12,to=14,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/war/replacement/checkmate/chaturanga/Shatranj al-Kabir`
- **Ply:** 1
- **Recorded move:** `mover=2,from=116,to=119`
- **TS moves available:** 26
- **Sample TS moves:** mover=2,from=89,to=78,isPass=false, mover=2,from=90,to=79,isPass=false, mover=2,from=91,to=80,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/war/replacement/checkmate/chaturanga/Shatranj ar-Rumiya`
- **Ply:** 0
- **Recorded move:** `mover=1,from=19,to=18`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move
