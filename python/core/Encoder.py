class EncoderState:
	IDLE = 'IDLE'
	DEBOUNCING = 'DEBOUNCING'


class EncoderEvent:
	LEFT = 'LEFT'
	RIGHT = 'RIGHT'


class Encoder:
	DEBOUNCE_DURATION = 0.0

	def __init__(self):
		self.state = EncoderState.IDLE
		self.rawQuadState = 0
		self.previousQuadState = 0
		self.clkTimestamp = 0.0
		self.inputChangeTimestamp = 0.0

	def update(self, clk, direction, now):
		currentRaw = (clk << 1) | direction
		if currentRaw != self.rawQuadState:
			self.rawQuadState = currentRaw
			self.inputChangeTimestamp = now

		debounced = self.previousQuadState
		if (now - self.inputChangeTimestamp) >= Encoder.DEBOUNCE_DURATION:
			debounced = self.rawQuadState

		event = None
		if debounced != self.previousQuadState:
			transition = (self.previousQuadState << 2) | debounced
			if self.state == EncoderState.IDLE:
				if transition in (0x01, 0x07, 0x0E, 0x08):
					event = EncoderEvent.RIGHT
				elif transition in (0x02, 0x0B, 0x0D, 0x04):
					event = EncoderEvent.LEFT
				if event is not None:
					self.clkTimestamp = now
					self.state = EncoderState.DEBOUNCING

		self.previousQuadState = debounced
		if self.state == EncoderState.DEBOUNCING and (now - self.clkTimestamp) >= Encoder.DEBOUNCE_DURATION:
			self.state = EncoderState.IDLE

		return event
