# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-06-02T05:46:32.728Z
**Trials processed:** 678  
**Wall time:** 86.7s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 0 | 0.0% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 403 | 59.4% |
| WINNER_MISMATCH | 105 | 15.5% |
| OUTCOME_OK | 157 | 23.2% |
| REPLAY_OK_NO_OUTCOME | 13 | 1.9% |

## Top 15 COMPILE_FAIL Reasons


## Top 15 MOVE_MISMATCH Games

- `board/space/blocking/4 Squared`: **2** mismatches
- `board/war/replacement/eliminate/all/Banqi`: **2** mismatches
- `board/space/blocking/Co Chan Cho`: **2** mismatches
- `board/space/blocking/Dodo`: **2** mismatches
- `experimental/Epoxy`: **2** mismatches
- `experimental/Ex Nihilo`: **2** mismatches
- `board/space/blocking/Game of Dwarfs`: **2** mismatches
- `board/space/blocking/Garrisons`: **2** mismatches
- `board/space/blocking/Hex Amazons`: **2** mismatches
- `board/space/blocking/Ho-Bag Gonu`: **2** mismatches
- `board/space/blocking/Janes Soppi (Symmetrical)`: **2** mismatches
- `board/space/blocking/L Game`: **2** mismatches
- `board/space/blocking/Madelinette`: **2** mismatches
- `board/space/blocking/NoGo`: **2** mismatches
- `board/space/blocking/Orthokon`: **2** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/space/blocking/4 Squared`
- **Ply:** 10
- **Recorded move:** `mover=1,from=61,to=71`
- **TS moves available:** 90
- **Sample TS moves:** mover=1,from=100,to=1,isPass=false, mover=1,from=100,to=2,isPass=false, mover=1,from=100,to=3,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/space/blocking/4 Squared`
- **Ply:** 15
- **Recorded move:** `mover=2,from=81,to=87`
- **TS moves available:** 85
- **Sample TS moves:** mover=2,from=101,to=0,isPass=false, mover=2,from=101,to=2,isPass=false, mover=2,from=101,to=3,isPass=false
- **Detail:** No matching TS move

### Example 3: `board/war/replacement/eliminate/all/Banqi`
- **Ply:** 0
- **Recorded move:** `mover=1,from=7,to=7`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 4: `board/war/replacement/eliminate/all/Banqi`
- **Ply:** 0
- **Recorded move:** `mover=1,from=0,to=0`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move

### Example 5: `board/space/blocking/Co Chan Cho`
- **Ply:** 0
- **Recorded move:** `mover=1,from=4,to=2`
- **TS moves available:** 1
- **Sample TS moves:** mover=1,from=-1,to=-1,isPass=true
- **Detail:** No matching TS move
