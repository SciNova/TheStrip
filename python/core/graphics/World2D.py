class World2D(BaseWorld):
	def __init__(self, width, depth, wrapsX, wrapsZ):
		super().__init__()
		self.width = width
		self.depth = depth
		self.wrapsX = wrapsX
		self.wrapsZ = wrapsZ
