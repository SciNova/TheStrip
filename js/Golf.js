import { Game, Colors, Sound, Command } from './system.js';

export class Golf extends Game {
	static POWER_FREQUENCY = 1.4; // oscillation cycles/sec while charging
	static MAX_SHOT_SPEED = 2.2; // resolution units/sec
	static FRICTION = 1.1; // per sec
	static STOP_THRESHOLD = 0.03; // resolution units/sec
	static HOLE_TOLERANCE = 0.06; // resolution units
	static BASE_HOLE_DISTANCE = 3.0; // resolution units
	static HOLE_DISTANCE_STEP = 0.6;
	static OVERSHOOT_MARGIN = 1.2;
	static PAR = 3;

	constructor(system) {
		super('Golf', system);
		this.holeNumber = 0;
		this.score = 0;
		this._startHole();
	}

	_startHole() {
		const holeDistance = (Golf.BASE_HOLE_DISTANCE + this.holeNumber * Golf.HOLE_DISTANCE_STEP) * this.resolution;
		this.holeZ = holeDistance;
		this.courseLength = holeDistance * Golf.OVERSHOOT_MARGIN;
		this.ballZ = 0.0;
		this.ballVelocity = 0.0;
		this.strokes = 0;
		this.charging = false;
		this.chargeTime = 0.0;
		this.stage = 'AIMING';
	}

	loop() {
		super.loop();
		const dt = this.system.clock.delta;

		if (this.stage === 'AIMING') {
			if (this.charging) {
				this.chargeTime += dt;
			}
		} else if (this.stage === 'ROLLING') {
			this._loopRolling(dt);
		} else if (this.stage === 'HOLED') {
			if (this.delayTime <= 0.0) {
				this.holeNumber += 1;
				this._startHole();
			}
		}

		this._render();
	}

	_currentPower() {
		return 0.5 - 0.5 * Math.cos(this.chargeTime * Golf.POWER_FREQUENCY * 2 * Math.PI);
	}

	_loopRolling(dt) {
		this.ballVelocity *= Math.max(0.0, 1.0 - Golf.FRICTION * dt);
		this.ballZ += this.ballVelocity * dt;

		if (this.ballZ < 0) {
			this.ballZ = 0;
			this.ballVelocity = -this.ballVelocity * 0.5;
		} else if (this.ballZ > this.courseLength) {
			this.ballZ = this.courseLength;
			this.ballVelocity = 0;
		}

		if (Math.abs(this.ballVelocity) < Golf.STOP_THRESHOLD * this.resolution) {
			this.ballVelocity = 0.0;
			if (Math.abs(this.ballZ - this.holeZ) < Golf.HOLE_TOLERANCE * this.resolution) {
				this.score += Math.max(1, Golf.PAR - this.strokes);
				this.audio.play(Sound.LEVEL_COMPLETE);
				this.stage = 'HOLED';
				this.delay(2.0);
			} else {
				this.stage = 'AIMING';
				this.chargeTime = 0.0;
			}
		}
	}

	_release() {
		if (this.stage !== 'AIMING' || !this.charging) {
			return;
		}
		this.charging = false;
		const power = this._currentPower();
		this.ballVelocity = power * Golf.MAX_SHOT_SPEED * this.resolution;
		this.strokes += 1;
		this.stage = 'ROLLING';
		this.audio.play(Sound.SHOOT);
	}

	handleInput(padId, event) {
		if (event.command === Command.FIRE_PRESS && this.stage === 'AIMING') {
			this.charging = true;
			this.chargeTime = 0.0;
		} else if (event.command === Command.FIRE_RELEASE) {
			this._release();
		}
	}

	_render() {
		this.clear();

		if (this.stage === 'AIMING' && this.charging) {
			const power = this._currentPower();
			const v = Math.floor(0x30 + 0x30 * power);
			for (let i = 0; i < this.resolution; i++) {
				this.pixels[i] = v;
			}
		}

		const holePos = Math.round((this.holeZ / this.courseLength) * (this.resolution - 1));
		if (holePos >= 0 && holePos < this.resolution) {
			this.pixels[holePos] = Colors.GREEN;
		}

		const ballPos = Math.round((this.ballZ / this.courseLength) * (this.resolution - 1));
		if (ballPos >= 0 && ballPos < this.resolution) {
			this.pixels[ballPos] = Colors.WHITE;
		}

		if (this.stage === 'HOLED') {
			const flashOn = Math.floor(this.time * 6) % 2 === 0;
			if (flashOn) {
				for (let i = 0; i < this.resolution; i++) {
					this.pixels[i] = Colors.DARK_GREEN;
				}
				this.pixels[holePos] = Colors.GREEN;
			}
		}
	}
}
