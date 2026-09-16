import time
import math
import datetime
from enum import Enum
from enum import IntEnum

STRIP_MAX_LEDS = 60
DEBOUNCE_DURATION = 0.0
HOLD_DURATION = 1.0
GAME_MIN_RESOLUTION = 120

_ACTION_BUTTON = 0x80
_ACTION_PRESS = 0x40
_ACTION_HOLD = 0x20
_ACTION_BLOCK = 0x18
_ACTION_ID = 0x1F



class Command(IntEnum):
	NONE = 0

	# Game buttons
	A_PRESS   = 0x01
	A_RELEASE = 0x02
	A = A_PRESS

	B_PRESS = 0x03
	B_RELEASE = 0x04
	B = B_PRESS

	C_PRESS = 0x05
	C_RELEASE = 0x06
	C = C_PRESS

	D_PRESS = 0x07
	D_RELEASE = 0x08
	D = D_PRESS

	X_PRESS = 0x09
	X_RELEASE = 0x0A
	X = X_PRESS

	Y_PRESS = 0x0B
	Y_RELEASE = 0x0C
	Y = Y_PRESS

	Z_PRESS = 0x0D
	Z_RELEASE = 0x0E
	Z = Z_PRESS

	W_PRESS = 0x0F
	W_RELEASE = 0x10
	W = W_PRESS

	FIRE_PRESS = 0x11
	FIRE_RELEASE = 0x12
	FIRE = FIRE_PRESS

	FIRE2_PRESS = 0x13
	FIRE2_RELEASE = 0x14
	FIRE2 = FIRE2_PRESS

	UP_PRESS = 0x15
	UP_RELEASE = 0x16
	UP = UP_PRESS

	DOWN_PRESS = 0x17
	DOWN_RELEASE = 0x18
	DOWN = DOWN_PRESS

	LEFT_PRESS = 0x19
	LEFT_RELEASE = 0x1A
	LEFT = LEFT_PRESS

	RIGHT_PRESS = 0x1B
	RIGHT_RELEASE = 0x1C
	RIGHT = RIGHT_PRESS

	ENCODER_LEFT	= 0x1D
	ENCODER_RIGHT = 0x1E
	ENCODER2_LEFT = 0x1F
	ENCODER2_RIGHT = 0x20

	POWER_SHORT_PRESS = 0xFE
	POWER_LONG_PRESS = 0xFF

	MENU_SHORT_PRESS = 0xFC
	MENU_LONG_PRESS = 0xFD

	PAUSE_SHORT_PRESS = 0xFA
	PAUSE_LONG_PRESS = 0xFB

	BT_SHORT_PRESS = 0xF8
	BT_LONG_PRESS = 0xF9


def is_game_button_press(command):
	return Command.A_PRESS <= command <= Command.RIGHT_PRESS and (int(command) & 1) == 1


class SystemState(Enum):
	STANDBY = 0
	MENU = 1
	GAME = 2
	POWERSAVE = 3

class GameState(Enum):
	PLAY = 0
	PAUSED = 1
	COMPLETED = 2

class Alignment(Enum):
	CENTER = 0
	FORWARD = 1
	BACKWARD = 2

class EdgeMode(Enum):
	CLIP = 0
	MIRROR = 1
	WRAP = 2

class Sound(Enum):
	LEVEL_COMPLETE = 0
	LEVEL_FAIL = 1
	GAME_COMPLETE = 2
	SHOOT = 3
	HIT = 4
	MISS = 5
	GENERATE_ITEM = 6
	TICK = 7
	CHECKPOINT = 8
	SIMONSAYS1 = 9
	SIMONSAYS2 = 10
	SIMONSAYS3 = 11
	SIMONSAYS4 = 12
	SIMONSAYS1_ORIGINAL = 13
	SIMONSAYS2_ORIGINAL = 14
	SIMONSAYS3_ORIGINAL = 15
	SIMONSAYS4_ORIGINAL = 16

class Colors:
	OFF = 0x000000
	WHITE = 0xFFFFFF
	SILVER = 0x7F7F7F
	RED = 0xFF0000
	GREEN = 0x00FF00
	BLUE = 0x0000FF
	YELLOW = 0xFFFF00
	CYAN = 0x00FFFF
	MAGENTA = 0xFF00FF
	ORANGE = 0xFF8800
	PURPLE = 0x8800FF
	PINK = 0xFF6699
	DARK_RED = 0x7F0000
	DARK_GREEN = 0x007F00
	DARK_BLUE = 0x00007F
	DARK_YELLOW = 0x999900
	DARK_CYAN = 0x007F7F
	DARK_MAGENTA = 0x7F007F
	DARK_WHITE = 0x7F7F7F
	DARK_ORANGE = 0x7F4400
	DARK_PURPLE = 0x44007F
	DARK_PINK = 0x7F334C
	BANANA = 0xFFCC00
	LEMON = 0xCCFF00
	WATERMELON = 0x007F00
	BLACKBERRY = 0x44007F
	STRAWBERRY = 0xFF3366
	GRAY = 0x808080
	LIGHT_GRAY = 0xC0C0C0
	DARK_GRAY = 0x404040


class InputEvent:
	def __init__(self, command, value=0):
		self.command = command
		self.value = value

class Clock:
	def __init__(self):
		self.time = 0.0
		self.timestamp = 0.0
		self.delta = 0.0
		self.update()

	def update(self):
		now = time.time()
		self.delta = now - self.timestamp
		self.timestamp = now
		self.time = now

class DebouncedPin:
	def __init__(self):
		self.state = False
		self.timestamp = 0.0

	def process(self, value, now):
		if value != self.state:
			self.timestamp = now
		if (now - self.timestamp) >= DEBOUNCE_DURATION and value != self.state:
			self.state = value
		return self.state




class Button:
	class State(Enum):
		IDLE = 0
		PRESS = 1
		HOLD = 2

	class Event(Enum):
		PRESS = 0
		RELEASE = 1
		HOLD = 2
		HOLDRELEASE = 3

	def __init__(self):
		self.state = Button.State.IDLE
		self.press_timestamp = 0.0
		self.held = False

	def process(self, value, now):
		if value and self.state == Button.State.IDLE:
			self.state = Button.State.PRESS
			self.press_timestamp = now
			self.held = False
			return Button.Event.PRESS
		elif not value and self.state in (Button.State.PRESS, Button.State.HOLD):
			if self.state == Button.State.HOLD:
				event = Button.Event.HOLDRELEASE
			else:
				event = Button.Event.RELEASE
			self.state = Button.State.IDLE
			return event
		elif self.state == Button.State.PRESS and not self.held:
			if (now - self.press_timestamp) >= HOLD_DURATION:
				self.state = Button.State.HOLD
				self.held = True
				return Button.Event.HOLD
		return None


class Encoder:
	class State(Enum):
		IDLE = 0
		DEBOUNCING = 1

	class Event(Enum):
		LEFT = 0
		RIGHT = 1

	def __init__(self):
		self.state = Encoder.State.IDLE
		self.raw_quad_state = 0
		self.previous_quad_state = 0
		self.clk_timestamp = 0.0
		self.input_change_timestamp = 0.0

	def update(self, clk, direction, now):
		current_raw = (clk << 1) | direction
		if current_raw != self.raw_quad_state:
			self.raw_quad_state = current_raw
			self.input_change_timestamp = now

		debounced = self.previous_quad_state
		if (now - self.input_change_timestamp) >= DEBOUNCE_DURATION:
			debounced = self.raw_quad_state

		event = None
		if debounced != self.previous_quad_state:
			transition = (self.previous_quad_state << 2) | debounced
			if self.state == Encoder.State.IDLE:
				if transition in (0x01, 0x07, 0x0E, 0x08):
					event = Encoder.Event.RIGHT
				elif transition in (0x02, 0x0B, 0x0D, 0x04):
					event = Encoder.Event.LEFT
				if event is not None:
					self.clk_timestamp = now
					self.state = Encoder.State.DEBOUNCING

		self.previous_quad_state = debounced
		if self.state == Encoder.State.DEBOUNCING and (now - self.clk_timestamp) >= DEBOUNCE_DURATION:
			self.state = Encoder.State.IDLE

		return event



class Strip:
	def __init__(self, length):
		self.length = length
		self.pixels = [0] * length

	def clear(self):
		for i in range(self.length):
			self.pixels[i] = 0

	def test_pattern(self):
		half = self.length // 2
		for i in range(half):
			t = i / (half - 1) if half > 1 else 0.0
			v = int(255 * (1.0 - t))
			self.pixels[i] = (v << 16) | (v << 8) | v

		rem = self.length - half
		seg = rem // 3
		extra = rem % 3
		idx = half

		ramp_len = seg + (1 if extra > 0 else 0)
		for i in range(ramp_len):
			t = i / (ramp_len - 1) if ramp_len > 1 else 1.0
			r = int(255 * t)
			self.pixels[idx] = r << 16
			idx += 1

		ramp_len = seg + (1 if extra > 1 else 0)
		for i in range(ramp_len):
			t = i / (ramp_len - 1) if ramp_len > 1 else 1.0
			g = int(255 * t)
			self.pixels[idx] = g << 8
			idx += 1

		ramp_len = self.length - idx
		for i in range(ramp_len):
			t = i / (ramp_len - 1) if ramp_len > 1 else 1.0
			b = int(255 * t)
			self.pixels[idx] = b
			idx += 1

class Audio:
	def __init__(self):
		pass

	def play(self, sound):
		pass

class System:
	def __init__(self):
		self.clock = Clock()
		self.audio = Audio()
		self.strip = Strip(STRIP_MAX_LEDS)
		self.game = None
		self.uptime = 0.0
		self.state = SystemState.GAME

	def loop(self):
		self.clock.update()
		self.uptime += self.clock.delta
		if self.state == SystemState.GAME:
			if self.game and self.game.state == GameState.PLAY:
				self.game.loop()
		elif self.state == SystemState.MENU:
			self.strip.test_pattern()

	def toggle_pause(self):
		if self.game:
			self.game.toggle_pause()

	def toggle_menu(self):
		if self.state == SystemState.GAME:
			self.state = SystemState.MENU
		else:
			self.state = SystemState.GAME




	def handle_command(self, pad_id, event):
		match event.command:
			case Command.POWER_SHORT_PRESS:
				if self.state in (SystemState.STANDBY, SystemState.POWERSAVE):
					self.state = SystemState.MENU if self.game is None else SystemState.GAME
				elif self.state in (SystemState.MENU, SystemState.GAME):
					self.state = SystemState.STANDBY

			case Command.POWER_LONG_PRESS:
				if self.state in (SystemState.MENU, SystemState.GAME):
					self.state = SystemState.POWERSAVE

			case Command.MENU_SHORT_PRESS:
				if self.state == SystemState.GAME:
					self.state = SystemState.MENU
				elif self.state == SystemState.MENU:
					self.state = SystemState.GAME

			case Command.MENU_LONG_PRESS:
				if self.game is not None:
					self.game = None
					self.state = SystemState.MENU

			case Command.PAUSE_SHORT_PRESS:
				if self.state == SystemState.GAME and self.game:
					if self.game.state == GameState.PLAY:
						self.game.pause()
					elif self.game.state == GameState.PAUSED:
						self.game.play()

			case Command.PAUSE_LONG_PRESS:
				##self.buzzer_muted = not self.buzzer_muted
				pass

			case _:
				if self.game is not None and self.state == SystemState.GAME:
					self.game.handle_input(pad_id, event)





class Game:
	def __init__(self, name, system):
		self.system = system
		self.audio = system.audio
		self.pixels = system.strip.pixels
		self.resolution = system.strip.length
		self.name = name
		self.time = 0.0
		self.level_time = 0.0
		self.level = 0
		self.state = GameState.PLAY
		self.delay_time = 0.0

	def loop(self):
		dt = self.system.clock.delta
		self.time += dt
		self.level_time += dt
		if self.delay_time > 0.0:
			self.delay_time -= dt
			if self.delay_time < 0.0:
				self.delay_time = 0.0

	def pause(self):
		self.state = GameState.PAUSED

	def play(self):
		self.state = GameState.PLAY

	def toggle_pause(self):
		if self.state == GameState.PLAY:
			self.pause()
		else:
			self.play()

	def delay(self, seconds):
		self.delay_time = seconds

	def clear(self):
		for i in range(self.resolution):
			self.pixels[i] = 0

	def set_level(self, n):
		self.level = n

	def next_level(self):
		self.level += 1

	def play_level(self):
		if self.build_stage:
			self.build_stage()
		self.level_time = 0.0
		self.play()

def balance_colors(color):
	return color
	r = (color >> 16) & 0xFF
	g = (color >> 8) & 0xFF
	b = color & 0xFF
	r = int(r * 0.38)
	g = int(g * 0.28)
	return (r << 16) | (g << 8) | b

def correct_gamma(color):
	return color

def hsv_to_rgb(h, s, v):
	h = h * 6.0
	i = int(h)
	f = h - i
	p = v * (1.0 - s)
	q = v * (1.0 - f * s)
	t = v * (1.0 - (1.0 - f) * s)
	if i % 6 == 0:
		r, g, b = v, t, p
	elif i % 6 == 1:
		r, g, b = q, v, p
	elif i % 6 == 2:
		r, g, b = p, v, t
	elif i % 6 == 3:
		r, g, b = p, q, v
	elif i % 6 == 4:
		r, g, b = t, p, v
	else:
		r, g, b = v, p, q
	r8 = int(r * 255)
	g8 = int(g * 255)
	b8 = int(b * 255)
	return (r8 << 16) | (g8 << 8) | b8


def snapshot(system, dt):
	label = system.game.name.lower() if system.game else "system"
	centiseconds = dt.microsecond // 10000
	timestamp = dt.strftime("%Y%m%d%H%M%S") + f"{centiseconds:02d}"
	filename = f"{label}-{timestamp}.px"
	data = bytearray()
	for color in system.strip.pixels:
		data.append((color >> 16) & 0xFF) # R
		data.append((color >> 8) & 0xFF) # G
		data.append(color & 0xFF)		 # B
	with open(filename, "wb") as f:
		f.write(data)
