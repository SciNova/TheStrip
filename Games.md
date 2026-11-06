## Game Library

All games are JS only (not yet ported to python/c/cpp/haxe) unless their Status says otherwise. Version `1.0` marks a game considered working and playable.

| Game | Ring | Version | Status |
|---|---|---|---|
| AsteroidsZ | | | Score display beyond lit-pixel count. |
| Blackjack | | | No Ace flexibility (1 or 11), no betting/chips. |
| Bomberman | | | Single enemy, single bomb at a time; score display beyond lit-pixel count. |
| Breakout | | | Score display beyond lit-pixel count. |
| Cars | | | |
| CentipedeZ | | | No player dodge (pure shooting gallery); score display beyond lit-pixel count. |
| ColorLight | | | Nothing — complete. |
| Darts | | 1.0 | Nothing — complete. |
| DemoScene | | | Only the first demo view looks finished; the other views are proof-of-concept quality and need real visual design. |
| Dices | | | Result evaluation and display (roll → win/lose); level progression; scoring. |
| DicesClock | | | Only one digit for minutes (wraps every 10); missing tens-of-minutes and hours; no user input. |
| Dino | ? | | Collision detection; game over, score, restart, level progression. |
| Fishing | | | No score display, no game-over — deliberately low-stakes/endless. |
| FlappyBird | ? | | Collision detection; score, game over, restart; `gapPosition` is fixed and never varies. |
| Frogger | | | Score display beyond lit-pixel count. |
| Golf | | | No obstacles/terrain on the fairway; score display beyond lit-pixel count. |
| Hanukkah | ✔ | | Not yet implemented (concept only, no JS file). |
| Highway2D | | | Lane markers/road texture; score display beyond lit-pixel count. |
| LunarLander | | | Score display beyond lit-pixel count. |
| Maze2D | | | No lives/fail state — pure exploration; step counter/scoring. |
| MemoryMatch | | | Score display beyond lit-pixel count. |
| MissileCommand | | | Score display beyond lit-pixel count. |
| Moodlight | ✔ | | Only three themes, two of which look poor; needs real theme design rather than scrolling gradients. |
| Pachinko | | | Pegs are procedural jitter, not real physical pegs; score display beyond lit-pixel count. |
| Pacman | ✔ | | Final level never completes; no score display. (Ghosts, AI, collision, wrap now done.) |
| Pinball | | | No multiball/tilt; score display beyond lit-pixel count. |
| Pong | ? | | Score display beyond lit-pixel count. |
| QuickDraw | | | Score display beyond flash feedback. |
| Race | ✔ | 1.0 | Single-player AI opponent; difficulty settings; lap/score display beyond the progress bar. |
| RhythmTap | | | Random-lane beats rather than a real song/chart; score display beyond lit-pixel count. |
| Shooter2D | | | Score display beyond lit-pixel count. |
| Shuffleboard | | | No score display beyond flash/pixel feedback; CPU aim is simplistic. |
| SimonSays | ✔ | 1.0 | Nothing — appears complete. |
| Slots | | 1.0 | Payout/credits/betting; score display; lever animation. |
| Snake2D | | | Score display beyond lit-pixel count; no difficulty/level tiers. |
| SpaceInvaders2D | | | Score display beyond lit-pixel count. |
| Sprint | | | Score display beyond lit-pixel count. |
| Stack | | 1.0 | Level restart on failure (snake not reset); level progression (`nextLevel()` doesn't call `playLevel()`); game-complete restart; gaps don't decrease (`END_GAP = START_GAP`); level count is 24 on a 120-strip, not 30 as in Games.md. |
| Submarine | | | Score display beyond lit-pixel count. |
| TowerDefense | | | Single turret/lane, no real "waves"; score display beyond lit-pixel count. |
| TreasureHunt | | | Score display beyond lit-pixel count. |
| TugOfWar | | | Score display beyond lit-pixel count. |
| WhackAMole | | | Score display beyond lit-pixel count. |

### STACK

The player defends against an approaching line of colored pixels (snake) that drifts steadily toward the player’s fixed position at one end of the strip. The snake is composed of a sequence of red, green, and blue dots separated by gaps. The player fires colored shots using three corresponding buttons (red, green, blue) to eliminate the leading dot of the snake.

When the player fires a bullet of the correct color, the leading dot is removed and the snake shortens. If the fired bullet does not match the leading dot’s color, the bullet instead becomes a new dot added to the front of the snake, lengthening it and bringing it closer to the player. The snake’s drift speed and number of dots increase with each level, while the gaps between dots decrease.

The game is played over 30 progressively difficult levels. Each level is completed when all dots in the snake are eliminated. The level restarts if the snake reaches the player’s position (when the snake’s head passes the start of the strip). The player must strategically match colors under increasing time pressure to survive as long as possible.

### SLOTS

Wheels are displayed as rotating cylinders along the LED strip. Each wheel contains colored fruit symbols with distinct sizes and colors. The wheels are rendered in 3D using a brightness gradient that simulates a side view of cylindrical reels, making them appear to bulge outward from the strip.

The player presses a button to set all three wheels spinning simultaneously. Each wheel spins for a randomized duration and then begins to stop in a staggered sequence, with each wheel coming to rest at a random fruit symbol. The final alignment of the three center symbols determines the outcome.

### DARTS

A needle sweeps continuously back and forth across a four-ring target (bullseye, inner, outer, board) centered on the strip; a first button press arms the sweep and a second press freezes it, scoring whichever ring the needle lands on — or nothing, if it falls outside all four. The game runs for a fixed 48 darts across 12 levels, with the needle's speed and the target's size both easing from gentle to punishing as the levels climb, so the opening throws are nearly unmissable while the closing ones demand real precision. Two bars occupy the outer ends of the strip: one tracks how many of the 48 darts have been thrown, the other shows total score as a fraction of the maximum possible, changing color through four ranks (blue, green, yellow, red) as it climbs. With no lives or retries, the point isn't surviving — it's seeing how high a score and rank you can reach before the darts run out.

### PONG

In the two‑player competitive game PONG, a white ball pixel moves back and forth along the strip. Each player controls one end of the strip and presses their assigned button when the ball enters their designated hitting range. The timing of the button press within that range determines the return velocity: an early press sends the ball back at a high speed, a middle‑timing press returns it at a normal speed, and a late press results in a slow return.

If a player fails to press their button while the ball is within their hitting range, the ball passes their end and a point is awarded to the opponent. The objective is to outmaneuver the opposing player through precise timing, using variable return speeds to disrupt the opponent’s rhythm and create scoring opportunities. The game continues until one player reaches a predetermined point total, typically 11 points.
.

### PACMAN

The player controls a magenta character that moves bidirectionally along the linear arena, collecting pellets placed at intervals. Regular pellets glow dim green, while magic pellets glow bright green and grant temporary power-ups. The game progresses through ten levels, each increasing the density of magic pellets. Control is mapped to two buttons: one moves right, the other moves left. The objective is to clear each level by consuming all pellets while avoiding ghosts.

### RACE

Players control their speed through timed button presses. Each player uses a single button (the center button of their controller); pressing the button accelerates their position marker, while not pressing causes gradual deceleration due to friction. The speed achieved is directly proportional to the frequency of button presses.

Two players start simultaneously at the center of the strip and race toward one end. Upon reaching either endpoint, a player automatically reverses direction and heads toward the opposite end, creating a continuous back‑and‑forth chase. The objective is to complete a predetermined number of full laps (center → end → opposite end → center) before the opponent.

The game also includes a single‑player mode where a human player competes against an automatic opponent that follows the same acceleration and turning rules. The automatic opponent adjusts its performance based on selected difficulty, simulating a human player’s rhythm and strategic pacing.

Victory is awarded to the first player to complete the required laps. The core challenge lies in maintaining an optimal press frequency to maximize speed while managing momentum through the automatic turns, all while monitoring the opponent’s position and lap progress.

### MAZE

In the single-player first-person navigation game MAZE, the player must escape a series of increasingly complex square mazes by navigating to an exit. The player views the maze through a one-dimensional representation that simulates a single horizontal line from a 3D first-person perspective.

The player starts each level already inside the maze at the center-right position, facing left toward the center. The exit is located at the center-left position of the maze, directly opposite the starting point along the horizontal axis.

Movement is controlled by three buttons: rotate left, rotate right, and move forward. Both movement and rotation are smooth and continuous while buttons are held, with no discrete grid-based stepping or fixed-degree turning increments.

The maze is rendered using a raycasting technique where each of the 120 pixels represents a ray cast at a specific angle within the player's field of view. Walls are displayed in a color gradient based on distance: bright colors indicate nearby walls, while progressively darker shades indicate more distant walls. Open pathways and corridors appear as near-black or black pixels, allowing the player to identify navigable openings. Walls too far beyond the maximum render distance also appear black.

Each successful exit leads to a more complex maze in the next level, with larger dimensions and more intricate layouts increasing the navigational challenge. The player must mentally reconstruct the 3D space from the 1D depth gradient display to locate and reach the exit.

### HANUKKAH

In the single-player game HANUKKAH, the player lights the eight candles of a hanukia for the Jewish holiday of Hanukkah. The hanukia is centered on the strip and occupies approximately 60% of its length, with the shamash (servant candle) at the center and four candles spaced evenly on each side, totaling nine fixed positions.

The player starts at the bottom end of the strip and must move to the center to pick up the shamash. Once carrying the shamash, the player travels to one of the unlit candle positions; passing that candle drops the shamash and lights the candle. The player must then return to the center to pick up the shamash again and repeat the process for the remaining candles.

Ghosts appear to hinder the player. Each ghost spawns at the position farthest from the player at the moment of appearance, then begins moving directly toward the player’s current location. Ghosts cannot exit the ends of the strip, but the player can wrap around—exiting one side and immediately entering the opposite side—allowing evasive maneuvers.

If a ghost approaches too closely, the player may press the “shoot” button to trigger a limited‑range explosion that destroys all ghosts within a small radius around the player. Using this defense, however, drops the shamash if the player is carrying it, forcing a return to the center. The explosion has no effect on ghosts outside its immediate range.

The game is won when all eight candles are lit. The player must balance candle‑lighting, ghost avoidance, and tactical use of the explosion defense while exploiting the wrap‑around movement to outmaneuver the ghosts.

### 3D SHOOTER

In the rail shooter game 3D SHOOTER, the player moves forward at constant speed through a 3D attack corridor. The player can rotate left or right to aim within the horizontal plane while forward momentum cannot be stopped. Enemies and obstacles appear as bright spots that grow in width and intensity as they approach, providing clear depth cues through perspective scaling. The player fires parallel projectiles from wing positions; these streaks initially appear at the periphery and visually converge toward the center as they travel into the distance, shrinking and dimming with range. The 1D display presents a single horizontal slice of the full 3D scene, transforming spatial combat into a pure aiming and reaction challenge.

### 3D SPACE INVADERS

The player moves left and right along a linear base while a formation of invaders advances downward in 3D space. The invaders are rendered as bright spots across the 1D strip; their brightness and width increase as they move closer to the player’s viewpoint, simulating depth. The player fires a single bullet that travels upward through the 3D space, appearing as a bright spot that moves from the player’s position toward the invader row, increasing in intensity until it strikes an invader at the corresponding horizontal angle. The game retains the classic shooting and dodging mechanics while presenting the scene as a single horizontal line of a full 3D perspective.

### 3D CIRCULAR SPACE INVADERS

The player orbits around a central cluster of invaders on a fixed circular track in 3D space. The invaders are arranged in a radial formation and advance outward toward the player along their lines of sight, growing brighter and wider as they reduce the distance. The player’s view is always directed inward, so moving left or right rotates the entire 3D scene, shifting the invaders’ apparent positions across the 1D strip. The player fires a single bullet radially inward; the bullet appears as a bright spot that dims and shrinks as it travels toward the center, striking any invader aligned at that angle. The game transforms the classic horizontal march into a radial pursuit within a 3D space.

### 3D HIGHWAY

The player controls a vehicle moving forward at constant speed on a multi‑lane road in 3D space. The road is rendered as a central dark band flanked by bright lane markers; the player’s current lane determines the angular offset of these markers in the 1D view. Oncoming vehicles appear as bright spots in specific lanes, growing wider and brighter as they approach. The player can press the left or right button to change lanes and avoid collisions. The center button sounds the horn, which causes any vehicle directly ahead in the same lane to swerve into an adjacent lane, clearing the path. The 1D display shows a single horizontal line of the 3D driving scene, where depth is encoded in brightness and width.

### 3D MAZE

The player must escape a series of increasingly complex 3D mazes by navigating to an exit. The player views the maze through a one‑dimensional representation that simulates a single horizontal line from a full 3D first‑person perspective. Walls are displayed in a color gradient based on distance: bright colors indicate nearby walls, while progressively darker shades indicate more distant walls. Open pathways appear as near‑black pixels. The player moves smoothly forward and rotates left or right within the 3D space, with collision sliding along walls. Each successful exit leads to a more intricate maze, challenging the player to mentally reconstruct the 3D layout from the 1D depth‑gradient display.