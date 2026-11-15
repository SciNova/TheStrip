from system import Game
from system import Command
from system import hsv_to_rgb

FADE_DURATION = 1.0

class ColorLight(Game):
	def __init__(self, system):
		super().__init__("ColorLight", system)
		self.mode = 0
		self.level = 0.5
		self.temperature = 0.5
		self.hue = 0.0
		self.fading = False
		self.fade_start_time = 0.0
		self.fade_start_level = 0.0
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

	def _mode_pressed(self):
		self.mode = 1 if self.mode == 0 else 0

	def _mode_left(self):
		if self.mode == 0:
			self.temperature -= 1.0 / 50.0
			if self.temperature < 0.0:
				self.temperature = 0.0
		else:
			self.hue -= 1.0 / 360.0
			if self.hue < 0.0:
				self.hue += 1.0

	def _mode_right(self):
		if self.mode == 0:
			self.temperature += 1.0 / 50.0
			if self.temperature > 1.0:
				self.temperature = 1.0
		else:
			self.hue += 1.0 / 360.0
			if self.hue >= 1.0:
				self.hue -= 1.0

	def _update(self):
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
		self._update()
		if self.level <= 0.0:
			self.clear()
			return
		if self.mode == 0:
			cool_r, cool_g, cool_b = 0.8, 0.8, 1.0
			warm_r, warm_g, warm_b = 1.0, 0.6, 0.2
			t = self.temperature
			r = (cool_r + t * (warm_r - cool_r)) * self.level
			g = (cool_g + t * (warm_g - cool_g)) * self.level
			b = (cool_b + t * (warm_b - cool_b)) * self.level
			r8 = int(r * 255)
			g8 = int(g * 255)
			b8 = int(b * 255)
			color = (r8 << 16) | (g8 << 8) | b8
		else:
			color = hsv_to_rgb(self.hue, 1, self.level)
		for i in range(self.resolution):
			self.pixels[i] = color

	def handle_input(self, pad_id, event):
		if event.command in (Command.FIRE, Command.B):
			self._level_pressed()
		elif event.command == Command.FIRE2:
			self._mode_pressed()
		elif event.command in (Command.A, Command.DOWN):
			self._level_left()
		elif event.command in (Command.C, Command.UP):
			self._level_right()
		elif event.command == Command.LEFT:
			self._mode_left()
		elif event.command == Command.RIGHT:
			self._mode_right()
		elif event.command == Command.ENCODER_LEFT:
			self._level_left()
		elif event.command == Command.ENCODER_RIGHT:
			self._level_right()
		elif event.command == Command.ENCODER2_LEFT:
			self._mode_left()
		elif event.command == Command.ENCODER2_RIGHT:
			self._mode_right()
