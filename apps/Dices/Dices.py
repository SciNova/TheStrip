import random
from enum import IntEnum

from system import Game
from system import Colors
from system import Sound
from system import Command
from system import is_game_button_press
from graphics import Square
from graphics import EdgeMode


class Stage(IntEnum):
	IDLE = 0
	ROLLING = 1

FACES = [
	[Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE,
	 Colors.WHITE, Colors.WHITE, 0, Colors.WHITE, Colors.WHITE,
	 Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE],

	[Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE,
	 0, Colors.WHITE, Colors.WHITE, Colors.WHITE, 0,
	 Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE],

	[Colors.WHITE, Colors.WHITE, Colors.WHITE, 0, Colors.WHITE,
	 Colors.WHITE, Colors.WHITE, 0, Colors.WHITE, Colors.WHITE,
	 Colors.WHITE, 0, Colors.WHITE, Colors.WHITE, Colors.WHITE],

	[Colors.WHITE, Colors.WHITE, 0, Colors.WHITE, 0,
	 Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE, Colors.WHITE,
	 0, Colors.WHITE, 0, Colors.WHITE, Colors.WHITE],

	[Colors.WHITE, Colors.WHITE, 0, Colors.WHITE, 0,
	 Colors.WHITE, Colors.WHITE, 0, Colors.WHITE, Colors.WHITE,
	 0, Colors.WHITE, 0, Colors.WHITE, Colors.WHITE],

	[Colors.WHITE, 0, Colors.WHITE, 0, Colors.WHITE,
	 0, Colors.WHITE, Colors.WHITE, Colors.WHITE, 0,
	 Colors.WHITE, 0, Colors.WHITE, 0, Colors.WHITE]
]

class Dice(Square):
	def __init__(self, game):
		super().__init__(game, FACES)

class Dices(Game):
	MIN_SPEED = 4.0
	MAX_SPEED = 10.0
	MIN_DURATION = 0.5
	MAX_DURATION = 2.0
	DECELERATION = 6.0

	def __init__(self, system):
		super().__init__("Dices", system)
		self.dice1 = Dice(self)
		self.dice2 = Dice(self)
		self.stage = Stage.IDLE
		self.speed1 = 0.0
		self.speed2 = 0.0
		self.remaining1 = 0.0
		self.remaining2 = 0.0
		self.last_face1 = int(self.dice1.rotation * 6)
		self.last_face2 = int(self.dice2.rotation * 6)

	def loop(self):
		super().loop()
		dt = self.system.clock.delta

		if self.stage == Stage.ROLLING:
			if self.remaining1 > 0:
				self.dice1.rotation = (self.dice1.rotation + self.speed1 * dt) % 1.0
				self.remaining1 -= dt
			elif self.speed1 > 0:
				self.speed1 = max(self.speed1 - self.DECELERATION * dt, 0)
				if self.speed1 == 0:
					self.dice1.rotation = round(self.dice1.rotation * 6) / 6.0
					self.audio.play(Sound.CHECKPOINT)
				else:
					self.dice1.rotation = (self.dice1.rotation + self.speed1 * dt) % 1.0

			face1 = int(self.dice1.rotation * 6) % 6
			if face1 != self.last_face1:
				self.last_face1 = face1
				self.audio.play(Sound.TICK)

			if self.remaining2 > 0:
				self.dice2.rotation = (self.dice2.rotation + self.speed2 * dt) % 1.0
				self.remaining2 -= dt
			elif self.speed2 > 0:
				self.speed2 = max(self.speed2 - self.DECELERATION * dt, 0)
				if self.speed2 == 0:
					self.dice2.rotation = round(self.dice2.rotation * 6) / 6.0
					self.audio.play(Sound.CHECKPOINT)
				else:
					self.dice2.rotation = (self.dice2.rotation + self.speed2 * dt) % 1.0

			face2 = int(self.dice2.rotation * 6) % 6
			if face2 != self.last_face2:
				self.last_face2 = face2
				self.audio.play(Sound.TICK)

			if self.speed1 == 0 and self.remaining1 <= 0 and self.speed2 == 0 and self.remaining2 <= 0:
				self.stage = Stage.IDLE

		for i in range(self.resolution):
			self.pixels[i] = Colors.DARK_GREEN

		self.dice1.update()
		self.dice2.update()
		self.dice1.render(int(self.resolution / 3), EdgeMode.MIRROR)
		self.dice2.render(int(2 * self.resolution / 3), EdgeMode.MIRROR)

	def handle_input(self, pad_id, event):
		if self.stage == Stage.IDLE and is_game_button_press(event.command):
			self.speed1 = self.MIN_SPEED + random.random() * (self.MAX_SPEED - self.MIN_SPEED)
			self.speed2 = self.MIN_SPEED + random.random() * (self.MAX_SPEED - self.MIN_SPEED)
			self.remaining1 = self.MIN_DURATION + random.random() * (self.MAX_DURATION - self.MIN_DURATION)
			self.remaining2 = self.MIN_DURATION + random.random() * (self.MAX_DURATION - self.MIN_DURATION)
			self.stage = Stage.ROLLING
