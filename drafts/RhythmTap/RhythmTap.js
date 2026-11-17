import { Game, Colors, Command } from '../../core/system.js';
import { SampleID } from '../../core/audio-common.js';

const LANES = 4;
const LANE_COLORS = [Colors.RED, Colors.YELLOW, Colors.CYAN, Colors.MAGENTA];
const LANE_COMMANDS = [Command.A_PRESS, Command.B_PRESS, Command.C_PRESS, Command.D_PRESS];

export class RhythmTap extends Game {
	static SPAWN_Z = 6.0; // resolution units
	static BASE_BEAT_INTERVAL = 0.85; // seconds
	static MIN_BEAT_INTERVAL = 0.35;
	static BEAT_INTERVAL_STEP = 0.01;
	static PERFECT_WINDOW = 0.5; // resolution units
	static GOOD_WINDOW = 1.1; // resolution units
	static MISS_Z = -0.3; // resolution units, past this a note is gone
	static HIT_HEAL = 0.07;
	static MISS_PENALTY = 0.16;
	static MIN_NOTE_SIZE = 1;
	static MAX_NOTE_SIZE = 4;

	constructor(system) {
		super('RhythmTap', system);
		this._resetGame();
	}

	_resetGame() {
		this.lanePositions = [];
		for (let i = 0; i < LANES; i++) {
			this.lanePositions.push(((i + 0.5) / LANES) * this.resolution);
		}
		this.score = 0;
		this.combo = 0;
		this.health = 1.0;
		this.beatInterval = RhythmTap.BASE_BEAT_INTERVAL;
		this.beatTimer = 0.6;
		this.notes = [];
		this.gameOver = false;
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.gameOver) {
			if (this.delayTime <= 0.0) {
				this._resetGame();
			} else {
				this._renderGameOver();
			}
			return;
		}

		this.beatTimer -= dt;
		if (this.beatTimer <= 0.0) {
			const lane = Math.floor(Math.random() * LANES);
			this.notes.push({ lane, z: RhythmTap.SPAWN_Z * this.resolution });
			this.beatTimer = this.beatInterval;
		}

		const speed = (RhythmTap.SPAWN_Z * this.resolution) / (this.beatInterval * 3.0);
		const survivors = [];
		for (const note of this.notes) {
			note.z -= speed * dt;
			if (note.z / this.resolution < RhythmTap.MISS_Z) {
				this.health = Math.max(0.0, this.health - RhythmTap.MISS_PENALTY);
				this.combo = 0;
			} else {
				survivors.push(note);
			}
		}
		this.notes = survivors;

		if (this.health <= 0.0) {
			this.gameOver = true;
			this.audio.play(SampleID.LEVEL_FAIL);
			this.delay(3.0);
		}

		this._render();
	}

	_tap(lane) {
		const goodWindow = RhythmTap.GOOD_WINDOW * this.resolution;
		const perfectWindow = RhythmTap.PERFECT_WINDOW * this.resolution;
		let bestIndex = -1;
		let bestZ = goodWindow;
		for (let i = 0; i < this.notes.length; i++) {
			const note = this.notes[i];
			if (note.lane !== lane) {
				continue;
			}
			if (Math.abs(note.z) < bestZ) {
				bestZ = Math.abs(note.z);
				bestIndex = i;
			}
		}

		if (bestIndex >= 0) {
			const perfect = bestZ < perfectWindow;
			this.notes.splice(bestIndex, 1);
			this.score += perfect ? 2 : 1;
			this.combo += 1;
			this.health = Math.min(1.0, this.health + RhythmTap.HIT_HEAL);
			this.audio.play(SampleID.HIT);
			this.beatInterval = Math.max(RhythmTap.MIN_BEAT_INTERVAL, this.beatInterval - RhythmTap.BEAT_INTERVAL_STEP);
		}
	}

	handleInput(padId, event) {
		if (this.gameOver) {
			return;
		}
		const laneIndex = LANE_COMMANDS.indexOf(event.command);
		if (laneIndex >= 0) {
			this._tap(laneIndex);
		}
	}

	_render() {
		this.clear();

		for (let i = 0; i < LANES; i++) {
			const color = LANE_COLORS[i];
			const r = Math.floor(((color >> 16) & 0xFF) * 0.12);
			const g = Math.floor(((color >> 8) & 0xFF) * 0.12);
			const b = Math.floor((color & 0xFF) * 0.12);
			const pos = Math.round(this.lanePositions[i]);
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = (r << 16) | (g << 8) | b;
			}
		}

		for (const note of this.notes) {
			const approach = 1.0 - Math.min(1.0, Math.max(0.0, note.z / (RhythmTap.SPAWN_Z * this.resolution)));
			const brightness = 0.4 + 0.6 * approach;
			const color = LANE_COLORS[note.lane];
			const r = Math.floor(((color >> 16) & 0xFF) * brightness);
			const g = Math.floor(((color >> 8) & 0xFF) * brightness);
			const b = Math.floor((color & 0xFF) * brightness);
			const size = RhythmTap.MIN_NOTE_SIZE + Math.round(approach * (RhythmTap.MAX_NOTE_SIZE - RhythmTap.MIN_NOTE_SIZE));
			const half = Math.floor(size / 2);
			const center = Math.round(this.lanePositions[note.lane]);
			for (let i = -half; i <= half; i++) {
				const pos = center + i;
				if (pos >= 0 && pos < this.resolution) {
					this.pixels[pos] = (r << 16) | (g << 8) | b;
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
