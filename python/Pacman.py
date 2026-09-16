import random

from system import Game
from system import Colors
from system import Sound
from system import Command

class Actor:
	def __init__(self):
		self.position = 0
		self.reverse = False
		self.speed = 0.0
		self.position_accumulator = 0.0

	def update(self, dt):
		if self.speed == 0 or dt <= 0:
			return
		self.position_accumulator += self.speed * dt
		whole = int(self.position_accumulator)
		if whole > 0:
			self.position_accumulator -= whole
			if self.reverse:
				self.position -= whole
			else:
				self.position += whole

class Player(Actor):
	def __init__(self):
		super().__init__()
		self.is_powered_up = False
		self.power_up_end_time = 0.0

class Ghost(Actor):
	pass

class Pellet:
	def __init__(self, magic=False):
		self.is_magic = magic

class Pacman(Game):
	LEVELS = 10
	GAP = 3
	START_MAGIC = 2
	END_MAGIC = 6
	POWER_UP_DURATION = 5.0

	def __init__(self, system):
		super().__init__("Pacman", system)
		self.total_pellets = self.resolution // (self.GAP + 1)
		self.player = Player()
		self.ghosts = []
		self.maze = [None] * self.resolution
		self.move_up_pressed = False
		self.move_down_pressed = False
		self.play_level()

	def build_stage(self):
		self.player = Player()
		self.ghosts = []
		self.maze = [None] * self.resolution

		magic = self.START_MAGIC + int(round(
			(self.END_MAGIC - self.START_MAGIC) * (self.level / (self.LEVELS - 1))
		))

		all_positions = list(range(0, self.resolution, self.GAP + 1))
		random.shuffle(all_positions)

		for i in range(self.total_pellets):
			pos = all_positions[i]
			self.maze[pos] = Pellet(magic=(i < magic))

	def loop(self):
		super().loop()

		if self.delay_time > 0.0:
			self._render()
			return

		if hasattr(self, '_pending_level'):
			del self._pending_level
			self.next_level()
			self.play_level()
			return

		dt = self.system.clock.delta
		self.player.update(dt)

		pos = self.player.position
		if 0 <= pos < self.resolution:
			pellet = self.maze[pos]
			if pellet is not None:
				self.maze[pos] = None
				if pellet.is_magic:
					self.player.is_powered_up = True
					self.player.power_up_end_time = self.time + self.POWER_UP_DURATION

		if self.player.is_powered_up and self.time >= self.player.power_up_end_time:
			self.player.is_powered_up = False

		if not any(p is not None for p in self.maze):
			if self.level < self.LEVELS - 1:
				self._pending_level = True
				self.delay(1.0)
			self._render()
			return

		self._render()

	def _render(self):
		for i in range(self.resolution):
			pellet = self.maze[i]
			if pellet is not None:
				self.pixels[i] = Colors.GREEN if pellet.is_magic else Colors.DARK_GREEN
			else:
				self.pixels[i] = Colors.OFF
		pos = self.player.position
		if 0 <= pos < self.resolution:
			self.pixels[pos] = Colors.MAGENTA if self.player.is_powered_up else Colors.YELLOW

	def _update_movement(self):
		if self.move_up_pressed and not self.move_down_pressed:
			self.player.reverse = False
			self.player.speed = 20
		elif self.move_down_pressed and not self.move_up_pressed:
			self.player.reverse = True
			self.player.speed = 20
		else:
			self.player.speed = 0

	def handle_input(self, pad_id, event):
		if event.command in (Command.A, Command.UP):
			self.move_up_pressed = True
			self.move_down_pressed = False
			self._update_movement()
		elif event.command in (Command.A_RELEASE, Command.UP_RELEASE):
			self.move_up_pressed = False
			self._update_movement()
		elif event.command in (Command.C, Command.DOWN):
			self.move_down_pressed = True
			self.move_up_pressed = False
			self._update_movement()
		elif event.command in (Command.C_RELEASE, Command.DOWN_RELEASE):
			self.move_down_pressed = False
			self._update_movement()
