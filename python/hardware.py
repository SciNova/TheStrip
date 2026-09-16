import sys
import tty
import termios
import select
import subprocess
import tkinter as tk
from collections import deque
from datetime import datetime

from system import Command
from system import InputEvent
from system import Button
from system import Encoder
from system import snapshot


class StripView:
	def __init__(self, strip):
		self.strip = strip

	def update(self):
		line = ""
		for color in self.strip.pixels:
			r = (color >> 16) & 0xFF
			g = (color >> 8)  & 0xFF
			b = color		 & 0xFF
			line += f"\033[48;2;{r};{g};{b}m \033[0m"
		print(f"\r{line}", end=" ")


class Keyboard:
	_CHAR_MAP = {
		'1': Command.A,
		'2': Command.B,
		'3': Command.C,
		'4': Command.D,
		'5': Command.FIRE,
		'6': Command.FIRE2,
		'7': Command.A,
		'8': Command.B,
		'9': Command.C,
		'0': Command.D,
		'p': Command.PAUSE_SHORT_PRESS,
		'm': Command.MENU_SHORT_PRESS,
		'x': Command.POWER_SHORT_PRESS,
		's': None,
	}
	_ESC_MAP = {
		'[A': Command.UP,
		'[B': Command.DOWN,
		'[C': Command.RIGHT,
		'[D': Command.LEFT,
	}

	def __init__(self, system):
		self.system = system
		self._fd = sys.stdin.fileno()
		self._old_settings = termios.tcgetattr(self._fd)
		tty.setraw(self._fd)

	def _getch(self):
		if select.select([sys.stdin], [], [], 0)[0]:
			return sys.stdin.read(1)
		return None

	def process(self):
		while True:
			ch = self._getch()
			if ch is None:
				break
			action = None
			port = 0

			if ch == '\x1b':
				seq = sys.stdin.read(1) + sys.stdin.read(1)
				action = self._ESC_MAP.get(seq)
			elif ch == 's':
				snapshot(self.system, datetime.now())
				return None
			elif ch in self._CHAR_MAP:
				action = self._CHAR_MAP[ch]
				if ch in '7890':
					port = 1

			if action is not None:
				event = InputEvent(action)
				self.system.handle_command(port, event)
				return event
		return None

	def restore(self):
		termios.tcsetattr(self._fd, termios.TCSADRAIN, self._old_settings)


class TkStripView:
	def __init__(self, strip):
		self.strip = strip
		self.root = tk.Tk()
		self.root.title("TheStrip")
		self.root.overrideredirect(True)
		screen_width = self.root.winfo_screenwidth()
		screen_height = self.root.winfo_screenheight()
		self.root.geometry(f"{screen_width}x{screen_height}+0+0")
		self.root.focus_force()

		self.canvas = tk.Canvas(self.root, width=screen_width, height=screen_height, bg="black", highlightthickness=0)
		self.canvas.pack()

		pixel_size = screen_width / strip.length
		y0 = (screen_height - pixel_size) / 2
		y1 = y0 + pixel_size
		self.rects = []
		for i in range(strip.length):
			x0 = i * pixel_size
			x1 = x0 + pixel_size
			rect = self.canvas.create_rectangle(x0, y0, x1, y1, fill="#000000", outline="")
			self.rects.append(rect)

	def update(self):
		for i, color in enumerate(self.strip.pixels):
			self.canvas.itemconfig(self.rects[i], fill=f"#{color:06x}")
		self.root.update()


class TkKeyboard:
	_KEYSYM_MAP = {
		'Up': Command.UP,
		'Down': Command.DOWN,
		'Left': Command.LEFT,
		'Right': Command.RIGHT,
	}
	_SYSTEM_COMMANDS = (Command.PAUSE_SHORT_PRESS, Command.MENU_SHORT_PRESS, Command.POWER_SHORT_PRESS)

	def __init__(self, system, root):
		self.system = system
		self.root = root
		self._queue = deque()
		subprocess.run(['xset', 'r', 'off'])
		root.bind('<KeyPress>', self._on_press)
		root.bind('<KeyRelease>', self._on_release)

	def _resolve(self, event):
		if event.keysym in self._KEYSYM_MAP:
			return self._KEYSYM_MAP[event.keysym], 0
		command = Keyboard._CHAR_MAP.get(event.keysym)
		port = 1 if event.keysym in '7890' else 0
		return command, port

	def _on_press(self, event):
		if event.keysym == 's':
			snapshot(self.system, datetime.now())
			return
		command, port = self._resolve(event)
		if command is not None:
			self._queue.append((port, command))

	def _on_release(self, event):
		command, port = self._resolve(event)
		if command is None or command in self._SYSTEM_COMMANDS:
			return
		self._queue.append((port, Command(int(command) + 1)))

	def process(self):
		self.root.update()
		if not self._queue:
			return None
		port, command = self._queue.popleft()
		event = InputEvent(command)
		self.system.handle_command(port, event)
		return event

	def restore(self):
		subprocess.run(['xset', 'r', 'on'])


class WiredControlPad:
	def __init__(self, system, port):
		self.system = system
		self.port = port
		self.pause_button = Button()
		self.menu_button = Button()
		self.a_button = Button()
		self.b_button = Button()
		self.c_button = Button()
		self.d_button = Button()
		self.x_button = Button()
		self.y_button = Button()
		self.z_button = Button()
		self.w_button = Button()
		self.fire_button = Button()
		self.fire2_button = Button()
		self.left_button = Button()
		self.right_button = Button()
		self.up_button = Button()
		self.down_button = Button()
		self.encoder = Encoder()
		self.encoder2 = Encoder()

	def emit(self, command):
		event = InputEvent(command)
		self.system.handle_command(self.port, event)
   