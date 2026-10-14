import { Game, Colors, Sound, Command } from './system.js';
import { Shape, Alignment, EdgeMode } from './graphics.js';

const MazeStage = Object.freeze({ PLAYING: 'PLAYING', WIN: 'WIN' });

const DIR_COUNT = 4;
const DIR_DX = [1, 0, -1, 0];
const DIR_DZ = [0, 1, 0, -1];

class Wall extends Shape {
	static LENGTH_FACTOR = 0.45;

	constructor(game, color) {
		const length = Math.max(1, Math.floor(game.resolution * Wall.LENGTH_FACTOR));
		super(game, length, Alignment.CENTER);
		this.pixels.fill(color);
		this.x = 0.0;
		this.z = 0.0;
	}
}

export class Maze2D extends Game {
	static MIN_GRID = 4;
	static MAX_GRID = 9;
	static CELL_SIZE = 2.5; // resolution units per cell
	static FOCAL_LENGTH_FACTOR = 0.5;
	static MAX_RENDER_DIST = 7.0; // cells
	static MOVE_COOLDOWN = 0.12;

	constructor(system) {
		super('Maze2D', system);
		this.level = 0;
		this.gridSize = Maze2D.MIN_GRID;
		this._buildMaze();
	}

	_buildMaze() {
		const n = this.gridSize;
		const open = [];
		const visited = [];
		for (let cz = 0; cz < n; cz++) {
			open.push([]);
			visited.push([]);
			for (let cx = 0; cx < n; cx++) {
				open[cz].push([false, false, false, false]);
				visited[cz].push(false);
			}
		}

		const stack = [[0, 0]];
		visited[0][0] = true;
		while (stack.length > 0) {
			const [cx, cz] = stack[stack.length - 1];
			const options = [];
			for (let dir = 0; dir < DIR_COUNT; dir++) {
				const nx = cx + DIR_DX[dir];
				const nz = cz + DIR_DZ[dir];
				if (nx >= 0 && nx < n && nz >= 0 && nz < n && !visited[nz][nx]) {
					options.push(dir);
				}
			}
			if (options.length === 0) {
				stack.pop();
				continue;
			}
			const dir = options[Math.floor(Math.random() * options.length)];
			const nx = cx + DIR_DX[dir];
			const nz = cz + DIR_DZ[dir];
			open[cz][cx][dir] = true;
			open[nz][nx][(dir + 2) % DIR_COUNT] = true;
			visited[nz][nx] = true;
			stack.push([nx, nz]);
		}

		this.open = open;
		this.exitX = n - 1;
		this.exitZ = n - 1;

		this.playerCellX = 0;
		this.playerCellZ = 0;
		this.facingDir = 0;
		this.moveCooldown = 0.0;

		const cell = Maze2D.CELL_SIZE * this.resolution;
		this.walls = [];
		for (let cz = 0; cz < n; cz++) {
			for (let cx = 0; cx < n; cx++) {
				for (let dir = 0; dir < DIR_COUNT; dir++) {
					const nx = cx + DIR_DX[dir];
					const nz = cz + DIR_DZ[dir];
					const outOfBounds = nx < 0 || nx >= n || nz < 0 || nz >= n;
					if (outOfBounds) {
						if (!open[cz][cx][dir]) {
							this._addWall(cx, cz, dir, cell);
						}
					} else if ((dir === 0 || dir === 1) && !open[cz][cx][dir]) {
						this._addWall(cx, cz, dir, cell);
					}
				}
			}
		}

		this.stage = MazeStage.PLAYING;
	}

	_addWall(cx, cz, dir, cell) {
		const wall = new Wall(this, Colors.GRAY);
		wall.x = cx * cell + (DIR_DX[dir] * cell) / 2.0;
		wall.z = cz * cell + (DIR_DZ[dir] * cell) / 2.0;
		this.walls.push(wall);
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === MazeStage.PLAYING) {
			if (this.moveCooldown > 0.0) {
				this.moveCooldown -= dt;
			}
			this._render();
		} else {
			if (this.delayTime <= 0.0) {
				this.level += 1;
				this.gridSize = Math.min(Maze2D.MAX_GRID, Maze2D.MIN_GRID + this.level);
				this._buildMaze();
			} else {
				this._renderWin();
			}
		}
	}

	_tryMove(forwardSign) {
		if (this.moveCooldown > 0.0) {
			return;
		}
		const dir = forwardSign > 0 ? this.facingDir : (this.facingDir + 2) % DIR_COUNT;
		if (!this.open[this.playerCellZ][this.playerCellX][dir]) {
			this.audio.play(Sound.MISS);
			this.moveCooldown = Maze2D.MOVE_COOLDOWN;
			return;
		}
		this.playerCellX += DIR_DX[dir];
		this.playerCellZ += DIR_DZ[dir];
		this.moveCooldown = Maze2D.MOVE_COOLDOWN;

		if (this.playerCellX === this.exitX && this.playerCellZ === this.exitZ) {
			this.stage = MazeStage.WIN;
			this.audio.play(Sound.LEVEL_COMPLETE);
			this.delay(2.5);
		} else {
			this.audio.play(Sound.TICK);
		}
	}

	_turn(delta) {
		this.facingDir = (((this.facingDir + delta) % DIR_COUNT) + DIR_COUNT) % DIR_COUNT;
		this.audio.play(Sound.TICK);
	}

	_render() {
		this.clear();

		const cell = Maze2D.CELL_SIZE * this.resolution;
		const camX = this.playerCellX * cell;
		const camZ = this.playerCellZ * cell;
		const angle = (this.facingDir / DIR_COUNT) * 2 * Math.PI;
		const cosT = Math.cos(angle);
		const sinT = Math.sin(angle);
		const focalLength = this.resolution * Maze2D.FOCAL_LENGTH_FACTOR;
		const maxDist = Maze2D.MAX_RENDER_DIST * cell;

		const items = [];
		for (const wall of this.walls) {
			const dx = wall.x - camX;
			const dz = wall.z - camZ;
			const forward = dx * cosT + dz * sinT;
			const lateral = -dx * sinT + dz * cosT;
			if (forward > 0.01 && forward < maxDist) {
				items.push({ forward, lateral, wall });
			}
		}
		items.sort((a, b) => b.forward - a.forward);

		for (const item of items) {
			const stripPos = this.resolution / 2 + (item.lateral / item.forward) * focalLength;
			let scale = focalLength / item.forward;
			if (scale > 2.5) {
				scale = 2.5;
			}
			item.wall.render(stripPos, EdgeMode.CLIP, scale);
		}

		const exitWorldX = this.exitX * cell;
		const exitWorldZ = this.exitZ * cell;
		const edx = exitWorldX - camX;
		const edz = exitWorldZ - camZ;
		const exitForward = edx * cosT + edz * sinT;
		const exitLateral = -edx * sinT + edz * cosT;
		if (exitForward > 0.01 && exitForward < maxDist) {
			const stripPos = this.resolution / 2 + (exitLateral / exitForward) * focalLength;
			let scale = focalLength / exitForward;
			if (scale > 3.0) {
				scale = 3.0;
			}
			const pulse = 0.5 + 0.5 * Math.sin(this.time * 6.0);
			const brightness = 0.4 + 0.6 * pulse;
			const g = Math.floor(0xFF * brightness);
			const color = g << 8;
			const size = Math.max(1, Math.round(3 * scale));
			const half = Math.floor(size / 2);
			const center = Math.round(stripPos);
			for (let i = -half; i <= half; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = color;
				}
			}
		}
	}

	_renderWin() {
		this.clear();
		const flashOn = Math.floor(this.time * 6) % 2 === 0;
		const color = flashOn ? Colors.GREEN : Colors.DARK_GREEN;
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = color;
		}
	}

	handleInput(padId, event) {
		if (this.stage !== MazeStage.PLAYING) {
			return;
		}
		if (event.command === Command.UP_PRESS) {
			this._tryMove(1);
		} else if (event.command === Command.DOWN_PRESS) {
			this._tryMove(-1);
		} else if (event.command === Command.LEFT_PRESS) {
			this._turn(-1);
		} else if (event.command === Command.RIGHT_PRESS) {
			this._turn(1);
		}
	}
}
