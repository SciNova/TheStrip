import { Game } from '../../core/Game.js';
import { Color } from '../../core/Color.js';
import { Command } from '../../core/Command.js';
import { SystemSound } from '../../core/audio/SystemSound.js';

const ZONES = [
	{ start: 0.85, end: 1.0, score: 10 },
	{ start: 0.65, end: 0.85, score: 7 },
	{ start: 0.4, end: 0.65, score: 4 },
	{ start: 0.0, end: 0.4, score: 0 },
];

function zoneScore(fraction) {
	for (const zone of ZONES) {
		if (fraction >= zone.start && fraction < zone.end) {
			return zone.score;
		}
	}
	return 0;
}

export class Shuffleboard extends Game {
	static POWER_FREQUENCY = 1.1;
	static MAX_SHOT_SPEED = 1.6;
	static FRICTION = 0.55;
	static STOP_THRESHOLD = 0.02;
	static KNOCK_RADIUS = 5;
	static KNOCK_IMPULSE = 0.5;
	static THROWS_PER_PLAYER = 2;
	static CPU_THROW_DELAY = 1.0;
	static RESULT_FLASH = 2.5;

	constructor(system) {
		super('Shuffleboard', system);
		this.playerWins = 0;
		this.cpuWins = 0;
		this._startRound();
	}

	_startRound() {
		this.pucks = [];
		this.turn = 'player';
		this.throwsTakenPlayer = 0;
		this.throwsTakenCpu = 0;
		this.charging = false;
		this.chargeTime = 0.0;
		this.cpuTimer = Shuffleboard.CPU_THROW_DELAY;
		this.stage = 'PLAYER_AIM';
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'PLAYER_AIM') {
			if (this.charging) {
				this.chargeTime += dt;
			}
		} else if (this.stage === 'ROLLING') {
			this._loopRolling(dt);
		} else if (this.stage === 'CPU_WAIT') {
			this.cpuTimer -= dt;
			if (this.cpuTimer <= 0.0) {
				this._cpuThrow();
			}
		} else if (this.stage === 'RESULT') {
			if (this.delayTime <= 0.0) {
				this._startRound();
			}
		}

		this._render();
	}

	_currentPower() {
		return 0.5 - 0.5 * Math.cos(this.chargeTime * Shuffleboard.POWER_FREQUENCY * 2 * Math.PI);
	}

	_release() {
		if (this.stage !== 'PLAYER_AIM' || !this.charging) {
			return;
		}
		this.charging = false;
		const power = this._currentPower();
		this._launchPuck('player', power * Shuffleboard.MAX_SHOT_SPEED * this.resolution);
		this.throwsTakenPlayer += 1;
		this.audio.playSynth(SystemSound.SHOOT);
	}

	_cpuThrow() {
		const target = 0.65 + this.system.random() * 0.3;
		const speed = Math.sqrt(2 * Shuffleboard.FRICTION * target) * this.resolution * (0.9 + this.system.random() * 0.2);
		this._launchPuck('cpu', speed);
		this.throwsTakenCpu += 1;
		this.audio.playSynth(SystemSound.SHOOT);
	}

	_launchPuck(owner, speed) {
		this.pucks.push({ owner, pos: 0.0, velocity: speed });
		this.stage = 'ROLLING';
	}

	_loopRolling(dt) {
		let allStopped = true;
		for (const puck of this.pucks) {
			if (Math.abs(puck.velocity) > Shuffleboard.STOP_THRESHOLD * this.resolution) {
				allStopped = false;
				puck.velocity *= Math.max(0.0, 1.0 - Shuffleboard.FRICTION * dt);
				puck.pos += puck.velocity * dt;
				if (puck.pos > this.resolution - 1) {
					puck.pos = this.resolution - 1;
					puck.velocity = 0;
				}
				for (const other of this.pucks) {
					if (other === puck) {
						continue;
					}
					if (Math.abs(other.pos - puck.pos) < Shuffleboard.KNOCK_RADIUS && puck.velocity > 0) {
						other.velocity += Shuffleboard.KNOCK_IMPULSE * this.resolution;
					}
				}
			} else {
				puck.velocity = 0;
			}
		}

		if (allStopped) {
			this._nextTurn();
		}
	}

	_nextTurn() {
		if (this.turn === 'player') {
			if (this.throwsTakenPlayer < Shuffleboard.THROWS_PER_PLAYER) {
				this.stage = 'PLAYER_AIM';
			} else {
				this.turn = 'cpu';
				this.stage = 'CPU_WAIT';
				this.cpuTimer = Shuffleboard.CPU_THROW_DELAY;
			}
		} else if (this.throwsTakenCpu < Shuffleboard.THROWS_PER_PLAYER) {
			this.stage = 'CPU_WAIT';
			this.cpuTimer = Shuffleboard.CPU_THROW_DELAY;
		} else {
			this._tallyRound();
		}
	}

	_tallyRound() {
		let playerTotal = 0;
		let cpuTotal = 0;
		for (const puck of this.pucks) {
			const score = zoneScore(puck.pos / (this.resolution - 1));
			if (puck.owner === 'player') {
				playerTotal += score;
			} else {
				cpuTotal += score;
			}
		}
		if (playerTotal > cpuTotal) {
			this.playerWins += 1;
			this.won = true;
			this.audio.play(SystemSound.CHEERING);
		} else if (cpuTotal > playerTotal) {
			this.cpuWins += 1;
			this.won = false;
			this.audio.play(SystemSound.BOOING);
		} else {
			this.won = null;
			this.audio.playSynth(SystemSound.TICK);
		}
		this.stage = 'RESULT';
		this.delay(Shuffleboard.RESULT_FLASH);
	}

	handleInput(padId, event) {
		if (event.command === Command.FIRE_PRESS && this.stage === 'PLAYER_AIM') {
			this.charging = true;
			this.chargeTime = 0.0;
		} else if (event.command === Command.FIRE_RELEASE) {
			this._release();
		}
	}

	_render() {
		this.clear();

		for (const zone of ZONES) {
			if (zone.score === 0) {
				continue;
			}
			const start = Math.floor(zone.start * (this.resolution - 1));
			const end = Math.floor(zone.end * (this.resolution - 1));
			const brightness = 0.15 + 0.1 * (zone.score / 10);
			const v = Math.floor(0xFF * brightness);
			for (let i = start; i <= end && i < this.resolution; i++) {
				this.pixels[i] = v << 8;
			}
		}

		for (const puck of this.pucks) {
			const pos = Math.round(puck.pos);
			if (pos >= 0 && pos < this.resolution) {
				this.pixels[pos] = puck.owner === 'player' ? Color.CYAN : Color.ORANGE;
			}
		}

		if (this.stage === 'PLAYER_AIM' && this.charging) {
			const power = this._currentPower();
			const v = Math.floor(0x40 * power);
			this.pixels[0] = v << 16;
		}

		if (this.stage === 'RESULT') {
			const flashOn = Math.floor(this.time * 6) % 2 === 0;
			if (flashOn) {
				const color = this.won === true ? Color.GREEN : this.won === false ? Color.RED : Color.YELLOW;
				for (let i = 0; i < this.resolution; i++) {
					this.pixels[i] = color;
				}
			}
		}
	}
}
