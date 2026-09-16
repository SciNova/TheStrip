import random

from system import Game
from system import Colors
from system import Command
from system import is_game_button_press

class Player:
	LOW_SIZE = 3
	HIGH_SIZE = 15
	GRAVITY = 4.0
	JUMP_SPEED = 2.828

	def __init__(self, game):
		self.game = game
		self.height = 0.0
		self.speed = 0.0
		self.is_jumping = False

	def jump(self):
		if not self.is_jumping:
			self.is_jumping = True
			self.speed = Player.JUMP_SPEED

	def update(self):
		dt = self.game.system.clock.delta
		if self.is_jumping:
			self.speed -= Player.GRAVITY * dt
			self.height += self.speed * dt
			if self.height <= 0.0:
				self.height = 0.0
				self.speed = 0.0
				self.is_jumping = False

	def render(self):
		size = Player.LOW_SIZE + int(self.height * (Player.HIGH_SIZE - Player.LOW_SIZE))
		if size % 2 == 0:
			size += 1
		low_r, low_g, low_b = 0x00, 0x99, 0x00
		high_r, high_g, high_b = 0x00, 0xFF, 0x00
		r = int(low_r + (high_r - low_r) * self.height)
		g = int(low_g + (high_g - low_g) * self.height)
		b = int(low_b + (high_b - low_b) * self.height)
		color = (r << 16) | (g << 8) | b
		return [color] * size


class Obstacle:
	LOW_SIZE = 1
	HIGH_SIZE = 15

	def __init__(self, height):
		self.height = height

	def render(self):
		size = Obstacle.LOW_SIZE + int(self.height * (Obstacle.HIGH_SIZE - Obstacle.LOW_SIZE))
		if size % 2 == 0:
			size += 1
		low_r, low_g, low_b = 0x99, 0x99, 0x99
		high_r, high_g, high_b = 0xCC, 0xCC, 0xCC
		r = int(low_r + (high_r - low_r) * self.height)
		g = int(low_g + (high_g - low_g) * self.height)
		b = int(low_b + (high_b - low_b) * self.height)
		color = (r << 16) | (g << 8) | b
		return [color] * size


class Dino(Game):
	MIN_GAP   = 50
	MAX_GAP   = 70
	MIN_HEIGHT = 0.1
	MAX_HEIGHT = 0.5
	SPEED     = 30.0

	def __init__(self, system):
		super().__init__("Dino", system)
		self.player = Player(self)
		self.obstacles = [None] * self.resolution
		self.gap = 0
		self.position_remainder = 0.0

	def loop(self):
		super().loop()

		self.player.update()

		dt = self.system.clock.delta
		self.position_remainder += Dino.SPEED * dt
		steps = int(self.position_remainder)
		self.position_remainder -= steps

		for _ in range(steps):
			self.obstacles.pop(0)

			self.gap -= 1
			if self.gap <= 0:
				h = Dino.MIN_HEIGHT + random.random() * (Dino.MAX_HEIGHT - Dino.MIN_HEIGHT)
				self.obstacles.append(Obstacle(h))
				self.gap = Dino.MIN_GAP + random.randint(0, Dino.MAX_GAP - Dino.MIN_GAP)
			else:
				self.obstacles.append(None)

		self.clear()
		for i, obs in enumerate(self.obstacles):
			if obs is None:
				continue
			obs_pixels = obs.render()
			offset = len(obs_pixels) // 2
			for j, color in enumerate(obs_pixels):
				strip_pos = i - offset + j
				if 0 <= strip_pos < self.resolution:
					self.pixels[strip_pos] = color

			center = self.resolution // 2
			shadow_length = int(abs(i - center) * len(obs_pixels) / center)
			if shadow_length > 0:
				shadow_color = 0x333333
				if i < center:
					start = i + offset + 1
					for k in range(shadow_length):
						pos = start + k
						if 0 <= pos < self.resolution:
							self.pixels[pos] = shadow_color
				else:
					start = i - offset - shadow_length
					for k in range(shadow_length):
						pos = start + k
						if 0 <= pos < self.resolution:
							self.pixels[pos] = shadow_color

		player_pixels = self.player.render()
		offset = len(player_pixels) // 2
		center_pos = int(self.resolution * 0.3)
		for j, color in enumerate(player_pixels):
			strip_pos = center_pos - offset + j
			if 0 <= strip_pos < self.resolution:
				self.pixels[strip_pos] = color

	def handle_input(self, pad_id, event):
		if is_game_button_press(event.command):
			self.player.jump()