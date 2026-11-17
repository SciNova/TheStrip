import random

from system import Game
from system import Command
from system import Colors
from system import Sound
from system import GameState

TOTAL_LEVELS = 10
BEEP_DURATION = 0.5
ENTRY_DURATION = 0.8
INPUT_TIMEOUT = 10.0

class SimonStage:
	PLAYBACK = 0
	INPUT = 1
	RESULT = 2
	LEVEL_FAIL = 3
	LEVEL_COMPLETE = 4
	COMPLETE = 5

class SimonSays(Game):
	def __init__(self, system):
		super().__init__("SimonSays", system)
		self.sequence = [0] * TOTAL_LEVELS
		self.stage = SimonStage.PLAYBACK
		self.step = 1
		self.input_start_time = 0.0
		self.input_color = 0
		self._start_level()

	def build_stage(self):
		if self.time > 0:
			return
		for i in range(TOTAL_LEVELS):
			r = random.randint(0, 3)
			if r == 0:
				self.sequence[i] = Colors.RED
			elif r == 1:
				self.sequence[i] = Colors.GREEN
			elif r == 2:
				self.sequence[i] = Colors.BLUE
			else:
				self.sequence[i] = Colors.YELLOW

	def _display(self, color):
		section = self.resolution // 4
		for i in range(section):
			self.pixels[i] = Colors.DARK_RED
			self.pixels[i + section] = Colors.DARK_GREEN
			self.pixels[i + 2*section] = Colors.DARK_BLUE
			self.pixels[i + 3*section] = Colors.DARK_YELLOW

		if color == 0:
			return

		if color == Colors.RED:
			start = 0
		elif color == Colors.GREEN:
			start = section
		elif color == Colors.BLUE:
			start = 2 * section
		elif color == Colors.YELLOW:
			start = 3 * section
		else:
			return

		for i in range(start, start + section):
			self.pixels[i] = color

	def _start_level(self):
		self.stage = SimonStage.PLAYBACK
		self.step = 1
		self.input_start_time = 0.0
		self.play_level()
		self._display(self.sequence[0])

		col = self.sequence[0]
		if col == Colors.RED:
			self.audio.play(Sound.SIMONSAYS2)
		elif col == Colors.GREEN:
			self.audio.play(Sound.SIMONSAYS1)
		elif col == Colors.BLUE:
			self.audio.play(Sound.SIMONSAYS4)
		elif col == Colors.YELLOW:
			self.audio.play(Sound.SIMONSAYS3)

	def loop(self):
		super().loop()
		if self.delay_time > 0.0:
			return

		if self.stage == SimonStage.PLAYBACK:
			lvl = self.level
			total = (lvl + 1) * ENTRY_DURATION
			if self.level_time >= total:
				self._display(0)
				self.stage = SimonStage.INPUT
				self.step = 1
				self.input_start_time = self.level_time
				return

			cur_step = int(self.level_time / ENTRY_DURATION) + 1
			in_step = self.level_time % ENTRY_DURATION
			if in_step < BEEP_DURATION:
				if cur_step != self.step:
					self.step = cur_step
					col = self.sequence[cur_step - 1]
					self._display(col)
					if col == Colors.RED:
						self.audio.play(Sound.SIMONSAYS2)
					elif col == Colors.GREEN:
						self.audio.play(Sound.SIMONSAYS1)
					elif col == Colors.BLUE:
						self.audio.play(Sound.SIMONSAYS4)
					elif col == Colors.YELLOW:
						self.audio.play(Sound.SIMONSAYS3)
			else:
				self._display(0)

		elif self.stage == SimonStage.INPUT:
			if self.level_time - self.input_start_time > INPUT_TIMEOUT:
				self.audio.play(Sound.LEVEL_FAIL)
				self.delay(4.0)
				self.stage = SimonStage.LEVEL_FAIL

		elif self.stage == SimonStage.RESULT:
			expected = self.sequence[self.step - 1]
			if self.input_color == expected:
				if self.step == self.level + 1:
					self.audio.play(Sound.LEVEL_COMPLETE)
					self.delay(4.0)
					self.stage = SimonStage.LEVEL_COMPLETE
				else:
					self.step += 1
					self.stage = SimonStage.INPUT
					self.input_start_time = self.level_time
					self._display(0)
			else:
				self.audio.play(Sound.LEVEL_FAIL)
				self.delay(4.0)
				self.stage = SimonStage.LEVEL_FAIL

		elif self.stage == SimonStage.LEVEL_FAIL:
			self._start_level()

		elif self.stage == SimonStage.LEVEL_COMPLETE:
			self.next_level()
			if self.level >= TOTAL_LEVELS:
				self.stage = SimonStage.COMPLETE
				self.clear()
				self.audio.play(Sound.GAME_COMPLETE)
			else:
				self._start_level()

	def handle_input(self, pad_id, event):
		if self.stage != SimonStage.INPUT:
			return
		if self.delay_time > 0.0:
			return
		if event.command == Command.A:
			color = Colors.RED
		elif event.command == Command.B:
			color = Colors.GREEN
		elif event.command == Command.C:
			color = Colors.BLUE
		elif event.command == Command.D:
			color = Colors.YELLOW
		else:
			return
		self.input_color = color
		self._display(color)
		if color == Colors.RED:
			self.audio.play(Sound.SIMONSAYS2)
		elif color == Colors.GREEN:
			self.audio.play(Sound.SIMONSAYS1)
		elif color == Colors.BLUE:
			self.audio.play(Sound.SIMONSAYS4)
		elif color == Colors.YELLOW:
			self.audio.play(Sound.SIMONSAYS3)
		self.delay(ENTRY_DURATION)
		self.stage = SimonStage.RESULT
