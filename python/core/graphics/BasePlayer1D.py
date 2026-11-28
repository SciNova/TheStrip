class BasePlayer1D(BasePlayer):
	def __init__(self, game):
		super().__init__(game)
		self.location = 0.0

	def distance(self, location):
		world = self.game.world
		d = self.location - location
		if world.wraps:
			half = world.size * self.game.resolution / 2.0
			d = ((d + half) % (2 * half) + (2 * half)) % (2 * half) - half
		return abs(d)
