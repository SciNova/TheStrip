import random

from system import Game
from system import Colors
from system import Button
from system import Command
from system import is_game_button_press

class Bird:
	def __init__(self, position):
		self.position = position
		self.speed = 0.0

class Terrain:
	def __init__(self):
		self.height = 0.0
		self.baseHeight = 0.0
		self.fluctuation = 0.0
		self.speed = 0.0

class FlappyBird(Game):
	def __init__(self, system):
		super().__init__("FlappyBird", system)

		mid = self.resolution / 2.0
		self.bird = Bird(mid)

		self.top_terrain = Terrain()
		self.bottom_terrain = Terrain()

		self.gap = 0.5
		self.gap_position = 0.5
		self.fluctuation = 0.1

	@staticmethod
	def _bird_boost(bird):
		bird.speed = 20.0

	@staticmethod
	def _bird_update(bird, dt, max_pos):
		bird.speed -= 20.0 * dt
		bird.position += bird.speed * dt
		if bird.position < 0.0:
			bird.position = 0.0
		if bird.position > max_pos:
			bird.position = max_pos

	@staticmethod
	def _terrain_update(terrain, dt, resolution):
		max_change = terrain.speed * resolution * dt
		step = (random.random() * 2.0 - 1.0) * max_change
		terrain.height += step

		min_h = terrain.baseHeight - terrain.fluctuation * resolution
		max_h = terrain.baseHeight + terrain.fluctuation * resolution
		if terrain.height < min_h:
			terrain.height = min_h
		if terrain.height > max_h:
			terrain.height = max_h

	def loop(self):
		super().loop()
		dt = self.system.clock.delta
		t = self.time / 60.0
		if t > 1.0:
			t = 1.0

		self.gap = 0.5 - (0.5 - 0.2) * t
		self.fluctuation = 0.0 + (0.3 - 0.0) * t

		self.top_terrain.fluctuation = 0.0 + (0.15 - 0.0) * t
		self.bottom_terrain.fluctuation = self.top_terrain.fluctuation

		self.top_terrain.speed = 0.1 + (1.0 - 0.1) * t
		self.bottom_terrain.speed = self.top_terrain.speed

		gap_center = self.gap_position * self.resolution
		gap_size = self.gap * self.resolution

		self.top_terrain.baseHeight = self.resolution - (gap_center + gap_size / 2.0)
		self.bottom_terrain.baseHeight = gap_center - gap_size / 2.0

		self._terrain_update(self.top_terrain, dt, self.resolution)
		self._terrain_update(self.bottom_terrain, dt, self.resolution)
		self._bird_update(self.bird, dt, self.resolution - 1.0)

		for i in range(self.resolution):
			self.pixels[i] = 0x00007F

		top_height = int(self.top_terrain.height + 0.5)
		for i in range(top_height):
			self.pixels[self.resolution - 1 - i] = Colors.RED

		bottom_height = int(self.bottom_terrain.height + 0.5)
		for i in range(bottom_height):
			self.pixels[i] = Colors.RED

		bird_idx = int(self.bird.position + 0.5)
		if 0 <= bird_idx < self.resolution:
			self.pixels[bird_idx] = Colors.YELLOW

	def handle_input(self, pad_id, event):
		if is_game_button_press(event.command):
			self._bird_boost(self.bird)