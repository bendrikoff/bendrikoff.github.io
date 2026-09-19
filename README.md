# Dogelon · Mars Hopper

A turn-based 3D jumping puzzle for Dogelon Vibecon 2026. Each move jumps one row forward and one lane left or right. Crossing a side edge wraps to the opposite lane of the next row. There is no automatic forward movement, time pressure or straight-ahead jump.

## Play locally

Run `npm start` and open http://127.0.0.1:4173. The browser bundle and assets are local. WebGL 2 is required. Serve the game over HTTP so the GLB model can load.

- Left / A: jump forward-left.
- Right / D: jump forward-right.
- Tap the left/right half of the play area, swipe horizontally, or use the two jump buttons.
- Each input initiates exactly one leap. Inputs during a leap are ignored; holding a key does not repeat moves.
- P / Escape: pause, including mid-jump.
- Landing tiles react to a successful jump by dipping and springing back. The next move is not highlighted.
- Land on clear tiles. Rocks, spikes and gaps cost a shield and return Dogelon to the previous tile so you can reconsider. Three mistakes end the attempt.
- Finish for one star; collect at least 50% of the Dogelon coins for two; at least 75% with no mistakes for three. Coins appear every four rows, and every generated puzzle has a route collecting them all. Every reachable safe tile has a safe next move.
- The HUD counts completed rows and attempted jumps. Six worlds have 24–44 rows each, with a fresh layout on every launch.

The 3D planet map supports drag to orbit, scroll/pinch to zoom, and selection by clicking or tapping a planet. The menu has one centered Launch button, with no planet captions, explorer card or map-control toolbar. Planets orbit and spin while the starfield slowly moves. Progress for the puzzle mode is saved under `dogelon-mars-puzzle-v2`; previous runner records remain intact under their original key.

The six environments include canyons, a lunar quarry, ice crystals, ruins, volcanic terrain and a colony, with themed landmarks and drones. The supplied textured coin GLB spins, floats and flashes with a gold glint. Jump, landing, coin, edge-wrap and hit effects use particles, shockwaves and camera feedback. The header wave button toggles reduced camera motion and remembers the preference. System reduced-motion preferences apply by default. Desktop rendering includes bloom.

The sound toggle starts `Warm Cosmic Arpeggios.mp3` in the planet menu and crossfades to `Coin Collectors Guide.mp3` during missions. `coin-recived.mp3` plays when a coin is collected. Damage uses a short synthesized low impact and filtered-noise burst. Music pauses when the tab is hidden.

## Validate and package

`npm test` checks stationary waiting, individual diagonal moves, both wrap directions, input locking, pause/resume, landing collisions, retries, defeat, ratings and seeded generation. It checks 240 puzzles for safe continuation, sparse coin placement and a route collecting every coin.

Run `npm ci` before development. `npm run build` bundles Three.js with esbuild and creates the static game in `dist/`. `Dogelon-Mars-Hopper.zip` contains the deployable files. No runtime CDN requests are needed.

## Jam submission draft

**Title:** Dogelon: Mars Hopper

**Description:** Think. Then leap. Guide Dogelon through six 3D worlds, one diagonal jump at a time. Read the tiles ahead, wrap across the edges and collect Dogelon coins on your way home to Mars. Play at your own pace with keyboard or touch controls.

**Tools:** JavaScript, Three.js / WebGL 2, CSS, esbuild, Node.js and Codex.

**Dogelon artwork:** The playable hero is the supplied Shiba_Astronaut_Animated.glb, with its embedded Shiba_Color_Atlas and all original PBR materials. Jump_Left and Jump_Right are synchronized to board moves; Idle loops while waiting and before the mission, with blended transitions to and from jumps. Root translation is handled by the board.

Creator details, a public hosted play link, a screenshot or clip, and official registration/submission are still needed. This project has not been submitted. See `assets/CREDITS.md` for attribution. Code and track layouts are newly implemented.

The game camera stays centered during edge wraps, with damped position/FOV changes and reduced impact motion. Pausing freezes both idle and camera feedback.
