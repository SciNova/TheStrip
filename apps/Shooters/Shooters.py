# Not yet ported — a placeholder mirroring js/../Shooters/Shooters.js's
# top-level shape so the file exists alongside the other languages.
# See Shooters.js for the actual, current implementation.

from system import Game


class Player:
	def __init__(self, game):
		self.game = game
		self.location = game.resolution / 2.0


class Target:
	def __init__(self, game, location, color, size):
		self.game = game
		self.location = location
		self.color = color
		self.size = size


class Shooters(Game):
	def __init__(self, system):
		super().__init__('Shooters', system)
		self.player = Player(self)

	def loop(self):
		super().loop()

	def handle_input(self, pad_id, event):
		pass
