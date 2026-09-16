import os
import time

from system import System
from system import Command
from system import InputEvent
from hardware import Keyboard
from hardware import StripView

from Moodlight import Moodlight
from WhiteLight import WhiteLight
from ColorLight import ColorLight
from SimonSays import SimonSays
from FlappyBird import FlappyBird
from Race import Race
from Slots import Slots
from Stack import Stack
from Pacman import Pacman
from Dices import Dices
from DicesClock import DicesClock
from Dino import Dino
from Cars import Cars
from DemoScene import DemoScene

system = System()

games = (Moodlight(system),
		WhiteLight(system),
		ColorLight(system),
		SimonSays(system),
		FlappyBird(system),
		Race(system),
		Slots(system),
		Stack(system),
		Pacman(system),
		Dices(system),
		DicesClock(system),
		Dino(system),
		Cars(system),
		DemoScene(system))

#game = Moodlight(system)
#game = WhiteLight(system)
#game = ColorLight(system)
#game = SimonSays(system)
#game = FlappyBird(system)
#game = Race(system)
#game = Slots(system)
#game = Stack(system) #### no Snake
#game = Pacman(system) #### no wrap, no release
#game = Dices(system)
#game = DicesClock(system)
#game = Dino(system)
#game = Cars(system) #### no release
#game = DemoScene(system)

if os.environ.get('DISPLAY'):
	from hardware import TkStripView
	from hardware import TkKeyboard
	view = TkStripView(system.strip)
	keyboard = TkKeyboard(system, view.root)
else:
	view = StripView(system.strip)
	keyboard = Keyboard(system)

selected = 0
system.game = games[selected]

try:
	while True:
		system.loop()
		event = keyboard.process()
		if event:
			if event.command == Command.POWER_SHORT_PRESS:
				break
			if event.command == Command.RIGHT:
				selected = (selected + 1) % len(games)
				system.game = games[selected]
				#print ('xxx')
		view.update()
		time.sleep(0.016)
finally:
	keyboard.restore()
