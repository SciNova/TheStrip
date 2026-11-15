import math
import random

from system import Game
from system import Colors
from system import Command
from graphics import Square2D
from graphics import EdgeMode
from graphics import Alignment
from graphics import Camera
from graphics import BasePlayer2D
from graphics import World2D


class Player(BasePlayer2D):
	def __init__(self, game):
		super().__init__(game)
		self.speed = 0.0


class Car(Square2D):
	SIZE = 1/3
	LIGHT_SIZE = 1/7
	LIGHT_INSET = 1/4
	BODY_COLORS = [Colors.GREEN, Colors.BLUE]

	def __init__(self, game):
		length = int(game.resolution * Car.SIZE)
		if length % 2 == 0:
			length -= 1
		body = random.choice(Car.BODY_COLORS)
		dark = Car._darken(body)
		faces = [
			Car._build_face(length, body, Colors.WHITE),  # front (headlights)
			Car._solid_face(length, dark),				 # side
			Car._build_face(length, body, Colors.RED),	 # rear (tail‑lights)
			Car._solid_face(length, dark),				 # other side
		]
		super().__init__(game, faces, invert=True)
		self.speed = 0.0

	def tick(self, dt):
		angle = self.rotation * 2 * math.pi
		self.x += self.speed * self.game.resolution * math.cos(angle) * dt
		self.z += self.speed * self.game.resolution * math.sin(angle) * dt
		self.update()

	@staticmethod
	def _build_face(length, body, light):
		face = Car._solid_face(length, body)
		left_center = int(length * Car.LIGHT_INSET)
		right_center = int(length * (1 - Car.LIGHT_INSET))
		diameter = math.ceil(length * Car.LIGHT_SIZE)
		half = (diameter - 1) // 2
		Car._fill_light(face, left_center - half, diameter, light)
		Car._fill_light(face, right_center - half, diameter, light)
		return face

	@staticmethod
	def _fill_light(face, start, count, color):
		end = start + count
		if start < 0:
			start = 0
		if end > len(face):
			end = len(face)
		for i in range(start, end):
			face[i] = color

	@staticmethod
	def _solid_face(length, color):
		return [color] * length

	@staticmethod
	def _darken(color):
		r = (color >> 16) & 0xFF
		g = (color >> 8) & 0xFF
		b = color & 0xFF
		return (int(r * 0.5) << 16) | (int(g * 0.5) << 8) | int(b * 0.5)


class Cars(Game):
	LEVELS = 10
	FIRST_LEVEL_START_SIZE = 1.0
	FIRST_LEVEL_END_SIZE = 1.0
	LAST_LEVEL_START_SIZE = 100.0
	LAST_LEVEL_END_SIZE = 10.0

	def __init__(self, system):
		super().__init__("Cars", system)
		self.camera = Camera()
		self.player = Player(self)
		self.player.speed = 0.25  # 1/4
		self.level = 2
		self.turn_left_pressed = False
		self.turn_right_pressed = False
		self.cars = []
		self.play_level()

	def build_stage(self):
		n = self.level
		self.initial_cars = int(2 ** n)
		self.level_start_size = (
			Cars.FIRST_LEVEL_START_SIZE +
			(Cars.LAST_LEVEL_START_SIZE - Cars.FIRST_LEVEL_START_SIZE) * n / (Cars.LEVELS - 1)
		)
		self.level_end_size = (
			Cars.FIRST_LEVEL_END_SIZE +
			(Cars.LAST_LEVEL_END_SIZE - Cars.FIRST_LEVEL_END_SIZE) * n / (Cars.LEVELS - 1)
		)
		self.world = World2D(self.level_start_size, self.level_start_size, True, True)

		self.cars = []
		w = self.world
		half_w = w.width * self.resolution / 2.0
		half_d = w.depth * self.resolution / 2.0
		for _ in range(self.initial_cars):
			car = Car(self)
			car.x = random.random() * 2 * half_d - half_d
			car.z = random.random() * 2 * half_w - half_w
			car.rotation = random.random()
			car.speed = 1/15 + random.random() * (1/12 - 1/15)
			self.cars.append(car)

		self.player.x = 0.0
		self.player.z = 0.0
		self.player.rotation = 0.0
		self.turn_left_pressed = False
		self.turn_right_pressed = False

	def loop(self):
		super().loop()
		self.clear()
		for i in range(self.resolution):
			self.pixels[i] = Colors.LIGHT_GRAY
		dt = self.system.clock.delta

		if self.turn_left_pressed:
			self.player.rotation = (self.player.rotation - 0.5 * dt + 1.0) % 1.0
		if self.turn_right_pressed:
			self.player.rotation = (self.player.rotation + 0.5 * dt) % 1.0

		p_angle = self.player.rotation * 2 * math.pi
		self.player.x += self.player.speed * self.resolution * math.cos(p_angle) * dt
		self.player.z += self.player.speed * self.resolution * math.sin(p_angle) * dt

		w = self.world
		world_w = w.width * self.resolution
		world_d = w.depth * self.resolution
		half_w = world_w / 2.0
		half_d = world_d / 2.0
		self.player.x = ((self.player.x + half_d) % world_d + world_d) % world_d - half_d
		self.player.z = ((self.player.z + half_w) % world_w + world_w) % world_w - half_w

		cam_dist = 20.0
		cam_angle = self.player.rotation * 2 * math.pi
		self.camera.x = self.player.x - cam_dist * math.cos(cam_angle)
		self.camera.z = self.player.z - cam_dist * math.sin(cam_angle)
		self.camera.rotation = self.player.rotation

		for car in self.cars:
			car.tick(dt)
			car.x = ((car.x + half_d) % world_d + world_d) % world_d - half_d
			car.z = ((car.z + half_w) % world_w + world_w) % world_w - half_w

			dx = car.x - self.camera.x
			dz = car.z - self.camera.z
			dx = ((dx + half_d) % world_d + world_d) % world_d - half_d
			dz = ((dz + half_w) % world_w + world_w) % world_w - half_w

			cos_t = math.cos(self.camera.rotation * 2 * math.pi)
			sin_t = math.sin(self.camera.rotation * 2 * math.pi)
			forward = dx * cos_t + dz * sin_t
			lateral = -dx * sin_t + dz * cos_t

			if forward > 0:
				focal_length = self.resolution / 2.0
				strip_pos = self.resolution / 2 + (lateral / forward) * focal_length
				scale = focal_length / forward
				if scale > 2.0:
					scale = 2.0
				car.render(strip_pos, EdgeMode.CLIP, scale)

	def handle_input(self, pad_id, event):
		if event.command == Command.A:
			self.turn_left_pressed = True
		elif event.command == Command.A_RELEASE:
			self.turn_left_pressed = False
		elif event.command == Command.C:
			self.turn_right_pressed = True
		elif event.command == Command.C_RELEASE:
			self.turn_right_pressed = False
