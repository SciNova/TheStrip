class Strip:
	def __init__(self, length):
		self.length = length
		self.pixels = [0] * length

	def clear(self):
		for i in range(self.length):
			self.pixels[i] = 0
