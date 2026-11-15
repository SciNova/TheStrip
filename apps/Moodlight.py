import math

from system import Game
from system import Command
from system import InputEvent

class Moodlight(Game):
	def __init__(self, system):
		super().__init__("Moodlight", system)
		self.active_theme = 0
		self.speed = 0.5
		self.phase = [0.0, 0.0, 0.0]

	def _rainbow_render(self, dt):
		self.phase[0] += dt * self.speed
		p = self.phase[0]
		two_pi = 2.0 * math.pi
		third = two_pi / 3.0
		for i in range(self.resolution):
			pos = (i / self.resolution + p) * two_pi
			r = int(max(0, min(255, math.sin(pos) * 127.5 + 127.5)))
			g = int(max(0, min(255, math.sin(pos + third) * 127.5 + 127.5)))
			b = int(max(0, min(255, math.sin(pos + 2.0 * third) * 127.5 + 127.5)))
			self.pixels[i] = (r << 16) | (g << 8) | b

	def _ocean_render(self, dt):
		self.phase[1] += dt * self.speed
		p = self.phase[1]
		two_pi = 2.0 * math.pi
		third = two_pi / 3.0
		for i in range(self.resolution):
			pos = (i / self.resolution + p) * two_pi
			r = int(max(0, min(255, math.sin(pos) * 10.0 + 10.0)))
			g = int(max(0, min(255, math.sin(pos + third) * 50.0 + 50.0)))
			b = int(max(0, min(255, math.sin(pos + 2.0 * third) * 100.0 + 100.0)))
			self.pixels[i] = (r << 16) | (g << 8) | b

	def _fire_render(self, dt):
		self.phase[2] += dt * self.speed
		p = self.phase[2]
		two_pi = 2.0 * math.pi
		third = two_pi / 3.0
		for i in range(self.resolution):
			pos = (i / self.resolution + p) * two_pi
			r = int(max(0, min(255, math.sin(pos) * 100.0 + 155.0)))
			g = int(max(0, min(255, math.sin(pos + third) * 30.0 + 30.0)))
			b = int(max(0, min(255, math.sin(pos + 2.0 * third) * 10.0 + 5.0)))
			self.pixels[i] = (r << 16) | (g << 8) | b

	def loop(self):
		super().loop()
		dt = self.system.clock.delta
		if self.active_theme == 0:
			self._rainbow_render(dt)
		elif self.active_theme == 1:
			self._ocean_render(dt)
		else:
			self._fire_render(dt)

	def handle_input(self, pad_id, event):
		if event.command == Command.A:
			self.speed = min(self.speed + 0.1, 2.0)
		elif event.command == Command.B:
			self.active_theme = (self.active_theme + 1) % 3
		elif event.command == Command.C:
			self.speed = max(self.speed - 0.1, -2.0)
