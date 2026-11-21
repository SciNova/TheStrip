import { Game, Colors, Command } from '../../core/system.js';
import { SystemSound } from '../../core/audio-common.js';
import { BasePlayer2D, World2D } from '../../core/graphics.js';

const SnakeStage = Object.freeze({ PLAYING: 'PLAYING', GAMEOVER: 'GAMEOVER' });

export class Snake2D extends Game {
	static WORLD_SIZE = 7.0; // resolution units
	static FORWARD_SPEED = 0.9; // resolution units/sec
	static TURN_RATE = 0.5; // rotations/sec
	static SEGMENT_SPACING = 0.12; // resolution units
	static INITIAL_LENGTH = 5;
	static GROWTH_PER_FOOD = 3;
	static NECK_IGNORE_COUNT = 6;
	static COLLISION_RADIUS = 0.12; // resolution units
	static EAT_RADIUS = 0.2; // resolution units
	static FOCAL_LENGTH_FACTOR = 0.5;
	static MAX_RENDER_DIST = 6.0; // resolution units
	static SPEED_STEP = 0.015; // resolution units/sec, per food eaten
	static MIN_SEGMENT_SIZE = 1;
	static MAX_SEGMENT_SIZE = 4;

	constructor(system) {
		super('Snake2D', system);
		this._resetGame();
	}

	_resetGame() {
		this.world = new World2D(Snake2D.WORLD_SIZE, Snake2D.WORLD_SIZE, true, true);
		this.head = new BasePlayer2D(this);
		this.head.x = 0.0;
		this.head.z = 0.0;
		this.head.rotation = 0.0;
		this.turnLeftPressed = false;
		this.turnRightPressed = false;
		this.speed = Snake2D.FORWARD_SPEED * this.resolution;
		this.maxVisible = Snake2D.INITIAL_LENGTH;
		this.trail = [];
		this.sampleDistance = 0.0;
		this.score = 0;
		this.stage = SnakeStage.PLAYING;
		this._spawnFood();
	}

	_spawnFood() {
		const half = (Snake2D.WORLD_SIZE * this.resolution) / 2.0;
		this.foodX = Math.random() * 2 * half - half;
		this.foodZ = Math.random() * 2 * half - half;
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === SnakeStage.PLAYING) {
			this._loopPlaying(dt);
		} else {
			if (this.delayTime <= 0.0) {
				this._resetGame();
			} else {
				this._renderGameOver();
			}
		}
	}

	_loopPlaying(dt) {
		if (this.turnLeftPressed) {
			this.head.rotation = (((this.head.rotation - Snake2D.TURN_RATE * dt) % 1.0) + 1.0) % 1.0;
		}
		if (this.turnRightPressed) {
			this.head.rotation = ((this.head.rotation + Snake2D.TURN_RATE * dt) % 1.0 + 1.0) % 1.0;
		}

		const angle = this.head.rotation * 2 * Math.PI;
		this.head.x += this.speed * Math.cos(angle) * dt;
		this.head.z += this.speed * Math.sin(angle) * dt;

		const worldW = this.world.width * this.resolution;
		const worldD = this.world.depth * this.resolution;
		const halfW = worldW / 2.0;
		const halfD = worldD / 2.0;
		this.head.x = (((this.head.x + halfD) % worldD) + worldD) % worldD - halfD;
		this.head.z = (((this.head.z + halfW) % worldW) + worldW) % worldW - halfW;

		this.sampleDistance += this.speed * dt;
		const spacing = Snake2D.SEGMENT_SPACING * this.resolution;
		if (this.sampleDistance >= spacing) {
			this.sampleDistance -= spacing;
			this.trail.push({ x: this.head.x, z: this.head.z });
			while (this.trail.length > this.maxVisible) {
				this.trail.shift();
			}
		}

		const collidable = this.trail.slice(0, Math.max(0, this.trail.length - Snake2D.NECK_IGNORE_COUNT));
		const collisionRadius = Snake2D.COLLISION_RADIUS * this.resolution;
		let crashed = false;
		for (const node of collidable) {
			if (this.head.distance(node.z, node.x) < collisionRadius) {
				crashed = true;
				break;
			}
		}

		if (crashed) {
			this.stage = SnakeStage.GAMEOVER;
			this.audio.play(SystemSound.BOOING);
			this.delay(3.0);
			this._render();
			return;
		}

		const eatRadius = Snake2D.EAT_RADIUS * this.resolution;
		if (this.head.distance(this.foodZ, this.foodX) < eatRadius) {
			this.score += 1;
			this.maxVisible += Snake2D.GROWTH_PER_FOOD;
			this.speed += Snake2D.SPEED_STEP * this.resolution;
			this.audio.synth.play(SystemSound.EXPLOSION);
			this._spawnFood();
		}

		this._render();
	}

	handleInput(padId, event) {
		if (this.stage !== SnakeStage.PLAYING) {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.turnLeftPressed = true;
		} else if (event.command === Command.LEFT_RELEASE) {
			this.turnLeftPressed = false;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.turnRightPressed = true;
		} else if (event.command === Command.RIGHT_RELEASE) {
			this.turnRightPressed = false;
		}
	}

	_render() {
		this.clear();

		const worldW = this.world.width * this.resolution;
		const worldD = this.world.depth * this.resolution;
		const halfW = worldW / 2.0;
		const halfD = worldD / 2.0;
		const cosT = Math.cos(this.head.rotation * 2 * Math.PI);
		const sinT = Math.sin(this.head.rotation * 2 * Math.PI);
		const focalLength = this.resolution * Snake2D.FOCAL_LENGTH_FACTOR;
		const maxDist = Snake2D.MAX_RENDER_DIST * this.resolution;

		const wrapDelta = (value, span, half) => (((value + half) % span) + span) % span - half;

		const items = [];
		for (const node of this.trail) {
			const dx = wrapDelta(node.x - this.head.x, worldD, halfD);
			const dz = wrapDelta(node.z - this.head.z, worldW, halfW);
			const forward = dx * cosT + dz * sinT;
			const lateral = -dx * sinT + dz * cosT;
			if (forward > 0.01 && forward < maxDist) {
				items.push({ forward, lateral, color: Colors.GREEN });
			}
		}

		const fdx = wrapDelta(this.foodX - this.head.x, worldD, halfD);
		const fdz = wrapDelta(this.foodZ - this.head.z, worldW, halfW);
		const foodForward = fdx * cosT + fdz * sinT;
		const foodLateral = -fdx * sinT + fdz * cosT;
		if (foodForward > 0.01 && foodForward < maxDist) {
			items.push({ forward: foodForward, lateral: foodLateral, color: Colors.YELLOW, isFood: true });
		}

		items.sort((a, b) => b.forward - a.forward);

		for (const item of items) {
			const stripPos = this.resolution / 2 + (item.lateral / item.forward) * focalLength;
			let scale = focalLength / item.forward;
			if (scale > 2.5) {
				scale = 2.5;
			}
			const approach = 1.0 - Math.min(1.0, item.forward / maxDist);
			const pulse = item.isFood ? 0.6 + 0.4 * Math.sin(this.time * 8.0) : 1.0;
			const brightness = (0.35 + 0.65 * approach) * pulse;
			const r = ((item.color >> 16) & 0xFF) * brightness;
			const g = ((item.color >> 8) & 0xFF) * brightness;
			const b = (item.color & 0xFF) * brightness;
			const color = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);

			const size = Snake2D.MIN_SEGMENT_SIZE + Math.round(approach * (Snake2D.MAX_SEGMENT_SIZE - Snake2D.MIN_SEGMENT_SIZE));
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

	_renderGameOver() {
		this.clear();
		const lit = Math.min(this.score, this.resolution);
		for (let i = 0; i < lit; i++) {
			this.pixels[i] = Colors.DARK_RED;
		}
		const flashOn = Math.floor(this.time * 4) % 2 === 0;
		if (flashOn) {
			for (let i = 0; i < this.resolution; i++) {
				if (this.pixels[i] === 0) {
					this.pixels[i] = Colors.RED;
				}
			}
		}
	}
}
