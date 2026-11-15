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

# The CSS/X11 extended color keyword list (one spelling per gray/grey pair,
# American spelling kept). Values are the official CSS hex values.
# This must stay in sync with js/color.js — that file is the source of truth.
class Colors:
	ALICE_BLUE = 0xF0F8FF
	ANTIQUE_WHITE = 0xFAEBD7
	AQUA = 0x00FFFF
	AQUAMARINE = 0x7FFFD4
	AZURE = 0xF0FFFF
	BEIGE = 0xF5F5DC
	BISQUE = 0xFFE4C4
	BLACK = 0x000000
	BLANCHED_ALMOND = 0xFFEBCD
	BLUE = 0x0000FF
	BLUE_VIOLET = 0x8A2BE2
	BROWN = 0xA52A2A
	BURLYWOOD = 0xDEB887
	CADET_BLUE = 0x5F9EA0
	CHARTREUSE = 0x7FFF00
	CHOCOLATE = 0xD2691E
	CORAL = 0xFF7F50
	CORNFLOWER_BLUE = 0x6495ED
	CORNSILK = 0xFFF8DC
	CRIMSON = 0xDC143C
	CYAN = 0x00FFFF
	DARK_BLUE = 0x00008B
	DARK_CYAN = 0x008B8B
	DARK_GOLDENROD = 0xB8860B
	DARK_GRAY = 0xA9A9A9
	DARK_GREEN = 0x006400
	DARK_KHAKI = 0xBDB76B
	DARK_MAGENTA = 0x8B008B
	DARK_OLIVE_GREEN = 0x556B2F
	DARK_ORANGE = 0xFF8C00
	DARK_ORCHID = 0x9932CC
	DARK_RED = 0x8B0000
	DARK_SALMON = 0xE9967A
	DARK_SEA_GREEN = 0x8FBC8F
	DARK_SLATE_BLUE = 0x483D8B
	DARK_SLATE_GRAY = 0x2F4F4F
	DARK_TURQUOISE = 0x00CED1
	DARK_VIOLET = 0x9400D3
	DEEP_PINK = 0xFF1493
	DEEP_SKY_BLUE = 0x00BFFF
	DIM_GRAY = 0x696969
	DODGER_BLUE = 0x1E90FF
	FIREBRICK = 0xB22222
	FLORAL_WHITE = 0xFFFAF0
	FOREST_GREEN = 0x228B22
	FUCHSIA = 0xFF00FF
	GAINSBORO = 0xDCDCDC
	GHOST_WHITE = 0xF8F8FF
	GOLD = 0xFFD700
	GOLDENROD = 0xDAA520
	GRAY = 0x808080
	GREEN = 0x008000
	GREEN_YELLOW = 0xADFF2F
	HONEYDEW = 0xF0FFF0
	HOT_PINK = 0xFF69B4
	INDIAN_RED = 0xCD5C5C
	INDIGO = 0x4B0082
	IVORY = 0xFFFFF0
	KHAKI = 0xF0E68C
	LAVENDER = 0xE6E6FA
	LAVENDER_BLUSH = 0xFFF0F5
	LAWN_GREEN = 0x7CFC00
	LEMON_CHIFFON = 0xFFFACD
	LIGHT_BLUE = 0xADD8E6
	LIGHT_CORAL = 0xF08080
	LIGHT_CYAN = 0xE0FFFF
	LIGHT_GOLDENROD_YELLOW = 0xFAFAD2
	LIGHT_GRAY = 0xD3D3D3
	LIGHT_GREEN = 0x90EE90
	LIGHT_PINK = 0xFFB6C1
	LIGHT_SALMON = 0xFFA07A
	LIGHT_SEA_GREEN = 0x20B2AA
	LIGHT_SKY_BLUE = 0x87CEFA
	LIGHT_SLATE_GRAY = 0x778899
	LIGHT_STEEL_BLUE = 0xB0C4DE
	LIGHT_YELLOW = 0xFFFFE0
	LIME = 0x00FF00
	LIME_GREEN = 0x32CD32
	LINEN = 0xFAF0E6
	MAGENTA = 0xFF00FF
	MAROON = 0x800000
	MEDIUM_AQUAMARINE = 0x66CDAA
	MEDIUM_BLUE = 0x0000CD
	MEDIUM_ORCHID = 0xBA55D3
	MEDIUM_PURPLE = 0x9370DB
	MEDIUM_SEA_GREEN = 0x3CB371
	MEDIUM_SLATE_BLUE = 0x7B68EE
	MEDIUM_SPRING_GREEN = 0x00FA9A
	MEDIUM_TURQUOISE = 0x48D1CC
	MEDIUM_VIOLET_RED = 0xC71585
	MIDNIGHT_BLUE = 0x191970
	MINT_CREAM = 0xF5FFFA
	MISTY_ROSE = 0xFFE4E1
	MOCCASIN = 0xFFE4B5
	NAVAJO_WHITE = 0xFFDEAD
	NAVY = 0x000080
	OLD_LACE = 0xFDF5E6
	OLIVE = 0x808000
	OLIVE_DRAB = 0x6B8E23
	ORANGE = 0xFFA500
	ORANGE_RED = 0xFF4500
	ORCHID = 0xDA70D6
	PALE_GOLDENROD = 0xEEE8AA
	PALE_GREEN = 0x98FB98
	PALE_TURQUOISE = 0xAFEEEE
	PALE_VIOLET_RED = 0xDB7093
	PAPAYA_WHIP = 0xFFEFD5
	PEACH_PUFF = 0xFFDAB9
	PERU = 0xCD853F
	PINK = 0xFFC0CB
	PLUM = 0xDDA0DD
	POWDER_BLUE = 0xB0E0E6
	PURPLE = 0x800080
	REBECCA_PURPLE = 0x663399
	RED = 0xFF0000
	ROSY_BROWN = 0xBC8F8F
	ROYAL_BLUE = 0x4169E1
	SADDLE_BROWN = 0x8B4513
	SALMON = 0xFA8072
	SANDY_BROWN = 0xF4A460
	SEA_GREEN = 0x2E8B57
	SEASHELL = 0xFFF5EE
	SIENNA = 0xA0522D
	SILVER = 0xC0C0C0
	SKY_BLUE = 0x87CEEB
	SLATE_BLUE = 0x6A5ACD
	SLATE_GRAY = 0x708090
	SNOW = 0xFFFAFA
	SPRING_GREEN = 0x00FF7F
	STEEL_BLUE = 0x4682B4
	TAN = 0xD2B48C
	TEAL = 0x008080
	THISTLE = 0xD8BFD8
	TOMATO = 0xFF6347
	TURQUOISE = 0x40E0D0
	VIOLET = 0xEE82EE
	WHEAT = 0xF5DEB3
	WHITE = 0xFFFFFF
	WHITE_SMOKE = 0xF5F5F5
	YELLOW = 0xFFFF00
	YELLOW_GREEN = 0x9ACD32

	# Aliases: not CSS names, but meaningful labels for an actual CSS color above.
	OFF = 0x000000
	BANANA = 0xFFD700
	LEMON = 0xFFFF00
	WATERMELON = 0x008000
	BLACKBERRY = 0x4B0082
	STRAWBERRY = 0xDC143C

	# Bogus, invented entries with no CSS equivalent. Kept only so the games
	# still using them don't break outright; remove once those games are
	# updated to reference a real color name above.
	DARK_YELLOW = 0x999900
	DARK_WHITE = 0x7F7F7F
	DARK_PURPLE = 0x44007F
	DARK_PINK = 0x7F334C


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
