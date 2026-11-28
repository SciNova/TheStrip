import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';

export class Blackjack extends Game {
	static INITIAL_CARDS = 2;
	static DEALER_STAND = 17;
	static DEALER_DRAW_DELAY = 0.8;
	static RESULT_FLASH = 2.0;

	constructor(system) {
		super('Blackjack', system);
		this.wins = 0;
		this.losses = 0;
		this._newHand();
	}

	_drawCard() {
		return 1 + Math.floor(this.system.random() * 10);
	}

	_newHand() {
		this.playerTotal = 0;
		this.dealerTotal = 0;
		for (let i = 0; i < Blackjack.INITIAL_CARDS; i++) {
			this.playerTotal += this._drawCard();
			this.dealerTotal += this._drawCard();
		}
		this.stage = 'PLAYER_TURN';
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'DEALER_TURN') {
			this.dealerTimer -= dt;
			if (this.dealerTimer <= 0.0) {
				if (this.dealerTotal < Blackjack.DEALER_STAND) {
					this.dealerTotal += this._drawCard();
					this.dealerTimer = Blackjack.DEALER_DRAW_DELAY;
					this.audio.playSynth(SystemSound.TICK);
				} else {
					this._resolveHand();
				}
			}
		} else if (this.stage === 'RESULT') {
			if (this.delayTime <= 0.0) {
				this._newHand();
			}
		}

		this._render();
	}

	_resolveHand() {
		let outcome;
		if (this.dealerTotal > 21) {
			outcome = 'win';
		} else if (this.dealerTotal > this.playerTotal) {
			outcome = 'lose';
		} else if (this.dealerTotal < this.playerTotal) {
			outcome = 'win';
		} else {
			outcome = 'push';
		}
		this.outcome = outcome;
		if (outcome === 'win') {
			this.wins += 1;
			this.audio.play(SystemSound.CHEERING);
		} else if (outcome === 'lose') {
			this.losses += 1;
			this.audio.play(SystemSound.BOOING);
		} else {
			this.audio.playSynth(SystemSound.TICK);
		}
		this.stage = 'RESULT';
		this.delay(Blackjack.RESULT_FLASH);
	}

	handleInput(padId, event) {
		if (this.stage !== 'PLAYER_TURN') {
			return;
		}
		if (event.command === Command.A_PRESS) {
			this.playerTotal += this._drawCard();
			this.audio.playSynth(SystemSound.TICK);
			if (this.playerTotal > 21) {
				this.outcome = 'lose';
				this.losses += 1;
				this.audio.play(SystemSound.BOOING);
				this.stage = 'RESULT';
				this.delay(Blackjack.RESULT_FLASH);
			}
		} else if (event.command === Command.B_PRESS) {
			this.stage = 'DEALER_TURN';
			this.dealerTimer = Blackjack.DEALER_DRAW_DELAY;
		}
	}

	_render() {
		this.clear();

		const half = Math.floor(this.resolution / 2);
		const playerLen = Math.min(half, this.playerTotal);
		for (let i = 0; i < playerLen; i++) {
			this.pixels[i] = Color.CYAN;
		}
		const dealerLen = Math.min(half, this.dealerTotal);
		for (let i = 0; i < dealerLen; i++) {
			this.pixels[this.resolution - 1 - i] = Color.ORANGE;
		}

		if (this.stage === 'PLAYER_TURN') {
			const blink = Math.floor(this.time * 3) % 2 === 0;
			if (blink && playerLen < this.resolution) {
				this.pixels[playerLen] = Color.WHITE;
			}
		} else if (this.stage === 'RESULT') {
			const flashOn = Math.floor(this.time * 6) % 2 === 0;
			if (flashOn) {
				const color = this.outcome === 'win' ? Color.GREEN : this.outcome === 'lose' ? Color.RED : Color.YELLOW;
				for (let i = 0; i < this.resolution; i++) {
					this.pixels[i] = color;
				}
			}
		}
	}
}
