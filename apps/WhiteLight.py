from system import Game
from system import Command
from system import InputEvent

FADE_DURATION = 1.0

class WhiteLight(Game):
	def __init__(self, system):
		super().__init__("WhiteLight", system)
		self.level = 0.5
		self.fading = False
		self.fade_start_time   = 0.0
		self.fade_start_level  = 0.0
		self.fade_target_level = 0.0

	def _level_left(self):
		self.fading = False
		self.level -= 1.0 / 100.0
		if self.level < 0.0:
			self.level = 0.0

	def _level_right(self):
		self.fading = False
		self.level += 1.0 / 100.0
		if self.level > 1.0:
			self.level = 1.0

	def _level_pressed(self):
		now = self.system.clock.time
		if self.fading:
			self.fade_start_level = self.level
			self.fade_target_level = 0.0 if self.fade_target_level == 1.0 else 1.0
			self.fade_start_time = now
		else:
			self.fading = True
			self.fade_start_time = now
			self.fade_start_level = self.level
			self.fade_target_level = 1.0 if self.level < 1.0 else 0.0

	def _update_fade(self):
		if not self.fading:
			return
		now = self.system.clock.time
		elapsed = now - self.fade_start_time
		if elapsed >= FADE_DURATION:
			self.level = self.fade_target_level
			self.fading = False
		else:
			t = elapsed / FADE_DURATION
			self.level = self.fade_start_level + (self.fade_target_level - self.fade_start_level) * t

	def loop(self):
		super().loop()
		self._update_fade()
		brightness = int(self.level * 255)
		color = (brightness << 16) | (brightness << 8) | brightness
		for i in range(self.resolution):
			self.pixels[i] = color

	def handle_input(self, pad_id, event):
		if event.command in (Command.FIRE, Command.FIRE2, Command.B):
			self._level_pressed()
		elif event.command in (Command.A, Command.DOWN, Command.LEFT):
			self._level_left()
		elif event.command in (Command.C, Command.UP, Command.RIGHT):
			self._level_right()
		elif event.command == Command.ENCODER_LEFT:
			self._level_left()
		elif event.command == Command.ENCODER_RIGHT:
			self._level_right()
