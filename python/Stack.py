import math
import random
from enum import IntEnum

from system import Game
from system import Colors
from system import Sound
from system import Command
from system import InputEvent
from graphics import Shape
from graphics import Alignment
from graphics import EdgeMode


class Dot(Shape):
	EXPLOSION_DIAMETER = 21
	EXPLOSION_DURATION = 0.5

	def __init__(self, game, color, gap):
		super().__init__(game, Dot.EXPLOSION_DIAMETER, Alignment.CENTER)
		self.color = color
		self.gap = gap
		self.alpha = 1.0
		self.explosion_time = 0.0
		self.cos_angles = [math.cos(deg * 18.0 * math.pi / 180.0) for deg in range(10)]

	def explode(self):
		self.explosion_time = self.game.level_time

	def update(self):
		for i in range(len(self.pixels)):
			self.pixels[i] = None

		if self.explosion_time == 0.0:
			center = (len(self.pixels) - 1) // 2
			self.pixels[center] = self.color
		else:
			elapsed = self.game.level_time - self.explosion_time
			t = elapsed / Dot.EXPLOSION_DURATION
			if t >= 1.0:
				self.alpha = 0.0
				return
			self.alpha = 1.0 - t
			max_radius = (Dot.EXPLOSION_DIAMETER - 1) / 2
			radius = max_radius * (1.0 - (1.0 - t) ** 2)
			center = (len(self.pixels) - 1) // 2
			r = (self.color >> 16) & 0xFF
			g = (self.color >> 8) & 0xFF
			b = self.color & 0xFF
			for cos_val in self.cos_angles:
				offset = int(radius * cos_val + 0.5)
				idx = center + offset
				if 0 <= idx < len(self.pixels):
					self.pixels[idx] = (
						(int(r * self.alpha) << 16) |
						(int(g * self.alpha) << 8) |
						int(b * self.alpha)
					)


class Bullet(Shape):
	BULLET_SPEED = 60.0

	def __init__(self, game, color):
		super().__init__(game, 20, Alignment.BACKWARD)
		self.color = color
		self.timestamp = game.level_time
		self.position = 0.0

	def update(self):
		for i in range(len(self.pixels)):
			self.pixels[i] = None

		self.position = (self.game.level_time - self.timestamp) * Bullet.BULLET_SPEED
		r = (self.color >> 16) & 0xFF
		g = (self.color >> 8) & 0xFF
		b = self.color & 0xFF
		for i in range(20):
			t = (i + 1) / 21.0
			self.pixels[i] = (int(r * t) << 16) | (int(g * t) << 8) | int(b * t)


class Snake:
	def __init__(self, game):
		self.game = game
		self.START_DOTS = max(1, game.resolution // 20)
		self.END_DOTS = max(1, game.resolution // 4)
		self.START_GAP = max(1, game.resolution // 40)
		self.END_GAP = self.START_GAP
		self.LEVELS = self.END_DOTS - self.START_DOTS
		self.dots = []
		self.position = 0

	def build(self, level):
		num_dots = self.START_DOTS + level
		gap_float = self.START_GAP + (self.END_GAP - self.START_GAP) * (level / self.LEVELS)
		low_gap = int(gap_float)
		high_gap = low_gap + 1
		prev_color = None

		self.dots = []
		for _ in range(num_dots):
			color = None
			while color is None or color == prev_color:
				r = random.randint(0, 2)
				if r == 0:
					color = Colors.RED
				elif r == 1:
					color = Colors.GREEN
				else:
					color = Colors.BLUE
			gap = high_gap if random.random() < (gap_float - low_gap) else low_gap
			self.dots.append(Dot(self.game, color, gap))
			prev_color = color

		self.position = self.game.resolution

	def length(self):
		return sum(1 + dot.gap for dot in self.dots)

	def is_at_start(self):
		return self.position == self.game.resolution - self.length()

	def is_at_end(self):
		return self.position <= 0


class Stack(Game):
	START_SPEED = 8.0
	END_SPEED = 12.0
	BULLET_SPEED = 60.0

	def __init__(self, system):
		super().__init__("Stack", system)
		self.snake = Snake(self)
		self.bullets = []
		self.snake_position_remainder = 0.0
		self.play_level()

	def build_stage(self):
		self.snake.build(self.level)
		self.snake_position_remainder = 0.0
		self.bullets = []

	def render(self):
		self.clear()
		current_pixel = self.snake.position
		for dot in self.snake.dots:
			dot.render(current_pixel, EdgeMode.CLIP, 1.0)
			if dot.explosion_time == 0.0:
				current_pixel += 1 + dot.gap

		for bullet in self.bullets:
			bullet.render(bullet.position, EdgeMode.CLIP, 1.0)

	def loop(self):
		super().loop()

		if self.delay_time > 0.0:
			return

		dt = self.system.clock.delta

		current_speed = Stack.START_SPEED + (Stack.END_SPEED - Stack.START_SPEED) * (self.level / self.snake.LEVELS)
		pixels_to_move = current_speed * dt
		self.snake_position_remainder += pixels_to_move
		whole_pixels = int(self.snake_position_remainder)

		if whole_pixels > 0:
			self.snake.position -= whole_pixels
			self.snake_position_remainder -= whole_pixels
			current_pos = self.snake.position
			for dot in self.snake.dots:
				current_pos += 1 + dot.gap
				if current_pos == self.resolution - 1:
					self.audio.play(Sound.GENERATE_ITEM)
					break

		if self.snake.is_at_end():
			self.audio.play(Sound.LEVEL_FAIL)
			self.pause()
			self.bullets = []
			self.delay(4.0)
			return

		for bullet in self.bullets:
			bullet.update()
		for dot in self.snake.dots:
			dot.update()

		self.snake.dots = [dot for dot in self.snake.dots if dot.alpha != 0.0]
		self.bullets = [bullet for bullet in self.bullets if bullet.position < self.resolution]

		head_dot = None
		for dot in self.snake.dots:
			if dot.explosion_time == 0.0:
				head_dot = dot
				break

		if self.bullets and head_dot is not None:
			bullet = self.bullets[0]
			if bullet.position >= self.snake.position:
				if bullet.color == head_dot.color:
					head_dot.explode()
					self.snake.position += 1 + head_dot.gap
					self.bullets.pop(0)
					self.audio.play(Sound.HIT)
				else:
					self.bullets.pop(0)
					new_dot = Dot(self, bullet.color, 0)
					self.snake.dots.insert(0, new_dot)
					self.snake.position -= 1
					self.audio.play(Sound.MISS)

		if len(self.snake.dots) == 0:
			if self.level >= self.snake.LEVELS:
				self.audio.play(Sound.GAME_COMPLETE)
				self.set_level(0)
				self.delay(30.0)
			else:
				self.audio.play(Sound.LEVEL_COMPLETE)
				self.next_level()
				self.delay(4.0)
			return

		self.render()

	def handle_input(self, pad_id, event):
		if event.command == Command.A:
			self.bullets.append(Bullet(self, Colors.RED))
			self.audio.play(Sound.SHOOT)
		elif event.command == Command.B:
			self.bullets.append(Bullet(self, Colors.GREEN))
			self.audio.play(Sound.SHOOT)
		elif event.command == Command.C:
			self.bullets.append(Bullet(self, Colors.BLUE))
			self.audio.play(Sound.SHOOT)
