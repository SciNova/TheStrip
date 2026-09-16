import math
import random
from enum import IntEnum

from system import Game
from system import Colors
from system import Sound
from system import Command
from system import is_game_button_press
from graphics import Shape
from graphics import Alignment
from graphics import EdgeMode
from system import balance_colors

class Fruit(IntEnum):
	APPLE = 0
	BANANA = 1
	GRAPE = 2
	ORANGE = 3
	CHERRY = 4
	LEMON = 5
	WATERMELON = 6
	BLACKBERRY = 7
	STRAWBERRY = 8

FRUIT_SIZE = [0.3, 0.7, 0.6, 0.6, 0.4, 0.5, 0.8, 0.2, 0.45]

FRUIT_COLOR = {
	Fruit.APPLE: Colors.GREEN,
	Fruit.BANANA: Colors.BANANA,
	Fruit.GRAPE: Colors.PURPLE,
	Fruit.ORANGE: Colors.ORANGE,
	Fruit.CHERRY: Colors.RED,
	Fruit.LEMON: Colors.LEMON,
	Fruit.WATERMELON: Colors.WATERMELON,
	Fruit.BLACKBERRY: Colors.BLACKBERRY,
	Fruit.STRAWBERRY: Colors.STRAWBERRY,
}

class Wheel(Shape):
	NUM_SYMBOLS = 8

	def __init__(self, game, size, symbols):
		super().__init__(game, size, Alignment.CENTER)
		self.symbols = symbols
		self.speed = 0.0
		self.spin_end_time = 0.0
		self.rotation = 0.0
		self._prev_rotation = 0.0

	def tick(self, dt):
		self._prev_rotation = self.rotation

		if self.speed > 0:
			if self.game.time >= self.spin_end_time:
				self.speed -= Slots.DECELERATION * dt
				if self.speed <= 0:
					self.speed = 0
					self.rotation = round(self.rotation)

			self.rotation += self.speed * dt
			while self.rotation >= self.NUM_SYMBOLS:
				self.rotation -= self.NUM_SYMBOLS
			while self.rotation < 0:
				self.rotation += self.NUM_SYMBOLS

		if self.speed > 0:
			if int(self.rotation) != int(self._prev_rotation):
				self.game.audio.play(Sound.TICK)

		S = len(self.pixels)
		slot_angle = 2 * math.pi / self.NUM_SYMBOLS
		wheel_angle = self.rotation * slot_angle + slot_angle / 2

		for j in range(S):
			t = j / (S - 1)
			theta = (t - 0.5) * math.pi
			absolute_angle = (theta + wheel_angle) % (2 * math.pi)
			if absolute_angle < 0:
				absolute_angle += 2 * math.pi

			slot_index = int(absolute_angle / slot_angle) % self.NUM_SYMBOLS
			local_angle = absolute_angle - slot_index * slot_angle
			fruit = self.symbols[slot_index]

			fruit_angular_span = FRUIT_SIZE[fruit] * slot_angle
			fruit_start = (slot_angle - fruit_angular_span) / 2
			fruit_end = (slot_angle + fruit_angular_span) / 2

			if fruit_start <= local_angle <= fruit_end:
				pixel_color = FRUIT_COLOR[fruit]
			else:
				pixel_color = Colors.SILVER

			brightness = 1 - ((t - 0.5) * 2) ** 2
			r = int(((pixel_color >> 16) & 0xFF) * brightness)
			g = int(((pixel_color >> 8) & 0xFF) * brightness)
			b = int((pixel_color & 0xFF) * brightness)
			self.pixels[j] = (r << 16) | (g << 8) | b


class Slots(Game):
	NUM_WHEELS = 3
	NUM_SYMBOLS = 8
	DECELERATION = 15.0
	MIN_SPEED = 10
	MAX_SPEED = 40
	MIN_SPIN_DURATION = 2.0
	MAX_SPIN_DURATION = 5.0

	WHEELS = [
		[Fruit.CHERRY, Fruit.LEMON, Fruit.ORANGE, Fruit.BANANA, Fruit.CHERRY, Fruit.LEMON, Fruit.WATERMELON, Fruit.ORANGE],
		[Fruit.BANANA, Fruit.CHERRY, Fruit.LEMON, Fruit.ORANGE, Fruit.CHERRY, Fruit.WATERMELON, Fruit.LEMON, Fruit.ORANGE],
		[Fruit.LEMON, Fruit.ORANGE, Fruit.CHERRY, Fruit.WATERMELON, Fruit.LEMON, Fruit.ORANGE, Fruit.BANANA, Fruit.CHERRY]
	]

	STAGE_IDLE = 0
	STAGE_SPINNING = 1
	STAGE_RESULT = 2

	def __init__(self, system):
		super().__init__("Slots", system)

		self.segment_pixels = self.resolution // self.NUM_WHEELS
		if self.segment_pixels % 2 == 0:
			self.segment_pixels -= 1
		self.offset = (self.resolution - self.segment_pixels * self.NUM_WHEELS) // 2

		self.wheels = []
		for i in range(self.NUM_WHEELS):
			wheel = Wheel(self, self.segment_pixels, self.WHEELS[i])
			wheel.rotation = random.randint(0, self.NUM_SYMBOLS - 1)
			self.wheels.append(wheel)

		self.stage = self.STAGE_IDLE

	def spin(self):
		for wheel in self.wheels:
			wheel.speed = self.MIN_SPEED + random.random() * (self.MAX_SPEED - self.MIN_SPEED)
			wheel.spin_end_time = self.time + self.MIN_SPIN_DURATION + random.random() * (self.MAX_SPIN_DURATION - self.MIN_SPIN_DURATION)
		self.stage = self.STAGE_SPINNING

	def loop(self):
		super().loop()
		if self.delay_time > 0.0:
			pass

		dt = self.system.clock.delta

		for wheel in self.wheels:
			wheel.tick(dt)

		if self.stage == self.STAGE_SPINNING:
			all_stopped = all(w.speed == 0 for w in self.wheels)
			if all_stopped:
				self.stage = self.STAGE_RESULT
				self._evaluate()

		self._render()

	def _evaluate(self):
		centre_fruits = []
		for wheel in self.wheels:
			idx = round(wheel.rotation) % self.NUM_SYMBOLS
			centre_fruits.append(wheel.symbols[idx])

		if centre_fruits[0] == centre_fruits[1] == centre_fruits[2]:
			self.audio.play(Sound.LEVEL_COMPLETE)
		else:
			self.audio.play(Sound.LEVEL_FAIL)

		self.delay(4.0)
		self.stage = self.STAGE_IDLE

	def _render(self):
		self.clear()
		for i, wheel in enumerate(self.wheels):
			segment_start = self.offset + i * self.segment_pixels
			centre = segment_start + (self.segment_pixels - 1) / 2.0
			wheel.render(centre, EdgeMode.CLIP)

#			pixel_centre = int(round(centre))
#			if 0 <= pixel_centre < self.resolution:
#				self.pixels[pixel_centre] = balance_colors(Colors.WHITE)


	def handle_input(self, pad_id, event):
		if self.stage == self.STAGE_IDLE and is_game_button_press(event.command):
			self.spin()