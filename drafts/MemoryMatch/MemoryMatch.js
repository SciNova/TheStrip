import { Game } from '../../core/Game.js';
import { GameState } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';

const CARD_COLORS = [Color.RED, Color.GREEN, Color.BLUE, Color.YELLOW, Color.MAGENTA, Color.CYAN, Color.ORANGE, Color.PURPLE];
const BASE_PAIRS = 3;
const MAX_PAIRS = 8;

export class MemoryMatch extends Game {
	static MISMATCH_SHOW_TIME = 0.8;
	static RESULT_FLASH = 1.5;

	constructor(system) {
		super('MemoryMatch', system);
		this.score = 0;
		this.buildStage();
	}

	buildStage() {
		const pairCount = Math.min(MAX_PAIRS, BASE_PAIRS + this.level);
		this.pairCount = pairCount;
		const colors = [];
		for (let i = 0; i < pairCount; i++) {
			colors.push(CARD_COLORS[i % CARD_COLORS.length], CARD_COLORS[i % CARD_COLORS.length]);
		}
		for (let i = colors.length - 1; i > 0; i--) {
			const j = Math.floor(this.system.random() * (i + 1));
			[colors[i], colors[j]] = [colors[j], colors[i]];
		}
		this.cards = colors.map((color) => ({ color, revealed: false, matched: false }));
		this.slotCount = this.cards.length;
		const gapCount = this.slotCount - 1;
		this.cardWidth = Math.floor((this.resolution - gapCount) / this.slotCount);
		const used = this.slotCount * this.cardWidth + gapCount;
		this.boardOffset = Math.floor((this.resolution - used) / 2);
		this.cursorSlot = 0;
		this.firstPick = -1;
		this.stage = 'PLAYING';
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'MISMATCH') {
			this.mismatchTimer -= dt;
			if (this.mismatchTimer <= 0.0) {
				this.cards[this.mismatchA].revealed = false;
				this.cards[this.mismatchB].revealed = false;
				this.stage = 'PLAYING';
			}
		} else if (this.stage === 'ROUND_COMPLETE') {
			if (this.delayTime <= 0.0) {
				this.nextLevel();
				this.playLevel();
			}
		} else if (this.stage === 'GAME_COMPLETE') {
		}

		this._render();
	}

	handleInput(padId, event) {
		if (this.stage !== 'PLAYING') {
			return;
		}
		if (event.command === Command.LEFT_PRESS) {
			this.cursorSlot = Math.max(0, this.cursorSlot - 1);
		} else if (event.command === Command.RIGHT_PRESS) {
			this.cursorSlot = Math.min(this.slotCount - 1, this.cursorSlot + 1);
		} else if (event.command === Command.FIRE_PRESS) {
			this._flip();
		}
	}

	_currentSlot() {
		return this.cursorSlot;
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
			this.audio.playSynth(SystemSound.TICK);
			return;
		}

		const first = this.cards[this.firstPick];
		if (first.color === card.color) {
			first.matched = true;
			card.matched = true;
			this.score += 1;
			this.audio.playSynth(SystemSound.EXPLOSION);
			this.firstPick = -1;
			if (this.cards.every((c) => c.matched)) {
				if (this.pairCount >= MAX_PAIRS) {
					this.stage = 'GAME_COMPLETE';
					this.state = GameState.COMPLETED;
					this.audio.play(SystemSound.CHEERING);
				} else {
					this.stage = 'ROUND_COMPLETE';
					this.audio.play(SystemSound.CHEERING);
					this.delay(MemoryMatch.RESULT_FLASH);
				}
			}
		} else {
			this.audio.playSynth(SystemSound.WARNING);
			this.mismatchA = this.firstPick;
			this.mismatchB = slot;
			this.mismatchTimer = MemoryMatch.MISMATCH_SHOW_TIME;
			this.firstPick = -1;
			this.stage = 'MISMATCH';
		}
	}

	_render() {
		this.clear();

		for (let slot = 0; slot < this.slotCount; slot++) {
			const card = this.cards[slot];
			const start = this._slotStart(slot);
			const end = start + this.cardWidth;
			let color = Color.GRAY;
			if (card.matched || card.revealed) {
				color = card.color;
			}
			for (let i = Math.max(0, start); i < end && i < this.resolution; i++) {
				this.pixels[i] = color;
			}
		}

		const cursorSlot = this._currentSlot();
		const slotStart = this._slotStart(cursorSlot);
		const center = slotStart + this.cardWidth / 2;
		const cursorWidth = Math.max(1, Math.floor(this.cardWidth / 4));
		const cursorStart = Math.floor(center - cursorWidth / 2);
		const cursorEnd = cursorStart + cursorWidth;
		for (let i = Math.max(0, cursorStart); i < cursorEnd && i < this.resolution; i++) {
			this.pixels[i] = Color.WHITE;
		}
	}

	_slotStart(slot) {
		return this.boardOffset + slot * (this.cardWidth + 1);
	}
}
