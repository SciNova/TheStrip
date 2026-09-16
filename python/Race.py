import math

from system import Game
from system import Colors
from system import Sound
from system import Command
from graphics import Shape
from graphics import Alignment
from graphics import EdgeMode
from system import balance_colors

class RaceStage:
	PLAYING = 0
	RESULT = 1

class Player(Shape):
	TRAIL = 1 / 8
	TICK = 1 / 12
	CHECKPOINT = 2

	def __init__(self, game, color):
		trail_len = round(game.resolution * Player.TRAIL)
		super().__init__(game, trail_len, Alignment.BACKWARD)

		self.color = color
		self.location = game.resolution / 2.0
		self.speed	= 0.0
		self.trail_speed = 0.0
		self.reverse = False
		self.travel = 0.0

		self.BOOST	 = 0.5 * game.resolution
		self.FRICTION = 3.75
		self.TRAIL_FRICTION = 2.5
		self.MAX_SPEED = 1.5 * game.resolution
		self.TRAIL_LENGTH = trail_len

	def tick(self, dt):
		old_location = self.location
		self.speed *= max(0.0, 1.0 - self.FRICTION * dt)
		self.location += self.speed * (-1 if self.reverse else 1) * dt
		if self.location < 0:
			self.location = -self.location
			self.reverse = not self.reverse
		elif self.location >= self.game.resolution:
			self.location = 2 * (self.game.resolution - 1) - self.location
			self.reverse = not self.reverse

		prev_travel = self.travel
		self.travel += abs(self.location - old_location)

		prev_tick = int(prev_travel // (self.game.resolution * Player.TICK))
		curr_tick = int(self.travel // (self.game.resolution * Player.TICK))
		if prev_tick != curr_tick:
			self.game.audio.play(Sound.TICK)

		prev_check = int(prev_travel // (self.game.resolution * Player.CHECKPOINT))
		curr_check = int(self.travel // (self.game.resolution * Player.CHECKPOINT))
		if prev_check != curr_check:
			self.game.audio.play(Sound.CHECKPOINT)

		self.alignment = Alignment.FORWARD if self.reverse else Alignment.BACKWARD

		self.trail_speed *= max(0.0, 1.0 - self.TRAIL_FRICTION * dt)

		frac = min(self.trail_speed / self.BOOST, 1.0)
		trail_pixels = 1 + int(frac * (self.TRAIL_LENGTH - 1))

		base_r = (self.color >> 16) & 0xFF
		base_g = (self.color >> 8) & 0xFF
		base_b = self.color		 & 0xFF

		for j in range(self.TRAIL_LENGTH):
			if j < trail_pixels:
				if trail_pixels == 1:
					intensity = 1.0
				else:
					intensity = 1.0 - (128.0 / 255.0) * (j / (trail_pixels - 1))
				r = int(base_r * intensity)
				g = int(base_g * intensity)
				b = int(base_b * intensity)
				self.pixels[j] = (r << 16) | (g << 8) | b
			else:
				self.pixels[j] = None

	def boost(self):
		self.speed += self.BOOST
		if self.speed > self.MAX_SPEED:
			self.speed = self.MAX_SPEED
		self.trail_speed = self.speed


class Race(Game):
	TOTAL_LAPS = 10.0

	def __init__(self, system):
		super().__init__("Race", system)
		self.player_a = Player(self, Colors.RED)
		self.player_b = Player(self, Colors.BLUE)
		self.stage = RaceStage.PLAYING

	def loop(self):
		super().loop()

		dt = self.system.clock.delta

		if self.stage == RaceStage.PLAYING:
			if self.delay_time > 0.0:
				return

			self.player_a.tick(dt)
			self.player_b.tick(dt)

			target_travel = Race.TOTAL_LAPS * 2 * self.resolution
			score_a = self.player_a.travel / target_travel
			score_b = self.player_b.travel / target_travel

			if score_a >= 1.0 or score_b >= 1.0:
				self.stage = RaceStage.RESULT
				self.audio.play(Sound.LEVEL_COMPLETE)
				self.delay(4.0)

			self.clear()
			self._draw_progress_bar(score_a, score_b)
			self.player_a.render(self.player_a.location, EdgeMode.MIRROR)
			self.player_b.render(self.player_b.location, EdgeMode.MIRROR)

		elif self.stage == RaceStage.RESULT:
			if self.delay_time <= 0.0:
				self.player_a = Player(self, Colors.GREEN)
				self.player_b = Player(self, Colors.BLUE)
				self.stage = RaceStage.PLAYING
			else:
				self.clear()
				self._draw_result_bars()

	def _draw_progress_bar(self, score_a, score_b):
		half = self.resolution // 2
		bar_color = 0x3C3C00

		length_a = min(int(round(score_a * half)), half)
		for i in range(length_a):
			self.pixels[i] = bar_color

		length_b = min(int(round(score_b * half)), half)
		for i in range(self.resolution - length_b, self.resolution):
			self.pixels[i] = bar_color

		center_left = self.resolution // 2 - 1
		center_right = self.resolution // 2
		if 0 <= center_left < self.resolution:
			self.pixels[center_left] = bar_color
		if 0 <= center_right < self.resolution:
			self.pixels[center_right] = bar_color

	def _draw_result_bars(self):
		half = self.resolution // 2
		target_travel = Race.TOTAL_LAPS * 2 * self.resolution
		a_won = self.player_a.travel >= target_travel
		b_won = self.player_b.travel >= target_travel

		col_a = balance_colors(self.player_a.color)
		col_b = balance_colors(self.player_b.color)

		if a_won and not b_won:
			for i in range(half):
				self.pixels[i] = col_a
		elif b_won and not a_won:
			for i in range(half, self.resolution):
				self.pixels[i] = col_b
		else:
			for i in range(half):
				self.pixels[i] = col_a
			for i in range(half, self.resolution):
				self.pixels[i] = col_b

	def handle_input(self, pad_id, event):
		if self.stage != RaceStage.PLAYING:
			return
		if pad_id == 0 and event.command == Command.A:
			self.player_a.boost()
		elif pad_id == 1 and event.command == Command.C:
			self.player_b.boost()

