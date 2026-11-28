class ProgressBar(Widget):
	def __init__(self, game, location, size, color, inverted=False):
		super().__init__(game, location, size, inverted)
		self.color = color
		self.value = 0.0

	def renderPixel(self, i):
		filled = min(round(self.value * self.size), self.size)
		return self.color if i < filled else 0x000000
