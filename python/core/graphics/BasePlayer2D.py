import math


class BasePlayer2D(BasePlayer):
	def __init__(self, game):
		super().__init__(game)
		self.z = 0.0
		self.x = 0.0
		self.rotation = 0.0

	def distance(self, z, x):
		world = self.game.world
		dx = self.x - x
		dz = self.z - z
		if world.wrapsZ:
			halfZ = world.width * self.game.resolution / 2.0
			dz = ((dz + halfZ) % (2 * halfZ) + (2 * halfZ)) % (2 * halfZ) - halfZ
		if world.wrapsX:
			halfX = world.depth * self.game.resolution / 2.0
			dx = ((dx + halfX) % (2 * halfX) + (2 * halfX)) % (2 * halfX) - halfX
		return math.sqrt(dx * dx + dz * dz)

	def direction(self, z, x):
		dx = x - self.x
		dz = z - self.z
		angle = math.atan2(dz, dx)
		return ((angle / (2 * math.pi) + 1) % 1 + 1) % 1
