class Widget:
	def __init__(self, game, location, size, inverted=False, fade=0.5):
		self.game = game
		self.location = location
		self.size = size
		self.inverted = inverted
		self.fade = fade
		self.state = WidgetState.OFF
		self.timestamp = 0.0
		self.startTime = 0.0
		self.alpha = 0.0
		self.blend = False

	def start(self):
		self.startTime = self.game.time

	def show(self):
		self.state = WidgetState.ON
		self.alpha = 1.0
		self.start()

	def hide(self):
		self.state = WidgetState.OFF
		self.alpha = 0.0

	def fadeIn(self):
		self.state = WidgetState.FADE_IN
		self.timestamp = self.game.time

	def fadeOut(self):
		self.state = WidgetState.FADE_OUT
		self.timestamp = self.game.time

	def update(self):
		if self.state == WidgetState.OFF or self.state == WidgetState.ON:
			return

		elapsed = self.game.time - self.timestamp
		t = min(elapsed / self.fade, 1.0)

		if self.state == WidgetState.FADE_IN:
			self.alpha = t
			if t >= 1.0:
				self.state = WidgetState.ON
				self.start()
		else:
			self.alpha = 1.0 - t
			if t >= 1.0:
				self.state = WidgetState.OFF

		self.render()

	def render(self):
		step = -1 if self.inverted else 1

		for i in range(self.size):
			pos = self.location + i * step
			if pos < 0 or pos >= self.game.resolution:
				continue

			value = self.renderPixel(i)
			if self.blend:
				self.game.blend(pos, value, self.alpha)
			else:
				self.game.pixels[pos] = value

	def renderPixel(self, i):
		return 0x000000
