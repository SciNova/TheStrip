import { Game, Colors, Sound, Command } from './system.js';

const CARD_COLORS = [Colors.RED, Colors.GREEN, Colors.BLUE, Colors.YELLOW, Colors.MAGENTA, Colors.CYAN, Colors.ORANGE, Colors.PURPLE];
const BASE_PAIRS = 3;
const MAX_PAIRS = 8;
const MAX_MISTAKES = 8;

export class MemoryMatch extends Game {
	static CURSOR_SPEED = 1.0; // slots/sec
	static MISMATCH_SHOW_TIME = 0.8; // seconds
	static RESULT_FLASH = 1.5; // seconds

	constructor(system) {
		super('MemoryMatch', system);
		this.round = 0;
		this.score = 0;
		this.mistakes = 0;
		this._buildBoard();
	}

	_buildBoard() {
		const pairCount = Math.min(MAX_PAIRS, BASE_PAIRS + this.round);
		const colors = [];
		for (let i = 0; i < pairCount; i++) {
			colors.push(CARD_COLORS[i % CARD_COLORS.length], CARD_COLORS[i % CARD_COLORS.length]);
		}
		for (let i = colors.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[colors[i], colors[j]] = [colors[j], colors[i]];
		}
		this.cards = colors.map((color) => ({ color, revealed: false, matched: false }));
		this.slotCount = this.cards.length;
		this.slotWidth = this.resolution / this.slotCount;
		this.cursorAccum = 0.0;
		this.cursorDir = 0;
		this.firstPick = -1;
		this.stage = 'PLAYING';
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'PLAYING') {
			this._loopPlaying(dt);
		} else if (this.stage === 'MISMATCH') {
			this.mismatchTimer -= dt;
			if (this.mismatchTimer <= 0.0) {
				this.cards[this.mismatchA].revealed = false;
				this.cards[this.mismatchB].revealed = false;
				this.stage = 'PLAYING';
			}
		} else if (this.stage === 'ROUND_COMPLETE') {
			if (this.delayTime <= 0.0) {
				this.round += 1;
				this._buildBoard();
			}
		} else if (this.stage === 'GAMEOVER') {
			if (this.delayTime <= 0.0) {
				this.round = 0;
				this.score = 0;
				this.mistakes = 0;
				this._buildBoard();
			}
		}

		this._render();
	}

	_loopPlaying(dt) {
		this.cursorAccum += this.cursorDir * MemoryMatch.CURSOR_SPEED * dt;
	}

	handleInput(padId, event) {
		if (event.command === Command.LEFT_PRESS) {
			this.cursorDir = -1;
		} else if (event.command === Command.RIGHT_PRESS) {
			this.cursorDir = 1;
		} else if (event.command === Command.LEFT_RELEASE) {
			if (this.cursorDir === -1) {
				this.cursorDir = 0;
			}
		} else if (event.command === Command.RIGHT_RELEASE) {
			if (this.cursorDir === 1) {
				this.cursorDir = 0;
			}
		} else if (event.command === Command.FIRE_PRESS) {
			this._flip();
		}
	}

	_currentSlot() {
		let slot = Math.round(this.cursorAccum) % this.slotCount;
		if (slot < 0) {
			slot += this.slotCount;
		}
		return slot;
	}

	_flip() {
		if (this.stage !== 'PLAYING') {
			return;
		}
		const slot = this._currentSlot();
		const card = this.cards[slot];
		if (card.matched || card.revealed) {
			return;
		}
		card.revealed = true;

		if (this.firstPick < 0) {
			this.firstPick = slot;
			this.audio.play(Sound.TICK);
			return;
		}

		const first = this.cards[this.firstPick];
		if (first.color === card.color) {
			first.matched = true;
			card.matched = true;
			this.score += 1;
			this.audio.play(Sound.HIT);
			this.firstPick = -1;
			if (this.cards.every((c) => c.matched)) {
				this.stage = 'ROUND_COMPLETE';
				this.audio.play(Sound.LEVEL_COMPLETE);
				this.delay(MemoryMatch.RESULT_FLASH);
			}
		} else {
			this.mistakes += 1;
			this.audio.play(Sound.MISS);
			this.mismatchA = this.firstPick;
			this.mismatchB = slot;
			this.mismatchTimer = MemoryMatch.MISMATCH_SHOW_TIME;
			this.firstPick = -1;
			this.stage = 'MISMATCH';
			if (this.mistakes >= MAX_MISTAKES) {
				this.stage = 'GAMEOVER';
				this.audio.play(Sound.LEVEL_FAIL);
				this.delay(3.0);
			}
		}
	}

	_render() {
		this.clear();

		if (this.stage === 'GAMEOVER') {
			this._renderGameOver();
			return;
		}
		if (this.stage === 'ROUND_COMPLETE') {
			const flashOn = Math.floor(this.time * 6) % 2 === 0;
			const color = flashOn ? Colors.GREEN : Colors.DARK_GREEN;
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = color;
			}
			return;
		}

		for (let slot = 0; slot < this.slotCount; slot++) {
			const card = this.cards[slot];
			const start = Math.floor(slot * this.slotWidth);
			const end = Math.floor((slot + 1) * this.slotWidth);
			let color = Colors.DARK_GRAY;
			if (card.matched) {
				color = card.color;
			} else if (card.revealed) {
				color = card.color;
			}
			for (let i = start; i < end && i < this.resolution; i++) {
				this.pixels[i] = color;
			}
		}

		const cursorSlot = this._currentSlot();
		const blink = Math.floor(this.time * 6) % 2 === 0;
		if (blink) {
			const pos = Math.floor((cursorSlot + 0.5) * this.slotWidth);
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = Colors.WHITE;
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
