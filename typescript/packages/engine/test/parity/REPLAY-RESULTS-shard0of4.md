# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-22T22:17:55.109Z
**Trials processed:** 62  
**Wall time:** 240.3s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 1 | 1.6% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 41 | 66.1% |
| WINNER_MISMATCH | 1 | 1.6% |
| OUTCOME_OK | 7 | 11.3% |
| REPLAY_OK_NO_OUTCOME | 12 | 19.4% |

## Top 15 COMPILE_FAIL Reasons

- `ENOENT: no such file or directory, open '/Users/billy/GitHub`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/war/replacement/checkmate/chaturanga/Chaturanga (12x12)`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Chaturanga (Kridakausalya 14x14)`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Main Chator`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Main Chator (Selangor)`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Sarvatobhadra`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Shatranj (Iraq)`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Shatranj Diwana Shah`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Shatranj al-Kabir`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Shatranj ar-Rumiya`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Shatren`: **1** mismatches
- `board/war/replacement/checkmate/chaturanga/Sittuyin`: **1** mismatches
- `board/war/replacement/checkmate/chess/Acedrex (Alfonso)`: **1** mismatches
- `board/war/replacement/checkmate/chess/Alice Chess`: **1** mismatches
- `board/war/replacement/checkmate/chess/Atomic Chess`: **1** mismatches
- `board/war/replacement/checkmate/chess/Brusky Chess`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/war/replacement/checkmate/chaturanga/Chaturanga (12x12)`
- **Ply:** 476
- **Recorded move:** `mover=1,from=130,to=104`
- **TS moves available:** 61
- **Sample TS moves:** mover=1,from=13,to=25,isPass=false, mover=1,from=13,to=37,isPass=false, mover=1,from=13,to=14,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/war/replacement/checkmate/chaturanga/Chaturanga (Kridakausalya 14x14)`
- **Ply:** 584
- **Recorded move:** `mover=1,from=174,to=188`
- **TS moves available:** 74
- **Sample TS moves:** mover=1,from=56,to=70,isPass=false, mover=1,from=56,to=84,isPass=false, mover=1,from=56,to=57,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/war/replacement/checkmate/chaturanga/Main Chator`
- **Ply:** 172
- **Recorded move:** `mover=1,from=30,to=38`
- **TS moves available:** 36
- **Sample TS moves:** mover=1,from=5,to=13,isPass=false, mover=1,from=5,to=21,isPass=false, mover=1,from=5,to=29,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/war/replacement/checkmate/chaturanga/Main Chator (Selangor)`
- **Ply:** 229
- **Recorded move:** `mover=1,from=63,to=54`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=61,to=53,isPass=false, mover=1,from=61,to=52,isPass=false, mover=1,from=63,to=46,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/war/replacement/checkmate/chaturanga/Sarvatobhadra`
- **Ply:** 0
- **Recorded move:** `mover=1,from=-1,to=-1`
- **TS moves available:** 14
- **Sample TS moves:** mover=1,from=1,to=18,isPass=false, mover=1,from=1,to=16,isPass=false, mover=1,from=2,to=18,isPass=false
- **Detail:** No matching TS move
