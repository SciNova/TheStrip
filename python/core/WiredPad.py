class WiredPad(Pad):
	def __init__(self, system, id):
		super().__init__(system, id)
		self.buttons = [
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
			Button(system),
		]
