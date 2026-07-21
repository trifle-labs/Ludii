# Ludii TS Engine — Golden Trial Replay Parity Results

**Date:** 2026-05-21T00:08:13.400Z
**Trials processed:** 426  
**Wall time:** 50.3s

## Bucket Summary

| Bucket | Count | % |
|--------|-------|---|
| COMPILE_FAIL | 14 | 3.3% |
| START_FAIL | 0 | 0.0% |
| MOVE_MISMATCH | 307 | 72.1% |
| WINNER_MISMATCH | 51 | 12.0% |
| OUTCOME_OK | 44 | 10.3% |
| REPLAY_OK_NO_OUTCOME | 10 | 2.3% |

## Top 15 COMPILE_FAIL Reasons

- `ENOENT: no such file or directory, open '/Users/billy/GitHub`: **10**
- `Unsupported moves ludeme: (seq …).`: **2**
- `Unsupported region ludeme: (value …).`: **1**
- `Unsupported int ludeme: (mod …).`: **1**

## Top 15 MOVE_MISMATCH Games

- `board/hunt/Bouge Shodra`: **1** mismatches
- `board/hunt/Demala Diviyan Keliya`: **1** mismatches
- `board/hunt/Hund efter Hare (Thy)`: **1** mismatches
- `board/hunt/Kaooa`: **1** mismatches
- `board/hunt/Koti Keliya`: **1** mismatches
- `board/hunt/Merimueng-rimueng`: **1** mismatches
- `board/hunt/Rimau-Rimau (Two Tigers)`: **1** mismatches
- `board/hunt/Sher Bakr`: **1** mismatches
- `board/race/escape/58 Holes`: **1** mismatches
- `board/race/escape/Baralie`: **1** mismatches
- `board/race/escape/Buffa de Baldrac`: **1** mismatches
- `board/race/escape/Contrare Puff`: **1** mismatches
- `board/race/escape/Dubblets`: **1** mismatches
- `board/race/escape/Fallas`: **1** mismatches
- `board/race/escape/Garanguet`: **1** mismatches

## 5 Concrete MOVE_MISMATCH Examples

### Example 1: `board/hunt/Bouge Shodra`
- **Ply:** 3
- **Recorded move:** `mover=2,from=2,to=14`
- **TS moves available:** 11
- **Sample TS moves:** mover=2,from=2,to=1,isPass=false, mover=2,from=2,to=3,isPass=false, mover=2,from=2,to=6,isPass=false
- **Detail:** No matching TS move

### Example 2: `board/hunt/Demala Diviyan Keliya`
- **Ply:** 0
- **Recorded move:** `mover=1,from=8,to=12`
- **TS moves available:** 0
- **Sample TS moves:** (none)
- **Detail:** No matching TS move

### Example 3: `board/hunt/Hund efter Hare (Thy)`
- **Ply:** 0
- **Recorded move:** `mover=1,from=6,to=7`
- **TS moves available:** 4
- **Sample TS moves:** mover=1,from=12,to=7,isPass=false, mover=1,from=12,to=13,isPass=false, mover=1,from=12,to=16,isPass=false
- **Detail:** No matching TS move

### Example 4: `board/hunt/Kaooa`
- **Ply:** 0
- **Recorded move:** `mover=1,from=10,to=1`
- **TS moves available:** 5
- **Sample TS moves:** mover=1,from=5,to=0,isPass=false, mover=1,from=5,to=1,isPass=false, mover=1,from=5,to=2,isPass=false
- **Detail:** No matching TS move

### Example 5: `board/hunt/Koti Keliya`
- **Ply:** 1
- **Recorded move:** `mover=2,from=11,to=22`
- **TS moves available:** 65
- **Sample TS moves:** mover=2,from=-1,to=12,isPass=false, mover=2,from=-1,to=14,isPass=false, mover=2,from=-1,to=16,isPass=false
- **Detail:** No matching TS move
