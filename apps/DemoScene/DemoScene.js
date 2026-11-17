import { Game, Colors, hsvToRgb, Command } from '../../core/system.js';

const Stage = Object.freeze({
	FRACTAL_MOUNTAIN: 0,
	STARFIELD_WARP: 1,
	FIREWORKS: 2,
	INTERFERENCE: 3,
	AURORA_BOREALIS: 4,
	DIGITAL_RAIN: 5,
	COPPER_BARS: 6,
	SCANNER: 7,
	REACTIVE_BURST: 8,
	BOUNCING_BALLS: 9,
});
const STAGE_COUNT = 10;
const STAGE_DURATIONS = [16.0, 15.0, 13.0, 13.0, 14.0, 13.0, 11.0, 10.0, 14.0, 16.0];

// ---------- Fractal Mountain ----------
// A 1D slice through the Mandelbrot set is punctate, not landscape-like: the
// line crosses the boundary at a few isolated points, with solid black
// (interior) or flat fast-escaping color on either side. The "hills and
// valleys" look of Mandelbrot renders comes from the 2D neighborhood around
// the boundary, which a single scanline never sees. Fractal (Perlin-style)
// noise gives an actual continuous, self-similar height field instead.

function fractalHash(n) {
	const s = Math.sin(n) * 43758.5453123;
	return s - Math.floor(s);
}

function fractalValueNoise(x) {
	const xi = Math.floor(x);
	const xf = x - xi;
	const a = fractalHash(xi);
	const b = fractalHash(xi + 1);
	const u = xf * xf * (3 - 2 * xf);
	return a + (b - a) * u;
}

const MOUNTAIN_OCTAVES = 5;
const MOUNTAIN_PERSISTENCE = 0.52;
const MOUNTAIN_LACUNARITY = 2.05;

// Fractional Brownian motion: layered octaves of the same noise at doubling
// frequency and halving amplitude, so detail keeps appearing at every zoom
// level by construction, with no need to steer around anything.
function mountainHeight(x, seed) {
	let total = 0, amplitude = 1, frequency = 1, maxValue = 0;
	for (let o = 0; o < MOUNTAIN_OCTAVES; o++) {
		total += fractalValueNoise(x * frequency + seed + o * 91.7) * amplitude;
		maxValue += amplitude;
		amplitude *= MOUNTAIN_PERSISTENCE;
		frequency *= MOUNTAIN_LACUNARITY;
	}
	// Summed octaves regress toward the middle; stretch contrast back out so
	// the palette actually reaches deep valleys and bright peaks.
	const e = (total / maxValue - 0.5) * 1.6 + 0.5;
	return Math.max(0, Math.min(1, e));
}

const TERRAIN_STOPS = [
	{ p: 0.0, c: [8, 10, 40] },
	{ p: 0.18, c: [15, 60, 130] },
	{ p: 0.38, c: [30, 130, 110] },
	{ p: 0.55, c: [120, 150, 40] },
	{ p: 0.72, c: [190, 110, 40] },
	{ p: 0.88, c: [255, 200, 110] },
	{ p: 1.0, c: [255, 255, 255] },
];

function terrainColor(e) {
	for (let k = 0; k < TERRAIN_STOPS.length - 1; k++) {
		const a = TERRAIN_STOPS[k];
		const b = TERRAIN_STOPS[k + 1];
		if (e <= b.p) {
			const f = (e - a.p) / (b.p - a.p);
			const r = Math.floor(a.c[0] + (b.c[0] - a.c[0]) * f);
			const g = Math.floor(a.c[1] + (b.c[1] - a.c[1]) * f);
			const bch = Math.floor(a.c[2] + (b.c[2] - a.c[2]) * f);
			return (r << 16) | (g << 8) | bch;
		}
	}
	return 0xFFFFFF;
}

// ---------- Starfield Warp ----------

// STAR_Z_NEAR is a numeric floor, not a "passed the camera" threshold: with
// screen position going as x/z, only stars with |x| near 1 would ever reach
// the strip edge before z hit 1.0, so most stars would just vanish mid-strip
// instead of streaking off past the edge. Keeping it tiny lets x/z diverge
// enough for every star, regardless of its direction, to actually reach the
// edge and produce a visible streak before respawning.
const STAR_Z_NEAR = 0.08;
const STAR_Z_FAR = 60.0;
const STAR_BASE_SPEED = 12.0;

class Star {
	constructor() {
		this.respawn(true);
	}

	respawn(spread = false) {
		this.z = spread
			? STAR_Z_NEAR + Math.random() * (STAR_Z_FAR - STAR_Z_NEAR)
			: STAR_Z_FAR * (0.85 + Math.random() * 0.15);
		this.x = Math.random() * 2 - 1;
		this.speedVar = 0.7 + Math.random() * 0.8;
		const warm = Math.random() < 0.15;
		this.hue = warm ? 0.09 + Math.random() * 0.05 : 0.55 + Math.random() * 0.1;
	}
}

// ---------- Fireworks ----------

class Particle {
	constructor(position, velocity, color, lifetime, gravity) {
		this.position = position;
		this.velocity = velocity;
		this.color = color;
		this.life = lifetime;
		this.gravity = gravity;
		this.age = 0.0;
	}

	update(dt) {
		const decel = this.gravity * dt;
		if (this.velocity > 0) {
			this.velocity = Math.max(0, this.velocity - decel);
		} else if (this.velocity < 0) {
			this.velocity = Math.min(0, this.velocity + decel);
		}
		this.position += this.velocity * dt;
		this.age += dt;
		return this.age >= this.life;
	}

	get alpha() {
		const t = this.age / this.life;
		return 1.0 - t ** 2;
	}
}

class Firework {
	constructor(resolution) {
		this.peakPosition = 8 + Math.floor(Math.random() * (resolution - 16));
		this.riseTime = 0.4 + Math.random() * 0.7;
		this.burstRadius = 12 + Math.random() * 40;
		this.burstLife = 0.8 + Math.random() * 1.0;
		this.gravity = 16 + Math.random() * 10;
		this.hue = Math.random();
		this.riseElapsed = 0.0;
		this.burstElapsed = 0.0;
		this.bursted = false;
		this.particles = [];
	}

	update(dt) {
		if (!this.bursted) {
			this.riseElapsed += dt;
			if (this.riseElapsed >= this.riseTime) {
				this.riseElapsed = this.riseTime;
				this.bursted = true;
				this._explode();
			}
			return true;
		}
		this.burstElapsed += dt;
		for (const p of this.particles) {
			p.update(dt);
		}
		this.particles = this.particles.filter((p) => p.age < p.life);
		return !(this.particles.length === 0 && this.burstElapsed >= this.burstLife);
	}

	_explode() {
		const numParticles = 22 + Math.floor(Math.random() * 14);
		for (let i = 0; i < numParticles; i++) {
			const angle = Math.random() * 2 * Math.PI;
			const velocity = Math.cos(angle) * this.burstRadius * 1.2;
			const color = hsvToRgb(this.hue, Math.random() * 0.3 + 0.7, 1);
			const life = this.burstLife * (0.5 + Math.random() * 0.5);
			this.particles.push(new Particle(this.peakPosition, velocity, color, life, this.gravity));
		}
	}
}

// ---------- Aurora Borealis ----------

const AURORA_BANDS = [
	{ hue: 0.36, wavelength: 0.55, speedMul: 1.0 },
	{ hue: 0.47, wavelength: 0.7, speedMul: 0.7 },
	{ hue: 0.80, wavelength: 0.85, speedMul: 0.55 },
	{ hue: 0.58, wavelength: 0.65, speedMul: 0.85 },
];

// ---------- Digital Rain ----------

class RainDrop {
	constructor(resolution) {
		this.respawn(resolution, true);
	}

	respawn(resolution, initial = false) {
		this.headPos = initial ? Math.random() * resolution : resolution + Math.random() * resolution * 0.4 + 2;
		this.speed = resolution * (0.35 + Math.random() * 0.85);
		this.length = 3 + Math.floor(Math.random() * (resolution * 0.14 + 5));
		const cyan = Math.random() < 0.12;
		this.hue = cyan ? 0.5 : 0.33 + (Math.random() * 0.06 - 0.03);
	}

	update(dt, resolution) {
		this.headPos -= this.speed * dt;
		if (this.headPos + this.length < 0) {
			this.respawn(resolution, false);
		}
	}
}

// ---------- Reactive Burst ----------

class ReactionDot {
	constructor(position, velocity, hue, life, drag, canSpawnChild) {
		this.position = position;
		this.velocity = velocity;
		this.hue = hue;
		this.sat = 0.65 + Math.random() * 0.35;
		this.life = life;
		this.age = 0.0;
		this.drag = drag;
		this.fadeExp = 1.1 + Math.random() * 2.2;
		this.childSpawned = false;
		this.childTriggerAge = (canSpawnChild && Math.random() < 0.16)
			? life * (0.3 + Math.random() * 0.4)
			: null;
	}

	update(dt) {
		if (this.velocity > 0) {
			this.velocity = Math.max(0, this.velocity - this.drag * dt);
		} else if (this.velocity < 0) {
			this.velocity = Math.min(0, this.velocity + this.drag * dt);
		}
		this.position += this.velocity * dt;
		this.age += dt;
		return this.age >= this.life;
	}

	get alpha() {
		const t = Math.min(1, this.age / this.life);
		return Math.pow(1 - t, this.fadeExp);
	}
}

// ---------- Bouncing Balls ----------

const BOUNCE_BALL_COUNT = 5;
const BOUNCE_GRAVITY = 55;
const BOUNCE_MAX_RADIUS = 5.0;
const BOUNCE_SETTLE_SPEED = 3.5;

class BouncingBall {
	constructor(resolution) {
		this.respawn(resolution, true);
	}

	respawn(resolution, initial) {
		this.radius = 1.4 + Math.random() * (BOUNCE_MAX_RADIUS - 1.4);
		this.hue = Math.random();
		const sizeT = this.radius / BOUNCE_MAX_RADIUS;
		this.gravity = BOUNCE_GRAVITY * (0.55 + sizeT * 0.9);
		this.restitution = 0.88 - sizeT * 0.34;
		this.omega = Math.max(4.0, 16.0 - this.radius * 2.0);
		this.zeta = 0.18 + Math.random() * 0.18;
		this.squashDisp = 0.0;
		this.squashVel = 0.0;
		this.velocity = 0.0;
		this.resting = false;
		this.restTimer = 0.0;
		this.position = initial
			? this.radius + Math.random() * Math.max(1, resolution - this.radius * 2)
			: resolution + this.radius + Math.random() * resolution * 0.6;
	}

	_updateSquash(dt) {
		const omega2 = this.omega * this.omega;
		const accel = -omega2 * this.squashDisp - 2 * this.zeta * this.omega * this.squashVel;
		this.squashVel += accel * dt;
		this.squashDisp += this.squashVel * dt;
		this.squashDisp = Math.max(-0.65, Math.min(0.9, this.squashDisp));
	}

	update(dt, resolution) {
		if (this.resting) {
			this._updateSquash(dt);
			this.restTimer -= dt;
			if (this.restTimer <= 0) {
				this.respawn(resolution, false);
			}
			return;
		}

		this.velocity -= this.gravity * dt;
		this.position += this.velocity * dt;

		if (this.position - this.radius <= 0) {
			this.position = this.radius;
			const impactSpeed = Math.abs(this.velocity);
			this.velocity = -this.velocity * this.restitution;
			this.squashVel -= impactSpeed * 0.05;

			if (impactSpeed < BOUNCE_SETTLE_SPEED && Math.abs(this.velocity) < BOUNCE_SETTLE_SPEED) {
				this.velocity = 0.0;
				this.resting = true;
				this.restTimer = 0.5 + Math.random() * 1.2;
			}
		}

		this._updateSquash(dt);
	}

	get renderRadius() {
		return Math.max(0.6, this.radius * (1 + this.squashDisp));
	}
}

export class DemoScene extends Game {
	constructor(system) {
		super('DemoScene', system);
		this.stage = Stage.FRACTAL_MOUNTAIN;
		this.stageStart = 0.0;

		this.fractalSeed = 0.0;

		this.stars = [];

		this.fireworks = [];
		this.nextFirework = 0.4;

		this.raindrops = [];

		this.waveSeed = 0.0;
		this.auroraSeed = 0.0;
		this.copperSeed = 0.0;
		this.copperHueOffset = 0.0;
		this.scannerBars = [];

		this.reactionParticles = [];
		this.reactionAccum = 0.0;
		this.reactionPhase = 0.0;

		this.balls = [];

		this.copperAccumR = new Float32Array(this.resolution);
		this.copperAccumG = new Float32Array(this.resolution);
		this.copperAccumB = new Float32Array(this.resolution);
	}

	_enterStage(stage) {
		switch (stage) {
			case Stage.FRACTAL_MOUNTAIN:
				this.fractalSeed = Math.random() * 1000.0;
				break;
			case Stage.STARFIELD_WARP: {
				this.stars = [];
				const count = Math.max(20, Math.floor(this.resolution * 0.6));
				for (let i = 0; i < count; i++) {
					this.stars.push(new Star());
				}
				break;
			}
			case Stage.FIREWORKS:
				this.fireworks = [];
				this.nextFirework = this.time + 0.3;
				break;
			case Stage.INTERFERENCE:
				this.waveSeed = Math.random() * 100.0;
				break;
			case Stage.AURORA_BOREALIS:
				this.auroraSeed = Math.random() * 100.0;
				break;
			case Stage.DIGITAL_RAIN: {
				this.raindrops = [];
				const count = Math.max(6, Math.floor(this.resolution * 0.3));
				for (let i = 0; i < count; i++) {
					this.raindrops.push(new RainDrop(this.resolution));
				}
				break;
			}
			case Stage.COPPER_BARS:
				this.copperSeed = Math.random() * 100.0;
				this.copperHueOffset = Math.random();
				break;
			case Stage.SCANNER: {
				this.scannerBars = [];
				const barCount = 3 + Math.floor(Math.random() * 3);
				for (let i = 0; i < barCount; i++) {
					this.scannerBars.push({
						period: 0.5 + Math.random() * 3.5,
						phase: Math.random() * 20.0,
						hue: Math.random(),
						widthMul: 0.25 + Math.random() * 0.55,
					});
				}
				break;
			}
			case Stage.REACTIVE_BURST:
				this.reactionParticles = [];
				this.reactionAccum = 0.0;
				this.reactionPhase = Math.random() * 100.0;
				break;
			default: {
				this.balls = [];
				for (let i = 0; i < BOUNCE_BALL_COUNT; i++) {
					this.balls.push(new BouncingBall(this.resolution));
				}
			}
		}
	}

	_blendMax(idx, color) {
		if (idx < 0 || idx >= this.resolution) {
			return;
		}
		const existing = this.pixels[idx];
		const er = (existing >> 16) & 0xFF, eg = (existing >> 8) & 0xFF, eb = existing & 0xFF;
		const nr = (color >> 16) & 0xFF, ng = (color >> 8) & 0xFF, nb = color & 0xFF;
		this.pixels[idx] = (Math.max(er, nr) << 16) | (Math.max(eg, ng) << 8) | Math.max(eb, nb);
	}

	_renderFractalMountain(st) {
		const noiseScale = 0.07;
		const scrollSpeed = 0.5;
		const scrollPos = st * scrollSpeed;

		for (let i = 0; i < this.resolution; i++) {
			const e = mountainHeight(scrollPos + i * noiseScale, this.fractalSeed);
			this.pixels[i] = terrainColor(e);
		}
	}

	_renderStarfieldWarp(st, duration, dt) {
		const warp = Math.min(1.0, st / duration);
		const vMul = 1 + warp * warp * 9;
		const center = (this.resolution - 1) / 2;
		const halfWidth = center;

		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = 0x000004;
		}

		const maxStars = Math.min(90, Math.floor(this.resolution * 0.6 + warp * this.resolution * 0.9));
		while (this.stars.length < maxStars) {
			this.stars.push(new Star());
		}

		for (const star of this.stars) {
			const speed = STAR_BASE_SPEED * vMul * star.speedVar;
			star.z = Math.max(STAR_Z_NEAR, star.z - dt * speed);

			const pos = center + (star.x / star.z) * halfWidth;
			if (pos < 0 || pos > this.resolution - 1) {
				star.respawn(false);
				continue;
			}

			const brightness = Math.min(1.0, (STAR_Z_NEAR * STAR_Z_NEAR) / (star.z * star.z));
			const sat = Math.max(0.15, 0.9 - warp * 0.75);
			const color = hsvToRgb(star.hue, sat, brightness);

			// dpos/dt = x * halfWidth * speed / z^2 (magnitude), so streaks
			// grow naturally as the star closes in on z = 0.
			const dposdt = Math.abs(star.x) * halfWidth * speed / (star.z * star.z);
			const streak = Math.min(10, dposdt * dt * 4);

			const basePos = Math.floor(pos);
			this._blendMax(basePos, color);

			// The tail trails back toward the center, opposite the direction
			// of outward travel.
			const trailDir = star.x >= 0 ? -1 : 1;
			const steps = Math.ceil(streak);
			for (let s = 1; s <= steps; s++) {
				const fade = 1 - s / (steps + 1);
				const tr = Math.floor(((color >> 16) & 0xFF) * fade);
				const tg = Math.floor(((color >> 8) & 0xFF) * fade);
				const tb = Math.floor((color & 0xFF) * fade);
				this._blendMax(basePos + trailDir * s, (tr << 16) | (tg << 8) | tb);
			}
		}
	}

	_renderFireworks(t, dt, st, duration) {
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = 0x000011;
		}

		const remaining = duration - st;
		if (t >= this.nextFirework && this.fireworks.length < 8) {
			const count = Math.random() < 0.3 ? 2 : 1;
			for (let k = 0; k < count && this.fireworks.length < 8; k++) {
				this.fireworks.push(new Firework(this.resolution));
			}
			const interval = remaining < 3.0 ? (0.15 + Math.random() * 0.35) : (0.45 + Math.random() * 1.5);
			this.nextFirework = t + interval;
		}

		this.fireworks = this.fireworks.filter((fw) => fw.update(dt));

		for (const fw of this.fireworks) {
			if (!fw.bursted) {
				const frac = fw.riseElapsed / fw.riseTime;
				const pos = Math.floor(frac * fw.peakPosition);
				this._blendMax(pos, Colors.WHITE);
				this._blendMax(pos - 1, 0x552200);
			} else {
				for (const p of fw.particles) {
					const pos = Math.floor(p.position);
					const a = p.alpha;
					const r = Math.floor(((p.color >> 16) & 0xFF) * a);
					const g = Math.floor(((p.color >> 8) & 0xFF) * a);
					const b = Math.floor((p.color & 0xFF) * a);
					this._blendMax(pos, (r << 16) | (g << 8) | b);
				}
			}
		}
	}

	_renderInterference(t) {
		const seed = this.waveSeed;
		for (let i = 0; i < this.resolution; i++) {
			const w1 = Math.sin(i * 0.12 - t * 1.0 + seed);
			const w2 = Math.sin(i * 0.135 + t * 1.15 + seed * 1.7);
			const w3 = Math.sin(i * 0.05 + t * 0.4 - seed * 0.6) * 0.5;
			const sum = w1 + w2 + w3;
			const norm = Math.max(-1, Math.min(1, sum / 2.5));
			const intensity = Math.pow((norm + 1) / 2, 1.6);
			const hue = 0.55 + 0.15 * Math.sin(t * 0.05 + seed) + norm * 0.05;
			this.pixels[i] = hsvToRgb(hue, 0.85, intensity);
		}
	}

	_renderAuroraBorealis(now, seed) {
		const t = now * 0.5;
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = 0x010108;
		}

		for (let bi = 0; bi < AURORA_BANDS.length; bi++) {
			const band = AURORA_BANDS[bi];
			const bandSeed = seed + bi * 13.7;
			for (let i = 0; i < this.resolution; i++) {
				const x = i / (this.resolution - 1);
				const w1 = Math.sin(x * band.wavelength * Math.PI * 2 + t * band.speedMul + bandSeed);
				const w2 = Math.sin(x * band.wavelength * Math.PI - t * band.speedMul * 0.6 + bandSeed * 1.7);
				const raw = w1 * 0.6 + w2 * 0.4;
				const shaped = Math.pow(Math.max(0, raw), 1.6);
				if (shaped < 0.02) {
					continue;
				}
				const flicker = 0.85 + 0.15 * Math.sin(now * 2.0 + i * 0.3 + bandSeed * 2.0);
				const value = Math.max(0, Math.min(1, shaped * 1.3 * flicker));
				const hueDrift = 0.02 * Math.sin(x * 3.0 + t * 0.3 + bandSeed);
				const color = hsvToRgb(band.hue + hueDrift, 0.85, value);
				this._blendMax(i, color);
			}
		}
	}

	_renderDigitalRain(dt) {
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = 0x000300;
		}

		for (const drop of this.raindrops) {
			drop.update(dt, this.resolution);
			for (let k = 0; k < drop.length; k++) {
				const pos = Math.floor(drop.headPos + k);
				if (pos < 0 || pos >= this.resolution) {
					continue;
				}
				const fade = Math.pow(1 - k / drop.length, 1.6);
				const color = k === 0 ? hsvToRgb(drop.hue, 0.25, 1.0) : hsvToRgb(drop.hue, 0.9, fade);
				this._blendMax(pos, color);
			}
		}
	}

	_renderCopperBars(t) {
		const seed = this.copperSeed;
		const numBars = 6;
		for (let i = 0; i < this.resolution; i++) {
			this.copperAccumR[i] = 4;
			this.copperAccumG[i] = 4;
			this.copperAccumB[i] = 10;
		}

		for (let bIdx = 0; bIdx < numBars; bIdx++) {
			const hue = (this.copperHueOffset + bIdx / numBars) % 1.0;
			const color = hsvToRgb(hue, 1.0, 1.0);
			const r = (color >> 16) & 0xFF, g = (color >> 8) & 0xFF, b = color & 0xFF;
			const freq = 0.55 + bIdx * 0.11;
			const phase = seed + bIdx * 1.7;
			const amplitude = (this.resolution * 0.5) * (0.5 + 0.3 * Math.sin(seed * 3 + bIdx));
			const center = (this.resolution - 1) * 0.5 + amplitude * Math.sin(t * freq + phase);
			const width = Math.max(1.2, this.resolution * 0.045) * (1 + 0.2 * Math.sin(t * 2.3 + phase));

			for (let i = 0; i < this.resolution; i++) {
				const d = i - center;
				const gauss = Math.exp(-(d * d) / (2 * width * width));
				if (gauss < 0.004) {
					continue;
				}
				const shimmer = 0.8 + 0.2 * Math.sin(i * 1.1 + t * 7 + phase);
				const w = gauss * shimmer;
				this.copperAccumR[i] += r * w;
				this.copperAccumG[i] += g * w;
				this.copperAccumB[i] += b * w;
			}
		}

		for (let i = 0; i < this.resolution; i++) {
			const r = Math.min(255, Math.floor(this.copperAccumR[i]));
			const g = Math.min(255, Math.floor(this.copperAccumG[i]));
			const b = Math.min(255, Math.floor(this.copperAccumB[i]));
			this.pixels[i] = (r << 16) | (g << 8) | b;
		}
	}

	_renderScanner(now) {
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = 0x000000;
		}

		for (const bar of this.scannerBars) {
			const cyclePos = ((now + bar.phase) / bar.period) % 2.0;
			const tri = cyclePos < 1.0 ? cyclePos : 2.0 - cyclePos;
			const movingRight = cyclePos < 1.0;
			const pos = tri * (this.resolution - 1);
			const hue = (bar.hue + now * 0.03) % 1.0;
			const color = hsvToRgb(hue, 1.0, 1.0);
			const r = (color >> 16) & 0xFF, g = (color >> 8) & 0xFF, b = color & 0xFF;
			const aheadWidth = Math.max(0.8, this.resolution * 0.018 * bar.widthMul);
			const behindWidth = Math.max(2.0, this.resolution * 0.09 * bar.widthMul);

			for (let i = 0; i < this.resolution; i++) {
				const d = i - pos;
				const isAhead = movingRight ? d > 0 : d < 0;
				const width = isAhead ? aheadWidth : behindWidth;
				const w = Math.exp(-(d * d) / (2 * width * width));
				if (w < 0.004) {
					continue;
				}
				this._blendMax(i, (Math.floor(r * w) << 16) | (Math.floor(g * w) << 8) | Math.floor(b * w));
			}
		}
	}

	_spawnReaction(originPos, count, baseHue, canSpawnChild) {
		for (let i = 0; i < count; i++) {
			const dir = Math.random() < 0.5 ? -1 : 1;
			const speed = dir * this.resolution * (0.06 + Math.random() * 0.28);
			const hue = baseHue === null
				? Math.random()
				: (baseHue + (Math.random() * 0.12 - 0.06) + 1) % 1;
			const life = 0.45 + Math.random() * 1.0;
			const drag = 3 + Math.random() * 9;
			this.reactionParticles.push(new ReactionDot(originPos, speed, hue, life, drag, canSpawnChild));
		}
	}

	_renderReactiveBurst(now, dt) {
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = 0x000005;
		}

		const center = (this.resolution - 1) / 2;
		const spawnInterval = 0.045;
		const intensity = 0.55 + 0.45 * Math.sin(now * 0.5 + this.reactionPhase);
		this.reactionAccum += dt;
		while (this.reactionAccum >= spawnInterval) {
			this.reactionAccum -= spawnInterval;
			const count = 1 + Math.round(Math.random() * 2 * intensity);
			this._spawnReaction(center, count, null, true);
		}

		const alive = [];
		for (const dot of this.reactionParticles) {
			const dead = dot.update(dt);
			if (!dead && dot.childTriggerAge !== null && !dot.childSpawned && dot.age >= dot.childTriggerAge) {
				dot.childSpawned = true;
				this._spawnReaction(dot.position, 3 + Math.floor(Math.random() * 5), dot.hue, false);
			}
			if (!dead) {
				alive.push(dot);
			}
		}
		this.reactionParticles = alive;
		if (this.reactionParticles.length > 140) {
			this.reactionParticles.splice(0, this.reactionParticles.length - 140);
		}

		for (const dot of this.reactionParticles) {
			const pos = Math.floor(dot.position);
			const color = hsvToRgb(dot.hue, dot.sat, dot.alpha);
			this._blendMax(pos, color);
		}
	}

	_renderBouncingBalls(dt) {
		for (let i = 0; i < this.resolution; i++) {
			this.pixels[i] = 0x000000;
		}

		for (const ball of this.balls) {
			ball.update(dt, this.resolution);
		}

		for (const ball of this.balls) {
			const r = ball.renderRadius;
			const sigma = Math.max(0.35, r * 0.62);
			const span = Math.max(1, Math.ceil(r * 2.2));
			const start = Math.max(0, Math.floor(ball.position - span));
			const end = Math.min(this.resolution - 1, Math.ceil(ball.position + span));
			for (let i = start; i <= end; i++) {
				const d = i - ball.position;
				const shade = Math.exp(-(d * d) / (2 * sigma * sigma));
				if (shade < 0.01) {
					continue;
				}
				const color = hsvToRgb(ball.hue, 0.9, shade);
				this._blendMax(i, color);
			}
		}
	}

	loop() {
		super.loop();
		const now = this.time;
		const dt = this.system.clock.delta;

		const duration = STAGE_DURATIONS[this.stage];
		if (now - this.stageStart >= duration) {
			this.stage = (this.stage + 1) % STAGE_COUNT;
			this.stageStart = now;
			this._enterStage(this.stage);
		}

		const st = now - this.stageStart;
		const t = now * 2.0;

		switch (this.stage) {
			case Stage.FRACTAL_MOUNTAIN:
				this._renderFractalMountain(st);
				break;
			case Stage.STARFIELD_WARP:
				this._renderStarfieldWarp(st, STAGE_DURATIONS[Stage.STARFIELD_WARP], dt);
				break;
			case Stage.FIREWORKS:
				this._renderFireworks(now, dt, st, STAGE_DURATIONS[Stage.FIREWORKS]);
				break;
			case Stage.INTERFERENCE:
				this._renderInterference(t);
				break;
			case Stage.AURORA_BOREALIS:
				this._renderAuroraBorealis(now, this.auroraSeed);
				break;
			case Stage.DIGITAL_RAIN:
				this._renderDigitalRain(dt);
				break;
			case Stage.COPPER_BARS:
				this._renderCopperBars(t);
				break;
			case Stage.SCANNER:
				this._renderScanner(now);
				break;
			case Stage.REACTIVE_BURST:
				this._renderReactiveBurst(now, dt);
				break;
			default:
				this._renderBouncingBalls(dt);
		}
	}

	handleInput(padId, event) {
		if (event.command === Command.LEFT) {
			this.stage = (this.stage - 1 + STAGE_COUNT) % STAGE_COUNT;
		} else if (event.command === Command.RIGHT) {
			this.stage = (this.stage + 1) % STAGE_COUNT;
		} else {
			return;
		}
		this.stageStart = this.time;
		this._enterStage(this.stage);
	}
}
