[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Samot72/bestgame04-entry/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Samot72/bestgame04-entry/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# MAHJONG GARDEN

A polished canvas-2D mahjong solitaire on a deep-green table. One hundred and forty-four tiles are stacked in a four-layer garden with two wing towers; clear them all by matching pairs of free tiles — a tile is free when nothing sits on top of it and at least one of its long sides is open.

- Every deal is guaranteed solvable: faces are dealt along a legal removal order, so a winning line always runs through the garden — and the Hint button follows that line. Shuffling re-deals the tiles on the board the same way, so a shuffle never strands you either.
- All 144 faces are drawn in code — ringed dots, bamboo, character medallions, wind compasses, the three dragons, flowers and seasons. No images, no fonts to fetch, no network.
- Score rewards speed: match again within five seconds to build a combo multiplier up to x5. Five hints and three shuffles per deal, unlimited undo, and a bonus at the clear for every hint and shuffle you did not spend.
- Full loop of title → play → garden cleared / no moves left → new deal, with pause (P), mute (M) and synthesized WebAudio clicks and chimes — no audio files.
- Controls: mouse to select tiles and press the panel buttons; H hint, U undo, S shuffle, N new deal.

Run it: `node serve.ts`, then open http://localhost:8080.
