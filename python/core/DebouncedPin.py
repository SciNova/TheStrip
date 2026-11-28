class DebouncedPin:
	DEBOUNCE_DURATION = 0.0

	def __init__(self):
		self.state = False
		self.timestamp = 0.0

	def process(self, value, now):
		if value != self.state:
			self.timestamp = now
		if (now - self.timestamp) >= DebouncedPin.DEBOUNCE_DURATION and value != self.state:
			self.state = value
		return self.state
