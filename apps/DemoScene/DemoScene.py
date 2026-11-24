import math
import random
from enum import IntEnum

from system import Game
from system import Colors
from system import hsv_to_rgb

class Stage(IntEnum):
	PLASMA = 0
	INTERFERENCE = 1
	FIREWORKS = 2
	BOUNCING_BALLS = 3

class Particle:
	def __init__(self, position, velocity, color, lifetime):
		self.position = position
		self.velocity = velocity
		self.color = color
		self.life = lifetime
		self.age = 0.0

	def update(self, dt):
		self.position += self.velocity * dt
		self.age += dt
		return self.age >= self.life

	@property
	def alpha(self):
		t = self.age / self.life
		return 1.0 - t**2

class Firework:
	def __init__(self, resolution):
		self.peak_position = random.randint(10, resolution - 10)
		self.rise_time = 0.5 + random.random() * 1.0
		self.burst_radius = 5 + random.random() * 20
		self.burst_life = 0.3 + random.random() * 0.5
		self.hue = random.random()
		self.rise_elapsed = 0.0
		self.burst_elapsed = 0.0
		self.bursted = False
		self.particles = []

	def update(self, dt, strip_length, audio=None):
		if not self.bursted:
			self.rise_elapsed += dt
			if self.rise_elapsed >= self.rise_time:
				self.rise_elapsed = self.rise_time
				self.bursted = True
				self._explode(strip_length)
			return True
		self.burst_elapsed += dt
		for p in self.particles:
			p.update(dt)
		self.particles = [p for p in self.particles if p.age < p.life]
		if not self.particles and self.burst_elapsed >= self.burst_life:
			return False
		return True

	def _explode(self, resolution):
		num_particles = 12 + random.randint(0, 8)
		for _ in range(num_particles):
			angle = random.random() * 2 * math.pi
			velocity = math.cos(angle) * self.burst_radius * 1.2
			color = hsv_to_rgb(self.hue, random.random() * 0.3 + 0.7, 1)
			life = self.burst_life * (0.5 + random.random() * 0.5)
			self.particles.append(Particle(self.peak_position, velocity, color, life))


class BouncingBall:
	def __init__(self, resolution):
		self.position = resolution - 1.0
		self.velocity = -random.uniform(1.0, 5.0)
		self.restitution = random.uniform(0.4, 0.85)
		self.color = random.choice([
			Colors.RED, Colors.GREEN, Colors.BLUE,
			Colors.YELLOW, Colors.MAGENTA, Colors.CYAN,
			Colors.ORANGE, Colors.PINK
		])
		self.alive = True

	def update(self, dt, gravity):
		if not self.alive:
			return
		self.velocity -= gravity * dt
		self.position += self.velocity * dt
		if self.position <= 0.0:
			self.position = 0.0
			self.velocity = -self.velocity * self.restitution
			if abs(self.velocity) < 1.0:
				self.alive = False
				self.position = 0.0

	@property
	def brightness(self):
		speed = abs(self.velocity)
		return min(speed / 20.0, 1.0)


class DemoScene(Game):
	SEGMENT_DURATION = 10.0

	def __init__(self, system):
		super().__init__("DemoScene", system)
		self.stage = Stage.PLASMA
		self.stage_start = 0.0

		self.fireworks = []
		self.next_firework = 2.0

		self.balls = []
		self.next_ball_time = 1.0
		self.ball_gravity = 80.0

	def _render_plasma(self, t):
		for i in range(self.resolution):
			v = (math.sin(i * 0.05 + t) +
				 math.sin(i * 0.1 - t * 1.5) +
				 math.sin(i * 0.03 + t * 0.7))
			hue = (v + 3.0) / 6.0
			self.pixels[i] = hsv_to_rgb(hue, 1.0, 0.9)

	def _render_interference(self, t):
		for i in range(self.resolution):
			wave1 = math.sin(i * 0.07 + t)
			wave2 = math.sin(i * 0.13 - t * 1.3)
			w1 = (wave1 + 1.0) * 0.5
			w2 = (wave2 + 1.0) * 0.5
			combined = (w1 + w2) * 0.5
			hue = 0.6 + combined * 0.4
			if hue > 1.0:
				hue -= 1.0
			self.pixels[i] = hsv_to_rgb(hue, 0.8, 0.9)

	def _render_fireworks(self, t, dt):
		for i in range(self.resolution):
			self.pixels[i] = 0x000011

		if self.time >= self.next_firework and len(self.fireworks) < 6:
			self.fireworks.append(Firework(self.resolution))
			self.next_firework = self.time + 0.8 + random.random() * 2.2

		active = []
		for fw in self.fireworks:
			if fw.update(dt, self.resolution, self.audio):
				active.append(fw)
		self.fireworks = active

		for fw in self.fireworks:
			if not fw.bursted:
				frac = fw.rise_elapsed / fw.rise_time
				pos = int(frac * fw.peak_position)
				if 0 <= pos < self.resolution:
					self.pixels[pos] = Colors.WHITE
			else:
				for p in fw.particles:
					pos = int(p.position)
					if 0 <= pos < self.resolution:
						r = ((p.color >> 16) & 0xFF)
						g = ((p.color >> 8) & 0xFF)
						b = (p.color & 0xFF)
						a = p.alpha
						r = int(r * a)
						g = int(g * a)
						b = int(b * a)
						self.pixels[pos] = (r << 16) | (g << 8) | b

	def _render_bouncing_balls(self, dt):
		for i in range(self.resolution):
			self.pixels[i] = 0x001100

		if self.time >= self.next_ball_time and len(self.balls) < 12:
			self.balls.append(BouncingBall(self.resolution))
			self.next_ball_time = self.time + random.uniform(0.3, 1.5)

		for ball in self.balls:
			ball.update(dt, self.ball_gravity)

		self.balls = [b for b in self.balls if b.alive]

		for ball in self.balls:
			pos = int(ball.position)
			if 0 <= pos < self.resolution:
				b = ball.brightness
				r = ((ball.color >> 16) & 0xFF)
				g = ((ball.color >> 8) & 0xFF)
				bb = (ball.color & 0xFF)
				r = int(r * b)
				g = int(g * b)
				bb = int(bb * b)
				self.pixels[pos] = (r << 16) | (g << 8) | bb

	def loop(self):
		super().loop()
		now = self.time
		dt = self.system.clock.delta

		if now - self.stage_start >= self.SEGMENT_DURATION:
			self.stage = Stage((self.stage + 1) % len(Stage))
			self.stage_start = now
			self.fireworks = []
			self.next_firework = now + 2.0
			self.balls = []
			self.next_ball_time = now + 1.0

		t = now * 2.0

		if self.stage == Stage.PLASMA:
			self._render_plasma(t)
		elif self.stage == Stage.INTERFERENCE:
			self._render_interference(t)
		elif self.stage == Stage.FIREWORKS:
			self._render_fireworks(t, dt)
		else:
			self._render_bouncing_balls(dt)

	def handle_input(self, pad_id, event):
		pass