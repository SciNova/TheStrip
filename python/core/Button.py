class ButtonState:
	IDLE = 'IDLE'
	PRESS = 'PRESS'
	HOLD = 'HOLD'


class ButtonEvent:
	PRESS = 'PRESS'
	RELEASE = 'RELEASE'
	HOLD = 'HOLD'
	HOLDRELEASE = 'HOLDRELEASE'


class Button:
	HOLD_DURATION = 5.0

	A = 0
	B = 1
	C = 2
	D = 3
	X = 4
	Y = 5
	Z = 6
	W = 7
	FIRE = 8
	FIRE2 = 9
	UP = 10
	DOWN = 11
	LEFT = 12
	RIGHT = 13
	POWER = 14
	MENU = 15
	PAUSE = 16
	BT = 17

	def __init__(self, system):
		self.system = system
		self.state = ButtonState.IDLE
		self.pressTimestamp = 0.0
		self.held = False

	def process(self, value):
		now = self.system.clock.timestamp
		if value and self.state == ButtonState.IDLE:
			self.state = ButtonState.PRESS
			self.pressTimestamp = now
			self.held = False
			return ButtonEvent.PRESS
		elif not value and (self.state == ButtonState.PRESS or self.state == ButtonState.HOLD):
			event = ButtonEvent.HOLDRELEASE if self.state == ButtonState.HOLD else ButtonEvent.RELEASE
			self.state = ButtonState.IDLE
			return event
		elif self.state == ButtonState.PRESS and not self.held:
			if (now - self.pressTimestamp) >= Button.HOLD_DURATION:
				self.state = ButtonState.HOLD
				self.held = True
				return ButtonEvent.HOLD
		return None
