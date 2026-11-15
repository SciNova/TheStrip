import math

from system import Game
from system import Colors
from system import Sound
from graphics import Square
from graphics import EdgeMode

DIGIT_PATTERNS = [
	# 0
	[
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN,
		Colors.GREEN
	],
	# 1
	[
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		0,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN, Colors.GREEN,
		Colors.GREEN
	],
	# 2
	[
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN, Colors.GREEN, 0, Colors.GREEN, Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN, Colors.GREEN, 0, Colors.GREEN, Colors.GREEN, Colors.GREEN,
		Colors.GREEN
	],
	# 3
	[
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN, Colors.GREEN, 0, Colors.GREEN, Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		0,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN, Colors.GREEN, 0, Colors.GREEN, Colors.GREEN, Colors.GREEN,
		Colors.GREEN
	],
	# 4
	[
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, Colors.GREEN,
		Colors.GREEN
	],
	# 5
	[
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		0,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, Colors.GREEN,
		Colors.GREEN
	],
	# 6
	[
		Colors.GREEN,
		0, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN,
		Colors.GREEN
	],
	# 7
	[
		Colors.GREEN,
		0, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		0,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN,
		Colors.GREEN
	],
	# 8
	[
		Colors.GREEN,
		0, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, 0,
		Colors.GREEN, Colors.GREEN,
		Colors.GREEN,
		Colors.GREEN, Colors.GREEN,
		0, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, 0,
		Colors.GREEN
	],
	# 9
	[
		Colors.GREEN,
		0, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, 0,
		Colors.GREEN, Colors.GREEN,
		0,
		Colors.GREEN, Colors.GREEN,
		0, Colors.GREEN, 0, Colors.GREEN, 0, Colors.GREEN, 0,
		Colors.GREEN
	]
]

class StopWatch(Game):
	def __init__(self, system):
		super().__init__("StopWatch", system)
		self.cubes = [Square(self, DIGIT_PATTERNS) for _ in range(3)]
		self.last_second = -1
		self.show_colon = True
		self.update_display()

	def set_digit(self, cube_idx, digit):
		self.cubes[cube_idx].rotation = digit / 10.0
		self.cubes[cube_idx].update()

	def update_display(self):
		total_seconds = int(self.time)
		minutes = (total_seconds // 60) % 10
		seconds = total_seconds % 60
		tens = seconds // 10
		ones = seconds % 10
		self.set_digit(0, minutes)
		self.set_digit(1, tens)
		self.set_digit(2, ones)

	def loop(self):
		super().loop()

		current_second = int(self.time)
		if current_second != self.last_second:
			self.last_second = current_second
			self.show_colon = not self.show_colon
			self.update_display()
			self.audio.play(Sound.TICK)

		for i in range(self.resolution):
			self.pixels[i] = 0

		cube_w = len(self.cubes[0].pixels)
		spacing = 1
		colon_gap = 3
		group_w = (3 * cube_w) + spacing + colon_gap
		left_edge = (self.resolution - group_w) // 2

		pos = left_edge + cube_w // 2
		self.cubes[0].render(pos, EdgeMode.CLIP)

		pos += cube_w + colon_gap
		self.cubes[1].render(pos, EdgeMode.CLIP)

		pos += cube_w + spacing
		self.cubes[2].render(pos, EdgeMode.CLIP)

		if self.show_colon:
			colon_x = left_edge + cube_w + colon_gap // 2
			if 0 <= colon_x < self.resolution:
				self.pixels[colon_x] = Colors.WHITE
			if colon_x + 1 < self.resolution:
				self.pixels[colon_x + 1] = Colors.WHITE

	def handle_input(self, pad_id, event):
		pass
