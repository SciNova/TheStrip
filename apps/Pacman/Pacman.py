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

class Pellet:
	def __init__(self, magic=False):
		self.is_magic = magic

class Ghost(Actor):
	BASE_SPEED = 14

	def __init__(self, game, spawn_position):
		super().__init__()
		self.game = game
		self.position = spawn_position
		self.speed = self.__class__.BASE_SPEED
		self.frightened_target = None
		self.was_frightened = False

	def is_frightened(self):
		return self.game.player.is_powered_up

	def update_frightened_target(self):
		frightened = self.is_frightened()
		if frightened and not self.was_frightened:
			player = self.game.player
			self.frightened_target = self.game.resolution - 1 if self.position <= player.position else 0
		self.was_frightened = frightened

	def move_toward(self, target, dt):
		if target > self.position:
			self.reverse = False
		elif target < self.position:
			self.reverse = True
		super().update(dt)
		if self.position < 0:
			self.position = 0
		elif self.position > self.game.resolution - 1:
			self.position = self.game.resolution - 1

class Blinky(Ghost):
	COLOR = Colors.RED
	ELROY_START_THRESHOLD = 8
	ELROY_END_THRESHOLD = 3
	ELROY_MULTIPLIER = 1.5

	def __init__(self, game, spawn_position):
		super().__init__(game, spawn_position)
		self.elroy_active = False

	def update(self, dt):
		self.update_frightened_target()
		player = self.game.player

		if not self.elroy_active:
			pellets_remaining = len([p for p in self.game.maze if p is not None])
			levels = self.game.LEVELS
			threshold = int(round(
				Blinky.ELROY_START_THRESHOLD +
				(Blinky.ELROY_END_THRESHOLD - Blinky.ELROY_START_THRESHOLD) * (self.game.level / (levels - 1))
			))
			if pellets_remaining <= threshold:
				self.elroy_active = True
				self.speed = Ghost.BASE_SPEED * Blinky.ELROY_MULTIPLIER

		target = self.frightened_target if self.is_frightened() else player.position
		self.move_toward(target, dt)

class Pinky(Ghost):
	COLOR = Colors.PINK

	def update(self, dt):
		self.update_frightened_target()
		if self.is_frightened():
			self.move_toward(self.frightened_target, dt)
			return
		player = self.game.player
		pellet_spacing = self.game.GAP + 1
		lookahead = 4 * pellet_spacing
		target = player.position + (-1 if player.reverse else 1) * lookahead
		self.move_toward(target, dt)

class Inky(Ghost):
	COLOR = Colors.CYAN

	def update(self, dt):
		self.update_frightened_target()
		if self.is_frightened():
			self.move_toward(self.frightened_target, dt)
			return
		player = self.game.player
		pellet_spacing = self.game.GAP + 1
		blinky = next((g for g in self.game.ghosts if isinstance(g, Blinky)), None)
		point_ahead = player.position + (-1 if player.reverse else 1) * 2 * pellet_spacing
		target = (2 * point_ahead - blinky.position) if blinky else point_ahead
		self.move_toward(target, dt)

class Clyde(Ghost):
	COLOR = Colors.ORANGE
	HOME = 0

	def update(self, dt):
		self.update_frightened_target()
		if self.is_frightened():
			self.move_toward(self.frightened_target, dt)
			return
		player = self.game.player
		pellet_spacing = self.game.GAP + 1
		panic_distance = 8 * pellet_spacing
		distance = abs(self.position - player.position)
		target = player.position if distance > panic_distance else Clyde.HOME
		self.move_toward(target, dt)

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
		self.lives = 3
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

		center = self.resolution // 2
		self.ghosts = [
			Blinky(self, center - 2),
			Pinky(self, center),
			Inky(self, center + 2),
			Clyde(self, center + 4),
		]

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

		if hasattr(self, '_pending_game_over'):
			del self._pending_game_over
			self.lives = 3
			self.set_level(0)
			self.play_level()
			return

		if hasattr(self, '_pending_restart_level'):
			del self._pending_restart_level
			self.play_level()
			return

		dt = self.system.clock.delta
		self.player.update(dt)
		self.player.position = ((self.player.position % self.resolution) + self.resolution) % self.resolution

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

		for ghost in self.ghosts:
			ghost.update(dt)

		for i in range(len(self.ghosts) - 1, -1, -1):
			if self.ghosts[i].position != self.player.position:
				continue
			if self.player.is_powered_up:
				del self.ghosts[i]
				continue
			self.lives -= 1
			if self.lives <= 0:
				self._pending_game_over = True
			else:
				self._pending_restart_level = True
			self.delay(1.0)
			self._render()
			return

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

		for ghost in self.ghosts:
			if 0 <= ghost.position < self.resolution:
				self.pixels[ghost.position] = Colors.BLUE if self.player.is_powered_up else ghost.__class__.COLOR

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
